// Renders a reel clip: the excerpt framed in one of the two published
// gabarits (see layout.mjs) over a blurred copy of itself, with credit,
// captions, boxes, translated on-screen text and watermark, plus its SRT and
// cover.
//
// Text is drawn in the pinned Chromium shared with the card and map-video
// renderers, so captions use the same fonts and runtime; FFmpeg only composes
// pictures. The workstation's FFmpeg has no libass or drawtext, which is why
// the text arrives as transparent PNG layers rather than as a filter.
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  validatePlan,
  reelDuration,
  reelPhrases,
  reelBoxes,
  reelOverlays,
  overlayTrack,
  toSrt,
  captionTrack,
} from "./plan.mjs";
import {
  WIDTH,
  HEIGHT,
  layoutFor,
  sourceRect,
  toReelPoint,
} from "./layout.mjs";

const FPS = 30;
const brandFonts = resolve("social/brand/fonts");
const logo = resolve("social/design-system/assets/Logo/ethniafrica-logo.png");
const FONTS = {
  Caption: "Montserrat-ExtraBold.ttf",
  Credit: "NotoSans-Bold.ttf",
  Signature: "Fraunces.ttf",
  Title: "Anton-Regular.ttf",
};
// Design system accent on the night ground (tokens.json, `accent`).
const ACCENT = "#e8b96a";

const escape = (s) =>
  String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// Band values were measured on the Sankara, Mitchell and Mangope reels;
// portrait values on the « sauvage » reel, whose text sits on the picture on a
// translucent plate rather than under it.
function styles(layout, rect) {
  const below = rect.y + rect.h;
  const plate = `background:rgba(0,0,0,.5);padding:2px 14px;
    -webkit-box-decoration-break:clone;box-decoration-break:clone`;
  const common = `
.box{position:absolute;left:50%;transform:translateX(-50%);bottom:${HEIGHT - rect.y + 36}px;
  width:max-content;max-width:900px;padding:18px 30px;background:#fff;color:#000;
  text-align:center;font:52px/64px Caption;text-transform:uppercase}
.title{position:absolute;left:60px;width:960px;top:1190px;transform:translateY(-50%);
  text-align:center;font:118px/1.05 Title;color:#fff;text-transform:uppercase;
  text-shadow:0 4px 18px rgba(0,0,0,.7)}
.title em{font-style:normal;color:${ACCENT}}
.overlay{position:absolute;transform:translate(-50%,-50%);width:max-content;
  max-width:${Math.round(rect.w * 0.86)}px;text-align:center;font:44px/1.3 Credit;color:#fff}
.overlay span{${plate}}
.signature{position:absolute;left:0;right:0;display:flex;justify-content:center;align-items:center}
.signature img{filter:brightness(0) invert(1)}
.signature b{display:block;font-family:Signature;font-weight:700;color:#fff}
.signature i{display:block;font-family:Signature;font-weight:600;font-style:normal;color:#fff}`;
  if (layout.name === "portrait")
    return (
      common +
      `
.credit{position:absolute;left:60px;width:960px;top:${below + 20}px;text-align:center;
  font:26px/1.3 Credit;color:#fff;opacity:.9}
.caption{position:absolute;left:${rect.x + 40}px;width:${rect.w - 80}px;
  top:${Math.round(rect.y + rect.h * 0.82)}px;transform:translateY(-50%);
  text-align:center;font:46px/1.3 Credit;color:#fff}
.caption span{${plate}}
.signature{top:${below + 62}px;gap:12px;opacity:.95}
.signature img{width:60px;height:60px}
.signature b{font-size:34px;line-height:1}
.signature i{font-size:19px;line-height:1.5}`
    );
  return (
    common +
    `
.credit{position:absolute;left:60px;width:960px;top:${below + 40}px;
  font:34px/1.35 Credit;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.85)}
.caption{position:absolute;left:60px;width:960px;top:1305px;transform:translateY(-50%);
  text-align:center;font:70px/1.18 Caption;color:#fff;
  text-shadow:0 0 4px #000,3px 3px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000}
.signature{top:1614px;gap:8px;opacity:.62}
.signature img{width:34px;height:34px}
.signature b{font-size:20px;line-height:1}
.signature i{font-size:11px;line-height:1.5}`
  );
}

const page = (
  layout,
  rect
) => `<!doctype html><html><head><meta charset="utf-8"><style>
${Object.entries(FONTS)
  .map(
    ([family, file]) =>
      `@font-face{font-family:${family};src:url(/fonts/${file})}`
  )
  .join("\n")}
html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;background:transparent;overflow:hidden}
.layer{position:absolute;inset:0}
${styles(layout, rect)}
</style></head><body><div class="layer" id="layer"></div></body></html>`;

const signature = `<div class="signature"><img src="/logo.png" alt=""><div>
<b>EthniAfrica</b></div></div>`;

const captionHtml = (text) =>
  `<div class="caption"><span>${escape(text)}</span></div>`;

