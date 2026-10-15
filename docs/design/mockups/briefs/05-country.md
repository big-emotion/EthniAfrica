# Brief 5 — The country fiche

Read [`README.md`](README.md) first. Briefs 1 to 4 are approved and
implemented; this brief reuses their components instead of redrawing them (see
"Approved boards" in [`01-result-page-timeline.md`](01-result-page-timeline.md),
[`02-people.md`](02-people.md), [`03-language.md`](03-language.md) and
[`04-language-family.md`](04-language-family.md)): the fiche variant of « Les
sources parlent » and its single-name form, the closing band « Ce que nous ne
savons pas encore », « Poursuivre avec un autre nom », the competing readings
grid under the name chips, figures that carry their caveat under them, and the
rule that an empty chapter disappears and its silence goes to the closing band.

**Board to change** (at `-430`, `-768`, `-1440`): `country-civ`. `Main` changes
only if a shared component does.

**Surface.** `/fr/atlas/pays/[slug]`. The older `../pages/pays.html` is
superseded by the canvas board.

**Why.** Countries are the best-visited type (33 of 54, 61 %) and the worst
dead end: `pays/CIV` has 7 visitors, **100 % bounce after 73 % scroll and 107 s**.
Côte d'Ivoire is the second visiting country of the audience (40 visitors in
30 days), so these readers are the diaspora the doctrine names. They read the
whole page and have nowhere to go. Also `pays/KEN` (exit 60 %) and `pays/COG`.
A social post (`bouet-willaumez-a-t-il-invente-la-cote-divoire`) already sends
visitors here.

## What is on the board today (checked 2026-10-15)

`country-civ`, in order, at 430 px (about 9,999 px tall, 11 screens):

1. Hero plate: the name, the official name, « Voir la carte », trail, chapter
   bar.
2. **En bref** — a review chip (« 6 informations présentées »); **L'histoire des
   noms** with « D'où viennent ces noms ? » (one sentence and « Lire la suite »)
   and a list of former names; the figures (Habitants 32 700 000, Peuples 6,
   Langues 15, Familles linguistiques 7, Noms 121); a stray sentence about
   *Godié*; **Portrait**.
3. **Peuples du pays** — 32.7 M inhabitants (2025), five peoples with shares
   (42, 17, 16, 11, 10 %), and « Les peuples documentés ici représentent 96 % de
   la population du pays ».
4. **Langues** — official language, other languages.
5. **Histoire** — « D'où vient le nom » again, era chips (Précolonial, Colonial,
   Contemporain), « 5 entités politiques », then Royaume de Kong, Colonie de
   Côte d'Ivoire, République de Côte d'Ivoire.
6. **Noms de personnes rattachés à ce pays** — 47 family names attested in the
   country as an A–Z index, and a second group carried by the country's peoples
   (61 links in all).
7. **Culture et société** — Religions, Modes de vie, Organisation, Relations,
   Traditions.
8. **Poursuivre** — three links (Akan, Kwa, Voltaïques / Gur), no reason given.
9. Sources, with the list folded.

Where the text is, in characters: En bref 1,014, Culture et société 1,061,
Histoire 784, Noms de personnes 723, Peuples 492, Sources 590. The text is
short; the height comes from the 61 name links and from the fold state, not
from prose.

## What the data and the rules show on this board, to report

- **The origin of the name is told three times.** « En bref » opens on
  « D'où viennent ces noms ? », « Portrait » says the name is that of a
  merchandise, and « Histoire » starts with « D'où vient le nom », where the
  sentence « Le nom Côte d'Ivoire renvoie au commerce de l'ivoire pratiqué le
  long du littoral » appears word for word as in « En bref ». Report it;
  **propose** which to keep, do not apply it.
