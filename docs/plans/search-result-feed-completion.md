# Search-result feed — finishing phases 11 and 12

Date: 2026-09-20. Continues
[`search-result-feed-correction-plan.md`](search-result-feed-correction-plan.md),
which sequences the work in thirteen phases (0 through 12) and whose phases 0 to
10 shipped in PR #1188 (`codex/search-feed-implementation`, draft).

This file exists because the implementing session stopped inside phase 11 when
its credits ran out, and because the remaining distance was never measured. It
is measured here, so the work left is a list rather than an estimate.

## 1. Where the work actually stands

Measured on the PR head `54d790b00`, CI run 35470185186 (2026-09-19).

| Gate                           | State                                                             |
| ------------------------------ | ----------------------------------------------------------------- |
| Structure, API, components     | green — phases 0 to 10 complete, 64 test files                    |
| Responsive geometry (phase 10) | green — 30/30 across ten widths, day and night, with axe          |
| Harness self-proof (phase 2)   | green — 2/2: it fails on a one-pixel mutation and on a dead font  |
| **Forty-board parity**         | **0/40** — 36 stop at the text assertion, 2 reach the pixel stage |
| `build`                        | red — `check:dead`: production files 4 > 3, types 13 > 10         |
| `claude-review`                | red after 25 s — runner failure, not a verdict                    |
| Phase 12                       | not started — no file deleted anywhere on the branch              |

**The headline number is misleading.** Only two comparisons ever reached the
pixel diff (`mande mobile-day` 2.7994 %, `mande mobile-night` 2.8371 %, ceiling
1 %). The other thirty-eight fail earlier, on text, and the text differences
reduce to ten causes — listed in §3 and each worth a small patch.

Work in progress from that session is preserved on `codex/search-feed-parity`
(commit `12057a811`): a `.search-feed-reviewed` scope rounding three fluid type
roles, plus a dozen micro-corrections. It typechecks, lints and keeps the 138
feed unit tests green; its three Prettier failures were fixed on preservation.
Two of its decisions are deliberately left open — §4.

## 1a. Update — 2026-09-20, second session

Measured on `codex/search-feed-parity` after commit `12057a811` (the preserved
WIP) plus two new fixes, both TDD'd and unit-tested:

- **`ProseBlock`** (not `OriginsBlock` — that one already mounted
  `SearchFeedEvidenceAction` correctly) was missing the "Voir la source" link
  entirely on its `standing`-without-`evidence` branch. This is what cause #1
  actually is for the `problem` prose block (`Ce que ces noms posent
problème`): `OriginsBlock`'s origin cards already had the link since the
  preserved commit; `ProseBlock`'s never did. Fixed to match `OriginsBlock`'s
  pattern exactly (`href="#sources"`, same classes).
