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
