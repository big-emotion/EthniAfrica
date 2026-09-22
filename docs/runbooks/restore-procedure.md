# Runbook — Supabase restore

**RTO target:** ≤ 4 hours
**RPO target:** ≤ 24 hours

Restores go to a **throwaway project**, never over a live one. You validate the restored copy
first, then decide whether to cut over. Restoring in place destroys the evidence you would need
if the restore itself turns out to be wrong.

Before you start, know which database you are recovering. A hosted Supabase project labels its
only environment "production", so the label describes the project, not the application it serves.
Since ETNI-1958 recette and production are both self-hosted stacks; `shmrjtnfbqzceovroqjj` is the
hosted project that backed recette before the move and is kept only as a rollback path until
ETNI-1962. Identity table: [`migration-state.md`](./migration-state.md).

> **Paths A and B below do not apply to either current database.** Both assume a hosted Supabase
> project — a dashboard, PITR, scheduled backups, `supabase projects create`. Production and
> recette are self-hosted stacks, which have none of those. **Path C**, added after the
> [2026-09-22 drill](./restore-drill-2026-09-22.md), is the one that applies to them. That drill
> proved the mechanism against production; recette runs the same image and schema but has not
> itself been separately drilled. Neither drill establishes an RPO — there is still no scheduled
> backup against either database, only a mechanism proven to work once a backup exists to restore.
> Paths A and B remain below because they still describe the hosted project, which survives as
> recette's rollback until ETNI-1962.

---

## Contacts and escalation

There is no on-call rotation and no PagerDuty on this project. Escalation is: the repository
owner, then Supabase support.

