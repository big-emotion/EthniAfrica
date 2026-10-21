# Carousel renderer

This adapter exports cards through the accepted [EthniAfrica Cartes system](../design-system/README.md). It does not change that system's components, tokens or fonts. The production coordinator still owns research and the three human approvals. A successful render never authorizes publication.

## Status and roadmap

- [x] Write failing refusal and recovery cases before the adapter.
- [x] Implement local, numbered PNG exports with asset, text, layout and freshness checks.
- [x] Preserve the supplied design files and record every rendering dependency.
- [x] Add a review page, complete rendered-text alternative descriptions and fidelity comparisons.
- [x] Resolve the two reference-image discrepancies by explicit operator decision; all 31 references pass and roadmap step 4 is complete.
- [x] Integrate EthniAfrica Cartes 1.2.0-proposition (historical atlas map, accepted 12 October 2026): dotted borders, refusal of map collisions and out-of-limit atlas spacing, atlas geometry checks, alternative text for keys, territories, marks and the period marker; all 38 references pass.
- [x] Integrate EthniAfrica Cartes 1.3.0-proposition (series band, seven series models, accepted 14 October 2026 with video layout B): series refusals in final and proof modes, the band opening the alternative text, the 828 px series panel in recovery, a refusal of « image à trouver » slots in final mode; all 89 references pass. The series video itself belongs to `social/video`.

The [canonical specification](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/212795394) owns the full roadmap. Research/corpus alignment (step 5) and publication packaging (step 6) are available through the shared production skill; durable publication history and verified cleanup (step 7) are also available. They are separate from this adapter.

## Commands

Run from the repository root with dependencies installed. Use Node 22 and the bundled Chromium version recorded in `runtime.json`; provision that browser with the project's Playwright installation when needed. No new rendering framework or runtime package is required.

```sh
npm run test:social-renderer
npm run social:render -- render PIECE/cards.json PIECE/proof-v1 --mode=proof --assets=PIECE/assets
npm run social:render -- render PIECE/cards.json PIECE/exports-v1 --assets=PIECE/assets
npm run social:render -- verify PIECE/cards.json PIECE/exports-v1 --assets=PIECE/assets
```

`PIECE` stands for the existing publication workspace; these commands do not create a publication or its checkpoint. With no `--assets`, the adapter uses the supplied design-system asset folder. The JSON envelope contains `version`, `logo` and a nonempty ordered `cards` array, following [the handoff format](../design-system/handoff.md). Card image paths and the logo are relative to the asset directory. Fonts belong to the design system. Copy an asset into the piece's allowed asset folder when necessary; remote URLs and paths outside it are refused.

- **Final** is the default mode: reject any input with a `demo` field, an « image à trouver » slot (`a-trouver-*.png`, 1.3.0), all fit warnings, overflow, map collisions (`report.collisions`), atlas spacing outside handoff cases 11 and 14 (`minGap` under 44 px, `maxLeader` over 72 px) and incomplete assets. On a series card (1.3.0) the fit warnings include a panel over 828 px, a band on two lines, map text, markers, keys, callouts or insets within 12 px of the band, and an image focal point outside the window under the band; an unknown series `id` is an engine error in every mode. `productionReady` means that mechanical rendering checks passed, not that editorial approval exists.
- **Proof** keeps demo labels visible and leaves `productionReady` false. Layout checks still apply; the operator sees actual text and images before approval 2.
- **Diagnostic** permits invalid layouts and mixed themes for reference fixtures only. It always leaves `productionReady` false. The deliberately overflowing fixture gets its original red border and guide. Do not use diagnostic exports as final media.

The adapter writes `01.png` through `NN.png`, an integrity/fit report and `review.html`. Open the latter locally to review at 320, 375 and 430 px feed widths, then a 600 px tablet feed and a 470 px desktop feed. Feed widths are not device breakpoints: inspect tablet viewports at 768–1199 px and desktop from 1200 px. All actual exports remain 1080 × 1350, sRGB, device scale 1.

## Failures and resumption

Output goes into a new staging directory and becomes visible at the requested destination only after all cards and the report pass verification. An existing output directory is never overwritten. Normal failures clean up staging and release the output lock. After a process/computer crash, a lock or incomplete staging folder may remain: inspect them before removing them, confirm no renderer is running, then retry into a new revision. This avoids overwriting a live run.

