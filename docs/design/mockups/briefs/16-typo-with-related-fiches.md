# Brief 16 — A misspelling that also finds related fiches

Read [`README.md`](README.md), [`12-unknown-name-fiches-lens-consent.md`](12-unknown-name-fiches-lens-consent.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18 as brief 13, renumbered 16 the same day (pull request
#1832 holds briefs 13 to 15). A review through three lenses (art direction,
doctrine, accessibility) rejected the first drawing; a second review rejected
the redrawing; a third review rejected two points of the third drawing, and
this is the fourth (see « Second review » and « Third review » below).
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

No fiche writes « tchikaya », in its text, its lists or its sources: the
Tchicaya fiche writes Tschikaya, another word. A spelling a fiche does write
is not this state (see « States to draw »).

## The boards

`search-state-typo-430`, `-768` and `-1440`, in group 1, below
`search-state-peul-fulbe-open` (renamed from `search-state-typo-fiches`: the
state drawn no longer lists a fiche). Same chrome as `search-unknown`.
Measured heights: 2193, 1490 and 1293 px. The third review changed nothing on
them: Tchicaya scores through its filed name, so the chip and the sentence
already name the form that scored.

In order:

1. **No filters.** With Tchicaya left out of the fiches, only « Tout » would
   remain, and a bar of one filter is not drawn. When a misspelling finds
   another fiche, the bar comes back first in the column, 12 px under the
   search field, where every approved board draws it (`Main`, « konana »).
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
neutral lens pills; the group heading in the singular and the plural, in both
wordings (« s’écrit presque de la même façon », « ressemble au nom cherché »);
a chip that does not bear its fiche's filed name, with its line (« jarra »:
Jara, then « Jara est une écriture du nom Diarra. »); the invitation (note and
quiet link); a night frame (`.dark`) with the chip, the quiet link and the
accented button of `search-unknown`; one 426 px frame for « tchikaya » (one
choice, no other fiche) and one for « konana » (two choices, the filters, and
one fiche found). Main measures 25904 px with brief 16.

