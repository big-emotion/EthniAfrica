# Name-page mockup briefs — one per type of name

Written 2026-10-14. Status: **proposed — awaiting operator review.**

These briefs are what the operator pastes into Claude Design to change the
reference board of each type of name, inside the site canvas. Once the boards
are approved they are recorded in `docs/design/mockups/site/` and become the
reference the code answers to. Until then nothing here binds the code.

## Why these briefs exist

The 2026-10-14 review of the atlas found that the pages had no complete
reference. That gap is now closed by the **site canvas**, "EthniAfrica, relevé
des pages en production" (<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>):
49 boards recording the site as shipped in v5.2.0, a design-system board
(`Main`) and sixteen pages at 430, 768 and 1440 px. Its copy in the repository
is `docs/design/mockups/site/` (pull request #1744, branch
`docs/site-mockups-reference`), and the procedure is
`docs/design/mockup-first-workflow.md`. Read both, and `CLAUDE.md`, before
using a brief.

The briefs below are therefore **not drawings from scratch**. Each one says
which existing boards to change, what is already on them, and what to add.
The older mockups (`../search-answer/`, `../search-feed/`, `../pages/`) are
superseded history for these pages.

The audience audit of 2026-10-13 shows what the new pages must fix: dead ends
after a long read (`pays/CIV`, `FLG_MANDE`, `PPL_MUCUVAL`), early exits
(`PPL_ZARMA`, `PAT_DIALLO`), and a result page whose bounce rose from 8 % to
34 % while its only click event is not wired to the timeline.

## The briefs