function titleHtml({ title_lines, accent }) {
  return title_lines
    .map((line) => {
      const text = escape(line);
      if (!accent || !line.includes(accent)) return text;
      return text.replace(escape(accent), `<em>${escape(accent)}</em>`);
    })
    .join("<br>");
}

function probeSize(file) {
  const run = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=p=0",
      file,
    ],
    { encoding: "utf8" }
  );
  const [width, height] = run.stdout.trim().split(",").map(Number);
  if (!width || !height)
    throw new Error(`Cannot read the video size of ${file}`);
  return { width, height };
}

async function openPage(html) {
  const runtime = JSON.parse(
    await readFile(resolve("social/renderer/runtime.json"))
  );
  const routes = new Map([["/logo.png", ["image/png", await readFile(logo)]]]);
  for (const file of Object.values(FONTS))
    routes.set(`/fonts/${file}`, [
      "font/ttf",
      await readFile(join(brandFonts, file)),
    ]);
  const browser = await chromium.launch({ headless: true });
  if (browser.version() !== runtime.chromium) {
    await browser.close();
    throw new Error("Chromium version differs from verified runtime");
  }
  const tab = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await tab.route("http://clip.local/**", (route) => {
    const hit = routes.get(new URL(route.request().url()).pathname);
    if (hit) route.fulfill({ contentType: hit[0], body: hit[1] });
    else if (route.request().url() === "http://clip.local/")
      route.fulfill({ contentType: "text/html", body: html });
    else route.abort();
  });
  await tab.goto("http://clip.local/");
  const draw = async (content, file) => {
    await tab.evaluate((h) => {
      document.getElementById("layer").innerHTML = h;
    }, content);
    await tab.evaluate(() => document.fonts.ready);
    if (file) await tab.screenshot({ path: file, omitBackground: true });
  };
  // Measures the element just drawn: a box's padding is not a line, and a
  // single word wider than the column overflows instead of wrapping.
  const fitsTwoLines = () =>
    tab.evaluate(() => {
      const node = document.getElementById("layer").firstElementChild;
      const style = getComputedStyle(node);
      const text =
        node.getBoundingClientRect().height -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const lines = Math.round(text / parseFloat(style.lineHeight));
      return lines <= 2 && node.scrollWidth <= node.clientWidth + 1;
    });
  return { browser, draw, fitsTwoLines };
}

function ffmpeg(args) {
  const run = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], {
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(`FFmpeg failed: ${run.stderr}`);
}

// Background: the source scaled to cover the canvas, blurred at quarter size
// (same look, a fraction of the cost) and darkened so white text holds.
const frameGraph = (input, rect) =>
  `${input}split[bgsrc][fgsrc];` +
  `[bgsrc]scale=${WIDTH / 4}:${HEIGHT / 4}:force_original_aspect_ratio=increase,` +
  `crop=${WIDTH / 4}:${HEIGHT / 4},gblur=sigma=12,eq=brightness=-0.22:saturation=1.1,` +
  `scale=${WIDTH}:${HEIGHT}[bg];` +
  `[fgsrc]scale=${rect.w}:${rect.h}[fg];` +
  `[bg][fg]overlay=${rect.x}:${rect.y}`;

// The concat demuxer needs the last picture listed twice to honour its
// duration.
async function writeTrack(dir, name, stretches) {
  const list = stretches
    .map((s) => `file '${s.picture}'\nduration ${s.seconds.toFixed(3)}`)
    .concat(`file '${stretches.at(-1).picture}'`)
    .join("\n");
  await writeFile(join(dir, `${name}.txt`), list + "\n");
}

const concatInput = (file) => ["-f", "concat", "-safe", "0", "-i", file];

