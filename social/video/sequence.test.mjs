// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSequence,
  frameState,
  holdLayout,
  checkLayout,
  project,
  unproject,
  VIEW_CENTRE,
  TOTAL_FRAMES,
  subtitleCharacters,
  chapterTimeline,
  frameCount,
  holdCameras,
  RELIEF,
  FULLSCREEN,
  BANDS,
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

// Chained chapters (0.3.0-proposition, boards 7 to 10) in the « plein écran »
// layout of 0.4.0-proposition (board 11 · Full screen). The expected times
// are the 0.4.0 design's timeline.json for the 58.9 s Sahara example;
// subtitles and areas have their own files (chunks.test.mjs, area-entries.test.mjs).

const fixtures = new URL("./fixtures/", import.meta.url);
const saharaJson = JSON.parse(
  readFileSync(new URL("sahara.chapters.sequence.json", fixtures))
);
const sahara = (change = () => {}) => {
  const input = structuredClone(saharaJson);
  change(input);
  return loadSequence(input, { dir: fixtures });
};
const frameOf = (seconds) => Math.round(seconds * 30);
const near = (actual, expected, what) =>
  assert.ok(
    Math.abs(actual - expected) <= 1 / 30 + 1e-9,
    `${what}: ${actual} s, expected ${expected} s`
  );
const NBSP = "\u00a0";

// @req REQ-186
test("every character counts once, spaces and punctuation included", () => {
  assert.equal(subtitleCharacters("Le lien, ici."), 13);
  assert.equal(subtitleCharacters(`«${NBSP}désert${NBSP}»`), 10);
  // A letter with its diacritic counts once, composed or not.
  assert.equal(subtitleCharacters("é"), 1);
  assert.equal(subtitleCharacters("e\u0301"), 1);
  assert.equal(subtitleCharacters("ṣaḥrāʾ"), 6);
  // An Arabic word counts its letters.
  assert.equal(subtitleCharacters("صحراء"), 5);
  // Italic markers are markup, not characters.
  assert.equal(subtitleCharacters("l'arabe *ṣaḥrāʾ*"), 14);
});

// @req REQ-186
test("Arabic script appears once per video, in a subtitle only", () => {
  assert.throws(
    () =>
      sahara((s) => {
        s.chapters[1].sentences[0][0] = {
          text: `L'arabe *ṣaḥrāʾ*${NBSP}(صحراء) revient.`,
        };
      }),
    /Arabic.*once/i
  );
  assert.throws(
    () => sahara((s) => (s.title = `D'où vient صحراء${NBSP}?`)),
    /Arabic/
  );
  assert.throws(() => sahara((s) => (s.chapters[0].title = "صحراء")), /Arabic/);
});

// @req REQ-186
test("a same-region change and a camera move follow the 0.3.0 timing tables", () => {
  const timeline = chapterTimeline(sahara());
  const [one, two] = timeline.chapters;
  const T = one.chunks.at(-1).gone;
  near(one.exit, T, "a chapter leaves once its last chunk has gone");
  near(two.start, T + 0.6, "entries at T + 600 ms");
  const [four, five] = timeline.chapters.slice(3);
  near(five.travel.start, four.exit + 0.4, "travel at T + 400 ms");
  near(five.start, four.exit + 2.8, "entries at T + 2800 ms");
  assert.throws(
    () => sahara((s) => (s.chapters[4].camera.travel = 3)),
    /travel/i
  );
  assert.throws(
    () =>
      sahara((s) => (s.chapters[0].camera = { lon: 0, lat: 0, radius: 900 })),
    /opening/i
  );
});

