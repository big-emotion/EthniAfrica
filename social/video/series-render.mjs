// Renders the series video (Cartes 1.4.0, full screen) frame by frame in the
// pinned Chromium, then encodes it with the satellite video's FFmpeg step.
// The cards come through the design system's own bundle, so fonts, inks and
// wording match the carousel. A map card (1.4.1) is drawn on the verified
// satellite imagery and Natural Earth's countries, both outside git: point
// ETHNIAFRICA_VIDEO_ASSETS at their folder, or pass `assets`.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SERIES_PAGE_HTML } from "./series-page.mjs";
import {
  loadSeriesVideo,
  seriesFrameState,
  seriesFrameCount,
  checkSeriesLayout,
} from "./series.mjs";
import { FPS, WIDTH, HEIGHT, IMAGERY } from "./sequence.mjs";
import {
  captureFrame,
  checkVoice,
  audioArgs,
  encodeFrames,
  prepareImageryRegion,
  BROWSER_ARGS,
} from "./render.mjs";
import { DOWNLOADS, readVerified } from "./areas.mjs";
import { countryIndex, seriesMapView } from "./series-map.mjs";

// The verified imagery of the series map cards (series.md, « Scale limit »).
const MAP_IMAGERY = "bmng-2004-07-topo-bathy";

