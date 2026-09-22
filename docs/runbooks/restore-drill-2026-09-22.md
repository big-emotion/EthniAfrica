# Restore drill — 2026-09-22

**Status: current.** For the general procedure this drill validated, see
[`restore-procedure.md`](./restore-procedure.md), Path C.

The first drill against the self-hosted stack, run since production and recette moved off the
hosted Supabase project (ETNI-1958). The 2025-07-14 drill validated a hosted-project restore that
no longer applies to either database; this one closes that gap for production.

**Operator:** project operator
**Drill type:** restore drill — the second on record, and the first against the self-hosted stack

---

## Summary

| Item              | Value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| Source            | `supabase-db` (the production container), `public` and `private` schemas |
| Recovery method   | `pg_dump -Fc` into `pg_restore`, into a disposable scratch container     |
| Scratch container | `restore-drill` (deleted after the drill)                                |
| Target image      | `supabase/postgres:17.6.1.136` — the same image `supabase-db` runs       |
| Validation        | direct row count against the restored corpus tables                      |
| Wall-clock time   | not precisely timed this run — see "Issues encountered"                  |
| RTO target / met  | ≤ 4 h / not measured to the minute, but comfortably within one session   |
| RPO target / met  | **not applicable this drill** — see below                                |

**This drill does not establish an RPO.** The dump was taken fresh, on demand, at drill time —
there is still no scheduled backup running against either database, which remains the larger,
separate gap this drill does not close. What it proves is narrower and still real: the restore
_mechanism_ works, and a fresh dump of the real corpus can be turned back into a working database.

---

## Steps executed

### 1. Dump

```bash
docker exec supabase-db pg_dump -U postgres -d postgres -n public -n private -Fc -f /tmp/drill.dump
docker cp supabase-db:/tmp/drill.dump ./drill.dump
```

`-n public -n private` is deliberate, not the default: `\dn` on the source shows one schema this
project owns beyond Supabase's own set (`private`, holding `is_admin()` and the other RLS helper
functions). A dump scoped to `public` alone silently drops every policy that calls them.

### 2. Scratch target, same image as the source

```bash
docker run -d --name restore-drill -e POSTGRES_PASSWORD=<local-only> \
  -p 127.0.0.1:55432:5432 supabase/postgres:17.6.1.136
```

Confirmed via `docker inspect supabase-db --format '{{.Config.Image}}'` first. A stock `postgres`
image was tried first and failed completely (0 rows restored) — it has neither the `auth` schema
nor the extensions below, and every policy referencing them, plus every generated column depending
on them, is silently dropped by `pg_restore`'s error-tolerant default.

### 3. Four extensions, not created by the image by default

```bash
docker exec restore-drill psql -U postgres -d postgres -c "
  CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
"
```

Found one at a time, each by reproducing the restore and reading the exact `pg_restore` error
rather than guessing:

| Missing extension | Surfaced by                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `unaccent`        | `COPY failed for table "afrik_peoples"` — every corpus table's `COPY`, not just its schema          |
| `fuzzystrmatch`   | `function extensions.dmetaphone(text) does not exist` — `afrik_patronymes.name_phonetic`            |
| `pg_trgm`         | `operator class "extensions.gin_trgm_ops" does not exist` — trigram indexes on `persons`, `sources` |
| `citext`          | `type "public.citext" does not exist` — `admin_allowlist.email`, `flag_reporter_contacts.email`     |

`citext` is the one exception to "install into `extensions`": the source database has it in
`public`, not `extensions`, and the dumped DDL says `public.citext` literally. Match the source,
don't assume every extension lives in the same schema.

### 4. Restore

```bash
docker cp ./drill.dump restore-drill:/tmp/drill.dump
docker exec restore-drill pg_restore -U postgres -d postgres --no-owner --no-privileges /tmp/drill.dump
```

### 5. Validate

```bash
docker exec restore-drill psql -U postgres -d postgres -c "select count(*) from public.afrik_peoples"
docker exec restore-drill psql -U postgres -d postgres -c "select count(*) from public.afrik_patronymes"
```

Final result: `afrik_peoples` = **772**, `afrik_patronymes` = **794**, both matching the live
corpus. `admin_allowlist` and `flag_reporter_contacts` restored without error once `citext` was in
place, though their row counts were not asserted (only that the tables now exist). The single
remaining line — `pg_restore: warning: errors ignored on restore: 1`, on `CREATE SCHEMA public
already exists` — is expected on every restore into any Postgres database, since one already has
a `public` schema by default; it is not evidence of anything lost.

### 6. Cleanup

```bash
docker rm -f restore-drill && rm ./drill.dump && docker exec supabase-db rm /tmp/drill.dump
```

---

## Issues encountered

Six attempts before a clean restore, each one a real, load-bearing finding rather than trial and
error for its own sake:

1. A stock `postgres` image restored 0 rows — the target must run the same image as the source.
2. `-n public` alone dropped the `private` schema and every RLS policy naming it.
3. `unaccent` missing broke every corpus table's `COPY`, not just the tables that mention it by
   name in a comment.
4. `fuzzystrmatch` missing broke `afrik_patronymes` specifically (`dmetaphone()`).
5. `pg_trgm` missing broke the `persons`/`sources` trigram indexes.
6. `citext` needed `WITH SCHEMA public`, not `extensions` — the one extension not matching the
   other three's placement.

**Wall-clock timing was not captured precisely this run** — the drill ran interactively, debugging
each extension in turn, which is not representative of a real incident's timeline. The next drill
should time each phase explicitly (dump, scratch setup, restore, validation) now that the extension
list above removes the guesswork that consumed most of this one's duration.

---

## What this changes going forward

- `restore-procedure.md` Path C now documents the corrected sequence directly, so the next drill —
  or a real incident — does not re-discover these four extensions one `pg_restore` error at a time.
- Recette runs the same image and the same schema, so this procedure is expected to apply to it
  unchanged, but recette itself has not been separately drilled. Do not treat this drill as proof
  for both databases.
- The scheduled-backup gap remains open. This drill validates the mechanism a real backup would
  need to be restored through — it does not create the backup that mechanism is missing.