- **Two lists of former names disagree.** « En bref » lists four (Tand Kust,
  Établissements français de la Côte d'Or, Guinée française et dépendances,
  Colonie de Côte d'Ivoire) from an older field. The sourced history holds five
  names: Côte d'Ivoire, Côte des Dents, Costa de Malagens, Côte de Quaqua,
  Établissements français de la Côte d'Or. Costa de Malagens and Côte de Quaqua
  are in the history and not in the list; Guinée française et dépendances is
  in the list and not in the history. Report it; show the sourced history, and
  do not invent accounts for the missing one.
- **Counts differ.** « Peuples 6 documentés ici » against « 5 peuples » below it,
  « Noms 121 référencés » against 47 attested family names; the corpus holds 59
  people fiches that list Côte d'Ivoire among their countries. Report which
  figure comes from where; do not choose a number.
- **The official name is printed twice** in the hero: « République de Côte
  d'Ivoire (République de Côte d'Ivoire) ». It is the field `nameOfficial`
  repeating itself, a data defect; report it and show it once.
- **A sentence about Godié** (« Le nom Godié viendrait d'un surnom donné par les
  voisins des Wonnin ») and a source line sit inside « En bref » without a
  heading. Report what it is; do not move it.
- **The competing readings are under a chip.** *Côte de Quaqua* has three
  undated origins side by side (a cry « quaqua » the inhabitants shout to greet
  ships; cotton cloths bought on the coast, according to Ogilby; the language
  compared to the cry of ducks), and *Costa de Malagens* has two (a Flemish ship
  wrecked in 1475; the bad reputation of the coast). *Côte d'Ivoire*, the first
  name, has one origin (Tand Kust). Report how the competing readings of a name
  other than the first one are reached on the board.

## What to change

1. **Add « Les sources parlent »** after « L'histoire des noms », in the fiche
   variant (accounts grouped by name first, then by the seven source-diamond
   families, oral first, only the first name open). Title it for a country
   (propose « Qui raconte les noms de ce pays ? » and mark it as a proposal).
2. **Competing readings** under the name chips as on `language-lingala` and
   `family-mande`: « Hypothèse 1 », « Hypothèse 2 »… in the corpus order,
   unranked, stacked at 430 and side by side from 768, for the open name. State
   in the report how a reader reaches the three readings of *Côte de Quaqua*.
3. **Add the closing band** « Ce que nous ne savons pas encore » before
   « Poursuivre », reusing the approved component, with the silences deduced
   from the data (below).
4. **Turn « Poursuivre » into « Poursuivre avec un autre nom »**, reusing the
   approved component: each target with a reason, the first sentence of the
   target's summary; remove any target without a fiche or a summary. Propose,
   for the operator to confirm, the largest people that has a summary
   (`PPL_AKAN`, 42 %) then a place that has one (`LOC_YAMOUSSOUKRO`, the
   capital).
5. **Figures carry their caveat under them**, as on the family boards: the
   population is « 32,7 M · UNFPA, 2025 »; the shares of the five peoples add up
   to 96 %, and the board already says the rest is not distributed.
6. **Length — report and propose, do not apply.** Measure each chapter's height
   at 430 px. Then **propose**, as a list with the pixels it would save, what
   could be folded or removed: the repeated origin of the name; the A–Z index of
   names behind its count (« 47 noms attestés »); « Histoire » sub-chapters;
   « Culture et société »; the sources list. The board keeps today's state until
   the operator decides.

Do not touch the hero, the chapter bar, « Peuples du pays », « Langues », the
era chips, the political entities, « Culture et société » or the sources list,
except where item 6 says so.

## Real data for the board

`CIV` (`dataset/source/afrik/pays/CIV.json`).

- Summary of the name: « Le nom Côte d'Ivoire désigne un pays d'Afrique de
  l'Ouest, la République de Côte d'Ivoire, qui se nomme ainsi elle-même et
  demande depuis 1985 que ce nom ne soit pas traduit. Il a d'abord désigné une
  portion de littoral, que des écrits européens appellent aussi Côte des Dents,
  Costa de Malagens ou Côte de Quaqua ; avant 1891, les comptoirs français de
  cette côte s'appelaient Établissements français de la Côte d'Or. »