- **`OwedBlock`** rendered `silence.detail` as a raw string instead of through
  `InlineMarkup`, so a fixture detail carrying `<sup>e</sup>` (e.g. "XIX
  siècle") printed the literal tag text instead of a superscript. Not
  previously catalogued as one of the ten causes — found by running the actual
  `fang mobile-day` case and reading the real diff rather than trusting the
  table below, which the board fixture text had already drifted past by the
  time this was written.

Full 40-board run after both fixes: **2/40 passing** (up from 0/40), one
`console_error`-free full pass, 1.2 minutes. Confirmed via
`npm run e2e:search-feed-parity` with no `--grep` filter.

**Cause #6-10 (the chip tag) is architecturally deeper than this table says.**
Tracing "Fang · leur nom" vs the rendered "le nom qu'ils se donnent" through
`AppellationsBlock` → `resultForms()` (`SearchFeed.tsx`) → `subject.naming`
shows the filed-name self-given chip is synthesized in `resultForms()` with
`qualifier: undefined` hardcoded, and the generic fallback text
(`copy.selfGivenMark`) is what renders. Shortening that copy string to "leur
nom" would fix cause #6 alone (confirmed against both `Fang.dc.html` and
`FangDesktop.dc.html` — same short text on both widths, not a mobile/desktop
split). **But cause #7 (Ekpeye: "leur nom, et celui de tous") is a
case-specific string, not the shortened default** — confirmed in
`Ekpeye.dc.html`. Since the case fixtures (`feedCases.ts`) reference real
corpus entity IDs (`PPL_EKPEYE`, `PAT_TRAORE`, …) rather than carrying literal
board copy, this text has to come from the corpus itself through
`readNaming`/`naming.ts` — the same projection the people fiches read — not
from a fixture literal or a `SearchFeed.tsx` tweak. That makes causes 6-10 a
single, corpus-facing plumbing change (a `tag` on `NamingPresentationForm`,
sourced from the appellation's own qualifier when the corpus has one,
falling back to the shortened default only when it doesn't), not four small
component patches. It needs its own investigation pass per case
(`ekpeye`, `traore`, `nigeria`, `introuvable`) against the real recette data
before touching `naming.ts`, because that module also feeds the people fiche
naming tiles — a change here is not scoped to search.

## 1b. Update — 2026-09-20, third session (causes 3, 4, 5)

Fixed all three, TDD'd and unit-tested, each confirmed against the real board
HTML (not the stale table) before patching:

- **Cause #3 (`ShortsBlock` empty slot).** The board never renders a leading
  subject-name label at all — confirmed in both `Bassa.dc.html` and
  `Ekpeye.dc.html`: the dashed card's three flex children are the question
  (uppercase, bold, `text-afh-small`), the body, and the action link, nothing
  else. The component's `<p>{emptySlot.name}</p>` was dropped, and the
  question paragraph now carries the classes the `name` paragraph used to
  (uppercase/bold/`text-afh-small`, plus the board's own declared
  `leading-[var(--afh-leading-small)]` / `leading-[var(--afh-leading-caption)]`
  on the two lines). `emptySlot.name` stays in the type and is still
  constructed in `SearchFeed.tsx` — nothing else reads it yet, but removing it
  from the interface is a separate, unforced decision.
- **Cause #4 (`FactsBlock` invented lead).** `SearchFeed.tsx` always fell back
  to `copy.blocks.atlasHoldsSummary` when `presentation.facts.subtitle` was
  unset. Ekpeye is the only fixture case using the `atlas-holds` block, and its
  board has no subtitle line under the heading at all. Fixed by dropping the
  fallback — `subtitle` is now `presentation?.facts?.subtitle` and nothing
  else. `atlasHoldsSummary` is now an orphaned copy key (only that one call
  site read it); left in place rather than deleted in the same change, since
  copy-dictionary cleanup is phase 12's job, not phase 11's.
- **Cause #5 (`PlatesBlock` duplicated proverb).** `ReviewedPlate`'s proverb
  branch rendered `item.meaning` unconditionally. The Peul proverb's `meaning`
  field equals its `text` field verbatim in the fixture (a corpus-side
  duplication, not something to special-case by ID), so the paragraph now only
  renders when `item.meaning && item.meaning !== item.text`.

**Verification, and one still-open residual.** Unit suite: 347/347 (was 345).
Re-running the real cases: `peul mobile-day` and `ekpeye mobile-day` now pass
the **text** assertion entirely — `peul` fails only on a 1.3 px root-height
pixel diff (pure convergence work, §3 below), and `ekpeye` fails only on the
appellations chip tag (causes 6-10, §1a). `bassa mobile-day` also passes text,
but its root height is off by **13.5 px**, reproduced identically before and
after adding the board's own declared line-heights to the empty-slot
paragraphs (so it is not a line-height issue). The empty-slot question wraps
to three lines in the live render (confirmed by screenshot); whether the board
also wraps to three lines at a tighter line-height, or wraps to two and
something else in the row accounts for 13.5 px, was not resolved — chasing it
further needs a real per-block geometry dump, and two attempts at scripting
one against the live harness both hung on environment/port contention rather
than producing a measurement. Left as a named residual for the pixel-
convergence pass (§3) rather than guessed at further.

## 1c. Update — 2026-09-20, fourth session (causes 6-10, resolved as one fix)

**The plan's own diagnosis for causes 6-10 was wrong in a specific, checkable
way, and the correction collapses all five into a single component fix with no
new corpus plumbing.**

Tracing `presentationFor()` in `feedCases.ts` (the function that turns
`feedBoardCases.json` — itself a direct, unedited export of `cases.py`'s
`CASES`, via `export_fixture_cases.py` — into the `SearchFeedPresentation`
every board-driven page actually renders) shows `authoring.forms` is mapped
straight into `presentation.appellations.forms[].qualifier`. Checking every
`forms=[...]` tuple in `cases.py` confirms **every "own"/"you"/"bad"-marked
chip in every one of the ten cases already carries a real qualifier string**:
Fang → `"leur nom"`, Ekpeye → `"leur nom, et celui de tous"`, Traoré's Tarawele
→ `"la forme mandingue"`, Nigeria → `"votre recherche · 1914"`, the Mandinka
typo lead → `"le nom que se donnent les Mandé de Gambie"`. This is real,
already-flowing production data — not illustrative board-only flourish, which
was the wrong turn §1a took investigating cause #7 in isolation.

The bug was in `AppellationsBlock`'s `FormsList`: each marker
(`searched`/`selfGiven`/`problematic`) rendered a **fixed** copy string on
every width, and a _separate_, desktop-only span showed `item.qualifier` —
so on mobile the qualifier was always thrown away, and on desktop it was
shown as a redundant second line next to the fixed string rather than
replacing it. Fixed by a `markedTags()` helper: each marker now resolves to
`item.qualifier ?? <its generic default>`, rendered identically at every
width; the old desktop-only qualifier span survives only for the unmarked
case (an ordinary qualifier with no marker at all, e.g. "Mandingue · français
colonial" — that one is still deliberately desktop-only, matching every board
that has one). A card can legitimately carry more than one marker at once
(the pre-existing test for a `searched` + `selfGiven` + `problematic` form in
the same chip governs this), so `markedTags` returns a list rather than the
first match — collapsing to one was tried first and broke that test for a
reason worth keeping: real board data never combines markers, but the
component's contract shouldn't quietly assume that.

No copy string needed changing — `copy.selfGivenMark` ("le nom qu'ils se
donnent") is never reached by any of the ten fixture cases any more, since
every self-given chip now has a qualifier. It stays as the true fallback for
whenever the corpus genuinely gives none.

**Verified against real board diffs, not reasoning.** Re-running `fang`,
`ekpeye`, `traore`, `nigeria` and `introuvable` at `mobile-day` after the fix:
all five now pass the **text** assertion completely — zero diff in the block
text array. Every one of them now fails only at the pixel-geometry stage
(1.3 px to 5.3 px root-height mismatches), which is exactly the state the
plan's §3 describes as "then the pixels." Full 40-board run: still 2/40 pass
outright (a board only passes when _both_ stages clear), but **all forty now
reach the pixel stage** — the phase-11 text-cause work (§3's ten-item table)
is complete. Unit suite: 348/348, typecheck clean.

## 1d. Update — 2026-09-20, fifth session (phase 12 recon, and what it changed)

With phase 11's text causes closed, this pass measured phase 12 directly
rather than working from the original plan's checklist, and two of its six
items turned out to already be done or safe to finish now; the rest turned
out to gate on a single decision the plan hadn't flagged.

**Done in this pass:**

- **Item 6 (harness artifact retention)** was already satisfied —
  `.github/workflows/e2e.yml`'s `search-feed-visual-proof` upload is already
  `if: failure()` with `retention-days: 7`. No change needed; the plan's
  concern predates whichever commit added those two lines.
- **Item 3 (a11y route coverage)** is done: `scripts/a11yRoutes.ts` now audits
  `?q=mandé` (exact match, real corpus data) and `?q=kossiwa` (unknown name)
  in both locales, alongside the bare search route's empty state.
  `qualityGateRoutes.test.ts`'s hand-written per-locale count moved 16 → 18
  in the same change, per its own documented convention. Full repo suite
  re-run clean at 1329 → confirmed again at 10005 passing after this addition
  (two pre-existing failures found in the same run are unrelated — next
  bullet).

**Found, not fixed — out of this plan's scope:**

- **`check:dead` is red for reasons mostly unrelated to search.** Of the four
  files over the three-file ceiling, three (`src/lib/games/corpus.en.ts`,
  `landmarks.en.ts`, `src/lib/glossaire/entries.en.ts`) are orphaned
  English-locale content in an unrelated subsystem, pre-dating this plan
  entirely. The fourth, `src/lib/search/__fixtures__/feedCases.ts`, is not
  actually dead — it's the fixture every test this session has run against —
  it only shows up because knip's `--production` mode doesn't treat
  `e2e/**/*.ts` as live entry points the way the non-production check does,
  so a file reachable only from e2e specs reads as unreferenced. Fixing this
  cleanly is a `knip.json` entry-pattern change, not a deletion; the
  types-ceiling overage (13 > 10) is a separate question that depends on
  which of `NameAnswer`'s now-orphaned exports get deleted alongside it (next
  bullet) — so both ceiling numbers should be re-measured together, once,
  after that deletion, rather than chased separately now.
- **`src/lib/__tests__/routeLiteralCharter.test.ts` has two pre-existing
  failures** (`e2e/support/search-feed-fixture.ts:219`'s hardcoded
  `` `/fr/atlas/recherche?q=...` ``, and a literal href in
  `SearchFeed.test.tsx:140`), confirmed via `git log` to predate this plan's
  work entirely (last touched in `54d790b00` and its ancestor, both from the
  original phase 0-10 implementation). Not introduced by anything in this
  document's four update sessions. Left alone rather than patched blind: the
  fixture harness is exactly the thing every measurement in §1a-§1c depended
  on being correct, and this plan's remit is search-feed parity, not a
  general route-literal sweep.
- **Item 5 (mockups doc cleanup) cannot be done independently of item 1.**
  `docs/design/mockups/search/README.md` — the _old_, six-case mockup grid —
  still describes itself as backing an actively-enforced gate
  (`resultGrammarCharter.test.ts`), and that's still true: `NameAnswer` is
  still the page real users hit whenever the reviewed feed isn't shown, so
  its own charter and mockups are still load-bearing, not legacy. Annotating
  that README with "why it stays" before `NameAnswer` is actually deleted
  would be writing a false reason.

**Item 1 (deleting `NameAnswer`) is the one this plan most wants done and the
one this session declined to attempt**, for a reason worth stating plainly
rather than leaving implicit: `RecherchePageContent.tsx` mounts both
`NameAnswer` (guarded by `status === "idle" || (status === "loaded" &&
results.length > 0)`) and `SearchFeed` (guarded by `status === "loaded" &&
companions && feedState`) in the same render, on overlapping conditions —
both can be true at once, and untangling exactly when only reveals itself by
loading the real page. This is the one piece of phase 12 that changes what a
real visitor sees on the production search page, as opposed to a mockup or a
test fixture, and CLAUDE.md's own instruction for UI changes is to render the
page and look before calling it done. Every other fix in this document's four
sessions was verified against a real Playwright render; this one specifically
needs that same discipline, and this session's browser tooling proved
unreliable within its own smaller, sandboxed harness (§1b's bassa
investigation — two scripted debug runs hung on port/process contention
before either produced a measurement). Attempting the live-page version of
that same class of problem, with no fallback if a hang obscures a real
regression on the production route, was judged the wrong trade this session.
It is next, and it is now the _only_ item left before phase 12's exit gate is
reachable — items 2 through 6 either follow from it directly (§5) or are
already done (this section).

**And it turned out not to be simple cleanup once traced.** The two mount
guards above aren't two renderings of the same thing with one stale — they're
two different search _modes_. `rel` (a `SearchRelation`, read from the
`?family=`/`?country=` URL params `relationSearch.ts` defines) short-circuits
the fetch in `RecherchePageContent.tsx`'s search effect
(`if (rel) { setStatus("loaded"); return; }`, _before_ `companions`/
`feedState` are ever set), so a relation-scoped search — "the peoples of the
Krou family," reached by clicking a family or country chip on a result card —
can only ever satisfy `NameAnswer`'s mount guard, never `SearchFeed`'s.
`classifySearchFeed` has no relation-search case at all.

The chip that starts that search is `buildRelationSearchHref`
(`relationSearch.ts`), called from `SearchResultCard.tsx` — which `SearchFeed`
itself renders (`PeopleBlock`/`TilesBlock` results are `SearchResultCard`s).
So **the reviewed feed already produces links into the mode only the old page
can serve**: click a family or country chip inside a board-matching
`SearchFeed` render today, and the destination is `NameAnswer`, not another
`SearchFeed` render. Deleting `NameAnswer` without first giving
`classifySearchFeed`/`SearchFeed` a relation-search state doesn't retire a
duplicate — it breaks relation search outright, taking a chip `SearchFeed`
itself draws down with it. That's a scoped implementation task (a new
`SearchFeedAnswerState` case, presumably its own board or an agreed variant
of an existing one, its own text-parity pass), not a deletion, and it belongs
in its own ticket rather than folded silently into "phase 12 cleanup" — the
name undersells what's actually left.

## 2. The rule that decides every remaining fix

`docs/design/search-result-charter.md`, as PR #1188 rewrote it, gives three
authorities:

- the forty boards govern **visual rendering**;
- the generated manifest and the charter govern **structure and behaviour**;
- typed projections and API schemas govern **production data** — illustrative
  board copy never becomes a runtime contract.

And: _"When a board's markup disagrees with the manifest, the manifest wins and
the board is regenerated without an intentional pixel change."_

So for each divergence, in this order: does the manifest or the charter settle
it? If yes, fix the side that disagrees. If it is purely visual, the board wins
and the code moves. A board is regenerated only when its markup — not its
pixels — is what is wrong, and the regeneration states that it changes no
intended pixel.

## 3. Phase 11 — the ten text causes, then the pixels

Each item: the count of failing comparisons it blocks, what the board expects,
what the page renders, and the fix. **Write the failing unit test first** in the
block's own test file; the harness is the second gate, not the first.

| #   | Cases | Board expects                                                       | Page renders                                                | Fix                                                                                                                        |
| --- | ----- | ------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | 18    | `Référencée Voir la source` on every origin card                    | the badge alone                                             | render the evidence action in `OriginsBlock`; it exists (`SearchFeedEvidenceAction`) but is not mounted on the card footer |
| 2   | 8     | `Il en manque une ? Proposer une source →` closing origins          | nothing                                                     | mount the contribution action at the foot of `OriginsBlock` (desktop cases fail first)                                     |
| 3   | 4     | the empty short slot opens on the question                          | the subject name precedes it (`Bassa`, `Ekpeye`, `Kossiwa`) | drop the leading subject label in `ShortsBlock`'s empty slot, or move it into the poster's `aria-label`                    |
| 4   | 4     | Ekpeye: `Famille … Région … Pays … Sources`                         | an invented lead sentence                                   | `FactsBlock` must not print a lead the boards and the charter do not have                                                  |
| 5   | 4     | Peul: the proverb once                                              | the French text repeated after the original                 | `PlatesBlock` renders `meaning` even when it equals the quoted text; the Peul proverb has no `meaning`                     |
| 6   | 2     | `Fang · leur nom`                                                   | `le nom qu'ils se donnent`                                  | one copy key in `searchFeed.ts`: the self-given chip tag                                                                   |
| 7   | 2     | `Ekpeye · leur nom, et celui de tous`                               | `le nom qu'ils se donnent`                                  | same key, case-specific variant — check the fixture carries the board's tag                                                |
| 8   | 2     | `Traoré · Tarawele — la forme mandingue`                            | `le nom qu'ils se donnent`                                  | the tag must come from the form's own qualifier, not from the self-given default                                           |
| 9   | 2     | Nigeria: `votre recherche · 1914`                                   | `votre recherche`                                           | the searched-chip tag drops the date suffix the fixture carries                                                            |
| 10  | 2     | Introuvable: `Mandinka — le nom que se donnent les Mandé de Gambie` | `votre recherche`                                           | the typo variant must keep each lead's own tag rather than mark the first as searched                                      |

Order: 1, 2, then 3 to 5, then the four tag causes (6 to 10) together — they are
one projection decision: **a chip tag is the form's own qualifier; the
self-given default applies only when the corpus gives none**.

After each batch: `npx vitest run src/components/search src/lib/search`, then
`npm run e2e:search-feed-parity -- --grep "<case> mobile-day"`. Only when the
text assertion passes for all ten cases is the pixel stage meaningful.

### Then the pixels

The session that stopped had diagnosed three causes and fixed none of them to
green:

1. **The fluid type roles.** The boards carry the size computed at the reference
   width; the page computes it from a `clamp()` whose base term is rounded to
   three decimals, so they differ by about three thousandths of a pixel.
   The preserved commit answers this by overriding `--afh-text-hero/-h3/-body`
   inside a `.search-feed-reviewed` scope. **Prefer the other direction**:
   regenerate the boards with the full-precision value the clamp actually
   produces (`generator/gen.py`, `role()`), which changes no intended pixel, and
   delete the override. A second type scale in a scope is exactly what the
   typography charter exists to prevent.
2. **An inner line of the anecdote cards inherits too large a line-height.** Fix
   it on the card, not with a blanket `leading-[normal]` — that was measured
   removing 1.20 px where the whole gap was 0.16 px.
3. **Residual borders and spacing.** Measure per block with the geometry
   assertion the harness already prints before the diff; never chase these with
   a global nudge.

Exit gate, unchanged: **40/40 under the 1 % ceiling**, with structure and
geometry green before the diff, and the failure diffs attached to the PR.

## 4. Two open decisions inside the preserved work

Neither is a bug; both are choices that must be made explicitly before the PR
leaves draft.

- **The type-role override** (`src/styles/search-feed.css`). Keep only if
  regenerating the boards at full precision is refused; then it needs a charter
  line, because it puts a second definition of three roles in the codebase.
- **The non-breaking space injected into a lens label** to buy 4 px of spacing.
  It enters that button's accessible name. Replace it with spacing on the count
  element, or with a board regeneration if the board is what is wrong.

Two smaller ones to settle in passing: the play glyph's `top-[44%]` magic number
(name it as a token or restore true centring and move the board), and
`VerdictBlock`'s switch from `--accent` to `--accent-ink` on the verdict rule,
which is currently unconditional and therefore also changes the non-reviewed
rendering.

## 5. Phase 12 — cleanup, documentation, release gates

Nothing here has started. `git diff --diff-filter=D origin/recette...HEAD`
returns nothing: the old implementation is still standing beside the new one.

**Tests first**

- Rewrite `e2e/search-results-consolidation.spec.ts` on the feed's own
  `data-feed-block` / `data-testid` contract **before** deleting the selectors it
  asserts (`search-pivot`, `dominant-answer-panel-wrapper`,
  `search-results-main`).
- Add the dead-code assertion that would catch a retired component surviving.

**Work**

1. Remove the superseded result page: `NameAnswer` and the components only it
   used, their tests, and any copy key left orphaned in `nameAnswerCopy`.
2. Lower `DEAD_CODE_CEILINGS` in the same change (it is a two-way ratchet: a
   count **below** the ceiling fails too). Today the branch is above it —
   production files 4 > 3, types 13 > 10 — so the two are one task: delete what
   is dead, then set the ceiling to the measured number.
3. Extend `scripts/a11yRoutes.ts` with `?q=mandé` and `?q=kossiwa` in both
   locales (the plan's §10.5, unmet: axe runs today only inside the responsive
   spec, on four of the ten cases).
4. Add the Storybook stories the original plan required
   (`src/stories/search-feed/`), one per block plus the ten fixtures day and
   night — `axe-core (Storybook)` passes today only because it has nothing new
   to look at.
5. Update `docs/design/search-result-data-shape.md`, the documentation index and
   requirement traceability; keep `docs/design/mockups/search/` only with the
   README line that says why it stays.
6. Guard the harness job's artifact: the failing run uploaded **264 MB**. Keep
   it on failure only, with a retention limit.

**Exit gate**

```bash
make check
npm run lint:req
npm run check:dead
npm run check:copy-literals -- --base origin/recette
npm run check:translation-parity -- --base origin/recette
npm run check:orphan-docs
npm run e2e:search-feed-responsive
npm run e2e:search-feed-parity
```

plus the repository's own pre-commit and secret scan.

## 6. Sequencing

| Lot | Content                                         | Ends when                                    |
| --- | ----------------------------------------------- | -------------------------------------------- |
| A   | Text causes 1 and 2 (26 comparisons)            | those cases reach the pixel stage            |
| B   | Text causes 3 to 5                              | idem                                         |
| C   | The four tag causes, as one projection rule     | all ten cases pass structure and text        |
| D   | Pixel convergence, boards regenerated if needed | 40/40 under 1 %                              |
| E   | The four open decisions of §4                   | each is either in a charter line or gone     |
| F   | Phase 12                                        | the exit gate above, and the PR leaves draft |

Lots A to C are independent of each other and can be done in any order; D needs
all of them; F needs D only for the E2E rewrite to assert the final contract.

## 7. What this plan does not decide

The shorts shelf ships with an **empty production catalog**
(`DISCOVERY_VIDEOS = []`), so in production every case renders the « pas encore
de short » slot. Filling it, and whether a short plays in place or links out, is
not parity work: it is the subject of
[`embedded-media-brief.md`](embedded-media-brief.md) and
[`production-history-brief.md`](production-history-brief.md).
