# Search-result feed — correction and implementation sequencing plan

Status: approved course correction — REQ-180, DEC-058, ETNI-1966  
Scope: correction of `docs/plans/search-result-feed.md`; no reduction of the
approved product scope  
Rendering reference: `docs/design/mockups/search-feed/`  
Target route: `/[locale]/atlas/recherche`

## 1. Purpose

A reader arrives with a name and leaves with a direct, sourced account of what
the atlas knows about that name, what it does not know, and where to continue.

The original plan remains the product brief. This document repairs the places
where its structural, data, responsive and visual-testing contracts disagree
with the forty approved boards or with the current application. The goal is to
make the full original scope implementable without an agent inventing missing
behaviour.

The correction is a **direct adjustment**, not a rollback and not an MVP scope
reduction. The visual composition, ten cases, two reference widths, two themes,
source transparency, companion content and forty pixel comparisons all remain
in scope.

## 2. Why a correction is required

Implementation must not begin until the following conflicts are closed:

1. The plan defines `lenses`, `shared-name`, `silences`, `conviction` and
   `invitation` as top-level blocks, while the generated boards omit the first,
   call the Bassa shared-name block `problem`, and combine the last three under
   `owed`.
2. Desktop boards group a primary column and a secondary rail in the DOM, so
   their flat DOM order cannot equal the mobile canonical order.
3. The plan says `hideHeader` removes the trail, while `PageLayout` requires
   `hideTrail` separately; its mobile padding also differs from the planned
   frame.
4. The pixel-test example compares a default browser context with the mobile
   Playwright project, whose device pixel ratio is 2.625, and does not wait for
   every image to decode.
5. The proposed companions response exposes one global widening ring even
   though each shelf, and sometimes each item, can come from a different ring.
6. Source IDs alone cannot open `SourceChainSheet`, `FlagTarget` cannot select
   `contribution`, and the existing quiz component does not render the approved
   embedded treatment.
7. The plan proves 430 and 1280 px but does not protect 320–429 px, tablet, or
   the 1199/1200 breakpoint.
8. The plan asks the page to translate curator-facing prose without defining a
   deterministic, reviewable presentation projection.

## 3. Sources of truth

The corrected implementation uses three non-overlapping authorities:

| Concern                 | Authority                                        | Rule                                                                                             |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Visual rendering        | the forty `.dc.html` boards                      | Type, colour, spacing, density, media, day/night and reference-width geometry follow the boards. |
| Structure and behaviour | a generated board manifest plus the feed charter | Block identity, condition, state and expected placement follow the manifest and charter.         |
| Production data         | typed application projections and API schemas    | The UI never infers a contract from illustrative board copy.                                     |

Amend the mockup README from “the boards win” to the narrower rule above. A
board may be regenerated to correct semantic markup or test hooks without
changing a rendered pixel. Any intentional visual change still requires an
operator decision and regenerated baselines.

## 4. Corrected structural contract

### 4.1 Top-level feed blocks

The top-level contract is:

```ts
export const FEED_BLOCKS = [
  "lenses",
  "verdict",
  "appellations",
  "shorts",
  "origins",
  "peoples",
  "shared-name",
  "tiles",
  "atlas-holds",
  "plates",
  "quiz",
  "images",
  "problem",
  "near-name",
  "fiches",
  "owed",
  "further",
] as const;
```

`owed` is one top-level block because it is one visual and rhetorical closing.
It contains up to three ordered parts:

```ts
export const OWED_PARTS = ["silences", "conviction", "invitation"] as const;
```

The wrapper carries `data-feed-block="owed"`. Its children carry
`data-feed-part`. This keeps the approved composition and still makes each
obligation independently testable.

### 4.2 Corrected conditions

- `lenses`: present after an answered query whenever at least one filterable
  content group exists.
- `verdict`: present for exact, widened, typo and unknown states.
- `appellations`: present for at least one form, several matching subjects, or
  typo leads.
- `shorts`: present for every answered query under the widening rules; an empty
  source slot is content, not an empty block.
- `shared-name`: present only when at least two unrelated subjects answer to the
  searched form. Bassa uses this ID, never `problem`.
- `problem`: present only for a recorded naming problem or disagreement.
- `owed`: present for a resolved subject and for a genuinely unknown query. It
  is absent from a typo-only state that already offers usable leads.
- `silences`: present inside `owed` only when at least one concrete silence can
  be derived. A resolved subject without a dated form contributes the dated
  attestation silence. Unknown queries do not invent this silence.
