# Brief 16 — A misspelling that also finds related fiches

Read [`README.md`](README.md), [`12-unknown-name-fiches-lens-consent.md`](12-unknown-name-fiches-lens-consent.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18 as brief 13, renumbered 16 the same day (pull request
#1832 holds briefs 13 to 15). A review through three lenses (art direction,
doctrine, accessibility) rejected the first drawing; a second review rejected
the redrawing, and this is the third drawing (see « Second review » below).
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

The search also finds Tchicaya itself, by its spelling, and offers it as the
lead. The second drawing listed it twice: as the choice and as « La fiche
trouvée ». This drawing lists it once, as the choice: its search already
leads to the fiche.

## The boards

`search-state-typo-430`, `-768` and `-1440`, in group 1, below
`search-state-peul-fulbe-open` (renamed from `search-state-typo-fiches`: the
state drawn no longer lists a fiche). Same chrome as `search-unknown`.
Measured heights: 2193, 1490 and 1293 px.

In order:

1. **No filters.** With Tchicaya left out of the fiches, only « Tout » would
   remain, and a bar of one filter is not drawn. When a misspelling finds
   another fiche, the bar comes back first in the column, 12 px under the
   search field, where every approved board draws it (`Main`, « sanoh »).
2. **The verdict**, plain, with the rhythm of `search-unknown` at every
   width: 16 px above the eyebrow, 4 px above the name, 8 px above the line
   and the text. « D'où vient ce nom », the searched form « tchikaya » as the
   title (doctrine §1.1), « Cherchiez-vous… ? », then « Aucune de nos fiches
   ne porte le nom « tchikaya ». Tchicaya s’écrit presque de la même façon :
   vous pouvez chercher ce nom. »
3. **The choice**, 16 px under the verdict: the small group heading « Un nom
   qui s’écrit presque de la même façon », then the chip « Tchicaya », a new
   search the reader chooses, the only accented object of the page.
4. **The invitation**, under the choice: the note « Si vous écrivez
   « tchikaya », dites-nous où cette écriture est employée. » (caption, soft
   ink) and the quiet link « Proposer une source » (bold, accent ink,
   underlined, 44 px tall, no fill, no border).
5. **The way out**: « Aller plus loin », the peoples and the families.

A note marked as such ends the column: the search also finds the fiche
Tchicaya, which the chip opens; Chukwu is not shown; « muzombo » is the same
state (Mutombo).

`Main` gains a section « Composants · nom mal écrit : verdict, choix, fiches
trouvées (brief 16, proposé) »: the choice chip at rest and focused, beside the
neutral lens pills; the group heading in the singular and the plural; the
invitation (note and quiet link); a night frame (`.dark`) with the chip, the
quiet link and the accented button of `search-unknown`; one 426 px frame for
« tchikaya » (one choice, no other fiche) and one for « sanoh » (two choices,
the filters, and one fiche found). Main measures 20697 px.

« sanoh » is an example the rules produce, taken from the corpus with the
search model of `src/lib/search/__fixtures__/corpusNameModel.ts` and held by
`familyNameLeads.test.ts`: Sanogo and Sanou begin like it at 0.4 or more, no
fiche bears it, and the Kuranko fiche counts Sanoh among the Kuranko clans.
The search also finds Sanogo and Sanou; they stay choices and are not shown
as fiches. The model is not the search: the SQL stays the authority.

Every space before « ? », « : », « ; », « ! » and inside the guillemets is a
no-break space (U+00A0), on the boards as in `src/lib/i18n/copy/searchFeed.ts`.

## Decisions

Taken for the operator on 2026-10-18; he delegated the decisions of this work
and keeps the approval of the boards.

1. **Number.** This brief is 16; every reference to « brief 13 » followed.
2. **The filters come first**, 12 px under the field, as on every approved
   board, when there are two. Set after the choices, the pressed « Tout » was
   the heaviest mark of the first screen and read as the selected option of a
   set holding the name. `buildSearchFeedPlan` opens this state on `lenses`,
   then `verdict`, then `appellations`; a bar of one filter is not drawn.
3. **The verdict keeps the rhythm of `search-unknown`.** The three
   `.ea-verdict[data-tone="plain"]` record rules are deleted. In the code, the
   plain verdict keeps its 16 px top padding and its 4 px above the name at
   every width, and its line sits 8 px under the name. The unknown-name page
   gets the same correction: at 1200 px it had set its eyebrow against the
   search field.
4. **No sound-alike fiche, and no lead shown as a fiche.** In this state the
   page lists no fiche that reaches the query only through its phonetic key.
   The lead already offers the spelling the key was bridging (« Keyta » to
   « Keïta »). The query layer asks `afrik_search_patronymes` to withhold those
   rows once it offers a family-name lead beside results (migration 108's
   switch). The page leaves a lead's own fiche out of the fiches found: the
   chip's search already leads to it, and shown again under « La fiche
   trouvée » it would be a second way to the same name, presented as linked to
   the spelling typed. The « Fiches » count leaves it out too. The fiches that
   remain keep a block, titled by what it is, opened by the related-only
   caution about the spelling typed, each card with the line of its matching
   form, never « Fiche EthniAfrica ». The title and the sentence agree with
   the number of cards. With no such fiche, no block is drawn, and no filter
   bar.
5. **The verdict says only what is true, in the right number.** « Aucune de
   nos fiches ne porte le nom « … ». » speaks of our fiches, not of every name:
   people bear the spelling Tchikaya. A lead is never « proche »: on this site
   the word names a recorded variant (the Tchicaya fiche calls Tschikaya « une
   forme proche de Tchicaya »), and DEC-075 records no spelling « tchikaya ».
   A lead is only written almost the same way. One choice: « Tchicaya s’écrit
   presque de la même façon : vous pouvez chercher ce nom. » under the heading
   « Un nom qui s’écrit presque de la même façon ». Several: « Plusieurs noms
   s’écrivent presque de la même façon : choisissez celui que vous
   cherchez. » under « Des noms qui s’écrivent presque de la même façon ».
   The invitation and the caution name the spelling typed instead of « ce
   nom », which read as the lead under the chip.
6. **A reader who writes the name this way can say so**, since DEC-075 says a
   sourced spelling restores the name. Under the choice it is a note and a
   quiet link (`.ea-choices-action`, the treatment of `.ea-lens-back`), never
   the accented button of the unknown-name page: there that button is the
   page's one action, here it would be a second one, larger than the chip.
   The code gives it its own classes (`proposeSpellingSource` in
   `SearchFeed.tsx`); `search-unknown` keeps its button.
7. **The choice is the page's one action.** It takes the name chip of `Main`
   (body font, `--afh-text-small` 700, 6 px between chips) with the accent
   (border `var(--accent)`, fill `var(--accent-tint)`), so it stands apart from
   the neutral filter pills. Its text is `var(--accent-foreground)`: the tint
   stays light at night while the page's ink turns light (1.12:1 with
   `--afh-text`, 13.5:1 with `--accent-foreground`). The button of
   `search-unknown` (`.ea-owed-action`) takes the same ink. Its heading is the
   small group heading of the « Fiches » lens (`.ea-fiche-group-title`), in
   the singular for one choice. The verdict line stays the strongest line
   under the name.
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
- **« Cherchiez-vous… ? »** stays suspended. The review proposed completing
  it (« Cherchiez-vous Tchicaya ? »). The same verdict serves the misspellings
  whose choices are peoples and countries (« mandink », « Congo-Brazzaville »),
  where « Cherchiez-vous Peul ? » or « Cherchiez-vous Congo ? » would need an
  article the page cannot choose. The sentence under it now names the choice.

