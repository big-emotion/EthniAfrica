// @req REQ-186
// The frames of an external clip (Cartes 1.15.0-proposition, §1 and §4): the
// picture phase is drawn from stills cut out of the source, one per frame of
// the 30 fps grid, already framed on the focal point. A moving test pattern
// stands for the footage, so nothing from a third party is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  extractClipFrames,
  ensureClipFrames,
  probeSource,
} from "./series-clip-frames.mjs";

const root = mkdtempSync(join(tmpdir(), "series-clip-frames-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));

const SOURCE = join(root, "source.mp4");
// Two seconds of a 1920×1080 pattern whose bars move every frame.
execFileSync(
  "ffmpeg",
  [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", "testsrc2=size=1920x1080:rate=30:duration=2"],
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p", SOURCE],
  ],
  { stdio: "inherit" }
);

const extract = (name, options) =>
  extractClipFrames({
    src: SOURCE,
    in: 0.5,
    out: 1.5,
    fx: 0.5,
    dir: join(root, name),
    ...options,
  });

test("the probe reports codec, size and duration of the source", () => {
  const info = probeSource(SOURCE);
  assert.equal(info.codec, "h264");
  assert.equal(info.width, 1920);
  assert.equal(info.height, 1080);
  assert.ok(Math.abs(info.duration - 2) < 0.1);
  assert.equal(probeSource(join(root, "absent.mp4")), null);
});

test("one second of source gives thirty stills of 1080×1920", async () => {
  const { count, files } = await extract("a");
  assert.equal(count, 30);
  assert.equal(files.length, 30);
  assert.equal(readdirSync(join(root, "a")).length, 30);
  const meta = await sharp(files[0]).metadata();
  assert.deepEqual([meta.width, meta.height], [1080, 1920]);
});

test("the stills follow the footage: frame 0 and frame 20 differ", async () => {
  const { files } = await extract("b");
  assert.notDeepEqual(readFileSync(files[0]), readFileSync(files[20]));
});

test("the focal point moves the window across the source", async () => {
  const left = await extract("c", { fx: 0 });
  const right = await extract("d", { fx: 1 });
  assert.notDeepEqual(
    readFileSync(left.files[0]),
    readFileSync(right.files[0])
  );
});

test("extracting twice gives the same bytes", async () => {
  const first = await extract("e");
  const second = await extract("f");
  assert.deepEqual(
    readFileSync(first.files[10]),
    readFileSync(second.files[10])
  );
});

test("an existing folder is refused, never overwritten", async () => {
  await extract("g");
  await assert.rejects(extract("g"), /existe déjà/);
});

test("slices asking for one clip at once share one extraction", async () => {
  const cache = join(root, "cache");
  const clip = { src: SOURCE, in: 0.5, out: 1.5, fx: 0.5 };
  const [a, b, c] = await Promise.all([
    ensureClipFrames(clip, cache),
    ensureClipFrames(clip, cache),
    ensureClipFrames(clip, cache),
  ]);
  assert.equal(a.dir, b.dir);
  assert.equal(b.dir, c.dir);
  assert.equal(a.count, 30);
  // One finished folder and no half-written one left beside it.
  assert.equal(readdirSync(cache).length, 1);
  assert.equal(readdirSync(a.dir).filter((f) => f.endsWith(".jpg")).length, 30);
  // A later request reuses it; another focal point is another extraction.
  assert.equal((await ensureClipFrames(clip, cache)).dir, a.dir);
  const other = await ensureClipFrames({ ...clip, fx: 0.2 }, cache);
  assert.notEqual(other.dir, a.dir);
});
