# EthniAfrica Cartes 1.12.0-proposition: teaching cards in motion

**Status: accepted by the operator on 20 October 2026, with the designer's recommendations on its eight questions; the three drawings stay as drawn** (« oui j’accepte mais rajoute le dessin », in reply to a proposal to drop the Kwa drawing). The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « Teaching cards in motion and the parchment card (1.12.0-proposition) », its four parts and « Decided by the operator on 20 October 2026 »;
- `../../handoff.md`, « Renderer integration of 1.12.0 », with its card data, six engine steps and seven checks;
- `../../assets/Illustrations/`, the three drawings `courageux.svg`, `agile.svg` and `serviteur.svg`;
- the boards below.

The engine is `social/video`. No carousel card changes.

The brief came from the operator's review of the narration v8 of « Kouassi et Yao » (series 3, episode 1): the week table girl | day | boy, one people per table, animated; the name formulas animated more visibly than a cross-fade; drawings in the series' hand for what a name says; a parchment card with motion-design text for a passage with nothing to show but words.

## The operator's answers (20 October 2026)

1. **The week table:** one card per people when the voice leaves it 7.2 s or more; two cards otherwise (Monday to Thursday, Friday to Sunday).
2. **The lit row:** an ochre band, the other rows receding to 40 %; no change of size; two lit rows at most.
3. **The formula's moves:** appear, join, fall, become, each on its word; the printed « = » and « → » give way to the moves. A static formula (carousel) keeps 1.8.0.
4. **The drawings:** full figures in a scene; the three of the boards as drawn, `serviteur` included.
5. **The ground:** the idents' ground and grain, unchanged.
6. **Band and head** kept on parchment cards, in Parchemin inks.
7. **Teaching cards on parchment:** the week table, the formula and the side-by-side forms leave the photograph.
8. **Subtitles on parchment** in `ink` without outline, the lit word on an `accent` box in #fffaf0.

## What was measured on the boards

| Measure                 | Value                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| Content zone            | between the head and y 1300; nothing under the subtitles                    |
| Week table              | y 490 (people) to 1262 (last row), rows 96 px apart from y 590              |
| Week table reading time | 152 characters: 7.2 s at 21 characters a second, 8.9 s at 17                |
| Cascade                 | seven rows in 0.9 s: 300 ms each, rising 16 px, 90 ms apart                 |
| Formula                 | lines at y 760 and 980, fallen pieces down to y 1150, note at y 1226        |
| Formula moves           | appear 300 ms, join 450 ms, fall 500 ms (104 px, 55 %, 30 %), become 300 ms |
| Drawings                | 470 px wide two by two from y 610; 560 px wide alone from y 600             |
| Attribution box         | ends at y 1296                                                              |
| Law card                | quotation from y 720 to 930, conclusion from y 1044 to 1172                 |
| At 430 px               | a name of the week table 19 px high                                         |

## Corrections to the boards

The law card's boards print its source as « Loi n° 64-381 du 7 octobre 1964 relative au nom, article 3 » and, in the foot, « Journal officiel de la Côte d'Ivoire ». Neither is the law's wording. The engine's demonstration uses « Loi n° 64-381 du 7 octobre 1964, article 3 » and the quotation « Ce nom devient son nom patronymique ainsi que celui de ses enfants mineurs […] ».

## What this folder holds

- `claude-design-brief.md`: the brief relayed to Claude Design.
- `boards/`: the accepted boards as Claude Design drew them, from the narration v8 (demonstration text, estimated timings):
  - `video-1120-avant.jpg`: today's teaching cards on the gold-weights photograph;
  - `video-1120-semaine.jpg`: the week table, Baoulé entering, Twi with its two lit rows, the summary;
  - `video-1120-formule.jpg`: the Friday formula (Aya, Kwa + ya → Yao, « Kwao »);
  - `video-1120-formule-lundi.jpg`: the Monday formula (Akissi, Kouassi) and the Twi one (Kwasi, Akosua);
  - `video-1120-dessins.jpg`: the three drawings with their attributions;
  - `video-1120-loi.jpg`: the parchment text card, the 1964 law;
  - `video-1120-sous-titres.jpg`: the subtitles on parchment;
  - `video-1120-passage.jpg`: the change from a map card to a parchment card;
  - `video-1120-grille.jpg`: the 3:4 grid crop;
  - `video-1120-mesures.jpg`: the measures;
  - `video-1120-430.jpg`: the cards at 430 px.

The animated previews stay outside git, in `.local/research/social-production-2026-10-09/design-system-1.12.0-boards/videos/` (540 × 960, 15 frames a second, the grain without its blend mode), with the full-size frames in `plein-ecran/`. Not deposited: `design-system.json`, the component's `preview.html` and the board renderer in `tools/`.

## Integration, 20 October 2026

**Engine** (`social/video`). The six steps of the handoff: the ground (`series-page.mjs` with `social/series-idents/ground.css` and `ground.mjs`, now shared with the idents), the week table, the formula's moves, the drawings, the parchment text card and parchment phases (`series-teaching.mjs`, wired into `series.mjs`). A card without `ground` keeps its frame model and its pixels. The checks are in `series-teaching.test.mjs` (frame model) and `series-teaching.render.test.mjs` (drawn), on `fixtures/series-teaching.mjs`.

**Carousel.** No card changes: the bundle's version string is the only change to the design system's code.

**Choices left open by the handoff.**

- The text card takes the handoff's `date` as a string, with `dateLabel`; an optional `dateSay` brings the date on its word, otherwise it enters with the card. A drawing's quality takes an optional `qualitySay`. A week table without `say` is a summary and enters whole.
- A state without a move lists its line; it may name an earlier piece by its id. `join`, `fall` and `become` name the pieces they act on. A fallen piece stays under where it stood before it fell, while the rest of the line re-centres.
- A formula holds two lines at most, the boards' y 760 and 980.
- The frame model gives each move's progress linearly; the page eases it out (a cubic), so nothing overshoots.
- The blocks under the head are the week table, the formula, the drawings, the quotation, its source and the free words; the attribution is not counted.
- Every run of parchment cards lasts 180 frames at least, not only one between two map cards.
- A parchment card prints no picture credit: it shows no picture.
- Two parchment cards in a row keep one ground: the incoming card draws none during the change and the clock runs from the run's first frame. The render test checks this on the page (one ground drawn, the same offsets), not by a pixel difference, since the grain moves every frame.
