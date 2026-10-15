// Frame-addressed model of a satellite geographic video, following the
// accepted EthniAfrica Vidéo carte 0.2.0-proposition (boards 3, 4 and 5) for
// the 12-second video, 0.3.0-proposition (boards 7 to 10) for a video
// chained in chapters, and 0.4.0-proposition (boards 11 to 14) for the
// chained video's « plein écran » layout, subtitle chunks, spoken-word
// highlight and areas that enter with the words naming them. Every value is
// a function of the frame number: no clock, no randomness.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FPS = 30;
export const TOTAL_FRAMES = 12 * FPS;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const SAFE_ZONE = { x: 120, y: 270, w: 840, h: 978 };
export const BUTTON_COLUMN = { x: 780, y: 840, w: 180, h: 408 };
export const MAP_WINDOW = { x: 120, y: 440, w: 840, h: 494 };
// Board 6: a camera pitched 58° above the horizon with a 40° field of
// view, heights exaggerated about 90 times. Only the camera moves: it tilts
// from straight down between 3 and 6 s; the relief itself never changes.
export const RELIEF = { exaggeration: 90, pitch: 58, fov: 40, tiltStart: 3 };

// 0.4.0 « plein écran » (board 11 · Full screen). The operator accepted that
// the apps cover the subtitle and the credits in the feed until the video is
// opened, so a chained video is checked against these bands, and the feed
// safe zone above is only a guide for it.
export const BANDS = {
  x: [60, 1020],
  // The design's table says « 100 to about 270 »; its own head (signature
  // 36, gap 12, title 84, gap 12, marker 32) ends at 276.
  head: [100, 276],
  names: [290, 1290],
  subtitle: { y: [1316, 1452], axis: 540, maxLineWidth: 900 },
  veil: 1540,
  credits: [1652, 1884],
};
// data/cameras-fullscreen.json: a more overhead camera whose target sits at
// y 880, the middle of the image in the clear, so the globe fills the frame.
export const FULLSCREEN = { pitch: 70, centreY: 880 };

// Only sources whose licence was checked on 11 October 2026
// (video-design-checks-2026-10-11.json) may be drawn.
export const IMAGERY = {
  "bmng-2004-07-topo-bathy": {
    credit: "NASA Earth Observatory",
    // The historical chapter's imagery line (board 10) needs the room.
    short: "NASA",
    file: "imagery/world.topo.bathy.200407.3x21600x10800.jpg",
    // Pixels around the Earth: the series map cards' scale limit (1.4.1).
    width: 21600,
    sha256: "d225f1f35a6448a4d1d8f6de6e48f3433e470085b70a35800e64f384f269a7b0",
  },
  "s2cloudless-2016": {
    credit: "Sentinel-2 cloudless 2016, EOX",
    attribution:
      "EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017)",
    file: null,
  },
};

function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const xAt = (t) => ((ax * t + bx) * t + cx) * t;
  const yAt = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Fixed-step bisection: identical results on every call and machine.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (xAt(mid) < x) lo = mid;
      else hi = mid;
    }
    return yAt((lo + hi) / 2);
  };
}

// Exported for the series video (series.mjs), whose subtitles fade as here.
export const enter = cubicBezier(0.2, 0, 0, 1);
export const leave = cubicBezier(0.4, 0, 1, 1);
const symmetric = cubicBezier(0.45, 0, 0.55, 1);
const descent = cubicBezier(0.45, 0, 0.15, 1);
const span = (t, start, duration, ease) => ease((t - start) / duration);

// The river timing is fitted to the accepted key frames: at 8 s the core is
// at 0.75 and the glow at 0.28 (37 % of its 0.75 ceiling).
const TIMING = {
  cameraEnd: 6,
  gradeStart: 5.6,
  gradeDuration: 1,
  coreStart: 6.4,
  fadeDuration: 2.4,
  glowDelay: 0.6,
  glowCeiling: 0.75,
  labelThreshold: 0.6,
  labelDuration: 0.5,
  placesStart: 6.6,
};

const fail = (message) => {
  throw new Error(message);
};
const nonEmpty = (value, what) =>
  typeof value === "string" && value.trim()
    ? value
    : fail(`${what} is required`);

function checkPoint([lon, lat], what) {
  if (
    !Number.isFinite(lon) ||
    !Number.isFinite(lat) ||
    Math.abs(lon) > 180 ||
    Math.abs(lat) > 90
  )
    fail(`${what} has an invalid coordinate`);
}

const MAX_NAMES = 6;
const NAME_KINDS = ["water", "region"];
const AREA_INKS = ["a", "b", "c"];

function checkLine(coordinates, what) {
  if (!Array.isArray(coordinates) || coordinates.length < 2)
    fail(`${what} needs at least two points`);
  coordinates.forEach((p) => checkPoint(p, what));
}

function checkRing(ring, what) {
  checkLine(ring, what);
  const [first, last] = [ring[0], ring.at(-1)];
  if (ring.length < 4 || first[0] !== last[0] || first[1] !== last[1])
    fail(`${what} needs a closed ring of at least four points`);
}

const polygonsOf = (geometry) =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

// The card grammar on imagery (board 2): certain areas filled, uncertain
// areas hatched, borders quiet or strong. Coastlines and lakes are never
// drawn: the imagery shows them.
const FEATURE_CHECKS = {
  river(f) {
    if (f.geometry?.type !== "LineString")
      fail(`Feature ${f.id} needs a LineString`);
    checkLine(f.geometry.coordinates, `Feature ${f.id}`);
  },
  area(f) {
    if (!AREA_INKS.includes(f.ink))
      fail(`Area ${f.id} needs a card ink: ${AREA_INKS.join(", ")}`);
    if (!["certain", "uncertain"].includes(f.certainty))
      fail(`Area ${f.id} needs a certainty: certain or uncertain`);
    if (!["Polygon", "MultiPolygon"].includes(f.geometry?.type))
      fail(`Area ${f.id} needs a Polygon or MultiPolygon`);
    for (const polygon of polygonsOf(f.geometry))
      for (const ring of polygon) checkRing(ring, `Area ${f.id}`);
  },
  border(f) {
    if (!["quiet", "strong"].includes(f.strength))
      fail(`Border ${f.id} needs a strength: quiet or strong`);
    const { type, coordinates } = f.geometry ?? {};
    const lines =
      type === "LineString"
        ? [coordinates]
        : type === "MultiLineString"
          ? coordinates
          : fail(`Border ${f.id} needs a LineString or MultiLineString`);
    lines.forEach((line) => checkLine(line, `Border ${f.id}`));
  },
};

// A feature is named on the map when it has a label point; in a chained
// video an area may go without one (it is then named by the legend only).
const hasMapName = (f) => f.kind !== "border" && !!f.labelAt;

// What one map state draws: the whole 12-second video, or one chapter.
function checkMapContent(input, { chained = false } = {}) {
  const ids = new Set();
  for (const f of input.features ?? []) {
    if (!Object.hasOwn(FEATURE_CHECKS, f.kind))
      fail(`Unsupported feature kind ${f.kind}`);
    nonEmpty(f.id, "Feature id");
    nonEmpty(f.name, `Feature ${f.id} name`);
    nonEmpty(f.source, `Feature ${f.id} source`);
    FEATURE_CHECKS[f.kind](f);
    if (f.kind !== "border" && (f.labelAt || !chained || f.kind !== "area"))
      checkPoint(f.labelAt ?? [NaN, NaN], `Feature ${f.id} label`);
    ids.add(f.id);
  }
  if ((input.features ?? []).filter((f) => f.plate).length > 1)
    fail("Only one feature carries the subject plate");
  for (const p of input.places ?? []) {
    nonEmpty(p.name, "Place name");
    checkPoint([p.lon, p.lat], `Place ${p.name}`);
  }
  for (const n of input.names ?? []) {
    if (!NAME_KINDS.includes(n.kind))
      fail(`Unknown name kind ${n.kind}; use ${NAME_KINDS.join(" or ")}`);
    nonEmpty(n.name, "Name");
    checkPoint([n.lon, n.lat], `Name ${n.name}`);
  }
  const nameCount =
    (input.features ?? []).filter(hasMapName).length +
    (input.places ?? []).length +
    (input.names ?? []).length +
    (input.outline ? 1 : 0);
  if (nameCount > MAX_NAMES)
    fail(`At most six names on screen; this sequence has ${nameCount}`);
  const legend = input.legend ?? [];
  if (legend.length < 1 || legend.length > 4)
    fail("A legend needs one to four items");
  const known = {
    feature: (v) => ids.has(v),
    name: (v) => (input.names ?? []).some((n) => n.name === v),
    place: (v) => (input.places ?? []).some((p) => p.name === v),
    outline: (v) => v === true && !!input.outline,
    approximate: (v) => v === true,
  };
  for (const item of legend) {
    nonEmpty(item.label, "Legend label");
    const refs = Object.keys(known).filter((k) => item[k] !== undefined);
    if (refs.length !== 1)
      fail(
        `Legend item ${item.label} points to one feature, name, place or outline, or says approximate`
      );
    if (!known[refs[0]](item[refs[0]]))
      fail(`Legend item points to unknown ${refs[0]} ${item[refs[0]]}`);
  }
  return ids;
}

function checkOpening(input) {
  const style = input.style ?? "flat";
  if (!["flat", "relief"].includes(style))
    fail(`Unknown style ${style}; use flat or relief`);
  if (!Object.hasOwn(IMAGERY, input.imagery ?? ""))
    fail(`Unverified imagery ${input.imagery}`);
  nonEmpty(input.title, "Title");
  const keys = input.camera ?? [];
  if (keys[0]?.at !== 0 || keys.at(-1)?.at !== TIMING.cameraEnd)
    fail(`Camera keys must run from 0 to ${TIMING.cameraEnd} s`);
  keys.forEach((k, i) => {
    checkPoint([k.lon, k.lat], `Camera key ${i}`);
    if (!(k.radius > 0)) fail(`Camera key ${i} needs a positive radius`);
    if (i && !(k.at > keys[i - 1].at)) fail("Camera keys must be in order");
  });
  checkPitch(keys.at(-1).pitch, "The opening's last camera key");
  return style;
}

function checkPitch(pitch, what) {
  if (pitch !== undefined && !(pitch > 0 && pitch <= 90))
    fail(`${what} needs a pitch between 0 and 90°`);
}

