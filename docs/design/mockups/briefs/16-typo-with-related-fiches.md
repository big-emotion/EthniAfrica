# Brief 16 — A misspelling that also finds related fiches

Read [`README.md`](README.md), [`12-unknown-name-fiches-lens-consent.md`](12-unknown-name-fiches-lens-consent.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18 as brief 13, renumbered 16 the same day (pull request
#1832 holds briefs 13 to 15). A review through three lenses (art direction,
doctrine, accessibility) rejected the first drawing; a second review rejected
the redrawing; a third review rejected two points of the third drawing, and
this is the fourth, with the corrections of a fourth, a fifth, a sixth, a
seventh and an eighth review (see « Second review » to « Eighth review »
below). A ninth and a tenth review, then two reviews of pull request #1861,
set what a people lead is scored on; « Tenth review » records all four.
Migration 111 carries the rule, and migration 113 widens its class prefix.
Status: **approved by the operator on 2026-10-18** (see « Approval record »).
Pull request #1835 (ETNI-2092) was merged into recette the same day
(04323b678), before this record was written.
Brief 18 supersedes this brief's origin-eyebrow treatment: unresolved typo and
unknown states have no « D'où vient ce nom » eyebrow.

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
   width: the searched form « tchikaya » as the
   title (doctrine §1.1), « Cherchiez-vous… ? », then « Aucune de nos fiches
   ne porte le nom « tchikaya ». Tchicaya s’écrit presque de la même façon :
   vous pouvez chercher ce nom. »
3. **The choice**, 16 px under the verdict: the small group heading « Un nom
   qui s’écrit presque de la même façon », then the chip « Tchicaya », a new
   search the reader chooses, the only accented object of the page.
4. **The invitation**, under the choice: the note « Si vous écrivez
   « tchikaya », dites-nous où cette écriture est employée. » (caption, soft
   ink) and the quiet link « Proposer une source » (bold, accent ink,
   underlined, 44 px tall, no fill, no border). The link wraps, left-aligned,
   when the text is enlarged, and the note describes it (`aria-describedby`
   on the link, the note's `id`): moving from button to button, a screen
   reader says the source is about the spelling typed, not about the lead
   under the heading above.
5. **The way out**: « Aller plus loin », the peoples and the families.

A note marked as such ends the column: the search also finds the fiche
Tchicaya, which the chip opens; Chukwu is not shown; « muzombo » is the same
state (Mutombo).

`Main` gains a section « Composants · nom mal écrit : verdict, choix, fiches
trouvées (brief 16, proposé) »: the choice chip at rest and focused, beside the
neutral lens pills; the group heading in the singular and the plural, in both
wordings (« s’écrit presque de la même façon », « ressemble au nom cherché »);
a chip that does not bear its fiche's filed name, with its line (« jarra »:
Jara, then « La fiche Diarra donne l’écriture Jara. »); the invitation
(note and quiet link); a night frame (`.dark`) with the chip, the quiet link
and the
accented button of `search-unknown`; one 426 px frame for « tchikaya » (one
choice, no other fiche), one for « konana » (two choices, the filters, and
one other fiche found) and one for the « Fiches » filter of « konana », drawn
as brief 12's lens frames are, under the bar: the title « Fiches trouvées
pour « konana » », then « Une autre fiche trouvée » and its caution, with
the lens groups' top margin (`.ea-fiche-groups`, 8 px). Main measures
26120 px with brief 16.

« konana » is an example the rules produce, taken from the corpus with the
search model of `src/lib/search/__fixtures__/corpusNameModel.ts` and held by
`familyNameLeads.test.ts`: Konan (0.63) and Konaté (0.40) begin like it, each
through its filed name. No fiche writes the word anywhere: not in its text,
not in a list of names or clans, not in its sources (`fichesRecordingWord`).
The search also finds Onana by its spelling (0.44); Onana begins with another
letter, so it is no choice, and the page lists it under « Une autre fiche
trouvée », with its own line and a caution that says only that the search
found it. Only that trigram score ties Onana to the word: nothing in the data
links the two, so the page never calls Onana « liée ». Konan and Konaté stay
choices and are not shown as fiches. The model is not the search: the SQL
stays the authority.

In the page's own copy, every space before « ? », « : », « ; », « ! » and
inside the guillemets is a no-break space (U+00A0), on the boards as in
`src/lib/i18n/copy/searchFeed.ts`. Text the page reads from a fiche keeps the
fiche's spacing: the Onana card on `Main` copies its `shortLine`, which has an
ordinary space before « ; », as many fiche lines do. A pass over the fiche
lines, or one rule for French punctuation at render, is a follow-up (see
« Follow-ups »); editing the board alone would not change what the page
shows.

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
   chip's search already leads to it, and shown again under « Une autre fiche
   trouvée » it would be a second way to the same name, presented as tied to
   the spelling typed. The « Fiches » count leaves it out too. The fiches that
   remain keep a block titled « Une autre fiche trouvée » or « D’autres fiches
   trouvées »: the search also found the choices, so « La fiche trouvée »
   said it found one fiche where it found three. A caution about the spelling
   typed opens it and says only that the search found them: « Nous avons
   aussi trouvé cette fiche, sans établir qu’elle répond à « konana ». ».
   Nothing in the data links these fiches to the spelling (Onana reaches
   « konana » by its trigram score alone), so the caution never calls them
   « liées », as the related-only page does of the fiches it lists. Each card
   carries the line of its matching form, never « Fiche EthniAfrica ». The
   title and the sentence agree with the number of cards. With no such fiche,
   no block is drawn, and no filter bar.
5. **The verdict says only what is true, in the right number.** « Aucune de
   nos fiches ne porte le nom « … ». » speaks of our fiches, not of every name:
   people bear the spelling Tchikaya. A lead is never « proche »: on this site
   the word names a recorded variant (the Tchicaya fiche calls Tschikaya
   « une forme proche de Tchicaya »), and DEC-075 records no spelling
   « tchikaya ». The chip names the form that scored, which migration 110
   returns as `matched_form` (API `matchedForm`) beside the filed name; the
   filed name stands only when a database sends no form. A lead is offered
   only under a form that is one name and that itself scored. The
   self-appellation is split on its commas alone, so a bracket holding a
   comma is cut in two: « Baganda (sg. Muganda, pl. Abaganda) » gives
   « pl. Abaganda) ». A form with a bracket, a slash, a semicolon, a colon, a
   full stop, guillemets, a date, « = » between two words or two names joined
   by « ou » is not scored, so the page offers no lead through it: no chip,
   no line, no « ressemble ». The filed name is always scored, slash included
   (« Baganda / Ganda »), but never stands in for a piece that scored: the
   page would say that a name resembles the query when that name did not
   score. What a people and a family name are scored on is now the rule
   under « Tenth review » (migration 111), which replaces the sentences
   above on cutting and on the filed name. Only a
   family-name lead is said to be written almost the same way: it begins with
   the query's first letter and its named form scores 0.4 at least, so the
   claim is true of what the chip says. One choice: « Tchicaya s’écrit presque de la même
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
   the chips, says only what the data says, which fiche records it: « La
   fiche Diarra donne l’écriture Jara. », « La fiche Koulango donne le nom
   Pakhallas. » (for « pakhalas »). It never ranks one form under
   another (doctrine §1, « none is crowned »): the earlier « Jara est une
   écriture du nom Diarra » made the filed name the name and the Bambara
   writing a spelling derived from it, « un des noms de la fiche » made a
   fiche bear names, and « La fiche Diola donne aussi le nom Ajamataw. »
   made Ajamataw, the name the Diola give themselves, an add-on to Diola, a
   name the Mandinka gave them (PPL_DIOLA, `whyProblematic`). A form two
   fiches record is one search, so one chip, with
   one line per fiche (« icumama »: Ikumama, which the Iteso and Kumam fiches
   both record). The chip and the line name a fiche by its filed name without
   its trailing bracket, the rule migration 110 scores a people's forms by:
   « La fiche Diola donne le nom Ajamataw. » for « ajumataw », never
   « La fiche Diola (Joola / Jola) … », the filed label doctrine §1.1 keeps
   off the page. A chip that names its fiche's filed name, bracket aside
   (Diola for « Diola (Joola / Jola) »), gets no line. The invitation
   and the caution name the spelling typed instead of « ce nom », which read as
   the lead under the chip.