« konana » is an example the rules produce, taken from the corpus with the
search model of `src/lib/search/__fixtures__/corpusNameModel.ts` and held by
`familyNameLeads.test.ts`: Konan (0.63) and Konaté (0.40) begin like it, each
through its filed name. No fiche writes the word anywhere: not in its text,
not in a list of names or clans, not in its sources (`fichesRecordingWord`).
The search also finds Onana by its spelling (0.44); Onana begins with another
letter, so it is no choice, and the page lists it under the related-only
caution with its own line. Konan and Konaté stay choices and are not shown as
fiches. The model is not the search: the SQL stays the authority.

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
   the word names a recorded variant (the Tchicaya fiche calls Tschikaya
   « une forme proche de Tchicaya »), and DEC-075 records no spelling
   « tchikaya ». The chip names the form that scored, which migration 110
   returns as `matched_form` (API `matchedForm`) beside the filed name; the
   filed name stands only when a database sends no form. Only a family-name
   lead is said to be written almost the same way: it begins with the query's
   first letter and its named form scores 0.4 at least, so the claim is true
   of what the chip says. One choice: « Tchicaya s’écrit presque de la même
   façon : vous pouvez chercher ce nom. » under « Un nom qui s’écrit presque
   de la même façon ». Several: « Plusieurs noms s’écrivent presque de la même
   façon : choisissez celui que vous cherchez. » under « Des noms qui
   s’écrivent presque de la même façon ». As soon as one choice is a people, a
   country, a family (0.2, no first-letter rule: names that may share only a
   syllable) or a reviewed term, the page makes no spelling claim: « Nous
   connaissons un nom qui ressemble à celui-ci : vous pouvez le chercher. »
   under « Un nom qui ressemble au nom cherché », or « Nous connaissons des
   noms qui ressemblent à celui-ci : choisissez celui que vous cherchez. »
   under « Des noms qui ressemblent au nom cherché ». When the form a chip
   names is not its fiche's filed name, a line in the note's ink, 8 px under
   the chips, says which fiche records it: « Jara est une écriture du nom
   Diarra. », « Fellata est un des noms de la fiche Peul. ». A form two fiches
   record is one search, so one chip, with one line per fiche. The invitation
   and the caution name the spelling typed instead of « ce nom », which read as
   the lead under the chip.
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
12. **Migration number.** Recette took migration 109 from ETNI-2093 (#1836) on 2026-10-18,
    so this pull request renames its file `110_afrik_search_leads_family_names.sql`.
13. **A spelling a fiche writes is no misspelling, until DEC-075 rules.** When
    a fiche the search found writes the typed word in its own text, no family
    name is offered as the spelling the reader meant, and the page stays the
    related-only one, unchanged. « Sanoh » is one of the Kuranko clans, and the
    source of the Sanou fiche reads « Notice SANOU / SANOH / SANON »: the page
    must not ask « Cherchiez-vous… ? » and present Sanogo and Sanou as the
    names the reader meant. The query layer reads it from what the search
    already returns: a row of a kind with no phonetic tier in the lexical band
    of migration 069, and for a family name, whose lexical band also holds its
    phonetic matches, the word whole in its text. Whether such a word answers
    is put to the operator under DEC-075 (« Proposed amendments »).

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
  it. « La fiche trouvée » is drawn on `Main` with a fiche found that is not a
  lead.
- **No « proche »** (decision 5), and no « ce nom » that could point to the
  lead. Two wordings differ from the review's proposal: « Plusieurs noms
  s’écrivent… » instead of « Ces noms s’écrivent… », which pointed to chips
  not yet read; « Si vous écrivez « tchikaya », … » without « ainsi ». The
  caution keeps « liée »: the block no longer holds a lead, only fiches the
  search found, as on the related-only page.
- **No « pigmée » example.** `Main` showed Pygmée, Aka and Twa as the nearest
  names of « pigmée »: no rule produces them (the search respells « pigmée »
  and answers it), and it set an exonym the corpus records as possibly
  pejorative beside peoples it was applied to.
- **Legible at night** (decision 7): the chip and the button of
  `search-unknown` were 1.12:1 in night mode; they now take the accent fill's
  ink. `Main` draws them in a night frame.

## Third review (2026-10-18)

The third drawing was reviewed again through the doctrine lens. Two points
blocked; both are fixed in the boards, this brief and the code.

- **The several-choice example was a spelling our data records.** `Main` drew
  « sanoh » with Sanogo and Sanou as choices and Kuranko as « La fiche
  trouvée ». The Kuranko fiche counts Sanoh among the Kuranko clans, and the
  source of the Sanou fiche reads « Notice SANOU / SANOH / SANON »: the frame
  presented a recorded clan name as a misspelling, set the leads above the
  reader's own name (doctrine §1.1), and played down, with its caution, a link
  the data carries. The example is now « konana », which no fiche writes
  anywhere (`fichesRecordingWord` in the model, held by
  `familyNameLeads.test.ts`, which also holds that « sanoh » is recorded). The
  page for « sanoh » is no longer this state (decision 13); the question is
  put to the operator.
- **The spelling claim named a form that had not scored.** Migration 110
  scored a people on its filed name, self-appellation or exonyms, and a family
  name on its filed name or a recorded spelling, but emitted the filed name.
  « jarra » reaches Diarra through its spelling Jara only, and a query near
  the exonym Fellata reaches the Peul fiche: the page would have said
  « Diarra s’écrit presque de la même façon » and « Peul s’écrit presque de la
  même façon ». Peoples, countries and families also keep the 0.2 threshold,
  names that may share only a syllable. Migration 110 now returns the form
  that scored; the chip and the sentence name it, a line says which fiche
  records it, and only family-name leads are said to be written almost the
  same way (decision 5). `SearchFeedMisspelling.test.tsx` holds « jarra »
  and « felata »; the query layer's tests hold the API field.

## States to draw

Only the first is drawn as a board; the others are held by tests or drawn on
`Main`.

- **One lead, no other fiche**: « tchikaya » → Tchicaya, as drawn.
- **Same state**: « muzombo » → Mutombo (a note on the boards, no new board).
- **Several leads and a fiche found**: « konana » → Konan, Konaté, and the
  Onana fiche (drawn on `Main`).
- **A lead through another of its forms**: « jarra » → the chip Jara and the
  line « Jara est une écriture du nom Diarra. » (drawn on `Main` as a
  component). A people lead through an exonym, « felata » → Fellata, makes no
  spelling claim (« Un nom qui ressemble au nom cherché »), with the line
  « Fellata est un des noms de la fiche Peul. ». Held by
  `SearchFeedMisspelling.test.tsx`.
- **A spelling a fiche writes in its text**: « sanoh », one of the Kuranko
  clans and written in the source of the Sanou fiche. No lead is offered: the
  related-only page, unchanged, until the operator answers the DEC-075
  question below. Held by the query layer's tests.
- **No lead, the related-only page, unchanged**: « bukasa » (Mukasa begins
  with another letter) and « chikaya » (Tchicaya does not begin with c).
- **An exact answer, no lead**: « bello » is answered by the fiche Bello; no
  family name is offered beside it, as a lead or as a similar name.
- **A misspelling with no fiche found**: the verdict, the choices and
  « Aller plus loin », with no fiches block and no filters. It is also what
  remains when every fiche found was a lead or a sound-alike.
- **The « Fiches » lens of this state**: brief 12's « Autour de ce nom » alone,
  under « Fiches sur konana », without the leads; unchanged otherwise.

## Do not

- Offer a family-name lead that changes the first letter or scores under 0.4.
- Put a family name in the similar-names shelf (REQ-180).
- Show a score, a similarity or a tier.
- Present the lead as the answer, write that the two spellings are one name,
  or call the lead « proche ».
- Name a lead by its filed name when another of its forms scored, or say that
  a choice is written almost the same way when it is not a family-name lead.
- Ask « Cherchiez-vous… ? » when a fiche the search found writes the typed
  word in its text, a list or a source.
- Take as an example of a misspelling a word any fiche writes, in its text,
  its lists or its sources.
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
> verdict and the choices, the page's one accented action, each named by the
> form that scored, with a line naming the fiche that records a form other
> than its filed name; only family-name leads are said to be written almost
> the same way; under them a reader who writes the name this way can propose
> a source through a quiet link; when the search also found fiches other than
> the choices that the data links to the query, they follow under the
> related-only caution, each with its own line, a fiche reached only by its
> sound being left out; it closes with `further` only and draws no shelf. A
> query a fiche the search found writes in its text is not a typo: it keeps
> the related-only page;

**REQ-201** (**proposed**): a family name that matches the query only by its
sound is also withheld when the search offers a family-name lead beside its
results (DEC-075). **DEC-075**, its tradeoff (« Chukwu stays under REQ-201 »)
follows, and a lead's own fiche is not listed among the fiches found.

**REQ-125** (**proposed**): each lead carries `matchedForm`, the form that
scored, beside its filed name; a client names that form.

**DEC-075, a question for the operator** (**open**): a spelling a fiche
records in its text — « Sanoh » among the Kuranko clans, and in the source of
the Sanou fiche — is it an answer? Until he decides, no family-name lead is
offered beside such a fiche, and the page stays the related-only one
(decision 13). The two ways the review saw:

1. Count an exact word in a fiche's list of clans or names as an answer under
   DEC-075 condition 1. The page could then say « Le nom Sanoh figure parmi
   les clans de la fiche Kuranko. » This needs the API to say which field
   holds the word.
2. Keep the related-only page for such a word, as now, and offer no lead.

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
  first letter differs, Onana for « konana ») is still listed among the fiches
  found, under the caution. Whether the page should tell it apart needs the
  API to say how a row was reached; not decided here.
