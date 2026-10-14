# Name-page mockup briefs — one per type of name

Written 2026-10-14. Status: **proposed — awaiting operator review.**

These briefs are what the operator pastes into Claude Design to draw the
reference page of each type of name. Once a board is validated it is saved
next to its brief (same convention as `../search-answer/`: static `.dc.html`,
a README with provenance and date) and becomes the reference the code answers
to. Until then nothing here binds the code.

## Why these briefs exist

The 2026-10-14 review of the atlas found that the pages have no complete
reference. What exists:

| Surface | Reference today | Gap |
| --- | --- | --- |
| Search result page | `../search-answer/` (v11) and `../search-feed/` (40 boards) | Both predate the timeline lens. The timeline exists only alone, in `docs/editorial/strategy/name-history-timeline-mockup-v4.html` and `-v5.html`. |
| People, language family, country | `../pages/peuple.html`, `famille.html`, `pays.html` | Drawn for the globe, before the §3 bis grammar of `docs/design/search-result-charter.md`. |
| Language, family name, place, free word, dossier | none | Never drawn. |

The audience audit of 2026-10-13 shows what the new pages must fix: dead ends
after a long read (`pays/CIV`, `FLG_MANDE`, `PPL_MUCUVAL`), early exits
(`PPL_ZARMA`, `PAT_DIALLO`), and a result page whose bounce rose from 8 % to
34 % while its only click event is not wired to the timeline.

## The briefs

| # | Brief | Type | Real subject drawn |
| --- | --- | --- | --- |
| 1 | [`01-result-page-timeline.md`](01-result-page-timeline.md) | Search result page with the timeline lens | `peul` |
| 2 | [`02-people.md`](02-people.md) | People | `PPL_FULA`, `PPL_BASSA` |
| 3 | [`03-language.md`](03-language.md) | Language | `lin` |
| 4 | [`04-language-family.md`](04-language-family.md) | Language family | `FLG_BANTU` |
| 5 | [`05-country.md`](05-country.md) | Country | `CIV` |
| 6 | [`06-family-name.md`](06-family-name.md) | Family name | `PAT_TRAORE` |
| 7 | [`07-place.md`](07-place.md) | Place | `LOC_YAMOUSSOUKRO` |
| 8 | [`08-free-word.md`](08-free-word.md) | Free word | `WRD_RACE` |

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

## Saving a validated board

1. Export from Claude Design as static `.dc.html` into
   `docs/design/mockups/name-pages/<type>/` (create it with the first board).
2. Add a README beside it: date, version, public URL (provenance only), which
   brief it answers, what the operator decided.
3. Link it from `docs/design/README.md` and run `npm run docs:index`.
4. Only then does a code ticket (Jira `ETNI`) cite it as the reference.
