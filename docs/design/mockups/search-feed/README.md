# The result-page feed mockups — forty boards

The reviewed rendering of the search-result page recomposed as a feed: visual
shelves in the first screen, the approved name answer threaded through them.
The implementation plan is
[`docs/plans/search-result-feed.md`](../../../plans/search-result-feed.md); this
directory is the rendering it is measured against.

Source canvas: <https://claude.ai/artifact/324LZEFsdRcHi2bHUEpu9j>, approved by
the operator on 2026-09-19. It is built on the approved result-page canvas
(`../search/`), whose copy it reuses verbatim.

The reference contract deliberately has three authorities:

- **These forty boards govern pixels**: typography, colour, spacing, density,
  media, theme and geometry at 430 and 1280 px.
- **The generated manifest and the search-result charter govern structure and
  behaviour**: block identity, state, zone, order and the parts of `owed`.
- **Typed application projections and API schemas govern production data**:
  illustrative board copy never becomes a runtime data contract.

When the code and a board disagree visually at a reference width, the board
wins. When board markup disagrees with the generated manifest, the manifest
wins and the board must be regenerated. An agent implementing the page cannot
open a `claude.ai` link, which is why the reviewed boards live here.

## The grid

Ten cases, four variants each: mobile 430 and desktop 1280, day and night.

| Case          | File stem     | What it settles                                                         |
| ------------- | ------------- | ----------------------------------------------------------------------- |
| Mandé         | `Mande`       | The rich case: every tile present                                       |
| Peul          | `Peul`        | A pejorative form, flagged in the first screen                          |
| Fang          | `Fang`        | The ordinary case, searched as « pahouin », no invented label           |
| Bassa         | `Bassa`       | Several entities: « Lequel cherchez-vous ? », one short per people      |
| Ekpeye        | `Ekpeye`      | Almost nothing: an empty short slot, widening announced                 |
| Nigeria       | `Nigeria`     | A country                                                               |
| Lingala       | `Lingala`     | A language, with sources that disagree and a page that says so         |
| Traoré        | `Traore`      | A family name (patronyme)                                               |
| « mandinké »  | `Introuvable` | A typo reaches the nearest forms                                        |
| « kossiwa »   | `Inconnu`     | A name the atlas does not know                                          |

File names follow `../search/`: `<Stem>.dc.html` (mobile, day),
`<Stem>Nuit.dc.html`, `<Stem>Desktop.dc.html`, `<Stem>DesktopNuit.dc.html`.

## Reading a board

The boards are canvas sources (`.dc.html`). A browser ignores `<x-dc>` and the
`text/x-dc` script, and renders the board. Serve the
repository root over HTTP and open, for example,
`/docs/design/mockups/search-feed/Mande.dc.html` — images resolve to
`public/images/` and `posters/` through relative paths. Playwright can also open a
board with `file://` (the parity test does); some browser tooling cannot.

`canvas.json` is the canvas index as the editor saved it. Each board carries a
`rows` guide of 800 px: **the first screen**. It is drawn by the canvas, never in
the markup, and the plan turns it into an assertion.

## Real and illustrative content

