// The isolated page that draws one frame. Everything it shows arrives in the
// payload computed by render.mjs; the page has no clock and no network.
import { readFileSync } from "node:fs";

// The satellite video ends as the series video does (Cartes 1.10.0;
// operator, 19 October 2026): the closing line on two lines in place of the
// 1.6.0 signature line, then the fixed invitation on two lines. Both are the
// accepted design's printed lines (version.json); the page keeps no copy.
// They keep this ending's own sizes: the line in the line's Fraunces 600
// 56/64, the invitation in ending A's sentence style, 700 30/40.
const { signatureLines: SIGNATURE_LINES, invitationLines: INVITATION_LINES } =
  JSON.parse(
    readFileSync(
      new URL("../design-system/version.json", import.meta.url),
      "utf8"
    )
  );

// The ending darkens the base to the design's brightness 0.45 (board 10),
// which the end frames apply where a hold applies 0.84: hence their ratio.
const END_GLSL = `
float ending(float dim) { return mix(1.0, 0.45 / 0.84, dim); }`;
export const FLAT_VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
// Grade, limb darkening, atmosphere and vignette follow the design's
// render.py (board 1); the parameters are mixed from base to recede. The
// series video's map cards (Cartes 1.4.1) set `plain` to drop the vignette.
export const FLAT_FRAG = `#version 300 es
precision highp float;
uniform vec2 centre; uniform float radius; uniform vec2 view;
uniform sampler2D world; uniform sampler2D region; uniform vec4 bounds;
uniform float grade, dim, plain;
// Cartes 1.13.0, the series video's era map: paper (0 to 1) re-inks the
// imagery as a printed map; desat (0 to 1) takes its colour away (the recap
// card). Both are 0 everywhere else, which leaves every pixel as it was.
uniform float paper, desat;
out vec4 colour;
const float PI = 3.141592653589793;
${END_GLSL}
const vec3 SPACE = vec3(7.0, 6.0, 5.0) / 255.0;
const vec3 ATMOS = vec3(143.0, 184.0, 204.0) / 255.0;
const vec3 WARM = vec3(255.0, 238.0, 221.0) / 255.0;
// The atlas's map-land, darkened towards its relief where the imagery is
// dark and towards an olive where it is green (series.md « 5 »). The sea is
// painted over it from Natural Earth's coast by the page.
const vec3 PAPER_LAND = vec3(239.0, 230.0, 214.0) / 255.0;
const vec3 PAPER_RELIEF = vec3(214.0, 196.0, 160.0) / 255.0;
const vec3 PAPER_OLIVE = vec3(205.0, 198.0, 156.0) / 255.0;
vec3 papered(vec3 t) {
  float lum = dot(t, vec3(0.2126, 0.7152, 0.0722));
  float green = clamp((t.g - t.r) * 5.0 + 0.2, 0.0, 1.0);
  vec3 land = mix(PAPER_LAND, PAPER_RELIEF, clamp((0.62 - lum) * 2.2, 0.0, 1.0));
  land = mix(land, PAPER_OLIVE, green * 0.75);
  return land * (0.94 + 0.12 * smoothstep(0.15, 0.7, lum));
}
vec3 graded(vec3 c) {
  float sat = mix(0.85, 0.70, grade), expo = mix(0.90, 0.76, grade);
  float con = mix(1.06, 0.96, grade), warm = mix(0.35, 0.45, grade);
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = vec3(lum) + sat * (c - vec3(lum));
  c = (c * expo - 0.5) * con + 0.5;
  return clamp(c * (1.0 - warm + warm * WARM), 0.0, 1.0);
}
void main() {
  vec2 px = vec2(gl_FragCoord.x, 1920.0 - gl_FragCoord.y);
  float x = (px.x - centre.x) / radius, y = -(px.y - centre.y) / radius;
  float rho = length(vec2(x, y));
  float d = (rho - 1.0) * radius;
  float glow = exp(-max(d, 0.0) / max(0.045 * radius, 1.0)) * 0.55;
  vec3 space = mix(SPACE, ATMOS, glow);
  vec3 land = space;
  // Both images are sampled here, outside any branch: texture() picks its mip
  // level from its neighbours' coordinates, which are undefined inside a
  // branch some of them skip. On SwiftShader that made the limb and the
  // region's edge differ from run to run (README, « Determinism »). cc is
  // clamped so the coordinates stay finite off the disc.
  float cc = sqrt(max(1.0 - rho * rho, 0.0));
  float lat0 = view.y, lon0 = view.x;
  float lat = rho > 0.0 ? asin(clamp(cc * sin(lat0) + y * rho * cos(lat0) / rho, -1.0, 1.0)) : lat0;
  float lon = lon0 + (rho > 0.0 ? atan(x * rho, rho * cc * cos(lat0) - y * rho * sin(lat0)) : 0.0);
  float lonD = degrees(lon), latD = degrees(lat);
  lonD = mod(lonD + 180.0, 360.0) - 180.0;
  vec3 inRegion = texture(region, vec2((lonD - bounds.x) / (bounds.y - bounds.x), (bounds.w - latD) / (bounds.w - bounds.z))).rgb;
  vec3 inWorld = texture(world, vec2((lonD + 180.0) / 360.0, (90.0 - latD) / 180.0)).rgb;
  if (rho < 1.0) {
    vec3 t = lonD >= bounds.x && lonD <= bounds.y && latD >= bounds.z && latD <= bounds.w ? inRegion : inWorld;
    vec3 c = graded(t);
    c = mix(c, vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), desat);
    c = c * (0.62 + 0.38 * sqrt(cc));
    float haze = 0.28 * pow(1.0 - cc, 3.0);
    land = c * (1.0 - haze) + ATMOS * haze * mix(0.55, 0.4, grade);
    land = mix(land, papered(t), paper);
  }
  // Antialiased limb: blend over one pixel instead of a hard edge.
  vec3 c = mix(land, space, smoothstep(-0.5, 0.5, d));
  float nx = (px.x / 1080.0 - 0.5) * 2.0;
  float ny = (px.y / 1920.0 - 0.36) * 2.0 * (1920.0 / 1080.0) * 0.6;
  float t = smoothstep(0.0, 1.0, clamp((sqrt(nx * nx * 0.8 + ny * ny) - 0.6) / 0.75, 0.0, 1.0));
  colour = vec4(c * (1.0 - 0.24 * t * (1.0 - plain)) * ending(dim), 1.0);
}`;

