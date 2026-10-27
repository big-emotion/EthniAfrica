# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-10-22<br>
**Audited checkout:** `origin/recette` at `bb23b8af8` (`chore(ci): retire the Ferry reconciler and daily cost workflows (#1949)`); `main` carries 4 commits recette lacks (the v5.11.0 release merge, a sync PR is owed)<br>
**Overall score:** **7.2 / 10** (was 6.4 on 2026-10-21, 6.5 on 2026-10-13, 7.2 on 2026-10-03)<br>
**Release verdict:** **GO, with one standing P1.** The site is live and healthy: every required gate is green, v5.11.0 deployed with a clean ledger (115 applied · 0 pending · 0 orphaned · 0 drifted), the corpus sync is green on production and recette, and GitHub secret scanning is on. What is still missing is a scheduled backup of the self-hosted databases.

## 1. Scope and method

Full audit (no `--quick`, no `--no-build`), read-only, run in an isolated worktree on `origin/recette`'s tip. Outcomes were read from command output, GitHub run conclusions and job logs, and the branch-protection and repository APIs. Evidence came from three parallel read-only passes (AFRIK integrity, hardcoded values and dead code, security and RLS) plus the long gates and CI reads run directly. Every figure below comes from a command run on this date unless it says otherwise.

**What changed since the previous audit (2026-10-21, same day before the cleanup PRs)**

