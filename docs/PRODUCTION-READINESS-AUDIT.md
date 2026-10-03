# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-10-03<br>
**Audited checkout:** `origin/recette` at `8d16601a7` (330 commits after the 2026-09-22 audit; five Releases shipped since, v4.18.0 → v4.22.0)<br>
**Overall score:** **7.1 / 10** (was 7.6 on 2026-09-22, 6.4 on 2026-09-21)<br>
**Release verdict:** **CONDITIONAL GO.** The code, the gates and the release path are in their best measured state yet: every per-PR gate green, five Releases deployed green, `confidence-recompute` fixed on `main`, the restore mechanism drilled. The score falls because this run measured three things the last one did not reach: a service-role key for the hosted rollback project sitting in local git history, recette serving two peoples git deleted, and still no scheduled backup of either self-hosted database.

## 1. Scope and method

Full audit (no `--quick`, no `--no-build`), read-only, run in an isolated worktree on `origin/recette`'s tip. Outcomes were read from command output, GitHub run conclusions, the branch-protection API, Release job logs and a read-only select against recette. Evidence gathering was split across four parallel read-only passes (CI/deploy, AFRIK integrity, hardcoded values and dead code, security); every figure below comes from a command run this day.

**What changed since 2026-09-22**

- **Shipped:** Releases v4.18.0 (09-22), v4.19.0 (09-23), v4.20.0 (09-25), v4.21.0 (09-27) and v4.22.0 (10-01), each with a green `deploy-production.yml` run. `main` now carries #1247's `--conditions=react-server` (`confidence-recompute.yml:27,33`) and the job has been green six nights running.
- **Done:** a restore drill against the self-hosted production stack (`docs/runbooks/restore-drill-2026-09-22.md`, Path C); the `PAT_DIALLO` register leak rewritten and the register rule extended to name-record `claim` fields; strict-model drift lowered (peuple 7,048 → 7,006, pays 13 → 9); `needs_review` 915 → 913.
- **Not done:** the client-IP trust check against the live proxy; a scheduled backup; any Ferry router run.

**Measured this run**

| Check                       | Outcome | Evidence                                                                                                                 |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| Lint                        | PASS    | 0 errors, 35 warnings, 0 unused `eslint-disable`                                                                         |
| Typecheck / format          | PASS    | `tsc --noEmit` and `prettier --check` clean                                                                              |
| Unit tests                  | PASS    | 1,048 files passed, 3 skipped; 10,870 tests passed, 21 skipped (`npm run test:coverage`, which runs the full suite)      |
| Coverage                    | PASS    | 87.18% statements, 80.97% branches, 90.59% functions, 88.29% lines (thresholds 70/60/70/70)                              |
| Production build            | PASS    | Compiled; 47 static pages; three deprecation warnings (§6, Domain 7)                                                     |
| Dead-code ratchet           | PASS    | `check:dead` at every ceiling (exports 7/7, production files 3/3, production dependencies 0/0)                           |
| `check:env-example`         | PASS    | 74 env references, all documented, every documented entry read                                                           |
| `check:local-paths`         | PASS    | Clean, 10 self-tests                                                                                                     |
| `check:action-pins` / shell | PASS    | Every third-party `uses:` SHA-pinned; every `run:` block parses                                                          |
| RLS coverage                | PASS    | `check:rls-coverage` and an independent replay of 97 migrations: 47 of 47 surviving tables behind RLS                    |
| AFRIK validator             | PASS    | 57/57 checks, 0 errors; FR28, FR28-strict, FR28-declared all 0 warnings                                                  |
| Editorial rules             | PASS    | 0 errors, 95 warnings, all `chronology-symmetry` (`UNDATED_POLITY_CEILING` = 95)                                         |
| Source Tier coverage        | PASS    | `needs_review` 913/913 ratchet, exact                                                                                    |
| `check:afrik-loader`        | PASS    | Patronyme corpus loads cleanly                                                                                           |
| `check:glossary`            | PASS    | 0 divergences, 85 terms                                                                                                  |
| Per-PR gates                | PASS    | Last runs of CI, data-integrity, editorial-rules, a11y, Lighthouse, E2E, openapi-diff all `success`                      |
| Production deploy           | PASS    | v4.22.0 run 36827759480: `migrate` applied 094, 095 → applied 95 · pending 0 · orphaned 0 · drifted 0                    |
| Recette migrations          | PASS    | `migrate-recette.yml` run 37115838551: applied 97 · pending 0 · orphaned 0 · drifted 0                                   |
| `confidence-recompute`      | PASS    | FAIL → PASS: 6 of 6 scheduled runs green since the fix reached `main`                                                    |
| **Recette data sync**       | FAIL    | `recette-data-sync.yml` red 5 runs in a row (last 37122368825): two deleted peoples still in recette (§10, check 5)      |
| **Nightly data-integrity**  | FAIL    | Scheduled URL run red 23 of the last 25 nights (last 37107311021); not a PR gate, and its log truncates before the error |
| npm audit                   | WARN    | 17 advisories: 10 high, 6 moderate, 1 low (was 0 high); production-only: 2 high, 2 moderate, 1 low                       |
| Full-history secret scan    | FAIL    | Local gitleaks over the available history: a service-role JWT in local-only `entire/*` branches (§6, Domain 2)           |

