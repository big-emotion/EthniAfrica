# Carousel renderer

This adapter exports cards through the accepted [EthniAfrica Cartes system](../design-system/README.md). It does not change that system's components, tokens or fonts. The production coordinator still owns research and the three human approvals. A successful render never authorizes publication.

## Status and roadmap

- [x] Write failing refusal and recovery cases before the adapter.
- [x] Implement local, numbered PNG exports with asset, text, layout and freshness checks.
- [x] Preserve the supplied design files and record every rendering dependency.
- [x] Add a review page, complete rendered-text alternative descriptions and fidelity comparisons.
- [x] Resolve the two reference-image discrepancies by explicit operator decision; all 31 references pass and roadmap step 4 is complete.

The [canonical specification](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/212795394) owns the full roadmap. Research/corpus automation is step 5, publication packaging step 6, and cleanup step 7. They are not implemented by this adapter.

## Commands

Run from the repository root with dependencies installed. Use Node 22 and the bundled Chromium version recorded in `runtime.json`; provision that browser with the project's Playwright installation when needed. No new rendering framework or runtime package is required.

```sh
npm run test:social-renderer
npm run social:render -- render PIECE/cards.json PIECE/proof-v1 --mode=proof --assets=PIECE/assets
npm run social:render -- render PIECE/cards.json PIECE/exports-v1 --assets=PIECE/assets
npm run social:render -- verify PIECE/cards.json PIECE/exports-v1 --assets=PIECE/assets
```

`PIECE` stands for the existing publication workspace; these commands do not create a publication or its checkpoint. With no `--assets`, the adapter uses the supplied design-system asset folder. The JSON envelope contains `version`, `logo` and a nonempty ordered `cards` array, following [the handoff format](../design-system/handoff.md). Card image paths and the logo are relative to the asset directory. Fonts belong to the design system. Copy an asset into the piece's allowed asset folder when necessary; remote URLs and paths outside it are refused.

- **Final** is the default mode: reject any input with a `demo` field, all fit warnings, overflow and incomplete assets. `productionReady` means that mechanical rendering checks passed, not that editorial approval exists.
- **Proof** keeps demo labels visible and leaves `productionReady` false. Layout checks still apply; the operator sees actual text and images before approval 2.
- **Diagnostic** permits invalid layouts and mixed themes for reference fixtures only. It always leaves `productionReady` false. The deliberately overflowing fixture gets its original red border and guide. Do not use diagnostic exports as final media.

The adapter writes `01.png` through `NN.png`, an integrity/fit report and `review.html`. Open the latter locally to review at 320, 375 and 430 px feed widths, then a 600 px tablet feed and a 470 px desktop feed. Feed widths are not device breakpoints: inspect tablet viewports at 768–1199 px and desktop from 1200 px. All actual exports remain 1080 × 1350, sRGB, device scale 1.

## Failures and resumption

Output goes into a new staging directory and becomes visible at the requested destination only after all cards and the report pass verification. An existing output directory is never overwritten. Normal failures clean up staging and release the output lock. After a process/computer crash, a lock or incomplete staging folder may remain: inspect them before removing them, confirm no renderer is running, then retry into a new revision. This avoids overwriting a live run.

`verify` checks the exact input bytes, rendering code, runtime pin, design version, tokens, fonts, selected assets, card count/order, report completeness, alternative text, PNG dimensions, colour space and file hashes. A changed dependency invalidates the old output. Supply the same asset/design roots used for rendering. Store the input, report, rendered images and shared design dependency paths in the coordinator's proof/final review; a hash of `version.json` alone is insufficient.

The browser can access only the files snapshotted for that run. Images must decode with the declared dimensions, fonts must load, and map path data must be SVG geometry. There is no remote page, asset lookup or social-network call during export.

## Text and accessibility

Text fidelity checks compare supplied text with the rendered DOM after accounting for accent markup and French spacing. Inline coloured prefixes remain part of the complete name. This is not OCR or proof that every letter is readable in the PNG; inspect the final images.

The alternative description combines `imageAlt`, displayed map labels/figures, inset labels and the actual panel reading order. It includes quotations, translations, status bands, both branch users and map captions. Standalone source and image-credit lines remain in the report's visible text and in the later publication package. An explicit `alt` overrides the generated description and requires editorial review. Platform length limits and final `post.md` preparation belong to step 6.

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

`REFERENCES` is the operator-supplied folder containing all 31 accepted reference PNGs. `reference-manifest.json` pins their exact hashes. These large files remain outside git as requested by the design handoff. A missing or changed reference fails explicitly; the command never silently creates a new baseline. A fresh checkout/CI runner needs the supplied images before running this check. The unit/refusal suite runs without them.

The comparison checks decoded sRGB pixels. A pixel counts as changed if any colour channel differs by more than 16/255. Ordinary cards require at most 0.7% changed pixels and a mean maximum-channel difference at most 0.4/255. The deliberately dense overflow fixture allows 1.2% and 0.65/255. Both limits apply. These tolerances cover observed text antialiasing on the pinned browser; a widespread small colour shift still fails. They do not establish cross-platform equivalence or replace text and visual checks.

The first complete comparison passed 29 of 31 references. The two exceptions, `map-fula` and `map-fula-parchemin`, have a more widely spaced country list in the supplied reference PNGs than in the supplied 1.1 implementation. On 10 October 2026 the operator explicitly chose to keep the engine. Only these two reference PNGs were updated to its country-list spacing; both original PNGs remain in the local evidence archive, and the manifest records their previous and accepted hashes. A fresh comparison passes all 31 references. No engine code or tolerance changed. This closes roadmap step 4, not the editorial approval of any sample or a complete new-subject production pilot.
