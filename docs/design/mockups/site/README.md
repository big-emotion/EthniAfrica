# Site mockups — the reference for every visible change

Fifty-eight boards: a design-system board, sixteen pages at 430, 768 and
1440 px recorded from release v5.2.0 (production, captured on 2026-10-14), and
the approved changes listed under "Changes since the record". They are the reference every change a reader can see
answers to, whoever makes it: the team, an agency, a contractor or an agent.

Source canvas (public, read-only for anyone with the link):
<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>

The order of work is fixed: **the boards change first, the code follows.**
The procedure is in [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md).
An agent implementing a page cannot always open a `claude.ai` link, which is
why the boards also live here, in the repository, next to the code they govern.

## What the boards settle

| Authority                                         | Governs                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| These boards                                      | Pixels: type, colour, spacing, density, layout at 430, 768, 1440  |
| The charters in `docs/design/`                    | Rules: accent scope, empty states, radii, what a click looks like |
| `docs/editorial/doctrine.md` and the corpus       | Words and data: board copy is real copy, never a data contract    |

When the rendered page and a board disagree at one of the three widths, the
board is the reference and the page is the bug, unless the board is being
changed in the same piece of work. When a board contradicts a charter, the
disagreement is raised with the operator before anything is built: one of the
two is wrong, and the fix is decided, not improvised.

## The boards

`<page>-<width>.dc.html`, one file per page and width, in the canvas order.

| Group             | Page                                         | File stem            |
| ----------------- | -------------------------------------------- | -------------------- |
| Design system     | Tokens and components seen on the pages      | `Main`               |
| 1 · Search        | Résultat « peul » (timeline)                 | `search-peul`        |
|                   | Résultat « bassa » (several subjects)        | `search-bassa`       |
|                   | Résultat « congo » (two countries)           | `search-congo`       |
|                   | Résultat d'un nom inconnu                    | `search-unknown`     |
|                   | État mince (« wolof »)                       | `search-state-thin`  |
|                   | État : origines concurrentes (« yamoussoukro ») | `search-state-competing` |
|                   | État : origine non datée (exemple à remplacer) | `search-state-nodate` |
| 2 · Peoples       | `PPL_FULA`                                   | `people-fula`        |
|                   | `PPL_BASSA`                                  | `people-bassa`       |
|                   | `PPL_ALABA`                                  | `people-thin-alaba`  |
| 3 · Fiches        | Langue `lin`                                 | `language-lingala`   |
|                   | État mince : langue `hav` (kihavu)           | `language-thin-havu` |
|                   | `FLG_BANTU`                                  | `family-bantu`       |
|                   | `FLG_MANDE`                                  | `family-mande`       |
|                   | Pays `CIV`                                   | `country-civ`        |
| 4 · Other pages   | Nom `PAT_TRAORE`                             | `name-traore`        |
|                   | Lieu `LOC_YAMOUSSOUKRO`                      | `place-yamoussoukro` |
|                   | Glossaire                                    | `glossary`           |
|                   | À propos                                     | `about`              |
|                   | Accueil                                      | `home`               |

The three files of a page hold the same markup; the width alone changes the
layout, through the same media and container queries the site uses. Long pages
are recorded whole, folded as the site folds them.

## Changes since the record

| Date       | Brief                                                                 | Boards                                                                 |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-10-14 | [Brief 1, the search result page](../briefs/01-result-page-timeline.md) | `search-peul`, `search-bassa`, `search-congo`, `search-unknown`, the three `search-state-*`, `Main` |
| 2026-10-15 | [Brief 2, the people fiche](../briefs/02-people.md) | `people-fula`, `people-bassa`, `people-thin-alaba`, `Main` |
| 2026-10-15 | [Brief 3, the language fiche](../briefs/03-language.md) | `language-lingala`, `language-thin-havu` (new) |
| 2026-10-15 | [Brief 4, the language-family fiche](../briefs/04-language-family.md) | `family-bantu`, `family-mande` |

The boards of a changed page no longer record v5.2.0: they are the approved
target, and the code is behind them until the implementation lands.

## How a board is built

- `ea-live.css` is the one stylesheet every board links. Its first part is a
  verbatim copy of thirteen stylesheets from `src/styles/` (the tokens, the
  shell, the site chrome, the search feed, the timeline, the parchment, the
  chapter bar). Its second part, after the `EthniAfrica record layer` banner,
  rebuilds what the site writes in styled-jsx and Tailwind utilities, from the
  computed styles of the captured pages.
- `src/styles/__tests__/siteMockupCharter.test.ts` holds the first part to the
  code: a stylesheet changed in `src/styles/` without the same change here
  fails `make check`. Update the boards first, then the code.
- `assets/` holds the two images the chrome uses: the EthniAfrica mark
  (`public/africa.png`) and the BIG EMOTION credit (`public/brand/big-emotion.svg`).
- `canvas.json` is the canvas index as the editor saved it: board positions,
  sizes and the four group titles.

## Opening a board

A browser ignores `<x-dc>` and the `text/x-dc` script and renders the board.
Serve the repository root over HTTP and open, for example,
`/docs/design/mockups/site/people-fula-430.dc.html`. Give the window the
board's width (430, 768 or 1440 px): the layout follows the viewport, exactly
as on the site. Fonts load from Google Fonts. The `support.js` request fails
outside the canvas and changes nothing.

## Choices made while recording

Where a capture could not settle a value, the board records a choice. Each
was reported when the boards were drawn, and each is a place to look first if
a board and the live page seem to disagree.

- Section and family rules use the computed accent colour; some captures show
  them grey mid-animation.
- The chapter bar is drawn in the state it was captured in.
- Text the extraction cut short was read from the screenshots: family 03 of the
  glossary, the end of « Émique / étique », the Traore origins and sources.
  Letters such as ɔ and ɛ in the Traore sources follow the capture as closely
  as it could be read.
- The header shows its four entry pills from 1200 px, as the site does; the
  sticky header that captures stitch mid-page is drawn at the top.
- Home: the hero copy widths (576 and 593 px), the seed pills' padding and the
  submit button's weight are measured values, not tokens.
