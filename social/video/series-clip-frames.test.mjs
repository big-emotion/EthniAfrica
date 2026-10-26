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

// A 1280×720 source, like the captures the operator supplied.
const SMALL = join(root, "small.mp4");
execFileSync(
  "ffmpeg",
  [
    ...["-v", "error", "-y", "-f", "lavfi"],
    ...["-i", "testsrc2=size=1280x720:rate=30:duration=2"],
    ...["-c:v", "libx264", "-pix_fmt", "yuv420p", SMALL],
  ],
  { stdio: "inherit" }
);

// Sum of horizontal pixel differences: more edges, more energy.
const energy = async (png, top, height) => {
  const raw = await sharp(png)
    .greyscale()
    .extract({ left: 0, top, width: 1080, height })
    .raw()
    .toBuffer();
  let sum = 0;
  for (let i = 1; i < raw.length; i++) sum += Math.abs(raw[i] - raw[i - 1]);
  return sum / raw.length;
};

test("blur mode keeps the whole width sharp on a blurred copy of the shot", async () => {
  const { files } = await extractClipFrames({
    src: SMALL,
    in: 0.5,
    out: 1.5,
    mode: "blur",
    dir: join(root, "blur"),
  });
  assert.equal(files.length, 30);
  const meta = await sharp(files[0]).metadata();
  assert.deepEqual([meta.width, meta.height], [1080, 1920]);
  // The picture sits across the middle (1080×608 on 1920), the copy above.
  const middle = await energy(files[10], 800, 300);
  const above = await energy(files[10], 100, 300);
  assert.ok(middle > above * 3, `middle ${middle} against blurred ${above}`);
});

test("blur mode shows what fill mode cuts off", async () => {
  const fill = await extractClipFrames({
    src: SMALL,
    in: 0.5,
    out: 1.5,
    fx: 0,
    dir: join(root, "fill0"),
  });
  const blur = await extractClipFrames({
    src: SMALL,
    in: 0.5,
    out: 1.5,
    mode: "blur",
    dir: join(root, "blur0"),
  });
  // Fill at fx 0 keeps the left 31 % of the picture, so its middle is far
  // sharper per pixel than the whole picture shrunk into the same width.
  assert.notDeepEqual(readFileSync(fill.files[0]), readFileSync(blur.files[0]));
  const a = await energy(fill.files[0], 800, 300);
  const b = await energy(blur.files[0], 800, 300);
  assert.ok(
    a < b,
    "the whole picture packs more detail per pixel than 31 % of it magnified"
  );
});

test("the mode is part of what a shared extraction is keyed on", async () => {
  const cache = join(root, "cache-mode");
  const base = { src: SMALL, in: 0.5, out: 1.5 };
  const a = await ensureClipFrames(base, cache);
  const b = await ensureClipFrames({ ...base, mode: "blur" }, cache);
  assert.notEqual(a.dir, b.dir);
});

test("trim cuts a share of the shot's height before it is framed, so a corner logo goes", async () => {
  const whole = await extractClipFrames({
    src: SMALL,
    in: 0.5,
    out: 1.5,
    mode: "blur",
    dir: join(root, "trim-0"),
  });
  const trimmed = await extractClipFrames({
    src: SMALL,
    in: 0.5,
    out: 1.5,
    mode: "blur",
    trim: { top: 0.5 },
    dir: join(root, "trim-top"),
  });
  // Untrimmed, the picture is 608 px tall across the middle (rows 656 to 1264);
  // half trimmed it is 304 px (rows 808 to 1112), so rows 700 to 800 are the
  // blurred copy instead of the sharp picture.
  const sharp0 = await energy(whole.files[10], 700, 100);
  const blurred = await energy(trimmed.files[10], 700, 100);
  assert.ok(
    sharp0 > blurred * 3,
    `untrimmed ${sharp0} against trimmed ${blurred}`
  );
  const kept = await energy(trimmed.files[10], 880, 100);
  assert.ok(kept > blurred * 3, "the trimmed picture itself stays sharp");
});

test("the trim is part of what a shared extraction is keyed on", async () => {
  const cache = join(root, "cache-trim");
  const base = { src: SMALL, in: 0.5, out: 1.5, mode: "blur" };
  const a = await ensureClipFrames(base, cache);
  const b = await ensureClipFrames({ ...base, trim: { top: 0.14 } }, cache);
  assert.notEqual(a.dir, b.dir);
});
