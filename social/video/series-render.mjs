// Renders the series video (Cartes 1.4.0, full screen) frame by frame in the
// pinned Chromium, then encodes it with the satellite video's FFmpeg step.
// The cards come through the design system's own bundle, so fonts, inks and
// wording match the carousel. A map card (1.4.1) is drawn on the verified
// satellite imagery and Natural Earth's countries, both outside git: point
// ETHNIAFRICA_VIDEO_ASSETS at their folder, or pass `assets`.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SERIES_PAGE_HTML } from "./series-page.mjs";
import {
  loadSeriesVideo,
  seriesFrameState,
  seriesFrameCount,
  checkSeriesLayout,
  seriesSlices,
} from "./series.mjs";
import { FPS, WIDTH, HEIGHT, IMAGERY } from "./sequence.mjs";
import {
  captureFrame,
  checkVoice,
  audioArgs,
  encodeFrames,
  prepareImageryRegion,
  BROWSER_ARGS,
  GPU_BROWSER_ARGS,
  MAX_TEXTURE,
} from "./render.mjs";
import { DOWNLOADS, readVerified } from "./areas.mjs";
import {
  MAP_FRAME,
  MAP_IMAGERY,
  countryIndex,
  seriesMapView,
  sharedBorders,
} from "./series-map.mjs";
import { areaInks } from "./series-sequence.mjs";

const designRoot = fileURLToPath(new URL("../design-system/", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const MIME = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".html": "text/html",
};

// The series idents are pages of their own (social/series-idents) that link
// the site's colour tokens, the design system's fonts and the brand's logo by
// relative paths; they are served under /repo/, from these folders only.
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const IDENT_FOLDERS = [
  "social/series-idents/",
  "social/design-system/fonts/",
  "social/brand/",
  "src/styles/tokens/",
];
async function identFile(pathname) {
  const path = decodeURIComponent(pathname.slice("/repo/".length));
  if (path.includes("..") || !IDENT_FOLDERS.some((f) => path.startsWith(f)))
    return null;
  return readFile(join(repoRoot, path)).catch(() => null);
}

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
  // 1.11.0: the drawings the animated map cards use.
  for (const kind of illustrationsOf(seq))
    await add(
      `/design/assets/Illustrations/${kind}.svg`,
      `assets/Illustrations/${kind}.svg`
    );
  return { routes, tokens, cards };
}

const illustrationsOf = (seq) => [
  ...new Set(
    Object.values(seq.mapSequence?.cards ?? {}).flatMap((c) =>
      c.drawings.map((d) => d.kind)
    )
  ),
];

// The world texture is MAX_TEXTURE pixels around the Earth: a frame whose
// world texture would be enlarged past the scale limit at the end of the
// zoom needs the full-resolution region under it.
const needsRegion = ({ camera }) =>
  ((camera.radius * 2 * Math.PI) / MAX_TEXTURE) * MAP_FRAME.maxZoom >
  MAP_FRAME.maxScale;

