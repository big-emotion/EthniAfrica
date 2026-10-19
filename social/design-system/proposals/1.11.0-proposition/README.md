# EthniAfrica Cartes 1.11.0-proposition: the animated satellite map

**Status: accepted by the operator on 19 October 2026, with the designer's recommendations on its eight questions** (« j'accepte toutes les recommandations »). The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « The animated satellite map (1.11.0-proposition) », its ten parts, « Closer views and the imagery » and « Decided by the operator on 19 October 2026 »;
- `../../handoff.md`, « Renderer integration of 1.11.0 », with its card data, seven engine steps and eleven checks;
- `../../assets/Illustrations/`, the eight drawings of series 1;
- the boards below.

The engine is `social/video` (`page.mjs`, `series-sequence.mjs`, `series-map.mjs`, `series-page.mjs`, `series.mjs`). No carousel card changes.

The brief came from the operator's review of the animatic of the long Burkina Faso episode (series 1, episode 19, version 3): the map carries the video and is understood without sound; satellite imagery, never a flat printed map; an opening globe; drawn illustrations; closer views and true proportions; maps when the text situates, pictures when it does not. It replaces question 11 of the 1.10.0 brief.

## The operator's answers (19 October 2026)

1. **Closer views:** the NASA Blue Marble mosaic at 500 m (tiles B1 and C1) is verified and pinned like the 2 km file. Until it is, the 1.5 limit holds (1336 km across) and a closer view is refused.
2. **The ink follows the people:** one ink per people for the whole episode, shared by all its areas, each keeping its own name.
3. **Moves inside a card:** two at most, on a word, 1.6 s, flat.
4. **A name that changes:** B, the old name steps aside with its dates while the new one takes the outline.
5. **The illustrations' hand:** the eight drawings of the boards are the reference for series 1.
6. **A picture phase:** 6 s at least, whole sentences.
7. **Eight texts on the map** at once, two of them words, in place of 1.4.1's six names.
8. **The colonial power in cream** (`map-foreign`), outside the four inks.

## What was measured on the boards

| Measure                                           | Value                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| Closest view, verified 2 km file at the 1.5 limit | 1336 km across; a Mossi kingdom about 90 px wide (36 px at 430)    |
| Closest view, 500 m mosaic at the 1.5 limit       | about 360 km across                                                |
| Tenkodogo at the 2 km limit                       | s 90 px: arrow 6 px, head 22 × 19 px, drawing 100 px               |
| Mossi plan                                        | s 115 px (Tenkodogo): arrow 8 px, drawing 127 px                   |
| Dioula plan                                       | s 131 px (Manden): arrow 9 px, drawing 144 px                      |
| 1932 plan                                         | s 166 px (the Niger part): arrow 10 px, drawing 150 px             |
| Moves inside a card, radius ratio                 | 1.15 (Dioula), 2.0 (Mossi), 1.6 (1932); 2.5 at most                |
| Opening                                           | radius 300 px at frame 0, 430 px at 1.8 s, the first view at 4.4 s |

s is the shorter side, in frame pixels, of the bounding box of the smallest area lit on screen. The arrow is `clamp(round(s / 14), 5, 10)` px wide and the drawing `clamp(round(1.1 s), 100, 150)` px high.

## The silent viewing check, before and after

On the Mossi plan (`video-1110-sans-le-son.jpg`), sampled every 100 ms. A fact passes when one of its marks is on screen for 80 % of its spoken time or more, the first within 700 ms of its first word.

| Fact                                          | Mark                                       | Before         | After       |
| --------------------------------------------- | ------------------------------------------ | -------------- | ----------- |
| Les Mossi parlent le mooré                    | « mooré : la langue des Mossi »            | fails: no mark | 87 %, 0.2 s |
| leurs ancêtres sont des cavaliers             | the drawing `cavaliers`                    | 86 %, 0.4 s    | 86 %, 0.4 s |
| venus du nord du Ghana actuel                 | the Mamprusi area, Gambaga                 | 100 %, 0 s     | 100 %, 0 s  |
| avec la princesse Yennenga                    | « princesse Yennenga »                     | 84 %, 0.3 s    | 84 %, 0.3 s |
| ils fondent les royaumes mossi                | the three kingdoms, the arrow from Gambaga | 100 %, 0 s     | 100 %, 0 s  |
| vers la fin du XVe siècle, selon Michel Izard | « fin du XVe siècle, selon M. Izard »      | 87 %, 0.3 s    | 87 %, 0.3 s |

