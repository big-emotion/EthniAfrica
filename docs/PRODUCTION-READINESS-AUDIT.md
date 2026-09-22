# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-09-22<br>
**Audited checkout:** `origin/recette` at `95fccacdd` (all five remediation PRs from the 2026-09-21 audit merged: #1247–#1251, plus the audit doc itself in #1252)<br>
**Overall score:** **7.6 / 10** (was 6.4 measured on 2026-09-21 before remediation, 8.2 on 2026-09-19)<br>
**Release verdict:** **CONDITIONAL GO.** The corpus is pruned and both databases match git exactly. Key issuance is behind the three-layer rule with a trusted client-IP source. What is left is operational, not code: no release has shipped the `confidence-recompute` fix to `main` yet, the client-IP trust has not been checked against the live proxy, and the self-hosted restore procedure still has no rehearsed drill.

## 1. Scope and method

This is a re-measurement of the 2026-09-21 audit (preserved in git history) after five remediation PRs were merged the same evening and the operator pruned both databases by hand. Everything below is measured fresh on `origin/recette` at its current tip, not projected from an integration branch. Outcomes were read from command output, GitHub runs, the branch-protection API and job logs.

**What changed since 2026-09-21, and what did not:**

- **Merged and measured:** #1247 (`confidence-recompute` react-server fix + regression test), #1248 (register-gate patterns widened, 64 fiches rewritten), #1249 (recette identity corrected in docs and skills), #1250 (key issuance behind the three layers, trusted client-IP), #1251 (dead code and hardcoded values reduced). #1250 needed one extra round after merge conflicts with #1251 surfaced a gitleaks false positive (a fixture key that read as high-entropy) and a `.env.example` conflict; both are fixed on the merged branch.
- **Done by the operator, not by a PR:** both databases were pruned by hand on the evening of 2026-09-21 (`--target=recette --prune --apply`, then `--target=production --prune --apply`), each verified against git with `verifyCorpusInDatabase.ts`, and confirmed by two green CI sync runs apiece on 2026-09-22.
- **Not done, confirmed by the operator directly:** no GitHub Release has shipped since the merges, so #1247's fix has not reached `main` (workflow files run from the default branch, not `recette`) and `confidence-recompute` cannot yet be proven in its own schedule. The proxy check for `TRUSTED_PROXY_HOPS`, the restore drill, and cleanup of any lingering local credentials are all still open.

**Measured this run**

| Check                      | Outcome | Evidence                                                                                                     |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Lint                       | PASS    | 0 errors, 36 warnings                                                                                        |
| Typecheck / format         | PASS    | `tsc --noEmit` and `prettier --check` clean                                                                  |
| Unit tests                 | PASS    | 1,003 files passed, 3 skipped; 10,228 tests passed, 21 skipped                                               |
| Coverage                   | PASS    | 87.24% statements, 81.12% branches, 90.35% functions, 88.37% lines (thresholds 70/60/70/70)                  |
| Production build           | PASS    | Compiled; 47 static pages                                                                                    |
| Dead-code ratchet          | PASS    | `check:dead` at every ceiling; production ceilings 3 files, 0 dependencies (was 1)                           |
| `check:env-example`        | PASS    | All variables the code reads are documented, including the seven added by #1250/#1251                        |
| RLS coverage               | PASS    | `check:rls-coverage` — 47 of 47 surviving tables behind RLS                                                  |
| AFRIK validator            | PASS    | 57/57 checks, 0 errors                                                                                       |
| Editorial rules            | PASS    | 0 errors, 95 warnings, all `chronology-symmetry`, unchanged                                                  |
| Source Tier coverage       | PASS    | `needs_review` 915/915 ratchet, exact                                                                        |
| Required PR checks (#1250) | PASS    | All nine required contexts green, including `build` and `gitleaks` after the fixture/env fixes               |
| Production migration       | PASS    | Release `v4.15.0` `migrate` job: applied 93 · pending 0 · orphaned 0 · drifted 0 (unchanged, no new release) |
| Corpus sync, recette       | PASS    | Two green runs, 2026-09-21 18:15 and 2026-09-22 05:55, after the manual prune                                |
| Corpus sync, production    | PASS    | Two green runs, 2026-09-21 16:59 and 2026-09-22 05:55, after the manual prune                                |
| `confidence-recompute`     | FAIL    | Still red on schedule (`main`); the fix is merged to `recette` only, unproven until a Release ships it       |
| Full E2E (fr/en)           | WARN    | Unchanged: the non-required search-feed visual harness stays red                                             |

**`N/A` (never counted as a pass)**

- The client-IP trust behind `TRUSTED_PROXY_HOPS` against the live Traefik proxy: the operator has not run the check yet (curl a spoofed `X-Forwarded-For` at `/api/v2/keys/issue` and confirm the real address lands in `api_keys.ip_address`).
- The restore drill and the self-hosted backup procedure: not attempted this run.
- Ferry router health: still unexercised since 2026-09-12, unchanged from the previous audit.
- Full-history secret scan: the checkout is shallow and gitleaks runs `--no-git`, unchanged.

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Conditionally, closer than yesterday.** Both databases now match git exactly, confirmed by direct read and by two green CI syncs each. Key issuance is authenticated by design (POST-only, three-layer, a fail-closed per-address limiter) and its client-IP source is now a deliberate, documented choice rather than a spoofable header read verbatim. Two blockers remain, both operational: the fix that stops `confidence-recompute` failing nightly has not reached `main` because no Release has shipped since the merges, and the production database still has no rehearsed restore procedure.

### 2.2 Is the AFRIK editorial surface sound?

**Yes, with one open check instead of three.** Of the eight required checks, only strict-model adherence still fails (309 of 772 peoples and 4 of 25 families lack `classificationStatus`, held by unchanged ratchets). Database parity now passes on direct read: `verifyCorpusInDatabase.ts` reports recette and production both equal to git on all seven tables (772 peoples, 1,176 people↔language, 1,463 people↔country, 794 patronymes). The reader-facing register gate passes on its defined scope after #1248's rewrite of 64 fiches, but this audit found one occurrence outside that scope: `PAT_DIALLO`'s `claim` field ("… relevée lors de la passe …") carries the same vocabulary. `claim` is read by `src/lib/search/naming.ts` and reaches the search result page, so it is reader-facing, but it is not one of the three fields `CLAUDE.md` names for the register rule (`gaps[].reason`, `sources[].title`, `sources[].notes`). This is a genuine gap in the rule's own scope, not a failure of #1248, and it is recorded as a new finding (§6, Domain 8) rather than folded into the passing check.

### 2.3 Can a new contributor go clone → running in one session?

**Yes, and the docs now describe the real topology.** #1249 corrected `CLAUDE.md`, the README, `docs/DEPLOYMENT.md` and two runbooks that still called recette a hosted Supabase project; both stacks are self-hosted since ETNI-1958, with the old hosted project kept only as a rollback path until ETNI-1962. The local bootstrap (`--target=local`) is now signposted from the README. Unchanged: the seven variables #1250 and #1251 added are the ones a fresh `.env.local` now needs, and `check:env-example` confirms nothing is missing.

### 2.4 What is the security posture?

**Stronger.** `/api/v2/keys/issue` no longer bypasses the layering: it is POST-only, its logic lives in a handler and service, and the per-address lookup runs before the PBKDF2 hash rather than after. Client-IP identity is now a single, documented function (`clientIp.ts`) used everywhere the header was read, defaulting to one trusted hop. The unproven half is whether that default matches the real Traefik configuration on the VPS — the operator has not yet run the spoofed-header check. RLS remains 47 of 47, unchanged; the dead `applyRateLimit` function is gone.

### 2.5 Is the score close to 8–9/10?

**Getting there: 7.6/10**, up 1.2 points from yesterday's 6.4. The remaining distance is almost entirely operational rather than architectural: a Release to carry the `confidence-recompute` fix to `main`, the proxy check, and a recorded restore drill. Editorial debt (strict-model drift, the `claim`-field register gap, `needs_review`) accounts for the rest.

## 3. Overall score

Ten domains, equal weight: **76 / 100 = 7.6 / 10**. No P0. Domain 8 is no longer capped at 4 — one failed check out of eight bands it at 7–8, against three failed checks yesterday.

## 4. Score per domain

|   # | Domain                             | Score | Change | Rationale                                                                                                           |
| --: | ---------------------------------- | ----: | :----: | ------------------------------------------------------------------------------------------------------------------- |
|   1 | Security posture                   | **9** |   +1   | Key issuance behind the three layers with a trusted client-IP function; the proxy default itself is unverified live |
|   2 | Secrets hygiene                    | **8** |   –    | Unchanged: history scan `N/A`, no new leak found                                                                    |
|   3 | CI                                 | **7** |   –    | Required checks green; `confidence-recompute` still red until a Release ships the fix to `main`                     |
|   4 | Correctness & tests                | **9** |   +2   | Dead-code production dependencies 1→0, hardcoded-value P1 count under the no-penalty band                           |
|   5 | Deploy coherence                   | **8** |   +1   | Recette identity corrected everywhere; both syncs now green and verified twice                                      |
|   6 | Ferry pipeline                     | **6** |   –    | Unchanged: router unexercised since 2026-09-12                                                                      |
|   7 | Architecture & boundaries          | **8** |   +2   | `keys/issue` now three-layer; dead-code and hardcoded-value bands both cleared                                      |
|   8 | AFRIK data integrity & Source Tier | **7** |   +3   | One of eight checks fails (strict-model drift), against three yesterday; database parity confirmed on direct read   |
|   9 | Performance & accessibility        | **6** |   –    | Unchanged: the 0.85 performance target still enforced nowhere, full E2E still not required                          |
|  10 | Documentation & runbooks           | **8** |   +3   | Recette identity and the audit skill's contradictions fixed; restore drill still overdue and unrehearsed            |

## 5. Strengths

- Both databases were pruned, verified against git by direct read, and confirmed by two independent green CI syncs apiece — the clearest possible evidence, not an inference from a log line.
- All five remediation PRs merged with a real green run on every required check, including a genuine gitleaks false positive caught and fixed (a test fixture's fake key read as high-entropy) rather than allowlisted away.
- `check:dead` production-mode dependencies moved from 1 to 0; the hardcoded-value and dead-code penalty bands that halved two domains yesterday are both cleared.
- The docs now describe the real Supabase topology (both stacks self-hosted) instead of a retired hosted project, in `CLAUDE.md`, the README, `DEPLOYMENT.md`, and the runbooks that operators actually follow.
- The audit skill itself no longer contradicts `CLAUDE.md` on FR28 severity, the first-admin path, or the `admin_allowlist` gate.
- `/api/v2/keys/issue` is no longer the one route that reads and writes the database directly from a route file.

## 6. Gaps and risks

### Domain 1 — Security posture

- **P1, unchanged in kind, narrower in scope:** the client-IP trust (`TRUSTED_PROXY_HOPS`, default 1 hop) is a deliberate, tested default, but whether it matches the live Traefik configuration on the production VPS has not been checked. The operator has the exact curl command; it has not been run.
- **Resolved:** `/api/v2/keys/issue` D1-1 from the previous audit — POST-only, behind a handler and service, per-address lookup before the hash, a fail-closed 5-per-hour issuance limiter.
- **P2, unchanged:** transient Upstash failures still fail open on read quotas (deliberate, documented); the legacy `/api/entities/*` surface is still unmetered; `flags_read_public` is still `USING (true)`.

### Domain 3 — CI

- **P1, status changed:** `confidence-recompute.yml` is still red on its last three scheduled runs (2026-09-19 to 21), all before #1247 merged. The fix is real and tested (`scripts/__tests__/confidenceRecomputeModuleGraph.test.ts` fails without it), but scheduled workflows run from the default branch's copy of the file, and `main` still lacks `--conditions=react-server` — confirmed by reading `origin/main`'s current workflow file directly. This resolves itself the next time a Release ships.
- **Unchanged:** the nightly `data-integrity` URL check, the non-required visual harness, `recette` still `strict: false`.

### Domain 4 — Correctness & tests

- **Resolved:** dead-code production dependencies 1→0 (the `applyRateLimit` deletion and #1251's export removals). The band that penalised this domain by 2 points yesterday no longer applies.
- Coverage and test counts moved slightly (10,184→10,228 tests) from the new tests the five PRs added; thresholds remain comfortably cleared.

### Domain 5 — Deploy coherence

- **Resolved:** the recette-identity documentation defect (D10-3 in the previous audit) — `CLAUDE.md`, the README, `DEPLOYMENT.md`, `restore-procedure.md` and `moderation-access.md` now state both stacks are self-hosted.
- **Resolved:** both corpus syncs, confirmed green twice each.
- **P2, unchanged:** `public/` asset weight has 0.65 MiB of headroom.

### Domain 6 — Ferry pipeline

- Unchanged from the previous audit: the router has not run since 2026-09-12; `N/A` on its health.

### Domain 7 — Architecture & boundaries

- **Resolved:** `keys/issue` D7-1 — the three-layer rule now holds on every v2 route.
- **Resolved:** the hardcoded-value and dead-code bands that penalised this domain by up to 2 points each are both cleared; #1251's before/after counts (24→8 knip production findings, 8→2 hardcoded-value P1 groups) both land inside the no-penalty thresholds.

### Domain 8 — AFRIK data integrity and Source Tier

- **Resolved:** the database-parity check (check 5) — direct read confirms recette and production both equal to git on all seven synchronized tables, and both databases' own CI syncs are green on their last two runs.
- **Resolved on its defined scope, new finding found alongside it:** the reader-facing register gate (check 7) reports 0 errors after #1248's widened patterns and 64-fiche rewrite. This audit's own sweep of the whole corpus, not scoped to the three named fields, found one further occurrence: `PAT_DIALLO`'s `claim` field ("… relevée lors de la passe …", line 45). `claim` is read by `src/lib/search/naming.ts` and reaches the search result page, so it is reader-facing in effect even though `CLAUDE.md` names only `gaps[].reason`, `sources[].title` and `sources[].notes`. Proposed as **P2**: extend the register rule's scope to `names[].attestations[].claim` (or wherever the strict model places it) rather than treat this as fixed.
- **Unchanged — still the one open check:** strict-model drift, held by ceilings (peuple 7,048; famille 104; pays 13). 309 of 772 peoples and 4 of 25 families still lack `classificationStatus`.
- **Unchanged:** `needs_review` at 915/915, exact ratchet match, editorial debt rather than a P0.

### Domain 9 — Performance and accessibility

- Unchanged from the previous audit: the 0.85 performance target is not enforced anywhere in `.lighthouserc.js`; full Playwright and the visual proof are not required checks.

### Domain 10 — Documentation and runbooks

- **Resolved:** the recette-identity defect, in the same five documents as Domain 5.
- **Resolved:** the audit skill's contradictions with `CLAUDE.md` — FR28 now scored as debt rather than a P0 trigger, the first-admin path corrected to `seedAdminAllowlist.ts` and `admin_allowlist`, `--target=local` signposted. `ethniafrica-ticket` R4 now follows the three-tier policy instead of the retired Tier 1/2/3 rule.
- **P1, unchanged:** the restore drill is still the one from 2025-07-14, its next-due date (2025-10-14) still in the past, and `restore-procedure.md` still says the self-hosted stacks' backup and restore path is undescribed.

### Hardcoded values and dead code

Both bands cleared this run. #1251's own measurement: production knip findings 24→8 (unused files unchanged at 3, all three intentionally dormant English banks; unused dependency 1→0; files with unused exports 14→5; files with unused types 6→0). Hardcoded-value P1 groups fell from 8 to 2 after six flag/contact limits became env-tunable and the discovery-video URL now follows the configured domain. Neither band triggers a penalty under the rubric's thresholds (≤5 P1 dead-code files with production ceilings at 0 dependencies; ≤5 P1 hardcoded groups).

## 7. Consumer and contributor flow

Unchanged from the previous audit except: the local-bootstrap signpost is now in the README (Domain 10 fix), and the seven newly-required env variables are all in `.env.example` and pass `check:env-example`.

## 8. Security posture

RLS matrix unchanged: 47 of 47 surviving tables behind RLS, confirmed again by `check:rls-coverage` this run. The full table is in the 2026-09-21 version of this document (git history).

| Control                | Verdict | Evidence                                                                                                     |
| ---------------------- | :-----: | ------------------------------------------------------------------------------------------------------------ |
| Key issuance           |  PASS   | POST-only, behind a handler and service, per-address lookup before the PBKDF2 hash, fail-closed rate limit   |
| Client-IP trust        |  WARN   | A single documented function, right default for Traefik/Vercel; not checked against the live proxy           |
| RLS                    |  PASS   | 47/47, unchanged                                                                                             |
| Service-role isolation |  PASS   | Unchanged: no browser data client                                                                            |
| Supply chain           |  WARN   | Unchanged: 6 moderate advisories, 0 high/critical; every action still SHA-pinned                             |
| Branch protection      |  PASS   | Unchanged: nine required contexts on both branches, `recette` still `strict: false`, zero required approvals |

## 9. Performance and accessibility posture

Unchanged from the previous audit. See the 2026-09-21 version (git history) for the full table.

## 10. AFRIK data integrity and Source Tier compliance

|   # | Required check          | Verdict |  Change   | Evidence                                                                                                                                                                                                          |
| --: | ----------------------- | :-----: | :-------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Strict model adherence  |  FAIL   |     –     | 309/772 peoples and 4/25 families lack `classificationStatus`; ceilings unchanged (7,048 / 104 / 13)                                                                                                              |
|   2 | Full validator          |  PASS   |     –     | 57/57, 0 errors                                                                                                                                                                                                   |
|   3 | Referential integrity   |  PASS   |     –     | Unchanged                                                                                                                                                                                                         |
|   4 | Source Tier compliance  |  PASS   |     –     | `needs_review` 915/915, unchanged                                                                                                                                                                                 |
|   5 | Database vs source JSON |  PASS   | FAIL→PASS | Direct read: `verifyCorpusInDatabase.ts` reports recette and production both equal to git on all seven tables; two green CI syncs each                                                                            |
|   6 | CI enforcement          |  PASS   |     –     | Unchanged; nightly URL check still red, not a PR gate                                                                                                                                                             |
|   7 | Reader-facing register  |  PASS   | FAIL→PASS | Gate: 0 errors on its defined scope after #1248. This audit's own full-corpus sweep found one field outside that scope (`PAT_DIALLO.claim`, §6) — recorded as a new P2, not counted against this check as defined |
|   8 | Known-issue carry-over  |  PASS   |     –     | Unchanged                                                                                                                                                                                                         |

**One failed check bands Domain 8 at 7–8; scored 7** given the newly-discovered `claim`-field gap sits just outside the check's defined scope and is real editorial debt rather than a clean pass.

## 11. Prioritized actions

| Priority | Finding                       | Action                                                                                                | Done when                                                               |
| -------: | ----------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
|        1 | D3 (confidence-recompute)     | Ship a Release so `main` carries #1247's fix                                                          | Next scheduled run of `confidence-recompute.yml` is green               |
|        2 | D1 (proxy trust)              | Confirm `TRUSTED_PROXY_HOPS=1` against the live Traefik config with the spoofed-header curl check     | The stored `ip_address` is the real caller's, not the spoofed one       |
|        3 | D10 (restore drill)           | Write the self-hosted backup/restore procedure and run one drill                                      | A drill recorded with RTO/RPO and a next-due date in the future         |
|        4 | D8-2 (`claim`-field register) | Extend the register rule's scope to name-record `claim` fields; rewrite `PAT_DIALLO`                  | Full-corpus sweep of `claim`, `gaps[].reason`, `sources[]` reports zero |
|        5 | D8-1 (strict-model drift)     | Reduce the 309 peoples and 4 families missing `classificationStatus`, lowering the ceilings each pass | Ceilings trend down without raising                                     |
|        6 | D9 (performance target)       | Decide the enforced Lighthouse performance floor; decide which E2E suites are required                | Documented budget equals the enforced assertion                         |
|        7 | D6 (Ferry router)             | Exercise the router on a live transition                                                              | A router run within the last week, green                                |
|        8 | D8 debt (`needs_review`)      | Adjudicate citations in bounded batches, `pays` first (327 of 915)                                    | Ratchet decreases without tier inflation                                |

## 12. Conclusion

In the space of one evening, EthniAfrica went from 6.4 to 7.6 — the largest single-day movement this audit series has recorded, and every point of it is grounded in a fresh measurement, not a projection. Five PRs merged clean, two databases were pruned and verified twice over, and a genuine CI false positive was caught and fixed on the way rather than worked around.

What is left is deliberately not code: a Release to carry one workflow fix to `main`, a curl command against a live proxy, and a restore drill that has been due since October 2025. None of them needs a redesign. The one piece of new information this run surfaced — a workshop-vocabulary leak in a field the register rule was never told to watch — is exactly the kind of finding a re-measurement is supposed to catch, and it is recorded rather than quietly fixed.
