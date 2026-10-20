// @req REQ-186
// The fast capture (operator, 20 October 2026): the video encoder takes each
// frame as a PNG that Chromium compresses for speed (`optimizeForSpeed`).
// PNG is lossless whatever its compression, so the frame FFmpeg receives
// must decode to the same pixels as the normal capture's, on SwiftShader
// and on the GPU. Checked on the parallel render's short sequence: the
// opener on the globe (its zoom included), the 1984 card of the animated
// satellite map and the closing card. The imagery is not in git: point
// ETHNIAFRICA_VIDEO_ASSETS at its folder. A missing folder fails; it is
// never reported as passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import { openSeriesRenderer } from "./series-render.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const root = mkdtempSync(join(tmpdir(), "series-capture-"));
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

const rgba = (png) =>
  sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// Each frame captured both ways, from the same drawn page.
async function bothCaptures(seq, frames, gpu) {
  const renderer = await openSeriesRenderer(seq, {
    diagnose: true,
    gpu,
    assets,
  });
  try {
    const out = [];
    for (const frame of frames) {
      await renderer.draw(frame);
      const normal = await renderer.capture();
      const fast = await renderer.capture({ fast: true });
      out.push({ frame, normal, fast });
    }
    return out;
  } finally {
    await renderer.close();
  }
}

// The globe at rest and in its zoom (frame 87, the GPU's worst frame
// against SwiftShader), the animated map's first frames, its middle and its
// last, and the closing card.
const momentsOf = (seq) => {
  const map = seq.cards.findIndex((c) => c.id === "carte-animee-1984");
  const [from, to] = [seq.cardStarts[map], seq.cardStarts[map + 1]];
  return [
    0,
    87,
    from + 5,
    Math.round((from + to) / 2),
    to - 10,
    seq.frames - 1,
  ];
};

let seq;
// @req REQ-186
test.before(() => {
  if (assets) seq = shortSequence();
});

// @req REQ-186
test("the verified assets are present", () => {
  assert.ok(
    assets,
    "Set ETHNIAFRICA_VIDEO_ASSETS to the verified imagery folder"
  );
});

for (const [backend, gpu] of [
  ["SwiftShader", false],
  ["the GPU", true],
])
  // @req REQ-186
  test(`on ${backend}, a fast capture decodes to the normal capture's pixels`, async (t) => {
    if (!assets) return t.skip("no imagery");
    for (const { frame, normal, fast } of await bothCaptures(
      seq,
      momentsOf(seq),
      gpu
    )) {
      const [a, b] = await Promise.all([rgba(normal), rgba(fast)]);
      assert.deepEqual(b.info, a.info, `frame ${frame}`);
      assert.ok(b.data.equals(a.data), `frame ${frame}: pixels differ`);
      // A different compression, so a different file: the test would mean
      // nothing if the two requests had been the same.
      assert.ok(!fast.equals(normal), `frame ${frame}: the same PNG bytes`);
    }
  });
