// Renders `next-subjects.html`, the "prochains sujets" call for sources,
// as a silent 1080x1920 video.
//
//   node docs/design/mockups/social/render-next-subjects.mjs --out <folder>
//   node docs/design/mockups/social/render-next-subjects.mjs --out <folder> --at 4,20,55
//
// Same method and same rule as `render-message-card.mjs`: the page is not
// screen-recorded, `seek(t)` places every animation at an absolute time, and
// `--out` must sit outside any git checkout because renders are productions.
// The duration is not a constant here: the page derives it from its list
// (`window.TOTAL`), so a longer list makes a longer video.
//
// `--at` renders single frames at those seconds and stops. It exists so a
// layout can be judged in seconds instead of after the ~1 800 frames.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(join(HERE, "next-subjects.html")).href;
const FPS = 30;

function parseArgs() {
  const argv = process.argv.slice(2);
  const value = (flag) => {
    const at = argv.indexOf(flag);
    return at === -1 ? null : argv[at + 1];
  };
  if (!value("--out")) {
    throw new Error(
      "--out <folder> is required, and must be outside any git checkout.",
    );
  }
  return {
    out: resolve(value("--out")),
    name: value("--name") ?? "prochains-sujets",
    stills: value("--at")
      ? value("--at")
          .split(",")
          .map((s) => parseFloat(s))
      : null,
  };
}

// A render landing in a checkout is how 1.2 GB of masters were once lost to
// a gitignored folder nothing backed up.
function refuseInsideCheckout(out) {
  let dir = out;
  for (;;) {
    if (existsSync(join(dir, ".git"))) {
      throw new Error(
        `Refusing to render into a git checkout (${dir} holds .git). ` +
          "Renders belong in the production library.",
      );
    }
    const up = dirname(dir);
    if (up === dir) return;
    dir = up;
  }
}

async function main() {
  const { out, name, stills } = parseArgs();
  refuseInsideCheckout(out);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.goto(PAGE, { waitUntil: "load" });
  // Fonts are read off disk; a frame taken before they land falls back to
  // Impact and every measure is wrong.
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate(() => window.TOTAL);
  const frames = Math.ceil(total * FPS);

  if (stills) {
    const dir = join(out, "epreuves");
    mkdirSync(dir, { recursive: true });
    for (const t of stills) {
      await page.evaluate((s) => window.seek(s), t);
      await page
        .locator("#canvas")
        .screenshot({ path: join(dir, `${name}_t${String(t).padStart(5, "0")}.png`) });
    }
    await browser.close();
    process.stdout.write(`stills in ${dir} (video is ${total.toFixed(1)} s)\n`);
    return;
  }

  const videoDir = join(out, "video");
  const framesDir = join(out, ".frames");
  mkdirSync(videoDir, { recursive: true });
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  for (let i = 0; i < frames; i += 1) {
    await page.evaluate((t) => window.seek(t), i / FPS);
    await page
      .locator("#canvas")
      .screenshot({ path: join(framesDir, String(i).padStart(5, "0") + ".png") });
    if (i % 90 === 0) process.stdout.write(`frame ${i}/${frames}\n`);
  }
  await browser.close();

  const count = readdirSync(framesDir).length;
  if (count !== frames) throw new Error(`${count} frames, expected ${frames}`);

  const video = join(videoDir, `${name}.mp4`);
  // A silent stereo track, because a video with no audio stream at all is
  // rejected or muted-by-default on several of the networks.
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate", String(FPS),
      "-i", join(framesDir, "%05d.png"),
      "-f", "lavfi",
      "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
      "-shortest",
      "-c:v", "libx264",
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-crf", "18",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      video,
    ],
    { stdio: "inherit" },
  );

  rmSync(framesDir, { recursive: true, force: true });
  process.stdout.write(`video ${video} (${total.toFixed(1)} s)\n`);
}

main().catch((err) => {
  process.stderr.write(String(err.message || err) + "\n");
  process.exit(1);
});
