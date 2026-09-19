# The result-page feed mockups — forty boards

The reviewed rendering of the search-result page recomposed as a feed: visual
shelves in the first screen, the approved name answer threaded through them.
The implementation plan is
[`docs/plans/search-result-feed.md`](../../../plans/search-result-feed.md); this
directory is the rendering it is measured against.

Source canvas: <https://claude.ai/artifact/324LZEFsdRcHi2bHUEpu9j>, approved by
the operator on 2026-09-19. It is built on the approved result-page canvas
(`../search/`), whose copy it reuses verbatim.

**When the code and these boards disagree, the boards win**, exactly as for
`../search/`. An agent implementing the page cannot open a `claude.ai` link, which
is why the boards live here.

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

The boards are canvas sources (`.dc.html`). A browser ignores `<x-dc>`, the
`support.js` line and the `text/x-dc` script, and renders the board. Serve the
repository root over HTTP and open, for example,
`/docs/design/mockups/search-feed/Mande.dc.html` — images resolve to
`public/images/` through relative paths. `file://` is blocked by the browsers the
project tests with.

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

## Night boards

Derived from the day boards by the substitution table of
`../search/derive-night.mjs`, plus one pair this feed adds: the selected lens chip
(`background: #2c2018; color: #fbf7f2` → `background: #f1e7d8; color: #120e0a`).
Never edit a night board by hand.

## The generator

`generator/` holds the script that wrote the boards. It is the most precise
specification of each tile's markup, and the plan cites its functions by name.

- `gen.py` — one function per tile (`answer`, `appellations`, `shorts`,
  `origins`, `tiles`, `people_cards`, `plates`, `quiz`, `gen_image`, `prose`,
  `facts`, `fiches`, `band`), the two layouts (`mobile_body`, `desktop_body`) and
  the night substitution (`SWAPS`).
- `cases.py` — the ten cases as data.
- `build.py` — `draft` writes boards at natural height plus a `measure.html`;
  `final heights.json` fixes heights, derives night boards and writes the index.
  Heights come from a browser render (fonts loaded), rounded up to 10 px.

The generator writes canvas image URLs (`/_blob/…`). The copies here were
rewritten to repository paths:

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