6. **A reader who writes the name this way can say so**, since DEC-075 says a
   sourced spelling restores the name. Under the choice it is a note and a
   quiet link (`.ea-choices-action`, the treatment of `.ea-lens-back`), never
   the accented button of the unknown-name page: there that button is the
   page's one action, here it would be a second one, larger than the chip.
   The code gives it its own classes (`proposeSpellingSource` in
   `SearchFeed.tsx`); `search-unknown` keeps its button. The link wraps
   (`whitespace-normal text-left`: the button primitive holds its label on
   one line, which at 200 % text on a 320 px phone pushed the page sideways),
   and the invitation describes it (`SpellingChoicesBlock` gives the note an
   id with `useId`, the link carries `aria-describedby`). It opens the
   contribution form without the label « Nous nous sommes trompés ? », as
   `proposeSource` does on the unknown-name page: the target is passed with
   its `fieldLabel` cleared, and the form names it « Recherche · tchikaya »
   (`targetLabels["search-query"]` in `src/lib/i18n/copy/reports.ts`), not by
   its internal type.
7. **The choice is the page's one action.** It takes the name chip of `Main`
   (body font, `--afh-text-small` 700, 6 px between chips) with the accent
   (border `var(--accent-ink)`, fill `var(--accent-tint)`), so it stands apart
   from the neutral filter pills. Its text is `var(--accent-foreground)`: the
   tint stays light at night while the page's ink turns light (1.12:1 with
   `--afh-text`, 13.5:1 with `--accent-foreground`). The button of
   `search-unknown` (`.ea-owed-action`) takes the same ink. The chip's border
   differs from that button's `var(--accent)` on purpose: by day the accent
   border is 2.94:1 on the parchment and the fill 1.29:1, while the heading
   above the chip and the link below it are both 16 px bold in accent ink
   (6.01:1). With an accent border, only the fill told « the page's one
   action » apart from those two lines. The accent-ink border is 6.01:1 by
   day and resolves to the night ocre after dark; the unknown-name button
   stands alone in its verdict and keeps its border. Its heading is the
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
  and a people lead (« felata » then, « pakhalas » since the sixth review);
  the query layer's tests hold the API field.

## Fourth review (2026-10-18)

The fourth drawing was reviewed again through the three lenses. The
operator delegated the answers on 2026-10-17; what changed:

- **The line under a chip ranked the names** (doctrine). « Jara est une
  écriture du nom Diarra » made Diarra the name and Jara a spelling of it,
  while the Diarra fiche says the name is written Jàra in Bambara. The line
  now says only which fiche records the form: « La fiche Diarra donne aussi
  l’écriture Jara. », « La fiche Peul donne aussi le nom Fellata. »
  (decision 5; the eighth review drops « aussi »).
- **The amendment drafts left DEC-075 and REQ-125 contradicting the code**
  (doctrine): the lead named by the form that scored, a people lead included,
  and the three cases where no lead is offered beside results. The drafts are
  added under « Proposed amendments ».
- **The form behind « Proposer une source »** (doctrine, accessibility) asked
  « Nous nous sommes trompés ? » and named its target « search-query ». It now
  opens as on the unknown-name page, and names its target « Recherche »
  (decision 6).
- **The link could not wrap and was not tied to its note** (accessibility).
  It wraps, and the note describes it, on the boards, `Main` and the page
  (decision 6, « The boards » item 4).
- **The chip's border** is the accent ink (decision 7).

## Fifth review (2026-10-18)

The final re-review of #1835 read the page against the corpus and the
charter draft. Two points blocked; both are fixed in the boards, this brief
and the code.

- **The line under a chip printed the fiche's bracketed label, and misfired
  on it** (doctrine). Migration 110 scores a people's forms without their
  trailing bracket, so the form that scored is « Diola », while the lead's
  `name` is the filed « Diola (Joola / Jola) ». Compared as they came, they
  differed, and the page would have written « La fiche Diola (Joola / Jola)
  donne aussi le nom Diola. ». 36 of the 657 people fiches are filed with
  such a bracket. The page now drops the trailing bracket from a lead's label
  with the same rule before it compares and before it writes the line
  (`leadLabel` in `SearchFeed.tsx`), and the chip names a lead without one
  when the API sends no form. The « felata » example was also wrong: two
  fiches record Fellata, Peul and Fulbe du Massina, so the page draws two
  lines, the second « La fiche Fulbe du Massina donne aussi le nom
  Fellata. » (decision 5, « States to draw », the REQ-125 draft). The sixth
  review withdrew the example.
- **The fiches found were called « liées » and the charter draft kept only
  fiches « the data links to the query »** (doctrine). No code checks such a
  link: Onana reaches « konana » by its trigram score alone, the very ground
  on which Chukwu was left out. The block is now « Une autre fiche trouvée »
  or « D’autres fiches trouvées », since the search also found the choices,
  and its caution says only that the search found them: « Nous avons aussi
  trouvé cette fiche, sans établir qu’elle répond à « konana ». ». The
  charter draft speaks of the fiches the search found (decision 4, `Main`,
  `fichesFound` in `src/lib/i18n/copy/searchFeed.ts`).

## Sixth review (2026-10-18)

The re-review of #1835 read the page against the corpus again, through the
doctrine lens. Two points blocked; both are fixed in the code, `Main` and this
brief, with the answers the operator delegated.

