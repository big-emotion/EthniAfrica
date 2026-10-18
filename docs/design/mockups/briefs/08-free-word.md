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
   the origin account and the hypotheses tile open; collapse the other five
   accounts.
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

## Step 0 and approval

Before drawing, report in six lines: whether a word page or route exists;
which word records are present; what the `race` record says about its current
and earlier meanings; which origin accounts disagree; what related subjects
and gaps it records; and any route or layout decision for the operator.
Change nothing in this step. Then wait for the operator's decisions.

Operator decisions, 2026-10-19: use the approved route and breadcrumb above;
follow the brief 15 timeline pattern with five accounts collapsed; list each
source once and link it to « Voir le récit » where used; present Mandé and
Bantou as relations recorded in the race fiche, without implying that the
relation itself is source-backed when no source link is recorded; and show
the race and Kirdi links recorded in the tribu fiche as such. The operator
also approved correcting the `WRD_TRIBU` account count to 27.

After receiving those decisions, draw `word-race-430` first, then 768 and
1440. List in five lines any remaining choices you made. Wait for the
operator's approval before recording the boards in the repository.
