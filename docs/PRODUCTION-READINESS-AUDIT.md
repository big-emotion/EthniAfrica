# EthniAfrica — Production Readiness Audit

**Date:** 2026-09-14 (sixth revision)
**Branch:** `recette` @ `20aaf1dd3` · **Version:** 4.9.0 · **Deployed:** yes, releases through `v4.9.0`
**Method:** read-only. Nothing was fixed, bumped, tagged, pushed or deployed by this audit.

---

## 1. Scope and method

Every long gate was run locally in a fresh worktree at `origin/recette` (`lint`, `typecheck`,
`format:check`, `test:coverage`, `build`), plus the repo-specific gates (`lint:req`,
`check:action-pins`, `check:workflow-shell`, `check:env-example`, `check:local-paths`,
`check:migration-files`, `check:jira-template`, `check:dead`, `test:charter-contracts`,
`check:translation-parity`, `validateAfrikData.ts`, `checkEditorialRules.ts`). knip was also run in
`--production` mode, jscpd over `src/` and `scripts/`, and a full-history gitleaks scan over all
2 275 commits.

**Measured as outcomes, not configuration:**

- the last runs of every domain-critical workflow (`ci`, `data-integrity`, `editorial-rules`,
  `a11y`, `lighthouse`, `e2e`, `openapi-diff`, `migrate-recette`, `deploy-production`,
  `production-data-sync`, `recette-data-sync`, `storybook-deploy`, the `ferry-*` set);
- branch protection on `recette` and `main` through the GitHub API, **and the check rollup of the
  last 30 PRs merged into `recette` and the last 4 into `main`** — which is how D3-1 was found;
- the migration ledger through the CI job logs that read it (recette: run `34754524408`,
  2026-09-13; production: the `migrate` job of the v4.9.0 deploy, run `34742585193`);
- production itself, one read-only request per route: `/` → 307 `/fr`, `/fr` 200, `/en` → 307
  `/fr`, `/es` → 308 `/fr`, `GET /api/v2/countries` 200 (266 KB, `x-ratelimit-limit: 60`).

**N/A, with the reason:**

| Item                                          | Why not measured                                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `check:migration-state` run locally           | No recette or production credentials reachable from the audit worktree; the CI ledger reads above were used       |
| AFRIK database vs source JSON (check 5)       | Reading `.env.local` was refused by the session's permission settings; no database was queried                    |
| `.env.example` contents                       | Same refusal; `check:env-example` (green, 59 references both ways) stands in for completeness, not for the values |
| Production GoTrue sign-up setting             | Lives on the VPS; conditions D1-1                                                                                 |
| `PGRST_DB_SCHEMAS`, Traefik `X-Forwarded-For` | Live VPS configuration, not in the repository                                                                     |
| Recette Postgres password rotation probe      | Not run — it would be a connection attempt with a leaked credential; conditions D2-1                              |
| Live ETNI Jira board statuses                 | Atlassian MCP not usable for this project in this session                                                         |
| Python render engine under `social/harness/`  | Not re-traced this revision; the 2026-09-12 findings (§social) are carried without re-measurement                 |

**Corrections to the previous revision.** "Secrets: clean" (2026-09-12) was true of the working
tree only; history still carries the recette leak recorded in
`docs/runbooks/secret-exposure-audit-2026-09.md` (D2-1). Check 1 of the AFRIK surface was scored
from the validator alone; sampling fiches against their models shows drift the validator does not
look for (D8-2).

**Local environment note.** `npm run build` logged `exceed_egress_quota` from the recette Supabase
project on every sitemap read, and today's `recette-data-sync` failed on HTTP 402 before it could
read the ledger. Recette is currently restricted; see D3-1.

---

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Conditional. It is in production and the release path works; three things stand between the
current state and the next release being safe.**

`v4.7.0`, `v4.8.0` and `v4.9.0` all deployed through the GitHub Release → OVH path, and the v4.9.0
`migrate` job read `applied 88 · pending 0 · orphaned 0 · drifted 0`. Production answers, fails
closed to French, and rate-limits its public API through Upstash.

The conditions:

1. **D5-1 (P1) — production does not serve what git holds.** The data sync after v4.9.0 failed
   (run `34742772582`): production has 804 peoples against 776 in git, 763 languages against 762,
   and both join tables carry the surplus. Twenty-eight people fiches git has retired are still
   public. A row git no longer declares is removed only with `--prune`.
2. **D3-1 (P1) — the required gates did not gate the last six merges.** #1037–#1041 into `recette`
   and the `recette → main` sync #1031 merged with `axe-core (Storybook)` and
   `Playwright smoke (fr, 430px)` red, both required and with `enforce_admins: true`. The failures
   themselves look environmental (recette is over its egress quota: four live routes answered 500
   in the axe run, two fiche titles did not render in the smoke run), but `main` now holds code no
   green gate has seen, and the next Release would ship it.
3. **D1-1 (P1, conditional) — authentication without authorization on the reference library.** Any
   signed-in Supabase account can insert `sources` rows at any tier into the public directory,
   link them as `verified`, and upload 25 MB objects (`src/api/v2/services/reference-library.ts:88-106`).
   Sign-up is enabled in `supabase/config.toml:68`.

### 2.2 Is the AFRIK editorial surface sound?

**Structurally yes; against its own strict models and vocabulary, no.**

- `validateAfrikData.ts`: **51/51 checks, 0 errors**, 5 619 warnings (3 937 `cites "unknown"`,
  1 659 `carries no URL`, 23 FR52-coverage), over 1 722 tracked fiches and 17 strict models.
- **FR28 [95,105]: 0 offenders. FR28-strict [99,101]: 0 offenders.** Both block the build;
  `SOFT_CHECK_NAMES` still holds only `FR52-coverage` (`scripts/validateAfrikData.ts:4916`).
- **Check 4 P0 counts:** no source without a `tier` field, no empty `sources` block, no
  unidentifiable source, **no Wikipedia URL**, **no weak source above `unverified`** (Joshua Project
  557, 101lasttribes 206, peoplegroups 96, Facebook 39, blogspot 25, wordpress 23 — all
  `unverified`), **no AI text without `source_kind`** (500 `ai_generated`, all `unverified`) —
  **but 929 sources in 426 fiches carry `tier: "needs_review"`**, a value outside the three-tier
  vocabulary `CLAUDE.md` defines (D8-1).
- Tier distribution (7 076 entries): `official` 1 682 · `referenced` 1 946 · `unverified` 2 519 ·
  `needs_review` 929. The database now stores all four (migration `088`) and `recompute_confidence()`
  weighs `needs_review` at 0.4; the TypeScript `SourceTier` and every OpenAPI tier enum admit only
  three, while zod and the sources facet accept the fourth.
- Referential integrity: every `PPL_*` sits under an existing `FLG_*` that its content names; **two
  country demographics entries point at family ids that do not exist** (D8-3).
- **Strict models: every people fiche and every family fiche drifts from its model** — no validator
  check covers those kinds (D8-2).
- Reader-facing register: the gate passes and "domain ruling" / "awaits editorial review" are gone
  (D8-2 of 09-12 closed); **28 patronyme `gaps[].reason` still name the workshop's "vague 1"**
  (D8-4).
- CI: `validate` and `editorial-rules` run on PRs with no `continue-on-error` and are required on
  `recette`; `editorial-rules` is not required on `main`. The nightly run went green on 2026-09-13
  after six red nights.

