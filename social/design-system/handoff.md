# Handoff to production

## Acceptance and integration status

**1.15.0-proposition, 26 October 2026, accepted by the operator the same day.** External video in the series video: the clip (a full-screen picture phase with in and out points and an audio mode), the montage of two or three clips under one narrated phase, footage with or without one designed overlay, per-network framing with a landscape window, the credit and rights lines, the renderer field for an external MP4 and the footage-first opener. Changes no card, token or component. Partly integrated in `social/video` on 26 October 2026: see « Renderer integration of 1.15.0 ».

**1.14.0-proposition, 21 October 2026, accepted by the operator the same day, with the designer's recommendations.** Figures and facts drawn on the map, not written: the figure head, the states' cascade, people and speech bubbles as units, the row of five, two glasses for the age, pins and letterings, stamps, an empty name frame, a travelling drawing; the free phrase on the map retired. Integrated in `social/video` on 21 October 2026: see « Renderer integration of 1.14.0 ».

**1.13.0-proposition, 20 October 2026, accepted by the operator on 21 October 2026, with the designer's recommendations.** Motion and sound of every series video: the motion tokens, the pop and the swell, the continuous camera, the whip zoom and the warm flash for the story's turns, the era map and its date counter, drawn marks, flags only inside a state existing on the date shown, the headline band, three format tiers, the subject key and the recap card, episodes about a word, and the sound cues as a specification. Integrated in `social/video` on 21 October 2026: see « Renderer integration of 1.13.0 ».

**1.12.0-proposition, 20 October 2026, accepted by the operator the same day, with the designer's recommendations.** Teaching cards in motion on the idents' parchment ground: the week table one people per table with lit rows, the formula built by moves, drawings for what a name says, and the parchment text card. See « Renderer integration of 1.12.0 ».

**1.11.0-proposition, 19 October 2026, accepted by the operator the same day, with the designer's recommendations.** The animated satellite map of the series video: the opening globe that becomes the first map, area states, route arrows, drawings on the map, words on the map, moves inside a card, a name that changes, map and picture phases, and a silent viewing check. See « Renderer integration of 1.11.0 ».

**1.10.0-proposition, 19 October 2026, accepted by the operator the same day, with the designer's recommendations.** A new ending for every series video and every carousel: « L’importance de connaître nos noms. » and the fixed invitation « Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. » replace the signature line and the « Cherchez [nom] » invitation. See « Renderer integration of 1.10.0 ».

**1.9.0-proposition, 16 October 2026, accepted by the operator the same day, with the designer's recommendations.** A second contour under every text on the image of the series video, in place of the 1.4.0 soft shadow, and a dark edge on the lit word. See « Renderer integration of 1.9.0 ».

**1.8.0-proposition, 15 October 2026, accepted by the operator the same day, with the designer's recommendations.** The document card (the quoted passage framed sharp and underlined, the rest of the page out of focus) and three teaching cards: the name-making formula, the side-by-side forms and the week table. See « Renderer integration of 1.8.0 ».

**1.7.0-proposition, 15 October 2026, accepted by the operator the same day, with the designer's recommendations.** The long series video: chapters on screen, readings, figures, a quoted person, the signed position, two invitations and the next episode on the ending. See « Renderer integration of 1.7.0 ».

**1.6.0-proposition, 15 October 2026, accepted by the operator the same day, with the designer's recommendations.** The project's signature line « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. » ends every carousel and every series video, after the series' fixed closing; it retires the closing slogan (choice 2) and takes « L'Afrique à travers ses noms » off the closing card. See « Renderer integration of 1.6.0 ».

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

### Renderer integration of 1.15.0

Spec: [proposals/1.15.0-proposition/README.md](proposals/1.15.0-proposition/README.md). Integrated in `social/video`:

- **The card.** A series card whose `image` is `{ clip }` (one shot) or `{ clips }` (two or three) is a clip card. A shot gives `src` (relative to the piece folder), `in`, `out`, `fx`, `audio`, `place`, `rights` (`author`, `licence`, `sourceUrl`), and, after the first, `say`: the word of the voice on which it enters. The loader checks the file with ffprobe (H.264 or H.265, 1920×1080 at least), the cut rules (2 s a shot, 2.5 s for the last, three at most, six seconds in all) and that each shot's footage lasts as long as it stays on screen. A 720p source is a warning in a demonstration and a refusal in a final video.
- **The drawing.** The footage is cut into one 1080×1920 still per frame by FFmpeg, shared by the render's slices, and Chromium draws the still of each frame; footage is never pushed in. The foot shows the shot's place, author, licence and source domain, and changes at each cut.
- **Engine adaptations of the designer's numbers.** The credit sits in the card's existing foot, not at the designer's y 1392 and 1440, which fall in the subtitles' band of the engine; the clip's stills are 1080×1920 only.

