# Site mockups — the reference for every visible change

Ninety-seven boards: a design-system board, the pages recorded at 430, 768 and
1440 px from release v5.2.0 (production, captured on 2026-10-14), and the
approved changes listed under "Changes since the record". They are the reference every change a reader can see
answers to, whoever makes it: the team, an agency, a contractor or an agent.
The three `search-state-typo` boards and the brief 16 section of `Main`
are proposed, not approved yet: until the operator approves them they are not
a reference.

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
|                   | État : onglet Fiches (« peul »)              | `search-state-fiches` |
|                   | État mince (« wolof »)                       | `search-state-thin`  |
|                   | État : origines concurrentes (« yamoussoukro ») | `search-state-competing` |
|                   | État : origine non datée (exemple à remplacer) | `search-state-nodate` |
|                   | État : « peul », le nom propre Fulɓe ouvert   | `search-state-peul-fulbe-open` |
|                   | Page de recherche (sans requête)             | `search-entry`       |
|                   | État : « tchikaya », un nom qui s’écrit presque de la même façon (proposé) | `search-state-typo` |
| 2 · Peoples       | `PPL_FULA`                                   | `people-fula`        |
|                   | `PPL_BASSA`                                  | `people-bassa`       |
|                   | `PPL_ALABA`                                  | `people-thin-alaba`  |
|                   | État : chapitre déplié, « Culture et société » de `PPL_FULA` | `people-state-fula-culture-open` |
| 3 · Fiches        | Langue `lin`                                 | `language-lingala`   |
|                   | État mince : langue `hav` (kihavu)           | `language-thin-havu` |
|                   | `FLG_BANTU`                                  | `family-bantu`       |
|                   | `FLG_MANDE`                                  | `family-mande`       |
|                   | Pays `CIV`                                   | `country-civ`        |
|                   | État : explications de Côte de Quaqua        | `country-state-civ-quaqua` |
|                   | État : liste dépliée, les 47 noms attestés en Côte d'Ivoire | `country-state-civ-names-open` |
|                   | État mince : pays `GAB`                      | `country-state-thin-gab` |
|                   | État : nom partagé, pays `COG`               | `country-state-shared-congo` |
| 4 · Other pages   | Nom `PAT_TRAORE`                             | `name-traore`        |
|                   | État mince : nom `PAT_KOLLO`                 | `name-state-thin-kollo` |
|                   | État : sources faibles, nom `PAT_SARR`       | `name-state-weak-sarr` |
|                   | Lieu `LOC_YAMOUSSOUKRO`                      | `place-yamoussoukro` |
|                   | Glossaire                                    | `glossary`           |
|                   | À propos                                     | `about`              |
|                   | Notre démarche                               | `approach`           |
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
| 2026-10-15 | [Brief 5, the country fiche](../briefs/05-country.md) | `country-civ`, `country-state-civ-quaqua`, `country-state-thin-gab`, `country-state-shared-congo` (new) |
| 2026-10-16 | [Brief 9, « Notre démarche »](../briefs/09-our-approach.md) | `approach` (new), `about`, `Main`; the footer (state B) on every board except `name-traore` |
| 2026-10-17 | [Brief 10, the story link and folded chapters](../briefs/10-fiche-story-link-and-folds.md), approved 2026-10-17 by delegation (the operator asked Claude to approve on their behalf, after an art-direction review); with it the fiche heads of ETNI-2047 (REQ-151) and the filed name « Peul » | `people-fula`, `people-bassa`, `people-thin-alaba`, `language-lingala`, `language-thin-havu`, `family-bantu`, `family-mande` (with the « L'empreinte » words of PR #1813), `country-civ` and its three state boards, `people-state-fula-culture-open` and `country-state-civ-names-open` (new), `search-peul` (the fiche button only), `Main` |
| 2026-10-17 | [Brief 11, from the searched name to the self-name, one video, labelled sources](../briefs/11-result-page-self-name-handoff.md), approved 2026-10-17 by delegation | `search-peul`, `search-bassa` and `search-state-peul-fulbe-open` (new) for the hand-off, the video row and the period rule (also on `search-congo`); the labelled sources button on those and on `search-state-competing`, `search-state-thin`, `language-lingala`, `country-civ`, `country-state-civ-quaqua`; `Main` |
| 2026-10-17 | [Brief 12, the unknown name, the « Fiches » lens and the consent strip](../briefs/12-unknown-name-fiches-lens-consent.md), approved 2026-10-17 by delegation | `search-unknown` (the invitation in the verdict, no empty shelf, no owed cards); `search-state-fiches` (new); `Main` (the fiche cards and the lens states, the consent strip at 430, 768 and 1440, closed and open, and over the first screen of `search-peul-430`) |
| 2026-10-17 | Fixes from the art-direction review of briefs 10 to 12, approved with them by delegation | `search-unknown` (the Siwi and Tchad reasons restored as brief 1 approved them); the fold boards of brief 10 and their two state boards (each closed fold opens with « + »; on `country-civ` the naming-systems line folds with the 47 names); `country-state-civ-quaqua` (the readings stack below 1200 px); `search-state-fiches` (the lens bar drawn scrolled to « Fiches » at 430); `Main` (the locked consent switch in full ink, scale captions, the legend and lens-bar notes) |
| 2026-10-17 | [Brief 12](../briefs/12-unknown-name-fiches-lens-consent.md), approval record item 5: the consent strip reads and tabs in one order (WCAG 2.4.3), with the ETNI-2060 implementation | `Main` (from 768 px the quiet pair follows « Refuser » and « Accepter » on the right; the reversed row is removed from the board layer of `ea-live.css`) |
| 2026-10-18 | [Brief 6, the family-name fiche](../briefs/06-family-name.md) | `name-traore`, `name-state-thin-kollo` and `name-state-weak-sarr` (new); footer B now on `name-traore` too |
| 2026-10-17 | The sources block renamed, approved by the operator in chat on 2026-10-17 (a wording change, no brief: the layout does not move). The eyebrow « Les sources parlent » goes; the question « Qui raconte le nom X ? » becomes « Les sources du nom X » (« Les sources des noms de ce peuple » on a fiche); the sentence under it counts sources, not accounts (« Plusieurs sources expliquent l'origine de ce nom. Voici leurs 4 récits, rangés par type de source. »). The rule behind it, no figure of style in a title, is in [`reader-facing-register.md`](../../../editorial/reader-facing-register.md) | every `search-*`, `people-*`, `language-*`, `family-*` and `country-*` board that draws the block; `Main` |
| 2026-10-18 | The same rule on the timeline labels, under the operator's rule of 2026-10-17 (no figure of style on any page): « On remonte le temps » becomes « Du plus récent au plus ancien », « Pendant ce temps, ailleurs » becomes « Ailleurs à la même époque », « Naissance du nom X · origine la plus ancienne connue du projet » becomes « Origine la plus ancienne connue du nom X ». Off the boards, the header panel « Trois chemins » becomes « Menu » and « Le saviez-vous ? » becomes « À savoir » | every board that draws the timeline |
| 2026-10-18 | [Brief 13, one search component and the search page](../briefs/13-search-entry.md) | `Main` (the search component in four states, the full-screen header search at 430, the dialog at 768); `search-entry` (new) |
| 2026-10-18 | [Brief 16, a misspelling that also finds related fiches](../briefs/16-typo-with-related-fiches.md), **proposed, awaiting the operator's approval** | `search-state-typo` (new): « tchikaya », the plain verdict of `search-unknown`, the accented choice Tchicaya as the page's one action, under it a note and the quiet link « Proposer une source », « Aller plus loin »; the fiche Tchicaya is not listed again, so no fiches block and no filters; no video shelf, no sound-alike fiche; `Main` (the choice chip by day and by night, the invitation, the group heading in both numbers, the chip that names a form other than its fiche's filed name and its line, « jarra »; « tchikaya » with one choice, « konana » with two choices and a fiche found under the related-only caution); a word a fiche writes in its text (« sanoh », a Kuranko clan) keeps the related-only page until the operator rules (DEC-075) |

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
  It also holds one poster, `short-fulbe.jpg`, copied from
  `public/images/discoveries/videos/fulbe-sept-noms-un-sens-ouvert.jpg`, for the
  video row of brief 11, and `search-peul-430-first-screen.jpg`, a capture of the
  first 430 × 812 px of `search-peul-430`, the page behind the consent strip on
  `Main` (brief 12). Capture it again when that board changes.
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
