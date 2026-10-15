# Brief 4 — The language-family fiche

Read [`README.md`](README.md) first. Briefs 1, 2 and 3 are approved and
implemented; this brief reuses their components instead of redrawing them (see
"Approved boards" in [`01-result-page-timeline.md`](01-result-page-timeline.md),
[`02-people.md`](02-people.md) and [`03-language.md`](03-language.md)): the fiche
variant of « Les sources parlent », the closing band « Ce que nous ne savons pas
encore », « Poursuivre avec un autre nom », the presentation of competing
readings under the name chips, and the rule that an empty chapter disappears and
its silence goes to the closing band.

**Boards to change** (each at `-430`, `-768`, `-1440`): `family-bantu`,
`family-mande`. `Main` changes only if a shared component does.

**Surface.** `/fr/atlas/familles/[slug]`, built by
`src/components/family/FamilyParchment.tsx`.

**Why.** Measured dead end: `FLG_MANDE` has 6 entries and a 75 % exit rate after
195 s on the page; it was also the target of a 105K-view Facebook post (bare
link, no tag). A family page is where a reader arrives wanting "the big
picture", and the page offers nothing next that gives a reason.

## What is on the boards today (checked 2026-10-15)

Chapters, in order, on `family-bantu` (the same on `family-mande`):

1. Hero plate and chapter bar.
2. **L'histoire des noms** — name chips and the question « D'où viennent ces
   noms ? » with its answer.
3. **La famille en chiffres** — Langues, Personnes qui parlent ces langues,
   Branches, Distribution.
4. **L'empreinte, et d'où elle vient** — the union of the countries of the
   attached peoples (computed, not read), with country links.
5. **D'où vient le nom de la famille.**
6. **Peuples rattachés** — « 10 des 164 peuples », ranked by extent.
7. **Appellations et décolonisation.**
8. **Caractéristiques linguistiques.**
9. **Histoire et origines.**
10. **Poursuivre** — five links.
11. **Sources**, a long list.

Heights at 430 px: `family-bantu` about 15,250 px (16 screens),
`family-mande` about 22,132 px (24 screens), the longest page recorded.

