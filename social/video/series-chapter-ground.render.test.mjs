// @req REQ-186
// The chapter card (operator, 20 October 2026) is text on the dark Nuit
// ground in every series video, whatever the episode's theme: a Parchemin
// series (series 2, « Le nom qu'on leur a donné ») drew it on the light
// parchment with its white title, unreadable. Drawn in the pinned Chromium.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { longDemo } from "./fixtures/series-long.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-chapter-ground-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

// Mean luminance (0 to 255) of a 40 px square of empty ground under the title.
async function groundLuminance(png) {
  const { data } = await sharp(png)
    .extract({ left: 520, top: 1500, width: 40, height: 40 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < data.length; i += 3)
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  return sum / (data.length / 3);
}

// @req REQ-186
test("a Parchemin series draws its chapter card on the dark Nuit ground", async () => {
  const seq = loadSeriesVideo(
    longDemo(dir, {
      deck: (d) => {
        for (const c of d.cards) c.theme = "parchemin";
        return d;
      },
    }),
    { dir }
  );
  const start =
    seq.cardStarts[seq.cards.findIndex((c) => c.id === "chapitre-1")];
  const [frame] = await renderSeriesFrames(seq, [start + 60]);
  const luminance = await groundLuminance(frame.png);
  assert.ok(
    luminance < 60,
    `chapter ground luminance ${Math.round(luminance)}`
  );
});
