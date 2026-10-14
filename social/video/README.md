# Satellite video renderer

This renderer produces the vertical geographic videos of roadmap step 9: the 12-second video of the accepted Claude Design system **EthniAfrica Vidéo carte 0.2.0-proposition** (accepted on 11 October 2026), the 45 to 60 s video chained in chapters of **0.3.0-proposition** (accepted on 12 October 2026), which extends 0.2.0 without changing it, and the « plein écran » layout, subtitle chunks, spoken-word highlight and text-led areas of **0.4.0-proposition** (accepted on 12 October 2026), which replaces 0.3.0 only there. Their design sources and decisions stay in the coordinator's local evidence folder, as for the cards. Flat satellite imagery is the default style. Relief is an accepted option for landform subjects and wide establishing shots. A successful render never authorizes publication: the three editorial approvals and an explicit publishing instruction still apply.

## Commands

```sh
npm run test:social-video
ETHNIAFRICA_VIDEO_ASSETS=PATH npm run test:social-video-acceptance
```

The first command runs the sequence rules, which need no imagery. The second also renders frames and encodes a full video. It needs the verified imagery folder, which stays outside git, and FFmpeg on the workstation. The folder holds `imagery/world.topo.bathy.200407.3x21600x10800.jpg` and, for relief, `relief/ETOPO_2022_v1_60s_N90W180_surface.tif`; both are checked against their recorded SHA-256. A missing folder fails the run; it is never reported as a pass. In code, `loadSequence` validates a sequence file, `renderFrame` returns one PNG, `renderFrames` returns several from one browser session, and `encodeVideo` writes `video.mp4` with a `manifest.json`; its `range` option (`{ from, to }` in frames) encodes an excerpt for a short proof. A voiced video's audio comes from `voice.mjs` (see Voice).

## Why this engine

Each frame is drawn in the same pinned Chromium as the card renderer (`social/renderer/runtime.json`), then FFmpeg encodes the frames. Cards and videos therefore share fonts, inks and runtime, and no rendering framework was added. A WebGL shader reprojects the Blue Marble mosaic onto an orthographic globe, with the grade, limb darkening and atmosphere specified on design board 1. SVG draws areas, borders and rivers in the design's layer order: area fills, borders, area edges, then rivers. HTML sets every name in the design system's fonts. Every value comes from `frameState(sequence, frame)`, with no clock, physics or randomness, so the same frame number gives the same pixels.

The alternatives were set aside for these reasons:

- Python and NumPy: a second runtime, with different text rendering.
- MapLibre: online tiles, asynchronous loading and tile rights.
- Remotion: a React framework with its own licence terms, and it still needs a globe.
- D3 with Canvas 2D: cannot reproject a raster efficiently.

The camera passes the 3-second key without stopping and lands softly at 6 seconds. A single cubic-bezier cannot keep the speed continuous across a key, so each camera component follows a monotone cubic through the design's three keys. The river timing is fitted to the accepted 8-second key frame: core at 0.75, glow at 0.28.

## Relief

Relief follows design board 6. The globe becomes a mesh raised by NOAA ETOPO 2022 (60 arc-seconds, public domain), with heights multiplied by 90 and the sea floor kept at sea level, since the imagery already shows it. A perspective camera with a 40° field of view looks straight down until 3 s, then tilts to 58° above the horizon by 6 s. Its `radius` keeps the flat style's meaning, pixels per Earth radius at the target, so the same camera keys work in both styles. One light from the north-west of the hold target, plus a soft fill, never moves. Flat ground keeps the flat style's exposure.

Areas, borders and rivers are drawn with the flat style's own SVG into the region's map, then draped on the mesh, so they follow the terrain and hide behind ridges. Names stay flat and horizontal, placed above the raised ground. The caption adds « Relief : NOAA, exagéré ».

The camera keys set the framing. A continental shot (`fixtures/west-relief.sequence.json`, radius 900) puts the horizon just under the title, as the design does. A closer shot pushes the horizon up behind the title scrim. A mesh is heavier than the flat shader: a relief video takes over ten minutes to encode on the workstation.

## Chained chapters