// @req REQ-186
test("the opening plays once and the camera only moves in it or in a travel", () => {
  const seq = sahara();
  const camera = (f) => frameState(seq, f).camera;
  assert.notDeepEqual(camera(frameOf(1)), camera(frameOf(4)));
  const travel = chapterTimeline(seq).chapters[4].travel;
  const from = frameOf(travel.start);
  const to = frameOf(travel.start + travel.duration);
  for (let f = frameOf(6) + 1; f < frameCount(seq); f++) {
    if (f > from && f <= to) continue;
    assert.deepEqual(camera(f), camera(f - 1), `camera moved at frame ${f}`);
  }
  assert.notDeepEqual(camera(from), camera(to));
  // Never a cut: the travel moves a little on every frame, pitch included.
  for (let f = from + 1; f <= to; f++) {
    const [a, b] = [camera(f - 1), camera(f)];
    assert.ok(Math.hypot(a.lon - b.lon, a.lat - b.lat) < 0.6, `jump at ${f}`);
    assert.ok(Math.abs(a.pitch - b.pitch) < 0.5, `pitch jump at ${f}`);
  }
  assert.equal(frameState(seq, frameOf(6.4)).chapter, 0);
  assert.equal(frameState(seq, frameOf(7.3)).subtitle.opacity, 0);
  assert.ok(frameState(seq, frameOf(7.4)).subtitle.opacity > 0);
});

// @req REQ-186
test("the plein écran relief cameras look down at 70° (66° on the Chad basin) with a 40° field", () => {
  const seq = sahara();
  const [a, , , , b] = holdCameras(seq);
  assert.equal(RELIEF.fov, 40);
  assert.equal(FULLSCREEN.pitch, 70);
  // data/cameras-fullscreen.json, « fit »: camera A on North Africa,
  // 12 881 km from 8° E 18.74° N; camera B on the Chad basin, 5 947 km from
  // 16° E 13.29° N, pitched 66°. `radius` is the focal length over the
  // distance in Earth radii.
  assert.deepEqual(
    { lon: a.lon, lat: a.lat, pitch: a.pitch, centreY: a.centreY },
    { lon: 8, lat: 18.7415, pitch: 70, centreY: 880 }
  );
  assert.ok(Math.abs(a.radius - 1304.5) < 1, `camera A radius ${a.radius}`);
  assert.deepEqual(
    { lon: b.lon, lat: b.lat, pitch: b.pitch, centreY: b.centreY },
    { lon: 16, lat: 13.2853, pitch: 66, centreY: 880 }
  );
  assert.ok(Math.abs(b.radius - 2825.7) < 1, `camera B radius ${b.radius}`);
  // The globe fills the frame: the « fit » boxes of cameras-fullscreen.json
  // land where the design's renders put them, to the pixel.
  const extent = (camera, [lon0, lon1], [lat0, lat1]) => {
    const points = [];
    for (let i = 0; i <= 50; i++)
      for (let j = 0; j <= 50; j++)
        points.push(
          project(
            camera,
            lon0 + ((lon1 - lon0) * i) / 50,
            lat0 + ((lat1 - lat0) * j) / 50
          )
        );
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  };
  const close = (actual, expected, what) =>
    actual.forEach((v, i) =>
      assert.ok(Math.abs(v - expected[i]) < 1, `${what}: ${actual}`)
    );
  close(extent(a, [-17, 33], [4, 37]), [0, 1080, 544.06, 1215.94], "camera A");
  close(extent(b, [6, 26], [7, 23]), [40, 1040, 494.63, 1185.37], "camera B");
  const centre = project(a, 8, 18.7415);
  assert.ok(Math.abs(centre.y - 880) < 1e-6 && Math.abs(centre.x - 540) < 1e-6);
  // The opening tilts from straight down to the hold pitch, then holds.
  const pitch = (f) => frameState(seq, f).camera.pitch;
  assert.equal(pitch(0), 90);
  assert.equal(pitch(frameOf(6)), 70);
  // A flat chained video keeps the same view centre.
  assert.equal(holdCameras(sahara((s) => (s.style = "flat")))[0].centreY, 880);
});

// The opacities a frame carries, flattened to dotted paths.
const opacities = (state, prefix = "", out = {}) => {
  for (const [key, value] of Object.entries(state ?? {})) {
    if (["camera", "grade", "dim", "bars", "chapter", "relief"].includes(key))
      continue;
    const path = `${prefix}${key}`;
    if (typeof value === "number") out[path] = value;
    else if (value && typeof value === "object")
      opacities(value, path + ".", out);
  }
  return out;
};

