// Exports every storyboard shot as a 1080 × 1920 still for the board:
//   node social/series-idents/frames.mjs [outDir]
// Stills are JPEG: they are for review, not masters.
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.mjs";
import { CLIPS, WIDTH, HEIGHT } from "./shots.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const outDir =
  process.argv[2] ??
  fileURLToPath(new URL("./boards/frames/", import.meta.url));

// The same shots with the feed safe zone and the button column drawn, and
// the intro typing another episode's name.
const VARIANTS = [
  { clip: "intro", shot: "i2-devices", suffix: "guides", query: "&guides=1" },
  { clip: "intro", shot: "i4-typed", suffix: "guides", query: "&guides=1" },
  {
    clip: "intro",
    shot: "i5-search",
    suffix: "lingala",
    query: "&name=Lingala",
  },
  { clip: "outro", shot: "o4-forms", suffix: "guides", query: "&guides=1" },
  { clip: "outro", shot: "o5-end", suffix: "guides", query: "&guides=1" },
];

await mkdir(outDir, { recursive: true });
const { server, origin } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
});
const jobs = CLIPS.flatMap((clip) =>
  clip.shots.map((s) => ({ clip: clip.id, shot: s.id, suffix: "", query: "" }))
).concat(VARIANTS);
for (const job of jobs) {
  const clip = CLIPS.find((c) => c.id === job.clip);
  await page.goto(
    `${origin}/social/series-idents/${clip.file}?shot=${job.shot}${job.query}`
  );
  await page.waitForFunction(() => window.identReady === true, null, {
    timeout: 20000,
  });
  const file = `${outDir}/${job.shot}${job.suffix ? "-" + job.suffix : ""}.jpg`;
  await page.screenshot({ path: file, type: "jpeg", quality: 86 });
  console.log(file);
}
await browser.close();
server.close();