- The near-miss cartouche of the home search (`NoResultsLeads`, « Vouliez-vous
  dire : ») still names a lead by its filed name and links to its fiche; it
  makes no spelling claim. Whether it should name `matchedForm` too is left to
  its own brief.
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
   A chip names the form nearest to what the reader typed, not the filed
   name, and a line leads from it to the fiche.
6. No block says it is empty: no shelf, no fiches block without a fiche, no
   bar of one filter.
7. Movement III: this state is not an answer; like the unknown name, it ends
   on a way out.

## Comparison with the page

The page was rendered on `next dev` at 430, 768 and 1440 on 2026-10-18. The
local database has no migration 110, so the browser answered
`/api/v2/search` as the query layer now does for « tchikaya » (its unit tests
hold that): Tchicaya as the one result and the one lead, with
`matchedForm` « Tchicaya », Chukwu withheld. Every block box (search field,
eyebrow, name, line, text, choice heading, chip, note, link, « Aller plus
loin » eyebrow and links) has the same position, size, type and colour on the
page and on the board at the three widths. The differences: the board's note,
and the footer (outside this state). The « konana » frame of `Main` is held by
`SearchFeedMisspelling.test.tsx` (the filters, the plural copy, Onana alone
under « La fiche trouvée », « Fiches 1 »), and so are « jarra » and « felata ».

## Approval record

Empty until the operator approves.
