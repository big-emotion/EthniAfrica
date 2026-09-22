# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-09-21<br>
**Audited checkout:** `origin/recette` at `decac0e76` (Release `v4.15.0` is the latest deploy; its version bump lives on `main` only, so `package.json` on recette still reads `4.14.0`)<br>
**Overall score:** **6.4 / 10** measured on `origin/recette` (was 8.2 on 2026-09-19); **7.2 / 10** measured on an integration branch carrying the five draft remediation PRs #1247–#1251, which are not merged (§1a)<br>
**Release verdict:** **CONDITIONAL GO.** The release path, the migration ledgers, RLS and the required PR gates are sound and a Release ships daily. Three things stand between this and a defensible GO: both corpus syncs are red (production holds peoples git no longer declares), the production database has no rehearsed restore, and `/api/v2/keys/issue` is an unauthenticated mutating endpoint outside the three-layer rule.

## 1. Scope and method

This audit covers the Next.js application, the AFRIK corpus, the recette and production Supabase stacks, GitHub Actions and branch protection, the release path, Ferry, security, performance, accessibility, documentation and the clone-to-running flow. Outcomes were read from command output, GitHub runs, the branch-protection API and job logs, never from workflow configuration alone.

**Why the score fell 1.8 points.** Two causes, kept apart on purpose:

