// @req REQ-186
// Cartes 1.13.0 on the frame model of existing pieces (handoff.md « Renderer
// integration of 1.13.0 », steps 2 and 3, checks 2 and 3): names, words,
// labels and places pop and leave by the exit, areas swell, and every map,
// picture and parchment card pushes in, at a constant rate, from its first
// frame. No browser is needed; the drawn frames are checked in
// series-motion.render.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { flatProject } from "./series-map.mjs";
import { SEQUENCE_TIMING } from "./series-sequence.mjs";
import { DUR, EASE, popAt, swellAt, pushAt } from "./series-motion.mjs";
import { FPS } from "./sequence.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";
import { touaregDemo } from "./fixtures/series-touareg.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";
import { teachingCardsDemo } from "./fixtures/series-teaching.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (demo, options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-motion-"));
  dirs.push(dir);
  return loadSeriesVideo(demo(dir, options), { dir });
};
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const animated = load(animatedDemo);
const cardOf = (s, id) => s.cards.findIndex((c) => c.id === id);
const MOSSI = cardOf(animated, "carte-animee-mossi");
const layer = (s, frame, i) =>
  seriesFrameState(s, frame).layers.find((l) => l.card === i);
const mapAt = (s, frame, i) =>
  (layer(s, frame, i) ?? seriesFrameState(s, frame).layers.find((l) => l.map))
    .map;
