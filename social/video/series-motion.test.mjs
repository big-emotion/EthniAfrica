// @req REQ-186
// Cartes 1.13.0, motion tokens and the pop (series.md « 1. Motion tokens »,
// « 2. The pop »; handoff.md « Renderer integration of 1.13.0 », checks 1
// and 2): the five curves and the shared lengths in frames at 30 fps, the
// lengths of 1.11.0 and 1.12.0 unchanged, every curve of the series modules
// taken from series-motion.mjs, and the pop, the exit and the swell.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EASE, DUR, popAt, exitAt, swellAt, pushAt } from "./series-motion.mjs";
import { cubicBezier } from "./sequence.mjs";
import { MAP_TIMING, SEQUENCE_TIMING } from "./series-sequence.mjs";
import { TEACHING } from "./series-teaching.mjs";

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// @req REQ-186
test("check 1: the five curves are the tokens' curves", () => {
  for (const [name, curve] of Object.entries({
    enter: [0.2, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
    move: [0.45, 0, 0.55, 1],
    draw: [0.4, 0, 0.2, 1],
  })) {
    const reference = cubicBezier(...curve);
    for (let x = 0; x <= 1; x += 0.05)
      assert.ok(near(EASE[name](x), reference(x)), `${name} at ${x}`);
  }
  for (let x = 0; x <= 1; x += 0.05)
    assert.ok(near(EASE.land(x), 1 - (1 - x) ** 4), `land at ${x}`);
  assert.equal(EASE.land(1.2), 1);
  assert.equal(EASE.land(-0.1), 0);
});

// @req REQ-186
test("check 1: the shared lengths in frames at 30 fps", () => {
  assert.deepEqual(DUR, {
    micro: 5,
    pop: 9,
    exit: 6,
    stamp: 5,
    change: 9,
    band: { in: 12, out: 8 },
    flash: 15,
    whip: 21,
    swell: 21,
    move: 48,
    counter: [36, 48, 60],
  });
});

// @req REQ-186
test("check 1: the lengths of 1.11.0 and 1.12.0 keep their values", () => {
  assert.equal(MAP_TIMING.enter, DUR.swell);
  assert.equal(MAP_TIMING.move, DUR.move);
  assert.deepEqual(
    [
      MAP_TIMING.state,
      MAP_TIMING.ink,
      MAP_TIMING.out,
      MAP_TIMING.gap,
      MAP_TIMING.arrow,
      MAP_TIMING.drawing,
      MAP_TIMING.word,
      MAP_TIMING.rename,
    ],
    [15, 18, 15, 21, [24, 48], 12, 9, 30]
  );
  assert.equal(SEQUENCE_TIMING.entry, 21);
  assert.equal(SEQUENCE_TIMING.move, 27);
  assert.deepEqual(TEACHING.moves, { join: 14, fall: 15, become: 9 });
  assert.deepEqual(TEACHING.cascade, { each: 9, apart: 3, rise: 16 });
});

// Every curve of the series modules comes from series-motion.mjs: none of
// them builds its own Bézier, imports the satellite video's eases or keeps a
// smoothstep. The chapter card keeps its own board's cubic (the operator's
// card of 20 October 2026, not changed by 1.13.0).
const SERIES_MODULES = [
  "series.mjs",
  "series-map.mjs",
  "series-sequence.mjs",
  "series-teaching.mjs",
  "series-page.mjs",
];
// @req REQ-186
test("check 1: every move of the series modules resolves to a token", () => {
  for (const file of SERIES_MODULES) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      /import\s*\{[^}]*\b(enter|leave|symmetric|cubicBezier)\b[^}]*\}\s*from\s*"\.\/sequence\.mjs"/u,
      `${file} imports a curve from sequence.mjs`
    );
    assert.doesNotMatch(
      source,
      /\*\s*\(3 - 2 \*/u,
      `${file} keeps a smoothstep of its own`
    );
    const cubics = source.match(/Math\.pow\(1 - p, 3\)/gu) ?? [];
    assert.ok(
      cubics.length <= (file === "series-page.mjs" ? 1 : 0),
      `${file} keeps a cubic ease of its own`
    );
  }
});

// @req REQ-186
test("check 2: the pop scales 70, 106 and 100 % at frames 0, 5 and 9", () => {
  assert.ok(near(popAt(0).scale, 0.7));
  assert.equal(popAt(0).opacity, 0);
  assert.ok(near(popAt(5).scale, 1.06, 0.005), `frame 5: ${popAt(5).scale}`);
  assert.ok(near(popAt(9).scale, 1));
  assert.equal(popAt(9).opacity, 1);
  // Opacity is whole in the first 120 ms.
  assert.equal(popAt(4).opacity, 1);
  assert.ok(popAt(2).opacity > 0 && popAt(2).opacity < 1);
  // One bounce: up to the overshoot, then down to rest, never below.
  let max = 0;
  for (let f = 0; f <= 9; f += 0.25) {
    const s = popAt(f).scale;
    assert.ok(s >= 0.7 - 1e-9);
    max = Math.max(max, s);
  }
  assert.ok(near(max, 1.06, 0.002));
  for (let f = 6; f < 9; f += 0.25)
    assert.ok(popAt(f + 0.25).scale <= popAt(f).scale + 1e-9);
  assert.deepEqual(popAt(-1), { scale: 0.7, opacity: 0 });
  assert.deepEqual(popAt(30), { scale: 1, opacity: 1 });
});

// @req REQ-186
test("check 2: a mark under 60 px rises to 110 %", () => {
  assert.ok(near(popAt(5, { small: true }).scale, 1.1, 0.008));
  assert.ok(near(popAt(9, { small: true }).scale, 1));
});

// @req REQ-186
test("check 2: an exit ends at 92 % and 0", () => {
  assert.deepEqual(exitAt(-1), { scale: 1, opacity: 1 });
  assert.deepEqual(exitAt(0), { scale: 1, opacity: 1 });
  assert.ok(near(exitAt(DUR.exit).scale, 0.92));
  assert.equal(exitAt(DUR.exit).opacity, 0);
  assert.equal(exitAt(20).opacity, 0);
});

// @req REQ-186
test("the swell: the fill rises to 135 % at 55 % of 700 ms, then settles", () => {
  assert.equal(swellAt(0), 0);
  assert.ok(near(swellAt(0.55 * DUR.swell), 1.35));
  assert.ok(near(swellAt(DUR.swell), 1));
  assert.equal(swellAt(100), 1);
  for (let f = 0; f + 1 <= 0.55 * DUR.swell; f++)
    assert.ok(swellAt(f + 1) >= swellAt(f));
});

// @req REQ-186
test("check 3: the push grows 6 % every 10 s, 3 % on parchment", () => {
  assert.equal(pushAt(0), 1);
  assert.ok(near(pushAt(300), 1.06));
  assert.ok(near(pushAt(450), 1.06 ** 1.5));
  assert.ok(near(pushAt(300, 0.03), 1.03));
  assert.equal(pushAt(-5), 1);
});