- `conviction` and `invitation`: both present whenever `owed` is present.
- `further`: present for typo and unknown states.

This makes the approved exceptional states explicit:

| Case                                   | Closing                                               |
| -------------------------------------- | ----------------------------------------------------- |
| Exact or widened subject               | `owed`, with declared silences where applicable       |
| Typo with useful leads (`Introuvable`) | `further` only                                        |
| Unknown query (`Inconnu`)              | `owed` with conviction and invitation, then `further` |

### 4.3 Mobile and desktop reading order

There is no single flat DOM-order assertion across both layouts.

- Below 1200 px, movement II is one column and its top-level blocks follow
  `FEED_BLOCKS` order.
- At 1200 px and above, movement II contains a `primary` column and a
  `secondary` rail. Each column follows the canonical subset recorded in the
  generated manifest. Assistive-technology order is primary column, then
  secondary rail.
- Movement I remains before both columns.
- `owed` and `further` remain full-width after both columns.

The structural test compares placement and order within the correct container;
it does not flatten the desktop grid into a sequence the boards do not have.

### 4.4 Generated manifest

`generator/build.py` must emit a checked-in `manifest.json` beside the boards.
For each of the forty variants it records:

- case and variant;
- query and result state;
- top-level block IDs in DOM order;
- block zone: `first`, `primary`, `secondary`, or `closing`;
- `owed` parts;
- board width, theme and measured height;
- first-poster bounding box when a poster exists.

`cases.py` and the generator remain the authoring source. The manifest is
generated output, never edited by hand. A generator test rebuilds it and fails
on a diff.

## 5. Corrected interaction contract

### 5.1 Lenses

Lenses filter content in place, so they are buttons, not destination links.
They use `aria-pressed`, retain a 44 px target and keep the selected treatment.

On narrow screens the row uses touch- and keyboard-accessible horizontal
scrolling with a hidden visual scrollbar. It must never use inaccessible
`overflow: hidden`. Filtering does not mutate the query or refetch the naming
answer. A later deep-link requirement may add a URL parameter, but it is not
invented in this feature.

### 5.2 Contribution actions

Extend the report flow deliberately:

- add `contribution` to the client `FlagKind` union;
- add an optional `preferredKind` to `FlagTarget` and `FlagForm`;
- preserve the existing derived kind when `preferredKind` is absent;
- use `correction-proposal` for form-level corrections;
- use `contribution` for empty media slots and unknown-name invitations.

A resolved subject targets its entity ID and an explicit field path. An unknown
query targets a documented `search-query` target with the normalised query as
its ID. The API schema must validate both rather than accepting a UI-only
fiction.

### 5.3 Embedded quiz

Add an explicit embedded presentation mode to the existing quiz primitives.
It keeps their question, selection and reveal logic but renders the approved
search-feed geometry: one-column options at the reference mobile width and no
separate validate button when selection itself submits. The normal game route
must retain its existing visual and behavioural contract in its default mode.

## 6. Corrected presentation-data contract

### 6.1 Naming projection

Extend the naming projection with structured, presentation-safe facts rather
than asking the client to reinterpret arbitrary prose:

- form, qualifier and whether it is self-given;
- origin claim and current usage when explicitly recorded;
- problematic or pejorative status only from an explicit corpus field;
- attestation or era where the class supports it;
- claim status and evidence references;
- disagreement as structured positions, not a prose heuristic.

The search page never runs an automatic rewrite over curator prose. It uses
deterministic templates from `searchFeedCopy` over structured facts. If a
reader-safe projection cannot be made, the block is omitted and the missing
knowledge is declared in `silences`. Tests reject the glossary words forbidden
by the search-result charter in both fixture and live projections.

### 6.2 Evidence

Every sourced presentation item carries enough information to build the
existing source UI:

```ts
interface SearchEvidence {
  assertion: Assertion;
  sources: Source[];
  standing: SourceStanding;
}
```

An internal normalised source index may be used to avoid duplicating full
objects on the wire, but the public schema and the UI adapter must be specified
together. A bare `sourceIds` array is not an accepted completed contract.

### 6.3 Companions

Widening provenance belongs to each returned item:

```ts
type CompanionRelation =
  "exact" | "linked-family" | "linked-people" | "linked-country" | "recent";

interface CompanionMatch {
  relation: CompanionRelation;
  entityType: SearchSubjectType;
  entityId: string;
}
```

