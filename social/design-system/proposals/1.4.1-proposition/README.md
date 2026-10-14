# EthniAfrica Cartes 1.4.1-proposition: the series video's map cards on satellite imagery

**Status: accepted by the operator on 14 October 2026, and integrated.** The authority is the design system itself: `../../version.json`, `../../series.md` (« Map cards on satellite imagery »), `../../handoff.md` (« Renderer integration of 1.4.1 ») and the boards `../../handoff/video-board-full.html` with `../../handoff/video-board-sat.js`. The engine is `social/video/series-map.mjs`, with `series.mjs`, `series-page.mjs` and `series-render.mjs`.

The operator decided on 14 October 2026 that a map card in the series video is drawn by the satellite video engine, on imagery, and not on a flat 9:16 base map; he accepted the proposal the same day as drawn. Everything else in 1.4.0 and every carousel card are unchanged.

What this folder holds:

- `claude-design-brief.md`: the brief the operator gave Claude Design.
- `boards/`: the accepted boards as Claude Design drew them, at full size and at feed size (430 px): `serie-nom-famille-02` (Côte d'Ivoire highlighted), `serie-frontieres-02` (two areas across a border, drawn at the scale limit), the change from a photograph to a map at 100 and 200 ms, the guides, the Parchemin and the flat carousel cards beside their video frames, and the atlas card kept on the carousel. Their text is demonstration text.
- `integration-2026-10-14/`: the integration evidence. `cards-1.4.0-vs-1.4.1.json`: the 89 sample cards rendered with the 1.4.0 and 1.4.1 design on one browser, identical pixel for pixel, alternative texts included, so the renderer's reference hashes are unchanged. `video-tests.json`: the test runs, and the satellite video's frames compared before and after its shader and overlays were shared. `engine-frames/`: frames drawn by the integrated engine on the verified imagery.

Still to do: run the video tests, the map acceptance test and the renderer's fidelity check on the pinned browser (`social/renderer/runtime.json`); verify a finer imagery file (the 500 m Blue Marble mosaic or Sentinel-2) so a small subject such as `serie-frontieres-02` is drawn as close as its carousel card.
