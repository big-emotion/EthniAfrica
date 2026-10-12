// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  loadSequence,
  frameState,
  holdLayout,
  checkLayout,
  project,
  unproject,
  VIEW_CENTRE,
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

const west = JSON.parse(
  readFileSync(new URL("./fixtures/west-areas.sequence.json", import.meta.url))
);
const westCopy = () => structuredClone(west);

// @req REQ-186
test("areas and borders fade in whole, like the river", () => {
  const seq = loadSequence(westCopy());
  for (const id of ["a", "c", "frontieres"]) {
    let previous = 0;
    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const feature = frameState(seq, f).features[id];
      assert.deepEqual(Object.keys(feature), ["opacity"]);
      assert.ok(feature.opacity >= previous, `${id} frame ${f}`);
      previous = feature.opacity;
    }
    assert.equal(frameState(seq, at(6)).features[id].opacity, 0);
    assert.equal(frameState(seq, at(11)).features[id].opacity, 1);
  }
});

// @req REQ-186
test("an area needs a closed ring, a card ink and a certainty; a border a strength", () => {
  const ink = westCopy();
  ink.features[0].ink = "d";
  assert.throws(() => loadSequence(ink), /ink/);
  const certainty = westCopy();
  certainty.features[2].certainty = "probable";
  assert.throws(() => loadSequence(certainty), /certainty/);
  const open = westCopy();
  open.features[1].geometry.coordinates[0].pop();
  assert.throws(() => loadSequence(open), /ring/);
  const strength = westCopy();
  strength.features[3].strength = "bold";
  assert.throws(() => loadSequence(strength), /strength/);
  const multi = westCopy();
  multi.features[0].geometry = {
    type: "MultiPolygon",
    coordinates: [west.features[0].geometry.coordinates],
  };
  assert.doesNotThrow(() => loadSequence(multi));
});

// @req REQ-186
test("only one feature carries the subject plate", () => {
  const two = westCopy();
  two.features[0].plate = true;
  two.features[1].plate = true;
  assert.throws(() => loadSequence(two), /plate/);
});

// @req REQ-186
test("area names wait for their area; places, water and region names share one track", () => {
  const seq = loadSequence(westCopy());
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const state = frameState(seq, f);
    for (const id of ["a", "b", "c"])
      if (state.labels[id] > 0)
        assert.ok(state.features[id].opacity >= 0.6, `${id} frame ${f}`);
    assert.equal(state.names.Sahel, state.places.Bamako);
    assert.equal(state.labels.frontieres, undefined);
  }
  const congoSeq = loadSequence(copy());
  const hold = frameState(congoSeq, at(11));
  assert.equal(hold.names["Océan\nAtlantique"], 1);
});

// @req REQ-186
test("at most six names are on screen", () => {
  const seq = westCopy();
  seq.places.push({ name: "Ouagadougou", lon: -1.53, lat: 12.37 });
  assert.throws(() => loadSequence(seq), /six names/);
  const unknown = westCopy();
  unknown.names[0].kind = "country";
  assert.throws(() => loadSequence(unknown), /name kind/);
});

// @req REQ-186
test("the areas hold layout stays in the safe zone and counts every name", () => {
  const layout = holdLayout(loadSequence(westCopy()));
  assert.deepEqual(checkLayout(layout), []);
  const ids = layout.elements.map((e) => e.id);
  for (const id of ["Aire A", "Aire B", "Aire C", "Sahel", "Bamako", "Niamey"])
    assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes("Frontières actuelles"));
  const congoIds = holdLayout(loadSequence(copy())).elements.map((e) => e.id);
  assert.ok(congoIds.includes("Océan\nAtlantique"));
  assert.deepEqual(checkLayout(holdLayout(loadSequence(copy()))), []);
});

// @req REQ-186
test("a title highlight names a known feature and a phrase of the title", () => {
  const wrong = westCopy();
  wrong.highlight.text = "deux certaines";
  assert.throws(() => loadSequence(wrong), /highlight/);
  const unknown = westCopy();
  unknown.highlight.feature = "z";
  assert.throws(() => loadSequence(unknown), /highlight/);
});

const relief = () => {
  const seq = westCopy();
  seq.style = "relief";
  return loadSequence(seq);
};

// @req REQ-186
test("relief looks straight down until 3 s, tilts to 58° by 6 s, then holds", () => {
  const seq = relief();
  const pitch = (f) => frameState(seq, f).camera.pitch;
  for (let f = 0; f <= at(3); f++) assert.equal(pitch(f), 90);
  for (let f = at(3) + 1; f <= at(6); f++) assert.ok(pitch(f) <= pitch(f - 1));
  for (let f = at(6); f < TOTAL_FRAMES; f++) assert.equal(pitch(f), 58);
  assert.equal(frameState(loadSequence(westCopy()), 0).camera.pitch, undefined);
});

// @req REQ-186
test("looking straight down, the relief camera matches the flat globe near its centre", () => {
  const flat = { lon: -1.8, lat: 12.6, radius: 1900 };
  const down = { ...flat, pitch: 90 };
  const centre = project(down, -1.8, 12.6);
  assert.ok(Math.abs(centre.x - VIEW_CENTRE.x) < 1e-6);
  assert.ok(Math.abs(centre.y - VIEW_CENTRE.y) < 1e-6);
  for (const [lon, lat] of [
    [-0.8, 12.6],
    [-1.8, 13.6],
  ]) {
    const a = project(flat, lon, lat);
    const b = project(down, lon, lat);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1, `${lon} ${lat}`);
  }
});

// @req REQ-186
test("a screen point maps back to the ground it shows, flat or tilted", () => {
  for (const camera of [
    { lon: 20.3, lat: -4.8, radius: 1980 },
    { lon: -1.8, lat: 12.6, radius: 1900, pitch: 58 },
    { lon: 4, lat: 5, radius: 300, pitch: 90 },
  ])
    for (const [lon, lat] of [
      [-1, 10],
      [3, 14],
      [20, -3],
    ]) {
      const p = project(camera, lon, lat);
      if (!p.visible) continue;
      const back = unproject(camera, p.x, p.y);
      assert.ok(
        Math.abs(back.lon - lon) < 1e-6 && Math.abs(back.lat - lat) < 1e-6
      );
    }
  assert.equal(unproject({ lon: 4, lat: 5, radius: 300 }, 10, 10), null);
});

// @req REQ-186
test("in a tilted view, raised ground stands higher on screen", () => {
  const camera = { lon: -1.8, lat: 12.6, radius: 1900, pitch: 58 };
  const ground = project(camera, -1.8, 12.6, 0);
  const raised = project(camera, -1.8, 12.6, 0.02);
  assert.ok(raised.y < ground.y - 5);
  const north = project(camera, -1.8, 14.6);
  assert.ok(north.y < ground.y, "north is up the screen");
});

// @req REQ-186
test("the relief hold layout stays in the safe zone", () => {
  assert.deepEqual(checkLayout(holdLayout(relief())), []);
});
