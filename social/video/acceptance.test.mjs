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

const west = JSON.parse(
  await readFile(
    new URL("./fixtures/west-areas.sequence.json", import.meta.url)
  )
);

async function windowStats(png, cx, cy, size) {
  const { data } = await sharp(png)
    .extract({
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mean = [0, 0, 0];
  const lum = [];
  for (let i = 0; i < data.length; i += 3) {
    for (let c = 0; c < 3; c++) mean[c] += data[i + c] / (data.length / 3);
    lum.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
  }
  const avg = lum.reduce((a, b) => a + b) / lum.length;
  const sd = Math.sqrt(
    lum.reduce((a, b) => a + (b - avg) ** 2, 0) / lum.length
  );
  return { mean, sd, max: Math.max(...lum) };
}

// @req REQ-186
test("areas, hatching and borders are drawn on the hold frame", async () => {
  // 6.4 s: the camera has landed and nothing is drawn yet. The sample
  // points sit inside each area, clear of names, borders and edges.
  const seq = () => loadSequence(structuredClone(west));
  const [before, hold] = await Promise.all(
    [192, 359].map((f) => renderFrame(seq(), f, options()))
  );
  const amber = [232, 185, 106];
  const distance = (rgb) => Math.hypot(...rgb.map((v, i) => v - amber[i]));
  const a = [
    await windowStats(before, 466, 614, 16),
    await windowStats(hold, 466, 614, 16),
  ];
  assert.ok(
    distance(a[1].mean) < distance(a[0].mean) - 15,
    "certain area A takes its amber fill"
  );
  const control = [
    await windowStats(before, 838, 790, 16),
    await windowStats(hold, 838, 790, 16),
  ];
  assert.ok(
    Math.hypot(...control[1].mean.map((v, i) => v - control[0].mean[i])) < 8,
    "ground outside every area is left as it was"
  );
  const c = [
    await windowStats(before, 878, 586, 36),
    await windowStats(hold, 878, 586, 36),
  ];
  assert.ok(c[1].sd > c[0].sd + 10, "uncertain area C is hatched");
  const border = [
    await windowStats(before, 890, 919, 24),
    await windowStats(hold, 890, 919, 24),
  ];
  assert.ok(border[1].max > border[0].max + 40, "the quiet border is drawn");
});
