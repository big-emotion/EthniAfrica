// Renders a translated clip: the excerpt framed in the vertical gabarit of the
// published translated reels (blurred source behind, source frame in a band,
// credit under it, French caption, watermark), plus its SRT and cover.
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
  toSrt,
  captionTrack,
} from "./plan.mjs";

const WIDTH = 1080;
const HEIGHT = 1920;
// The source band of the published reels: full width, 16:9, its top at 336.
const BAND = { top: 336, height: 608 };
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

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
${Object.entries(FONTS)
  .map(
    ([family, file]) =>
      `@font-face{font-family:${family};src:url(/fonts/${file})}`
  )
  .join("\n")}
html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;background:transparent;overflow:hidden}
.layer{position:absolute;inset:0}
.credit{position:absolute;left:60px;width:960px;top:${BAND.top + BAND.height + 40}px;
  font:34px/1.35 Credit;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.85)}
.caption{position:absolute;left:60px;width:960px;top:1305px;transform:translateY(-50%);
  text-align:center;font:70px/1.18 Caption;color:#fff;
  text-shadow:0 0 4px #000,3px 3px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000}
.signature{position:absolute;left:0;right:0;top:1614px;display:flex;justify-content:center;
  align-items:center;gap:8px;opacity:.62}
.signature img{width:34px;height:34px;filter:brightness(0) invert(1)}
.signature b{display:block;font:700 20px/1 Signature;color:#fff}
.signature i{display:block;font:600 11px/1.5 Signature;font-style:normal;color:#fff}
.title{position:absolute;left:60px;width:960px;top:1190px;transform:translateY(-50%);
  text-align:center;font:118px/1.05 Title;color:#fff;text-transform:uppercase;
  text-shadow:0 4px 18px rgba(0,0,0,.7)}
.title em{font-style:normal;color:${ACCENT}}
</style></head><body><div class="layer" id="layer"></div></body></html>`;

const signature = `<div class="signature"><img src="/logo.png" alt=""><div>
<b>EthniAfrica</b><i>L’Afrique à travers ses noms</i></div></div>`;

function titleHtml({ title_lines, accent }) {
  return title_lines
    .map((line) => {
      const text = escape(line);
      if (!accent || !line.includes(accent)) return text;
      return text.replace(escape(accent), `<em>${escape(accent)}</em>`);
    })
    .join("<br>");
}

async function openPage() {
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
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.route("http://clip.local/**", (route) => {
    const hit = routes.get(new URL(route.request().url()).pathname);
    if (hit) route.fulfill({ contentType: hit[0], body: hit[1] });
    else if (route.request().url() === "http://clip.local/")
      route.fulfill({ contentType: "text/html", body: PAGE });
    else route.abort();
  });
  await page.goto("http://clip.local/");
  const draw = async (html, file) => {
    await page.evaluate((h) => {
      document.getElementById("layer").innerHTML = h;
    }, html);
    await page.evaluate(() => document.fonts.ready);
    if (file) await page.screenshot({ path: file, omitBackground: true });
  };
  // A single word wider than the column overflows instead of wrapping, so
  // horizontal overflow counts as a failed fit too.
  const captionFits = () =>
    page.evaluate(() => {
      const node = document.querySelector(".caption");
      const lineHeight = parseFloat(getComputedStyle(node).lineHeight);
      const lines = Math.round(
        node.getBoundingClientRect().height / lineHeight
      );
      return lines <= 2 && node.scrollWidth <= node.clientWidth + 1;
    });
  return { browser, draw, captionFits };
}

function ffmpeg(args) {
  const run = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], {
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(`FFmpeg failed: ${run.stderr}`);
}

// Background: the source scaled to cover the canvas, blurred at quarter size
// (same look, a fraction of the cost) and darkened so white text holds.
const frameGraph = (input) =>
  `${input}split[bgsrc][fgsrc];` +
  `[bgsrc]scale=${WIDTH / 4}:${HEIGHT / 4}:force_original_aspect_ratio=increase,` +
  `crop=${WIDTH / 4}:${HEIGHT / 4},gblur=sigma=12,eq=brightness=-0.22:saturation=1.1,` +
  `scale=${WIDTH}:${HEIGHT}[bg];` +
  `[fgsrc]scale=${WIDTH}:${BAND.height}:force_original_aspect_ratio=decrease[fg];` +
  `[bg][fg]overlay=(W-w)/2:${BAND.top}+(${BAND.height}-h)/2`;

export async function renderClip(planFile, outDir) {
  const plan = JSON.parse(await readFile(planFile, "utf8"));
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(`Invalid plan:\n- ${errors.join("\n- ")}`);
  const layers = join(outDir, "_layers");
  await mkdir(layers, { recursive: true });
  const phrases = reelPhrases(plan);
  const duration = reelDuration(plan);

  const { browser, draw, captionFits } = await openPage();
  try {
    await draw(
      `<div class="credit">${escape(plan.credit_line)}</div>${signature}`,
      join(layers, "frame.png")
    );
    await draw("", join(layers, "empty.png"));
    const tooLong = [];
    for (const [i, p] of phrases.entries()) {
      await draw(`<div class="caption">${escape(p.fr)}</div>`);
      if (!(await captionFits())) tooLong.push(`phrase ${i + 1}: «${p.fr}»`);
      else
        await draw(
          `<div class="caption">${escape(p.fr)}</div>`,
          join(layers, `caption-${i}.png`)
        );
    }
    if (tooLong.length)
      throw new Error(`Captions over two lines:\n- ${tooLong.join("\n- ")}`);
    if (plan.thumbnail)
      await draw(
        `<div class="title">${titleHtml(plan.thumbnail)}</div>${signature}`,
        join(layers, "cover-title.png")
      );
  } finally {
    await browser.close();
  }

  // The concat demuxer needs the last picture listed twice to honour its
  // duration.
  const track = captionTrack(phrases, duration);
  const picture = (s) =>
    s.index === null ? "empty.png" : `caption-${s.index}.png`;
  const list = track
    .map((s) => `file '${picture(s)}'\nduration ${s.seconds.toFixed(3)}`)
    .concat(`file '${picture(track.at(-1))}'`)
    .join("\n");
  await writeFile(join(layers, "captions.txt"), list + "\n");

  const cuts = plan.clips
    .map(
      ([a, b], i) =>
        `[0:v]trim=start=${a}:end=${b},setpts=PTS-STARTPTS,fps=${FPS}[v${i}];` +
        `[0:a]atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS[a${i}];`
    )
    .join("");
  const joined = plan.clips.map((_, i) => `[v${i}][a${i}]`).join("");
  const graph =
    cuts +
    `${joined}concat=n=${plan.clips.length}:v=1:a=1[cut][aout];` +
    frameGraph("[cut]") +
    `[framed];[framed][1:v]overlay=0:0[signed];` +
    `[2:v]fps=${FPS},format=rgba[cap];[signed][cap]overlay=0:0:eof_action=pass,format=yuv420p[vout]`;
  const reel = join(outDir, "reel.mp4");
  ffmpeg([
    "-i",
    resolve(plan.source),
    "-loop",
    "1",
    "-i",
    join(layers, "frame.png"),
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    join(layers, "captions.txt"),
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
      resolve(plan.source),
      "-i",
      join(layers, "cover-title.png"),
      "-filter_complex",
      `${frameGraph("[0:v]")}[framed];[framed][1:v]overlay=0:0`,
      "-frames:v",
      "1",
      join(outDir, "cover.png"),
    ]);
  }
  await writeFile(join(outDir, "sous-titres-fr.srt"), toSrt(phrases));
  if (resolve(planFile) !== resolve(join(outDir, "plan.json")))
    await copyFile(planFile, join(outDir, "plan.json"));
  // Kept after a failed render for inspection; a delivered folder holds only
  // the publishable files.
  await rm(layers, { recursive: true, force: true });
  return { reel, duration, captions: phrases.length };
}

const [command, planFile, outDir] = process.argv.slice(2);
if (command === "validate") {
  const errors = validatePlan(JSON.parse(await readFile(planFile, "utf8")));
  console.log(errors.length ? errors.join("\n") : "Plan valid.");
  process.exitCode = errors.length ? 1 : 0;
} else if (command === "render") {
  const done = await renderClip(planFile, outDir);
  console.log(
    `Rendered ${done.reel}: ${done.duration} s, ${done.captions} captions.`
  );
} else if (command) {
  console.error("Usage: render.mjs validate|render PLAN.json [OUT_DIR]");
  process.exitCode = 2;
}
