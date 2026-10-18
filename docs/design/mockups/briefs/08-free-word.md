# Brief 8 — The free-word fiche

Read [`README.md`](README.md), `docs/design/mockups/site/README.md`,
`docs/design/mockup-first-workflow.md`,
`docs/editorial/reader-facing-register.md` and
`docs/editorial/doctrine.md` first. This is a design task: prepare a new page
and its boards; do not write application code or change the existing glossary
board.

## Surface and route proposal

The source records are the three current word fiches in
`dataset/source/afrik/mots/`: `WRD_RACE`, `WRD_KIRDI` and `WRD_TRIBU`. The
site has no page that renders these records; `/api/v2/words` and
`/api/v2/words/[id]` expose them. The approved route is
`/fr/atlas/mots/[slug]`, with the breadcrumb « Accueil › Parcourir › Mots ›
race » (operator decision, 2026-10-19).

Create three new boards named `word-race-430`, `word-race-768` and
`word-race-1440`. Add them to `canvas.json` in a new group, « 5 · Mots ».
The existing `glossary` board stays untouched. The boards show the `WRD_RACE`
page and use all three real word records in the page's word-navigation area.

## What the source records say

Use the local JSON records as the only source of copy and claims. Keep each
claim with its attribution, source links, source type and uncertainty. Do not
show source tiers.

- **Race (`WRD_RACE`)** — the record says the word first meant a family or
  lineage, then groups people that others tried to distinguish by heredity.
  It entered French from Italian. Its origin is disputed: the fiche records
  twelve accounts, including proposals from Latin *ratio*, Latin *generatio*,
  Old High German *reiza*, Arabic *ra's* and French *haras*. Keep them as
  separate, attributed hypotheses. Its sources include academic work, an
  archive, intergovernmental publication and linguistic reference. The fiche
  also records three gaps; preserve them in the closing band.
- **Kirdi (`WRD_KIRDI`)** — the record describes a name given from outside to
  non-Muslim peoples of northern Cameroon and Chad. It was long used
  disparagingly; some people later reclaimed it as a name of pride. The
  record has nine accounts, including three different origin proposals
  (Kanouri *kerdi*, Arabic *choa* and Arabic *qird*). Keep each proposal
  attributed and uncertain. Its sources include academic work and archives;
  keep the source type beside each account.
- **Tribu (`WRD_TRIBU`)** — the record says the French word comes from Latin
  *tribus*, a division of the Roman people; it later translated Arabic
  *qabīla* and was used to classify African peoples. Its Latin origin is
  debated, and the record preserves different explanations. Use its own
  wording and sources if any of its claims appear on the board.

The three records have 12, 9 and 27 history accounts respectively. The
`WRD_TRIBU` record has 22 accounts for « tribu » and 5 for « tribe ». None is a
thin or single-account example. Do not invent a thin state or compress a
disagreement into one answer to make the layout shorter.

## What to draw

At 430 px, then 768 px, then 1440 px, draw the page in this order:

1. The shared site header and a plain page title, « Le mot race ».
2. A short summary based on `WRD_RACE.nameHistory.summary`. Put the current
   meaning before the older meaning, and say that the sources do not agree on
   the origin. Do not add a claim that the word has no African origin: the
   record says how it entered French and keeps its earlier origin disputed.
3. The name-history component, adapted to show how people used the word and
   for whom. Keep the twelve accounts attributable and chronological; show
   competing origin proposals side by side, without ranking or merging them.
   Use the brief 15 timeline pattern: leave the three most recent accounts,
   the origin account and the five-hypothesis tile open. Collapse the three
   remaining individual accounts (1684, around 1500 and the earlier Italian
   account). The hypotheses tile contains five accounts but remains open.
4. The related-subject block from `WRD_RACE.relatedSubjects`: Mandé and
   Bantou. Present these as links recorded in the fiche, not as claims that
   the relation itself has been established by a source. Use a plain label
   such as « Sujets indiqués dans la fiche ». Show a source link for Mandé
   only where the record provides one. Link to Bantou, but do not imply that
   a source in the race fiche supports that relation.
5. The sources block, titled « Les sources du mot race ». List each source
   once, show its type, and link it to « Voir le récit » where it is used.
   Never show a tier or rank the sources.
6. The approved closing band « Ce que nous ne savons pas encore » with the
   three gaps in the record. Reuse the footer B and other relevant components
   from `Main`.
7. A « Parcourir les mots » area with the three real records: race, Kirdi and
   tribu. Use their recorded names and short definitions as navigation. The
   `WRD_TRIBU` fiche also records links to race and Kirdi; if shown, label
   them as relations recorded in that fiche, not as claims independently
   supported by a source. Do not imply that all three records are related to
   each other.

