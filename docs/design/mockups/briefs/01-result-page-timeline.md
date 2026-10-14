# Brief 1 — The search result page with the timeline lens

Read [`README.md`](README.md) first (rules, spine, thesis slot, workflow).

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
   default, then Tout, Shorts, Récits, Jeux, Fiches). Unchanged.
2. Eyebrow « D'où vient ce nom », the name large, then the one-sentence verdict.
3. Name chips, the searched name first; one name open at a time.
4. The timeline for the open name: left thread, period set large at the top of
   each tile, the terre cuite birth tile (« Naissance du nom »), dashed tiles
   for « Avant le nom », the « on remonte le temps » hint.
5. **The sources speak** (new): the same accounts regrouped by source type.
6. Closing band: silences, conviction, thesis slot, invitation to correct.
7. **Next step**: two related *names* chosen from the subject's own data
   (for `peul`: *Toucouleur*, the name with the most accounts, and the language
   name *Fulfulde*), each with one line saying why. Check that the target
   fiche exists before drawing it.

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
