// Renders the account-level message card from `message-card.html`:
// the three still formats, and the nine-second reel.
//
//   node docs/design/mockups/social/render-message-card.mjs --out <folder>
//
// `--out` is required and must sit outside any git checkout. Renders are
// productions, and productions are not versioned — the same rule the
// Python engine enforces in `ethni_paths.assert_writable`. The one
// difference is that this script says so and stops, rather than deriving
// a fallback.
//
// The reel is not screen-recorded. Every animation on the page is paused,
// and `seek(t)` positions all of them at an absolute time, so frame N is
// a pure function of t: two runs of this script produce the same file,
// and a frame can be re-rendered on its own.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(join(HERE, "message-card.html")).href;

const FPS = 30;
const SECONDS = 9;
const FRAMES = FPS * SECONDS;

// The still formats, named the way the library names them so a file can be
// filed without being renamed.
const STILLS = [
  { format: "story", w: 1080, h: 1920, slug: "tiktok-story_1080x1920" },
  { format: "feed", w: 1080, h: 1350, slug: "instagram-facebook_1080x1350" },
  { format: "square", w: 1200, h: 1200, slug: "linkedin_1200x1200" },
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--out");
  if (at === -1 || !argv[at + 1]) {
    throw new Error(
      "--out <folder> is required, and must be outside any git checkout.",
    );
  }
  const out = resolve(argv[at + 1]);
  const nameAt = argv.indexOf("--name");
  const name = nameAt === -1 ? "message" : argv[nameAt + 1];
  return { out, name };
}

// Walks up from the destination looking for a .git entry. A render landing
// in a checkout is how 1.2 GB of masters were once lost to a gitignored
// folder nothing backed up.
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
  const { out, name } = parseArgs();
  refuseInsideCheckout(out);

  const imagesDir = join(out, "images");
  const videoDir = join(out, "video");
  const framesDir = join(out, ".frames");
  mkdirSync(imagesDir, { recursive: true });
  mkdirSync(videoDir, { recursive: true });
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.goto(PAGE, { waitUntil: "load" });
  // Anton and Nunito Sans are read off disk; a screenshot taken before
  // they land silently falls back to Impact and the measure is wrong.
  await page.evaluate(() => document.fonts.ready);

  for (const still of STILLS) {
    await page.setViewportSize({ width: still.w, height: still.h });
    await page.evaluate((f) => window.setFormat(f), still.format);
    await page.evaluate(() => window.seek(9));
    await page.locator("#canvas").screenshot({
      path: join(imagesDir, `${name}_${still.slug}.png`),
    });
    process.stdout.write(`image ${still.slug}\n`);
  }

  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.evaluate(() => window.setFormat("story"));

  for (let i = 0; i < FRAMES; i += 1) {
    await page.evaluate((t) => window.seek(t), i / FPS);
    await page
      .locator("#canvas")
      .screenshot({ path: join(framesDir, String(i).padStart(4, "0") + ".png") });
    if (i % 30 === 0) process.stdout.write(`frame ${i}/${FRAMES}\n`);
  }

  await browser.close();

  const count = readdirSync(framesDir).length;
  if (count !== FRAMES) throw new Error(`${count} frames, expected ${FRAMES}`);

  const reel = join(videoDir, `${name}-reel.mp4`);
  // A silent stereo track, because a reel with no audio stream at all is
  // rejected or muted-by-default on several of the networks.
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate", String(FPS),
      "-i", join(framesDir, "%04d.png"),
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
      reel,
    ],
    { stdio: "inherit" },
  );

  rmSync(framesDir, { recursive: true, force: true });
  process.stdout.write(`reel ${reel}\n`);
}

main().catch((err) => {
  process.stderr.write(String(err.message || err) + "\n");
  process.exit(1);
});
