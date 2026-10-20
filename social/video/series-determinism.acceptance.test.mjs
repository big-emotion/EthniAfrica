// @req REQ-186
// « Same frame number, same pixels » on SwiftShader (20 October 2026). Two
// SwiftShader encodes of the parallel render's short sequence gave two
// different video.mp4: the opener's globe differed along its limb from run
// to run, by up to 37 levels, because the shader sampled its imagery inside
// a branch, where the mip level is undefined (README, « Determinism »). Here
// three browsers draw the globe's frames at once, as three workers do, and
// every frame must be the same pixels in all three. The imagery is not in
// git: point ETHNIAFRICA_VIDEO_ASSETS at its folder. A missing folder fails;
// it is never reported as passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const root = mkdtempSync(join(tmpdir(), "series-determinism-"));
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

const rgba = async (png) => await sharp(png).ensureAlpha().raw().toBuffer();

// @req REQ-186
test("the verified assets are present", () => {
  assert.ok(
    assets,
    "Set ETHNIAFRICA_VIDEO_ASSETS to the verified imagery folder"
  );
});

// The globe's frames whose limb differed between runs before the fix: its
// first frame, its zoom, and the frames it shares with the first subtitles.
const GLOBE_FRAMES = [0, 5, 12, 20, 40, 60, 83];

// @req REQ-186
test("the globe drawn by three browsers at once is the same pixels in each", async (t) => {
  if (!assets) return t.skip("no imagery");
  const seq = shortSequence();
  const runs = await Promise.all(
    [0, 1, 2].map(() =>
      renderSeriesFrames(seq, GLOBE_FRAMES, { diagnose: true, assets })
    )
  );
  for (const [i, frame] of GLOBE_FRAMES.entries()) {
    const [a, b, c] = await Promise.all(runs.map((r) => rgba(r[i].png)));
    assert.ok(a.equals(b), `frame ${frame}: browsers 1 and 2 differ`);
    assert.ok(a.equals(c), `frame ${frame}: browsers 1 and 3 differ`);
  }
});