## Second review (2026-10-18)

The redrawing was reviewed again through the three lenses. What changed:

- **One accented action.** The source button had the chip's accent, twice its
  width: the eye met two equal targets. It is now a note and a quiet link
  (decisions 6 and 7).
- **The lead is not repeated as a fiche** (decision 4). The board drew
  Tchicaya as the choice and as « La fiche trouvée », which the brief forbade
  twice; the code did the same. The fiches block now lists only the fiches
  that are not choices, so « tchikaya » draws none, and the filters go with
  it. « La fiche trouvée » is drawn on `Main` with « sanoh », where the fiche
  found (Kuranko) is not a lead.
- **No « proche »** (decision 5), and no « ce nom » that could point to the
  lead. Two wordings differ from the review's proposal: « Plusieurs noms
  s’écrivent… » instead of « Ces noms s’écrivent… », which pointed to chips
  not yet read; « Si vous écrivez « tchikaya », … » without « ainsi ». The
  caution keeps « liée »: the block no longer holds a lead, only fiches the
  search found, as on the related-only page.
- **No « pigmée » example.** `Main` showed Pygmée, Aka and Twa as the nearest
  names of « pigmée »: no rule produces them (the search respells « pigmée »
  and answers it), and it set an exonym the corpus records as possibly
  pejorative beside peoples it was applied to. The several-choice frame is
  now « sanoh », produced by the rules.
- **Legible at night** (decision 7): the chip and the button of
  `search-unknown` were 1.12:1 in night mode; they now take the accent fill's
  ink. `Main` draws them in a night frame.

