// Renders a loaded sequence frame by frame in the pinned Chromium (the card
// renderer's runtime) and encodes it with FFmpeg. The engine decision and
// its limits are recorded in the step 9 acceptance notes.
import { chromium } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { PAGE_HTML } from "./page.mjs";
import {
  IMAGERY,
  FPS,
  WIDTH,
  HEIGHT,
  RELIEF,
  BANDS,
  frameState,
  frameCount,
  holdCameras,
  project,
  unproject,
  tiltedCamera,
  captionLines,
  checkLayout,
  viewCentre,
  tapeText,
  chapterLabels,
  placeLabels,
  placeBox,
} from "./sequence.mjs";

const here = new URL(".", import.meta.url);
const designRoot = resolve("social/design-system");
const FONTS = [
  "Anton-Regular.ttf",
  "Fraunces.ttf",
  "NunitoSans.ttf",
  "NotoSans-Variable.ttf",
  "NotoSansArabic-SemiBold.ttf",
];
// SwiftShader keeps WebGL on the CPU, so the same frame gives the same pixels
// on a given machine regardless of the GPU.
export const BROWSER_ARGS = [
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
];
// The series video's opt-in `--gpu` (operator, 19 October 2026): ANGLE on
// Metal draws WebGL on the Mac's GPU. Its frames are the same run after run
// on one machine but not SwiftShader's to the pixel, so SwiftShader stays
// the reference (README, « GPU render »).
export const GPU_BROWSER_ARGS = ["--use-angle=metal"];
// Largest texture side SwiftShader accepts; the world mosaic is reduced to it.
export const MAX_TEXTURE = 8192;

// Board 6's production height model, checked on 11 October 2026: NOAA NCEI
// ETOPO 2022, 60 arc-seconds, public domain (CC0 1.0). Ocean depths are
// clamped to sea level: the imagery already shows the sea floor.
const HEIGHT_MODEL = {
  file: "relief/ETOPO_2022_v1_60s_N90W180_surface.tif",
  sha256: "9d27d4b8ea8e76977e2988bca667d7c8fa68b927355feffcddd6b4875a7fd08e",
};
const EARTH_RADIUS_M = 6371000;
const WORLD_HEIGHTS = [2048, 1024];
const MAX_REGION_HEIGHTS = 4096;
// Draped overlays are drawn at 1.5 texture pixels per screen pixel at the
// target, so their strokes stay sharp once the camera has landed.
const DRAPE_SCALE = 1.5;
const MAX_DRAPE = 4096;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function engineHash() {
  const parts = await Promise.all(
    ["render.mjs", "page.mjs", "sequence.mjs"].map((f) =>
      readFile(new URL(f, here))
    )
  );
  return sha256(Buffer.concat(parts));
}

// Geographic bounds of the map every hold camera shows, so the full
// resolution crop covers each hold with a margin. Rows under the title scrim
// and the bottom veil are left out: a tilted view would otherwise reach the
// horizon and spread the crop over ground nobody can read.
function holdBounds(seq) {
  const hits = [];
  const [top, bottom] = seq.chapters
    ? [BANDS.names[0], BANDS.veil]
    : [200, 1300];
  for (const camera of holdCameras(seq))
    for (let x = 0; x <= WIDTH; x += WIDTH / 12)
      for (let y = top; y <= bottom; y += 50) {
        const ground = unproject(camera, x, y);
        if (ground) hits.push(ground);
      }
  if (!hits.length) return [-180, 180, -90, 90];
  const lons = hits.map((g) => g.lon);
  const lats = hits.map((g) => g.lat);
  return [
    Math.max(-180, Math.floor(Math.min(...lons)) - 2),
    Math.min(180, Math.ceil(Math.max(...lons)) + 2),
    Math.max(-90, Math.floor(Math.min(...lats)) - 2),
    Math.min(90, Math.ceil(Math.max(...lats)) + 2),
  ];
}

const exists = (p) =>
  access(p).then(
    () => true,
    () => false
  );

