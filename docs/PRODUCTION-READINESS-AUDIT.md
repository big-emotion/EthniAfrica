# EthniAfrica — Production Readiness Audit

**Audit date:** 2026-09-19<br>
**Audited checkout:** `origin/recette` at `2d5064f7f` plus the remediation listed in this report<br>
**Application version:** `4.12.0`<br>
**Overall score:** **8.2 / 10**<br>
**Release verdict:** **CONDITIONAL GO.** The production foundation and the recette database are
operational. Merge or release remains conditional on the required CI checks for the remediation
commit; the optional 29-route Lighthouse matrix is still the main residual risk.

## 1. Scope and method

This audit covers the Next.js application, AFRIK corpus, self-hosted Supabase ledgers, GitHub
Actions and branch protection, release path, Ferry automation, security, performance,
accessibility, documentation, and clone-to-running flow. Outcomes were measured from the working
tree, GitHub runs, branch-protection API, and the recette data-sync report. Configuration alone was
not counted as a gate.

The remediation was implemented test-first and kept deliberately narrow:

- make the source charter deterministic when tests create or delete transient files;
- isolate the ESLint cache from generated worktree output;
- defer non-critical global client code and make the fiche WebGL globe an explicit reader action;
- stop transient imagery and the monospace font from competing with above-fold content;
- update migration, recovery, and Source Tier audit doctrine;
- make both protected branches strict, admin-enforced, and dependent on the same nine checks.

| Check                  | Outcome | Evidence                                                                                      |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `make check`           | PASS    | Full local gate completed on the remediated checkout                                          |
| Lint                   | PASS    | Zero errors; 37 non-blocking warnings; scoped cache at `package.json:49`                      |
| Typecheck / format     | PASS    | Included in `make check`                                                                      |
| Unit tests             | PASS    | Full suite green after the two remediation-contract fixes                                     |
| Coverage               | PASS    | 9,586 pass, 21 skip; 86.93% statements, 80.66% branches, 90.12% functions, 87.98% lines       |
| Production build       | PASS    | Next.js compiled, typechecked, and generated 46 pages                                         |
| Dead-code ratchet      | PASS    | 0 new findings; production ceilings remain three files and one dependency                     |
| Dependency audit       | WARN    | Six moderate; zero high; zero critical                                                        |
| RLS coverage           | PASS    | 47/47 live tables covered                                                                     |
| AFRIK validator        | PASS    | 57/57 checks; zero errors                                                                     |
| Editorial rules        | PASS    | Zero errors; known warnings remain within ratchets                                            |
| Database/source parity | PASS    | Exact equality for all seven synchronized entity/join classes                                 |
| Migration state        | PASS    | Recette and production: 93 applied, 0 pending, 0 orphaned, 0 drifted                          |
| Required CI            | PASS    | Latest completed CI, data, editorial, OpenAPI, axe, E2E, and canonical Lighthouse gates green |
| Expanded Lighthouse    | OPEN    | Latest 29-route run was red; the local root causes are corrected but not remotely measured    |

## 2. The five canonical questions

### 2.1 Is the project ready for production?

**Conditionally yes.** The deployed release, both migration ledgers, recette corpus parity, security
controls, required CI, and local quality gate are healthy. The remediation itself still needs to be
committed and exercised by the required checks. The optional expanded Lighthouse matrix should
also pass before treating the performance work as proven on every representative route.

### 2.2 Is the AFRIK editorial surface sound?

**Yes, with governed debt.** The validator reports no error, referential integrity is intact, every
fiche has sources, Source Tier P0 counts are zero, and the recette database exactly matches source
JSON. Strict-model drift is the single failed check. The admitted `needs_review` state and
chronology warnings remain visible and ratcheted; they are editorial debt, not hidden publication
failures.

### 2.3 Can a new contributor go clone → running in one session?

**Yes for the application and CI-equivalent local checks.** Node, install, environment templates,
migration replay, first-admin setup, API documentation, build, and tests are documented. A fully
data-backed local session still requires the documented local or recette credentials; the stale
developer `.env.local` observed during this audit is not evidence about the VPS.

### 2.4 What is the security posture?