// Cartes 1.11.0, the opening globe of the series video (series.md, « 1. The
// opening globe »): the same orthographic globe as above, from frame 0. Its
// camera passes three keys, 0 s (the subject's longitude + 40°, latitude
// 2°, radius 300), 1.8 s (+ 7.5°, the subject's latitude − 3°, 430) and
// 4.4 s (the first map view), on one monotone cubic per channel with zero
// speed at both ends, the radius in log; the view centre is the map card's
// (540, 1010), with no tilt. When it stops, the globe is the flat map.
export const GLOBE = { keys: [0, 54, 132], grade: [102, 138], centreY: 1010 };

// Fritsch–Carlson through the keys, zero slope at the first and last key:
// no overshoot between keys, no stop at the middle one.
export function monotonePath(times, values) {
  const n = times.length;
  const d = [];
  for (let i = 0; i < n - 1; i++)
    d.push((values[i + 1] - values[i]) / (times[i + 1] - times[i]));
  const m = [0];
  for (let i = 1; i < n - 1; i++) {
    const [h0, h1] = [times[i] - times[i - 1], times[i + 1] - times[i]];
    m.push(
      d[i - 1] * d[i] <= 0
        ? 0
        : (3 * (h0 + h1)) / ((2 * h1 + h0) / d[i - 1] + (h1 + 2 * h0) / d[i])
    );
  }
  m.push(0);
  return (t) => {
    if (t <= times[0]) return values[0];
    if (t >= times[n - 1]) return values[n - 1];
    let k = 0;
    while (t > times[k + 1]) k++;
    const h = times[k + 1] - times[k];
    const s = (t - times[k]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * values[k] +
      (s3 - 2 * s2 + s) * h * m[k] +
      (-2 * s3 + 3 * s2) * values[k + 1] +
      (s3 - s2) * h * m[k + 1]
    );
  };
}

export function globeCamera(view, frame) {
  const keys = [
    { lon: view.lon + 40, lat: 2, radius: 300 },
    { lon: view.lon + 7.5, lat: view.lat - 3, radius: 430 },
    view,
  ];
  if (frame >= GLOBE.keys[2])
    return {
      lon: view.lon,
      lat: view.lat,
      radius: view.radius,
      centreY: GLOBE.centreY,
    };
  const at = (channel) => monotonePath(GLOBE.keys, keys.map(channel))(frame);
  return {
    lon: at((k) => k.lon),
    lat: at((k) => k.lat),
    radius: Math.exp(at((k) => Math.log(k.radius))),
    centreY: GLOBE.centreY,
  };
}

// The base grade during the globe, the recede grade from 4.6 s, `mono`
// between them from 3.4 s, as overlays are about to enter.
export const globeGrade = (frame) => monotonePath(GLOBE.grade, [0, 1])(frame);

// The satellite overlays (boards 2 and 3): inks, hatching, areas, borders
// and legend swatches, shared with the series video's map cards (1.4.1).
export const OVERLAY_SCRIPT = `const SVG = "http://www.w3.org/2000/svg";
// d, lilac, is the series map sequence's fourth name (Cartes 1.5.0); the
// satellite video draws three inks and never references it.
// e, green, and f, pink, are the series map's inks for approximate zones beyond
// four (« Zaïre », board S9); the satellite video never references them.
const INK = { a: "#e8b96a", b: "#6cc3b5", c: "#e3876a", d: "#c4a8f2", e: "#9fd36b", f: "#f2a6c8" };
// The neutral ink of the « Zone approximative » swatch (0.4.0).
const NOTE_INK = "#a8977f";
// Hatching for each ink at 45° and, for an area inside an earlier one, at
// 135° so the overlap reads as crossing; small swatches for the legend.
function hatchDefs() {
  let defs = "";
  for (const [k, v] of Object.entries(INK))
    for (const angle of [45, 135])
      defs += \`<pattern id="hatch-\${k}-\${angle}" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(\${angle})"><rect width="18" height="18" fill="\${v}" fill-opacity="0.10"/><line x1="9" y1="0" x2="9" y2="18" stroke="#0b0806" stroke-opacity="0.45" stroke-width="8"/><line x1="9" y1="0" x2="9" y2="18" stroke="\${v}" stroke-width="4"/></pattern>\`;
  for (const [k, v] of [...Object.entries(INK), ["note", NOTE_INK]])
    defs += \`<pattern id="swatch-hatch-\${k}" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><line x1="3.5" y1="0" x2="3.5" y2="7" stroke="\${v}" stroke-width="2"/></pattern>\`;
  return defs;
}
function path(d, attrs) {
  const p = document.createElementNS(SVG, "path");
  p.setAttribute("d", d);
  for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v);
  return p;
}
function group(opacity, ...children) {
  const g = document.createElementNS(SVG, "g");
  g.setAttribute("opacity", opacity);
  g.append(...children);
  return g;
}
// Board 2: certain areas filled at 30 % with a solid edge; uncertain areas
// hatched with a dashed edge; every bright stroke over a dark keyline.
function areaFill(a) {
  return group(a.opacity, path(a.d, a.uncertain
    ? { fill: \`url(#hatch-\${a.ink}-\${a.hatch ?? 45})\`, "fill-rule": "evenodd" }
    : { fill: INK[a.ink], "fill-opacity": 0.3, "fill-rule": "evenodd" }));
}
function areaEdge(a) {
  const dash = a.uncertain ? { "stroke-dasharray": "16 10" } : {};
  return group(a.opacity,
    path(a.d, { stroke: "#0b0806", "stroke-opacity": 0.55, "stroke-width": 8, ...dash }),
    path(a.d, { stroke: INK[a.ink], "stroke-width": 4, ...dash }));
}
function border(b) {
  return group(b.opacity, ...(b.strong
    ? [path(b.d, { stroke: "#0b0806", "stroke-opacity": 0.55, "stroke-width": 8 }),
       path(b.d, { stroke: "#f3e9da", "stroke-opacity": 0.92, "stroke-width": 3.5 })]
    : [path(b.d, { stroke: "#0b0806", "stroke-opacity": 0.35, "stroke-width": 5 }),
       path(b.d, { stroke: "#f3e9da", "stroke-opacity": 0.7, "stroke-width": 2, "stroke-dasharray": "9 7" })]));
}
const SWATCHES = {
  river: '<line x1="4" y1="12" x2="40" y2="12" stroke="#6fcbe2" stroke-width="12" stroke-linecap="round" opacity="0.45"/><line x1="4" y1="12" x2="40" y2="12" stroke="#e4f6fb" stroke-width="4.5" stroke-linecap="round"/>',
  "border-quiet": '<line x1="2" y1="12" x2="42" y2="12" stroke="#f3e9da" stroke-opacity="0.8" stroke-width="2.5" stroke-dasharray="7 5"/>',
  "border-strong": '<line x1="2" y1="12" x2="42" y2="12" stroke="#0b0806" stroke-opacity="0.55" stroke-width="8"/><line x1="2" y1="12" x2="42" y2="12" stroke="#f3e9da" stroke-opacity="0.92" stroke-width="3.5"/>',
  outline: '<line x1="5" y1="12" x2="39" y2="12" stroke="#bfe0ea" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 10"/>',
  place: '<circle cx="22" cy="12" r="6.5" fill="#f3e9da" stroke="#0b0806" stroke-opacity="0.7" stroke-width="3"/>',
  region: '<text x="22" y="21" text-anchor="middle" font-family="Anton" font-size="22" letter-spacing="2.6" fill="#f3e9da">Aa</text>',
  water: '<text x="22" y="20" text-anchor="middle" font-family="Nunito Sans" font-style="italic" font-weight="700" font-size="22" fill="#bfe0ea">Aa</text>',
};
for (const [k, v] of Object.entries(INK)) {
  SWATCHES["certain-" + k] = \`<rect x="2" y="2" width="40" height="20" rx="3" fill="\${v}" fill-opacity="0.35" stroke="\${v}" stroke-width="3"/>\`;
  SWATCHES["uncertain-" + k] = \`<rect x="2" y="2" width="40" height="20" rx="3" fill="url(#swatch-hatch-\${k})" stroke="\${v}" stroke-width="3" stroke-dasharray="6 4"/>\`;
}
SWATCHES.approximate = \`<rect x="2" y="2" width="40" height="20" rx="3" fill="url(#swatch-hatch-note)" stroke="\${NOTE_INK}" stroke-width="3" stroke-dasharray="6 4"/>\`;
// A name the placement rule could not fit on the map is listed as text.
SWATCHES.text = "";
`;

