# Brief 14 — The Atlas page becomes « Les noms d'Afrique »

Read [`README.md`](README.md), [`13-search-entry.md`](13-search-entry.md) and
[`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18. Status: **scope and boards approved by the operator on
2026-10-18.** Prompt: [`claude-design-prompt-14.md`](claude-design-prompt-14.md).

**Pass 5.** It starts once pass 4 ([brief 13](13-search-entry.md)) is approved
and recorded, because it reuses its search component.

## Decision the operator took on 2026-10-18

The page `/fr/atlas` is titled **« Les noms d'Afrique »**. « Parcourir »
becomes the title of the folded lists on it. The header menu is « Menu » since
2026-10-17 (PR #1830).

## Why

Measured on the production site at 430 px on 2026-10-17:

- The page is a menu: the title « Parcourir », the line « Les pages de
  familles linguistiques, langues, peuples, pays et noms, plus la recherche. »,
  six tiles in the order of the database (« Les pays d'Afrique », « Les peuples
  d'Afrique », « Les familles linguistiques », « Les langues d'Afrique », « Les
  noms d'Afrique », « Recherche libre »), then al-Idrisi's map (1154) over one
  screen, which leads nowhere.
- No search field. The question of the site, « D'où vient ce nom ? », is not
  asked.
- Audit of 2026-10-13: 15 visitors in 30 days, 9 seconds on the page. The
  peoples index it leads to has a 50 % bounce, « Improve » in three reports in
  a row: 665 entries paginated by 20, 34 pages, a paragraph to explain its
  filter.
- No board exists for this page today.

## New boards

`atlas-names-430`, `atlas-names-768`, `atlas-names-1440`, titled « Page Atlas :
Les noms d'Afrique », in a new « 0 · Atlas » group of `canvas.json`.

Top to bottom at 430:

1. **Title** « Les noms d'Afrique ». One sentence under it: « Chaque peuple,
   chaque langue, chaque pays a un ou plusieurs noms. Nous expliquons d'où
   ils viennent, avec leurs sources. » (plain, no figure; propose a shorter one
   if it runs over three lines).
2. **The search component of brief 13**, empty.
3. **« Entrer par un pays »**: a row of the 54 country chips, scrolling
   sideways, in alphabetical order (Afrique du Sud, Algérie, Angola, Bénin,
   Botswana, Burkina Faso…). Each opens the country's result page, at its
   address when it has one.
4. **« Cherchés cette semaine »**: the same rules as brief 13 part C, drawn as
   cards with the first sentence of each fiche's summary, word for word:
   - **Peuple · Peul** « Le nom Peul désigne un peuple qui se nomme lui-même
     Fulɓe, et Pullo pour une seule personne. »
   - **Langue · Lingala** « Le nom lingala désigne une langue du bassin du
     Congo, que beaucoup de ses locuteurs appellent aussi mangala. »
   - **Pays · Côte d'Ivoire** « Le nom Côte d'Ivoire désigne un pays d'Afrique
     de l'Ouest, la République de Côte d'Ivoire, qui se nomme ainsi elle-même
     et demande depuis 1985 que ce nom ne soit pas traduit. »
   - **Famille de langues · Bantou** « Le nom bantou désigne une famille de
     langues d'Afrique centrale, orientale et australe, et non un peuple. »
   Each card opens the result page, not the fiche (decision 1 of brief 13).
5. **« Parcourir »**: the lists, folded into one block of lines, each with its
   count from the corpus on 2026-10-18:

   | Line | Count | Opens |
   | --- | --- | --- |
   | Les peuples | 665 | `/fr/atlas/peuples` |
   | Les noms de famille | 789 | `/fr/atlas/noms` |
   | Les pays | 54 | `/fr/atlas/pays` |
   | Les langues | 39 | `/fr/atlas/langues` |
   | Les familles de langues | 25 | `/fr/atlas/familles` |

   The five routes answered 200 on 2026-10-18. `/fr/atlas/lieux` also exists,
   with 5 places: report whether it belongs in the list. The counts come from
   the API at build time on the implemented page.
6. The footer. **The map of al-Idrisi goes.** If the operator wants to keep it,
   it belongs in « Notre démarche », with its credit.

At 768 the cards sit in two columns; at 1440 the search and the country row
span the column, the cards in up to four columns, « Parcourir » as a two-column
list.

## Not in this brief

The index pages (peoples, languages, countries, families, family names) keep
their boards and layout; they only gain the search component of brief 13 in a
later pass if the operator asks. The home does not change.

## Acceptance (for the implementation, after approval)

- Given a reader on `/fr/atlas` at 430 px, when the page loads, then the first
  screen shows the title, the sentence and the search field.
- Given a card of « Cherchés cette semaine », when the reader taps it, then the
  result page for that name opens.
- Given the corpus changes, when the page builds, then the counts of
  « Parcourir » follow it.

## Approved boards (2026-10-18)

Recorded in `docs/design/mockups/site/`, group « 0 · Atlas » of
`canvas.json`. The operator approved the boards on 2026-10-18 with two
decisions:

1. The sentence under the title is « Peuples, langues, pays : nous expliquons
   d'où viennent leurs noms, avec leurs sources. » The first sentence ran to
   three lines at 430 px, at the limit; this one takes two.
2. « Les lieux » (5 places) stays out of « Parcourir » for now. It can be
   added as a sixth line when the list grows.

- `atlas-names` at 430, 768 and 1440 (new), « Page Atlas : Les noms
  d'Afrique », top to bottom:
  - the title « Les noms d'Afrique » and the sentence above;
  - the search component of brief 13, empty, as recorded on `Main`;
  - « Entrer par un pays »: the 54 countries in one row that scrolls sideways,
    from Afrique du Sud to Zimbabwe, in the home's chips (`.home-hero-seed`),
    each a link to the country's result page;
  - « Cherchés cette semaine »: four next-step cards (`.ea-next-card`, which
    leads to the name's result page): Peuple · Peul, Langue · Lingala, Pays ·
    Côte d'Ivoire, Famille de langues · Bantou, each with the first sentence
    of its fiche's summary, word for word;
  - « Parcourir »: Les peuples 665, Les noms de famille 789, Les pays 54, Les
    langues 39, Les familles de langues 25;
  - footer B. No map: al-Idrisi's map leaves this page.
- `ea-live.css` gains the `.ea-atlas*` selectors. New selectors only, tokens
  only.

Choices made while drawing, kept by the operator:

1. The title takes the display title of « À propos », left-aligned, with no
   eyebrow; the sentence is soft body text at the reading measure.
2. The three block titles take the style of « Poursuivre avec un autre nom ».
3. The country row starts at the column's left edge and is clipped at its
   right edge: no fade, no arrows, no visible scrollbar.
4. The four cards keep the brief's order and one size: one column at 430, two
   at 768, four at 1440, in the 1,240 px column that the field and the row
   span.
5. « Parcourir » gives one line per list: the name in semibold, the count in
   small mono type, an ocre arrow, a rule between lines; at 1440 the two
   columns read row by row. The « 0 · Atlas » group sits to the right of group
   4 on the canvas, so no other board moves.

Measured at 430 px on a render without the Google fonts: header 61, title and
sentence 100, search component 152, « Entrer par un pays » 87, « Cherchés
cette semaine » 769, « Parcourir » 320, gaps and margins 192 (1,620 px of
content), footer 1,415, page 3,096. The field ends 309 px from the top: the
first screen shows the title, the sentence and the field.