- **The « Fiches » filter called a fiche found « lié »** (doctrine). Pressed
  on « konana », it drew brief 12's « Autour de ce nom · 1 » and its note
  « Un contexte lié, pas le même nom. » over Onana, under « Fiches sur
  konana », one press away from the caution of « Tout ». Only its trigram
  score ties Onana to the word. The filter of this state now lists the block
  « Tout » shows, « Une autre fiche trouvée » and its caution, under « Fiches
  trouvées pour « konana » » (`lens.fichesFoundTitle` in
  `src/lib/i18n/copy/searchFeed.ts`), with the top margin of brief 12's
  lens groups; `Main` draws it beside the « konana » frame. This filter is
  new with this state, so no board of brief 12 changes: the related-only
  page keeps brief 12's wording, which ETNI-2111 covers.
- **« felata » was a spelling the corpus records** (doctrine). The Peul
  fiche writes « Felata », as François de Medeiros wrote the name Fellata,
  and it notes that Fellata can be used as an insult in Sudan and Chad. The
  example broke two of this brief's « Do not ». It is replaced by
  « pakhalas », which reaches the Koulango fiche through Pakhallas, the name
  the Dioula gave the Koulango; only that fiche records it, and no fiche says
  it hurts. Two more words hold the cases « felata » held: « icumama »
  (Ikumama, which the Iteso and Kumam fiches both record) and « ajumataw »
  (Ajamataw, recorded by the fiche filed « Diola (Joola / Jola) »).
  How the three were checked: a script read every JSON file of
  `dataset/source/afrik`, sources and notes included, with the search's
  fold. None of the three words is a word of any file, the beginning of one,
  or written inside one. The database's French stemmer
  (`websearch_to_tsquery('french', …)`) reduces each to a stem no fiche word
  shares. The model of `corpusNameModel.ts` gives each exactly the leads
  above (0.73, 0.45 and 0.50), no family-name lead, and no filed people or
  family name at 0.4 against the word, the search's own trigram floor. No
  family name shares their consonant skeleton, a rough stand-in for the
  phonetic key, which only the database computes. `familyNameLeads.test.ts`
  holds the model's part, and that the Peul fiche writes « felata ».

## Seventh review (2026-10-18)

The re-review of #1835 modelled pg_trgm over the corpus again, through the
doctrine lens. One point blocked; it is fixed in migration 110, the model of
`corpusNameModel.ts` and this brief. The boards draw none of the queries
concerned, so they do not change.

- **A chip printed a piece of a phrase as a name** (doctrine, decision 5).
  This pull request is the first to print `matched_form`, and migration
  110's people branch had been written for scoring: it splits a
  self-appellation on its commas alone and strips only a trailing bracket.
  Besides the filed names, 240 forms of 190 of the 657 people fiches still
  carry a bracket, a slash, a semicolon or a colon. « abagenda » reaches
  Baganda through « pl. Abaganda) » (0.40), and the page wrote « La fiche
  Baganda / Ganda donne aussi le nom pl. Abaganda). »; « akokolemou » gave
  the chip « Akokolemu) » (Kumam, 0.62), « mukongu » the chip « Bakongo
  (pluriel) / Mukongo » (Kongo, 0.27). No fiche writes these words, so each
  reaches the misspelling page. The REQ-125 draft says the chip names a
  people's filed name, the name it gives itself or one of its exonyms, and
  decision 5 says the line says only what the data says.

  Migration 110 now names a people by the form that scored only when that
  form is one name; otherwise by its filed name, as the rows of migration 094
  did. Scores, rows and order are unchanged. The rule also leaves out 20
  forms that are two names or a sentence (« Yacouba ou Yakuba », « nkop =
  terre », « etc. », « 1995 »): 260 forms of 198 fiches in all. The equal
  sign alone is no mark, since « =|Hoa » writes a click. The chips are now
  « Baganda / Ganda », « Kumam » and « Kongo », each the fiche's filed name,
  with no line. `familyNameLeads.test.ts` holds the three queries and, over
  every form of every people fiche, that no chip is a piece of a phrase;
  the contract test of migration 110 holds that the SQL applies the
  model's pattern.

  One part of the review's proposal is not taken. It asked that no chip for
  the three queries contain a slash. The chip for « abagenda » is the filed
  name « Baganda / Ganda », with its slash: the fiche is filed this way, the
  search showed it so before this pull request, and keeping one side of the
  slash would crown one form over the other (doctrine §1). Splitting the
  singular and plural self-appellations into clean entries is a data fix,
  listed under « Follow-ups »; once done, « abagenda » can name Abaganda.

## Eighth review (2026-10-18)

The re-review of #1835 measured the seventh review's fix through the
doctrine lens. Two points blocked; both are fixed in migration 110, the
model of `corpusNameModel.ts`, the copy, `Main` and this brief, with the
answers the operator delegated. The three boards draw neither point, so
they do not change.

- **The filed name stood in for a piece of a phrase, under a false
  « ressemble »** (doctrine, decision 5). Named by its filed name, a people
  reached only through a piece was offered as « Un nom qui ressemble au nom
  cherché », while that name had not scored: Kumam is 0.00 against
  « akokolemou », Kongo 0.17 against « mukongu », « Baganda / Ganda » 0.19
  against « abagenda », all under the 0.2 floor; the pieces had scored 0.62,
  0.27 and 0.40. The seventh review's draft GWT would have made this a
  requirement. Decision taken: a lead is offered only under a form that is
  one name and that itself scored. Migration 110 no longer scores a people's
  form that is not one name (the same pattern), so a people reached only
  through one is no lead, and the filed name never stands in for it. The
  filed name is still scored, slash included. « abagenda », « akokolemou »
  and « mukongu » offer neither Baganda, Kumam nor Kongo; what they still
  offer is reached through a form that is one name, whose own score clears
  the floor (Abanyarwanda 0.29 for « abagenda », Ankole 0.20 for
  « akokolemou », Tongu 0.27 for « mukongu », in the model). « pakhalas »,
  « icumama » and « ajumataw » keep their leads. This also changes the
  people rows of the similar-names shelf (REQ-180), which read the same
  function: a people reached only through a piece leaves it too.
  `familyNameLeads.test.ts` holds the six queries and, over every form of
  every people fiche, that a chip is the filed name or a form that is one
  name and scores the floor itself; the contract test of migration 110 holds
  the filter and that nothing else of 094 changes. The tenth review replaced
  this list of marks with a positive rule (« Tenth review »): « abagenda »,
  « mukongu » and the filed name now read as written there.
- **« aussi » ranked the name a people gives itself after its filed name**
  (doctrine §1 and §1.1). « La fiche Diola donne aussi le nom Ajamataw. »
  made Ajamataw, the name the Diola give themselves, an add-on to Diola, a
  name the Mandinka gave them (PPL_DIOLA); « La fiche Diarra donne aussi
  l’écriture Jara. » did the same to the Bambara writing. The line drops
  « aussi »: « La fiche Diarra donne l’écriture Jara. », « La fiche Diola
  donne le nom Ajamataw. » (`typoFormOf` in
  `src/lib/i18n/copy/searchFeed.ts`, the `Main` swatch « jarra » and its
  note, decision 5, « States to draw » and the drafts below).

## Tenth review (2026-10-18)