// `dir` resolves the files a chapter draws (outline, areas); it defaults to
// the working directory.
export function loadSequence(input, { dir } = {}) {
  const style = checkOpening(input);
  if (input.chapters) return loadChapters(input, style, dir);
  for (const part of ["carte", "periode", "source"])
    nonEmpty(input.caption?.[part], `Caption ${part}`);
  const ids = checkMapContent(input);
  if (input.highlight) {
    const { text, feature } = input.highlight;
    if (!input.title.includes(text ?? "\0") || !ids.has(feature))
      fail(
        "The title highlight needs a phrase of the title and a known feature"
      );
  }
  return { ...structuredClone(input), style, historical: !!input.historical };
}

const toRad = (deg) => (deg * Math.PI) / 180;

// Board 4 asks for one camera path that passes the 3 s key without stopping
// and lands softly at 6.0 s. A single cubic-bezier cannot share speed across
// the 3 s key, so each component follows a monotone cubic (Fritsch–Carlson):
// continuous speed, no overshoot, zero speed at the last key. The radius is
// interpolated in log so the descent feels constant in scale.
function monotoneCubic(times, values) {
  const n = times.length;
  const secants = [];
  for (let i = 0; i < n - 1; i++)
    secants.push((values[i + 1] - values[i]) / (times[i + 1] - times[i]));
  const slopes = [secants[0]];
  for (let i = 1; i < n - 1; i++) {
    const [a, b] = [secants[i - 1], secants[i]];
    slopes.push(a * b <= 0 ? 0 : (2 * a * b) / (a + b));
  }
  slopes.push(0);
  return (t) => {
    if (t >= times[n - 1]) return values[n - 1];
    let i = 0;
    while (t > times[i + 1]) i++;
    const h = times[i + 1] - times[i];
    const s = (t - times[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * values[i] +
      (s3 - 2 * s2 + s) * h * slopes[i] +
      (-2 * s3 + 3 * s2) * values[i + 1] +
      (s3 - s2) * h * slopes[i + 1]
    );
  };
}

const cameraPaths = new WeakMap();
function cameraAt(seq, t) {
  if (!cameraPaths.has(seq)) {
    const times = seq.camera.map((k) => k.at);
    cameraPaths.set(seq, {
      lon: monotoneCubic(
        times,
        seq.camera.map((k) => k.lon)
      ),
      lat: monotoneCubic(
        times,
        seq.camera.map((k) => k.lat)
      ),
      logRadius: monotoneCubic(
        times,
        seq.camera.map((k) => Math.log(k.radius))
      ),
    });
  }
  const end = seq.camera.at(-1);
  if (t >= TIMING.cameraEnd)
    return { lon: end.lon, lat: end.lat, radius: end.radius };
  const path = cameraPaths.get(seq);
  return {
    lon: path.lon(t),
    lat: path.lat(t),
    radius: Math.exp(path.logRadius(t)),
  };
}

// A chained video holds at the plein écran pitch unless its last opening
// key sets another; the 12-second video keeps board 6's 58°.
const openingPitch = (seq) =>
  seq.camera.at(-1).pitch ?? (seq.chapters ? FULLSCREEN.pitch : RELIEF.pitch);

function openingCamera(seq, t) {
  const camera = cameraAt(seq, t);
  if (seq.chapters) camera.centreY = FULLSCREEN.centreY;
  if (seq.style === "relief")
    camera.pitch =
      90 -
      (90 - openingPitch(seq)) *
        span(t, RELIEF.tiltStart, TIMING.cameraEnd - RELIEF.tiltStart, descent);
  return camera;
}

function checkFrame(frame, count) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= count)
    fail(`Frame ${frame} is outside 0–${count - 1}`);
}

export const frameCount = (seq) =>
  seq.chapters ? schedule(seq).total : TOTAL_FRAMES;

export function frameState(seq, frame) {
  checkFrame(frame, frameCount(seq));
  if (seq.chapters) return chapterFrameState(seq, frame);
  const t = frame / FPS;
  const core = span(t, TIMING.coreStart, TIMING.fadeDuration, symmetric);
  const glow =
    TIMING.glowCeiling *
    span(
      t,
      TIMING.coreStart + TIMING.glowDelay,
      TIMING.fadeDuration,
      symmetric
    );
  // A name starts once its feature reaches the threshold, never before.
  const labelStart =
    TIMING.coreStart + TIMING.fadeDuration * thresholdProgress();
  const features = {};
  const labels = {};
  for (const f of seq.features) {
    features[f.id] = f.kind === "river" ? { core, glow } : { opacity: core };
    if (f.kind !== "border")
      labels[f.id] = span(t, labelStart, TIMING.labelDuration, enter);
  }
  // Board 4 gives places and water names one track; region names join it.
  const nameOpacity = span(t, TIMING.placesStart, TIMING.labelDuration, enter);
  const places = {};
  for (const p of seq.places ?? []) places[p.name] = nameOpacity;
  const names = {};
  for (const n of seq.names ?? []) names[n.name] = nameOpacity;
  return {
    camera: openingCamera(seq, t),
    grade: span(t, TIMING.gradeStart, TIMING.gradeDuration, symmetric),
    features,
    labels,
    places,
    names,
    legend: seq.legend.map((item) => {
      const feature = features[item.feature];
      return feature.core ?? feature.opacity;
    }),
    text: { signature: 1, title: 1, caption: 1 },
    relief:
      seq.style === "relief" ? { exaggeration: RELIEF.exaggeration } : null,
  };
}

let threshold;
function thresholdProgress() {
  if (threshold === undefined) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (symmetric(mid) < TIMING.labelThreshold) lo = mid;
      else hi = mid;
    }
    threshold = hi;
  }
  return threshold;
}

// Two cameras share one convention: `radius` is the globe's scale in export
// pixels per Earth radius at the target, which sits at a fixed view centre.
// The flat style is orthographic, as in the design's render.py. A camera with
// a `pitch` is the relief's perspective camera, looking north; looking
// straight down it matches the orthographic globe near the target. A chained
// video's cameras carry `centreY`, the plein écran view centre.
export const VIEW_CENTRE = { x: 540, y: 690 };
export const viewCentre = (camera) => ({
  x: VIEW_CENTRE.x,
  y: camera.centreY ?? VIEW_CENTRE.y,
});

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const surface = (lon, lat) => {
  const [l, p] = [toRad(lon), toRad(lat)];
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
};

// Positions are in Earth radii, with the globe's centre at the origin.
export function tiltedCamera(camera) {
  const [l, p, pitch] = [
    toRad(camera.lon),
    toRad(camera.lat),
    toRad(camera.pitch),
  ];
  const up = surface(camera.lon, camera.lat);
  const north = [
    -Math.sin(p) * Math.sin(l),
    Math.cos(p),
    -Math.sin(p) * Math.cos(l),
  ];
  const focal = HEIGHT / 2 / Math.tan(toRad(RELIEF.fov / 2));
  const distance = focal / camera.radius;
  const [s, c] = [Math.sin(pitch), Math.cos(pitch)];
  const forward = up.map((u, i) => north[i] * c - u * s);
  const screenUp = up.map((u, i) => u * c + north[i] * s);
  return {
    focal,
    position: up.map((u, i) => u - distance * forward[i]),
    forward,
    screenUp,
    right: cross(forward, screenUp),
  };
}

// `height` raises the point above sea level, in Earth radii (relief only).
export function project(camera, lon, lat, height = 0) {
  const centre = viewCentre(camera);
  if (camera.pitch === undefined) {
    const [l, p] = [toRad(lon - camera.lon), toRad(lat)];
    const p0 = toRad(camera.lat);
    const cosC =
      Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    const x = Math.cos(p) * Math.sin(l);
    const y =
      Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
    return {
      x: centre.x + camera.radius * x,
      y: centre.y - camera.radius * y,
      visible: cosC > 0,
    };
  }
  const cam = tiltedCamera(camera);
  const normal = surface(lon, lat);
  const point = normal.map((n) => n * (1 + height));
  const view = point.map((v, i) => v - cam.position[i]);
  const depth = dot(view, cam.forward);
  return {
    x: centre.x + (cam.focal * dot(view, cam.right)) / depth,
    y: centre.y - (cam.focal * dot(view, cam.screenUp)) / depth,
    visible: depth > 0 && dot(normal, view) < 0,
  };
}

// The sea-level ground under a screen point, or null when it shows space.
export function unproject(camera, x, y) {
  const centre = viewCentre(camera);
  const toDegrees = ([px, py, pz]) => ({
    lon: (Math.atan2(px, pz) * 180) / Math.PI,
    lat: (Math.asin(Math.max(-1, Math.min(1, py))) * 180) / Math.PI,
  });
  if (camera.pitch === undefined) {
    const nx = (x - centre.x) / camera.radius;
    const ny = -(y - centre.y) / camera.radius;
    const rho = Math.hypot(nx, ny);
    if (rho >= 1) return null;
    const up = surface(camera.lon, camera.lat);
    const p = toRad(camera.lat);
    const l = toRad(camera.lon);
    const east = [Math.cos(l), 0, -Math.sin(l)];
    const north = [
      -Math.sin(p) * Math.sin(l),
      Math.cos(p),
      -Math.sin(p) * Math.cos(l),
    ];
    const depth = Math.sqrt(1 - rho * rho);
    return toDegrees(
      up.map((u, i) => u * depth + east[i] * nx + north[i] * ny)
    );
  }
  const cam = tiltedCamera(camera);
  const ray = cam.forward.map(
    (f, i) =>
      f +
      (cam.right[i] * (x - centre.x)) / cam.focal -
      (cam.screenUp[i] * (y - centre.y)) / cam.focal
  );
  const length = Math.hypot(...ray);
  const dir = ray.map((r) => r / length);
  const b = dot(cam.position, dir);
  const disc = b * b - (dot(cam.position, cam.position) - 1);
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return toDegrees(cam.position.map((c, i) => c + t * dir[i]));
}

export function captionLines(seq) {
  const { carte, periode, source } = seq.caption;
  let last = `Source : ${source} ; imagerie : ${IMAGERY[seq.imagery].credit}`;
  if (seq.historical) last += " ; l'imagerie montre le paysage actuel";
  return [
    `Carte : ${carte}`,
    `Période : ${periode}`,
    ...(seq.style === "relief" ? ["Relief : NOAA, exagéré"] : []),
    last,
  ];
}