Where the text is, in characters, on `family-mande`: Histoire et origines 9,486
(about 39 % of the page's text), Sources 4,557, Caractéristiques linguistiques
3,513, D'où vient le nom de la famille 3,444, Appellations et décolonisation
1,513, the rest under 1,000 each. On `family-bantu`: Histoire et origines 3,109,
Sources 2,678, Appellations et décolonisation 2,509.

## What the data and the rules show on these boards, to report

- **The origin of the name is told twice.** « L'histoire des noms » opens on
  « D'où viennent ces noms ? » and chapter 5, « D'où vient le nom de la
  famille » (the field `decolonialHeader.originOfHistoricalTerm`), starts with
  the same sentences on both families (« Le terme « bantou » a été introduit par
  le philologue allemand Wilhelm Heinrich Immanuel Bleek… », « Manden est le nom
  d'un pays, et il circule dans les sources européennes… »). Unlike the people
  fiche, this is a real duplicate. Report it; **propose** removing one of the
  two, do not apply it.
- **« La famille en chiffres » presents estimates as figures.** `family-bantu`
  shows « Langues 500 » and « 350 M ». The fiche itself says « plus de 500
  langues » and « une estimation d'environ 350 millions, extrapolation de
  Hammarström », and one of the name's own accounts speaks of « plus de deux
  mille langues apparentées ». `family-mande` shows 75 languages (Glottolog 5.3)
  and 60 M speakers. Show them as declared estimates with their source and
  caveat, never as headline numbers (same rule as the 34,000,000 speakers of
  Lingala, not shown).
- **« Distribution 1 » and « Distribution 2 »** are counts of countries that
  have a figure (Bantou: South Africa only, 15,134,712; Mandé: Senegal and Côte
  d'Ivoire), not a distribution. The label misleads; propose a label or move
  the fact into a silence.
- **Counts of peoples differ.** The boards say 164 (Bantou) and 28 (Mandé) peoples
  attached; the corpus folders hold 155 and 27, and the fiches list 11 and 8 in
  `associatedPeoples`. Report which is which; do not choose a number.
- **« Poursuivre » targets may not exist.** `family-bantu` links the languages
  Aka and Akoose; the corpus holds nine languages for the Bantou family
  (`swc`, `hav`, `lua`, `tll`, `nnb`, `lub`, `lin`, `hke`, `ktu`) and neither is
  among them. Remove any target without a fiche, and say which.
- **An English string in the data:** the Mandé historical appellations include
  « Mandéga Family of Languages ». It is a data defect, not a board choice;
  report it and show it as it is.

## What to change

1. **Add « Les sources parlent »**, fiche variant, after « L'histoire des
   noms » (accounts grouped by name first, then by the seven source-diamond
   families, oral first, only the first name open). Title it for a family
   (propose « Qui raconte les noms de cette famille ? » and mark it as a
   proposal). `FLG_BANTU` has two names, one of them (*Bantu*) with no account:
   it appears as a declared silence, not an empty group.
2. **Competing readings, if the data holds any.** Present them under the name
   chips as on `language-lingala`: « Hypothèse 1 », « Hypothèse 2 »… in the
   corpus order, unranked, stacked at 430 and side by side from 768. For these
   two families the data holds none that compete on the origin of the name:
   `FLG_BANTU`'s summary says the sources agree on the origin and less on the
   date; `FLG_MANDE`'s says the sources do not explain the first sense of
   *Manden*. Report whether the accounts hold a disagreement on a date; if they
   do, show it in this grammar; if not, draw none. Invent nothing.
3. **Add the closing band** « Ce que nous ne savons pas encore » before
   « Poursuivre », reusing the approved component, with the silences deduced
   from the data (below). A chapter with no data disappears and its silence
   goes to the band.
4. **Turn « Poursuivre » into « Poursuivre avec un autre nom »**: the first
   language of the family that has a summary, then the first people of the
   family that has a summary; each with a reason, the first sentence of the
   target's summary. Remove any target without a fiche or without a summary.
5. **Length — report and propose, do not apply.** Measure each chapter's height
   at 430 px on both boards. Then **propose**, as a list with the pixels it
   would save, what could be folded behind a one-line summary or removed:
   the duplicate chapter 5; « Histoire et origines » (five or six sub-chapters
   on `family-mande`); « Caractéristiques linguistiques »; the sources list if
   it is open. The boards keep today's state until the operator decides.

Do not touch the hero, the chapter bar, the footprint map and its country
links, « Peuples rattachés », « Appellations et décolonisation » or the
sources list, except where a proposal in item 5 says so.

## Real data for the boards

**`FLG_BANTU`** (`famille_linguistique/FLG_BANTU.json`), classification status
`colonial-legacy`.

- Summary: « Le nom bantou désigne une famille de langues d'Afrique centrale,
  orientale et australe, et non un peuple. C'est un mot de linguiste, tiré d'un
  mot de ces langues qui veut dire « les gens » ; on écrit aussi Bantu. Les
  sources s'accordent sur son origine, moins sur sa date ; nous les présentons
  plus bas. »
- Names: *Bantou* with 6 accounts (aspects meaning, usage, imposition; periods
  « Sens donné par les auteurs », « Années 1980 », « De la fin des années 1950 à
  1994 », « 1862 », « 1858 », « Avant 1858 »), *Bantu* with 0. Source kinds:
  intergovernmental 7, archive 2, academic 1. No oral account.
- The apartheid account: the name became an administrative word of apartheid
  South Africa; around 1960 « Bantu » replaced another term.
- Figures: branches 4 (Bantu A-B10-B20-B30, Central-Western Bantu, East Bantu,
  Mbam-Bubi); 500 languages and 350,000,000 speakers as estimates; distribution
  by country with a figure for South Africa only (15,134,712).
- Languages in the corpus: Swahili du Congo, Havu, Tshiluba, Otetela, Nande,
  Kiluba, Lingala, Hunde, Kituba. People targets that have a summary: Swahili
  (« Le nom Swahili désigne un peuple de la côte d'Afrique de l'Est… »), Gbaya
  (« … de l'ouest de la Centrafrique et de l'est du Cameroun, qui se nomme
  lui-même Gbaya, comme sa langue. »), Lozi (« … le peuple de la plaine
  inondable du haut Zambèze, dans l'ouest de la Zambie… »).

**`FLG_MANDE`** (`famille_linguistique/FLG_MANDE.json`), no classification
status.

- Summary: « Le nom mandé désigne une famille de langues d'Afrique de l'Ouest,
  comme le bambara, le maninka ou le soninké. C'est un nom de savants, tiré de
  Manden, le nom d'un pays du haut Niger ; on a aussi dit mandingue. Les sources
  que nous avons lues n'expliquent pas le sens premier du nom Manden. »
- Names: *Mandé* 5 accounts (1980, 1901, 1900, 1867, 1854; archive 2,
  linguistic reference 2, intergovernmental 1), *Manden* 5 accounts (one
  « Avant Soundiata, selon la tradition », which reports oral traditions through
  Djibril Tamsir Niane; then 1854, the 1795-1797 journey, the late 16th century;
  intergovernmental 2, linguistic reference 1, archive 1, academic 1),
  *Mandingue* 2 accounts (1929, 1856; archive 2). **No source is typed oral
  tradition**, but one *Manden* account reports oral traditions through a
  published author: do not declare a silence about an oral account without
  saying so, and mark the account as reported, with no carrier named.
- Figures: branches 2 (Eastern Mande, Western Mande); 75 languages (Glottolog
  5.3); 60,000,000 speakers; distribution figures for Senegal (465,052) and Côte
  d'Ivoire (6,433,783) only.
- Languages in the corpus: Mandinka, Maninkakan de l'Est, Bambara, Soninké,
  Dioula. Targets that have a summary: Bambara (« Le nom bambara désigne une
  langue mandingue parlée surtout au Mali, que ses locuteurs appellent
  bamanankan, « la langue des Bamana ». »), Malinké (« Le nom Malinké désigne un
  peuple d'Afrique de l'Ouest qui se nomme lui-même Maninka, ou Mandinka en
  Sénégambie. »), Soninké (« Le nom Soninké désigne un peuple d'Afrique de
  l'Ouest, fondateur de l'empire du Ghana, qui se nomme lui-même Soninké. »).
  `PPL_MANDE_MACRO` has no summary and is left out.

Silences deducible from this data, to check against the fiches before drawing:
Bantou: *Bantu* has no account; no oral account; figures for one country only;
the sources agree on the origin, less on the date. Mandé: the first sense of
the name *Manden* is not explained by the sources read (a sentence of the
summary, not a field: it needs one to be implemented, as Havu's did); figures
for two countries only.

## States to draw (430 first, then 768 and 1440)

- `family-bantu`: the added blocks, the two names, the silence for *Bantu*.
- `family-mande`: the added blocks, three names, the first (Mandé) open, the
  *Manden* oral account marked as reported.
- A family with a contested classification (`classificationStatus`): `FLG_BANTU`
  is `colonial-legacy`. The status is stated in a sentence, not a badge; report
  what the board shows today (a « Héritage colonial » mark appears once on
  `family-bantu`).
- The entry from a social post that points at the family (the 105K-view Mandé
  post): the first screen repeats the promise of the link. Report whether it
  does today; do not redesign it unprompted.

## Do not

- Draw a family tree: the corpus does not hold the branching, and a drawn tree
  would assert it.
- Present an estimate as a headline figure, or a count of countries with a figure
  as a distribution.
- Crown one reading or order readings by authority.
- Show a tier, a score or a « most reliable » label on any source.
- Redraw the approved components: reuse them from `Main`.
- Put the thesis anywhere but the closing band.

## Approved boards (2026-10-15)

The sections above are the brief as given; where they differ from the sections
below, the sections below are what was approved and implemented, and win.

Recorded in `docs/design/mockups/site/`. The implementation reproduces them.
The hero and the chapters not named here are unchanged.

- `family-bantu`, at 430, 768 and 1440, is the rich state and the state of a
  family whose classification carries a status. « Les sources parlent »
  follows « L'histoire des noms » in its single-name form: « Qui raconte le
  nom Bantou ? », 6 accounts grouped by source family. Bantu has no account
  and is declared in the closing band rather than drawn as an empty group.
  « La famille en chiffres » opens on a sentence giving the classification
  status (`colonial-legacy`) and pointing to « Appellations et
  décolonisation »; the hero badge stays. The figures say what they are
  (« Plus de 500, une estimation »; « Un ordre de grandeur, selon Bostoen et
  Van de Velde, 2019 ») and the « Distribution » count is removed. The closing
  band replaces « Poursuivre »; « Poursuivre avec un autre nom » offers
  Lingala (language) and Swahili (people).
- `family-mande` is the dead-end repair. « Les sources parlent » in the fiche
  variant: « Qui raconte les noms de cette famille de langues ? », 12 accounts
  of 3 names, Mandé open, Manden marked « Leur nom ». The Manden account
  « Avant Soundiata, selon la tradition » is drawn under Tradition orale, as
  traditions of the griot schools of the Manden reported by Djibril Tamsir
  Niane, with no carrier named. Figures: 75 languages « Selon Glottolog,
  édition 5.3 »; 60 M marked as an estimate the fiche does not tie to a
  source. Next names: Bambara (language) and Malinké (people).
- `ea-live.css` gains `.ea-classification`.

Silences drawn in the closing band:

- Bantou: no oral account for the names of the family; no source tells the
  name Bantu yet; no trace of Bantou older than 1858; speaker counts by
  country only for South Africa.
- Mandé: the oral traditions on Manden reach us only through Djibril Tamsir
  Niane; no trace of Mandé older than 1867; speaker counts by country only
  for Senegal and Côte d'Ivoire.

Decisions taken in review:

1. A name with no account gets its own line (« Aucune source du projet ne
   raconte encore le nom Bantu. ») instead of the undated-origin line.
2. An oral tradition known only through the author who wrote it down is
   drawn under Tradition orale, « rapportées par » that author, without a
   carrier. The data needs the source marked `oral_tradition` with a
   `narrative` and no `carrier`.
3. The classification status is said in a sentence above the figures; the
   hero badge stays; Mandé, which has no `classificationStatus`, gets none.
4. Each figure carries its caveat under it; a figure with no source is in the
   caveat colour.
5. The next step offers a language, then a people, each with the first
   sentence of its fiche's summary. « Langue » is a new relation label.

Found while drawing, left to the corpus:

- `FLG_MANDE`: the summary and the Manden account say the sources read do not
  explain the first sense of Manden, but the note on Camara Laye (1978,
  p. 130) gives an etymology from the griot Babou Condé. The silence is not
  drawn; the account could enter the name history as an oral account.
- `FLG_BANTU`: the first account speaks of « plus de deux mille langues »
  while the figures give 500.
- `FLG_MANDE`: the prose says Dimmendaal and Güldemann contest the
  classification, but the fiche has no `classificationStatus`.

Length proposal, measured at 430 (Bantou / Mandé), for a later decision:
fold « D'où vient le nom de la famille » (733 / 2,594 px), open only the
first field of « Histoire et origines » (2,582 / 7,343 px), fold
« Caractéristiques linguistiques » to its field titles (1,440 / 2,710 px),
show five sources then a disclosure (2,040 / 3,794 px), show five countries
in « L'empreinte » (1,769 px on Bantou), and move « Peuples rattachés » up
after « Les sources parlent » on Mandé so the member names reach the third
screen.

## Implementation (2026-10-15)

Decided with the operator after the boards were approved:

1. Implement now, compared at 430, 768 and 1440 on the stories
   `Fiches/Famille de langues (brief 4)`, fed with the corpus fiches.
2. A family fiche may declare `content.generalInfo.figureNotes`, one note per
   figure (`numberOfLanguages`, `totalSpeakers`), or `unsourced: true` for a
   figure tied to no source. Without a note the card says nothing more.
3. The Manden account « Avant Soundiata » gains its own oral source
   (« Traditions des écoles de griots du Manden », unverified, no carrier)
   beside the Niane chapter, which stays a public report. A work that only
   writes an oral tradition down is named in the tradition's line, not
   counted again as a voice; the silence names that work's author.
4. The next language is the most spoken one whose fiche has a summary, then
   A to Z; the next people is the widest one whose fiche has a summary.

The boards were updated first on one line: French country names carry no
article in the data, so the distribution silence reads « Pays par pays, le
nombre de personnes qui parlent ces langues n’est donné que pour deux pays :
Sénégal et Côte d'Ivoire. » The classification sentence exists for
`colonial-legacy` only; the other statuses wait for a drawn sentence.