| # | Brief | Type | Boards to change (stem, each at `-430`, `-768`, `-1440`) |
| --- | --- | --- | --- |
| 1 | [`01-result-page-timeline.md`](01-result-page-timeline.md) | Search result page with the timeline lens | `search-peul`, `search-bassa`, `search-congo`, `search-unknown` (**approved 2026-10-14**) |
| 2 | [`02-people.md`](02-people.md) | People | `people-fula`, `people-bassa`, `people-thin-alaba` (**approved 2026-10-15**) |
| 3 | [`03-language.md`](03-language.md) | Language | `language-lingala`, `language-thin-havu` (**approved 2026-10-15**) |
| 4 | [`04-language-family.md`](04-language-family.md) | Language family | `family-bantu`, `family-mande` (**approved 2026-10-15**) |
| 5 | [`05-country.md`](05-country.md) | Country | `country-civ`, `country-state-civ-quaqua`, `country-state-thin-gab`, `country-state-shared-congo` (**approved 2026-10-15**) |
| 6 | [`06-family-name.md`](06-family-name.md) | Family name | `name-traore`, with the link to the name's story of brief 10; new state boards `name-state-thin-kollo` and `name-state-weak-sarr` (**approved 2026-10-18 by the operator**, eight decisions in the brief's approval record; recording pending). Prompt: [`claude-design-prompt-06.md`](claude-design-prompt-06.md) |
| 7 | [`07-place.md`](07-place.md) | Place | `place-yamoussoukro` |
| 8 | [`08-free-word.md`](08-free-word.md) | Free word | **new page**, three new boards (`word-race-430`, `-768`, `-1440`); `glossary` untouched |
| 9 | [`09-our-approach.md`](09-our-approach.md) | Project page « Notre démarche » (not a type of name) | **new page**, three new boards (`approach-430`, `-768`, `-1440`); one link on `about`; footer state B on `Main` and every board (**approved 2026-10-16**). Prompt: [`claude-design-prompt-09.md`](claude-design-prompt-09.md) |
| 10 | [`10-fiche-story-link-and-folds.md`](10-fiche-story-link-and-folds.md) | Pass 1, the fiche boards: the link to the name's story, folded chapters | `people-fula`, `people-bassa`, `people-thin-alaba`, `language-lingala`, `language-thin-havu`, `family-bantu`, `family-mande`, `country-civ`, `country-state-civ-quaqua`, `country-state-thin-gab`, `country-state-shared-congo`, `Main` (**approved 2026-10-17 by delegation**, see the brief's approval record). Prompt: [`claude-design-prompt-10.md`](claude-design-prompt-10.md) |
| 11 | [`11-result-page-self-name-handoff.md`](11-result-page-self-name-handoff.md) | Pass 2, the search result page: hand-off to the self-name, one video, labelled sources | `search-peul`, `search-bassa`, `search-congo`, `search-state-competing`, `search-state-thin`, `language-lingala`, `country-civ`, `country-state-civ-quaqua`, `Main` (**approved 2026-10-17 by delegation**, see the brief's approval record). Prompt: [`claude-design-prompt-11.md`](claude-design-prompt-11.md) |
| 12 | [`12-unknown-name-fiches-lens-consent.md`](12-unknown-name-fiches-lens-consent.md) | Pass 3: the unknown name, the « Fiches » lens, the consent strip | `search-unknown`; three new boards (`search-state-fiches-430`, `-768`, `-1440`); `Main` (**approved 2026-10-17 by delegation**, see the brief's approval record). Prompt: [`claude-design-prompt-12.md`](claude-design-prompt-12.md) |

Briefs 10 to 12 are the three board passes the operator approved on
2026-10-17, one per family of pages, drawn in that order: each pass starts
once the previous one is approved and recorded, because they share `Main` and
`ea-live.css`. Brief 6 is pasted inside pass 1, after brief 10.

| # | Brief | Surface | Boards |
| --- | --- | --- | --- |
| 13 | [`13-search-entry.md`](13-search-entry.md) | Pass 4: one search component, the header search full screen on mobile, the search page | `Main`; three new boards (`search-entry-430`, `-768`, `-1440`) (**scope approved 2026-10-18**, boards not drawn). Prompt: [`claude-design-prompt-13.md`](claude-design-prompt-13.md) |
| 14 | [`14-atlas-names-page.md`](14-atlas-names-page.md) | Pass 5: the Atlas page becomes « Les noms d'Afrique » | three new boards (`atlas-names-430`, `-768`, `-1440`) (**scope approved 2026-10-18**, boards not drawn). Prompt: [`claude-design-prompt-14.md`](claude-design-prompt-14.md) |
| 15 | [`15-result-page-shorter.md`](15-result-page-shorter.md) | Pass 6: the result page tells each account once and opens shorter | `search-peul`, `search-bassa`, `search-congo`, the `search-state-*` boards with a timeline; new `search-state-long-traore-*`; `Main` (**scope approved 2026-10-18**, boards not drawn). Prompt: [`claude-design-prompt-15.md`](claude-design-prompt-15.md) |

Briefs 13 to 15 come from the operator's mobile review of 2026-10-18 and its
five decisions. They are drawn in that order, after brief 6, one at a time.

Dossiers (`DOS_*`) are an editorial type, not a type of name. They carry the
operator's thesis in full and get their own brief once the thesis wording is
settled (see "The thesis slot").

## Rules every board obeys

Taken from `docs/editorial/doctrine.md` and the result-page charter; a board
that breaks one is rejected.

1. **Mobile first.** Draw 430 px, then tablet (768 px), then desktop
   (1280 px). A board that says something different at another width is a
   different board. Night variants are derived by token substitution after the
   day board is final, never redrawn.
2. **French only, plain register.** Copy follows
   `docs/editorial/reader-facing-register.md`: connected everyday French,
   African spellings and quotations kept. Use the real sentences quoted in
   each brief; invent nothing.
3. **Tokens, not literals.** Colours, type and spacing come from the brand
   charter and `src/styles/tokens/`.
4. **A source shows its type, never its tier.** Oral tradition, book, article,
   archive, report: who speaks, not how far to trust them. No gate, badge or
   ordering ranks the griot below the linguist.
5. **No name is crowned.** Competing origins stand side by side, unranked, in a
   neutral order, each with its own sources. The searched name leads where the
   reader searched; the self-name leads everywhere else, and the page leads
   visibly from one to the other.
6. **A block never renders to say it is empty.** Silences are gathered in one
   closing block, one per line, declared and never blank.
7. **The page ends in movement III**: silences, one conviction sentence, an
   invitation to correct, then a next step.

## The spine all eight share

The briefs differ in content, not in order. This is the sequence proposed on
2026-10-14; each brief says which blocks are conditional for its type.

| Order | Block | Job |
| --- | --- | --- |
| 1 | **Verdict** | One sentence answering "where does this name come from", with the self-name lead when it differs from the searched form. |
| 2 | **Who named whom** | One name at a time (chips). For each: who gave it, to whom, when, why. This is the timeline of `name-history-timeline-2026-10-08.md`. |
| 3 | **The sources speak** | The same claims regrouped by source type, so the reader sees that a name comes from several voices and, often, from outside. New block: it is what makes the plurality of sources visible. |
| 4 | **Type-specific block** | Where it lives: map, spellings, borders, etymology of the word. Optional per type. |
| 5 | **Silences** | What the atlas does not say, gathered. |
| 6 | **Conviction + thesis slot** | One sentence from the doctrine, then the reserved thesis line. |
| 7 | **Invitation to correct** | On every page, rich or poor. |
| 8 | **Next step: a name** | One or two related **names**, not a list of fiches. This answers the measured dead ends. |

### Depth, not a fixed length

Page length follows the subject. `PPL_FULA` carries about 81 KB of name history
(eight names, up to thirteen accounts for one); the median people fiche is far
thinner. Each board therefore draws both a **rich** and a **thin** state, and
the rich state uses progressive disclosure: summary first, accounts folded per
name, sources one tap away. A thin page keeps its measure and its closing band
(charter, `Ekpeye`).

### The oral voice: draw its absence

Only 18 of roughly 8,000 source entries in the people fiches are typed
`oral_tradition` (e.g. `PPL_BASSA`, `PPL_MERINA`, `PAT_NGONGE`). The doctrine
puts oral tradition on an equal footing, so block 3 must show the oral voice
when it exists, and show **honestly** when it does not: a declared silence in
block 5 ("aucun récit transmis oralement n'est enregistré pour ce nom"), not an
empty column. Each brief asks for both states.

## The thesis slot

The operator's thesis is that Africa is diverse and equal to its society
(wording to be settled: "égale à sa société" is not yet a publishable
sentence). It must live **visibly on the About page and in dossiers, and
discreetly on fiches.**

This conflicts with `doctrine.md` §1.1 ("the site never affirms") and with the
rule that a page's only promise is its verdict. Until the doctrine is amended:

- every board reserves one discreet line in the closing band, after the
  conviction sentence, set smaller than the conviction and visually distinct
  from it, marked `[THÈSE — texte à fixer]`;
- no board places the thesis in the verdict, in a name's account, or in a
  source block;
- no board may state the thesis as a sourced fact. The ethical line is fixed:
  a claim the sources cannot carry is never written, and rhetoric never
  graduates into a sourced claim.

## How a brief is used: the mockups-first workflow

The five steps are those of `docs/design/mockup-first-workflow.md`; this is how
the briefs plug into them.

1. **Change the boards** in the site canvas, at 430 px first, then 768, then
   1440. The brief names the boards. A change to a token or a shared component
   is made on `Main` and on every page board it appears on. Keep the real
   French copy; text that is illustrative is marked as such.
2. **Reread the whole canvas before submitting.** Every board links the same
   `project/ea-live.css`; a change for one page can break another. Check that
   all 49 boards still hold.
3. **Wait for the operator's approval.** Nothing is implemented without it.
4. **Record the approved boards** by copying `project/*.dc.html`,
   `canvas.json`, `ea-live.css` and `assets/` into
   `docs/design/mockups/site/`. When the change touches `src/styles/`, update
   the verbatim part of `ea-live.css` in the same commit
   (`src/styles/__tests__/siteMockupCharter.test.ts` fails `make check`
   otherwise).
5. **Implement to the boards and compare** at 430, 768 and 1440 before merging.
   Where the code cannot reproduce a board, stop and raise it.

Do not create a second folder of mockups. `docs/design/mockups/name-pages/`,
proposed in an earlier draft of this file, is withdrawn.

### Choices made while recording the canvas

The canvas README lists places where a capture could not settle a value: accent
rules, the chapter bar's captured state, a few copied texts (glossary, Traore
origins and sources) and some home measurements. A brief that touches one of
those boards checks them first.
