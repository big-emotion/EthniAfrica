# Brief 6 — The family-name fiche (patronyme)

Read [`README.md`](README.md) first. Briefs 1 to 5 and 9 are approved and
implemented or recorded; this brief reuses their components instead of
redrawing them (see "Approved boards" in
[`01-result-page-timeline.md`](01-result-page-timeline.md),
[`02-people.md`](02-people.md), [`03-language.md`](03-language.md),
[`04-language-family.md`](04-language-family.md) and
[`05-country.md`](05-country.md)): the fiche variant of « Les sources parlent »,
the closing band « Ce que nous ne savons pas encore », « Poursuivre avec un autre
nom », the competing-readings grid, figures that carry their caveat, and the
rule that an empty chapter disappears and its silence goes to the closing band.
Footer B (brief 9, [`09-our-approach.md`](09-our-approach.md)) is now on
`Main` and on every board that has a footer, except `name-traore`.

**Board to change** (at `-430`, `-768`, `-1440`): `name-traore`. `Main` changes
only if a shared component does.

**Surface.** `/fr/atlas/noms/[slug]`.

**Why.** 791 family names, about 625 in the sitemap, 10 % visited. The type with
the widest reach (a reader searches *their own* name) and the worst early exits:
`PAT_TRAORE` (left before half the page), `PAT_DIALLO` (a third of the page,
exit 83 %). Names whose sources are too weak are deliberately served `noindex`;
that is policy, and the page must handle a weakly sourced name without shame. A
social post (`traore-diop`) already points here.

## What is on the board today (checked 2026-10-16)

`name-traore`, in order, at 430 px (about 13,191 px tall, 14 screens, about
14,300 characters of text):

1. Hero plate: « Traore », « Système de nommage : Nom de clan », « 9 sources
   citées », trail, chapter bar.
2. **Le nom** (682 characters) — social function (« Caste ou fonction sociale »:
   a status that varies from one area to another; Traoré is among the *jamuw
   hɔrɔn*, free and not artisanal, with the *numu* side attested elsewhere), the
   spellings found in the sources with their countries (Traore in MLI, BFA, CIV,
   GIN, SEN; Traoré in GIN; Tarawele in MLI; Taraore in MLI), the mode of
   transmission (patrilineal), the social unit (clan).
3. **Origine** (5,425 characters, 38 % of the text) — the origin accounts grouped
   by four types: *Tradition orale*, *Chronique écrite*, *Synthèse historique*,
   *Reconstruction linguistique*. Each oral account names its carrier, the place,
   who collected it and when, and a claim status (« Revendiquée »).
4. **Peuples et pays concernés** — Bambara, Malinké; Côte d'Ivoire, Mali,
   Sénégal, Burkina Faso, Guinée.
5. **Alliances** (573) — six *sanankuya* pacts (Diarra, Diop, Koné, Touré, Condé,
   Diawara), each with the same sentence.
6. **Homonymes** (776) — a chapter that says there are none: Traoré and Tarawele
   are two spellings of one *jamu*, and the dictionary of *jamuw* lists other
   clan names held to be the same institution.
7. **Porteurs et porteuses** (269) — one deceased person, Tiramaghan Traoré, and
   the line that the list documents the name and does not allow inferring any
   person's ethnic origin.
8. **Poursuivre** — Bambara, Côte d'Ivoire, the family name *Abaza*, Malinké,
   Mali; no reason given.
9. **Sources** (6,126 characters, 43 % of the text, 29 links).

## What the data and the rules show on this board, to report

- **The page already has a sources-by-type chapter.** « Origine » groups the
  origin accounts by four types with carrier, collector and claim status; the
  approved « Les sources parlent » groups accounts by the seven source-diamond
  families, oral first. They overlap. The fiche also holds a second set of
  accounts, the history of the names (*Traoré* 11, *Tarawele* 3), which the
  board does not show at all. Report what each one covers.
- **« Revendiquée » is a claim status, not a tier.** The oral accounts carry
  `claimStatus: claimed` and `collection: mediated`. The approved component does
  not draw a claim status. Report how you would show it without ranking an oral
  account below a written one.
