# EthniAfrica — Production Readiness Audit

**Date:** 2026-09-13 (sixth revision)
**Branch:** `recette` @ `e1a54e36` · **Version:** 4.8.0 · **Deployed:** yes, releases through `v4.8.0`
**Method:** read-only. Nothing was fixed, bumped, tagged, pushed or deployed by this audit.

---

## 1. Scope and method

Every long gate was run locally in a fresh worktree on `origin/recette` (`lint`, `typecheck`,
`format:check`, `test:coverage`, `build`), plus the repo-specific gates (`lint:req`,
`check:jira-template`, `check:action-pins`, `check:workflow-shell`, `check:env-example`,
`check:local-paths`, `check:migration-files`, `check:rls-coverage`, `check:dead`,
`check:translation-parity`, `test:social-tools`, `test:charter-contracts`, `validateAfrikData.ts`,
`checkEditorialRules.ts`, `checkSourceTierCoverage.ts`). knip (default and `--production`), ts-prune
and jscpd were run through `npx`; CI history, branch protection and every pinned action SHA were
read through `gh`.

**This revision is mostly a re-verification.** It comes one day after the fifth, and in between
`recette` merged the PRs aimed at that revision's findings (#999–#1003, #1005, #1007, #1008, migration
`088`). Every earlier finding is marked **fixed**, **partial** or **open** below, with current
evidence. Of the fifth revision's 33 numbered findings, 20 are fixed, 9 are partial and 4 are open.

**Corrections to the fifth revision.** Its RLS table was already net of `contributions` and already
listed `afrik_dossiers` and `afrik_translations`; this revision's replay agrees. A second method
counts 75 `CREATE POLICY` survivors instead of 69 because it includes `storage.objects` policies —
69 remains the count for public-schema tables.

**Still not measured:** live Supabase Auth configuration on the self-hosted production stack
(whether sign-up is open — it decides the severity of D1-9), the Traefik forwarded-header policy
(D1-6, D1-10), and database-vs-JSON consistency directly (it is measured by CI after each sync, not
by this audit).

**One local test failure was load, not code.** The first `test:coverage` run failed one test on a
5 000 ms timeout while five scans ran in parallel; alone it passed 9/9, and a clean re-run of the
full suite passed (D4-4).

---

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Yes — it is in production and the release path works — conditional on one security decision and
one broken nightly job.** `v4.8.0` deployed through GitHub Release → OVH, its `migrate` job reported
"applied 87 · pending 0 · orphaned 0 · drifted 0", and the production data sync that followed
succeeded. Every required merge gate is green: 8 983 tests, 0 validator errors, 0 editorial errors,
RLS on 45 of 45 live tables.

The conditions:

1. **D1-9 (P1, conditional)** — the reference-library write endpoints check that a caller is
   _signed in_, never what role they hold. Any authenticated account can create a source at tier
   `official`, attach sources to assertions, and upload working assets, all through the service-role
   client (`src/api/v2/services/reference-library.ts:88-105`, `handlers/reference-library.ts:199-216`).
   It is P1 if the self-hosted production stack allows open sign-up (the local
   `supabase/config.toml:68` does, with GitHub and Google OAuth), P2 if it does not.
2. **D8-7 (P1, new)** — **the nightly Confidence Recompute has failed 5 of 5.** It crashes on the
   same `server-only` import that yesterday's fix repaired in `data-integrity.yml` but not here
   (`.github/workflows/confidence-recompute.yml:22,28` run plain `tsx`; `scripts/checkSourceUrls.ts:22`
   and `scripts/recomputeConfidence.ts:30` import `src/lib/supabase/admin.ts`). Confidence scores are
   not being recomputed on schedule.

And one systemic caveat: **every CI repair is on `recette` and none is on `main`** — 85 commits
behind. Scheduled workflows and the Storybook deploy run `main`'s files, so the five workflows that
were red yesterday are still red on their nightly runs (D3-4), and the promotion PR #1009 is blocked
by a required smoke check that shares the recette database (D3-5).

### 2.2 Is the AFRIK editorial surface sound?

**Yes — and both of yesterday's doctrinal defects are closed.**

- `validateAfrikData.ts`: **50/50 checks, 0 errors**, 5 597 warnings, across 1 722 tracked JSON
  files and 17 strict models.
- **FR28 hard gate [95,105]: 0 offenders. FR28-strict [99,101]: 0 offenders.** Both fail the build.
- `checkEditorialRules.ts`: **0 errors**, 97 warnings (95 `chronology-symmetry`, 2
  `autonym-required`); `UNDATED_POLITY_CEILING` 95, measured 95.
- **0 untiered sources, 0 empty `sources` arrays.** Tiers: `unverified` 3 320 · `referenced` 1 900 ·
  `official` 1 632 · `needs_review` 1 000. The 89 links to Facebook, Blogspot, WordPress, Reddit and
  X are all at `unverified` or `needs_review` (both weight 0.4); none points at wikipedia.org.
- **D8-1 fixed** — migration `088_needs_review_source_tier.sql:41-43` admits `needs_review`, and
  `recompute_confidence()` now weighs every case.
- **D8-2 fixed** — "domain ruling" and "awaits editorial review" occur **0 times** in `dataset/`
  (4 348 yesterday), and `src/lib/editorial/readerRegister.ts:62-65` now refuses both.
- **D8-4 fixed on `recette`** — `editorial-rules` is a required check there (not yet on `main`).

What remains is the broken nightly recompute (D8-7, P1) and a vocabulary drift between loaders
(D8-8, P2).

### 2.3 Can a new contributor go clone → running in one session?

