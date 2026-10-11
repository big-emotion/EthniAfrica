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
  TOTAL_FRAMES,
  WIDTH,
  HEIGHT,
  VIEW_CENTRE,
  frameState,
  project,
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
];
// SwiftShader keeps WebGL on the CPU, so the same frame gives the same pixels
// on a given machine regardless of the GPU.
const BROWSER_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
// Largest texture side SwiftShader accepts; the world mosaic is reduced to it.
const MAX_TEXTURE = 8192;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function engineHash() {
  const parts = await Promise.all(
    ["render.mjs", "page.mjs", "sequence.mjs"].map((f) =>
      readFile(new URL(f, here))
    )
  );
  return sha256(Buffer.concat(parts));
}

// Geographic bounds of everything the final camera shows, so the full
// resolution crop covers the hold with a margin.
function holdBounds(seq) {
  const cam = seq.camera.at(-1);
  const corners = [];
  for (const x of [0, WIDTH / 2, WIDTH])
    for (const y of [0, HEIGHT / 2, HEIGHT]) {
      const nx = (x - VIEW_CENTRE.x) / cam.radius;
      const ny = -(y - VIEW_CENTRE.y) / cam.radius;
      const rho = Math.hypot(nx, ny);
      if (rho >= 1) return [-180, 180, -90, 90];
      const c = Math.asin(rho);
      const p0 = (cam.lat * Math.PI) / 180;
      const lat = Math.asin(
        Math.cos(c) * Math.sin(p0) +
          (rho ? (ny * Math.sin(c) * Math.cos(p0)) / rho : 0)
      );
      const lon =
        (cam.lon * Math.PI) / 180 +
        Math.atan2(
          nx * Math.sin(c),
          rho * Math.cos(c) * Math.cos(p0) - ny * Math.sin(c) * Math.sin(p0)
        );
      corners.push([(lon * 180) / Math.PI, (lat * 180) / Math.PI]);
    }
  const lons = corners.map((c) => c[0]);
  const lats = corners.map((c) => c[1]);
  return [
    Math.max(-180, Math.floor(Math.min(...lons)) - 2),
    Math.min(180, Math.ceil(Math.max(...lons)) + 2),
    Math.max(-90, Math.floor(Math.min(...lats)) - 2),
    Math.min(90, Math.ceil(Math.max(...lats)) + 2),
  ];
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
  const exists = (p) =>
    access(p).then(
      () => true,
      () => false
    );
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

function riverPath(camera, coordinates) {
  let d = "";
  let pen = false;
  for (const [lon, lat] of coordinates) {
    const p = project(camera, lon, lat);
    if (!p.visible) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    pen = true;
  }
  return d;
}

function titleParts(seq) {
  const name = seq.features[0]?.name;
  const at = name ? seq.title.lastIndexOf(name) : -1;
  if (at < 0) return [{ text: seq.title }];
  return [
    { text: seq.title.slice(0, at) },
    { text: name, water: true },
    { text: seq.title.slice(at + name.length) },
  ].filter((p) => p.text);
}

function payload(seq, frame) {
  const state = frameState(seq, frame);
  const { camera } = state;
  return {
    centre: VIEW_CENTRE,
    camera,
    grade: state.grade,
    demo: !!seq.demo,
    rivers: seq.features.map((f) => ({
      d: riverPath(camera, f.geometry.coordinates),
      state: state.features[f.id],
    })),
    labels: seq.features.map((f) => ({
      name: f.name,
      opacity: state.labels[f.id],
      ...project(camera, ...f.labelAt),
    })),
    places: (seq.places ?? []).map((p) => ({
      name: p.name,
      side: p.side,
      opacity: state.places[p.name],
      ...project(camera, p.lon, p.lat),
    })),
    title: titleParts(seq),
    legend: seq.legend.map((item, i) => ({
      label: item.label,
      opacity: state.legend[i],
    })),
    caption: captionLines(seq).map((line) => {
      const at = line.indexOf(" : ");
      return [line.slice(0, at), line.slice(at + 3)];
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
      (bounds) => window.setup(bounds),
      imagery.bounds
    );
    if (fonts.some((f) => f.status !== "loaded"))
      throw new Error("A required font is not loaded");
    const render = async (frame) => {
      const boxes = await page.evaluate(
        (f) => window.drawFrame(f),
        payload(seq, frame)
      );
      if (frame === TOTAL_FRAMES - 1) {
        const problems = checkLayout({ elements: boxes });
        if (problems.length)
          throw new Error(`Hold layout: ${problems.join("; ")}`);
      }
      return page.screenshot({ type: "png", animations: "disabled" });
    };
    return {
      render,
      close: () => browser.close(),
      runtime: { playwright: runtime.playwright, chromium: browser.version() },
      imageryHash: imagery.imageryHash,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function renderFrame(seq, frame, { assets }) {
  frameState(seq, frame);
  const renderer = await openRenderer(seq, assets);
  try {
    return await renderer.render(frame);
  } finally {
    await renderer.close();
  }
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
    for (let f = 0; f < TOTAL_FRAMES; f++) {
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
    frames: TOTAL_FRAMES,
    demo: !!seq.demo,
    // Mechanical export only: editorial approvals live in the checkpoint.
    productionReady: false,
    runtime: { ...renderer.runtime, ffmpeg: ffmpegVersion },
    hashes: {
      sequence: sha256(JSON.stringify(seq)),
      imagery: renderer.imageryHash,
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
