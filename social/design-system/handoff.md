# Handoff to production

## Acceptance and integration status

**1.5.0-proposition, 15 October 2026, accepted by the operator the same day.** A map sequence in the series video: areas and names enter on the word that says them, and consecutive map cards share one map. See « Renderer integration of 1.5.0 ».

**1.4.1-proposition, 14 October 2026, accepted by the operator the same day.** In the series video, map cards are drawn on satellite imagery by the satellite video engine; atlas cards stay on the carousel. Nothing else changes. See « Renderer integration of 1.4.1 ».

**1.4.0-proposition, 14 October 2026, accepted by the operator the same day.** It replaces only the series video's layout B of 1.3.0 by a full-screen layout (Series, « Vidéo de série »), adds eight `on-image-*` tokens for the video and changes no card. See « Renderer integration of 1.4.0 ».

**1.2.0-proposition, 12 October 2026.** The operator accepted 1.2.0-proposition
on 12 October 2026, recorded in `version.json`. It adds the historical atlas map
(approximate zones, regional keys, the 1914 partition with named territories,
dotted present-day borders, the independence map's marks, the period marker) and
a collision check for every map. No 1.1 rule changed. The sample data changed in
three 1.1 cards (`seq-3`, `map-fula-nombre-region`, `map-fula-part`: one label
moved each), and seven sample cards were added. The renderer integrated 1.2.0
on 12 October 2026 and passes its 38 accepted references: see « Renderer
integration of 1.2.0 » below and the [adapter status](../renderer/README.md).

The text that follows describes the 1.1.0 acceptance and remains true for it.

The operator accepted **1.1.0-proposition on 10 October 2026**, recorded in
`version.json`. The original identifier is retained. This accepts the visual
system. The [production adapter](../renderer/README.md) now completes roadmap
step 4; its 31 visual-reference checks pass. The historical
open-choice list at the end does not reopen already accepted typography or layout.

The coordinator's static intake found all 31 sample cards' matching reference
PNGs and referenced images, insets and maps locally, plus the five font files.
The adapter was then implemented test-first and visually reviewed at mobile,
tablet and desktop sizes. On 10 October 2026 the operator chose to retain the
engine and reconcile only two map references; the original PNGs and their hashes
remain preserved. No visual component or comparison tolerance changed.

The following intake findings guided the adapter and remain relevant when
maintaining it. The adapter covers the runtime refusals and alternative-text
gaps; local-only CI baseline distribution and per-publication checks still apply:

- Image readiness currently resolves on load errors too. Check decoded images
  and actual font loads, not only `report.ok`.
- A hidden demo tape is still demo content. Reject `demo` in final input even
  when the harness uses `demo=0`. Several Uganda samples remain marked as demos;
  design acceptance is not publication approval for their text.
- `altText` needs coverage of quotes, status explanations, branch users and map
  captions/figures. Compare it with the actual reading order.
- Define the image-difference tolerance and pin browser/scale before claiming
  deterministic fidelity. Verify reference provenance: the reference asset README
  still names version 1.0. Keep the overflow fixture as an expected refusal.
- Make the local-only reference baseline retrievable for CI before enabling
  fidelity checks there. Record the exact inputs and output order with exports.
- Reconcile stale documentation (opaque panel and 810 px diagnostic guide) with
  the accepted translucent veil and 900 px implementation, without changing the
  visual system to match old wording.

Inspect readability at 320–430 px, then tablet and desktop. Logo provenance and
first-platform overlays remain pre-delivery checks; they do not prevent local
renderer integration. The full roadmap remains in the
[canonical production specification](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/212795394).

For the production coordinator (`ethniafrica-social-production`) once the operator accepts this system. Record the version **1.1.0-proposition** and the date of acceptance; any later change to a token, a font or `bundle.css` is a new version and reopens the visual proof of pieces in progress.

## In the repository

This folder, `social/design-system/`, is the repository copy of the design system published as a Design System artifact (see `version.json`). The reference images for fidelity checks and the phone-size previews are kept with the production working files, in `.local/research/social-production-2026-10-09/design-system-references/` and `design-system-lecture/`, so that 40 MB of PNG files stay out of git.

To render a card locally, serve this folder over HTTP (for example `npx http-server social/design-system -p 8765`) and open `handoff/harness.html?id=seq-1`. The harness reads `tokens.json`, the fonts in `fonts/`, the images in `assets/` and the cards in `handoff/cards.sample.json`. `handoff/assets.json` gives the artifact addresses of the same files and is not needed locally.

## What to reuse

- `components/bundle.js` and `components/bundle.css`: the reference implementation. One card spec in, one 1080 × 1350 element out, plus a fit report. No framework, no network.
- `tokens.json`: every colour, size and font. `EthniCards.installTokens(tokens, base)` compiles it when no `tokens.css` is present, so the renderer and this book share one source.
- `fonts/`: the five font files to bundle with the card renderer, plus Noto Sans Arabic for the map videos (licences in `licences/`).
- `handoff/harness.html`: a rendering bench (`?id=seq-3&width=1080&diagnose=1`) that exposes `window.__reports` and sets `document.body.dataset.ready = "1"` when done. Serve the project folder over HTTP; browsers refuse `fetch` on `file://`.
- `handoff/cards.sample.json`: every example card, in the card format below. `handoff/assets.json` maps asset names to stored files with their size, credit, licence and source page.

The pilot's `render.mjs` (Playwright, HTML to PNG) can drive the harness unchanged in principle: open the page, wait for `ready`, screenshot `.ec-card` at device scale 1.

## Card format

One JSON object per card. Every text field accepts `*mot*` for the accent word; French spacing before « ; : ! ? » and inside guillemets is added by the engine.

| Field             | Type                                                                                                                                                                                  | Used by                                                        | Notes                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | string                                                                                                                                                                                | all                                                            | stable identifier, also the reference image name                                                                                                               |
| `type`            | `opener`, `explanation`, `document`, `dated`, `map`, `closing`                                                                                                                        | all                                                            |                                                                                                                                                                |
| `series`          | `{id, episode}` or `{name, episode}`                                                                                                                                                  | all (1.3.0)                                                    | series band; `id` among `pays`, `nom-recu`, `nom-famille`, `mots`, `frontieres`, `afrique-tout`, `villes`; panel limit 828 px                                  |
| `theme`           | `nuit` (default), `parchemin`                                                                                                                                                         | all                                                            | one theme per carousel                                                                                                                                         |
| `folio`           | string                                                                                                                                                                                | all                                                            | « 03/08 »                                                                                                                                                      |
| `kicker`          | string                                                                                                                                                                                | all                                                            | accent, no forced capitals                                                                                                                                     |
| `title`           | string                                                                                                                                                                                | all but dated                                                  | one `*accent*` word, or `{area-a:words}` on a map card                                                                                                         |
| `body`            | string or array of paragraphs                                                                                                                                                         | explanation, document, closing; one sentence on an origin card | none on opener and map cards                                                                                                                                   |
| `density`         | `dense`, `normal`                                                                                                                                                                     | all                                                            | omit to let the engine decide                                                                                                                                  |
| `forms`           | `{layout: "table", rows: [[term, gloss]…]}` or `{layout: "pair", searchedLabel, searched, selfLabel, self}`                                                                           | explanation                                                    | up to 4 rows                                                                                                                                                   |
| `note`            | string                                                                                                                                                                                | explanation                                                    | sentence after the forms table                                                                                                                                 |
| `quote`           | `{original, lang, translation, translationLabel, attribution}`                                                                                                                        | explanation, document                                          | exact text only in `original`                                                                                                                                  |
| `status`          | kind or `{kind, label, band}`                                                                                                                                                         | all                                                            | kinds listed under Status marks                                                                                                                                |
| `date`            | `{display, kind, marker, name, designated, usedBy, usedByLabel, branches}`                                                                                                            | dated                                                          | `kind`: `year`, `exact`, `period`, `approx`, `unknown`; the marker names the kicker, and draws a mark only for `origine`, `contexte`, `hypothese`, `incertain` |
| `recap`           | `[{date, name, kind}…]`                                                                                                                                                               | closing                                                        | recap timeline of a dated sequence, today on the left, up to 5 steps                                                                                           |
| `veil`            | `strong`                                                                                                                                                                              | all with an image                                              | 96 % veil over printed pages and manuscripts                                                                                                                   |
| `date.branches`   | `[{label, name, designated, usedBy}, …]`                                                                                                                                              | dated                                                          | concurrent forms, two columns                                                                                                                                  |
| `image`           | `{src, w, h, focus: [x, y], anchor: [x, y], zoom}`                                                                                                                                    | all but map                                                    | `w`, `h` are the file's pixel size; keep them for determinism                                                                                                  |
| `insets`          | `[{src, x, y, width, label}…]`                                                                                                                                                        | document                                                       | card pixels, inside the image window, up to 2                                                                                                                  |
| `map`             | `{dataRef or data, view, borders, areas, highlight, choropleth, callout, inset, labels, labelOffsets, places, legend, caption, countryLabels, atlas, categorical, marks, dimOutside}` | map                                                            | see Maps; the last four are 1.2.0, below                                                                                                                       |
| `timeline`        | `{steps, current, from, to}`                                                                                                                                                          | map (any type)                                                 | 1.2.0: period marker of a series, replaces the folio in the panel head                                                                                         |
| `cta`             | `{domain, text}`                                                                                                                                                                      | closing                                                        |                                                                                                                                                                |
| `source`          | string                                                                                                                                                                                | all                                                            | short form; full reference in the package                                                                                                                      |
| `credit`          | string                                                                                                                                                                                | all with an image                                              |                                                                                                                                                                |
| `imageAlt`, `alt` | string                                                                                                                                                                                | all                                                            | `alt` overrides the composed alternative text                                                                                                                  |
| `demo`            | string                                                                                                                                                                                | maquettes                                                      | yellow tape; forbidden on a final export                                                                                                                       |
| `provenance`      | string                                                                                                                                                                                | maquettes                                                      | where the text comes from; not rendered                                                                                                                        |

## Status marks

`usage` Usage actuel · `independance` Indépendance · `adoption` Adoption officielle · `attestation` Attestation datée · `premiere` Plus ancienne attestation repérée · `origine` Origine la plus ancienne connue (adds « Jusqu'ici, les sources remontent à ce point. ») · `contexte` Avant ce nom (adds « Ce qui suit est plus ancien que le nom : ce n'est pas l'histoire du mot. ») · `parallele` Usage parallèle · `hypothese` Hypothèse · `incertain` Incertain. A custom `label` may refine the wording (« Nom officiel du protectorat ») but not change the kind's meaning.

## Acceptance cases for the renderer

Proposed checks, each against the reference images in the `References` asset group (rendered by this engine at device scale 1, fonts from `fonts/`):

1. Size: every export is 1080 × 1350 PNG, in folio order.
2. Fidelity: rendering each card of `cards.sample.json` matches its reference image (pixel difference under a small threshold, to absorb anti-aliasing between machines).
3. Fit: `report.ok` is true for every card of a final sequence; the `overflow` example must fail.
4. Floor: no essential text under 28 px at export (the computed size of `.ec-body`, `.ec-field-text`, `.ec-gloss`).
5. Fonts: Anton, Nunito Sans, Noto Sans and Fraunces are loaded before capture (`document.fonts.check`), and the long names of the `stress` card render without empty boxes.
6. Text equals data: the text extracted from the card equals the card data (title, body, fields, source, credit).
7. Focus: no `report.warnings` about focal points, map labels or insets.
8. No maquette tape on a final export (`demo` absent).
9. Alternative text present for every export.
10. Eyes: the editor looks at every final card at 375 px and 320 px, then tablet and desktop. Automated checks do not replace this.

## Atlas map fields (1.2.0)

```json
"timeline": { "steps": ["1960","1914","1880","1750","1550","1350","1000","0","−1500"], "current": 2, "from": "1960", "to": "1500 av. J.-C." },
"map": {
  "dataRef": "Cartes/afrique.json", "view": [-168.1, -15.1, 1136.8, 1421.1], "borders": "none",
  "atlas": {
    "entries": [
      { "name": "Sokoto", "region": "ouest", "kind": "state", "x": 398.9, "y": 299.3, "zone": {"cx": 432.0, "cy": 319.8, "rx": 66.0, "ry": 34.2} },
      { "name": "Égypte (Nouvel Empire)", "region": "nord", "x": 727.8, "y": 147.6, "zone": {"points": [[691.2, 79.2], [724.8, 80.4], [730.8, 108.0], [732.0, 144.0], [735.6, 172.8], [722.4, 196.8], [706.8, 194.4], [708.0, 163.2], [703.2, 129.6], [694.8, 100.8]]} },
      { "name": "Danxomè (Dahomey)", "region": "ouest", "kind": "state", "x": 359.9, "y": 369.8 },
      { "name": "Tiv", "region": "ouest", "kind": "society", "x": 444.0, "y": 369.6 },
      { "name": "Pount", "region": "est", "kind": "state", "uncertain": true, "x": 816, "y": 276 },
      { "name": "Tunis", "region": "nord", "kind": "state", "inline": true, "x": 458.4, "y": 14.4 },
      { "name": "Ségou", "region": "ouest", "x": 260.8, "y": 294.7, "offset": [-20, -30] }
    ],
    "keys": [ { "region": "ouest", "x": 20, "y": 96, "width": 250 }, { "region": "sud", "x": 20, "y": 810, "width": 250 } ],
    "inline": "auto", "keyRows": "normal", "labels": { "society": "Sociétés sans roi" }
  },
  "caption": { "what": "…", "when": "vers 1880", "source": "…" }
}
```

| Field                 | Type                                                                                                    | Notes                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `atlas.entries[]`     | array, up to 45                                                                                         | one entry per state, society or site, in key order inside each region                                                                        |
| `entries[].name`      | string                                                                                                  | the whole printed name, « nom endogène (nom courant) » when they differ                                                                      |
| `entries[].x`, `y`    | number                                                                                                  | position in the base map's coordinates (`afrique.json`: x = (lon + 28) × 12, y = (38 − lat) × 12)                                            |
| `entries[].region`    | `nord`, `ouest`, `centre`, `est`, `sud`                                                                 | key heading; default `ouest`                                                                                                                 |
| `entries[].kind`      | `state` (default), `society`, `site`                                                                    | zone colour `area-a`, `area-b`, `area-c`; marker disc, rounded square, diamond                                                               |
| `entries[].zone`      | `{cx, cy, rx, ry, rot, wobble, labelAt, uncertain}` or `{points: [[x, y]…]}`                            | approximate zone in map coordinates, clipped to land; `label: false` on the entry keeps the name off the map                                 |
| `entries[].uncertain` | boolean                                                                                                 | prints « ° » after the name, hatches the zone, adds the legend note                                                                          |
| `entries[].inline`    | boolean                                                                                                 | for a point entry: write the name beside it when one of four positions is free                                                               |
| `entries[].offset`    | `[dx, dy]` card px                                                                                      | fixes the marker away from its point, with a leader                                                                                          |
| `atlas.keys[]`        | `{region, x, y, width, columns, title}`                                                                 | one box per region, card pixels                                                                                                              |
| `atlas.inline`        | `auto` (default), `all`, `none`                                                                         | zones: name inside, then beside, then number; points: every name beside its point when 12 entries or fewer and no keys; `none`: numbers only |
| `atlas.outside`       | boolean, default true                                                                                   | `false` forbids names beside a zone (inside or numbered only)                                                                                |
| `atlas.keyRows`       | `normal` (30 px rows), `compact` (27 px)                                                                | compact from 41 numbered entries                                                                                                             |
| `atlas.labels`        | `{state, society, site}`                                                                                | legend wording of the kinds                                                                                                                  |
| `categorical`         | `{values: {ISO: id}, classes: [{id, label, tone}], split: {ISO: [id, id]}, splitLabel, columns, zones}` | filled map by category (1914)                                                                                                                |
| `categorical.zones[]` | `{name, isos, at, anchor, leader, size, label, outline}`                                                | territories of the period, unions of present-day states, outlined and named; `\n` breaks a name                                              |
| `borders`             | adds `dotted`                                                                                           | present-day borders as dots, from `bordersMerged`; no solid outline on filled states                                                         |
| `marks[]`             | `{iso, kind: "not-decolonised" or "never-colonised", name, legend, offset}`                             | hatched territory, or ring at `centers[iso]`                                                                                                 |
| `dimOutside`          | boolean                                                                                                 | greys land outside Africa; automatic with `atlas` and `categorical`                                                                          |

The fit report of an atlas map adds `report.atlas: {entries, numbered, inline (names written on the map), minGap, maxLeader}` and, for every map, `report.collisions`.

### Acceptance cases added in 1.2.0

11. Distance: on every atlas map `report.atlas.minGap` is at least 44 and `maxLeader` at most 72.
12. Keys: no warning that a key sits on Africa, under the gradient, outside the margins, over a marker or over another key.
13. Gradient: no entry, marker or key below `panelTop − 90`.
14. Collisions: `report.collisions` is 0 on every map card of a final sequence; the `atlas-proto-collisions` sample (the 1880 prototype, unchanged) must fail.
15. Capacity: `atlas-capacite-45` (45 point entries without zones, 15 under Ouest, compact keys: the worst case for the keys) renders with `report.ok` true.
16. Zones: each zone is drawn from an extent recorded in the piece's sources (`provenance`), never traced from a map.
17. Series: the nine maps of a carousel share `timeline.steps`, `from` and `to`, and the zone maps share one `view`.
18. Colour vision: the eight `col-*` tokens stay at least ΔE 16 apart under simulated deuteranopia, protanopia and tritanopia (check again if a token changes).

## 1.2.0: what is not solved

- **Zones are as good as their sources.** The engine draws an approximate zone from an extent; it cannot know the extent. Each zone of a real map needs one sentence of source in the piece's package (« de la boucle du Niger au lac Tchad, d'après … »). The sample zones are sized by hand for the demonstration.
- **Small states stay numbered.** At continent scale a state smaller than its name (most of West Africa and the Great Lakes in 1880) keeps a numbered marker and a key. At 320 px the numbers and keys are 7 px: they read only with zoom.
- **Capacity has a ceiling.** 45 entries fit; the worst case (45 points, no zone, 15 under Ouest) fills the Atlantic with compact keys and reaches the gradient within 4 px. Beyond that, a second map (West Africa alone) or a shorter list; the renderer refuses rather than shrinks.
- **Key and territory label positions are set by hand** (`keys[].x, y`, `zones[].at`). The engine checks them but does not place them. The zone maps of a carousel share one frame, so one set of key positions usually serves all seven.
- **Small territories of 1914 are not named.** Ouganda, Nyassaland, Bechuanaland, Basutoland, Swaziland and the Côte française des Somalis are outlined and coloured, but their names do not fit inland at 24 px. Naming them would need numbers and a key, as on the zone maps.
- **1914 is drawn on present-day borders.** Kamerun then included Neukamerun (taken from the AEF in 1911), which the present-day Cameroon does not show; Zanzibar (British) sits inside German East Africa's colour; Morocco is striped (France and Spain), not divided. The outlines follow present-day borders only.
- **Dates to settle before publication.** Independence: South Africa (1910, Union; 1931, Statute of Westminster; or 1961, Republic), Guinea-Bissau (1973 proclaimed, 1974 recognised), Somaliland (26 June 1960) and Somalia (1 July 1960), Eritrea (1993, after federation and annexation), Zimbabwe (1980, not the 1965 UDI). 1914: « juillet 1914, avant la guerre », since Allied troops entered Togo and Kamerun in August. 1880, in the prototype's test list: Darfour had been annexed by Egypt in 1874; the Zulu kingdom was broken up after the war of 1879; Lesotho (Basutoland) was under the Cape Colony from 1871; Tripoli was an Ottoman province. The research should decide each before the real maps.
- **Ethiopia 1936 to 1941.** The « Jamais colonisé » mark follows the brief; the Italian occupation may need a line in the caption, decided with the research.

## Renderer integration of 1.2.0

Done on 12 October 2026: `social/renderer` now pins the 38 references of
1.2.0-proposition in `reference-manifest.json`, kept in
`.local/research/social-production-2026-10-09/design-system-1.2.0-accepted/`;
the steps below are what was done.

1. Render `handoff/cards.sample.json` on the pinned browser (`runtime.json`) in
   diagnostic mode and compare with the 38 proposed references in
   `.local/research/social-production-2026-10-09/design-system-1.2.0-references/`
   (rendered in Claude Design's Chromium, so expect antialiasing differences
   only). Any other difference is a defect to report, not to absorb.
2. Keep the two operator-reconciled 1.1 references (`map-fula`,
   `map-fula-parchemin`) as they are: the engine did not change for them.
3. Update `reference-manifest.json` (`designVersion`, 38 files, previous and new
   hashes for `seq-3`, `map-fula-nombre-region`, `map-fula-part`), the expected
   refusals (`overflow`, `atlas-proto-collisions`) and the tests.
4. Check that final mode refuses the new `report.collisions` and atlas
   warnings, and that the alternative text covers zones, keys, territories and
   the period marker (`EthniCards.altText` now describes them).

## Renderer integration of 1.3.0

The operator accepted 1.3.0-proposition on 14 October 2026 and chose video layout **B** (decision 4). Layout A is not to be implemented; its boards stay in the `Vidéo` group as the record of the choice.

**New fields.** `series: {id, episode}` (or `{name, episode}`) on any card; `EthniCards.SERIES`, `EthniCards.seriesOf`, `EthniCards.BAND_H` (72) and `EthniCards.PANEL_MAX_SERIES` (828) in the engine; the mount option `context: 'video'`, which leaves out the « Faites défiler » cue. The fit report adds `report.panelMax` and, on a series card, `report.series: {text, lines, right}`.

**New refusals.** A series card whose panel exceeds 828 px; a band on two lines; a map text, marker, key, callout or inset within 12 px of the band; a series card whose photograph's focal point falls under the band; an unknown series `id` (the engine throws).

**New references.** The 49 model cards `serie-<series>-NN` and the two band-over-map samples `serie-atlas-1880` and `serie-atlas-1914-parchemin`, 51 in all, in the `References` group; the images they use are in `assets/Series/` (8 verified pictures from the site's credited library, 34 « image à trouver » slots).

**Existing references that change: none.** The 37 cards without `series` were rendered again with 1.3.0 and compared with the 1.2.0 references: identical pixel for pixel. The 38th, `overflow`, is drawn in diagnostic mode and unchanged.

**Video.** `handoff/video-board.html` renders one frame of the series video in layout A or B; it is a design board, not the video renderer. The video belongs to `social/video` (Vidéo carte 0.4.0's chunks, highlight, reading rule and voice timing), in layout B: frame 1080 × 1920, band, video card (Series, « Vidéo de série », layout B), subtitles, the 300 ms cross-fade, the 100 to 104 % zoom and the ending « série » (Series, « Vidéo de série »).

## Renderer integration of 1.4.0

**Status: accepted on 14 October 2026,** with the four decisions recorded in Series, « Vidéo de série ». It replaces the series video's layout B of 1.3.0 and nothing else. **The card renderer is unchanged:** a card without video context renders as in 1.3.0. The eight new `on-image-*` tokens are used by the video only; seven sample cards (`serie-pays-01`, `serie-pays-04`, `serie-pays-07`, `serie-nom-recu-01`, `serie-frontieres-02`, `seq-1`, `map-fula`) were rendered with the 1.3.0 and the 1.4.0 `tokens.json` in Claude Design's Chromium: identical pixel for pixel. Rerun that comparison on all 89 references on the pinned browser.

**Version.** `EthniCards.version`, `version.json` and `handoff/cards.sample.json` say `1.4.0-proposition`; nothing else in `bundle.js` or `bundle.css` changes. The card renderer's `reference-manifest.json` takes the new `designVersion` with the same 89 reference hashes.

**Where it goes.** `social/video`: `series.mjs` (`LAYOUT`, `checkSeriesLayout`), `series-page.mjs` (the layout B styles and `buildLayer`), `series-render.mjs`. `handoff/video-board-full.html` is the visual reference, not the engine; it draws one frame from the sample cards (`?card=…&next=…&fade=…&sub=…&lit=…&zoom=…&guides=1`). The schedule, voice, chunks, `pageOnline` and encoding of 1.3.0 stay. The design's `version.json` says `"videoLayout": "full"`; the engine checks it instead of `"B"`.

**Bands** (frame pixels, every text between x 60 and 1020):

| Band        | y            | Check                                                    |
| ----------- | ------------ | -------------------------------------------------------- |
| Demo tape   | 178 to 226   | right edge on x 1020; mockups only                       |
| Series band | 250 to 290   | one line                                                 |
| Head        | 318 to 700   | title three lines at most; the ending's block 318 to 820 |
| Clear image | 700 to 1300  | no text; the focal point aimed at (540, 1000)            |
| Subtitle    | 1316 to 1452 | centred on 540, lines at most 900 px (0.4.0)             |
| Foot        | 1652 to 1786 | bottom aligned on 1786                                   |
| Signature   | 1836 to 1884 | content cards from x 60; ending centred, 1828 to 1884    |

**Legibility rule.** Every text on the image: fill from the `on-image-*` tokens (the same in Nuit and Parchemin), `-webkit-text-stroke` in `on-image-stroke` with `paint-order: stroke fill`, outline width by size (subtitle 9 px, opener title 13, title and slogan 10, date 14, name employed 8, every text from 22 to 34 px 4), shadow `on-image-shadow` 0 2px 14px from 40 px up, 0 1px 8px below. The lit word: background `on-image-accent`, text `on-image-on-accent`, no outline, radius 6, 6 px side shadows. The page draws nothing with a background over the image except the lit word, the pill's outline rings, the « image à trouver » slot and the demo tape: no veil, scrim, gradient or panel.

**Long-date rule.** The date takes the largest of 176/156, 148/136, 124/118, 104/100 that holds on one line in 960 px, measured on the drawn glyphs; else two balanced lines at 104/100; day, month and year joined by no-break spaces; a date that needs a third line is refused.

**New fields.** `image.video: { src, focus }` (a video framing for an image too wide or whose focal point is out of reach); `map.videoView: [x, y, w, h]` (the map's 9:16 view, map units); `image.find` (what an « image à trouver » slot must show, drawn as text on the video frame).

**What the engine checks** (refuse, or report with `--diagnose`):

1. Every text box inside x 60 to 1020 and inside its band (table above), on the cover, the last frame and every frame where a chunk is fully drawn.
2. Band on one line; head at most three title lines; date per the long-date rule.
3. Image scale at most 1.5 frame pixels per source pixel at 104 % (« Image trop petite pour la vidéo »); `keptWidth` reported; a focal point that cannot reach y 700 reported.
4. Map card: the subject's box (highlight or areas) below y 724 and above the foot (« Le sujet de la carte passe sous la tête »); the view inside the base map's drawn extent.
5. No two cards' heads visible together: during a change the outgoing text fades out over frames 1 to 4 and the incoming text fades in over frames 5 to 9 of the 9-frame change, while the images cross-fade over all 9; band and signature drawn once.
6. French spacing applied to every text, subtitles included.
7. A final video refuses a slot, as in 1.3.0.

**Boards** (`Video` group, `video-14-*`; full size 1080 × 1920 and 430 px): cover, subtitle with the lit word, the card change at 100 and 200 ms, a dated card with a long date, a map card, a Parchemin card, the « image à trouver » slot in both themes, both endings, the guides, the feed at 430 px, legibility on the hardest images, the Parchemin inks compared, the long dates, the framing of wide images, and a map refused.

## Renderer integration of 1.4.1

**Status: accepted by the operator on 14 October 2026.** It changes one rule of 1.4.0, how a map card is drawn in the series video (Series, « Map cards on satellite imagery »), and nothing else: the frame, band, head, subtitles, foot, legibility rule, long dates, card change, endings and every carousel card stay. The card renderer and the flat base maps are unchanged. `EthniCards.version`, `version.json` and `handoff/cards.sample.json` move to `1.4.1-proposition` at acceptance, with the 89 reference hashes unchanged.

**Integrated on 14 October 2026** in `social/video` ([evidence](proposals/1.4.1-proposition/README.md)). Two precisions taken by the integration, within the accepted rules: the view is computed in `series-map.mjs` (`seriesMapView`), which `series.mjs` and `series-render.mjs` use; and the scale cap is taken at the end of the card's zoom, as check 2 below requires, so the narrowest view is 1388 km across at 100 % and 1336 km at 104 % with the verified file. The flat shader and the overlays are exported by `page.mjs` (`FLAT_FRAG`, `OVERLAY_SCRIPT`) and shared, not copied; the satellite video's frames are pixel-identical before and after.

**Where it goes.** `social/video/series.mjs` computes the map card's view as a pure function of the card and its base map (`seriesMapView`); `series-page.mjs` draws it with the satellite video's own shader and overlay functions from `page.mjs` (reuse them, do not fork them); `series-render.mjs` prepares the imagery with `render.mjs`'s `prepareImagery` (the verified Blue Marble file, from `ETHNIAFRICA_VIDEO_ASSETS`, outside git) and reads Natural Earth 1:50m admin 0 as `areas.mjs` pins it. `handoff/video-board-sat.js` and the board page's `?sat=` mode are the visual reference, not the engine; the views of the boards were computed by the script kept with the design package.

**Framing.** Target: the middle of the subject's longitude and latitude box (highlight outlines, or the card's areas converted). Frame position of the target: (540, 1010). Radius (pixels per Earth radius): the largest that fits the subject's box within 840 × 520 px, capped by the scale limit, `R ≤ 1080 ÷ (minSpanKm ÷ 6371)` with `minSpanKm = 720 × source km a pixel` (1336 km for the verified 21600 px file). Flat style only (orthographic, no tilt); the zoom 100 to 104 % scales the radius around (540, 1010).

**Grade.** `grade = 1` (recede) on every frame; no vignette term and no ending dim in the series frame.

**Card units to longitude and latitude.** From the base map's `meta.projection` (« équirectangulaire, k px par degré, origine λ0 φ0 »): `lon = λ0 + x ÷ k`, `lat = φ0 − y ÷ k`, applied to every point of an area path (control points included) and of a label or place.

**Overlays.** `page.mjs`'s `areaFill`, `areaEdge` and `border` with its inks a, b, c and hatch patterns; layer order fills, borders, edges. Highlight: Natural Earth outline as a certain area in the card's `tone`. Borders: the edges shared by two Natural Earth countries within the frame's bounds (`a.boundary ∩ b.boundary`), never a coastline. Names: `page.mjs`'s region, area-label, place and water styles on their halos, placed by `placeLabels`.

**Credits.** Foot: `Source :` + the card caption's source minus its « fond … » clause; then « Imagerie : NASA Earth Observatory ; frontières : Natural Earth, domaine public » in the credit style (`IMAGERY[…].credit` for another verified source).

**What the engine checks** (refuse, or report with `--diagnose`):

1. The subject's box between y 724 and the foot's top, and its long side at least 120 px (« Sujet trop petit pour l'imagerie vérifiée »).
2. The imagery verified (SHA-256) and the frame at least `minSpanKm` wide: no source pixel enlarged past 1.5, zoom included.
3. At most six names on screen, every name box between y 724 and 1296 and x 60 and 1020, no two overlapping.
4. Every text box in its band, a map card's foot between y 1600 and 1786 with its key in two columns from three items.
5. An atlas card (`map.categorical`, `map.atlas`, zones, keys or a period marker) refused: « Carte d'atlas : carrousel seulement ».
6. No vignette, scrim or veil over the imagery (the render tests' background check).

**Withdrawn from 1.4.0:** `map.videoView` on the flat base map, the subject at (540, 1000) on the card's map, the refusal « Le sujet de la carte passe sous la tête » for a short base map, and the 9:16 base map per region.

**Boards** (`Video` group, `video-141-*`): `serie-nom-famille-02` (Côte d'Ivoire highlighted), `serie-frontieres-02` (two areas across a border, Parchemin, drawn at the scale limit), the change from a photograph to a map at 100 and 200 ms, the guides, the Parchemin and the flat carousel cards beside their video frames, the atlas card kept on the carousel, and the 430 px strip.

## Renderer integration of 1.5.0

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations** (Series, « Map sequence », decisions 1 to 4). The Amazigh area of the test episode is built from its own cited source before the episode is produced. It adds the map sequence to the series video (Series, « Map sequence »); a single map card without `map.sequence` stays exactly as in 1.4.1, and no carousel card changes.

**Card data.**

```json
"map": {
  "sequence": "touareg",
  "areas": [
    { "file": "touareg-imuhagh.geojson", "name": "Imuhagh", "lang": "tamahaq", "ink": "a", "say": "Imuhagh", "langSay": "tamahaq" },
    { "file": "touareg-imajeghen.geojson", "name": "Imajeghen", "lang": "tamajaq", "ink": "b", "say": "Imajeghen", "langSay": "tamajaq" }
  ],
  "caption": { "source": "fiche EthniAfrica Touareg ; aires approximatives d'après Natural Earth et al-Idrîsî (1154)" }
}
```

`say` and `langSay` name a unit of the card's own chunks (`chunkUnits`), first occurrence; a card later in the sequence lists the areas its view frames, and may set `say` only for those entering on it. The area files are those of `social/video/data/areas/`, with their `kind`, `source` and `licence`; the engine reads no inline path for a sequence.

**Timing** (frames at 30 fps, from the voice's words JSON). An area's entry starts at the start of its `say` word, or 21 frames (700 ms) after the previous entry in the sequence if that is later; its opacity is `enter((f − start) / 21)` (the 0.4.0 easing). Its name starts when the area reaches 0.6 and takes 9 frames (300 ms); its key item follows the area. A language starts at its `langSay` word and takes 9 frames. Nothing that has entered leaves before the sequence ends, except an area the next view does not frame.

**Inks.** `page.mjs`'s `INK` gains `d: "#c4a8f2"`, with its hatch patterns at 45° and 135° and its legend swatches, generated as for a, b and c; the satellite video's frames do not change. On imagery, every coloured stroke keeps its dark keyline (`areaFill`, `areaEdge`).

**Labels.** Placed by `placeLabels` in the map band (y 724 to 1296, x 60 to 1020) with a `stack` style: one box for name and language, 32/38 then 26/30, both outlined (`-webkit-text-stroke` 6 px and 5 px, `paint-order: stroke fill`). The box is reserved at full height from the name's entry, so the language never moves it. A label with no room goes to the key as text (0.4.0).

**Continuity.** Consecutive cards with the same `map.sequence` share one map layer: the page draws the imagery once per view and never cross-fades it between them; only the head and foot layers change, with the 1.4.0 timing. The zoom is `1 + 0.04 × (f − sequence start) / (sequence end − sequence start)`. A card of the sequence that comes back after another card is entered by the ordinary 9-frame cross-fade, its overlays at their end-of-sequence state.

**Change of view.** When a card's view differs from the previous card's, the camera moves during the change: 27 frames from the outgoing card's change start, longitude and latitude linear, radius log-linear, eased (`enter`), flat, orthographic. The imagery is redrawn each frame of the move (the only frames where it is). Names fade out over the first 5 frames and back over the 5 after the move; an area outside the new view fades out over the move.

**Credits.** As 1.4.1, the source line from the caption; then « Imagerie : NASA Earth Observatory ; contours : Natural Earth, domaine public », with « frontières » instead of « contours » when the map draws borders.

**What the engine checks** (refuse, or report with `--diagnose`):

1. Every sequence area is a file of `social/video/data/areas/`; a sequence with an inline area path is refused.
2. Every `say` and `langSay` is a unit of its card's chunks; one not found is refused (« Mot de la carte absent du sous-titre »).
3. At most four inks in a sequence (« Cinq noms en couleur : quatre au plus »), at most six labels on screen, a stack counting one.
4. Each view: subject between y 724 and the foot, the scale limit, every label in the map band.
5. Between two cards of one sequence, the imagery is not cross-faded: away from overlays and text, the pixels of the last frame of one card and the first of the next are equal unless the view changes.
6. A camera move only happens during a card change, in 27 frames, flat.
7. The 1.4.1 checks hold for every map card.

**Boards** (`Video` group, `video-150-*`): the four beats (`carte-1` to `carte-4`), the entries on the word, the change of view, the return after a photograph, the label rule, the inks, the timing, the 430 px strip. Drawn by a scratch copy of the 1.4.1 engine page, patched for per-area opacity, stacked labels and the fourth ink; the script is kept with the design package.

## Required assets

- Fonts: `fonts/Anton-Regular.ttf`, `fonts/NunitoSans.ttf`, `fonts/NotoSans-Variable.ttf`, `fonts/Fraunces.ttf`, `fonts/NotoSansEthiopic-Bold.ttf`, all under the SIL Open Font License 1.1.
- Logo: `Logo/ethniafrica-logo.png` (512 px PNG, from `social/brand/`).
- Base maps: `assets/Cartes/grands-lacs.json` for the examples; `assets/Cartes/afrique.json` for the continent, which carries since 1.2.0 `africa` (union of African states), `centers` (one interior point per state) and `bordersMerged` (continuous borders for dotted lines); one file per region, built the same way from Natural Earth.
- Per piece: the real photographs, documents and map data, with the credit, licence and source page of each.

## Output formats

- Cards: PNG, sRGB, 1080 × 1350, `01.png` … `NN.png`.
- Alternative texts: one per file in `post.md`, composed by `EthniCards.altText` and reread.
- Fit reports: kept with the piece's working files until delivery, so a later correction can show what changed.
- Phone previews for approval 2: the same cards mounted at 430 px and 320 px (`width` option), as in the `Lecture` images.

## Decided by the operator on 10 October 2026 (afternoon)

- Titles stay in Anton, sentence case. Text returns to Nunito Sans, the site's face, at 32 px: the 40 px Andika text of version 1.0 changed the look too much.
- The veil is lighter, so the picture shows through the text.
- Two looks: dark (Nuit) and light (Parchemin), chosen per publication.
- The closing card follows the fetishism carousel: centred slogan, outlined site pill, centred signature.
- Dated cards keep the date, the name, what it designates and who uses it; the timeline leaves the cards and becomes a recap on the closing card. The two-forms variant stays, with a colour per form.
- Map cards: the map, a title and a legend, no running text. A demonstration across several states takes several maps.
- NameForms stays as it is: a comparison, without a long description. The opener is a title.

## Choices left to the operator

1. **Missing letters in Nunito Sans.** ɛ, ɔ, ɲ, ƙ, ɖ and ɣ come from Noto Sans inside the text, a slightly different drawing. Accept it, or keep such names in titles, terms and field names (Anton).
2. **Closing slogan.** « Notre objectif : raconter l'origine des noms, avec des sources. » comes from the fetishism carousel. Keep it on every closing card, or write one per publication.
3. **Image on every card.** The `NameForms` pair example has no image yet; the operator's rule of 30 September asks for one on every card.
4. **Logo licence.** The repository does not record where the Africa icon of the logo comes from or under which licence. Confirm before the first production under this system.
5. **Anton's ʋ.** At title size Anton draws ʋ close to a v (see « Eʋegbe » on the `stress` card). Accept it, or set that name in the text face.
6. **Reference screenshots.** The map card now follows the La Minute Géographie screenshots seen on 10 October (a light map, a dark title band, words coloured like the legend). Their branding, wording and maps are not reused.
7. **Platform overlays.** TikTok shows its buttons and caption over the right and bottom of a photo carousel. Check card 1 and the densest card on a phone before the first publication.

## Commissioned on 12 October 2026 (1.2.0)

- The series « L'Afrique à travers le temps » shows all the known states on each map, not a selection; the operator chose this addition rather than cutting names or adding zoom cards.
- Afternoon review: the 1914 map names its territories (AOF, AEF, Congo belge…); present-day borders are dotted on the 1914 and independence maps; states, societies and cultures are drawn as approximate zones at one moment rather than numbered points, which read as towns; dates must be checked.
- Decisions taken in this proposal, open to the operator's proof: the wording « Société sans roi » in the legend (the brief allows a change at proof); the « ° » mark for uncertain dates; the diamond for archaeological sites; the 1914 legend in three columns in the panel rather than a key over the sea; one frame for all point maps of a carousel.
- Accepted by the operator on 12 October 2026 after the afternoon review (« c'est parfait »), with these decisions.

## Commissioned on 13 October 2026 (1.3.0)

- The operator's decisions of 13 October 2026, drawn as given: the band at the top of the card; 72 px taken from the panel (828 px), the image window keeping 450 px; the episode number in `accent`; the video's ending keeps « Cherchez [nom] sur EthniAfrica, lien en profil. », a deliberate exception to the 0.4.0 endings; an image on every model card.
- Video layout chosen by the operator on 14 October 2026: B, the video's own card (decision 4).
- Accepted by the operator on 14 October 2026, with these decisions.

## Commissioned on 14 October 2026 (1.4.0)

- The operator's decision of 14 October 2026, drawn as given: the series video's image fills the whole frame, with no shadow zone and no placement fitted to the networks' interface; only text sits on the image. Decision 4 (layout B) is withdrawn.
- Brief: `proposals/1.4.0-proposition/claude-design-brief.md` on the repository branch `feat/social-series-video-b`.
- Accepted by the operator on 14 October 2026, with the designer's recommendations on the four open questions (Series, « Vidéo de série »).

## Commissioned on 14 October 2026 (1.4.1)

- The operator's decision of 14 October 2026: in the series video, a map card is drawn by the satellite video engine on imagery; no flat 9:16 base map is built per region; one map grammar in video, the satellite video's.
- Brief: `proposals/1.4.1-proposition/claude-design-brief.md` on `recette`.
- Proposed and accepted on 14 October 2026.

## Commissioned on 15 October 2026 (1.5.0)

- The operator's request of 15 October 2026, for series 2, episode 1 (« Touareg »): the regions appear on the map as the voice names them, each in its colour; then the language names on the same regions; then, in the summary, the map returns with the names and languages.
- Brief: `proposals/1.5.0-proposition/claude-design-brief.md`. The signature line brief, first filed under the same number, is renumbered 1.6.0 (`proposals/1.6.0-proposition/`).
- Proposed and accepted on 15 October 2026, with the designer's recommendations.