async function heightGrid(source, file, size, crop) {
  if (!(await exists(file))) {
    let image = source().extractChannel(0);
    if (crop) image = image.extract(crop);
    image = image.resize(size[0], size[1], { kernel: "linear" });
    const raw = await image.raw({ depth: "float" }).toBuffer();
    await writeFile(file, raw);
  }
  const raw = await readFile(file);
  return {
    width: size[0],
    height: size[1],
    data: new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4),
  };
}

async function prepareRelief(bounds, assets) {
  const path = join(assets, HEIGHT_MODEL.file);
  const bytes = await readFile(path).catch(() => {
    throw new Error(
      `Verified relief height model is missing: ${HEIGHT_MODEL.file}`
    );
  });
  if (sha256(bytes) !== HEIGHT_MODEL.sha256)
    throw new Error(
      `Relief height model differs from the verified one: ${HEIGHT_MODEL.file}`
    );
  const cache = join(assets, ".cache", HEIGHT_MODEL.sha256.slice(0, 16));
  await mkdir(cache, { recursive: true });
  const source = () => sharp(bytes, { limitInputPixels: false });
  const { width, height } = await source().metadata();
  const [lonMin, lonMax, latMin, latMax] = bounds;
  const crop = {
    left: Math.round(((lonMin + 180) / 360) * width),
    top: Math.round(((90 - latMax) / 180) * height),
    width: Math.round(((lonMax - lonMin) / 360) * width),
    height: Math.round(((latMax - latMin) / 180) * height),
  };
  const fit = Math.min(
    1,
    MAX_REGION_HEIGHTS / Math.max(crop.width, crop.height)
  );
  const regionSize = [
    Math.round(crop.width * fit),
    Math.round(crop.height * fit),
  ];
  const world = await heightGrid(
    source,
    join(cache, "world.f32"),
    WORLD_HEIGHTS
  );
  const region = await heightGrid(
    source,
    join(cache, `region_${bounds.join("_")}.f32`),
    regionSize,
    crop
  );
  return { hash: HEIGHT_MODEL.sha256, world, region };
}

