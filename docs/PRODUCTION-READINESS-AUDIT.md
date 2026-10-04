# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-10-03 (second run of the day, after #1494)<br>
**Audited checkout:** `origin/recette` at `373142628` (`chore(audit): close the 2026-10-03 audit's code-level findings (#1494)`); five Releases shipped since 2026-09-22, v4.18.0 → v4.22.0<br>
**Overall score:** **7.2 / 10** (was 7.1 earlier today, 7.6 on 2026-09-22, 6.4 on 2026-09-21)<br>
**Release verdict:** **CONDITIONAL GO.** The code, the gates and the release path are as green as the earlier run found them, and #1494 closed its code-level findings. Three operational blockers stand: no scheduled backup of either self-hosted database, recette still serving two peoples git deleted (its data sync red five runs in a row), and a client-IP trust setting never checked against the live proxy. The rollback project's leaked key is recorded as disabled since 2026-09-01, which lowers it from a P1 to a note.

## 1. Scope and method

Full audit (no `--quick`, no `--no-build`), read-only, run in an isolated worktree on `origin/recette`'s tip. Outcomes were read from command output, GitHub run conclusions, the branch-protection API, Release job logs and a read-only select against recette. Evidence gathering was split across four parallel read-only passes (CI/deploy, AFRIK integrity, hardcoded values and dead code, security) plus the long gates run directly; every figure below comes from a command run this day. A figure carried over from the earlier run without re-measurement says so.

**What changed since 2026-09-22**

- **Shipped:** Releases v4.18.0 (09-22), v4.19.0 (09-23), v4.20.0 (09-25), v4.21.0 (09-27) and v4.22.0 (10-01), each with a green `deploy-production.yml` run. `main` now carries #1247's `--conditions=react-server` (`confidence-recompute.yml:27,33`) and the job has been green six nights running.
- **Done:** a restore drill against the self-hosted production stack (`docs/runbooks/restore-drill-2026-09-22.md`, Path C); the `PAT_DIALLO` register leak rewritten and the register rule extended to name-record `claim` fields; strict-model drift lowered (peuple 7,048 → 7,006, pays 13 → 9); `needs_review` 915 → 913.
- **Not done:** the client-IP trust check against the live proxy; a scheduled backup; any Ferry router run.

**Measured this run**

| Check                       | Outcome | Evidence                                                                                                                   |
| --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Lint                        | PASS    | 0 errors, 35 warnings, 0 unused `eslint-disable`                                                                           |
| Typecheck / format          | PASS    | `tsc --noEmit` and `prettier --check` clean                                                                                |
| Unit tests                  | PASS    | 1,049 files passed, 3 skipped; 10,872 tests passed, 21 skipped (`npm run test:coverage`). First run: 1 flake, see §6 D4    |
| Coverage                    | PASS    | 87.19% statements, 80.98% branches, 90.62% functions, 88.30% lines (thresholds 70/60/70/70)                                |
| Production build            | PASS    | Compiled in 10.2 s; 47 static pages; no deprecation warning printed (the earlier three are gone, `src/proxy.ts`)           |
| Dead-code ratchet           | PASS    | `check:dead` at every ceiling (exports 7/7, production files 3/3, production dependencies 0/0)                             |
| `check:env-example`         | PASS    | 74 env references, all documented, every documented entry read                                                             |
| `check:local-paths`         | PASS    | Clean, 10 self-tests                                                                                                       |
| `check:action-pins` / shell | PASS    | Every third-party `uses:` SHA-pinned; every `run:` block parses                                                            |
| RLS coverage                | PASS    | `check:rls-coverage` and an independent replay of 97 migrations: 47 of 47 surviving tables behind RLS                      |
| AFRIK validator             | PASS    | 57/57 checks, 0 errors; FR28, FR28-strict, FR28-declared all 0 warnings                                                    |
| Editorial rules             | PASS    | 0 errors, 95 warnings, all `chronology-symmetry` (`UNDATED_POLITY_CEILING` = 95)                                           |
| Source Tier coverage        | PASS    | `needs_review` 913/913 ratchet, exact                                                                                      |
| `check:afrik-loader`        | PASS    | Patronyme corpus loads cleanly                                                                                             |
| `check:glossary`            | PASS    | 0 divergences, 85 terms                                                                                                    |
| Per-PR gates                | PASS    | Last runs of CI, data-integrity, editorial-rules, a11y, Lighthouse, E2E, openapi-diff all `success`                        |
| Production deploy           | PASS    | v4.22.0 run 36827759480: `migrate` applied 094, 095 → applied 95 · pending 0 · orphaned 0 · drifted 0                      |
| Recette migrations          | PASS    | `migrate-recette.yml` run 37115838551: applied 97 · pending 0 · orphaned 0 · drifted 0                                     |
| `confidence-recompute`      | PASS    | FAIL → PASS: 6 of 6 scheduled runs green since the fix reached `main`                                                      |
| **Recette data sync**       | FAIL    | `recette-data-sync.yml` red 5 runs in a row (last 37122368825): two deleted peoples still in recette (§10, check 5)        |
| **Nightly data-integrity**  | FAIL    | Scheduled URL run red on all 8 of the last 8 nights (last 37107311021). Cause now readable: 2 unreachable URLs (FR30/31)   |
| npm audit                   | WARN    | 12 advisories: 8 high, 4 moderate, 0 low (was 10/6/1). Every high is a lint, build or dev chain; `--omit=dev` not run      |
| Secret history              | WARN    | A rollback-project service-role JWT sits in history (commits `2938bf073`, `6d75c125a`); a runbook records it disabled (§6) |