**Strong.** All live tables have RLS, sensitive stores are deny-all, moderator writes are
authorized, the browser has no corpus data client, CSP is nonce-based, API keys use PBKDF2,
production limiting fails closed, CORS is explicit, and Sentry uses EU ingestion with PII
scrubbing. Remaining security work is moderate dependency remediation and durable evidence for
the historic recette credential rotation.

### 2.5 Is the score close to 8–9/10?

**Yes: 8.2/10.** The score remains in the requested range. The shortest path toward 8.5–9 is a
green expanded Lighthouse matrix, a current restore drill, and reduction of the strict-model and
architecture ratchets.

## 3. Overall score

The ten domains carry equal weight. **Total: 82 / 100 = 8.2 / 10.** There is no P0 and therefore no
score cap. This score describes the current repository plus the completed remediation. It does not
waive the requirement that the remediation commit pass its own remote checks.

## 4. Score per domain

|   # | Domain                             | Score | Rationale                                                                                             |
| --: | ---------------------------------- | ----: | ----------------------------------------------------------------------------------------------------- |
|   1 | Security posture                   | **9** | Complete RLS, strong auth/authz, CSP, CORS, service-role isolation, and PII controls                  |
|   2 | Secrets hygiene                    | **8** | Required Gitleaks and clean templates; historic rotation evidence remains incomplete                  |
|   3 | CI                                 | **9** | Domain workflows green; both branches strict/admin-enforced with nine required checks                 |
|   4 | Correctness & tests                | **9** | Deterministic full suite and coverage above every threshold; dead-code ratchets do not grow           |
|   5 | Deploy coherence                   | **9** | Release-only production deploy, clean 93-migration ledgers, rollback path, current evidence           |
|   6 | Ferry pipeline                     | **7** | Reconciliation is green and stale transitions now no-op safely; remote router history remains mixed   |
|   7 | Architecture & boundaries          | **7** | Layering is sound; production dead-code and 4.72% duplication ratchets remain                         |
|   8 | AFRIK data integrity & Source Tier | **8** | Seven of eight checks pass; strict-model adherence is the sole failure                                |
|   9 | Performance & accessibility        | **8** | Required Lighthouse, axe, E2E, mobile smoke, and Web Vitals are present; expanded matrix remains open |
|  10 | Documentation & runbooks           | **8** | Migration and doctrine evidence are current; restore drill date remains overdue                       |

## 5. Strengths

- Recette data sync run `35433706042` proves exact source/database parity and a clean 93-migration
  ledger.
- Production deploy run `35263800150` applied migrations 092–093 and then reported 93 applied with
  no drift.
- `make check` and the production build pass on the remediated checkout.
- Both `recette` and `main` are strict, enforce protection for administrators, require pull
  requests, and require the same nine status contexts.
- All 47 live tables have RLS; deny-all tables are intentional and documented.
- The canonical mobile Lighthouse gate, axe-core, and full E2E are green on the latest completed
  recette revisions.
- Web Vitals are already collected through the consent-aware Sentry path.
- The route-literal charter now scans tracked files only and tolerates staged-but-not-yet-indexed
  deletions (`src/lib/__tests__/routeLiteralCharter.test.ts:144`).
- The fiche globe now preserves an immediate map placeholder while deferring WebGL initialization
  (`src/components/atlas/FicheAtlasGlobeIsland.tsx:39`).
- Global React Query, Typeform preconnect, and unused Sonner code no longer inflate every route.

## 6. Gaps and risks

### Domain 1 — Security posture

- **P2:** Live PostgREST exposed-schema configuration was not read directly. The repository keeps
  policy helpers in the private schema and never exposes the service-role client to the browser.
- **P2:** Six moderate supply-chain advisories remain; there are no high or critical advisories.

### Domain 2 — Secrets hygiene

- **P1 D2-1:** Durable evidence of rotation after the 2026-08-26 recette credential incident was
  not found. Current secrets are supplied through GitHub Actions and Gitleaks is required.

### Domain 3 — CI

- **Resolved:** `recette` and `main` now use strict status checks, enforce administrators, and
  require nine contexts: Gitleaks, build, validation, OpenAPI diff, canonical Lighthouse,
  editorial rules, dependency audit, axe-core, and French 430 px Playwright smoke.
- **Accepted constraint:** Approval count is zero because the repository is currently maintained by
  one person. Pull requests are still mandatory and administrators cannot bypass the gates.