// Bilinear height in metres, never below sea level; the same lookup the
// page's shaders make, so names sit on the ground the mesh draws.
function heightSampler(bounds, heights) {
  const [lonMin, lonMax, latMin, latMax] = bounds;
  const sample = (grid, u, v) => {
    const x = Math.min(Math.max(u * grid.width - 0.5, 0), grid.width - 1);
    const y = Math.min(Math.max(v * grid.height - 0.5, 0), grid.height - 1);
    const [x0, y0] = [Math.floor(x), Math.floor(y)];
    const [x1, y1] = [
      Math.min(x0 + 1, grid.width - 1),
      Math.min(y0 + 1, grid.height - 1),
    ];
    const at = (i, j) => grid.data[j * grid.width + i];
    const [fx, fy] = [x - x0, y - y0];
    const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
    const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
  return (lon, lat) => {
    const inside =
      lon >= lonMin && lon <= lonMax && lat >= latMin && lat <= latMax;
    const metres = inside
      ? sample(
          heights.region,
          (lon - lonMin) / (lonMax - lonMin),
          (latMax - lat) / (latMax - latMin)
        )
      : sample(heights.world, (lon + 180) / 360, (90 - lat) / 180);
    return Math.max(metres, 0);
  };
}

async function prepareImagery(seq, assets) {
  return prepareImageryRegion(seq.imagery, holdBounds(seq), assets);
}

// The verified imagery as the shaders read it: the world reduced to the
// largest texture, and the full-resolution crop of `bounds` (lon/lat). The
// series video's map cards (Cartes 1.4.1) use it too.
export async function prepareImageryRegion(id, bounds, assets) {
  const entry = IMAGERY[id];
  if (entry.tiles) return prepareTiledRegion(entry, bounds, assets);
  if (!entry.file) throw new Error(`No verified local imagery file for ${id}`);
  const path = join(assets, entry.file);
  const bytes = await readFile(path).catch(() => {
    throw new Error(`Verified imagery file is missing: ${entry.file}`);
  });
  if (sha256(bytes) !== entry.sha256)
    throw new Error(
      `Imagery file differs from the verified one: ${entry.file}`
    );
  const cache = join(assets, ".cache", entry.sha256.slice(0, 16));
  const key = bounds.join("_");
  const world = join(cache, "world.jpg");
  const region = join(cache, `region_${key}.jpg`);
  await mkdir(cache, { recursive: true });
  const source = () => sharp(bytes, { limitInputPixels: false });
  if (!(await exists(world)))
    await source()
      .resize(MAX_TEXTURE, MAX_TEXTURE / 2)
      .jpeg({ quality: 95 })
      .toFile(world);
  const { width, height } = await source().metadata();
  if (entry.width && width !== entry.width)
    throw new Error(`${entry.file} is ${width} px wide, not ${entry.width}`);
  if (!(await exists(region))) {
    const [lonMin, lonMax, latMin, latMax] = bounds;
    const left = Math.round(((lonMin + 180) / 360) * width);
    const top = Math.round(((90 - latMax) / 180) * height);
    const w = Math.round(((lonMax - lonMin) / 360) * width);
    const h = Math.round(((latMax - latMin) / 180) * height);
    let crop = source().extract({ left, top, width: w, height: h });
    if (Math.max(w, h) > MAX_TEXTURE)
      crop = crop.resize(MAX_TEXTURE, MAX_TEXTURE, { fit: "inside" });
    await crop.jpeg({ quality: 95 }).toFile(region);
  }
  const [lonMin, lonMax, latMin, latMax] = bounds;
  const cropWidth = ((lonMax - lonMin) / 360) * width;
  const cropHeight = ((latMax - latMin) / 180) * height;
  return {
    bounds,
    imageryHash: entry.sha256,
    world: await readFile(world),
    region: await readFile(region),
    // The region texture's pixels around the Earth, after any reduction to
    // the largest texture: what the scale limit of its views must read.
    regionWidth:
      width * Math.min(1, MAX_TEXTURE / Math.max(cropWidth, cropHeight)),
  };
}

// Cartes 1.11.0, decision 1: the 500 m mosaic. The region texture is the
// 2 km file's crop of `bounds`, brought to the mosaic's grid, with the
// verified tiles laid over it wherever they cover (each 90° square, 240 px
// a degree). The globe's dive needs a wide region that may cross the
// equator, where B1 and C1 stop; there the 2 km file shows, as it does
// outside the region. `cover` says where the 500 m pixels are, so the
// renderer can refuse a close view whose ground leaves them.
async function prepareTiledRegion(entry, bounds, assets) {
  const base = await prepareImageryRegion(entry.world, bounds, assets);
  const [lonMin, lonMax, latMin, latMax] = bounds;
  const tiles = [];
  for (const t of entry.tiles) {
    const bytes = await readFile(join(assets, t.file)).catch(() => {
      throw new Error(`Verified imagery file is missing: ${t.file}`);
    });
    if (bytes.length !== t.bytes || sha256(bytes) !== t.sha256)
      throw new Error(`Imagery file differs from the verified one: ${t.file}`);
    tiles.push({ ...t, bytes });
  }
  const hash = sha256(
    [IMAGERY[entry.world].sha256, ...entry.tiles.map((t) => t.sha256)].join("")
  );
  const cache = join(assets, ".cache", `tiles-${hash.slice(0, 16)}`);
  await mkdir(cache, { recursive: true });
  const region = join(cache, `region_${bounds.join("_")}.jpg`);
  const ppd = entry.width / 360;
  const W = Math.round((lonMax - lonMin) * ppd);
  const H = Math.round((latMax - latMin) * ppd);
  const scale = Math.min(1, MAX_TEXTURE / Math.max(W, H));
  const size = (n) => Math.max(1, Math.round(n * scale));
  if (!(await exists(region))) {
    const parts = [];
    for (const t of tiles) {
      const [w0, e0, s0, n0] = t.bounds;
      const [a, b] = [Math.max(lonMin, w0), Math.min(lonMax, e0)];
      const [c, d] = [Math.max(latMin, s0), Math.min(latMax, n0)];
      if (a >= b || c >= d) continue;
      const input = await sharp(t.bytes, { limitInputPixels: false })
        .extract({
          left: Math.round((a - w0) * ppd),
          top: Math.round((n0 - d) * ppd),
          width: Math.round((b - a) * ppd),
          height: Math.round((d - c) * ppd),
        })
        .resize(size((b - a) * ppd), size((d - c) * ppd))
        .png()
        .toBuffer();
      parts.push({
        input,
        left: Math.round((a - lonMin) * ppd * scale),
        top: Math.round((latMax - d) * ppd * scale),
      });
    }
    await sharp(base.region, { limitInputPixels: false })
      .resize(size(W), size(H), { fit: "fill" })
      .composite(parts)
      .jpeg({ quality: 95 })
      .toFile(region);
  }
  return {
    bounds,
    imageryHash: hash,
    tiles: entry.tiles.map((t) => ({ file: t.file, sha256: t.sha256 })),
    cover: entry.tiles.map((t) => t.bounds),
    world: base.world,
    region: await readFile(region),
    regionWidth: entry.width * scale,
  };
}

// The cards' Nuit area inks (board 2) and the water ink for a river's name.
const INKS = { a: "#e8b96a", b: "#6cc3b5", c: "#e3876a" };
const WATER_INK = "#8fd3e6";

function linePath(place, coordinates, close = false) {
  let d = "";
  let pen = false;
  for (const [lon, lat] of coordinates) {
    const p = place(lon, lat);
    if (!p.visible) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    pen = true;
  }
  return close && d ? d + "Z" : d;
}

const lines = (g) =>
  g.type === "LineString" ? [g.coordinates] : g.coordinates;
const rings = (g) =>
  (g.type === "Polygon" ? [g.coordinates] : g.coordinates).flat();

const featureInk = (f) => (f.kind === "area" ? INKS[f.ink] : WATER_INK);

// A chained video highlights its subject in the accent, as on board 7: its
// chapters draw different features, so no single ink would hold throughout.
const ACCENT = "#e8b96a";

function titleParts(seq) {
  let text;
  let colour = ACCENT;
  if (seq.chapters) text = seq.highlight?.text;
  else {
    const subject = seq.features.find((f) => f.plate) ?? seq.features[0];
    const feature = seq.highlight
      ? seq.features.find((f) => f.id === seq.highlight.feature)
      : subject;
    text = seq.highlight ? seq.highlight.text : subject?.name;
    colour = feature && featureInk(feature);
  }
  const at = text ? seq.title.lastIndexOf(text) : -1;
  if (at < 0) return [{ text: seq.title }];
  return [
    { text: seq.title.slice(0, at) },
    { text, colour },
    { text: seq.title.slice(at + text.length) },
  ].filter((p) => p.text);
}

function legendSwatch(item, content) {
  if (item.approximate) return "approximate";
  if (item.name) return content.names.find((n) => n.name === item.name).kind;
  if (item.place) return "place";
  if (item.outline) return "outline";
  const f = content.features.find((x) => x.id === item.feature);
  return f.kind === "area"
    ? `${f.certainty}-${f.ink}`
    : f.kind === "border"
      ? `border-${f.strength}`
      : "river";
}

function labelStyle(f) {
  if (f.plate) return "plate";
  return f.kind === "area" ? "area" : "water";
}

// The relief's light comes from the north-west of the hold target, low,
// with a soft fill (board 6). It is fixed for the whole video so shadows
// never suggest a time of day. Flat ground keeps the flat style's exposure.
const AMBIENT = 0.62;
function reliefLight(seq) {
  const { lon, lat } = seq.camera.at(-1);
  const [l, p] = [(lon * Math.PI) / 180, (lat * Math.PI) / 180];
  const up = [
    Math.cos(p) * Math.sin(l),
    Math.sin(p),
    Math.cos(p) * Math.cos(l),
  ];
  const east = [Math.cos(l), 0, -Math.sin(l)];
  const north = [
    -Math.sin(p) * Math.sin(l),
    Math.cos(p),
    -Math.sin(p) * Math.cos(l),
  ];
  const raw = up.map((u, i) => -east[i] + 1.1 * north[i] + 0.5 * u);
  const length = Math.hypot(...raw);
  const light = raw.map((v) => v / length);
  const facing = light.reduce((sum, v, i) => sum + v * up[i], 0);
  return { light, ambient: AMBIENT, sun: (1 - AMBIENT) / facing };
}

// Draped overlays live in the region's own map: longitude scaled by the
// cosine of the middle latitude, in screen pixels of the hold that shows
// them, so strokes keep their design width at every hold.
function drapeFrame(radius, bounds) {
  const [lonMin, lonMax, latMin, latMax] = bounds;
  const ppd = (radius * Math.PI) / 180;
  const cosLat = Math.cos((((latMin + latMax) / 2) * Math.PI) / 180);
  const width = (lonMax - lonMin) * cosLat * ppd;
  const height = (latMax - latMin) * ppd;
  return {
    width,
    height,
    scale: Math.min(DRAPE_SCALE, MAX_DRAPE / Math.max(width, height)),
    place: (lon, lat) => ({
      x: (lon - lonMin) * cosLat * ppd,
      y: (latMax - lat) * ppd,
      visible: true,
    }),
  };
}

const NO_CONTENT = { features: [], names: [], places: [], legend: [] };

// The names a chapter places on its map (0.4.0 board 13), once per chapter
// at its hold camera, on the raised ground in relief: the page draws them
// where the rule put them, and a name with no room goes to the legend.
function chapterPlacement(seq, index, relief, cache) {
  if (!cache.has(index)) {
    const camera = holdCameras(seq)[index];
    const at = relief
      ? (lon, lat) => project(camera, lon, lat, raiseFor(relief)(lon, lat))
      : (lon, lat) => project(camera, lon, lat);
    const specs = chapterLabels(seq, index);
    const obstacles = (seq.chapters[index].places ?? []).map((p) =>
      placeBox(camera, p, (_, lon, lat) => at(lon, lat))
    );
    const placed = placeLabels(
      specs.map((l) => ({ ...l, anchor: at(...l.lonLat) })),
      obstacles
    );
    cache.set(
      index,
      specs.map((spec, i) => ({ ...spec, ...placed[i] }))
    );
  }
  return cache.get(index);
}

const raiseFor = (relief) => (lon, lat) =>
  (relief.heightAt(lon, lat) * RELIEF.exaggeration) / EARTH_RADIUS_M;

function payload(seq, frame, relief, placements = new Map()) {
  const state = frameState(seq, frame);
  const { camera } = state;
  // A chained video draws the current chapter; its ending draws no map.
  const content = seq.chapters
    ? (seq.chapters[state.chapter] ?? NO_CONTENT)
    : seq;
  const features = content.features ?? [];
  const of = (kind) => features.filter((f) => f.kind === kind);
  const place = relief
    ? (lon, lat) => project(camera, lon, lat, raiseFor(relief)(lon, lat))
    : (lon, lat) => project(camera, lon, lat);
  const drape = relief?.drapes[Math.max(state.chapter ?? 0, 0)];
  const draw = relief ? drape.place : place;
  const outline = content.outline;
  const placed =
    seq.chapters && state.chapter !== null
      ? chapterPlacement(seq, state.chapter, relief, placements)
      : [];
  const centre = (box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });
  const opacityOf = (spec) =>
    spec.kind === "name"
      ? state.names[spec.key]
      : spec.style === "outline"
        ? state.outline.label
        : state.labels[spec.key];
  const outlinePlace = placed.find((p) => p.style === "outline");
  return {
    layout: seq.chapters ? "fullscreen" : "feed",
    chapter: state.chapter ?? null,
    centre: viewCentre(camera),
    camera,
    grade: state.grade,
    dim: state.dim ?? 0,
    tape: tapeText(seq),
    relief: relief && {
      view: tiltedCamera(camera),
      exaggeration: RELIEF.exaggeration,
      ...relief.light,
      drape: {
        width: drape.width,
        height: drape.height,
        scale: drape.scale,
      },
    },
    outline: outline &&
      state.outline && {
        d:
          outline.geometry.type === "Polygon"
            ? outline.geometry.coordinates
                .map((ring) => linePath(draw, ring, true))
                .join("")
            : linePath(draw, outline.geometry.coordinates),
        closed: outline.geometry.type === "Polygon",
        opacity: state.outline.opacity,
        label: {
          name: outline.name,
          opacity: outlinePlace?.box ? state.outline.label : 0,
          ...(outlinePlace?.box
            ? centre(outlinePlace.box)
            : place(...outline.labelAt)),
        },
      },
    areas: of("area").map((f) => ({
      d: rings(f.geometry)
        .map((ring) => linePath(draw, ring, true))
        .join(""),
      ink: f.ink,
      hatch: f.hatch ?? 45,
      uncertain: f.certainty === "uncertain",
      opacity: state.features[f.id].opacity,
    })),
    borders: of("border").map((f) => ({
      d: lines(f.geometry)
        .map((line) => linePath(draw, line))
        .join(""),
      strong: f.strength === "strong",
      opacity: state.features[f.id].opacity,
    })),
    rivers: of("river").map((f) => ({
      d: linePath(draw, f.geometry.coordinates),
      state: state.features[f.id],
    })),
    ...(seq.chapters
      ? placedNames(placed, opacityOf, centre)
      : {
          labels: features
            .filter((f) => f.kind !== "border")
            .map((f) => ({
              name: f.name,
              style: labelStyle(f),
              colour: f.kind === "area" ? INKS[f.ink] : null,
              opacity: state.labels[f.id],
              ...place(...f.labelAt),
            })),
          names: (content.names ?? []).map((n) => ({
            name: n.name,
            style: n.kind,
            kind: "name",
            opacity: state.names[n.name],
            ...place(n.lon, n.lat),
          })),
        }),
    places: (content.places ?? []).map((p) => ({
      name: p.name,
      side: p.side,
      opacity: state.places[p.name],
      ...place(p.lon, p.lat),
    })),
    head: {
      signature: state.text.signature,
      title: state.text.title,
      titleSize: seq.chapters ? 80 : 76,
    },
    title: titleParts(seq),
    marker: state.marker ?? null,
    subtitle: state.subtitle ?? null,
    closing: state.closing ?? null,
    legend: [
      ...content.legend.map((item, i) => {
        const f = item.feature && features.find((x) => x.id === item.feature);
        return {
          label: item.label,
          opacity: state.legend[i],
          swatch: legendSwatch(item, content),
          colour:
            f?.kind === "area"
              ? INKS[f.ink]
              : item.approximate
                ? "#cbbba3"
                : "#f3e9da",
        };
      }),
      ...placed
        .filter((p) => !p.box)
        .map((p) => ({
          label: p.text,
          opacity: opacityOf(p),
          swatch: "text",
          colour: "#f3e9da",
        })),
    ],
    caption: seq.chapters
      ? [
          ...state.caption.lines,
          { label: "Imagerie", text: state.caption.imagery, opacity: 1 },
        ]
      : captionLines(seq).map((line) => {
          const at = line.indexOf(" : ");
          return {
            label: line.slice(0, at),
            text: line.slice(at + 3),
            opacity: 1,
          };
        }),
  };
}

