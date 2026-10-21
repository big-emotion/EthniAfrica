// @req REQ-186
// Cartes 1.13.0, the sound cues as the plan lists them (series.md « 13. Sound
// cues »; handoff.md « Renderer integration of 1.13.0 », step 13, check 13):
// each cue on the frame of its motion, its family and its level under the
// voice's peak; two in any second at most, ticks aside; a pop within 150 ms
// of an impact shares it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { CUES } from "./series-cues.mjs";
import { counterTicks } from "./series-turns.mjs";
import { motionDemo, wordDemo } from "./fixtures/series-motion.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (demo, options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-cues-"));
  dirs.push(dir);
  return loadSeriesVideo(demo(dir, options), { dir });
};
const motion = load(motionDemo);
const words = load(wordDemo);
const cueAt = (s, family, frame) =>
  s.cues.find((c) => c.family === family && c.frame === frame);

// @req REQ-186
test("check 13: the levels of the cue table, under the voice's peak", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(CUES).map(([k, v]) => [k, v.level])),
    {
      pop: -20,
      tick: -26,
      swell: -20,
      flag: -23,
      whoosh: -16,
      rise: -16,
      bandIn: -18,
      bandOut: -24,
      lift: -24,
      recap: -22,
      draw: -22,
      drawStrong: -20,
      impact: -17,
      whipLanding: -21,
      drum: -16,
      ding: -18,
    }
  );
});

// @req REQ-186
test("check 13: each cue on its motion's frame: the flash's rise on its peak, the whip's whoosh and landing, the counter's ticks and landing", () => {
  const flash = motion.eras.flashes[0];
  const rise = cueAt(motion, "rise", flash.start + 4);
  assert.ok(rise, "the rise on the flash's peak");
  assert.equal(rise.align, "peak");
  assert.equal(rise.level, -16);
  const PARIS = motion.cards.findIndex((c) => c.id === "motion-paris");
  const whip = motion.mapSequence.cards[PARIS].moves.find((m) => m.whip);
  assert.ok(cueAt(motion, "whoosh", whip.start + 10));
  assert.equal(cueAt(motion, "impact", whip.end).level, -21);
  const era = Object.values(motion.eras.cards).find((c) => c.frames);
  const ticks = motion.cues.filter(
    (c) =>
      c.family === "tick" &&
      c.frame >= era.start &&
      c.frame <= era.start + era.frames
  );
  assert.deepEqual(
    ticks.map((c) => c.frame),
    counterTicks(era)
  );
  assert.equal(cueAt(motion, "impact", era.start + era.frames).level, -17);
  // The intro's « S'abonner » rings when it turns « Abonné ».
  assert.ok(cueAt(motion, "ding", motion.cardStarts[1] - 9 + 60));
  // The recap card enters on a reversed whoosh.
  const recap = motion.cards.findIndex((c) => c.isRecap);
  const r = motion.cues.find((c) => c.reverse);
  assert.equal(r.frame, motion.cardStarts[recap]);
  assert.equal(r.level, -22);
});

// @req REQ-186
test("check 13: drawn marks sound for their drawing's length; the band's whooshes and its key word's impact; the word's parts and stamp", () => {
  const TRAITS = words.cards.findIndex((c) => c.id === "motion-traits");
  const cp = words.mapSequence.cards[TRAITS];
  const river = cp.marks.find((m) => m.kind === "river");
  const draw = cueAt(words, "draw", river.start);
  assert.equal(draw.length, river.dur);
  assert.equal(draw.level, -22);
  const cross = cp.marks.find((m) => m.kind === "cross");
  assert.equal(cueAt(words, "draw", cross.start)?.level ?? -20, -20);
  const band = words.headlines[0];
  assert.equal(cueAt(words, "whoosh", band.start + 2).level, -18);
  assert.equal(cueAt(words, "whoosh", band.end + 4).level, -24);
  const MOT = words.cards.findIndex((c) => c.id === "motion-mot");
  const plan = words.cards[MOT].teachingPlan.word;
  assert.equal(cueAt(words, "whoosh", plan.split + 7).level, -24);
  assert.equal(cueAt(words, "impact", plan.stamp + 5).level, -17);
});

// @req REQ-186
test("check 13: two cues in any second at most, ticks aside; a pop within 150 ms of an impact shares it", () => {
  for (const s of [motion, words]) {
    const cues = s.cues.filter((c) => c.family !== "tick");
    for (const c of cues) {
      const near = cues.filter(
        (d) => d.frame >= c.frame && d.frame < c.frame + 30
      );
      assert.ok(near.length <= 2, `${near.length} cues from frame ${c.frame}`);
    }
    for (const pop of cues.filter((c) => c.family === "pop"))
      assert.ok(
        !cues.some(
          (c) => c.family === "impact" && Math.abs(c.frame - pop.frame) < 4.5
        ),
        `a pop at ${pop.frame} beside an impact`
      );
  }
});
