# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-10-13<br>
**Audited checkout:** `origin/recette` at `81e0dbfb9` (`release: v5.1.0 (#1710)`); four Releases shipped since the last audit, v4.23.0 → v5.1.0<br>
**Overall score:** **6.5 / 10** (was 7.2 on 2026-10-03, 7.6 on 2026-09-22, 6.4 on 2026-09-21)<br>
**Release verdict:** **NO-GO until the production corpus is reconciled.** The code, the gates and the deploy path are green, but production has not received the corpus git holds for three Releases. `production-data-sync.yml` has failed after v5.0.0, v5.0.1 and v5.1.0 because 71 peoples deleted from git are still in production, above the sync's 5 % prune cap. Production therefore serves duplicate peoples that the editorial work of waves 1–17 merged away, and stale versions of 63 others. Two older blockers stand: no scheduled backup of either database, and a client-IP trust setting never checked against the live proxy.

## 1. Scope and method

Full audit (no `--quick`, no `--no-build`), read-only, run in an isolated worktree on `origin/recette`'s tip. Outcomes were read from command output, GitHub run conclusions and job logs, the branch-protection and repository APIs, and an independent replay of the migration sequence. Evidence was gathered in four parallel read-only passes (CI/deploy/docs, AFRIK integrity, hardcoded values and dead code, security) plus the long gates run directly. Every figure below comes from a command run on this date unless it says otherwise.

The worktree's `node_modules` predated #1682 (eslint 10, vitest 5, Storybook 10, knip 6) and the Tailwind 4 dependency; the first typecheck failed on `@tailwindcss/postcss` for that reason alone. The gates were rerun after `npm ci`, and the figures below are from that rerun.

**What changed since 2026-10-03**

- **Shipped:** Releases v4.23.0 (10-06), v5.0.0 and v5.0.1 (10-10), v5.1.0 (10-13), each with a green `deploy-production.yml` run. Production's migration ledger is at 106 · pending 0 · orphaned 0 · drifted 0.
- **Done:** every third-party action and tool pinned (`supabase/setup-cli` at `2.116.0`, `FERRY_REF` at a SHA); `needs_review` 913 → 890; peuple strict-model drift ceiling 7,006 → 6,249; the dormant English banks deleted (production-mode dead files 3 → 0).
- **Regressed:** production's data sync red after the last three Releases; recette's orphans grew from 2 peoples to 17; `docs/runbooks/migration-state.md` is ten days and nine migrations stale.
- **Not done:** a scheduled backup; the spoofed `X-Forwarded-For` check; a history secret scan; an Upstash preflight or `/api/v2` smoke after deploy.

**Measured this run**

| Check                         | Outcome | Evidence                                                                                                                      |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Lint                          | PASS    | 0 errors, 34 warnings, 0 unused `eslint-disable`                                                                              |
| Typecheck / format            | PASS    | `tsc --noEmit` and `prettier --check` clean (after `npm ci`; see above)                                                       |
| Unit tests                    | PASS    | 1,061 files passed, 3 skipped; 11,036 tests passed, 21 skipped (`npm run test:coverage`). No flake this run                   |
| Coverage                      | PASS    | 86.42 % statements, 80.72 % branches, 89.91 % functions, 87.48 % lines (thresholds 70/60/70/70, `vitest.config.ts:56-62`)     |
| Production build              | PASS    | Compiled in 9.3 s; 49 static pages; 7 Turbopack "dynamic filesystem access" warnings (§6, Domain 7)                           |
| Dead-code ratchet             | PASS    | `check:dead` at every ceiling: exports 7/7, production files 0/0, production dependencies 0/0                                 |
| `check:env-example`           | PASS    | 66 env references across 2,303 files, all documented                                                                          |
| `check:local-paths`           | PASS    | Clean                                                                                                                         |
| `check:action-pins`           | PASS    | Every third-party `uses:` SHA-pinned; Supabase CLI and Ferry source now pinned too                                            |
| RLS coverage                  | PASS    | `check:rls-coverage` and an independent replay of 106 migrations: 50 of 50 surviving tables behind RLS                        |
| AFRIK validator               | PASS    | 50/50 checks, 0 errors, 12,376 warnings; FR28, FR28-strict, FR28-declared all 0                                               |
| Source Tier coverage          | PASS    | `needs_review` 890 = `NEEDS_REVIEW_RATCHET` 890                                                                               |
| Per-PR gates                  | PASS    | Last runs of CI, `validate`, a11y, Lighthouse gate, Playwright smoke, openapi-diff on `recette` all `success`                 |
| Production deploy             | PASS    | v5.1.0 run 38423073647: `migrate` applied 106 · pending 0 · orphaned 0 · drifted 0                                            |
| Recette migrations            | PASS    | `migrate-recette.yml` run 38274068707: applied 106 · pending 0 · orphaned 0 · drifted 0                                       |
| **Production data sync**      | FAIL    | Red after v5.0.0, v5.0.1, v5.1.0 (last 38423768351): 71 of 755 production peoples have no fiche, prune refused (§10, check 5) |
| **Recette data sync**         | FAIL    | Last five runs red (last 38376044814): recette 704 peoples vs git 687                                                         |
| **Nightly data-integrity**    | FAIL    | Red 10 of 10 nights (last 38373645290): two unreachable URLs, and a `migration-state` job that measures the wrong database    |
| npm audit                     | WARN    | 12 advisories: 6 high, 6 moderate. `--omit=dev`: 0 high, 6 moderate (`exceljs`→`uuid`, `swagger-ui-react`→…→`sprintf-js`)     |
| GitHub secret scanning        | FAIL    | Disabled on this public repository, push protection too (`security_and_analysis`, repository API)                             |
| Local history scan (gitleaks) | PASS    | 2,386 commits, 9 findings, all false positives; the 2026-08 rollback-key commits are now reachable from no ref                |