// @req REQ-186
test("nothing leaves before its chapter ends, and nothing enters while a chapter leaves", () => {
  const seq = sahara();
  const timeline = chapterTimeline(seq);
  let before = opacities(frameState(seq, 0));
  for (let f = 1; f < frameCount(seq); f++) {
    const now = opacities(frameState(seq, f));
    const t = f / 30;
    const leaving = timeline.chapters.some(
      (c) => t > c.exit && t <= c.exit + 0.4 + 1e-9
    );
    for (const key of new Set([...Object.keys(before), ...Object.keys(now)])) {
      const delta = (now[key] ?? 0) - (before[key] ?? 0);
      if (leaving)
        assert.ok(delta <= 1e-9, `${key} enters while a chapter leaves, ${f}`);
      else if (
        delta < -1e-9 &&
        !key.startsWith("subtitle.") &&
        !(key.startsWith("features.") && now[key] >= 0.55 - 1e-9)
      ) {
        const ending = t > timeline.ending.start;
        const between = timeline.chapters.some(
          (c, i) => t > c.exit && t < (timeline.chapters[i + 1]?.start ?? 0)
        );
        assert.ok(ending || between, `${key} leaves early at frame ${f}`);
      }
    }
    before = now;
  }
});

// @req REQ-186
test("signature, title and imagery line never move; only the ending removes the first two", () => {
  const seq = sahara();
  for (let f = 0; f < frameOf(54.9); f += 15) {
    const { text, caption } = frameState(seq, f);
    assert.deepEqual(text, { signature: 1, title: 1 });
    assert.match(caption.imagery, /^NASA/);
  }
  const end = frameState(seq, frameCount(seq) - 1);
  assert.deepEqual(end.text, { signature: 0, title: 0 });
  assert.match(end.caption.imagery, /^NASA Earth Observatory/);
  assert.ok(end.caption.lines.every((l) => l.opacity === 0));
  assert.equal(end.dim, 1);
  for (let f = frameOf(56.4); f < frameCount(seq); f++)
    assert.deepEqual(frameState(seq, f), end, "the closing hold is still");
});

// @req REQ-186
test("Carte, Période and Source change with each chapter; a repeated line and the imagery line stay", () => {
  const seq = sahara();
  const caption = (seconds) => frameState(seq, frameOf(seconds)).caption;
  assert.deepEqual(
    caption(9).lines.map((l) => [l.label, l.opacity]),
    [
      ["Carte", 1],
      ["Période", 1],
      ["Source", 1],
    ]
  );
  assert.equal(
    caption(9).imagery,
    "NASA Earth Observatory ; relief : NOAA, exagéré"
  );
  assert.equal(
    caption(19).lines[0].text,
    "trois bandes d'après al-Idrīsī, approximatives"
  );
  const shared = sahara(
    (s) => (s.chapters[2].caption.source = s.chapters[1].caption.source)
  );
  for (let f = frameOf(23.5); f <= frameOf(24.2); f++)
    assert.equal(frameState(shared, f).caption.lines[2].opacity, 1);
  assert.ok(frameState(shared, frameOf(23.6)).caption.lines[0].opacity < 1);
});

// @req REQ-186
test("a chapter marker shows one bar per chapter, only from three chapters", () => {
  const seq = sahara();
  const marker = frameState(seq, frameOf(28)).marker;
  assert.deepEqual(marker.bars, [
    "#a8977f",
    "#a8977f",
    "#e8b96a",
    "#4a3c2c",
    "#4a3c2c",
  ]);
  assert.equal(marker.line.text, "3 · D'autres noms, côte à côte");
  assert.equal(marker.line.opacity, 1);
  assert.equal(frameState(seq, frameOf(3)).marker.opacity, 0);
  assert.equal(frameState(seq, frameOf(9)).marker.opacity, 1);
  // The line swaps by fading in the empty interval; the bars only recolour.
  const gap = frameState(seq, frameOf(15.8)).marker;
  assert.equal(gap.line.opacity, 0);
  assert.equal(gap.opacity, 1);

  const three = sahara((s) => s.chapters.splice(3));
  assert.equal(frameState(three, frameOf(9)).marker.bars.length, 3);
  const two = sahara((s) => s.chapters.splice(2));
  assert.equal(frameState(two, frameOf(9)).marker, null);
});