- **The summary and the page disagree.** The history's summary says « la seule
  explication de son origine que nous connaissons », while the fiche holds nine
  origin accounts (4 oral traditions, 1 written chronicle, 1 historical
  synthesis, 3 linguistic reconstructions). Report it; do not decide which is
  right.
- **The page title and the history disagree on the spelling.** The board titles
  « Traore »; the history's name is *Traoré* (11 accounts) and the summary says
  that in Bambara and Malinké the name is said *Tarawele*, *Traoré* being the
  French spelling. The doctrine puts the self-name first outside the result
  page. Report which form leads where; do not choose one.
- **« Homonymes » says there are none** (a declared gap in the data). A block
  that says it is empty: the chapter disappears and the silence goes to the
  closing band. The equivalences it lists (Sane, Mane, Ouédraogo, Dembélé, Diouf,
  Touré at Ségou) and the fact that a Traoré in Wolof country may take the name
  Diop are real content, not a silence: propose where they live.
- **« Poursuivre » offers *Abaza*,** an Egyptian family name taken from the
  Abazins of the Caucasus, unrelated to Traoré; it looks alphabetical. Report it;
  the next names come from the alliances (below).
- **The alliances repeat one sentence six times.** Propose a shorter form (the
  sentence once, the six names as chips) without dropping a pact.
- **« 9 sources citées » against 29 links in « Sources ».** Report which figure
  counts what; do not choose a number.
- **The canvas README warns** that the Traore origins and sources on the board
  were copied from screenshots: check them against the live page.

## What to change

1. **Add « Les sources parlent »** in the fiche variant over the history of the
   names (*Traoré* 11 accounts, *Tarawele* 3): accounts grouped by name first,
   then by the seven source-diamond families, oral first, only the first name
   open. Title it for a family name (propose « Qui raconte ce nom de
   famille ? » and mark it as a proposal) and tell me where you place it and why.
   Keep « Origine » as it is; **propose**, without applying it, how the two
   could be merged.
2. **Add the closing band** « Ce que nous ne savons pas encore » before
   « Poursuivre », reusing the approved component, with the silences deduced
   from the data (below). The « Homonymes » chapter disappears and its silence
   goes there.
3. **Turn « Poursuivre » into « Poursuivre avec un autre nom »**, reusing the
   approved component: the allied names that have a fiche and a summary, each
   with a reason (the first sentence of its summary). Remove *Abaza* and any
   target without a fiche or summary.
4. **Footer B** on the three boards, as on the other boards of the canvas: the
   link « Notre démarche » after « À propos » in « Le projet », and the signature
   line under the tagline (`.ea-footer-signature`). `name-traore` was held back
   from the brief 9 change because this piece of work owns it; nothing else on
   the board changes for it.
5. **Length — report and propose, do not apply.** Measure each chapter's height
   at 430 px. « Origine » and « Sources » together are 81 % of the text. Propose,
   as a list with the pixels it would save, what could be folded or shortened:
   the alliances sentence; the sources list; the oral accounts behind a one-line
   summary; the « Origine » types. The board keeps today's state until the
   operator decides.

Do not touch the hero, the chapter bar, « Le nom », « Peuples et pays
concernés », « Porteurs et porteuses » or the sources list, except where item 5
says so.

## Real data for the boards

`PAT_TRAORE` (`dataset/source/afrik/patronymes/PAT_TRAORE.json`).

- Summary: « Le nom Traoré est un nom de clan, ou jamu, porté par des familles
  bambara et malinké. En bambara et en malinké, il se dit Tarawele ; Traoré en
  est la graphie française, et d'autres graphies existent : Traore et Taraore.
  Nous présentons plus bas la seule explication de son origine que nous
  connaissons. »
- Names and accounts: *Traoré* 11, *Tarawele* 3. Source kinds in the history:
  academic 7, linguistic reference 5, intergovernmental 3, archive 1.
- Origin accounts: 4 oral traditions, 1 written chronicle, 1 historical
  synthesis, 3 linguistic reconstructions. The oral accounts name:
  *Babou Condé*, griot of the village of Fadama, prefecture of Kouroussa
  (Guinea), collected by E. A. Bogacheva in interviews in 2017, reported in
  Russian in a university thesis; and *Djeli Mamadou Kouyaté*, griot of Djeliba
  Koro near Siguiri, collected by Djibril Tamsir Niane, translated into French,
  epic published in 1960. Both are « Revendiquée ». They tell, among other things,
  that the Mara belong to the same paternal branch as the Traoré, with a common
  ancestor, Mansa Yurukara Nayni, and that two Traoré brothers, Oulamba and
  Oulani, brought back from the land of Do the girl promised to the buffalo's
  killer.