export const PAGE_HTML = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>
@font-face{font-family:Anton;src:url(/fonts/Anton-Regular.ttf)}
@font-face{font-family:Fraunces;src:url(/fonts/Fraunces.ttf);font-weight:100 900}
@font-face{font-family:"Nunito Sans";src:url(/fonts/NunitoSans.ttf);font-weight:200 1000}
/* Nunito Sans draws ʾ and ʿ in the middle of half an em, which parts *ṣaḥrāʾ*
   in two; Noto Sans sets them against their letter. Same descriptors as above,
   so the browser composes one family. */
@font-face{font-family:"Nunito Sans";src:url(/fonts/NotoSans-Variable.ttf);font-weight:200 1000;unicode-range:U+02BE-02BF}
@font-face{font-family:"Noto Sans";src:url(/fonts/NotoSans-Variable.ttf);font-weight:100 900}
@font-face{font-family:"Noto Sans Arabic";src:url(/fonts/NotoSansArabic-SemiBold.ttf);font-weight:600}
html,body{margin:0;background:#070605}
#frame{position:relative;width:1080px;height:1920px;overflow:hidden;background:#070605;color:#f3e9da;font-family:"Nunito Sans","Noto Sans",sans-serif}
#frame>*{position:absolute;left:0;top:0}
.halo{text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.8),0 1px 10px rgba(11,8,6,.6)}
.dot{width:16px;height:16px;box-sizing:border-box;border-radius:999px;background:#f3e9da;border:3px solid rgba(11,8,6,.7)}
.place{font-size:28px;line-height:32px;font-weight:800;white-space:nowrap}
.area-name{font-family:Anton,"Noto Sans",sans-serif;font-size:36px;line-height:44px;white-space:nowrap;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.85),0 1px 10px rgba(11,8,6,.6)}
.water{font-size:26px;line-height:30px;font-weight:700;font-style:italic;color:#bfe0ea;white-space:pre;text-align:center;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.8)}
.region{font-family:Anton,"Noto Sans",sans-serif;font-size:52px;line-height:60px;letter-spacing:.12em;color:rgba(243,233,218,.92);white-space:pre;text-align:center}
.plate{height:54px;padding:0 22px;display:flex;align-items:center;border-radius:999px;background:rgba(243,233,218,.95);box-shadow:0 2px 10px rgba(11,8,6,.45);font-family:Anton,"Noto Sans",sans-serif;font-size:38px;line-height:54px;color:#15100b;white-space:nowrap}
/* 0.4.0 map names: a region in tracked Anton, a source's own term in italic in its area's ink. */
.region-name{font-family:Anton,"Noto Sans",sans-serif;letter-spacing:.12em;text-indent:.12em;color:rgba(243,233,218,.94);white-space:nowrap;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 8px rgba(11,8,6,.8),0 1px 14px rgba(11,8,6,.6)}
.area-label{font-weight:700;white-space:nowrap;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 8px rgba(11,8,6,.8),0 1px 14px rgba(11,8,6,.6)}
.quoted{font-weight:700;font-style:italic;white-space:nowrap;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 8px rgba(11,8,6,.8),0 1px 14px rgba(11,8,6,.6)}
/* 0.4.0 subtitles on the image: no band; a 9 px dark stroke painted under
   each letter and a soft shadow keep it legible over sand, sea or forest. */
#subtitles{left:60px;top:1316px;width:960px;height:136px;display:flex;flex-direction:column;justify-content:center}
.sub-line{text-align:center;white-space:pre;font-size:56px;line-height:68px;font-weight:800;color:#fffaf2}
.sub-text{-webkit-text-stroke:9px rgba(11,8,6,.92);paint-order:stroke fill;text-shadow:0 2px 14px rgba(11,8,6,.7)}
/* The highlight box grows sideways through shadows, never padding, so no
   advance width changes and the line never reflows. */
.lit{background:#e8b96a;color:#1a120a;border-radius:6px;box-shadow:6px 0 0 #e8b96a,-6px 0 0 #e8b96a;-webkit-text-stroke:0;text-shadow:none}
</style></head><body><div id="frame">
<canvas id="earth" width="1080" height="1920"></canvas>
<svg id="lines" width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true"><defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs><g id="fills"></g><g id="borders" fill="none" stroke-linecap="round" stroke-linejoin="round"></g><g id="edges" fill="none" stroke-linecap="round" stroke-linejoin="round"></g><g id="rivers" fill="none" stroke-linecap="round" stroke-linejoin="round"></g><g id="outlines" stroke-linejoin="round"></g></svg>
<div id="scrim"></div>
<div id="names"></div>
<div id="veil"></div>
<div id="head" style="display:flex;flex-direction:column;gap:12px"></div>
<div id="subtitles"></div>
<div id="panel" style="display:flex;flex-direction:column;justify-content:flex-end"></div>
<div id="closing" style="left:120px;width:840px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center"></div>
</div>
<script>
const SIGNATURE_LINES = ${JSON.stringify(SIGNATURE_LINES)};
const INVITATION_LINES = ${JSON.stringify(INVITATION_LINES)};
const END_GLSL = ${JSON.stringify(END_GLSL)};
const VERT = ${JSON.stringify(FLAT_VERT)};
const FRAG = ${JSON.stringify(FLAT_FRAG)};

// Relief (board 6): a sphere mesh raised by the height model, seen through
// the perspective camera computed in sequence.mjs. Imagery and overlays are
// draped on it and lit by one fixed light plus a soft fill.
const CAMERA_GLSL = \`
uniform vec3 camPos, camRight, camUp, camFwd; uniform float focal, dim; uniform vec2 centre;
\${END_GLSL}
const vec3 SPACE = vec3(7.0, 6.0, 5.0) / 255.0;
const vec3 ATMOS = vec3(143.0, 184.0, 204.0) / 255.0;
vec3 vignette(vec3 c, vec2 px) {
  float nx = (px.x / 1080.0 - 0.5) * 2.0;
  float ny = (px.y / 1920.0 - 0.36) * 2.0 * (1920.0 / 1080.0) * 0.6;
  float t = smoothstep(0.0, 1.0, clamp((sqrt(nx * nx * 0.8 + ny * ny) - 0.6) / 0.75, 0.0, 1.0));
  return c * (1.0 - 0.24 * t) * ending(dim);
}\`;
// Space and the atmosphere rim, from each pixel's ray: the rim falls off
// over 4.5 % of the radius, as on the flat globe.
const SKY_FRAG = \`#version 300 es
precision highp float;
\${CAMERA_GLSL}
out vec4 colour;
void main() {
  vec2 px = vec2(gl_FragCoord.x, 1920.0 - gl_FragCoord.y);
  vec3 dir = normalize(camFwd + camRight * (px.x - centre.x) / focal - camUp * (px.y - centre.y) / focal);
  float b = dot(camPos, dir);
  float closest = b > 0.0 ? length(camPos) : length(camPos - b * dir);
  float glow = exp(-max(closest - 1.0, 0.0) / 0.045) * 0.55;
  colour = vec4(vignette(mix(SPACE, ATMOS, glow), px), 1.0);
}\`;
const HEIGHT_GLSL = \`
uniform sampler2D worldH, regionH; uniform vec4 bounds; uniform float exaggeration;
bool inRegion(vec2 ll) { return ll.x >= bounds.x && ll.x <= bounds.y && ll.y >= bounds.z && ll.y <= bounds.w; }
vec2 regionUV(vec2 ll) { return vec2((ll.x - bounds.x) / (bounds.y - bounds.x), (bounds.w - ll.y) / (bounds.w - bounds.z)); }
vec2 worldUV(vec2 ll) { return vec2((ll.x + 180.0) / 360.0, (90.0 - ll.y) / 180.0); }
float metres(vec2 ll) {
  float h = inRegion(ll) ? textureLod(regionH, regionUV(ll), 0.0).r : textureLod(worldH, worldUV(ll), 0.0).r;
  return max(h, 0.0);
}\`;
const MESH_VERT = \`#version 300 es
precision highp float;
\${CAMERA_GLSL}
\${HEIGHT_GLSL}
in vec2 lonlat;
out vec2 vLonLat;
void main() {
  float lon = radians(lonlat.x), lat = radians(lonlat.y);
  vec3 n = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
  vec3 v = n * (1.0 + metres(lonlat) * exaggeration / 6371000.0) - camPos;
  float depth = dot(v, camFwd);
  vec2 px = vec2(centre.x + focal * dot(v, camRight) / depth, centre.y - focal * dot(v, camUp) / depth);
  const float near = 0.01, far = 20.0;
  float z = (far + near) / (far - near) * depth - 2.0 * far * near / (far - near);
  gl_Position = vec4((2.0 * px.x / 1080.0 - 1.0) * depth, (1.0 - 2.0 * px.y / 1920.0) * depth, z, depth);
  vLonLat = lonlat;
}\`;
const MESH_FRAG = \`#version 300 es
precision highp float;
\${CAMERA_GLSL}
\${HEIGHT_GLSL}
uniform sampler2D world, region, overlay;
uniform float grade, ambient, sun; uniform vec3 light;
in vec2 vLonLat;
out vec4 colour;
const vec3 WARM = vec3(255.0, 238.0, 221.0) / 255.0;
vec3 graded(vec3 c) {
  float sat = mix(0.85, 0.70, grade), expo = mix(0.90, 0.76, grade);
  float con = mix(1.06, 0.96, grade), warm = mix(0.35, 0.45, grade);
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = vec3(lum) + sat * (c - vec3(lum));
  c = (c * expo - 0.5) * con + 0.5;
  return clamp(c * (1.0 - warm + warm * WARM), 0.0, 1.0);
}
void main() {
  vec2 ll = vLonLat;
  bool inside = inRegion(ll);
  vec3 c = graded(inside ? texture(region, regionUV(ll)).rgb : texture(world, worldUV(ll)).rgb);
  if (inside) { vec4 o = texture(overlay, regionUV(ll)); c = c * (1.0 - o.a) + o.rgb; }
  // Shade from the height grid itself, so slopes read at its resolution.
  vec2 size = vec2(inside ? textureSize(regionH, 0) : textureSize(worldH, 0));
  vec2 stepDeg = inside ? vec2(bounds.y - bounds.x, bounds.w - bounds.z) / size : vec2(360.0, 180.0) / size;
  float lat = radians(ll.y), lon = radians(ll.x);
  float dx = (metres(ll + vec2(stepDeg.x, 0.0)) - metres(ll - vec2(stepDeg.x, 0.0))) / (2.0 * stepDeg.x * 111320.0 * max(cos(lat), 0.01));
  float dy = (metres(ll + vec2(0.0, stepDeg.y)) - metres(ll - vec2(0.0, stepDeg.y))) / (2.0 * stepDeg.y * 111320.0);
  vec3 local = normalize(vec3(-exaggeration * dx, -exaggeration * dy, 1.0));
  vec3 up = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
  vec3 east = vec3(cos(lon), 0.0, -sin(lon));
  vec3 north = vec3(-sin(lat) * sin(lon), cos(lat), -sin(lat) * cos(lon));
  vec3 normal = local.x * east + local.y * north + local.z * up;
  c *= ambient + sun * max(dot(normal, light), 0.0);
  colour = vec4(vignette(clamp(c, 0.0, 1.0), vec2(gl_FragCoord.x, 1920.0 - gl_FragCoord.y)), 1.0);
}\`;

const gl = document.getElementById("earth").getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
let program;
function compile(type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
async function texture(unit, url) {
  const img = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: "none" });
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
function link(vertex, fragment) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
function quad(prog) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return vao;
}
async function heights(unit, url, [w, h]) {
  const data = new Float32Array(await (await fetch(url)).arrayBuffer());
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, w, h, 0, gl.RED, gl.FLOAT, data);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
    gl.texParameteri(gl.TEXTURE_2D, k, v);
}
// A coarse world grid (0.5°) outside the hold bounds and a fine grid inside.
// The bounds are whole degrees, so both grids meet on shared vertices.
function sphereMesh(bounds, step) {
  const [lonMin, lonMax, latMin, latMax] = bounds;
  const vertices = [];
  const indices = [];
  const grid = (lon0, lat0, nx, ny, dLon, dLat, skip) => {
    const base = vertices.length / 2;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) vertices.push(lon0 + i * dLon, lat0 - j * dLat);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (skip && skip(lon0 + (i + 0.5) * dLon, lat0 - (j + 0.5) * dLat)) continue;
      const a = base + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  };
  grid(-180, 90, 720, 360, 0.5, 0.5, (lon, lat) => lon > lonMin && lon < lonMax && lat > latMin && lat < latMax);
  const nx = Math.min(1000, Math.ceil((lonMax - lonMin) / step));
  const ny = Math.min(1000, Math.ceil((latMax - latMin) / step));
  grid(lonMin, latMax, nx, ny, (lonMax - lonMin) / nx, (latMax - latMin) / ny);
  return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) };
}
let relief = null;
async function setupRelief(bounds, setup) {
  const sky = link(VERT, SKY_FRAG);
  const mesh = link(MESH_VERT, MESH_FRAG);
  const skyQuad = quad(sky);
  const geometry = sphereMesh(bounds, setup.meshStep);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(mesh, "lonlat");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  await heights(2, "/relief/world.f32", setup.world);
  await heights(3, "/relief/region.f32", setup.region);
  const overlay = gl.createTexture();
  // Four samples per pixel smooth the limb and the mesh's silhouettes.
  const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  for (const [format, attachment] of [[gl.RGBA8, gl.COLOR_ATTACHMENT0], [gl.DEPTH_COMPONENT24, gl.DEPTH_ATTACHMENT]]) {
    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, format, 1080, 1920);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, rb);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  for (const prog of [sky, mesh]) {
    gl.useProgram(prog);
    for (const [name, unit] of [["world", 0], ["region", 1], ["worldH", 2], ["regionH", 3], ["overlay", 4]])
      gl.uniform1i(gl.getUniformLocation(prog, name), unit);
    gl.uniform4f(gl.getUniformLocation(prog, "bounds"), ...bounds);
    gl.uniform1f(gl.getUniformLocation(prog, "exaggeration"), setup.exaggeration);
  }
  relief = { sky, mesh, skyQuad, vao, count: geometry.indices.length, overlay, fb, drapeKey: null, canvas: document.createElement("canvas") };
}

window.setup = async (bounds, reliefSetup) => {
  if (!gl) throw new Error("WebGL2 unavailable");
  program = link(VERT, FRAG);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  await texture(0, "/imagery/world.jpg");
  await texture(1, "/imagery/region.jpg");
  gl.uniform1i(gl.getUniformLocation(program, "world"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "region"), 1);
  gl.uniform4f(gl.getUniformLocation(program, "bounds"), ...bounds);
  if (reliefSetup) await setupRelief(bounds, reliefSetup);
  await document.fonts.load('38px Anton'); await document.fonts.load('600 28px Fraunces');
  await document.fonts.load('800 28px "Nunito Sans"'); await document.fonts.load('400 22px "Nunito Sans"'); await document.fonts.load('400 22px "Noto Sans"');
  await document.fonts.load('700 36px "Nunito Sans"', "\\u02be\\u02bf");
  await document.fonts.load('600 36px "Noto Sans Arabic"', "\\u0635\\u062d\\u0631\\u0627\\u0621");
  await document.fonts.ready;
  return [...document.fonts].map((f) => ({ family: f.family, status: f.status }));
};

const el = (tag, style, text) => {
  const e = document.createElement(tag);
  if (style) e.setAttribute("style", style);
  if (text !== undefined) e.textContent = text;
  return e;
};
const printedLines = (style, lines) => {
  const block = el("span", style);
  for (const t of lines) block.append(el("span", "display:block;white-space:nowrap", t));
  return block;
};
${OVERLAY_SCRIPT}
document.querySelector("#lines defs").insertAdjacentHTML("beforeend", hatchDefs());

function river(d, state) {
  const g = document.createElementNS(SVG, "g");
  for (const [stroke, width, opacity, extra] of [
    ["#6fcbe2", 16, state.glow, { filter: "url(#glow)" }],
    ["#0b0806", 9, 0.5 * state.core, {}],
    ["#e4f6fb", 4.5, state.core, {}],
  ]) {
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", d); p.setAttribute("stroke", stroke);
    p.setAttribute("stroke-width", width); p.setAttribute("opacity", opacity);
    for (const [k, v] of Object.entries(extra)) p.setAttribute(k, v);
    g.append(p);
  }
  return g;
}

// Board 10: a reconstructed outline is round dots over dark dots, its inside
// barely tinted; it fades in whole and never fills, dries or shrinks.
function outline(o) {
  const dots = { fill: "none", "stroke-linecap": "round", "stroke-dasharray": "0.1 11" };
  return group(o.opacity,
    ...(o.closed ? [path(o.d, { fill: "#8fd3e6", "fill-opacity": 0.14, "fill-rule": "evenodd" })] : []),
    path(o.d, { ...dots, stroke: "#0b0806", "stroke-opacity": 0.6, "stroke-width": 9 }),
    path(o.d, { ...dots, stroke: "#bfe0ea", "stroke-width": 5 }));
}

// The overlay layers in the design's order: fills, borders, edges, rivers,
// then a reconstructed outline.
const LAYERS = ["fills", "borders", "edges", "rivers", "outlines"];
function overlayLayers(f) {
  const visible = f.areas.filter((a) => a.opacity > 0);
  return [
    visible.map(areaFill),
    f.borders.filter((b) => b.opacity > 0).map(border),
    visible.map(areaEdge),
    f.rivers.filter((r) => r.state.core > 0 || r.state.glow > 0).map((r) => river(r.d, r.state)),
    f.outline && f.outline.opacity > 0 ? [outline(f.outline)] : [],
  ];
}
// Draws the overlays into the region's map and uploads it as the drape.
// The SVG is the flat style's own, so strokes, hatching and glow match.
async function drape(f) {
  const key = JSON.stringify([[f.areas, f.borders, f.rivers].map((list) => list.map((x) => x.opacity ?? x.state)), f.outline?.opacity, f.relief.drape, f.chapter]);
  if (key === relief.drapeKey) return;
  relief.drapeKey = key;
  const { width, height, scale } = f.relief.drape;
  const [w, h] = [Math.round(width * scale), Math.round(height * scale)];
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", w); svg.setAttribute("height", h);
  svg.setAttribute("viewBox", \`0 0 \${width} \${height}\`);
  svg.innerHTML = "<defs>" + document.querySelector("#lines defs").innerHTML + "</defs>";
  for (const layer of overlayLayers(f)) {
    const g = document.createElementNS(SVG, "g");
    g.setAttribute("fill", "none"); g.setAttribute("stroke-linecap", "round"); g.setAttribute("stroke-linejoin", "round");
    g.append(...layer);
    svg.append(g);
  }
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  relief.canvas.width = w; relief.canvas.height = h;
  const ctx = relief.canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, relief.overlay);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, relief.canvas);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
async function drawRelief(f) {
  await drape(f);
  const v = f.relief.view;
  gl.bindFramebuffer(gl.FRAMEBUFFER, relief.fb);
  gl.viewport(0, 0, 1080, 1920);
  for (const prog of [relief.sky, relief.mesh]) {
    gl.useProgram(prog);
    gl.uniform3f(gl.getUniformLocation(prog, "camPos"), ...v.position);
    gl.uniform3f(gl.getUniformLocation(prog, "camRight"), ...v.right);
    gl.uniform3f(gl.getUniformLocation(prog, "camUp"), ...v.screenUp);
    gl.uniform3f(gl.getUniformLocation(prog, "camFwd"), ...v.forward);
    gl.uniform1f(gl.getUniformLocation(prog, "focal"), v.focal);
    gl.uniform1f(gl.getUniformLocation(prog, "dim"), f.dim);
    gl.uniform2f(gl.getUniformLocation(prog, "centre"), f.centre.x, f.centre.y);
  }
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(relief.sky);
  gl.bindVertexArray(relief.skyQuad);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(relief.mesh);
  gl.uniform1f(gl.getUniformLocation(relief.mesh, "grade"), f.grade);
  gl.uniform1f(gl.getUniformLocation(relief.mesh, "ambient"), f.relief.ambient);
  gl.uniform1f(gl.getUniformLocation(relief.mesh, "sun"), f.relief.sun);
  gl.uniform3f(gl.getUniformLocation(relief.mesh, "light"), ...f.relief.light);
  gl.bindVertexArray(relief.vao);
  gl.drawElements(gl.TRIANGLES, relief.count, gl.UNSIGNED_INT, 0);
  gl.bindVertexArray(null);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, relief.fb);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  gl.blitFramebuffer(0, 0, 1080, 1920, 0, 0, 1080, 1920, gl.COLOR_BUFFER_BIT, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.finish();
  for (const id of LAYERS) document.getElementById(id).replaceChildren();
}

window.drawFrame = async (f) => {
  if (f.relief) await drawRelief(f);
  else {
    gl.viewport(0, 0, 1080, 1920);
    gl.uniform2f(gl.getUniformLocation(program, "centre"), f.centre.x, f.centre.y);
    gl.uniform1f(gl.getUniformLocation(program, "radius"), f.camera.radius);
    gl.uniform2f(gl.getUniformLocation(program, "view"), f.camera.lon * Math.PI / 180, f.camera.lat * Math.PI / 180);
    gl.uniform1f(gl.getUniformLocation(program, "grade"), f.grade);
    gl.uniform1f(gl.getUniformLocation(program, "dim"), f.dim);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
    overlayLayers(f).forEach((layer, i) => document.getElementById(LAYERS[i]).replaceChildren(...layer));
  }

  // The 12-second video keeps 0.2.0's feed layout; a chained video uses the
  // 0.4.0 « plein écran » bands.
  const full = f.layout === "fullscreen";
  const L = LAYOUTS[f.layout];
  document.getElementById("scrim").setAttribute("style", L.scrim);
  document.getElementById("veil").setAttribute("style", L.veil);
  const head = document.getElementById("head");
  Object.assign(head.style, L.head);
  const panel = document.getElementById("panel");
  Object.assign(panel.style, L.panel);

  const names = document.getElementById("names");
  names.replaceChildren();
  const nameNodes = [];
  for (const p of f.places) {
    if (p.opacity <= 0) continue;
    const g = el("div", \`position:absolute;left:0;top:0;width:1080px;height:1920px;opacity:\${p.opacity}\`);
    g.append(el("div", \`position:absolute;left:\${p.x - 8}px;top:\${p.y - 8}px\`));
    g.lastChild.className = "dot";
    const name = el("div", p.side === "left"
      ? \`position:absolute;right:\${1080 - (p.x - 14)}px;top:\${p.y - 16}px;text-align:right\`
      : \`position:absolute;left:\${p.x + 14}px;top:\${p.y - 16}px\`, p.name);
    name.className = "place halo";
    g.append(name);
    names.append(g);
    nameNodes.push(["place", name]);
  }
  for (const l of [...f.labels, ...f.names]) {
    if (l.opacity <= 0) continue;
    // A placed name (0.4.0) carries the size the placement rule chose.
    const sized = l.size ? \`;font-size:\${l.size}px;line-height:\${l.size + LEADING[l.style]}px\` : "";
    const centred = \`position:absolute;left:\${l.x}px;top:\${l.y}px;transform:translate(-50%,-50%);opacity:\${l.opacity}\${sized}\`;
    const name = el("div", l.colour ? centred + ";color:" + l.colour : centred, l.name);
    name.className = full
      ? { plate: "plate", water: "water halo", region: "region-name", quoted: "quoted", area: "area-label" }[l.style]
      : { plate: "plate", area: "area-name", water: "water halo", region: "region halo" }[l.style];
    names.append(name);
    nameNodes.push([l.kind ?? "label", name]);
  }
  const outlineLabel = f.outline?.label;
  if (outlineLabel && outlineLabel.opacity > 0) {
    // The second line is mandatory: the shape is derived, not observed.
    const name = el("div", \`position:absolute;left:\${outlineLabel.x}px;top:\${outlineLabel.y}px;transform:translate(-50%,-50%);opacity:\${outlineLabel.opacity};font-style:italic;font-weight:700;color:#bfe0ea;text-align:center;white-space:nowrap\`);
    name.className = "outline-name halo";
    name.append(el("div", "font-size:30px;line-height:34px", outlineLabel.name), el("div", "font-size:20px;line-height:24px", "contour reconstitu\\u00e9"));
    names.append(name);
    nameNodes.push(["label", name]);
  }

  const tape = (style) => el("span", "padding:3px 12px;border-radius:999px;background:#ffe58a;color:#2b2100;font-size:16px;line-height:22px;font-weight:800;" + style, f.tape);
  head.replaceChildren();
  const signature = el("div", \`display:flex;align-items:center;gap:12px;opacity:\${f.head.signature}\`);
  const logo = el("img", "width:36px;height:36px;display:block");
  logo.src = "/logo.png"; logo.alt = "Logo EthniAfrica";
  signature.append(logo, el("span", "font-family:Fraunces,Georgia,serif;font-weight:600;font-size:28px;line-height:36px;color:#f3e9da", "EthniAfrica"));
  if (f.tape) signature.append(tape("margin-left:8px"));
  // A chained video keeps its title on one line, so the marker stays in the
  // title band; the browser's box check catches a title that overflows.
  const title = el("h1", \`margin:0;font-family:Anton,'Noto Sans',sans-serif;font-weight:400;font-size:\${f.head.titleSize}px;line-height:\${f.head.titleSize + 4}px;color:#f3e9da;text-shadow:0 0 2px rgba(11,8,6,.9),0 2px 14px rgba(11,8,6,.7);opacity:\${f.head.title}\${f.marker ? ";white-space:pre" : ""}\`);
  for (const part of f.title) title.append(part.colour ? el("span", "color:" + part.colour, part.text) : document.createTextNode(part.text));
  head.append(signature, title);
  let marker = null;
  if (f.marker) {
    // The bars only change colour and the line only fades: nothing slides.
    marker = el("div", \`display:flex;align-items:center;gap:14px;opacity:\${f.marker.opacity}\`);
    const bars = el("div", "display:flex;gap:6px");
    for (const ink of f.marker.bars) bars.append(el("span", \`width:28px;height:4px;border-radius:2px;background:\${ink}\`));
    marker.append(bars, el("span", \`font-size:26px;line-height:32px;font-weight:800;color:#e8b96a;text-shadow:0 0 6px rgba(11,8,6,.8);white-space:pre;opacity:\${f.marker.line.opacity}\`, f.marker.line.text));
    head.append(marker);
  }

  const subtitle = window.drawSubtitle(f.subtitle);

  panel.replaceChildren();
  const legend = el("div", full
    ? "display:flex;flex-wrap:wrap;gap:10px 28px"
    // Up to two items on one row each; three or four share a two-column grid.
    : f.legend.length > 2
      ? "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 24px"
      : "display:flex;flex-wrap:wrap;gap:12px 28px");
  for (const item of f.legend) {
    const row = el("div", \`display:flex;align-items:center;gap:\${full ? 10 : 12}px;opacity:\${item.opacity}\`);
    if (item.swatch !== "text") {
      const swatch = document.createElementNS(SVG, "svg");
      swatch.setAttribute("width", full ? 36 : 44); swatch.setAttribute("height", 24);
      swatch.setAttribute("viewBox", "0 0 44 24");
      swatch.innerHTML = SWATCHES[item.swatch];
      row.append(swatch);
    }
    row.append(el("span", \`font-size:\${full || f.legend.length > 1 ? 24 : 26}px;line-height:32px;font-weight:700;color:\${item.colour}\`, item.label));
    legend.append(row);
  }
  const caption = el("p", "margin:0;font-size:22px;line-height:28px;color:#cbbba3");
  for (const line of f.caption) {
    const row = el("span", \`display:block;opacity:\${line.opacity}\`);
    row.append(el("b", "font-weight:700;color:#f3e9da", line.label + "\\u00a0:"), document.createTextNode(" " + line.text.replaceAll(" : ", "\\u00a0: ").replaceAll(" ; ", "\\u00a0; ")));
    caption.append(row);
  }
  panel.append(legend, caption);

  // Board 10's closing: signature, then since Cartes 1.10.0 the closing line and the invitation in place of the slogan; ending A
  // adds what the page holds and the bare domain.
  const closing = document.getElementById("closing");
  closing.replaceChildren();
  const closingParts = [];
  let closingTape = null;
  if (f.closing && f.closing.opacity > 0) {
    const a = f.closing.variant === "A";
    closing.style.top = (a ? 540 : 600) + "px";
    closing.style.opacity = f.closing.opacity;
    const big = el("img", "width:72px;height:72px;display:block");
    big.src = "/logo.png"; big.alt = "Logo EthniAfrica";
    closingParts.push(big,
      el("span", "font-family:Fraunces,Georgia,serif;font-weight:600;font-size:64px;line-height:72px;color:#f3e9da", "EthniAfrica"),
      // 27 October 2026: the invitation first, then the line, as the voice says them.
      printedLines("font-size:30px;line-height:40px;font-weight:700;color:#f3e9da", INVITATION_LINES),
      printedLines("margin-top:28px;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:56px;line-height:64px;color:#f3e9da", SIGNATURE_LINES));
    if (a) closingParts.push(
      el("span", "margin-top:28px;font-size:30px;line-height:40px;font-weight:700;color:#f3e9da", f.closing.sentence),
      el("span", "margin-top:6px;padding:12px 28px;border-radius:999px;border:2px solid #e8b96a;color:#e8b96a;font-size:34px;line-height:40px;font-weight:800;letter-spacing:.04em", f.closing.address));
    closing.append(...closingParts);
    // The top signature has left, so the tape moves to the top right.
    if (f.tape) {
      closingTape = tape(L.closingTape);
      closing.append(closingTape);
    }
  }

  // Report the real glyph boxes, with their kind, so the layout gate checks
  // what was drawn.
  const boxes = [];
  const add = (id, kind, node) => { const r = node.getBoundingClientRect(); boxes.push({ id, kind, box: { x: r.left, y: r.top, w: r.width, h: r.height } }); };
  add("signature", "signature", signature); add("title", "title", title); add("legend", "legend", legend); add("caption", "caption", caption);
  if (marker) add("marker", "marker", marker);
  subtitle.lines.forEach((box, i) => boxes.push({ id: "subtitle line " + (i + 1), kind: "subtitle", box }));
  closingParts.forEach((part, i) => add("closing " + i, "closing", part));
  if (closingTape) add("tape", "signature", closingTape);
  for (const [kind, n] of nameNodes) add(n.textContent, kind, n);
  return boxes;
};

// Line height over font size for each placed name style.
const LEADING = { region: 8, area: 6, quoted: 6, water: 4, plate: 16 };

// One subtitle chunk in the band, centred on x 540: each line a run of
// units, the lit unit (if any) in the accent box. Units are always wrapped,
// lit or not, so the highlight changes paint only, never layout. Returns the
// glyph boxes of each line and each unit.
window.drawSubtitle = (subtitle) => {
  const band = document.getElementById("subtitles");
  band.replaceChildren();
  const result = { lines: [], units: [] };
  if (!subtitle || subtitle.opacity <= 0) return result;
  band.style.opacity = subtitle.opacity;
  const unitNodes = [];
  const lineNodes = subtitle.lines.map((line) => {
    const row = el("div");
    row.className = "sub-line";
    const text = el("span");
    text.className = "sub-text";
    let unitNode = null;
    for (const run of line) {
      let node;
      if (run.arabic) {
        node = el("bdi", "font-family:'Noto Sans Arabic',sans-serif;font-style:normal;font-weight:600", run.text);
        node.lang = "ar"; node.dir = "rtl";
      } else node = run.italic ? el("i", null, run.text) : document.createTextNode(run.text);
      if (run.unit === undefined) {
        unitNode = null;
        text.append(node);
        continue;
      }
      if (!unitNode || unitNode.dataset.unit !== String(run.unit)) {
        unitNode = el("span");
        unitNode.dataset.unit = run.unit;
        if (run.unit === subtitle.highlight) unitNode.className = "lit";
        unitNodes[run.unit] = unitNode;
        text.append(unitNode);
      }
      unitNode.append(node);
    }
    row.append(text);
    band.append(row);
    return [row, text];
  });
  const box = (node) => { const r = node.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  // A line's box: the ink's width, and the 68 px line box's height. The
  // glyphs' content area overhangs the line box by a few pixels at 56 px,
  // which the band does not count.
  result.lines = lineNodes.map(([row, text]) => {
    const [r, t] = [box(row), box(text)];
    return { x: t.x, w: t.w, y: r.y, h: r.h };
  });
  result.units = unitNodes.map(box);
  return result;
};

// Where each layout puts its fixed blocks.
const LAYOUTS = {
  feed: {
    scrim: "width:1080px;height:600px;background:linear-gradient(180deg,rgba(7,6,5,.72) 0px,rgba(7,6,5,.55) 420px,rgba(7,6,5,0) 600px)",
    veil: "top:940px;width:1080px;height:980px;background:linear-gradient(180deg,rgba(21,16,11,0) 0px,rgba(21,16,11,.92) 130px,rgba(21,16,11,.92) 980px)",
    head: { left: "120px", top: "290px", width: "840px" },
    panel: { left: "120px", top: "1064px", width: "660px", height: "176px", gap: "16px" },
    closingTape: "position:fixed;right:120px;top:300px",
  },
  // Board 11 · Full screen: the head high in the dark of space, the image in
  // the clear to y 1540, then one fixed veil under legend and credits.
  fullscreen: {
    scrim: "width:1080px;height:420px;background:linear-gradient(180deg,rgba(7,6,5,.72) 0px,rgba(7,6,5,.48) 240px,rgba(7,6,5,0) 420px)",
    veil: "top:1540px;width:1080px;height:380px;background:linear-gradient(180deg,rgba(21,16,11,0) 0px,rgba(21,16,11,.9) 100px,rgba(21,16,11,.94) 380px)",
    head: { left: "60px", top: "100px", width: "960px" },
    panel: { left: "60px", top: "1652px", width: "960px", height: "232px", gap: "14px" },
    closingTape: "position:fixed;right:60px;top:106px",
  },
};
</script></body></html>`;