| Real — from the corpus or the approved boards                  | Illustrative — replaced by live data               |
| --------------------------------------------------------------- | -------------------------------------------------- |
| Every sentence of the five approved cases                       | Short titles, durations, and the order of shorts   |
| Nigeria, Lingala and Traoré copy (fiches on `recette`)          | Lens counts                                        |
| Anecdotes, proverbs, their images and credit lines              | Quiz questions (written from the page's own facts) |
| The generated image of Mansa Musa and its source                |                                                    |

## Version 2 — the boards are the design system

The boards were redrawn on 2026-09-19 so that every value is what the code
renders at 430 and 1280 px: the type roles evaluated at those widths, the spacing
ramp, the two radii, `SourceStandingBadge`, the page frame measured on the live
page (61 px header, two nested `.afh-shell`), and the fonts `next/font` loads
(Fraunces without the `opsz` axis). Code that uses the plan's classes reproduces
them to the pixel, and the plan's §10.4 compares screenshots of
`[data-feed-root]` on the page and on the board.

`fonts/search-feed.css` binds the exact self-hosted Google Fonts subsets that
the `next/font` configuration requests, including separate Fraunces Roman and
italic files. The boards never depend on a network font response.

Posters are images — `posters/*.jpg`, drawn by `generator/posters.py` in the
production covers' style (Anton, burnt-in title, accent on the name) — because
the page shows the pipeline's cover images, not typeset titles. Every cover
uses the single production question `D’où vient le nom « X » ?`; the shorter
`D’où vient X ?` form is not a valid production title.

## Night boards

Derived from the day boards by `NIGHT` in `generator/gen.py`, which is exactly
what `.dark` binds in `src/styles/tokens/color.css`: ground `#120e0a`, surfaces
`#271e14`, warm `#1d1710`, ink `#f1e7d8`, accent ink `#c9821f`. Accent tints are
not rebound at night, so the verdict box and the invitation button stay light,
with dark words. Never edit a night board by hand.

## The generator

`generator/` holds the script that wrote the boards. It is the most precise
specification of each tile's markup, and the plan cites its functions by name.

`generator/test_build.py` rebuilds the boards, manifest and canvas index in a
clean temporary directory, compares them byte for byte with this directory and
performs a second build with no diff. This is the reproducibility gate: generated
paths, semantic attributes and index metadata all participate in it.

- `gen.py` — the tokens as values (`role`, colours, `NIGHT`), one function per
  tile (`search`, `lenses`, `answer`, `appellations`, `chip`, `shorts`, `poster`,
  `empty_poster`, `origins`, `origin_card`, `tiles`, `people_cards`, `plates`,
  `plate`, `quiz`, `gen_image`, `prose`, `facts`, `fiches`, `band`, `further`),
  and the page (`first_screen`, `feed` with its main column and rail, `owed`,
  `body` with the measured frame).
- `cases.py` — the ten cases as data.
- `build.py` — `draft` writes boards at natural height plus a `measure.html`;
  `final heights.json` fixes heights, derives night boards and writes the index.
  Heights come from a browser render (fonts loaded), rounded up to 10 px.
- `test_build.py` — validates the 10 × 4 matrix, manifest schema, semantic
  markup, local assets and clean deterministic regeneration.
- `posters.py` — draws the posters (needs `social/harness/fonts/Anton-Regular.ttf`);
  `posters.json` maps each to its canvas asset.

The generator writes repository paths directly — posters to
`posters/<slug>.jpg`, the rest as follows:

| Canvas asset                        | Repository file                                         |
| ----------------------------------- | ------------------------------------------------------- |
| `d46771f7a5f711fb62e7190763704fd9`  | `public/images/anecdotes/malinke-manden.jpg`            |
| `ce928a25b3a08248d953eb96e3acb8e0`  | `public/images/anecdotes/bambara-refus.jpg`             |
| `6cba4db21265b84e9c38594963b68ee6`  | `public/images/anecdotes/dioula-metier.jpg`             |
| `d2ca8b498d8f36f94be2a4be489b36bf`  | `public/images/anecdotes/peul-dix-noms.jpg`             |
| `5a77ed543ceb048b285f3259fe99c1db`  | `public/images/anecdotes/fulbe-quatre-noms.jpg`         |
| `3c1d396b8b16d2bc65ab4d0c22d063ce`  | `public/images/anecdotes/fang-reputation.jpg`           |
| `f3e4ac4721ddfdfa9716210e7fef7f63`  | `public/images/anecdotes/bassa-nge-distinction.jpg`     |
| `3b268f4fac6547d55364008d6fcc024a`  | `public/images/discoveries/generated/mansa-musa/4x5.jpg` |
| `bdbd5a6e59d7db22d83a95cd119296d8`  | `public/images/anecdotes/nigeria-flora-shaw.jpg`        |
| `f4b9a88f7a15933ab03f48ee41f9e180`  | `public/images/anecdotes/lingala.jpg`                   |
