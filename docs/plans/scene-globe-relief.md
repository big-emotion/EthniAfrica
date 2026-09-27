# Scene engine: relief globe

Operator decision, 2026-09-27, after reviewing the first Bangala proof: the flat vector map
is refused. A map must look like the ones people already know from geography: a terrestrial
globe, zoomed on Africa, with its oceans, the Mediterranean and the neighbouring continents,
in shaded relief, with the rivers drawn. Borders may not be limited to dashes. Zones must be
able to appear animated and with volume. The change is made once, in the engine, and every
later production uses it.

This page is the design. The field contract stays in [`SCENES.md`](../../social/harness/SCENES.md).

## What does not change

- The renderer is Pillow, NumPy and FFmpeg, deterministic frame by frame. No new dependency,
  no browser, no GPU.
- A plan without `projection` renders exactly as before: same pixels, same validation.
- Every feature still carries its evidence, and an uncertain extent is still labelled.
- The charter's cartographic grammar still rules ([`atlas-charter.md`](../design/atlas-charter.md) §1):
  a country receives a closed outline drawn as a stroke; **a people, or the area where a
  name is used, never receives a closed line** (a feathered field); a language family
  receives a dashed derived outline. The new volume applies to countries and to feathered
  fields only, never as a hard wall around a people.

## Decision: an orthographic globe with a raster relief base

| Choice        | Decision                                                                                                                   | Why                                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projection    | Orthographic globe (a sphere seen from far away), optionally tilted                                                        | The eye reads it as "the Earth". Neighbouring continents and seas appear by construction.                                                                                          |
| Base          | A georeferenced equirectangular raster (shaded relief, hypsometric tint, sea floor, drainages), resampled per output pixel | It is the look of a physical map. Reprojection by inverse mapping needs only NumPy.                                                                                                |
| Rivers, lakes | Vector overlays drawn crisp on top of the raster                                                                           | The raster is soft at high zoom; a river must stay a line.                                                                                                                         |
| Borders       | Several styles: `solid`, `soft`, `glow`, `dashed`, `none`                                                                  | Dashes alone read as unfinished.                                                                                                                                                   |
| Volume        | A tilted view plus extruded countries (height in pixels, cast shadow)                                                      | A tilt turns "up" into a screen direction, so a lifted polygon reads as a solid without a 3D engine.                                                                               |
| Camera        | Keyframes on centre, span, tilt and heading, with a named easing                                                           | Continuous with the current camera; a globe is steered by where it looks, not by bounds.                                                                                           |
| Easing        | `smooth`, `cubic`, `spring` (critically damped) and `linear`                                                               | Motion's own spring generator was tried and rejected as a reference: its sampled output oscillates even at bounce 0. The curves are tested against their mathematical definitions. |

Rejected: WebGL or three.js in a headless browser (a second runtime to pin and to keep
deterministic), a 3D terrain mesh (a lot of code for a look the shaded raster already gives),
a Mercator raster (the current look, with the same missing context).

## Plan contract (additive)

`map`:

- `projection`: `"mercator"` (default) or `"globe"`.
- `relief`: id of an asset of kind `relief`. Required for `globe`.
- `rivers`, `lakes`: ids of `geojson` assets of the river-centreline and lake layers. Optional.
- `atmosphere`: boolean, the halo and limb darkening of the globe. Default true for `globe`.
- `border_style`: `solid`, `dashed`, `soft`, `glow`, `none`. `border_width`: number of pixels.
- Camera keyframes: `{at, bounds}` for Mercator; `{at, center:[lon,lat], span, tilt?, heading?, ease?}` for the globe.
  `span` is the number of degrees of longitude the viewport width covers at the centre.

Asset kind `relief`: `path`, `sha256`, `credit`, `license`, `source` and `bounds:[west,south,east,north]`
in degrees, equirectangular.

Feature kinds added: `label` (text at a point, styles `sea` and `place`). Feature fields added on a
`country`: `extrude` (pixels, 0 to 60) and `draw_seconds`, the stroke drawing itself before the fill rises.

## Data

Natural Earth, public domain: `HYP_HR_SR_OB_DR` (1/60 degree, shaded relief, sea floor,
drainages), the 10 m rivers and lakes, the countries. The 700 MB source stays in the private
workshop; `social/tools/relief/build_relief_pack.py` cuts a region pack (JPEG plus its bounds)
that travels with the project's assets.

## Test plan (tests first)

1. **Projection.** The centre projects to the viewport centre; a point on the far side is hidden;
   projection and pixel inversion agree to a fraction of a pixel; a tilt lifts an extruded point upward.
2. **Sampling.** On a synthetic raster whose colours encode longitude and latitude, every sampled pixel
   returns the coordinates it should.
3. **Camera.** Longitude interpolation takes the short way round; span interpolates geometrically;
   each easing starts at 0, ends at 1 and is monotone (except the tested overshoot-free spring).
4. **Contract.** Unknown fields, missing relief, bad bounds, both `bounds` and `center` all fail.
5. **Regression.** The existing scene suites stay green and a Mercator plan is pixel-identical.
6. **Determinism.** The same frame, rendered out of order, is identical.
7. **Real data.** A rendered frame over the real relief pack, inspected at 360 px.