### 2.3 Can a new contributor go clone → running in one session?

**Yes, with three traps.** `.npmrc` carries `legacy-peer-deps=true` on purpose; `check:env-example`
verifies both directions; the build passes and leaves the tree clean (the `next-env.d.ts` trap of
09-12 no longer reproduces); 9 187 tests pass.

The traps: `README.md:19` and `docs/DEPLOYMENT.md:308` say Node 20 while `engines` and the
`Dockerfile` are on 22; **no document says how to apply the migrations or load the corpus on a fresh
local project**, and no CI job replays them (Supabase Preview is skipped); and the first admin is
described two ways — `CLAUDE.md` names `scripts/seedAdmin.ts` into `user_roles`, while
`docs/DEPLOYMENT.md` says nothing reads `user_roles` and access is `admin_allowlist` through
`seedAdminAllowlist.ts`.

### 2.4 What is the security posture?

**Strong at the data plane and the edge; one authorization gap and one unverified rotation.**

- **RLS: 45 of 45 live tables**, net of the eight dropped; 69 live policies; four deny-all tables,
  all with their intent commented. Ten live `SECURITY DEFINER` functions, all pinning
  `search_path`; three views, all `security_invoker`.
- **Edge:** per-request CSP nonce, HSTS preload, nosniff, Referrer-Policy, **Permissions-Policy
  (new)**, and the header set now applied to redirects, 401 and 429 as well
  (`src/middleware.ts:163-205`). Locale fails closed to `fr-only` (`src/lib/locale.ts:38-41`),
  confirmed live.
- **API keys:** PBKDF2-SHA256 at 600 000 iterations, 16-byte salt, constant-time compare. The
  `Origin`/`Referer` bypass is gone: `/api/v2` is **keyless-public by design**, metered at 60 rpm per
  IP, documented in the OpenAPI (`src/lib/api/openapiV2.ts:16-17`); the rate-limit identifier is now
  a SHA-256 of the key.
- **Service-role isolation holds**; the browser holds no data client (`createBrowserClient` only in
  `auth-client.ts`, whose five callers only authenticate).
- **Sentry:** EU DSN enforced in production, `sendDefaultPii: false`, scrubber now redacts
  headers, cookies, request data, extra, contexts and breadcrumbs.
- **Supply chain:** 0 unpinned actions; `npm audit` **0 high** (was 2), 10 moderate; gitleaks by
  digest on PRs (working tree only).
- **Branch protection (measured):** `recette` requires 9 checks (`gitleaks`, `build`, `validate`,
  `openapi-diff`, `Lighthouse gate (4 routes)`, `editorial-rules`, `dependency-audit`,
  `Playwright smoke (fr, 430px)`, `axe-core (Storybook)`), no PR, `strict: false`; `main` requires 5
  and a PR with 0 approvals; `enforce_admins: true` on both — **and six merges went through red**
  (D3-1).
- **Open:** D1-1 reference-library authorization; D2-1 recette Postgres password rotation
  unverified; `/api/contact` unmetered; revalidate secrets compared with `!==`.

### 2.5 Is the score close to 8–9/10?

**6.0 / 10 — down from 6.5, while nearly everything the last revision asked for was done.** Every
Domain 1 finding closed, the high CVEs went, the production-only dead-code tally joined the ratchet
and its count fell from 27 files to 15, the vocabulary fork got its migration, the workshop phrases
left the reader's notes, `editorial-rules` became required, Storybook and the nightly checks went
green. The number fell because this revision measured four things the last one did not: the check
rollup of merged PRs (D3-1), the production data sync (D5-1), fiches sampled against their models
(D8-2), and the Ferry agents' run history (D6-1) — plus one pre-existing authorization gap (D1-1).

The three moves that close the most distance:

1. **Make the gates bind again** — restore the recette project (egress quota), re-run the red checks
   on `recette` before the next Release, stop merging over red, add `editorial-rules` to `main`
   (D3-1, D8-5). Worth ~2 points across D3 and D9.
2. **Close the production gaps** — prune the sync, gate reference-library writes on the moderator
   allowlist, run the rotation probe (D5-1, D1-1, D2-1). Worth ~2 points across D1, D2 and D5.
3. **Give the strict models a gate** for peuple / famille / pays, decide `needs_review`, and widen
   the register pattern (D8-1, D8-2, D8-4). Worth ~2 points on D8.

---

## 3. Overall score

**6.0 / 10** — mean of ten equally weighted domains.

A product whose data plane, edge and release path are in good order, whose gates are now numerous
and correctly configured — and which, the first time its integration environment went down, merged
around them. The configuration is no longer the weak point; the discipline of waiting for green is.

---

## 4. Score per domain

| #   | Domain                             | Score | Evidence                                                                                                                        |
| --- | ---------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Security posture                   | **7** | 45/45 RLS, every 09-12 edge finding closed, 0 high CVEs — reference-library writes need only a session (P1, D1-1)               |
| 2   | Secrets hygiene                    | **7** | Tree clean, gitleaks by digest, credentials only via contexts — history leak with an unverified password rotation (P1, D2-1)    |
| 3   | CI                                 | **6** | 9 required checks on `recette`, Storybook and nightlies green — six merges through red required checks (P1, D3-1)               |
| 4   | Correctness & tests                | **8** | 9 187 pass, coverage 86.9/80.7/90.0/87.9 vs 70/60/70/70 — minus 1 for 12 P1 dead-code findings                                  |
| 5   | Deploy coherence                   | **7** | v4.9.0 deployed and migrated, rollback documented — production data sync red, 28 retired peoples served (P1); minus 1 hardcoded |
| 6   | Ferry pipeline                     | **5** | Config and pins consistent — agents idle since July, router 6/15 red, Jira doc names statuses that do not exist                 |
| 7   | Architecture & boundaries          | **7** | Three-layer API and client isolation hold, D7-1/D7-3 resolved — minus 1 hardcoded, minus 1 dead code                            |
| 8   | AFRIK data integrity & Source Tier | **4** | 0 validator errors, FR28 0/0 — five failed checks and one N/A; `needs_review` out of vocabulary caps at 4                       |
| 9   | Performance & accessibility        | **5** | Lighthouse gate and smoke now required on PRs — E2E nightly 5/5 red, perf floor lowered to 0.73, no real-user Web Vitals        |
| 10  | Docs & runbooks                    | **4** | Every named command exists, `CLAUDE.md` gabarit drift fixed — drill 14 months overdue, docs contradict the v4.9.0 API change    |

---

## 5. Strengths

- **The 2026-09-12 action list was largely executed.** Of its 15 items, the API-key decision, the
  CVE override, the Storybook pin, the nightly quiz-bank crash, `editorial-rules` on `recette`, the
  production knip tally, the workshop-phrase rewrite, the `needs_review` migration, the ISO table
  and the loader writers are all done — measured, not claimed.
- **The edge was rebuilt carefully** (`89fe98190`): the keyless decision was taken and written into
  the OpenAPI rather than left implicit, headers now cover every middleware response, and the rate
  limiter hashes its identifier and fails closed without Upstash.
- **The data plane is locked down and reasoned** — 45/45 tables under RLS, every definer function
  pinned, deny-all tables commented, views `security_invoker`.
- **Production migrations are measurable and automatic.** The `migrate` job tunnels to the
  self-hosted Postgres and prints the ledger; recette applies on merge. The two-step rollout is now
  visible: `089` applied on recette on 2026-09-13, pending on production until the next Release, as
  intended.