The first try failed on the first fact, with nothing on screen while it was said; with « mooré : la langue des Mossi » on the map, the six facts pass.

## What this folder holds

- `claude-design-brief.md`: the brief relayed to Claude Design.
- `boards/`: the accepted boards as Claude Design drew them, from the animatic of the Burkina Faso episode (demonstration text and timings, on the verified Blue Marble file):
  - `video-1110-ouverture.jpg`: the opening globe, six frames from the cover to the first lit country;
  - `video-1110-dioula.jpg`, `video-1110-mossi.jpg`: two map phases with moves inside the card, arrows, drawings and words;
  - `video-1110-1932.jpg`: the split of 1932 (a territory changing ink) and the return of 1947;
  - `video-1110-1984.jpg`: the name that changes, variant B (kept) and variant A (not kept);
  - `video-1110-phases.jpg`: map and picture phases, with the refused 2.6 s insert;
  - `video-1110-illustrations.jpg`: the eight drawings beside the smallest area of the episode;
  - `video-1110-mesures.jpg`: the proportion rule on three plans;
  - `video-1110-plus-pres.jpg`: closer views and the imagery's limit;
  - `video-1110-sans-le-son.jpg`: the silent viewing check, before and after;
  - `video-1110-430.jpg`: the plans at 430 px.

The animated previews stay outside git, in `.local/research/social-production-2026-10-09/design-system-1.11.0-boards/videos/`: `ouverture.mp4`, `dioula.mp4`, `mossi.mp4`, `1932.mp4`, `1984.mp4` and the refused insert `pingpong.mp4` (540 × 960, 30 frames a second; they draw the text outline without the second contour, for speed). The full-size frames are in `plein-ecran/` of the same folder. The Mossi and 1896 plans are drawn closer than the 2 km file allows (1.9 and 1.75 times), soft on purpose, to show the framing the 500 m mosaic allows.

## Integration, 19 October 2026

**Engine** (`social/video`). The seven steps of the handoff: the opening globe (`page.mjs`), the timeline (`series-sequence.mjs`), inks, proportions and placement (`series-map.mjs`), the drawing (`series-page.mjs`), picture phases and the silent viewing check (`series.mjs`). The 500 m mosaic (tiles B1 and C1) is verified and pinned, so the closer views of the boards are allowed. A map card without the new fields keeps the 1.5.0 frame model. The checks are in `series-animated.test.mjs` (frame model) and `series-animated.acceptance.test.mjs` (drawn on the imagery).

**Carousel.** No card changes: the 89 sample cards are byte-identical with 1.10.0, alternative texts included.

**Choices left open by the handoff.**

- Two moves are « 60 frames apart » from start to start.
- A word made to go by a third word is not counted while it fades out.
- The 12 px clearance is measured from half opacity, on still frames. It applies to arrowheads at rest, not to a head passing by while its arrow draws. For a drawing, it uses the drawing's own ink rather than its 160 × 132 box.
- A drawing's label and the rename's three texts are each read as one group.
- Some of the boards' anchors are less than 12 px apart, so the test fixture moves them.
- The silent viewing check counts a mark only when it is on screen.
- The board renderer's camera cubic used a different interior slope. The engine uses the standard Fritsch–Butland slope, with zero speed at both ends.

**Not done yet.** The Burkina Faso episode as a whole is a separate task. Its working copy is outside git, in `.local/research/social-production-2026-10-09/integration-1.11.0-bfa/`. Its 15 map phases are written in the new card data, and its 58 facts pass the silent viewing check on the frame model. The full drawn sweep, the comparison with the boards at 430 px and `video-tests.json` are still to do.
