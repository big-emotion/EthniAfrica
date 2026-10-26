// @req REQ-186
// A card whose picture is an external clip (Cartes 1.15.0-proposition, §1):
// the loader checks it against its source, the frame state says which still
// of the clip each frame shows, and Chromium draws those stills in turn. A
// moving test pattern stands for the footage.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { clipDemo, CLIP_CARD } from "./fixtures/series-clip.mjs";

const root = mkdtempSync(join(tmpdir(), "series-clip-card-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));

const SOURCE = join(root, "source.mp4");
execFileSync(
  "ffmpeg",
  [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", "testsrc2=size=1920x1080:rate=30:duration=12"],
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p", SOURCE],
  ],
  { stdio: "inherit" }
);

const SMALL = join(root, "small.mp4");
execFileSync(
  "ffmpeg",
  [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", "testsrc2=size=1280x720:rate=30:duration=12"],
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p", SMALL],
  ],
  { stdio: "inherit" }
);

let runs = 0;
const build = (options) => {
  const dir = join(root, `run-${runs++}`);
  execFileSync("mkdir", [dir]);
  execFileSync("cp", [SOURCE, join(dir, "source.mp4")]);
  execFileSync("cp", [SMALL, join(dir, "small.mp4")]);
  return loadSeriesVideo(clipDemo(dir, options), { dir });
};
const indexOfClip = (seq) => seq.cards.findIndex((c) => c.id === CLIP_CARD);

test("a clip card is loaded with its stills and its length in frames", () => {
  const seq = build();
  const card = seq.cards[indexOfClip(seq)];
  assert.equal(card.image.clip.count, 240);
  assert.equal(card.image.src, `clip/${CLIP_CARD}/0001.jpg`);
  assert.deepEqual([card.image.w, card.image.h], [1080, 1920]);
  assert.equal(card.image.calm, false);
});

test("each frame of the card shows the matching still, held at the ends", () => {
  const seq = build();
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  const clipFrame = (frame) =>
    seriesFrameState(seq, frame).layers.find((l) => l.card === i).clipFrame;
  assert.equal(clipFrame(start), 0);
  assert.equal(clipFrame(start + 10), 10);
  assert.equal(clipFrame(start + 100), 100);
});

test("footage is never pushed in: its zoom stays at 1", () => {
  const seq = build();
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  for (const f of [start, start + 90, start + 200]) {
    const layer = seriesFrameState(seq, f).layers.find((l) => l.card === i);
    assert.equal(layer.zoom, 1);
    assert.equal(layer.zoomEnd, 1);
  }
});

test("a clip shorter than its card is refused", () => {
  assert.throws(
    () => build({ clip: { in: 0, out: 6 } }),
    /plus court que sa carte/
  );
});

test("a missing source and a missing licence are refused", () => {
  assert.throws(() => build({ clip: { src: "absent.mp4" } }), /introuvable/);
  assert.throws(() => build({ clip: { rights: { author: "X" } } }), /licence/);
});

test("Chromium draws a different still on each frame of the clip", async () => {
  const seq = build();
  const i = indexOfClip(seq);
  const start = seq.cardStarts[i];
  const [a, b] = await renderSeriesFrames(seq, [start + 20, start + 80]);
  // The picture's middle band, clear of the head and the subtitles.
  const band = async (png) =>
    sharp(png)
      .extract({ left: 0, top: 700, width: 1080, height: 400 })
      .raw()
      .toBuffer();
  const [pa, pb] = [await band(a.png), await band(b.png)];
  let differing = 0;
  for (let k = 0; k < pa.length; k += 3) if (pa[k] !== pb[k]) differing++;
  assert.ok(
    differing > 10000,
    `the two frames hold the same picture (${differing} pixels differ)`
  );
});

test("a 720p source loads in a demonstration, with the upscale reported", () => {
  const seq = build({ clip: { src: "small.mp4" } });
  assert.match(seq.warnings.join("\n"), /1280×720.*agrandie 2,7 fois/);
});

test("the card's credit is the clip's own place and rights, never the old photo's", () => {
  const seq = build();
  const { credit } = seq.cards[indexOfClip(seq)];
  assert.match(credit, /ESSAI, TOGO/);
  assert.match(
    credit,
    /Images : Chaîne d'essai · licence d'essai · example\.org/
  );
  assert.doesNotMatch(credit, /Bobo-Dioulasso/);
});