Two reviews of what a people lead is scored on came after #1835 merged.
Migration 110 was by then applied on recette, so their rule is carried by a
new migration, 111, which re-issues `afrik_search_leads` with the same
signature and grants. Migration 110 stays as it was applied. The three boards
and `Main` draw none of the queries concerned, and no line they draw changes.

The ninth review found that the eighth review's list of marks failed both
ways (doctrine §1 and §1.1, decision 5):

- **It dropped clean self-names joined by a slash**, while the filed name was
  always scored: « Izon / Ijo », « Bakongo (pluriel) / Mukongo
  (singulier) », « Bidhaawyeet / Tubdhaawi ». The filed name was ranked above
  the name a people gives itself; « mukongu » offered Tongu, never Kongo.
- **It still scored lists and prose with no mark.** Exonyms were not cut, so
  « Diula, Djula, Doula, Dualas, Dyoula, Dyulanke » became a chip, and
  « bathilly » reached the Dioula fiche through « suivant Abdoulaye
  Bathily », a historian's name.

Its fix, a positive rule, was drafted on a branch that never merged. The
tenth review found two doctrine faults in that draft:

- **It cut at every slash.** A slash inside a word writes a click: « Hai//om »
  gave Hai, « Zhu/'hoasi » Zhu, « G//ana » G. For « zhuhoasi » the page would
  have said « La fiche Ju|'hoansi donne le nom Zhu. », and no fiche gives that
  name.
