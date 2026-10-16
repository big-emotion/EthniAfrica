# EthniAfrica Cartes 1.9.0-proposition: the double outline of the text on the image

**Status: accepted by the operator on 16 October 2026, with the designer's recommendations on its two questions.** The authority is the design system itself:

- `../../version.json`;
- `../../series.md`, « Legibility on light pictures: the double outline »;
- `../../handoff.md`, « Renderer integration of 1.9.0 », with its eight checks;
- the boards below.

The engine is `social/video` (`series-page.mjs`). No carousel card changes, and the map names on imagery keep their own halo.

The brief came from the Burkina Faso episode (series 1, episode 19). On light or busy pictures, the cream text on the image of the series video read only by its thin dark outline, and the operator found it hard to read. The full screen without shadow zones, decided on 14 October 2026, was not reopened: no band, no veil over a region, nothing fitted to the networks' interface.

## The operator's answers (16 October 2026)

1. **Treatment C, the double outline.** The 1.4.0 outline is kept (`on-image-stroke`, widths unchanged). A second contour follows it: the outlined letters grown by r = max(3, round(0.6 × outline)) px, in `on-image-ring` (#0b0806 at 62 %), its edge softened by 0.6 px. Its soft shadow, a Gaussian blur of the grown shape with a standard deviation of r, in `on-image-ring-soft` (#0b0806 at 45 %), replaces the 1.4.0 soft shadow (`on-image-shadow`).
2. **The lit word's box** gets a 2 px dark edge (`on-image-stroke` round its 6 px side extensions) and a shadow of 12 px spread 4 px at 55 %.

## What was measured

Contrast between the letter and the pixels within 0.12 em of it (at least 4 px), the lit word's box left out, 90th percentile, linear luminance, worst of thirteen frames (`series.md` has the full table):

| Text                 | A (1.4.0) | C (accepted) |
| -------------------- | --------- | ------------ |
| Band, 32 px          | 1.3:1     | 6.7:1        |
| Kicker, 30 px        | 1.0:1     | 4.8:1        |
| Subtitles, 56 px     | 1.2:1     | 7.9:1        |
| Edge of the lit word | 1.0:1     | 6.2:1        |
| Source, 24 px        | 1.3:1     | 6.8:1        |
| Credit, 22 px        | 1.2:1     | 4.4:1        |

On pure white pictures the boards measure 7.9:1 for the subtitles, 6.3:1 for the band, 6.4:1 for the source and 4.2:1 for the credit. On dark pictures the second contour melts into the image.

## What this folder holds

- `claude-design-brief.md`: the brief the coordinator relayed to Claude Design.
- `boards/`: the accepted boards as Claude Design drew them, `video-190-*`. The cards are the Burkina Faso episode's. The Boulton, Mouhoun, Place de la Révolution and Tanoboase frames carry its texts as demonstration, and Boulton's map is the library's web rendition, softer than production.
  - The problem on a working render of the episode: `probleme`.
  - The five treatments on the lightest pictures: `options-tiebele`, `options-avion`, `options-boulton`, `options-ciel`.
  - The treatment by text: `sous-titres` (the subtitles and the lit word), `pied` (the source and the credit), `bandeau` (the band and the kicker), `document` (the 1.8.0 document card), `fin` (the ending).
  - Dark pictures: `sombres`. The measures: `mesures`. The feed at 430 px: `430`.
  - Full frames: `plein-*` (treatment C, and `plein-bfa-01-A` for 1.4.0).
