// Frame-addressed model of a satellite geographic video, following the
// accepted EthniAfrica Vidéo carte 0.2.0-proposition (boards 3, 4 and 5) for
// the 12-second video, and 0.3.0-proposition (boards 7 to 10) for a video
// chained in chapters. Every value is a function of the frame number: no
// clock, no randomness.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

// Only sources whose licence was checked on 11 October 2026
// (video-design-checks-2026-10-11.json) may be drawn.
export const IMAGERY = {
  "bmng-2004-07-topo-bathy": {
    credit: "NASA Earth Observatory",
    // The historical chapter's imagery line (board 10) needs the room.
    short: "NASA",
    file: "imagery/world.topo.bathy.200407.3x21600x10800.jpg",
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

const enter = cubicBezier(0.2, 0, 0, 1);
const leave = cubicBezier(0.4, 0, 1, 1);
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
    const { type, coordinates } = f.geometry ?? {};
    const polygons =
      type === "Polygon"
        ? [coordinates]
        : type === "MultiPolygon"
          ? coordinates
          : fail(`Area ${f.id} needs a Polygon or MultiPolygon`);
    for (const polygon of polygons)
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

// What one map state draws: the whole 12-second video, or one chapter.
function checkMapContent(input) {
  const ids = new Set();
  for (const f of input.features ?? []) {
    if (!Object.hasOwn(FEATURE_CHECKS, f.kind))
      fail(`Unsupported feature kind ${f.kind}`);
    nonEmpty(f.id, "Feature id");
    nonEmpty(f.name, `Feature ${f.id} name`);
    nonEmpty(f.source, `Feature ${f.id} source`);
    FEATURE_CHECKS[f.kind](f);
    if (f.kind !== "border")
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
    (input.features ?? []).filter((f) => f.kind !== "border").length +
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
  };
  for (const item of legend) {
    nonEmpty(item.label, "Legend label");
    const refs = Object.keys(known).filter((k) => item[k] !== undefined);
    if (refs.length !== 1)
      fail(
        `Legend item ${item.label} points to one feature, name, place or outline`
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
  return style;
}

// `dir` resolves a chapter outline's `file`; it defaults to the working
// directory.
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

function openingCamera(seq, t) {
  const camera = cameraAt(seq, t);
  if (seq.style === "relief")
    camera.pitch =
      90 -
      (90 - RELIEF.pitch) *
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
// straight down it matches the orthographic globe near the target.
export const VIEW_CENTRE = { x: 540, y: 690 };

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
  if (camera.pitch === undefined) {
    const [l, p] = [toRad(lon - camera.lon), toRad(lat)];
    const p0 = toRad(camera.lat);
    const cosC =
      Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    const x = Math.cos(p) * Math.sin(l);
    const y =
      Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
    return {
      x: VIEW_CENTRE.x + camera.radius * x,
      y: VIEW_CENTRE.y - camera.radius * y,
      visible: cosC > 0,
    };
  }
  const cam = tiltedCamera(camera);
  const normal = surface(lon, lat);
  const point = normal.map((n) => n * (1 + height));
  const view = point.map((v, i) => v - cam.position[i]);
  const depth = dot(view, cam.forward);
  return {
    x: VIEW_CENTRE.x + (cam.focal * dot(view, cam.right)) / depth,
    y: VIEW_CENTRE.y - (cam.focal * dot(view, cam.screenUp)) / depth,
    visible: depth > 0 && dot(normal, view) < 0,
  };
}

// The sea-level ground under a screen point, or null when it shows space.
export function unproject(camera, x, y) {
  const toDegrees = ([px, py, pz]) => ({
    lon: (Math.atan2(px, pz) * 180) / Math.PI,
    lat: (Math.asin(Math.max(-1, Math.min(1, py))) * 180) / Math.PI,
  });
  if (camera.pitch === undefined) {
    const nx = (x - VIEW_CENTRE.x) / camera.radius;
    const ny = -(y - VIEW_CENTRE.y) / camera.radius;
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
      (cam.right[i] * (x - VIEW_CENTRE.x)) / cam.focal -
      (cam.screenUp[i] * (y - VIEW_CENTRE.y)) / cam.focal
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
const estimateWidth = (text, size, ratio) =>
  Math.ceil(text.length * size * ratio);

const textBox = (text, size, ratio, lineHeight) => {
  const lines = text.split("\n");
  return [
    Math.max(...lines.map((l) => estimateWidth(l, size, ratio))),
    lines.length * lineHeight,
  ];
};

// The estimated layout of the hold: the last frame of a 12-second video, or
// chapter `index` of a chained one once it is fully drawn.
export function holdLayout(seq, index) {
  const chapter = seq.chapters?.[index];
  if (seq.chapters && !chapter) fail(`No chapter ${index}`);
  const content = chapter ?? seq;
  const camera = chapter
    ? schedule(seq).chapters[index].camera
    : frameState(seq, TOTAL_FRAMES - 1).camera;
  // A chained video sets its title in Anton 72/76 (board 7), with the
  // chapter marker 12 px under it.
  const [titleSize, titleHeight] = chapter ? [72, 76] : [76, 80];
  const elements = [
    {
      id: "signature",
      kind: "signature",
      box: { x: 120, y: 290, w: 260, h: 36 },
    },
    {
      id: "title",
      kind: "title",
      box: {
        x: 120,
        y: chapter ? 338 : 342,
        w: estimateWidth(seq.title, titleSize, 0.4),
        h: titleHeight,
      },
    },
  ];
  if (chapter && seq.chapters.length >= MARKER_FROM)
    elements.push({
      id: "marker",
      kind: "marker",
      box: {
        x: 120,
        y: 426,
        w:
          seq.chapters.length * 34 +
          8 +
          estimateWidth(markerLine(chapter, index), 26, 0.5),
        h: 32,
      },
    });
  if (content.outline) {
    // The name in italic 30/34 over « contour reconstitué » in 20/24.
    const at = project(camera, ...content.outline.labelAt);
    const w = Math.max(
      estimateWidth(content.outline.name, 30, 0.55),
      estimateWidth(OUTLINE_LABEL, 20, 0.55)
    );
    elements.push({
      id: content.outline.name,
      kind: "label",
      box: { x: at.x - w / 2, y: at.y - 29, w, h: 58 },
    });
  }
  for (const text of chapter?.subtitles ?? [])
    subtitleLines(text).forEach((line, i) => {
      const words = line.map((r) => r.text).join("");
      elements.push({
        id: `subtitle « ${words} »`,
        kind: "subtitle",
        // Nunito Sans 700 36 px in a box padded 14 px on each side.
        box: {
          x: 120,
          y: SUBTITLE_TOP + i * 54,
          w: 28 + estimateWidth(words, 36, 0.52),
          h: 54,
        },
      });
    });
  for (const f of content.features ?? []) {
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
  for (const n of content.names ?? []) {
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
  for (const p of content.places ?? []) {
    const at = project(camera, p.lon, p.lat);
    const w = estimateWidth(p.name, 28, 0.58);
    const x = p.side === "left" ? at.x - 14 - w : at.x + 14;
    elements.push({
      id: p.name,
      kind: "place",
      box: { x, y: at.y - 17, w, h: 34 },
    });
  }
  const lines = chapter
    ? chapterCaptionLines(seq, chapter).map(
        ({ label, text }) => `${label} : ${text}`
      )
    : captionLines(seq);
  const captionHeight = lines.length * 28;
  const captionY = 1240 - captionHeight;
  const legendRows = Math.ceil(content.legend.length / 2);
  const legendHeight = legendRows * 36;
  elements.push(
    {
      id: "legend",
      kind: "legend",
      box: {
        x: 120,
        y: captionY - 12 - legendHeight,
        w: Math.max(
          ...content.legend.map((i) => 56 + estimateWidth(i.label, 26, 0.5))
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
  return { camera, elements, captionLines: lines };
}

const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function checkLayout(layout) {
  const problems = [];
  const s = SAFE_ZONE;
  for (const { id, box } of layout.elements) {
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

// Chained chapters (0.3.0-proposition, boards 7 to 10): one opening, then
// one to five chapters on the same frame, each one map state, its own line
// under the title and one to three subtitles, then an ending.

const MAX_CHAPTERS = 5;
const MAX_SUBTITLES = 3;
const MARKER_FROM = 3;
const SUBTITLE_TOP = 948;
const LINE_CHARS = 32;
const SUBTITLE_CHARS = 64;
const OUTLINE_LABEL = "contour reconstitué";
const HISTORICAL_NOTE = "l'imagerie montre le paysage actuel";
const SITE_ADDRESS = "ETHNIAFRICA.COM";
const MARKER_INKS = { done: "#a8977f", current: "#e8b96a", next: "#4a3c2c" };

// Board 8's tables in frames. Integers keep every chapter on the design's
// 0.1 s grid, however many are chained.
const STEP = {
  firstChapter: 192,
  shortEntry: 9,
  overlayEntry: 18,
  namesDelay: 12,
  namesEntry: 15,
  firstSubtitle: 27,
  fade: 6,
  gap: 6,
  exit: 12,
  empty: 6,
  grade: 18,
  minHold: 180,
  closingIn: 15,
  closingHold: 75,
};
const TRAVEL = { min: 54, max: 72, usual: 54 };

const ARABIC_RUN = /\p{Script=Arabic}+/gu;
const HAS_ARABIC = /\p{Script=Arabic}/u;
const graphemes = new Intl.Segmenter("fr", { granularity: "grapheme" });

// `*word*` sets a transcribed word in italic; the markers are not read.
const readable = (text) => text.normalize("NFC").replaceAll("*", "");

export const subtitleCharacters = (text) =>
  [...graphemes.segment(readable(text))].length;

// chars ÷ 15 + 0.3 s in tenths, so the time lands on the 0.1 s grid.
function readingTenths(text) {
  const tenths = Math.ceil((2 * subtitleCharacters(text) + 9) / 3);
  return Math.min(70, Math.max(15, tenths));
}

export const readingSeconds = (text) => readingTenths(text) / 10;

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
        runs[i - 1].text === " (" &&
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

const wordCount = (line) =>
  line.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

// One or two balanced lines of runs. Only a plain space breaks a line: the
// text keeps a number and its unit, a phrase in guillemets or « vers » and
// its year together with non-breaking spaces (board 9), and a transcription
// is never parted from its Arabic script.
export function subtitleLines(text) {
  const runs = subtitleRuns(text);
  const whole = runs.map((r) => r.text).join("");
  const count = subtitleCharacters(whole);
  if (count > SUBTITLE_CHARS)
    fail(`A subtitle holds 64 characters at most; « ${whole} » has ${count}`);
  if (count <= LINE_CHARS) return [runs];
  const breaks = [];
  for (let i = 0; i < whole.length; i++) {
    if (whole[i] !== " " || /^\(\p{Script=Arabic}/u.test(whole.slice(i + 1)))
      continue;
    const [first, second] = [whole.slice(0, i), whole.slice(i + 1)];
    const lengths = [subtitleCharacters(first), subtitleCharacters(second)];
    if (Math.max(...lengths) <= LINE_CHARS)
      breaks.push({ at: i, second, gap: Math.abs(lengths[0] - lengths[1]) });
  }
  if (!breaks.length)
    fail(`No line break keeps both lines of « ${whole} » within 32 characters`);
  const kept = breaks.filter((b) => wordCount(b.second) > 2);
  if (!kept.length)
    fail(
      `Every line break of « ${whole} » leaves one or two words on the second line`
    );
  const best = kept.reduce((a, b) => (b.gap < a.gap ? b : a));
  return [
    sliceRuns(runs, 0, best.at),
    sliceRuns(runs, best.at + 1, whole.length),
  ];
}

// Arabic script once per video, for the word under discussion only: never in
// a title, a caption or a name.
function checkArabic(input) {
  let count = 0;
  const walk = (value, path) => {
    if (typeof value === "string") {
      if (!HAS_ARABIC.test(value)) return;
      if (!/^chapters\.\d+\.subtitles\.\d+$/.test(path))
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
  const path =
    dir instanceof URL
      ? new URL(outline.file, dir)
      : resolve(dir ?? ".", outline.file);
  let geojson;
  try {
    geojson = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${what}: cannot read ${outline.file} (${error.message})`);
  }
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

function loadChapters(input, style, dir) {
  const chapters = input.chapters;
  if (
    !Array.isArray(chapters) ||
    chapters.length < 1 ||
    chapters.length > MAX_CHAPTERS
  )
    fail("A chained video has one to five chapters");
  // Board 7: the marker sits in the title band only under a one-line title.
  if (
    chapters.length >= MARKER_FROM &&
    (input.title.includes("\n") ||
      estimateWidth(input.title, 72, 0.4) > SAFE_ZONE.w)
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
    const subtitles = chapter.subtitles ?? [];
    if (subtitles.length < 1 || subtitles.length > MAX_SUBTITLES)
      fail(`${what} needs one to three subtitles`);
    subtitles.forEach(subtitleLines);
    if (chapter.camera) {
      if (i === 0)
        fail("Chapter 1 starts where the opening lands; it cannot move");
      const { lon, lat, radius, travel = TRAVEL.usual / FPS } = chapter.camera;
      checkPoint([lon, lat], `${what} camera`);
      if (!(radius > 0)) fail(`${what} camera needs a positive radius`);
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
    checkMapContent({ ...chapter, outline });
    return { ...structuredClone(chapter), ...(outline && { outline }) };
  });
  const ending = input.ending;
  if (!["A", "B"].includes(ending?.variant))
    fail("A chained video needs an ending: variant A or B");
  if (ending.variant === "A") {
    if (ending.pageOnline !== true)
      fail("Ending A needs the subject's page online; use ending B until then");
    nonEmpty(ending.sentence, "Ending A sentence");
  } else if (ending.sentence !== undefined)
    fail("Ending B carries the signature and slogan only");
  return { ...structuredClone(input), style, chapters: loaded };
}

const holdCamera = (seq, { lon, lat, radius }) =>
  seq.style === "relief"
    ? { lon, lat, radius, pitch: RELIEF.pitch }
    : { lon, lat, radius };

const schedules = new WeakMap();
function schedule(seq) {
  if (schedules.has(seq)) return schedules.get(seq);
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
    let at = start + STEP.firstSubtitle;
    const subtitles = chapter.subtitles.map((text) => {
      const read = readingTenths(text) * (FPS / 10);
      const s = {
        text,
        lines: subtitleLines(text),
        in: at,
        fullFrom: at + STEP.fade,
        fullTo: at + STEP.fade + read,
        out: at + 2 * STEP.fade + read,
      };
      at = s.out + STEP.gap;
      return s;
    });
    // A chapter lasts as long as its reading, and at least 6 s.
    const exit = Math.max(subtitles.at(-1).out, start + STEP.minHold);
    chapters.push({ start, travel, camera, subtitles, exit });
  });
  const end = chapters.at(-1).exit;
  const closingIn = end + STEP.exit + STEP.grade;
  const result = {
    chapters,
    ending: { start: end, closingIn },
    total: closingIn + STEP.closingIn + STEP.closingHold,
  };
  schedules.set(seq, result);
  return result;
}

export function chapterTimeline(seq) {
  const s = schedule(seq);
  const sec = (frame) => frame / FPS;
  return {
    chapters: s.chapters.map((c) => ({
      start: sec(c.start),
      exit: sec(c.exit),
      travel: c.travel && {
        start: sec(c.travel.start),
        duration: sec(c.travel.frames),
      },
      subtitles: c.subtitles.map((x) => ({
        text: x.text,
        fadeIn: sec(x.in),
        fullFrom: sec(x.fullFrom),
        fullTo: sec(x.fullTo),
        fadeOutEnd: sec(x.out),
      })),
    })),
    ending: { start: sec(s.ending.start), closingIn: sec(s.ending.closingIn) },
    total: sec(s.total),
  };
}

// Every camera a chapter holds on, for the imagery crop and the light.
export const holdCameras = (seq) =>
  seq.chapters
    ? schedule(seq).chapters.map((c) => c.camera)
    : [frameState(seq, TOTAL_FRAMES - 1).camera];

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
    camera =
      p >= 1
        ? { ...to }
        : {
            ...from,
            lon: from.lon + (to.lon - from.lon) * p,
            lat: from.lat + (to.lat - from.lat) * p,
            radius: Math.exp(
              Math.log(from.radius) +
                (Math.log(to.radius) - Math.log(from.radius)) * p
            ),
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
  // Entries ease in from their own start; everything leaves together at the
  // chapter's exit, in 400 ms.
  const layer = (from, frames) =>
    frame < c.exit
      ? span(frame, from, frames, enter)
      : 1 - span(frame, c.exit, STEP.exit, leave);
  const overlays = layer(c.start, STEP.overlayEntry);
  const names = layer(c.start + STEP.namesDelay, STEP.namesEntry);
  const short = layer(c.start, STEP.shortEntry);
  const remaining = 1 - span(frame, s.ending.start, STEP.exit, leave);

  const features = {};
  const labels = {};
  const places = {};
  const nameOpacity = {};
  if (!ended) {
    for (const f of chapter.features ?? []) {
      features[f.id] =
        f.kind === "river"
          ? { core: overlays, glow: TIMING.glowCeiling * overlays }
          : { opacity: overlays };
      if (f.kind !== "border") labels[f.id] = names;
    }
    for (const p of chapter.places ?? []) places[p.name] = names;
    for (const n of chapter.names ?? []) nameOpacity[n.name] = names;
  }

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

  const sub = ended
    ? null
    : c.subtitles.find((x) => frame >= x.in && frame < x.out);
  const subtitle = sub && {
    lines: sub.lines,
    opacity:
      frame < sub.fullFrom
        ? span(frame, sub.in, STEP.fade, enter)
        : frame < sub.fullTo
          ? 1
          : 1 - span(frame, sub.fullTo, STEP.fade, leave),
  };

  const { variant, sentence } = seq.ending;
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
      !ended && chapter.outline ? { opacity: overlays, label: names } : null,
    legend: ended ? [] : chapter.legend.map(() => short),
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
              address: SITE_ADDRESS,
            }
          : { variant, opacity: closingOpacity },
    relief:
      seq.style === "relief" ? { exaggeration: RELIEF.exaggeration } : null,
  };
}