**Yes.** `check:env-example` verifies `.env.example` against the code in both directions; 88
sequential migrations; `npm run build` passes; the suite is green; the first admin is
`scripts/seedAdmin.ts`; `next-env.d.ts` is no longer tracked (D2-1 fixed).

Two small traps: **nothing stops a contributor on the wrong Node.** `package.json` and `.nvmrc` say
22, there is no `engine-strict`, and this audit ran every gate green on Node 20.20.2, with only a
`@supabase/supabase-js` deprecation warning in the build log (D5-2). And one test is tight enough on
its 5 s timeout to fail on a loaded machine (D4-4).

### 2.4 What is the security posture?

**Strong at the data plane and now at the edge; one authorization gap in a contributor API.**

- **RLS: 45 of 45 live tables**, 69 live public-schema policies, four deny-all tables with their
  intent commented. Migrations 081–088 add no `SECURITY DEFINER` function; the new search functions
  are `SECURITY INVOKER`, pin `search_path` and revoke from `PUBLIC`. `check:rls-coverage` now runs in
  CI (`ci.yml:162`).
- **Service-role isolation holds** — `admin.ts:5` imports `server-only`; no importer is a client
  component.
- **API keys:** `/api/v2` is now **public by design** — the forgeable `Origin`/`Referer` bypass is
  gone, keyless callers are rate-limited per IP, a present-but-invalid key gets 401, and a client-sent
  `x-api-key-id` is stripped (`src/middleware.ts:812-864`); the OpenAPI declares the key optional
  (`openapiV2.ts:4019`). PBKDF2-SHA256 at 600 000 iterations with a 16-byte salt; the rate-limit
  identifier is now a SHA-256 of the key (`rate-limit.ts:45`).
- **CSP and headers:** per-request nonce (`middleware.ts:604`), HSTS preload, nosniff,
  Referrer-Policy, `frame-ancestors 'self'`, and now a `Permissions-Policy`; every redirect, 401 and
  429 carries the header set; `connect-src` lists only the configured origins.
- **Auth callback open redirect fixed** — `safeDestination` resolves like a browser
  (`src/app/api/auth/callback/route.ts:27-44`).
- **Sentry:** EU DSN enforced in all three runtimes; the scrubber now covers auth headers, cookies,
  `data`, `query_string`, `extra`, `contexts` and breadcrumbs.
- **Gaps:** D1-9 (role-less reference-library writes, P1 conditional); D1-10 (`GET /api/v2/keys/issue`
  mints keys on a GET and limits them per `X-Forwarded-For`, P2); D1-6 residue (the anonymous bucket
  trusts the first `X-Forwarded-For` entry, safe only if Traefik strips it).
- **Supply chain:** 22 distinct pinned action SHAs, **all resolve**, and CI now checks existence
  (`check:action-pins -- --resolve`, `ci.yml:118`); gitleaks by digest in CI and by checksum in the
  Ferry workflows. `npm audit`: 0 critical, **0 high**, 10 moderate.
- **Branch protection (measured):** `recette` requires nine checks — `gitleaks`, `build`, `validate`,
  `openapi-diff`, `axe-core (Storybook)`, `Playwright smoke (fr, 430px)`, `Lighthouse gate (4 routes)`,
  `editorial-rules`, `dependency-audit` — `enforce_admins: true`, `strict: false`, no PR required.
  `main` still requires only the first five, `strict: true`, PR required with 0 approvals (D3-3).

### 2.5 Is the score close to 8–9/10?

**7.5 / 10 — up from 6.5, and this time the code moved, not the measurement.** Yesterday's three
P0 hardcoded values are gone, the dead-code ratchet gained a production tally and its findings were
deleted rather than documented, both AFRIK doctrinal defects closed, and every red gate was repaired
— on `recette`.

The three moves that close the most distance:

1. **Promote `recette` to `main`** — give the Playwright smoke check a database that the recette
   sync cannot starve (D3-5), merge #1009, and align `main`'s required checks with `recette`'s
   (D3-3). This turns the five nightly reds green and is worth ~1 point across D3 and D9.
2. **Close the two P1 gaps** — role-gate the reference-library writes (D1-9) and add
   `NODE_OPTIONS=--conditions=react-server` to `confidence-recompute.yml` (D8-7). Worth ~1 point
   across D1 and D8.
3. **Extend the production knip tally to exports and types, and delete what it finds** (D4-5), and
   run a restore drill with a named owner (D10-1). Worth ~1 point across D4, D7 and D10.

---

## 3. Overall score

**7.5 / 10** — mean of ten equally weighted domains.

The repair wave landed where it was aimed: the gates that reported without blocking are now
required, the dead code is deleted, the doctrine agrees with the database. What is left is mostly
one merge away — the fixes exist, on the branch production does not run its nightly jobs from.

---

## 4. Score per domain

| #   | Domain                             | Score | Evidence                                                                                                                  |
| --- | ---------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Security posture                   | **8** | 45/45 RLS; edge hardening complete; 0 high CVEs — but reference-library writes are role-less (D1-9, P1 conditional)       |
| 2   | Secrets hygiene                    | **9** | Only `.env.example` files tracked; gitleaks by digest; `next-env.d.ts` untracked; full-history scan not re-run locally    |
| 3   | CI                                 | **7** | Nine required checks on `recette`, every pin resolves — but fixes unpromoted, nightlies red on `main`, #1009 blocked      |
| 4   | Correctness & tests                | **8** | 8 983 pass / 0 fail, coverage 86.6/80.4/89.9/87.6 — minus 1 for 13 P1 test-only modules the gate cannot see               |
| 5   | Deploy coherence                   | **8** | v4.8.0 deployed, 87/87 migrations on production, rollback documented — minus 1 for 11 P1 hardcoded values                 |
| 6   | Ferry pipeline                     | **7** | Config parses, pins resolve and carry full versions — CLI pinned at v1.1.2 beside v1.2.0 actions; setup doc drifted       |
| 7   | Architecture & boundaries          | **7** | Three-layer API holds (one exception), ISO table and loader writers single-sourced — minus 1 hardcoded, minus 1 dead code |
| 8   | AFRIK data integrity & Source Tier | **7** | 50/50, FR28 0/0, D8-1 and D8-2 fixed — one failed check: nightly confidence recompute crashes (D8-7)                      |
| 9   | Performance & accessibility        | **7** | axe-core, Lighthouse gate and Playwright smoke required and green on PRs — full matrices red on `main`, required nowhere  |
| 10  | Docs & runbooks                    | **7** | `CLAUDE.md` contradiction and stale counts fixed — restore drill 14 months old with an `(owner)` placeholder              |

