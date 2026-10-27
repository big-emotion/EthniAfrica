// @req REQ-186
// The map sequence of the series video (Cartes 1.5.0, series.md « Map
// sequence », handoff.md « Renderer integration of 1.5.0 »): areas from the
// repository's files entering on the word that says them, one ink per name,
// the language stacked under its name, one map across consecutive cards, a
// flat change of view only during a card change, and the end state shown at
// once when the map comes back. Pure frame model on the Touareg episode's
// synthetic voice; no browser, no imagery.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSeriesVideo,
  seriesFrameState,
  seriesFrameCount,
} from "./series.mjs";
import {
  checkSeriesMapCard,
  flatProject,
  sequenceCredits,
  MAP_FRAME,
} from "./series-map.mjs";
import { SEQUENCE_TIMING, moveCamera } from "./series-sequence.mjs";
import { FPS, enter, project } from "./sequence.mjs";
import { popAt, pushAt } from "./series-motion.mjs";
import { OVERLAY_SCRIPT } from "./page.mjs";
import { touaregDemo } from "./fixtures/series-touareg.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const episode = (options) => {
  const dir = mkdtempSync(join(tmpdir(), "series-sequence-"));
  dirs.push(dir);
  return loadSeriesVideo(touaregDemo(dir, options), { dir });
};
const seq = episode();
const IMAGERY = { width: 21600, credit: "NASA Earth Observatory" };
const MAP = [1, 2, 3, 5];
const editCard = (n, change) => ({
  edit: (deck) => change(deck.cards.find((c) => c.id.endsWith(`carte-${n}`))),
});
const wordFrame = (card, unit) => {
  for (const c of seq.chunks.filter((c) => c.card === card)) {
    const w = c.words.find((w) => w.text.replace(/[,.: ]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const changeStart = (card) => seq.cardStarts[card] - 9;
const mapOf = (frame, card) =>
  seriesFrameState(seq, frame).layers.find((l) => l.card === card)?.map;
const areaOpacity = (frame, card, file) =>
  mapOf(frame, card).areas.find((a) => a.file === file)?.opacity ?? 0;
const IMUHAGH = "touareg-imuhagh.geojson";
const IMAJEGHEN = "touareg-imajeghen.geojson";
const IMUSHAGH = "touareg-imushagh.geojson";
const AMAZIGH = "amazigh.geojson";
const REGIONS = [IMUHAGH, IMAJEGHEN, IMUSHAGH];

// @req REQ-186
test("the four map cards form one sequence: a run of three cards, then the return", () => {
  assert.deepEqual(
    seq.mapSequence.runs.map((r) => r.cards),
    [[1, 2, 3], [5]]
  );
  assert.deepEqual(Object.keys(seq.mapSequence.views).map(Number), MAP);
});

// @req REQ-186
test("check 1: a sequence area is a file of social/video/data/areas/, never an inline path", () => {
  assert.throws(
    () => episode(editCard(1, (c) => (c.map.areas[0].paths = ["M0,0L9,9Z"]))),
    /social\/video\/data\/areas\//
  );
  assert.throws(
    () =>
      episode(editCard(1, (c) => (c.map.areas[0].file = "../areas/x.geojson"))),
    /social\/video\/data\/areas\//
  );
  assert.throws(
    () => episode(editCard(1, (c) => (c.map.areas[0].file = "absent.geojson"))),
    /absent\.geojson/
  );
  assert.throws(
    () => episode(editCard(1, (c) => (c.map.areas[0].ink = "e"))),
    /ink/
  );
  // A field the sequence does not draw is refused, not dropped.
  assert.throws(
    () =>
      checkSeriesMapCard({
        id: "x",
        map: { sequence: "s", areas: [], highlight: { isos: ["NER"] } },
      }),
    /map\.highlight/
  );
});

// @req REQ-186
test("check 2: a say or langSay that is not a unit of the card's chunks is refused", () => {
  assert.throws(
    () => episode(editCard(1, (c) => (c.map.areas[1].say = "Kel"))),
    /Mot de la carte absent du sous-titre/
  );
  assert.throws(
    () => episode(editCard(3, (c) => (c.map.areas[2].langSay = "tamashek"))),
    /Mot de la carte absent du sous-titre/
  );
  // A word said on another card is not this card's word.
  assert.throws(
    () => episode(editCard(2, (c) => (c.map.areas[3].say = "Imuhagh"))),
    /Mot de la carte absent du sous-titre/
  );
  // « qu'Amazigh, » says Amazigh: the unit, its punctuation and elided
  // particle aside.
  assert.equal(
    seq.mapSequence.entries[AMAZIGH].start,
    wordFrame(2, "qu'Amazigh")
  );
});

// @req REQ-186
test("check 3: a fifth coloured name is refused; four inks at most", () => {
  assert.throws(
    () =>
      episode(
        editCard(2, (c) =>
          c.map.areas.push({ file: "sahara.geojson", name: "Sahara", ink: "a" })
        )
      ),
    /Cinq noms en couleur : quatre au plus/
  );
});

// @req REQ-186
test("check 4: each view frames its subject between y 724 and the foot, within the scale limit, its names in the band", () => {
  const views = seq.mapSequence.views;
  for (const i of MAP) {
    const v = views[i];
    assert.ok(v.subject.y >= 724, `card ${i} subject at y ${v.subject.y}`);
    assert.ok(v.subject.y + v.subject.h <= MAP_FRAME.foot[0]);
    assert.ok(v.scale * MAP_FRAME.maxZoom <= 1.5 + 1e-9, `scale ${v.scale}`);
    assert.ok(v.names.length <= 6);
    for (const n of v.names) {
      assert.ok(
        n.box.x >= 60 && n.box.x + n.box.w <= 1020,
        `${n.text} x ${n.box.x}`
      );
      assert.ok(n.box.y >= 724 && n.box.y + n.box.h <= 1296, n.text);
      // The stack's box is reserved at full height: 38 for the name, 30 for
      // its language.
      assert.equal(n.box.h, n.lang ? 68 : 38);
    }
  }
  assert.deepEqual(
    views[1].names.map((n) => [n.text, n.lang, n.ink]),
    [
      ["Imuhagh", "tamahaq", "a"],
      ["Imajeghen", "tamajaq", "b"],
      ["Imushagh", "tamasheq", "c"],
    ]
  );
  // Beat 2 frames the Amazigh area of North Africa with the regions: wider.
  assert.ok(views[1].spanKm > 1500 && views[1].spanKm < 3500);
  assert.ok(views[2].spanKm > views[1].spanKm * 1.5, `${views[2].spanKm} km`);
  assert.deepEqual(views[3].camera, views[1].camera);
  assert.deepEqual(views[5].camera, views[1].camera);
});

// @req REQ-186
test("an area enters on its word over 21 frames, two entries 21 frames apart at least", () => {
  const { entries } = seq.mapSequence;
  const imuhagh = entries[IMUHAGH].start;
  assert.equal(imuhagh, wordFrame(1, "Imuhagh"));
  // Imajeghen is said under 700 ms after Imuhagh: it waits.
  assert.ok(wordFrame(1, "Imajeghen") < imuhagh + 21);
  assert.equal(entries[IMAJEGHEN].start, imuhagh + 21);
  assert.equal(
    entries[IMUSHAGH].start,
    Math.max(wordFrame(1, "Imushagh"), imuhagh + 42)
  );
  for (const k of [0, 5, 10, 20, 21])
    assert.equal(
      areaOpacity(imuhagh + k, 1, IMUHAGH),
      enter(k / SEQUENCE_TIMING.entry)
    );
  assert.equal(areaOpacity(imuhagh - 1, 1, IMUHAGH), 0);
});

// @req REQ-186
test("a name waits until its area is at 0.6, then takes 9 frames; its key item follows the area", () => {
  const start = seq.mapSequence.entries[IMUHAGH].start;
  const name = (f) =>
    mapOf(f, 1).names.find((n) => n.file === IMUHAGH)?.opacity ?? 0;
  let at = start;
  while (areaOpacity(at, 1, IMUHAGH) < 0.6) at++;
  assert.equal(name(at), 0);
  assert.ok(areaOpacity(at - 1, 1, IMUHAGH) < 0.6);
  // 1.13.0: the 9 frames are the pop's.
  assert.equal(name(at + 2), popAt(2).opacity);
  assert.equal(
    mapOf(at + 5, 1).names.find((n) => n.file === IMUHAGH).scale,
    popAt(5).scale
  );
  assert.equal(name(at + 9), 1);
  assert.equal(
    mapOf(start + 7, 1).keys[IMUHAGH],
    areaOpacity(start + 7, 1, IMUHAGH)
  );
});

// @req REQ-186
test("a language enters on its own word over 9 frames, under its name, which never moves", () => {
  const word = wordFrame(3, "tamahaq");
  const stack = (f) => mapOf(f, 3).names.find((n) => n.file === IMUHAGH);
  assert.equal(seq.mapSequence.entries[IMUHAGH].lang, word);
  assert.equal(stack(word - 1).langOpacity, 0);
  assert.equal(stack(word + 2).langOpacity, popAt(2).opacity);
  assert.equal(stack(word + 9).langOpacity, 1);
  // Its box follows its anchor under the push (1.13.0), never jumps.
  assert.equal(stack(word - 1).box.h, stack(word + 9).box.h);
  assert.ok(Math.abs(stack(word + 9).box.y - stack(word - 1).box.y) < 2);
  // In beat 1 the language is not said yet: its line is reserved, empty.
  const beat1 = mapOf(seq.cardStarts[2] - 10, 1).names;
  assert.ok(beat1.every((n) => n.lang && n.langOpacity === 0));
});

// @req REQ-186
test("nothing that has entered leaves before the sequence ends, except an area the next view does not frame", () => {
  const run = seq.mapSequence.runs[0];
  for (let f = run.from; f <= run.to; f++) {
    const card = seriesFrameState(seq, f).layers.find((l) => l.map).card;
    for (const file of REGIONS) {
      const entered = seq.mapSequence.entries[file].start + 21;
      if (f >= entered)
        assert.equal(areaOpacity(f, card, file), 1, `${file} at ${f}`);
    }
  }
  // Amazigh, framed by beat 2 only, fades out over the move into beat 3.
  const cs = changeStart(3);
  assert.equal(areaOpacity(cs, 2, AMAZIGH), 1);
  assert.ok(areaOpacity(cs + 13, 3, AMAZIGH) < 1);
  assert.ok(areaOpacity(cs + 13, 3, AMAZIGH) > 0);
  assert.equal(areaOpacity(cs + 27, 3, AMAZIGH), 0);
  assert.ok(!mapOf(seq.cardStarts[4] - 20, 3).keys[AMAZIGH]);
});

// @req REQ-186
test("check 5: between two cards of one run the map is drawn once, never cross-faded; only head and foot swap", () => {
  for (const card of [2, 3]) {
    for (let f = changeStart(card) + 1; f <= seq.cardStarts[card]; f++) {
      const { layers } = seriesFrameState(seq, f);
      const drawn = layers.filter((l) => l.opacity > 0);
      assert.equal(drawn.length, 1, `frame ${f}`);
      assert.equal(drawn[0].opacity, 1);
      assert.ok(layers.every((l) => l.map && l.map.run === 0));
      // The 1.4.0 text timing: out in the first half, in during the second.
      if (layers.length === 2)
        assert.ok(layers[0].text === 0 || layers[1].text === 0);
    }
  }
});

// @req REQ-186
test("1.13.0: no slow zoom; each still view pushes in 6 % every 10 s from its card's first frame", () => {
  const run = seq.mapSequence.runs[0];
  const layer = (f) => seriesFrameState(seq, f).layers.find((l) => l.map);
  assert.equal(run.from, seq.cardStarts[1] - 8);
  assert.equal(run.to, seq.cardStarts[4] - 1);
  for (const f of [
    run.from,
    seq.cardStarts[2] + 30,
    seq.cardStarts[3] + 30,
    run.to,
  ]) {
    const l = layer(f);
    const shot = seq.mapSequence.shots[l.card];
    assert.equal(l.zoom, 1);
    assert.ok(
      Math.abs(
        l.map.camera.radius -
          seq.mapSequence.views[l.card].camera.radius * pushAt(f - shot.from)
      ) < 1e-9,
      `frame ${f}`
    );
  }
});

// @req REQ-186
test("check 6: the camera moves only during a card change, 27 frames, eased and flat", () => {
  const run = seq.mapSequence.runs[0];
  const views = seq.mapSequence.views;
  const camera = (f) =>
    seriesFrameState(seq, f).layers.find((l) => l.map).map.camera;
  // Where the camera looks: its radius grows with the push (1.13.0).
  const moving = [];
  for (let f = run.from + 1; f <= run.to; f++)
    if (
      camera(f).lon !== camera(f - 1).lon ||
      camera(f).lat !== camera(f - 1).lat
    )
      moving.push(f);
  const pushed = (card, f) =>
    views[card].camera.radius * pushAt(f - seq.mapSequence.shots[card].from);
  const expected = [2, 3].flatMap((card) =>
    Array.from({ length: 27 }, (_, k) => changeStart(card) + 1 + k)
  );
  assert.deepEqual(moving, expected);
  const cs = changeStart(2);
  for (const k of [0, 7, 13, 27]) {
    const c = camera(cs + k);
    const t = enter(k / 27);
    const [a, b] = [views[1].camera, views[2].camera];
    assert.ok(Math.abs(c.lon - (a.lon + (b.lon - a.lon) * t)) < 1e-9);
    assert.ok(Math.abs(c.lat - (a.lat + (b.lat - a.lat) * t)) < 1e-9);
    const [ra, rb] = [pushed(1, cs + k), pushed(2, cs + k)];
    assert.ok(
      Math.abs(Math.log(c.radius) - Math.log(ra * (rb / ra) ** t)) < 1e-9
    );
    assert.equal(c.centreY, 1010);
    assert.equal(c.pitch, undefined);
  }
  assert.deepEqual(
    moveCamera(views[1].camera, views[2].camera, 1),
    views[2].camera
  );
  // The return after the photograph is a cross-fade, not a move.
  for (let f = changeStart(5) + 1; f <= seq.cardStarts[5] + 30; f++) {
    const c = mapOf(f, 5).camera;
    assert.deepEqual(
      [c.lon, c.lat],
      [views[5].camera.lon, views[5].camera.lat]
    );
    assert.ok(Math.abs(c.radius - pushed(5, f)) < 1e-9);
  }
});

// @req REQ-186
test("names fade out over the first 5 frames of a move, follow their area, and come back 5 frames after it", () => {
  const cs = changeStart(2);
  const names = (f, card) => mapOf(f, card).names;
  assert.ok(names(cs, 1).every((n) => n.opacity === 1));
  const half = names(cs + 2, 1).find((n) => n.file === IMUHAGH);
  assert.ok(half.opacity > 0 && half.opacity < 1);
  // During the fade the name rides its area's anchor under the moving camera.
  const view = seq.mapSequence.views[1];
  const still = view.names.find((n) => n.file === IMUHAGH);
  const cam = mapOf(cs + 2, 1).camera;
  const [ax, ay] = flatProject(cam, ...still.anchor);
  const [bx, by] = flatProject(view.camera, ...still.anchor);
  assert.ok(Math.abs(half.box.x - (still.box.x + ax - bx)) < 1e-6);
  assert.ok(Math.abs(half.box.y - (still.box.y + ay - by)) < 1e-6);
  for (let k = 5; k <= 27; k++)
    assert.ok(
      names(cs + k, 2).every((n) => n.opacity === 0),
      `frame ${cs + k}`
    );
  assert.ok(
    names(cs + 27 + 5, 2).every((n) => n.opacity === 1 || n.file === AMAZIGH)
  );
});

// @req REQ-186
test("back to the map after a photograph: the 9-frame cross-fade, everything that had entered shown at once", () => {
  const cs = changeStart(5);
  for (const k of [1, 4, 9]) {
    const { layers } = seriesFrameState(seq, cs + k);
    const map = layers.find((l) => l.card === 5);
    assert.equal(map.opacity, k / 9);
    assert.deepEqual(
      map.map.areas.map((a) => [a.file, a.opacity]),
      REGIONS.map((f) => [f, 1])
    );
    assert.ok(
      map.map.names.every((n) => n.opacity === 1 && n.langOpacity === 1)
    );
  }
  const run = seq.mapSequence.runs[1];
  assert.equal(seriesFrameState(seq, run.from).layers.at(-1).zoom, 1);
});

// @req REQ-186
test("a frame's camera is projected the same way in the page and in node", () => {
  const camera = seq.mapSequence.views[2].camera;
  for (const [lon, lat] of [
    [5, 22],
    [-10, 33],
    [20, 14],
  ]) {
    const p = project(camera, lon, lat);
    const [x, y] = flatProject(camera, lon, lat);
    assert.ok(Math.abs(p.x - x) < 1e-9 && Math.abs(p.y - y) < 1e-9);
  }
});

// @req REQ-186
test("credits: the caption's source, then « contours » without borders, « frontières » with them", () => {
  const map = { caption: { source: "fiche EthniAfrica Touareg" } };
  assert.deepEqual(sequenceCredits(map, IMAGERY), {
    source: "fiche EthniAfrica Touareg",
    imagery:
      "Imagerie : NASA Earth Observatory ; contours : Natural Earth, domaine public",
  });
  assert.match(
    sequenceCredits({ ...map, borders: "quiet" }, IMAGERY).imagery,
    /; frontières : Natural Earth/
  );
  assert.equal(
    seq.mapSequence.views[1].credits.imagery,
    "Imagerie : NASA Earth Observatory ; contours : Natural Earth, domaine public"
  );
});

// @req REQ-186
test("a fourth ink, lilac area-d, with its hatching at 45° and 135° and its key swatches", () => {
  const overlay = new Function(
    `${OVERLAY_SCRIPT}; return { INK, hatch: hatchDefs(), SWATCHES };`
  )();
  assert.equal(overlay.INK.d, "#c4a8f2");
  for (const id of ["hatch-d-45", "hatch-d-135", "swatch-hatch-d"])
    assert.match(overlay.hatch, new RegExp(`id="${id}"[^>]*>.*?#c4a8f2`));
  assert.match(overlay.SWATCHES["uncertain-d"], /swatch-hatch-d.*#c4a8f2/);
  assert.match(overlay.SWATCHES["certain-d"], /#c4a8f2/);
  // a, b and c are the satellite video's, unchanged.
  assert.deepEqual(
    [overlay.INK.a, overlay.INK.b, overlay.INK.c],
    ["#e8b96a", "#6cc3b5", "#e3876a"]
  );
});

// @req REQ-186
test("check 7: a sequence card keeps the 1.4.1 refusals", () => {
  assert.throws(
    () =>
      checkSeriesMapCard({
        id: "x",
        map: { sequence: "s", areas: [], atlas: {} },
      }),
    /Carte d'atlas : carrousel seulement/
  );
  assert.throws(
    () => episode(editCard(1, (c) => (c.map.borders = "dotted"))),
    /borders « dotted »/
  );
  assert.ok(seriesFrameCount(seq) > seq.cardStarts.at(-1));
});
