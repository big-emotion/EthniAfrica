// @req REQ-186
// The opt-in GPU render (operator, 19 October 2026) on the short animated
// map of the parallel render's test: the opener on the globe, the 1984 card
// of the animated satellite map and the closing card. Drawn twice on the
// GPU, every frame must be the same pixels: the engine's guarantee, « same
// frame number, same pixels », holds on one machine and one runtime. Against
// SwiftShader, the reference, each frame must stay within GPU_TOLERANCE
// (README, « GPU render »). The imagery is not in git: point
// ETHNIAFRICA_VIDEO_ASSETS at its folder. A missing folder fails; it is
// never reported as passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import {
  encodeSeriesVideo,
  renderSeriesFrames,
  GPU_TOLERANCE,
} from "./series-render.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const root = mkdtempSync(join(tmpdir(), "series-gpu-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));
const KEEP = ["serie-pays-01", "carte-animee-1984", "serie-pays-07"];

function shortSequence() {
  const dir = join(root, "short");
  const input = animatedDemo(dir, {
    edit: (deck) => {
      deck.cards = deck.cards.filter((c) => KEEP.includes(c.id));
    },
    script: (beats) => beats.filter((b) => KEEP.includes(b.card)),
  });
  return loadSeriesVideo(input, { dir });
}

const rgb = (png) => sharp(png).removeAlpha().raw().toBuffer();
// PSNR over every channel, and the share of pixels where a channel moved by
// more than GPU_TOLERANCE.levels.
async function difference(a, b) {
  const [x, y] = await Promise.all([rgb(a), rgb(b)]);
  let squares = 0;
  let far = 0;
  for (let i = 0; i < x.length; i += 3) {
    let worst = 0;
    for (let c = 0; c < 3; c++) {
      const d = x[i + c] - y[i + c];
      squares += d * d;
      worst = Math.max(worst, Math.abs(d));
    }
    if (worst > GPU_TOLERANCE.levels) far++;
  }
  return {
    psnr: 10 * Math.log10((255 * 255) / (squares / x.length || 1e-12)),
    far: far / (x.length / 3),
  };
}

let seq, frames, gpu, again, reference, video;
// @req REQ-186
test.before(async () => {
  if (!assets) return;
  seq = shortSequence();
  // From the first frame on, as a single pass draws them: a browser's
  // anti-aliasing of an edge depends on the frames it drew before.
  frames = Array.from({ length: seq.frames }, (_, k) => k).filter(
    (f) => f % 4 === 0 || f === seq.frames - 1
  );
  gpu = await renderSeriesFrames(seq, frames, { diagnose: true, gpu: true });
  again = await renderSeriesFrames(seq, frames, { diagnose: true, gpu: true });
  reference = await renderSeriesFrames(seq, frames, { diagnose: true });
  video = await encodeSeriesVideo(seq, join(root, "video"), {
    diagnose: true,
    gpu: true,
    workers: 3,
  });
});

// @req REQ-186
test("the verified assets are present", () => {
  assert.ok(
    assets,
    "Set ETHNIAFRICA_VIDEO_ASSETS to the verified imagery folder"
  );
});

// @req REQ-186
test("on the GPU, the same frame number gives the same pixels, run after run", (t) => {
  if (!assets) return t.skip("no imagery");
  for (let i = 0; i < frames.length; i++)
    assert.ok(gpu[i].png.equals(again[i].png), `frame ${frames[i]}`);
});

// @req REQ-186
test("on the GPU, every frame stays within the documented tolerance of SwiftShader", async (t) => {
  if (!assets) return t.skip("no imagery");
  let worst = { psnr: Infinity, far: 0 };
  for (let i = 0; i < frames.length; i++) {
    const d = await difference(gpu[i].png, reference[i].png);
    worst = {
      psnr: Math.min(worst.psnr, d.psnr),
      far: Math.max(worst.far, d.far),
    };
    assert.ok(
      d.psnr >= GPU_TOLERANCE.psnr,
      `frame ${frames[i]}: PSNR ${d.psnr.toFixed(1)} dB`
    );
    assert.ok(
      d.far <= GPU_TOLERANCE.far,
      `frame ${frames[i]}: ${(d.far * 100).toFixed(3)} % of pixels moved by more than ${GPU_TOLERANCE.levels}`
    );
  }
  t.diagnostic(
    `worst PSNR ${worst.psnr.toFixed(1)} dB, at most ${(worst.far * 100).toFixed(3)} % of pixels beyond ${GPU_TOLERANCE.levels} levels`
  );
});

// @req REQ-186
test("on the GPU, the same text boxes as on SwiftShader", (t) => {
  if (!assets) return t.skip("no imagery");
  for (let i = 0; i < frames.length; i++)
    assert.deepEqual(gpu[i].boxes, reference[i].boxes, `frame ${frames[i]}`);
});

// @req REQ-186
test("a GPU render in three slices records the GPU and its WebGL renderer", (t) => {
  if (!assets) return t.skip("no imagery");
  assert.equal(video.manifest.workers, 3);
  assert.equal(video.manifest.frames, seq.frames);
  assert.equal(video.manifest.runtime.webgl.backend, "gpu");
  assert.match(video.manifest.runtime.webgl.renderer, /Metal/);
  assert.equal(video.manifest.runtime.capture, "png-fast");
});