## States to draw

Only the first is drawn as a board; the others are held by tests.

- **One lead, no other fiche**: « tchikaya » → Tchicaya, as drawn.
- **Same state**: « muzombo » → Mutombo (a note on the boards, no new board).
- **Several leads and a fiche found**: « sanoh » → Sanogo, Sanou, and the
  Kuranko fiche (drawn on `Main`).
- **No lead, the related-only page, unchanged**: « bukasa » (Mukasa begins
  with another letter) and « chikaya » (Tchicaya does not begin with c).
- **An exact answer, no lead**: « bello » is answered by the fiche Bello; no
  family name is offered beside it, as a lead or as a similar name.
- **A misspelling with no fiche found**: the verdict, the choices and
  « Aller plus loin », with no fiches block and no filters. It is also what
  remains when every fiche found was a lead or a sound-alike.
- **The « Fiches » lens of this state**: brief 12's « Autour de ce nom » alone,
  under « Fiches sur sanoh », without the leads; unchanged otherwise.

## Do not

- Offer a family-name lead that changes the first letter or scores under 0.4.
- Put a family name in the similar-names shelf (REQ-180).
- Show a score, a similarity or a tier.
- Present the lead as the answer, write that the two spellings are one name,
  or call the lead « proche ».
- Draw this state for a scoped search, or when something answers exactly.
- List a fiche the search reached only by its sound, or show a lead's own
  fiche as a fiche found.
- Give a fiche card the generic line « Fiche EthniAfrica », or title the block
  « Découvrir ».
- Build a filter from a lead the reader has not chosen.
- Give the source invitation the accent: the choice is the one accented
  action.
- Use an exonym beside the peoples it names as an example of choices.

## Proposed amendments (not applied)

`docs/design/search-result-charter.md` is not edited by this brief; the
operator approves these with the boards, and the requirements are written on
Confluence with `/ethniafrica-spec`.

**Charter §3 ter**, the exceptional states. Replace « a typo with useful
leads opens on the verdict and the choices and closes with `further` only; »
by (**proposed**):

> a typo with useful leads opens on the filters when there are two, the
> verdict and the choices, the page's one accented action, under which a
> reader who writes the name this way can propose a source through a quiet
> link; when the search also found fiches other than the choices that the
> data links to the query, they follow under the related-only caution, each
> with its own line, a fiche reached only by its sound being left out; it
> closes with `further` only and draws no shelf;

**REQ-201** (**proposed**): a family name that matches the query only by its
sound is also withheld when the search offers a family-name lead beside its
results (DEC-075). **DEC-075**, its tradeoff (« Chukwu stays under REQ-201 »)
follows, and a lead's own fiche is not listed among the fiches found.

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
- A family name the search finds by its spelling but that is not a lead (its
  first letter differs) is still listed among the fiches found, under the
  caution. Whether the page should tell it apart needs the API to say how a
  row was reached; not decided here.
- The night ink of `.ea-owed-action` also changes the day ink of the
  `search-unknown` button from `--afh-text` (#2c2018) to
  `--accent-foreground` (#1a1208), a difference no reader sees; the boards
  record it.

## Checked against the rules of the briefs

1. Mobile first: drawn at 430, then 768 and 1440; the same markup at each
   width.
2. French only, plain register: every sentence is the page's own, from
   `src/lib/i18n/copy/searchFeed.ts`, checked with `npm run check:editorial`.
3. Tokens only: the record rules added to `ea-live.css` use tokens, apart
   from the 44 px target.
4. No source tier is shown.
5. No name is crowned: the title is what the reader typed, and Tchicaya is
   offered as a choice, not as the answer, nor as a form of the name typed.
6. No block says it is empty: no shelf, no fiches block without a fiche, no
   bar of one filter.
7. Movement III: this state is not an answer; like the unknown name, it ends
   on a way out.

## Comparison with the page

The page was rendered on `next dev` at 430, 768 and 1440 on 2026-10-18. The
local database has no migration 109, so the browser answered
`/api/v2/search` as the query layer now does for « tchikaya » (its unit tests
hold that): Tchicaya as the one result and the one lead, Chukwu withheld.
Every block box (search field, eyebrow, name, line, text, choice heading,
chip, note, link, « Aller plus loin » eyebrow and links) has the same
position, size, type and colour on the page and on the board at the three
widths. The differences: the board's note, and the footer (outside this
state). The « sanoh » frame of `Main` is held by `SearchFeedMisspelling.test.tsx`
(the filters, the plural copy, Kuranko alone under « La fiche trouvée »,
« Fiches 1 »).

## Approval record

Empty until the operator approves.