Every short, anecdote, proverb, image and quiz question carries
`CompanionMatch`. Localised relation labels are produced by `searchFeedCopy`,
not returned by the API.

The endpoint contract must additionally settle before implementation:

- exact fields for every companion item;
- maximum 20 unique subject IDs per request;
- stable exact-first ordering and documented tie-breakers;
- item limits and total counts;
- duplicate elimination across rings;
- unsupported or unknown IDs;
- empty success versus validation error versus service failure;
- locale validation;
- cache and invalidation behaviour;
- OpenAPI examples for exact, widened, sparse and empty responses.

## 7. Corrected page-frame contract

When a query is committed:

- pass both `hideHeader` and `hideTrail` to `PageLayout`;
- preserve the 61 px site masthead;
- put `data-feed-root` on the inner search-page shell;
- make the 32 px mobile top offset explicit on the search page rather than
  depending on `PageLayout`'s current 16 px mobile default;
- preserve relation mode (`?country=`) without the feed;
- keep the global footer outside visual comparison.

Unit tests assert the prop combination and class contract. Geometry tests
assert the resulting offsets, so a future `PageLayout` refactor cannot move the
feed silently.

## 8. Corrected visual-validation contract

### 8.1 Viewport matrix

The forty pixel comparisons remain exactly:

- 10 cases;
- 430 and 1280 px;
- day and night.

Responsive geometry adds non-baseline widths:

- mobile: 320, 375, 430 and 767 px;
- tablet: 768, 1024 and 1199 px;
- desktop boundary and review: 1200, 1280 and 1440 px.

The full first poster must remain inside the first 800 px at the two approved
reference widths. At all other widths, tests protect reachability, no
horizontal page overflow, no clipped controls and correct breakpoint
selection; they do not invent a pixel baseline that has no approved board.

The final art-direction review uses screen-height slices at 430, 720 and 1440
px, in that order.

### 8.2 Deterministic screenshot harness

Create a dedicated Playwright project for search-feed parity. Both expected and
actual captures must use:

- the same browser engine and colour profile;
- `scale: "css"`;
- the same viewport and reduced-motion setting;
- local, version-pinned font files;
- routed, byte-identical image files;
- `document.fonts.ready`;
- explicit decoding of every image under the capture root;
- disabled animations and transitions;
- a stable locale, timezone and theme bootstrap.

Do not rely on the base Pixel 5 device-scale factor for one side and a default
context for the other. Do not depend on a live Google Fonts request.

The 1% whole-image ceiling remains as the final anti-aliasing allowance, but it
is not the only assertion. Before the pixel comparison, require:

- exact screenshot width and height;
- exact block presence and text;
- exact poster dimensions;
- exact feed-root geometry;
- per-block bounding boxes within 1 CSS pixel;
- no unexpected image decode or network failures.

This prevents a localised missing rule, control or badge from hiding inside a
large full-feed pixel budget.

## 9. Corrected implementation order

Every phase follows red → green → refactor. Each phase is independently
reviewable and leaves the standard local gates green. Do not start a later
phase while an exit gate from an earlier phase is open.

### Phase 0 — Governance and requirement IDs

**Tests first**

- Add a temporary failing traceability assertion for the new feed requirement.

**Work**

- Run `ethniafrica-spec` or have the operator create the Pending feed REQ and
  the DEC that replaces the old three-movement first-screen contract.
- Reconcile the night search-feed surface with the brand charter explicitly;
  do not introduce an undocumented exception.
- Amend the search-result charter with the authorities and corrected block
  grammar in this document.
- Record the real IDs in the requirement catalog and replace every placeholder.

**Exit gate**

- Valid REQ and DEC IDs exist; `npm run lint:req` passes; no implementation
  test contains `REQ-<placeholder>`.

### Phase 1 — Boards, semantic markup and generated manifest

**Tests first**

- Generator test for 10 cases × 4 variants.
- Manifest-schema test.
- Structural tests for zones, top-level IDs, `owed` parts and case conditions.
- Regeneration-diff test.

**Work**

- Add `data-feed-block="lenses"`.
- Map Bassa to `shared-name`.
- Keep `owed` as one block and mark its parts.
- Replace lens anchors with visually identical buttons and accessible overflow.
- Emit `manifest.json` and regenerate all boards without intentional pixel
  changes.
- Update the mockup README's authority wording.

**Exit gate**

- All forty boards match the manifest; generated files are clean after a second
  build; day/night variants have identical structure.