- **It wanted an upper-case first letter.** That dropped the names peoples
  give themselves in clicks (ǂHoan, Ju|'hoansi, ǃXoon, ǂNūkhoen) and with a
  class prefix (amaXhosa, vaKavango). The ǂHoan and the Ju|'hoansi kept only
  exonyms, among them « Dobe Bushmen ».

A review of pull request #1861 then found the same fault in the rule as first
written here:

- **It dropped the names the Bassari give themselves**, a-liyan (one person)
  and be-liyan (the people), which open on a class prefix joined by a hyphen.
  The Bassari fiche says « Bassari est un nom donné au peuple de
  l'extérieur ». Migration 110 scored a-liyan. Without it, « aliyan » offered
  Alladian first and Bassari second, through the exonym Biyan, so a name
  others gave ranked above the name the people gives itself. The test that
  every people fiche scores a piece of its filed name or of its
  self-appellation still passed, because the filed name Bassari counted.
  Rule 2 below now opens on such a prefix too, and a test holds the
  self-appellation on its own.

A second review of pull request #1861 found the same fault in the cap on the
lower-case class prefix:

- **It dropped the names the two Southern Ndebele peoples give themselves**,
  abakwaManala and abakwaNdzundza (« abakwa- » means « those of the house
  of »). Each opens on a lower-case class prefix of six letters before the
  stem's capital, and the rule capped such a prefix at four. Both fiches cut
  cleanly at the slash of « AmaNdebele / abakwaManala », yet the piece was
  dropped while their exonyms (« Manala Ndebele », « Southern Ndebele ») still
  scored. « abakwamanala » then offered Gwandara through « Abakwa Riga » and
  never the Manala, so a name others gave outranked the name the people gives
  itself. Migration 110 did not score these two names either. The cap was
  arbitrary: over every people piece and every family-name spelling, a cap of
  six, eight or twelve letters, or none, admits exactly these two pieces and
  nothing else. Rule 2 below now allows a prefix of one to eight letters.
  ETNI-2135 could not have repaired it: once moved to a spelling alias, the
  name would still be scored under this same rule.

Pull request #1861 was merged into recette (7ed4bc738) before the fix to that
second finding reached it, so migration 111 is applied with the class prefix
capped at four letters. An applied migration is never edited. Migration 113,
in pull request #1864, re-issues `afrik_search_leads` with the same signature
and grants; its body is 111's, but for the cap, which is now eight letters.
Migration 111 stays as it was applied.

The rule (decision 5; migration 111, with the class prefix of migration 113):

1. Each name field of a people, its filed name, its self-appellation and each
   exonym, is cut into pieces at « , », « ; », the word « ou », and a slash
   only when it stands between spaces (« Baganda / Ganda »). A slash inside a
   word is part of a click spelling (« Hai//om », « Zhu/'hoasi », « G//ana »)
   and never cuts. Separators inside a bracket never cut, and each piece
   loses its trailing bracket.
2. A piece is one name when, trimmed, it has at most three words and holds
   only letters of any script with their combining marks, hyphens,
   apostrophes (' ’), spaces, and the click marks ! | ǀ ǁ ǂ ǃ = / at the start
   of a word or inside it; and when its first word starts with an upper-case
   letter, a letter that has no case (ǂ ǁ ǃ ǀ), a click mark followed by a
   letter (« !Kung », « =|Hoa »), a lower-case class prefix of one to eight
   letters directly followed by an upper-case letter (« amaXhosa »,
   « isiNdebele », « vaKaranga », « abakwaManala »), or a lower-case class
   prefix of one or two letters joined by a hyphen to a lower-case letter
   (« a-liyan », « be-liyan »). Anything else, a lower-case word on its own, digits,
   « pl. », « = » standing alone, guillemets or prose, is not a name and is
   never scored. The hyphenated prefix stops at a lower-case letter. With any
   letter after the hyphen it would also admit twelve « al- » spellings of
   family names (« al-Mahdi », « al-Hawari »): whether those are one name is
   a question for rule 4, not settled here.
3. Only the pieces that are one name are scored. `matched_form` is the piece
   that scored best, and the chip and the line name it. A filed name that did
   not itself score as a piece never stands in for one.
4. A family name keeps its filed name as filed, and each recorded spelling is
   scored only when it passes the same test (« da Costa » does not). Against
   migration 110, this stops scoring eight recorded spellings in seven
   family-name fiches: « da Costa » (Costa), « da Silva » (Silva),
   « al Hawary » and « al-Hawari » (El Hawary), « al-Khaṭṭābī » (Khattabi),
   « al-Nūbī » (Nubi), « al-Nur » (Nur) and « rîfî » (Rifi). Whether an
   « al- » spelling is one name is not settled here: migrations 111 and 113
   leave these eight unscored until the operator decides, so a misspelling of
   « al-nur » can no longer reach Nur through its spelling. Ten more
   recorded spellings fail the test and lose nothing, because each equals
   its fiche's filed name, which is scored as filed: eight « al- » spellings
   (« al-Danagla », « al-Jaʿali », « al-Kabbashi », « al-Mahdi »,
   « al-Mirghani », « al-Rashaida », « al-Rizeigat », « al-Shaygiya »),
   « dos Santos » and « do Espírito Santo ».

In migrations 111 and 113 the combining marks are the accents U+0300 to U+036F, and a
word ends on a letter, an apostrophe or a hyphen, never on a click mark. The
rule replaces what decision 5, « States to draw » (« No lead through a form
that is not one name ») and the REQ-125 and DEC-075 drafts below say a people
or a family name is scored on. Where they disagree, this section holds.

What it changes, measured with the model of `corpusNameModel.ts` over the 659
people fiches, against migration 110 as recette runs it:

- **Scored forms.** 3,668 pairs of a fiche and a form instead of 3,428: 309
  pieces gained in 159 fiches, 69 forms lost in 47. Ten gained: Mukongo
  (Kongo), Izon and Ijo (Ijaw), Bidhaawyeet (Beja), Dyulanke (Dioula),
  Abahutu (Rwandais, Hutu), Hai//om (Haiǁom), Zhu/'hoasi (Ju|'hoansi),
  Nǀhuki (Nǀuu), ʼNǀohan (Taa), vaKavango (Kavango); be-liyan (Bassari),
  abakwaManala and abakwaNdzundza (the two Ndebele du Sud fiches) are gained
  too, and a-liyan, which 110 scored, is kept. The 69 lost are 14
  joined strings now scored piece by piece (« Baganda / Ganda », « Diula,
  Djula, Doula, Dualas, Dyoula, Dyulanke »); 13 names of other peoples read
  from inside a bracket of a group fiche (Wolof and Sereer for Peuples
  atlantiques, Bété and Grebo for Krou); 38 pieces of prose or glosses
  (« suivant Abdoulaye Bathily », « les Iboko », « rivage », « Gens de la
  foret »); and 4 that fail the rule's letter (« Ju–ǂHoan » written with an
  en dash, « Reer Hamar Gibil Madow », and the filed names « Ndebele
  d'Afrique du Sud » and « Peuples autochtones des forêts d'Afrique
  centrale »). Every people fiche keeps a scored piece of its filed name or
  of its self-appellation. Every one that records a self-appellation scores a
  piece of it, but for seven whose value describes the people or packs a
  name with its gloss: `PPL_ATLANTIQUE_MACRO`, `PPL_BENOUECONGO_MACRO`,
  `PPL_GUR_MACRO`, `PPL_KROU_MACRO`, `PPL_BANTU`, `PPL_SAWA` and
  `PPL_HARARI`.
- **Leads.** The 3,512 forms that migration 110 or the rule scores
  (lower-cased, each counted once) are each typed as written, and the three
  rows the function returns for a typed form are compared, a lead being a
  typed form paired with a fiche. The rule gains 532 leads and loses 511. Of
  the 511, 376 still reach 0.2 through a form the rule scores and are only
  pushed out of the three rows; the other 135 no longer reach 0.2 at all.
  Another 284 leads keep their fiche among the three rows under another chip.
  Ten gained: « Gouran » → Kreda through Gourane (0.67), « Batswa » → Sotho-Tswana through Batswana
  (0.60), « Icenwiyen » → Chaoui through Icawiyen (0.46), « Tongwe » →
  Ronga through Tonga (0.44), « Zarma-Songhai » → Songhay Nigérien through
  Songhaiborai (0.42), « Amatabele » → Ndebele du Sud (Manala) through
  AmaNdebele (0.40), « Oromoo » → Arsi through Arsi Oromo (0.38),
  « Baluyia » → Luba (Kasai) through Baluba (0.36), « Krio » → Crioulo de
  Guinée-Bissau through Kriyol (0.33), « Baga-Koga » → Baganda through
  Baganda (0.31). Ten lost: « Seereer » → Peuples atlantiques through Sereer
  (0.75), « Wollof » → Peuples atlantiques through Wolof (0.63), « Bush
  Grebo » → Krou through Grebo (0.55), « Bambete » → Krou through Bété
  (0.44), « Ju|'hoansi » and « ǂHoan » → Peuples Kx'a through « Ju–ǂHoan »
  (0.64, 0.63), « Central Kalahari Bushmen » → Peuples Kx'a through
  « Bushmen du Kalahari septentrional » (0.51), « Amazigh » → Nafusi through
  « Amazigh du Djebel Nafusa » (0.33), « Tigrayens » → Irob through « Saho
  chrétiens du Tigray » (0.30), « Ibo » → Ngala through « les Iboko »
  (0.27).
- **The reviews' words.** « mukongu » gives Kongo through Mukongo (0.60),
  « dyoulanke » Dioula through Dyulanke (0.58), « zhuhoasi » Ju|'hoansi
  through Zhu/'hoasi (0.58), « juhoansi » Ju|'hoansi (0.58); « bathilly » no
  longer reaches Dioula. No chip is Hai, om, Zhu or G. « pakhalas » keeps
  Koulango through Pakhallas (0.73) and also offers Dioula through Dualas
  (0.23). « abagenda » never goes through « pl. Abaganda) »: its third row is
  now Bugakwe through « /anda » (0.27), a click spelling that fiche records,
  and Baganda scores 0.21 through Baganda, below. « akokolemou » offers no
  Kumam; it now offers Bakossi through Akose (0.21). « aliyan » gives
  Bassari first through a-liyan (0.50), above Alladian through Alladyan
  (0.33), and « beliyan » Bassari through be-liyan (0.55). « abakwamanala »
  gives the Manala first through abakwaManala (1.00) and « abakwandzundza »
  the Ndzundza first through abakwaNdzundza (1.00); before, both offered
  Gwandara through « Abakwa Riga » first. « jarra », « icumama » and
  « ajumataw » keep their leads and their lines.
- **Family-name spellings.** Of the 1,123 recorded spellings in the 776
  family-name fiches, 18 fail the rule: eight that 110 scored and 111 and 113
  no longer score, and ten that equal their filed name and lose nothing. Rule
  4 names all eighteen.
- **What 113 changes from 111.** Two pieces, abakwaManala and abakwaNdzundza,
  in two fiches, and nothing lost: 5,345 pieces become 5,347.

How it was checked. `familyNameLeads.test.ts` holds the words above, among
them the two Ndebele self-names and a one-letter slip of each, and,
over every name field of every people fiche, three things: every form a lead
can be named by is one name, by a check written letter by letter apart from
the model's pattern; every piece that is one name is scored; and every
people fiche scores a piece of its filed name or of its self-appellation.
A fourth test holds that every people fiche that records a self-appellation
scores a piece of it, the filed name left out, but for the seven fiches
named above, a list it holds exactly. The contract test holds that the
latest definition of the function applies the model's two patterns, that 111
stays as applied with a prefix capped at four letters, and that 113 executes
111's function and grants with that cap raised and nothing else. Run by
PostgreSQL 17's own regular expressions over every people name field and
recorded spelling, the patterns as written in migration 113 give the model's
5,347 pieces exactly under the en_US.UTF-8, ICU and builtin C.UTF-8
collations, and 264 fewer under C. Verification 6 of migration 113 checks the
database's character type on recette and on production. The model splits a word at
ǂ ǁ ǃ ǀ, which PostgreSQL reads as letters, so its scores for click names are
close, not exact.

What ETNI-2135 covers, and what it does not. ETNI-2135 gives each name of a
packed name field an entry of its own, moves a qualifier into the fiche's
prose, scores a people's spelling aliases under this same rule, and makes
the corpus check refuse a name field with a slash, a semicolon, a comma or
« ou » between names. That rewrites the two names joined by a slash with no
space, one piece each here (« Gullah/Geechee », « Drawi/Drawa »), the packed
glosses (« Habitants du Burundi / peuple du Burundi », « … ; Garifuna au
singulier », « Crioulo, Upper Guinea ») and the self-appellations of the
seven fiches named above. It starts from the body of migration 113, the
latest, under the next free number after 113, not from 110's or 111's, and
applies the pattern of rule 2 to each spelling alias. Its corpus check allows
a name of four words where rule 2 allows three; the ticket settles it by
raising the limit in its migration to four words, after measuring what the
fourth word adds, so that one limit governs both. It also moves the colon
lists of the group fiches (`PPL_SAHARIEN_MACRO`: Zaghawa, Teda, Kanembu;
`PPL_NGUNI`: amaXhosa, emaSwati) into prose. Migration 113 still scores those
pieces as forms of the group: « zagawa » ranks Peuples sahariens above
Zaghawa, and « amaxosa » Nguni above Xhosa. The ticket removes both. It does not cover these, and no ticket tracks them yet:

- **Glosses written as a whole entry** that open on a capital and have three
  words or fewer: « Peuples de l'eau », « Gens du Nil », « Omani de
  retour », « Central Sudanic languages ». ETNI-2135's check allows them, and
  they pass this rule, so they are scored.
- **« Ju–ǂHoan » and « Reer Hamar Gibil Madow »**, which fail this rule's
  letter (an en dash; four words). ETNI-2135's check accepts both as
  written. With the four-word limit above, only « Reer Hamar Gibil Madow »
  would then be scored.
- **The two long filed names** above: ETNI-2135 leaves filed names out of
  its scope.
- **The Harari self-name in Ge'ez script**, ጌ፞ይ ኡሱኣች. Its mark U+135E is
  not among the accents U+0300 to U+036F that this rule reads, so written on
  its own, without its gloss, it would still fail here.
- **The Coptic self-name « ⲣⲉⲙⲛ̀ⲭⲏⲙⲓ »** (`PPL_COPTES`, « remenkhēmi »). Coptic
  is written in lower case, and a name in a script that has case must open
  on a capital, or on a class prefix, to pass this rule. The semicolon cuts
  it cleanly from « Aqbāṭ », which scores; the Coptic name then fails. Readers
  are unlikely to type Coptic, and the Copts keep Aqbāṭ.

## States to draw

Only the first is drawn as a board; the others are held by tests or drawn on
`Main`.

- **One lead, no other fiche**: « tchikaya » → Tchicaya, as drawn.
- **Same state**: « muzombo » → Mutombo (a note on the boards, no new board).
- **Several leads and another fiche found**: « konana » → Konan, Konaté, and
  the Onana fiche under « Une autre fiche trouvée » (drawn on `Main`).
- **A lead through another of its forms**: « jarra » → the chip Jara and the
  line « La fiche Diarra donne l’écriture Jara. » (drawn on `Main` as a
  component). A people lead through an exonym, « pakhalas » → Pakhallas, the
  name the Dioula gave the Koulango, makes no spelling claim (« Un nom qui
  ressemble au nom cherché ») and draws the line « La fiche Koulango donne
  le nom Pakhallas. ». A form two fiches record, « icumama » →
  Ikumama, draws one chip and two lines: « La fiche Iteso donne le nom
  Ikumama. » and « La fiche Kumam donne le nom Ikumama. ». A fiche filed
  with a bracket, « ajumataw » → Ajamataw, the name the Diola give
  themselves: « La fiche Diola donne le nom Ajamataw. », without the
  bracket of « Diola (Joola / Jola) ». No fiche writes any of the three typed
  words, held by `familyNameLeads.test.ts`; the page is held by
  `SearchFeedMisspelling.test.tsx`.
- **A lead through its filed name, bracket aside**: « diolla » → the chip
  Diola, the form migration 110 scores for the fiche filed « Diola (Joola /
  Jola) », and no line. Held by `SearchFeedMisspelling.test.tsx`.
- **No lead through a form that is not one name**: « akokolemou » would
  reach Kumam only through « Akokolemu) », a piece of « Kumam (ou
  Ikokolemu, Akokolemu) ». The piece is not scored and Kumam scores 0, so
  the Kumam fiche is no lead: no chip, no line. « abagenda » offers no
  Baganda (« pl. Abaganda) »), « mukongu » no Kongo (« Bakongo (pluriel) /
  Mukongo »), the same way. Each still offers the peoples it reaches through
  a form that is one name, named by that form. Held by
  `familyNameLeads.test.ts` and the contract test of migration 110. Since
  the tenth review, « akokolemou » still offers no Kumam, but « mukongu »
  offers Kongo through Mukongo, and « abagenda » reaches Baganda through
  Baganda below its three rows, never through « pl. Abaganda) » (« Tenth
  review »; migration 111).
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
- **The « Fiches » lens of this state**: the block « Tout » shows, « Une autre
  fiche trouvée » or « D’autres fiches trouvées » with its caution, under the
  title « Fiches trouvées pour « konana » », without the leads (drawn on
  `Main`). Brief 12's « Autour de ce nom » and its note « Un contexte lié, pas
  le même nom. » stay on the related-only page, whose wording ETNI-2111
  covers. Held by `SearchFeedMisspelling.test.tsx`.

