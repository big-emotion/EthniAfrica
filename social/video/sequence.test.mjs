// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  loadSequence,
  frameState,
  holdLayout,
  checkLayout,
  TOTAL_FRAMES,
} from "./sequence.mjs";

const congo = JSON.parse(
  readFileSync(new URL("./fixtures/congo.sequence.json", import.meta.url))
);
const copy = () => structuredClone(congo);
const at = (seconds) => Math.round(seconds * 30);

// @req REQ-186
test("frames are addressed by number, independent of call order", () => {
  const seq = loadSequence(copy());
  assert.equal(TOTAL_FRAMES, 360);
  const first = frameState(seq, 120);
  frameState(seq, 359);
  frameState(seq, 7);
  assert.deepEqual(frameState(seq, 120), first);
  for (const bad of [-1, 360, 1.5, NaN, Infinity])
    assert.throws(() => frameState(seq, bad));
});

// @req REQ-186
test("the camera moves until 6.0 s, then stops dead", () => {
  const seq = loadSequence(copy());
  const camera = (f) => frameState(seq, f).camera;
  assert.notDeepEqual(camera(at(1)), camera(at(4)));
  for (let f = at(6); f < TOTAL_FRAMES; f++)
    assert.deepEqual(camera(f), camera(at(6)));
  for (let f = 0; f < TOTAL_FRAMES; f++)
    assert.ok(Object.values(camera(f)).every(Number.isFinite));
});

// @req REQ-186
test("the hold is still and the last frame equals the 11 s frame", () => {
  const seq = loadSequence(copy());
  const hold = frameState(seq, at(11));
  for (let f = at(10); f < TOTAL_FRAMES; f++)
    assert.deepEqual(frameState(seq, f), hold);
});

// @req REQ-186
test("the river fades in whole and is never drawn progressively", () => {
  const seq = loadSequence(copy());
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const river = frameState(seq, f).features.congo;
    assert.deepEqual(Object.keys(river).sort(), ["core", "glow"]);
    assert.ok(river.glow <= 0.75 + 1e-9);
  }
  assert.equal(frameState(seq, at(6)).features.congo.core, 0);
  const eight = frameState(seq, at(8)).features.congo;
  assert.ok(Math.abs(eight.core - 0.75) < 0.03, `core ${eight.core}`);
  // Board 4's « 37 % » is of the glow's final 0.75; the 8 s key frame draws 0.28.
  assert.ok(Math.abs(eight.glow - 0.28) < 0.03, `glow ${eight.glow}`);
  assert.equal(frameState(seq, at(11)).features.congo.core, 1);
});

// @req REQ-186
test("a name appears only once its feature is at least 60 % visible", () => {
  const seq = loadSequence(copy());
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const state = frameState(seq, f);
    if (state.labels.congo > 0)
      assert.ok(state.features.congo.core >= 0.6, `frame ${f}`);
  }
  assert.equal(frameState(seq, at(11)).labels.congo, 1);
});

// @req REQ-186
test("title, signature and caption are on screen from the first frame", () => {
  const seq = loadSequence(copy());
  for (const f of [0, at(3), TOTAL_FRAMES - 1]) {
    const { text } = frameState(seq, f);
    assert.deepEqual(text, { signature: 1, title: 1, caption: 1 });
  }
});

// @req REQ-186
test("the hold layout keeps everything inside the Meta and TikTok safe zone", () => {
  const layout = holdLayout(loadSequence(copy()));
  assert.deepEqual(checkLayout(layout), []);

  const below = structuredClone(layout);
  below.elements.find((e) => e.kind === "legend").box.y = 1230;
  assert.match(checkLayout(below).join("\n"), /safe zone/);

  const buttons = structuredClone(layout);
  buttons.elements.push({
    id: "probe",
    kind: "label",
    box: { x: 800, y: 900, w: 60, h: 30 },
  });
  assert.match(checkLayout(buttons).join("\n"), /button column/);
});

// @req REQ-186
test("the caption names the map, period, sources and imagery, one line each", () => {
  const layout = holdLayout(loadSequence(copy()));
  assert.deepEqual(layout.captionLines, [
    "Carte : tracé actuel du fleuve, simplifié",
    "Période : géographie actuelle",
    "Source : Natural Earth ; imagerie : NASA Earth Observatory",
  ]);
});

// @req REQ-186
test("a legend is required, even for a single item", () => {
  const seq = copy();
  seq.legend = [];
  assert.throws(() => loadSequence(seq), /legend/i);
  const many = copy();
  many.legend = Array.from({ length: 5 }, (_, i) => ({
    label: `Item ${i}`,
    feature: "congo",
  }));
  assert.throws(() => loadSequence(many), /legend/i);
});

// @req REQ-186
test("only verified imagery is accepted", () => {
  for (const imagery of [
    "google-satellite",
    "s2cloudless-2018",
    "s2cloudless-2024",
    undefined,
  ]) {
    const seq = copy();
    seq.imagery = imagery;
    assert.throws(() => loadSequence(seq), /imagery/i, String(imagery));
  }
  const close = copy();
  close.imagery = "s2cloudless-2016";
  const lines = holdLayout(loadSequence(close)).captionLines;
  assert.match(lines.at(-1), /imagerie : Sentinel-2 cloudless 2016, EOX$/);
});

// @req REQ-186
test("every drawn feature needs a documented source and valid coordinates", () => {
  const unsourced = copy();
  unsourced.features[0].source = "";
  assert.throws(() => loadSequence(unsourced), /source/i);
  const outside = copy();
  outside.features[0].geometry.coordinates[0] = [181, 0];
  assert.throws(() => loadSequence(outside), /coordinate/i);
});

// @req REQ-186
test("a historical map says the imagery shows today's landscape", () => {
  const seq = copy();
  seq.historical = true;
  assert.match(
    holdLayout(loadSequence(seq)).captionLines.at(-1),
    /; l'imagerie montre le paysage actuel$/
  );
});

// @req REQ-186
test("flat satellite is the default; relief is an explicit, still option", () => {
  const plain = copy();
  delete plain.style;
  assert.equal(loadSequence(plain).style, "flat");
  assert.equal(frameState(loadSequence(plain), 0).relief, null);

  const relief = copy();
  relief.style = "relief";
  const seq = loadSequence(relief);
  assert.ok(
    holdLayout(seq).captionLines.includes("Relief : NOAA, exagéré"),
    "relief caption"
  );
  assert.deepEqual(frameState(seq, 0).relief, frameState(seq, 359).relief);

  const unknown = copy();
  unknown.style = "light";
  assert.throws(() => loadSequence(unknown), /style/i);
});