### Phase 2 — Visual-harness proof

**Tests first**

- Unit tests for the fixture router and readiness helper.
- A one-case Mande mobile-day smoke comparison that deliberately fails for a
  one-pixel geometry mutation.
- Tests proving device-scale equality and complete image decoding.

**Work**

- Add the dedicated Playwright project and shared capture helper.
- Serve boards and fonts locally.
- Route posters and editorial images to committed bytes.

**Exit gate**

- The single-case harness passes repeatedly and its deliberate mutation fails
  for the expected reason. Do not build forty comparisons on an unproved
  harness.

### Phase 3 — Design tokens and frame prerequisites

**Tests first**

- Token contract tests for media badges and accent foregrounds in both themes.
- `PageLayout` composition tests for `hideHeader` plus `hideTrail`.
- Search-root padding and accent-wrapper tests.

**Work**

- Add only the missing semantic tokens.
- Establish the search-page frame and explicit top spacing.
- Add no component-specific literal colour, radius or font size.

**Exit gate**

- Token contrast passes; the empty committed-query frame matches the board
  root at 430 and 1280 px.

### Phase 4 — Naming and evidence projection

**Tests first**

- Tests for people, family, language, country and patronym shapes.
- Per-form order, origin, usage, problematic status, eras and disagreement.
- Source resolution into complete `SearchEvidence`.
- Forbidden-reader-vocabulary tests.

**Work**

- Extend `readNaming` and the search service with one batched name-record load.
- Introduce the presentation-safe projection and source adapter.
- Reuse `NameAnswer` only if it becomes part of the feed; otherwise retire it
  here rather than repairing code scheduled for deletion.

**Exit gate**

- All five subject classes produce deterministic reader-facing data without
  parsing qualifiers from free text or inventing pejorative status.

### Phase 5 — Companion catalogs and relation resolution

**Tests first**

- Exact and ring-1 resolution tests for all five subject classes.
- Attested-proverb, generated-image eligibility and source-tier tests.
- Stable ordering, de-duplication and item-level relation tests.
- Scoped Discovery deck tests that prove the existing deck is unchanged.

**Work**

- Add the video/short catalog model required by the approved posters.
- Add typed helpers for shorts, anecdotes, proverbs, images and quiz.
- Add scoped Discovery selection as a separately reviewable prerequisite inside
  this phase; do not couple its UI to the search page.

**Exit gate**

- Each companion item explains its own relationship to the searched subject;
  existing Discovery behaviour remains green.

### Phase 6 — Companions API

**Tests first**

- Schema, handler, service and route tests.
- Validation boundaries, locale, duplicate IDs, empty result, failure and cache
  tests.
- OpenAPI contract snapshot.

**Work**

- Implement the four API layers and the item-level relation contract.
- Keep static banks server-side.
- Return codes and facts, never localised UI labels.

**Exit gate**

- The endpoint is documented, bounded, cached and consumable without UI-side
  data inference.

### Phase 7 — Ten-case fixture matrix

**Tests first**

- Schema validation for all ten fixtures.
- Fixture-to-manifest structure and count tests.
- French/English copy-key parity tests.

**Work**

- Encode the exact illustrative content used by the boards.
- Separate production projections from test-only titles, durations and counts.
- Add stable poster and editorial-image routing metadata.

**Exit gate**

- Every board string and count has one fixture source; fixtures cannot enter a
  production bundle.

### Phase 8 — Presentational components

**Tests first**

- One focused test file per block.
- Semantic heading, keyboard, 44 px action and empty-slot tests.
- Lens scrolling/filtering, `FlagTarget` preferred kind and embedded-quiz mode.
- Source-sheet adapter tests with real evidence shapes.

**Work**

- Build stateless feed blocks from the corrected contracts.
- Use semantic tokens and existing primitives.
- Keep mobile one-column defaults; add desktop placement only through explicit
  1200 px classes.

**Exit gate**

- Components reproduce fixture structure and accessibility semantics without a
  page-level orchestrator.

### Phase 9 — Page orchestration and states

**Tests first**

- Ten ordered case tests against the manifest.
- Loading, failed, retry, exact, widened, typo and unknown states.
- Query submission and clearing.
- Relation-mode regression test.
- Stale-request and aborted-fetch tests.

**Work**

- Compose `SearchFeed` in `RecherchePageContent`.
- Fetch companions after subject resolution, once per committed query.
- Apply `hideHeader`, `hideTrail`, the corrected shell and explicit top spacing.
- Replace the old highlight and lead presentation only after their new
  counterparts are green.