---

## 5. Strengths

- **Findings get closed, not re-labelled.** 20 of yesterday's 33 numbered findings are fixed in
  code within a day, and the fixes carry tests: `needsReviewTierMigration.test.ts` holds the TS tier
  weights to the SQL ones; `generateQuizQuestionsModuleGraph.test.ts` holds the nightly job's module
  graph; `check:action-pins --resolve` now proves a pin exists instead of matching its shape.
- **The ratchets fail in both directions and got tighter.** `check:dead` gained a production tally
  (files 15/15, dependencies 1/1); the default tally fell to exports 9 and types 7 (22 and 49
  yesterday); `NEEDS_REVIEW_RATCHET` went from 1 010 upward-only to 1 000 two-way.
- **The edge was hardened by deciding, not by patching.** Rather than harden a header check that
  could never authenticate, `/api/v2` was declared public in the middleware and in the OpenAPI, with
  keys reserved for quota.
- **Lighthouse budgets say why they are what they are.** The fiche TBT ceiling of 3 600 ms is
  documented as the cost of software rasterising a WebGL globe on a GPU-less runner, held as a
  ratchet that may only go down (`.lighthouserc.js:199-208`).
- **The data plane stays locked down and reasoned** — every live table under RLS, every new function
  `SECURITY INVOKER` with a pinned `search_path`.

---

## 6. Gaps and risks

### Domain 1 — Security posture

- **D1-9 (P1 conditional, new)** — reference-library writes are authenticated but not authorized.
  `getAuthenticatedReferenceUser` returns any valid Supabase user
  (`src/api/v2/services/reference-library.ts:88-105`); `handleReferenceCreate` passes the
  caller-supplied `tier` straight through (`handlers/reference-library.ts:199-216`), and the assertion
  link and asset upload handlers do the same (`:234-249`, `:263-271`). Writes run with the service-role
  client, so RLS does not apply. Fix: require `contributor` or above from `user_roles` in the service.
- **D1-10 (P2, new)** — `GET /api/v2/keys/issue` inserts an `api_keys` row on a GET, enforces "one key
  per IP" on the first `X-Forwarded-For` entry, and skips the check entirely when no IP header is
  present (`src/app/api/v2/keys/issue/route.ts:40-61`). It is also the only v2 route that queries
  Supabase directly, outside the service layer.
- **D1-6 (P2, partial)** — the key identifier is hashed (fixed); the per-IP bucket still reads the
  first `X-Forwarded-For` entry (`src/lib/api/rate-limit.ts:13`).
- **D1-8 (P2, partial)** — `engines`, the Dockerfile and the Ferry gitleaks checksums are fixed; six CI
  jobs still run Node 20 (`ci.yml:229`, `e2e.yml:63,206`, `editorial-rules.yml:25`,
  `lighthouse.yml:57,143`).
- **Fixed:** D1-2 (key bypass → public by design), D1-3 (`npm audit` 0 high, `js-yaml` override at
  `package.json:115-117`, CI blocks on high at `ci.yml:232`), D1-4 (open redirect), D1-5 (headers on
  every response, `Permissions-Policy`), D1-7 (Sentry scrubbing).

### Domain 2 — Secrets hygiene

- **Fixed:** D2-1 — `next-env.d.ts` is ignored (`.gitignore:35`) and untracked; the tree stayed clean
  through `build`.
- The one secret-pattern hit is the known false positive (`PAT_BABIRYE.json:64`, an encrypted route id
  inside a parliament URL).

### Domain 3 — CI

- **D3-4 (P1, replaces D3-1)** — **the repairs are on `recette`; the red runs are on `main`.**
  Scheduled workflows and `storybook-deploy` run the default branch's files, which are 85 commits
  behind:

  | Workflow             | Pull requests (recette) | Nightly / push (main)                       |
  | -------------------- | ----------------------- | ------------------------------------------- |
  | E2E                  | 7/7 pass, then D3-5     | 0/5 — stale specs (57 failed)               |
  | Lighthouse           | 7/7 pass                | 0/5 — pre-rebase budgets                    |
  | Storybook deploy     | —                       | 0/10 — bad pin still on `main`              |
  | Data Integrity       | 10/10 pass              | 0/8 — `server-only` crash, fixed on recette |
  | Confidence Recompute | —                       | 0/5 — **not fixed anywhere** (D8-7)         |
  | Ferry Cost Daily     | —                       | 0/10 — variable set 2026-09-13 00:01Z       |
  | Deploy production    | —                       | 6/6 pass                                    |

- **D3-5 (P1, new)** — **the promotion PR #1009 is blocked by a required check that depends on shared
  state.** `Playwright smoke (fr, 430px)` failed 2 of 6 (the `PPL_WOLOF` and `SEN` titles) because
  every Supabase read timed out during the build — while `Recette AFRIK Data Sync` was running against
  the same database. The same check passed on #1008 fifteen minutes earlier. A required gate that a
  data sync can turn red will block merges at random.