// Width estimates per typeface (board 3 sizes), calibrated on the design
// fonts on 11 October 2026: Anton titles 0.39–0.42 em per character, Nunito
// Sans captions 0.41–0.46. The browser re-measures the real glyphs before
// export; this gate only catches layouts that cannot fit.
export const estimateWidth = (text, size, ratio) =>
  Math.ceil(text.length * size * ratio);

const textBox = (text, size, ratio, lineHeight) => {
  const lines = text.split("\n");
  return [
    Math.max(...lines.map((l) => estimateWidth(l, size, ratio))),
    lines.length * lineHeight,
  ];
};

// The subtitle's Nunito Sans 800 advances in em, measured in the pinned
// Chromium on 12 October 2026 and rounded up: a line of capitals is far
// wider than its character count says, which is what the 900 px rule
// catches. Accents are stripped before the lookup.
const SUBTITLE_ADVANCE = [
  [/[   ]/u, 0.28],
  [/[ijlI.,;:!'’|ʿ]/u, 0.3],
  [/[frt()[\]-]/u, 0.44],
  [/[mwM]/u, 0.92],
  [/W/u, 1.13],
  [/[ʾ«»]/u, 0.53],
  [/\p{Lu}/u, 0.8],
];
export function subtitleLineWidth(text) {
  let em = 0;
  for (const c of readable(text).normalize("NFD").replace(/\p{M}/gu, "")) {
    const found = SUBTITLE_ADVANCE.find(([pattern]) => pattern.test(c));
    em += found ? found[1] : 0.62;
  }
  return Math.ceil(em * SUBTITLE.size);
}

// The estimated layout of the hold: the last frame of a 12-second video, or
// chapter `index` of a chained one once it is fully drawn.
export function holdLayout(seq, index) {
  if (seq.chapters) return fullscreenLayout(seq, index);
  const camera = frameState(seq, TOTAL_FRAMES - 1).camera;
  const elements = [
    {
      id: "signature",
      kind: "signature",
      box: { x: 120, y: 290, w: 260, h: 36 },
    },
    {
      id: "title",
      kind: "title",
      box: { x: 120, y: 342, w: estimateWidth(seq.title, 76, 0.4), h: 80 },
    },
  ];
  for (const f of seq.features ?? []) {
    if (f.kind === "border") continue;
    const at = project(camera, ...f.labelAt);
    const [w, h] = f.plate
      ? // The subject's pill plate: Anton 38 px, 54 px tall, 22 px padding.
        [estimateWidth(f.name, 38, 0.45) + 44, 54]
      : f.kind === "area"
        ? [estimateWidth(f.name, 36, 0.45), 44]
        : textBox(f.name, 26, 0.55, 30);
    elements.push({
      id: f.plate ? f.id : f.name,
      kind: "label",
      box: { x: at.x - w / 2, y: at.y - h / 2, w, h },
    });
  }
  for (const n of seq.names ?? []) {
    const at = project(camera, n.lon, n.lat);
    // Water names: Nunito Sans 700 italic 26 px. Region names: Anton 52 px
    // tracked 0.12 em, with no plate, dot or outline to suggest a limit.
    const [w, h] =
      n.kind === "water"
        ? textBox(n.name, 26, 0.55, 30)
        : textBox(n.name, 52, 0.58, 60);
    elements.push({
      id: n.name,
      kind: "name",
      box: { x: at.x - w / 2, y: at.y - h / 2, w, h },
    });
  }
  for (const p of seq.places ?? [])
    elements.push({ id: p.name, kind: "place", box: placeBox(camera, p) });
  const lines = captionLines(seq);
  const captionHeight = lines.length * 28;
  const captionY = 1240 - captionHeight;
  const legendRows = Math.ceil(seq.legend.length / 2);
  const legendHeight = legendRows * 36;
  elements.push(
    {
      id: "legend",
      kind: "legend",
      box: {
        x: 120,
        y: captionY - 12 - legendHeight,
        w: Math.max(
          ...seq.legend.map((i) => 56 + estimateWidth(i.label, 26, 0.5))
        ),
        h: legendHeight,
      },
    },
    {
      id: "caption",
      kind: "caption",
      box: {
        x: 120,
        y: captionY,
        w: Math.max(...lines.map((l) => estimateWidth(l, 22, 0.47))),
        h: captionHeight,
      },
    }
  );
  return { frame: "feed", camera, elements, captionLines: lines };
}

export function placeBox(camera, p, place = project) {
  const at = place(camera, p.lon, p.lat);
  const w = estimateWidth(p.name, 28, 0.58);
  const x = p.side === "left" ? at.x - 14 - w : at.x + 14;
  return { x, y: at.y - 17, w, h: 34 };
}

// Chapter `index` of a chained video in the plein écran layout, fully drawn,
// with every chunk of its subtitles in the band.
function fullscreenLayout(seq, index) {
  const chapter = seq.chapters[index];
  if (!chapter) fail(`No chapter ${index}`);
  const c = schedule(seq).chapters[index];
  const { camera } = c;
  const [x0, x1] = BANDS.x;
  const elements = [
    {
      id: "signature",
      kind: "signature",
      box: { x: x0, y: BANDS.head[0], w: 260, h: 36 },
    },
    {
      id: "title",
      kind: "title",
      box: {
        x: x0,
        y: BANDS.head[0] + 48,
        w: estimateWidth(seq.title, TITLE.size, 0.4),
        h: TITLE.lineHeight,
      },
    },
  ];
  if (seq.chapters.length >= MARKER_FROM)
    elements.push({
      id: "marker",
      kind: "marker",
      box: {
        x: x0,
        y: BANDS.head[0] + 144,
        w:
          seq.chapters.length * 34 +
          8 +
          estimateWidth(markerLine(chapter, index), 26, 0.5),
        h: 32,
      },
    });
  const places = (chapter.places ?? []).map((p) => ({
    id: p.name,
    kind: "place",
    box: placeBox(camera, p),
  }));
  const specs = chapterLabels(seq, index);
  const placed = placeLabels(
    specs.map((l) => ({ ...l, anchor: project(camera, ...l.lonLat) })),
    places.map((p) => p.box)
  );
  placed.forEach((p, i) => {
    if (p.box)
      elements.push({ id: specs[i].text, kind: specs[i].kind, box: p.box });
  });
  elements.push(...places);
  // The band centres one line, or holds two.
  for (const chunk of c.chunks)
    chunk.lines.forEach((line, i) => {
      const text = line.map((r) => r.text).join("");
      const w = subtitleLineWidth(text);
      const top =
        BANDS.subtitle.y[0] +
        (BANDS.subtitle.y[1] -
          BANDS.subtitle.y[0] -
          chunk.lines.length * SUBTITLE.lineHeight) /
          2;
      elements.push({
        id: `subtitle « ${text} »`,
        kind: "subtitle",
        box: {
          x: BANDS.subtitle.axis - w / 2,
          y: top + i * SUBTITLE.lineHeight,
          w,
          h: SUBTITLE.lineHeight,
        },
      });
    });
  const lines = chapterCaptionLines(seq, chapter).map(
    ({ label, text }) => `${label} : ${text}`
  );
  const captionHeight = lines.length * 28;
  const captionY = BANDS.credits[1] - captionHeight;
  // Legend items wrap in rows of the credits' width, 28 px apart.
  const legendLabels = [
    ...chapter.legend.map((item) => item.label),
    ...placed.filter((p) => !p.box).map((p) => p.text),
  ];
  let rows = 1;
  let rowWidth = 0;
  let widest = 0;
  for (const label of legendLabels) {
    const w = 46 + estimateWidth(label, 24, 0.5);
    if (rowWidth && rowWidth + 28 + w > x1 - x0) {
      rows++;
      rowWidth = w;
    } else rowWidth += (rowWidth ? 28 : 0) + w;
    widest = Math.max(widest, rowWidth);
  }
  const legendHeight = rows * 32 + (rows - 1) * 10;
  elements.push(
    {
      id: "legend",
      kind: "legend",
      box: {
        x: x0,
        y: captionY - 14 - legendHeight,
        w: widest,
        h: legendHeight,
      },
    },
    {
      id: "caption",
      kind: "caption",
      box: {
        x: x0,
        y: captionY,
        w: Math.max(...lines.map((l) => estimateWidth(l, 22, 0.47))),
        h: captionHeight,
      },
    }
  );
  return { frame: "fullscreen", camera, elements, captionLines: lines };
}

const overlaps = (a, b, margin = 0) =>
  a.x < b.x + b.w + margin &&
  a.x + a.w + margin > b.x &&
  a.y < b.y + b.h + margin &&
  a.y + a.h + margin > b.y;

// `layout.frame` says which gate applies: the feed safe zone for the
// 12-second video, the plein écran bands for a chained one. `elements` are
// estimated boxes before rendering, or the browser's glyph boxes after.
export function checkLayout(layout) {
  return layout.frame === "fullscreen"
    ? checkBands(layout.elements)
    : checkSafeZone(layout.elements);
}

function checkSafeZone(elements) {
  const problems = [];
  const s = SAFE_ZONE;
  for (const { id, box } of elements) {
    if (
      box.x < s.x ||
      box.y < s.y ||
      box.x + box.w > s.x + s.w ||
      box.y + box.h > s.y + s.h
    )
      problems.push(`${id} leaves the safe zone`);
    else if (overlaps(box, BUTTON_COLUMN))
      problems.push(`${id} enters the TikTok button column`);
  }
  return problems;
}

const BAND_OF = {
  signature: "head",
  title: "head",
  marker: "head",
  label: "names",
  name: "names",
  place: "names",
  closing: "names",
  legend: "credits",
  caption: "credits",
};
const NAME_KINDS_ON_MAP = ["label", "name", "place"];
// Browser boxes are fractional; half a pixel is antialiasing, not a fault.
const EPSILON = 0.5;

function checkBands(elements) {
  const problems = [];
  const [x0, x1] = BANDS.x;
  for (const { id, kind, box } of elements) {
    if (box.x < x0 - EPSILON || box.x + box.w > x1 + EPSILON)
      problems.push(`${id} leaves the band x ${x0}–${x1}`);
    if (kind === "subtitle") {
      const [top, bottom] = BANDS.subtitle.y;
      if (box.y < top - EPSILON || box.y + box.h > bottom + EPSILON)
        problems.push(`${id} leaves the subtitle band`);
      if (Math.abs(box.x + box.w / 2 - BANDS.subtitle.axis) > 1)
        problems.push(`${id} is not centred on x ${BANDS.subtitle.axis}`);
      if (box.w > BANDS.subtitle.maxLineWidth + EPSILON)
        problems.push(
          `${id} is wider than ${BANDS.subtitle.maxLineWidth} px: it needs two lines`
        );
      continue;
    }
    const band = BAND_OF[kind];
    if (!band) continue;
    const [top, bottom] = BANDS[band];
    if (box.y < top - EPSILON || box.y + box.h > bottom + EPSILON)
      problems.push(`${id} leaves the ${band} band`);
    if (kind === "caption" && Math.abs(box.y + box.h - bottom) > 1)
      problems.push(`${id} is not bottom aligned at y ${bottom}`);
  }
  const names = elements.filter((e) => NAME_KINDS_ON_MAP.includes(e.kind));
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++)
      if (overlaps(names[i].box, names[j].box))
        problems.push(`${names[i].id} and ${names[j].id} overlap`);
  return problems;
}

// Map names are placed in entry order by one deterministic rule (0.4.0,
// board 13): candidates around the anchor in a fixed order, at the largest
// size first; a box must stay in the names band and keep 12 px from every
// obstacle and earlier name; it may slide sideways by up to a third of its
// width to stay in; with no room it goes to the legend as text.
const LABEL_CLEARANCE = 12;
const LABEL_STYLES = {
  // Anton tracked 0.12 em, cream: a region known today.
  region: {
    sizes: [44, 40, 36],
    box: (t, s) => [estimateWidth(t, s, 0.58), s + 8],
  },
  // An area's name: Nunito Sans 700 in its ink.
  area: {
    sizes: [30, 28],
    box: (t, s) => [estimateWidth(t, s, 0.55), s + 6],
  },
  // A source's own term, set in italic: only when the sequence says the
  // name quotes the source, never inferred from a category, because a
  // paraphrase must not look like a quotation.
  quoted: {
    sizes: [30, 28],
    box: (t, s) => [estimateWidth(t, s, 0.55), s + 6],
  },
  water: { sizes: [26], box: (t, s) => textBox(t, s, 0.55, s + 4) },
  // The name over « contour reconstitué » in 20/24.
  outline: {
    sizes: [30],
    box: (t, s) => [
      Math.max(
        estimateWidth(t, s, 0.55),
        estimateWidth(OUTLINE_LABEL, 20, 0.55)
      ),
      58,
    ],
  },
  plate: { sizes: [38], box: (t, s) => [estimateWidth(t, s, 0.45) + 44, 54] },
};

// The series video (Cartes 1.4.1) places its map names by the same rule in
// its own band and sizes: `band` and `styles` replace the satellite video's.
export function placeLabels(
  labels,
  obstacles,
  { band = { x: BANDS.x, y: BANDS.names }, styles = LABEL_STYLES } = {}
) {
  const regions = labels.filter((l) => l.style === "region").length;
  const [x0, x1] = band.x;
  const [y0, y1] = band.y;
  const placed = [];
  for (const label of labels) {
    const style = styles[label.style];
    let sizes = style.sizes;
    // Two region names or more start one step smaller.
    if (label.style === "region" && regions > 1) sizes = sizes.slice(1);
    let found = null;
    for (const size of sizes) {
      const [w, h] = style.box(label.text, size);
      const candidates = [
        [0, 0],
        [0, 0.8 * h],
        [0, -0.8 * h],
        [-0.3 * w, 0],
        [0.3 * w, 0],
        [-0.6 * w, 0],
        [0.6 * w, 0],
        [0, 1.6 * h],
        [0, -1.6 * h],
        [-0.6 * w, 0.8 * h],
        [0.6 * w, 0.8 * h],
        [-0.6 * w, -0.8 * h],
        [0.6 * w, -0.8 * h],
      ];
      for (const [index, [dx, dy]] of candidates.entries()) {
        const box = {
          x: label.anchor.x + dx - w / 2,
          y: label.anchor.y + dy - h / 2,
          w,
          h,
        };
        if (box.x + w > x1 && box.x + w - x1 <= w / 3) box.x = x1 - w;
        if (box.x < x0 && x0 - box.x <= w / 3) box.x = x0;
        const inside =
          box.x >= x0 && box.x + w <= x1 && box.y >= y0 && box.y + h <= y1;
        const clear = [...obstacles, ...placed.map((p) => p.box)].every(
          (o) => !o || !overlaps(box, o, LABEL_CLEARANCE)
        );
        if (inside && clear) {
          found = {
            key: label.key,
            text: label.text,
            size,
            box,
            candidate: index,
          };
          break;
        }
      }
      if (found) break;
    }
    placed.push(
      found ?? {
        key: label.key,
        text: label.text,
        size: null,
        box: null,
        candidate: null,
      }
    );
  }
  return placed;
}

// Chained chapters (0.3.0-proposition, boards 7 to 10): one opening, then
// one to five chapters on the same frame, each one map state with its own
// line under the title and its subtitle chunks, then an ending.

const MAX_CHAPTERS = 5;
const MARKER_FROM = 3;
const OUTLINE_LABEL = "contour reconstitué";
const HISTORICAL_NOTE = "l'imagerie montre le paysage actuel";
const SITE_ADDRESS = "ETHNIAFRICA.COM";
const MARKER_INKS = { done: "#a8977f", current: "#e8b96a", next: "#4a3c2c" };
const TITLE = { size: 80, lineHeight: 84 };
// Nunito Sans 800 56/68 on the image (0.4.0).
export const SUBTITLE = { size: 56, lineHeight: 68 };

// Board 8's tables and 0.4.0's timing.md in frames. Integers keep every
// chapter on the design's 0.1 s grid, however many are chained.
const STEP = {
  firstChapter: 192,
  shortEntry: 9,
  overlayEntry: 18,
  namesDelay: 12,
  namesEntry: 15,
  firstSubtitle: 27,
  fade: 6,
  sentenceGap: 9,
  exit: 12,
  empty: 6,
  grade: 18,
  minHold: 180,
  closingIn: 15,
  closingHold: 75,
  // An entry named by a chunk (0.4.0 timing.md §3).
  entryGap: 21,
  entryNameDelay: 9,
  entryName: 12,
  afterEntries: 9,
};
const TRAVEL = { min: 54, max: 72, usual: 54 };
// Earlier areas of the chapter ease down to this opacity when a new one
// enters (operator, 12 October 2026: smooth, never a jump).
const STEP_DOWN = 0.55;

const ARABIC_RUN = /\p{Script=Arabic}+/gu;
const HAS_ARABIC = /\p{Script=Arabic}/u;
const graphemes = new Intl.Segmenter("fr", { granularity: "grapheme" });

// `*word*` sets a transcribed word in italic; the markers are not read.
const readable = (text) => text.normalize("NFC").replaceAll("*", "");

export const subtitleCharacters = (text) =>
  [...graphemes.segment(readable(text))].length;

// Full opacity in tenths of a second (0.4.0 timing.md §1): characters ÷ 15,
// plus 0.3 s for the first chunk after an empty band, between 1.2 and 4 s,
// and at least 0.3 s after the chunk's last entry ends, rounded up. The
// clamp comes before the entry rule, as in the design's timeline4.py.
function readingTenths(characters, afterEmptyBand, entriesEndFrames) {
  const reading = Math.ceil((2 * characters + (afterEmptyBand ? 9 : 0)) / 3);
  const entries = Math.ceil(entriesEndFrames / 3) + STEP.afterEntries / 3;
  return Math.max(Math.min(40, Math.max(12, reading)), entries);
}

// `entriesEnd`: seconds from the chunk's first frame to the end of its last
// entry.
export const readingSeconds = (
  characters,
  { afterEmptyBand = false, entriesEnd = 0 } = {}
) =>
  readingTenths(characters, afterEmptyBand, Math.round(entriesEnd * FPS)) / 10;

function subtitleRuns(text) {
  const parts = text.normalize("NFC").split("*");
  if (parts.length % 2 === 0) fail(`Unclosed italic marker in « ${text} »`);
  const runs = [];
  parts.forEach((part, i) => {
    if (i % 2) {
      if (HAS_ARABIC.test(part))
        fail(`Arabic script is never set in italic: « ${text} »`);
      if (part) runs.push({ text: part, italic: true });
      return;
    }
    let at = 0;
    for (const m of part.matchAll(ARABIC_RUN)) {
      if (m.index > at) runs.push({ text: part.slice(at, m.index) });
      runs.push({ text: m[0], arabic: true });
      at = m.index + m[0].length;
    }
    if (at < part.length) runs.push({ text: part.slice(at) });
  });
  // Board 9: the word in Arabic script follows its italic transcription,
  // in parentheses: *ṣaḥrāʾ* (صحراء).
  runs.forEach((run, i) => {
    if (
      run.arabic &&
      !(
        runs[i - 2]?.italic &&
        /^[  ]\($/.test(runs[i - 1].text) &&
        runs[i + 1]?.text.startsWith(")")
      )
    )
      fail(
        `Arabic script goes in parentheses right after its italic transcription: « ${text} »`
      );
  });
  return runs;
}

function sliceRuns(runs, from, to) {
  const out = [];
  let start = 0;
  for (const run of runs) {
    const end = start + run.text.length;
    if (from < end && to > start)
      out.push({
        ...run,
        text: run.text.slice(Math.max(from, start) - start, to - start),
      });
    start = end;
  }
  return out;
}

// Highlight units (0.4.0 board 12): a word with its attached punctuation and
// guillemets, a number written with a space, a transcription with its
// Arabic script. Ranges are code-unit offsets in the readable text.
function unitRanges(whole) {
  const units = [];
  let opening = null;
  for (const m of whole.matchAll(/[^   ]+/gu)) {
    const [start, end, token] = [m.index, m.index + m[0].length, m[0]];
    const last = units.at(-1);
    const wordy = /[\p{L}\p{N}]/u.test(token);
    if (!wordy && /^[«(“‹[]+$/u.test(token)) opening ??= start;
    else if (!wordy && last) last.end = end;
    else if (last && /^\(\p{Script=Arabic}/u.test(token)) last.end = end;
    else if (
      last &&
      /^\d+$/.test(whole.slice(last.start, last.end)) &&
      /^\d{3}(?!\d)/.test(token)
    )
      last.end = end;
    else {
      units.push({ start: opening ?? start, end });
      opening = null;
    }
  }
  if (opening !== null && units.length) units.at(-1).end = whole.length;
  return units;
}

const wholeText = (text) =>
  subtitleRuns(text)
    .map((r) => r.text)
    .join("");

export const chunkUnits = (text) => {
  const whole = wholeText(text);
  return unitRanges(whole).map((u) => whole.slice(u.start, u.end));
};

// Words as timeline.json counts them: the units, except that the Arabic
// script beside its transcription counts as a word of its own. rules.md
// says the group « counts as one word », but the accepted example's chunk
// « ṣaḥrāʾ (صحراء), « désert ». » has 3 words in timeline.json, which the
// one-word reading would refuse; timeline.json decides.
export const chunkWords = (text) => {
  const units = chunkUnits(text);
  return units.length + units.filter((u) => HAS_ARABIC.test(u)).length;
};

const LINE_CHARS = 26;
const MIN_WORDS = 3;
const MAX_WORDS = 6;

const lineFits = (text) =>
  subtitleCharacters(text) <= LINE_CHARS &&
  subtitleLineWidth(text) <= BANDS.subtitle.maxLineWidth;

// Runs of [from, to), split at unit edges and tagged with their unit, so the
// highlight can find a unit's runs; the spaces between units carry none.
function unitRuns(runs, units, from, to) {
  const edges = new Set([from, to]);
  for (const u of units)
    for (const edge of [u.start, u.end])
      if (edge > from && edge < to) edges.add(edge);
  const points = [...edges].sort((a, b) => a - b);
  const out = [];
  for (let k = 0; k < points.length - 1; k++) {
    const unit = units.findIndex(
      (u) => u.start <= points[k] && points[k] < u.end
    );
    for (const run of sliceRuns(runs, points[k], points[k + 1]))
      out.push(unit < 0 ? run : { ...run, unit });
  }
  return out;
}

// One line when it fits; else two balanced lines broken at a plain space
// between units, after a comma when possible (timeline4.py's score). A
// no-break space never breaks, so the text keeps a number and its unit, a
// phrase in guillemets or « vers » and its year together; a transcription
// with its Arabic script takes a line of its own.
export function chunkLines(text) {
  const runs = subtitleRuns(text);
  const whole = runs.map((r) => r.text).join("");
  const units = unitRanges(whole);
  const words = chunkWords(text);
  if (words < MIN_WORDS || words > MAX_WORDS)
    fail(`A chunk holds 3 to 6 words; « ${whole} » has ${words}`);
  const line = (from, to) => unitRuns(runs, units, from, to);
  if (lineFits(whole)) return [line(0, whole.length)];
  const arabic = units.find((u) =>
    HAS_ARABIC.test(whole.slice(u.start, u.end))
  );
  let best = null;
  let blockedByArabic = false;
  for (let k = 0; k < units.length - 1; k++) {
    const at = units[k].end;
    if (whole[at] !== " " || units[k + 1].start !== at + 1) continue;
    const [first, second] = [whole.slice(0, at), whole.slice(at + 1)];
    if (!lineFits(first) || !lineFits(second)) continue;
    if (
      arabic &&
      !(
        (arabic.start === 0 && arabic.end === at) ||
        (arabic.start === at + 1 && arabic.end === whole.length)
      )
    ) {
      blockedByArabic = true;
      continue;
    }
    const score =
      Math.abs(subtitleCharacters(first) - subtitleCharacters(second)) -
      (first.endsWith(",") ? 8 : 0);
    if (!best || score < best.score) best = { at, score };
  }
  if (!best)
    fail(
      blockedByArabic
        ? `« ${whole} »: the transcription and its Arabic script need their own line`
        : `No line break keeps « ${whole} » within 26 characters and 900 px a line`
    );
  return [line(0, best.at), line(best.at + 1, whole.length)];
}

// The spoken-word highlight (0.4.0 timing.md §2), as a pure function of the
// time t in seconds since the chunk's clock origin: the unit whose box is on
// screen, or null. `words` are the voice's word times, one per unit.
const PAUSE = 0.35;
const AFTER_WORD = 0.1;
const NUDGE = 1e-9;
export function highlightAt(words, t) {
  for (let i = 0; i < words.length; i++) {
    const next = words[i + 1];
    const until =
      next && next.start - words[i].end < PAUSE - NUDGE
        ? next.start
        : words[i].end + AFTER_WORD;
    if (t >= words[i].start - NUDGE && t < until - NUDGE) return i;
  }
  return null;
}

// With a voice, a chunk appears 150 ms before its first word.
export const voicedChunkStart = (words) =>
  Math.round((words[0].start - 0.15) * 1e6) / 1e6;

// Spaces of any kind compare equal: a hand-made alignment may write a
// plain space where the subtitle keeps a no-break one.
const sameText = (a, b) =>
  typeof a === "string" &&
  a.normalize("NFC").replace(/\s+/gu, " ").trim() ===
    b.normalize("NFC").replace(/\s+/gu, " ").trim();

// One word time per unit, in order, inside the audio. A word that carries
// its `spoken` form (« sahrâ » for *ṣaḥrāʾ* (صحراء)) is matched by its
// place only, since the voice did not say the screen text.
export function checkWordTimes(text, words, { duration = Infinity } = {}) {
  const units = chunkUnits(text);
  if (words.length !== units.length)
    fail(
      `« ${text} » has ${units.length} units; the voice gives ${words.length} word times`
    );
  words.forEach((w, i) => {
    if (w.spoken === undefined && !sameText(w.text, units[i]))
      fail(
        `« ${text} »: word ${i + 1} of the voice is « ${w.text} », the chunk shows « ${units[i]} »`
      );
    if (
      !Number.isFinite(w.start) ||
      !(w.end >= w.start) ||
      (i && w.start < words[i - 1].start)
    )
      fail(`Word times of « ${text} » must be in order`);
    if (w.start < 0 || w.end > duration + 1e-6)
      fail(`Word times of « ${text} » leave the audio, 0 to ${duration} s`);
  });
}

// Arabic script once per video, for the word under discussion only: never in
// a title, a caption or a name.
function checkArabic(input) {
  let count = 0;
  const walk = (value, path) => {
    if (typeof value === "string") {
      if (!HAS_ARABIC.test(value)) return;
      if (
        !/^(chapters\.\d+|intro|outro)\.sentences\.\d+\.\d+(\.text)?$/.test(
          path
        )
      )
        fail(`Arabic script is allowed in a subtitle only, not in ${path}`);
      count += [...value.matchAll(ARABIC_RUN)].length;
    } else if (value && typeof value === "object")
      for (const [key, inner] of Object.entries(value))
        walk(inner, path ? `${path}.${key}` : key);
  };
  walk(input, "");
  if (count > 1)
    fail("Arabic script appears once per video, for the word under discussion");
}

function readGeoJson(file, what, dir) {
  const path =
    dir instanceof URL ? new URL(file, dir) : resolve(dir ?? ".", file);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return fail(`${what}: cannot read ${file} (${error.message})`);
  }
}

// A past shoreline is drawn only from documented geometry: an elevation
// contour at the level a published study gives (board 10), never freehand.
function loadOutline(outline, what, input, dir) {
  nonEmpty(outline.name, `${what} name`);
  nonEmpty(outline.file, `${what} file`);
  nonEmpty(outline.source, `${what} source`);
  nonEmpty(outline.study, `${what} study`);
  nonEmpty(outline.elevationModel, `${what} elevation model`);
  if (!Number.isFinite(outline.levelMetres))
    fail(`${what} needs the shoreline level in metres`);
  checkPoint(outline.labelAt ?? [NaN, NaN], `${what} label`);
  if (outline.illustrative && !input.demo)
    fail(`${what} is illustrative: it belongs in a demo sequence only`);
  const geojson = readGeoJson(outline.file, what, dir);
  const feature =
    geojson.type === "FeatureCollection" && geojson.features.length === 1
      ? geojson.features[0]
      : geojson;
  if (/mockup/i.test(feature.properties?.status ?? ""))
    fail(`${what}: ${outline.file} is marked as a mockup and is never drawn`);
  const geometry = feature.type === "Feature" ? feature.geometry : feature;
  if (geometry?.type === "LineString") checkLine(geometry.coordinates, what);
  else if (geometry?.type === "Polygon")
    geometry.coordinates.forEach((ring) => checkRing(ring, what));
  else fail(`${what} needs a LineString or Polygon`);
  return { ...structuredClone(outline), geometry };
}

// An area a chapter draws comes from a GeoJSON file that records where it
// comes from, like the Mega-Chad contour: a Feature, or a FeatureCollection
// with its properties at the top level. `kind` says whether it is drawn as
// approximate (hatched) or certain (filled). A designer's mockup or a
// placeholder is drawn only in a demo that marks it illustrative.
const AREA_PROVENANCE = [
  "name",
  "kind",
  "category",
  "source",
  "citation",
  "derivation",
  "licence",
];
function loadArea(area, what, input, dir) {
  nonEmpty(area.file, `${what} file`);
  const geojson = readGeoJson(area.file, what, dir);
  const properties = geojson.properties ?? {};
  const mockup =
    properties.mockup === true ||
    /mockup|placeholder/i.test(properties.status ?? "");
  if (mockup && !(input.demo && area.illustrative === true))
    fail(
      `${what}: ${area.file} is a mockup; it is drawn only in a demo that marks it illustrative`
    );
  if (area.illustrative && !input.demo)
    fail(`${what} is illustrative: it belongs in a demo sequence only`);
  for (const field of AREA_PROVENANCE)
    nonEmpty(properties[field], `${what} ${field} (${area.file})`);
  if (!["approximate", "certain"].includes(properties.kind))
    fail(`${what}: kind is approximate or certain, not ${properties.kind}`);
  const parts =
    geojson.type === "FeatureCollection" ? geojson.features : [geojson];
  const polygons = parts.flatMap((part) => {
    const geometry = part.type === "Feature" ? part.geometry : part;
    if (!["Polygon", "MultiPolygon"].includes(geometry?.type))
      fail(`${what}: ${area.file} needs Polygon or MultiPolygon geometry`);
    return polygonsOf(geometry);
  });
  return {
    ...structuredClone(area),
    name: area.name ?? properties.name,
    source: properties.source,
    certainty: properties.kind === "certain" ? "certain" : "uncertain",
    category: properties.category,
    mockup,
    geometry:
      polygons.length === 1
        ? { type: "Polygon", coordinates: polygons[0] }
        : { type: "MultiPolygon", coordinates: polygons },
  };
}

// Even-odd ray casting over every ring of an area.
function insideArea([lon, lat], area) {
  let inside = false;
  for (const polygon of polygonsOf(area.geometry))
    for (const ring of polygon)
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (
          yi > lat !== yj > lat &&
          lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
        )
          inside = !inside;
      }
  return inside;
}

// An area that lies inside an earlier one is hatched at 135° so the overlap
// reads as crossing. « Inside » is most of its outline's vertices: bands
// that only share an edge with their neighbour stay at 45°.
function hatchAngle(area, earlier) {
  const vertices = polygonsOf(area.geometry).flatMap((polygon) =>
    polygon[0].slice(1)
  );
  const nested = earlier.some(
    (other) =>
      vertices.filter((v) => insideArea(v, other)).length > vertices.length / 2
  );
  return nested ? 135 : 45;
}

// What a chunk may name in its chapter: an overlay (area, river, outline),
// which enters whole, or a name (region, water, place).
function entryTargets(content) {
  const targets = new Map();
  for (const f of content.features ?? [])
    if (f.kind !== "border") targets.set(f.id, "overlay");
  if (content.outline) targets.set(content.outline.name, "overlay");
  for (const n of content.names ?? []) targets.set(n.name, "name");
  for (const p of content.places ?? []) targets.set(p.name, "name");
  return targets;
}

function loadSentences(chapter, content, what) {
  const sentences = chapter.sentences;
  if (
    !Array.isArray(sentences) ||
    !sentences.length ||
    sentences.some((s) => !Array.isArray(s) || !s.length)
  )
    fail(`${what} needs sentences of at least one chunk each`);
  const targets = entryTargets(content);
  const named = new Set();
  return sentences.map((sentence) =>
    sentence.map((chunk) => {
      const { text, enters = [] } =
        typeof chunk === "string" ? { text: chunk } : chunk;
      nonEmpty(text, `${what} chunk`);
      chunkLines(text);
      for (const ref of enters) {
        if (!targets.has(ref))
          fail(
            `${what}: « ${text} » names ${ref}, which the chapter does not draw`
          );
        if (named.has(ref)) fail(`${what}: ${ref} enters once`);
        named.add(ref);
      }
      return { text, enters: [...enters] };
    })
  );
}

function loadChapters(input, style, dir) {
  const chapters = input.chapters;
  if (
    !Array.isArray(chapters) ||
    chapters.length < 1 ||
    chapters.length > MAX_CHAPTERS
  )
    fail("A chained video has one to five chapters");
  for (const part of ["intro", "outro"])
    if (input[part] !== undefined && input.voice === undefined)
      fail(`The ${part} is spoken: it needs a voice`);
  // Board 7: the marker sits in the title band only under a one-line title.
  if (
    chapters.length >= MARKER_FROM &&
    (input.title.includes("\n") ||
      estimateWidth(input.title, TITLE.size, 0.4) > BANDS.x[1] - BANDS.x[0])
  )
    fail("With a chapter marker, the title must hold on one line");
  checkArabic(input);
  if (input.highlight && !input.title.includes(input.highlight.text ?? "\0"))
    fail("The title highlight needs a phrase of the title");
  const loaded = chapters.map((chapter, i) => {
    const what = `Chapter ${i + 1}`;
    nonEmpty(chapter.title, `${what} title`);
    for (const part of ["carte", "periode", "source"])
      nonEmpty(chapter.caption?.[part], `${what} caption ${part}`);
    if (chapter.camera) {
      if (i === 0)
        fail("Chapter 1 starts where the opening lands; it cannot move");
      const { lon, lat, radius, travel = TRAVEL.usual / FPS } = chapter.camera;
      checkPoint([lon, lat], `${what} camera`);
      if (!(radius > 0)) fail(`${what} camera needs a positive radius`);
      checkPitch(chapter.camera.pitch, `${what} camera`);
      const frames = travel * FPS;
      if (
        Math.abs(frames - Math.round(frames)) > 1e-6 ||
        frames < TRAVEL.min ||
        frames > TRAVEL.max
      )
        fail(`${what} camera travel lasts 1.8 to 2.4 s, in whole frames`);
    }
    const outline =
      chapter.outline &&
      loadOutline(chapter.outline, `${what} outline`, input, dir);
    const features = (chapter.features ?? []).map((f) =>
      f.kind === "area"
        ? loadArea(f, `${what} area ${f.id}`, input, dir)
        : structuredClone(f)
    );
    const content = { ...chapter, features, outline };
    checkMapContent(content, { chained: true });
    for (const f of features)
      if (
        f.label !== undefined &&
        !["area", "quoted", "region"].includes(f.label)
      )
        fail(`${what} feature ${f.id} label is area, quoted or region`);
    // 0.4.0: a reconstruction is hatched, and the legend says so.
    if (
      features.some((f) => f.kind === "area" && f.certainty === "uncertain") &&
      !chapter.legend.some((item) => item.approximate)
    )
      fail(
        `${what} draws an approximate area: its legend needs « Zone approximative »`
      );
    const sentences = loadSentences(chapter, content, what);
    // Hatch angles follow entry order: an area named later that lies inside
    // an earlier one crosses its hatching.
    const entered = sentences.flat().flatMap((chunk) => chunk.enters);
    const order = features
      .filter((f) => f.kind === "area")
      .sort((a, b) => entered.indexOf(a.id) - entered.indexOf(b.id));
    order.forEach((area, k) => {
      area.hatch = hatchAngle(area, order.slice(0, k));
    });
    return {
      ...structuredClone(chapter),
      features,
      sentences,
      ...(outline && { outline }),
    };
  });
  const ending = input.ending;
  if (!["A", "B"].includes(ending?.variant))
    fail("A chained video needs an ending: variant A or B");
  if (ending.variant === "A") {
    if (ending.pageOnline !== true)
      fail("Ending A needs the subject's page online; use ending B until then");
    nonEmpty(ending.sentence, "Ending A sentence");
    // « home » invites to the whole site (operator, 12 October 2026), so the
    // sentence promises no subject page; left out, the page is the subject's.
    if (ending.page !== undefined && ending.page !== "home")
      fail(
        `Ending A's page is "home", or left out for the subject's page, not ${ending.page}`
      );
  } else if (ending.sentence !== undefined || ending.page !== undefined)
    fail("Ending B carries the signature and slogan only");
  const spoken = (part) =>
    input[part] && {
      sentences: loadSentences(input[part], {}, `The ${part}`),
    };
  const [intro, outro] = [spoken("intro"), spoken("outro")];
  const voice =
    input.voice !== undefined &&
    loadVoice(
      input.voice,
      [intro, ...loaded, outro].flatMap((part) =>
        (part?.sentences ?? []).flat().map((chunk) => chunk.text)
      ),
      dir
    );
  const seq = {
    ...structuredClone(input),
    style,
    chapters: loaded,
    ...(voice && { voice, intro, outro }),
  };
  // A voice too fast or a silence too short is refused here, before any
  // frame is drawn.
  if (voice) schedule(seq);
  return seq;
}

// The voice: an audio file and the words JSON timed on it, per chunk in
// video order (intro, chapters, outro) a list of words with start and end in
// seconds (0.4.0 open question 8). The words JSON records the audio's
// SHA-256, so a voice re-recorded without being re-timed is refused.
export function loadVoice(voice, texts, dir) {
  if (typeof voice?.audio !== "string" || typeof voice?.words !== "string")
    fail('A voice is { "audio": audio file, "words": words JSON }');
  const at = (file) =>
    dir instanceof URL ? new URL(file, dir) : resolve(dir ?? ".", file);
  const read = (file, what) => {
    try {
      return readFileSync(at(file));
    } catch (error) {
      return fail(`Voice ${what}: cannot read ${file} (${error.message})`);
    }
  };
  const audio = read(voice.audio, "audio");
  const words = JSON.parse(read(voice.words, "words"));
  const sha256 = createHash("sha256").update(audio).digest("hex");
  if (words.audio?.sha256 !== sha256)
    fail(
      `Voice: ${voice.words} was timed on another audio file; its SHA-256 differs from ${voice.audio}`
    );
  const duration = words.audio.duration;
  if (!(duration > 0)) fail(`Voice: ${voice.words} needs the audio duration`);
  if (!Array.isArray(words.chunks) || words.chunks.length !== texts.length)
    fail(
      `Voice: the sequence speaks ${texts.length} chunks; ${voice.words} times ${words.chunks?.length ?? 0} chunks`
    );
  let previous = -Infinity;
  const chunks = words.chunks.map((chunk, k) => {
    if (!sameText(chunk.text, texts[k]))
      fail(
        `Voice chunk ${k + 1} is « ${chunk.text} »; the sequence shows « ${texts[k]} »`
      );
    checkWordTimes(texts[k], chunk.words ?? [], { duration });
    if (chunk.words[0].start < previous)
      fail(`Word times of « ${texts[k]} » must be in order`);
    previous = chunk.words.at(-1).start;
    return chunk.words.map(({ text, spoken, start, end }) => ({
      text,
      ...(spoken !== undefined && { spoken }),
      start,
      end,
    }));
  });
  const path = (file) => {
    const where = at(file);
    return where instanceof URL ? fileURLToPath(where) : where;
  };
  return {
    audio: path(voice.audio),
    words: path(voice.words),
    sha256,
    duration,
    chunks,
  };
}

// The tape of a demo says what is illustrative: the text always, and the
// mockup areas or the synthetic outline it draws.
export function tapeText(seq) {
  if (!seq.demo) return null;
  const chapters = seq.chapters ?? [];
  return [
    "Texte illustratif",
    ...(chapters.some((c) => c.features.some((f) => f.mockup))
      ? ["zones de maquette"]
      : []),
    ...(chapters.some((c) => c.outline?.illustrative)
      ? ["contour de synthèse"]
      : []),
  ].join(" · ");
}

const holdCamera = (seq, { lon, lat, radius, pitch }) => ({
  lon,
  lat,
  radius,
  centreY: FULLSCREEN.centreY,
  ...(seq.style === "relief" && { pitch: pitch ?? FULLSCREEN.pitch }),
});

// Frames from a chunk's first frame to the end of one entry: an overlay
// fades in 600 ms, its map name follows at 300 ms for 400 ms; a name alone
// enters in 400 ms.
function entryFrames(kind, hasName) {
  if (kind === "name") return STEP.entryName;
  return hasName ? STEP.entryNameDelay + STEP.entryName : STEP.overlayEntry;
}

const schedules = new WeakMap();
function schedule(seq) {
  if (schedules.has(seq)) return schedules.get(seq);
  if (seq.voice) {
    schedules.set(seq, voicedSchedule(seq));
    return schedules.get(seq);
  }
  let camera = holdCamera(seq, seq.camera.at(-1));
  const chapters = [];
  seq.chapters.forEach((chapter, i) => {
    let start = STEP.firstChapter;
    let travel = null;
    if (i) {
      const exitEnd = chapters[i - 1].exit + STEP.exit;
      start = exitEnd + STEP.empty;
      if (chapter.camera) {
        const frames = Math.round(
          (chapter.camera.travel ?? TRAVEL.usual / FPS) * FPS
        );
        const to = holdCamera(seq, chapter.camera);
        travel = { start: exitEnd, frames, from: camera, to };
        camera = to;
        start = exitEnd + frames + STEP.grade;
      }
    }
    const targets = entryTargets(chapter);
    const named = new Set([
      ...(chapter.features ?? []).filter(hasMapName).map((f) => f.id),
      ...(chapter.outline ? [chapter.outline.name] : []),
    ]);
    let at = start + STEP.firstSubtitle;
    const chunks = [];
    const entries = new Map();
    chapter.sentences.forEach((sentence, s) => {
      if (s) at += STEP.sentenceGap;
      sentence.forEach((chunk, k) => {
        const first = !chunks.length;
        const last =
          s === chapter.sentences.length - 1 && k === sentence.length - 1;
        const chunkEntries = chunk.enters.map((ref, j) => ({
          ref,
          at: at + j * STEP.entryGap,
        }));
        chunkEntries.forEach((e) => entries.set(e.ref, e.at));
        const entriesEnd = Math.max(
          0,
          ...chunkEntries.map(
            (e, j) =>
              j * STEP.entryGap +
              entryFrames(targets.get(e.ref), named.has(e.ref))
          )
        );
        const fullFrom = at + (first ? STEP.fade : 0);
        const fullTo =
          fullFrom +
          3 *
            readingTenths(subtitleCharacters(chunk.text), k === 0, entriesEnd);
        const gone = fullTo + (last ? STEP.fade : 0);
        chunks.push({
          text: chunk.text,
          lines: chunkLines(chunk.text),
          sentence: s,
          appear: at,
          fullFrom,
          fullTo,
          gone,
          entries: chunkEntries,
        });
        at = gone;
      });
    });
    // A chapter lasts as long as its reading, and at least 6 s.
    const exit = Math.max(chunks.at(-1).gone, start + STEP.minHold);
    chapters.push({
      start,
      travel,
      camera,
      chunks,
      entries,
      stepDowns: stepDownsOf(targets, entries, start),
      exit,
    });
  });
  const end = chapters.at(-1).exit;
  const closingIn = end + STEP.exit + STEP.grade;
  const result = {
    chapters,
    intro: [],
    outro: [],
    chunks: chapters.flatMap((c) => c.chunks),
    ending: { start: end, closingIn },
    total: closingIn + STEP.closingIn + STEP.closingHold,
  };
  schedules.set(seq, result);
  return result;
}

// An overlay steps down when the next overlay enters after it.
function stepDownsOf(targets, entries, start) {
  const overlayStarts = [...targets]
    .filter(([, kind]) => kind === "overlay")
    .map(([ref]) => [ref, entries.get(ref) ?? start]);
  return new Map(
    overlayStarts.map(([ref, from]) => {
      const later = overlayStarts
        .map(([, other]) => other)
        .filter((other) => other > from);
      return [ref, later.length ? Math.min(...later) : null];
    })
  );
}

// The voiced schedule (0.4.0 timing.md §2): the voice sets every time, and
// the 0.3.0 chapter change keeps its order in the silence between two
// chapters' speech. The voice is never stretched or cut to fit: when a
// silence is too short the sequence is refused with the length missing, and
// the voice script inserts the pause.
const VOICE = { lead: 0.15, hold: 0.2, tail: 0.5, maxCps: 17 };
const toFrame = (seconds) => Math.round(seconds * FPS);
const msOf = (frames) => Math.ceil((frames * 1000) / FPS);

// A part's chunks in order, each on its words: it appears 150 ms before its
// first word and is cut when the next appears, across a sentence pause too;
// the part's first fades in, its last stays 200 ms after its last word, then
// fades out. What a chunk names enters at its first word.
function voicedChunks(sentences, words, targets, named, what) {
  const chunks = sentences
    .flatMap((sentence, s) => sentence.map((chunk) => ({ ...chunk, s })))
    .map((chunk, k) => {
      const first = toFrame(words[k][0].start);
      const entries = chunk.enters.map((ref, j) => ({
        ref,
        at: first + j * STEP.entryGap,
      }));
      return {
        text: chunk.text,
        lines: chunkLines(chunk.text),
        sentence: chunk.s,
        appear: toFrame(words[k][0].start - VOICE.lead),
        words: words[k],
        entries,
        entriesEnd: Math.max(
          0,
          ...entries.map(
            (e) => e.at + entryFrames(targets.get(e.ref), named.has(e.ref))
          )
        ),
      };
    });
  chunks.forEach((chunk, k) => {
    const next = chunks[k + 1];
    chunk.fullFrom = k ? chunk.appear : chunk.appear + STEP.fade;
    chunk.fullTo = next
      ? next.appear
      : Math.max(chunk.fullFrom, toFrame(chunk.words.at(-1).end + VOICE.hold));
    chunk.gone = next ? next.appear : chunk.fullTo + STEP.fade;
    const shown = chunk.gone - chunk.appear;
    const needed = Math.ceil(
      (subtitleCharacters(chunk.text) / VOICE.maxCps) * FPS - 1e-9
    );
    if (shown < needed)
      fail(
        `${what}: « ${chunk.text} » would read faster than 17 characters a second; the voice needs ${msOf(needed - shown)} ms more before the next chunk`
      );
    if (chunk.entriesEnd > chunk.gone)
      fail(
        `${what}: « ${chunk.text} » leaves before what it names has entered; the voice needs ${msOf(chunk.entriesEnd - chunk.gone)} ms more before the next chunk`
      );
    delete chunk.entriesEnd;
  });
  return chunks;
}

function needSilence(what, chunk, earliest) {
  if (chunk.appear < earliest)
    fail(
      `${what} starts too early: « ${chunk.text} » is spoken at ${chunk.words[0].start} s; the change before it needs ${msOf(earliest - chunk.appear)} ms more silence`
    );
}

function voicedSchedule(seq) {
  const words = [...seq.voice.chunks];
  const spoken = (sentences, targets, named, what) =>
    voicedChunks(
      sentences,
      words.splice(0, sentences.flat().length),
      targets,
      named,
      what
    );
  const intro = spoken(
    seq.intro?.sentences ?? [],
    new Map(),
    new Set(),
    "The intro"
  );
  let camera = holdCamera(seq, seq.camera.at(-1));
  // The opening lasts at least until the intro has been said.
  let earliest = Math.max(STEP.firstChapter, intro.at(-1)?.gone ?? 0);
  const chapters = [];
  seq.chapters.forEach((chapter, i) => {
    let travel = null;
    if (i) {
      const exitEnd = chapters[i - 1].exit + STEP.exit;
      earliest = exitEnd + STEP.empty;
      if (chapter.camera) {
        const frames = Math.round(
          (chapter.camera.travel ?? TRAVEL.usual / FPS) * FPS
        );
        const to = holdCamera(seq, chapter.camera);
        travel = { start: exitEnd, frames, from: camera, to };
        camera = to;
        earliest = exitEnd + frames + STEP.grade;
      }
    }
    const targets = entryTargets(chapter);
    const named = new Set([
      ...(chapter.features ?? []).filter(hasMapName).map((f) => f.id),
      ...(chapter.outline ? [chapter.outline.name] : []),
    ]);
    const what = `Chapter ${i + 1}`;
    const chunks = spoken(chapter.sentences, targets, named, what);
    // Entries come 900 ms before the first chunk, as in the silent video.
    needSilence(what, chunks[0], earliest + STEP.firstSubtitle);
    const start = chunks[0].appear - STEP.firstSubtitle;
    const entries = new Map(
      chunks.flatMap((c) => c.entries.map((e) => [e.ref, e.at]))
    );
    chapters.push({
      start,
      travel,
      camera,
      chunks,
      entries,
      stepDowns: stepDownsOf(targets, entries, start),
      exit: Math.max(chunks.at(-1).gone, start + STEP.minHold),
    });
  });
  const end = chapters.at(-1).exit;
  const closingIn = end + STEP.exit + STEP.grade;
  // The outro is said over the closing block once it is in.
  const outro = spoken(
    seq.outro?.sentences ?? [],
    new Map(),
    new Set(),
    "The outro"
  );
  if (outro.length)
    needSilence("The outro", outro[0], closingIn + STEP.closingIn);
  return {
    chapters,
    intro,
    outro,
    chunks: [...intro, ...chapters.flatMap((c) => c.chunks), ...outro],
    ending: { start: end, closingIn },
    // The closing block holds until the audio ends plus 0.5 s, and never
    // less than the silent video's 2.5 s.
    total: Math.max(
      closingIn + STEP.closingIn + STEP.closingHold,
      Math.ceil((seq.voice.duration + VOICE.tail) * FPS - 1e-9)
    ),
  };
}

export function chapterTimeline(seq) {
  const s = schedule(seq);
  const sec = (frame) => frame / FPS;
  const chunk = (x) => ({
    text: x.text,
    lines: x.lines,
    sentence: x.sentence,
    appear: sec(x.appear),
    fullFrom: sec(x.fullFrom),
    fullTo: sec(x.fullTo),
    gone: sec(x.gone),
    entries: x.entries.map((e) => ({ ref: e.ref, at: sec(e.at) })),
  });
  return {
    intro: s.intro.map(chunk),
    chapters: s.chapters.map((c) => ({
      start: sec(c.start),
      exit: sec(c.exit),
      travel: c.travel && {
        start: sec(c.travel.start),
        duration: sec(c.travel.frames),
      },
      chunks: c.chunks.map(chunk),
    })),
    outro: s.outro.map(chunk),
    ending: { start: sec(s.ending.start), closingIn: sec(s.ending.closingIn) },
    total: sec(s.total),
  };
}

// Every camera a chapter holds on, for the imagery crop and the light.
export const holdCameras = (seq) =>
  seq.chapters
    ? schedule(seq).chapters.map((c) => c.camera)
    : [frameState(seq, TOTAL_FRAMES - 1).camera];

// The names a chapter draws on its map, in entry order (those no chunk
// names come first, with the chapter), with their style for placement.
export function chapterLabels(seq, index) {
  const chapter = seq.chapters[index];
  const c = schedule(seq).chapters[index];
  const labels = [];
  for (const f of chapter.features ?? [])
    if (hasMapName(f))
      labels.push({
        key: f.id,
        kind: "label",
        text: f.name,
        lonLat: f.labelAt,
        style: f.plate
          ? "plate"
          : f.kind === "river"
            ? "water"
            : (f.label ?? "area"),
        ink: f.kind === "area" ? f.ink : null,
      });
  if (chapter.outline)
    labels.push({
      key: chapter.outline.name,
      kind: "label",
      text: chapter.outline.name,
      lonLat: chapter.outline.labelAt,
      style: "outline",
    });
  for (const n of chapter.names ?? [])
    labels.push({
      key: n.name,
      kind: "name",
      text: n.name,
      lonLat: [n.lon, n.lat],
      style: n.kind,
    });
  const order = (l) => c.entries.get(l.key) ?? -1;
  return labels
    .map((l, i) => [l, i])
    .sort(([a, i], [b, j]) => order(a) - order(b) || i - j)
    .map(([l]) => l);
}

function imageryLine(seq, historical) {
  const imagery = IMAGERY[seq.imagery];
  // Board 10 shortens the credit so the note fits on the line; the
  // chapter's Source line names the elevation model.
  if (historical)
    return `${imagery.short ?? imagery.credit} ; ${HISTORICAL_NOTE}`;
  return seq.style === "relief"
    ? `${imagery.credit} ; relief : NOAA, exagéré`
    : imagery.credit;
}

function chapterCaptionLines(seq, chapter) {
  const { carte, periode, source } = chapter.caption;
  return [
    { label: "Carte", text: carte },
    { label: "Période", text: periode },
    { label: "Source", text: source },
    {
      label: "Imagerie",
      text: imageryLine(seq, !!(chapter.historical || chapter.outline)),
    },
  ];
}

const markerLine = (chapter, i) => `${i + 1} · ${chapter.title}`;

const barInks = (count, current) =>
  Array.from({ length: count }, (_, j) =>
    j < current
      ? MARKER_INKS.done
      : j === current
        ? MARKER_INKS.current
        : MARKER_INKS.next
  );

function mixInk(from, to, p) {
  if (from === to || p >= 1) return to;
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [a, b] = [rgb(from), rgb(to)];
  return (
    "#" +
    a
      .map((v, i) =>
        Math.round(v + (b[i] - v) * p)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

function chapterCamera(seq, s, frame) {
  let camera = openingCamera(seq, frame / FPS);
  for (const { travel } of s.chapters) {
    if (!travel || frame <= travel.start) continue;
    const p = descent((frame - travel.start) / travel.frames);
    const { from, to } = travel;
    const mix = (a, b) => a + (b - a) * p;
    camera =
      p >= 1
        ? { ...to }
        : {
            ...from,
            lon: mix(from.lon, to.lon),
            lat: mix(from.lat, to.lat),
            radius: Math.exp(mix(Math.log(from.radius), Math.log(to.radius))),
            ...(from.pitch !== undefined && {
              pitch: mix(from.pitch, to.pitch),
            }),
          };
  }
  return camera;
}

// The base recedes once after the opening, and returns to its travel grade
// for each camera move (board 8).
function chapterGrade(s, frame) {
  let grade = span(
    frame / FPS,
    TIMING.gradeStart,
    TIMING.gradeDuration,
    symmetric
  );
  for (const { travel } of s.chapters)
    if (travel)
      grade +=
        span(frame, travel.start + travel.frames, STEP.grade, symmetric) -
        span(frame, travel.start, STEP.grade, symmetric);
  return grade;
}

function chapterFrameState(seq, frame) {
  const s = schedule(seq);
  const found = s.chapters.findIndex((c) => frame < c.exit + STEP.exit);
  const ended = found < 0;
  const i = ended ? s.chapters.length - 1 : found;
  const c = s.chapters[i];
  const chapter = seq.chapters[i];
  // Everything drawn leaves together at the chapter's exit, in 400 ms.
  const until = (value) =>
    frame < c.exit
      ? value
      : value * (1 - span(frame, c.exit, STEP.exit, leave));
  const layer = (from, frames) => until(span(frame, from, frames, enter));
  const short = layer(c.start, STEP.shortEntry);
  const remaining = 1 - span(frame, s.ending.start, STEP.exit, leave);

  // What no chunk names enters with the chapter; what a chunk names enters
  // with it (0.4.0 timing.md §3).
  const entry = (ref) => c.entries.get(ref);
  const overlay = (ref) => {
    const stepAt = c.stepDowns.get(ref);
    const down =
      stepAt === null || stepAt === undefined
        ? 1
        : STEP_DOWN +
          (1 - STEP_DOWN) *
            (1 - span(frame, stepAt, STEP.overlayEntry, symmetric));
    return until(
      span(frame, entry(ref) ?? c.start, STEP.overlayEntry, enter) * down
    );
  };
  const mapName = (ref) =>
    entry(ref) === undefined
      ? layer(c.start + STEP.namesDelay, STEP.namesEntry)
      : layer(entry(ref) + STEP.entryNameDelay, STEP.entryName);
  const name = (ref) =>
    entry(ref) === undefined
      ? layer(c.start + STEP.namesDelay, STEP.namesEntry)
      : layer(entry(ref), STEP.entryName);

  const features = {};
  const labels = {};
  const places = {};
  const nameOpacity = {};
  if (!ended) {
    for (const f of chapter.features ?? []) {
      const opacity = overlay(f.id);
      features[f.id] =
        f.kind === "river"
          ? { core: opacity, glow: TIMING.glowCeiling * opacity }
          : { opacity };
      if (hasMapName(f)) labels[f.id] = mapName(f.id);
    }
    for (const p of chapter.places ?? []) places[p.name] = name(p.name);
    for (const n of chapter.names ?? []) nameOpacity[n.name] = name(n.name);
  }

  // A legend item enters in its reserved slot with what it names.
  const legendRef = (item) =>
    item.feature ??
    item.name ??
    item.place ??
    (item.outline ? chapter.outline.name : undefined);
  const legend = ended
    ? []
    : chapter.legend.map((item) => {
        const at = entry(legendRef(item));
        return at === undefined ? short : layer(at, STEP.shortEntry);
      });

  // A caption line the next chapter repeats stays; a changed one leaves and
  // enters with its chapter.
  const lines = chapterCaptionLines(seq, chapter);
  const [before, after] = [i - 1, i + 1].map(
    (j) => seq.chapters[j] && chapterCaptionLines(seq, seq.chapters[j])
  );
  const caption = {
    lines: lines.slice(0, 3).map((line, k) => ({
      ...line,
      opacity:
        frame < c.exit
          ? before?.[k].text === line.text
            ? 1
            : span(frame, c.start, STEP.shortEntry, enter)
          : after?.[k].text === line.text
            ? 1
            : 1 - span(frame, c.exit, STEP.exit, leave),
    })),
    // The imagery line never leaves: it only swaps its text in the empty
    // interval between two chapters, when nothing else is drawn.
    imagery: ended ? imageryLine(seq, false) : lines[3].text,
  };

  const entering = span(frame, c.start, STEP.shortEntry, enter);
  const marker =
    seq.chapters.length < MARKER_FROM
      ? null
      : {
          bars:
            i === 0
              ? barInks(seq.chapters.length, 0)
              : barInks(seq.chapters.length, i).map((ink, j) =>
                  mixInk(barInks(seq.chapters.length, i - 1)[j], ink, entering)
                ),
          opacity: (i === 0 ? entering : 1) * remaining,
          line: { text: markerLine(chapter, i), opacity: short },
        };

  // Within a sentence the next chunk replaces the last on the same frame;
  // only a part's first and last chunks fade. The box follows the voice;
  // without a voice there is no highlight (operator, 12 October 2026).
  const chunk = s.chunks.find((x) => frame >= x.appear && frame < x.gone);
  const subtitle = chunk && {
    lines: chunk.lines,
    opacity:
      frame < chunk.fullFrom
        ? span(frame, chunk.appear, STEP.fade, enter)
        : frame < chunk.fullTo
          ? 1
          : 1 - span(frame, chunk.fullTo, STEP.fade, leave),
    highlight: chunk.words ? highlightAt(chunk.words, frame / FPS) : null,
  };

  const { variant, sentence, page } = seq.ending;
  const closingOpacity = span(frame, s.ending.closingIn, STEP.closingIn, enter);
  return {
    camera: chapterCamera(seq, s, frame),
    grade: chapterGrade(s, frame),
    dim: span(frame, s.ending.start + STEP.exit, STEP.grade, symmetric),
    chapter: ended ? null : i,
    features,
    labels,
    places,
    names: nameOpacity,
    outline:
      !ended && chapter.outline
        ? {
            opacity: overlay(chapter.outline.name),
            label: mapName(chapter.outline.name),
          }
        : null,
    legend,
    caption,
    marker,
    subtitle: subtitle ?? null,
    text: { signature: remaining, title: remaining },
    closing:
      frame < s.ending.closingIn
        ? null
        : variant === "A"
          ? {
              variant,
              opacity: closingOpacity,
              sentence,
              ...(page && { page }),
              address: SITE_ADDRESS,
            }
          : { variant, opacity: closingOpacity },
    relief:
      seq.style === "relief" ? { exaggeration: RELIEF.exaggeration } : null,
  };
}