**`N/A` (never counted as a pass)**

- `check:migration-state` and `check:migration-state:production` locally: no credentials in the worktree. Both ledgers were read from CI job logs (above). The script prints a refusal and exits 0 without credentials, which reads as a pass (§6, Domain 5).
- Direct database reads of recette and production (check 5): no credentials. Both were read from their sync jobs' logs.
- The client-IP trust behind `TRUSTED_PROXY_HOPS` against the live proxy: still no recorded run.
- `check:infra-disclosure` is partial locally (`INFRA_DISCLOSURE_TERMS` unset); CI injects it.
- The manual `production-data-sync.yml` dispatch started at 16:25Z (38430403859) was still running when this audit closed. Its outcome is not counted either way.
- `npm run dev` and the API smoke against a running server: not booted this run; the build compiled every route.
- The Jira board's live column names against `ferry-jira-automation-setup.md`: not read.

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**No, until production's corpus is reconciled.** The application and its release path are green, but the site's promise is the corpus git holds, and production has not received it since v4.23.0:

1. **Production serves a stale corpus.** `production-data-sync.yml` failed after the last three Releases. In run 38423768351, the sync refused to prune 71 of 755 peoples with no fiche on disk (`PPL_ABRON`, `PPL_AGNI`, `PPL_BETI_FANG`, `PPL_FANG_GABON`, … — 9.4 %, above the 5 % cap). It also reported 3 peoples missing, 63 stale, 4 stale families and 24 stale countries. Readers see duplicates the editorial waves folded away. The deploy reports success without them.
2. **No scheduled backup of either self-hosted database** (`restore-procedure.md:21-22`). The prune that item 1 needs would run with no backup behind it.
3. **`TRUSTED_PROXY_HOPS` has never been checked against the live proxy**, and nothing checks the Upstash variables at deploy time. A missing one answers every `/api/v2` call 500 while the deploy stays green.

### 2.2 Is the AFRIK editorial surface sound?

**Yes at the source; neither database matches it.** The editorial checks pass:

- **Validator:** 50/50 checks, 0 errors. The check count fell from 57; warnings rose to 12,376, almost all from the source catalogue now walking `nameHistory` sources.
- **FR28 bands:** FR28, FR28-strict and FR28-declared each report **0 warnings**. There is no demographic debt.
- **Source Tier:** zero P0s.
  - No untiered source, no unidentifiable source, no AI text without `source_kind`, no state outside the four admitted.
  - No weak domain at `official` or `referenced`.
  - The two word fiches (`WRD_KIRDI`, `WRD_RACE`) have an empty top-level `sources`, as `public/modele-mot.json` declares, and source every one of their 9 and 12 accounts. Not a P0.