- **D3-3 (P2, changed)** — `main` requires 5 checks and `recette` 9; a hotfix PR straight into `main`
  skips smoke, Lighthouse, editorial rules and the dependency audit.
- **Fixed:** D3-2 — `storybook-deploy.yml` now pins a SHA that exists (`d6db9016…c03e`, tag v4.0.5),
  and `check:action-pins --resolve` would have caught the old one.

### Domain 4 — Correctness & tests

- **D4-5 (P1, replaces D4-2)** — the production knip tally counts only `files` and `dependencies`
  (`scripts/ci/checkDeadCode.ts`); **35 exports and 11 types reached only by tests** stay invisible to
  the gate and can grow. List under _Dead code & redundancy_.
- **D4-4 (P2, new)** — `scripts/__tests__/initCountryEnrichment.test.ts:173` times out at 5 000 ms on
  a loaded machine; the file's nine tests take 4.94 s together when run alone.
- **D4-3 (P2, improved)** — lint warnings down to 39 (0 errors); six unused `React` imports remain in
  production components.
- E2E failures on `main` are counted canonically in D3-4.

### Domain 5 — Deploy coherence

- **D5-2 (P2, new)** — nothing enforces the declared Node version locally: `engines` and `.nvmrc` say
  22, there is no `engine-strict`, and every gate passes on Node 20.20.2.
- **D5-3 (P2, new)** — `next build` warns that the `middleware` file convention is deprecated in
  favour of `proxy`.
- **D5-1 (P2, unchanged)** — `s-maxage=86400` on mutable list endpoints; production has no CDN in
  front of the container.
- Migration `088` is live on recette (`migrate-recette` run 34726612478) and pending the next release.
- Hardcoded-value penalty applied — see _Hardcoded values (P0/P1)_.

### Domain 6 — Ferry pipeline

- **D6-2 (P2, new)** — two Ferry versions in one pipeline: composite actions pinned to v1.2.0
  (`39a42f9f…`), while `ferry-cost-daily.yml:25` and `ferry-reconcile.yml:25` set `FERRY_REF: v1.1.2`
  and the five agent workflows run `npx -p @big-emotion/ferry@v1.1.2` (e.g. `ferry-dev.yml:139`),
  tag-pinned with no integrity check.
- **D6-3 (P2, new)** — `ferry-jira-automation-setup.md:70,184` names the triggers `In Development` and
  `Ready to Merge`; `ferry.config.yaml` uses `READY FOR DEV` and `TO MERGE`, and warns that a mismatch
  is a silent no-op. `.claude/skills/ethniafrica-ticket/SKILL.md:46` reads the review column from that
  document.
- **Fixed:** D6-1 — `openai/codex-action` pinned at `52fe01ec…  # v1.11`. Ferry Cost Daily's missing
  variable was set on 2026-09-13; no run has confirmed it yet.

### Domain 7 — Architecture & boundaries

- **D7-5 (P1, new; counted under hardcoded values)** — production's OpenAPI document labels its own
  server "Serveur de développement": the description keys off `VERCEL_URL`, which the OVH host never
  sets (`src/lib/api/openapiV2.ts:36-43`).
- **D7-6 (P2, new)** — `src/app/api/docs/route.ts:7,19-22` still points readers at `/api/docs/v1`,
  which no longer exists.
- **D7-2 (P2, partial)** — the three facet hubs now share `readFacet(...)` and an "unavailable" state;
  `atlas/langues/page.tsx:170,246` and `atlas/peuples/page.tsx:184,269` still carry two cloned blocks
  (~95 lines).
- **D7-4 (P2, partial)** — `ethni_carousel.py` and `ethni_card.py` are deleted and the docs point at the
  live engine; the token test (`test_ethni_tokens.py:196`) does not scan `ethni_compose_v1`,
  `ethni_plaque`, `ethni_type` or `ethni_brand`, and `ethni_brand.py:26-28` holds colour literals.
- **Fixed:** D7-1 (one table, `src/lib/isoCountryCodes.ts`), D7-3 (the five loaders import
  `provenanceWriter.ts`).

### Domain 8 — AFRIK data integrity & Source Tier

- **D8-7 (P1, new)** — nightly Confidence Recompute crashes on `server-only` (see §2.1); 5 of 5 runs.
- **D8-8 (P2, new)** — two loaders store a `needs_review` source differently:
  `peopleAppellationLoader.ts:104` folds it to `unverified`, `provenanceWriter.ts:304-310` stores
  `NULL`. Both upsert `sources` by title, so one title's reader-facing label depends on which loader
  ran last. Migration 088 now admits `needs_review` as a stored value, and no code writes it.
- **D8-5 (P2, unchanged)** — `check:translation-parity` run bare is a survey (821 findings, 873
  deferrals, down from 1 669); CI blocks with `--base`.
- **Fixed:** D8-1 (migration 088), D8-2 (0 occurrences, patterns in `readerRegister.ts`), D8-3 on
  `recette` (quiz-bank job runs under the react-server condition; the unreachable URL is gone from
  the corpus), D8-4 on `recette`, D8-6 (ratchet 1 000, two-way).

### Domain 9 — Performance & accessibility

- **D9-2 (P2, replaces D9-1)** — Lighthouse and E2E are now split into a required PR gate (4 routes;
  fr smoke at 430 px) and a full nightly matrix that is required nowhere and red on `main` until
  promotion (counted in D3-4). The fiche performance score is a warning only, so no gate measures
  what a phone renders on the product's central page — the lab cannot, by the file's own account.

### Domain 10 — Docs & runbooks

