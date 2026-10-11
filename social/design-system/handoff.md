# Handoff to production

## Acceptance and integration status

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
- `fonts/`: the five font files to bundle with the renderer (licences in `licences/`).
- `handoff/harness.html`: a rendering bench (`?id=seq-3&width=1080&diagnose=1`) that exposes `window.__reports` and sets `document.body.dataset.ready = "1"` when done. Serve the project folder over HTTP; browsers refuse `fetch` on `file://`.
- `handoff/cards.sample.json`: every example card, in the card format below. `handoff/assets.json` maps asset names to stored files with their size, credit, licence and source page.

The pilot's `render.mjs` (Playwright, HTML to PNG) can drive the harness unchanged in principle: open the page, wait for `ready`, screenshot `.ec-card` at device scale 1.

## Card format

One JSON object per card. Every text field accepts `*mot*` for the accent word; French spacing before « ; : ! ? » and inside guillemets is added by the engine.

| Field             | Type                                                                                                                                           | Used by                                                        | Notes                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | string                                                                                                                                         | all                                                            | stable identifier, also the reference image name                                                                                                               |
| `type`            | `opener`, `explanation`, `document`, `dated`, `map`, `closing`                                                                                 | all                                                            |                                                                                                                                                                |
| `theme`           | `nuit` (default), `parchemin`                                                                                                                  | all                                                            | one theme per carousel                                                                                                                                         |
| `folio`           | string                                                                                                                                         | all                                                            | « 03/08 »                                                                                                                                                      |
| `kicker`          | string                                                                                                                                         | all                                                            | accent, no forced capitals                                                                                                                                     |
| `title`           | string                                                                                                                                         | all but dated                                                  | one `*accent*` word, or `{area-a:words}` on a map card                                                                                                         |
| `body`            | string or array of paragraphs                                                                                                                  | explanation, document, closing; one sentence on an origin card | none on opener and map cards                                                                                                                                   |
| `density`         | `dense`, `normal`                                                                                                                              | all                                                            | omit to let the engine decide                                                                                                                                  |
| `forms`           | `{layout: "table", rows: [[term, gloss]…]}` or `{layout: "pair", searchedLabel, searched, selfLabel, self}`                                    | explanation                                                    | up to 4 rows                                                                                                                                                   |
| `note`            | string                                                                                                                                         | explanation                                                    | sentence after the forms table                                                                                                                                 |
| `quote`           | `{original, lang, translation, translationLabel, attribution}`                                                                                 | explanation, document                                          | exact text only in `original`                                                                                                                                  |
| `status`          | kind or `{kind, label, band}`                                                                                                                  | all                                                            | kinds listed under Status marks                                                                                                                                |
| `date`            | `{display, kind, marker, name, designated, usedBy, usedByLabel, branches}`                                                                     | dated                                                          | `kind`: `year`, `exact`, `period`, `approx`, `unknown`; the marker names the kicker, and draws a mark only for `origine`, `contexte`, `hypothese`, `incertain` |
| `recap`           | `[{date, name, kind}…]`                                                                                                                        | closing                                                        | recap timeline of a dated sequence, today on the left, up to 5 steps                                                                                           |
| `veil`            | `strong`                                                                                                                                       | all with an image                                              | 96 % veil over printed pages and manuscripts                                                                                                                   |
| `date.branches`   | `[{label, name, designated, usedBy}, …]`                                                                                                       | dated                                                          | concurrent forms, two columns                                                                                                                                  |
| `image`           | `{src, w, h, focus: [x, y], anchor: [x, y], zoom}`                                                                                             | all but map                                                    | `w`, `h` are the file's pixel size; keep them for determinism                                                                                                  |
| `insets`          | `[{src, x, y, width, label}…]`                                                                                                                 | document                                                       | card pixels, inside the image window, up to 2                                                                                                                  |
| `map`             | `{dataRef or data, view, borders, areas, highlight, choropleth, callout, inset, labels, labelOffsets, places, legend, caption, countryLabels}` | map                                                            | see Maps                                                                                                                                                       |
| `cta`             | `{domain, text}`                                                                                                                               | closing                                                        |                                                                                                                                                                |
| `source`          | string                                                                                                                                         | all                                                            | short form; full reference in the package                                                                                                                      |
| `credit`          | string                                                                                                                                         | all with an image                                              |                                                                                                                                                                |
| `imageAlt`, `alt` | string                                                                                                                                         | all                                                            | `alt` overrides the composed alternative text                                                                                                                  |
| `demo`            | string                                                                                                                                         | maquettes                                                      | yellow tape; forbidden on a final export                                                                                                                       |
| `provenance`      | string                                                                                                                                         | maquettes                                                      | where the text comes from; not rendered                                                                                                                        |

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

## Required assets

- Fonts: `fonts/Anton-Regular.ttf`, `fonts/NunitoSans.ttf`, `fonts/NotoSans-Variable.ttf`, `fonts/Fraunces.ttf`, `fonts/NotoSansEthiopic-Bold.ttf`, all under the SIL Open Font License 1.1.
- Logo: `Logo/ethniafrica-logo.png` (512 px PNG, from `social/brand/`).
- Base maps: `assets/Cartes/grands-lacs.json` for the examples; one file per region, built the same way from Natural Earth.
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
