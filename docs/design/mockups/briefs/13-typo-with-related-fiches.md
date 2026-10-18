# Brief 13 — A misspelling that also finds related fiches

Read [`README.md`](README.md), [`12-unknown-name-fiches-lens-consent.md`](12-unknown-name-fiches-lens-consent.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18. Status: **proposed, awaiting the operator's approval.**
Nothing here binds the code until the operator approves it or asks for changes.
The pull request that needs it (#1835, ETNI-2092) must not merge before then.

## Why this board exists

DEC-075 (REQ-125 as edited) lets the search offer a family name as a lead
beside results, when nothing answers the query exactly. « tchikaya » finds
the fiches Chukwu and Tchicaya, neither answering it, and the API now offers
Tchicaya as the spelling the reader probably meant. The result page then
opens on « Cherchiez-vous… ? » instead of « Nous avons trouvé des fiches
liées… ». No board drew this state: `search-unknown` and the
`search-state-*` boards answer other questions, and the older `search-feed`
mockups are replaced. A reader could see it, so it is drawn first.

## The boards

`search-state-typo-fiches-430`, `-768` and `-1440`, in group 1, below
`search-state-peul-fulbe-open`. Same chrome as `search-unknown`.

In order:

1. **The verdict**, in the tone that asks rather than answers: « D'où vient
   ce nom », the searched form « tchikaya » as the title (doctrine §1.1), then
   « Cherchiez-vous… ? » and « Aucun nom ne correspond exactement à
   « tchikaya ». Voici les plus proches : choisissez-en un pour le chercher. »
2. **The choices**: « Les noms les plus proches », one chip, « Tchicaya ». It
   leads to the name's own address, a new search the reader chooses.
3. **The lens bar**: Tout (pressed), Jeux 1, Fiches 2. The game is the one
   the companions hold for the first lead, as on any misspelling page.
4. **The fiches found**: « Découvrir », its note, and the two cards Chukwu and
   Tchicaya, two columns from 430 px.
5. **The way out**: « Aller plus loin », the peoples and the families.

## Decisions proposed

1. **No video shelf on a misspelling page.** The page as built drew « Les
   vidéos » over « Pas encore de short », a block that only says it is empty
   (rule 6 of the briefs). Brief 12 removed the same shelf from the unknown
   name. Here the shelf could only hold pieces about a nearest name, which the
   reader has not chosen yet, and the Shorts filter already keeps them. The
   rule covers the misspelling state as a whole, with or without fiches. The
   charter's line for that state (« opens on the verdict and the choices and
   closes with `further` only ») already reads this way; nothing is added to it.
2. **The fiches follow the choices.** The reader is asked which name they
   meant before the list of what the search found, as the charter orders a
   related-only page.
3. **A search scoped to a country or a family never reaches this state.** It
   stays the relation browse its chip asked for. Titled with the filter, a
   misspelling verdict would say that no name matches « Congo-Brazzaville ».

## Left as it is

- The cards in « Découvrir » read « Fiche EthniAfrica » under each name. The
  « Fiches » lens gives each card its own line (brief 12), « Tout » does not.
  That card belongs to every related-only page, so it is left to a board of
  that state rather than changed here.
- The lens pills and the « Aller plus loin » links are drawn at 14 px, like
  every approved search board. The page draws them at 13 px. The difference
  predates this brief and is shared with `search-unknown` and
  `search-state-fiches`.

## Checked against the rules of the briefs

1. Mobile first: drawn at 430, then 768 and 1440; the same markup at each
   width.
2. French only, plain register: the sentences are the page's own, from
   `src/lib/i18n/copy/searchFeed.ts`.
3. Tokens only: the record rules added to `ea-live.css` for the choices and
   the fiche cards use tokens, read from the page's computed styles.
4. No source tier is shown.
5. No name is crowned: the title is what the reader typed, and Tchicaya is
   offered as a choice, not as the answer.
6. No block says it is empty: the shelf is gone (decision 1).
7. Movement III: this state is not an answer; like the unknown name, it ends
   on a way out.

## Comparison with the page

The page was rendered on `next dev` at 430, 768 and 1440 on 2026-10-18, with
migration 109's lead injected into `/api/v2/search` (the search itself came
from recette). Every block box (verdict, title, choices, chip, lens bar,
fiches, first card, « Aller plus loin ») has the same position and size on
the page and on the board at the three widths, and the text of the column is
identical. Only the footer differs, which is outside this state.

## Approval record

Empty until the operator approves.
