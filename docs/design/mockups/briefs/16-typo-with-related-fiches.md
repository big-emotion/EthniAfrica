# Brief 16 — A misspelling that also finds related fiches

Read [`README.md`](README.md), [`12-unknown-name-fiches-lens-consent.md`](12-unknown-name-fiches-lens-consent.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18 as brief 13, renumbered 16 the same day (pull request
#1832 holds briefs 13 to 15), then redrawn after a review through three lenses
(art direction, doctrine, accessibility) rejected the first drawing.
Status: **proposed, awaiting the operator's approval.** Nothing here binds the
code until the operator approves it or asks for changes. The pull request that
needs it (#1835, ETNI-2092) must not merge before then.

## Why this board exists

DEC-075 (REQ-125 as edited) lets the search offer a family name as a lead
beside results, when nothing answers the query exactly. « tchikaya » finds the
family names Chukwu and Tchicaya, neither answering it, and the API offers
Tchicaya as the spelling the reader probably meant. The result page then opens
on « Cherchiez-vous… ? » instead of « Nous avons trouvé des fiches liées… ».
No board drew this state: `search-unknown` and the `search-state-*` boards
answer other questions, and the older `search-feed` mockups are replaced. A
reader could see it, so it is drawn first.

Chukwu reaches « tchikaya » only through the shared double-metaphone key. Its
fiche says it is the name the Igbo of Nigeria give to the supreme being;
nothing in the data links it to Tchicaya (Yombe, Congo). The first drawing
listed it under « Découvrir » with the generic « Fiche EthniAfrica », a link
the data does not make (doctrine §1.1). This drawing leaves it out.

## The boards

`search-state-typo-fiches-430`, `-768` and `-1440`, in group 1, below
`search-state-peul-fulbe-open`. Same chrome as `search-unknown`. Measured
heights: 2408, 1709 and 1548 px.

In order:

1. **The filters**: « Tout » (pressed) and « Fiches 1 », first in the column,
   12 px under the search field, where every approved board draws them
   (`search-peul`, `search-state-fiches`). No other lens (decision 8).
2. **The verdict**, plain, with the rhythm of `search-unknown` at every
   width: 16 px above the eyebrow, 4 px above the name, 8 px above the line
   and the text. « D'où vient ce nom », the searched form « tchikaya » as the
   title (doctrine §1.1), « Cherchiez-vous… ? », then « Aucune fiche ne porte
   exactement le nom « tchikaya ». Le nom le plus proche est Tchicaya :
   choisissez-le pour lire son histoire. »
3. **The choice**, 16 px under the verdict: the small group heading « Le nom
   le plus proche », then the chip « Tchicaya », a new search the reader
   chooses. Under it, « Vous écrivez ce nom « tchikaya » ? Dites-nous d’où
   vient cette écriture. » and the button « Proposer une source ».
4. **The fiche found**, one section gap lower: « La fiche trouvée », « Nous
   avons trouvé une fiche liée sans établir qu’elle répond à ce nom. », then
   the card Tchicaya with its own line, « Un nom de famille écrit dès 1947 au
   Journal officiel. ». One column below 768 px.
5. **The way out**: « Aller plus loin », the peoples and the families.

A note marked as such ends the column: « muzombo » is the same state
(Mutombo).

`Main` gains a section « Composants · nom mal écrit : verdict, choix, fiches
trouvées (brief 16, proposé) »: the choice chip at rest and focused, beside the
neutral lens pills; the group heading in the singular and the plural; one 426 px
frame for « tchikaya » (one choice, one fiche found) and one for several
choices with no fiche found (« pigmée », names marked as examples). Main
measures 19959 px with recette's sources rename of 2026-10-18.

Every space before « ? », « : », « ; », « ! » and inside the guillemets is a
no-break space (U+00A0), on the boards as in `src/lib/i18n/copy/searchFeed.ts`.

## Decisions

Taken for the operator on 2026-10-18; he delegated the decisions of this work
and keeps the approval of the boards.

1. **Number.** This brief is 16; every reference to « brief 13 » followed.
2. **The filters come first**, 12 px under the field, as on every approved
   board. Set after the choices, the pressed « Tout » was the heaviest mark of
   the first screen and read as the selected option of a set holding the
   name. `buildSearchFeedPlan` opens this state on `lenses`, then `verdict`,
   then `appellations`.
3. **The verdict keeps the rhythm of `search-unknown`.** The three
   `.ea-verdict[data-tone="plain"]` record rules are deleted. In the code, the
   plain verdict keeps its 16 px top padding and its 4 px above the name at
   every width, and its line sits 8 px under the name. The unknown-name page
   gets the same correction: at 1200 px it had set its eyebrow against the
   search field.
4. **No sound-alike fiche.** In this state the page lists no fiche that
   reaches the query only through its phonetic key. The lead already offers
   the spelling the key was bridging (« Keyta » to « Keïta »). The query layer
   asks `afrik_search_patronymes` to withhold those rows once it offers a
   family-name lead beside results (migration 108's switch); the count and the
   « Fiches » lens follow. The fiches the data does link keep a block, titled
   by what it is, opened by the related-only caution sentence and each card
   with the line of its matching form, never « Fiche EthniAfrica ». The title
   and the sentence agree with the number of cards. With no such fiche, no
   block is drawn, and a lead is never repeated as a fiche card.
5. **The verdict says only what is true, in the right number.** « Aucune
   fiche ne porte exactement le nom « … ». » speaks of our fiches, not of every
   name: people bear the spelling Tchikaya. One choice: « Le nom le plus proche
   est Tchicaya : choisissez-le pour lire son histoire. ». Several: « Voici les
   noms les plus proches : choisissez-en un pour lire son histoire. ».
6. **A reader who writes the name this way can say so**, with the button of
   the unknown-name page (brief 12, `.ea-owed-action`), since DEC-075 says a
   sourced spelling restores the name. It is drawn under the choice rather than
   inside the verdict: between « choisissez-le » and the chip it would have put
   a second action before the first.
7. **The choice is the page's one action.** It takes the name chip of `Main`
   (body font, `--afh-text-small` 700, 6 px between chips) with the accent
   (border `var(--accent)`, fill `var(--accent-tint)`), so it stands apart from
   the neutral filter pills. Its heading is the small group heading of the
   « Fiches » lens (`.ea-fiche-group-title`), in the singular for one choice.
   The verdict line stays the strongest line under the name.
8. **No filter from a lead the reader has not chosen.** With nothing
   answering, the companions come from the first lead; a « Jeux » lens titled
   « tchikaya » over a game about Tchicaya would treat two names as one. The
   bar keeps « Tout » and « Fiches ».
9. **Spacing never shrinks as the viewport grows.** The choices sit 16 px
   under the verdict at every width; the 1200 px steps of the first drawing are
   gone. The fiche grid is the « Fiches » lens grid: one column below 768 px,
   `data-cols` from the count, no 430 px step.
10. **States and limits** are listed below, with a proposed charter line.
11. **Out of scope**, listed under « Follow-ups » and not changed.
12. **Migration number.** Recette holds migrations up to 108 on 2026-10-18,
    so this pull request keeps `109_afrik_search_leads_family_names.sql`.

Kept from the first drawing:

- **No video shelf on a misspelling page.** Its pieces could only be about a
  nearest name the reader has not chosen yet.
- **The fiches follow the choices.** The reader is asked which name they
  meant before the list of what the search found.
- **A search scoped to a country or a family never reaches this state.** It
  stays the relation browse its chip asked for.

## States to draw

Only the first is drawn; the others are held by tests and need no board.

- **One lead, linked fiches**: « tchikaya » → Tchicaya, as drawn.
- **Same state**: « muzombo » → Mutombo (a note on the boards, no new board).
- **No lead, the related-only page, unchanged**: « bukasa » (Mukasa begins
  with another letter) and « chikaya » (Tchicaya does not begin with c).
- **An exact answer, no lead**: « bello » is answered by the fiche Bello; no
  family name is offered beside it, as a lead or as a similar name.
- **Several leads**: the plural verdict and heading (drawn on `Main`).
- **A misspelling with no linked fiche**: the verdict, the choices and
  « Aller plus loin », with no fiches block (drawn on `Main`). It is also what
  remains when every fiche found was a sound-alike.
- **The « Fiches » lens of this state**: brief 12's « Autour de ce nom » alone,
  under « Fiches sur tchikaya »; unchanged.

## Do not

- Offer a family-name lead that changes the first letter or scores under 0.4.
- Put a family name in the similar-names shelf (REQ-180).
- Show a score, a similarity or a tier.
- Present the lead as the answer, or write that the two spellings are one
  name.
- Draw this state for a scoped search, or when something answers exactly.
- List a fiche the search reached only by its sound, or repeat a lead as a
  fiche card.
- Give a fiche card the generic line « Fiche EthniAfrica », or title the block
  « Découvrir ».
- Build a filter from a lead the reader has not chosen.

## Proposed amendments (not applied)

`docs/design/search-result-charter.md` is not edited by this brief; the
operator approves these with the boards, and the requirements are written on
Confluence with `/ethniafrica-spec`.

**Charter §3 ter**, the exceptional states. Replace « a typo with useful
leads opens on the verdict and the choices and closes with `further` only; »
by (**proposed**):

> a typo with useful leads opens on the filters, the verdict and the choices,
> under which a reader who writes the name this way can propose a source;
> when the search also found fiches that the data links to the query, they
> follow under the related-only caution, each with its own line, a fiche
> reached only by its sound being left out; it closes with `further` only and
> draws no shelf;

**REQ-201** (**proposed**): a family name that matches the query only by its
sound is also withheld when the search offers a family-name lead beside its
results (DEC-075). **DEC-075**, its tradeoff (« Chukwu stays under REQ-201 »)
follows.

## Follow-ups, out of scope

Listed for their own briefs, not changed here:

- The shared eyebrow « D'où vient ce nom » on the pages with no answer (also
  a question standing for a title; flagged to the #1830 sweep).
- The search input's missing focus ring (`outline: none` with nothing in its
  place).
- The focus rings of the lens pills and of the « Aller plus loin » links.
- « Aller plus loin » has no heading and its links are not a list.
- The site header overflows at 320 px (401 px wide).
- « Découvrir » and « Pour aller au fond… » (`shelves.fiches`,
  `labels.fichesSubtitle`) remain on the other related-only states; flagged to
  the #1830 sweep.
- The lens pills and the « Aller plus loin » links are drawn at 14 px, as on
  every approved search board; the page draws them at 13 px.
- The accessibility review also proposed `aria-describedby` from each choice
  to the verdict text. The choice now sits under its own heading, which gives
  the link its context; the decisions did not take it up.
- The local database's name index does not carry the wave-25 line of
  Tchicaya yet; a sync brings it (the page draws the line when the API sends
  it).

## Checked against the rules of the briefs

1. Mobile first: drawn at 430, then 768 and 1440; the same markup at each
   width.
2. French only, plain register: every sentence is the page's own, from
   `src/lib/i18n/copy/searchFeed.ts`, checked with `npm run check:editorial`.
3. Tokens only: the record rules added to `ea-live.css` use tokens, apart
   from the 44 px target.
4. No source tier is shown.
5. No name is crowned: the title is what the reader typed, and Tchicaya is
   offered as a choice, not as the answer.
6. No block says it is empty: no shelf, and no fiches block without a fiche.
7. Movement III: this state is not an answer; like the unknown name, it ends
   on a way out.

## Comparison with the page

The page was rendered on `next dev` at 430, 768 and 1440 on 2026-10-18. The
local database has no migration 109, so the browser added the Tchicaya lead to
`/api/v2/search` and removed Chukwu, as the query layer now does (its unit
tests hold that), and gave the form « Tchicaya » the line its fiche carries in
the repository. Every block box (filters, eyebrow, name, line, text, choice
heading, chip, sentence, button, fiche heading, note, card, « Aller plus
loin ») has the same position and size on the page and on the board at the
three widths. The differences: the board's note on « muzombo », the footer
(outside this state), and the 13 px pill text listed above. The unknown-name
page, rendered beside `search-unknown-430` and `-1440`, now matches them too.

## Approval record

Empty until the operator approves.