- **Done:** GitHub secret scanning, push protection and Dependabot security updates enabled (repository API); `ferry-reconcile.yml` and `ferry-cost-daily.yml` retired, with the beta rule export and an old verification artifact (#1949); `migration-state.md` refreshed and `DEPLOYMENT.md` made consistent on rate limiting (#1951); a post-deploy `/api/v2` smoke and an Upstash preflight added to `deploy-production.yml` (#1951); a dead source URL replaced by its archive capture (#1952); the people name index paged past 1,000 rows, `feed/revisions` moved behind a handler, and 6 files of test-only exports removed (#1953).
- **Corrections to the 2026-10-21 report:** four routes (`names/suggest` and three `reference-library` routes) were reported as missing from the OpenAPI document; they are documented inline in `src/lib/api/openapiV2.ts`, and that finding is withdrawn. The full `e2e.yml` failure of 2026-10-19 (11 failures) was already fixed by later PRs and is green on every recent recette run.
- **Shipped:** v5.11.0 (2026-10-21, run 39675146436), deploy `success`.
- **Still open:** no scheduled backup; the nightly `validate` job is still red on `main`; the proxy-trust check was never run; strict-model drift is above zero.

**Measured this run**

| Check                      | Outcome | Evidence                                                                                                                     |
| -------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Lint                       | PASS    | 0 errors, 35 warnings, 1 unused `eslint-disable` (`src/hooks/use-globe-camera.ts:205`)                                       |
| Typecheck / format         | PASS    | `tsc --noEmit` and `prettier --check` clean                                                                                  |
| Unit tests                 | PASS    | 1,151 files passed, 3 skipped; 12,467 tests passed, 21 skipped                                                               |
| Coverage                   | PASS    | 86.90 % statements, 81.18 % branches, 90.28 % functions, 87.98 % lines (thresholds 70/60/70/70, `vitest.config.ts`)          |
| Production build           | PASS    | Compiled in 13.5 s, exit 0; sitemap errors from this worktree's invalid credentials (§6 Domain 7)                            |
| Dead-code ratchet          | PASS    | `check:dead` at every ceiling: exports 7/7, production files 0/0, production dependencies 0/0                                |
| `check:env-example`        | PASS    | 70 env references across 2,450 files, all documented                                                                         |
| `check:local-paths`        | PASS    | Clean                                                                                                                        |
| Action pins                | PASS    | No third-party `uses:` on a mutable ref                                                                                      |
| RLS coverage               | PASS    | `check:rls-coverage` (51 tables, all behind RLS) and an independent replay of 115 migrations agree                           |
| AFRIK validator            | PASS    | 54/54 checks, 0 errors, 15,455 warnings; FR28, FR28-strict, FR28-declared all 0                                              |
| Source Tier coverage       | PASS    | `needs_review` 873 = `NEEDS_REVIEW_RATCHET` 873                                                                              |
| Per-PR gates               | PASS    | Last runs of `ci.yml`, `data-integrity`, `a11y`, `lighthouse`, `e2e`, `openapi-diff` on `recette` PRs `success` (2026-10-21) |
| Production deploy          | PASS    | v5.11.0 run 39675146436: `migrate` applied 115 · pending 0 · orphaned 0 · drifted 0; deploy `success`                        |
| Recette migrations         | PASS    | `migrate-recette.yml` last four runs `success` (2026-10-19)                                                                  |
| Production data sync       | PASS    | Last three runs `success` (latest 2026-10-21T21:05Z)                                                                         |
| Recette data sync          | PASS    | Last three runs `success` (latest 2026-10-21T22:50Z)                                                                         |
| GitHub secret scanning     | PASS    | `secret_scanning`, push protection and Dependabot security updates `enabled`; 0 open secret-scanning alerts                  |
| **Nightly data-integrity** | FAIL    | `validate` red on `main` every night (last 39560329720, 2026-10-21); see §6 Domain 3                                         |
| npm audit                  | WARN    | 12 advisories: 6 high, 6 moderate. Production-only: 1 high (`follow-redirects`, fix available) and 6 moderate                |
| Dependabot                 | WARN    | 2 open alerts                                                                                                                |

**`N/A` (never counted as a pass)**

- `check:migration-state` and `check:migration-state:production` locally: no credentials in the worktree. Production was read from the v5.11.0 `migrate` job log (above). Recette's last logged plan is run 39211338503 (2026-10-19, 114 applied · 1 pending, then migration 115 applied); no post-apply ledger line was captured, so recette's current ledger is not measured.
- AFRIK check 5 (database vs source JSON), directly: no credentials. The green sync runs are indirect evidence only.
- Live RLS on recette and production: both are self-hosted stacks the Supabase MCP cannot see. RLS is scored from the migration replay, and policy roles (public read versus moderator write) were counted, not inspected.
- The new deploy preflight and API smoke (#1951): they run only when a Release is published, and v5.11.0 was published before they merged. They have not run on the real host.
- Production provides `UPSTASH_REDIS_REST_*`: infrastructure state, not readable from the repository. The new preflight will check it at the next Release.
- The client-IP trust behind `TRUSTED_PROXY_HOPS` against the live proxy: no recorded run.
- `.env.example` contents (value hygiene): the audit's permission settings deny reading it; `check:env-example` passes.
- Which browser modules that import `auth-client.ts` call `.from(`; Sentry `tags`: not exhaustively checked.
- Wikipedia citation identification (language, title, consultation date): not audited.
- `npm run dev`, the four `/api/v2` calls, `/docs/api` and the `/en/*` 308 at runtime: not exercised.
- The Jira board's live column names against `ferry-jira-automation-setup.md`: not read.

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Yes, with one standing P1.** The site is live; the release path, the corpus syncs and every required gate are green.

1. **No scheduled backup of either self-hosted database** (`docs/runbooks/restore-procedure.md:21-22`). The 2026-09-22 drill proved the mechanism once; nothing makes a backup exist. Most of the corpus is rebuilt from git, but moderation and account data (flags, revisions, API keys, contributor profiles, the audit log) is not.
2. **The new deploy safety steps are untested on the real host.** The Upstash preflight and `/api/v2` smoke merged after v5.11.0; the next Release is their first real run.
3. **The nightly integrity job is red** on `main`. This is a signal problem, not a production risk: PR runs are green.

### 2.2 Is the AFRIK editorial surface sound?

**Yes at the source, with debt that is tracked.** The corpus is 1,586 fiches (peoples 659, patronymes 776, countries 54, languages 39, families 25, relations 12, dossiers 7, migrations 6, places 5, words 3).

- **Validator:** 54/54 checks, 0 errors, 15,455 warnings (REQ-196 926, FR52 24, REQ-178 1, the rest per-fiche source-catalogue lines).
- **FR28 bands:** FR28, FR28-strict and FR28-declared each report **0 warnings**. No demographic debt.
- **Source Tier P0s: zero.**
  - No source without a tier, no unidentifiable source (`unknown`, `internet`, `wikipedia` as title or URL), no weak domain above `unverified`, no state outside `official | referenced | unverified | needs_review`.
  - The 3 word fiches (`mots/`) carry `"sources": []` at the top level, as `public/modele-mot.json` declares, and source every account under `nameHistory`. Ruled conformant, as before.
- **Tier distribution** across 18,060 source entries: official 3,611 · referenced 10,422 · unverified 3,154 · `needs_review` 873 (ratchet 873).
- **Provenance debt:** 1,211 unreviewed AI-generated citations across 457 fiches (= its ratchet) and 991 sources without `source_kind` (= its ratchet).
- **Direct Wikipedia citations:** 101 entries, all `unverified`. Reported, not a defect (DEC-055).
- **Every layer can store every state:** `SOURCE_TIER_STATES`, the API schema, migration 088's `sources_tier_check` and `recompute_confidence()` (102/103) agree.
- **Referential integrity** (FR26, FR27, FR29, REQ-149) and the **reader-facing register** pass.
- **`data-integrity.yml`** gates every PR into `main` and `recette`, has no `continue-on-error`, and its last PR runs are green.

Failed or unmeasured:

- **Strict-model drift (check 1) fails.** Held by its ratchet and falling: peuple ceiling 5,920 (was 6,249 on 2026-10-13), famille 104, pays 9.
- **Database parity (check 5) and carry-over (check 8) are `N/A`.**
- **The nightly URL check (FR30/31) is red.** On 2026-10-22 a local run with `CHECK_SOURCE_URLS=true` exits 1 on one URL, a Cambridge Core PDF (`…S0021853700003340a.pdf/subimperialism_of_the_baganda.pdf`) that answers with a 302 to a browser user agent, so it may be a bot redirect rather than a dead link. The dead MSU URL fixed in #1952 now passes.

### 2.3 Can a new contributor go clone → running in one session?

**Yes, unchanged.** `npm ci` works with `.npmrc`'s `legacy-peer-deps`; `.env.example` is complete (`check:env-example`: 70 references); the 115 migrations have no duplicate prefix; `--target=local` is the documented contributor path; `scripts/seedAdminAllowlist.ts` seeds the first moderator. Not exercised against a running server: `npm run dev`, the four `/api/v2` calls, `/docs/api`.

### 2.4 What is the security posture?

**Strong in code, and the controls around it are now mostly in place.** In the code (no P0, no P1):

- RLS covers 51 of 51 tables net of drops; the five deny-all tables each carry their comment.
- The CSP nonce is per request (`btoa(crypto.randomUUID())`, `src/proxy.ts:527`); HSTS preload, nosniff and strict referrer policy apply to every response.
- API keys use PBKDF2-SHA256, 600,000 iterations, 16-byte salt, constant-time comparison (`src/lib/api/auth.ts:15-16`).
- Rate limiting runs on Upstash per tier and fails closed in production without credentials (`rate-limit.ts:212-236`); no in-memory-only limiter.
- All 9 mutating v2 routes are gated or public by documented design (`/keys/issue`, `POST /flags`).
- Sentry asserts an EU DSN in all three configs and turns off default PII collection; only the client config scrubs transactions (P2).
- The service-role client stays out of the browser (`import "server-only"`); `createBrowserClient` appears only in `auth-client.ts`.

Around the code:

- **Closed:** GitHub secret scanning, push protection and Dependabot security updates are `enabled`; 0 open secret-scanning alerts.
- **Open:** proxy-trust check never run; 1 high advisory in production dependencies (`follow-redirects`, fix available); the 2026-09 rollback-key exposure's Postgres password rotation was recorded as "not verified" and was not re-read.
- Branch protection on both branches requires a pull request and eight status checks, with `enforce_admins` on; `main` is `strict`, `recette` is not; neither requires an approval.

### 2.5 Is the score close to 8–9/10?

**7.2/10, 0.8 below the 8.0 floor of the target.** Three actions close most of the distance:

1. Schedule a daily off-host backup (Domain 10, and Domain 5 by reference).
2. Make the nightly `validate` green again: ship #1952 to `main` with the next Release and decide what the URL check does with a publisher that answers a bot with a redirect (Domain 3).
3. Run the proxy-trust check, fix the `follow-redirects` advisory and add the server and edge Sentry transaction scrubber (Domain 1).

## 3. Overall score

Ten domains, equal weight: **72 / 100 = 7.2 / 10**. No P0 in the corpus or the security surface. One P0 by the skill's hardcoded-values rubric (key-issuance throttle) that the owner decided not to change; it costs −1 on Domains 5 and 7. Domain 8 has one failed check and two `N/A` out of eight.

## 4. Score per domain

|   # | Domain                             | Score | Change | Rationale                                                                                                                                  |
| --: | ---------------------------------- | ----: | :----: | ------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | Security posture                   | **8** |   –    | No P0/P1 in code; RLS 51/51; proxy trust unverified; 1 production high advisory with a fix; server and edge Sentry transactions unscrubbed |
|   2 | Secrets hygiene                    | **8** |   +2   | Secret scanning, push protection and Dependabot security updates on, 0 alerts; no scheduled history scan; rollback-key rotation unverified |
|   3 | CI                                 | **7** |   +1   | Required checks green, every action pinned, full e2e green on recent runs; nightly `validate` still red on `main`                          |
|   4 | Correctness & tests                | **8** |   –    | 12,467 tests, coverage 87/81/90/88; −1 for 7 files of exports kept alive only by tests (Step 3.7)                                          |
|   5 | Deploy coherence                   | **8** |   +1   | v5.11.0 green, ledger 115 clean, production sync green, preflight and smoke added (not yet run on the host); −1 hardcoded (Step 3.5)       |
|   6 | Ferry pipeline                     | **6** |   +1   | No-op workflows retired, config parses, pins consistent; router last ran 2026-09-12, Jira column names not re-read                         |
|   7 | Architecture & boundaries          | **7** |   +1   | Three-layer rule holds, OpenAPI complete, name index paged; −2 stacked from Steps 3.5 and 3.7                                              |
|   8 | AFRIK data integrity & Source Tier | **6** |   –    | One failed check (strict-model drift, ceiling 5,920) and two `N/A` (database parity, carry-over); zero Source Tier P0s; FR28 debt at zero  |
|   9 | Performance & accessibility        | **7** |   +1   | Lighthouse and smoke gates required and green, full e2e green; 0.85 target only warns and `/fr/atlas/recherche` scores 0.66–0.72           |
|  10 | Documentation & runbooks           | **7** |   +1   | Ledger doc and limiter text fixed, OpenAPI complete; still no scheduled backup                                                             |

**Severity harmonisation.** The missing backup is counted once, in Domain 10 (its cause), and referenced from Domain 5. The hardcoded P0 is an owner decision recorded in the code, but the rubric prices it mechanically, so it is counted and flagged as accepted. The two Domain 7 penalties (hardcoded values and dead code) are stacked because the rubric assigns each step's impact to Domain 7 independently; no hotspot appears in both steps.

## 5. Strengths

- **The release path is dependable.** Ten Releases since 2026-10-13, every deploy green, every `migrate` job clean, production at 115 migrations.
- **The data plane is healthy:** production and recette syncs green on their last runs, with the 5 % prune cap as a safety net.
- **Secrets controls are now on:** GitHub secret scanning and push protection are enabled, there are no open alerts, and every action is SHA-pinned.
- **The test suite is large and steady:** 12,467 tests, coverage above thresholds on all four axes, full e2e green.
- **The editorial contract is clean at the source.** FR28 debt at zero, no Source Tier P0, ratchets falling without a ceiling being raised.
- **RLS is complete by construction:** 51 tables, none without RLS, every deny-all documented, and the repository's own gate agrees with an independent replay.
- **Unused code is shrinking:** production-mode unused-export files went from 13 to 7 in one PR.

## 6. Gaps and risks

### Domain 1 — Security posture

- **P1, unchanged:** `TRUSTED_PROXY_HOPS` (default 1) has not been checked against the live proxy chain. `clientIp()` (`src/lib/api/clientIp.ts:20-50`) counts `X-Forwarded-For` from the right; `production-deploy.md` records no spoofed-header run.
- **P2, new:** `npm audit --omit=dev` finds 1 high advisory, `follow-redirects` (cross-origin credential stripping and sensitive-header exposure), with a fix available, plus 6 moderate. All other highs are in dev chains.
- **P2, new:** the Sentry server and edge configs set `beforeSend` but no `beforeSendTransaction`, unlike the client (`sentry.client.config.ts:46-48`), while both sample transactions at 0.1 in production (`sentry.server.config.ts:26`, `sentry.edge.config.ts:23`). Transactions carry request URLs and query strings.
- **P2, not re-verified fixed:** `POST /api/v2/keys` lets a signed-in user mint keys for themselves with no per-user cap; the anonymous `keys/issue` route is bounded (5 an hour per IP, one live key per IP, fails closed).
- **P2:** `style-src 'unsafe-inline'` and `style-src-attr 'unsafe-inline'` on public `/fr/*` pages (`src/proxy.ts:164-178`), a documented follow-up.
- **P3:** read-quota limiting fails open on an Upstash outage by design, logged and sent to Sentry (`rate-limit.ts:247-250`); `verifyHashedKey` accepts any stored iteration count (`auth.ts:12-14`).
- **Closed:** the post-deploy `/api/v2` smoke and an Upstash preflight now exist in `deploy-production.yml` (`:328-337`, `:423-434`); the preflight prints variable names only. Their first real run is the next Release.

### Domain 2 — Secrets hygiene

- **Closed:** GitHub secret scanning, push protection and Dependabot security updates are `enabled` (repository API, 2026-10-22); 0 open secret-scanning alerts.
- **P2:** no scheduled full-history gitleaks workflow; GitHub's own scanning replaces the one-off need, and CI's gitleaks (a required check on both branches) reads the PR tree.
- **P2, residual:** the rollback-project service-role JWT commits recorded in `secret-exposure-audit-2026-09.md` may still be fetchable from GitHub by SHA; the Postgres password rotation was recorded as "not verified" and was not re-read.
- **Pass:** only `.env.example` and `e2e/.env.example` are tracked. The working-tree secret grep is clean on the last run's single false positive (`PAT_BABIRYE.json`, an encrypted record id in a public URL). `check:local-paths` is green.

### Domain 3 — CI

- **P1, standing: the nightly `data-integrity.yml` `validate` job is red on `main` every night** (latest 39560329720, 2026-10-21). #1952 (on `recette`) replaced a dead MSU URL; `main` will not carry it until the next Release. A local `CHECK_SOURCE_URLS=true` run on 2026-10-22 now exits 1 on a different URL, a Cambridge Core PDF that answers a plain request with a 302 (§2.2). Whether CI sees the same redirect was not measured (N/A).
- **P2:** the last cancelled runs on 2026-10-21 (`ci.yml`, `a11y.yml`, `lighthouse.yml`, `e2e.yml`) were superseded by a newer push; the replacement runs are green.
- **P2, unchanged:** `recette` protection is `strict: false`; neither branch requires an approval. Eight contexts are required on both: gitleaks, build, validate, openapi-diff, dependency-audit, axe-core (Storybook), Playwright smoke (fr, 430px), Lighthouse gate.
- **P2, unchanged:** `migrate-recette.yml:65` carries a `continue-on-error: true` step, and a missing `RECETTE_SUPABASE_URL` is turned into a warning that lets the run pass.
- **P2:** 2 open Dependabot alerts.
- **Resolved:** the full `e2e.yml` is green on every recent recette PR run (it failed on 2026-10-19 with 11 failures, fixed by later PRs); no third-party action sits on a mutable ref.

### Domain 4 — Correctness & tests

- Stray `console.*` in shipped UI: the same 4 calls (`src/app/[lang]/error.tsx:21`, `src/app/docs/api/v2/page.tsx:38`, `src/components/ContributionFormFields.tsx:78,110`). 18 `console.*` calls outside tests in total; 54 TODO/FIXME/XXX/HACK matches.
- 1 unused `eslint-disable` (`src/hooks/use-globe-camera.ts:205`).
- Dead-code P1 items (below) are in the 6–15 band, so −1.

### Domain 5 — Deploy coherence

- **Pass:** `vercel.json` keeps `git.deploymentEnabled: false`; `deploy-production.yml` runs on `release: published` only; 115 migrations, no duplicate prefix; production's ledger is clean; `main` and `recette` each lack the other's last commits (4 and 7), so a v5.11.0 sync PR is owed.
- **P2, unchanged:** `check:migration-state` without credentials prints a refusal and does not fail loudly.
- **Hardcoded values:** one owner-accepted P0 and 15 P1 groups (below), costing −1 here and in Domain 7.

### Domain 6 — Ferry pipeline

- **P2:** `ferry-router.yml` last ran on 2026-09-12 (failure, success, failure). It is kept on purpose for occasional use; its Jira columns and `FERRY_AUDIT_ISSUE` variable were not re-read against the live board (N/A).
- **Resolved:** `ferry-reconcile.yml` and `ferry-cost-daily.yml` are deleted (#1949), with the beta rule export and an old verification artifact; the Ferry tests still pass. `ferry.config.yaml` parses and `base_branch` and `target_branch` are both `recette`.

### Domain 7 — Architecture & boundaries

- **Resolved:** the people name index pages through `walkRanges` (`NAME_INDEX_PAGE_SIZE = 1000`, `src/api/v2/services/peopleService.ts:70`); `feed/revisions` goes through `feedRevisionsHandler`; no `src/app/api/v2/**/route.ts` imports Supabase or a query service (four routes import only Cache-Control constants from `corpusCache`).
- **Resolved:** OpenAPI coverage. Of 51 route files, 47 carry a JSDoc block and 4 (`names/suggest`, `reference-library`, `reference-library/assertions`, `reference-library/assets`) are documented inline in `openapiV2.ts`; none is undocumented. Block contents were not validated.
- **P2, observation:** the local production build logs `Sitemap: could not read ids from afrik_*` with `Unauthorized` and still exits 0. The credentials in this worktree are not valid, so this does not describe the real build, but a build with bad credentials would ship an empty sitemap without failing.
- Penalties: Step 3.5 gives −1 (1 P0, 15 P1 groups), Step 3.7 gives −1 (7 files of unused exports); stacked, −2 against a base of 9.

### Domain 8 — AFRIK data integrity and Source Tier

- **P1:** strict-model drift is a standing failure held by its ratchet: peuple 5,920, famille 104, pays 9. The ceiling is lowered in the same change as each burn-down.
- **Unmeasured:** database parity (check 5) and the known-issues carry-over (check 8, no `data_quality_status.md`).
- **Reported:** 101 direct Wikipedia URLs, all `unverified`; identification and crossed-language notes not audited.
- **Debt:** `needs_review` 873 (ratchet 873); 1,211 unreviewed AI-generated citations (ratchet 1,211); 991 sources without `source_kind` (ratchet 991); FR52-coverage 24 (advisory, the only entry in `SOFT_CHECK_NAMES`); REQ-196 `nameHistory` 926.

### Domain 9 — Performance and accessibility

- **P2:** the 0.85 performance target is a warning and 0.73 is enforced in the nightly matrix; the PR gate warns at 0.85. In the last five "Lighthouse gate" runs (2026-10-19 to 10-21), mobile performance passed 0.85 on one route only (`/decouvertes/origine-du-nom-mande`); the others scored 0.66 to 0.81. `/fr/atlas/recherche`, the central surface, scored 0.66 to 0.72, below the nightly floor of 0.73 (single-run samples; the nightly uses three runs).
- **Pass:** "Lighthouse gate" and "Playwright smoke (fr, 430px)" are required and green; axe-core (Storybook) is required, green, with no `continue-on-error`; the full e2e is green.

### Domain 10 — Documentation and runbooks

- **P1, standing: no scheduled backup of either database** (`restore-procedure.md:21-22`); no `pg_dump` or backup workflow exists in `.github/workflows` or `scripts/`. The RPO ≤ 24 h the same document declares cannot be met. Recette has never been drilled; the last production drill (2026-09-22) is next due 2026-12-22 (`:270`), not past.
- **Resolved:** `docs/runbooks/migration-state.md` now says "Last verified 2026-10-20" with production 115 · 0 · 0 · 0 and recette recorded as not re-measured; the `DEPLOYMENT.md` limiter text is consistent with `rate-limit.ts`.
- **N/A:** the operator's `data_quality_status.md` carry-over note does not exist.
- Pass: `ETNI` is the Jira key in `docs/confluence-spec/config.json`; no literal `(owner)` placeholder in `docs/` or the README.

### Hardcoded values (P0/P1)

1 P0 (owner-accepted), 15 P1 groups (about 35 if the repeated `500` page-size literal in 12 files is counted per file). Most of the tuning surface is env-driven with a documented default (`RATE_LIMIT_*`, `SUPABASE_REQUEST_TIMEOUT_MS`, anti-bot difficulty and TTL). No Supabase, Upstash or Sentry URL literal in `src`; no role or tier string drift. About 150 P2 internal constants.

**Rate-limit & Quota Thresholds**

- **P0 (owner-accepted)** `src/lib/api/rate-limit.ts:72,163` — `KEY_ISSUANCE_ATTEMPTS_PER_HOUR = 5`, window `"1 h"` — the one limiter with no env override. The code records a fixed limit as a deliberate decision; the rubric prices it mechanically.

**Cache TTLs**

- **P1** `src/api/v2/services/corpusCache.ts:15` — `CORPUS_AGGREGATE_REVALIDATE_SECONDS = 3600`.
- **P1** `src/api/v2/services/corpusCache.ts:39,46,51,59` — `s-maxage=86400`, `60` + `stale-while-revalidate=30`, `max-age=86400` — fixed per resource.
- **P1** `export const revalidate = 3600` at 9 sites (`src/app/sitemap.ts:51`, the `[lang]` atlas, liens and comparer pages). Next requires a literal for segment config, so these cannot be env-driven.

**Pagination & Batch Sizes**

- **P1** `src/api/v2/schemas/pagination.ts:16` — `MAX_PAGE_SIZE = 100`.
- **P1** the `500` page and walk size repeated across 12 files under `src/lib/supabase/queries/afrik/` and `src/api/v2/services/`.
- **P1** `src/api/v2/services/peopleService.ts:70` (`NAME_INDEX_PAGE_SIZE = 1000`), `sourcesFacet.ts:110` (`CHOICES_PAGE_SIZE = 1000`), `languagesFacet.ts:84` (`LANGUAGE_ROSTER_SIZE = 900`), `quizService.ts:68` (`FILTER_BUDGET = 8000`).
- **P1** `src/app/[lang]/dossiers/migrations/page.tsx:63` (`MAX_MIGRATIONS = 500`) and `src/app/[lang]/dossiers/regards/colonisation-et-resistances/page.tsx:39` (`TIMELINE_LIST_LIMIT = 200`).

### Dead code & redundancy

`check:dead` passes at every ceiling. `knip --production`: 0 unused files, 0 unused dependencies, 12 unused exports, 2 unused types. No surviving V1 import. 0 P0.

**P1** — unused exports in `src/lib` (7 files, down from 13), none imported by production code; several are kept because real tests use them, which the default-mode ratchet counts as used:

- `src/lib/afrik/parsers/patronymeParser.ts` — `PATRONYME_NAME_SYSTEMS`.
- `src/lib/approach/sources.ts` — `allApproachSources`, `approachClaimSources`, `approachClaimFiches`.
- `src/lib/fiche/onwardGroups.ts` — `patronymeOnwardGroups`; `src/lib/patronymes/content.ts` — `readOrigin`.
- `src/lib/routing.ts` — `PAGE_TYPES`, `NOMMER_CHAPTER_KEYS`.
- `src/lib/search/searchVocabulary.ts` — `SEARCH_RESULT_GROUPS`; `src/lib/search/searchedName.ts` — `answersToSearch`.

**P2**

- `SEARCH_EMPTY_LINK_LABEL`, unused shadcn primitives, and unused types `ArticleRecord` and `NameRecordDossier`.
- jscpd on `src/` without tests and stories: 2.39 % duplicated lines (251 clones, 31 of at least 30 lines). No block of 30 lines or more spans three files in logic code. The best extraction candidate is `atlas/langues/page.tsx:160` ↔ `atlas/peuples/page.tsx:172` (49 lines) and `:236` ↔ `:257` (46 lines).

## 7. Consumer and contributor flow

| Step                                    | Verdict | Evidence                                                                                  |
| --------------------------------------- | :-----: | ----------------------------------------------------------------------------------------- |
| `git clone` + `npm ci`                  |  PASS   | `.npmrc` `legacy-peer-deps=true`; a stale `node_modules` must be reinstalled after a bump |
| `.env.example` → `.env.local`           |  PASS   | `check:env-example` green, 70 references                                                  |
| Migrations apply in order               |  PASS   | 115 files, no duplicate prefix; production ledger clean, recette's post-apply read `N/A`  |
| Local stack + corpus (`--target=local`) |  PASS   | README, `afrik-data-sync.md` "Local bootstrap" (documented; not re-run)                   |
| First moderator                         |  PASS   | `scripts/seedAdminAllowlist.ts`, `moderation-access.md`                                   |
| `npm run dev` / API smoke / `/docs/api` |   N/A   | Not booted this run; `next build` compiled every route                                    |
| `/admin` allowlist-only                 |  PASS   | `getModeratorSession()` checks the session then `admin_allowlist` (`moderator.ts:31-47`)  |

## 8. Security posture

| Control                | Verdict | Evidence                                                                                                          |
| ---------------------- | :-----: | ----------------------------------------------------------------------------------------------------------------- |
| CSP / headers          |  PASS   | Per-request nonce (`src/proxy.ts:527`), HSTS preload, nosniff, strict referrer, `frame-ancestors 'self'`          |
| Locale                 |  PASS   | `/en/*` → 308 to the French page (`proxy.ts:566-568`); other two-letter segments → `/fr`; static review only      |
| API keys               |  PASS   | PBKDF2-SHA256 600,000 iterations, 16-byte salt, constant-time compare; invalid key → 401                          |
| Key minting            |  WARN   | Signed-in users mint keys for themselves with no per-user cap (P2, not re-verified fixed)                         |
| Rate limiting          |  PASS   | Upstash per tier, fail-closed without credentials in production, no in-memory fallback                            |
| Client-IP trust        |  WARN   | Single `clientIp()`; no recorded check against the live proxy                                                     |
| CORS                   |  PASS   | Single configured origin, no `*`, no credentials, `Vary: Origin`                                                  |
| Service-role isolation |  PASS   | `import "server-only"`; no `admin` import outside `api/`/`admin/`; `createBrowserClient` only in `auth-client.ts` |
| Sentry                 |  WARN   | EU DSN asserted in all three configs, default PII collection off; server and edge lack a transaction scrubber     |
| RLS                    |  PASS   | 51/51 net of drops; five deny-all tables, each commented                                                          |
| Secrets                |  PASS   | Secret scanning and push protection enabled, 0 alerts; CI gitleaks required; no scheduled history scan            |
| Supply chain           |  WARN   | No mutable action ref; 1 production high advisory with a fix; Dependabot security updates enabled, 2 open alerts  |
| Branch protection      |  PASS   | Eight required contexts on both branches; `main` strict, `recette` not; zero approvals; `enforce_admins` true     |

**RLS coverage, net of drops** (115 migrations; 51 surviving tables; walked in filename order, `DROP TABLE` removes, `DROP POLICY` removes):

| Table                                                                                            | Last created | RLS enabled in | Net policies | Notes                         |
| ------------------------------------------------------------------------------------------------ | -----------: | -------------: | -----------: | ----------------------------- |
| admin_allowlist                                                                                  |          074 |            074 |            0 | Deny-all, commented           |
| antibot_challenges                                                                               |          048 |            048 |            0 | Deny-all, commented           |
| flag_reporter_contacts                                                                           |          075 |            075 |            0 | Deny-all, commented           |
| search_query_log                                                                                 |          050 |            050 |            0 | Deny-all, commented           |
| source_tier_ruling_drafts                                                                        |          090 |            090 |            0 | Deny-all, commented           |
| afrik_countries, afrik_language_families, afrik_languages, afrik_peoples, afrik_people_countries |          006 |            019 |       1 each | Public read                   |
| afrik_places, afrik_place_peoples                                                                |          100 |            100 |       1 each | Public read                   |
| afrik_place_countries                                                                            |          106 |            106 |            1 | Public read                   |
| afrik_words                                                                                      |          104 |            104 |            1 | Public read                   |
| afrik_recorded_words                                                                             |          115 |            115 |            1 | Public read                   |
| afrik_dossiers                                                                                   |          082 |            082 |            1 | Public read                   |
| afrik_media                                                                                      |          073 |            073 |            1 | Public read                   |
| afrik_patronyme_alliances                                                                        |          061 |            061 |            1 | Public read                   |
| afrik_patronyme_bearers                                                                          |          093 |            093 |            1 | Public read                   |
| afrik_patronymes, afrik_patronyme_countries, afrik_patronyme_peoples                             |          053 |            053 |       1 each | Public read                   |
| afrik_patronyme_persons                                                                          |          064 |            064 |            1 | Public read                   |
| afrik_people_languages                                                                           |          054 |            054 |            1 | Public read                   |
| afrik_people_relations                                                                           |          030 |            030 |            1 | Public read                   |
| afrik_translations                                                                               |          085 |            085 |            1 | Public read                   |
| api_keys                                                                                         |          012 |            012 |            1 | Owner read                    |
| assertion_references                                                                             |          031 |            040 |            1 | Public read                   |
| assertions, confidence_scores, sources                                                           |          009 |            015 |       1 each | Public read                   |
| audit_log                                                                                        |          009 |            009 |            2 | Read `USING (true)` by design |
| contributor_profiles                                                                             |          023 |            026 |            3 | Read `USING (true)` by design |
| editorial_doctrine                                                                               |          009 |            017 |            4 | Read + anon no-write          |
| fiche_revisions                                                                                  |          020 |            020 |            1 | Public read                   |
| flags                                                                                            |          009 |            022 |            3 | Read `USING (true)` by design |
| migration_events, migration_event_peoples                                                        |          035 |            035 |       4 each | Read + moderator writes       |
| oral_narratives, oral_narrative_links                                                            |          032 |            032 |       1 each | Public read                   |
| persons, person_countries, person_peoples                                                        |          057 |            057 |       1 each | Public read                   |
| protected_records, protected_record_audit                                                        |          033 |            033 |       1 each | Editorial select              |
| quiz_questions, quiz_generation_runs                                                             |          036 |            036 |       1 each | Public read                   |
| revision_drafts                                                                                  |          023 |            023 |            4 | Moderator CRUD                |
| revisions                                                                                        |          009 |            021 |            2 | Read + moderator insert       |
| source_working_assets                                                                            |          034 |            034 |            5 | Owner + editor                |
| user_roles (legacy)                                                                              |          008 |            008 |            4 | Opens no door in the console  |

No `RLS = No` row; no RLS-enabled table without either a policy or a deny-all comment. Policy contents (public-read versus moderator-write) were not inspected this run; only counts and the deny-all comments. The 2026-10-21 report counted `contributor_profiles` at 1 policy; the replay of this run gives 3, matching the 2026-10-13 audit.

## 9. Performance and accessibility posture

| Control             | Verdict | Evidence                                                                                                             |
| ------------------- | :-----: | -------------------------------------------------------------------------------------------------------------------- |
| Lighthouse PR gate  |  PASS   | Required context "Lighthouse gate"; last `recette` runs `success`                                                    |
| Lighthouse budgets  |  WARN   | a11y = 1 and BP ≥ 0.95 enforced; performance enforced at 0.73 nightly, the 0.85 target only warns                    |
| Lighthouse measured |  WARN   | Last 5 gate runs: only `/decouvertes/origine-du-nom-mande` ≥ 0.85; `/fr/atlas/recherche` 0.66–0.72, others 0.75–0.81 |
| axe-core            |  PASS   | Required context "axe-core (Storybook)"; last runs green, no `continue-on-error`                                     |
| E2E                 |  PASS   | Required "Playwright smoke (fr, 430px)" green; full `e2e.yml` green on every recent `recette` PR run                 |
| Locale posture      |  PASS   | French only; retired English URLs redirect with 308 (static review)                                                  |

## 10. AFRIK data integrity and Source Tier compliance

Corpus: 1,586 fiches — peoples 659, patronymes 776, countries 54, languages 39, families 25, relations 12, dossiers 7, migrations 6, places 5, words 3.

|   # | Required check          | Verdict | Change | Evidence                                                                                                                                                                                                     |
| --: | ----------------------- | :-----: | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | Strict model adherence  |  FAIL   |   –    | 10-fiche sample: no undeclared key. Drift held by ratchet: peuple 5,920 (was 6,249), famille 104, pays 9; sampled fiches omit optional keys (`externalIdentifiers`, `historicalAffiliation`, `searchAnswer`) |
|   2 | Full validator          |  PASS   |   –    | 54/54, 0 errors, 15,455 warnings. FR28 0 · FR28-strict 0 · FR28-declared 0. `SOFT_CHECK_NAMES` = `FR52-coverage` only                                                                                        |
|   3 | Referential integrity   |  PASS   |   –    | FR26 (folder and `languageFamilyId`), FR27, FR29 (ISO), REQ-149 all ok, 0 errors                                                                                                                             |
|   4 | Source Tier compliance  |  PASS   |   –    | official 3,611 · referenced 10,422 · unverified 3,154 · `needs_review` 873 · missing 0 · other 0 (18,060 entries). 0 P0. Layers agree. 101 direct Wikipedia URLs, all `unverified`                           |
|   5 | Database vs source JSON |   N/A   |   –    | No credentials. Recette and production syncs green on their last runs (indirect evidence only)                                                                                                               |
|   6 | CI enforcement          |  PASS   |   –    | `data-integrity.yml` on every PR into `main`/`recette`, no `continue-on-error`, last PR runs green. The nightly on `main` is red (Domain 3), which sits outside the PR gate                                  |
|   7 | Reader-facing register  |  PASS   |   –    | 0 hits across `gaps[].reason`, `sources[].title`, `sources[].notes` for every French and English pattern (the audit's own regex port of `readerRegister.ts`)                                                 |
|   8 | Known-issue carry-over  |   N/A   |   –    | No `data_quality_status.md` in the session memory. Live ceilings read instead: `NEEDS_REVIEW_RATCHET` 873, strict-model ceilings above                                                                       |

**One failed check and two `N/A` band Domain 8 at 7–8 by the letter of the rubric; scored 6** because both `N/A` checks are the two that would show database drift and legacy issues. No Source Tier P0; FR28 debt at zero.

## 11. Prioritized actions

| Priority | Finding                         | Action                                                                                                                                  | Done when                                                                    |
| -------: | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
|        1 | D10 / D5 (no scheduled backup)  | Cron `pg_dump -n public -n private -Fc` on the host, copy off-host, 14-day retention; keep the quarterly Path C drill (unticketed)      | A dated backup ≤ 24 h old exists off the VPS                                 |
|        2 | D3 (nightly `validate` red)     | Ship #1952 to `main` with the next Release; decide how the URL check treats a publisher that answers a bot with a redirect (unticketed) | The 02:00 schedule is green                                                  |
|        3 | D5 (new deploy steps unproven)  | Watch the first Release that carries the Upstash preflight and `/api/v2` smoke (unticketed)                                             | A Release run shows both steps passing on the host                           |
|        4 | D1 (proxy trust)                | Run the spoofed `X-Forwarded-For` check against production and record it in `production-deploy.md` (unticketed)                         | The stored address is the real caller's, and the run is dated in the runbook |
|        5 | D1 (production high advisory)   | Fix `follow-redirects` (`npm audit fix` or a targeted bump) (unticketed)                                                                | `npm audit --omit=dev` reports 0 high                                        |
|        6 | D9 (search page performance)    | Measure and improve mobile performance of `/fr/atlas/recherche` (0.66–0.72), then decide the enforced Lighthouse floor (unticketed)     | The search page clears the nightly floor on three runs                       |
|        7 | D8-1 (strict-model drift)       | Keep filling the declared keys on peoples and families, lowering the ceilings each pass (peuple 5,920, famille 104)                     | Ceilings trend down without raising                                          |
|        8 | D1 (Sentry transactions)        | Add `beforeSendTransaction` to the server and edge Sentry configs (unticketed)                                                          | A test shows transactions are scrubbed on all three runtimes                 |
|        9 | D1 (key minting)                | Cap active keys per user and route `POST /api/v2/keys` through `applyKeyIssuanceRateLimit` (unticketed)                                 | A test proves the cap                                                        |
|       10 | D2 (2026-09 exposure)           | Confirm the leaked Postgres password was rotated and record it in `secret-exposure-audit-2026-09.md` (unticketed)                       | The audit doc records a dated rotation                                       |
|       11 | D4 / D7 (7 unused-export files) | Un-export or relocate the test-only exports where no test guards real behaviour (unticketed)                                            | `knip --production` lists none of them                                       |
|       12 | Process (branch sync)           | Open the `main` → `recette` sync PR for the v5.11.0 release merge (merge commit, not squash) (unticketed)                               | `git rev-list origin/recette..origin/main` is 0                              |
|       13 | D6 (Ferry)                      | Re-read the Jira column names against `ferry-jira-automation-setup.md` the next time the router is used (unticketed)                    | The doc and the live board agree                                             |
|       14 | D8 (Wikipedia citations)        | Cite the primary sources behind the 101 direct Wikipedia URLs where one exists                                                          | The count trends down                                                        |
|       15 | D7 (hardcoded groups)           | Only if the owner changes the decision: env override for the key-issuance throttle and the pagination caps (unticketed)                 | The −1 Step 3.5 penalty is lifted                                            |

**Closed since 2026-10-21:** GitHub secret scanning and push protection (previous action 2); the OpenAPI "gap" (withdrawn, it was a mis-measurement); the people name index cap; the `feed/revisions` layering; the stale ledger and limiter docs; the missing post-deploy API smoke and Upstash preflight (added, first real run pending); the no-op Ferry workflows.

## 12. Conclusion

The site is live and sound:

- Ten Releases since 2026-10-13, each deployed green with a clean migration ledger; production at 115 migrations.
- 12,467 tests, coverage above every threshold, full e2e green, every action pinned, RLS on all 51 tables.
- An editorial corpus with zero Source Tier P0s and zero demographic debt, and ratchets that moved down, not up.
- Secret scanning and push protection are now on, and the corpus syncs on both stacks are green.

What holds the score at 7.2 is short: a scheduled backup, a nightly integrity job that has been red long enough to be ignored, a proxy-trust check never run on the real host, and drift ratchets that are still above zero. The first three are small, infrastructure-level jobs. Closing actions 1–5 would put the score near 8.2.