export async function renderClip(planFile, outDir) {
  const plan = JSON.parse(await readFile(planFile, "utf8"));
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(`Invalid plan:\n- ${errors.join("\n- ")}`);
  const source = resolve(plan.source);
  const size = probeSize(source);
  const layout = layoutFor(size.width, size.height);
  const rect = sourceRect(layout, size.width, size.height);
  const phrases = reelPhrases(plan);
  const boxes = reelBoxes(plan);
  const overlays = reelOverlays(plan);
  if (boxes.length && layout.name !== "band")
    throw new Error(
      "Invalid plan: boxes need a wide source; a tall source fills the frame top"
    );
  const duration = reelDuration(plan);
  const layers = join(outDir, "_layers");
  await mkdir(layers, { recursive: true });

  const overlayStretches = overlayTrack(overlays, duration);
  const { browser, draw, fitsTwoLines } = await openPage(page(layout, rect));
  try {
    await draw(
      `<div class="credit">${escape(plan.credit_line)}</div>${signature}`,
      join(layers, "frame.png")
    );
    await draw("", join(layers, "empty.png"));
    const tooLong = [];
    for (const [i, p] of phrases.entries()) {
      await draw(captionHtml(p.text));
      if (!(await fitsTwoLines())) tooLong.push(`phrase ${i + 1}: «${p.text}»`);
      else await draw(captionHtml(p.text), join(layers, `caption-${i}.png`));
    }
    if (tooLong.length)
      throw new Error(`Captions over two lines:\n- ${tooLong.join("\n- ")}`);
    // The published boxes never exceed two lines: a third one pushes the
    // plate into the top of the frame, where feeds overlay their own UI.
    const tallBoxes = [];
    for (const [i, b] of boxes.entries()) {
      const html = `<div class="box">${escape(b.text)}</div>`;
      await draw(html);
      if (!(await fitsTwoLines())) tallBoxes.push(`box ${i + 1}: «${b.text}»`);
      else await draw(html, join(layers, `box-${i}.png`));
    }
    if (tallBoxes.length)
      throw new Error(`Boxes over two lines:\n- ${tallBoxes.join("\n- ")}`);
    for (const [k, stretch] of overlayStretches.entries()) {
      if (!stretch.active.length) continue;
      const html = stretch.active
        .map((index) => {
          const o = overlays[index];
          const at = toReelPoint(rect, o.x, o.y);
          return `<div class="overlay" style="left:${at.x}px;top:${at.y}px"><span>${escape(o.text)}</span></div>`;
        })
        .join("");
      await draw(html, join(layers, `overlay-${k}.png`));
    }
    if (plan.thumbnail)
      await draw(
        `<div class="title">${titleHtml(plan.thumbnail)}</div>${signature}`,
        join(layers, "cover-title.png")
      );
  } finally {
    await browser.close();
  }

  const timed = (items, prefix) =>
    captionTrack(items, duration).map((s) => ({
      seconds: s.seconds,
      picture: s.index === null ? "empty.png" : `${prefix}-${s.index}.png`,
    }));
  await writeTrack(layers, "captions", timed(phrases, "caption"));
  await writeTrack(layers, "boxes", timed(boxes, "box"));
  await writeTrack(
    layers,
    "overlays",
    overlayStretches.map((s, k) => ({
      seconds: s.seconds,
      picture: s.active.length ? `overlay-${k}.png` : "empty.png",
    }))
  );

  const cuts = plan.clips
    .map(
      ([a, b], i) =>
        `[0:v]trim=start=${a}:end=${b},setpts=PTS-STARTPTS,fps=${FPS}[v${i}];` +
        `[0:a]atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS[a${i}];`
    )
    .join("");
  const joined = plan.clips.map((_, i) => `[v${i}][a${i}]`).join("");
  const layer = (input, label) =>
    `[${input}:v]fps=${FPS},format=rgba[${label}];`;
  const graph =
    cuts +
    `${joined}concat=n=${plan.clips.length}:v=1:a=1[cut][aout];` +
    frameGraph("[cut]", rect) +
    `[framed];[framed][1:v]overlay=0:0[signed];` +
    layer(4, "ovl") +
    `[signed][ovl]overlay=0:0:eof_action=pass[replaced];` +
    layer(3, "box") +
    `[replaced][box]overlay=0:0:eof_action=pass[boxed];` +
    layer(2, "cap") +
    `[boxed][cap]overlay=0:0:eof_action=pass,format=yuv420p[vout]`;
  const reel = join(outDir, "reel.mp4");
  ffmpeg([
    "-i",
    source,
    "-loop",
    "1",
    "-i",
    join(layers, "frame.png"),
    ...concatInput(join(layers, "captions.txt")),
    ...concatInput(join(layers, "boxes.txt")),
    ...concatInput(join(layers, "overlays.txt")),
    "-filter_complex",
    graph,
    "-map",
    "[vout]",
    "-map",
    "[aout]",
    "-t",
    String(duration),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    reel,
  ]);

  if (plan.thumbnail) {
    ffmpeg([
      "-ss",
      String(plan.thumbnail.frame_at),
      "-i",
      source,
      "-i",
      join(layers, "cover-title.png"),
      "-filter_complex",
      `${frameGraph("[0:v]", rect)}[framed];[framed][1:v]overlay=0:0`,
      "-frames:v",
      "1",
      join(outDir, "cover.png"),
    ]);
  }
  const language = plan.language || "fr";
  await writeFile(join(outDir, `sous-titres-${language}.srt`), toSrt(phrases));
  if (resolve(planFile) !== resolve(join(outDir, "plan.json")))
    await copyFile(planFile, join(outDir, "plan.json"));
  // Kept after a failed render for inspection; a delivered folder holds only
  // the publishable files.
  await rm(layers, { recursive: true, force: true });
  return {
    reel,
    duration,
    layout: layout.name,
    captions: phrases.length,
  };
}

const [command, planFile, outDir] = process.argv.slice(2);
if (command === "validate") {
  const errors = validatePlan(JSON.parse(await readFile(planFile, "utf8")));
  console.log(errors.length ? errors.join("\n") : "Plan valid.");
  process.exitCode = errors.length ? 1 : 0;
} else if (command === "render") {
  const done = await renderClip(planFile, outDir);
  console.log(
    `Rendered ${done.reel}: ${done.duration} s, ${done.layout} layout, ${done.captions} captions.`
  );
} else if (command) {
  console.error("Usage: render.mjs validate|render PLAN.json [OUT_DIR]");
  process.exitCode = 2;
}
