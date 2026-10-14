# EthniAfrica Cartes 1.4.0-proposition: the series video in full screen

**Status: accepted by the operator on 14 October 2026, and integrated.** The authority is the design system itself: `../../version.json`, `../../series.md` (« Vidéo de série »), `../../handoff.md` (« Renderer integration of 1.4.0 »), the `on-image-*` tokens of `../../tokens.json` and the board `../../handoff/video-board-full.html`. The engine is `social/video/series*.mjs`.

The operator withdrew the series video's layout B on 14 October 2026: the image fills the whole frame, only text sits on it, with no shadow zone and nothing fitted to the networks' interface. He accepted the full-screen proposal the same day with the designer's four recommendations: the same light inks on a dark outline in both themes, the heads swapping inside the 300 ms card change, the series band at y 250, and 9:16 base maps for map cards whose card base map is too short.

What this folder holds:

- `claude-design-brief.md`: the brief the operator gave Claude Design.
- `boards/`: the accepted boards as Claude Design drew them, at full size and at feed size (430 px): cover, subtitle with the lit word, the card change at 100 and 200 ms, a long date, a map card, a Parchemin card, the « image à trouver » slot in both themes, both endings, the guides, legibility on the hardest images, the Parchemin inks compared, long dates, the framing of wide images and a refused map. Their text is demonstration text and their images are web renditions, enlarged 1.8 to 3.7 times.
- `integration-2026-10-14/`: the integration evidence. `cards-1.3.0-vs-1.4.0.json`: the 89 sample cards rendered with the 1.3.0 and 1.4.0 design on one browser, identical pixel for pixel, alternative texts included, so the renderer's reference hashes are unchanged. `video-tests.json`: the test runs. `engine-frames/` and `demo-video-manifest.json`: key frames and the manifest of the series 1 demonstration encoded by the integrated engine.

Still to do: run the video and renderer tests and the fidelity check on the pinned browser (`social/renderer/runtime.json`); build 9:16 base maps for the regions whose map cards need them; take the full-resolution image files for a final video.
