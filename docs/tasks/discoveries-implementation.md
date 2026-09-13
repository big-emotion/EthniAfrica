# Découvertes implementation tracker

This is an execution checklist, not a requirements, decisions, or architecture specification. Confluence remains canonical. The approved handoff is at `discoveries-handoff` outside this repository; its immutable fragments remain the visual reference.

Baseline: `recette` at `7cade04866cf9e2e526c48bffeff390ed48c2b7e`, clean before worktree creation. Isolated branch: `codex/discoveries-implementation`. Package verification: 40 hashes and 30 links passed. The proposed destination route is absent (P00 red check). Existing Anecdotes page and reader tests: 27/27 passed with `NODE_OPTIONS=--no-experimental-webstorage`; without it, 13 tests fail because Node 25's experimental `window.localStorage` has no `clear()` method. The repository pins Node 22 in `.nvmrc` and `package.json`; this shell runs Node 25.

The local preview file could not be opened in the browser because the browser URL security policy blocked it. The reference HTML/CSS and supplied rendered-state captures were inspected mobile first, then desktop. Interactive reference behavior remains unverified here; do not claim browser-level reference parity from the captures.

The additional transmission guide and next-session prompt supplied later in the conversation were read. Their top-level and nested copies are byte-identical, and their ZIP contains those two documents. The guide's recovery notice says the older visual package was missing when it was written; that claim is superseded by the verified package now present. The guide contributes no new authorization or independent visual baseline.

Each phase requires a recorded failing check before implementation and passing evidence afterward. Unchecked means incomplete.

- [ ] **P00 traceability:** Reconcile existing canonical pages and Jira tickets; obtain feature-specific IDs and links. Publish only after the spec workflow's draft preview and affirmative response. Record full baseline.
- [ ] **P01 content:** Audit every shared fact for source, entity, bilingual text, image and rights; verify the configured social library; curate only sourced and cleared proverbs/carousels. Red inventory checks before edits.
- [ ] **P02 contracts:** Red tests for stable identities, localized slugs, draft exclusion and deterministic finite deck; then green domain model.
- [ ] **P03 routes:** Red SSR, invalid-route, locale and nav checks; then green standalone destination while retaining `?a=` Anecdotes links.
- [ ] **P04 mobile frame:** Red composition checks at 320, 390 and 430 px; then green photo frame, credits, contrast, touch targets and short-screen behavior.
- [ ] **P05 reader:** Red vertical/horizontal/URL/history checks; then green settled browsing, position and finite continuation.
- [ ] **P06 details:** Red source/entity/focus checks; then green accessible sheets and valid atlas links.
- [ ] **P07 keeping:** Red persistence/corruption/unavailable-storage/cross-tab checks; then green save and retrieval on mobile and desktop.
- [ ] **P08 sharing/metadata:** Red exact-link, capability, crawler metadata and locale checks; then green ten truthful choices and publication-specific previews.
- [ ] **P09 exports:** Red asset/rights/dimension/order checks; then only expose verified still exports. A missing approved master is an explicit content dependency.
- [ ] **P10 responsive/a11y:** Red tablet, desktop, zoom, contrast and edge-state checks; then green adaptive layouts and reviewed new baselines.
- [ ] **P11 closure:** Run applicable gates, build and browser journeys; attach A01–A24 evidence, measured visual deltas, performance and regression results; prepare a reviewable PR and rollback notes. Production release remains separate.

## P00 findings and constraints

- Current Confluence search did not reveal a dedicated Découvertes requirement or decision. Existing cross-cutting requirements include REQ-004, REQ-007/008, REQ-064–069, REQ-098, REQ-104/105, REQ-140/141/145; none alone specifies the new feed. REQ-113 governs the home entry, so it must not be copied onto new feature tests.
- The canonical tree currently reaches REQ-155 and DEC-050. Two architecture child pages are both titled `ARCH-021`; no new architecture ID should be assumed from the title alone.
- Current canonical REQ-140/141 still describes English-default publication, while active AGENTS.md and CLAUDE.md require French-only fail-closed. Preserve the active launch mode and flag the drift in the spec preview.
- The shell does not export `ETHNIAFRICA_SOCIAL_PROJECTS` or `ETHNIAFRICA_SOCIAL_POSTS`, but the project's social path resolver loads both from `.env.local`. Both configured roots exist. The finished library contains 28 entries under `Publie`, including 12 carousel image sets; folder placement alone does not prove launch eligibility. See the separate social inventory. The demonstration carousel has not been imported.
- The frozen reference uses a centered watermark. The owner's later bottom-right correction is approved and may be deferred explicitly; the reference must remain unchanged.

