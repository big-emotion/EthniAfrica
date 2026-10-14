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