## Do not

- Offer a family-name lead that changes the first letter or scores under 0.4.
- Put a family name in the similar-names shelf (REQ-180).
- Show a score, a similarity or a tier.
- Present the lead as the answer, write that the two spellings are one name,
  or call the lead « proche ».
- Name a lead by its filed name when another of its forms scored, or say
  that a choice is written almost the same way when it is not a family-name
  lead.
- Print a fiche's filed label with its trailing bracket in a chip or a line.
- Print a piece of a phrase as a name: « pl. Abaganda) », « Akokolemu) »,
  « Yacouba ou Yakuba », or offer a lead through one under another name.
- Write « aussi » in the line under a chip: it sets the form after the
  filed name.
- Call the fiches found « liées », in « Tout » or under the « Fiches » filter,
  or keep them on a link the data does not hold.
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
> form that scored, a form that is not one name being neither scored nor
> offered, with a line naming the fiche that records a form other
> than its filed name, a fiche being named without the trailing bracket of
> its filed name; only family-name leads are said to be written almost the
> same way; under them a reader who writes the name this way can propose a
> source through a quiet link; when the search also found fiches other than
> the choices, they follow as other fiches found, under a caution that says
> only that the search found them, never that they are linked to the query,
> each with its own line, a fiche reached only by its sound being left out,
> and the `fiches` filter lists them the same way, under a title that says
> only that the search found them;
> it closes with `further` only and draws no shelf. A query a fiche the
> search found writes in its text is not a typo: it keeps the related-only
> page;