// Placed map names of a chained video: feature labels and names, each at
// the centre of its box and the size the rule chose. The outline's label
// travels with the outline.
function placedNames(placed, opacityOf, centre) {
  const drawn = placed.filter((p) => p.box && p.style !== "outline");
  const entry = (p) => ({
    name: p.text,
    style: p.style,
    size: p.size,
    kind: p.kind,
    colour: ["area", "quoted"].includes(p.style) ? INKS[p.ink] : null,
    opacity: opacityOf(p),
    ...centre(p.box),
  });
  return {
    labels: drawn.filter((p) => p.kind === "label").map(entry),
    names: drawn.filter((p) => p.kind === "name").map(entry),
  };
}
async function openRenderer(seq, assets) {
  const imagery = await prepareImagery(seq, assets);
  const runtime = JSON.parse(
    await readFile(resolve("social/renderer/runtime.json"))
  );
  const routes = new Map([
    ["/imagery/world.jpg", ["image/jpeg", imagery.world]],
    ["/imagery/region.jpg", ["image/jpeg", imagery.region]],
    [
      "/logo.png",
      [
        "image/png",
        await readFile(join(designRoot, "assets/Logo/ethniafrica-logo.png")),
      ],
    ],
  ]);
  let relief = null;
  if (seq.style === "relief") {
    const heights = await prepareRelief(imagery.bounds, assets);
    for (const key of ["world", "region"])
      routes.set(`/relief/${key}.f32`, [
        "application/octet-stream",
        Buffer.from(
          heights[key].data.buffer,
          heights[key].data.byteOffset,
          heights[key].data.byteLength
        ),
      ]);
    const holds = holdCameras(seq);
    const closest = Math.max(...holds.map((c) => c.radius));
    relief = {
      hash: heights.hash,
      heightAt: heightSampler(imagery.bounds, heights),
      light: reliefLight(seq),
      drapes: holds.map((c) => drapeFrame(c.radius, imagery.bounds)),
      setup: {
        world: [heights.world.width, heights.world.height],
        region: [heights.region.width, heights.region.height],
        // About three screen pixels per mesh cell at the closest hold.
        meshStep: (3 * 180) / (closest * Math.PI),
        exaggeration: RELIEF.exaggeration,
      },
    };
  }
  for (const f of FONTS)
    routes.set(`/fonts/${f}`, [
      "font/ttf",
      await readFile(join(designRoot, "fonts", f)),
    ]);
  const browser = await chromium.launch({ headless: true, args: BROWSER_ARGS });
  try {
    if (browser.version() !== runtime.chromium)
      throw new Error("Chromium version differs from verified runtime");
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      locale: "fr-FR",
      timezoneId: "UTC",
    });
    page.setDefaultTimeout(60000);
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://ethnia.test") return route.abort();
      if (url.pathname === "/")
        return route.fulfill({ contentType: "text/html", body: PAGE_HTML });
      const found = routes.get(url.pathname);
      if (!found) return route.abort();
      return route.fulfill({ contentType: found[0], body: found[1] });
    });
    await page.goto("http://ethnia.test/");
    const fonts = await page.evaluate(
      ([bounds, reliefSetup]) => window.setup(bounds, reliefSetup),
      [imagery.bounds, relief?.setup ?? null]
    );
    if (fonts.some((f) => f.status !== "loaded"))
      throw new Error("A required font is not loaded");
    const last = frameCount(seq) - 1;
    const placements = new Map();
    const render = async (frame) => {
      const state = frameState(seq, frame);
      const boxes = await page.evaluate(
        (f) => window.drawFrame(f),
        payload(seq, frame, relief, placements)
      );
      // The glyph boxes are checked on every hold: the last frame, and every
      // frame of a chained video where a chunk is fully drawn.
      if (frame === last || state.subtitle?.opacity === 1) {
        const problems = checkLayout({
          frame: seq.chapters ? "fullscreen" : "feed",
          elements: boxes,
        });
        if (problems.length)
          throw new Error(
            `Hold layout at frame ${frame}: ${problems.join("; ")}`
          );
      }
      return captureFrame(page);
    };
    return {
      render,
      close: () => browser.close(),
      runtime: { playwright: runtime.playwright, chromium: browser.version() },
      imageryHash: imagery.imageryHash,
      reliefHash: relief?.hash ?? null,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// The frame is already drawn when its pixels are captured. Under
// SwiftShader, headless Chromium now and then never answers one screenshot
// request (seen on frames 205 and 207 of the Sahara demo in one run, on none
// of them in the next): waiting longer does not help, while a new request
// returns at once. So a request gets 20 s, and a timed-out one is made again,
// three times at most; the page is not redrawn, so no pixel can change.
const CAPTURE = { attempts: 3, timeout: 20000 };
export async function captureFrame(page) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await page.screenshot({
        type: "png",
        animations: "disabled",
        timeout: CAPTURE.timeout,
      });
    } catch (error) {
      if (error.name !== "TimeoutError" || attempt >= CAPTURE.attempts)
        throw error;
    }
  }
}