- **Real regressions since 2026-09-19.** The post-merge corpus syncs turned red (production three syncs running, recette three running) after peoples were merged in git (`PPL_FULANI`, `PPL_FULA_SAHEL` into `PPL_FULA`, #1220) and the database rows were never pruned; `confidence-recompute.yml` has failed every day since at least 2026-09-16.
- **A literal reading of the rubric.** The previous audit scored the AFRIK domain 8 with one failed check. This run counts three (strict-model drift, database parity, reader-facing register) and the rubric caps three failures at 4. It also applied the hardcoded-value and dead-code bands as written rather than netting dormant code against them. Neither is a new defect; both were softened before.

**Measured this run**

| Check                   | Outcome | Evidence                                                                                             |
| ----------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| Lint                    | PASS    | 0 errors, 36 warnings (26 s)                                                                         |
| Typecheck / format      | PASS    | `tsc --noEmit` and `prettier --check` clean                                                          |
| Unit tests              | PASS    | 1,000 files passed, 3 skipped; 10,184 tests passed, 21 skipped                                       |
| Coverage                | PASS    | 87.19% statements, 81.07% branches, 90.26% functions, 88.32% lines (thresholds 70/60/70/70)          |
| Production build        | PASS    | Compiled; 47 static pages                                                                            |
| Dead-code ratchet       | PASS    | `check:dead` at every ceiling; production ceilings 3 files, 1 dependency                             |
| Dependency audit        | WARN    | 0 critical, 0 high, 6 moderate (`exceljs` and `uuid` on a runtime path)                              |
| RLS coverage            | PASS    | 47 of 47 surviving tables behind RLS; independent replay agrees with `check:rls-coverage`            |
| AFRIK validator         | PASS    | 57/57 checks, 0 errors, 5,700 warnings                                                               |
| Editorial rules         | PASS    | 0 errors, 95 warnings, all `chronology-symmetry`, at `UNDATED_POLITY_CEILING`                        |
| Required PR checks      | PASS    | `ci`, data-integrity, editorial, OpenAPI, axe, smoke and Lighthouse gate green on the latest PR head |
| Production migration    | PASS    | Release `v4.15.0` run `35596848068`: applied 93 · pending 0 · orphaned 0 · drifted 0                 |
| Corpus sync, production | FAIL    | run `35597238427` (2026-09-21): verify step red; last three syncs red                                |
| Corpus sync, recette    | FAIL    | run `35573017607` (2026-09-21): verify step red; last three syncs red                                |
| Confidence recompute    | FAIL    | `confidence-recompute.yml` red 6 of 6 daily runs since 2026-09-16                                    |
| Full E2E (fr/en)        | WARN    | 332 passed, 18 skipped, 0 failed; run red on the non-required search-feed visual proof               |

**`N/A` (never counted as a pass)**

- Local `check:migration-state` for recette and production: no credentials in this environment. Production is read from the Release `migrate` job log instead; recette's ledger was last read 2026-09-18 (`35331102644`) and no migration file changed after 2026-09-16.
- Database-versus-source parity, read directly: no credentials. It is scored from the two sync runs' verify logs, labelled indirect.
- Full-history secret scan: the checkout is shallow and gitleaks runs `--no-git`. Two old revisions were sampled clean.
- The proxy's `X-Forwarded-For` handling, Ferry router health, and the security-invoker setting of three views: not measurable from the repository.
- Real-browser rendering of the result page at 320–430 px was not exercised (the audit runs no browser); it is covered by the Playwright smoke gate only.

## 1a. Remediation applied after the audit (five draft PRs, not merged)

Each finding that could be fixed from the repository was fixed on its own branch, test-first, and opened as a draft PR into `recette`. All five were merged into a throwaway integration branch (no conflicts; #1249 and #1250 both touch `CLAUDE.md` and combine cleanly) and the gates were re-run there. **Nothing below is measured on `recette` or in CI until the PRs merge and their workflows run.**

| PR    | Fixes                 | What changed                                                                                                                                                                                                                                      |
| ----- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1247 | D3-1                  | `confidence-recompute.yml` runs both scripts under `--conditions=react-server`; a regression test spawns each command as written and failed 2 of 2 before the fix                                                                                 |
| #1248 | D8-3                  | `INTERNAL_REGISTER_PATTERNS` (FR and EN) refuse « cette passe » and the workshop's « protocole » sentences; 64 `gaps[].reason` fields rewritten; the gate went from 0 to 64 errors on the old corpus to 0                                         |
| #1249 | D10-3, D10-4, D5, D10 | Recette described as self-hosted in `CLAUDE.md`, README, `DEPLOYMENT.md`, both runbooks and two more; audit skill scores FR28 as warnings; `ethniafrica-ticket` R4 follows the three-tier policy; CI lists regenerated                            |
| #1250 | D1-1, D1-2, D7-1      | `keys/issue` is POST-only and moved behind a handler and service; `clientIp` is the only reader of `X-Forwarded-For` (right-most minus `TRUSTED_PROXY_HOPS`, default 1); a fail-closed 5-per-hour issuance limiter; dead `applyRateLimit` deleted |
| #1251 | D4, D7, D5            | Production-mode knip findings 24 → 8; 6 flag/contact/dwell/TTL limits env-tunable; the discovery video URL follows the configured domain; three duplicated blocks reduced to one type-signature clone                                             |

**Measured on the integration branch:** lint 0 errors (35 warnings), typecheck and prettier clean, 1,003 test files and 10,228 tests passed (21 skipped), coverage 87.24% statements / 81.11% branches / 90.32% functions / 88.36% lines, build generated 47 pages, `check:dead` at its ceilings (production: 3 dormant English files, 0 dependencies), validator and editorial rules 0 errors (95 warnings, unchanged), skill-parity, orphan-docs, local-paths, `lint:req`, RLS coverage, glossary and charter contracts green.

**One gate is red on that branch: `check:env-example`.** #1250 and #1251 add seven variables the code reads (`TRUSTED_PROXY_HOPS`, `FLAG_RATE_LIMIT_HOURLY_WINDOW`, `FLAG_RATE_LIMIT_DAILY_WINDOW`, `FLAG_MIN_DWELL_MS`, `FLAG_VERIFICATION_TTL_HOURS`, `CONTACT_RATE_LIMIT_MESSAGES`, `CONTACT_RATE_LIMIT_WINDOW`) and neither could edit `.env.example`. Both PRs stay unmergeable until that file gains the seven names. An integration run also caught a real defect in #1247 (its test imported `js-yaml`, an unlisted dependency, which failed `check:dead`); it is fixed on that branch.

**What no code change can move, and why:**

- **Database parity (Domain 8, check 5).** The orphan rows in production and recette need `--prune --apply` with real credentials (`docs/runbooks/afrik-data-sync.md`, "Retiring a people identifier"). The relation rows need deleting by hand, recette first.
- **Restore drill (Domain 10).** The procedure for the self-hosted stack has to be written by whoever runs the stack, and a drill recorded.
- **The proxy claim (Domain 1).** `TRUSTED_PROXY_HOPS` is correct only if Traefik on the VPS does not trust client-supplied forwarding headers. That is a production check.
- **Scheduled-workflow proof (Domain 3).** #1247 is proven by a scheduled or dispatched run after merge, not by tests.

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Conditionally.** Production is live, deploys only from a published Release and migrated cleanly on `v4.15.0` (93 applied, no drift). RLS, CSP, key hashing and the required PR gates are sound. Three blockers:

1. **Both corpus syncs are red.** Production has 776 peoples in the database against 772 in git, 1,189 people↔language rows against 1,176 and 1,486 people↔country rows against 1,463; recette shows the same shape. Production serves peoples git has retired, and the sync chained off every Release has failed three times running.
2. **The production database has no rehearsed restore.** The last drill was 2025-07-14, its next-due date (2025-10-14) is about eleven months past, and `docs/runbooks/restore-procedure.md` says outright that it does not yet describe how the self-hosted production database is backed up or restored.
3. **`/api/v2/keys/issue` is unauthenticated, mutating on both GET and POST**, issues keys through a spoofable "one per IP" rule and reads and writes the database from the route file.

### 2.2 Is the AFRIK editorial surface sound?

**Mostly, with three failed checks.** The validator passes 57/57 with zero errors; FR28 [95,105] has 0 findings, FR28-strict [99,101] has 0, FR28-declared has 0. `SOFT_CHECK_NAMES` holds one entry (`FR52-coverage`, 24 warnings), unchanged. All Source Tier P0 classes are zero across 7,224 source entries: no untiered source, no empty `sources`, no unidentifiable source, no weak domain over-tiered, no AI text without `source_kind`, no state outside the admitted four. The tier vocabulary agrees across the type, zod, OpenAPI, `sources_tier_check` (migration `088`) and `recompute_confidence()` (migration `091`). The single direct Wikipedia URL (`PPL_FULA`, `content.sources[23]`) is cited at `unverified` with an explanatory note, which the policy reports rather than refuses.

Failed: strict-model drift (held by ratchets), database parity (indirect, red on both databases) and the reader-facing register (the gate passes while an independent grep finds 64 fiches with workshop vocabulary). `needs_review` stands at 915 citations across 422 fiches against a ratchet of 915. It is admitted debt, not a P0.

### 2.3 Can a new contributor go clone → running in one session?

**Yes for the application, with one undiscoverable step.** Node 22, `.npmrc` (`legacy-peer-deps`), `.env.example` (67 references, all documented), 93 gap-free migrations replayed from nothing by `migrations-replay.yml`, first admin through `scripts/seedAdminAllowlist.ts`, `/docs/api`, and every named `npm run` script exist. The seeded local path (`--target=local` with `supabase start`) exists but is described only in the 581-line `docs/runbooks/afrik-data-sync.md`; the README says "your Supabase project URL" and stops. The README and four other documents also still name a hosted project as recette's database (§6, Domain 10).

### 2.4 What is the security posture?

**Strong at the data plane, with two P1 findings at the edge.**

- All 47 surviving tables have RLS; the five zero-policy tables carry an explicit deny-all comment in their migrations.
- CSP nonce is generated per request (`src/middleware.ts:611`); HSTS is `max-age=31536000; includeSubDomains; preload`; locale fails closed to `fr-only` (`src/lib/locale.ts:38-41`).
- API keys use PBKDF2-SHA256 at 600,000 iterations with a 16-byte salt and constant-time compare (`src/lib/api/auth.ts:15-90`); a present-but-invalid key is refused with 401, not downgraded.
- The service-role client never reaches a browser bundle; `createBrowserClient` appears only in `src/lib/supabase/auth-client.ts` and no `.from(` or `.rpc(` runs on it.
- Sentry uses an EU-only DSN guard and a PII scrubber.
- **P1:** `src/app/api/v2/keys/issue/route.ts:66-150` (unauthenticated GET and POST, direct `api_keys` access, one PBKDF2 hash per call).
- **P1, deployment-dependent:** rate limiting and key issuance take the left-most `X-Forwarded-For` (`src/lib/api/rate-limit.ts:12-16`). Safe only if the fronting proxy overwrites the header, which this audit could not measure.
- Branch protection is measured: both branches require a pull request, enforce administrators and require the same nine contexts; `recette` is `strict: false`, `main` is `strict: true`; approvals required are zero (single maintainer).

### 2.5 Is the score close to 8–9/10?

**No: 6.4/10**, two points under the band. The three actions that recover the most: prune and re-verify the two corpus syncs and make that sync step self-healing (Domain 8, +2 by itself when check 5 passes; the domain is then one failure from the 5–6 band); write and rehearse the self-hosted restore and record a drill (Domain 10, +2); move key issuance behind a handler and service with a trustworthy client-IP source (Domain 1 and 7).

## 3. Overall score

Ten domains, equal weight: **64 / 100 = 6.4 / 10**. There is no P0 (no table without RLS, no untiered source, no browser data client), but Domain 8 is capped at 4 by the rubric's three-failed-check rule. The defects that touch several domains were counted once, in the most causal domain and cross-referenced elsewhere: the two red corpus syncs count in Domain 8 only; the restore gap counts in Domain 10 only.

**With #1247–#1251 applied: 72 / 100 = 7.2 / 10** (integration branch, §1a). Domain movements, each anchored to a measurement above: Domain 1 8→9 (key issuance behind the three layers, one trusted client-IP reader; the proxy claim stays a production check); Domain 4 7→9 and Domain 7 6→8 (production-mode P1 findings 17→5, hardcoded-value P1 groups 8→2, both inside the rubric's no-penalty band); Domain 5 7→8 (hardcoded band gone, recette identity corrected); Domain 8 4→5 (register check now passes with the wider gate and the 64 rewrites, leaving two failed checks: strict-model drift and database parity); Domain 10 5→6 (identity and skill contradictions fixed, both restore findings still open). Domains 2, 3, 6 and 9 are unchanged because their findings need runs, credentials or decisions that a code change cannot supply.

## 4. Score per domain

|   # | Domain                             | Score | Rationale                                                                                                                                        |
| --: | ---------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | Security posture                   | **8** | RLS 47/47, nonce CSP, PBKDF2, no browser data client; P1 on `keys/issue` and on `X-Forwarded-For` trust                                          |
|   2 | Secrets hygiene                    | **8** | Gitleaks required, templates value-free, all env gates green; history scan is `N/A` (`--no-git`, shallow checkout)                               |
|   3 | CI                                 | **7** | Nine required checks on both branches, all green on the PR head; daily red `confidence-recompute`, nightly data-integrity, full E2E not required |
|   4 | Correctness & tests                | **7** | 10,184 tests, coverage above every threshold, lint clean; dead-code band −2 (17 P1)                                                              |
|   5 | Deploy coherence                   | **7** | Release-only deploy, 93/0/0/0 on production, rollback path; hardcoded-value band −1; recette identity misdocumented                              |
|   6 | Ferry pipeline                     | **6** | Reconcile 10/10 green, actions SHA-pinned; router not run since 2026-09-12 and its last ten runs alternate red and green                         |
|   7 | Architecture & boundaries          | **6** | Three-layer rule holds except `keys/issue`; no V1 import; dead-code band −2, with the hardcoded-value band absorbed as overlapping               |
|   8 | AFRIK data integrity & Source Tier | **4** | Three of eight checks fail (strict-model, database parity, register) → capped at 4; no Source Tier P0                                            |
|   9 | Performance & accessibility        | **6** | Lighthouse gate and axe required and green; the 0.85 performance target is enforced nowhere; full E2E and the visual proof are not required      |
|  10 | Documentation & runbooks           | **5** | Restore drill ~11 months overdue, production restore undocumented, recette described wrongly in five documents, skill contradicts CLAUDE.md      |

## 5. Strengths

- A Release is the only production deploy trigger and it works: `v4.13.0`, `v4.14.0` and `v4.15.0` each deployed successfully (`35464471066`, `35543067313`, `35596848068`), each running the migration job first.
- Migration hygiene is unusually good: 93 files, no duplicate prefix, no hole, replayed from empty on every PR touching `supabase/`.
- RLS coverage was verified two independent ways (a fresh replay script and `check:rls-coverage`), which agree at 47 tables.
- The tier vocabulary is one scale in every layer, and `needs_review` is tightly ratcheted (915 → exact match; down from 1,010 on 2026-09-12).
- Both branches enforce administrators and require the same nine checks including Gitleaks, `dependency-audit` and a French 430 px smoke.
- Every P0-class tunable is centralised and env-overridable: request deadline (`src/lib/supabase/requestDeadline.ts:19-53`), rate limits (`src/lib/api/rate-limit.ts:62-65`), anti-bot difficulty (`src/lib/antibot/proofOfWork.ts:23-24`).
- The codebase is genuinely mobile-first: three `max-width` rules in CSS, zero `max-*:` Tailwind variants, 160 `md:`/`xl:` uses.
- Coverage is 87.19% statements against a 70% threshold, and the suite is deterministic.

## 6. Gaps and risks

### Domain 1 — Security posture

- **P1 D1-1:** `src/app/api/v2/keys/issue/route.ts:66-150` is unauthenticated, exports both `POST` and `GET` (`:146-150`, so a prefetch or link can trigger issuance), creates the admin client itself and reads and inserts into `api_keys` (`:66,78,83,107`), computing a 600,000-iteration PBKDF2 hash per call. "One key per IP" (`:78-97`) rests on `X-Forwarded-For`. The anonymous per-IP limit in middleware mitigates it only if that header is trustworthy.
- **P1 D1-2 (deployment-dependent):** left-most `X-Forwarded-For` as client identity (`src/lib/api/rate-limit.ts:12-16`; same in `keys/issue/route.ts:69-73`). Whether the proxy overwrites or appends is `N/A` from the repository.
- **P2:** transient Upstash errors fail open (`src/lib/api/rate-limit.ts:270-277`); only the missing-configuration case fails closed, which is what `CLAUDE.md` states.
- **P2:** the legacy surface `/api/entities/*` and `/api/download` is unmetered (middleware meters `/api/v2/` only, `src/middleware.ts:759`) and `src/app/api/download/route.ts:23-25` answers `Access-Control-Allow-Origin: *` on a CPU-heavy zip/xlsx export.
- **P2:** public pages keep `style-src 'unsafe-inline'` (`src/middleware.ts:187-189`), a documented follow-up (`:38-49`).
- **P2:** server and edge Sentry configs set no `beforeSendTransaction`, so server transactions bypass the custom scrubber.
- **P2:** `flags_read_public` is `USING (true)` (`supabase/migrations/022_flags_full_ddl.sql:509-512`), so any future column on `flags` is public by default; migration `075` already moved contact data out for this reason. Three views (`afrik_name_forms`, `afrik_name_type_counts`, `hub_module_corpus_presence`) were not checked for `security_invoker`: `N/A`.
- **P2:** `src/lib/email/graph.ts:111,118,157` makes outbound fetches with no timeout.
- **P2:** six moderate advisories, including `exceljs` (a runtime dependency for `/api/download`) via `uuid`; the `uuid` defect needs a caller-supplied buffer, so real exposure is low.

### Domain 2 — Secrets hygiene

- **P2 D2-1:** gitleaks runs `--no-git` (`ci.yml`), so it scans the working tree and never history; the checkout used here is also shallow. Two sampled old revisions are clean. Durable evidence of rotation after the 2026-08-26 recette credential incident was not re-examined this run and stays open from the previous audit.
- **P2:** `check:infra-disclosure` prints "INFRA_DISCLOSURE_TERMS is not configured" locally, so it proved only its shape guard; CI may configure it (`N/A`).
- One token-pattern hit exists and is not a credential: `dataset/source/afrik/patronymes/PAT_BABIRYE.json:64`, an encrypted-ID query string inside a public parliament-site URL.
- Clean: tracked env files are `.env.example` and `e2e/.env.example` only; 98 `secrets`/`vars` uses in workflows and no inline credential; the one PR-title/body use (`openapi-diff.yml:77-78`) is passed through `env`.

### Domain 3 — CI

- **P1 D3-1 (measured):** `confidence-recompute.yml` failed 6 of 6 scheduled runs (latest `35575363668`) with "This module cannot be imported from a Client Component module", a `server-only` import. Confidence scores are not recomputing on schedule.
- **P2 D3-2:** the nightly `data-integrity` run with `CHECK_SOURCE_URLS=true` has failed four nights running (2026-09-18 to 09-21) on one archive.org URL cited by `REL_MIGRATORY_YAO_MAKONDE.json`; a `curl` from here returned 200, so this looks like a runner-side block. It is a drift alarm that is permanently red and therefore ignored.
- **P2 D3-3:** the full Playwright suites (fr, en) and the "Search-feed visual harness proof" are not required contexts; only the smoke job is. The 2026-09-21 E2E run `35588352163` is red solely on the visual proof (`feed-root.x` expected 52, received 32 on the desktop-day boards), and E2E also failed on 2026-09-20.
- **P3:** `recette` is `strict: false` (`main` is `true`); zero approvals are required (accepted, single maintainer); `migrate-recette.yml:65` carries a `continue-on-error`.
- **Resolved from the previous audit:** both branches require nine contexts and enforce administrators. The 2026-09-19 document said "strict" for both, which was wrong for `recette`.

### Domain 4 — Correctness & tests

- Tests and coverage are green (see §1). Stray `console` in `src`: 18, of which 10 are offline asset generators and 3 are the logger itself; none breaks the `no-console` zones.
- Dead-code findings feed the band below; see "Dead code & redundancy".

### Domain 5 — Deploy coherence

- The release path, ledger and rollback are healthy (`v4.15.0` migrate job: 93 applied, 0 pending, 0 orphaned, 0 drifted; 20 early migrations predate the stored-statement ledger so drift cannot be judged for them).
- `deploy-production.yml` and `production-data-sync.yml` both exist on `origin/main`, so `workflow_run` chaining fires. The sync it chains is red (counted in Domain 8).
- **P2:** `docs/DEPLOYMENT.md:333` says `--target=recette` "resolves to `shmrjtnfbqzceovroqjj`"; it resolves to `https://supabase-recette.ethniafrica.com` (`scripts/lib/afrikSyncTarget.ts:54-55`).
- **P2:** `public/` weighs 35.35 MiB with 0.65 MiB of headroom under `check:asset-weight`, so the next image trips it.
- **P3:** recette's `package.json` and changelog read 4.14.0 while `v4.15.0` is deployed; expected until the next sync PR.
- Hardcoded-value penalty −1 applies (see below).

### Domain 6 — Ferry pipeline

- `ferry.config.yaml` parses; `base_branch` and `target_branch` are both `recette`, prefix `ferry/`, consistent with `CLAUDE.md`. The five per-agent workflows are gone; only `ferry-router.yml`, `ferry-reconcile.yml` and `ferry-cost-daily.yml` exist, all using one SHA pin (v1.2.0).
- `ferry-reconcile` ran green 10 of 10; the latest was 2026-09-21 08:02.
- **P2 D6-1:** the router last ran on 2026-09-12; its last ten runs alternate success and failure (for example `34686519014`, "no branch 'ferry/ETNI-1891' and no open PR"). Nine days without a run means the Jira → router chain cannot be confirmed alive: `N/A`.
- The `ETNI` key matches in `CLAUDE.md` and `docs/confluence-spec/config.json`; the router workflow receives it by payload, so "identical in workflow inputs" is `N/A`. The Confluence `spaceKey` (`ETHNIAFRIC`) and `engineeringRootPageId` (`174948648`) carry no conflicting literal.

### Domain 7 — Architecture & boundaries

- **P1 D7-1:** `src/app/api/v2/keys/issue/route.ts` is the only v2 route that queries the database without a handler or service (same defect as D1-1, one canonical severity).
- **P1 D7-2:** production-mode dead code and duplication (see below).
- No V1 import survives. 46 v2 route files, 43 carry `@swagger`/`@openapi` and the remaining three (`reference-library`, `assertions`, `assets`) are in the static block of `src/lib/api/openapiV2.ts`, so every served route is in the spec.
- **P2:** the legacy `/api/entities/*` routes read `src/lib/supabase/queries` directly, which is outside the v2 layering but is a different surface; it contradicts "the public REST API is v2 only" in spirit.

### Domain 8 — AFRIK data integrity and Source Tier

- **P1 D8-1 (canonical severity for the sync defect):** the production sync (`35597238427`, 2026-09-21 12:02 UTC) landed the corpus with zero structural failures but its verify step failed: `afrik_peoples` 776 vs 772 in git, `afrik_people_languages` 1,189 vs 1,176, `afrik_people_countries` 1,486 vs 1,463. Recette (`35573017607`) fails the same way, naming orphans `PPL_FULANI` and `PPL_FULA_SAHEL`. The likely cause is that #1220 merged them into `PPL_FULA` and the database rows are stale until a manual `--prune --apply`, the failure mode recorded on 2026-09-13. Production holds two more extra peoples than recette; their identifiers were not visible in the log.
- **P2 D8-2:** strict-model drift is held by `STRICT_MODEL_DRIFT_CEILINGS` (peuple 7,048; famille 104; pays 13). Measured: 309 of 772 peoples and 4 of 25 families lack `classificationStatus`; three peoples (`PPL_ANTAKARANA`, `PPL_ANTAMBAHOAKA`, `PPL_ANTANDROY`) carry an extra content key `additionalNotes`; the 54 countries and 39 languages conform.
- **P2 D8-3:** the reader-facing register gate passes while 64 published `gaps[].reason` fields use workshop vocabulary it does not match: "cette passe" / "lors de la passe" in 52 fiches (for example `PAT_AH_CHUEN` `gaps[3]`, `PAT_BARROS` `gaps[2]`, `PAT_TUBMAN`, `PAT_SILVA`) and "le protocole exclut/interdit" in 12 (`PAT_ADAM`, `PAT_GBAGBO`, `PAT_WEAH`, `PAT_ZEROUAL`…). `CLAUDE.md` names "la passe" as banned; `INTERNAL_REGISTER_PATTERNS` only covers "passe de recherche" and "passe anthroponymique". The word "corpus" also appears in 178 reader-facing fields (P3).
- **P2 D8-4:** the database refuses 7 appellations for lack of a qualifying source (`PPL_JIE_SUD`, `LAMBA`, `LEYA`, `LUNDA_KAZEMBE`, `MUKULU`, and one more the truncated log did not show), down from 51 on 2026-09-13.
- **Debt:** 915 `needs_review` citations across 422 fiches (ratchet 915); `pays` is the worst (327 against 159 `official`). 3,987 off-catalogue source URLs produce warnings, not failures.
- **P3:** `data-integrity.yml` says "789 people fiches" (772 now); `scripts/validateAfrikData.ts:5267` calls FR28-declared "a hard error" while `CLAUDE.md` says it warns; `data_quality_status.md` is from 2026-05-14 and baselines 789 fiches.

### Domain 9 — Performance and accessibility

- **P1 D9-1:** the target performance ≥ 0.85 is not enforced anywhere. Ordinary routes error at a 0.73 floor; fiche routes only `warn` at 0.85 with measured scores of 0.45–0.47 (`.lighthouserc.js`, software-rendered WebGL). The PR-time gate (`.lighthouserc.gate.js`, five URLs, one run) errors only on best-practices ≥ 0.95; performance, LCP and TBT are `warn`. Accessibility is asserted at 1.0 in the nightly run and by the required axe job, not in the PR gate.
- The Lighthouse gate really ran (`35588352289`, jobs "Lighthouse gate" and "Lighthouse Mobile Audit" both success; nightly `35577000614` green). The 2026-09-19 red 29-route expansion is not re-measured here.
- axe (`a11y.yml`) is blocking and green on five runs; its audited-story count was not extracted (`N/A`).
- **P2:** the search-feed visual harness is red and tolerated (see D3-3).
- Mobile-first holds at the project breakpoints (430 / 720 / 800) per the CSS scan; publication fails closed to `fr-only` with tests at `src/lib/__tests__/locale.test.ts:62,91,106` and `src/__tests__/middleware.test.ts`.

### Domain 10 — Documentation and runbooks

- **P1 D10-1:** the last restore drill is 2025-07-14; the next-due date in `docs/runbooks/restore-procedure.md:201` (2025-10-14) is about eleven months past. The reminder workflow the runbook once described was never created.
- **P1 D10-2:** `restore-procedure.md:14-19` states that both restore paths assume a hosted Supabase project and that the runbook "does not yet say" how the self-hosted production database is backed up or restored. Its stated RTO ≤ 4 h and RPO ≤ 24 h are unproven for production, and recette has been self-hosted since ETNI-1958.
- **P1 D10-3:** five documents still call the hosted project `shmrjtnfbqzceovroqjj` recette's database, against `scripts/lib/afrikSyncTarget.ts:54-55` and the newer runbooks: `CLAUDE.md` (Supabase paragraph), `README.md:221`, `docs/DEPLOYMENT.md:19,28,333`, `docs/runbooks/restore-procedure.md:12,48` and `docs/runbooks/moderation-access.md:38-44`. This is CLAUDE.md drift, not an error in the code; per the authority rule the disagreement is recorded here and the criterion is not eased.
- **P1 D10-4:** `.claude/skills/ethniafrica-audit/SKILL.md` contradicts `CLAUDE.md`: it scores FR28 and FR28-strict as P0 hard gates (lines 202–204, 284, 314, 329) where `CLAUDE.md` (DEC-055, REQ-170) makes them warnings; it cites `docs/adr/0001-fr28-demographic-tolerance.md`, which does not exist; it names `scripts/seedAdmin.ts` (legacy) as the first-admin path and describes `user_roles` as what gates `/admin`, where the door is `admin_allowlist`; it sends the seed check to `--target=recette` only. `.claude/skills/ethniafrica-ticket/SKILL.md:87` (R4) still enforces the retired Tier 1/2/3 policy with Tier 3 "forbidden".
- **P2:** `docs/DEPLOYMENT.md` lists about nine CI steps against roughly 25 in `ci.yml`, and `CLAUDE.md`'s CI-blocking list omits `check:production-ledger` (`ci.yml:217`). `docs/runbooks/afrik-data-sync.md:43-46` says "Node 20.x" three lines after "Node ≥ 22" (`package.json` is 22.x).
- **P2:** `docs/adr/0007-atlas-globe-engine.md` contradicts the directory's own README ("do not add new files") and reuses a deleted ADR number; `bootstrap-catalog.json` still cites deleted 0001 and 0002.
- **P2:** `NEXT_PUBLIC_FEATURE_QUIZ` is listed as optional by `CLAUDE.md` and `docs/DEPLOYMENT.md` but is absent from `.env.example`; whether code reads it is unconfirmed.
- Verified correct: `AGENTS.md` and README agree with `CLAUDE.md` on bilingual code, fail-closed French-only publication, Next.js 16, v2-only API and Release-only deploy; no `(owner)` placeholder remains; every named `npm run` script exists; `migration-state.md` (last verified 2026-09-18) agrees with the 93-migration measurement; 17 strict models match `CLAUDE.md`.

### Hardcoded values (P0/P1)

**P0: none.** Every P0-class knob is centralised and env-overridable (see Strengths).

**P1 (8, grouped):**

1. **P1** `src/api/v2/services/corpusCache.ts:15,26,31,43,47` and `src/api/v2/utils/corpusRoute.ts:23` — 3,600 s, 60 s, `s-maxage=86400`, `stale-while-revalidate=86400`, `s-maxage=60`, `s-maxage=31536000` — CDN TTLs for every corpus endpoint; named constants, not env-overridable.
2. **P1** `src/app/**/page.tsx` (8 files), `src/app/sitemap.ts:51`, `src/lib/hubs/moduleAvailability.ts:134,219` — `revalidate = 3600` and `60` — Next requires literals in segment config, but the value duplicates `corpusCache.ts` and can drift.
3. **P1** `src/lib/ratelimit/flagRateLimit.ts:42,50` — windows `"1 h"`, `"24 h"` — the counts are env-driven, the windows are not.
4. **P1** `src/lib/ratelimit/contactRateLimit.ts:19` — `MESSAGES_PER_HOUR = 5`, `"1 h"` — not overridable; the limiter fails open.
5. **P1** `src/api/v2/handlers/flags.ts:88` — `MIN_DWELL_MS = 3_000` — anti-bot dwell time.
6. **P1** `src/lib/flags/reporterContact.ts:15` — `VERIFICATION_TTL_MS` = 24 h — reporter-contact verification window.
7. **P1** `src/lib/discoveries/videos.ts:87` — hardcoded `https://ethniafrica.com/fr/atlas/familles/FLG_MANDE` — a recette build emits production URLs; `src/lib/siteUrl.ts` and `NEXT_PUBLIC_CANONICAL_DOMAIN` (`src/lib/brand.ts:89`) exist.
8. **P1** `src/types/sources.ts:139,150` — `SOURCE_TIER_WEIGHTS` (1.0/0.7/0.4), `AI_PROVENANCE_WEIGHT = 0.5` — a TS copy of `recompute_confidence()`, unused in production. This is also a dead export, so it is counted once, under dead code, and the hardcoded list stands at 7 for banding.

About 45 P2 constants exist (UI timings, `*_MAX_PAGES = 40` safety valves duplicated across `src/lib/supabase/queries/afrik/*`, 500-row walk sizes). Seven P1 falls in the 6–15 band: **−1** on Domain 5 and absorbed into Domain 7's larger dead-code band rather than stacked.

### Dead code & redundancy

`check:dead` passes at every ceiling (exports 7/7, types 10/10; files, dependencies, devDependencies, unlisted, binaries, duplicates all 0/0). Production mode reports 3 unused files, 1 unused dependency, 21 unused export names and 10 unused type names. No V1 import survives; the only `entityKeys` matches are the substring in `peopleIdentityKeys`. jscpd: 299 clones, 5,612 lines, 3.24% duplicated (976 files).

- **P0:** none. `tailwindcss-animate` is flagged in production mode but is a build-time plugin imported by `tailwind.config.ts:2` (documented at `scripts/ci/checkDeadCode.ts:182`).
- **P1 (3)** dormant English banks, imported only by tests: `src/lib/games/corpus.en.ts`, `src/lib/games/landmarks.en.ts`, `src/lib/glossaire/entries.en.ts`. They are held back deliberately under `fr-only`; deleting them would destroy content work.
- **P1 (11)** unused exports in `src/lib` and `src/api`: `applyRateLimit` (`src/lib/api/rate-limit.ts:306`, only mocked in tests — confirm whether it is dead, since middleware carries the metering), `buildSourceReviewQueue`, `publicationsForSubjects`, `modelChapterKeys`, `mediaSchema`, `clearConsent`, `RELATION_TYPE_LABEL_FR`, `SOURCE_TIER_WEIGHTS`, `ORAL_NARRATIVE_KINDS`, `AI_PROVENANCE_WEIGHT`.
- **P1 (3)** duplicated blocks of at least 30 lines across three files: 47 lines across `AnecdoteCard.tsx`, `HomeHeroAnecdote.tsx` and `ProverbCard.tsx`; 38 across `[lang]/admin/page.tsx`, `admin/sources/page.tsx` and `signalements/verifier/page.tsx`; 33 across `atlas/noms/[slug]`, `doctrine/[slug]` and `signalements/[slug]` pages.
- **P2:** eight shadcn `ui/` exports, ten unused types, two test-reset hooks, and two-file duplications (`atlas/langues/page.tsx` vs `atlas/peuples/page.tsx`, 49 lines; `worldAdmin0.ts` vs `worldCompare.ts`, 40).

Seventeen P1 lies above the rubric's fifteen-finding line, so the band is **−2** on Domains 4 and 7. Fourteen would fall in the −1 band if the three intentional English banks were treated as mitigated; the rubric offers no such exemption and this audit does not invent one.

## 7. Consumer and contributor flow

| Step                | Verdict | Evidence                                                                                                            |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| Runtime/install     | PASS    | `.nvmrc` 22, `engines` 22.x, `.npmrc` `legacy-peer-deps=true` (intentional, Storybook vs Next)                      |
| Environment         | PASS    | `.env.example` covers every required and optional variable; `check:env-example`: 67 references, both directions     |
| Migrations          | PASS    | 93 sequential files; `migrations-replay.yml` green on its last four runs (2026-09-17)                               |
| Seed                | WARN    | `--target=local` exists but is documented only in `docs/runbooks/afrik-data-sync.md`; README does not signpost it   |
| First administrator | PASS    | `scripts/seedAdminAllowlist.ts`, `docs/runbooks/moderation-access.md`; `seedAdmin.ts` labelled legacy               |
| Boot / build        | PASS    | `next build` compiles and generates 47 pages                                                                        |
| API routes          | PASS    | `/api/v2/countries`, `/peoples`, `/language-families`, `/search` and `/docs/api` all exist; not exercised live      |
| Admin protection    | PASS    | `/{lang}/admin/*` redirects unauthenticated requests; every admin page calls `getModeratorSession()` except sign-in |
| Recette identity    | FAIL    | Five documents describe the retired hosted project as recette's database (D10-3)                                    |
| Production restore  | FAIL    | No documented or rehearsed procedure for the self-hosted stack (D10-2)                                              |

**Clone-to-running verdict:** reproducible in one session for the application and its local checks; a seeded database requires reading the operator runbook, and two operational steps rest on tribal knowledge.

## 8. Security posture

### RLS matrix

The net replay of 93 migrations finds **47 surviving tables, all in `public`, all with `ENABLE ROW LEVEL SECURITY` after their last `CREATE TABLE`**, and no `DISABLE ROW LEVEL SECURITY` anywhere. `check:rls-coverage` reports "OK (47 tables, all behind RLS)" and agrees. **No `RLS=No` row exists, so there is no P0.** Buckets `protected-records` and `source-working-assets` are `public = false` with policies on `storage.objects`; `SECURITY DEFINER` functions have their `search_path` pinned by migration `076` and `EXECUTE` revoked by `077`.

| Table                                                                                            | Last created (migration) | RLS after | Net policies | Notes                                                                 |
| ------------------------------------------------------------------------------------------------ | ------------------------ | --------- | -----------: | --------------------------------------------------------------------- |
| afrik_countries, afrik_language_families, afrik_languages, afrik_peoples, afrik_people_countries | 006                      | 019       |       1 each | public read                                                           |
| user_roles                                                                                       | 008                      | 008       |            4 | legacy; opens no console door                                         |
| sources, assertions, confidence_scores                                                           | 009                      | 015       |       1 each | controlled                                                            |
| flags                                                                                            | 009                      | 022       |            3 | `SELECT USING (true)`; new columns public by default                  |
| revisions                                                                                        | 009                      | 021       |            2 | editor                                                                |
| editorial_doctrine                                                                               | 009                      | 017       |            4 | editor                                                                |
| audit_log                                                                                        | 009                      | 009       |            2 | append-only                                                           |
| api_keys                                                                                         | 012                      | 012       |            1 | owner                                                                 |
| fiche_revisions                                                                                  | 020                      | 020       |            1 | editor                                                                |
| revision_drafts                                                                                  | 023                      | 023       |            4 | editor                                                                |
| contributor_profiles                                                                             | 026                      | 026       |            1 | owner                                                                 |
| name_records                                                                                     | 029                      | 029       |            4 | reader / editor                                                       |
| afrik_people_relations                                                                           | 030                      | 030       |            1 | public read                                                           |
| assertion_references                                                                             | 031                      | 040       |            1 | controlled                                                            |
| oral_narratives, oral_narrative_links                                                            | 032                      | 032       |       1 each | reader / editor                                                       |
| protected_records, protected_record_audit                                                        | 033                      | 033       |       1 each | privileged                                                            |
| source_working_assets                                                                            | 034                      | 034       |            5 | contributor / moderator                                               |
| migration_events, migration_event_peoples                                                        | 035                      | 035       |       4 each | reader / editor                                                       |
| quiz_generation_runs, quiz_questions                                                             | 036                      | 036       |       1 each | controlled                                                            |
| antibot_challenges                                                                               | 048                      | 048       |            0 | deny-all, commented (`048*.sql:94-95`)                                |
| search_query_log                                                                                 | 050                      | 050       |            0 | deny-all, commented (`:9-10`)                                         |
| afrik_patronymes, afrik_patronyme_peoples, afrik_patronyme_countries                             | 053                      | 053       |       1 each | public read                                                           |
| afrik_people_languages                                                                           | 054                      | 054       |            1 | public read                                                           |
| persons, person_peoples, person_countries                                                        | 057                      | 057       |       1 each | public read                                                           |
| afrik_patronyme_alliances                                                                        | 061                      | 061       |            1 | public read                                                           |
| afrik_patronyme_persons                                                                          | 064                      | 064       |            1 | public read                                                           |
| afrik_media                                                                                      | 073                      | 073       |            1 | public read                                                           |
| admin_allowlist                                                                                  | 074                      | 074       |            0 | deny-all, commented; a public read would publish the moderator roster |
| flag_reporter_contacts                                                                           | 075                      | 075       |            0 | deny-all, commented (`:19-20,55-56`)                                  |
| afrik_dossiers                                                                                   | 082                      | 082       |            1 | public read                                                           |
| afrik_translations                                                                               | 085                      | 085       |            1 | public read                                                           |
| source_tier_ruling_drafts                                                                        | 090                      | 090       |            0 | deny-all, commented (`:30-33,89-90`)                                  |
| afrik_patronyme_bearers                                                                          | 093                      | 093       |            1 | public read                                                           |

| Control           | Verdict                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headers / CSP     | PASS — per-request nonce (`src/middleware.ts:611`), HSTS with preload, nosniff, `frame-ancestors 'self'`; `unsafe-inline` styles on public pages (P2)         |
| Locale            | PASS — invalid or missing `SITE_LOCALE_MODE` fails closed to `fr-only` (`src/lib/locale.ts:38-41`), tested                                                    |
| API keys          | PASS — PBKDF2-SHA256, 600,000 iterations, 16-byte salt, constant-time compare; invalid key is 401                                                             |
| Key issuance      | FAIL — `/api/v2/keys/issue` unauthenticated, GET and POST, direct DB access (D1-1)                                                                            |
| Rate limiting     | WARN — tiered, missing configuration fails closed in production; transient Upstash errors fail open; client IP from `X-Forwarded-For` (`N/A` proxy behaviour) |
| CORS              | PASS — one configured origin, `Vary: Origin`, no credentials; `/api/download` answers `*` (P2)                                                                |
| Service role      | PASS — `import "server-only"`; the app-directory scan is empty; `createBrowserClient` only in `auth-client.ts`, no `.from(`/`.rpc(` on it                     |
| Admin auth        | PASS — session plus `admin_allowlist`; other 14 mutating routes carry bearer, HMAC, zod or anti-bot checks                                                    |
| Sentry            | PASS/WARN — EU DSN guard, `sendDefaultPii: false`, scrubber; no server `beforeSendTransaction`                                                                |
| Supply chain      | WARN — 6 moderate, 0 high/critical; every third-party action SHA-pinned (`check:action-pins` OK); Dependabot weekly on npm and actions                        |
| Branch protection | PASS — both branches require a PR, enforce administrators, same nine contexts; `recette` `strict: false`, zero approvals                                      |

## 9. Performance and accessibility posture

| Surface                       | Status | Evidence                                                                                                      |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Lighthouse PR gate            | WARN   | Ran and green (`35588352289`); only best-practices ≥ 0.95 is an error, performance/LCP/TBT warn               |
| Lighthouse nightly            | WARN   | Ran and green (`35577000614`); performance floor 0.73, fiche routes warn at 0.45–0.47, target 0.85 unenforced |
| Accessibility (axe-core)      | PASS   | Blocking, required, green on the last five runs; a11y = 1.0 asserted by the nightly Lighthouse                |
| Playwright smoke (fr, 430 px) | PASS   | Required; green                                                                                               |
| Full Playwright (fr, en)      | WARN   | 332 passed, 18 skipped, 0 failed, but not a required check                                                    |
| Search-feed visual proof      | FAIL   | Red on the last run; not required, known red                                                                  |
| Mobile-first CSS              | PASS   | 3 `max-width` rules, 18 `min-width`, 0 `max-*:` Tailwind variants                                             |
| Core Web Vitals               | PASS   | Consent-aware Sentry collection (carried from the previous audit; not re-measured this run)                   |

## 10. AFRIK data integrity and Source Tier compliance

|   # | Required check          | Verdict | Evidence                                                                                                                                                                                      |
| --: | ----------------------- | :-----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Strict model adherence  |  FAIL   | 309/772 peoples and 4/25 families lack `classificationStatus`; 3 peoples carry `additionalNotes`; held by ceilings 7,048 / 104 / 13                                                           |
|   2 | Full validator          |  PASS   | 57/57, 0 errors; FR28 0, FR28-strict 0, FR28-declared 0; `SOFT_CHECK_NAMES` = `FR52-coverage` only (24 warnings)                                                                              |
|   3 | Referential integrity   |  PASS   | 0 missing `FLG_*` parents, 0 folder/`languageFamilyId` mismatches, 0 id/filename mismatches, ISO shapes valid                                                                                 |
|   4 | Source Tier compliance  |  PASS   | All P0 classes 0; `needs_review` 915/915 ratchet; four-layer vocabulary agrees                                                                                                                |
|   5 | Database vs source JSON |  FAIL   | Direct read `N/A`; indirect: production and recette verify steps red (776/774 vs 772 peoples; orphan rows), last three syncs red                                                              |
|   6 | CI enforcement          |  PASS   | `data-integrity` and `editorial-rules` run on PRs to both branches, no `continue-on-error`, required (`validate`, `editorial-rules`), latest PR runs green; nightly URL check red four nights |
|   7 | Reader-facing register  |  FAIL   | Gate: 0 findings; independent grep of 14,224 fields with the exported patterns: 0 hits; extended grep: 64 fiches with "passe"/"protocole"                                                     |
|   8 | Known-issue carry-over  |  PASS   | `UNDATED_POLITY_CEILING` 95 = measured 95; `NEEDS_REVIEW_RATCHET` 915 = measured 915; both ratchets have no headroom                                                                          |

Three failed checks cap Domain 8 at **4**.

**Corpus census (1,725 tracked JSON files under `dataset/source/afrik`, including `_retired-identifiers.json`):** patronymes 797 (794 fiches, 3 worksheets) · peuples 772 · pays 54 · langues 39 · famille_linguistique 25 · relations 12 · noms 11 · dossiers 7 · migrations 6 · systemes_onomastiques 1.

**Source tiers across 7,224 entries:** official 1,717 · referenced 2,062 · unverified 2,530 · `needs_review` 915 · missing 0 · other 0. `ai_generated` provenance is set on 498 entries. `needs_review` by directory: peuples 524, pays 327, famille 64.

The Source Tier P0 census is zero: no untiered source, empty `sources` block, unidentifiable source, Wikipedia-as-source (one direct URL exists, at `unverified`, with an explanatory note), over-tiered weak domain, unmarked AI text or out-of-vocabulary state. Of 60 non-Wikipedia sources whose notes mention Wikipedia, 57 name the language version crossed; the other three say they do not cite it.

## 11. Prioritized actions

Tickets are not filed by this audit (it is read-only); each row names the finding to attach one to.

**Status after the remediation PRs (§1a), each row's "done when" still being the test:**

- **Fixed in a draft PR, pending merge:** 3 and 13 (#1250, #1251); 5 (#1247, proven only by a run after merge); 6 and 7 (#1249); 9 (#1248). Row 13's three blocks: two extracted, one skipped because only a type signature is shared.
- **Partly fixed:** 4 (#1250 makes the address a right-most-minus-hops read; the proxy still has to be checked on the VPS).
- **Open, needs a human or credentials:** 1 (prune with real credentials), 2 (restore procedure and drill), 14 (exercise the router).
- **Open, needs a decision or editorial work:** 8 (performance target), 10 (strict-model drift), 11 (nightly URL check), 12 (required E2E set), 15 (`needs_review` batches).
- **Blocking the merges themselves:** add the seven variables to `.env.example` (§1a), or `check:env-example` keeps #1250 and #1251 red.

| Priority | Finding | Action                                                                                                                                                | Done when                                                            |
| -------: | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
|        1 | D8-1    | Run `--prune --apply` on recette and production, then make the sync prune retired identifiers (or fail the merge that retires one)                    | Both sync verify steps green on a Release                            |
|        2 | D10-2   | Document backup and restore for the self-hosted stack (production and recette) and run a drill                                                        | A drill recorded with RTO/RPO; next-due date in the future           |
|        3 | D1-1    | Move key issuance behind a handler and service, drop the `GET` export, make "one key per IP" rest on a trusted client-IP source                       | Route imports no admin client; abuse test on repeated calls          |
|        4 | D1-2    | Confirm the proxy overwrites `X-Forwarded-For`, or read the address from a header the proxy owns                                                      | Verified against the running stack and recorded in a runbook         |
|        5 | D3-1    | Fix the `server-only` import that breaks `confidence-recompute.yml`                                                                                   | Six consecutive green scheduled runs                                 |
|        6 | D10-3   | Correct recette's identity in `CLAUDE.md`, README, `DEPLOYMENT.md`, `restore-procedure.md`, `moderation-access.md`                                    | `grep shmrjtnfbqzceovroqjj` finds only "retired" or rollback context |
|        7 | D10-4   | Reconcile the audit skill with `CLAUDE.md` (FR28 as warnings, `seedAdminAllowlist`, `admin_allowlist`, `--target=local`); fix `ethniafrica-ticket` R4 | The skill and `CLAUDE.md` agree line by line                         |
|        8 | D9-1    | Decide the performance target: enforce 0.85 on the routes that can meet it, or state the accepted floor in the charter                                | The documented budget equals the enforced assertion                  |
|        9 | D8-3    | Add "cette passe"/"lors de la passe" and "protocole" to `INTERNAL_REGISTER_PATTERNS` and rewrite the 64 gap reasons                                   | Gate and independent grep both report zero                           |
|       10 | D8-2    | Reduce strict-model drift without raising a ceiling (309 peoples without `classificationStatus` first)                                                | All three ceilings move down                                         |
|       11 | D3-2    | Make the nightly URL check tolerate a runner-side block or move the URL to a dated snapshot                                                           | Nightly run green three nights running                               |
|       12 | D3-3    | Decide whether full Playwright and the visual proof become required; if not, stop treating a red run as the norm                                      | The required set matches the intent, recorded in one place           |
|       13 | D7-2    | Confirm `applyRateLimit` is dead, then extract the three 30-line duplicated blocks                                                                    | Production-mode tallies fall; duplication falls                      |
|       14 | D6-1    | Exercise the Ferry router on a live transition                                                                                                        | A router run within the last week, green                             |
|       15 | D8 debt | Adjudicate `needs_review` citations in bounded batches, `pays` first                                                                                  | `NEEDS_REVIEW_RATCHET` decreases without tier inflation              |

## 12. Conclusion

EthniAfrica ships daily through a release path that works, its data plane is well protected, and its editorial doctrine survives a census of 7,224 sources with zero Source Tier P0. The 6.4/10 is not a collapse of the code; it is three things the project had not looked at squarely: the corpus syncs after a merge of peoples are red on both databases, the production database has no rehearsed restore, and several documents (and the audit skill itself) describe a recette database that no longer exists.

After the five remediation PRs the measured score on an integration branch is **7.2/10**; it becomes 7.2 on `recette` only once they merge and the scheduled workflow has run. Reaching the previous 8.2 needs the items no code change supplies: the prune (Domain 8, one failed check fewer, roughly +2), a recorded restore drill with a written self-hosted procedure (Domain 10, roughly +2), a decision on the performance target and the required E2E set (Domain 9, roughly +1 to +2), a Ferry router run and a green scheduled recompute (Domains 6 and 3, roughly +1 each). Those are the path from 7.2 to about 8.2; going above it means lowering the strict-model ceilings and clearing `needs_review`.

Every one of the top four actions is bounded. Pruning the two databases and teaching the sync to prune moves Domain 8 out of its cap. A recorded restore drill removes the largest operational risk. Rerouting `keys/issue` closes the only open P1 in the security domain. Together they return the project to the 8–9 band without any architectural rewrite; the remaining work is ratchet reduction and documentation reconciliation.
