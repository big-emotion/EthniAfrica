# Brief 7 — The place fiche

Read [`README.md`](README.md) first.

**Board to change** (at `-430`, `-768`, `-1440`): `place-yamoussoukro`,
about 3,633 px tall at 430 px (4 screens).

**Surface.** `/fr/atlas/lieux/[slug]`. The canvas holds one board for it. Only 4 place fiches exist
and 3 appear in the sitemap; none was visited in 30 days. This is the type with
the least evidence, so the board is a template to be tested, not a fix for a
measured problem.

## Subject: `LOC_YAMOUSSOUKRO`

This is the model the common `nameHistory` shape was generalised from. Real
data: *Yamoussoukro* is the current name of the place; it first bore the name
*N'Gokro*; the origin of the name *Yamoussoukro* is debated. Accounts:
Yamoussoukro 5, N'Gokro 4. Source types: academic, **community**, encyclopedia,
government, press. The community voice is the nearest the place corpus has to
the oral account; the board shows it on equal footing.

Social post already published: `yamoussoukro-d-ou-vient-le-nom` (carousel).

## Blocks, mobile 430 px

1. Verdict: current name, former name, a debated origin.
2. Who named whom: *Yamoussoukro* / *N'Gokro*; the debated origin as two
   hypotheses side by side.
3. The sources speak, the community account included.
4. **Type-specific: where and with whom** — the country as a name link, the
   associated peoples (`associatedPeoples`), a small locator map. The place is
   told through its name; the map locates it and does not decorate.
5. Closing band.
6. Next step: the country name (*Côte d'Ivoire*) and the people name.

## States to draw

The `LOC_YAMOUSSOUKRO` case, and a place with a single name (`Gagnoa`, `Daloa`,
from the operator's examples), whose board is the thinnest page of the site and
must still read as a page.

## Do not

- Draw a historical map the corpus does not hold.
- Treat the place as a tourist entry: no practical information.

## Approved boards (2026-10-18)

Recorded in `docs/design/mockups/site/`, group 4 of `canvas.json`. The brief
was rewritten on branch `feat/etni-2118-rewrite-place-word-briefs` (draft PR
#1865); this section was written against recette's copy and moves onto the
rewritten brief if that PR lands first. Every text comes from
`dataset/source/afrik/lieux/LOC_YAMOUSSOUKRO.json`, word for word, except the
sentence that opens the hypotheses tile (decision 2).

The operator approved the boards on 2026-10-18, with the step 0 proposals
(no locator map, since none existed on the boards, in the place page code or
in the fiche, which has no coordinates; « Poursuivre avec un autre nom » with
Côte d'Ivoire and Baoulé, the only fiches the place links to) and six
decisions:

1. The hypotheses tile does not fold: competing origins stay side by side and
   visible on arrival, the rule of the Fulɓe board of brief 15. The length is
   kept as drawn; the proposed cut (folding the tile behind one line, about
   1,050 px saved at 430 px) is not applied.
2. The tile opens with « Deux explications existent du passage du nom
   N'Gokro au nom Yamoussoukro, sans que l'une l'emporte. »
3. The sources block on a place fiche is titled « Les sources des noms de ce
   lieu », like the other fiche variants, with the sentence « Plusieurs
   sources expliquent les noms de ce lieu. Voici leurs 9 récits, rangés par
   nom, puis par type de source. »
4. « L'histoire des noms » replaces the question « D'où viennent ces noms ? »
   on the three place boards. Follow-up: align the copy
   (`src/lib/i18n/copy/ficheNameStory.ts`) and the country fiche boards, which
   keep the question for now.
5. The family account about Yaha M'so and « mousso » leaves the origin group
   and stands apart as « Récit de famille ». The fiche still places it in the
   same `hypothesisGroup` as the two accounts of the change. Follow-up: a data
   ticket for places, on the model of ETNI-2105.
6. The hypotheses are written twice, in the tile and in the sources block,
   as on `country-civ`: accepted for fiche variants.

- `place-yamoussoukro` at 430, 768 and 1440, top to bottom:
  - the header, the title « Yamoussoukro », « Ville · Côte d'Ivoire » and the
    breadcrumb, unchanged;
  - « En bref »: the fiche summary, then the name-history component titled
    « L'histoire des noms » with its sentence and « Lire la suite », the story
    link « Lire l'histoire du nom Yamoussoukro » (brief 10, with the plain
    label of brief 6), N'Gokro and Yamoussoukro with their periods (1848 or
    the 1860s; 1904 or 1909-1910) and meanings, then the readings tile of
    briefs 3 and 5: « Hypothèse 1 · 1904 » (Félix Houphouët-Boigny) and
    « Hypothèse 2 · Après 1909 ; 1910 selon la Fondation » (the town hall, the
    Fondation Félix Houphouët-Boigny, Wikipédia), in the fiche's order, each
    with its sources button, side by side from 768 px, then the family
    account;
  - « Les sources des noms de ce lieu », the fiche variant of the sources
    block: the nine accounts by name (Yamoussoukro open, then N'Gokro), then
    by source type, community sources first and on the same footing; source
    types shown, never a tier;
  - « Pays et peuples liés », unchanged;
  - the closing band « Ce que nous ne savons pas encore » with the fiche's
    four gaps, in its fiche variant (no thesis line);
  - « Poursuivre avec un autre nom »: Pays · Côte d'Ivoire and Peuple ·
    Baoulé, each with the first sentence of its fiche's summary;
  - the folded « Sources » list and footer B, unchanged.
- `ea-live.css` gains `.ea-readings-family` and two `.pl-card .ea-readings`
  rules. New selectors only, tokens only.

Choices made while drawing, kept by the operator:

1. The title change applies only to the place boards (decision 4).
2. The two founding accounts (1848, the 1860s) appear only in the sources
   block, under N'Gokro.
3. The family account carries the tag « Récit de famille · Début du XXe
   siècle », with its own sources button.
4. The next-step cards quote the first sentence of each fiche's summary.
5. The closing band uses the fiche variant, without the thesis line, as on
   `country-civ`.

Measured at 430 px with the board fonts, before and after: header 61 and
title block 273, unchanged; « En bref » 846 → 2,063; sources block 940 (new);
« Pays et peuples liés » 331; closing band 570 → 1,001; « Poursuivre avec un
autre nom » 410 (new); « Sources » 276; footer 1,391. Page 3,749 → 6,746 px
(768: 2,826 → 4,886; 1440: 2,658 → 4,411). Decisions 2 and 3 change no
height.