## P01 inventory baseline (read-only red check)

- A 67-row record-by-record audit is in `docs/tasks/discoveries-content-inventory.md`. It is provisional, not a production publication manifest or editorial approval.
- The shared bank contains 67 facts, with all 67 English counterparts and all 67 illustration/English-alt entries. Six older facts have no `sources` array: `monrovia`, `bantou`, `cote-ivoire`, `amazigh`, `lingala`, `personne-relationnelle`. Their nominal tier is not a citation.
- The illustrations comprise 34 photographs and 33 own-drawn plates. All 34 local photo files exist. A plate does not satisfy the approved full-photo presentation; those facts remain in Anecdotes but are not automatically feed-eligible.
- Twenty-four first-batch photographs have no `filePage`; twenty-six photos have no `licenceUrl` (including public-domain files for which a licence URI may not be required). This is a rights-metadata remediation inventory, not permission to invent URLs.
- The packaged Burkina Faso and Ghana photo hashes exactly match the existing files in `public/images/anecdotes/`. The reference assets therefore need no duplicate import.
- The current social-post roots are unset. The three-slide Burkina Faso carousel remains a reference fixture, not a production publication.
- The verified Burkina Faso Commons original was absent from shared image metadata. A direct metadata check failed before adding its file-page link, then passed; 33 relevant bank/illustration tests passed. This resolves one provenance gap, not the wider rights review.
- The configured social library is accessible. Some entries filed under `Publie` themselves say they are not publishable or lack approved titles. Existing `cards.json` files use French text and do not declare English counterparts. No carousel is eligible for the bilingual destination without editorial mapping, translation and rights review.
- Atlassian Confluence/Jira access returned 401/403 after the spec preview was approved, and the same connector still returned 401 after the owner requested a retry. Canonical publication and issue creation have not occurred; the proposed IDs remain unassigned.
- The existing four bank/illustration test files pass 39/39 checks, including corpus entity validity and localized counterpart coverage. The verified [Boston University Ghana list](https://www.bu.edu/africa/outreach/teachingresources/countries/gp/) gives the English proverb and Ghana collection context, but no original language; the French rendering and editorial approval must not be inferred from that page alone. The Burkina image's [Commons file page](https://commons.wikimedia.org/wiki/File:Mittelholzer-ouagadougou.jpg) confirms the photographer, historical date and Public Domain Mark. The supplied Ghana Commons address did not resolve during this audit, so its live file-page/license verification remains open.
- Baseline gates: `lint:req` passes with 0 warnings; `check:local-paths` passes; the full translation-parity survey exits 0 with 821 findings and 873 declared deferrals across 1,718 records. These are pre-existing survey results, not new-feature parity evidence.

## Evidence register

| Phase | Red evidence                                                                                                                         | Green evidence                                                                                                                          | Captures / limitations                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| P00   | Destination route absent; direct unconfigured Node 25 run fails 13 storage tests                                                     | Manifest verified; Anecdotes tests 27/27 with Node experimental web storage disabled; `lint:req` and local-path gate pass               | Handoff mobile and desktop captures reviewed; local preview opening blocked by browser policy |
| P01   | Six uncited fact records; 24 photo file-page gaps; 26 photo license-URL gaps; social roots unset; Burkina original link check failed | Burkina original link check passed; three relevant test files 33/33; earlier bank/illustration tests 39/39; all 34 local photos present | Package photos hash-match existing files; Ghana live Commons page verification remains open   |
