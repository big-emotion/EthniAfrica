# Brief 4 — The language-family fiche

Read [`README.md`](README.md) first.

**Boards to change** (each at `-430`, `-768`, `-1440`): `family-bantu`,
`family-mande`. At 430 px `family-mande` is about 22,132 px tall (24
screens), the longest page recorded.

**Surface.** `/fr/atlas/familles/[slug]`, built by
`src/components/family/FamilyParchment.tsx`. The older `../pages/famille.html` is superseded by the canvas boards.

**Why.** Measured dead end: `FLG_MANDE` has 6 entries and a 75 % exit rate after
195 s on the page; it was also the target of a 105K-view Facebook post (bare
link, no tag). A family page is where a reader arrives wanting "the big
picture", and where the page currently offers nothing next.

## Subject: `FLG_BANTU`

Real data: the name *bantou* designates a **family of languages**, not a people;
it is a linguist's word drawn from a word meaning « les gens » in these
languages, also written *Bantu*. Sources agree on the core; accounts: Bantou 6,
Bantu 0. Source types: academic, archive, intergovernmental. The Bantou board
already exists in `search-answer/Bantou.dc.html` ("a family treated as a myth to
undo, in a light tone"); reuse its tone.

Second subject for the dead-end case: `FLG_MANDE`. The family name *Mandé* and
the people names *Manden*, *Mandingue*, *Malinké* share a root, which is exactly
the "same branch" pattern the doctrine promises.

## Blocks, mobile 430 px

1. Verdict: what kind of name this is (a linguist's word, not a people).
2. Who named whom: *Bantou* / *Bantu* (one account is enough for the second:
   the draw must show a name with no history yet as a declared silence).
3. The sources speak.
4. **Type-specific: what falls under this name.** The languages and peoples
   that carry it, as a short, countable list of **names**, each linking to its
   own page. Not a card grid of 400 items: a count and the three most-searched.
5. Why the shared name is not a kinship: the conviction of the `Bassa` board,
   « Un nom partagé n'est pas une parenté ».
6. Closing band, next step: a language name and a people name inside the family.

## States to draw

Rich (`FLG_BANTU`), dead-end repair (`FLG_MANDE`: the first screen shows the
verdict, the second the member names, the third the way on), and a family with
contested classification (`classificationStatus`): the status is stated in a
sentence, not a badge.

## Do not

- Draw a family tree: the corpus does not hold the branching, and a drawn tree
  would assert it.

## Approved boards (2026-10-15)

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