- **The ratchets tighten.** `check:dead` exports 22 → 8 and types 49 → 7 and now tallies production
  reachability; the `needs_review` ratchet fails in both directions at 929; the CIA Factbook ratchet
  holds 133 measured.
- **The test suite is large and real:** 9 187 tests, coverage well above every threshold, 1 066
  charter-contract tests.

---

## 6. Gaps and risks

### Domain 1 — Security posture

- **D1-1 (P1, conditional)** — `POST /api/v2/reference-library`, `/assertions` and `/assets` require
  a session and nothing more (`src/api/v2/services/reference-library.ts:88-106`); writes use the
  service-role client. Sign-up is enabled (`supabase/config.toml:68`, `shouldCreateUser: true` in
  the sign-in action), so GoTrue's own `/auth/v1/otp` yields a confirmed session to anyone. That
  session can insert `sources` at any tier (shown in the public directory), link them with
  `review_status: "verified"`, and upload 25 MB per request. The OpenAPI still says "authenticated
  contributor" (`openapiV2.ts:52,227,389`) — contributor accounts no longer exist. Not a regression;
  missed on 09-12. Conditional on production GoTrue sign-up (N/A).
- **D1-2 (P2)** — `/api/contact` has no rate limit (the middleware only meters `/api/v2`) and no
  antibot.
- **D1-3 (P2)** — both revalidate routes compare their bearer secret with `!==`
  (`src/app/api/admin/revalidate/route.ts:22-25`, `src/app/api/internal/revalidate/route.ts:31-35`).
- **D1-4 (P2)** — five routes (`names`, `compare`, `search`, `quiz/scopes`, `quiz/session`) call
  `applyRateLimit` on top of the middleware: anonymous callers are charged twice, and partner/admin
  keys fall back to the public quota inside the route (`rate-limit.ts:179-190`).
- **D1-5 (P2)** — `GET /api/v2/keys/issue` creates a key on a GET, limited per IP read from the first
  `X-Forwarded-For` entry; `DELETE` is missing from the CORS methods; `Access-Control-Allow-Credentials:
true` is unneeded; `style-src 'unsafe-inline'` remains; the Sentry scrubber leaves `tags`,
  `user.id` and frame variables.
- **D1-6 (P2)** — `ci.yml`, `e2e.yml`, `lighthouse.yml` and `editorial-rules.yml` still run Node 20;
  production builds on Node 22.

### Domain 2 — Secrets hygiene

- **D2-1 (P1, carried)** — the full-history gitleaks scan finds the recette `service_role` JWT and
  Postgres password in `.entire/metadata/` (commits `2938bf073`, `6d75c125a`, 2026-08-26). The key
  was neutralised by disabling legacy keys, not rotated; **the Postgres password rotation is still
  unverified** (`docs/runbooks/secret-exposure-audit-2026-09.md:214-234`), which the runbook itself
  calls P0 if the probe connects. The other 88 history findings are false positives.
- **D2-2 (P2)** — `.env.production`, `.env.development` and `.env.test` are not ignored (only `.env`
  and `*.local`); `.gitleaks.toml` allowlists `.env.example`, so a real value there is invisible to
  every scan; the PR scan runs `--no-git`.

### Domain 3 — CI

- **D3-1 (P1, new)** — **six merges through red required checks.**

  | PR    | Base      | Merged (UTC)     | Red checks                                                           |
  | ----- | --------- | ---------------- | -------------------------------------------------------------------- |
  | #1040 | `recette` | 2026-09-14 01:43 | `axe-core (Storybook)`, `Playwright smoke (fr, 430px)`               |
  | #1037 | `recette` | 01:44            | same                                                                 |
  | #1039 | `recette` | 01:45            | same                                                                 |
  | #1038 | `recette` | 01:48            | same                                                                 |
  | #1041 | `recette` | 01:51            | same                                                                 |
  | #1031 | `main`    | 01:56            | same, plus `Playwright (en)` (the latter two not required on `main`) |

  The 25 merges before them carried no failing check. The axe run (job `103831137135`) passed all
  270 stories and failed on four live routes answering **HTTP 500** —
  `/fr/comparer/familles/FLG_BANTU/FLG_MANDE`, `/fr/doctrine/classifications-contestees` and their
  `/en` twins; the smoke run (job `103831137037`) found no `h1` on `/fr/atlas/pays/SEN` and
  `PPL_WOLOF`. Both read recette, which was answering `exceed_egress_quota` at the same hour — a
  probable environmental cause, **not proven**. The finding is the merge, not the cause: `recette`
  and `main` now hold six changes no green run has validated, with `enforce_admins: true` on both
  branches.

- **D3-2 (P2)** — the release PR #1010 (v4.9.0) merged into `main` with smoke, both E2E locales and
  the full Lighthouse audit red; none is required on `main`, which requires 5 checks against
  `recette`'s 9.
- **D3-3 (P2, unchanged)** — `recette` protection is `strict: false` with no PR requirement.
- **Resolved since 09-12:** Storybook deploy green (D3-2 of 09-12), Ferry Cost Daily green, nightly
  Data Integrity green, `editorial-rules`, the Lighthouse gate, the smoke set and `dependency-audit`
  now required on `recette`.

### Domain 4 — Correctness & tests

- **D4-1 (P2)** — the first full run failed one test,
  `HomeHeroSearch › moves the active descendant with the arrow keys`; it passed alone and in a full
  re-run (9 187 / 0). A known typeahead flake under load, recorded here so it is not rediscovered.
- **D4-2 (P2)** — lint 0 errors, 37 warnings (25 `no-unused-vars`, 3 of them in production files).
- Dead-code penalty applied — see _Dead code & redundancy_.

### Domain 5 — Deploy coherence

- **D5-1 (P1, new)** — production data sync red after v4.9.0 (run `34742772582`,
  `verifyCorpusInDatabase.ts --target=production`):

  | Table                    | Production |   Git |
  | ------------------------ | ---------: | ----: |
  | `afrik_peoples`          |        804 |   776 |
  | `afrik_languages`        |        763 |   762 |
  | `afrik_people_languages` |      1 224 | 1 189 |
  | `afrik_people_countries` |      1 542 | 1 485 |

  Twenty-eight retired peoples (e.g. `PPL_TEKKE`, `PPL_TONGA`) are still served; the editorial
  ceiling stood at 51 of 52. Nothing has run since.

- **D5-2 (P2)** — the recette ledger was last read on 2026-09-13 11:29 (`applied 88 · pending 0 ·
drifted 1 adjudicated`, on the `089` merge commit); today's read failed on HTTP 402. Production
  read `applied 88 · pending 0` at v4.9.0; `089` is pending there by design until the next Release.
- Deploy path otherwise sound: only `release: published` reaches the VPS, `vercel.json` keeps git
  deployments off, both `workflow_run` workflows are on `main`, the container runs non-root with a
  healthcheck, rollback is in `docs/runbooks/ovh-production-deploy.md:166-236`.
- Hardcoded-value penalty applied — see _Hardcoded values (P0/P1)_.

### Domain 6 — Ferry pipeline

- **D6-1 (P1, new)** — the pipeline is idle or failing: `ferry-router` failed 6 of its last 15 runs
  (latest `34686519014`, "no branch 'ferry/ETNI-1891' and no open PR"); `ferry-dev`, `ferry-refine`
  and `ferry-review` last ran 2026-07-11, `ferry-iterate` 2026-06-05, `ferry-merge` never.
