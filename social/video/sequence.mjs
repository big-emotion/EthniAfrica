// Frame-addressed model of a satellite geographic video, following the
// accepted EthniAfrica Vidéo carte 0.2.0-proposition (boards 3, 4 and 5).
// Every value is a function of the frame number: no clock, no randomness.

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

export function loadSequence(input) {
  const style = input.style ?? "flat";
  if (!["flat", "relief"].includes(style))
    fail(`Unknown style ${style}; use flat or relief`);
  if (!Object.hasOwn(IMAGERY, input.imagery ?? ""))
    fail(`Unverified imagery ${input.imagery}`);
  nonEmpty(input.title, "Title");
  for (const part of ["carte", "periode", "source"])
    nonEmpty(input.caption?.[part], `Caption ${part}`);
  const keys = input.camera ?? [];
  if (keys[0]?.at !== 0 || keys.at(-1)?.at !== TIMING.cameraEnd)
    fail(`Camera keys must run from 0 to ${TIMING.cameraEnd} s`);
  keys.forEach((k, i) => {
    checkPoint([k.lon, k.lat], `Camera key ${i}`);
    if (!(k.radius > 0)) fail(`Camera key ${i} needs a positive radius`);
    if (i && !(k.at > keys[i - 1].at)) fail("Camera keys must be in order");
  });
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
    (input.names ?? []).length;
  if (nameCount > MAX_NAMES)
    fail(`At most six names on screen; this sequence has ${nameCount}`);
  if (input.highlight) {
    const { text, feature } = input.highlight;
    if (!input.title.includes(text ?? "\0") || !ids.has(feature))
      fail(
        "The title highlight needs a phrase of the title and a known feature"
      );
  }
  const legend = input.legend ?? [];
  if (legend.length < 1 || legend.length > 4)
    fail("A legend needs one to four items");
  for (const item of legend) {
    nonEmpty(item.label, "Legend label");
    if (!ids.has(item.feature))
      fail(`Legend item points to unknown feature ${item.feature}`);
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

function checkFrame(frame) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= TOTAL_FRAMES)
    fail(`Frame ${frame} is outside 0–${TOTAL_FRAMES - 1}`);
}

export function frameState(seq, frame) {
  checkFrame(frame);
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
  const camera = cameraAt(seq, t);
  if (seq.style === "relief")
    camera.pitch =
      90 -
      (90 - RELIEF.pitch) *
        span(t, RELIEF.tiltStart, TIMING.cameraEnd - RELIEF.tiltStart, descent);
  return {
    camera,
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

export function holdLayout(seq) {
  const { camera } = frameState(seq, TOTAL_FRAMES - 1);
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
        y: 342,
        w: estimateWidth(seq.title, 76, 0.4),
        h: 80,
      },
    },
  ];
  for (const f of seq.features) {
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
  for (const p of seq.places ?? []) {
    const at = project(camera, p.lon, p.lat);
    const w = estimateWidth(p.name, 28, 0.58);
    const x = p.side === "left" ? at.x - 14 - w : at.x + 14;
    elements.push({
      id: p.name,
      kind: "place",
      box: { x, y: at.y - 17, w, h: 34 },
    });
  }
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