- **P2:** The latest full 29-route Lighthouse job completed red. The last completed canonical gate
  was green; the local remediation still needs its own remote revision.

### Domain 4 — Correctness & tests

- **Resolved:** The coverage race no longer walks arbitrary generated directories. It enumerates
  tracked TypeScript files and ignores tracked paths absent from the checkout
  (`src/lib/__tests__/routeLiteralCharter.test.ts:144-152`).
- **Resolved:** ESLint writes to one cache file scoped to owned `src` and `scripts` inputs
  (`package.json:49`).
- **P2:** Local database integration cases require their documented ephemeral Supabase variables;
  migration replay and VPS parity provide the stronger database evidence.

### Domain 5 — Deploy coherence

- **Resolved:** `docs/runbooks/migration-state.md` now matches both 93-migration ledgers.
- **Resolved:** The earlier recette quota symptom came from a stale developer environment. The VPS
  data-sync workflow completed with exact parity and no structural error.
- **P2:** Sentry and Next.js still emit known middleware/configuration deprecation warnings.

### Domain 6 — Ferry pipeline

- **Remediated locally / validation pending:** Router run `34686519014` failed because a stale
  `IN REVIEW` transition had no branch or open PR to route. The workflow now checks that target
  before minting an app token or starting the agent, records the condition as a successful no-op,
  and keeps API failures red (`scripts/__tests__/ferryRouterWorkflow.test.ts`). The latest ten
  reconciliation runs are green. Router history remains mixed until this workflow revision runs.

### Domain 7 — Architecture & boundaries

- **P1 D7-1:** `corpus.en.ts`, `landmarks.en.ts`, and `entries.en.ts` remain production-unreferenced
  translation sidecars. They are intentionally held back from runtime publication pending human
  review, so deleting them would destroy content work rather than remove accidental code.
- **P1 D7-2:** Production Knip remains at its recorded ceiling: three files and one dependency.
  General analysis remains at seven exports and ten exported types; no new finding was introduced.
- **P1 D7-3:** jscpd remains at 1,107 clones / 14,940 duplicated lines in `src` (4.72%). Repeated
  atlas facets and entity shapes are the principal consolidation opportunities.
- No V1 import survives and API routes preserve the route → handler → service boundary.

### Domain 8 — AFRIK data integrity and Source Tier

- **P1 D8-1:** Strict models pass through a ratchet rather than full conformance: people ceiling
  7,062, families 104, countries 13. This is the one failed check among eight.
- **Debt:** 915 citations retain the admitted transitional `needs_review` marker. The ratchet is
  stable; this state is not a fourth durable tier and is not a P0.
- **P2:** Chronology warnings remain within their ceiling.
- **Resolved:** Database/source parity is no longer N/A. Recette exactly matches all synchronized
  source counts.

### Domain 9 — Performance and accessibility

- **Resolved:** The required four-route Lighthouse gate is green and required on both protected
  branches. Axe-core and full E2E are also green.
- **P1 D9-1:** The latest expanded 29-route run (`35435495874`) exceeded LCP budgets on
  appellations, search, links, and the representative French and English country/people/family
  fiches; the comparator also exceeded its interaction proxy by 5 ms.
- **Remediated locally:** Responsive page spacing now stays in CSS, removing the hydration shift
  that delayed text LCP. Fiche WebGL loads only after the reader activates the interactive map,
  while a static Africa map remains above the fold. Transient anecdote images load lazily
  (`src/components/system/DidYouKnowLoader.tsx:127`); JetBrains Mono no longer preloads
  (`src/app/layout.tsx:40`); global interaction chrome is deferred
  (`src/app/providers.tsx:10-95`); React Query is scoped to its actual consumers
  (`src/components/QueryProvider.tsx:12`).
- **Resolved:** Core Web Vitals are collected through Sentry after consent. The prior report's
  “no RUM” statement was incorrect.

### Domain 10 — Documentation and runbooks

- **Resolved:** Migration evidence is current through 093/v4.12.0.
- **Resolved:** The restore procedure names an operational role rather than an owner placeholder.
- **Resolved:** The audit skill now treats `needs_review` as admitted, ratcheted debt and is
  byte-for-byte synchronized between Claude and Codex.
- **P1 D10-1:** The last recorded restore drill is 2025-07-14 and the next-due date 2025-10-14 is
  overdue. Documentation cannot substitute for executing and recording the drill.