Decision 4 changes what REQ-201, DEC-075 and ETNI-2092 say today: all three
keep Chukwu among the fiches for « tchikaya ». The code already follows the
drafts below. They are published together with the operator's approval of
these boards, before #1835 merges: the two Confluence pages as Pending
amendments through `/ethniafrica-spec`, which publishes only on the
operator's own confirmation, then the ticket.

**REQ-201** (**proposed**), appended to its statement: « A family name that
the search reaches only through its phonetic key **must not** be returned
either, nor counted in any lens total, when the search offers a family-name
lead beside its results (DEC-075). » New GWT: given « tchikaya », which nothing
answers exactly, Chukwu, which reaches it only through the phonetic key, and
Tchicaya, offered as a lead, when the search runs, then Chukwu is not
returned and no count includes it; given a search whose only results reach
the query by sound and a family-name lead, when the search runs, then it
returns no result and its leads mix every kind. The « Keyta » block changes
how Keïta is reached, not whether: Keïta records the spelling Keyita (0.44
against « keyta », same first letter), so « keyta » gets Keïta as its lead,
and Keïta, which reaches « keyta » only through its sound, leaves the
results. The block becomes « then « Keïta » is still reached, as `REQ-135`
GWT 1 requires: among the results, or as the family-name lead when the
search offers it as one ».

**DEC-075** (**proposed**), its tradeoff « For « tchikaya », Chukwu stays
among the related fiches… This decision does not change that » becomes:
« Once a family-name lead is offered beside results, the family names that
reach the query only by their phonetic key are withheld from the results and
the totals (REQ-201 as amended): for « tchikaya », Chukwu is no longer
returned. The lead already offers the spelling the key was bridging, and
nothing in the data links Chukwu to Tchicaya. The result page also leaves a
lead's own fiche out of the fiches found (brief 16). » Under « Requirements
satisfied », REQ-201's statement is amended, no longer « unchanged ».

**ETNI-2092**, « Out »: « `afrik_search_patronymes` and REQ-201's
phonetic-only rule are unchanged; Chukwu stays among the fiches for
« tchikaya » » becomes « `afrik_search_patronymes` is unchanged: the query
layer reuses migration 108's `p_exact_elsewhere` switch. REQ-201 as amended
(brief 16) withholds the sound-only family names beside a family-name lead,
so Chukwu is no longer returned for « tchikaya ». »

**REQ-125** (**proposed**), appended: « Each lead carries `matchedForm`, the
form that scored, beside its filed name; a client names that form. A lead is
offered only under a form that is one name and that itself scored: a
people's form that is not one name, a piece of a phrase the
self-appellation was cut into, is not scored, and its filed name never
stands in for it. » New GWT: given « jarra », which reaches Diarra only
through its recorded spelling Jara, when the search offers Diarra as a lead,
then the lead's `matchedForm` is Jara and the page names Jara, with the line
« La fiche Diarra donne l’écriture Jara. ». Given « akokolemou », which
would reach the Kumam fiche only through « Akokolemu) », a piece of its
self-appellation « Kumam (ou Ikokolemu, Akokolemu) », when the search runs,
then the Kumam fiche is not offered as a lead, and no chip or line names
Kumam or a piece of its self-appellation. **DEC-075** (**proposed**), a further condition while the
question below is open: « No family name is offered as a lead while a fiche
the search found writes the typed word in its own text » (decision 13).

**DEC-075** (**proposed**), its Decision: « … and is offered under its filed
name, as migration 094 does for a people » becomes « … and is offered under
the form that scored (`matched_form`), with a line naming the fiche that
records it, by its filed name without a trailing bracket, when that form is
not its filed name; this also applies to a people lead, and a people's form
that is not one name is not scored, so no lead is offered through it ». The
chips name `matchedForm`, and the line under a chip says only which fiche
records the form, never « aussi »: for « jarra », the chip Jara and the line
« La fiche Diarra donne l’écriture Jara. »; for « ajumataw », the chip
Ajamataw and the line « La fiche Diola donne le nom Ajamataw. ». « Do not »
forbids naming a lead by its filed name when another of its forms scored: as
published, the sentence says the opposite.

**REQ-125** (**proposed**), its added statement: after « must be offered even
when the search found related fiches », add « unless a fiche the search found
writes the typed word in its own text (DEC-075, open question), the search is
scoped to a country or a family, or it was widened word by word ». The code
withholds the lead in these three cases (`offerFamilyNames` in
`src/lib/supabase/queries/afrik/search.ts`). New GWT, one per case:

- given « sanoh », which the Kuranko fiche counts among its clans and which
  the source of the Sanou fiche writes (« Notice SANOU / SANOH / SANON »),
  when the search finds those fiches, then no family-name lead is offered,
  Sanogo and Sanou are not presented as the name the reader meant, and the
  page is the related-only one;
- given « tchikaya » searched with the country filter `COG`, when the search
  runs, then no family-name lead is offered, and the page stays the relation
  browse its filter asked for;
- given the two-word query « hausa egypte », which no entry answers whole and
  which the search widens word by word to Hausa and Égypte, when the search
  runs, then no family-name lead is offered, even one close to the whole
  phrase.

**REQ-125** (**proposed**): « Peoples, countries and linguistic families keep
their near misses as before » becomes « Peoples, countries and linguistic
families keep their near-miss scan and its 0.2 threshold, with no
first-letter rule, as before; their chip names the form that scored (for a
people, its filed name, the name it gives itself or one of its exonyms, a
form that is not one name being left unscored; for a country or a family,
its name), with the line naming the fiche that records
it when that form is not its filed name, named without the trailing bracket
of its filed name ». The same sentence in DEC-075 takes the same wording.
New GWT, the typed words being written by no fiche:

- given « pakhalas », which reaches the Koulango fiche only through
  Pakhallas, the name the Dioula gave the Koulango, when the search offers
  the Koulango fiche as a lead, then the chip names Pakhallas, the line « La
  fiche Koulango donne le nom Pakhallas. » follows it, and nothing says
  it is written the same way;
- given « icumama », which reaches the Iteso fiche and the Kumam fiche
  through Ikumama, which both record, when the search offers both as leads,
  then one chip names Ikumama, with one line per fiche, « La fiche Iteso
  donne le nom Ikumama. » and « La fiche Kumam donne le nom Ikumama. »;
- given « ajumataw », which reaches the fiche filed « Diola (Joola / Jola) »
  through Ajamataw, when the search offers it as a lead, then the line reads
  « La fiche Diola donne le nom Ajamataw. », without the bracket.

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

Listed for their own briefs, not changed here. Approving these boards does
not approve the shared chrome they draw as it stands: the focus states (the
search input, the lens pills, the « Aller plus loin » links) and the layout
listed below (« Aller plus loin » without a heading or a list, the header at
320 px) stay to be decided in their own briefs.

- The shared eyebrow « D'où vient ce nom » on the pages with no answer (also
  a question standing for a title; resolved by brief 18).
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
- Decision 13 does not see a form a fiche records only in its name history
  (`formAsWritten`, as « Felata » in the Peul fiche): the people search
  vector (migration 060) does not read the name history, so such a form,
  typed, does not find that fiche by its text, and the page can still offer
  it a lead as a misspelling. Not decided here.