Use the actual relations and citations from the three JSON files. No invented
claims, quotations, dates, sources, source types, related links or thesis copy.
No figure of style in a title. Keep difficult source language quoted and
attributed; explain it in plain French beside the quotation when needed.

At 768 and 1440 px, retain the same reading order and all source-backed
uncertainty. Use the site's existing tokens and components. The glossary
board, `Main` and every existing page board stay unchanged unless the operator
first agrees to a shared-component change.

The operator approved and recorded the boards on 2026-10-19. See the approval
record below. This brief records the design decisions; implementation requires
the approved boards in `docs/design/mockups/site/` as its reference.

## Approved boards (2026-10-19)

Recorded in `docs/design/mockups/site/`, new group « 5 · Mots » of
`canvas.json`. This approval record is integrated with the updated brief on branch
`feat/etni-2118-free-word-brief` (PR #1870).
Every text comes from `dataset/source/afrik/mots/WRD_RACE.json`, and the names,
definitions and two relations of `WRD_KIRDI` and `WRD_TRIBU`, word for word,
except the plain lines named in the choices below. No page renders the word
fiches yet; `/api/v2/words` serves them.

The operator approved the boards on 2026-10-19 with these decisions:

1. The page takes the proposed route `/fr/atlas/mots/[slug]`, with the
   breadcrumb « Accueil › Parcourir › Mots › race ».
2. The timeline follows the fold of brief 15: open are the three most recent
   accounts (the two of 1980, in one tile, and 1900), the account of about
   1480 (« Origine la plus ancienne connue du mot race ») and the tile of the
   five hypotheses; three individual accounts fold: 1684 and about 1500
   behind « + Voir les 2 autres récits », and the Italian account before 1480
   (« Avant le mot race ») behind « + Voir l'autre récit ».
3. « Les sources du mot race » lists each source once, with its type and
   « Voir le récit » or « Voir les N récits » to the accounts it backs.
4. Mandé and Bantou are shown as relations recorded in the race fiche, without
   a source button: no source of the race fiche backs the Bantou link.
5. « Parcourir les mots » offers race, Kirdi and tribu as navigation, and
   shows the race and Kirdi links recorded in the tribu fiche as relations
   noted there.
6. `WRD_TRIBU` holds 27 accounts (22 for « tribu », 5 for « tribe »), not 35.
7. The line under the summary that repeated it is removed.

- `word-race` at 430, 768 and 1440 (new), top to bottom:
  - the header, the title « Le mot race », « Mot · français » and the
    breadcrumb, in the place fiche's title block;
  - « En bref »: the fiche's summary, current meaning first, then the first
    meaning, then the origin the sources disagree on;
  - the timeline of brief 15, its controls on one row, the twelve accounts
    with their sources buttons, folded as in decision 2; the hypotheses tile
    keeps the fiche's order and its own words on who retains or rejects an
    explanation (Liberman rejects ra's and retains haras);
  - « Familles de langues liées »: Mandé and Bantou with the fiche's two
    relations;
  - « Les sources du mot race »: six sources, fifteen links to accounts;
  - the closing band with the fiche's three gaps, in its fiche variant (no
    thesis line);
  - « Parcourir les mots », then footer B.
- `ea-live.css` gains the `.ea-word-related` and `.ea-words*` rules. New
  selectors only, tokens only. `Main`, the glossary board and every other
  board are unchanged.

Choices made while drawing, kept by the operator:

1. The hypotheses tile opens with « Cinq explications existent de l'origine
   du mot race, sans que l'une l'emporte. », on the model of the sentence
   approved for Yamoussoukro.
2. The page takes the result page's components (the timeline, the origin and
   « Avant le mot race » pills, the brief 15 sources list) under the place
   fiche's title block, without a search field, lens bar or « Voir aussi ».
3. The relations block is titled « Familles de langues liées » and opens with
   « La fiche du mot race relie ce mot à deux familles de langues. »
4. In « Parcourir les mots » the race card reads « Mot · cette page », is not
   a link and has a dashed border; « La fiche du mot tribu relie ce mot aux
   deux autres : » precedes the two relations of `WRD_TRIBU`.
5. The sources strip groups linguistic references and the academic article
   under « Livre ou étude » and the intergovernmental chapters under
   « Rapport public », as on the result page.

Measured at 430 px with the board fonts: header 61, title block 289,
« En bref » and timeline 2,294, related families 520, sources 1,095, closing
band 917, « Parcourir les mots » 856, footer 1,391; page 7,422 px (768:
5,299; 1440: 4,830).