// Every map card's view, and the imagery covering all of them. A map
// sequence's cards (1.5.0) come planned from series.mjs; only their border
// lines need Natural Earth's countries.
async function prepareMaps(seq, cards, routes, assets) {
  const plan = seq.mapSequence;
  const indices = cards.flatMap((c, i) =>
    c.type === "map" && !c.map.sequence ? [i] : []
  );
  if (!indices.length && !plan) return null;
  if (!assets)
    throw new Error(
      "A map card is drawn on the verified imagery: set ETHNIAFRICA_VIDEO_ASSETS"
    );
  const world = await readVerified(assets, "countries");
  const countries = countryIndex(world);
  // The imagery in use; 1.11.0 may draw on the 500 m mosaic (decision 1).
  const imageryId = seq.mapImagery ?? MAP_IMAGERY;
  const imagery = IMAGERY[imageryId];
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
  let sequence = null;
  if (plan) {
    const detailed = plan.cameras.filter(needsRegion);
    all.push(
      ...(detailed.length ? detailed : plan.cameras).map((c) => c.bounds)
    );
    const lineBounds = plan.cameras.map((c) => c.bounds);
    const shown = [
      Math.min(...lineBounds.map((b) => b[0])),
      Math.max(...lineBounds.map((b) => b[1])),
      Math.min(...lineBounds.map((b) => b[2])),
      Math.max(...lineBounds.map((b) => b[3])),
    ];
    sequence = {
      order: plan.order,
      areas: Object.fromEntries(
        Object.entries(plan.areas).map(([file, a]) => [
          file,
          {
            sequence: a.sequence,
            polygons: a.polygons,
            ink: a.ink,
            uncertain: a.uncertain,
            hatch: a.hatch,
            inks: areaInks(plan, file),
          },
        ])
      ),
      runs: plan.runs.map((r) => ({
        sequence: r.sequence,
        cards: r.cards,
        animated: !!plan.animated?.[r.sequence],
      })),
      views: Object.fromEntries(
        Object.entries(plan.views).map(([i, v]) => [
          i,
          {
            camera: v.camera,
            ...(v.stops && { stops: v.stops.map((s) => s.camera) }),
          },
        ])
      ),
      illustrations: illustrationsOf(seq),
      borders: plan.runs.map((r) => {
        const kind = plan.views[r.cards[0]].borders;
        return kind === "none"
          ? null
          : { strong: kind === "strong", lines: sharedBorders(world, shown) };
      }),
    };
    // A sequence card's foot: its key and credits.
    for (const [i, v] of Object.entries(plan.views))
      views[i] = { sequence: true, key: v.key, credits: v.credits };
  }
  const bounds = [
    Math.min(...all.map((b) => b[0])),
    Math.max(...all.map((b) => b[1])),
    Math.min(...all.map((b) => b[2])),
    Math.max(...all.map((b) => b[3])),
  ];
  const prepared = await prepareImageryRegion(imageryId, bounds, assets);
  routes.set("/imagery/world.jpg", prepared.world);
  routes.set("/imagery/region.jpg", prepared.region);
  // 1.11.0: the scale limit reads the file in use. A region too large for
  // one texture is reduced, so every view of an animated map that draws on
  // it is checked against the region's own resolution.
  if (plan)
    for (const { camera, bounds: ground } of plan.cameras.filter(needsRegion)) {
      const scale = (camera.radius * 2 * Math.PI) / prepared.regionWidth;
      const km = Math.round((1080 / camera.radius) * 6371);
      if (scale > MAP_FRAME.maxScale + 1e-9)
        throw new Error(
          `Vue plus proche que l'imagerie préparée : the region is ${Math.round(prepared.regionWidth)} px around the Earth, so a view ${km} km across enlarges it ${scale.toFixed(2)} times`
        );
      // Closer than the 2 km file allows: every pixel must be a tile's.
      const base = IMAGERY[imagery.world ?? imageryId].width;
      // B1 and C1 meet at the prime meridian: their union is one box.
      const cover = prepared.cover ?? [];
      const covered =
        cover.length > 0 &&
        ground[0] >= Math.min(...cover.map((c) => c[0])) &&
        ground[1] <= Math.max(...cover.map((c) => c[1])) &&
        ground[2] >= Math.min(...cover.map((c) => c[2])) &&
        ground[3] <= Math.max(...cover.map((c) => c[3]));
      if (
        (camera.radius * 2 * Math.PI) / base > MAP_FRAME.maxScale + 1e-9 &&
        !covered
      )
        throw new Error(
          `Vue plus proche que l'imagerie vérifiée hors des tuiles à 500 m : ${km} km across, ground ${ground.join(", ")}`
        );
    }
  const spans = { ...views, ...(plan?.views ?? {}) };
  return {
    bounds,
    views,
    sequence,
    record: {
      imagery: {
        id: imageryId,
        sha256: prepared.imageryHash,
        ...(prepared.tiles && { tiles: prepared.tiles }),
        regionPixelsAroundEarth: Math.round(prepared.regionWidth),
      },
      countries: DOWNLOADS.countries.sha256,
      cards: Object.keys(spans)
        .map(Number)
        .sort((a, b) => a - b)
        .map((i) => ({
          id: cards[i].id,
          spanKm: Math.round(spans[i].spanKm),
          capped: spans[i].capped,
        })),
    },
  };
}