const designRoot = fileURLToPath(new URL("../design-system/", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const MIME = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

// Design files, fonts and the images the cards use, read once; a map card's
// geometry is attached to its spec as the card renderer does.
async function routesFor(seq) {
  const routes = new Map();
  const add = async (route, file) =>
    routes.set(route, await readFile(join(designRoot, file)));
  await add("/design/components/bundle.js", "components/bundle.js");
  await add("/design/components/bundle.css", "components/bundle.css");
  const tokens = JSON.parse(await readFile(join(designRoot, "tokens.json")));
  for (const f of tokens.type.fonts) await add(`/design/${f.file}`, f.file);
  await add(
    "/design/fonts/NotoSansArabic-SemiBold.ttf",
    "fonts/NotoSansArabic-SemiBold.ttf"
  );
  await add(`/assets/${seq.logo}`, `assets/${seq.logo}`);
  const cards = [];
  for (const card of seq.cards) {
    const spec = structuredClone(card);
    if (spec.image)
      await add(`/assets/${spec.image.src}`, `assets/${spec.image.src}`);
    if (spec.map?.dataRef)
      spec.map.data = JSON.parse(
        await readFile(join(designRoot, "assets", spec.map.dataRef))
      );
    cards.push(spec);
  }
  return { routes, tokens, cards };
}

// Every map card's view, and the imagery covering all of them.
async function prepareMaps(cards, routes, assets) {
  const indices = cards.flatMap((c, i) => (c.type === "map" ? [i] : []));
  if (!indices.length) return null;
  if (!assets)
    throw new Error(
      "A map card is drawn on the verified imagery: set ETHNIAFRICA_VIDEO_ASSETS"
    );
  const world = await readVerified(assets, "countries");
  const countries = countryIndex(world);
  const imagery = IMAGERY[MAP_IMAGERY];
  const views = {};
  for (const i of indices)
    views[i] = seriesMapView(
      cards[i],
      cards[i].map.data,
      countries,
      world,
      imagery
    );
  const all = Object.values(views).map((v) => v.bounds);
  const bounds = [
    Math.min(...all.map((b) => b[0])),
    Math.max(...all.map((b) => b[1])),
    Math.min(...all.map((b) => b[2])),
    Math.max(...all.map((b) => b[3])),
  ];
  const prepared = await prepareImageryRegion(MAP_IMAGERY, bounds, assets);
  routes.set("/imagery/world.jpg", prepared.world);
  routes.set("/imagery/region.jpg", prepared.region);
  return {
    bounds,
    views,
    record: {
      imagery: { id: MAP_IMAGERY, sha256: prepared.imageryHash },
      countries: DOWNLOADS.countries.sha256,
      cards: indices.map((i) => ({
        id: cards[i].id,
        spanKm: Math.round(views[i].spanKm),
        capped: views[i].capped,
      })),
    },
  };
}

// `diagnose` records layout problems on each result instead of refusing the
// frame, for a proof that shows a defect; an export made so says it.
async function openSeriesRenderer(
  seq,
  { diagnose = false, assets = process.env.ETHNIAFRICA_VIDEO_ASSETS } = {}
) {
  const runtime = JSON.parse(
    await readFile(new URL("../renderer/runtime.json", import.meta.url))
  );
  const { routes, tokens, cards } = await routesFor(seq);
  const maps = await prepareMaps(cards, routes, assets);
  // A map card's WebGL runs on SwiftShader, as in the satellite video.
  const browser = await chromium.launch({
    headless: true,
    ...(maps && { args: BROWSER_ARGS }),
  });
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
        return route.fulfill({
          contentType: "text/html",
          body: SERIES_PAGE_HTML,
        });
      const body = routes.get(decodeURIComponent(url.pathname));
      if (!body) return route.abort();
      return route.fulfill({
        contentType: MIME[extname(url.pathname)] ?? "application/octet-stream",
        body,
      });
    });
    await page.goto("http://ethnia.test/");
    const ready = await page.evaluate((setup) => window.setup(setup), {
      tokens,
      cards,
      logo: seq.logo,
      demo: seq.demo,
      maps: maps && { bounds: maps.bounds, views: maps.views },
    });
    if (ready.broken.length)
      throw new Error(`Images not loaded: ${ready.broken.join(", ")}`);
    if (ready.fonts.some((ok) => !ok))
      throw new Error("A required font is not loaded");
    const last = seriesFrameCount(seq) - 1;
    // The text boxes are checked on the cover, the last frame and every frame
    // where a subtitle is fully drawn, so every card and the ending are seen.
    const draw = async (frame) => {
      const state = seriesFrameState(seq, frame);
      const drawn = await page.evaluate((s) => window.drawFrame(s), state);
      if (frame === 0 || frame === last || state.subtitle?.opacity === 1) {
        // A demonstration only reports images too small for the frame: the
        // library holds web renditions; a final video refuses them.
        const problems = checkSeriesLayout(drawn.boxes, { demo: !!seq.demo });
        if (problems.length && !diagnose)
          throw new Error(`Layout at frame ${frame}: ${problems.join("; ")}`);
        drawn.problems = problems;
      }
      if (/Faites défiler/i.test(drawn.text))
        throw new Error(`Frame ${frame} asks to scroll: « Faites défiler »`);
      return { ...drawn, state };
    };
    return {
      draw,
      capture: () => captureFrame(page),
      close: () => browser.close(),
      runtime: { playwright: runtime.playwright, chromium: browser.version() },
      designVersion: ready.version,
      maps: maps?.record ?? null,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Several frames in one browser session: [{ frame, png, boxes, text, lit, state }].
export async function renderSeriesFrames(seq, frames, options) {
  const renderer = await openSeriesRenderer(seq, options);
  try {
    const out = [];
    for (const frame of frames) {
      const drawn = await renderer.draw(frame);
      out.push({ frame, ...drawn, png: await renderer.capture() });
    }
    return out;
  } finally {
    await renderer.close();
  }
}

export async function encodeSeriesVideo(
  seq,
  outDir,
  { diagnose = false, assets } = {}
) {
  const count = seriesFrameCount(seq);
  const audio = await checkVoice(seq.voice);
  const sound = audioArgs(seq.voice, 0, count / FPS);
  await mkdir(outDir, { recursive: true });
  const file = join(outDir, "video.mp4");
  const renderer = await openSeriesRenderer(seq, {
    diagnose,
    ...(assets && { assets }),
  });
  const problems = [];
  const ffmpeg = execFileSync("ffmpeg", ["-version"]).toString().split("\n")[0];
  try {
    await encodeFrames(file, {
      from: 0,
      to: count,
      render: async (f) => {
        const drawn = await renderer.draw(f);
        if (drawn.problems?.length)
          problems.push({ frame: f, problems: drawn.problems });
        return renderer.capture();
      },
      sound,
    });
  } finally {
    await renderer.close();
  }
  const engine = await Promise.all(
    [
      "series.mjs",
      "series-page.mjs",
      "series-render.mjs",
      "series-map.mjs",
      "sequence.mjs",
      "render.mjs",
      "page.mjs",
    ].map((f) => readFile(new URL(f, import.meta.url)))
  );
  const manifest = {
    schema: 1,
    design: seq.design,
    designVersion: renderer.designVersion,
    layout: "full",
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    frames: count,
    cards: seq.cards.map((c) => c.id),
    audio,
    // 1.4.1: the verified imagery and countries under the map cards.
    ...(renderer.maps && { maps: renderer.maps }),
    demo: !!seq.demo,
    ...(seq.warnings.length && { warnings: seq.warnings }),
    // A diagnostic export lists the frames whose text left its band.
    ...(diagnose && { diagnostic: true, layoutProblems: problems }),
    // Mechanical export only: editorial approvals live in the checkpoint.
    productionReady: false,
    runtime: { ...renderer.runtime, ffmpeg },
    hashes: {
      cards: sha256(await readFile(seq.cardsFile)),
      engine: sha256(Buffer.concat(engine)),
      video: sha256(await readFile(file)),
    },
  };
  await writeFile(
    join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  return { file, manifest };
}

// node social/video/series-render.mjs --sequence FILE --out DIR
//   [--frames 0,120,…] writes those frames as PNG instead of the video;
//   [--diagnose] records layout problems instead of refusing the frame.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (name) => {
    const at = process.argv.indexOf(name);
    return at < 0 ? undefined : process.argv[at + 1];
  };
  const file = arg("--sequence");
  const out = arg("--out");
  if (!file || !out)
    throw new Error(
      "Usage: series-render.mjs --sequence FILE --out DIR [--frames N,N] [--diagnose]"
    );
  const seq = loadSeriesVideo(JSON.parse(await readFile(file, "utf8")), {
    dir: dirname(resolve(file)),
  });
  seq.warnings.forEach((w) => console.warn(`Warning: ${w}`));
  const diagnose = process.argv.includes("--diagnose");
  if (arg("--frames")) {
    await mkdir(out, { recursive: true });
    const frames = arg("--frames").split(",").map(Number);
    for (const r of await renderSeriesFrames(seq, frames, { diagnose }))
      await writeFile(
        join(out, `frame-${String(r.frame).padStart(4, "0")}.png`),
        r.png
      );
  } else console.log((await encodeSeriesVideo(seq, out, { diagnose })).file);
}
