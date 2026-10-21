// @req REQ-186
// Cartes 1.13.0, format tiers (series.md « 10. Format tiers »; handoff.md
// « Renderer integration of 1.13.0 », step 10, check 11): the plan's report
// of every change, its median and longest gap (picture phases and chapter
// cards left out), the warnings past the tier's longest gap, the refusals
// past its strong transitions and headline bands.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { TIERS, gapsOf } from "./series-tiers.mjs";
import { motionDemo, wordDemo } from "./fixtures/series-motion.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (demo, options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-tiers-"));
  dirs.push(dir);
  return loadSeriesVideo(demo(dir, options), { dir });
};

// @req REQ-186
test("check 11: the three tiers and their targets", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(TIERS).map(([k, t]) => [
        k,
        [t.median, t.longest, t.strong, t.bands, t.recap],
      ])
    ),
    {
      short: [2, 3.5, 3, 2, 120],
      medium: [2.5, 4.5, 5, 2, 180],
      long: [3, 6, null, 2, 180],
    }
  );
});

// @req REQ-186
test("check 11: the gaps between changes, picture phases and chapter cards left out", () => {
  // Changes at 0, 30, 90 and 300; frames 120 to 280 a picture phase.
  const { median, longest } = gapsOf([0, 30, 90, 300], [[100, 290]]);
  assert.equal(longest, 60);
  assert.equal(median, 45);
});

// @req REQ-186
test("check 11: every piece reports its changes, their median and longest gap, against its tier", () => {
  const seq = load(motionDemo, { recap: false });
  const r = seq.tierReport;
  assert.equal(r.tier, "medium");
  assert.ok(r.changes.length > 20, `${r.changes.length} changes`);
  assert.ok(r.changes.every((f, k) => !k || f > r.changes[k - 1]));
  assert.ok(r.median > 0 && r.median <= r.longest);
  // Two whips, the flash to 1970 and the flash back to today.
  assert.equal(r.strong, 4);
  // A piece without a tier is reported, never warned.
  const plain = load(seriesDemo);
  assert.equal(plain.tierReport.tier, null);
  assert.ok(!plain.warnings.some((w) => /intervalle/u.test(w)));
});

// @req REQ-186
test("check 11: past the tier's longest gap, a warning; past its strong transitions or bands, a refusal", () => {
  const short = load(wordDemo, { edit: (input) => (input.tier = "short") });
  assert.ok(
    short.warnings.some((w) => /Intervalle sans changement de/u.test(w)),
    short.warnings.join(" | ")
  );
  assert.throws(
    () =>
      load(motionDemo, {
        recap: false,
        edit: (input) => (input.tier = "short"),
      }),
    /Transitions fortes : 4 pour une vidéo courte, 3 au plus/u
  );
  assert.throws(
    () => load(wordDemo, { edit: (input) => (input.tier = "petit") }),
    /tier est short, medium ou long/u
  );
});