// How far a GPU frame may sit from SwiftShader's, measured on 19 October
// 2026 on the parallel render's 716-frame test sequence: worst 40.9 dB and
// 0.21 % of pixels beyond 16 levels, on the globe's zoom (README, « GPU
// render »).
export const GPU_TOLERANCE = { psnr: 38, levels: 16, far: 0.005 };

// The WebGL renderer string the page reports, and whether it is SwiftShader.
// A GPU render that fell back to SwiftShader is refused, not recorded as GPU.
async function webglRuntime(page, gpu) {
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "none";
  });
  const backend = /SwiftShader/.test(renderer) ? "swiftshader" : "gpu";
  if (gpu && backend !== "gpu")
    throw new Error(`GPU render asked, but WebGL runs on ${renderer}`);
  return { backend, renderer };
}

// `diagnose` records layout problems on each result instead of refusing the
// frame, for a proof that shows a defect; an export made so says it. `gpu`
// draws WebGL on the GPU instead of SwiftShader.
export async function openSeriesRenderer(
  seq,
  {
    diagnose = false,
    gpu = false,
    assets = process.env.ETHNIAFRICA_VIDEO_ASSETS,
  } = {}
) {
  const runtime = JSON.parse(
    await readFile(new URL("../renderer/runtime.json", import.meta.url))
  );
  const { routes, tokens, cards } = await routesFor(seq);
  const maps = await prepareMaps(seq, cards, routes, assets);
  // A map card's WebGL runs on SwiftShader, as in the satellite video,
  // unless the GPU was asked for.
  const browser = await chromium.launch({
    headless: true,
    ...(gpu ? { args: GPU_BROWSER_ARGS } : maps && { args: BROWSER_ARGS }),
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
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://ethnia.test") return route.abort();
      if (url.pathname === "/")
        return route.fulfill({
          contentType: "text/html",
          body: SERIES_PAGE_HTML,
        });
      if (url.pathname.startsWith("/repo/")) {
        const file = await identFile(url.pathname);
        if (!file) return route.abort();
        return route.fulfill({
          contentType:
            MIME[extname(url.pathname)] ?? "application/octet-stream",
          body: file,
        });
      }
      const body = routes.get(decodeURIComponent(url.pathname));
      if (!body) return route.abort();
      return route.fulfill({
        contentType: MIME[extname(url.pathname)] ?? "application/octet-stream",
        body,
      });
    });
    await page.goto("http://ethnia.test/");
    const webgl = await webglRuntime(page, gpu);
    // 1.10.0: each card's subtitle lines and the zoom of its first frame,
    // for the calm zones measured on the picture alone.
    const subtitles = seq.cards.map((_, i) =>
      seq.chunks.filter((c) => c.card === i && !c.hidden).map((c) => c.lines)
    );
    const zooms = seq.cardStarts.map(
      (start, i) =>
        seriesFrameState(seq, start).layers.find((l) => l.card === i)?.zoom ?? 1
    );
    const ready = await page.evaluate((setup) => window.setup(setup), {
      tokens,
      cards,
      logo: seq.logo,
      demo: seq.demo,
      subtitles,
      zooms,
      maps: maps && {
        bounds: maps.bounds,
        views: maps.views,
        sequence: maps.sequence,
      },
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
      runtime: {
        playwright: runtime.playwright,
        chromium: browser.version(),
        webgl,
      },
      designVersion: ready.version,
      maps: maps?.record ?? null,
      calm: ready.calm,
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

// One slice [from, to) in its own browser, encoded into `target` with the
// satellite video's FFmpeg step. `stopped()` returns another slice's error
// once one has failed, so this one stops at its next frame. A browser's
// first frame anti-aliases a few edges otherwise than the frames after it,
// so a slice first draws the WARM_UP frames before it, unkept, as a single
// pass has drawn them (5 pixels differed at a cut without it).
const WARM_UP = 30;
async function encodeSlice(seq, { from, to }, target, sound, options, stopped) {
  const renderer = await openSeriesRenderer(seq, options);
  const problems = [];
  try {
    for (let f = Math.max(0, from - WARM_UP); f < from; f++) {
      const failure = stopped();
      if (failure) throw failure;
      await renderer.draw(f);
      await renderer.capture();
    }
    await encodeFrames(target, {
      from,
      to,
      render: async (f) => {
        const failure = stopped();
        if (failure) throw failure;
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
  return { renderer, problems };
}

// Joins the silent slices `parts` into `file` without re-encoding, through
// the concat list `list`, and adds the voice once on the joined file with
// the arguments of a single pass. The concat demuxer reads each entry
// relative to the list's own folder, not to the working directory, so the
// list names each slice by its file name: the slices sit beside it.
export async function joinSlices(parts, list, file, voice, count) {
  await writeFile(
    list,
    parts
      .map((p) => `file '${basename(p).replaceAll("'", "'\\''")}'\n`)
      .join("")
  );
  const sound = audioArgs(voice, 0, count / FPS);
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      list,
      ...sound.input,
      "-c:v",
      "copy",
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
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

// The parallel final render (operator, 19 October 2026): each slice is
// encoded without sound by its own browser, the slices are joined without
// re-encoding, and the voice is added once on the joined file with the
// arguments of a single pass. A failed slice stops the others, and no
// video.mp4 nor slice file remains.
async function encodeSlices(seq, slices, file, options) {
  const parts = slices.map((_, k) => `${file}.part-${k}.mp4`);
  const list = `${file}.parts.txt`;
  let failure = null;
  const silent = audioArgs(null);
  try {
    const done = await Promise.allSettled(
      slices.map((slice, k) =>
        encodeSlice(seq, slice, parts[k], silent, options, () => failure).catch(
          (error) => {
            failure ??= error;
            throw error;
          }
        )
      )
    );
    if (failure) throw failure;
    await joinSlices(parts, list, file, seq.voice, seriesFrameCount(seq));
    return {
      renderer: done[0].value.renderer,
      problems: done.flatMap((d) => d.value.problems),
    };
  } catch (error) {
    await rm(file, { force: true });
    throw error;
  } finally {
    await Promise.all([...parts, list].map((p) => rm(p, { force: true })));
  }
}

// The joined file must hold every frame at 30 frames a second, as the
// package checks it (package.mjs, probeVideo).
function checkEncoded(file, count) {
  const [stream] = JSON.parse(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=nb_frames,avg_frame_rate",
      "-of",
      "json",
      file,
    ]).toString()
  ).streams;
  if (
    Number(stream?.nb_frames) !== count ||
    stream.avg_frame_rate !== `${FPS}/1`
  )
    throw new Error(
      `video.mp4 holds ${stream?.nb_frames} frames at ${stream?.avg_frame_rate}, not ${count} at ${FPS}/1`
    );
}

// `workers` browsers render the video in as many slices (seriesSlices); one
// worker is the single pass. Each worker holds about 2.7 to 2.9 GB at its
// peak (Chromium, Node and FFmpeg): three is the default on a 16 GB machine.
export async function encodeSeriesVideo(
  seq,
  outDir,
  { diagnose = false, assets, workers = 3, gpu = false } = {}
) {
  // Hashed before drawing, as loaded: the package loads the sequence again and
  // compares, so a sequence edited after encoding needs a new encode.
  const sequence = sha256(JSON.stringify(seq));
  const count = seriesFrameCount(seq);
  // 1.11.0: a fact said on a map phase with no mark on screen.
  const failing = (seq.silent ?? []).filter((f) => !f.pass);
  if (failing.length && !seq.demo && !diagnose)
    throw new Error(
      `Fait sans marque à l'écran, refusé à l'export final : ${failing.map((f) => `« ${f.say} » (${f.card})`).join(", ")}`
    );
  const audio = await checkVoice(seq.voice);
  const slices = seriesSlices(seq, workers);
  // Resolved once: every path built from it then names the same file
  // whichever tool reads it, and whatever folder that tool reads from.
  outDir = resolve(outDir);
  await mkdir(outDir, { recursive: true });
  const file = join(outDir, "video.mp4");
  await rm(file, { force: true });
  const options = { diagnose, gpu, ...(assets && { assets }) };
  const ffmpeg = execFileSync("ffmpeg", ["-version"]).toString().split("\n")[0];
  const { renderer, problems } =
    slices.length === 1
      ? await encodeSlice(
          seq,
          slices[0],
          file,
          audioArgs(seq.voice, 0, count / FPS),
          options,
          () => null
        )
      : await encodeSlices(seq, slices, file, options);
  try {
    checkEncoded(file, count);
  } catch (error) {
    await rm(file, { force: true });
    throw error;
  }
  const engine = await Promise.all(
    [
      "series.mjs",
      "series-page.mjs",
      "series-render.mjs",
      "series-map.mjs",
      "series-sequence.mjs",
      "sequence.mjs",
      "render.mjs",
      "page.mjs",
      // The series idents draw the intro and the ending.
      "../series-idents/ident.html",
      "../series-idents/endcard.html",
      "../series-idents/idents.mjs",
      "../series-idents/idents.css",
      "../series-idents/shots.mjs",
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
    // 1.10.0: each card's small-text zones, their busyness before and after
    // the blur, and whether the card is calm.
    calm: renderer.calm,
    // 1.11.0: each fact of a map phase, its marks' coverage and delay.
    ...(seq.silent?.length && { silent: seq.silent }),
    demo: !!seq.demo,
    ...(seq.warnings.length && { warnings: seq.warnings }),
    // A diagnostic export lists the frames whose text left its band.
    ...(diagnose && { diagnostic: true, layoutProblems: problems }),
    // The parallel render: the browsers that drew it, and the first frame of
    // each slice after the first.
    workers: slices.length,
    cuts: slices.slice(1).map((s) => s.from),
    // Mechanical export only: editorial approvals live in the checkpoint.
    productionReady: false,
    runtime: { ...renderer.runtime, ffmpeg },
    hashes: {
      sequence,
      cards: sha256(await readFile(seq.cardsFile)),
      engine: sha256(Buffer.concat(engine)),
      video: sha256(await readFile(file)),
      // The end card's answer, copied from the name's live page.
      ...(seq.cards.at(-1).outro && {
        identLayer: sha256(
          await readFile(
            join(
              repoRoot,
              "social/series-idents/layers",
              `${seq.cards.at(-1).outro.layers}.json`
            )
          )
        ),
      }),
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
//   [--diagnose] records layout problems instead of refusing the frame;
//   [--workers N] renders the video in N slices in parallel (3 by
//   default; 1 is the single pass);
//   [--gpu] draws WebGL on the Mac's GPU instead of SwiftShader.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (name) => {
    const at = process.argv.indexOf(name);
    return at < 0 ? undefined : process.argv[at + 1];
  };
  const file = arg("--sequence");
  const out = arg("--out");
  if (!file || !out)
    throw new Error(
      "Usage: series-render.mjs --sequence FILE --out DIR [--frames N,N] [--diagnose] [--workers N] [--gpu]"
    );
  const seq = loadSeriesVideo(JSON.parse(await readFile(file, "utf8")), {
    dir: dirname(resolve(file)),
  });
  seq.warnings.forEach((w) => console.warn(`Warning: ${w}`));
  const diagnose = process.argv.includes("--diagnose");
  const gpu = process.argv.includes("--gpu");
  if (arg("--frames")) {
    await mkdir(out, { recursive: true });
    const frames = arg("--frames").split(",").map(Number);
    for (const r of await renderSeriesFrames(seq, frames, { diagnose, gpu }))
      await writeFile(
        join(out, `frame-${String(r.frame).padStart(4, "0")}.png`),
        r.png
      );
  } else {
    const workers = Number(arg("--workers") ?? 3);
    console.log(
      (await encodeSeriesVideo(seq, out, { diagnose, workers, gpu })).file
    );
  }
}