// @req REQ-186
test("with a chapter marker, the title must hold on one line", () => {
  const long = `D'où vient le nom Sahara, et qui l'a donné${NBSP}?`;
  assert.throws(() => sahara((s) => (s.title = long)), /one line/);
  assert.throws(
    () => sahara((s) => (s.title = "D'où vient\nle nom Sahara")),
    /one line/
  );
  assert.doesNotThrow(() =>
    sahara((s) => {
      s.title = long;
      s.chapters.splice(2);
    })
  );
});

// @req REQ-186
test("a chapter needs at least one chunk, and a video at most five chapters", () => {
  assert.throws(() => sahara((s) => (s.chapters[0].sentences = [])), /chunk/);
  assert.throws(() => sahara((s) => (s.chapters[0].sentences = [[]])), /chunk/);
  assert.throws(
    () => sahara((s) => s.chapters.push(structuredClone(s.chapters[1]))),
    /five/
  );
  const short = sahara(
    (s) => (s.chapters[0].sentences = [[{ text: "Un deux trois." }]])
  );
  const [one] = chapterTimeline(short).chapters;
  near(one.exit - one.start, 6, "a chapter holds at least 6 s");
});

// @req REQ-186
test("ending A needs the page online and shows the sentence and the bare domain", () => {
  const sentence = "L'histoire du nom Sahara est sur le site.";
  assert.throws(
    () => sahara((s) => (s.ending = { variant: "A", sentence })),
    /online/
  );
  const a = sahara(
    (s) => (s.ending = { variant: "A", pageOnline: true, sentence })
  );
  assert.deepEqual(frameState(a, frameCount(a) - 1).closing, {
    variant: "A",
    opacity: 1,
    sentence,
    address: "ETHNIAFRICA.COM",
  });
  const b = sahara();
  assert.deepEqual(frameState(b, frameCount(b) - 1).closing, {
    variant: "B",
    opacity: 1,
  });
  // The closing block fades in from 55.9 s, once the base has darkened.
  assert.equal(frameState(b, frameOf(55.8)).closing, null);
  const entering = frameState(b, frameOf(56)).closing.opacity;
  assert.ok(entering > 0 && entering < 1);
  assert.equal(frameState(b, frameOf(30)).closing, null);
  assert.throws(
    () => sahara((s) => (s.ending = { variant: "B", sentence })),
    /B/
  );
  assert.throws(() => sahara((s) => delete s.ending), /ending/);
});

