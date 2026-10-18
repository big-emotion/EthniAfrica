# Brief 14 — The Atlas page becomes « Les noms d'Afrique »

Read [`README.md`](README.md), [`13-search-entry.md`](13-search-entry.md) and
[`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18. Status: **scope approved by the operator on 2026-10-18;
boards not drawn yet.** Prompt: [`claude-design-prompt-14.md`](claude-design-prompt-14.md).

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