- **D10-1 (P1, unchanged)** — the only restore drill is `restore-drill-2025-07-14.md`;
  `restore-procedure.md:201` says "Next drill due: 2025-10-14 — overdue" and `:205` still reads
  `(owner — the operator must name a person here)`.
- **D10-6 (P2, partial)** — `migration-state.md` is verified 2026-09-12 and lists 084–087; it has no
  row for `088`, and its summary still says recette "applied 86".
- **D10-8 (P2, new)** — this audit's own skill still requires `docs/api-contracts.md` (deleted on
  purpose in #401) and `_bmad-output/project-context.md` (absent), so two Domain 10 checks cannot pass
  as written (`.claude/skills/ethniafrica-audit/SKILL.md:272`).
- **D10-9 (P2, new)** — stale comments: `src/types/sources.ts:75-76` says the weights mirror migration
  041 (now 088); `.github/workflows/data-integrity.yml:60` says 789 people fiches (776).
- **Fixed:** D10-2 (counts replaced by pointers to the source), D10-3 (skill brought up to date),
  D10-4 (`CLAUDE.md` contradiction), D10-5 (`lint` description), D10-7 (engine docs).

### Hardcoded values (P0/P1)

Grouped by defect, as in the fifth revision. Two items found in
`src/lib/rights/protected-asset-access.ts` are not counted here: the module is reached only by tests,
so it is counted once under dead code.

**Hardcoded URLs**

- **P1** `src/middleware.ts:56` — `https://supabase.ethniafrica.com` — `SUPABASE_ORIGIN_FALLBACK`: with
  the env URL unset or invalid, any deployment's CSP admits production's Supabase.
- **P1** `src/lib/api/openapiV2.ts:36-43`, `src/app/api/v2/feed/revisions/route.ts:167`,
  `src/app/layout.tsx:39` — `http://localhost:3000` — site-URL fallbacks; the OpenAPI one also
  mislabels production (D7-5).

**Hardcoded Roles / Tiers**

- **P1** `src/lib/api/auth.ts:94`, `openapiV2.ts:3971`, `013_api_keys_tier.sql:8` —
  `public|partner|admin` — api-key tier written three times with no shared constant; `"public"` again
  in `keys/issue/route.ts:57,84,102` and `keyService.ts:95`.
- **P1** `SourceTier | "needs_review"` re-declared in five places with no shared constant —
  `sourcesFacet.ts:39`, `SourceChainSheet.tsx:42,230`, `ficheSourceLabel.ts:37`,
  `ficheSourceRegister.ts:41`, `SourceStandingBadge.tsx:6` (related: D8-8).

**Pagination & Batch Sizes**

- **P1** limits outside `src/api/v2/schemas/pagination.ts` — `peoples/[id]/revisions/route.ts:62-63`,
  `feed/revisions/route.ts:104-105`, `search/route.ts:202-203` (`20`/`100`, search `50`);
  `schemas/names.ts:199`, `relations.ts:61` (inline `.max(100)`); `signalements/actions.ts:50-51`,
  `page.tsx:36` (`50` ×3).
- **P1** read ceilings `pageSize` 500 (sources 1 000) × `maxPages` 20–60 in 11+ query modules
  (e.g. `languageFacet.ts:21,28`, `sitemapEntries.ts:25,32`, `sourcesFacet.ts:101,104`). Since
  `walkRanges.ts`, hitting the cap reports `truncated` rather than truncating silently.

**Cache TTLs**

- **P1** `revalidate: 60` ×4 (`signalements/[slug]/page.tsx:23`, `signalements/page.tsx:38`,
  `hubs/moduleAvailability.ts:134,234`) and Cache-Control strings outside `CORPUS_CACHE_CONTROL`
  (`sources/route.ts:94`, `language-families/[id]/tree/route.ts:69`, `feed/revisions/route.ts:106`,
  two OG image routes).

**Timeouts / Durations**

- **P1** `src/lib/antibot/proofOfWork.ts:24` — `5 * 60 * 1000` — challenge TTL, no env override.
- **P1** `src/lib/flags/reporterContact.ts:15` — `24 * 60 * 60 * 1000` — reporter verification TTL.

**Rate-limit & Quota Thresholds**

- **P1** `src/api/v2/handlers/flags.ts:88` — `MIN_DWELL_MS = 3_000` — anti-bot dwell on flag
  submission, no env override.

_0 P0 (3 yesterday, all fixed) and 11 P1 → −1 on Domains 5 and 7._ `export const revalidate = 3600`
(×8) moved to P2: Next.js requires a literal there, and `corpusCache.ts:10` documents it. About 30 P2
internal constants, nearly all named.

### Dead code & redundancy

The CI gate is green and agrees with local: default tally files 0, dependencies 0, exports 9/9,
types 7/7; production tally files 15/15, dependencies 1/1 (`tailwindcss-animate`, a false positive —
`tailwind.config.ts:2`). Every file and dependency listed yesterday is deleted. What follows is what
the production tally does not count. Three items were re-verified by hand for this report
(`personService`, `publishRevision`, `rights/*`).

**Unreachable at runtime — kept alive only by a test**

- **P1** `src/api/v2/services/personService.ts` → `src/lib/supabase/queries/afrik/persons.ts` →
  `src/types/persons.ts` `Person` — the whole person service chain.
- **P1** `src/lib/games/corpus.en.ts`, `landmarks.en.ts`, `projectionContrast.en.ts`,
  `projectionContrast.ts` — the English games bank and the Mercator contrast.
- **P1** `src/lib/revisions/publishRevision.ts`.
- **P1** `src/lib/rights/rights-lifecycle.ts`, `src/lib/rights/protected-asset-access.ts`.
- **P1** `src/lib/afrik/parsers/oralNarrativeParser.ts`, `sourceParser.ts` →
  `src/lib/sources/source-model.ts`, with `StructuredSourceRecord`, `AssertionSourceReference`,
  `LegacySourceCandidate` in `src/types/sources.ts`.
