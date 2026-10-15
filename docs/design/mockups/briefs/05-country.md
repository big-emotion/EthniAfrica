# Brief 5 — The country fiche

Read [`README.md`](README.md) first.

**Board to change** (at `-430`, `-768`, `-1440`): `country-civ`, about
9,999 px tall at 430 px (11 screens).

**Surface.** `/fr/atlas/pays/[slug]`. The older `../pages/pays.html` is superseded by the canvas board.

**Why.** Countries are the best-visited type (33 of 54, 61 %) and the worst
dead end: `pays/CIV` has 7 visitors, **100 % bounce after 73 % scroll and 107 s**.
Côte d'Ivoire is the second visiting country of the audience (40 visitors in
30 days), so these readers are the diaspora the doctrine names. They read the
whole page and have nowhere to go. Also `pays/KEN` (exit 60 %) and `pays/COG`.
All 54 countries date their attestations across six named eras (charter §5), so
the country is the one type where "Through time" is fully fillable today.

## Subject: `CIV`

Real data: the name *Côte d'Ivoire* designates a West African country that names
itself so and has asked, since 1985, that the name not be translated. It first
designated a stretch of coast, in European writings. Names: *Côte d'Ivoire* (10
accounts), *Côte des Dents* (4), *Costa de Malagens* (5), *Côte de Quaqua* (5),
*Établissements français de la Côte d'Or* (2). Source types: academic, archive,
intergovernmental. The fiche also carries `nameOfficial`, `etymology`,
`nameOriginActor`.

## Blocks, mobile 430 px

1. Verdict, the 1985 request included.
2. Who named whom: the five names; this is the strongest "named from outside"
   case in the corpus (European traders naming a coast by what they bought),
   shown as accounts, never as a verdict on the colonisers.
3. The sources speak.
4. **Type-specific: the country across time** — the six eras as a compact
   horizontal band at 430 px (one era open at a time), with « Pendant ce temps,
   ailleurs » anchors behind a button, African name always the subject.
5. **Type-specific: peoples and borders** — the peoples of the country as
   names, with the fragmentation (a people cut by a border) told in one
   sentence. The globe moves down and opens on tap.
6. Closing band.
7. Next step: **a name, not a country list** — *Bouët-Willaumez* and the
   people names of the coast. A social post (`bouet-willaumez-a-t-il-invente-la-cote-divoire`)
   already sends visitors here: the board must make that arrival land.

## States to draw

Rich (`CIV`), a country whose name has a single account, a country whose current
name is recent (*Soudan du Sud*, `SSD`), and two countries sharing a name
(`Congo`: former names in time, each country's peoples by share, the unsplit
percentage declared).

## Do not

- End on a list of other countries.
- Show borders as ancient: the audit calls them "mostly drawn less than 140
  years ago"; the board draws them as recent.

## Approved boards (2026-10-15)

Recorded in `docs/design/mockups/site/`. The implementation reproduces them.
The hero, the chapter bar, « Peuples du pays », « Langues », the era chips,
the political entities, « Culture et société » and the sources list are
unchanged, except where noted.

- `country-civ`, at 430, 768 and 1440, is the rich state. The rows of
  « L'histoire des noms » are the five names of the sourced history (Côte
  d'Ivoire, Côte des Dents, Costa de Malagens, Côte de Quaqua, Établissements
  français de la Côte d'Or). A name whose origin the sources tell in several
  ways folds its readings under its row (« 3 explications » on Côte de
  Quaqua), in the readings grid of `language-lingala`. « Les sources parlent »
  follows « En bref » in the fiche variant: « Qui raconte les noms de ce
  pays ? » (marked as a proposal), 26 accounts of 5 names, Côte d'Ivoire open.
  The population carries « UNFPA, 2025 ». The official name is shown once.
  The amend band goes; the closing band precedes « Poursuivre avec un autre
  nom », which offers Akan (people) then Yamoussoukro (place).
- `country-state-civ-quaqua` (new): the row Côte de Quaqua open on its three
  undated readings.
- `country-state-thin-gab` (new): one name, eight accounts, 2,600,000
  inhabitants (UNFPA, 2025), two silences, Fang then Punu as next names (no
  place in Gabon has a summary).
- `country-state-shared-congo` (new): a note under the names saying that two
  countries bear the name Congo and are different countries, both named
  after the river; next names: the Democratic Republic of the Congo, then the
  Kongo people.
- `ea-live.css` gains the folding row (`.ea-form-readings`).

Silences on `country-civ`: no oral account for the names of the country; no
trace of Côte d'Ivoire older than 1670; the three explanations of Côte de
Quaqua are not dated. The 4 % not shared out among peoples stays in
« Peuples du pays » only.

Decisions taken in review:

1. « Les sources parlent » sits after the whole « En bref » block.
2. Only a name with several explanations folds, labelled « N explications ».
3. A group of explanations with no date at all gives one silence line.
4. Yamoussoukro stays as the next place despite a thin first sentence; a
   country with no place that has a summary offers a second people.
5. States are block-only boards inside the country frame; the Congo note
   reuses the approved language and people note.

Found while drawing, left to the corpus:

- The official-name field repeats itself on `CIV`, `GAB` and `COG`
  (« République de Côte d'Ivoire (République de Côte d'Ivoire) »).
- « Guinée française et dépendances » is in the former-names list of « En
  bref » but not a name of the history (the 1891 account cites it).
- `GAB`: the etymology field says « gabardine » and the fifteenth century;
  the sourced history says « caban » and dates the oldest trace about
  1505-1508.
- Costa de Malagens has one origin in the data (the 1475 wreck); the bad
  reputation account is an imposition account, not a competing origin.
- The counts: « 6 peuples » counts the major peoples, « Autres peuples »
  included; the bar's 5 are the groups with a share; « 121 noms » is 47
  attested names plus 74 carried by the country's peoples.
- The Bouët-Willaumez entry: the first screen at 430 shows an origin of the
  name but not the answer; the 1842-1843 account (his treaties do not name
  the country) is reachable only in « Les sources parlent ».

Length proposal, measured at 430, for a later decision: remove « D'où vient
le nom » under « Histoire » and the Portrait preview (about 300 px), fold the
A to Z index of family names behind « 47 noms attestés » (about 2,300 px),
fold the five political entities to their names (about 600 px), fold
« Culture et société » to its headings (about 700 px). The sources are
already folded.