- Names and accounts: *Côte d'Ivoire* 10 (intergovernmental 1, academic 7,
  archive 6; « Depuis octobre 1985 », « 7 août 1960 », « 10 mars 1893 »,
  « 1891 », « 1842-1843 », « 1670 », « Début du XVIIe siècle », and the
  sense of the name); *Côte des Dents* 4 (archive 4, academic 1; 1704, 1670,
  1668, early 17th century); *Costa de Malagens* 5 (archive 2, academic 3; 1670,
  1668, about 1506, 1475-1476, and an imposition account « Du XVe au XXe
  siècle »); *Côte de Quaqua* 5 (archive 9; a letter of 2 January 1702, 1668,
  and three undated origins); *Établissements français de la Côte d'Or* 2
  (academic 2; 1843 to 1891, and the decree of 1 August 1889).
- **No oral source is recorded.** The letter of 2 January 1702 says « Côte de
  Quaqua » is not the name the inhabitants give: they call their country
  *Adouw*. It is the only name the inhabitants give their own coast in the
  data; show it inside that account, not as a headline.
- Facts the data states about the name: it was given from the sea by European
  merchants and navigators, after what was bought on that coast; the Dutch
  *Tand Kust*, « la côte des dents », of the early 17th century is the one the
  current name comes from; the French administration fixed it by decree in the
  late 19th century; since 1985 the country asks that it not be translated.
- Figures: 32,700,000 inhabitants (UNFPA, World Population Dashboard, 2025).
  Peoples: Akan 42 %, Voltaïques / Gur 17 %, Mandé du Nord 16 %, Krou 11 %, Mandé
  du Sud 10 %. Political entities: Royaumes Akan, Peuples Krou, Peuples Mandé du
  Nord, Peuples Mandé du Sud, Peuples Voltaïques / Gur, Royaume de Kong (1710 to
  1897), Colonie de Côte d'Ivoire (1893 to 1960), République de Côte d'Ivoire
  (since 1960).
- Next-name candidates that have a fiche and a summary: `PPL_AKAN` (« Le nom Akan
  désigne un vaste ensemble de peuples du sud du Ghana et de l'est de la Côte
  d'Ivoire, qui parlent des langues proches et se nomment eux-mêmes Akan. »),
  `PPL_BETE` (« Le nom Bété désigne un peuple de langues krou du centre-ouest de
  la Côte d'Ivoire, autour de Daloa, Gagnoa et Soubré, qui se nomme aujourd'hui
  lui-même Bété. »), `PPL_BAOULE`, `FLG_KWA` (« Le nom kwa désigne une famille de
  langues de la côte du golfe de Guinée, comme l'akan ou l'éwé. »),
  `LOC_YAMOUSSOUKRO` (« Le nom Yamoussoukro est le nom actuel de ce lieu. »),
  `LOC_DALOA`, `LOC_GAGNOA`.

Silences deducible from this data, to check against the fiche before drawing: no
oral account of the names; the three origins of *Côte de Quaqua* are undated; 4 %
of the population is not shared out among the peoples.

## States to draw (430 first, then 768 and 1440)

- `country-civ` rich: the added blocks, the first name open, and the readings of
  *Côte de Quaqua* reachable.
- **Thin: `GAB`** (Gabon): one name, 8 accounts (government 3,
  intergovernmental 2, academic 4, archive 2). The name first designated the
  estuary of a river, called *rio do Gabão* by the Portuguese, then the French
  trading post on its banks; « On ne sait pas avec certitude d'où vient ce nom ».
  Population 2,600,000 (UNFPA, 2025). A state of the board.
- **A shared name: `COG` and `COD`.** The Republic of the Congo (5 names, 17
  accounts, 6,500,000 inhabitants) and the Democratic Republic of the Congo (5
  names, 13 accounts, 112,800,000) both take their name from the river. Draw the
  sentence saying that two countries bear the name and are different countries,
  and the next step leading from one to the other. A state of the board.
- The entry from the Bouët-Willaumez post: report whether the first screen at
  430 px already shows the origin of the name; do not redesign it unprompted.

## Do not

- End on a list of other countries.
- Show borders as ancient: the audit calls them « mostly drawn less than 140
  years ago »; the board draws them as recent.
- Crown one reading or order readings by authority.
- Show a tier, a score or a « most reliable » label on any source.
- Redraw the approved components: reuse them from `Main`.
- Put the thesis anywhere but the closing band.

## Approved boards (2026-10-15)

The sections above are the brief as given and the record of what the prompt
asked; where they differ from the sections below, the sections below are what
was approved and win.

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