- **Tier distribution** (content sources of peoples, countries, families and patronymes, the previous audit's base): official 1,641, referenced 2,185, unverified 2,473, `needs_review` 890 (ratchet 890, down from 913). Across all 15,082 entries, including `nameHistory`: 3,397 · 7,894 · 2,901 · 890.
- **Direct Wikipedia citations:** 85 (was 6), all at `unverified`. Reported, not a defect (DEC-055), but the jump deserves a pass to cite the primary sources they point to.
- **Every layer can store every state** (`SOURCE_TIER_STATES`, migration 088's `sources_tier_check`, migration 091's `recompute_confidence()`).
- **Referential integrity** and the **reader-facing register** pass.
- **`data-integrity.yml`** gates every PR (required context `validate`).

Two checks fail:

- **Strict-model drift**, held by its ratchet and falling (peuple ceiling 6,249, down 757). 290 of 687 peoples and 4 of 25 families still lack `classificationStatus`.
- **Database parity.** Recette carries 17 extra peoples; production 71 (§2.1).

### 2.3 Can a new contributor go clone → running in one session?

**Yes, unchanged.**

- `npm ci` works with `.npmrc`'s `legacy-peer-deps`.
- `.env.example` is complete (`check:env-example` green).
- The 106 migrations have no duplicate prefix.
- `--target=local` is the documented contributor path (README, `afrik-data-sync.md`).
- `scripts/seedAdminAllowlist.ts` seeds the first moderator.
- Every `npm run` command named in README, `DEPLOYMENT.md` and the runbooks exists.

One caveat from this run: a checkout whose `node_modules` predates a dependency bump fails typecheck until `npm ci` is rerun. That is the documented behaviour, not a defect. The API calls and `/docs/api` were not exercised against a running server.

### 2.4 What is the security posture?

**Strong in code, weaker around it.** In the code:

- RLS covers 50 of 50 tables net of drops. The four new tables (`afrik_places`, `afrik_place_peoples`, `afrik_words`, `afrik_place_countries`) enable RLS in their own migration with a read-only policy.
- The CSP nonce is per request (`btoa(crypto.randomUUID())`, `src/proxy.ts:527`).
- API keys use PBKDF2-SHA256, 600,000 iterations, 16-byte salt, constant-time comparison.
- Rate limiting runs on Upstash per tier and fails closed in production.
- Sentry asserts an EU DSN in all three configs and turns off default PII collection (`NO_DEFAULT_PII_COLLECTION`, the Sentry 11 replacement for `sendDefaultPii`).
- The service-role client stays out of the browser, and the browser holds no data client.

Around the code:

- **GitHub secret scanning and push protection are disabled** on this public repository, and CI's gitleaks still runs `--no-git`. Nothing scans history on a schedule.
- npm: 0 high in production dependencies; 6 moderate, all needing a major bump.
- The proxy-trust check and an Upstash preflight are still owed.
- New: any signed-in user can mint unlimited public-tier API keys (`POST /api/v2/keys`, §6 Domain 1).

### 2.5 Is the score close to 8–9/10?

**6.5/10, down from 7.2.** The code side improved (pins, dead code, tests), but the data plane slipped: production's sync has been red for three Releases, recette's orphans grew eightfold, and the nightly integrity job measures a database it should no longer read. Three actions close most of the distance:

1. Back up production, then run the reviewed `--prune --apply` against it and turn `production-data-sync` green. Then do the same on recette.
2. Schedule a daily off-host backup of both databases.
3. Turn on GitHub secret scanning and push protection, and point the nightly `migration-state` job at recette's own secret.

## 3. Overall score

Ten domains, equal weight: **65 / 100 = 6.5 / 10**. No P0 in the code or the corpus. Domain 8 has two failed checks out of eight and bands at 5–6. The production corpus drift is counted in Domain 5, where the release path fails to deliver it, and referenced from Domain 8.

## 4. Score per domain

|   # | Domain                             | Score | Change | Rationale                                                                                                                               |
| --: | ---------------------------------- | ----: | :----: | --------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Security posture                   | **8** |   –    | Code controls strong, RLS 50/50; 0 production highs; proxy trust unverified; unlimited key minting per signed-in user (new P2)          |
|   2 | Secrets hygiene                    | **6** |   −1   | GitHub secret scanning and push protection off on a public repo; no history scan; local history scan clean                              |
|   3 | CI                                 | **6** |   −1   | Required checks green and every action pinned; nightly red 10/10, its drift job reads the retired hosted project; two data syncs red    |
|   4 | Correctness & tests                | **9** |   –    | 11,036 tests, coverage 86/81/90/87, no flake; dead-code and hardcoded bands clear                                                       |
|   5 | Deploy coherence                   | **6** |   −2   | Four Releases deployed green with clean ledgers, but production's corpus sync red after the last three; no `/api/v2` smoke after deploy |
|   6 | Ferry pipeline                     | **5** |   −1   | Router not run since 2026-09-12; reconciler green but scans nothing (`FERRY_JIRA_PROJECT` unset); pins now SHAs                         |
|   7 | Architecture & boundaries          | **8** |   –    | Three-layer rule holds but for `feed/revisions`; OpenAPI covers 50/50 routes; a latent 1,000-row cap in the people name index (P1)      |
|   8 | AFRIK data integrity & Source Tier | **5** |   −1   | Two of eight checks fail (strict-model drift, database parity on both stacks); zero Source Tier P0s; FR28 debt at zero                  |
|   9 | Performance & accessibility        | **6** |   –    | Lighthouse gate and Playwright smoke required and green; 0.85 target still a warning, 0.73 enforced; full mobile audit flaky            |
|  10 | Documentation & runbooks           | **6** |   −1   | Still no scheduled backup; `migration-state.md` quotes 97/95 against a measured 106/106; `DEPLOYMENT.md` contradicts itself on limiter  |

## 5. Strengths

- **The release path deploys cleanly.** Four Releases in seven days, every deploy green, every `migrate` job reports a clean ledger, production at 106 migrations.
- **Supply chain pinning is complete.** The Supabase CLI and Ferry's source were the last floating references; both are pinned now.
- **The test suite is larger and steadier:** 11,036 tests, no flake on this run, coverage well above thresholds.
- **Dead code is down.** Production-mode dead files are at 0/0, the English banks are gone, and no V1 import survives.
- **The editorial contract is clean at the source.** FR28 debt is zero in all three bands, the corpus has no Source Tier P0, and `needs_review` and the strict-model drift both fell without a ceiling being raised.
- **The sync's 5 % prune cap worked as designed.** It refused a large deletion it could not verify, instead of deleting it silently. The failure is visible because the guard exists.

## 6. Gaps and risks

### Domain 1 — Security posture

- **P1, unchanged:** `TRUSTED_PROXY_HOPS` (default 1) has not been checked against the live proxy chain. `clientIp()` (`src/lib/api/clientIp.ts:20-50`) counts `X-Forwarded-For` from the right. The runbook's spoofed-header procedure (`production-deploy.md:108-115`) has no recorded run.
- **P1, standing:** no Upstash preflight and no `/api/v2` smoke after deploy. The post-deploy smoke (`deploy-production.yml:349-412`) checks `/`, `/fr` and `/en` only, and no workflow references `UPSTASH`. Rate limiting fails closed in production without those variables (`rate-limit.ts:212-238`), so every `/api/v2` call would answer 500 while the deploy stays green.
- **P2, new:** `POST /api/v2/keys` (`keys.ts:66-112`) lets any signed-in user mint unlimited public-tier keys. Sign-up is open (`supabase/config.toml:68`), the route has no per-user cap, and it does not go through `applyKeyIssuanceRateLimit`, though each key costs 600,000 PBKDF2 iterations. The only bound is the 60/min anonymous IP bucket.
- **P2:** npm `--omit=dev` finds 6 moderate advisories, 0 high: `exceljs`→`uuid`, and `swagger-ui-react`→`remarkable`→`argparse`→`sprintf-js` (new). Each fix needs a major bump. All 6 high advisories are in dev chains (`eslint-config-next`, `knip`→`micromatch`→`braces`).
- **P2, unchanged:** `feed/revisions/route.ts:94` imports a service directly.
- **P3:** `style-src 'unsafe-inline'` on public pages (`src/proxy.ts:174-178`, documented follow-up); `verifyHashedKey` accepts any stored iteration count, with no floor (`auth.ts:84`); `flags`, `audit_log` and `contributor_profiles` read `USING (true)` by design; comments in `clientIp.ts:16` and `auth.ts:65` still name `middleware.ts`.

### Domain 2 — Secrets hygiene

- **P1, new evidence: GitHub secret scanning and push protection are disabled on this public repository** (repository API, `security_and_analysis`). Agents push here autonomously, so this is the cheapest control left off.
- **P1, standing: CI's gitleaks runs `--no-git` (`ci.yml:39-43`)** and no scheduled workflow scans history. It is a required check on both branches, but it reads the PR's tree only.
- **P2, residual:** commits `2938bf073` and `6d75c125a` (the rollback-project service-role JWT, recorded disabled in `secret-exposure-audit-2026-09.md:145-199`) are reachable from no ref now, but may still be fetchable from GitHub by SHA. The leaked Postgres password's rotation is still recorded as "not verified".
- **Pass:** a local `gitleaks detect` over 2,386 commits found 9 findings, all false positives (`_bmad` manifest hashes, test fixtures, a localhost example). Only `.env.example` files are tracked; `.gitignore:51-53` covers every variant. The working-tree secret grep has one hit, the encrypted parliament id in `PAT_BABIRYE.json:64`, a false positive.

### Domain 3 — CI

- **P1, new: the nightly `migration-state` job measures the retired hosted project.** It reads the generic `NEXT_PUBLIC_SUPABASE_URL` secret (`data-integrity.yml:143`), which still points at `shmrjtnfbqzceovroqjj` rather than self-hosted recette, and it runs on `main`, which lags `recette`. Its log reports "applied 104 · orphaned 1 (106) · drifted 1": a structurally red result about the wrong database. It also prints that project's host in a public log.
- **P1, standing: the nightly `validate` URL check is red 10 nights out of 10** (2026-10-04 → 10-13). FR30/31 finds two unreachable URLs: `maktaba.org/book/1154/…` and `archive.org/details/unescogeneralhis00jfad` (the second is new; the previous one was fixed).
- **P1:** `recette-data-sync.yml` and `production-data-sync.yml` red; canonical findings in Domain 8 (check 5) and Domain 5.
- **P2:** the "Lighthouse Mobile Audit" job is not required and fails intermittently (5 failures, 3 cancelled, 22 successes in the last 30 runs); recette→main sync PR #1711 merged with it red.
- **P2, unchanged:** `recette` protection is `strict: false`; neither branch requires an approval (`enforce_admins` true on both). Eight contexts are required on both: gitleaks, build, dependency-audit, validate, openapi-diff, axe-core (Storybook), Playwright smoke (fr, 430px), Lighthouse gate.
- **P2, unchanged:** `migrate-recette.yml:51-58` turns a missing `RECETTE_SUPABASE_URL` into a warning and passes.
- **P2:** Dependabot security updates are disabled; 4 open Dependabot alerts, all medium.
- **Resolved:** the Supabase CLI and `FERRY_REF` are pinned (previous action 9).

### Domain 4 — Correctness & tests

- **Resolved:** the `brandQualifierCharter.test.ts` race did not reproduce; the full suite passed on its only run.
- Stray `console.*` in shipped UI: the same 4 calls (`error.tsx:21`, `docs/api/v2/page.tsx:38`, `ContributionFormFields.tsx:78,110`); the rest are the logger, the Sentry scrubber and build-time generators under `src/lib/atlas/assets/*.mjs`. TODO/FIXME/HACK as words: 4.
- Dead-code P1 items (below) are inside the no-penalty band.

### Domain 5 — Deploy coherence

- **P1, release blocker, new: production's corpus has not been synced since v4.23.0.** `production-data-sync.yml` failed after v5.0.0 (38076859646), v5.0.1 (38094039820) and v5.1.0 (38423768351). The last run refused to prune 71 of 755 peoples (9.4 %, cap 5 %) and reports 3 peoples missing, 63 stale, 4 families and 24 countries stale. The Release ships the code; nothing ships the data it was written for. Resolving it means a reviewed `--prune --apply` past the cap, which needs a backup first (Domain 10).
- **P2, new:** `check:migration-state` without credentials prints a refusal and exits 0, so a misconfigured run reads as a pass.
- **Resolved:** the Supabase CLI is pinned (`version: 2.116.0`, `deploy-production.yml:96`, `migrate-recette.yml:73`).
- Pass: `vercel.json` keeps `git.deploymentEnabled: false`; `deploy-production.yml` runs on `release: published` only and is on `main` with `production-data-sync.yml`. 106 migrations, no duplicate prefix, measured applied on both stacks.

### Domain 6 — Ferry pipeline

- **P2, unchanged:** `ferry-router.yml` has not run since 2026-09-12.
- **P2, new:** `ferry-reconcile.yml` is green 10 of 10, but its log shows `FERRY_JIRA_PROJECT` empty and "scanned 0, dispatched 0". It passes while doing nothing.
- **Resolved:** `FERRY_REF` is a SHA (`ferry-reconcile.yml:25`, `ferry-cost-daily.yml:31`). `ferry.config.yaml` parses; `base_branch` and `target_branch` are both `recette`.

### Domain 7 — Architecture & boundaries

- **P1, new, latent:** the people name index reads one page with `.range(0, 4999)` (`src/api/v2/services/peopleService.ts:73,93`), on the assumption that a range lifts PostgREST's 1,000-row cap. `src/api/v2/services/sourcesFacet.ts:100-108` records a measurement that it does not. At 776 rows nothing is lost today; past 1,000, fiche-to-fiche links (REQ-150) would vanish with no error. Page the read as `sourcesFacet` does.
- **P2, new:** `next build` warns that dynamic filesystem access in `src/lib/articles/corpus.ts:159` and the article-media lookup traces about 12,500 files into the output.
- Three-layer rule holds: no `src/app/api/v2/**/route.ts` imports a Supabase client. Four routes import only Cache-Control constants from `services/corpusCache`; `feed/revisions` is the one route that skips its handler.
- **Resolved:** OpenAPI coverage checked: 50 route files, 47 carry JSDoc annotations, the 3 others are documented inline in `openapiV2.ts`. The README's resource list matches the 25 route folders.

### Domain 8 — AFRIK data integrity and Source Tier

- **P1: database parity fails on both stacks.** Recette (`recette-data-sync.yml`, last five runs red): peoples 704 vs 687, languages 761 vs 754, people↔language 1,086 vs 1,057, people↔country 1,330 vs 1,304, patronymes 793 vs 790. The sync never prunes (`recette-data-sync.yml:130`). Production: 71 orphan peoples, counted in Domain 5.
- **Improving:** strict-model drift ceilings peuple 6,249 (was 7,006), famille 104, pays 9, each equal to the measurement. 290 of 687 peoples lack `classificationStatus`, 121 lack `nameHistory`, 3 carry an undeclared `content.additionalNotes`. The 4 families are unchanged (`FLG_BERBERE`, `FLG_MANDE`, `FLG_OMOTIQUE`, `FLG_SONGHAY`).
- **Reported:** 85 direct Wikipedia URLs (was 6), all `unverified`: peoples' `nameHistory` 26, languages 19, patronymes 17, places 11, countries' `nameHistory` 9, peoples' content 3.
- **Debt:** `needs_review` 890 (ratchet 890). 1,025 sources without `source_kind` (= `UNTYPED_SOURCE_RATCHET`). `checkAiGeneratedSources` reports 1,225 unreviewed AI-generated citations (= its ratchet); 474 sources carry `source_kind: ai_generated`. The two counts measure different things and were not reconciled.
- **Borderline register:** about 136 patronyme `gaps[].reason` strings describe the search method with English query strings (« X caste », « X social function » n'ont livré aucune fonction…). No pattern flags them. They read as method narration; an editor should decide whether they reach the reader.

### Domain 9 — Performance and accessibility

- **Unchanged:** the 0.85 performance target is a warning (`.lighthouserc.js:205`); 0.73 is enforced (`:173,188`). Accessibility = 1 and best-practices ≥ 0.95 are errors.
- The required "Lighthouse gate" and "Playwright smoke (fr, 430px)" are green. The full mobile audit is not required and fails intermittently (Domain 3). Full `e2e.yml` green on schedule, not required.

### Domain 10 — Documentation and runbooks

- **P1, standing: no scheduled backup of either database** (`restore-procedure.md:21-22`); no `pg_dump` or backup job exists in workflows or scripts. The RPO ≤ 24 h the same document declares cannot be met. Recette has never been drilled. The last drill (production, 2026-09-22) is next due 2026-12-22 (`:270`), with no reminder workflow behind it.
- **P2, regressed: `docs/runbooks/migration-state.md` is stale.** It says "Last verified: 2026-10-03" and quotes recette 97 and production 95; both are measured at 106.
- **P2, unchanged:** `DEPLOYMENT.md` contradicts itself on the limiter: lines 248-251 say it fails closed with 500, lines 281-282 say it is "disabled", line 305 says the flag limiters fail open. The code (`rate-limit.ts:207-238`) fails closed in production and open elsewhere.
- **N/A:** the operator's `data_quality_status.md` carry-over note no longer exists.
- Pass: README and `DEPLOYMENT.md` agree on the topology (self-hosted recette and production, Release → VPS, Vercel for a manual recette preview only). `ETNI`, `ETHNIAFRIC` and root page id `174948648` agree. Every named `npm run` command exists; no `(owner)` placeholder.

### Hardcoded values (P0/P1)

0 P0, 2 P1 (under the no-penalty threshold). Every rate-limit count and window (`rate-limit.ts:133-142`), the Supabase request timeouts (`requestDeadline.ts:19,31`), the antibot and flag timings read env with a default. No Supabase, Upstash or Sentry URL literal in `src`. About 80 P2 named constants (pagination in `pagination.ts:13-38`, `*_FACET_PAGE_SIZE 500 × MAX_PAGES 40`, UI timers).

**Pagination & Batch Sizes**

- **P1** `src/api/v2/services/peopleService.ts:73,93` — `PEOPLE_NAME_INDEX_CEILING = 5000`, `.range(0, 4999)` — one read that PostgREST cuts at 1,000 rows silently (also listed in Domain 7).

**Cache TTLs**

- **P1, carried over** `src/api/v2/services/corpusCache.ts:15-55` — 3600 / 60 / 86400 + swr 86400 / 60 + swr 30 / 31536000 — corpus cache TTLs with no env override. `src/app/__tests__/cacheFreshnessContract.test.ts:45-69` holds every `export const revalidate` literal to these constants, so they cannot drift apart.

### Dead code & redundancy

`check:dead` passes at every ceiling. `knip --production` finds 12 items: 0 files, 10 exports in 5 files, 2 types, 0 dependencies. No surviving V1 import. 0 P0.

**P1**

- `src/lib/routing.ts` — `PAGE_TYPES` and `NOMMER_CHAPTER_KEYS`, unused in production (new).
- `src/lib/articles/schema.ts` — type `ArticleRecord`, used only by fixtures.
- `src/types/names.ts` — type `NameRecordDossier`, unused (new).

**P2**

- shadcn sub-component exports unused in production (`dialog`, `dropdown-menu`, `select`, `sheet`).
- jscpd: 4.35 % duplicated lines (1,089 clones), up from 3.33 %, mostly tests, stories and the self-similar proverbs data. No production block ≥ 30 lines spans three files; the largest two-file clones are `openapiV2.ts:181↔270` (61 lines) and `atlas/langues/page.tsx↔atlas/peuples/page.tsx` (49 lines).
- ts-prune output is noise (barrels, type re-exports); knip is authoritative.

## 7. Consumer and contributor flow

| Step                                    | Verdict | Evidence                                                                                   |
| --------------------------------------- | :-----: | ------------------------------------------------------------------------------------------ |
| `git clone` + `npm ci`                  |  PASS   | `.npmrc` `legacy-peer-deps=true`; a stale `node_modules` must be reinstalled after a bump  |
| `.env.example` → `.env.local`           |  PASS   | `check:env-example` green, 66 references                                                   |
| Migrations apply in order               |  PASS   | 106 files, no duplicate prefix; both ledgers clean                                         |
| Local stack + corpus (`--target=local`) |  PASS   | README, `afrik-data-sync.md` "Local bootstrap"                                             |
| First moderator                         |  PASS   | `scripts/seedAdminAllowlist.ts`, `moderation-access.md`                                    |
| `npm run dev` / API smoke / `/docs/api` |   N/A   | Not booted this run; `next build` compiled every route                                     |
| `/admin` allowlist-only                 |  PASS   | Proxy requires a session (`src/proxy.ts:773-786`); each page calls `getModeratorSession()` |

## 8. Security posture

| Control                | Verdict | Evidence                                                                                                                            |
| ---------------------- | :-----: | ----------------------------------------------------------------------------------------------------------------------------------- |
| CSP / headers          |  PASS   | Per-request nonce (`src/proxy.ts:527`), HSTS preload, nosniff, strict referrer, `frame-ancestors 'self'`, applied to every response |
| Locale                 |  PASS   | French only; `/en/*` → 308 to the French page (`src/proxy.ts:567-571`), other two-letter segments → `/fr`                           |
| API keys               |  PASS   | PBKDF2-SHA256 600,000 iterations, 16-byte salt, constant-time compare; invalid key → 401                                            |
| Key minting            |  WARN   | Signed-in users mint unlimited public keys (P2)                                                                                     |
| Rate limiting          |  PASS   | Upstash per tier, fail-closed without credentials in production, no in-memory fallback                                              |
| Client-IP trust        |  WARN   | Single `clientIp()` function; not checked against the live proxy                                                                    |
| CORS                   |  PASS   | Single configured origin, no `*`, no credentials                                                                                    |
| Service-role isolation |  PASS   | No `admin` import outside `api/`/`admin/`; `createBrowserClient` only in `auth-client.ts`, auth calls only                          |
| Sentry                 |  PASS   | `assertEuDsn` in all three configs, `NO_DEFAULT_PII_COLLECTION`, scrubber on events and transactions                                |
| RLS                    |  PASS   | 50/50 net of drops; five deny-all tables, each with its comment                                                                     |
| Secrets                |  FAIL   | GitHub secret scanning and push protection off on a public repo; CI scan `--no-git`; no history scan                                |
| Supply chain           |  PASS   | Every action and tool pinned; `gitleaks` required; 0 production highs; Dependabot security updates off (P2)                         |
| Branch protection      |  PASS   | Eight required contexts on both branches; `main` strict, `recette` not; zero approvals                                              |

**RLS coverage, net of drops** (106 migrations; 10 tables dropped and not re-created, including `name_records` in 101):

| Table                                                                                            | Last created | RLS enabled in | Net policies | Notes                         |
| ------------------------------------------------------------------------------------------------ | -----------: | -------------: | -----------: | ----------------------------- |
| admin_allowlist                                                                                  |          074 |            074 |            0 | Deny-all, commented           |
| antibot_challenges                                                                               |          048 |            048 |            0 | Deny-all, commented           |
| flag_reporter_contacts                                                                           |          075 |            075 |            0 | Deny-all, commented           |
| search_query_log                                                                                 |          050 |            050 |            0 | Deny-all, commented           |
| source_tier_ruling_drafts                                                                        |          090 |            090 |            0 | Deny-all, commented           |
| afrik_countries, afrik_language_families, afrik_languages, afrik_peoples, afrik_people_countries |          006 |            019 |       1 each | Public read                   |
| afrik_places, afrik_place_peoples                                                                |          100 |            100 |       1 each | Public read (new)             |
| afrik_words                                                                                      |          104 |            104 |            1 | Public read (new)             |
| afrik_place_countries                                                                            |          106 |            106 |            1 | Public read (new)             |
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
| user_roles (legacy)                                                                              |          008 |            008 |            3 | Opens no door in the console  |

No `RLS = No` row; no RLS-enabled table without either a policy or a deny-all comment. Migration 101's new views use `security_invoker = true`; the new search functions are not `SECURITY DEFINER`.

## 9. Performance and accessibility posture

| Control               | Verdict | Evidence                                                                                                                   |
| --------------------- | :-----: | -------------------------------------------------------------------------------------------------------------------------- |
| Lighthouse PR gate    |  PASS   | Required context "Lighthouse gate", last runs green                                                                        |
| Lighthouse budgets    |  WARN   | a11y = 1 and BP ≥ 0.95 enforced; performance enforced at 0.73, the 0.85 target only warns (`.lighthouserc.js:173,188,205`) |
| Lighthouse full audit |  WARN   | Not required; 5 failures and 3 cancellations in its last 30 runs                                                           |
| axe-core              |  PASS   | Required context "axe-core (Storybook)"; last five runs green, no `continue-on-error`                                      |
| E2E                   |  PASS   | Required "Playwright smoke (fr, 430px)" green; full `e2e.yml` green on schedule, not required                              |
| Locale posture        |  PASS   | French only; retired English URLs redirect with 308                                                                        |

## 10. AFRIK data integrity and Source Tier compliance

Corpus: 1,630 fiches — patronymes 794, peoples 687, countries 54, languages 39, families 25, relations 12, dossiers 7, migrations 6, places 4, words 2. Peoples fell from 770 as the duplicate folds of waves 1–13 merged fiches into their keepers.

|   # | Required check          | Verdict |  Change  | Evidence                                                                                                                                                                                                                                      |
| --: | ----------------------- | :-----: | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Strict model adherence  |  FAIL   |    –     | 10-fiche sample: no undeclared key. Drift held by ratchet (peuple 6,249, was 7,006 / famille 104 / pays 9); 290/687 peoples and 4/25 families lack `classificationStatus`                                                                     |
|   2 | Full validator          |  PASS   |    –     | 50/50, 0 errors, 12,376 warnings (11,822 source catalogue, 530 REQ-196 era, 24 FR52). FR28 0 · FR28-strict 0 · FR28-declared 0. `SOFT_CHECK_NAMES` = `FR52-coverage` only (`validateAfrikData.ts:5023`)                                       |
|   3 | Referential integrity   |  PASS   |    –     | Every people's family folder and parent agree; ids match filenames; every country code ISO 3166 alpha-3, every language code ISO 639-3. 16 codes without a `pays` fiche, all diaspora countries outside Africa                                |
|   4 | Source Tier compliance  |  PASS   |    –     | official 1,641 · referenced 2,185 · unverified 2,473 · `needs_review` 890 · missing 0 · other 0 (content base). 0 P0. 474 `ai_generated`. 85 direct Wikipedia URLs, all `unverified` (reported)                                               |
|   5 | Database vs source JSON |  FAIL   |    –     | Recette: peoples 704 vs 687, languages 761 vs 754, links +29/+26, patronymes 793 vs 790. Production: 71 orphan peoples, 63 stale, 3 missing (sync run 38423768351)                                                                            |
|   6 | CI enforcement          |  PASS   |    –     | `data-integrity.yml` on every PR into `main`/`recette`, no `continue-on-error`, last 8 PR runs green, `validate` required. The nightly is red (Domain 3)                                                                                      |
|   7 | Reader-facing register  |  PASS   |    –     | 30,882 `gaps[].reason`, `sources[].title`, `sources[].notes` and `claim` strings: 3 hits, all legitimate ("atlas" of Sanson 1656, "Tiers Monde" in a title). About 136 patronyme gap reasons narrate the search method (borderline, Domain 8) |
|   8 | Known-issue carry-over  |   N/A   | PASS→N/A | `data_quality_status.md` no longer exists. Live ceilings read instead: `EDITORIAL_DEFECT_CEILING` 52, `RETIRED_CIA_FACTBOOK_URL_CEILING` 119, `ASSERTIVE_ETYMOLOGY_RATCHET` 19                                                                |

**Two failed checks and one `N/A` band Domain 8 at 5–6; scored 5.** The literal rubric puts two failures at 5–6. The `N/A` on check 8 (no carry-over file to read) and the wider parity gap on both stacks put it at the bottom of that band. No Source Tier P0; FR28 debt at zero.

## 11. Prioritized actions

| Priority | Finding                       | Action                                                                                                                   | Done when                                                                                    |
| -------: | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
|        1 | D5 / D8-5 (production corpus) | Take a dump of production, review the 71 orphans against `_retired-identifiers.json`, run the operator `--prune --apply` | `production-data-sync.yml` green; production serves 687 peoples                              |
|        2 | D10 (no scheduled backup)     | Schedule a daily off-host dump of both self-hosted databases; drill recette once                                         | A dated backup ≤ 24 h old exists for each database                                           |
|        3 | D8-5 (recette parity)         | Run the operator `--prune --apply` against recette (`afrik-data-sync.md`)                                                | `verifyCorpusInDatabase.ts --target=recette` equal; `recette-data-sync` green                |
|        4 | D2 (secret scanning off)      | Turn on GitHub secret scanning and push protection; add a scheduled full-history gitleaks run                            | Both enabled in `security_and_analysis`; a scheduled scan reports zero unclassified findings |
|        5 | D3 (nightly drift job)        | Point the nightly `migration-state` job at recette's own secret and branch, not `NEXT_PUBLIC_SUPABASE_URL` on `main`     | The nightly reports recette's 106 · 0 · 0 · 0                                                |
|        6 | D1 (proxy trust)              | Run the spoofed `X-Forwarded-For` check against production and record it in `production-deploy.md`                       | The stored address is the real caller's, and the run is dated in the runbook                 |
|        7 | D1 / D5 (no API smoke)        | Add a post-deploy `/api/v2` smoke to `deploy-production.yml`; fix `DEPLOYMENT.md:281-282`                                | A deploy without the Upstash variables fails loudly instead of serving 500s                  |
|        8 | D7 (1,000-row cap)            | Page `getPeopleNameIndex()` the way `sourcesFacet` does                                                                  | A test proves the index returns more than 1,000 rows                                         |
|        9 | D3 (nightly URL run)          | Replace or archive the two unreachable citations (`maktaba.org/book/1154`, `archive.org/details/unescogeneralhis00jfad`) | `data-integrity.yml` schedule green                                                          |
|       10 | D10 (stale ledger doc)        | Update `migration-state.md` to the measured 106/106                                                                      | The doc quotes this run's ledger lines                                                       |
|       11 | D1 (key minting)              | Cap active keys per user and route `POST /api/v2/keys` through `applyKeyIssuanceRateLimit`                               | A test proves the cap                                                                        |
|       12 | D6 (Ferry)                    | Set `FERRY_JIRA_PROJECT`, or record the router and reconciler as retired                                                 | The reconciler scans a non-zero set, or a SUPERSEDED note                                    |
|       13 | D8-1 (strict-model drift)     | Fill `classificationStatus` on the 290 peoples and 4 families, lowering the ceilings each pass                           | Ceilings trend down without raising                                                          |
|       14 | D9 (performance target)       | Decide the enforced Lighthouse floor                                                                                     | Documented budget equals the enforced assertion                                              |
|       15 | D8 (Wikipedia citations)      | Cite the primary sources behind the 85 direct Wikipedia URLs where one exists                                            | The count trends down                                                                        |

**Closed since 2026-10-03:** the floating Supabase CLI and `FERRY_REF` pins (previous action 9), the test-isolation flake (did not reproduce, action 7), production-mode dead files.

## 12. Conclusion

EthniAfrica's code holds its best measured state:

- Four Releases in a week, each deployed green with a clean migration ledger.
- 11,036 tests and every required gate green; every action and tool pinned.
- An editorial corpus with zero Source Tier P0s and zero demographic debt, getting cleaner each wave.

What lowers the score to 6.5 is that the corpus stopped reaching its readers. The editorial waves merged dozens of duplicate peoples in git, and production's sync has refused for three Releases to delete them, as its safety cap requires. The deploy still reports success. Recette is in the same state on a smaller scale. That cleanup needs the backup the project still does not schedule, so actions 1 and 2 belong together. Around them, secret scanning is off on a public repository, and the nightly drift job reads a database the project retired. None needs a redesign. Closing the first five actions would bring the score back above 7.5.