- **P1** `src/lib/glossaire/entries.en.ts`, `src/lib/atlas/equalAreaProjection.ts`,
  `src/lib/supabase/queries/afrik/nameVariants.ts`.

**Exports reached only by tests**

- **P1** `src/api/v2/services/revisions.ts:5,21` `insertRevision`/`getRevision`;
  `services/migrations.ts:120` `listMigrationPaths`; `utils/validation.ts:72` `validateMedia`.
- **P1** `src/lib/peopleDataTransformer.ts:213,320,355,502` — `extractAppellationShort`,
  `hasOriginContent`, `transformEgoNetworkPreview`, `fetchPeopleNamesDossier`.
- **P1** `src/lib/atlas/overlays.ts:151,184,648` — `getWorldCompareNameFr`, `getAfricaAdmin0Rings`,
  `buildCountrySetOverlay`.
- **P1** `queries/afrik/peoples.ts:427` `getAfrikPeoplesByCountry`; `module-zero-batch.ts:273`
  `getLatestRevisionMap`; `loaders/peopleJsonLoader.ts:85` `loadPeoplesByLanguageFamily`.
- **P1** `src/types/sources.ts:79,90` — `SOURCE_TIER_WEIGHTS`, `AI_PROVENANCE_WEIGHT`: the weights
  `CLAUDE.md` documents are not what production uses; the SQL copy is (test-guarded, D8-1).
- **P1** a further 20 test-only exports: `clearConsent`, `hasRenderableSynthesis`,
  `isModuleAvailable`, `lintFicheProse`, `sidecarPathFor`/`sourcePathFor`, `MAX_ZOOM`,
  `panelFreeRegion`, `COUNTRIES_WITHOUT_ISO_FLAG`, `modelChapterKeys`, `RELATION_TYPE_LABEL_FR`,
  `isOptionRound`, `GAME_SLUGS`, `SCALE_FACT_PROVENANCE_PATHS`, `EDITORIAL_READINESS_STATES`,
  `CLASS_EXCEPTIONS`, `quizTrackLabelFr`, `UNLISTED_ROUTES`, `validateAuthorizedSourceCatalog`.
- **P1** D4-5 — the gate gap that lets all of the above grow.

**Unreferenced scripts** (invisible to knip, which treats `scripts/**` as entries)

- **P2** `scripts/anecdotes/sourceIllustrations.ts`, `extractClanNames.ts`,
  `extractNameRecordsFromFiches.ts`, `alignExternalIdentifiers.ts` — named by no npm script or
  workflow. `testLoader.ts`, `checkCountrySynthesis.ts`, `audit/runAudit.ts` and `setup-hooks.sh` are
  deleted; `check:rls-coverage` is wired into CI.

**Duplication** — jscpd (≥ 50 tokens, ≥ 5 lines): `src/` **4.12 %** (930 clones, 221 outside tests
and stories; 4.49 % yesterday); `scripts/` + `social/tools` + `eslint/` **2.91 %** (3.45 %).

- **P2** `atlas/langues` ↔ `atlas/peuples` pages, 49 + 46 lines (D7-2).
- **P2** `src/lib/api/openapiV2.ts:94,182,333` — a 41-line block three times in one file.
- **P2** `queries/afrik/countries.ts:39`, `languageFamilies.ts:57`, `languages.ts:171` — a 29-line block.
- **P2** a 17-line block in nine v2 routes and an 18-line block in five `[id]` routes.
- **P2** `peopleAppellationLoader.ts:88-218` — a batched second writer for sources, revisions and
  assertions beside `provenanceWriter.ts` (documented; see D8-8).
- **P2** accent stripping outside `src/lib/normalize.ts` in 14 places (8 in `src/`, 6 in `scripts/`;
  11 yesterday).
- **P2** `social/harness/hf-workflows/subtitles/scripts/fonts/` — three byte-identical copies of fonts
  in `social/harness/fonts/`.

**Surviving V1 imports:** none. The "Voir l'API v1" button is gone; one V1 link remains (D7-6).

_13 P1 → −1 on Domains 4 and 7. Overlap with hardcoded values: `protected-asset-access.ts` counted
here only._

---

## 7. Consumer / new-contributor flow

| Step                                      | Verdict                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `git clone` + `npm ci --legacy-peer-deps` | ✅ legacy peer deps intentional (Storybook vs Next)      |
| Node version                              | ⚠️ `.nvmrc` 22, not enforced; gates pass on 20 — D5-2    |
| `.env.example` → `.env.local`             | ✅ `check:env-example` verifies both directions          |
| `supabase/migrations/` apply in order     | ✅ 88 files, sequential, no duplicate prefix             |
| `npm run build`                           | ✅ passes (`middleware` → `proxy` deprecation, D5-3)     |
| `npm run test` / `make check`             | ✅ 8 983 pass; lint 0 errors; format and typecheck clean |
| Tree clean after `build`                  | ✅ `next-env.d.ts` untracked                             |
| First admin seeded                        | ✅ `ADMIN_EMAIL=… npx tsx scripts/seedAdmin.ts`          |

---

## 8. Security posture

**RLS coverage — 45 live tables, 45 enabled, 69 live public-schema policies.** `check:rls-coverage`
reports "OK (45 tables, all behind RLS)". Migrations 081–088 drop `contributions` (081) and add
`afrik_dossiers` (082) and `afrik_translations` (085), both already reflected below. No `RLS = No`
row: **no P0**.

