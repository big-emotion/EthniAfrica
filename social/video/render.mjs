// Renders a loaded sequence frame by frame in the pinned Chromium (the card
// renderer's runtime) and encodes it with FFmpeg. The engine decision and
// its limits are recorded in the step 9 acceptance notes.
import { chromium } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { PAGE_HTML } from "./page.mjs";
import {
  IMAGERY,
  FPS,
  WIDTH,
  HEIGHT,
  VIEW_CENTRE,
  RELIEF,
  frameState,
  frameCount,
  holdCameras,
  project,
  unproject,
  tiltedCamera,
  captionLines,
  checkLayout,
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
const BROWSER_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
// Largest texture side SwiftShader accepts; the world mosaic is reduced to it.
const MAX_TEXTURE = 8192;

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
  for (const camera of holdCameras(seq))
    for (let x = 0; x <= WIDTH; x += WIDTH / 12)
      for (let y = 200; y <= 1300; y += 50) {
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
  const entry = IMAGERY[seq.imagery];
  if (!entry.file)
    throw new Error(`No verified local imagery file for ${seq.imagery}`);
  const path = join(assets, entry.file);
  const bytes = await readFile(path).catch(() => {
    throw new Error(`Verified imagery file is missing: ${entry.file}`);
  });
  if (sha256(bytes) !== entry.sha256)
    throw new Error(
      `Imagery file differs from the verified one: ${entry.file}`
    );
  const bounds = holdBounds(seq);
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
  if (!(await exists(region))) {
    const { width, height } = await source().metadata();
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
  return {
    bounds,
    imageryHash: entry.sha256,
    world: await readFile(world),
    region: await readFile(region),
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

function payload(seq, frame, relief) {
  const state = frameState(seq, frame);
  const { camera } = state;
  // A chained video draws the current chapter; its ending draws no map.
  const content = seq.chapters
    ? (seq.chapters[state.chapter] ?? NO_CONTENT)
    : seq;
  const features = content.features ?? [];
  const of = (kind) => features.filter((f) => f.kind === kind);
  const raise = (lon, lat) =>
    (relief.heightAt(lon, lat) * RELIEF.exaggeration) / EARTH_RADIUS_M;
  const place = relief
    ? (lon, lat) => project(camera, lon, lat, raise(lon, lat))
    : (lon, lat) => project(camera, lon, lat);
  const drape = relief?.drapes[Math.max(state.chapter ?? 0, 0)];
  const draw = relief ? drape.place : place;
  const outline = content.outline;
  return {
    centre: VIEW_CENTRE,
    camera,
    grade: state.grade,
    dim: state.dim ?? 0,
    tape: seq.demo
      ? outline?.illustrative
        ? "Texte illustratif · contour de synthèse"
        : "Texte illustratif"
      : null,
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
          opacity: state.outline.label,
          ...place(...outline.labelAt),
        },
      },
    areas: of("area").map((f) => ({
      d: rings(f.geometry)
        .map((ring) => linePath(draw, ring, true))
        .join(""),
      ink: f.ink,
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
      opacity: state.names[n.name],
      ...place(n.lon, n.lat),
    })),
    places: (content.places ?? []).map((p) => ({
      name: p.name,
      side: p.side,
      opacity: state.places[p.name],
      ...place(p.lon, p.lat),
    })),
    head: {
      signature: state.text.signature,
      title: state.text.title,
      titleSize: seq.chapters ? 72 : 76,
    },
    title: titleParts(seq),
    marker: state.marker ?? null,
    subtitle: state.subtitle ?? null,
    closing: state.closing ?? null,
    legend: content.legend.map((item, i) => {
      const f = item.feature && features.find((x) => x.id === item.feature);
      return {
        label: item.label,
        opacity: state.legend[i],
        swatch: legendSwatch(item, content),
        colour: f?.kind === "area" ? INKS[f.ink] : "#f3e9da",
      };
    }),
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
    const render = async (frame) => {
      const state = frameState(seq, frame);
      const boxes = await page.evaluate(
        (f) => window.drawFrame(f),
        payload(seq, frame, relief)
      );
      // The glyph boxes are checked on every hold: the last frame, and every
      // fully drawn chapter of a chained video.
      if (frame === last || state.subtitle?.opacity === 1) {
        const problems = checkLayout({ elements: boxes });
        if (problems.length)
          throw new Error(
            `Hold layout at frame ${frame}: ${problems.join("; ")}`
          );
      }
      return page.screenshot({ type: "png", animations: "disabled" });
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

export async function encodeVideo(seq, outDir, { assets }) {
  await mkdir(outDir, { recursive: true });
  const file = join(outDir, "video.mp4");
  const renderer = await openRenderer(seq, assets);
  const ffmpegVersion = execFileSync("ffmpeg", ["-version"])
    .toString()
    .split("\n")[0];
  try {
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
        "-an",
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
    for (let f = 0; f < frameCount(seq); f++) {
      const png = await renderer.render(f);
      if (!ffmpeg.stdin.write(png))
        await new Promise((ok) => ffmpeg.stdin.once("drain", ok));
    }
    ffmpeg.stdin.end();
    await done;
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
    frames: frameCount(seq),
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