| Role             | Contact                                        | When                                                  |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------- |
| Repository owner | GitHub `@big-emotion/ethniafrica`              | immediately on suspected data loss                    |
| Supabase support | [support portal](https://supabase.com/support) | CLI restore fails, or PITR is unavailable on the plan |

PITR is a paid Supabase feature. Confirm it is enabled on the affected project before planning
a point-in-time recovery — if it is not, the logical-backup path below is the only option and
the achievable RPO is the age of the last scheduled backup.

---

## Prerequisites

```bash
npm install -g supabase
supabase login
supabase projects list        # confirm you can see the affected project
```

Create the throwaway project in the **same region as the project being restored**. Check it
first — the hosted project (`shmrjtnfbqzceovroqjj`, recette's rollback) is in `eu-west-1`; do not
assume another one matches.

```bash
supabase projects list        # read the region from this output
```

---

## Path A — point-in-time recovery

Use when you need a specific timestamp within the PITR retention window.

```bash
RECOVERY_TIME="2026-08-26T03:00:00Z"   # ISO 8601 UTC — the point you want back

supabase projects create "restore-$(date +%Y-%m-%d)" \
  --region <region-of-the-affected-project> \
  --db-password "<secure-temp-password>"

THROWAWAY_REF="<new-project-ref>"      # from the output above
```

Trigger the restore from the dashboard (Project Settings → Database → Backups → Restore to
point in time) or via the Management API:

```bash
curl -X POST "https://api.supabase.com/v1/projects/${THROWAWAY_REF}/database/restore" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"recovery_time_target_unix\": $(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "${RECOVERY_TIME}" +%s)}"
```

> The `date` invocation above is BSD/macOS. On GNU/Linux use
> `date -d "${RECOVERY_TIME}" +%s`.

Restores typically take 15–60 minutes depending on database size.

---

## Path B — logical backup

Use when PITR is unavailable, or a full logical restore is what you want.

```bash
# 1. Download the latest scheduled backup:
#    Project Settings → Database → Backups → Scheduled Backups → Download

# 2. Throwaway project, same region as the affected one.
supabase projects create "restore-$(date +%Y-%m-%d)" \
  --region <region-of-the-affected-project> \
  --db-password "<secure-temp-password>"

THROWAWAY_REF="<new-project-ref>"
THROWAWAY_DB_URL="postgresql://postgres:<password>@db.${THROWAWAY_REF}.supabase.co:5432/postgres"

# 3. Restore.
pg_restore --verbose --no-acl --no-owner -d "${THROWAWAY_DB_URL}" ./backup-<date>.dump

# SQL-format backup instead:
psql "${THROWAWAY_DB_URL}" < ./backup-<date>.sql
```

---

## Path C — self-hosted stack (production and recette)

Use this one. Both databases are self-hosted, so there is no dashboard, no PITR, and no
`supabase projects create` — the restore target is a disposable Docker container on the same host,
never the running `supabase-db`/`recette-db` container itself. Validated once, against production,
in the [2026-09-22 drill](./restore-drill-2026-09-22.md); read that record for what six attempts
found before this sequence was correct.

```bash
# 1. Which image the real container runs — never restore into a stock `postgres` image. A stock
#    image has neither the `auth` schema nor the extensions below, and pg_restore's error-tolerant
#    default silently drops every policy and generated column that needs them rather than failing
#    loudly.
docker inspect supabase-db --format '{{.Config.Image}}'   # supabase-db, or recette-db for recette

# 2. Which schemas this project owns beyond Supabase's own set — `\dn` in the source database,
#    looking for anything not owned by supabase_admin/pgbouncer. Currently: public and private.
#    A dump scoped to `public` alone silently drops every RLS policy the `private` schema's helper
#    functions (is_admin(), etc.) back.
docker exec supabase-db psql -U postgres -d postgres -c "\dn"

# 3. Dump every schema found in step 2.
docker exec supabase-db pg_dump -U postgres -d postgres -n public -n private -Fc -f /tmp/drill.dump
docker cp supabase-db:/tmp/drill.dump ./restore.dump

# 4. Scratch container, the same image as step 1.
docker run -d --name restore-scratch -e POSTGRES_PASSWORD=<local-only, never reused> \
  -p 127.0.0.1:55432:5432 <image-from-step-1>
sleep 15   # let its own init scripts finish before restoring into it

# 5. Four extensions the image does not install by default. Three into `extensions`; `citext`
#    into `public` specifically — the dumped DDL says `public.citext`, matching where the source
#    actually has it, not where the other three happen to live.
docker exec restore-scratch psql -U postgres -d postgres -c "
  CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
"

# 6. Restore.
docker cp ./restore.dump restore-scratch:/tmp/restore.dump
docker exec restore-scratch pg_restore -U postgres -d postgres --no-owner --no-privileges \
  /tmp/restore.dump 2>&1 | tee restore-log.txt

# 7. Validate — see "Validate the restored database" below. A single
#    `errors ignored on restore: 1` on `CREATE SCHEMA public already exists` is expected on any
#    target and is not evidence of data loss; any other ignored error is not.
docker exec restore-scratch psql -U postgres -d postgres -c "select count(*) from public.afrik_peoples"

# 8. Cleanup — never skip. A forgotten scratch container holds a full copy of the corpus.
docker rm -f restore-scratch && rm ./restore.dump && docker exec supabase-db rm /tmp/drill.dump
```

If any table restores with 0 rows or a "does not exist" cascade after step 6, find the _first_
occurrence of that table's name in `restore-log.txt` (not the downstream errors referencing it) —
that line carries the real cause, almost always a missing extension step 5 didn't anticipate.

---

## Validate the restored database

`scripts/validateAfrikData.ts` validates the **JSON corpus on disk**, not the database. It is a
useful signal that the repository and the restore describe the same corpus, but on its own it
does not prove the restore worked. Check the database directly as well.

```bash
npx tsx scripts/validateAfrikData.ts 2>&1 | tee /tmp/restore-validation.log
echo "Exit code: $?"
```

> Its printed summary undercounts: it reports the six legacy checks while running many more,
> and persists only those six to `dataset/source/afrik/logs/validation_report.json`. Read the
> full output, not the `RÉSUMÉ` block.

Then read the restored database itself. Row counts against the throwaway project, with the
service-role key of that throwaway project:

```bash
for t in afrik_language_families afrik_languages afrik_peoples afrik_countries \
         afrik_people_countries migration_events afrik_people_relations; do
  printf '%-28s ' "$t"
  curl -sI "https://${THROWAWAY_REF}.supabase.co/rest/v1/${t}?select=*" \
    -H "apikey: ${THROWAWAY_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${THROWAWAY_SERVICE_ROLE_KEY}" \
    -H "Prefer: count=exact" | grep -i content-range
done
```

Also confirm the migration ledger came back intact — a restore that loses it will make every
later migration look pending. Compare it against
[`migration-state.md`](./migration-state.md).

---

## Post-restore checklist

- [ ] Row counts match the pre-incident snapshot (spot-check at least three tables).
- [ ] The migration ledger matches the state table in [`migration-state.md`](./migration-state.md).
- [ ] An **anonymous** read succeeds on a public table — this is what proves RLS survived; the
      service-role key bypasses RLS and proves nothing.
- [ ] The application authenticates against the throwaway project.
- [ ] Wall-clock time within the 4 h RTO.
- [ ] Recovery point within 24 h of the incident (RPO).

---

## Cutover, if you are recovering for real

The throwaway project has different credentials from the one it replaces. Cutting over means
updating `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` in the Vercel project and redeploying — plus the AFRIK corpus
sync, which will otherwise keep writing to the old, damaged project:

- recovering the **recette** project also means editing `AFRIK_RECETTE_SUPABASE_URL` in
  `scripts/lib/afrikSyncTarget.ts`; that ref is checked in, so a throwaway project cannot be
  reached by `--target=recette` until it is changed;
- recovering the **production** project means repointing the `PRODUCTION_SUPABASE_URL` and
  `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY` repository secrets, which is configuration — no code
  change needed. See [`afrik-data-sync.md`](./afrik-data-sync.md).

Prefer restoring _into_ the original project once the throwaway copy has proven the backup is
good. Cut over only when the original is unrecoverable.

---

## Cleanup

```bash
supabase projects delete "${THROWAWAY_REF}"
```

Confirm the deletion in the dashboard. A forgotten throwaway project holds a full copy of the
corpus and bills monthly.

---

## Drill schedule

Drills should run quarterly, each one recorded as `docs/runbooks/restore-drill-<YYYY-MM-DD>.md`.

**There is no automation for this.** An earlier version of this runbook claimed
`.github/workflows/backup-drill-reminder.yml` opened a quarterly reminder issue; that workflow
does not exist in the repository. Until someone adds it, the schedule is a manual commitment —
treat an absent drill record as an absent drill.

Two drills on record: [2025-07-14](./restore-drill-2025-07-14.md) (hosted project, no longer the
live path) and [2026-09-22](./restore-drill-2026-09-22.md) (self-hosted, Path C, production only —
recette has not itself been separately drilled).

**Next drill due: 2026-12-22.** Derived, not scheduled: the last recorded drill plus one quarter.
It stays current until that date passes with no new `restore-drill-<YYYY-MM-DD>.md` record, and
the date above moves to that record plus one quarter in the same change. The next drill should
also cover recette, and should time each phase explicitly — the 2026-09-22 drill did not, since
most of its duration went to finding the four missing extensions Path C now documents up front.

**Drill owner: project operator.** The project operator owns scheduling, execution, evidence, and
the next due date. A drill is a human action — it creates a throwaway project and restores real
data — and no agent session runs one.

---

## Timelines

| Phase                                 | Target         |
| ------------------------------------- | -------------- |
| Incident declared → restore started   | ≤ 30 min       |
| Restore started → validation complete | ≤ 3 h 30 min   |
| **Total RTO**                         | **≤ 4 hours**  |
| **RPO (max data loss)**               | **≤ 24 hours** |