- Many people fiches write several names in one self-appellation:
  singular and plural (« Baganda (sg. Muganda, pl. Abaganda) », « Bakongo
  (pluriel) / Mukongo (singulier) », Kuba, Tsonga), a bracket of other names
  (« Kumam (ou Ikokolemu, Akokolemu) »), names joined by « ou » or a slash
  (« Yacouba ou Yakuba », Ngizim). Migration 110 does not score these
  pieces, so a people reached only through one is no lead (eighth review).
  Splitting them into clean entries is a data ticket, to be filed: then
  « abagenda » could reach Baganda through Abaganda, and « akokolemou »
  Kumam through Akokolemu.
- Some trailing brackets tell two fiches apart rather than give other names:
  « Rwandais (Tutsi) » and « Rwandais (Hutu) », « Luba (Katanga) » and
  « Luba (Kasai) ». Without the bracket, a line about either reads « La
  fiche Rwandais » or « La fiche Luba ». Telling the two kinds of bracket
  apart needs the corpus to mark which is which; not decided here.
- The near-miss cartouche of the home search (`NoResultsLeads`, « Vouliez-vous
  dire : ») still names a lead by its filed name and links to its fiche; it
  makes no spelling claim. Whether it should name `matchedForm` too is left to
  its own brief.
- The night ink of `.ea-owed-action` also changes the day ink of the
  `search-unknown` button from `--afh-text` (#2c2018) to
  `--accent-foreground` (#1a1208), a difference no reader sees; the boards
  record it.
- Many fiche lines (`shortLine`) have an ordinary space before « ; » or
  « : », so the sign can wrap alone onto the next line when the text is
  enlarged (the Onana card). A no-break-space pass over the fiche lines, or
  one rule for French punctuation at render, needs its own ticket.

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
   A chip names the best-scoring of the forms migration 110 scores, which
   are one name each or the filed name, and a line leads from it to the
   fiche without « aussi ».
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
the « Aller plus loin » links (14 px on the boards, 13 px on the page, listed
under « Follow-ups »), and the footer (outside this state). Measured again
after the fourth review, at 430, 768 and 1440: the chip's border is the
accent ink on both (rgb(131, 85, 20) by day, the night ocre rgb(201, 130, 31)
after dark), the link wraps left-aligned on both, and its description is the
invitation on both. At 320 px with the link's text at 32 px, it takes two
lines inside its 272 px column and the page does not scroll sideways. The
form it opens names « Recherche · tchikaya » and does not ask « Nous nous
sommes trompés ? ». The « konana » frame of `Main` is held by
`SearchFeedMisspelling.test.tsx` (the filters, the plural copy, Onana alone
under « Une autre fiche trouvée », « Fiches 1 », and its « Fiches » lens),
and so are « jarra », « pakhalas », « icumama », « ajumataw » and
« diolla ».

After the sixth review, the « Fiches » filter of « konana » was rendered on
`next dev` at 430, 768 and 1440, the browser answering `/api/v2/search` the
same way. The title sits 24, 32 and 48 px under the bar; « Une autre fiche
trouvée » 32, 40 and 56 px under the title, where the approved
`search-state-fiches` boards set their first group; the caution 4 px under
it, the Onana card 12 px under the caution, and « Revenir à la réponse » 24,
32 and 48 px under the card. The type and colours are those of the boards
(title 27.6, 33.1 and 40 px Fraunces 900; group heading 16 px bold in the
accent ink; caution 13 px in the soft ink). The page writes neither « lié »,
« Autour de ce nom » nor « Fiches sur », and does not scroll sideways. Before
the fix, the group sat 8 px higher than on brief 12's boards: the block now
keeps the lens groups' top margin (`mt-afh-md`, `.ea-fiche-groups`).
« pakhalas » was rendered the same way at the three widths: the chip
Pakhallas, the line « La fiche Koulango donne aussi le nom Pakhallas. », no
spelling claim (« aussi » was dropped by the eighth review).

The seventh review changed what migration 110 returns, not the page's code
or the boards: for the same answer of `/api/v2/search`, the page draws what
it drew. A chip that names its fiche's filed name gets no line, as
« diolla » shows, which `SearchFeedMisspelling.test.tsx` holds. The page was
not rendered again for this review.

After the eighth review, « jarra » and « ajumataw » were rendered on
`next dev` at 430, the browser answering `/api/v2/search` with the lead the
query layer sends (Jara for Diarra, Ajamataw for the fiche filed « Diola
(Joola / Jola) »). The lines read « La fiche Diarra donne l’écriture
Jara. » and « La fiche Diola donne le nom Ajamataw. », 8 px under the chip,
13 px 400 in the soft ink (rgb(116, 101, 87)), on one line, as on the
`Main` swatch « jarra », whose line now reads the same; the page does not
scroll sideways. `Main` still measures 26120 px: its note says « sans
« aussi » » in the same number of lines. The three boards draw no such line
and do not change. The boards draw family-name leads only, which the
migration's change to the people branch does not touch.

## Approval record

To be approved with the boards (« Proposed amendments »):

- Charter §3 ter, the exceptional states.
- REQ-201: the sound-only family names withheld beside a family-name lead,
  and its « Keyta » block.
- DEC-075: its tradeoff on Chukwu; its Decision, a lead offered under the
  form that scored, a people lead included, never through a form that is
  not one name, with a line that never says « aussi »; its further
  condition while the « sanoh » question is open.
- ETNI-2092, « Out ».
- REQ-125: `matchedForm` and the « jarra » GWT; a lead offered only under a
  form that is one name and that itself scored, with the « akokolemou »
  GWT; the three cases where no lead is offered beside results, with the
  « sanoh », « tchikaya » with `COG` and « hausa egypte » GWT; the peoples,
  countries and families keeping their scan and their 0.2, named by the form
  that scored, with the « pakhalas », « icumama » and « ajumataw » GWT.

Approving the boards does not approve the shared chrome focus states and
layout listed under « Follow-ups ».

**Recorded 2026-10-18.** The operator approved the boards in chat on
2026-10-18 (« J'approuve les maquettes »), while they were being redrawn after
the first review. As announced to the operator the same day, the approval
applies to the redrawn boards: the three `search-state-typo` boards and the
brief 16 section of `Main`, as they stand in this repository.

- Charter §3 ter is replaced word for word in
  [`search-result-charter.md`](../../search-result-charter.md), with a dated
  note.
- REQ-201, DEC-075 and REQ-125: the drafts are published on Confluence as
  Pending amendments. Moving them to Approved stays the operator's, in
  Confluence.
- The people branch's one-name rule, as set under « Tenth review », is not in
  the code #1835 merged: recette runs migration 110 as merged with #1835
  (head db5583eed). Migration 111 carries the rule, in pull request #1861
  (ETNI-2092), and migration 113 widens its class prefix to eight letters, in
  pull request #1864.
