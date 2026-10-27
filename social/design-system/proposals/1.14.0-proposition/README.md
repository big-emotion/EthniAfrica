# EthniAfrica Cartes 1.14.0-proposition: figures and facts drawn on the map of the series video

**Status: accepted by the operator on 21 October 2026, with the designer's recommendations on its eight questions** (« ok pour tes recommandations »). The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « Figures and facts drawn on the map (1.14.0-proposition) », its thirteen parts and « Decided by the operator on 21 October 2026 »;
- `../../handoff.md`, « Renderer integration of 1.14.0 », with its card data, ten engine steps and ten checks;
- `../../tokens.json`, four colour tokens, five durations and three sizes;
- `../../assets/Illustrations/`, eight new drawings: `personne-1.svg` to `personne-6.svg`, `bulle.svg`, `livre.svg`;
- the boards below.

The engine is `social/video`. No carousel card changes.

The brief came from the operator's review of 21 October 2026 of the episode « Afrique » (series 6 « L'Afrique n'est pas un tout », n° 1), rendered on Cartes 1.13.0: « Ça ne sert à rien d'avoir une carte représentative et d'afficher du texte. » The subtitles carry the words; the map carries the facts. The brief is `claude-design-brief.md`.

## The operator's answers (21 October 2026)

1. **The age:** two glasses with an age scale (0 to 60), each filled to its median age (Africa 20, the world 31); not the map filled from the bottom, which reads as « the south is younger ».
2. **The people unit:** 1 figure for 100 million, 15 on the continent for 1.5 billion.
3. **The figure head:** in the head's place, counting the drawings on screen and landing on the spoken figure.
4. **Sentences on the map:** never. A sentence goes into the headline band or onto a parchment card; the signed position stays a picture phase. A map word is a name, a date or a century.
5. **Placing units:** by the source's regional breakdown, or in a row off the land when the source has none; never scattered for decoration.
6. **Territories the source does not count** (Western Sahara, Somaliland): a dashed outline, unlit and unnamed.
7. **The new drawings** (`personne-1` to `personne-6`, `bulle`, `livre`): as drawn.
8. **Stamps on the map:** only a verdict the narration says, two words at most (« sans source », « ? »).

## What was measured on the boards

| Measure          | Value                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Texts on the map | the five cards drawn: 19 texts on the 1.13.0 render, 16 of them sentences; with 1.14.0, no sentence    |
| Figures card     | six facts marked with no text on the map (five texts before), each first mark within 0.5 s of its word |
| Figure head      | Anton 176/156 at x 60, top at y 318; unit in Nunito Sans 800 44/52; « plus de » in 800 36/42           |
| Cascade          | 54 states, west to east, in 1.5 s, each with the 700 ms swell; context fill 40 %                       |
| People           | 1 figure = 100 million, 15 figures, 92 px tall, 90 ms apart, the pop from the feet (110 %)             |
| Bubbles          | 1 bubble = 100 languages, 20 bubbles, 40 px, 50 ms apart                                               |
| Row of five      | figures 118 px tall, 116 px apart, feet at y 1240; the lit one with an accent ring                     |
| Glasses          | age scale 0, 20, 40, 60; fill with ease-land in 1.2 s; label Anton 72 on the waterline                 |
| Lettering        | Fraunces 700, tracked 0.26 em, 50 to 64 px, cream with an 11 px dark outline, 50 to 70 ms a letter     |
| Stamp            | two words at most, cream paper, double 6 px rule in stamp-ink, −6 to −8°, 140 → 100 % in 180 ms        |
| Name frame       | drawn in 900 ms; « AFRIQUE » brought from 55 % to full size in 950 ms                                  |
| Travelling book  | 1.9 s along a dotted route, ease-move                                                                  |
| Silent viewing   | every fact of the five cards marked 80 % of its time, the first mark within 700 ms                     |

The units' placement by region on the boards is demonstration (people: East 5, West 4, North 3, Centre 2, South 1; languages: West 9, Centre 5, East 3, South 2, North 1). An episode places its units from its own sourced breakdown.

## What this folder holds

- `claude-design-brief.md`: the brief relayed to Claude Design.
- `boards/`: the accepted boards as Claude Design drew them on the episode « Afrique »:
  - `video-1140-avant.jpg`: the figures card as rendered on 1.13.0, before;
  - `video-1140-chiffres.jpg`: the figure head, the cascade, people, one in five and languages;
  - `video-1140-age.jpg`: the two glasses, and the operator's version (the map filled from the bottom) set aside;
  - `video-1140-ancre.jpg`: the figure head anchored on the continent, set aside;
  - `video-1140-lectures.jpg`: readings pinned, « AFRICA » lettered and the « ? » stamp;
  - `video-1140-noms.jpg`: names lettered across the lands they named and the « sans source » stamp;
  - `video-1140-cadre.jpg`: the empty name frame and « AFRIQUE » brought from outside;
  - `video-1140-livre.jpg`: Léon l'Africain's book travelling from Fès;
  - `video-1140-dessins.jpg`: the eight new drawings;
  - `video-1140-grille.jpg`: the 3:4 grid crop;
  - `video-1140-430.jpg`: the frames at 430 px.

The five animated previews stay outside git, in `.local/research/social-production-2026-10-09/design-system-1.14.0-boards/videos/` (540 × 960, 30 frames a second, on the episode's own voice, mixed with the operator's cue palette and the bed « afrique-du-sud » at −16 LUFS): `video-1140-chiffres.mp4`, `video-1140-lectures.mp4`, `video-1140-livre.mp4`, `video-1140-noms.mp4`, `video-1140-cadre.mp4`, and all five in `video-1140-suite.mp4`; each with its `*.cues.json`. The full-size frames are in `plein-ecran/` with `report.json`. Not deposited: `design-system.json`, the component's `preview.html` and the board renderer and mixer in `tools/`.

## Integration (21 October 2026)

The engine integration and its evidence are in [`integration-2026-10-21/`](integration-2026-10-21/video-tests.json):

- `video-tests.json`: the runs, the episode « Afrique » rendered on 1.14.0 (sound, silent viewing check, texts on each map before and after), the sourced breakdowns;
- `planches-et-episode-430.jpg`: board | episode at 430 px, nine frames of the five cards.