### Hardcoded values (P0/P1)

**P0: none.** Origins, Supabase endpoints, rate limits, request deadlines, and release topology are
environment- or policy-derived.

Grouped **P1** findings:

1. Cache policy literals remain distributed across corpus cache, page revalidation, revision/tree,
   sitemap, and OG paths.
2. Pagination and batch sizes vary between revisions, search, flags, reference-library, and
   Supabase walks.
3. Reporter-contact verification lifetime remains a 24-hour code constant.
4. Sitemap query failures can still degrade individual identifier groups instead of failing the
   build.

Four P1 groups are below the rubric's six-finding penalty threshold.

### Dead code and redundancy

`npm run check:dead` passes with no growth. Production analysis reports the three intentionally
deferred English sidecars and one Tailwind configuration dependency at their recorded ceilings.
General analysis reports seven unused exports and ten exported types, mostly test helpers and UI
barrel primitives. Source duplication remains 4.72%. There are no orphan app routes, unused
production dependencies proven to ship in the browser, or V1 imports.

## 7. Consumer and contributor flow

| Step                | Verdict | Evidence                                               |
| ------------------- | ------- | ------------------------------------------------------ |
| Runtime/install     | PASS    | Node 22, npm 10, and `npm ci` documented               |
| Environment         | PASS    | Tracked, value-free templates and env inventory checks |
| Database/migrations | PASS    | 93/0/0/0 on recette and production                     |
| Seed/source parity  | PASS    | Seven exact source/database count comparisons          |
| First administrator | PASS    | Allowlist bootstrap documented                         |
| Build               | PASS    | Production build generates 46 pages                    |
| Unit and coverage   | PASS    | Full suite and all thresholds green                    |
| API documentation   | PASS    | `/docs/api` and OpenAPI v2                             |
| Admin protection    | PASS    | Session plus moderator authorization                   |

**Clone-to-running verdict: reproducible in one session when the contributor supplies one of the
documented data environments.**

## 8. Security posture

### RLS matrix

The net migration scan finds **47 live tables and 47 RLS-enabled tables**. Zero-policy tables are
intentional deny-all stores. No RLS P0 exists.

| Tables                                                                                                                                            | RLS | Policy posture                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | :-: | --------------------------------------- |
| admin_allowlist, antibot_challenges, flag_reporter_contacts, search_query_log, source_tier_ruling_drafts                                          | Yes | deny-all                                |
| afrik_countries, afrik_dossiers, afrik_language_families, afrik_languages, afrik_media                                                            | Yes | public read                             |
| afrik_patronyme_alliances, afrik_patronyme_bearers, afrik_patronyme_countries, afrik_patronyme_peoples, afrik_patronyme_persons, afrik_patronymes | Yes | public read                             |
| afrik_people_countries, afrik_people_languages, afrik_people_relations, afrik_peoples, afrik_translations                                         | Yes | public read                             |
| api_keys, assertion_references, assertions, audit_log, confidence_scores                                                                          | Yes | owner / controlled / privileged         |
| contributor_profiles, editorial_doctrine, fiche_revisions, flags                                                                                  | Yes | owner / moderator / editor              |
| migration_event_peoples, migration_events, name_records, oral_narrative_links, oral_narratives                                                    | Yes | reader / editor                         |
| person_countries, person_peoples, persons                                                                                                         | Yes | public read                             |
| protected_record_audit, protected_records                                                                                                         | Yes | privileged                              |
| quiz_generation_runs, quiz_questions, revision_drafts, revisions                                                                                  | Yes | controlled / editor                     |
| source_working_assets, sources, user_roles                                                                                                        | Yes | contributor / moderator / owner / admin |

| Control           | Verdict                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Headers/CSP       | PASS — HSTS, nosniff, policies, per-request nonce                             |
| Locale            | PASS — invalid or missing publication mode fails closed to French-only        |
| API keys          | PASS — PBKDF2-SHA256, 600,000 iterations, random salt, constant-time verify   |
| Rate limiting     | PASS — tiered and fail-closed in production                                   |
| CORS              | PASS — explicit origin, methods, headers, and `Vary`                          |
| Service role      | PASS — server-only; browser has no corpus client                              |
| Moderator writes  | PASS — session plus allowlist                                                 |
| Sentry            | PASS — EU ingestion, default PII off, deep scrubber, consent-aware Web Vitals |
| Supply chain      | WARN — six moderate; no high/critical; actions pinned; Gitleaks required      |
| Branch protection | PASS — strict and admin-enforced on both merge paths                          |