A sequence with `chapters` is a chained video: the 0.2.0 opening once (globe to the region, 0 to 6 s), then one to five chapters on the same frame, then an ending. Each chapter is one map state with its own features, names, legend and caption, its line under the title, and its subtitle written as sentences of chunks (below). The schedule is computed in whole frames from the design's timing tables, so every event stays on its 0.1 s grid however many chapters are chained. The Sahara fixture reproduces the 0.4.0 design's `timeline.json` within one frame: chapters at 6.4, 15.9, 24.0, 35.1 and 45.6 s, 58.9 s in all, and every chunk's appear, full-opacity and leave times.

- **Strict order between chapters.** The last chunk fades out, then everything drawn leaves together in 400 ms, then 200 ms of plain imagery (or the camera travel), then the next chapter's line, caption and legend enter, and its first chunk fades in 1.5 s after the last one left (3.7 s after a travel). Nothing leaves before its chapter ends, and nothing enters while a chapter leaves; the tests check both on every frame.
- **Same region, new place.** A chapter without `camera` keeps the camera still. A chapter with `camera` is a new place: the base returns to its travel grade, the camera travels 1.8 to 2.4 s and stops dead, then the base recedes again. Pitch travels with the rest. There is never a cut: on a phone, a hard cut between two satellite views reads as a new video in the feed.
- **Marker and title.** From three chapters on, one bar per chapter and the line « n · titre » sit 12 px under the title. The bars only change colour and the line only fades in the empty interval: nothing slides. The title must then hold on one line, so the marker stays in the title band; below three chapters there is neither bar nor line.
- **Caption.** Carte, Période and Source change with each chapter; a line the next chapter repeats stays on screen through the change. The imagery line never leaves: on a historical chapter it swaps, during the empty interval, to the short credit and « l'imagerie montre le paysage actuel », as on board 10, because the long credit and the note do not fit on one line together. That chapter's Source line names the elevation model.
- **Historical outline.** A chapter `outline` points to a GeoJSON LineString or Polygon file and must carry its `source`, `study`, `elevationModel` and `levelMetres`: only a contour at a published shoreline level is drawn, never a freehand shape. A file marked as a mockup is refused. The outline is round dots over dark dots, its inside tinted at 14 %, labelled « contour reconstitué », and it fades in whole like any overlay: a lake never fills, dries or shrinks on screen. `illustrative: true` marks a synthetic outline, accepted only in a demo sequence, and the tape then says so.
- **Endings.** After the last chapter, everything leaves with the title and the top signature, the base darkens and the closing block holds 2.5 s; the imagery line stays. Ending A (signature, slogan, one sentence about what the page holds, the bare domain in the cards' pill) requires `pageOnline: true`, so a video never promises a page that does not exist; ending B is the signature and slogan only. Neither asks the viewer for anything. `"page": "home"` on ending A makes the sentence a general invitation to the site, as the operator chose for the first voiced video: it still needs `pageOnline: true`, but promises no subject page. Left out, the page is the subject's.

## Plein écran, chunks and areas (Vidéo carte 0.4.0)

After the first real 0.3.0 proof the operator asked for shorter, larger, centred subtitles, the spoken word highlighted, and areas that enter with the words naming them; he then chose a full-screen layout. **0.4.0-proposition** (accepted on 12 October 2026) replaces 0.3.0 only there; chapters, camera travel, opening, ending, outline treatment, marker and caption content stay as above.

- **Bands, not the feed safe zone.** A chained video is laid out at 1080 × 1920 in fixed bands (`BANDS`): signature, title (Anton 80/84) and marker from y 100, map names between 290 and 1290, the image in the clear to 1540, the subtitle between 1316 and 1452 centred on x 540, legend then credits bottom-aligned from 1652 to 1884 over a fixed veil that starts at 1540, everything between x 60 and 1020. The operator accepted that the apps hide the subtitle and the credits in the feed until the video is opened or downloaded, so the Meta and TikTok safe zone is only a guide there; `checkLayout` checks the bands instead, on the estimated layout before rendering and on the browser's glyph boxes at every frame where a chunk is fully drawn. The design's table says the head ends « about 270 »; its own frames end at 276 (signature 36, title 84, marker 32 and two 12 px gaps), and that is the limit used. The 12-second video keeps 0.2.0's feed layout and gate.
- **Cameras.** The relief cameras are those of `data/cameras-fullscreen.json` in the design package: pitch 70° (66° for the closer Chad-basin view of chapter 5), 40° field, the target at y 880 instead of 690. Our `radius` is the focal length over the design's distance in Earth radii; with that conversion the design's « fit » boxes land on the same pixels, which a test checks.
- **Chunks.** A chapter's `sentences` are lists of chunks, `{ "text": …, "enters": [...] }`. A chunk holds 3 to 6 words, at most 26 characters a line and two lines; a line the estimator puts wider than 900 px at 56 px also goes to two lines, and the browser's glyph boxes are checked against the same 900 px. Two lines are balanced, broken only at a plain space and after a comma when possible, as the design's `timeline4.py` scores them; a no-break space never breaks, and a transcription with its Arabic script takes a line of its own. Longer or shorter chunks are refused, never shrunk. Words are counted as `timeline.json` counts them: the units below, plus one for the Arabic script beside its transcription. `rules.md` says that group counts as one word, but then the accepted chunk « ṣaḥrāʾ (صحراء), « désert ». » would have two words and be refused; `timeline.json` decides.
- **Reading rule.** Full opacity lasts characters ÷ 15, plus 0.3 s for the first chunk after an empty band, between 1.2 and 4 s, and at least 0.3 s after the chunk's last entry ends, rounded up to 0.1 s. Within a sentence the next chunk replaces the last on the same frame, with no fade and no empty frame, so nothing flickers; between sentences the band stays empty 300 ms; a chapter's first chunk fades in and its last fades out in 200 ms.
- **Style.** Nunito Sans 800 56/68 in #fffaf2 on the image, with a 9 px dark stroke painted under each letter and a soft shadow instead of a band. ʾ and ʿ still come from Noto Sans; `transcription.acceptance.test.mjs` measures the gap at the new size and weight.
- **Highlight.** `highlightAt(words, t)` is the pure function of the design: the unit whose box shows at time t, from its start to the next unit's start, or to 100 ms after it ends when a pause of 350 ms or more follows. A unit is a word with its punctuation and guillemets, a number written with a space, or a transcription with its Arabic script; `checkWordTimes` refuses word times that do not match a chunk's units. The box is drawn in the accent with the text in on-accent and grows 6 px sideways through shadows, never padding, so no word moves (`highlight.acceptance.test.mjs` compares glyph boxes lit and unlit). Without a voice there is no highlight at all, as the operator ruled; with one, the box follows the word times (see Voice).
- **Areas follow the text.** What a chunk lists in `enters` (an area or outline, a region or water name) enters with it, at the chunk's first frame on a silent video, 700 ms apart when one chunk names two. An overlay fades in whole in 600 ms, its legend item in 300 ms in a slot kept from the chapter's start, its map name 300 ms later in 400 ms; the overlays already shown ease down to 55 % in 600 ms, ease-in-out, never by a jump. Everything a chunk does not name enters with the chapter. During a subtitle nothing else changes: camera, grade, veil, title, marker, caption, placed names and the subtitle position stay put, which a property test checks on every frame.
- **Hatching.** An approximate area is hatched with a dashed edge and no solid fill, at 45°, or at 135° when most of its outline lies inside an area entered before it, so the overlap reads as crossing. A chapter that draws one must carry the legend item « Zone approximative » (`{ "approximate": true }`), drawn with a neutral hatched swatch.
- **Names placed by one rule.** In entry order, each name tries 13 candidate positions around its anchor at 44, 40, then 36 px (40 and 36 when two region names share the chapter); a box must stay in the names band, keep 12 px from earlier names and places, and may slide sideways by a third of its width to stay in. A name with no room goes to the legend as text. The 0.3.0 proof drew Tanezrouft over Ténéré; with the rule two names on the same anchor part. An area's name is set upright in its ink by default. Italic (`"label": "quoted"`) is an explicit opt-in for a source's own term, never inferred from a category: a paraphrase such as « pays des Noirs » for al-Idrīsī's « Soudan » must not look like a quotation (operator, 12 October 2026). A region known today keeps tracked Anton (`"label": "region"`); an area without `labelAt` is named by the legend only. The engine never adds guillemets: a name shows exactly the text it is given.

Not implemented from 0.4.0 yet: chips and attestation lists (and the chip border that turns to an area's ink), and the period ribbon.

## Voice

The operator asked for a voiced video, read by an ElevenLabs voice he chose, with the spoken word highlighted. The design (0.4.0 timing.md §2) sets the rule, and open question 8 sets the input: per chunk, a list of words with their start and end in seconds. A sequence declares `"voice": { "audio": "voice.wav", "words": "words.json" }`, resolved like its area files.

```json
{
  "audio": { "file": "voice.wav", "sha256": "…", "duration": 41.2 },
  "chunks": [
    {
      "text": "*ṣaḥrāʾ* (صحراء), « désert ».",
      "words": [
        {
          "text": "ṣaḥrāʾ (صحراء),",
          "spoken": "sahrâ,",
          "start": 9.55,
          "end": 9.98
        },
        { "text": "« désert ».", "start": 10.02, "end": 10.51 }
      ]
    }
  ]
}
```

The chunks run in video order: the intro, every chapter, the outro. Each word is one highlight unit of its chunk, in order, inside the audio; a word without `spoken` must also spell its unit. The words JSON records the audio's SHA-256, so a voice recorded again without being timed again is refused, at load and again at export.

- **Schedule.** A chunk appears 150 ms before its first word and is cut when the next one appears, across a sentence pause too. A part's first chunk fades in; its last stays 200 ms after its last word, then fades out in 200 ms (we read the design's « fades out 200 ms after its last word ends » as hold 200 ms, then fade). What a chunk names enters at its first word, 700 ms apart. A chunk never reads faster than 17 characters a second, and never leaves before what it names has entered.
- **Chapters keep their order.** The 0.3.0 change (everything out in 400 ms, then 200 ms of imagery or the camera travel, then the entries, 900 ms before the first chunk) is placed in the silence between two chapters' speech. A chapter still lasts at least 6 s. The voice is never stretched or cut: when a silence is too short, the sequence is refused with the milliseconds missing, and the voice script inserts the pause. Without an intro, chapter 1's first word comes at 7.45 s or later.
- **Intro and outro.** `"intro": { "sentences": [...] }` is spoken over the opening, in the subtitle band, with no entries; the opening then lasts until it has been said. `"outro"` is spoken over the closing block, once it is in. Both need a voice. The closing block holds until the audio ends plus 0.5 s, and never less than 2.5 s: the video lasts the larger of ceil((audio + 0.5) × 30) frames and the silent ending.
- **Export.** FFmpeg muxes the voice as AAC at 48 kHz, bit-exact, cut to the encoded frames and padded with silence to their end, so the audio never shortens the video. The manifest records the audio's SHA-256 and duration.

`voice.mjs` makes the two files from a script:

```sh
node social/video/voice.mjs --script SCRIPT.json --voice VOICE_ID --out DIR
```

```json
{
  "model": "eleven_multilingual_v2",
  "seed": 20261012,
  "chunks": [
    { "text": "Sahara vient de l'arabe", "pauseBeforeMs": 7400 },
    {
      "text": "*ṣaḥrāʾ* (صحراء), « désert ».",
      "units": [
        { "text": "ṣaḥrāʾ (صحراء),", "spoken": "sahrâ," },
        "« désert »."
      ]
    },
    {
      "text": "Vers 1154, al-Idrīsī",
      "pauseBeforeMs": 2500,
      "units": [
        "Vers",
        "1154,",
        { "text": "al-Idrīsī", "spoken": "al-Idrissi" }
      ]
    }
  ]
}
```

The chunks are the sequence's, in the same order; `units` is optional and, when given, lists the chunk's own units, each with an optional `spoken` form for a word the voice must say differently from the screen (a transcription, a number in letters, « ethniafrica point com »). `pauseBeforeMs` inserts that much silence and starts a new request; chunks without it are read in one request, so a sentence keeps its prosody. The script calls `POST /v1/text-to-speech/{voice_id}/with-timestamps` once per request, with the neighbouring requests as context.

- **Silence, not break tags.** A pause is generated silence, exact to the sample, rather than a `<break>` tag: the tag's length is the model's to interpret and its characters would sit in the alignment, while the schedule needs pauses it can count on.
- **Alignment back to the screen.** The text sent is the spoken forms joined by spaces; the script records where each unit's spoken form sits, and the character times map back to one word per screen unit. An answer whose alignment does not spell the text sent is refused.
- **Formats.** Requests ask for MP3 at 44.1 kHz, which every plan returns; FFmpeg decodes each to 48 kHz mono PCM and the script writes a WAV. `eleven_multilingual_v2` refuses the `language_code` parameter (only the Turbo and Flash v2.5 models take it), so the French comes from the text.
- **Key.** `ELEVENLABS_API_KEY`, or the `elevenlabs` MCP server entry of the user-level Claude Code config, as the reel-clip skill's `transcribe.mjs` reads it. Every request is billed; the tests run the pure steps on `fixtures/voice/` and never call the API.

## Vidéo de série (Cartes 1.4.0, plein écran)

The series video of **EthniAfrica Cartes 1.4.0-proposition** (accepted on 14 October 2026) is the same cards as the carousel, on the operator's voice: 1080 × 1920, 30 fps, 35 to 45 s. The image fills the whole frame for the whole video and only text sits on it, each letter edged by a dark outline painted under it, the same inks in Nuit and Parchemin; nothing darkens the image and nothing is placed after the networks' buttons. It replaces layout B of 1.3.0, which the operator withdrew the same day. Its geometry is `social/design-system/series.md`, « Vidéo de série », and `handoff.md`, « Renderer integration of 1.4.0 »; `handoff/video-board-full.html` is the visual reference, not the engine. It needs no imagery outside git: the cards' images are in `social/design-system/assets/`.

```sh
npm run test:social-video                      # includes series.test.mjs and series.render.test.mjs
node social/video/fixtures/series-pays.mjs --out DIR
node social/video/series-render.mjs --sequence DIR/series.sequence.json --out OUT [--frames 0,413] [--diagnose]
```

A sequence names the cards JSON, one beat per card in order (`{ "card": id, "chunks": [{ "text" }] }`), the `ending` (`{ "search": name, "pageOnline": true }`), the demo tape when the cards carry one, and the voice (`{ "audio", "words" }`, the same words JSON as above; `voice.mjs` makes it from the chunks in video order). `series.mjs` loads and schedules it (`loadSeriesVideo`, `seriesFrameState`, `checkSeriesLayout`, `LAYOUT`), `series-page.mjs` draws a frame, `series-render.mjs` renders frames and encodes with the satellite video's FFmpeg step (`encodeFrames`) in the pinned Chromium. Every value comes from the frame number. The design's `version.json` must say `"videoLayout": "full"`.

- **Cards through the design system.** The page calls `EthniCards.render(spec, { context: 'video' })` for each card and takes its kicker, title or date and name employed, source, credit, closing slogan, sentence and pill from it, so wording, French spacing, inks and fonts are the carousel's, and « Faites défiler » never appears. The full-screen sizes (title Anton 88/90, opener 116/112, date 176/156 down to 104/100, name 76/82, slogan 84/88) and outlines are set by the page, copied from the board. Subtitles, the band and the tape take the same French spacing: a narrow no-break space before ; : ! ? » and after «.
- **Bands** (`LAYOUT`): tape 178 to 226, series band 250 to 290, head 318 to 700 (the ending's block 318 to 820), clear image 700 to 1300, subtitle 1316 to 1452 centred on 540 and at most 900 px a line, foot 1652 to 1786 (the ending's credit to 1828), signature 1828 to 1884; every text between x 60 and 1020.
- **Image and map.** A photograph covers the frame, its focal point brought to (540, 1000) as far as its edges allow, and zooms from 100 to 104 % around it. A map card draws its own 9:16 view: `map.videoView` when the card gives one, else its subject (highlight or areas) brought to (540, 1000), at the card's scale or up to twice closer, within the base map's drawn extent, the sea painted in the water colour behind it. An « image à trouver » slot is drawn over the whole frame in the theme's ground, with « Image à trouver » and the card's `image.find` in the clear zone.
- **Long dates.** The largest of 176, 148, 124 and 104 px that holds on one line in 960 px, measured on the drawn glyphs; else two balanced lines at 104 px, a date never broken inside itself.
- **Schedule.** The 0.4.0 voice rules: a chunk appears 150 ms before its first word and is cut when the next appears; the first fades in, the last holds 200 ms after its last word and fades out; never faster than 17 characters a second. A card is fully in when its first chunk appears; its change takes 300 ms and nothing slides: the images cross-fade over the whole change, the outgoing card's text leaves in the first half and the incoming text enters in the second, so two heads never show at once. The band and the content cards' signature are drawn once and never fade; the closing card brings its own centred signature. Frame 0 is the opener, its band and no subtitle. The closing card holds 2.5 s, or until the voice ends plus 0.5 s.
- **Ending « série ».** The closing card's last two chunks must be « Cherchez [nom] sur EthniAfrica, » and « lien en profil. »; the name's spaces are set unbreakable so it stays on one subtitle line. Without `pageOnline: true` the sequence is refused: the ending promises a page.
- **Refusals before rendering.** An opener first and a closing card last; one series, episode and theme; every card voiced once; a demo card needs the demo tape and a final video refuses « image à trouver »; a subtitle line estimated over 900 px; a length outside 35 to 45 s.
- **Checked on the drawn page.** On the cover, the last frame and every frame where a chunk is fully drawn: every text box (the ink's width, the line boxes' height) in its band; the map's subject below y 724 and above the foot (« Le sujet de la carte passe sous la tête »); an image enlarged more than 1.5 times, zoom included, is refused (« Image trop petite pour la vidéo »), except in a demonstration, whose library images are web renditions. A frame that fails is refused and the export leaves no video behind. `--diagnose` records the problems in the result and the manifest (`diagnostic: true`, `layoutProblems`) instead. The render tests also check that the image covers the frame and that nothing but the lit word, a slot, a map key's swatch and the demo tape paints a background over it.

Limits:

- **Map cards with a short base map.** The card base maps are drawn for 1080 × 1350. `serie-nom-famille-02` fits twice closer; `serie-frontieres-02` cannot bring its subject below the head and is refused, as the operator ruled: such a region needs a 9:16 base map, built from Natural Earth like the others (not done yet). Atlas keys, callouts and insets stay on the card; the video's foot carries a map's key as text.
- **Dated cards with two branches** show the date only; the names are spoken.
- **Image resolution.** Every library image in the demo is enlarged 1.8 to 3.7 times; a final video needs the full-resolution file from its Commons page.
- **Browser.** The render tests and exports run in the pinned Chromium of `social/renderer/runtime.json`. The 1.4.0 integration was developed and checked on Chromium 141 in a cloud session (Playwright 1.63 pointed at it, `runtime.json` overridden in a scratch copy): 13 render tests pass and the series 1 demo encodes with no refusal. Run `npm run test:social-video` on the pinned browser before relying on an export.
- **Demo voice.** `fixtures/series-pays.mjs` times the design's demonstration script (`video.model.json`) on generated silence, the words spread over each chunk's scripted duration. It is not a voice and its text is not validated content.

## Area files

A chapter area is `{ "kind": "area", "id", "file", "ink", "labelAt"?, "label"? }`. Its file is GeoJSON, either a Feature with a Polygon or MultiPolygon, or a FeatureCollection of them with the properties at its top level. The properties record where the shape comes from, as the Mega-Chad contour does:

| Property     | Meaning                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| `name`       | the name drawn on the map, unless the sequence gives its own                   |
| `kind`       | `approximate` (hatched, dashed edge) or `certain` (filled at 30 %, solid edge) |
| `category`   | what the area is, for example `historical-name`, `people` or `region`          |
| `source`     | the work the shape follows                                                     |
| `citation`   | the full reference, with the page or map                                       |
| `derivation` | how the polygon was drawn from the source                                      |
| `licence`    | the licence of the geometry                                                    |
| `mockup`     | optional; `true` for a designer's mockup or any placeholder                    |

Every field is required. A file marked `mockup: true`, or whose `status` says mockup or placeholder, is refused unless the sequence is a `demo` and the area entry says `illustrative: true`; the tape then reads « Texte illustratif · zones de maquette ». The sourced Sahara areas are prepared separately under `data/areas/`. Placeholders never ship, and the repository is public: the Sahara fixture draws plain synthetic polygons from `fixtures/synthetic-areas/`, marked `mockup: true`, never the designer's hand-drawn shapes.

## Mega-Chad outline

`data/megachad-325m.geojson` is the highest palaeoshoreline of Mega-Chad for the Sahara video, as the operator ruled on 12 October 2026 (design 0.3.0-proposition): the 325 m contour traced on ETOPO 2022. The level comes from Leblanc et al. (2006), _Palaeogeography, Palaeoclimatology, Palaeoecology_ 239, 16–27, DOI 10.1016/j.palaeo.2006.01.003: the shoreline remains « have a constant elevation of 325 ± 5 m amsl » (p. 16 and p. 20). Other studies place it a few metres higher: Drake and Bristow (2006) average 329 m, with older ridges at 335 m. The video's source line names the study and the elevation model. The designer's mock-up contour is never a substitute.

```sh
ETHNIAFRICA_VIDEO_ASSETS=PATH node social/video/shoreline.mjs --date YYYY-MM-DD
```

The script reads the same verified ETOPO 2022 tile as the relief option, checked against its SHA-256. It keeps one lake: the low ground that water from present-day Lake Chad reaches without rising to 325 m. In ETOPO 2022 the basin overflows at 324.99 m near 15.31° E 10.26° N, towards the Benue. That is the Mayo Kebbi spillway that Leblanc et al. tie to the 325 m level. The fill stops there, so the line closes across the spillway instead of following the Benue valley. Every other 325 m line in the region is ignored. The script checks that the result covers the Bodélé, the lake's northern pool.

Simplification is Douglas–Peucker at 0.02° (about 2 km, one DEM cell, under one pixel when the Sahara fills a 1080 px frame), then rounding to 0.001°. Islands under 100 km² are filled in. The file records its own provenance, area and vertex count. The DEM stays outside git; the derived GeoJSON is small and public domain, so it is committed. `npm run test:social-video` checks the committed file, and the acceptance run regenerates it from the DEM and compares bytes.

## Sahara areas

`data/areas/*.geojson` are the seven approximate areas of the Sahara video (design 0.4.0): hatched, dashed edge, legend « Zone approximative ». Each file is one GeoJSON Feature whose properties are exactly `name` (the French label on screen), `kind: "approximate"`, `category` (`region`, `historical-name` or `people`), `source`, `citation`, `derivation`, `licence` and `date`. The designer's hand-drawn placeholder (`sahara-areas-mock.json`) is never an input.

```sh
ETHNIAFRICA_VIDEO_ASSETS=PATH node social/video/areas.mjs
```

The script reads four pinned downloads, each checked against its SHA-256: Ecoregions 2017 (Dinerstein et al. 2017, CC BY 4.0) and three Natural Earth 5.1.2 layers (geography regions, admin 0 countries at 1:50m, populated places), plus the Natural Earth river file the river layer already uses. Every area is a combination of these sources painted on one 0.05° grid, so « Sahara minus east of the Nile » or « Africa minus part of Egypt » are cell operations with no clipping library. The outline is traced back with the Mega-Chad contour tracer, simplified by Douglas–Peucker at 0.05° (one cell, under one pixel when Africa fills a 1080 px frame), and rounded to 0.01°. Parts and holes under 5,000 km² are dropped.

| Area                                   | Chapter | Rule                                                                                                                                                                   |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sahara` « Sahara »                    | 1, 4    | The Ecoregions 2017 ecoregions named after the Sahara, plus the Tibesti–Jebel Uweinat massifs, on Africa's land.                                                       |
| `desert` « Grand désert »              | 2       | The Sahara west of the Nile. Al-Idrīsī, 1154, in Dozy and de Goeje (1866), French p. 9: « au nord au grand désert (Sahara) qui sépare le Soudan du pays des Berbers ». |
| `berberes` « Pays des Berbères »       | 2       | Africa's land north of the Sahara in each grid column, outside Egypt and west of the Nile.                                                                             |
| `noirs` « Pays des Noirs »             | 2       | The Sahelian Acacia savanna and the two flooded savannas it encloses, outside the Sahara and west of the Nile.                                                         |
| `libye` « Libye »                      | 3       | The African mainland minus Egypt east of the Nile. Herodotus IV.41–42: Libya begins after Egypt and is surrounded by sea; IV.181 puts Siwa in Libya.                   |
| `touaregs` « Kel Tamasheq (Touaregs) » | 3       | Convex hull of the places and massifs named in the corpus fiche `PPL_TUAREG`, each town widened by 1°.                                                                 |
| `libyque` « Désert libyque »           | 4       | Natural Earth's « Libyan Desert » label region, kept inside the Sahara and west of the Nile.                                                                           |

The al-Idrīsī areas are EthniAfrica's reconstruction of a medieval description, not borders, and each file says so. The Tuareg area overstates on purpose: a hull takes in empty desert and lands shared with neighbours. It was compared by eye with GREG (1964 atlas), which states no licence and is not used. The labels are proposals for the editorial approval. `npm run test:social-video` checks the committed files (validity, bounding boxes, places covered and left out, provenance); the acceptance run regenerates them from the downloads and compares bytes. With `ETHNIAFRICA_VIDEO_AREAS_MOCK` pointing at the mock-up, it also checks that no area reuses its vertices; without it, that check is reported as skipped.

## Rules enforced before rendering

- **Imagery:** only the verified sources are accepted, Blue Marble NG July 2004 and Sentinel-2 cloudless 2016. The local file must match its recorded SHA-256. The caption names the imagery.
- **Drawn features:** every feature needs a documented source and valid coordinates. Rivers, areas and borders fade in whole; a river is never drawn from source to mouth.
- **Card grammar on imagery:** a certain area is filled at 30 % with a solid edge; an uncertain area is hatched with a dashed edge. Areas use the cards' three Nuit inks (`a`, `b`, `c`). A border is `quiet` (orientation only) or `strong` (only when the question is a border). Coastlines and lakes are never drawn: the imagery shows them.
- **Names:** one feature at most carries the subject plate. Other areas are named in their own colour, other rivers and water bodies in italics, and a region without a boundary (« Sahel ») in large tracked Anton with no plate, dot or outline. A name waits until its feature is 60 % visible. At most six names are on screen.
- **Legend:** one to four items, always, even for a single item.
- **Caption:** one line per part. A historical map adds « l'imagerie montre le paysage actuel ».
- **Layout:** the 12-second video's hold must stay inside the Meta and TikTok safe zone, x 120–960 and y 270–1248, and outside the TikTok button column, right of x 780 below y 840; a chained video must keep each element in its plein écran band and no two names may overlap. Both are checked again on the glyph boxes the browser actually drew.

## Limits

- **Reproducibility:** pixel-for-pixel repeats are expected only on the same machine and pinned browser, not across operating systems. The manifest records Chromium, Playwright and FFmpeg versions and the hashes of the sequence, imagery, engine and video. `productionReady` is always false.
- **Dropped captures:** under SwiftShader, headless Chromium now and then never answers a screenshot request for a frame it has already drawn. It is not tied to a frame (a run hung on frame 205, the next drew it in 1.3 s), and waiting longer does not help: the first relief encode of the Sahara demo stopped after the default 60 s. A new request returns at once, so `captureFrame` gives each request 20 s and makes it again, three times at most. The page is not redrawn between requests, so the pixels cannot change.
- **Not implemented yet:** Sentinel-2 tiles, a name-overlap check for the 12-second video, and two 0.3.0 map elements: name chips (other names of the same thing) and the attestation list, as well as the period ribbon of a historical chapter. Bulk access to Sentinel-2 tiles still needs to be checked.
- **Ending grade:** the design's end frames darken the imagery to brightness 0.45 where a hold uses 0.84; the shader applies their ratio. The saturation change on those frames is not reproduced.
- **Relief drapes:** a chained relief video drapes its overlays once per hold camera, at that hold's scale, so strokes keep their design width at each place; the imagery and height crops cover every hold.
- **Width estimates:** the layout gate estimates text widths from ratios calibrated on the design fonts; the browser's real glyph boxes decide at export.
- **Test fixtures:** `fixtures/congo.sequence.json` (a river) and `fixtures/west-areas.sequence.json` (the design's three fictional areas, with Natural Earth borders taken from the accepted card map `social/design-system/assets/Cartes/afrique-ouest.json`). `fixtures/west-relief.sequence.json` frames the same areas in relief. All three carry illustrative copy and the « Texte illustratif » tape. They are not approved publication text. `fixtures/sahara.chapters.sequence.json` is the 0.4.0 design's worked example with its illustrative text, synthetic rectangles and hexagons in the areas' roles (`fixtures/synthetic-areas/`, marked as mockups) and the real Mega-Chad contour; `fixtures/synthetic-outline.geojson`, a plain octagon, stands in for a contour in the outline tests. `fixtures/voiced.mjs` builds a voiced variant of the Sahara demo's first two chapters, timed on generated silence or a test tone, never a real voice; `fixtures/voice/` holds an illustrative voice script and alignments in the shape the API returns.