`verify` checks the exact input bytes, rendering code, runtime pin, design version, tokens, fonts, selected assets, card count/order, report completeness, alternative text, PNG dimensions, colour space and file hashes. A changed dependency invalidates the old output. Supply the same asset/design roots used for rendering. Store the input, report, rendered images and shared design dependency paths in the coordinator's proof/final review; a hash of `version.json` alone is insufficient.

The browser can access only the files snapshotted for that run. Images must decode with the declared dimensions, fonts must load, and map path data must be SVG geometry. There is no remote page, asset lookup or social-network call during export.

## Text and accessibility

Text fidelity checks compare supplied text with the rendered DOM after accounting for accent markup and French spacing. Inline coloured prefixes remain part of the complete name. This is not OCR or proof that every letter is readable in the PNG; inspect the final images.

The alternative description opens, on a series card, with the band's words in the design system's wording (« D'où vient le nom de mon pays ?, n° 1 »), then combines `imageAlt`, the design system's own map description (`EthniCards.altText` applied to the map and period marker: regional keys, categories and territories of 1914, independence marks, the period step), displayed map labels/figures without bare marker numbers, inset labels and the actual panel reading order. It includes quotations, translations, status bands, both branch users and map captions. Standalone source and image-credit lines remain in the report's visible text and in the later publication package. An explicit `alt` overrides the generated description and requires editorial review. The [publication-package helper](../../.claude/skills/ethniafrica-social-production/references/publication-package.md) checks recorded account limits and prepares the final `post.md` at step 6.

Do not remove demo flags merely to obtain a final export. The nine-card Uganda sample includes illustrative new wording as well as previously approved text. Design acceptance does not approve its entire narrative for publication. Run
`npm run check:publication -- INPUT_JSON OUTPUT_DIR/report.json` on the actual
publication, then review meaning and final images. The complete diagnostic sample
set intentionally fails that publication gate on technical fixture copy such as
“corpus”; this is recorded, not suppressed or silently rewritten.

## Fidelity baseline

```sh
npm run social:render -- render social/design-system/handoff/cards.sample.json WORK/reference-run --mode=diagnostic
npm run social:check-design -- social/design-system/handoff/cards.sample.json WORK/reference-run REFERENCES WORK/fidelity.json
```

`REFERENCES` is the folder containing all 89 accepted reference PNGs of the current design version (for 1.10.0-proposition, and 1.11.0-proposition, which changes no card: `.local/research/social-production-2026-10-09/design-system-1.10.0-accepted/`; for 1.6.0-proposition, and 1.7.0-proposition, 1.8.0-proposition and 1.9.0-proposition, which change no card: `design-system-1.6.0-accepted/` in the same folder; for 1.3.0 to 1.5.0, which change no card after 1.3.0: `design-system-1.3.0-accepted/` in the same folder). `reference-manifest.json` pins their exact hashes. These large files remain outside git as requested by the design handoff. A missing or changed reference fails explicitly; the command never silently creates a new baseline. A fresh checkout/CI runner needs the supplied images before running this check. The unit/refusal suite runs without them.

The comparison checks decoded sRGB pixels. A pixel counts as changed if any colour channel differs by more than 16/255. Ordinary cards require at most 0.7% changed pixels and a mean maximum-channel difference at most 0.4/255. The deliberately dense overflow fixture allows 1.2% and 0.65/255. Both limits apply. These tolerances cover observed text antialiasing on the pinned browser; a widespread small colour shift still fails. They do not establish cross-platform equivalence or replace text and visual checks.

The first complete comparison passed 29 of 31 references. The two exceptions, `map-fula` and `map-fula-parchemin`, have a more widely spaced country list in the supplied reference PNGs than in the supplied 1.1 implementation. On 10 October 2026 the operator explicitly chose to keep the engine. Only these two reference PNGs were updated to its country-list spacing; both original PNGs remain in the local evidence archive, and the manifest records their previous and accepted hashes. A fresh comparison passes all 31 references. No engine code or tolerance changed. This closes roadmap step 4, not the editorial approval of any sample or a complete new-subject production pilot.

Version 1.2.0-proposition (12 October 2026) adds seven atlas cards and moves one label on three 1.1 cards (`seq-3`, `map-fula-nombre-region`, `map-fula-part`). Rendered on the pinned browser and compared with Claude Design's 38 proposed references, 36 pass; `atlas-1914` (0.746 % changed pixels, mean 0.418) and `atlas-capacite-45` (0.719 %, mean 0.385) exceed the limits through glyph and outline antialiasing only, with identical positions and line breaks. The tolerance was not widened. The accepted set keeps the 28 unchanged 1.1 references (including the two reconciled ones, still byte-identical to the engine's output) and takes the pinned browser's renders for the three re-rendered and seven new cards; the manifest records the previous and accepted hashes of the three, and Claude Design's hashes for the seven. A second complete render passes all 38. Claude Design's own references stay in `design-system-1.2.0-references/` and the 1.1 set in `design-system-references/`, unchanged.

