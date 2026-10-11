// @req REQ-186
// Rendering acceptance. The imagery is not in git: point
// ETHNIAFRICA_VIDEO_ASSETS at the folder holding the verified files.
// A missing folder fails; it is never reported as a pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSequence } from "./sequence.mjs";
import { renderFrame, encodeVideo } from "./render.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const congo = JSON.parse(
  await readFile(new URL("./fixtures/congo.sequence.json", import.meta.url))
);
const sequence = () => loadSequence(structuredClone(congo));
const options = () => {
  assert.ok(assets, "Set ETHNIAFRICA_VIDEO_ASSETS to the verified imagery");
  return { assets };
};

// @req REQ-186
test("a frame renders at 1080 × 1920 and repeats pixel for pixel", async () => {
  const first = await renderFrame(sequence(), 240, options());
  const again = await renderFrame(sequence(), 240, options());
  const meta = await sharp(first).metadata();
  assert.equal(meta.width, 1080);
  assert.equal(meta.height, 1920);
  const [a, b] = await Promise.all(
    [first, again].map((png) => sharp(png).raw().toBuffer())
  );
  assert.ok(a.equals(b), "same frame number, same pixels");
});

// @req REQ-186
test("the globe, the travel and the hold are distinct frames", async () => {
  const pixels = await Promise.all(
    [0, 90, 330].map(async (f) =>
      sharp(await renderFrame(sequence(), f, options()))
        .raw()
        .toBuffer()
    )
  );
  assert.ok(!pixels[0].equals(pixels[1]));
  assert.ok(!pixels[1].equals(pixels[2]));
});

// @req REQ-186
test("the encoded file has the size, rate, duration and no sound", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ethniafrica-video-"));
  try {
    const { file, manifest } = await encodeVideo(sequence(), dir, options());
    const probe = JSON.parse(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-count_frames",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        file,
      ])
    );
    const video = probe.streams.filter((s) => s.codec_type === "video");
    assert.equal(video.length, 1);
    assert.equal(
      probe.streams.filter((s) => s.codec_type === "audio").length,
      0
    );
    const [v] = video;
    assert.equal(v.codec_name, "h264");
    assert.equal(v.pix_fmt, "yuv420p");
    assert.equal(v.width, 1080);
    assert.equal(v.height, 1920);
    assert.equal(v.r_frame_rate, "30/1");
    assert.equal(Number(v.nb_read_frames), 360);
    assert.ok(Math.abs(Number(probe.format.duration) - 12) < 0.05);

    assert.equal(manifest.frames, 360);
    assert.equal(manifest.productionReady, false);
    for (const key of ["sequence", "imagery", "engine"])
      assert.ok(manifest.hashes[key], `${key} hash`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// @req REQ-186
test("unverified imagery files are refused before rendering", async () => {
  await assert.rejects(
    renderFrame(sequence(), 0, { assets: tmpdir() }),
    /imagery/i
  );
});