- **D6-2 (P1, new)** — `ferry-jira-automation-setup.md` names `In Development` (`:70`) and
  `Ready to Merge` (`:184`); `ferry.config.yaml` and `CLAUDE.md` say `READY FOR DEV` and `TO MERGE`.
  A router miss on a status name is a silent no-op, and `.claude/skills/ethniafrica-ticket/SKILL.md:46`
  takes its review column from this doc. No SUPERSEDED banner.
- Holds: `base_branch`/`target_branch` both `recette`; every `ferry-*.yml` pins the same SHAs
  (`big-emotion/ferry@39a42f9f # v1.2.0`, `claude-code-action@d75b94d5 # v1.0.216`,
  `codex-action@52fe01ec # v1.11`); `ferry-reconcile` 20/20 green; gitleaks installed with a
  checksum.

### Domain 7 — Architecture & boundaries

- Three-layer v2 API holds; service-role and browser-client boundaries hold (§8).
- **Resolved:** D7-1 (one ISO table, `isoCountryCodes.ts`), D7-3 (loader writers in
  `provenanceWriter.ts`).
- **Still open, counted in the dead-code penalty:** D7-2 facet hub pages copied across
  `langues`/`peuples`/`noms`.
- **Noted for security:** `src/lib/rights/rights-lifecycle.ts` and `protected-asset-access.ts` —
  the rights and public-eligibility rules — are reached only by their tests.
- The OpenAPI tier enum drift is counted once, in D8-1.
- D7-4 (two social render engines) not re-measured this revision.

### Domain 8 — AFRIK data integrity & Source Tier

- **D8-1 (P0 by the literal rubric)** — 929 sources in 426 fiches carry `tier: "needs_review"`
  (e.g. `famille_linguistique/FLG_AFROASIATIQUE.json`), outside the vocabulary `CLAUDE.md` declares.
  Layers disagree: the database admits it (`088`), zod and `sourcesFacet.ts` accept it
  (`src/api/v2/schemas/sources.ts:80`), `SourceTier` and every OpenAPI enum do not
  (`openapiV2.ts:1185,1808,1990`). The repo treats it as a two-way ratchet at 929
  (`checkSourceTierCoverage.ts`); `CLAUDE.md` does not mention it. **Either `CLAUDE.md` adopts it as
  a declared state, or the corpus resolves it** — until one of those happens the audit reads it as
  out of vocabulary.
- **D8-2 (P1, new)** — strict-model drift with no gate. All 776 people fiches differ from
  `modele-peuple.json` (770 lack `content.externalIdentifiers`, 765 `historicalAffiliation`, 743 add
  `linguisticFamily`/`ethnoLinguisticGroup`/`historicalRegion`/`currentCountries` inside
  `appellations`, 751 lack `_meta`, 311 `classificationStatus`, all add `_translation`; verified by
  hand on `PPL_WOLOF`). All 24 families lack four `decolonialHeader` keys; 13 of 54 countries lack
  `culture.mainLanguages`. The validator checks model keys for langue, migration, relation, nom,
  patronyme, dossier and naming-system — not for peuple, famille or pays.
- **D8-3 (P1, new)** — `pays/NGA.json` points `PPL_KANURI` at `FLG_SAHARIENNE` (the family is
  `FLG_SAHARIEN`); `pays/SDN.json` points `PPL_NUBIENS` at `FLG_NILOSAHARIEN` (it is
  `FLG_NILOSAHARIENNE`). Seven country fiches list a people whose `currentCountries` omits that
  country (BEN, GMB, GNB with `PPL_FULA`; CIV `PPL_DIOLA`; ETH `PPL_TIGRE`; GHA `PPL_GURMA`; one more).
- **D8-4 (P1, new)** — 28 patronyme `gaps[].reason` name the research wave, e.g. `PAT_SOKOINE`
  `gaps[7]`: « La classification vague 1 est conservée faute de meilleure preuve et reste à
  arbitrer ». The gate matches only `vague \d+ du plan` (`src/lib/editorial/readerRegister.ts:62`).
- **D8-5 (P2)** — `editorial-rules` is required on `recette`, not on `main`.
- **D8-6 (P2)** — 133 retired CIA Factbook URLs in 122 fiches, held exactly by
  `RETIRED_CIA_FACTBOOK_URL_CEILING`; `PPL_LUNDA` `content.sources[5]` is titled "Encyclopaedia
  Britannica" at `official` with an Ethnologue URL; "Île(s) déserte" typed as a polity in MUS, STP,
  SYC inflates `UNDATED_POLITY_CEILING` (95/95); 31 source titles cite EthniAfrica itself.
- **Resolved since 09-12:** D8-1 (unstorable `needs_review` — `088`), D8-2 (workshop phrases, 0
  occurrences), D8-3 (nightly green 2026-09-13, quiz-bank check running), D8-4 on `recette`, D8-6
  (tier ratchet now two-way and exact).

### Domain 9 — Performance & accessibility

- **D9-1 (P1)** — E2E nightly red 5 of 5 (09-09 → 09-13), though the latest run (`34746991220`) is
  down to 1 failure (`quiz-journey-a11y.spec.ts:122`), 1 flaky, 326 passed in `fr`; `en` passed 44
  and skipped 302, so English is barely exercised.
- **D9-2 (P1)** — the nightly Lighthouse matrix (29 URLs) asserts `categories.performance ≥ 0.73`
  as an error on non-fiche routes (`.lighthouserc.js:194`) and only warns at 0.85 on fiches (`:211`),
  below the 0.85 target; green 1 of 5, and the full audit on the `recette → main` PR is red (LCP >
  5 500 ms). The required `Lighthouse gate (4 routes)` asserts accessibility and best-practices as
  errors and performance as a warning — green on PRs.
- **D9-3 (P2)** — no real-user Core Web Vitals: no `web-vitals`/`useReportWebVitals`, and
  `sentry.client.config.ts` appears to be loaded by nothing (no `instrumentation-client.ts`), so its
  `tracesSampleRate` is probably inert. Plausible loads only after consent.
- Lighthouse, axe and E2E all run with `SITE_LOCALE_MODE: bilingual-fr-default`, so they cover
  `/fr` and `/en`; production is `fr-only`, confirmed live.
- The bypassed axe and smoke checks are counted canonically in D3-1.

### Domain 10 — Docs & runbooks

- **D10-1 (P1, unchanged)** — the only restore drill is `restore-drill-2025-07-14.md`, 14 months old;
  `restore-procedure.md:201` "Next drill due: 2025-10-14 — overdue"; `:205` the owner is still the
  literal placeholder `(owner — the operator must name a person here)`.
- **D10-2 (P1, new)** — three documents contradict the v4.9.0 API change (`middleware.ts:810-824`,
  keyless-public): `CLAUDE.md:71` "same-origin requests are exempt", `README.md:106` "Requests from
  another origin need an API key", `docs/DEPLOYMENT.md:401-402` "a `curl` 401 is expected".
  `src/app/api/v2/search/route.ts:56-57` still annotates `BearerAuth` as required. **This is also a
  `CLAUDE.md`-vs-code disagreement; this audit scored against the code the OpenAPI documents.**