// Several frames in one browser session: a relief setup costs more than a
// frame, so proofs and tests ask for their key frames together.
export async function renderFrames(seq, frames, { assets }) {
  frames.forEach((frame) => frameState(seq, frame));
  const renderer = await openRenderer(seq, assets);
  try {
    const pngs = [];
    for (const frame of frames) pngs.push(await renderer.render(frame));
    return pngs;
  } finally {
    await renderer.close();
  }
}

export async function renderFrame(seq, frame, options) {
  const [png] = await renderFrames(seq, [frame], options);
  return png;
}

// The voice file is checked again at export: the words were timed on the
// audio whose SHA-256 they record, and FFmpeg must read the same length.
export async function checkVoice(voice) {
  const hash = sha256(await readFile(voice.audio));
  if (hash !== voice.sha256)
    throw new Error(
      `The voice ${voice.audio} changed after it was timed: its SHA-256 differs from the words JSON`
    );
  const duration = Number(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      voice.audio,
    ]).toString()
  );
  if (!(Math.abs(duration - voice.duration) <= 1 / FPS))
    throw new Error(
      `The voice lasts ${duration} s; its words JSON says ${voice.duration} s`
    );
  return { sha256: hash, duration };
}

// The voice is muxed as AAC at 48 kHz, cut to the encoded frames and padded
// with silence to their end, so the video always keeps the schedule's
// length: the audio never shortens it.
export function audioArgs(voice, from, seconds) {
  if (!voice) return { input: [], output: ["-an"] };
  return {
    input: [
      "-ss",
      String(from / FPS),
      "-t",
      String(seconds),
      "-i",
      voice.audio,
    ],
    output: [
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-af",
      `apad=whole_dur=${seconds}`,
      "-flags:a",
      "+bitexact",
    ],
  };
}