- Alliances: six *sanankuya*, with Diarra, Diop, Koné, Touré, Condé, Diawara.
  Allied names that have a fiche and a summary: Diarra (« Le nom Diarra est un
  nom de clan, ou jamu, des Bambara et des Malinké, transmis comme nom de
  famille ; on l'écrit Jàra en bambara. »), Diop (« Le nom Diop est un nom de clan
  des Wolof et des Lébou du Sénégal. »), Touré (« Le nom Touré est un nom de clan
  d'Afrique de l'Ouest, porté chez les Soninké et les Malinké. »), Diawara (« …
  porté surtout par des Soninké du Kaarta et du Kingui, au Mali, et aussi chez des
  Malinké et des Peuls. »). Koné and Condé have a fiche without a summary and are
  left out. People targets with a summary: Bambara (« Le nom Bambara désigne un
  peuple du Mali, qui se nomme lui-même Bamana. »), Malinké (« Le nom Malinké
  désigne un peuple d'Afrique de l'Ouest qui se nomme lui-même Maninka, ou
  Mandinka en Sénégambie. »).
- Bearers: one deceased person; no count. Homonyms: none, a declared gap whose
  reason is the one quoted above. Peoples: Bambara, Malinké. Countries attested:
  Mali, Burkina Faso, Côte d'Ivoire, Guinea, Senegal.

Silences deducible from this data, to check against the fiche before drawing:
the sources give a single explanation of the origin, told through several
voices; no homonym is documented, because the spellings and equivalences are
the same institution; no count of bearers.

## States to draw (430 first, then 768 and 1440)

- `name-traore` rich: the added blocks, the first name open.
- **`name-state-thin-kollo` (new): `PAT_KOLLO`.** Two names, two accounts. *Kollo*:
  25 people bear it in Côte d'Ivoire, about one in 923,000 inhabitants,
  according to a surname-frequency directory (community source). *Ngo Kollo*: the
  compound form under which the name is also borne in Cameroon, according to a
  family testimony: an **oral account by a family member, not named publicly,
  Cameroon, reported in 2026**. Summary: « On ne sait pas avec certitude d'où
  vient ce nom : aucune source retrouvée ne l'explique. » One homonym, *Kollo
  (Niger)*, a département and its main town on the left bank of the Niger, with
  nothing connecting that place name to the Ivorian family name: draw the
  « Homonymes » chapter filled, the same sound never merged. Declared gaps: the
  naming system, the social unit, the mode of transmission, the origin and the
  people are not established. Use only what its fiche holds.
- **`name-state-weak-sarr` (new): `PAT_SARR`.** The `noindex` shape, without
  alarm. Three names: *Sarr* 5 accounts, *Saar* 1, *Sar* 1 (academic 5, archive 2,
  linguistic reference 1). The name passes in Senegal for a Serer name, to the
  point that those who bear it without being Serer are often taken for Serer; its
  joking cousins are the Guèye and the Ndiaye; it appears as *Sar* in the 1865
  Annuaire du Sénégal. Summary: « On ne sait pas avec certitude d'où il vient ; les
  sources lues ne lui donnent pas de sens. » The fiche's own list of sources holds
  one entry, a machine-written coverage survey, which is why the page is
  withheld from search engines, while its history cites academic and archive
  sources: report this tension; do not resolve it. Most chapters are declared
  not yet documented. The closing band says so first.
- The entry from the `traore-diop` post: report whether the first screen at
  430 px already shows what kind of name this is; do not redesign it unprompted.

## Do not

- Imply that bearing the name proves a descent, or give an ethnic origin to a
  person.
- Show a map of « where the name comes from » as a dot: the fiche holds countries
  and peoples, not points.
- Merge homonyms, or treat two spellings of one name as two lineages.
- Rank an oral account below a written one, or show a tier, a score or a « most
  reliable » label on any source.
- Redraw the approved components: reuse them from `Main`.
- Put the thesis anywhere but the closing band.
