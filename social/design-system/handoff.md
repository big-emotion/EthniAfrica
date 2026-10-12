# Handoff to production

## Acceptance and integration status

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