// Pipes frames `from` to `to` (exclusive), drawn by `render(frame)` as PNG,
// into FFmpeg with the audio arguments of `audioArgs`. Shared by the
// satellite video and the series video (series-render.mjs).
export async function encodeFrames(file, { from, to, render, sound }) {
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-c:v",
      "png",
      "-i",
      "-",
      ...sound.input,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      ...sound.output,
      "-map_metadata",
      "-1",
      "-fflags",
      "+bitexact",
      "-movflags",
      "+faststart",
      "-y",
      file,
    ],
    { stdio: ["pipe", "ignore", "pipe"] }
  );
  let stderr = "";
  ffmpeg.stderr.on("data", (c) => (stderr += c));
  const done = new Promise((ok, ko) =>
    ffmpeg.on("close", (code) =>
      code === 0 ? ok() : ko(new Error(`FFmpeg failed: ${stderr}`))
    )
  );
  try {
    for (let f = from; f < to; f++) {
      const png = await render(f);
      if (!ffmpeg.stdin.write(png))
        await new Promise((ok) => ffmpeg.stdin.once("drain", ok));
    }
  } catch (error) {
    // A refused frame must not leave a playable excerpt behind.
    ffmpeg.kill("SIGKILL");
    await done.catch(() => {});
    await rm(file, { force: true });
    throw error;
  }
  ffmpeg.stdin.end();
  await done;
}