- **D10-3 (P1, new)** — `docs/DEPLOYMENT.md:5-7,254` says database changes are manual ("Neither is
  automated"); both `migrate-recette.yml` and the deploy `migrate` job apply them. `:17,26` describe
  production as "a second project, ref not recorded"; it is the self-hosted
  `supabase.ethniafrica.com`.
- **D10-4 (P1, new)** — first admin described two ways (`CLAUDE.md` `seedAdmin.ts` → `user_roles`;
  `docs/DEPLOYMENT.md` `admin_allowlist` via `seedAdminAllowlist.ts`).
- **D10-5 (P2)** — `docs/runbooks/migration-state.md:9,272` says `089` is applied nowhere; recette
  applied it on 2026-09-13 (run `34754524408`).
- **D10-6 (P2)** — stale counts: `docs/DEPLOYMENT.md:272` "~890 JSON fiches" (1 722);
  `README.md:19`, `docs/DEPLOYMENT.md:308` Node 20.x (22.x). `AGENTS.md:36` calls
  `check:translation-parity` "non-blocking", `CLAUDE.md:438` "CI-blocking" (both true by flag).
- **D10-7 (P2) — skill vs repository** — the audit skill requires `docs/api-contracts.md`, which does
  not exist and which `CLAUDE.md` does not mention; the OpenAPI is assembled from route annotations
  (`openapiV2.ts:4021`) and covers all 22 route folders. `README.md:90-92` omits antibot, dossiers,
  languages, media and patronymes. Otherwise the skill now agrees with `CLAUDE.md`.
- **Resolved since 09-12:** D10-3 (skill aligned), D10-4 (`CLAUDE.md` gabarit contradiction), D10-5
  (lint claim), D10-2 stale `CLAUDE.md` counts, D10-6 (`migration-state.md` brought to 088). Every
  `npm run` command named in README, CLAUDE.md, AGENTS.md, DEPLOYMENT.md and the runbooks exists.

### Hardcoded values (P0/P1)

**No P0.** All three P0s of 09-12 are fixed: tier subsets derive from `isAuthoritativeSourceTier`
(`src/types/sources.ts:95`) and `schemas/languages.ts:15` uses `z.enum(SOURCE_TIERS)`;
`SUPABASE_BATCH_REQUEST_TIMEOUT_MS` is env-overridable (`requestDeadline.ts:53-56`); CSP
`connect-src` derives from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SENTRY_DSN`
(`middleware.ts:92-126`).

**Cache TTLs**

- **P1** `src/app/sitemap.ts:51`, `src/app/[lang]/atlas/{peuples,pays,langues,familles,noms}/[slug]/page.tsx`,
  `atlas/peuples/[slug]/liens/page.tsx:17`, `comparer/[entityType]/[...ids]/page.tsx:30` —
  `revalidate = 3600` in 8 files; `revalidate 60` in `signalements/page.tsx:38`,
  `signalements/[slug]/page.tsx:23`, `hubs/moduleAvailability.ts:134,234`; five Cache-Control
  literals outside `CORPUS_CACHE_CONTROL` (`api/v2/sources/route.ts:94`,
  `language-families/[id]/tree/route.ts:69`, `feed/revisions/route.ts:106`,
  `api/og/quiz-score/route.tsx:126`, `comparer/[entityType]/opengraph-image/route.tsx:206`).

**Pagination & Batch Sizes**

- **P1** page sizes that bypass `DEFAULT_PAGE_SIZE`/`MAX_PAGE_SIZE` (`schemas/pagination.ts:13,16`):
  `peoples/[id]/revisions/route.ts:62-63`, `feed/revisions/route.ts:104-105`,
  `search/route.ts:202-203`, `schemas/names.ts:199` (48), `schemas/relations.ts:61` (24),
  `signalements/page.tsx:36` + `actions.ts:50-51` + `publicFlagsPageQuery.ts:110` (50),
  `ReferenceLibraryFlow.tsx:129` (20).

**Hardcoded URLs**

- **P1** `src/middleware.ts:56` — `SUPABASE_ORIGIN_FALLBACK = "https://supabase.ethniafrica.com"`:
  with `NEXT_PUBLIC_SUPABASE_URL` missing, any deployment's CSP silently points at production.
- **P1 (new)** `src/lib/email/flagNotification.ts:38`, `src/app/api/v2/feed/revisions/route.ts:167`,
  `src/app/layout.tsx:39`, `src/lib/api/openapiV2.ts:40` — `?? "http://localhost:3000"`: with
  `NEXT_PUBLIC_SITE_URL` unset, production emails, feed links, `metadataBase` and the OpenAPI server
  point at localhost without an error.
- **P1 (new)** `src/app/[lang]/not-found.tsx:61`, `src/app/[lang]/comparer/not-found.tsx:50` —
  `contact@ethniafrica.org`, while `src/lib/legal-pages.ts:83,127,163` and `legal-pages.en.ts:110,154,192`
  say `contact@ethniafrica.com`.

**Timeouts / Durations**

- **P1** `src/lib/antibot/proofOfWork.ts:24` — challenge TTL `5 * 60 * 1000`, no env override.

Rate-limit windows, the quiz confidence cutoff, the CORS origin, roles and api-key tiers
(`public|partner|admin`, migration `013`) are env-driven or agree with the database: no finding.

_0 P0 and 6 P1 → −1 on Domains 5 and 7. About 45 P2 internal constants, nearly all named._

### Dead code & redundancy

`npm run check:dead` is green: files, dependencies, devDependencies, unlisted, binaries, unresolved
and duplicates at 0/0; exports 8/8; types 7/7; **production tally files 15/15, dependencies 1/1**
(`tailwindcss-animate`, a false positive through `tailwind.config.ts`). `knip --production`: 15
files, 40 unused export symbols, 11 unused types. No unused `eslint-disable`. **No V1 import
survives.**

**P0:** none.

**Unreachable in production — kept alive only by a test**

- **P1** `src/lib/revisions/publishRevision.ts:99` — a `"use server"` action nothing calls since
  `RevisionPublishDialog` was deleted; `api/v2/services/revisions.ts:5,21` (`insertRevision`,
  `getRevision`) are test-only.
- **P1** `src/api/v2/services/personService.ts` + `src/lib/supabase/queries/afrik/persons.ts` — a
  service and query layer with no `/api/v2/persons` route.
- **P1** `src/lib/rights/rights-lifecycle.ts`, `src/lib/rights/protected-asset-access.ts` — the rights
  rules no production path enforces.
- **P1** `src/lib/sources/source-model.ts`, `src/lib/afrik/parsers/sourceParser.ts`,
  `oralNarrativeParser.ts`, `src/lib/supabase/queries/afrik/nameVariants.ts` — test-only.
- **P1** `src/lib/games/projectionContrast.ts` (+ `.en.ts`), `src/lib/atlas/equalAreaProjection.ts` —
  left behind by the deleted `MercatorProjectionStage`.
- **P1** `src/lib/glossaire/entries.en.ts`, `src/lib/games/corpus.en.ts`, `landmarks.en.ts` — English
  sidecars nothing loads (staged for the bilingual rollout; inert under `fr-only`).

**Unused exports**

- **P1** API and query layers: `validation.ts` `validateMedia`, `migrations.ts` `listMigrationPaths`,
  `peoples.ts` `getAfrikPeoplesByCountry`, `module-zero-batch.ts` `getLatestRevisionMap`,
  `peopleJsonLoader.ts` `loadPeoplesByLanguageFamily`.
- **P1** transformers: `peopleDataTransformer.ts` `extractAppellationShort`, `hasOriginContent`,
  `transformEgoNetworkPreview`, `fetchPeopleNamesDossier`; `prose/ficheProse.ts` `lintFicheProse`;
  `fieldProvenance.ts` `modelChapterKeys`; `home/countrySynthesis.ts` `hasRenderableSynthesis`;
  `hubs/moduleAvailability.ts` `isModuleAvailable`.
- **P1** elsewhere in `src/lib`: `atlas/overlays.ts` `getAfricaAdmin0Rings` (dead in both modes),
  `getWorldCompareNameFr`, `buildCountrySetOverlay`; `atlas/panelBias.ts` `panelFreeRegion`;
  `atlas/camera.ts` `MAX_ZOOM`; `consent.ts` `clearConsent`; `games/*` `RELATION_TYPE_LABEL_FR`,
  `isOptionRound`, `GAME_SLUGS`, `SCALE_FACT_PROVENANCE_PATHS`; `quiz/segmentPolicy.ts`
  `quizTrackLabelFr`; `siteTree.ts` `UNLISTED_ROUTES`; `i18n/translationClasses.ts` `CLASS_EXCEPTIONS`;
  `translations/sidecarPaths.ts` `sidecarPathFor`/`sourcePathFor`;
  `authorized-source-catalog.ts` `validateAuthorizedSourceCatalog`; `types/sources.ts`
  `ORAL_NARRATIVE_KINDS`/`SOURCE_TIER_WEIGHTS`/`AI_PROVENANCE_WEIGHT`; `countryFlag.ts`
  `COUNTRIES_WITHOUT_ISO_FLAG`; `hubs/moduleRegistry.ts` `EDITORIAL_READINESS_STATES`.

**Duplication** — jscpd (≥ 50 tokens, ≥ 5 lines): `src/` **4.67 %** (14 425 lines, 1 003 clones;
283 outside tests and stories — up from 269, driven by the proverbs data); `scripts/` **3.03 %**, no
clone ≥ 30 lines.

- **P1** D7-2 — facet hubs `src/app/[lang]/atlas/{langues,peuples,noms}/page.tsx` (49, 46, 30, 27, 22
  lines across the three).
- **P1** `src/types/afrik-frontend.ts:52-93,117-149`, `src/types/afrik.ts:238-276,302-345`,
  `src/types/compare.ts:64-90` — family and people shapes copied across three type files.
- **P2** `entityHref()` in `AnecdoteCard.tsx:75`, `HomeHeroAnecdote.tsx:23`, `ProverbCard.tsx:17`;
  `opengraph-image.tsx` ↔ `twitter-image.tsx` (40); `i18n/copy/index.ts` ↔ `translations.ts` import
  block (37); the five `dossiers/nommer/*/page.tsx` (21); `[slug]` pages for familles/pays/doctrine/
  noms/signalements (21–37); `queries/afrik/{countries,languageFamilies,languages}.ts` (29);
  `openapiV2.ts` internal schema blocks.
- **P2 (counted once with the literals)** `lib/proverbs/proverbs.ts` ↔ `proverbs.en.ts` and
  `home/didYouKnowFacts{,.en}.ts` repeat country/people labels as literals.
- **P2** `src/app/api/docs/route.ts:7,20-23` — the last V1 string, a 301 to `/api/docs/v1` with no
  `Location`; 7 unused shadcn re-exports; 11 unused types; unreferenced scripts
  `alignExternalIdentifiers.ts`, `extractClanNames.ts`, `extractNameRecordsFromFiches.ts`,
  `anecdotes/sourceIllustrations.ts`.

**Resolved since 09-12:** the 27 test-only files fell to 15 (`GamePlayHost`, `RevisionDrawer`,
`HistoriqueSection`, `RevisionPublishDialog`, `MercatorProjectionStage`, `CountrySynthesisBrief`,
`DemographicsChart`, `HistoricalFactsSection`, `CompareShareBar` deleted); `clientCache.ts`,
`dataVersion.ts` deleted; `recharts`, `vaul`, four Radix packages and `react-is` dropped; the
`clanName`/`personCandidate` script pair merged; `checkRlsCoverage` wired into `ci.yml:162`.

_0 P0, 12 P1 (by finding) → −1 on Domains 4 and 7. Counted per file and symbol the P1 count would
exceed 15; the finding-level count is the one the previous revision used, kept for comparability._

**§social** — not re-measured; the 2026-09-12 findings (two engine generations, duplicate fonts,
anti-literal gate aimed at the retired files) are carried as open.

---

## 7. Consumer / new-contributor flow

| Step                                        | Verdict                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `git clone` + `npm ci` (`legacy-peer-deps`) | ✅ documented and exercised by CI                                                                                                 |
| Node version                                | ⚠️ documented wrongly — README and DEPLOYMENT say 20.x, `engines` and Dockerfile 22.x                                             |
| `.env.example` → `.env.local`               | ✅ `check:env-example` verifies both directions (59 references)                                                                   |
| `supabase/migrations/` on a fresh project   | ⚠️ tribal — 89 sequential, portable files (standard extensions, `pg_cron` guarded), but no documented local step and no CI replay |
| Corpus load                                 | ⚠️ tribal for a local project — `migrateAfrikToDatabase.ts` accepts only `recette`/`production`                                   |
| `npm run build`                             | ✅ passes; tree clean afterwards (Sentry `disableLogger` deprecation warning)                                                     |
| `npm run test` / `make check` gates         | ✅ 9 187 pass; lint 0 errors; typecheck and format clean                                                                          |
| First admin                                 | ⚠️ contradictory — `seedAdmin.ts` (legacy `user_roles`) vs `seedAdminAllowlist.ts`                                                |
| `/docs/api`                                 | ✅ `src/app/docs/api/page.tsx`                                                                                                    |
| `/admin` gated                              | ✅ middleware requires a session; each page calls `getModeratorSession()` (no shared admin layout)                                |

---

## 8. Security posture

**RLS coverage — 45 live tables, 45 enabled after their last creation, 69 live policies.** Walked
over all 89 migrations net of `DROP TABLE` (seven V1 tables in `007`, `contributions` in `081`) and
`DROP POLICY`. Raw line counts for comparison: 56 `CREATE TABLE`, 65 `ENABLE ROW LEVEL SECURITY`, 98
`CREATE POLICY`, 81 `DROP POLICY`. No `DISABLE ROW LEVEL SECURITY` anywhere. **No `RLS = No` row: no
P0.**

| Table                     | Last created | RLS enabled after | Net policies | Notes                                |
| ------------------------- | ------------ | ----------------- | -----------: | ------------------------------------ |
| admin_allowlist           | 074:28       | 074:44            |            0 | deny-all, intent at 074:20-23, 46-47 |
| afrik_countries           | 006:5        | 019:27            |            1 |                                      |
| afrik_dossiers            | 082:59       | 082:92            |            1 |                                      |
| afrik_language_families   | 006:16       | 019:28            |            1 |                                      |
| afrik_languages           | 006:26       | 019:29            |            1 |                                      |
| afrik_media               | 073:23       | 073:54            |            1 |                                      |
| afrik_patronyme_alliances | 061:61       | 061:94            |            1 |                                      |
| afrik_patronyme_countries | 053:119      | 053:142           |            1 |                                      |
| afrik_patronyme_peoples   | 053:111      | 053:141           |            1 |                                      |
| afrik_patronyme_persons   | 064:24       | 064:41            |            1 |                                      |
| afrik_patronymes          | 053:75       | 053:140           |            1 |                                      |
| afrik_people_countries    | 006:46       | 019:31            |            1 |                                      |
| afrik_people_languages    | 054:22       | 054:39            |            1 |                                      |
| afrik_people_relations    | 030:32       | 030:65            |            1 | policy in a `DO` block               |
| afrik_peoples             | 006:36       | 019:30            |            1 |                                      |
| afrik_translations        | 085:32       | 085:73            |            1 |                                      |
| antibot_challenges        | 048:80       | 048:97            |            0 | deny-all, intent at 048:94-95        |
| api_keys                  | 012:10       | 012:40            |            1 |                                      |
| assertion_references      | 031:61       | 040:34            |            1 |                                      |
| assertions                | 009:31       | 015:444           |            1 |                                      |
| audit_log                 | 009:145      | 009:158           |            2 |                                      |
| confidence_scores         | 009:55       | 015:445           |            1 |                                      |
| contributor_profiles      | 023:57       | 026:12            |            3 |                                      |
| editorial_doctrine        | 009:122      | 017:15            |            4 |                                      |
| fiche_revisions           | 020:28       | 020:39            |            1 |                                      |
| flag_reporter_contacts    | 075:29       | 075:53            |            0 | deny-all, intent at 075:19-20, 55-56 |
| flags                     | 009:73       | 022:58            |            3 |                                      |
| migration_event_peoples   | 035:66       | 035:92            |            4 |                                      |
| migration_events          | 035:40       | 035:91            |            4 |                                      |
| name_records              | 029:40       | 029:150           |            4 |                                      |
| oral_narrative_links      | 032:40       | 032:58            |            1 | `DO` block                           |
| oral_narratives           | 032:8        | 032:57            |            1 | `DO` block                           |
| person_countries          | 057:119      | 057:190           |            1 |                                      |
| person_peoples            | 057:98       | 057:189           |            1 |                                      |
| persons                   | 057:46       | 057:188           |            1 |                                      |
| protected_record_audit    | 033:46       | 033:160           |            1 |                                      |
| protected_records         | 033:4        | 033:159           |            1 |                                      |
| quiz_generation_runs      | 036:27       | 036:71            |            1 |                                      |
| quiz_questions            | 036:40       | 036:70            |            1 |                                      |
| revision_drafts           | 023:108      | 023:136           |            4 |                                      |
| revisions                 | 009:98       | 021:206           |            2 |                                      |
| search_query_log          | 050:12       | 050:25            |            0 | deny-all, intent at 050:9-10         |
| source_working_assets     | 034:7        | 034:35            |            5 |                                      |
| sources                   | 009:9        | 015:443           |            1 |                                      |
| user_roles                | 008:14       | 008:43            |            4 |                                      |

**Beyond tables:** six `storage.objects` policies (`033:177`, `034:89-125`); three views, all
`security_invoker = true` (`071:28`, `071:70`, `080:50`); ten live `SECURITY DEFINER` functions, all
pinning `search_path` (two via `ALTER FUNCTION` at `076:35,57`). `private.is_admin`,
`is_moderator_or_admin` and `is_protected_records_editor` are granted to `anon`/`authenticated` so
policies can evaluate (`077:120-122`) — safe only while `private` is not an exposed schema
(`PGRST_DB_SCHEMAS` on the VPS, N/A). `publish_revision` checks role in its body (`051:546`);
`enforce_oral_narrative_approval` (new in `089`) revokes `EXECUTE` (`089:109`).

**Application surface**

| Control                | Verdict                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security headers       | ✅ HSTS preload, nosniff, Referrer-Policy, Permissions-Policy, CSP on every middleware response                                                   |
| CSP nonce              | ✅ per request (`btoa(crypto.randomUUID())`); client `x-nonce`, `x-locale`, `x-api-key-id` overwritten                                            |
| Locale fail-closed     | ✅ `fr-only` on missing or invalid mode; confirmed live                                                                                           |
| API-key auth           | ✅ PBKDF2-SHA256 600 000 / 16-byte salt / constant-time; invalid key → 401; keyless → anonymous 60 rpm                                            |
| Rate limiting          | ✅ Upstash, per tier, fails closed when unconfigured; production configured (live headers); P2 D1-4                                               |
| CORS                   | ✅ single configured origin, `Vary: Origin`; P2 credentials flag and missing `DELETE`                                                             |
| Service-role isolation | ✅ `server-only`; all 23 non-test importers server-side                                                                                           |
| Browser data client    | ✅ none — `auth-client.ts` only authenticates                                                                                                     |
| Mutating routes        | ⚠️ flags, keys, publish, sign-in gated; **reference library authenticated but not authorized (D1-1)**                                             |
| Input validation       | ✅ zod or validators on the six sampled routes; strict `lang`                                                                                     |
| Sentry                 | ✅ EU DSN enforced, `sendDefaultPii: false`, broad scrubber; P2 tags/user id                                                                      |
| Secrets (tree)         | ✅ only `.env.example` and `e2e/.env.example` tracked; one false-positive pattern hit (`PAT_BABIRYE.json:64`)                                     |
| Secrets (history)      | ⚠️ recette leak of 2026-08-26, Postgres rotation unverified (D2-1)                                                                                |
| Supply chain           | ✅ 0 unpinned actions, Dependabot, `npm audit` 0 critical / 0 high / 10 moderate                                                                  |
| Branch protection      | ⚠️ well configured; bypassed on six merges (D3-1)                                                                                                 |
| Console discipline     | ✅ 18 `console.*` outside tests: 3 in the logger, 9 in the asset generators, 6 in client components/pages; none in a `no-console`-error directory |

---

## 9. Performance & accessibility posture

- **axe-core (`a11y.yml`)** — required as `axe-core (Storybook)` on both branches, no
  `continue-on-error`; 270 stories with 0 violations; the live-route pass failed on four HTTP 500s
  during the recette outage and was merged over (D3-1).
- **Lighthouse gate (`.lighthouserc.gate.js`)** — required on `recette`; `/fr`, `/fr/atlas/pays/SEN`,
  `/fr/atlas/peuples/PPL_WOLOF`, `/fr/atlas/recherche`; accessibility and best-practices as errors,
  performance as a warning; **green on PRs**.
- **Lighthouse nightly (`.lighthouserc.js`, `lighthouse.yml`)** — 29 URLs, mobile 360×640, simulated
  4G; accessibility = 1 and best-practices ≥ 0.95 as errors; **performance ≥ 0.73** as an error on
  non-fiche routes and ≥ 0.85 as a warning on fiches; fiche LCP/TBT ceilings 6 500 / 3 600 ms. Green
  1 of 5; its latest run asserted and passed with six performance warnings (D9-2).
- **E2E (`e2e.yml`)** — the smoke set (fr, 430 px) runs on every PR and is required on `recette`;
  the full matrix (mobile-430, tablet-720, desktop-800, desktop-1200, moderator-1024) runs nightly and
  on PRs to `main`, red 5 of 5 but down to one failure (D9-1). Runs do execute tests.
- **Core Web Vitals** — not tracked from real users (D9-3).
- **Locale** — the gates run `bilingual-fr-default`; production is `fr-only`, and an unpublished
  locale redirects (`/en` → 307 `/fr`, `/es` → 308 `/fr`).

---

## 10. AFRIK data integrity & Source Tier compliance

| Check                                        | Verdict                                                                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Strict model adherence (17 models, 1 722) | ❌ **D8-2** — all people and family fiches drift; 13 countries lack `culture.mainLanguages`; no gate for those kinds                                |
| 2. Validator run                             | ✅ 51/51 checks, 0 errors, 5 619 warnings                                                                                                           |
| — FR28 hard gate [95,105]                    | ✅ **0** offenders (blocking)                                                                                                                       |
| — FR28-strict [99,101]                       | ✅ **0** offenders (blocking); `SOFT_CHECK_NAMES` = `FR52-coverage` only (23)                                                                       |
| 3. FLG / PPL / ISO referential integrity     | ❌ **D8-3** — 2 dangling family ids (NGA, SDN), 7 country/people membership mismatches; ISO codes valid in form (no ISO 639-3 registry in the repo) |
| 4. Source Tier compliance                    | ❌ **D8-1** — 929 `needs_review` outside the declared vocabulary; OpenAPI and `SourceTier` omit it. All other P0 counts zero                        |
| 5. Database vs source JSON                   | N/A — credentials not readable in this session; the production sync's own verifier found the D5-1 divergence                                        |
| 6. CI enforcement                            | ✅ blocking on PRs, `validate` + `editorial-rules` required on `recette`, nightly green 2026-09-13 (P2: `editorial-rules` not required on `main`)   |
| 7. Reader-facing register                    | ❌ **D8-4** — gate passes; 28 "vague 1" gap reasons slip past its pattern                                                                           |
| 8. Known-issues carry-over                   | ❌ 133 retired CIA URLs (ratcheted), 929 `needs_review` (ratcheted), 95/95 undated polities, production serving retired rows                        |
| Editorial rules                              | ✅ 0 errors, 97 warnings (95 `chronology-symmetry`, 2 `autonym-required`: `PPL_MANDE_DU_SUD`, `PPL_KIRDI`)                                          |
| Translation parity (survey)                  | ✅ blocking on diffs in CI; survey backlog 821 findings, 873 deferrals (was 1 669)                                                                  |

**Counts.** Fiches: peuples 776, patronymes 796, pays 54, famille_linguistique 24, langues 34,
relations 12, noms 11, dossiers 7, migrations 6, systèmes onomastiques 1. Tiers: `official` 1 682 ·
`referenced` 1 946 · `unverified` 2 519 · `needs_review` 929. `source_kind`: none 5 486,
`ai_generated` 500 (all `unverified`), academic 400, community 293, government 123, repository 107,
linguistic_reference 74, intergovernmental 41, archive 26, official_statistics 11, unknown 9,
discovery 6. Wikipedia URLs: 0; 56 notes mention Wikipedia, and the 21 read all record the language
versions crossed or say Wikipedia was not used.

**Domain 8 scoring.** Five failed checks (1, 3, 4, 7, 8) and one N/A (5) → ≤ 4; the check-4 P0 caps
at 4. Reading `needs_review` as a ratcheted backlog rather than a P0 would not change the score.

---

## 11. Prioritized action list

No finding below has a Jira ticket yet; IDs refer to this report.

| #   | Pri | Action                                                                                                                                                                                                                  |
| --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P1  | **D3-1** — restore the recette project (egress quota), re-run the red `axe-core` and smoke checks on `recette` and `main`, and hold the next Release until they are green. Decide who may merge over red and record it. |
| 2   | P1  | **D5-1** — run the production sync with `--prune` per `docs/runbooks/afrik-data-sync.md` so production stops serving the 28 retired peoples; confirm `verifyCorpusInDatabase` goes green.                               |
| 3   | P1  | **D1-1** — gate `reference-library` writes on the moderator allowlist (as `PATCH /flags/[id]` does); confirm the production GoTrue sign-up setting; fix the "contributor" wording in the OpenAPI.                       |
| 4   | P1  | **D2-1** — run the rotation probe in `secret-exposure-audit-2026-09.md:214-234` and record the result.                                                                                                                  |
| 5   | P1  | **D8-2** — add model-key checks for peuple, famille and pays to `validateAfrikData.ts` behind a two-way ratchet, then burn the drift down or amend the models deliberately.                                             |
| 6   | P1  | **D8-1** — decide `needs_review`: declare it in `CLAUDE.md` as a state with its ratchet, or resolve the 929; align `SourceTier` and the OpenAPI enums with zod either way.                                              |
| 7   | P1  | **D8-3 + D8-4** — fix the two dangling family ids and the seven membership mismatches, add the check to the validator; widen the register pattern to catch "vague 1" and rewrite the 28 reasons.                        |
| 8   | P1  | **D10-2 + D10-3 + D10-4** — bring `CLAUDE.md:71`, `README.md:106`, `docs/DEPLOYMENT.md` in line with the keyless API, the automated migrations, the self-hosted production and the allowlist admin path.                |
| 9   | P1  | **D6-1 + D6-2** — decide whether Ferry is live: fix the router failure and the status names in `ferry-jira-automation-setup.md`, or mark the pipeline and doc SUPERSEDED.                                               |
| 10  | P1  | **D10-1** — run and record a restore drill against recette; name the owner in `restore-procedure.md:205`.                                                                                                               |
| 11  | P1  | **D9-1 + D9-2** — fix the remaining E2E failure; either restore the 0.85 performance floor on a scoped route set or record 0.73 as the accepted budget in the charter.                                                  |
| 12  | P1  | **Dead code** — delete or wire the 15 production-dead files (revisions action, persons service, rights rules, orphan parsers); unify the facet hub read path (D7-2) and the three type files.                           |
| 13  | P1  | **Hardcoded** — fail loudly when `NEXT_PUBLIC_SITE_URL` is unset in production; settle `contact@ethniafrica.com` vs `.org`; drop `SUPABASE_ORIGIN_FALLBACK`.                                                            |
| 14  | P2  | **D8-5 + D3-2** — require `editorial-rules`, the Lighthouse gate and the smoke set on `main` as on `recette`.                                                                                                           |
| 15  | P2  | Batch: D1-2 meter `/api/contact`, D1-3 constant-time secret compare, D1-4 double metering, D1-6 Node 22 in CI, D2-2 ignore `.env.*`, D9-3 real-user Web Vitals, D10-5/6/7 doc counts and `api-contracts.md`.            |

---

## 12. Conclusion

**6.0 / 10, down from 6.5 — and this time the code moved more than the number did.** Between the two
revisions almost every item on the previous action list was closed, and closed properly: the API
decision was documented, the CVEs overridden, the dead-code ratchet taught to see production
reachability, the vocabulary migration applied on both databases, the workshop phrases removed from
what readers see, the editorial gate made required.

The score fell because the audit looked at things it had not looked at before, and three of them
were outcomes rather than configurations. The merge history shows six changes landing over red
required checks during an integration-environment outage. The production data sync shows the
public site serving fiches git has retired. Fiches sampled against their strict models show that
the editorial contract's structural half has no gate for its three largest kinds. None of these is
a regression introduced since 2026-09-12; each was waiting for a measurement.

The previous conclusion said the fix was not more gates but deciding which ones guard something.
That decision was made, and the gates now exist. What remains is the part no configuration can
enforce: when an environment goes down and every gate turns red at once, waiting instead of merging
around them.