**`N/A` (never counted as a pass)**

- `check:migration-state` and `check:migration-state:production` run locally: no credentials in the worktree. Both ledgers were read from CI job logs instead (above).
- Production database vs git (check 5): `AFRIK_PRODUCTION_SUPABASE_URL` not available locally. Production's own sync (`production-data-sync.yml`) is green since 2026-09-25.
- The client-IP trust behind `TRUSTED_PROXY_HOPS` against the live proxy: still not run.
- `check:infra-disclosure` is only partial locally (`INFRA_DISCLOSURE_TERMS` unset); CI injects it.
- The Jira board's live column names against `ferry-jira-automation-setup.md`: not read.

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Conditionally.** The application, its gates and its release path are sound and measured green end to end. Three blockers are operational:

1. **No scheduled backup of either self-hosted database.** The restore mechanism was proven on 2026-09-22, but `restore-procedure.md:21-22` states there is nothing scheduled to restore from, so the declared RPO ≤ 24 h cannot be met.
2. **A service-role key for the hosted rollback project (`shmrjtnfbqzceovroqjj`) lives in local git history** and was pasted into an agent prompt. It is not on GitHub, but it is valid until 2036 and the project stays alive until ETNI-1962.
3. **Recette serves two peoples that git deleted** (`PPL_BUSANSI`, `PPL_BUSSA`, merged into Bissa by #1481), and its data sync has been red since.

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
- The CSP nonce is per request (`btoa(crypto.randomUUID())`, `middleware.ts:611`).
- API keys are hashed with PBKDF2-SHA256, 600,000 iterations and a 16-byte salt, and compared in constant time.
- Rate limiting runs on Upstash per tier, fails closed in production without credentials, and has no in-memory fallback.
- Sentry pins an EU DSN by assertion, sets `sendDefaultPii: false` and runs a scrubber.
- The service-role client stays unreachable from the browser, and the browser holds no data client.

Around the code, three things regressed:

- The service-role key in local history (P1).
- npm high advisories went from 0 to 10, two of them in production dependencies (`fast-uri` via ajv, `brace-expansion`).
- The CI gitleaks job runs `--no-git`, so it would never see history if those branches were pushed.

The proxy-trust check is still owed.

### 2.5 Is the score close to 8–9/10?

**7.1/10, down from 7.6.** The drop is measurement, not decay: a deeper secret scan and a direct read of recette surfaced defects the last run could not see. Three actions close most of the distance:

1. Rotate or retire the leaked key, and delete the local `entire/*` branches.
2. Schedule backups of both databases.
3. Prune recette and turn the sync green.

## 3. Overall score

Ten domains, equal weight: **71 / 100 = 7.1 / 10**. No P0. Domain 8 has two failed checks out of eight and bands at 5–6.

## 4. Score per domain

|   # | Domain                             | Score | Change | Rationale                                                                                                                              |
| --: | ---------------------------------- | ----: | :----: | -------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Security posture                   | **8** |   −1   | Code controls unchanged and strong; npm high advisories 0 → 10 (2 in production deps); proxy trust still unverified                    |
|   2 | Secrets hygiene                    | **6** |   −2   | Service-role JWT for the rollback project in local-only history; CI secret scan never reads history                                    |
|   3 | CI                                 | **7** |   –    | All required checks green and `confidence-recompute` fixed; recette sync red 5×, nightly URL run red 23/25, `recette` still non-strict |
|   4 | Correctness & tests                | **9** |   –    | 10,870 tests, coverage well above thresholds, dead-code and hardcoded bands clear                                                      |
|   5 | Deploy coherence                   | **8** |   –    | Five Releases deployed green with measured migration ledgers; Supabase CLI unpinned in the DDL path; recette's version string lags     |
|   6 | Ferry pipeline                     | **6** |   –    | Router not run since 2026-09-12; reconciler green; Ferry source checked out by a mutable tag                                           |
|   7 | Architecture & boundaries          | **8** |   –    | Three-layer rule holds on every v2 route; no penalty bands; `middleware` → `proxy` and Sentry deprecations pending                     |
|   8 | AFRIK data integrity & Source Tier | **6** |   −1   | Two of eight checks fail (strict-model drift, recette parity); zero Source Tier P0s; FR28 debt at zero                                 |
|   9 | Performance & accessibility        | **6** |   –    | Lighthouse gate and Playwright smoke required and green; the 0.85 performance target is still a warning, the enforced floor 0.73       |
|  10 | Documentation & runbooks           | **7** |   −1   | Restore drill recorded (resolved), but no scheduled backup behind the RPO it declares; `migration-state.md` four migrations stale      |

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

- **P1, new: dependency advisories regressed.** `npm audit` finds 10 high, 6 moderate and 1 low. In production dependencies alone there are 2 high (`fast-uri` via ajv 8.20.0, which has a fix available; `brace-expansion` via `@sentry/bundler-plugin-core` and archiver), 2 moderate (`exceljs`, `uuid`) and 1 low (`dompurify` via `swagger-ui-react`). The rest are build- or dev-time chains (`micromatch`, `fast-glob`, `chokidar`, `tailwindcss`, `knip`, `eslint-config-next`). Counted from a `node_modules` cloned from the main checkout; a fresh install may differ slightly.
- **P1, unchanged:** `TRUSTED_PROXY_HOPS` (default 1) has not been checked against the live proxy chain.
- **P2, unchanged:** transient Upstash failures fail open on read quotas (`rate-limit.ts:247`, deliberate). Legacy `/api/entities/*` (seven routes, SSR anon client) is still unmetered. `flags_read_public` is `USING (true)` (migration 022), which exposes contributor fields over PostgREST. `audit_log` and `contributor_profiles` read policies are also `USING (true)` and deserve the same review.
- **P3, new:** `supabase/config.toml:68` keeps `enable_signup = true`. The sign-in action checks the allowlist before sending a link, but the OTP endpoint can be called directly with the anon key. The impact is bounded: the session can only mint `public`-tier keys (`keyService.ts:95`), the same tier `/keys/issue` grants anonymously.
- **P3:** public pages allow `style-src 'unsafe-inline'` (`middleware.ts:186-189`), a documented follow-up.

### Domain 2 — Secrets hygiene

- **P1, new: a Supabase `service_role` JWT for the hosted project `shmrjtnfbqzceovroqjj` is in local git history.**
  - **What it is:** the recette rollback project, kept alive until ETNI-1962. Only the claims were decoded (role, ref, `exp` in 2036); the signature was not.
  - **Where it is:** agent-session transcripts (`.entire/metadata/…`, 2026-08-26) committed on local `entire/*` checkpoint branches.
  - **Not published:** `git ls-remote --heads origin 'entire/*'` returns nothing, and no remote branch contains the two commits. `.entire/` is not tracked on any working branch.
  - **Already exposed:** the key appeared in a prompt, so it has also left the machine in session logs.
  - **Remedy:** rotate that project's JWT secret, or bring ETNI-1962 forward. Delete the local `entire/*` branches and never push them.
- **P1, standing: CI's gitleaks job runs `--no-git` (`ci.yml:17-38`), so history is never scanned.** The checkout is shallow, and this run's local scan covered the 3,190 commits available. Its other findings are classified false positives: `_bmad` manifest hashes, test fixtures, placeholder `Bearer YOUR_…` headers. Short-lived `ASIA…` presigned-URL tokens also appear in the same transcripts.
- **Pass:** only `.env.example` files are tracked, and `.gitignore:168` (`.env*`) covers every variant. The working-tree secret grep has one hit, a benign Laravel-encrypted id inside a parliament URL (`PAT_BABIRYE.json:64`). `check:local-paths` is green.

### Domain 3 — CI

- **P1, new: `recette-data-sync.yml` is red 5 runs in a row.** The canonical finding is Domain 8, check 5.
- **P1, standing: the nightly `data-integrity.yml` URL run is red on 23 of the last 25 nights.** The run is `CHECK_SOURCE_URLS=true` (`data-integrity.yml:41-45`), and its log is truncated before any `❌` line, so the failing check cannot be read from CI. It is not a PR gate, but a nightly that has been red for three weeks no longer tells anyone anything.
- **P2, unchanged:** `recette` protection is `strict: false`. Neither branch requires an approval (`enforce_admins` is true on both). Nine contexts are required on both.
- **P2, new:** `migrate-recette.yml:50-58` turns a missing `RECETTE_SUPABASE_URL` into a warning, skips every later step, and still passes.
- **Resolved:** `confidence-recompute` (previous action 1).

### Domain 4 — Correctness & tests

- No new finding. The P1 dead-code items (§ Dead code below) stay within the no-penalty band.

### Domain 5 — Deploy coherence

- **P2, new:** `supabase/setup-cli` installs `version: latest` in `deploy-production.yml:96` and `migrate-recette.yml:73`. The action is SHA-pinned, but the CLI that runs production DDL is not.
- **P2, new:** recette's `package.json` says 4.21.0 while v4.22.0 has shipped. The release bump did not flow back.
- **Info:** 29 commits on `recette` are unreleased, including migrations 096 and 097. Production is at 095, recette at 097, each measured.
- The data-integrity `migration-state` nightly reads the generic `NEXT_PUBLIC_SUPABASE_URL` secret (`data-integrity.yml:133-136`), so which database it measures is ambiguous. It reports applied 94 · drifted 1 (`038`, adjudicated).

### Domain 6 — Ferry pipeline

- **Unchanged:** `ferry-router.yml` has not run since 2026-09-12 (34686519014, failure: no branch for ETNI-1891). `ferry-reconcile.yml` runs every few hours, green.
- **P2, new:** `ferry-reconcile.yml:25` and `ferry-cost-daily.yml:31` check out Ferry's source with `FERRY_REF: v1.2.0`, a mutable tag. `check:action-pins` cannot see it because it is a `ref:` input, not a `uses:`. The router's four `uses:` are SHA-pinned.

### Domain 7 — Architecture & boundaries

- Three-layer rule holds: no `src/app/api/v2/**/route.ts` imports Supabase.
- **P2, new — build deprecations:** Next 16 warns that the `middleware` file convention is deprecated in favour of `proxy`. Sentry warns that `withSentryConfig` should be imported from `@sentry/nextjs/config` and that `disableLogger` is deprecated. All three still build, and all three will stop working in a later major version.

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
- **P1, new: `docs/runbooks/migration-state.md` is stale.** It says "Last verified: 2026-09-18, 001 → 093 applied on both", while measured reality is 097 on recette and 095 on production.
- **Info:** the operator's local `data_quality_status.md` note (from 2026-04/05) still quotes 789 peoples and the retired CIA Factbook. It is outside the repo, but it is the carry-over source this audit reads.
- Pass: `README`, `CLAUDE.md`, `AGENTS.md` and `docs/DEPLOYMENT.md` agree on the topology (both stacks self-hosted, GitHub Release → VPS, `vercel.json` `deploymentEnabled: false`). `ETNI`, `ETHNIAFRIC` and the engineering root page id agree.

### Hardcoded values (P0/P1)

0 P0, 2 P1 groups (unchanged; under the no-penalty threshold). Every rate-limit count and window and every request timeout reads env, and no Supabase, Upstash or Sentry URL literal survives in `src`.

**Cache TTLs**

- **P1** `src/api/v2/services/corpusCache.ts:15-51` — 3600 / 60 / s-maxage 86400 / swr 86400 / 31536000 — centralised corpus cache TTLs with no env override. The page-level `revalidate` literals are held to these constants by `cacheFreshnessContract.test.ts`.
- **P1** `src/lib/hubs/moduleAvailability.ts:134,219` — `{ revalidate: 60 }` ×2 — bare literals rather than `PUBLIC_FLAGS_REVALIDATE_SECONDS`, outside the freshness contract.

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
- jscpd: 3.38% duplicated lines. One group spans ≥3 files: the `revalidate` / `generateMetadata` page boilerplate across four `[slug]` pages, 15–35 lines each, mostly imports.

## 7. Consumer and contributor flow

| Step                                    | Verdict | Evidence                                                                    |
| --------------------------------------- | :-----: | --------------------------------------------------------------------------- |
| `git clone` + `npm ci`                  |  PASS   | `.npmrc` `legacy-peer-deps=true` documented                                 |
| `.env.example` → `.env.local`           |  PASS   | `check:env-example` green, 74 references                                    |
| Migrations apply in order               |  PASS   | 97 files, no duplicate or missing prefix; recette ledger clean              |
| Local stack + corpus (`--target=local`) |  PASS   | README:34, `afrik-data-sync.md` "Local bootstrap"                           |
| First moderator                         |  PASS   | `scripts/seedAdminAllowlist.ts`, `moderation-access.md`                     |
| `npm run dev` / API smoke / `/docs/api` |   N/A   | Not booted this run; `next build` compiled every route                      |
| `/admin` allowlist-only                 |  PASS   | `moderator.ts` → `isEmailAllowlisted()`; middleware gates `/{lang}/admin/*` |

## 8. Security posture

| Control                | Verdict | Evidence                                                                                                   |
| ---------------------- | :-----: | ---------------------------------------------------------------------------------------------------------- |
| CSP / headers          |  PASS   | Per-request nonce (`middleware.ts:611`), HSTS preload, nosniff, strict referrer, `frame-ancestors 'self'`  |
| Locale fail-closed     |  PASS   | `locale.ts:38-40` returns `fr-only` on missing/invalid `SITE_LOCALE_MODE`                                  |
| API keys               |  PASS   | PBKDF2-SHA256 600,000 iterations, 16-byte salt, constant-time compare; invalid key → 401                   |
| Rate limiting          |  PASS   | Upstash per tier, fail-closed without credentials in production, no in-memory fallback                     |
| Client-IP trust        |  WARN   | Single `clientIp()` function; not checked against the live proxy                                           |
| CORS                   |  PASS   | Single configured origin, no `*` fallback, no credentials                                                  |
| Service-role isolation |  PASS   | No `admin` import outside `api/`/`admin/`; `createBrowserClient` only in `auth-client.ts`, auth calls only |
| Sentry                 |  PASS   | `assertEuDsn` in all three configs, `sendDefaultPii: false`, PII scrubber on events and transactions       |
| RLS                    |  PASS   | 47/47 net of drops; five deny-all tables, each with its comment                                            |
| Secrets                |  FAIL   | Service-role JWT in local-only history (P1, Domain 2); CI scan `--no-git`                                  |
| Supply chain           |  WARN   | Actions SHA-pinned; 10 high advisories (2 production); Supabase CLI and Ferry source float                 |
| Branch protection      |  PASS   | Nine required contexts on both branches; `main` strict, `recette` not; zero approvals                      |

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
|   3 | Referential integrity   |  PASS   |     –     | FR26, FR27, FR29, CR2, REL-2, FR53-ref, REQ-149, orphan fiches all pass                                                                                                                                  |
|   4 | Source Tier compliance  |  PASS   |     –     | 7,458 entries: official 1,759 · referenced 2,206 · unverified 2,580 · `needs_review` 913 · missing 0 · other 0. 0 P0. 497 `ai_generated`. 6 direct Wikipedia URLs (reported). CIA Factbook 132 = ceiling |
|   5 | Database vs source JSON |  FAIL   | PASS→FAIL | Recette: peoples 772 vs 770, people↔language 1,175 vs 1,173, people↔country 1,460 vs 1,454 (`PPL_BUSANSI`, `PPL_BUSSA`); other tables equal. Production N/A                                              |
|   6 | CI enforcement          |  PASS   |     –     | `data-integrity.yml` and `editorial-rules.yml` on every PR into `main`/`recette`, no `continue-on-error`, last PR runs green, `validate` required                                                        |
|   7 | Reader-facing register  |  PASS   |     –     | Gate 0 errors; full sweep of `gaps[].reason`, `sources[].title`, `sources[].notes` and 595 `claim` fields: 0 hits. `PAT_DIALLO` fixed                                                                    |
|   8 | Known-issue carry-over  |  PASS   |     –     | `UNDATED_POLITY_CEILING` 95 = measured 95. The carry-over note itself is stale (§6, Domain 10)                                                                                                           |

**Two failed checks band Domain 8 at 5–6; scored 6**: no Source Tier P0, and FR28 debt at zero.

## 11. Prioritized actions

| Priority | Finding                      | Action                                                                                                            | Done when                                                                     |
| -------: | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
|        1 | D2 (leaked service-role key) | Rotate the JWT secret of `shmrjtnfbqzceovroqjj`, or decommission it (ETNI-1962); delete local `entire/*` branches | The decoded key is refused by the project, and no local branch holds it       |
|        2 | D10 (no scheduled backup)    | Schedule a daily dump of both self-hosted databases off the host; drill recette once                              | A dated backup ≤ 24 h old exists for each database                            |
|        3 | D8-5 (recette parity)        | Run the operator `--prune` against recette (`afrik-data-sync.md`)                                                 | `verifyCorpusInDatabase.ts --target=recette` equal; `recette-data-sync` green |
|        4 | D1 (npm advisories)          | Bump ajv (`fast-uri`) and the `brace-expansion` chains; re-audit                                                  | 0 high in `npm audit --omit=dev`                                              |
|        5 | D3 (nightly URL run)         | Make the nightly print its failing check before truncation, then fix or demote it                                 | `data-integrity.yml` schedule green, or its failure named in the log          |
|        6 | D2 (history never scanned)   | Add a history-depth gitleaks run (scheduled is enough)                                                            | A scheduled full-history scan reports zero unclassified findings              |
|        7 | D1 (proxy trust)             | Run the spoofed `X-Forwarded-For` check against `/api/v2/keys/issue`                                              | The stored address is the real caller's                                       |
|        8 | D10 (`migration-state.md`)   | Re-measure and rewrite the runbook from the ledgers                                                               | It names 097 on recette and the production state as measured                  |
|        9 | D5 / D6 (floating pins)      | Pin the Supabase CLI version and `FERRY_REF` to a SHA                                                             | No `latest` or tag ref left in a workflow                                     |
|       10 | D8-1 (strict-model drift)    | Fill `classificationStatus` on the 308 peoples and 4 families, lowering the ceilings each pass                    | Ceilings trend down without raising                                           |
|       11 | D9 (performance target)      | Decide the enforced Lighthouse floor                                                                              | Documented budget equals the enforced assertion                               |
|       12 | D6 (Ferry router)            | Exercise the router on a live transition, or record it as retired                                                 | A green router run within the last week, or a SUPERSEDED note                 |
|       13 | D7 (deprecations)            | Rename `middleware.ts` → `proxy.ts`; move to `@sentry/nextjs/config`                                              | `next build` prints no deprecation warning                                    |

## 12. Conclusion

EthniAfrica's software is in the best shape this audit series has measured:

- Five Releases shipped in eleven days with clean migration ledgers.
- Every required gate is green.
- The last audit's top action (`confidence-recompute`) is closed in production.
- The editorial corpus carries zero Source Tier P0s and zero demographic debt.

The 0.5-point fall is not a regression of that work. This run looked further: into local git history, and into recette's rows rather than its sync log. What it found sits outside the code: a credential that has to be rotated, a database that has to be pruned, and backups that have to be scheduled before the RPO the runbook promises means anything. None of them needs a redesign, and the first three actions would move the score back above 7.5.
