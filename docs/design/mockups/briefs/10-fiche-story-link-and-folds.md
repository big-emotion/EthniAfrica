# Brief 10 — The fiche boards: the link to the name's story, and folded chapters

Read [`README.md`](README.md) and
[`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-17. Status: **proposed — awaiting operator review.**
Prompt: [`claude-design-prompt-10.md`](claude-design-prompt-10.md).

This is **pass 1** of the three board passes the operator approved on
2026-10-17: the fiche boards first (this brief, then brief 6), then the result
page ([brief 11](11-result-page-self-name-handoff.md)), then the unknown name,
the « Fiches » lens and the consent strip
([brief 12](12-unknown-name-fiches-lens-consent.md)). The passes share `Main`
and `ea-live.css`, so each one starts after the previous one is approved and
recorded.

It covers two findings of the 2026-10-17 triage: **P01**, every fiche leads to
the story of its name, and **P07b**, a long chapter folds what follows its
first tile. Briefs 2 to 5 are approved and implemented; this brief reuses
their components.

**Boards to change** (each at `-430`, `-768`, `-1440`):

- the story link and the folds: `people-fula`, `people-bassa`,
  `people-thin-alaba`, `country-civ`, `family-bantu`, `family-mande`;
- the story link only: `language-lingala`, `language-thin-havu` (short
  fiches, nothing to fold), and the three state boards
  `country-state-civ-quaqua`, `country-state-thin-gab`,
  `country-state-shared-congo` (they draw « En bref » and a few blocks only);
- `Main`: the story link and the fold control, once each.

**Not to touch:** the search boards (brief 11 and brief 12 change them),
`name-traore` (brief 6 owns it and now carries the same link, see
[`06-family-name.md`](06-family-name.md) item 6), the hero plates, the chapter
bars, the name stories, « Les sources parlent », the closing band and
« Poursuivre avec un autre nom ».

**Surface.** `/fr/atlas/peuples/[slug]`, `/fr/atlas/langues/[slug]`,
`/fr/atlas/familles/[slug]`, `/fr/atlas/pays/[slug]`, built by
`src/components/people/PeopleDetailViewV2.tsx`,
`src/components/language/LanguageDetailViewV2.tsx`,
`src/components/family/FamilyParchment.tsx`,
`src/components/country/CountryParchment.tsx` and
`src/components/fiche/FicheNameStory.tsx`.

## Why

Measured on recette at 430 px on 2026-10-16, and in the audience data of the
same week:

- **No fiche leads to its own name's result page.** The result page is the
  site's central surface (doctrine §1): it tells each name one at a time, from
  today backwards, with who gave it, to whom, when and why. Today the only
  result-page links on a fiche are the two « Poursuivre avec un autre nom »
  cards, and they lead to _other_ names.
- **Those cards sit at the bottom of very long pages.** Page heights: Fula
  13,528 px, Côte d'Ivoire 12,144, Mandé 24,200, Lingala 7,761. The heading
  « Poursuivre avec un autre nom » is at 85 %, 84 %, 77 % and 74 % of the
  page. The `fiche:depth` event counts 72 readers who reach the end of a fiche
  for 321 who reach a quarter of it.
- **Nothing folds.** The largest open chapters: Mandé « Histoire et
  origines » 6,959 px and « Caractéristiques linguistiques » 2,589 px;
  Côte d'Ivoire « Noms de personnes rattachés à ce pays » 2,577 px. Briefs 2,
  4 and 5 recorded these lengths as proposals for a later decision; this brief
  is that decision, drawn.
- 81 % of visitors are on a phone.

## Depends on

- **REQ-153 amended on Confluence** before the fold is drawn as final. Today
  REQ-153 says that « a collapsed tile states a fact before it is opened,
  opening adds content, and a chapter never itself collapses ». The fold below
  keeps every chapter open and its heading visible, and its closed control
  names what it hides, so it states a fact. The requirement still has to say
  that a chapter may fold the tiles after its first one: the proposed wording
  is under « Proposed requirement amendment ». The operator writes it with
  `/ethniafrica-spec`; the tests of the implementation cite it.
- **The name's permanent address** (operator decision of 2026-10-17): a
  name's answer lives at `/fr/atlas/recherche/<nom>`, the form written as it is
  and percent-encoded, accent variants sharing one address. The story link
  points there. If the link ships before that address exists, it uses
  `/fr/atlas/recherche?q=<nom>` and moves with it.
- **The filed name « Peul »** (the corpus fix that renames `PPL_FULA` from
  « Fula (Fulbe / Peul) » to « Peul »). The boards take the new name now; see
  item 3.

## What is on the boards today (checked 2026-10-17)

The first chapter answers the name, then the page goes on to its reference
chapters:

- **People** (`people-fula`, `people-bassa`, `people-thin-alaba`): « D'où
  vient le nom ? » shows the self-name (Fulɓe, Bassa, Halaba), how it is said,
  its line (« Ils se nomment Fulɓe au pluriel et Pullo au singulier. »), its
  tags, « Les pistes sur le sens », « Où il a été écrit » and « voir les
  sources ». Then « Les autres noms », « Qui raconte les noms de ce
  peuple ? », « Où vit ce peuple », « Peuples liés », « Langue »,
  « Histoire », « Noms de personnes rattachés à ce peuple », « Culture et
  société », the closing band, « Poursuivre avec un autre nom », « Sources ».
- **Language** (`language-lingala`, `language-thin-havu`): « L'histoire des
  noms » holds the name rows and, on Lingala, the explanations grid; no lead
  sentence.
- **Family** (`family-bantu`, `family-mande`): « L'histoire des noms » with
  « D'où viennent ces noms ? », one lead sentence, « Lire la suite » and the
  name rows. Further down: « D'où vient le nom de la famille », « Peuples
  rattachés », « Appellations et décolonisation », « Caractéristiques
  linguistiques », « Histoire et origines ».
- **Country** (`country-civ` and its three state boards): « En bref » holds
  « L'histoire des noms » with « D'où viennent ces noms ? », one lead sentence
  (« Le nom Côte d'Ivoire renvoie au commerce de l'ivoire pratiqué le long du
  littoral. »), « Lire la suite » and the name rows. Further down:
  « Peuples du pays », « Langues », « Histoire », « Noms de personnes
  rattachés à ce pays », « Culture et société ».

Every reference chapter is drawn open. No board links a fiche to its name's
result page.

## What to change

### 1. The link to the name's story (P01)

One action link, the same on every type, in the first chapter:

- the label **« Suivre l'histoire du nom Fulɓe »**, followed by the action
  link's arrow;
- under it, in caption size: « La page du nom présente ce que disent les
  sources : qui l'a donné, à qui, quand et pourquoi, en remontant le temps. »

It is form A of `docs/design/actions-charter.md`: label then arrow, no
container, `--afh-text-small` weight 600, 44 px tall, the arrow written by the
component and nowhere else. Existing tokens only: no badge, no card, no new
colour. It names a page the reader goes to, so it is a link, not a button.

**Which name.** The link names the fiche's leading name: the name its h1
carries, spelt as the name story spells it. That is not always the self-name:
on Mandé the h1 says Mandé while the name story marks Manden as the name
given from inside; the link says Mandé, and the result page then leads
visibly to Manden (doctrine §1.1). Per board:

| Board                        | h1 today                           | The link names |
| ---------------------------- | ---------------------------------- | -------------- |
| `people-fula`                | Fulbe (pluriel), Pullo (singulier) | Fulɓe          |
| `people-bassa`               | Bassa                              | Bassa          |
| `people-thin-alaba`          | Halaba / Alaba                     | Halaba         |
| `language-lingala`           | Lingala                            | Lingala        |
| `language-thin-havu`         | Havu (kihavu)                      | Kihavu         |
| `family-bantu`               | Bantou                             | Bantou         |
| `family-mande`               | Mandé                              | Mandé          |
| `country-civ`, `-civ-quaqua` | Côte d'Ivoire                      | Côte d'Ivoire  |
| `country-state-thin-gab`     | Gabon                              | Gabon          |
| `country-state-shared-congo` | Congo                              | Congo          |

Two rows are spelling choices the operator confirms (see « Decisions »): the
Fula h1 writes Fulbe while the name story writes Fulɓe, and the Havu h1 leads
with Havu while the name story holds Kihavu and Haavu, not Havu.

**Where it sits.** At 430 px, as high in the first chapter as the chapter
allows, without moving any other block:

- **People:** the last line of « D'où vient le nom ? », after « voir les
  sources », before « Les autres noms ».
- **Language:** the last line of « L'histoire des noms », after the name rows
  (and, on Lingala, after the explanations grid), before « Les sources
  parlent ».
- **Family and country:** directly under the lead sentence and its « Lire la
  suite », before the name rows. On a country board that is inside « En
  bref ».

At 768 and 1440 it keeps the same place in the reading column.

**When there is none.** A fiche without a name story shows no link. The page
the link leads to would have no timeline to tell, so the link would promise
what it cannot keep.

### 2. A long chapter folds after its first tile (P07b)

**The rule.** A long reference chapter keeps its heading and its first tile
open. The tiles after it go behind one control, placed where the second tile
was. The control's label names what it hides, so even closed it states a
fact:

> « Voir aussi : Symboles, Arts et musique, Spiritualités, Organisation »

Opened, the hidden tiles appear in place, in their order, and the control
reads « − replier », the label the fiche tiles already use. The chapter itself
never closes. A chapter is long when it holds **three tiles or more**
(proposed threshold; the operator may change it). A chapter of prose fields
(the family boards) folds the same way, its first field standing for the first
tile.

**What never folds.** The chapters about the fiche's own names: « D'où vient
le nom ? », « Les autres noms », « L'histoire des noms », « Qui raconte… »,
« Appellations et décolonisation », « D'où vient le nom de la famille ». The
map « Où vit ce peuple ». The closing band, « Poursuivre avec un autre nom »
and « Sources ».
The page still ends on its closing band and its next names (README rule 7):
**the onward block stays at the end**, and the chapter order of REQ-154 and
REQ-155 does not change.

Reuse a disclosure that `Main` already draws (the « Lire la suite » summary or
the tile control « + en savoir plus »), and say which. Add a component to
`Main` only if neither fits.

**Per board**, the labels as each board writes them:

- `people-fula` and `people-bassa`:
  - « Langue »: « Langue principale » open; « Voir aussi : Famille, Parlers,
    Rôle véhiculaire ».
  - « Histoire »: « Formation et origines » open; « Voir aussi : Royaumes &
    chefferies, Influences extérieures, Conflits & alliances, Diaspora ».
  - « Culture et société »: « Rites » open; « Voir aussi : Symboles, Arts et
    musique, Spiritualités, Organisation ».
  - Unchanged: « Peuples liés » (two tiles), « Noms de personnes rattachés à
    ce peuple » (two short groups).
- `people-thin-alaba`: the same, with « Histoire » folding « Royaumes &
  chefferies, Influences extérieures, Conflits & alliances » (four tiles, no
  « Diaspora »).
- `country-civ`:
  - « Histoire »: « D'où vient le nom » open; « Voir aussi : 5 entités
    politiques, Royaume de Kong, Colonie de Côte d'Ivoire, République de Côte
    d'Ivoire ».
  - « Culture et société »: « Religions » open; « Voir aussi : Modes de vie,
    Organisation, Relations, Traditions ».
  - « Noms de personnes rattachés à ce pays » is a list of names, not tiles.
    The group « Attestés dans le pays · 47 noms » keeps its title and count;
    its A to Z index and its names go behind one control, « Voir les 47
    noms ». The second group is already a closed tile and stays so. This is
    the length proposal of brief 5 (about 2,300 px at 430).
  - Unchanged: « Peuples du pays », « Langues » (two tiles).
- `family-mande`:
  - « Caractéristiques linguistiques »: « Typologie » open; « Voir aussi :
    Traits phonologiques, Relations avec les voisins ».
  - « Histoire et origines »: « Origine probable » open; « Voir aussi :
    Période d'émergence, Diffusion, Ruptures historiques, Zones de contact,
    Événements majeurs ».
- `family-bantu`:
  - « Caractéristiques linguistiques »: « Typologie » open; « Voir aussi :
    Traits phonologiques, Relations avec les voisins, Innovations majeures ».
  - « Histoire et origines »: « Origine probable » open; « Voir aussi :
    Période d'émergence, Diffusion, Ruptures historiques, Zones de contact ».

The counts and labels come from the data; the board draws the ones above.

### 3. Refresh the stale filed name « Fula (Fulbe / Peul) »

Replace it by « Peul » wherever a fiche board or `Main` prints it, word for
word otherwise:

- `people-fula` (three widths), the breadcrumb: « Fulbe (pluriel), Pullo
  (singulier) — Peul »;
- `country-civ` (three widths), the preview of « Portés par les peuples du
  pays, sans attestation ici »: « Par Hausa, Akan, Asante, Bambara, Peul,
  Malinké, … »;
- `Main`, the breadcrumb of the fiche head and the fiche button: « Voir la
  fiche complète · Peul ».

The same button on `search-peul` changes in brief 11, which owns that board.

## To report before drawing (step 0)

- The y position at 430 where the story link lands on each board, and whether
  it is in the first screen (812 px).
- Each board's height at 430, and the height of each chapter that folds.
- On `country-civ`, the first tile of « Histoire », « D'où vient le nom »,
  repeats the lead sentence of « L'histoire des noms » word for word. Under
  the rule it is the tile left open. Report it; do not remove it (see
  « Decisions »).
- On the family boards, « D'où vient le nom de la famille » is one paragraph
  whose text repeats what « Lire la suite » opens in « L'histoire des noms »
  (733 px on Bantou, 2,594 on Mandé, measured for brief 4). The fold rule does
  not apply to a single paragraph. Report the overlap; do not remove it.

## States to draw (430 first, then 768 and 1440)

- Every board above with the story link, and the six fold boards with every
  fold closed.
- `people-fula` with « Culture et société » open: the four tiles in place and
  « − replier ».
- `country-civ` with « Voir les 47 noms » open.
- A fiche with no name story: no link. Draw it as a note on `Main`, not as a
  new board.

## Report after drawing

Each board's new height at 430, the y of « Poursuivre avec un autre nom »
before and after, and the y of the story link.

## Do not

- Move « Poursuivre avec un autre nom », the closing band or any chapter.
- Fold a chapter about the fiche's own names, or close a chapter whole.
- Write a control that hides without naming (« Voir plus », « Voir les 4
  autres rubriques »).
- Give the story link a badge, a card, a colour of its own or a second glyph.
- Show a tier, a score or a « most reliable » label.
- Redraw the approved components: reuse them from `Main`.

## Proposed requirement amendment (not applied)

For the operator to write on Confluence with `/ethniafrica-spec`. No charter
in this repository changes.

**REQ-153**, today: « a collapsed tile states a fact before it is opened,
opening adds content, and a chapter never itself collapses ». Proposed:

> A collapsed tile states a fact before it is opened, and opening adds
> content. A chapter never collapses itself: its heading and its first tile
> stay visible. A reference chapter of three tiles or more may fold the tiles
> after the first behind one control, whose closed label names each tile it
> hides (« Voir aussi : Symboles, Arts et musique, Spiritualités,
> Organisation ») and whose open label is « − replier ». A long list of names
> may fold behind its count (« Voir les 47 noms »). The chapters about the
> subject's own names never fold.

## Decisions for the operator

1. **Spelling of two link names.** Fulɓe (the name story) or Fulbe (the h1)
   on `people-fula`; Kihavu (the name story) or Havu (the h1) on
   `language-thin-havu`. The brief proposes the name story's spelling, since
   it is the form the result page tells. On the patronyme fiche (brief 6) the
   same rule gives Traoré, under an h1 that reads Traore today.
2. **The threshold** of a long chapter: three tiles or more.
3. **The repeated name origin.** Brief 5 proposed removing « D'où vient le
   nom » under « Histoire » on country fiches, and brief 4 proposed folding
   « D'où vient le nom de la famille ». Both are removals, not folds, and stay
   out of this pass unless the operator asks for them.
4. **Several subjects at the target.** « Congo » leads to a page where two
   countries answer (`search-congo`), and « Mandé » may lead to a page where
   the family and peoples answer. The page the link opens is the one a reader
   gets by searching that name; no parameter picks the subject. Adding one
   would be a new route behaviour, outside this brief.

## Not in this brief

- The « L'empreinte » wording on the family boards: a copy change inside an
  existing block, shipped without a board. When it is merged before this pass
  is recorded, the family boards take its words.
- The country eyebrow and the people hero chip (REQ-115): their own decision.
- The sources lists, already folded or out of the onward path.

## For the implementation (after approval)

- One component for the link, fed with the leading name and the fiche type;
  the click counts as `fiche:related_click` with `to: "name_story"`, and the
  goal's comment in `src/lib/analytics/trackEvent.ts` says it can lead to the
  result page.
- The copy goes in `src/lib/i18n/copy/ficheNameStory.ts` (`storyLink`,
  `storyLinkHint`) and `src/lib/i18n/copy/fiche.ts` (the fold labels). A
  closed fold label opens with the tile control's glyph, as « + en savoir
  plus » does: « + Voir aussi : … », « + Voir les 47 noms »; open, it reads
  « − replier ».
- Tests first, per the plan: the link on `PPL_ZARMA`, `CIV`, `FLG_MANDE` and
  `lin` with its target and its place (REQ-198); no link without a name
  story and the click event (REQ-046); a five-tile chapter keeping its
  heading and first tile with the other four in one disclosure that names
  them (REQ-153, as amended); the people chapter order test unchanged
  (REQ-155).
- Compare at 430, 768 and 1440 against the recorded boards before merging.