| Table                     | RLS (migration) | Policies | Notes                        |
| ------------------------- | --------------- | -------: | ---------------------------- |
| admin_allowlist           | Yes (074)       |        0 | deny-all, intent commented   |
| afrik_countries           | Yes (019)       |        1 |                              |
| afrik_dossiers            | Yes (082)       |        1 | public read, service writes  |
| afrik_language_families   | Yes (019)       |        1 |                              |
| afrik_languages           | Yes (019)       |        1 |                              |
| afrik_media               | Yes (073)       |        1 |                              |
| afrik_patronyme_alliances | Yes (061)       |        1 |                              |
| afrik_patronyme_countries | Yes (053)       |        1 |                              |
| afrik_patronyme_peoples   | Yes (053)       |        1 |                              |
| afrik_patronyme_persons   | Yes (064)       |        1 |                              |
| afrik_patronymes          | Yes (053)       |        1 |                              |
| afrik_people_countries    | Yes (019)       |        1 |                              |
| afrik_people_languages    | Yes (054)       |        1 |                              |
| afrik_people_relations    | Yes (030)       |        1 | policy in a `DO` block       |
| afrik_peoples             | Yes (019)       |        1 |                              |
| afrik_translations        | Yes (085)       |        1 | public read, service writes  |
| antibot_challenges        | Yes (048)       |        0 | deny-all, commented `048:94` |
| api_keys                  | Yes (012)       |        1 |                              |
| assertion_references      | Yes (040)       |        1 | service-role writes — D1-9   |
| assertions                | Yes (015)       |        1 |                              |
| audit_log                 | Yes (009)       |        2 | explicit insert deny         |
| confidence_scores         | Yes (015)       |        1 |                              |
| contributor_profiles      | Yes (026)       |        3 |                              |
| editorial_doctrine        | Yes (017)       |        4 | three explicit `false`       |
| fiche_revisions           | Yes (020)       |        1 |                              |
| flag_reporter_contacts    | Yes (075)       |        0 | deny-all, intent commented   |
| flags                     | Yes (022)       |        3 |                              |
| migration_event_peoples   | Yes (035)       |        4 |                              |
| migration_events          | Yes (035)       |        4 |                              |
| name_records              | Yes (029)       |        4 |                              |
| oral_narrative_links      | Yes (032)       |        1 | `DO` block                   |
| oral_narratives           | Yes (032)       |        1 | `DO` block                   |
| person_countries          | Yes (057)       |        1 |                              |
| person_peoples            | Yes (057)       |        1 |                              |
| persons                   | Yes (057)       |        1 |                              |
| protected_record_audit    | Yes (033)       |        1 |                              |
| protected_records         | Yes (033)       |        1 |                              |
| quiz_generation_runs      | Yes (036)       |        1 |                              |
| quiz_questions            | Yes (036)       |        1 |                              |
| revision_drafts           | Yes (023)       |        4 |                              |
| revisions                 | Yes (021)       |        2 |                              |
| search_query_log          | Yes (050)       |        0 | deny-all, commented `050:9`  |
| source_working_assets     | Yes (034)       |        5 | service-role writes — D1-9   |
| sources                   | Yes (015)       |        1 | service-role writes — D1-9   |
| user_roles                | Yes (008)       |        4 |                              |

**RLS does not cover D1-9.** The reference-library handlers write `sources`, `assertion_references` and
`source_working_assets` through the service-role client, which bypasses every policy above; the
authorization has to live in the service.

**Functions:** no new `SECURITY DEFINER` in 081–088. The five `afrik_search_*` functions (084) and
`afrik_search_quiz` (087) are `SECURITY INVOKER`, pin `search_path` and revoke from `PUBLIC`;
`recompute_confidence` (088) is `INVOKER` and restates `SET search_path` (`088:68`). The earlier
definer functions are unchanged; `private` is not an exposed schema per `077:7-8` — confirm
`PGRST_DB_SCHEMAS` on the VPS.

**Edge and application:** see §2.4 and D1-6 … D1-10. **Secrets:** only `.env.example` and
`e2e/.env.example` tracked; `.gitignore:43-47` covers every variant. **Supply chain:** 22 pinned SHAs,
all resolving; Dependabot weekly; `npm audit` 0 critical / 0 high / 10 moderate (`@sentry/nextjs` →
`@opentelemetry`, `uuid` via exceljs and Storybook, `fflate`, `@humanfs`). **Console discipline:** 18
`console.*` calls outside tests — 10 in hand-run asset generators, 3 in the logger itself — none in a
`no-console`-error directory. **Code debt:** one real `TODO` (`src/app/[lang]/not-found.tsx:59`,
ETNI-247).

---

## 9. Performance & accessibility posture

- **axe-core (`a11y.yml`)** — runs on PRs to `recette` and `main`, required on both, green.
- **Lighthouse gate (`lighthouse.yml`, PR job)** — 4 routes, required on `recette`, 7/7 green. Budgets
  (`.lighthouserc.js:182-228`): accessibility = 1 and best-practices ≥ 0.95 everywhere; non-fiche
  routes performance ≥ 0.73, LCP ≤ 5 500 ms, TBT ≤ 300 ms; fiche routes LCP ≤ 6 500 ms, TBT ≤ 3 600 ms,
  performance a **warning** at 0.85 (measured medians 0.45–0.47, attributed to software rasterisation
  of the WebGL globe on a GPU-less runner); comparator routes CLS ≤ 0.1, max-potential-FID ≤ 200 ms.
- **Lighthouse full matrix** — nightly, PRs to `main`, dispatch; not required; red on `main`'s
  pre-rebase budgets until promotion (D3-4).
- **E2E** — `Playwright smoke (fr, 430px)` required on `recette` (mobile-first width), red once on
  shared-database contention (D3-5); full matrix nightly, not required, red on `main`'s stale specs.
