# Brief 1 — The search result page with the timeline lens

Read [`README.md`](README.md) first (rules, spine, thesis slot, workflow).

**Status: approved by the operator on 2026-10-14.** The boards are recorded in
[`../site/`](../site/README.md); the decisions taken in review are listed at
the end of this brief, under "Approved boards".

**Boards to change** (canvas stems, each at `-430`, `-768`, `-1440`):
`search-peul` (the model), then `search-bassa`, `search-congo`,
`search-unknown`.

**Already on `search-peul`, do not redraw:** search field and lens bar
(« Histoire du nom » default), the verdict card with the self-name lead
(« Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. »), the name
chips, « On remonte le temps » and « Pendant ce temps, ailleurs », the
timeline with its terre cuite birth tile (1842), the closing line and the
button « Voir la fiche complète ». The page then goes straight to the
footer.

**To add, between the timeline and the footer:** the sources block, the
closing band (silences, conviction, thesis slot, invitation to correct),
and the next step. These are the blocks 3, 5, 6, 7 and 8 of the spine; the
page has none of them today.

**Surface.** `/fr/atlas/recherche`, built by
`src/components/pages/RecherchePageContent.tsx` and `src/components/search/`.
This is the central surface: a reader searches a name and the page answers.

**Why it is first.** The page ends on the timeline and offers nothing
else. Measured 2026-10-13: bounce 8 % → 34 % in five days, 3.8 searches per searcher
for 13 result clicks. The timeline fires no click event, so the cause is
unknown. The board must make the "next step" visible so that the instrumentation
has something to count.

## Subject: `peul`

Real data (`PPL_FULA.nameHistory`): the name *Peul* designates a people that
calls itself *Fulɓe* (*Pullo* for one person). Other names: *Haalpulaar'en*,
*Futankooɓe*, *Fula*, *Fulani*, *Fellata*, *Toucouleur*. Accounts per name: Fulɓe
10, Haalpulaar'en 4, Futankooɓe 1, Peul 4, Fula 8, Fulani 8, Fellata 8,
Toucouleur 13. The sources do not always agree on origins. Source types present:
academic, archive, encyclopedia, intergovernmental, linguistic reference, press.

Quote the real `summary` sentence for the verdict. Lead visibly to the
self-name: « Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. »

## Blocks, mobile 430 px, in order

1. Search field with the query kept in it; lens bar (« Histoire du nom »
   default, then Tout, Shorts, Récits, Jeux, Fiches, as on the board). Unchanged.
2. Eyebrow « D'où vient ce nom », the name large, then the one-sentence verdict.
3. Name chips, the searched name first; one name open at a time.
4. The timeline for the open name: left thread, period set large at the top of
   each tile, the terre cuite birth tile (« Naissance du nom »), dashed tiles
   for « Avant le nom », the « on remonte le temps » hint.
5. **The sources speak** (new): the same accounts regrouped by source type.
6. Closing band: silences, conviction, thesis slot, invitation to correct.
7. **Next step**: two related *names* chosen from the subject's own data
   (for `peul`: *Wolof*, because the first account says the French form comes from
   the Wolof, and *Atlantique*, the language family of the Peul), each with one
   line saying why. Drawn as links to the result pages « wolof » and
   « atlantique »; no target board is needed. *Toucouleur* is not offered: it is
   already a chip of the same subject. There is no *Fulfulde* fiche in the corpus.

## States to draw (mobile first, then 768 and 1280)

- Rich: `peul`, first name open, one account folded and one unfolded.
- Thin: a subject with a single name and one dated account (`Ekpeye` case).
- Competing origins: two accounts in the same period labelled « hypothèse 1 »,
  « hypothèse 2 », neutral order.
- No dated origin: the honest notice of the timeline decision.
- Several entities answer one query (`bassa`, `congo`): the disambiguation
  comes before the verdict.
- Unknown name (`Introuvable`): the verdict still exists (« Nous ne connaissons
  pas ce nom ») and offers a next step. 8 of the week's searches found nothing.

## Do not

- Re-draw the lens bar from scratch: reuse `FeedLensId` labels from
  `src/lib/search/searchLenses.ts`.
- Show a tier, a score or a "most reliable" label on any account.
- Put the thesis anywhere but the closing band.

## Approved boards (2026-10-14)

Recorded in `docs/design/mockups/site/`. The implementation reproduces them.

- `search-peul`, `search-bassa`, `search-congo`, `search-unknown`, each at 430,
  768 and 1440, gain three blocks between the timeline and the footer:
  « Les sources parlent » (block 3), the closing band (blocks 5 to 7) and
  « Poursuivre avec un autre nom » (block 8). « Voir la fiche complète » stays
  under the timeline.
- Three state boards: `search-state-thin` (« wolof »: one name, one account,
  undated), `search-state-competing` (« yamoussoukro »: Hypothèse 1 and
  Hypothèse 2) and `search-state-nodate` (marked example, to replace).
- `Main` gains the three components.

Decisions taken in review:

1. Block 3 groups the accounts of the open name by the seven source-diamond
   families (`src/lib/sources/sourceKindFamily.ts`), in the code's fixed order,
   oral first; the precise kind of each source is printed beside its title.
   On a page with several subjects, each subject has its block 3, the first
   open and the others folded.
2. The closing band reuses the site's own copy: the « Notre conviction »
   sentence and the correction invitation of the about page, the buttons
   « Signaler une erreur » and « Proposer une source », and the title « Ce que
   nous ne savons pas encore ». The thesis line stays `[THÈSE — texte à fixer]`.
   On the unknown-name page the existing « Nous nous sommes trompés ? » card is
   the invitation.
3. Next-step targets: Wolof and Atlantique (`peul`), Krou and Nupe (`bassa`),
   Kongo and Mossi (`congo`), Siwi and Tchad (`unknown`), each with a reason
   taken from the target's fiche. They link to the result pages of those names.
4. The competing-origins board shows the two hypotheses the operator named;
   the corpus holds a third for Yamoussoukro (the queen's first name, Yaha
   M'so), which the live timeline already shows as « Hypothèse 3 ».
5. Silences come from the corpus and the boards' own copy, one per line; a
   page never declares a silence its data does not support.