const wordFrame = (s, i, unit) => {
  for (const c of s.chunks.filter((c) => c.card === i)) {
    const w = c.words.find((w) => w.text.replace(/[,.:]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
// The frames after an entry's start at which its area is at 0.6: its name
// pops from there.
const NAME_DELAY = (() => {
  let k = 0;
  while (EASE.enter(k / SEQUENCE_TIMING.entry) < SEQUENCE_TIMING.nameAt) k++;
  return k;
})();

// @req REQ-186
test("check 2: an area's name pops when its area is 60 % in, from the name's centre", () => {
  // An area said after the plan's move (names wait while the camera moves).
  const cp = animated.mapSequence.cards[MOSSI];
  const quiet = cp.moves.at(-1).end + 5;
  const file = animated.mapSequence.views[MOSSI].files.find(
    (f) => animated.mapSequence.entries[f]?.start + NAME_DELAY > quiet
  );
  assert.ok(file, "an area said after the move");
  const start = animated.mapSequence.entries[file].start;
  const name = (f) =>
    mapAt(animated, f, MOSSI).names.find((n) => n.file === file);
  const from = start + NAME_DELAY;
  assert.equal(name(from).opacity, 0);
  assert.ok(close(name(from).scale, 0.7));
  assert.ok(close(name(from + 5).scale, popAt(5).scale));
  assert.ok(close(name(from + DUR.pop).scale, 1));
  assert.ok(close(name(from + DUR.pop).opacity, 1));
});

// @req REQ-186
test("check 2: words on the map pop on their word and leave by the exit", () => {
  const cp = animated.mapSequence.cards[MOSSI];
  const w = cp.words.find((x) => x.end !== Infinity);
  const word = (f) =>
    mapAt(animated, f, MOSSI).marks.words.find((x) => x.text === w.text);
  assert.ok(close(word(w.start + 5).scale, popAt(5).scale));
  assert.equal(word(w.start + 9).opacity, 1);
  assert.equal(word(w.start + 9).scale, 1);
  const out = word(w.end + DUR.exit - 1);
  assert.ok(out.scale < 1 && out.scale > 0.92 && out.opacity < 0.5);
  assert.equal(word(w.end + DUR.exit), undefined);
});

// @req REQ-186
test("check 2: a place's dot pops to 110 % as a small mark, its name to 106 %", () => {
  const i = cardOf(animated, "carte-animee-mossi");
  const cp = animated.mapSequence.cards[i];
  const p = cp.places.find((x) => x.start > cp.start);
  assert.ok(p, "a place said on the Mossi plan");
  const place = (f) =>
    mapAt(animated, f, i).marks.places.find((x) => x.name === p.name);
  assert.ok(close(place(p.start + 5).scale, popAt(5, { small: true }).scale));
  assert.ok(close(place(p.start + 5).nameScale, popAt(5).scale));
});

// @req REQ-186
test("the swell: an entering area's fill rises to 135 % of its level, then settles", () => {
  const start = animated.mapSequence.entries["bfa-mamprugu.geojson"].start;
  const swell = (f) =>
    mapAt(animated, f, MOSSI).areas.find((a) => a.id === "mamprugu").swell;
  assert.equal(swell(start), 0);
  assert.ok(close(swell(start + 11), swellAt(11)));
  assert.ok(swell(start + 11) > 1.3);
  assert.equal(swell(start + 21), 1);
});

// @req REQ-186
test("check 3: an animated map pushes in 6 % every 10 s from its card's first frame, multiplied with its moves", () => {
  const shot = animated.mapSequence.shots[MOSSI];
  const cp = animated.mapSequence.cards[MOSSI];
  // The plan's own push, from its change of view.
  assert.equal(shot.from, animated.cardStarts[MOSSI] - 9);
  const view = cp.view;
  const f = cp.start + 20;
  assert.ok(f < cp.moves[0].start);
  const camera = mapAt(animated, f, MOSSI).camera;
  assert.ok(close(camera.radius, view.radius * pushAt(f - shot.from)));
  assert.equal(mapAt(animated, f, MOSSI).zoom, 1);
  // After the move, the move's radius times the push.
  const after = cp.moves[0].end + 3;
  assert.ok(
    close(
      mapAt(animated, after, MOSSI).camera.radius,
      cp.moves[0].to.radius * pushAt(after - shot.from),
      1e-6
    )
  );
  // The globe pushes from its landing (4.4 s).
  assert.equal(animated.mapSequence.shots[0].from, 132);
  assert.ok(
    close(
      mapAt(animated, 132, 0).camera.radius,
      animated.cards[0].map.view.radius
    )
  );
});

// @req REQ-186
test("check 3: names and marks move with the map and keep their pixel size", () => {
  const cp = animated.mapSequence.cards[MOSSI];
  const f = cp.start + 40;
  const map = mapAt(animated, f, MOSSI);
  for (const n of map.names) {
    const placed = animated.mapSequence.views[MOSSI].stops[0].names.find(
      (m) => m.file === n.file
    );
    const [x, y] = flatProject(map.camera, ...placed.anchor);
    const [x0, y0] = flatProject(cp.view, ...placed.anchor);
    assert.ok(close(n.box.x - placed.box.x, x - x0, 1e-6));
    assert.ok(close(n.box.y - placed.box.y, y - y0, 1e-6));
    assert.ok(close(n.box.w, placed.box.w));
  }
});

// @req REQ-186
test("check 3: a 1.5.0 map sequence pushes its camera instead of zooming its layer", () => {
  const touareg = load(touaregDemo);
  const i = touareg.mapSequence.runs[0].cards[0];
  const shot = touareg.mapSequence.shots[i];
  const view = touareg.mapSequence.views[i].camera;
  const f = touareg.cardStarts[i] + 10;
  const map = layer(touareg, f, i).map;
  assert.equal(map.zoom, 1);
  assert.ok(close(map.camera.radius, view.radius * pushAt(f - shot.from)));
});

// @req REQ-186
test("check 3: a picture pushes 6 % every 10 s (decision 3), not 1.4.0's 4 % over the card", () => {
  const pays = load(seriesDemo);
  const i = pays.cards.findIndex((c, k) => k && c.image && c.type !== "map");
  const from = pays.cardStarts[i] - 9 + 1;
  const l = layer(pays, from + 150, i);
  assert.ok(close(l.zoom, pushAt(150)));
  const end = (pays.cardStarts[i + 1] ?? pays.frames) - 1;
  assert.ok(close(l.zoomEnd, pushAt(end - from)));
});

// @req REQ-186
test("check 3: a parchment card pushes its content 3 % every 10 s around (540, 1000)", () => {
  const teaching = load(teachingCardsDemo);
  const i = teaching.cards.findIndex((c) => c.ground === "parchment");
  const from = teaching.cardStarts[i] - 9 + 1;
  assert.ok(close(layer(teaching, from + 300, i).push, 1.03));
  assert.ok(close(layer(teaching, from, i).push, 1));
});

// @req REQ-186
test("check 3: a card whose push would pass the imagery's limit is refused", () => {
  assert.throws(
    () =>
      load(animatedDemo, {
        edit: (deck) => {
          const c = deck.cards.find((x) => x.id === "carte-animee-1932");
          // Just inside the 500 m mosaic's limit at rest, past it once pushed.
          c.map.view.radius = 20600;
        },
      }),
    /Poussée au-delà de la limite de l'imagerie : cadrer plus large/u
  );
});

// @req REQ-186
test("check 2: on parchment, free words and a drawing's labels pop", () => {
  const teaching = load(teachingCardsDemo);
  const law = cardOf(teaching, "serie-nom-famille-06");
  const lignee = wordFrame(teaching, law, "lignée");
  const words = (f) => layer(teaching, f, law).words[1];
  assert.deepEqual(words(lignee), { opacity: 0, scale: 0.7 });
  assert.ok(close(words(lignee + 5).scale, popAt(5).scale));
  assert.deepEqual(words(lignee + 9), { opacity: 1, scale: 1 });
  const pair = cardOf(teaching, "serie-nom-famille-04");
  const yaw = wordFrame(teaching, pair, "Yaw");
  const d = (f) => layer(teaching, f, pair).drawings[0];
  assert.ok(close(d(yaw + 5 + 5).nameScale, popAt(5).scale));
  assert.equal(d(yaw + 5 + 9).name, 1);
});

// Check 14: a piece without the new fields gets nothing of 1.13.0 but the
// motion tokens, the pop, the swell and the push: no era, no flash, no
// counter, no band, no flag, no whip, no drawn mark, no recap, no tier
// warning. Its pixels are compared with the 1.12.0 engine's in the
// integration record (proposals/1.13.0-proposition/).
// @req REQ-186
test("check 14: a piece without the new fields takes only the pop, the swell and the push", () => {
  for (const demo of [
    seriesDemo,
    touaregDemo,
    teachingCardsDemo,
    animatedDemo,
  ]) {
    const s = load(demo);
    assert.equal(s.eras, null);
    assert.deepEqual(s.headlines, []);
    assert.equal(s.tierReport.tier, null);
    assert.ok(s.cards.every((c) => !c.isRecap && c.type !== "word"));
    for (let f = 0; f < s.frames; f += 11) {
      const state = seriesFrameState(s, f);
      assert.equal(state.flash, undefined);
      assert.equal(state.paperInks, undefined);
      for (const l of state.layers) {
        assert.equal(l.counter, undefined);
        assert.equal(l.headline, undefined);
        assert.equal(l.word, undefined);
        if (!l.map) continue;
        assert.equal(l.map.flags, undefined);
        assert.equal(l.map.whip, undefined);
        assert.equal(l.map.paper, undefined);
        assert.equal(l.map.desat, undefined);
        assert.deepEqual(l.map.marks?.drawn ?? [], []);
      }
    }
  }
});
