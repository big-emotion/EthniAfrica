# Brief 7 — The place fiche

Read [`README.md`](README.md), `docs/design/mockups/site/README.md` and
`docs/design/mockup-first-workflow.md` first. Brief 15 is recorded; this pass
comes after it. Work on the three `place-yamoussoukro` boards, one width at a
time: 430 px, then 768 px, then 1440 px. Do not change the glossary or other
page boards.

## Surface and data

The surface is `/fr/atlas/lieux/[slug]`. Five place fiches exist:
`LOC_AFRIQUE`, `LOC_DALOA`, `LOC_GAGNOA`, `LOC_SAHARA` and
`LOC_YAMOUSSOUKRO`. This pass uses only the Yamoussoukro fiche. The board is a
reference for that real page, not a generic place template.

Use `dataset/source/afrik/lieux/LOC_YAMOUSSOUKRO.json` as the source of truth.
Keep its wording, dates, attribution and uncertainty. Do not add claims from
memory or from another page. In particular:

- The current name is Yamoussoukro; the earlier name is N'Gokro.
- The fiche reports different accounts for the village's founding and for the
  later name change. Keep the reported dates as alternatives: 1848 or the
  1860s for the founding; 1904 or 1909–1910 for the change.
- Show the two accounts about the change side by side as « Hypothèse 1 » and
  « Hypothèse 2 », in a neutral order. Do not present either as settled.
- Keep the account that relates Yamousso to the name and the baoulé ending
  « -kro » with its stated sources. Keep the separate family account about
  Yaha M'so and « mousso » attributed and uncertain.
- Keep the gap about the absence of a dated colonial document and the 1918
  civil-status register that remains to be consulted.
- The place is linked to Côte d'Ivoire and to the Baoulé; the fiche describes
  the village as akouè, a fraction of the Baoulé, according to family and
  chiefly accounts.
- The fiche has nine top-level sources. Their source types include academic
  work, community accounts, an encyclopedia, government and press. Show the
  source type; never show the internal source tier.

## What is on the boards today

Audit the three recorded boards before drawing. At 430 px the current page has
the site header, the title « Yamoussoukro », its place and country line, a
breadcrumb, « En bref », the name-history link, a short history of Yamoussoukro
and N'Gokro, « Pays et peuples liés », a closing band, a folded « Sources »
chapter and footer A. The board already includes the Baoulé relation and the
place's two naming periods. Report any difference you find at 768 and 1440 px
instead of assuming those boards match.

## What to change

Keep the page about the place's names and their history. Reuse the approved
components from `Main` and the recorded boards:

1. Keep the place name, country line, breadcrumb and « En bref ».
2. Present Yamoussoukro and N'Gokro in the existing name-history component.
   Put the two name-change accounts side by side as « Hypothèse 1 » and
   « Hypothèse 2 », each with its own source links and attribution. Preserve
   the uncertainty in the dates and in the accounts. Do not add a winner,
   confidence ranking or unsupported historical map.
3. Keep the existing country and linked-people block and its locator map. The
   map locates Yamoussoukro; it is not a historical map or decoration.
4. Reuse the approved closing band « Ce que nous ne savons pas encore » for
   the gaps in the fiche. Do not render an empty chapter.
5. Reuse the approved link to the name's story from brief 10, with a plain
   label, and the approved « Poursuivre avec un autre nom » component. Use only
   related names that the project can support; do not invent a destination to
   fill the space.
6. Reuse the approved sources block, titled « Les sources du nom Yamoussoukro »
   with one plain sentence below it. Group accounts by the name first, then by
   source type. Include the community accounts on equal visual footing with
   other source types.
7. Use footer B from `Main` and the approved story link and fold components.

At 430 px, check the reading order and text wrapping first. Then adapt the same
content to 768 and 1440 px; do not omit a claim or uncertainty at wider sizes.
Use the site's existing tokens and components.

## Length proposal

Measure the current and proposed 430 px board. If a section can be shortened or
folded without removing a distinction, propose the change and the estimated
height saved. Do not apply a length cut without the operator's decision.

## Step 0 and approval

Before changing anything, report in six lines: the blocks currently present
on each of the three boards; where the two name-change accounts appear; whether
the current source block groups accounts by name and source type; whether the
closing band, story link, next-name component and footer B are present; which
content disagrees with the source fiche; and any choice that needs the
operator. Change nothing in this step. Then wait for the operator's decisions.

After receiving those decisions, draw and label the three boards, 430 px first.
List in five lines any remaining choices you made. Wait for the operator's
approval before recording the boards in the repository. Keep the glossary
board untouched.

## Approved boards (2026-10-18)

Recorded in `docs/design/mockups/site/`, group 4 of `canvas.json`. The brief
was rewritten on branch `feat/etni-2118-rewrite-place-word-briefs` (PR #1865).
This record was first written against recette's copy and is now joined to the
rewritten brief. Every text comes from
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