// `range` ({ from, to }, frames) encodes an excerpt, for a short proof.
export async function encodeVideo(seq, outDir, { assets, range }) {
  const count = frameCount(seq);
  const { from, to } = range ?? { from: 0, to: count };
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to > count ||
    from >= to
  )
    throw new Error(`An excerpt runs between frames 0 and ${count}`);
  const audio = seq.voice ? await checkVoice(seq.voice) : null;
  const sound = audioArgs(seq.voice, from, (to - from) / FPS);
  await mkdir(outDir, { recursive: true });
  const file = join(outDir, "video.mp4");
  const renderer = await openRenderer(seq, assets);
  const ffmpegVersion = execFileSync("ffmpeg", ["-version"])
    .toString()
    .split("\n")[0];
  try {
    await encodeFrames(file, { from, to, render: renderer.render, sound });
  } finally {
    await renderer.close();
  }
  const manifest = {
    schema: 1,
    design: seq.design,
    style: seq.style,
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    frames: to - from,
    ...(range && { range: { from, to } }),
    audio,
    demo: !!seq.demo,
    // Mechanical export only: editorial approvals live in the checkpoint.
    productionReady: false,
    runtime: { ...renderer.runtime, ffmpeg: ffmpegVersion },
    hashes: {
      sequence: sha256(JSON.stringify(seq)),
      imagery: renderer.imageryHash,
      relief: renderer.reliefHash,
      engine: await engineHash(),
      video: sha256(await readFile(file)),
    },
  };
  await writeFile(
    join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  return { file, manifest };
}