Version 1.3.0-proposition (14 October 2026) adds the series band and 51 series cards: the 49 cards of the seven models and two atlas cards under the band. Before integrating it, Playwright was pinned back to 1.63.0, the build `runtime.json` records: the grouped dependency bump of #1682 had installed 1.64.0 and failed 16 of 21 tests. With 1.63.0 the 38 accepted 1.2.0 references, rendered from the 1.2.0 design system, pass the check (12 pixel-identical, 26 within the limits through glyph-edge antialiasing only, with identical positions and line breaks); the same browser build as their acceptance, so this residue comes from the system's font rasterisation, not from the browser. The 38 cards without a series render byte-identically with the 1.2.0 and 1.3.0 engines, so their references and hashes are unchanged. Compared with Claude Design's 89 proposed references, 87 pass; the two exceptions are the same `atlas-1914` and `atlas-capacite-45` as in 1.2.0, because Claude Design's set reuses its own 1.2.0 images for them. The accepted set copies the 38 accepted 1.2.0 references unchanged and takes the pinned browser's renders for the 51 new cards; the manifest records Claude Design's hash for each of them. A complete render passes all 89. The 1.2.0 sets and Claude Design's 1.3.0 references stay in their own folders, unchanged.

Version 1.6.0-proposition (15 October 2026) puts the signature line on every closing card, its top at y 760, and retires the closing slogan and the motto « L'Afrique à travers ses noms ». The 89 sample cards were rendered in diagnostic mode on the pinned browser and compared with the accepted references. The 79 cards that are not closing cards pass unchanged, so their references and hashes stay. The ten closing cards (`seq-9`, `seq-9-parchemin`, `chr-5` and the seven series closings) change by design. They take the pinned browser's 1.6.0 renders, checked by eye against Claude Design's accepted boards (`design-system-1.6.0-boards/cartes/`), which exist only as JPEG and so cannot be compared pixel for pixel. The manifest records each card's previous hash and an `integration-1.6.0` record. The accepted set is `design-system-1.6.0-accepted/`; a complete render passes all 89. No tolerance changed.

Version 1.10.0-proposition (19 October 2026) replaces the signature line on every closing card by the closing line « L’importance de connaître nos noms. », on two lines with its top still at y 760, and the fixed invitation « Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. », on two lines; a closing card no longer prints its own `body`, and one that still gives it warns, so final and proof modes refuse it. The alternative text ends with the line and the invitation, and `verify` checks the line, the invitation line for line, the absence of overlap and that ending. The 89 sample cards were rendered in diagnostic mode on the pinned browser with the 1.9.0 and the 1.10.0 engines: the 79 cards that are not closing cards are byte-identical, alternative texts included, as Claude Design's own comparison found (`design-system-1.10.0-boards/sample-89-compare.json`), so their references and hashes stay. The ten closing cards change by design. They take the pinned browser's 1.10.0 renders, compared with Claude Design's after boards (`design-system-1.10.0-boards/plein-ecran/cartes/*-n-1080.jpg`), which exist only as JPEG: the same text, lines and places, 0.5 % to 1.3 % of pixels apart by more than 16 levels, from JPEG compression and the boards' older Chromium. The manifest records each card's previous hash and an `integration-1.10.0` record. The accepted set is `design-system-1.10.0-accepted/`; a complete render passes all 89. No tolerance changed.

Version 1.11.0-proposition (19 October 2026) adds the animated satellite map of the series video (`social/video`) and changes no card: its two tokens and its eight drawings are the video's. The 89 sample cards render byte-identical with the 1.10.0 design, alternative texts and visible text included, and pass 89 of 89 against `design-system-1.10.0-accepted/`; only `designVersion` moves (`integration-1.11.0`).

Version 1.13.0-proposition (21 October 2026) adds the motion and the sound of the series video (`social/video`) and changes no card: its token families, colour tokens, paper texture and flags are the video's. Rendered with the 1.12.0 and the 1.13.0 design files, the 89 sample cards are byte-identical, alternative texts included, and pass 89 of 89 against `design-system-1.10.0-accepted/`; only `designVersion` moves (`integration-1.13.0`).
