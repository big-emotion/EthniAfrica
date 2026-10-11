# Satellite video renderer

This renderer produces the 12-second vertical geographic videos of roadmap step 9. It follows the accepted Claude Design system **EthniAfrica Vidéo carte 0.2.0-proposition** (accepted by the operator on 11 October 2026). Its design source and decision stay in the coordinator's local evidence folder, as for the cards. Flat satellite imagery is the default style. Relief is an accepted option, but this renderer does not draw it yet. A successful render never authorizes publication: the three editorial approvals and an explicit publishing instruction still apply.

## Commands

```sh
npm run test:social-video
ETHNIAFRICA_VIDEO_ASSETS=PATH npm run test:social-video-acceptance
```

The first command runs the sequence rules, which need no imagery. The second also renders frames and encodes a full video. It needs the verified imagery folder, which stays outside git, and FFmpeg on the workstation. A missing folder fails the run; it is never reported as a pass. In code, `loadSequence` validates a sequence file, `renderFrame` returns one PNG and `encodeVideo` writes `video.mp4` with a `manifest.json`.

## Why this engine

Each frame is drawn in the same pinned Chromium as the card renderer (`social/renderer/runtime.json`), then FFmpeg encodes the frames. Cards and videos therefore share fonts, inks and runtime, and no rendering framework was added. A WebGL shader reprojects the Blue Marble mosaic onto an orthographic globe, with the grade, limb darkening and atmosphere specified on design board 1. SVG draws areas, borders and rivers in the design's layer order: area fills, borders, area edges, then rivers. HTML sets every name in the design system's fonts. Every value comes from `frameState(sequence, frame)`, with no clock, physics or randomness, so the same frame number gives the same pixels.

The alternatives were set aside for these reasons:

- Python and NumPy: a second runtime, with different text rendering.
- MapLibre: online tiles, asynchronous loading and tile rights.
- Remotion: a React framework with its own licence terms, and it still needs a globe.
- D3 with Canvas 2D: cannot reproject a raster efficiently.

The camera passes the 3-second key without stopping and lands softly at 6 seconds. A single cubic-bezier cannot keep the speed continuous across a key, so each camera component follows a monotone cubic through the design's three keys. The river timing is fitted to the accepted 8-second key frame: core at 0.75, glow at 0.28.

## Rules enforced before rendering

- **Imagery:** only the verified sources are accepted, Blue Marble NG July 2004 and Sentinel-2 cloudless 2016. The local file must match its recorded SHA-256. The caption names the imagery.
- **Drawn features:** every feature needs a documented source and valid coordinates. Rivers, areas and borders fade in whole; a river is never drawn from source to mouth.
- **Card grammar on imagery:** a certain area is filled at 30 % with a solid edge; an uncertain area is hatched with a dashed edge. Areas use the cards' three Nuit inks (`a`, `b`, `c`). A border is `quiet` (orientation only) or `strong` (only when the question is a border). Coastlines and lakes are never drawn: the imagery shows them.
- **Names:** one feature at most carries the subject plate. Other areas are named in their own colour, other rivers and water bodies in italics, and a region without a boundary (« Sahel ») in large tracked Anton with no plate, dot or outline. A name waits until its feature is 60 % visible. At most six names are on screen.
- **Legend:** one to four items, always, even for a single item.
- **Caption:** one line per part. A historical map adds « l'imagerie montre le paysage actuel ».
- **Layout:** the hold layout must stay inside the Meta and TikTok safe zone, x 120–960 and y 270–1248, and outside the TikTok button column, right of x 780 below y 840. The last frame is checked again on the glyph boxes the browser actually drew.

## Limits

- **Reproducibility:** pixel-for-pixel repeats are expected only on the same machine and pinned browser, not across operating systems. The manifest records Chromium, Playwright and FFmpeg versions and the hashes of the sequence, imagery, engine and video. `productionReady` is always false.
- **Not implemented yet:** relief, Sentinel-2 tiles, exits for longer sequences, and the subtitle band (step 10). Bulk access to Sentinel-2 tiles still needs to be checked.
- **Width estimates:** the layout gate estimates text widths from ratios calibrated on the design fonts; the browser's real glyph boxes decide at export.
- **Test fixtures:** `fixtures/congo.sequence.json` (a river) and `fixtures/west-areas.sequence.json` (the design's three fictional areas, with Natural Earth borders taken from the accepted card map `social/design-system/assets/Cartes/afrique-ouest.json`). Both carry illustrative copy and the « Texte illustratif » tape. They are not approved publication text.
