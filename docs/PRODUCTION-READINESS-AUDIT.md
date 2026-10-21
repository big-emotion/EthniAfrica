# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-10-21<br>
**Audited checkout:** `origin/recette` at `6ca5a8517` (`docs(productions): record the Touareg video of 21 October 2026 (#1940)`), merged with `origin/main` at `e8fbcf113` (v5.10.0 release merge, sync PR #1941); 9 Releases shipped since the last audit, v5.2.0 → v5.10.0<br>
**Overall score:** **6.4 / 10** (was 6.5 on 2026-10-13, 7.2 on 2026-10-03, 7.6 on 2026-09-22)<br>
**Release verdict:** **CONDITIONAL GO.** The blocker of the last audit is closed: production's corpus sync is green again and the ledger is clean at 115 migrations. Two standing P1s remain that a production incident would expose: no scheduled backup of either self-hosted database, and GitHub secret scanning off on a public repository. The nightly data-integrity job has been red on `main` for 8 straight nights.

## 1. Scope and method

Full audit (no `--quick`, no `--no-build`), read-only, run in an isolated worktree on `origin/recette`'s tip plus the pending main→recette sync. Outcomes were read from command output, GitHub run conclusions and job logs, and the branch-protection and repository APIs. Evidence was gathered in three parallel read-only passes (AFRIK integrity, hardcoded values and dead code, security and RLS) plus the long gates and CI reads run directly. Every figure below comes from a command run on this date unless it says otherwise.

**What changed since 2026-10-13**

- **Shipped:** Releases v5.2.0 → v5.10.0, the last (v5.10.0, run 39512649677, 2026-10-20) with a green deploy and a green `production-data-sync.yml` after it. Production's `migrate` job reads **applied 115 · pending 0 · orphaned 0 · drifted 0**.
- **Closed:** production's corpus sync (blocker of the last audit): green on the last three runs, including a manual dispatch on 2026-10-19 (39226841082). Recette's data sync is green on its last five runs. The nightly `migration-state` job passes.
- **Improved:** strict-model drift ceiling for peoples 6,249 → 5,920; `needs_review` 890 → 873; open Dependabot alerts 4 → 2.
- **Still open:** no scheduled backup; secret scanning and push protection disabled; proxy-trust check and post-deploy `/api/v2` smoke never added; nightly `validate` red; the router/reconciler pair does nothing.
- **New:** 11 failing tests in the full `e2e.yml` (not a required check); one P0 and ten P1 hardcoded values by the skill's rubric; 4 routes missing from the OpenAPI document.

**Measured this run**

| Check                      | Outcome | Evidence                                                                                                                      |
| -------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Lint                       | PASS    | 0 errors, 35 warnings, 1 unused `eslint-disable` (`use-globe-camera.ts:205`)                                                  |
| Typecheck / format         | PASS    | `tsc --noEmit` and `prettier --check` clean                                                                                   |
| Unit tests                 | PASS    | 1,152 files passed, 3 skipped; 12,472 tests passed, 21 skipped (`npm test` and `npm run test:coverage`)                       |
| Coverage                   | PASS    | 86.88 % statements, 81.18 % branches, 90.32 % functions, 87.96 % lines (thresholds 70/60/70/70, `vitest.config.ts:56-62`)     |
| Production build           | PASS    | Compiled in 28.0 s, exit 0; see the sitemap note in §6 Domain 7 (local credentials returned `Unauthorized`)                   |
| Dead-code ratchet          | PASS    | `check:dead` at every ceiling: exports 7/7, production files 0/0, production dependencies 0/0                                 |
| `check:env-example`        | PASS    | 70 env references across 2,452 files, all documented                                                                          |
| `check:local-paths`        | PASS    | Clean                                                                                                                         |
| Action pins                | PASS    | No third-party `uses:` on a mutable ref (`git grep` returns nothing)                                                          |
| RLS coverage               | PASS    | `check:rls-coverage` (51 tables, all behind RLS) and an independent replay of 115 migrations agree                            |
| AFRIK validator            | PASS    | 54/54 checks, 0 errors, 15,455 warnings; FR28, FR28-strict, FR28-declared all 0                                               |
| Source Tier coverage       | PASS    | `needs_review` 873 = `NEEDS_REVIEW_RATCHET` 873                                                                               |
| Per-PR gates               | PASS    | Last runs of `ci.yml`, `data-integrity`, `a11y`, `lighthouse`, `openapi-diff`, `migrations-replay` on `recette` all `success` |
| Production deploy          | PASS    | v5.10.0 run 39512649677: `migrate` applied 115 · pending 0 · orphaned 0 · drifted 0; deploy `success`                         |
| Recette migrations         | PASS    | `migrate-recette.yml` last three runs `success` (2026-10-19)                                                                  |
| Production data sync       | PASS    | Last three runs `success` (latest 39513199922, 2026-10-20); two earlier runs on 2026-10-19 were red                           |
| Recette data sync          | PASS    | Last five runs `success`, latest 2026-10-21                                                                                   |
| **Nightly data-integrity** | FAIL    | `validate` red on `main` 8 nights of 8 (2026-10-14 → 10-21, last 39560329720); `migration-state` and quiz-bank jobs pass      |
| **Full e2e**               | FAIL    | `e2e.yml` red on its last 3 `recette` runs: 11 failed, 14 skipped, 412 passed (39311423184). Not a required check             |
| npm audit                  | WARN    | 12 advisories: 6 high, 6 moderate. Production-only split not re-run (N/A)                                                     |
| GitHub secret scanning     | FAIL    | `secret_scanning` and `secret_scanning_push_protection` still `disabled` (repository API)                                     |
| Dependabot                 | WARN    | Security updates `disabled`; 2 open alerts                                                                                    |

**`N/A` (never counted as a pass)**

- `check:migration-state` and `check:migration-state:production` locally: no credentials in the worktree (both refuse and say so). Production was read from the Release's `migrate` job log (above). Recette's last logged plan (run 39211338503, 2026-10-19) reads 114 applied · 1 pending before that run applied migration 115; no post-apply ledger line was captured, so recette's current ledger is not measured.
- AFRIK check 5 (database vs source JSON), directly: no credentials. The green sync runs are indirect evidence only.
- Live RLS on recette and production: both are self-hosted stacks the Supabase MCP cannot see. RLS is scored from the migration replay.
- Production provides `UPSTASH_REDIS_REST_*`: infrastructure state, not readable from the repository.
- The client-IP trust behind `TRUSTED_PROXY_HOPS` against the live proxy: no recorded run (`production-deploy.md` has no entry).
- Root cause of the nightly `validate` failure: the log ends at the FR30/31 URL step with exit code 1 and thousands of catalogue warnings; the specific unreachable URLs were not isolated this run.
- Wikipedia citation identification (language, title, consultation date) and the P1 "languages crossed" note check: not audited.
- `npm run dev`, the `/api/v2` smoke, `/docs/api` and the `/en/*` 308 at runtime: not exercised; `next build` compiled every route and the proxy was reviewed statically.
- Production-only `npm audit --omit=dev` split and the Jira board's live column names: not read.

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Conditional.** The application, its release path and its corpus are in a good, measured state, and the last audit's blocker is closed. Three conditions stand, none of which blocks the next Release by itself:

1. **No scheduled backup of either self-hosted database** (`docs/runbooks/restore-procedure.md:21-22`: "there is still no scheduled backup against either database"). The 2026-09-22 drill proved the mechanism once; nothing makes a backup exist. This is the first thing that would turn an incident into data loss.
2. **GitHub secret scanning and push protection are off on a public repository** where agents push autonomously, and CI's gitleaks reads the PR tree only.
3. **A missing Upstash variable or a wrong proxy-trust setting would not be caught at deploy time.** The post-deploy smoke checks `/`, `/fr` and `/en`; nothing in `deploy-production.yml` references `/api/v2` or `UPSTASH`. Rate limiting fails closed with a 500 in production when the variables are missing.

### 2.2 Is the AFRIK editorial surface sound?

**Yes at the source, with debt that is tracked.** The corpus is 1,586 fiches (peoples 659, patronymes 776, countries 54, languages 39, families 25, relations 12, dossiers 7, migrations 6, places 5, words 3).

- **Validator:** 54/54 checks, 0 errors, 15,455 warnings (14,504 source-catalogue tier warnings, 926 REQ-196 `nameHistory`, 24 FR52, 1 French accents).
- **FR28 bands:** FR28, FR28-strict and FR28-declared each report **0 warnings**. No demographic debt.
- **Source Tier P0s: zero.**
  - No source without a tier; no fiche with an empty `sources` block outside the word model; no unidentifiable source (title or URL `unknown`, `internet`, `wikipedia`).
  - No weak domain above `unverified` (joshuaproject 504, 101lasttribes 183, peoplegroups 89, wordpress 41, facebook 39, blogspot 26, reddit 2, x.com 1).
  - No state outside `official | referenced | unverified | needs_review`.
  - The 3 word fiches (`WRD_RACE`, `WRD_TRIBU`, `WRD_KIRDI`) carry `"sources": []` at the top level, as `public/modele-mot.json:169` declares, and source every account under `nameHistory`. Ruled conformant, as in the previous audit.
- **Tier distribution** across all 18,060 source entries: official 3,611 · referenced 10,422 · unverified 3,154 · `needs_review` 873 (ratchet 873, down from 890).
- **Provenance debt:** 460 fiches carry `source_kind: ai_generated`; the gate reports 1,211 unreviewed AI-generated citations (= its ratchet) and 991 sources without `source_kind` (= its ratchet). The text markers scan found no AI text outside `ai_generated`, but that cannot see the 991 untyped sources.
- **Direct Wikipedia citations:** 101 entries in 44 fiches (was 85), all `unverified`. Reported, not a defect (DEC-055).
- **Every layer can store every state:** `SOURCE_TIER_STATES` (`src/types/sources.ts`), the API schema (`src/api/v2/schemas/sources.ts:71`), migration 088's `sources_tier_check` and `recompute_confidence()` (102) agree.
- **Referential integrity:** 659/659 peoples match their family folder and resolve to one of the 25 families. 21 `currentCountries` entries have no `pays` fiche; the validator treats them as declared off-map.
- **Reader-facing register:** 0 hits across `gaps[].reason`, `sources[].title` and `sources[].notes`.
- **`data-integrity.yml`** gates every PR into `main` and `recette`, has no `continue-on-error`, and its last PR runs are green; the required context is `validate`.

Failed or unmeasured:

- **Strict-model drift (check 1) fails.** Held by its ratchet and falling: peuple ceiling 5,920 (was 6,249), famille 104. A ratchet above zero is a standing failure by the literal rubric.
- **Database parity (check 5) is `N/A`** (no credentials); both data syncs are green.
- **The nightly run is red** (Domain 3), so the URL-reachability part of check 6 is not holding.

### 2.3 Can a new contributor go clone → running in one session?

**Yes, unchanged.**

- `npm ci` works with `.npmrc`'s `legacy-peer-deps`.
- `.env.example` is complete (`check:env-example`: 70 references, all documented).
- The 115 migrations have no duplicate numeric prefix.
- `--target=local` is the documented contributor path (README, `docs/runbooks/afrik-data-sync.md`).
- `scripts/seedAdminAllowlist.ts` seeds the first moderator.

Not exercised against a running server this run: `npm run dev`, the four `/api/v2` calls and `/docs/api`. The 11 failing full-e2e tests (§6 Domain 9) suggest the search-results page deserves a look from a newcomer's point of view.

### 2.4 What is the security posture?

**Strong in code, weaker around it.** In the code (no P0, no P1 from the security pass):

- RLS covers 51 of 51 tables net of drops; the five deny-all tables each carry their comment.
- The CSP nonce is per request (`btoa(crypto.randomUUID())`, `src/proxy.ts:527`); HSTS preload, nosniff and strict referrer policy apply to every response.
- API keys use PBKDF2-SHA256, 600,000 iterations, 16-byte salt, constant-time comparison (`src/lib/api/auth.ts:15-16`, `:69-76`).
- Rate limiting runs on Upstash per tier and fails closed in production without credentials (`rate-limit.ts:212-236`); no in-memory-only limiter exists.
- All 9 mutating v2 routes are gated or public by documented design (`/keys/issue`, `POST /flags`).
- Sentry asserts an EU DSN in all three configs and disables default PII collection.
- The service-role client stays out of the browser (`import "server-only"`), and the browser holds no data client.

Around the code:

- GitHub secret scanning and push protection are disabled; no scheduled history scan.
- Dependabot security updates are disabled (2 open alerts); `npm audit` shows 6 high and 6 moderate advisories (production split not re-run).
- The proxy-trust check and an Upstash preflight are still owed.
- Branch protection on both branches requires a pull request and eight status checks, with `enforce_admins` on; `main` is `strict`, `recette` is not; neither requires an approval.

### 2.5 Is the score close to 8–9/10?

**6.4/10, 1.6 below the 8.0 floor of the target.** The release path and the code are healthy; the score is held down by controls that were already known and not yet built. Three actions close most of the distance:

1. Schedule a daily off-host backup of both databases and drill recette once (Domain 10, Domain 5).
2. Turn on secret scanning and push protection and add a scheduled full-history scan (Domain 2).
3. Repair the nightly `validate` and the full e2e, so the two red signals stop teaching everyone to ignore red (Domains 3 and 9).

## 3. Overall score

Ten domains, equal weight: **64 / 100 = 6.4 / 10**. No P0 in the corpus or the security surface. One P0 by the skill's hardcoded-values rubric (key-issuance throttle without an env override), which the rubric prices at −1 on Domains 5 and 7. Domain 8 has one failed check and two `N/A` out of eight.

## 4. Score per domain

|   # | Domain                             | Score | Change | Rationale                                                                                                                                 |
| --: | ---------------------------------- | ----: | :----: | ----------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Security posture                   | **8** |   –    | No P0/P1 in code; RLS 51/51; proxy trust and Upstash preflight still unverified; unbounded signed-in key minting not re-verified fixed    |
|   2 | Secrets hygiene                    | **6** |   –    | Secret scanning and push protection still off on a public repo; CI scan reads the tree only; working-tree grep clean (one false positive) |
|   3 | CI                                 | **6** |   –    | Required checks green and every action pinned; nightly `validate` red 8/8; full e2e red 3/3 (not required)                                |
|   4 | Correctness & tests                | **8** |   −1   | 12,472 tests, coverage 87/81/90/88; −1 for 13 files of exports kept alive only by tests (Step 3.7)                                        |
|   5 | Deploy coherence                   | **7** |   +1   | Release green, ledger 115 clean, production sync green again; −1 for hardcoded P0 (Step 3.5); no `/api/v2` smoke after deploy             |
|   6 | Ferry pipeline                     | **5** |   –    | Router last ran 2026-09-12 (red); reconciler green but "scanned 0, dispatched 0" with `FERRY_JIRA_PROJECT` empty                          |
|   7 | Architecture & boundaries          | **6** |   −2   | Three-layer rule holds except `feed/revisions`; −2 stacked from Steps 3.5 and 3.7; 4 routes missing from OpenAPI; latent 1,000-row cap    |
|   8 | AFRIK data integrity & Source Tier | **6** |   +1   | One failed check (strict-model drift, ceiling 5,920) and two `N/A` (database parity, carry-over); zero Source Tier P0s; FR28 debt at zero |
|   9 | Performance & accessibility        | **6** |   –    | Lighthouse and smoke gates required and green; 0.85 performance target still only a warning; full e2e red (11 failures)                   |
|  10 | Documentation & runbooks           | **6** |   –    | Still no scheduled backup; `migration-state.md` last verified 2026-10-03; `DEPLOYMENT.md` limiter contradiction unchanged; OpenAPI gaps   |

**Severity harmonisation.** The missing backup is counted once, in Domain 10 (its cause), and referenced from Domain 5. The 1,000-row name-index cap is counted in Domain 7 and listed again under pagination in Step 3.5 without a second penalty. The two Domain 7 penalties (hardcoded values and dead code) are stacked because the rubric assigns each step's impact to Domain 7 independently; no hotspot appears in both steps.

## 5. Strengths

- **The release path is dependable.** Nine Releases since the last audit, every deploy green, every `migrate` job clean, production at 115 migrations.
- **The data plane recovered.** Production's 71 orphan peoples are gone; its sync and recette's are green. The 5 % prune cap that refused the deletion in October did its job, and the manual reviewed run closed the gap.
- **The test suite keeps growing and stays steady:** 12,472 tests, coverage above thresholds on all four axes, no flake on this run.
- **The editorial contract is clean at the source.** FR28 debt at zero in all three bands, no Source Tier P0, no weak source above `unverified`, and `needs_review` and strict-model drift both fell without a ceiling being raised.
- **RLS is complete by construction:** 51 tables, none without RLS, every deny-all documented, and the repository's own gate agrees with an independent replay.
- **Supply-chain pinning is complete:** no mutable `uses:` reference anywhere in `.github/workflows/`.

## 6. Gaps and risks

### Domain 1 — Security posture

- **P1, unchanged:** `TRUSTED_PROXY_HOPS` (default 1) has not been checked against the live proxy chain. `clientIp()` (`src/lib/api/clientIp.ts:38-50`) counts `X-Forwarded-For` from the right; `production-deploy.md` records no spoofed-header run.
- **P1, unchanged:** no Upstash preflight and no `/api/v2` smoke after deploy (`deploy-production.yml` matches neither `api/v2` nor `UPSTASH`).
- **P2, not re-verified fixed:** `POST /api/v2/keys` lets any signed-in user mint keys for themselves; `src/api/v2/handlers/keys.ts` does not reference `applyKeyIssuanceRateLimit`. The anonymous `keys/issue` route is bounded (5 an hour per IP, one live key per IP, fails closed).
- **P2, new:** four live endpoints are absent from the OpenAPI document (Domain 7).
- **P2:** `style-src 'unsafe-inline'` and `style-src-attr 'unsafe-inline'` on public `/fr/*` pages (`src/proxy.ts:175-178`), a documented follow-up.
- **P3, new:** `sentry.server.config.ts` and `sentry.edge.config.ts` have no `beforeSendTransaction` scrubber (only the client config does, `:46-48`) and send transactions at a 0.1 sample rate; transactions carry request URLs and query strings.
- **P3:** read-quota limiting fails open on an Upstash outage by design, logged and sent to Sentry (`rate-limit.ts:247-251`); key issuance refuses with a 503. Key issuance has a documented non-atomic race, bounded by the per-IP limiter (`handlers/keys.ts:162-163`).
- **P3:** `verifyHashedKey` accepts any stored iteration count, with no floor (`auth.ts:84-89`).

### Domain 2 — Secrets hygiene

- **P1, unchanged: GitHub secret scanning, non-provider patterns and push protection are all `disabled`** on this public repository (repository API, `security_and_analysis`). Agents push here autonomously.
- **P1, standing:** CI's gitleaks (a required context on both branches) reads the PR tree, and no scheduled workflow scans history. A full-history scan was not run this audit (N/A).
- **P2, residual:** the rollback-project service-role JWT commits recorded in `secret-exposure-audit-2026-09.md` may still be fetchable from GitHub by SHA; the Postgres password rotation was recorded as "not verified" and was not re-read.
- **Pass:** only `.env.example` and `e2e/.env.example` are tracked. The working-tree secret pattern grep has one hit, `dataset/source/afrik/patronymes/PAT_BABIRYE.json:59`, an encrypted record id in a public parliament URL: a false positive. `check:local-paths` is green.

### Domain 3 — CI

- **P1, standing:** the nightly `data-integrity.yml` `validate` job is red 8 nights of 8 on `main` (2026-10-14 → 10-21). The step that exits 1 is FR30/31, the nightly source-URL check; the specific unreachable URLs were not isolated (N/A). `migration-state` and `quiz-bank-integrity` pass in the same run, so the earlier wrong-database problem is resolved.
- **P1, new: the full `e2e.yml` is red on its last three `recette` runs** (11 failed, 14 skipped, 412 passed). The failures cluster in the search-result page (`search-results-consolidation`: three-column result layout clicks time out at 15 s on mobile, tablet and desktop; a `toHaveAttribute` assertion finds no element) and one peuple a11y test. The required "Playwright smoke (fr, 430px)" job in the same workflow is green, so the merge path is not blocked; the wider suite is.
- **P2:** the nightly Lighthouse matrix is mostly green (26 success, 3 cancelled, 1 failure in the last 30 runs); it is not a required check.
- **P2, unchanged:** `recette` protection is `strict: false`; neither branch requires an approval. Eight contexts are required on both: gitleaks, build, validate, openapi-diff, dependency-audit, axe-core (Storybook), Playwright smoke (fr, 430px), Lighthouse gate.
- **P2, unchanged:** `migrate-recette.yml:65` carries a `continue-on-error: true` step, and a missing `RECETTE_SUPABASE_URL` is turned into a warning that lets the run pass.
- **P2:** Dependabot security updates are disabled (2 open alerts).
- **Resolved:** no third-party action on a mutable ref.

### Domain 4 — Correctness & tests

- Stray `console.*` in shipped UI: the same 4 calls (`src/app/[lang]/error.tsx:21`, `src/app/docs/api/v2/page.tsx:38`, `src/components/ContributionFormFields.tsx:78,110`). 18 `console.*` calls outside tests in total; 54 TODO/FIXME/XXX/HACK matches.
- 1 unused `eslint-disable` (`src/hooks/use-globe-camera.ts:205`).
- Dead-code P1 items (below) are in the 6–15 band, so −1.

### Domain 5 — Deploy coherence

- **Closed:** production's corpus sync. It was red after v5.0.0, v5.0.1 and v5.1.0; it is now green after v5.9.0 and v5.10.0, and a manual dispatch succeeded on 2026-10-19.
- **P1, standing:** no `/api/v2` smoke or Upstash preflight after deploy (Domain 1).
- **P2, unchanged:** `check:migration-state` without credentials prints a refusal; a misconfigured run does not fail loudly.
- **Hardcoded values:** one P0 and about ten P1 (below), costing −1 here and in Domain 7.
- **Pass:** `vercel.json` keeps `git.deploymentEnabled: false` (`vercel.json:4`); `deploy-production.yml` runs on `release: published` only; the 115 migrations have no duplicate prefix and production's ledger is clean.

### Domain 6 — Ferry pipeline

- **P2, unchanged:** `ferry-router.yml` has not run since 2026-09-12 (its last runs: failure, success, failure).
- **P2, unchanged:** `ferry-reconcile.yml` is green but logs `FERRY_JIRA_PROJECT:` empty and `scanned=0 dispatched=0` (latest 2026-10-21T15:26Z). It passes while doing nothing.
- `ferry.config.yaml` parses and carries its Jira status notes. The Jira board's live column names were not read (N/A).

### Domain 7 — Architecture & boundaries

- **P1, latent:** the people name index reads one page with `.range(0, PEOPLE_NAME_INDEX_CEILING - 1)` (`src/api/v2/services/peopleService.ts:73,93`, ceiling 5,000) on the assumption that a range lifts PostgREST's 1,000-row cap; `sourcesFacet.ts` records a measurement that it does not. At 659 peoples nothing is lost today.
- **P2, new:** 4 live route files carry no OpenAPI block and are absent from the document: `reference-library/route.ts`, `reference-library/assertions/route.ts`, `reference-library/assets/route.ts`, `names/suggest/route.ts`. The previous audit found full coverage.
- **P2:** `src/app/api/v2/feed/revisions/route.ts:94` imports a service directly rather than going through a handler; no route queries Supabase directly.
- **P2, observation:** the local production build logged `Sitemap: could not read ids from afrik_*` with `Unauthorized` for every table, yet exited 0. The credentials in this worktree are not valid, so this proves nothing about the real build, but a build with bad credentials ships an empty sitemap without failing.
- Penalties: Step 3.5 gives −1 (1 P0), Step 3.7 gives −1 (13 files of unused exports, the 6–15 P1 band); stacked, −2 against a base of 8.

### Domain 8 — AFRIK data integrity and Source Tier

- **P1:** strict-model drift is a standing failure held by its ratchet: peuple ceiling 5,920, famille 104. The ceiling is lowered in the same change as each burn-down.
- **Unmeasured:** database parity (check 5) and the known-issues carry-over (check 8, no `data_quality_status.md`).
- **Reported:** 101 direct Wikipedia URLs (44 fiches), all `unverified`; identification and crossed-language notes not audited.
- **Debt:** `needs_review` 873 (ratchet 873); 1,211 unreviewed AI-generated citations (ratchet 1,211); 991 sources without `source_kind` (ratchet 991); FR52-coverage 24 (advisory, the only entry in `SOFT_CHECK_NAMES`, `scripts/validateAfrikData.ts:5471`); REQ-196 `nameHistory` 926.
- **Ceilings:** `RETIRED_CIA_FACTBOOK_URL_CEILING` 112 (was 119).

### Domain 9 — Performance and accessibility

- **Unchanged:** the 0.85 performance target is a warning and 0.73 is enforced; accessibility = 1 and best-practices ≥ 0.95 are errors. The "Lighthouse gate" and "Playwright smoke (fr, 430px)" are required and green on the last `recette` runs.
- **New:** the full e2e failures concentrate on the search-result page and one peuple a11y case (Domain 3). Per the project doctrine the result page is the central surface, so these deserve triage before the next visible change.
- **Pass:** axe-core (Storybook) required, last runs green, no `continue-on-error`.

### Domain 10 — Documentation and runbooks

- **P1, standing: no scheduled backup of either database** (`restore-procedure.md:21-22`); no `pg_dump` or backup workflow exists in `.github/workflows` or `scripts/`. The RPO ≤ 24 h the same document declares cannot be met. Recette has never been drilled; the last production drill (2026-09-22) is next due 2026-12-22 (`:270`), not past.
- **P2, standing:** `docs/runbooks/migration-state.md` says "Last verified: 2026-10-03" and quotes recette 097 and production 095; production is measured at 115 (18 days stale, over the 7-day tolerance).
- **P2, unchanged:** `DEPLOYMENT.md` contradicts itself on the limiter (`:248` fails closed, `:282` "disabled", `:305` fails open for the flag limiters).
- **P2, new:** the OpenAPI document omits 4 live routes (Domain 7).
- Pass: `DEPLOYMENT.md` describes the Release → VPS path and the "Vercel is manual recette preview only" posture; `ETNI` is the Jira key in `docs/confluence-spec/config.json`. No literal `(owner)` placeholder in `docs/` or the README.

### Hardcoded values (P0/P1)

1 P0, about 10 P1 by the grouped count. Counting each of the nine `revalidate = 3600` segment exports separately would reach about 18 P1 and the −2 band; the grouped count is used because Next requires the literal at each site. Most of the tuning surface is env-driven with a documented default (`RATE_LIMIT_*`, `CONTACT_RATE_LIMIT_*`, `FLAG_RATE_LIMIT_*`, `SUPABASE_REQUEST_TIMEOUT_MS`, anti-bot difficulty and TTL). No Supabase, Upstash or Sentry URL literal in `src` outside test fixtures; no role or tier string literal outside enums. About 60 P2 internal constants.

**Rate-limit & Quota Thresholds**

- **P0** `src/lib/api/rate-limit.ts:72,163` — `KEY_ISSUANCE_ATTEMPTS_PER_HOUR = 5`, window `"1 h"` — the only limiter in `src/lib` with no env override; the three RPM tiers (`:133-142`) have one.

**Cache TTLs**

- **P1** `src/api/v2/services/corpusCache.ts:39,46,51,59` — `s-maxage=86400` (sources catalogue, family tree), `60` + `stale-while-revalidate=30` (revisions feed), `max-age=86400` (OG image) — fixed per resource.
- **P1** `src/api/v2/services/corpusCache.ts:34` — `HUB_AVAILABILITY_REVALIDATE_SECONDS = 60`.
- **P1** `export const revalidate = 3600` at 9 sites (`src/app/sitemap.ts:51` and the `[lang]` atlas, liens and comparer pages); `signalements/[slug]/page.tsx:27` has `60`. Next requires a literal for segment config, so these cannot be env-driven; `cacheFreshnessContract.test.ts` holds them to the constants.

**Pagination & Batch Sizes**

- **P1** `src/api/v2/schemas/pagination.ts:13,16,26` — `DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`, `SEARCH_MAX_PAGE_SIZE = 50` — API caps, named but not tunable.
- **P1** `src/api/v2/services/peopleService.ts:73,93` — `PEOPLE_NAME_INDEX_CEILING = 5000` — the 1,000-row cap risk (Domain 7).

### Dead code & redundancy

`check:dead` passes at every ceiling. `knip --production`: 0 unused files, 0 unused dependencies, 18 files with unused exports (26 names), 2 unused types. No surviving V1 import. 0 P0.

**P1** — unused production exports in `src/lib`, referenced only by their own test or not at all (13 files, 18 names), so `check:dead`'s ceiling of 7 does not see them:

- `src/lib/afrik/loaders/{countryLoader,languageFamilyLoader,peopleLoader}.ts` — `loadCountry`, `loadLanguageFamily`, `loadPeople`.
- `src/lib/approach/sources.ts` — `allApproachSources`, `approachClaimSources`, `approachClaimFiches`.
- `src/lib/discoveries/catalog.ts` — `relatedEntityKey`, `resolveRelatedEntities`, `resolveRelatedProductions`.
- `src/lib/search/searchVocabulary.ts` — `getSearchResultGroups`; `searchedName.ts` — `answersToSearch`; `companionCatalogs.ts` — `formatProductionNameQuestion`.
- `src/lib/fiche/onwardGroups.ts` — `patronymeOnwardGroups`; `src/lib/patronymes/content.ts` — `readOrigin`.
- `src/lib/routing.ts` — `PAGE_TYPES`, `NOMMER_CHAPTER_KEYS`; `src/lib/afrik/parsers/patronymeParser.ts` — `PATRONYME_NAME_SYSTEMS`.

**P2**

- 5 shadcn UI files with unused sub-component exports; unused types `ArticleRecord`, `NameRecordDossier`; the unused `eslint-disable` above.
- jscpd: 4.19 % raw (1,133 clones, mostly tests, fixtures, JSON and fonts); 2.46 % over production code (225 clones). No block of 30 lines or more spans three files. The largest two-file clones are `atlas/langues/page.tsx:160` ↔ `atlas/peuples/page.tsx:172` (49 lines) and `:236` ↔ `:257` (46 lines).
- `ts-prune` output (417 lines after filtering) is mostly Next entry points; knip is authoritative.

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

| Control                | Verdict | Evidence                                                                                                                    |
| ---------------------- | :-----: | --------------------------------------------------------------------------------------------------------------------------- |
| CSP / headers          |  PASS   | Per-request nonce (`src/proxy.ts:527`), HSTS preload, nosniff, strict referrer, `frame-ancestors 'self'`                    |
| Locale                 |  PASS   | `/en/*` → 308 to the French page (`proxy.ts:567-571`); other two-letter segments → `/fr`; static review only                |
| API keys               |  PASS   | PBKDF2-SHA256 600,000 iterations, 16-byte salt, constant-time compare; invalid key → 401                                    |
| Key minting            |  WARN   | Signed-in users mint keys for themselves with no per-user cap (P2, not re-verified fixed)                                   |
| Rate limiting          |  PASS   | Upstash per tier, fail-closed without credentials in production, no in-memory fallback                                      |
| Client-IP trust        |  WARN   | Single `clientIp()`; no recorded check against the live proxy                                                               |
| CORS                   |  PASS   | Single configured origin, no `*`, no credentials, `Vary: Origin`                                                            |
| Service-role isolation |  PASS   | `import "server-only"`; no `admin` import outside `api/`/`admin/`; `createBrowserClient` only in `auth-client.ts`           |
| Sentry                 |  PASS   | EU DSN asserted in all three configs, default PII collection off; server and edge lack a transaction scrubber (P3)          |
| RLS                    |  PASS   | 51/51 net of drops; five deny-all tables, each commented                                                                    |
| Secrets                |  FAIL   | Secret scanning and push protection off on a public repo; CI scan reads the tree; no history scan                           |
| Supply chain           |  PASS   | No mutable action ref; `gitleaks` required; Dependabot security updates off (P2); 6 high advisories (dev chains unverified) |
| Branch protection      |  PASS   | Eight required contexts on both branches; `main` strict, `recette` not; zero approvals; `enforce_admins` true               |

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
| afrik_recorded_words                                                                             |          115 |            115 |            1 | Public read (new)             |
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
| contributor_profiles                                                                             |          026 |            026 |            1 | Read `USING (true)` by design |
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

No `RLS = No` row; no RLS-enabled table without either a policy or a deny-all comment. Policy contents (public-read versus moderator-write) were not re-audited this run; the previous audit's reading stands for tables created before migration 106. Net policy counts for `contributor_profiles` (1) and `user_roles` (4) differ from the last audit (3 and 3); the independent replay is the figure used here and the difference was not investigated.

## 9. Performance and accessibility posture

| Control               | Verdict | Evidence                                                                                                       |
| --------------------- | :-----: | -------------------------------------------------------------------------------------------------------------- |
| Lighthouse PR gate    |  PASS   | Required context "Lighthouse gate"; last `recette` runs `success`                                              |
| Lighthouse budgets    |  WARN   | a11y = 1 and BP ≥ 0.95 enforced; performance enforced at 0.73, the 0.85 target only warns (`.lighthouserc.js`) |
| Lighthouse full audit |  WARN   | Not required; 26 success, 3 cancelled, 1 failure in its last 30 runs                                           |
| axe-core              |  PASS   | Required context "axe-core (Storybook)"; last runs green, no `continue-on-error`                               |
| E2E                   |  FAIL   | Required "Playwright smoke (fr, 430px)" green; full `e2e.yml` red 3 of 3 (11 failed, 412 passed); not required |
| Locale posture        |  PASS   | French only; retired English URLs redirect with 308 (static review)                                            |

## 10. AFRIK data integrity and Source Tier compliance

Corpus: 1,586 fiches — peoples 659, patronymes 776, countries 54, languages 39, families 25, relations 12, dossiers 7, migrations 6, places 5, words 3. Peoples fell from 687 as the editorial waves folded duplicates into their keepers.

|   # | Required check          | Verdict |  Change  | Evidence                                                                                                                                                                                              |
| --: | ----------------------- | :-----: | :------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Strict model adherence  |  FAIL   |    –     | 10-fiche sample: no undeclared key, no missing key (`PAT_ZUMA` lacks the optional `searchAnswer`). Drift held by ratchet: peuple 5,920 (was 6,249), famille 104                                       |
|   2 | Full validator          |  PASS   |    –     | 54/54, 0 errors, 15,455 warnings. FR28 0 · FR28-strict 0 · FR28-declared 0. `SOFT_CHECK_NAMES` = `FR52-coverage` only (`validateAfrikData.ts:5471`)                                                   |
|   3 | Referential integrity   |  PASS   |    –     | 659/659 peoples match their family folder and parent; FR26, FR27, FR29 and country-code checks pass. 21 `currentCountries` entries without a `pays` fiche are declared off-map                        |
|   4 | Source Tier compliance  |  PASS   |    –     | official 3,611 · referenced 10,422 · unverified 3,154 · `needs_review` 873 · missing 0 · other 0 (18,060 entries). 0 P0. 460 `ai_generated` fiches. 101 direct Wikipedia URLs, all `unverified`       |
|   5 | Database vs source JSON |   N/A   | FAIL→N/A | No credentials. Recette and production syncs green on their last 5 and 3 runs (indirect evidence only)                                                                                                |
|   6 | CI enforcement          |  PASS   |    –     | `data-integrity.yml` on every PR into `main`/`recette`, no `continue-on-error`, last PR runs green, `validate` required. The nightly is red (Domain 3), which is outside the PR gate                  |
|   7 | Reader-facing register  |  PASS   |    –     | 0 hits across `gaps[].reason`, `sources[].title`, `sources[].notes` for every pattern in `src/lib/editorial/readerRegister.ts` (French and English, incl. "domain ruling", "awaits editorial review") |
|   8 | Known-issue carry-over  |   N/A   |    –     | No `data_quality_status.md` in the session memory. Live ceilings read instead: `RETIRED_CIA_FACTBOOK_URL_CEILING` 112, `NEEDS_REVIEW_RATCHET` 873, strict-model ceilings above                        |

**One failed check and two `N/A` band Domain 8 at 7–8 by the letter of the rubric; scored 6** because both `N/A` checks are the two that would show database drift and legacy issues, the exact things that failed last time. No Source Tier P0; FR28 debt at zero.

## 11. Prioritized actions

| Priority | Finding                         | Action                                                                                                                                 | Done when                                                                           |
| -------: | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
|        1 | D10 / D5 (no scheduled backup)  | Schedule a daily off-host dump of both self-hosted databases; drill recette once (unticketed)                                          | A dated backup ≤ 24 h old exists for each database                                  |
|        2 | D2 (secret scanning off)        | Enable GitHub secret scanning and push protection; add a scheduled full-history gitleaks run (unticketed)                              | Both enabled in `security_and_analysis`; a scheduled scan reports zero unclassified |
|        3 | D3 (nightly `validate` red 8/8) | Isolate the unreachable URLs behind FR30/31 (`data-integrity.yml` nightly), replace or archive them (unticketed)                       | The 02:00 schedule is green                                                         |
|        4 | D3 / D9 (full e2e red)          | Triage the 11 failures (search-result consolidation, peuple a11y) in `e2e.yml` run 39311423184 (unticketed)                            | `e2e.yml` green on `recette`                                                        |
|        5 | D1 (proxy trust)                | Run the spoofed `X-Forwarded-For` check against production and record it in `production-deploy.md` (unticketed)                        | The stored address is the real caller's, and the run is dated in the runbook        |
|        6 | D1 / D5 (no API smoke)          | Add a post-deploy `/api/v2` smoke and an Upstash preflight to `deploy-production.yml`; fix `DEPLOYMENT.md:282` (unticketed)            | A deploy without the Upstash variables fails loudly instead of serving 500s         |
|        7 | D1 (key minting)                | Cap active keys per user and route `POST /api/v2/keys` through `applyKeyIssuanceRateLimit` (unticketed)                                | A test proves the cap                                                               |
|        8 | D7 (1,000-row cap)              | Page `getPeopleNameIndex()` the way `sourcesFacet` does (`peopleService.ts:73,93`) (unticketed)                                        | A test proves the index returns more than 1,000 rows                                |
|        9 | D7 / D10 (OpenAPI gaps)         | Document `reference-library` (3 routes) and `names/suggest` in `openapiV2.ts` (unticketed)                                             | `openapi:diff` and the route-folder coverage match                                  |
|       10 | D5 / D7 (hardcoded P0)          | Give `KEY_ISSUANCE_ATTEMPTS_PER_HOUR` and its window an env override like the RPM tiers (`rate-limit.ts:72,163`) (unticketed)          | An env var changes the throttle; a test proves it                                   |
|       11 | D10 (stale ledger doc)          | Update `migration-state.md` to the measured 115/115; make `check:migration-state` exit non-zero without credentials (unticketed)       | The doc quotes this run's ledger line; a credential-less run fails                  |
|       12 | D4 / D7 (dead exports)          | Remove or inline the 18 test-only exports in 13 files, or lower the ratchet by moving them under test helpers (unticketed)             | `knip --production` reports no unused export in `src/lib`                           |
|       13 | D8-1 (strict-model drift)       | Keep filling the declared keys on peoples and families, lowering the ceilings each pass (peuple 5,920, famille 104)                    | Ceilings trend down without raising                                                 |
|       14 | D6 (Ferry)                      | Set `FERRY_JIRA_PROJECT`, or record the router and reconciler as retired (unticketed)                                                  | The reconciler scans a non-zero set, or a SUPERSEDED note                           |
|       15 | D8 (Wikipedia / Sentry / drift) | Cite the primary sources behind the 101 Wikipedia URLs; add `beforeSendTransaction` to the server and edge Sentry configs (unticketed) | The count trends down; transactions are scrubbed on all three runtimes              |

**Closed since 2026-10-13:** production's corpus sync (action 1 of the last audit); recette's data-sync parity (action 3), both read as green runs rather than direct database counts; the nightly `migration-state` job reading the retired project (action 5).

## 12. Conclusion

The code and the release path are in their best measured state:

- Nine Releases since 2026-10-13, each deployed green with a clean ledger; production at 115 migrations.
- 12,472 tests, coverage above every threshold, no mutable action reference, RLS on all 51 tables.
- An editorial corpus with zero Source Tier P0s and zero demographic debt, and ratchets that moved down, not up.

What holds the score at 6.4 is a short list of controls the project knows it lacks: a scheduled backup, repository secret scanning, a post-deploy API smoke, and a nightly job and a full e2e that have both been red long enough to be ignored. None of them needs a redesign. The first two close the two standing P1s; the next two restore trust in the red signals. Closing actions 1–6 would put the score near 7.5.