// @req REQ-186
test("a historical chapter draws a documented outline that enters whole with its chunk", () => {
  const seq = sahara();
  assert.equal(seq.chapters[4].outline.geometry.type, "Polygon");
  const chunk = chapterTimeline(seq).chapters[4].chunks[1];
  assert.deepEqual(
    chunk.entries.map((e) => e.ref),
    ["Méga-Tchad"]
  );
  const t0 = frameOf(chunk.appear);
  assert.equal(frameState(seq, t0).outline.opacity, 0);
  assert.equal(frameState(seq, t0 + 18).outline.opacity, 1);
  assert.equal(frameState(seq, t0 + 21).outline.label, 1);
  const hold = frameState(seq, frameOf(50));
  assert.deepEqual(Object.keys(hold.outline).sort(), ["label", "opacity"]);
  assert.match(hold.caption.imagery, /; l'imagerie montre le paysage actuel$/);
  assert.doesNotMatch(frameState(seq, frameOf(40)).caption.imagery, /actuel/);
  assert.equal(frameState(seq, frameOf(40)).outline, null);
});

// Chapter 1 and the historical chapter 5 alone: no mockup area in the way.
const outlineOnly = (change) =>
  sahara((s) => {
    s.chapters.splice(1, 3);
    change(s);
  });

// @req REQ-186
test("an outline without its provenance, from a mockup or not a line, is refused", () => {
  for (const [field, message] of [
    ["source", /source/],
    ["study", /study/],
    ["elevationModel", /elevation model/],
    ["levelMetres", /level/],
    ["file", /file/],
  ])
    assert.throws(
      () => outlineOnly((s) => delete s.chapters[1].outline[field]),
      message
    );
  assert.throws(
    () =>
      outlineOnly((s) => (s.chapters[1].outline.file = "congo.sequence.json")),
    /LineString or Polygon/
  );
  assert.throws(
    () => outlineOnly((s) => (s.chapters[1].outline.file = "missing.geojson")),
    /missing\.geojson/
  );
  // A synthetic outline may only appear in an illustrative proof.
  const synthetic = (s) => {
    s.chapters[1].outline.file = "synthetic-outline.geojson";
    s.chapters[1].outline.illustrative = true;
  };
  assert.doesNotThrow(() => outlineOnly(synthetic));
  assert.throws(
    () =>
      outlineOnly((s) => {
        synthetic(s);
        delete s.demo;
      }),
    /illustrative/i
  );

  const dir = mkdtempSync(join(tmpdir(), "ethniafrica-outline-"));
  try {
    const mockup = JSON.parse(
      readFileSync(new URL("synthetic-outline.geojson", fixtures))
    );
    mockup.properties.status = "MOCKUP, not for publication";
    writeFileSync(join(dir, "mockup.geojson"), JSON.stringify(mockup));
    const input = structuredClone(saharaJson);
    input.chapters.splice(1, 3);
    input.chapters[1].outline.file = "mockup.geojson";
    assert.throws(() => loadSequence(input, { dir }), /mockup/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// @req REQ-186
test("the plein écran bands: title, names, subtitle, veil, legend and credits", () => {
  assert.deepEqual(BANDS, {
    x: [60, 1020],
    // The design's table says « 100 to about 270 »; its own head (signature
    // 36, gap 12, title 84, gap 12, marker 32) ends at 276.
    head: [100, 276],
    names: [290, 1290],
    subtitle: { y: [1316, 1452], axis: 540, maxLineWidth: 900 },
    veil: 1540,
    credits: [1652, 1884],
  });
});

// @req REQ-186
test("every Sahara chapter's hold layout fits the plein écran bands", () => {
  const seq = sahara();
  seq.chapters.forEach((_, i) => {
    const layout = holdLayout(seq, i);
    assert.equal(layout.frame, "fullscreen");
    assert.deepEqual(checkLayout(layout), [], `chapter ${i + 1}`);
    const caption = layout.elements.find((e) => e.kind === "caption").box;
    assert.equal(caption.y + caption.h, 1884, "credits are bottom aligned");
    for (const e of layout.elements.filter((x) => x.kind === "subtitle"))
      assert.equal(e.box.x + e.box.w / 2, 540, `${e.id} centred on x 540`);
  });
});

// @req REQ-186
test("the feed safe zone is a guide in plein écran; each band is a limit", () => {
  const layout = holdLayout(sahara(), 1);
  // The subtitle and the credits sit below the feed safe zone (y 1248):
  // accepted by the operator, so no problem is reported.
  assert.ok(
    layout.elements.some((e) => e.kind === "subtitle" && e.box.y > 1248)
  );
  assert.deepEqual(checkLayout(layout), []);
  const moved = (kind, change) => {
    const copy = structuredClone(layout);
    change(copy.elements.find((e) => e.kind === kind).box);
    return checkLayout(copy).join("\n");
  };
  assert.match(
    moved("title", (b) => (b.y = 300)),
    /title.*band/
  );
  assert.match(
    moved("label", (b) => (b.y = 1300)),
    /band/
  );
  assert.match(
    moved("subtitle", (b) => (b.x += 30)),
    /centred/
  );
  assert.match(
    moved("subtitle", (b) => {
      b.x = 80;
      b.w = 920;
    }),
    /900/
  );
  assert.match(
    moved("caption", (b) => (b.y -= 20)),
    /bottom/
  );
  assert.match(
    moved("legend", (b) => (b.y = 1500)),
    /band/
  );
  assert.match(
    moved("signature", (b) => (b.x = 40)),
    /band/
  );
  // Two names drawn over each other are refused on the browser's boxes.
  const crowded = structuredClone(layout);
  const label = crowded.elements.find((e) => e.kind === "label");
  crowded.elements.push({ ...structuredClone(label), id: "copy" });
  assert.match(checkLayout(crowded).join("\n"), /overlap/);
});