## 9. Performance and accessibility posture

| Surface                      | Status | Evidence                                             |
| ---------------------------- | ------ | ---------------------------------------------------- |
| Canonical Lighthouse gate    | PASS   | Latest completed four-route job green and required   |
| Axe-core                     | PASS   | Latest recette run green and required                |
| Full E2E                     | PASS   | Latest run executed tests and completed successfully |
| Mobile smoke                 | PASS   | French 430 px required on both protected branches    |
| Core Web Vitals              | PASS   | Consent-aware Sentry collection                      |
| Expanded 29-route Lighthouse | OPEN   | Latest run red; corrected revision not yet measured  |

The local performance changes preserve mobile-first layout and improve competition for first paint;
they are not presented as a measured remote win until their own CI revision runs.

## 10. AFRIK data integrity and Source Tier compliance

|   # | Required check          | Verdict | Evidence                                                  |
| --: | ----------------------- | :-----: | --------------------------------------------------------- |
|   1 | Strict model adherence  |  FAIL   | Ratcheted drift: people 7,062; families 104; countries 13 |
|   2 | Full validator          |  PASS   | 57/57; zero errors                                        |
|   3 | Referential integrity   |  PASS   | Family/people/language/country/ISO checks green           |
|   4 | Source Tier compliance  |  PASS   | All P0 categories zero; `needs_review` is governed debt   |
|   5 | Database vs source JSON |  PASS   | Exact parity across seven synchronized classes            |
|   6 | CI enforcement          |  PASS   | Data integrity and editorial rules green and required     |
|   7 | Reader-facing register  |  PASS   | Editorial gate reports zero error                         |
|   8 | Known-issue carry-over  |  PASS   | Ratchets and backlogs surfaced without increase           |

| Recette parity class | Source | Database |
| -------------------- | -----: | -------: |
| Language families    |     25 |       25 |
| Languages            |    762 |      762 |
| Peoples              |    774 |      774 |
| People ↔ languages   |  1,187 |    1,187 |
| Countries            |     54 |       54 |
| People ↔ countries   |  1,478 |    1,478 |
| Patronyms            |    793 |      793 |

The Source Tier P0 census remains zero: no untiered source, empty source block, Wikipedia source,
weak promoted source, unmarked AI text, or out-of-vocabulary state was found. The durable vocabulary
is `official | referenced | unverified`; `needs_review` is admitted transitional debt.

## 11. Prioritized actions

| Priority | Finding | Action                                                                                       | Done when                                               |
| -------: | ------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
|        1 | D9-1    | Commit the performance remediation and require its canonical CI; inspect the expanded matrix | Required checks green and 29-route run green            |
|        2 | D10-1   | Execute and record a fresh restore drill                                                     | Restore succeeds, RTO/RPO recorded, next date in future |
|        3 | D8-1    | Reduce strict-model drift without raising ceilings                                           | All three counts trend down                             |
|        4 | D6-1    | Exercise the corrected Ferry router on stale and live transitions                            | Recent router history is consistently green             |
|        5 | D7-3    | Extract repeated atlas facets and shared entity shapes                                       | Duplication falls below the current ratchet             |
|        6 | D8 debt | Adjudicate `needs_review` citations in bounded batches                                       | Ratchet decreases without tier inflation                |
|        7 | D2-1    | Record credential-rotation evidence in the private operational system                        | Rotation date and responsible role verifiable           |

## 12. Conclusion

EthniAfrica now reaches the requested production-readiness band at **8.2/10**. The decisive changes
are not cosmetic scoring adjustments: recette parity is proven, migrations are current, required
checks protect both branches, the full local gate is deterministic, operational doctrine is
aligned, and first-paint work has been removed from the global path.

The release posture is still conditional because local performance and Ferry remediation must earn
their own remote evidence, and the expanded route matrix was not green at the audit cutoff. No
architectural rewrite is required. A green remediation CI run plus a current restore drill would
move the project materially closer to 8.5–9; durable rotation evidence and reduced strict-model
drift are still required for a defensible 9.0.
