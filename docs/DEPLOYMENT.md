# Deployment guide

How an EthniAfrica change reaches users, and what an operator has to do by hand.

The short version: **publishing a GitHub Release deploys the application, and its `migrate` job
brings production's schema up to the released tag first.** Nothing else ships — not a push, not a
tag. Every schema change is still a two-step rollout, and both steps are automated: a merge into
`recette` that touches `supabase/migrations/` applies recette's (`migrate-recette.yml`), and a
published Release applies production's over an SSH tunnel before the deploy job may start. The
corpus is a third, separate step — see [AFRIK corpus](#afrik-corpus).

---

## Environments

| Environment | Ships when                                  | Hosted on                              | Supabase                                                         |
| ----------- | ------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Local       | —                                           | your machine                           | your own `supabase start` stack (`--target=local`)               |
| Recette     | `deploy-preview-recette.yml` is run by hand | Vercel preview                         | self-hosted stack at `https://supabase-recette.ethniafrica.com`  |
| Production  | a GitHub Release is published               | self-hosted VPS (the application host) | self-hosted stack at `https://supabase.ethniafrica.com` (no ref) |

A contributor without access to either shared stack builds a local one: see
[Local bootstrap](./runbooks/afrik-data-sync.md#local-bootstrap).

Neither environment deploys on a push any more. `recette` is still the integration branch and
`main` is still what a release is tagged from — but the branch no longer triggers anything.

**A hosted Supabase project calls its environment "production", and the label does not mean
what it looks like.** A Supabase project has exactly one environment, and Supabase names it
"production" — there is no staging branch inside a project. The label therefore describes the
project's own environment, not the application environment it serves. Since ETNI-1958
(DEC-056) neither application environment reads a hosted project: **recette** reads the
self-hosted stack at `https://supabase-recette.ethniafrica.com` and **production** the one at
`https://supabase.ethniafrica.com`, both on the Supabase host (a second VPS), which is why
neither the Supabase dashboard nor the MCP can see them. `shmrjtnfbqzceovroqjj` is the hosted
project that backed recette before the move; it survives only as a rollback path until ETNI-1962
decommissions it. `jajggbeimfudpzcxytbb` is the **retired** hosted project that once held
production; it still answers, so never point a secret at either. Before touching a
database, read
[`runbooks/migration-state.md`](./runbooks/migration-state.md) — it carries the project
identity table, the applied-migration state, and the two-step rollout rule.

The AFRIK corpus sync used to hard-code `shmrjtnfbqzceovroqjj` as its "production" target, so
every production deploy loaded the corpus into recette and then revalidated `ethniafrica.com`,
a site it had not written to. That is fixed. `scripts/lib/afrikSyncTarget.ts` now resolves
`--target=recette` against a checked-in recette URL and `--target=production` against the
`AFRIK_PRODUCTION_SUPABASE_URL` environment variable, with no default and an outright refusal
if it is configured as the recette project. `.github/workflows/production-data-sync.yml`
supplies it from two repository secrets belonging to the production project —
`PRODUCTION_SUPABASE_URL` and `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY` — and fails, rather than
skipping, when either is missing.

---

## Deploying the application

**Production is self-hosted on a VPS (the application host), not on Vercel.**

```
git push origin main          →  nothing
git push origin v<version>    →  nothing
gh release create v<version>  →  deploy-production.yml  →  ethniafrica.com
                                       │
                                       └─ on success ─→ production-data-sync.yml
```

`.github/workflows/deploy-production.yml` listens on `release: published` and nothing else. It
opens an SSH session to the VPS, checks out the released tag in `/srv/ethniafrica`, and runs
`docker compose build && up -d` against the repository's own [`Dockerfile`](../Dockerfile) and
[`docker-compose.yml`](../docker-compose.yml). It skips pre-releases. It has no
`workflow_dispatch`: production is not deployable from a dropdown.

Full procedure, secrets, host layout and **rollback**:
[`runbooks/production-deploy.md`](./runbooks/production-deploy.md).

Vercel still hosts the **recette preview**, but nothing about it is automatic.
[`vercel.json`](../vercel.json) sets `git.deploymentEnabled: false`, which turns off every
commit-triggered build — the volume that exhausted the Hobby plan's deployment quota once
several agent sessions began pushing in parallel, until the rate limit landed on `main` itself.
Build a preview by running `deploy-preview-recette.yml` from the Actions tab; it calls a Vercel
Deploy Hook, which is an explicit trigger rather than a commit-driven one.

`next.config.ts` sets `output: "standalone"` for the Docker image and wraps the config in
`withSentryConfig`, which uploads source maps when `SENTRY_AUTH_TOKEN` is present and deletes
them after upload, so the browser never serves them.

Both branches are protected. Every change arrives through a pull request; `recette → main` sync
PRs must use a **merge commit**, never a squash. `main` matters more than usual now:
`workflow_run` only fires for workflow files that live on the default branch, so
`production-data-sync.yml` cannot chain off the deploy until both files are on `main`.

### Tagging

`npm run` has no release script. The `/ethniafrica-release` project skill bumps
`package.json`, updates `CHANGELOG.md`, creates the annotated tag on `main`, pushes both, and
then publishes the GitHub Release — which is the step that actually deploys. Stopping after the
tag bumps a version and ships nothing.

---

## What CI gates before a merge

`.github/workflows/ci.yml` runs on every pull request targeting `recette` or `main`, as three
jobs:

- **gitleaks** — scans the PR's working tree (`--no-git`) against `.gitleaks.toml`.
- **dependency-audit** — GitHub's dependency review; a high-severity advisory in a changed
  dependency fails the PR that introduces it.
- **build** — the rest, in this order: `npm run lint`; then diff-scoped against the PR base,
  `lint:req` and `check:copy-literals`; then `check:jira-template`,
  `check:action-pins -- --resolve`, `check:workflow-shell`, `check:env-example`, `check:local-paths`,
  `check:infra-disclosure`, `check:orphan-docs`, `check:asset-weight`, `check:skill-parity`,
  `check:pagination-contract`, `test:social-tools`, `check:dead`; then
  `check:translation-parity` (a report — `continue-on-error`, it cannot fail the job) and
  `check:glossary` (which does fail it); then `check:migration-files`, `check:rls-coverage`,
  `check:production-ledger`; then `typecheck`, `format:check`, `test:coverage`,
  `test:charter-contracts`, `npm run build`, and a last step that fails if any gate left the
  tree dirty.

The build step passes placeholder Supabase values so that fork and Dependabot PRs, which have
no access to secrets, still gate. The Supabase modules validate their configuration at module
scope and throw when it is missing; the placeholders only need to parse, nothing queries the
database during a build. `ci.yml` is the authority: if this list and the file disagree, the file
is right.

Other workflows carry the heavier domain gates, most of them also on every pull request:
`a11y.yml`, `lighthouse.yml`, `e2e.yml`, `data-integrity.yml` (also nightly, and the reader of
`check:afrik-loader` and the nightly `check:migration-state`), `editorial-rules.yml`,
`openapi-diff.yml`, and `migrations-replay.yml` (only when `supabase/migrations/**` or
`supabase/config.toml` changes: it replays every migration on an empty local stack).
`approve-agent-ci.yml` releases CI runs held back by GitHub's bot-PR approval gate.

Workflows that run after a merge, on a schedule or on demand, and so can never block a PR:

- `migrate-recette.yml` — a push to `recette` touching `supabase/migrations/**` applies the
  pending migrations to recette over the SSH tunnel and re-reads the ledger.
- `recette-data-sync.yml` — a push to `recette` touching the corpus, its translations or the
  loaders loads it into recette.
- `production-data-sync.yml` — chains off `deploy-production.yml` with `workflow_run`.
- `confidence-recompute.yml` — nightly, source URL checks and the confidence recompute.
- `embed-availability.yml` — nightly, asks each video platform whether an embedded piece is
  still playable (REQ-181); it annotates and never fails on findings.
- `storybook-deploy.yml` — a push to `main`.
- `seed-moderation-allowlist.yml` and `deploy-preview-recette.yml` — run by hand.
- The Ferry automation: `ferry-router.yml` (repository dispatch from Jira transitions, one
  workflow for every agent), `ferry-reconcile.yml` (every 30 minutes) and `ferry-cost-daily.yml`.
- `claude.yml` (Claude on issues and review comments) and `claude-code-review.yml` (an automated
  review on each pull request — advisory, not a gate).

> Which of these are _required_ contexts on `recette` and `main` is a branch-protection
> setting, not a repository file — check it on GitHub rather than inferring it from this list.
> A workflow that runs but cannot block a merge is not a gate.

Run the same gate locally before pushing:

```bash
make check        # lint + typecheck + format:check + all tests, must stay under 5 min
npm run e2e       # Playwright, deliberately outside `make check`
```

---

## Environment variables

`.env.example` is the annotated, authoritative list — copy it, do not copy this section.

```bash
cp .env.example .env.local
```

Required for the app to run at all:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, never expose it to the browser bundle

Publication safety:

- `SITE_LOCALE_MODE` — **server-only** and optional. Missing, empty, or invalid values fail
  closed to `fr-only`: `/` and stale English cookies resolve to `/fr`, English URLs temporarily
  redirect to their French counterpart, and the language switch is absent. Set
  `bilingual-fr-default` to publish both languages while keeping `/fr` as the default, or
  `bilingual-en-default` only for the final English-default launch.

  Change it in the target environment and rebuild. The production release workflow verifies `/`,
  `/fr`, `/en`, and the remembered-English-cookie path inside the new container before declaring
  the deploy healthy. A misspelled non-empty value deliberately fails that deploy even though
  the application itself remains safely French-only.

Required for a reader to report an error:

- `ANTIBOT_HMAC_SECRET` — **server-only**, any long random string. It signs the proof-of-work
  challenge that stands in front of `POST /v2/flags`.

  It is not inert when unset, which is why it is listed here and not below.
  `GET /api/v2/antibot/challenge` answers **503** without it, the report dialog shows _"la
  vérification n'a pas abouti"_, and no reader can file anything — on a build whose every
  other check is green. That is exactly what happened when the proof of work replaced
  Cloudflare Turnstile: the secret was added to `.env.example` and this list still named the
  vendor that had just been removed, so nobody knew there was a new secret to set. Rotating it
  is harmless — challenges in flight are invalidated and readers are handed new ones.

  **Generating one.** Any long random string; 48 random bytes is ample.

  ```bash
  openssl rand -base64 48 | tr -d '\n' > antibot-secret.txt   # umask 077 first
  ```

  **Setting it.** In production it is a line in `/srv/ethniafrica/.env` on the VPS; on the
  recette preview it is a Vercel environment variable; locally it is in `.env.local`. It is
  read only on the server, so it never needs a `NEXT_PUBLIC_` twin.

  ```bash
  # production — generate it on the host so the value never travels
  ssh -p <port> <user>@<app-host>   # values: PRODUCTION_SSH_* secrets / operator's private notes
  openssl rand -base64 48 | tr -d '\n'    # paste into /srv/ethniafrica/.env
  cd /srv/ethniafrica && docker compose up -d ethniafrica

  # recette preview
  tr -d '\n' < antibot-secret.txt | vercel env add ANTIBOT_HMAC_SECRET preview
  ```

  Then **rebuild** — neither a `.env` line nor a Vercel variable reaches a build that
  already ran. On the VPS that means `docker compose up -d`; on Vercel, a fresh run of
  `deploy-preview-recette.yml`.

  **Checking parity without printing the secret.** The value must be identical across
  environments, or a challenge minted by one and verified by another is refused. Compare
  fingerprints rather than values:

  ```bash
  shasum -a 256 antibot-secret.txt | cut -c1-16
  ```

  **Rotation is harmless and needs no window.** Challenges in flight are invalidated and
  their readers are handed new ones; nothing durable is signed with it. Rotate on the usual
  schedule, or immediately if the value is ever printed into a log, a terminal transcript or
  a pull request.

  Verify it after every deploy, on each environment:

  ```bash
  curl -s https://<host>/api/v2/antibot/challenge | head -c 200   # expect salt + signature, not UNAVAILABLE
  ```

  A 200 with a `salt` proves the secret is set. It does **not** prove the two environments
  agree — only a report that actually sends does that.

Required in production, whatever their reputation as an optional extra:

- `NEXT_PUBLIC_SITE_URL` — the public origin, for `metadataBase`, the Atom feed, the
  flag-resolution email and the OpenAPI server. `resolveSiteUrl()` in `src/lib/siteUrl.ts`
  throws on a production server when it is unset, so every page answers 500; `next build`
  is exempt, which means a green build does not prove the value is there.

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

  Rate limiting **fails closed**. `checkUpstashConfigured()` in `src/lib/api/rate-limit.ts`
  answers **500** on a production deployment when either is missing, rather than serving
  unlimited traffic — a deliberate choice, since failing open would silently remove all rate
  limiting. Outside production it logs a warning and lets the request through.

  What decides "production" changed with the move off Vercel. `isProductionDeployment()`
  prefers `VERCEL_ENV`, which no longer exists, and falls back to `NODE_ENV` — which the
  Docker image sets to `production`. So on the VPS these two are mandatory: without them
  every `/api/v2/*` request answers 500 while the pages themselves render perfectly, which is
  a difficult failure to read from the outside.

Optional subsystems, each genuinely inert when unset: `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`,
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `ANTIBOT_DIFFICULTY_BITS` (defaults to 20),
`ANTIBOT_TTL_MS` (challenge lifetime, defaults to 300000),
`REVALIDATE_SECRET`, `SUPABASE_WEBHOOK_SECRET`,
`CORS_ALLOWED_ORIGIN`. (`NEXT_PUBLIC_FEATURE_QUIZ` is not on this list on purpose: nothing
reads it any more, and `.env.example` does not carry it.)

`LEGAL_HOST_NAME` and `LEGAL_HOST_ADDRESS` name the host in the legal notice
(`src/lib/legalHost.ts`). They are plain configuration read at request time, and they are
provisioned rather than committed because the repository is public. Unset, the notice states
the host's role instead of its name and logs an error — the page never fails.

`AFRIK_PRODUCTION_SUPABASE_URL` is loader-only: set it only when syncing the AFRIK corpus with
`--target=production`. Its CI counterparts, `PRODUCTION_SUPABASE_URL` and
`PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`, are GitHub Actions repository secrets read only by
`.github/workflows/production-data-sync.yml` — they are never local environment variables.

`scripts/checkEnvExample.ts` compares `.env.example` against the variables the code actually
reads. Run it after adding any `process.env` reference.

### Rate limiting `/api/v2/*`

`src/middleware.ts` applies Upstash rate limiting. Without `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`, the limiter is disabled — acceptable locally, not in production.

| Variable                 | Meaning                                                        | Default |
| ------------------------ | -------------------------------------------------------------- | ------- |
| `RATE_LIMIT_IP_RPM`      | anonymous requests per IP                                      | `60`    |
| `RATE_LIMIT_PUBLIC_RPM`  | a `public`-tier API key                                        | `600`   |
| `RATE_LIMIT_PARTNER_RPM` | a `partner`-tier API key                                       | `6000`  |
| `RATE_LIMIT_WINDOW`      | window accepted by `@upstash/ratelimit` (`"1 m"`, `"30 s"`, …) | `"1 m"` |

The tier (`public` / `partner` / `admin`) comes from the `api_keys.tier` column (migration
`013`), resolved by `validateApiKey()`. There is no key list to maintain in the environment.

No key is required. A request without an `Authorization` header is metered on the anonymous
`RATE_LIMIT_IP_RPM` bucket; a valid Bearer key is metered on its tier; a present but unknown,
revoked or expired key answers **401** rather than falling back to anonymous, so a broken
integration fails loudly. `Origin` and `Referer` authorise nothing — any client can send them —
so the frontend embeds no key and its readers share the anonymous per-IP quota. Server
components read the services directly and never call `/api/v2` over HTTP, so the container's own
address never pools every reader into one bucket.

### Report and contact form tunables

Each is optional; a malformed or non-positive value keeps the default rather than failing. The
limiters need the same Upstash pair as above and fail open without it.

| Variable                        | Meaning                                                     | Default  |
| ------------------------------- | ----------------------------------------------------------- | -------- |
| `FLAG_RATE_LIMIT_HOURLY`        | reports one reporter may file per hourly window             | `10`     |
| `FLAG_RATE_LIMIT_HOURLY_WINDOW` | length of the hourly window (`@upstash/ratelimit` spelling) | `"1 h"`  |
| `FLAG_RATE_LIMIT_DAILY`         | reports one reporter may file per daily window              | `30`     |
| `FLAG_RATE_LIMIT_DAILY_WINDOW`  | length of the daily window                                  | `"24 h"` |
| `FLAG_MIN_DWELL_MS`             | fastest a report form may be submitted (bot filter)         | `3000`   |
| `FLAG_VERIFICATION_TTL_HOURS`   | lifetime of a reporter's e-mail verification link           | `24`     |
| `CONTACT_RATE_LIMIT_MESSAGES`   | contact messages per address per window                     | `5`      |
| `CONTACT_RATE_LIMIT_WINDOW`     | length of the contact window                                | `"1 h"`  |

---

## Database changes

Schema and data are two different operations with two different runbooks, and each is
automated along the same two-step path.

### Schema

Read [`runbooks/migration-state.md`](./runbooks/migration-state.md) first. It records which
migrations are live on which database and why "the ticket is Done" has already meant "the
migration was never applied".

The rule, in one line: **recette first, verified against the recette application, then the same
file on production.** Never one alone, never production first. The pipeline now performs both
steps:

1. **Merge into `recette`.** `.github/workflows/migrate-recette.yml` fires on a push to `recette`
   that touches `supabase/migrations/**`, runs `supabase db push` with the
   `RECETTE_SUPABASE_DB_URL` secret, then `npm run check:migration-state` must read nothing
   pending. Without the secret it skips with a warning and applies nothing.
2. **Publish a Release.** The `migrate` job of `.github/workflows/deploy-production.yml` measures
   the production ledger over PostgREST, opens an SSH tunnel to the `supabase-db` container on the
   Supabase VPS (production's Postgres port is not published), refuses a `db push` plan wider
   than that measurement, applies, and measures again. The `deploy` job `needs:` it, so a Release
   against a schema the job cannot bring level ships nothing.

What remains a human act is the decision between the two: verifying on the recette application
before publishing the Release. The tunnel, its secrets and the failure modes it has already had
are in [`runbooks/migration-state.md`](./runbooks/migration-state.md#the-automation-and-what-it-does-not-cover).

Migrations are numbered sequentially in `supabase/migrations/`. The highest-numbered file is not
necessarily the highest-numbered applied migration — that gap is the whole subject of the
runbook.

### AFRIK corpus

The editorial corpus lives as JSON fiches under `dataset/source/afrik/`, in git — count them
with `git ls-files 'dataset/source/afrik/**/*.json' | wc -l` rather than trusting a number
written here, because the corpus grows with every editorial pass. Loading it into Supabase is a
separate step, documented in
[`runbooks/afrik-data-sync.md`](./runbooks/afrik-data-sync.md).

Validate before loading anything:

```bash
npx tsx scripts/validateAfrikData.ts        # AFRIK data integrity
npx tsx scripts/ci/checkEditorialRules.ts   # decolonial editorial rules
```

Then preview, then apply:

```bash
npx tsx --conditions=react-server scripts/migrateAfrikToDatabase.ts --target=production
npx tsx --conditions=react-server scripts/migrateAfrikToDatabase.ts --target=production --apply
```

`--target` names the application environment: `recette`, `production`, or `local` (a
contributor's own `supabase start` stack, loopback only). `--target=recette` resolves to the
self-hosted `https://supabase-recette.ethniafrica.com` (`AFRIK_RECETTE_SUPABASE_URL`);
`--target=production` resolves to whatever
`AFRIK_PRODUCTION_SUPABASE_URL` names, and refuses to run if that is unset or is the recette
project. `NEXT_PUBLIC_SUPABASE_URL` must match the resolved target, so loading production by
hand means pointing both variables at the production project. `--target=staging` is retired and
now throws.

`.github/workflows/production-data-sync.yml` runs the same validate → preview → apply sequence
automatically after a **successful production deploy** — it is chained to
`deploy-production.yml` with `workflow_run` and runs only when that concluded `success`, so a
failed deploy leaves the production corpus untouched. It then POSTs a cache revalidation to
`https://ethniafrica.com/api/admin/revalidate`. It reads
`PRODUCTION_SUPABASE_URL` and `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY` — both the production
project's, both distinct from the recette values the rest of CI uses — and fails if either is
absent.

Requires **Node `22.x`**, the version `package.json` `engines` and the `Dockerfile` pin for the
whole application: `@supabase/supabase-js` needs a native `WebSocket`, and on an older Node the
loader run dies with `native WebSocket not found` before the target guard is reached.

---

## First moderator

Access to the moderation console is an address on `admin_allowlist` — not a role, and not an
account, because the atlas has no public accounts. During the French-only rollout, use
`/fr/admin` and `/fr/admin/connexion`; the `/en/admin` surface becomes reachable only when a
bilingual `SITE_LOCALE_MODE` is explicitly enabled. Put the address on the list, then have the
person request a link at the published sign-in page:

```bash
NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
  npx tsx scripts/seedAdminAllowlist.ts moderation@example.org "Responsable éditorial de la modération"
```

The magic link only works once Supabase Auth's redirect allow-list carries this
environment's `/api/auth/callback`; otherwise Supabase silently substitutes the
project's Site URL. Full procedure and the failure modes:
`docs/runbooks/moderation-access.md`.

Sign-in is that magic link and nothing else. GitHub and Google are disabled in
`supabase/config.toml` (`[auth.external.github]` and `[auth.external.google]`,
`enabled = false`): with no public accounts they would only open a second door onto the same
allowlist check.

## Legacy `user_roles`

**Do not use this to grant console access.** Roles live in `user_roles` (migration `008`) with
values `reader`, `contributor`, `moderator`, `admin`, `advisor`. They gated the legacy
`/admin/contributions` workspace, which was removed when contributions became flags (migration
`081`), and they open no door in the moderation console — access there is membership of
`admin_allowlist`. The table's one remaining reader in the code is
`src/lib/rights/protected-asset-access.ts` (protected-asset signed URLs), which no route calls
today. `scripts/seedAdmin.ts` is kept for that path, not for bootstrapping a moderator:

1. The person signs in once at the published sign-in page (`/fr/admin/connexion` in
   `fr-only`; `/en/admin/connexion` is also available in a bilingual mode) so their auth
   account exists.
2. Grant the role:

   ```bash
   ADMIN_EMAIL=admin@example.com npx tsx scripts/seedAdmin.ts
   # or
   npx tsx scripts/seedAdmin.ts admin@example.com
   ```

3. Confirm the `user_roles` row shows `role = 'admin'`.

---

## Post-deploy verification

- [ ] The `deploy-production.yml` run concluded `success` and the site loads. A published
      Release with a failed deploy is not a shipped release.
- [ ] Locale behaviour matches `SITE_LOCALE_MODE` (REQ-140): missing or `fr-only` sends `/`
      and `/en` to `/fr` and shows no language switch; `bilingual-fr-default` renders both
      locales while `/` resolves to `/fr`; only `bilingual-en-default` resolves `/` to `/en`.
      A locale segment the site does not support (`/es/...`) is redirected to the configured
      default with its path preserved.
- [ ] A fiche route renders for each entity type: a country, a people, a language family.
      _A green axe check has previously masked an HTTP 500 on every fiche route for two
      releases. Load one for real._
- [ ] `/api/v2/countries` returns 200 without an API key, from the browser and from `curl`
      alike: since v4.9.0 a keyless request is the anonymous per-IP tier, and neither `Origin`
      nor `Referer` authorises anything. A request carrying an invalid Bearer key returns 401.
      A 500 on every `/api/v2/*` route while the pages render means Upstash is not configured.
- [ ] Sentry shows no new issue class in the first 30 minutes.
- [ ] The Release's `migrate` job ended on `applied N · pending 0 · orphaned 0 · drifted 0`. If a
      migration shipped in this release, its state table row in
      [`runbooks/migration-state.md`](./runbooks/migration-state.md) is updated for **both**
      databases, citing that run.

---

## Rollback

**Application.** A host-side operation on the VPS, not a re-run of any workflow and not a
re-published Release. Each deploy renames the outgoing image `ethniafrica:previous`, so going
back is two commands and about ten seconds. Only one generation is kept. Full procedure —
including rebuilding an older tag and the DNS fallback to Vercel — is in
[`runbooks/production-deploy.md`](./runbooks/production-deploy.md). Nothing else is
required: the frontend holds no state.

**Database.** Migrations are not generally reversible; several drop tables and their data.
Restore from a snapshot rather than hand-writing a down migration. See
[`runbooks/restore-procedure.md`](./runbooks/restore-procedure.md) for PITR and logical
restore, with the RTO/RPO targets that apply.

An application rollback without a database rollback is usually the safer combination: the
previous build tolerates a newer schema far more often than the reverse. Roll the app back
first, then decide about the data.

---

## Troubleshooting

**`Missing Supabase environment variables`** — the Supabase modules validate at module scope.
Check `.env.local` exists and is loaded; a typo reads as absent.

**API returns 401 from `curl`** — the request carries an `Authorization` header whose key is
unknown, revoked or expired. A keyless `curl` answers 200 on the anonymous tier; since v4.9.0 the
middleware does not fall back to anonymous when a key is present but invalid. Drop the header or
fix the key. A **429** instead means the anonymous per-IP quota (`RATE_LIMIT_IP_RPM`) is spent;
`Retry-After` says for how long.

**`22P02` on `migration_events.event_type`** — migration `037` is not applied on that project.
See [`runbooks/migration-state.md`](./runbooks/migration-state.md).

**`42P17` recursion on an anonymous read** — migration `038` is not applied on that project.
The service-role key masks this, because it bypasses RLS entirely; reproduce with the anon key.

**`no unique or exclusion constraint matching the ON CONFLICT specification`** — migration
`039` is not applied, or `sources_title_key` was dropped by a later table recreation.

**A corpus loads fewer rows than there are files** — a parser rejection, not a database
problem. The preview output reports the per-corpus parse count and a `Failed to parse` line.
Compare against the files on disk before applying.

**A route renders an empty state while row counts are non-zero** — the rows are there and RLS
is blocking the read. Test with the anon key, never the service role.

---

## Related

- [`runbooks/production-deploy.md`](./runbooks/production-deploy.md) — the production host, its secrets, and **rollback**
- [`runbooks/migration-state.md`](./runbooks/migration-state.md) — which migrations are live where
- [`runbooks/afrik-data-sync.md`](./runbooks/afrik-data-sync.md) — loading the corpus
- [`runbooks/restore-procedure.md`](./runbooks/restore-procedure.md) — backup restore, RTO/RPO
- [`runbooks/revisions-dba-bypass.md`](./runbooks/revisions-dba-bypass.md) — overriding the append-only invariant
- [`../CLAUDE.md`](../CLAUDE.md) — architecture and repository conventions