**`N/A` (never counted as a pass)**

- `check:migration-state` and `check:migration-state:production` run locally: no credentials in the worktree. Both ledgers were read from CI job logs instead (above).
- Production database vs git (check 5): `AFRIK_PRODUCTION_SUPABASE_URL` not available locally. Production's own sync (`production-data-sync.yml`) is green since 2026-09-25.
- The client-IP trust behind `TRUSTED_PROXY_HOPS` against the live proxy: still not run (the runbook procedure, `production-deploy.md:108-115`, has no recorded run).
- The `check:*` scripts other than `check:dead` and `check:rls-coverage`, and `check:action-pins`, were not rerun on the second pass; their rows above are the earlier run's results at `8d16601a7`. #1494 touched code only.
- Whether the leaked rollback key is dead: the runbook's closure section says it was probed and rejected on 2026-09-01. This run did not probe it.
- `check:infra-disclosure` is only partial locally (`INFRA_DISCLOSURE_TERMS` unset); CI injects it.
- The Jira board's live column names against `ferry-jira-automation-setup.md`: not read.

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Conditionally.** The application, its gates and its release path are sound and measured green end to end. Three blockers are operational:

1. **No scheduled backup of either self-hosted database.** The restore mechanism was proven on 2026-09-22, but `restore-procedure.md:21-22` states there is nothing scheduled to restore from, so the declared RPO ≤ 24 h cannot be met.
2. **Recette serves two peoples that git deleted** (`PPL_BUSANSI`, `PPL_BUSSA`, merged into Bissa by #1481), and its data sync has been red since (five runs, last 37122368825).
3. **`TRUSTED_PROXY_HOPS` has never been checked against the live proxy**, and production's Upstash variables live only in the VPS `.env` with no deploy preflight, so a missing one answers every `/api/v2` call 500 while the pages stay green.

Also standing, no longer a blocker: a service-role key for the hosted rollback project (`shmrjtnfbqzceovroqjj`) is in commits `2938bf073` and `6d75c125a`. `docs/runbooks/secret-exposure-audit-2026-09.md` records the project's legacy keys disabled on 2026-09-01 and the leaked key probed and rejected. `.entire/` is now gitignored. The same runbook says the leaked Postgres password's rotation is "not verified".

### 2.2 Is the AFRIK editorial surface sound?

**Yes on the editorial contract. Recette's database is out of step with it.** The editorial checks pass:

- **Validator:** 57/57, 0 errors.
- **FR28 bands:** FR28, FR28-strict and FR28-declared each report **0 warnings**, so there is no demographic debt left.
- **Source Tier:** zero P0s.
  - No untiered source.
  - No empty `sources` block.
  - No unidentifiable source.
  - No AI text without `source_kind`.
  - No state outside the four admitted.
  - The two weak domains at `referenced` are false positives: a Canada Institute of Linguistics paper hosted on WordPress.
- **Tier distribution:** official 1,759, referenced 2,206, unverified 2,580, `needs_review` 913 (ratchet 913, down from 915).
- **Referential integrity:** passes.
- **Reader-facing register:**
  - The rule now walks `claim` fields and the gate reports 0 errors.
  - A full sweep of `gaps[].reason`, `sources[].title`, `sources[].notes` and all 595 `claim` fields finds no workshop vocabulary.
- **`data-integrity.yml`:** gates every PR (required context `validate`).

Two checks fail:

- **Strict-model drift.** It is held and lowered by its ratchet: 308 of 770 peoples and 4 of 25 families still lack `classificationStatus`.
- **Database parity on recette.** Two deleted peoples and their link rows remain there.

### 2.3 Can a new contributor go clone → running in one session?

**Yes, unchanged.**

- `npm ci` works with `.npmrc`'s `legacy-peer-deps`.
- `.env.example` is complete (`check:env-example` green).
- The 97 migrations have no duplicate or missing prefix.
- `--target=local` is the documented contributor path (README:34, `afrik-data-sync.md`).
- `scripts/seedAdminAllowlist.ts` seeds the first moderator.

The API calls (`/api/v2/countries`, `/peoples`, `/language-families`, `/search?q=wolof`) and `/docs/api` were not exercised against a running server this run. The build compiled every route.

### 2.4 What is the security posture?

**Strong in code, weaker around it.** In the code:

- RLS covers 47 of 47 tables net of drops, with five deny-all tables, each carrying its comment.
- The CSP nonce is per request (`btoa(crypto.randomUUID())`, `src/proxy.ts:611`; Next 16's `proxy.ts` replaced `middleware.ts`).
- API keys are hashed with PBKDF2-SHA256, 600,000 iterations and a 16-byte salt, and compared in constant time.
- Rate limiting runs on Upstash per tier, fails closed in production without credentials, and has no in-memory fallback.
- Sentry pins an EU DSN by assertion, sets `sendDefaultPii: false` and runs a scrubber.
- The service-role client stays unreachable from the browser, and the browser holds no data client.

Around the code:

- `gitleaks` is a required check on both branches, but it runs `--no-git` (`ci.yml:17-38`), so history is scanned by no recurring job. The leaked key above is the case in point.
- npm advisories improved: 12 (8 high, 4 moderate), from 17. The two production-dependency highs of the earlier run (`fast-uri` via ajv, `brace-expansion`) no longer appear. Production-side exposure is now `exceljs` and `uuid`, both moderate. `--omit=dev` was not run to confirm the split.
- The proxy-trust check is still owed, and the Upstash preflight is missing (§6, Domain 1).

### 2.5 Is the score close to 8–9/10?

**7.2/10, up from 7.1 earlier today.** The rise is small and earned: the build deprecations are gone, one cache-TTL P1 closed, npm advisories fell, `migration-state.md` is current, and the leaked key is recorded as dead. The distance to 8 is operational, not code. Three actions close most of it:

1. Schedule backups of both databases, and drill recette once.
2. Prune recette and turn the sync green.
3. Run the spoofed `X-Forwarded-For` check against production and add an Upstash preflight to the deploy.

## 3. Overall score

Ten domains, equal weight: **72 / 100 = 7.2 / 10**. No P0. Domain 8 has two failed checks out of eight and bands at 5–6.

## 4. Score per domain

|   # | Domain                             | Score | Change | Rationale                                                                                                                          |
| --: | ---------------------------------- | ----: | :----: | ---------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Security posture                   | **8** |   –    | Code controls strong, RLS 47/47; npm highs all dev-time and down to 8; proxy trust and the Upstash preflight still unverified      |
|   2 | Secrets hygiene                    | **7** |   +1   | Leaked rollback key recorded as disabled and `.entire/` ignored; no recurring history scan; Postgres password rotation unverified  |
|   3 | CI                                 | **7** |   –    | All required checks green; recette sync red 5×, nightly URL run red 8/8 (cause now readable), `recette` non-strict, zero approvals |
|   4 | Correctness & tests                | **9** |   –    | 10,872 tests, coverage 87/81/91/88; one test-isolation flake on the first run; dead-code and hardcoded bands clear                 |
|   5 | Deploy coherence                   | **8** |   –    | Five Releases deployed green with measured migration ledgers; Supabase CLI unpinned in the DDL path (carried over, not rechecked)  |
|   6 | Ferry pipeline                     | **6** |   –    | Router not run since 2026-09-12; reconciler green; Ferry source checked out by a mutable tag                                       |
|   7 | Architecture & boundaries          | **8** |   –    | Three-layer rule holds but for one route-to-service shortcut; no penalty bands; build deprecations gone (`src/proxy.ts`)           |
|   8 | AFRIK data integrity & Source Tier | **6** |   −1   | Two of eight checks fail (strict-model drift, recette parity); zero Source Tier P0s; FR28 debt at zero                             |
|   9 | Performance & accessibility        | **6** |   –    | Lighthouse gate and Playwright smoke required and green; the 0.85 performance target is still a warning, the enforced floor 0.73   |
|  10 | Documentation & runbooks           | **7** |   –    | Restore drill recorded; still no scheduled backup behind the RPO it declares; `migration-state.md` now current; limiter doc stale  |

## 5. Strengths

- **Five Releases in eleven days, every deploy green, and each one's `migrate` job reports a clean ledger.** The release path is now routine rather than an event.
- **`confidence-recompute` is fixed where it runs.** The fix reached `main` and has passed six nights running, closing the last audit's top action.
- **The restore mechanism was drilled against self-hosted production.** That leaves the backup _schedule_ as the gap, not the method.
- **The editorial contract is clean at the source.**
  - FR28 debt is at zero in all three bands.
  - The corpus has no Source Tier P0.
  - The register rule was extended to the field the last audit flagged, and the leak was rewritten.
- **Strict-model drift fell without a ceiling being raised:** peuple −42, pays −4.
- **`check:dead` and the hardcoded-value scan both stay inside the no-penalty bands** while the codebase grew by 330 commits.

## 6. Gaps and risks

### Domain 1 — Security posture

- **P2, improved: dependency advisories.** `npm audit` finds 12 (0 critical, 8 high, 4 moderate), down from 17. Every high is a lint, build or dev chain (`@next/eslint-plugin-next`, `eslint-config-next`, `braces`, `chokidar`, `fast-glob`, `micromatch`, `tailwindcss`, `knip`). The moderates are `@storybook/addon-actions`, `@storybook/addon-essentials`, `exceljs` and `uuid`. `--omit=dev` was not run, so the production-only split is inferred from the package names. Counted from a `node_modules` cloned from the main checkout.
- **P1, unchanged:** `TRUSTED_PROXY_HOPS` (default 1) has not been checked against the live proxy chain. `clientIp()` (`src/lib/api/clientIp.ts:35-46`) counts `X-Forwarded-For` from the right and returns null on a short chain; `clientIp.test.ts` only stubs the env var. The runbook's spoofed-header procedure (`production-deploy.md:108-115`) has no recorded run.
- **P1, standing: production's Upstash variables exist only in the VPS `.env`** (`docker-compose.yml:33`, `env_file: .env`). No workflow references `UPSTASH`, and `deploy-production.yml` has no preflight or post-deploy `/api/v2` smoke. Rate limiting fails closed in production without them, so every `/api/v2` call answers 500 while the pages stay green.
- **P2, new:** `docs/DEPLOYMENT.md:291-292` says the limiter is "disabled" without those variables. The code fails closed in production (`rate-limit.ts:207-227`), so the doc understates the failure.
- **P2, new:** `src/app/api/v2/feed/revisions/route.ts:94,119-148` calls a service directly and parses its query inline. Fifteen routes read `searchParams` without importing `utils/validation`; several use zod instead, none were opened to confirm.
- **P2, unchanged:** transient Upstash failures fail open on read quotas (`rate-limit.ts:247`, deliberate). Legacy `/api/entities/*` (seven routes, SSR anon client) is still unmetered. `flags_read_public` is `USING (true)` (migration 022), which exposes contributor fields over PostgREST. `audit_log` and `contributor_profiles` read policies are also `USING (true)` and deserve the same review.
- **P3, new:** `supabase/config.toml:68` keeps `enable_signup = true`. The sign-in action checks the allowlist before sending a link, but the OTP endpoint can be called directly with the anon key. The impact is bounded: the session can only mint `public`-tier keys (`keyService.ts:95`), the same tier `/keys/issue` grants anonymously.
- **P3:** public pages allow `style-src 'unsafe-inline'` (`src/proxy.ts:187-189`), a documented follow-up.

### Domain 2 — Secrets hygiene

- **P2, downgraded from P1: a Supabase `service_role` JWT for the hosted rollback project `shmrjtnfbqzceovroqjj` is in git history, recorded as dead.**
  - **Where it is:** commits `2938bf073` and `6d75c125a` (2026-08-26), agent-session transcripts under `.entire/metadata/…`. `.entire/` is now gitignored. Whether those commits are on a remote was not re-checked this run; the earlier run found no remote `entire/*` branch.
  - **Why it is lower:** `docs/runbooks/secret-exposure-audit-2026-09.md` ("Closure") records the project's legacy anon and service-role keys disabled project-wide on 2026-09-01 and the leaked key probed and rejected. That is a runbook's claim: this run did not probe the key, and the earlier run read only its claims (expiry 2036).
  - **Still open:** the same runbook says the leaked Postgres password's rotation is "not verified" (commit `6d75c125a`). If the hosted project is ever reactivated before ETNI-1962, confirm its legacy keys stay disabled.
- **P1, standing: CI's gitleaks job runs `--no-git` (`ci.yml:17-38`), so no recurring job scans history.** It is a required check on both branches, but it reads the PR's tree only. The earlier run's local scan classified its other history findings as false positives (`_bmad` manifest hashes, test fixtures, placeholder `Bearer YOUR_…` headers).
- **Pass:** only `.env.example` files are tracked, and `.gitignore:168` (`.env*`) covers every variant. The working-tree secret grep has one hit, a benign Laravel-encrypted id inside a parliament URL (`PAT_BABIRYE.json:64`). `check:local-paths` is green.

### Domain 3 — CI

- **P1, new: `recette-data-sync.yml` is red 5 runs in a row.** The canonical finding is Domain 8, check 5.
- **P1, standing: the nightly `data-integrity.yml` URL run is red on all of its last 8 nights** (since at least 2026-09-26; last 37107311021). The failing check is now readable in the log of run 36981844909: FR30/31 reports two unreachable URLs, `maktaba.org/book/1154/…` and `archive.org/details/kupilikulagovern0000west`. Two dead links keep the nightly red; it is not a PR gate, but a nightly that never goes green tells nobody anything. Fix the two citations, or demote the check.
- **P2, new:** `ferry-router.yml` is not a required check and has had no run since 2026-09-12 (two of its last four failed); see Domain 6.
- **P2, unchanged:** `recette` protection is `strict: false`. Neither branch requires an approval (`enforce_admins` is true on both). Nine contexts are required on both.
- **P2, new:** `migrate-recette.yml:50-58` turns a missing `RECETTE_SUPABASE_URL` into a warning, skips every later step, and still passes.
- **Resolved:** `confidence-recompute` (previous action 1).

### Domain 4 — Correctness & tests

- **P2, new: one test-isolation flake.** On the first `test:coverage` run, `src/lib/__tests__/brandQualifierCharter.test.ts` failed with `ENOENT … scripts/__tests__/tmp_test_…`. It walks `scripts/` while another test creates and removes a temporary directory there. It passes alone (7/7) and the full suite passed on the rerun (10,872 tests). A required gate that can fail on a race will eventually cost someone a re-run; make the charter test tolerate a vanishing directory, or isolate the temp-dir test.
- The P1 dead-code items (§ Dead code below) stay within the no-penalty band. Stray `console.*`: 5, all client-side (`error.tsx:21`, `docs/api/v2/page.tsx:38`, `ContributionFormFields.tsx:78,110`, `pii-scrubber.ts:24`); the server-side `no-console` scope is clean. TODO/FIXME: 4.

### Domain 5 — Deploy coherence

- **P2, new:** `supabase/setup-cli` installs `version: latest` in `deploy-production.yml:96` and `migrate-recette.yml:73`. The action is SHA-pinned, but the CLI that runs production DDL is not.
- **Carried over, not rechecked this run:** recette's `package.json` version string lagging v4.22.0.
- **Info:** migrations 096 and 097 are on recette and in no Release yet. Production is at 095, recette at 097, each measured; `migration-state.md` quotes the same two runs.
- The data-integrity `migration-state` nightly reads the generic `NEXT_PUBLIC_SUPABASE_URL` secret (`data-integrity.yml:133-136`), so which database it measures is ambiguous. It reports applied 94 · drifted 1 (`038`, adjudicated).

### Domain 6 — Ferry pipeline

- **Unchanged:** `ferry-router.yml` has not run since 2026-09-12 (34686519014, failure: no branch for ETNI-1891; two of its four latest runs failed). `ferry-reconcile.yml` runs every six hours or so, green (latest 37123516392). `ferry.config.yaml` parses and `git.base_branch` and `target_branch` are both `recette`.
- **P2, new:** `ferry-reconcile.yml:25` and `ferry-cost-daily.yml:31` check out Ferry's source with `FERRY_REF: v1.2.0`, a mutable tag. `check:action-pins` cannot see it because it is a `ref:` input, not a `uses:`. The router's four `uses:` are SHA-pinned.

### Domain 7 — Architecture & boundaries

- Three-layer rule holds: no `src/app/api/v2/**/route.ts` imports Supabase or `admin`/`server` clients. One route imports a service directly (`feed/revisions`, Domain 1, P2).
- **Resolved:** the three build deprecations. The proxy is `src/proxy.ts` and `next build` printed no deprecation warning.
- **Not checked:** OpenAPI JSDoc coverage per route folder. The `apis` glob (`openapiV2.ts:5190`) covers every file under `src/app/api/v2`, but the 23 route folders were not diffed against the documented paths.

### Domain 8 — AFRIK data integrity and Source Tier

- **P1, new: recette serves `PPL_BUSANSI` and `PPL_BUSSA`, deleted from git by #1481 (the Bissa merge).** `verifyCorpusInDatabase.ts --target=recette` reports `afrik_peoples` 772 vs 770, `afrik_people_languages` 1,175 vs 1,173, and `afrik_people_countries` 1,460 vs 1,454. Every other table matches. The recette sync never prunes (`recette-data-sync.yml:113`), so only an operator `--prune` run removes them (`docs/runbooks/afrik-data-sync.md`). Production parity is `N/A` this run.
- **Unchanged, improving:** strict-model drift is held by `STRICT_MODEL_DRIFT_CEILINGS` (`validateAfrikData.ts:4781-4803`): peuple 7,006, famille 104, pays 9. 308 of 770 peoples and 4 families (`FLG_BERBERE`, `FLG_MANDE`, `FLG_OMOTIQUE`, `FLG_SONGHAY`) lack `classificationStatus`.
- **P2, new:** `dossiers/`, `noms/` and `relations/` are not in `MODEL_BY_DIRECTORY` (`checkEditorialRules.ts:575-581`), so the 13 dossier `claim` fields sit outside the register rule. They are clean today. A `claim` hit in patronymes is a warning, not an error (`:762`).
- **P2, new:** two stale comments in `validateAfrikData.ts:5264-5284` describe FR27-references as advisory and FR28-declared as a hard error. The code does neither.
- **Debt:** `needs_review` 913 (ratchet 913). The source catalogue reports 4,271 citations from uncatalogued domains and 1,686 without a URL, as warnings.

### Domain 9 — Performance and accessibility

- **Improved:** the Lighthouse gate and the Playwright smoke at 430 px are required contexts, and both are green.
- **Unchanged:** the 0.85 performance target is still only a warning. `.lighthouserc.js:204,219` enforces 0.73 on ordinary routes, and the three WebGL fiches are held by TBT/LCP ratchets with performance at `warn` (`:236`). Full E2E and the visual harness are not required.

### Domain 10 — Documentation and runbooks

- **Resolved:** a restore drill is on record (`restore-drill-2026-09-22.md`, self-hosted production), next due 2026-12-22.
- **P1, standing in a new form: there is no scheduled backup of either database** (`restore-procedure.md:21-22`), so the RPO ≤ 24 h the same document declares is unachievable. Recette has never been drilled, and the drill-reminder workflow is gone (`:259-262`).
- **Resolved: `docs/runbooks/migration-state.md` is current.** It was last verified 2026-10-03 and quotes recette 001–097 (run 37115838551) and production 001–095 (run 36827759480). Two later recette runs (07:55 and 15:30) are not in it; both succeeded.
- **P2:** the restore drill's next-due date (2026-12-22) has no reminder behind it, because `backup-drill-reminder.yml` was removed.
- **Info:** the operator's local `data_quality_status.md` note (from 2026-04/05) still quotes 789 peoples and the retired CIA Factbook. It is outside the repo, but it is the carry-over source this audit reads.
- Pass: `README`, `CLAUDE.md`, `AGENTS.md` and `docs/DEPLOYMENT.md` agree on the topology (both stacks self-hosted, GitHub Release → VPS, `vercel.json` `deploymentEnabled: false`). `ETNI`, `ETHNIAFRIC` and the engineering root page id agree.

### Hardcoded values (P0/P1)

0 P0, 1 P1 group (was 2; under the no-penalty threshold). Every rate-limit count and window and the request timeout read env with a default, and no Supabase, Upstash or Sentry URL literal survives in `src`. About 40 P2 items (pagination caps repeated as `*_MAX_PAGES = 40` in eight service files, truncation lengths, UI timers).

**Cache TTLs**

- **P1** `src/api/v2/services/corpusCache.ts:34-55` — 60 / 3600 / s-maxage 86400 + swr 86400 / s-maxage 60 + swr 30 / 31536000 — centralised corpus cache TTLs with no env override.
- **P1** `src/app/[lang]/atlas/{peuples,pays,familles,langues,noms}/[slug]/page.tsx` and `comparer/[entityType]/[...ids]/page.tsx` — `export const revalidate = 3600` — Next requires a static literal here. `cacheFreshnessContract.test.ts` is said to hold them to the constants; this run did not reread it.
- **Resolved:** `src/lib/hubs/moduleAvailability.ts:135,220` now use `HUB_AVAILABILITY_REVALIDATE_SECONDS` (`corpusCache.ts:34`).

**Rate-limit defaults (carried over as env-driven, wiring not reread)**

- `src/lib/api/rate-limit.ts:66-68` — 60 / 600 / 6000 requests per minute; `:73` `KEY_ISSUANCE_ATTEMPTS_PER_HOUR = 5`, fixed on purpose.

### Dead code & redundancy

`check:dead` passes at every ceiling. `knip --production` finds 11 items: 3 files, 7 exports, 1 type, 0 dependencies. No surviving V1 import. 0 P0.

**P1**

- `src/lib/home/corpusCounts.ts:57` — `getCorpusCounts`, reached only by tests.
- `src/lib/home/didYouKnowFacts.ts:1871` — `pickDidYouKnowFacts`, reached only by its test.
- `src/lib/home/homeHeroVisuals.ts:89` — `drawHomeHeroVisual`, reached only by its test.
- Production-mode dead files `src/lib/games/corpus.en.ts`, `src/lib/games/landmarks.en.ts`, `src/lib/glossaire/entries.en.ts`: the intentionally dormant English banks, held by the 3/3 ceiling.

**P2**

- Seven shadcn sub-component exports (`dialog`, `dropdown-menu`, `select`, `sheet`).
- `ArticleRecord` type, used only by fixtures.
- jscpd: 3.33% duplicated lines (309 clones, 5,912 lines, 1,016 files). The one group the earlier run found spanning ≥3 files is the `revalidate` / `generateMetadata` boilerplate across the `[slug]` pages; per-group sizes were not re-extracted. It overlaps the cache-TTL P1 above and is counted once.
- ts-prune output is noise (barrels, e2e helpers, opengraph exports); knip is authoritative. `src/types/afrik-frontend.ts:312-326` re-exports were not confirmed unused.

## 7. Consumer and contributor flow

| Step                                    | Verdict | Evidence                                                                                |
| --------------------------------------- | :-----: | --------------------------------------------------------------------------------------- |
| `git clone` + `npm ci`                  |  PASS   | `.npmrc` `legacy-peer-deps=true` documented                                             |
| `.env.example` → `.env.local`           |  PASS   | `check:env-example` green, 74 references                                                |
| Migrations apply in order               |  PASS   | 97 files, no duplicate or missing prefix; recette ledger clean                          |
| Local stack + corpus (`--target=local`) |  PASS   | README:34, `afrik-data-sync.md` "Local bootstrap"                                       |
| First moderator                         |  PASS   | `scripts/seedAdminAllowlist.ts`, `moderation-access.md`                                 |
| `npm run dev` / API smoke / `/docs/api` |   N/A   | Not booted this run; `next build` compiled every route                                  |
| `/admin` allowlist-only                 |  PASS   | `moderator.ts` → `isEmailAllowlisted()`; `src/proxy.ts:912-930` gates `/{lang}/admin/*` |

## 8. Security posture

| Control                | Verdict | Evidence                                                                                                       |
| ---------------------- | :-----: | -------------------------------------------------------------------------------------------------------------- |
| CSP / headers          |  PASS   | Per-request nonce (`src/proxy.ts:611`), HSTS, nosniff, strict referrer, `frame-ancestors 'self'`               |
| Locale fail-closed     |  PASS   | `locale.ts:38-40` returns `fr-only` on missing/invalid `SITE_LOCALE_MODE`                                      |
| API keys               |  PASS   | PBKDF2-SHA256 600,000 iterations, 16-byte salt, constant-time compare; invalid key → 401                       |
| Rate limiting          |  PASS   | Upstash per tier, fail-closed without credentials in production, no in-memory fallback                         |
| Client-IP trust        |  WARN   | Single `clientIp()` function; not checked against the live proxy                                               |
| CORS                   |  PASS   | Single configured origin, no `*` fallback, no credentials                                                      |
| Service-role isolation |  PASS   | No `admin` import outside `api/`/`admin/`; `createBrowserClient` only in `auth-client.ts`, auth calls only     |
| Sentry                 |  PASS   | `assertEuDsn` in all three configs, `sendDefaultPii: false`, PII scrubber on events and transactions           |
| RLS                    |  PASS   | 47/47 net of drops; five deny-all tables, each with its comment                                                |
| Secrets                |  WARN   | Rollback-project key in history, recorded dead (P2); CI scan `--no-git`; Postgres password rotation unverified |
| Supply chain           |  WARN   | Actions SHA-pinned; `gitleaks` required; 8 high advisories, all dev-time; Supabase CLI and Ferry source float  |
| Branch protection      |  PASS   | Nine required contexts on both branches; `main` strict, `recette` not; zero approvals                          |

**RLS coverage, net of drops** (97 migrations; no table, policy or RLS change since 093):

| Table                                                                                            | Last created | RLS enabled in | Net policies | Notes                         |
| ------------------------------------------------------------------------------------------------ | -----------: | -------------: | -----------: | ----------------------------- |
| admin_allowlist                                                                                  |          074 |            074 |            0 | Deny-all, commented (074:46)  |
| antibot_challenges                                                                               |          048 |            048 |            0 | Deny-all, commented (048:94)  |
| flag_reporter_contacts                                                                           |          075 |            075 |            0 | Deny-all, commented (075:55)  |
| search_query_log                                                                                 |          050 |            050 |            0 | Deny-all, commented (050:9)   |
| source_tier_ruling_drafts                                                                        |          090 |            090 |            0 | Deny-all, commented (090:89)  |
| afrik_countries, afrik_language_families, afrik_languages, afrik_peoples, afrik_people_countries |          006 |            019 |       1 each | Public read                   |
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
| audit_log                                                                                        |          009 |            009 |            2 | Read `USING (true)` (023:320) |
| contributor_profiles                                                                             |          026 |            026 |            3 | Read `USING (true)`           |
| editorial_doctrine                                                                               |          009 |            017 |            4 | Read + anon no-write          |
| fiche_revisions                                                                                  |          020 |            020 |            1 | Public read                   |
| flags                                                                                            |          009 |            022 |            3 | Read `USING (true)` (P2)      |
| migration_events, migration_event_peoples                                                        |          035 |            035 |       4 each | Read + moderator writes       |
| name_records                                                                                     |          029 |            029 |            4 | Read + moderator writes       |
| oral_narratives, oral_narrative_links                                                            |          032 |            032 |       1 each | Public read                   |
| persons, person_countries, person_peoples                                                        |          057 |            057 |       1 each | Public read                   |
| protected_records, protected_record_audit                                                        |          033 |            033 |       1 each | Editorial select              |
| quiz_questions, quiz_generation_runs                                                             |          036 |            036 |       1 each | Public read                   |
| revision_drafts                                                                                  |          023 |            023 |            4 | Moderator CRUD                |
| revisions                                                                                        |          009 |            021 |            2 | Read + moderator insert       |
| source_working_assets                                                                            |          034 |            034 |            5 | Owner + editor                |
| user_roles (legacy)                                                                              |          008 |            008 |            4 | Opens no door in the console  |

No `RLS = No` row; no RLS-enabled table without either a policy or a deny-all comment.

## 9. Performance and accessibility posture

| Control                    | Verdict | Evidence                                                                                                 |
| -------------------------- | :-----: | -------------------------------------------------------------------------------------------------------- |
| Lighthouse PR gate         |  PASS   | Required context "Lighthouse gate", last run green; `.lighthouserc.gate.js` a11y/BP errors               |
| Lighthouse nightly budgets |  WARN   | a11y = 1 and BP ≥ 0.95 enforced; performance enforced at 0.73, the 0.85 target only warns                |
| axe-core                   |  PASS   | Required context "axe-core (Storybook)"; `a11y.yml` 6 of 6 green, no `continue-on-error`                 |
| E2E                        |  PASS   | Required "Playwright smoke (fr, 430px)" green; full `e2e.yml` green on its last six runs, not required   |
| Locale posture             |  PASS   | Lighthouse measures `/fr` in full and an `/en` subset under `bilingual-fr-default`; production `fr-only` |

## 10. AFRIK data integrity and Source Tier compliance

|   # | Required check          | Verdict |  Change   | Evidence                                                                                                                                                                                                 |
| --: | ----------------------- | :-----: | :-------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Strict model adherence  |  FAIL   |     –     | 10-fiche sample: no undeclared key. Drift held by ratchet (peuple 7,006 / famille 104 / pays 9); 308/770 peoples and 4/25 families lack `classificationStatus`                                           |
|   2 | Full validator          |  PASS   |     –     | 57/57, 0 errors, 5,876 warnings (5,852 source catalogue, 24 FR52). FR28 0 · FR28-strict 0 · FR28-declared 0. `SOFT_CHECK_NAMES` = `FR52-coverage` only                                                   |
|   3 | Referential integrity   |  PASS   |     –     | Folder/parent, ID/filename and ISO format all pass (0 mismatches over 770 peoples). 16 codes (21 references) have no `pays` file, mostly diaspora; GLP, MYT, REU are territory codes, an editorial call  |
|   4 | Source Tier compliance  |  PASS   |     –     | 7,458 entries: official 1,759 · referenced 2,206 · unverified 2,580 · `needs_review` 913 · missing 0 · other 0. 0 P0. 497 `ai_generated`. 6 direct Wikipedia URLs (reported). CIA Factbook 132 = ceiling |
|   5 | Database vs source JSON |  FAIL   | PASS→FAIL | Recette: peoples 772 vs 770, people↔language 1,175 vs 1,173, people↔country 1,460 vs 1,454 (`PPL_BUSANSI`, `PPL_BUSSA`); other tables equal. Production N/A                                              |
|   6 | CI enforcement          |  PASS   |     –     | `data-integrity.yml` and `editorial-rules.yml` on every PR into `main`/`recette`, no `continue-on-error`, last PR runs green, `validate` required                                                        |
|   7 | Reader-facing register  |  PASS   |     –     | Gate 0 errors; full sweep of `gaps[].reason`, `sources[].title`, `sources[].notes` and 595 `claim` fields: 0 hits. `PAT_DIALLO` fixed                                                                    |
|   8 | Known-issue carry-over  |  PASS   |     –     | `UNDATED_POLITY_CEILING` 95 = measured 95. The carry-over note itself is stale (§6, Domain 10)                                                                                                           |

**Two failed checks band Domain 8 at 5–6; scored 6**: no Source Tier P0, and FR28 debt at zero.

## 11. Prioritized actions

| Priority | Finding                    | Action                                                                                                                  | Done when                                                                     |
| -------: | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
|        1 | D10 (no scheduled backup)  | Schedule a daily dump of both self-hosted databases off the host; drill recette once                                    | A dated backup ≤ 24 h old exists for each database                            |
|        2 | D8-5 (recette parity)      | Run the operator `--prune` against recette (`afrik-data-sync.md`)                                                       | `verifyCorpusInDatabase.ts --target=recette` equal; `recette-data-sync` green |
|        3 | D1 (proxy trust)           | Run the spoofed `X-Forwarded-For` check against production and record it in `production-deploy.md`                      | The stored address is the real caller's, and the run is dated in the runbook  |
|        4 | D1 (Upstash preflight)     | Add a post-deploy `/api/v2` smoke check or a variable preflight to `deploy-production.yml`; fix `DEPLOYMENT.md:291-292` | A deploy without the variables fails loudly instead of serving 500s           |
|        5 | D3 (nightly URL run)       | Replace or archive the two unreachable citations (`maktaba.org/book/1154`, `archive.org/…kupilikulagovern0000west`)     | `data-integrity.yml` schedule green                                           |
|        6 | D2 (history never scanned) | Add a scheduled full-history gitleaks run; verify the leaked Postgres password was rotated                              | A scheduled scan reports zero unclassified findings; rotation proof recorded  |
|        7 | D4 (test flake)            | Make `brandQualifierCharter.test.ts` tolerate a vanishing directory, or isolate the temp-dir test                       | Ten consecutive full runs without the ENOENT                                  |
|        8 | D1 (npm advisories)        | Run `npm audit --omit=dev`; bump `exceljs` and `uuid` if they ship                                                      | 0 high and 0 moderate in production dependencies                              |
|        9 | D5 / D6 (floating pins)    | Pin the Supabase CLI version and `FERRY_REF` to a SHA                                                                   | No `latest` or tag ref left in a workflow                                     |
|       10 | D8-1 (strict-model drift)  | Fill `classificationStatus` on the 308 peoples and 4 families, lowering the ceilings each pass                          | Ceilings trend down without raising                                           |
|       11 | D9 (performance target)    | Decide the enforced Lighthouse floor                                                                                    | Documented budget equals the enforced assertion                               |
|       12 | D6 (Ferry router)          | Exercise the router on a live transition, or record it as retired                                                       | A green router run within the last week, or a SUPERSEDED note                 |
|       13 | D1 (layering)              | Route `feed/revisions` through a handler; check `searchParams` validation on the 15 routes that skip `utils/validation` | Every v2 route follows route → handler → service                              |

**Closed since the earlier run today:** build deprecations (`proxy.ts`), the second `moduleAvailability` cache literal, `migration-state.md` staleness, the production-dependency npm highs. The leaked rollback key is downgraded on the strength of a runbook record, not a probe.

## 12. Conclusion

EthniAfrica's software holds its best measured state:

- Five Releases shipped in eleven days with clean migration ledgers.
- Every required gate is green; the one red test on the first run was a race, not a regression.
- The editorial corpus carries zero Source Tier P0s and zero demographic debt.
- #1494 closed the earlier run's code-level findings, and this run could confirm it for the build, the cache literals and the runbook.

What keeps the score at 7.2 sits outside the code. Nothing schedules a backup, so the RPO the runbook declares cannot be met. Recette serves two peoples git deleted and its sync stays red. Two operational settings have never been proven against the live system: the proxy hop count and the Upstash variables. None needs a redesign. Closing the first three actions would move the score above 7.5.