- **Core Web Vitals in the field** — no measurement found in the repository; the lab cannot speak
  for the fiche pages (D9-2).

---

## 10. AFRIK data integrity & Source Tier compliance

| Check                                            | Verdict                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1. Strict model adherence (17 models, 1 722)     | ✅ 50/50 validator checks; 15 fiches hand-sampled across nine models, sections in order   |
| 2. Validator run                                 | ✅ 0 errors, 5 597 warnings                                                               |
| — FR28 hard gate [95,105]                        | ✅ **0** offenders (blocking)                                                             |
| — FR28-strict [99,101]                           | ✅ **0** offenders (blocking); only `FR52-coverage` soft                                  |
| 3. FLG / PPL / ISO referential integrity         | ✅ 776 people fiches, folder = family field; 54 country codes, 34 language codes valid    |
| 4. Source Tier — every source carries a tier     | ✅ 0 untiered, 0 empty `sources`; 89 social/blog links all at weight 0.4                  |
| 4. Source Tier — vocabulary agrees across layers | ✅ D8-1 fixed by `088`; ⚠️ loaders disagree on storing `needs_review` (D8-8, P2)          |
| 5. Database vs source JSON                       | ✅ by CI: `verifyCorpusInDatabase.ts` runs after every recette and production sync        |
| 6. CI enforcement                                | ❌ **D8-7** nightly confidence recompute crashing; PR gates required and green on recette |
| 7. Known issues carry-over                       | ✅ D8-2 at 0 occurrences; `FLG_AFROASIATIQUE` still has no people folder (informational)  |
| Editorial rules                                  | ✅ 0 errors, 97 warnings; chronology ratchet at ceiling (95/95)                           |
| Translation parity                               | ✅ blocking on diffs in CI; survey backlog 821 (D8-5)                                     |
| Source-tier ratchet                              | ✅ `needs_review` 1 000 / 1 000, two-way                                                  |

`classificationStatus` is absent from 311 of 776 people fiches and 5 of 24 families; the model says
to omit it until review (`modele-peuple.json:11`), so this is an editorial backlog, not a breach.

---

## 11. Prioritized action list

No finding below has a Jira ticket yet; IDs refer to this report.

| #   | Pri | Action                                                                                                                                                                      |
| --- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P1  | **D1-9** — confirm whether sign-up is open on the self-hosted production Auth; require `contributor`+ from `user_roles` in `reference-library.ts` either way.               |
| 2   | P1  | **D8-7** — add `NODE_OPTIONS=--conditions=react-server` to both steps of `confidence-recompute.yml`, and extend the module-graph test to cover `recomputeConfidence.ts`.    |
| 3   | P1  | **D3-5** — give `Playwright smoke` its own Supabase target (or serialise it with the recette data sync), then re-run and merge #1009 to promote `recette` to `main` (D3-4). |
| 4   | P1  | **D4-5** — add `exports` and `types` to the production knip tally with their own ceilings; delete the test-only modules and exports it lists.                               |
| 5   | P1  | **D10-1** — run and record a restore drill against recette; name the owner in `restore-procedure.md:205`.                                                                   |
| 6   | P1  | **Hardcoded P1s** — one `API_KEY_TIERS` and one `SOURCE_STANDINGS` constant; fix the OpenAPI server label (D7-5); import pagination limits from `schemas/pagination.ts`.    |
| 7   | P2  | **D3-3** — require the same nine checks on `main` as on `recette`.                                                                                                          |
| 8   | P2  | **D1-10** — make key issuance a POST behind the antibot check, with one trusted client-IP helper shared with `rate-limit.ts` (D1-6); move its query into a service.         |
| 9   | P2  | **D8-8** — one rule for storing `needs_review` across `peopleAppellationLoader.ts` and `provenanceWriter.ts`.                                                               |
| 10  | P2  | **D6-2 + D6-3** — one Ferry version across actions and CLI; align `ferry-jira-automation-setup.md` with `ferry.config.yaml` or mark it SUPERSEDED.                          |
| 11  | P2  | **D5-2 + D1-8** — `engine-strict=true` in `.npmrc`; move the six remaining CI jobs to Node 22.                                                                              |
| 12  | P2  | **D4-4** — raise the timeout on `initCountryEnrichment.test.ts:173` or make the test cheaper.                                                                               |
| 13  | P2  | **D10-6 + D10-9** — add `088` to `migration-state.md`; fix the two stale comments.                                                                                          |
| 14  | P2  | **D10-8** — drop the `api-contracts.md` and `project-context.md` checks from the audit skill, or point them at what replaced those files.                                   |
| 15  | P2  | Batch: D5-3 `middleware` → `proxy`, D7-6 `/api/docs/v1` link, D7-2 facet-hub clones, D7-4 token-test scope, the four unreferenced scripts, 14 accent-strip copies.          |

---

## 12. Conclusion

**7.5 / 10, up from 6.5 — and unlike the last move, this one is the code.** Within a day of the fifth
revision, 20 of its 33 findings were fixed and 9 more partly, most with a test that keeps them fixed: the gates that
reported without blocking became required, the dead code was deleted rather than ratcheted, the tier
vocabulary now agrees from JSON to SQL, and the edge stopped pretending a header was a credential.

What holds the score below 8 is narrower than yesterday. One authorization gap (D1-9) whose severity
depends on a production setting the repository cannot show. One nightly job the repair wave missed
(D8-7). And one merge: every CI fix lives on `recette`, the nightly runs read `main`, and the PR that
would reconcile them is blocked by a required check that shares its database with a data sync.
Unblock that merge and most of the red in this report turns green without touching a line of product
code.