**Exit gate**

- Every state has deterministic content; failures never show substitute
  shelves; relation mode is unchanged.

### Phase 10 — Responsive geometry and accessibility

**Tests first**

- Geometry at every width in §8.1.
- First-poster reference-width budget.
- Lens and shelf reachability, no page-level horizontal scroll.
- Desktop zone placement and thin-page measure.
- Axe in day and night for representative rich, sparse, typo and unknown cases.

**Work**

- Correct responsive defects only; introduce no new feature at wider widths.
- Verify the entire composition in screen-height slices at 430, 720 and 1440.

**Exit gate**

- Mobile, tablet and desktop boundary tests pass; the art-direction review finds
  one readable rhythm and one alignment per block.

### Phase 11 — Forty-case parity matrix

**Tests first**

- Expand the proven Phase 2 harness to every manifest entry.

**Work**

- Fix components and fixtures until all comparisons pass; do not update a board
  to hide an implementation difference.
- Attach failure diffs during review.

**Exit gate**

- 40/40 exact-size comparisons pass under the 1% ceiling and all pre-pixel
  structure and geometry assertions pass.

### Phase 12 — Cleanup, documentation and release gates

**Tests first**

- Rewrite the stale search-results E2E before deleting its old selectors.
- Add dead-code assertions where a retired component could survive silently.

**Work**

- Remove `RESULT_BLOCKS`, superseded tests, unused imports and retired result
  components.
- Update the search-result charter, OpenAPI, documentation index and requirement
  traceability.
- Keep historical mockups only where their README states why they remain.

**Exit gate**

- `make check`
- `npm run lint:req`
- `npm run check:dead`
- `npm run check:translation-parity -- --base origin/recette`
- the dedicated search-feed E2E and parity projects
- documentation index/orphan check
- secret scan and pre-commit checks

## 10. Original-to-corrected phase mapping

| Original phase             | Corrected destination                            |
| -------------------------- | ------------------------------------------------ |
| 0 — Spec and contract      | 0–1                                              |
| 1 — Naming read            | 4                                                |
| 2 — Per-form naming        | 4                                                |
| 3 — Companion helpers      | 5                                                |
| 4 — Discovery/video work   | 5 as an isolated prerequisite                    |
| 5 — Fixtures               | 7                                                |
| 6 — Components             | 8                                                |
| 7 — Tokens                 | 3, before components                             |
| 8 — Composition and states | 9                                                |
| 9 — Parity                 | 2, 10 and 11                                     |
| 10 — Cleanup               | 12, with stale E2E rewritten earlier when needed |

## 11. Risk and handoff

Classification: **moderate course correction**. The product goal and approved
rendering do not change, but contracts across documentation, API, data
projection, flags, quiz, responsive layout and Playwright must be resequenced.

Primary risks and controls:

| Risk                                                        | Control                                                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| A board and code pass pixels while disagreeing semantically | Generated manifest and semantic tests before screenshots             |
| Visual harness produces false failures                      | Prove one deterministic comparison in Phase 2                        |
| Visual harness hides a local regression inside 1%           | Exact geometry and per-block assertions before pixel diff            |
| Curator prose leaks into reader copy                        | Structured presentation projection and forbidden-word tests          |
| Widened content appears exact                               | Item-level relation metadata                                         |
| Desktop implementation changes mobile                       | Mobile defaults plus explicit 1200 px widening                       |
| Adjacent Discovery work expands the blast radius            | Isolated prerequisite with regression tests and its own review point |

The implementation owner may work phase by phase after operator approval. The
operator is needed at Phase 0 for requirement and decision records and again
after Phase 10 for the rendered art-direction review. No other phase should
require product decisions if this correction is accepted.

## 12. Definition of done

The corrected initial plan is fully implemented only when:

- all ten cases work with production-shaped data;
- exact, widened, typo, unknown, loading and failure states are covered;
- the page is usable from 320 px through desktop and respects the 1200 px
  layout breakpoint;
- all source and contribution actions open with the correct context;
- every widened companion states its actual relationship;
- French and English copy contracts are complete while publication remains
  governed by `SITE_LOCALE_MODE`;
- all forty approved reference comparisons pass;
- the original route's relation mode has no regression;
- the old search-result implementation is removed rather than left dormant;
- all repository, traceability, accessibility, documentation and security gates
  pass.