Not integrated yet: the audio modes (the source is never played), the overlays (figure, present-day date, word), the landscape window of the opener, the 4:5 frame of Facebook, and the 2-frame tolerance of a cut to a word (a cut falls on the word's first frame). The tests are `series-clip.test.mjs`, `series-clip-frames.test.mjs` and `series-clip-card.test.mjs`.

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

## Renderer integration of 1.6.0

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations** (Series, « The signature line », decisions 1 to 4). It comes after the 1.5.0 integration (branch `feat/social-series-map-sequence`): `series.md` on `recette` does not yet carry the 1.5.0 text, so 1.5.0 is deposited first, then 1.6.0 over it. The rules are in Series, « The signature line ».

**One constant.** The line is a constant of the renderer, never a card field, so no card can change it: `EthniCards.signatureLine` (« Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. ») and `EthniCards.signatureLines`, its three printed lines. The series video reads the same constant from the bundle it already loads; it keeps no copy of its own.

**Carousel** (`components/bundle.js`, `components/bundle.css`).

- On `type: "closing"`, the panel draws the line where the title was: `<div class="ec-sigline">` with one `<span>` per printed line, each `display: block; white-space: nowrap`. Fraunces 600 56/64, `ink`, centred, 28 px above the invitation.
- The top of the line sits at y 760 on every closing card: after measuring, an empty block between the pill and the credit takes the difference, settled to the pixel. A line that would sit lower than 760 (an invitation or a credit longer than two lines) is refused (« Ligne de signature poussée hors de sa place »).
- A closing card with `title` is refused (« Titre sur une carte de clôture : la ligne de signature remplace la phrase de clôture »). The default title of the closing card is removed.
- The centred signature row draws no motto: `TAGLINE` leaves the closing card.
- `tokens.json` records the style `signature-line` (Fraunces 600 56/64) in the « Signature » group; `display-closing` and `tagline` are marked retired. Nothing in the renderer reads the type groups, so no card changes through them; remove the two retired styles once nothing in the repository refers to them.
- `altText` ends with `signatureLine` on a closing card and no longer reads its title.
- The sample: the ten closing cards (`seq-9`, `seq-9-parchemin`, `chr-5` and the seven series closings) lose their `title`. Their ten references are redrawn and accepted again with 1.6.0; the 79 other references must stay pixel-identical, alternative texts included.

**Series video** (`social/video`).

- The ending layer draws the line where the slogan was, `vf-sigline`: Fraunces 600 56/64, `on-image-ink`, 8 px outline, the large shadow, top at y 318. `LAYOUT.ending` stays 318 to 820.
- The voice says the line (decision 1): the closing card's chunks are the line in three chunks, « Connaître nos noms, », « décoloniser leur emploi, », « nous nommer nous-mêmes. », then the invitation's two chunks (the existing check). None of the closing card's chunks is shown: the subtitle band is empty from the ending's first frame.
- The hold is otherwise unchanged: 75 frames, or the voice's end plus 0.5 s.

**What the renderer checks** (refuse, or report with `--diagnose`):

1. **Present.** Every closing card and every video ending draws the line.
2. **Identical.** Its text, lines joined by one space, equals the constant, character for character; three line boxes of 64 px each, so no line wraps and « nous-mêmes » is whole.
3. **After the fixed closing.** A carousel's closing card has no title (the fixed closing is on an earlier card); a video's ending is its last card and the line is its first text under the band.
4. **In its band.** On the card: top at y 760 within 0.5 px, inside x 72 to 1008. In the video: inside y 318 to 820 and x 60 to 1020.
5. **Nothing over it.** The boxes of the line, the invitation, the pill, the credit and the signature row do not overlap; a kicker or a recap ends above y 760.
6. **Alternative text.** It ends with the constant, word for word.
7. **Spoken line.** The closing card's chunks start with the line's three chunks, word for word (« La ligne de signature n'est pas dite mot pour mot »), and the subtitle band shows nothing during the ending.

**No U+2011.** The brief suggested a non-breaking hyphen in « nous-mêmes » if the browser would break there. Fraunces, Nunito Sans and Anton have no glyph for U+2011, so the browser would draw it from a fallback face. The line keeps U+002D, and each printed line is set without wrapping: it cannot break at the hyphen.

**Boards and prototype.** `Lecture` group `cloture-160-*`, `Video` group `video-160-*` (Series, « Boards (1.6.0) »). They were drawn by a scratch copy of the accepted `bundle.js` and `handoff/video-board-full.html`, patched as described here; the patch is kept with the design package. Since the acceptance the bundle and `handoff/video-board-full.html` on this page carry the patch: the ten closing cards changed, the 79 others are pixel-identical to their 1.5.0 renders, alternative texts included.

## Renderer integration of 1.7.0

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations** (Series, « Vidéo longue et chapitres », decisions 1 to 5). It comes after 1.5.0 and 1.6.0 are in `recette` (1.6.0: PR #1784). The rules are in Series, « Vidéo longue et chapitres ».

**Sequence data.**

```json
"chapters": [
  { "title": "Un continent entier" },
  { "title": "D'où vient le mot" }
],
"reminder": "afrique-tout-01-rappel",
"ending": { "search": "Afrique", "pageOnline": true, "next": "le pays des Noirs" }
```

A chapter card is a card of the sequence, `{ "type": "chapter", "chapter": 2, "image": … }`; the engine prints its number, « sur N » and the title from `chapters`. `ending.general: true` replaces `ending.search` for the general invitation. `reminder` names the card that carries the hook reminder.

**Card fields** (explanation cards of the video):

- `readings: { items: [{ label?, text, by?, say }] }`, five items at most, each `text` two lines at most at 40 px in 960 px.
- `figures: { items: [{ pre?, value, unit?, label, say }] }`, three or four.
- `attribution: { name, role, say }`.
- `signed: true`.
- `sourceLabel`: « Source » (default), « Sources » or « Hypothèses ».

`say` names a unit of the card's own chunks (`chunkUnits`), first occurrence, as 1.5.0's `say`.

**What the engine draws.**

1. **The chapter card**: the head only. Number in Anton 176/140, `on-image-accent`; « sur N » in Nunito Sans 800 30/36, `on-image-muted`, on its baseline; the title in Anton 116/112, two lines at most, at most 900 px wide. No subtitle and no source; the image's credit in the foot.
2. **The chapter kicker**, « n · Titre », on every content card of a chapter, composed from `chapters`; a dated card keeps its marker label and a signed card shows « Nous pensons ». The kicker in the card data is not changed, so the carousel keeps it.
3. **Readings and figures** under the title, inside the head's flow, ending above y 1290. Items enter on their `say` word over 9 frames (`enter`), their place kept from the card's first frame.
4. **The attribution**, bottom at y 1296 from x 60, entering on its `say` word over 9 frames, kept to the end of the card.
5. **The signed card**: kicker « Nous pensons », foot « Position d'EthniAfrica », no source line.
6. **The ending**: the 1.6.0 block, then « Prochain épisode : [titre] » 30 px under the pill, Nunito Sans 800 and 700 32/40, when `ending.next` is set and the block still ends by y 820. Otherwise the engine inserts a card before the ending: the kicker « Prochain épisode » and the title in Anton, on the ending's image, held at least the title's reading time at 21 characters a second plus 0.3 s.
7. **Hyphenated words** in titles, kickers, items and the invitation are set without wrapping.
8. **Runs of one image**: when consecutive cards share an image file and framing, the change cross-fades the heads only, and one zoom of 100 to 104 % runs over the whole run.

**Timing.** A chapter card has no chunks. It starts when the previous chapter's last chunk has gone and ends where the next card's 300 ms change begins, 150 ms before that card's first chunk. Its full-opacity span must last at least max(36 frames, ceil((characters of the title ÷ 21 + 0.3) × 30)); a shorter silence is refused with the milliseconds missing. The ending's hold is unchanged (1.6.0).

**What the engine checks** (refuse, or report with `--diagnose`):

1. A video longer than 90 s has 3 to 7 chapters, each at least 15 s (« Vidéo longue sans chapitres »); a chaptered video outside 2 to 4 min, or a short one outside 35 to 75 s, loads with a warning.
2. Chapter titles: one to two lines, inside x 60 to 960 and y 318 to 700; the silence check above.
3. Every content card of a chapter shows its chapter kicker, except the two exceptions.
4. `readings` and `figures`: every `say` is a unit of the card's chunks; the items end above y 1290; the card holds at least the time to read its items at 21 characters a second.
5. The attribution's `say` is found; its box stays above y 1300 and clear of the subtitle band.
6. A signed card has no source; a sourced card has no « Nous pensons ». A video without a signed card loads with a warning (decision 4).
7. The reminder card shows the opener's image and framing and comes between 75 and 120 s (warning outside).
8. The invitation is the named or the general form, word for word, and its two chunks close the ending's chunks after the signature line's three (1.6.0).
9. `ending.next` holds on one line; the ending block ends by y 820, or the next episode moves to its own card.
10. A source text that starts with « Mot : » is refused (« Le champ source porte déjà son étiquette »).
11. No line breaks inside a hyphenated word.
12. Everything accepted before still holds: bands, the 300 ms change, map cards and sequences, the signature line.

**Length it recommends**: 35 to 75 s for a short video, 2 to 4 min for a long one, and chapters from 90 s.

**Boards and prototype.** `Video` group `video-170-*` (Series, « Boards (1.7.0) »), drawn by a scratch copy of `handoff/video-board-full.html` patched as described here; since the acceptance `handoff/video-board-full.html` on this page carries the patch.

## Renderer integration of 1.8.0

**Status: accepted by the operator on 15 October 2026, with the designer's recommendations** (Series, « Document and teaching cards », decisions 1 to 5). Integration order: 1.6.0 (PR #1784), then 1.7.0, then 1.8.0, each in `recette` before the next. The document card comes first: the « tribu » video needs it by about 22 October. The rules are in Series, « Document and teaching cards ».

**Card fields.**

```json
"image": {
  "src": "page-academie-1835.jpg",
  "document": {
    "passage": [125, 712, 680, 125],
    "marks": [[722, 759, 70, 28], [130, 796, 300, 30]],
    "say": "sauvages"
  }
}
```

- `image.document`: `passage` and `marks` in source pixels; `say`, the unit of the card's chunks on which the underline enters; for a web capture, `pad` (pixels added above the page) and `padColor` (the page's own background).
- `formula: { steps: [{ say, day?, rows: [{ label, parts: [{ text, role }] }], note? }] }`, `role` one of `name`, `day` (accent), `op` (« + », « = », « → »), `dropped` (30 %).
- `sbs: { heads: [a, b], rows: [[{ name, day }, { name, day }]], daysSay, note?, noteSay }`.
- `week: { heads, rows: [[jour, [mot, garçon, fille], [mot, garçon, fille]]] }`.

**What the engine draws.**

1. **Document framing.** Scale s = max(cover, min(1.5, 960 ÷ passage width)); the passage's centre to (540, 1000); the page clamped to the frame, except that the frame may pass the page's edge by up to 400 px, on the frame's dark ground.
2. **Out of focus.** The page is drawn twice: blurred by 7 px over the whole frame, and sharp under a mask that is opaque from 48 px above the passage to 48 px below it and fades to nothing over 90 px. The slow zoom applies to both, around (540, 1000).
3. **The underline.** 7 px in `on-image-accent` with a 2 px keyline of `on-image-stroke` at 85 %, under each mark, 5 px below it, drawn in the sharp layer so it zooms with the page; it fades in over 9 frames from the start of its `say` word.
4. **Foot.** One « Source : » line; no credit line on a document card.
5. **Formula.** In the clear zone from y 740, centred: the day line, then each row's label and line; each line at the largest of 120, 104 and 88 px that holds in 960 px. Each step enters on its `say` word in 9 frames; the previous step cross-fades out in place over the same 9 frames.
6. **Side by side** and **week table** under the title, inside the head's flow, ending above y 1290; rows enter on their words, the days on `daysSay`, their place kept from the card's first frame.

**What the engine checks** (refuse, or report with `--diagnose`):

1. The passage lands inside y 700 to 1300 and x 60 to 1020; the scale is at most 1.5 and at least the cover scale; the page's edge shows by 400 px at most (« Passage hors de l'image dégagée »). Amended by the operator on 16 October 2026: before this check, `documentFrame` lowers the scale, in steps of 0.0005 and never under the scale that covers the frame's width with at most 400 px of edge at the top and the bottom, until the passage fits inside x 60 to 1020; the y range and the 1.5 limit are unchanged. A passage that ends near the page's edge does not fit at any scale and is still refused here.
2. Every mark lies inside the passage.
3. Every `say` is a unit of the card's chunks.
4. A document card has a `source` and no `credit`; a web capture's source starts with « Capture : » and names the capture's date.
5. The blur never covers the passage: the sharp band contains the passage's box.
6. Formula: every line holds in 960 px at 88 px or more; « = » only between parts whose letters add up to the result (checked on the strings); the formula ends above y 1290.
7. Side by side: two columns, two to three rows; the note, when present, holds on two lines.
8. Week table: the card holds at least its reading time at 21 characters a second, else it must be split.
9. Everything accepted before still holds: bands, the 300 ms change, the head inside y 318 to 700, the subtitle band, the 1.7.0 rules.

**Boards and prototype.** `Video` group `video-180-*` (Series, « Boards (1.8.0) »), drawn by a scratch copy of `handoff/video-board-full.html` patched as described here; since the acceptance `handoff/video-board-full.html` on this page carries the patch.

## Renderer integration of 1.9.0

**Status: accepted by the operator on 16 October 2026, with the designer's recommendations** (Series, « Legibility on light pictures: the double outline », decisions 1 and 2): treatment C and the lit word's dark edge. It comes after 1.8.0 (in `recette` since PR #1790, its check 1 amended by PR #1794).

**Where it goes.** `social/video/series-page.mjs`, where the page's styles give every text on the image `-webkit-text-stroke: var(--sw)` with `paint-order: stroke fill` and a `text-shadow` of `on-image-shadow` (`.oi`, `.oi-l`, `.sub-text`).

1. **Filters.** One SVG filter per radius r (3 to 8 px), in the page's defs: `feMorphology` dilate of `SourceAlpha` by r, blurred by 0.6 and filled with `on-image-ring` (the second contour); the same dilation blurred by r and filled with `on-image-ring-soft` (the soft shadow); merged under `SourceGraphic`. `tools/patch190.py`, mode C, has the exact filter.
2. **Which elements.** Every text block on the image that has no text-on-image ancestor (the band, each head element, each subtitle line, each foot line, the wordmark, the ending's lines and pill, the 1.7.0 and 1.8.0 blocks) takes `filter: url(#oi-ring-r)` with r = max(3, round(0.6 × its outline width)); the subtitle line's outline is 9 px, so r = 5. Its `text-shadow` is removed (`none`); nested spans inherit.
3. **The lit word.** `box-shadow: 6px 0 0 accent, -6px 0 0 accent, 6px 0 0 2px stroke, -6px 0 0 2px stroke, 0 0 12px 4px rgba(11,8,6,.55)` (tokens `on-image-accent`, `on-image-stroke`); its text stays without stroke.
4. **Not changed.** Map names on imagery (`.sm-*`, `.sat-*`), the logo's drop shadow, the slot, the demo tape, the document card's sharp page and underline, every carousel card.

**Tokens.** `on-image-ring` (#0b0806 at 62 %) and `on-image-ring-soft` (#0b0806 at 45 %) are added; `on-image-shadow` is kept for older references and no longer used by text on the image.

**Checks** (tests first):

1. Every outermost text block on the image carries the ring filter with the r of its outline (a table test over the card types of 1.4.0 to 1.8.0).
2. No text on the image keeps a `text-shadow` (map names excepted).
3. On a frame whose picture is pure white (#ffffff), measured as on the boards (the pixels within 0.12 em of the letters, at least 4 px, the lit box left out, 90th percentile, linear luminance): at least 7.5:1 between `on-image-text` and the subtitles' surround (7.9:1 on the board), 6:1 for the band and the source (6.3 and 6.4), 4:1 for the credit in `on-image-muted` (4.2).
4. On a frame whose picture is pure black, outside the letters grown by 4 px and the lit word's box, no pixel differs from its 1.8.0 render by more than 10 levels (of 255) on any channel: the second contour is #0b0806 at 62 % (9 levels at most on the board). Near the letters, the filter's antialiasing may move edge pixels, and on a two-line subtitle the second line's contour darkens the lower edge of the lit box above it, which overlaps that line by about 9 px.
5. The lit word's box has its 2 px edge: the ring 3 to 10 px outside the box, median, reads at least 6:1 against `on-image-accent` on a white picture (6.2:1 on the board).
6. Layout unchanged: every text box of the 1.8.0 acceptance frames at the same place within 0.5 px.
7. Carousel cards: the 89 sample cards pixel-identical, alternative texts included.
8. Acceptance: the Burkina Faso episode's frames compared with `design-system-1.9.0-boards/plein-ecran/` (mode C) at 430 px.

**Boards and prototype.** `Video` group `video-190-*` (Series, « Boards (1.9.0) »), drawn by a scratch copy of `handoff/video-board-full.html` patched for the five treatments (`?legi=A` to `E`, `?mask=1` and `?bare=1` for the measures); the patch, the measure script and the demonstration cards are kept with the design package. Since the acceptance `handoff/video-board-full.html` on this page carries the patch and draws the double outline by default.

## Renderer integration of 1.10.0

**Status: accepted by the operator on 19 October 2026, with the designer's recommendations** (Series, « The closing (1.10.0) », decisions 1 to 9). It comes after 1.9.0 (in `recette` since PR #1800). `social-series.md` already carries the new closing for videos, carousels, captions and bios (PR #1887, PR #1888).

**Cards bundle** (`components/bundle.js`, `bundle.css`):

1. `SIGNATURE_LINE` becomes `['L’importance de', 'connaître nos noms.']` (the closing line) and `INVITATION_LINES` `['Vous pouvez continuer la recherche', 'sur EthniAfrica, lien en profil.']`, both exported (`signatureLine`, `signatureLines`, `invitation`, `invitationLines`, `closingText`). `SIGLINE_Y` stays 760.
2. A closing card draws the line, then the invitation (`.ec-invite`, each line `display: block; white-space: nowrap`, the closing body's style), then the pill. Its `body` is not printed; the layout report warns « Phrase propre de la carte de clôture non imprimée ».
3. The line count check reads the constant (two lines, not three).
4. `altText` ends with `closingText` and no longer reads a closing card's `body`.
5. `version.json`: `signatureLine` « L’importance de connaître nos noms. », `signatureLines`, `invitation`, `invitationLines`; `VERSION` `1.10.0-proposition`. `tools/patch1100.py` (mode `bundle`) is the exact change.

**Series video** (`social/video`):

1. `series-page.mjs`: the closing block draws the line and the invitation from the bundle's constants (never the card's body), then the pill, then « Prochain épisode : … » when there is one. `tools/patch1100.py` (mode `board`) is the board's version.
2. `series.mjs`: the closing card's chunks are the four printed lines, word for word, ' and ’ compared as one letter, spaces normalised (« La fin n'est pas dite mot pour mot » otherwise). The ending input becomes `{ next? }`: `search`, `general` and `pageOnline` are no longer needed; a sequence that still gives them loads with a warning. `searchSentence` and `GENERAL_SENTENCE` are retired; « Prochain épisode » always goes under the pill (the 1.7.0 card of its own is retired).
3. The subtitle band stays empty for the whole ending, as in 1.6.0; the hold is unchanged (the voice's end plus 0.5 s, at least 2.5 s).

**Addendum: small text on the image** (`series-page.mjs`, `series.mjs`):

1. **Busyness.** For each block of small text (the subtitle lines with the lit box, the ending block's four parts, the foot, the ending's credit), the zone is the text's extent grown by 16 px. On the card's first frame, the picture alone, the engine computes the mean of the 9 × 9 px local standard deviation of L* over each zone, then the mean over the card's zones; at 10 or more every small-text zone of the card is calm.
2. **The calm zone**: a copy of the card's picture, with the same placement and zoom, blurred by 9 px, clipped to the zone grown by a further 40 px and masked by two linear gradients (horizontal and vertical, intersected) that fade it over those 40 px; drawn above the picture and under the text, and faded with its card in the 300 ms change. `image.calm: false` on a card turns it off. The manifest lists each calm zone and its measure.
3. **The kicker**: Nunito Sans 800 36/42, outline 5 px (r 3), `margin-bottom: 4px`.
4. **The foot**: source and credit at Nunito Sans 700 26/32, outline 5 px; the credit in `on-image-ink` (on content cards and on the ending). `on-image-muted` stays for the label « NOM EMPLOYÉ », « sur N » and the attribution's role.

**Checks** (tests first):

1. Carousel: the line's top at y 760 within 0.5 px on every closing card; two lines; the invitation's two lines as the constant; no closing card's body printed; nothing overlapping; the alternative text ending with `closingText`.
2. The ten closing cards of the sample change; the 79 others pixel-identical with their 1.9.0 references, alternative texts included.
3. Video: the line's top at y 318, the block inside y 318 to 820 with « Prochain épisode » (728 on the board), the subtitle band empty on every frame of the ending.
4. A closing card whose chunks are not the four lines refuses with the expected text; ' and ’ accepted alike.
5. An ending input with `search` or `general` loads and warns; without `next` the block ends at the pill.
6. Everything accepted before holds: bands, the 300 ms change, the double outline, the signed card before the ending.
7. Calm zones: the Tiébélé opener and ending measure 10 or more and every small-text zone is blurred, each measuring 3.5 or less after; on Bobo-Dioulasso none is; a card with `image.calm: false` has none; nothing outside the zones grown by 40 px changes.
8. The head of a three-line opener still ends at y 700 with the 36 px kicker; the foot with a two-line source and a two-line credit starts at y 1652 or lower in the frame.

**Boards and prototype.** `Video` group `video-1100-*`, `Lecture` group `cloture-1100-*` (Series, « Boards (1.10.0) »), drawn by scratch copies of `components/bundle.js` and `handoff/video-board-full.html` patched as described here; the patch and the demonstration cards are kept with the design package. Since the acceptance `components/bundle.js`, `bundle.css` and `handoff/video-board-full.html` on this page carry the patch, without the board-only switches of the bundle; their renders are pixel-identical to the boards.

## Renderer integration of 1.11.0

**Status: accepted by the operator on 19 October 2026, with the designer's recommendations** (Series, « The animated satellite map (1.11.0-proposition) », decisions 1 to 8). The 500 m Blue Marble mosaic is verified and pinned before a view closer than 1336 km is allowed (decision 1). It builds on `recette` with 1.10.0 and the series idents integrated (PR #1894, PR #1891). It extends the map sequence of 1.5.0; a map card without the new fields renders exactly as in 1.5.0, and no carousel card changes.

**Card data.** The new fields live in the card's `map`, beside the 1.5.0 ones; every `say` names a unit of the card's own chunks (`chunkUnits`), first occurrence, as in 1.5.0. Inks are given per people once for the episode.

```json
"inks": { "mossi": "a", "dioula": "b", "peuls": "c", "songhay": "d" },
"map": {
  "sequence": "bfa-ch2",
  "view": { "lon": -2.2, "lat": 11.6, "radius": 3300 },
  "moves": [{ "say": "cavaliers", "lon": -1.2, "lat": 12.15, "radius": 6600 }],
  "areas": [
    { "file": "bfa-mamprugu.geojson", "name": "Royaume mamprusi", "people": "mossi", "say": "Ghana", "states": [{ "say": "XVe", "to": "context" }] },
    { "file": "bfa-mossi-tenkodogo.geojson", "name": "Tenkodogo", "people": "mossi", "say": "royaumes" }
  ],
  "arrows": [{ "id": "gambaga-tenkodogo", "from": [-0.442, 10.53], "to": [-0.37, 11.6], "people": "mossi", "say": "royaumes", "bend": -0.3, "trace": "XVe" }],
  "drawings": [{ "kind": "cavaliers", "at": [-1.05, 10.08], "say": "cavaliers" }],
  "words": [{ "text": "princesse Yennenga", "at": [1.3, 10.1], "say": "Yennenga", "until": "royaumes" }],
  "places": [{ "name": "Gambaga", "at": [-0.442, 10.53], "say": "Ghana" }],
  "facts": [{ "say": "parlent le mooré", "shows": ["text:mooré"] }, { "say": "des cavaliers", "shows": ["illus:cavaliers"] }]
}
```

`states` is a list of `{ say, to }` with `to` among `lit`, `context`, `ink:<a-d>` and `out`. `foreign: true` on an arrow draws it in cream outside the four inks. A territory without a people gives `ink`. A plan's name change is `"rename": { "from": "Haute-Volta", "to": "Burkina Faso", "dates": "de 1919 à 1984", "say": "nom" }`. The opener of a series video takes `"opening": "globe"`; its first view is its `map.view`.

**Engine** (`social/video`), test first:

1. **`page.mjs`, the globe.** The flat style already draws the orthographic globe with its limb, atmosphere and glow. The opener draws it from frame 0: camera keys at 0 s (subject longitude + 40°, latitude 2°, radius 300), 1.8 s (subject + 7.5°, subject − 3°, radius 430) and 4.4 s (the first view), one monotone cubic per channel through the keys (longitude, latitude, log radius), zero speed at both ends; `plain` on, the grade 0 until 3.4 s and 1 from 4.6 s (`mono` between). The view centre is the map card's (540, 1010). No tilt.
2. **`series-sequence.mjs`, the timeline.** Each event at the start frame of its `say` word, 21 frames after the previous area event if later (1.5.0), except events named by one word, which start together. Durations in frames at 30 fps: area in 21 (`enter`), lit and context 15 (symmetric), ink change 18 (symmetric), out 15 (`leave`); arrow draw `clamp(length ÷ 20, 24, 48)` frames eased (0.4, 0, 0.2, 1), its stroke in over 5 frames, two arrow starts at least 21 frames apart, trace in 15 frames to 45 %; drawing in 12 frames rising 8 px, its label 5 frames later over 9; words in and out 9 frames; a move 48 frames on its `say`, through a monotone cubic like the globe. Moves: two per card at most, 60 frames apart at least, radius ratio 2.5 at most, never while an arrow draws; the slow zoom is off on a card with a move.
3. **`series-map.mjs`, layout and inks.** Inks from `inks` by `people`, a territory's own `ink`, cream for `foreign`; four inks in a sequence at most. The proportion rule on each frame: s the shorter side of the bounding box of the smallest area lit above 0.5; arrow width `clamp(round(s / 14), 5, 10)`, head 3.6 w × 3.2 w; drawing height `clamp(round(1.1 s), 100, 150)`. Placement of words and labels in the map band (y 724 to 1296, x 60 to 1020), 12 px clear of every other text, drawing and arrow head; a word that does not fit near its anchor is refused, never moved under the subtitles. At most eight texts on the map, two of them words.
4. **`series-page.mjs`, drawing.** Area states as Series, « 2. Area states » (fill, hatching, edge, keyline, name opacity interpolated between lit and context; an ink change as two layers cross-fading). Arrows as polylines along the sampled curve, the visible part `[start, start + k × length]` (or around the middle for two heads), the notched head at each tip on its keyline. Drawings from `social/design-system/assets/Illustrations/<kind>.svg`, with the second contour filter (r 3). Words in the four styles of Series, « 6. Words on the map », each with its 1.9.0 second contour. The rename as Series, « 8 », variant B.
5. **Picture phases.** A picture card shorter than 180 frames between two map cards of a video is refused (« Image isolée de moins de 6 s entre deux cartes »).
6. **The silent viewing check.** For every map card, every fact: sample every 3 frames from the first to the last frame of its words; a mark counts from 0.6 opacity, an arrow from half drawn, a text when it contains the given words. Pass at 80 % coverage or more and a first mark at most 21 frames after the first word. The manifest lists `silent` per fact (coverage, delay, pass). A proof warns; the final render refuses a failing fact.
7. **Imagery.** The 1.4.1 scale limit on every frame of every move and of the globe's end. The 500 m mosaic (tiles B1 and C1, 21,600 × 21,600 px each, 86,400 px around the Earth) joins `IMAGERY` with its URL, size and SHA-256 once verified (decision 1); the region texture is then cut from it, and the limit becomes 360 km across. Until then a view closer than 1336 km across is refused, as now.

**Assets.** `assets/Illustrations/`: `or.svg`, `kola.svg`, `eleveurs.svg`, `cavaliers.svg`, `commercants.svg`, `guerres.svg`, `colonne.svg`, `travailleurs.svg`, each a 160 × 132 box (viewBox `0 -12 160 132`), its foot at (80, 112), with a README naming the hand and the rules. Drawn for this proposal by Claude Design; no third-party material.

**Checks** (tests first):

1. Opening: frame 0 shows the whole disc (radius 300 ± 1 around (540, 1010)), the band and the opener's head, no subtitle; the camera passes its three keys; between consecutive frames the radius changes by at most 12 % and the centre by at most 40 px; at 4.4 s the frame equals the first map view's imagery within 2 levels; the first area enters at 4.4 s or later.
2. Area states: on sample frames, the fill, edge width and name opacity of each state as in the table; the four durations; two area events 21 frames apart unless one word.
3. Inks: one ink per people for the episode; four per sequence at most; a `foreign` arrow in cream and not counted.
4. Arrows: the head at the tip from the first frame; the duration from the length; one drawing at a time; three at full strength at most; trace at 45 %.
5. Proportions: arrow width, head and drawing height from s on every frame; a drawing over 150 px or an arrow over 10 px refused.
6. Placement: every text and drawing inside the map band; eight texts and two words at most; no overlap, 12 px clear.
7. Moves: two per card at most, 60 frames apart, ratio 2.5 at most, never during an arrow's draw; the slow zoom off; the scale limit on every frame.
8. Rename: the outline's pixels unchanged across the rename; both names readable at the end (B).
9. Phases: a picture card under 180 frames between two map cards refused with the expected text.
10. The silent viewing check on the Mossi plan of the boards: six facts, all passing; with the « mooré » word removed, the first fact fails.
11. Everything accepted holds: a map card without the new fields is pixel-identical with its 1.5.0 acceptance frames; bands, the 300 ms change, the double outline, the calm zones, the idents.

**Boards and prototype.** `Video` group `video-1110-*` and the animated previews (Series, « Boards (1.11.0) »), drawn by a scratch board renderer (`tools/map111.html` with `scenes.js`, `illus.js` and the episode's map data), not the engine; the silent viewing check is `tools/silent.mjs`. They are kept with the design package, not deposited.

## Renderer integration of 1.12.0

**Status: accepted by the operator on 20 October 2026, with the designer's recommendations and the three drawings as drawn** (Series, « Teaching cards in motion and the parchment card (1.12.0-proposition) », decisions 1 to 8). It builds on `recette` with 1.11.0 integrated (PR #1902). A card without the new fields renders exactly as before, and no carousel card changes.

**Card data.** Every `say` names a unit of the card's own chunks (`chunkUnits`), first occurrence, as in 1.5.0.

```json
{ "ground": "parchment",
  "week": { "people": "Baoulé", "region": "Côte d’Ivoire", "say": "jour",
            "rows": [["lundi", "kissié", "Akissi", "Kouassi"], "…"],
            "highlights": [{ "day": "lundi", "say": "lundi" }] } }
{ "ground": "parchment",
  "formula": { "day": { "html": "vendredi se dit <r>ya</r>", "say": "ya" },
               "lines": [{ "label": "garçon", "states": [
                 { "say": "Kwa", "items": [{ "id": "K", "text": "Kwa" }] },
                 { "say": "jour", "items": [{ "id": "K", "text": "Kwa" }, { "op": "+" }, { "id": "ya", "text": "ya", "day": true }] },
                 { "say": "ya", "move": "join", "items": ["K", "ya"] },
                 { "say": "tombé", "move": "fall", "items": ["K"] },
                 { "say": "Yao", "move": "become", "items": [{ "id": "ya", "text": "Yao", "day": [0, 2] }] } ] }],
               "notes": [{ "html": "on entend encore Kw<r>a</r>o", "say": "Kwao", "hold": 2 }] } }
{ "ground": "parchment",
  "drawings": [{ "kind": "courageux", "name": "Yaw", "quality": "le courageux", "say": "Yaw" }],
  "attribution": { "name": "Kofi Agyekum", "role": "linguiste, université du Ghana", "say": "Agyekum" } }
{ "ground": "parchment", "date": "7 octobre 1964", "dateLabel": "Loi sur le nom", "kicker": "Côte d’Ivoire",
  "quote": { "lines": ["…"], "source": "…", "say": "famille", "marks": [{ "words": "son nom patronymique", "say": "famille" }] },
  "words": [{ "html": "un jour de <r>naissance</r>", "say": "naissance" }] }
```

**Engine** (`social/video`), test first:

1. **The ground** (`series-page.mjs`). A card with `ground: "parchment"` draws the idents' ground under its content: the same CSS values and `grain.png` as `social/series-idents/idents.css` (import them, do not copy them), the grain offset `((f × 73) mod 256 − 128, (f × 151) mod 256 − 128)` and the glow `(60 sin 0.35 t, 50 cos 0.27 t)` from the card's own clock. Its texts take the Parchemin inks without outline or second contour; the subtitle on a parchment card takes `ink` without outline and the lit word an `accent` box in #fffaf0 (question 8). The band and the signature cross-fade between their two inkings during the 300 ms change. Two consecutive parchment cards keep their ground; only the head and content change.
2. **The week table** (`series-page.mjs`, `series.mjs`). One people per card, the columns and types of Series, « 1. The week table ». Entry in frames at 30 fps: people and labels 9 frames with the card; on `say`, rows in a cascade, each 9 frames rising 16 px, 3 frames apart. A highlight on its `say`, 12 frames: the band and the other rows to 40 %; two lit at most. The reading check: the table's characters ÷ 21 must fit in the card's time, otherwise the loader refuses the card (« Tableau trop long pour sa carte : le couper en deux ») and names the split.
3. **The formula** (`series-page.mjs`, `series-sequence.mjs`). Lines are states; each state's layout is measured and centred at x 540; between two states the pieces present in both move from their old to their new place, new ones appear (9 frames, rising 12 px), dropped ones leave or fall. Moves: join 14 frames (the « + » out in 5), fall 15 frames (104 px down, scale 0.55, opacity 0.3, kept), become 9 frames (cross-fade in place). Two moves of one line at least 21 frames apart. A static formula (carousel) keeps 1.8.0.
4. **Drawings** from `social/design-system/assets/Illustrations/<kind>.svg` (`courageux.svg`, `agile.svg`, `serviteur.svg` added), at 470 px wide two by two or 560 px alone; entry 12 frames rising 8 px; name 5 frames later, quality 9 frames later or on its own `say`. Refused on a card that is not parchment (« Dessin hors de la carte parchemin »), except map cards (1.11.0).
5. **The parchment text card:** the dated head of 1.7.0 in Parchemin inks, the date growing from 0.94 to 1 in 15 frames; quotation lines 9 frames, 8 frames apart; underlines drawn left to right in 12 frames; free words 12 frames rising 12 px; three blocks at most under the head.
6. **Phases.** A run of parchment cards is a picture phase: at least 180 frames (1.11.0).

**Assets.** `assets/Illustrations/courageux.svg`, `agile.svg` and `serviteur.svg`, with the README updated; drawn by Claude Design, no third-party material. The grain stays in `social/series-idents/assets/grain.png`.

**Checks** (tests first):

1. Parchment ground: the grain and the glow at the given offsets on sample frames; no outline on any text of a parchment card; band and signature at their 1.4.0 places in Parchemin inks; consecutive parchment cards keep their ground pixel for pixel away from their text.
2. Week table: girl | day | boy, one people; the cascade's timing; at most two lit rows, the others at 40 %; every row between y 590 and 1262 with a one-line title; the refusal of a table too long for its card.
3. Formula: each move starts on its word and lasts its frames; the joined pieces touch (gap 0) and stay centred; a fallen part ends 104 px lower at 55 % and 30 %; nothing outside x 60 to 1020; the last state holds.
4. Drawings: on parchment only; no text overlaps a drawing; the attribution box ends at y 1296.
5. Text card: three blocks at most; the underlines under their words within 2 px; everything inside the head's bottom and y 1300.
6. Subtitles on parchment in `ink`, no outline; on every other card unchanged.
7. Everything accepted holds: a card without `ground` is pixel-identical with its 1.11.0 render; the carousel's 89 cards unchanged.

**Boards and prototype.** `Video` group `video-1120-*` and the previews (Series, « Boards (1.12.0) »), drawn by a scratch board renderer (`tools/card112.html` with `cards112.js` and `illus.js`), not the engine; kept with the design package, not deposited.

## Required assets

- Fonts: `fonts/Anton-Regular.ttf`, `fonts/NunitoSans.ttf`, `fonts/NotoSans-Variable.ttf`, `fonts/Fraunces.ttf`, `fonts/NotoSansEthiopic-Bold.ttf`, all under the SIL Open Font License 1.1.
- Illustrations (1.11.0-proposition, accepted): `assets/Illustrations/*.svg`, the eight drawings of series 1, drawn by Claude Design.
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
2. **Closing slogan.** « Notre objectif : raconter l'origine des noms, avec des sources. » comes from the fetishism carousel. Keep it on every closing card, or write one per publication. _Answered by 1.6.0-proposition, accepted on 15 October 2026: the signature line takes its place and the slogan is retired._
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

## Commissioned on 15 October 2026 (1.6.0)

- The operator's decision of 15 October 2026: the signature line « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. » ends every reel and every carousel, word for word, after the series' fixed closing, with the same look in the same place every time, and with no panel, veil or band to carry it.
- Brief: `proposals/1.6.0-proposition/claude-design-brief.md` on `recette` (first numbered 1.5.0, renumbered on 15 October 2026 by PR #1776).
- Proposed and accepted on 15 October 2026, with the designer's recommendations on the four questions.

## Commissioned on 15 October 2026 (1.7.0)

- The long series video with chapters, one brief in place of three drafts (« Afrique », series 6 episode 1; « Kouassi et Yao », series 3 episode 1; « tribu », series 4 episode 1). « Afrique » is the main test case; its result is needed by 18 October.
- Settled by the operator: length follows the argument; chapters are required in long videos; a reminder of the hook between 1 min 15 and 2 min; each video carries part of the signed position; nothing darkens the image. Reading limit 21 characters a second.
- Brief: `proposals/1.7.0-proposition/claude-design-brief.md` (draft PR #1781). The document card and the teaching cards are 1.8.0.
- Proposed and accepted on 15 October 2026, with the designer's recommendations on the five questions.

## Commissioned on 15 October 2026 (1.8.0)

- The document card for « tribu » (series 4, episode 1, slot 27 October, needed by about 22 October), and the name-making formula, the side-by-side forms and the week table for « Kouassi et Yao » (series 3, episode 1).
- Settled: the image fills the frame, only text sits on it, nothing is fitted to the networks' interface, nothing darkens the image; any departure is shown with its variant and left to the operator.
- Brief: `proposals/1.8.0-proposition/claude-design-brief.md` (draft PR #1781).
- Proposed and accepted on 15 October 2026, with the designer's recommendations on the five questions.

## Commissioned on 16 October 2026 (1.9.0)

- From the Burkina Faso episode (series 1, episode 19), relayed by the coordinator: the cream text on the image reads only by its dark outline, and the operator finds it hard to read on light or busy pictures. Propose, without reopening the full screen without shadow zones decided on 14 October 2026, a legibility treatment of the text itself (a wider or double outline, a tight drop shadow, or a veil limited to each line's box), measured on the lightest and darkest pictures, with its effect on the subtitles and the lit word, the series band and the foot; recommend one. Also check the 1.8.0 document card under it. Not blocking any episode.
- Proposed and accepted on 16 October 2026, with the designer's recommendations on the two questions.

## Commissioned on 19 October 2026 (1.10.0)

- From the operator's decision of 19 October 2026 on the Burkina Faso episode (series 1, episode 19): every series video and every carousel ends with « L'importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. », printed, and spoken in the video, in place of the signature line and the invitation. Seven questions to the designer (the line, the invitation, the pill, the next episode, the voice and the subtitles, what remains of the signature line, the carousel closing card) and boards of the Burkina Faso ending, a light photograph, the signed card then the ending, an ending without a next episode, and the carousel closing cards of series 1, series 6 and outside a series in Nuit and Parchemin, at 430 px.
- Addendum the same day: busy pictures, the kicker and the credit (brief, questions 8 to 10).
- Proposed and accepted on 19 October 2026, with the designer's recommendations on the nine questions.

## Commissioned on 19 October 2026 (1.11.0)

- From the operator's review of the animatic of the long Burkina Faso episode (series 1, episode 19, version 3): the map carries the video, understood without sound; satellite, not a flat printed map; an opening globe; drawn illustrations; closer views and true proportions; maps when the text situates, pictures when it does not. Ten questions (the opening globe, area states, route arrows, illustrations, proportions, words on the map, camera moves inside a card, a name that changes, map and picture phases, the silent viewing check) and boards of the opening, the Dioula, the Mossi, 1932 and 1947, 1984 and each illustration at 430 px. It replaces question 11 of the 1.10.0 brief.
- Proposed and accepted on 19 October 2026, with the designer's recommendations on the eight questions.

## Commissioned on 20 October 2026 (1.12.0)

- From the operator's review of the narration v8 of « Kouassi et Yao » (series 3, episode 1): the week table girl | day | boy, one people per table, animated; the name formulas animated more visibly; drawings in the series' hand for what a name says; a parchment card with motion-design text for a passage with nothing to show but words. Six questions and boards at 1080 × 1920 with the 3:4 grid crop and the timings.
- Proposed and accepted on 20 October 2026, with the designer's recommendations on the eight questions and the three drawings as drawn.

## Renderer integration of 1.13.0

**Status: accepted by the operator on 21 October 2026, with the designer's recommendations** (Series, « Motion and sound (1.13.0-proposition) », « Decided by the operator on 21 October 2026 »). Integrated in the engine on 21 October 2026 (`social/video`; evidence in `proposals/1.13.0-proposition/`). It builds on `recette` with 1.12.0 integrated (PR #1922). A piece without the new fields renders exactly as before, except for the motion tokens, the pop and the continuous push, which apply to every series video once accepted (steps 1 to 3).

**Piece data.** Every `say` names a unit of the card's own chunks (`chunkUnits`), first occurrence, as in 1.5.0; the engine places the motion and its cue on that word's frame.

```json
{ "subject": { "id": "BFA", "ink": "a", "view": { "lon": -1.57, "lat": 12.25, "r": 4865 },
               "formula": "Burkina Faso · épisode {n}", "episode": 2 },
  "tier": "short | medium | long",
  "recap": { "map": "<the previous episode's last map card>", "title": "La Haute-Volta devient le Burkina Faso",
             "marks": ["area:haute-volta-1919", "text:HAUTE-VOLTA", "text:BURKINA FASO"], "chunks": ["…"] } }
{ "type": "map", "era": { "date": 1970, "label": "République de Haute-Volta", "say": "1970" },
  "flags": [{ "area": "country:BFA", "flag": "hv", "from": "1959-12-09", "to": "1984-08-04", "say": "noir" }],
  "marks": [{ "kind": "river", "path": "niger", "say": "Niger" },
            { "kind": "route", "via": ["bamako", "sikasso", "kong", "bobo", "ouaga"], "say": "Binger" },
            { "kind": "circle", "at": "ouaga", "say": "Ouagadougou" },
            { "kind": "cross", "at": "kong", "say": "détruite" },
            { "kind": "pin", "at": "paris", "say": "Paris" },
            { "kind": "exchange", "between": ["ouaga", "salaga"], "say": "Salaga" }],
  "headline": { "lines": ["Un nom choisi", "en [[1984]]"], "say": "choisi", "until": "révolution" },
  "whip": { "to": { "lon": 2.35, "lat": 48.86, "r": 3200 }, "say": "Paris" } }
{ "type": "word", "ground": "parchment", "word": "Burkina Faso",
  "parts": [{ "text": "Burkina", "lang": "mooré", "sense": "l’intégrité", "say": "Burkina" },
            { "text": "Faso", "lang": "dioula", "sense": "la patrie", "say": "Faso" }],
  "join": { "base": "Burkina", "add": "bè", "lang": "fulfulde", "sense": "les gens de", "say": "bè" },
  "forms": [{ "text": "Burkinabé", "kind": "variante", "say": "Burkinabé" }],
  "stamp": { "date": "4 août 1984", "label": "premier emploi officiel", "say": "1984" } }
```

**Engine** (`social/video`), test first:

1. **Motion tokens** (`series-motion.mjs`, new, imported by `series-page.mjs`, `series-map.mjs` and `series-teaching.mjs`): the five curves and the lengths of Series, « 1. Motion tokens », in frames at 30 fps (`micro` 5, `pop` 9, `exit` 6, `stamp` 5, `change` 9, `band` 12 in and 8 out, `flash` 15, `whip` 21, `swell` 21, `move` 48). Every existing ease in the series modules is replaced by its token; 1.11.0's and 1.12.0's lengths are unchanged.
2. **The pop and the swell** (`series-map.mjs`, `series-teaching.mjs`): names, words, labels, pins, tags and forms enter by the pop (70 → 106 → 100 %, 110 % under 60 px, from their anchor) and leave by the exit; areas by the swell (fill to 135 % at 55 %, then to their level). The head, the band, the subtitles, the foot and the signature keep 1.4.0's change.
3. **The continuous push** (`series-map.mjs`, `series-page.mjs`): the globe's radius times 1.06 every 10 s from the card's first frame, multiplied with any camera move; a card is framed at the limit divided by its push, and the loader refuses a card whose push would pass the 1.5 enlargement limit (« Poussée au-delà de la limite de l'imagerie : cadrer plus large »). Parchment cards push their content 3 % every 10 s around (540, 1000). Picture phases push 6 % every 10 s within their picture's enlargement limit (question 3).
4. **The whip zoom** (`series-map.mjs`): `whip` on a map card builds one camera path (out to radius 900 in 7 frames, across in 7, in in 7), zero speed at both ends; the frame is blurred by averaged copies following the camera's speed on screen (radial up to 35 %, directional up to 160 px); marks leave 6 frames before; refused between two views less than 2,000 km apart (« Lancer rapide entre deux lieux proches : un mouvement de caméra suffit ») and within 120 frames of another.
5. **The flash and the era map** (`series-map.mjs`, `page.mjs`): `era` on a map card starts the flash on its `say` (15 frames, peak 92 % at frame 4), switches the shader's `paper` uniform from 0 to 1 between frames 3 and 9 and the inks at frame 4. The paper treatment is in the satellite shader (Series, « 5. The era map »: map-land, its relief and olive, map-water), the coast's three lines and its line drawn from the shoreline data (`shoreline.mjs`), the paper texture an asset (`assets/Paper/paper.png`, 512 px, tiled). No modern border is drawn on an era card. A card without `era` is today, on the satellite.
6. **The date counter** (`series-page.mjs`): with `era`, the counter rolls from the previous card's date (or today) to `era.date` on `ease-land` in 36, 48 or 60 frames, odometer digits 0.5 em wide, the 4 % settle in 6 frames, the label 9 frames after landing; it replaces the head's kicker and title on that card.
7. **Drawn marks** (`series-map.mjs`): `river`, `route`, `circle`, `cross`, `pin`, `exchange` with the widths, inks and speeds of Series, « 7. Drawn marks », all scaled from the arrow width W of 1.11.0; at most three on screen besides areas and arrows (« Trop de traits à la fois »); a circle on an area or a cross on a people is refused. River paths come from a pinned data file (`data/rivers/*.geojson`, Natural Earth, public domain).
8. **Flags** (`series-map.mjs`, flag drawings in `assets/Flags/<id>.svg`): a flag needs `from` and `to` (or none) bracketing the card's date, an area of kind `state`, and its state's name among the card's words; otherwise the loader refuses it (« Drapeau hors de la période de l'État » / « Drapeau sur une aire qui n'est pas un État »). Clipped to the area, 86 % (73 % on paper), the wave and shading of the boards; unrolls in 18 frames, rolls back in 12. Under a rolling counter, a flag starts rolling back 12 frames before the counter shows the end of its period and the next unrolls on the frame it shows its start; a period crossed in less than 30 frames shows no flag.
9. **The headline band** (`series-page.mjs`): two lines at most, 18 characters each, every word among the voice's words of the chunks from `say` to `until`; two bands a video at most (« Bandeau de titre : deux par vidéo »); never on a card with a counter. The head fades out in 5 frames before it and back after it; the lines slide with a horizontal blur from their speed; the key word stamps once its line lands.
10. **Format tiers** (`series.mjs`): `tier` sets the targets of Series, « 10. Format tiers »; the plan's report gives every change's frame, the median gap and the longest gap (picture phases and chapter cards left out), and warns past the tier's longest gap (`warnings`, as 1.4.0's length). Strong transitions and bands past the tier's counts are refused.
11. **Subject key and recap** (`series.mjs`, `series-page.mjs`, new `social/series/subjects/<id>.json`): the subject's ink and base view override the piece's; the kicker formula is composed by the engine; the band never carries the episode. `recap` inserts the recap card after the intro ident: the given map card at saturation 0.3, its marks popping 18 frames apart, 180 frames at most (120 on a short).
12. **Word cards** (`series-teaching.mjs`): the word, its parts lifting apart, tags and senses popping in, the join (1.12.0), forms as pills, the stamp (from 140 % in 5 frames). The parchment's run of word cards is checked against the tier (20 s or 30 s alone).
13. **The sound** (`render.mjs` `audioArgs`, new `social/video/mix.mjs`): the plan lists every cue with its family, frame and level (Series, « 13. Sound cues »); `mix.mjs` builds one FFmpeg filter graph: the voice; the cues (`social/sound/cues/<family>/*.wav`, the operator's files) delayed to their frames with their gains; the series' bed (`social/sound/beds/<series>.wav`) looped and ducked under the voice by `sidechaincompress` to 17 dB under it; then `loudnorm` in two passes to −16 LUFS integrated, −1 dBTP, LRA 8. The manifest records the measured loudness and true peak. Without cue or bed files the engine muxes the voice alone, as today.

**Assets.** `assets/Paper/paper.png` (generated by Claude Design, no third-party material); `assets/Flags/bfa.svg` and `hv.svg` (drawn from the flags' official descriptions); the cues and beds are the operator's.

**Checks** (tests first):

1. Tokens: every move of the series modules resolves to a token; the lengths of 1.11.0 and 1.12.0 unchanged.
2. Pop: the scale at frames 0, 5 and 9 is 70, 106 and 100 % (110 % for a mark under 60 px), from its anchor; an exit ends at 92 % and 0.
3. Push: the radius at frame f is r × 1.06^(f / 300); never past the limit; band, head, subtitles and foot pixel-identical between frames of a card away from their changes.
4. Whip: 21 frames; zero speed at both ends; no mark drawn during it; refused under 2,000 km.
5. Flash: one per 60 frames at most; the luminance pair counted by a flash detector (WCAG 2.3.1: never three in a second); the paper switch inside its frames 3 to 9.
6. Era map: no modern border on an era card; Parchemin inks for every text; the coast lines on the sea side only.
7. Counter: the digits never shift horizontally; the landing frame shows the target year; one tick per displayed year, 25 a second at most.
8. Marks: widths from W; three at most; the refused cases.
9. Flags: the refused cases (a people, a colony, a date out of period); the wave's amplitude at the hoist and the fly.
10. Headline band: two at most; its words among the voice's; never with a counter.
11. Tiers: the report's gaps on the boards' plans; the warnings and refusals.
12. Recap: 180 frames at most; saturation 0.3; marks 18 frames apart.
13. Sound: the cue frames; the bed 17 ± 1 dB under the voice in speech (short-term loudness); the final mix −16 ± 0.5 LUFS and true peak ≤ −1 dBTP; the video identical without its audio track.
14. Everything accepted holds: the carousels unchanged; a piece without the new fields differs from its 1.12.0 render only by the push and the pop.

**Boards and prototype.** `Video` group `video-1130-*` and the seven previews (Series, « Boards (1.13.0) »), drawn by a scratch board renderer (`tools/motion113.html` with `scenes113.js`, `illus.js`) and the cue synthesizer (`tools/cues113.py`), not the engine; kept with the design package, not deposited.

## Renderer integration of 1.14.0

**Status: accepted by the operator on 21 October 2026, with the designer's recommendations** (Series, « Figures and facts drawn on the map (1.14.0-proposition) », « Decided by the operator on 21 October 2026 »). Integrated in the engine on 21 October 2026 (`social/video`, `series-figures.mjs`; evidence in `proposals/1.14.0-proposition/integration-2026-10-21/`). It builds on `recette` with 1.13.0 integrated (PR #1935) and the sound palette (PR #1936).

**Card data.** Every `say` names a unit of the card's own chunks (`chunkUnits`), first occurrence, as in 1.5.0; every drawing starts on that word's frame.

```json
{ "type": "map",
  "figures": [
    { "count": "cascade:etats", "unit": "pays", "say": "54", "until": "milliard" },
    { "count": "units:habitants", "per": 100000000, "format": "population", "unit": "d’habitants", "say": "milliard" },
    { "text": "1 sur 5", "unit": "dans le monde", "say": "personne", "until": "moitié" },
    { "pre": "plus de", "count": "units:langues", "per": 100, "unit": "langues", "say": "plus" } ],
  "cascade": { "id": "etats", "states": "afr-etats-onu.json", "order": "west-east", "say": "54", "context": "milliard" },
  "units": [
    { "id": "habitants", "kind": "person", "value": 1500000000, "per": 100000000, "byRegion": "afr-population-regions.json", "say": "milliard", "dim": "près", "out": "moitié",
      "key": "1 personnage = 100 millions d’habitants" },
    { "id": "langues", "kind": "bubble", "value": 2000, "per": 100, "byRegion": "afr-langues-regions.json", "say": "plus", "key": "1 bulle = 100 langues" } ],
  "row": { "id": "un-sur-cinq", "of": 5, "lit": 2, "say": "personne", "light": "cinq", "out": "moitié" },
  "gauges": [
    { "id": "age-afrique", "shape": "africa", "value": 20, "scale": 60, "label": "20 ans", "name": "Afrique", "say": "moitié", "out": "Et" },
    { "id": "age-monde", "shape": "world", "value": 31, "scale": 60, "label": "31 ans", "name": "monde", "say": "monde", "out": "Et" } ] }
{ "type": "map",
  "pins": [{ "id": "berbere", "name": "berbère", "at": [6.5, 35.3], "to": "carthage", "say": "berbère", "dim": "Et" }],
  "letterings": [{ "text": "AFRICA", "from": [6.5, 39.4], "to": [14.5, 39.4], "bend": 0.04, "say": "l'origine" }],
  "stamps": [{ "id": "inconnue", "text": "?", "at": [17.2, 42.6], "say": "inconnue" }] }
{ "type": "map",
  "frame": { "id": "cadre", "at": "continent", "say": "montrent", "fill": { "text": "AFRIQUE", "along": "arrow:dehors", "say": "étendu" } },
  "travel": [{ "id": "livre", "drawing": "livre", "from": "fes", "via": [[3, 39.5]], "to": "italie", "say": "description", "move": "longtemps" }] }
```

**Engine** (`social/video`), test first:

1. **The figure head** (`series-page.mjs`): `figures` draw in the head's place, the number Anton 176/156 in `on-image-accent`, the unit Nunito Sans 800 44/52 in `on-image-ink`, `pre` in 800 36/42; a counted figure shows the count of its drawings on screen times `per` (`population` format: « 100 millions » … « 1 milliard », « 1,5 milliard »; integers grouped with a narrow no-break space); the card's kicker and title step aside (5 frames) while a figure shows; figures change by 1.4.0's head change. The last count must equal the spoken figure, or the loader refuses the card (« Le décompte ne tombe pas sur le chiffre dit »).
2. **The cascade** (`series-map.mjs`): the listed states, ordered by centroid longitude, each with 1.13.0's swell, spread over 45 frames; at `context` they go to the context fill (40 %); territories of the continent outside the list keep a dashed outline. Ticks per state (25 a second at most), an impact when the count lands.
3. **Units** (`series-map.mjs`, drawings from `assets/Illustrations/personne-1.svg` to `personne-6.svg` and `bulle.svg`): `value / per` units, a whole number or the card is refused (« Unité qui ne divise pas le chiffre »); placed by region from `byRegion` (largest remainder, units spread inside each region's land by a fixed seed), or, without it, in a row in the map band; persons 92 px tall, 3 frames apart (bubbles 40 px, 1.5 frames apart), each by the pop from its feet (110 %); `dim` to 35 %, `out` with `ease-exit`. The unit key goes into the foot with its drawing at 22 × 44 px.
4. **The row** (`series-map.mjs`): `of` figures 118 px tall, 116 px apart, feet at y 1240, muted wash; `lit` takes its colours and an accent ring on `light` (9 frames).
5. **Gauges** (`series-map.mjs`): a glass in the map band (Africa's silhouette from the continent outline, or a globe), its age scale on the left (0, 20, 40, 60), the fill to `value / scale` with `ease-land` in 36 frames from `say`, the label on the waterline inside the glass (Anton 72), the name under it; the glass body opaque (#1b1510) so no border shows through.
6. **Pins and letterings** (`series-map.mjs`): a pin is a name popped at its point with a teal arrow (1.11.0 arrow, ink `b`) drawn to `to`; a lettering is set along a quadratic between `from` and `to`, Fraunces 700, tracked 0.26 em, 50 to 64 px, cream with an 11 px dark outline, letter by letter 2 frames apart; `dim` to 35 %.
7. **Stamps** (`series-page.mjs` over the map): two words at most, cream paper with the double rule in `stamp-ink`, from 140 % in 5 frames, an impact; refused when its words are not among the voice's words of its chunk (« Tampon hors de la narration »), except « ? » on a chunk that says « inconnu » or « inconnue ».
8. **The frame and travel** (`series-map.mjs`): the cartouche drawn in 27 frames over `at`, its dashed baseline breathing until filled; a travelling word or drawing moves along its path or arrow with `ease-move` from 55 % to 100 %; a travelling drawing leaves a dotted trail (1.13.0 dots).
9. **Words on the map** (`series.mjs`): the free phrase kind is retired; a map word is `name`, `date` or `century`. A map word with more than four words, a colon or a verb the loader can detect is refused (« Phrase sur la carte : la dessiner, ou la mettre dans le bandeau »).
10. **The silent viewing check** (`series.mjs`): the new marks of Series, « 13. The silent viewing check, extended », with the times they count from.

**Assets.** `assets/Illustrations/personne-1.svg` to `personne-6.svg`, `bulle.svg`, `livre.svg`, with the README updated; drawn by Claude Design in 1.11.0's hand, no third-party material. Region breakdowns are data of each episode (`map-data/`), with their sources.

**Checks** (tests first):

1. Figure head: the number on screen equals the count of drawings times `per` on sampled frames; the last count equals the spoken figure; never with the card's title.
2. Cascade: 54 states lit in 45 frames, west to east; the uncounted territories dashed and unnamed.
3. Units: 15 persons for 1.5 billion at 100 million; each region's units on its land; the refusals; the foot key present while they show.
4. Row: five figures, one lit on its word.
5. Gauges: the fill heights at 20/60 and 31/60 of the glass; the label on the waterline; nothing of the map through the glass.
6. Letterings: every letter on its path (no clipping), inside the map band.
7. Stamps: two words at most, the refusals.
8. Words on the map: no phrase on any map of the episode « Afrique »; eight texts at most.
9. The silent viewing check passes every fact of the five cards, as measured on the boards.
10. Everything accepted holds: a card without the new fields renders as in 1.13.0; the carousel's 89 cards unchanged.

**Boards and prototype.** `Video` group `video-1140-*` and the five previews (Series, « Boards (1.14.0) »), drawn by a scratch board renderer (`tools/motion114.html` with `scenes114.js`, `illus114.js`) and mixed by `tools/mix114.py` from the episode's voice and the operator's palette, not the engine; kept with the design package, not deposited.
