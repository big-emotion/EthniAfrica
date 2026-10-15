// @req REQ-186
// The map sequence drawn on the verified satellite imagery in the pinned
// Chromium (Cartes 1.5.0): series 2, episode 1 (« Touareg ») on a synthetic
// silent voice. The four beats of the boards, the entries on the word, the
// change of view, the return after a photograph, and check 5 (no imagery
// cross-fade between two cards of one run). The imagery and Natural Earth's
// countries are not in git: point ETHNIAFRICA_VIDEO_ASSETS at their folder.
// A missing folder fails; it is never reported as passed. With
// ETHNIAFRICA_SEQUENCE_EVIDENCE set to a folder, the engine frames and their
// comparison with the boards at 430 px are written there.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  loadSeriesVideo,
  seriesFrameState,
  checkSeriesLayout,
} from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { FPS, enter } from "./sequence.mjs";
import { SEQUENCE_TIMING } from "./series-sequence.mjs";
import { touaregDemo } from "./fixtures/series-touareg.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const evidence = process.env.ETHNIAFRICA_SEQUENCE_EVIDENCE;
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

// The accepted boards' views (frames-report.json of the 1.5.0 boards): the
// regions' view 2383 km across; beat 2's 4781 km with al-Idrīsī's area
// standing in. The present-day Amazigh area reaches further south and west.
const BOARD_REGIONS_KM = 2383;
const INKS = {
  a: "rgb(232, 185, 106)",
  b: "rgb(108, 195, 181)",
  c: "rgb(227, 135, 106)",
  d: "rgb(196, 168, 242)",
};
const seq = episode();
const changeStart = (card) => seq.cardStarts[card] - 9;
const wordFrame = (card, unit) => {
  for (const c of seq.chunks.filter((c) => c.card === card)) {
    const w = c.words.find((w) => w.text.replace(/[,.: ]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const entry = (file) => seq.mapSequence.entries[file].start;
let nameDelay = 0;
while (enter(nameDelay / SEQUENCE_TIMING.entry) < SEQUENCE_TIMING.nameAt)
  nameDelay++;
// A frame where `unit` is lit, a few frames into its word.
const lit = (card, unit) => wordFrame(card, unit) + 3;
const MOMENTS = {
  // The area at 0.6, its name about to start (board video-150-entree).
  "entree-imuhagh": entry("touareg-imuhagh.geojson") + nameDelay,
  "carte-1": lit(1, "région"),
  "changement-de-vue": changeStart(2) + 13,
  "entree-amazigh": entry("amazigh.geojson") + 14,
  "carte-2": lit(2, "région"),
  "retour-aux-regions": changeStart(3) + 13,
  "entree-tamahaq": lit(3, "tamahaq") + 4,
  "carte-3": lit(3, "tamasheq"),
  photographie: lit(4, "tifinagh"),
  "retour-100ms": changeStart(5) + 3,
  "retour-200ms": changeStart(5) + 6,
  "carte-4": lit(5, "Imuhagh"),
};
let frames;
const at = (name) => frames.find((f) => f.frame === MOMENTS[name]);
const names = (f) => f.boxes.filter((b) => b.kind === "map-name");
const nameOf = (b) => b.id.match(/^(Imuhagh|Imajeghen|Imushagh|Amazigh)/u)[1];

// @req REQ-186
test("the verified assets are present", () => {
  assert.ok(assets, "Set ETHNIAFRICA_VIDEO_ASSETS to the verified assets");
});

// @req REQ-186
test.before(async () => {
  if (!assets) return;
  frames = await renderSeriesFrames(seq, Object.values(MOMENTS), {
    assets,
    diagnose: true,
  });
});

// @req REQ-186
test("every frame keeps its text in its bands and its names in the map band", () => {
  for (const f of frames) {
    // A demonstration: only the photograph's web rendition may be too small.
    assert.deepEqual(
      checkSeriesLayout(f.boxes, { demo: true }),
      [],
      `frame ${f.frame}`
    );
    assert.deepEqual(f.backgrounds, [], `frame ${f.frame}`);
    for (const p of f.pictures)
      assert.ok(
        p.x <= 0.5 && p.y <= 0.5 && p.x + p.w >= 1079.5 && p.y + p.h >= 1919.5,
        `frame ${f.frame}: ${p.id}`
      );
    for (const b of f.boxes.filter(
      (b) => b.kind === "image" && b.id.includes("carte")
    ))
      assert.ok(b.scale <= 1.5, `frame ${f.frame}: imagery at ${b.scale}`);
  }
});

// @req REQ-186
test("beat 1: Imuhagh, Imajeghen and Imushagh in ochre, turquoise and coral, the regions' view of the boards", () => {
  const f = at("carte-1");
  assert.equal(f.maps.length, 1);
  const km = f.maps[0].spanKm;
  assert.ok(
    Math.abs(km - BOARD_REGIONS_KM) / BOARD_REGIONS_KM < 0.05,
    `${km} km`
  );
  assert.deepEqual(
    names(f).map((b) => [nameOf(b), b.ink]),
    [
      ["Imuhagh", INKS.a],
      ["Imajeghen", INKS.b],
      ["Imushagh", INKS.c],
    ]
  );
  // The languages are not said yet: each stack shows its name only.
  assert.ok(
    names(f).every((b) => /^(Imuhagh|Imajeghen|Imushagh)tama/u.test(b.id))
  );
  assert.deepEqual(
    f.boxes.filter((b) => b.kind === "key").map((b) => b.id),
    ["Imuhagh", "Imajeghen", "Imushagh"]
  );
  assert.match(
    f.text,
    /Imagerie\s:\sNASA Earth Observatory\s;\scontours\s:\sNatural Earth, domaine public/u
  );
});

// @req REQ-186
test("an area enters on its word: Imuhagh alone, its name not yet in", () => {
  const f = at("entree-imuhagh");
  assert.deepEqual(names(f), []);
  const state = seriesFrameState(seq, f.frame).layers[0].map;
  assert.ok(
    state.areas.find((a) => a.file === "touareg-imuhagh.geojson").opacity > 0.5
  );
  assert.ok(
    state.areas.every(
      (a) => a.file === "touareg-imuhagh.geojson" || a.opacity === 0
    )
  );
});

// @req REQ-186
test("beat 2: the view widens during the card change, flat, imagery redrawn only then; Amazigh enters in lilac", () => {
  const move = at("changement-de-vue");
  assert.equal(move.maps.length, 1);
  assert.equal(move.maps[0].moving, true);
  assert.ok(move.imageryPaints >= 1);
  assert.equal(move.boxes.filter((b) => b.kind === "map-subject").length, 0);
  for (const name of [
    "carte-1",
    "carte-2",
    "carte-3",
    "carte-4",
    "retour-100ms",
  ])
    assert.equal(at(name).imageryPaints, 0, name);
  const f = at("carte-2");
  const km = f.maps[0].spanKm;
  assert.ok(km > 1.5 * BOARD_REGIONS_KM, `${km} km`);
  assert.deepEqual(names(f).map(nameOf).sort(), [
    "Amazigh",
    "Imajeghen",
    "Imuhagh",
    "Imushagh",
  ]);
  assert.equal(names(f).find((b) => nameOf(b) === "Amazigh").ink, INKS.d);
  assert.ok(
    f.boxes.filter((b) => b.kind === "key").some((b) => b.id === "Amazigh")
  );
});

// @req REQ-186
test("beat 3: back to the regions' view, Amazigh gone, the languages under their names", () => {
  const back = at("retour-aux-regions");
  assert.equal(back.maps[0].moving, true);
  const f = at("carte-3");
  assert.ok(Math.abs(f.maps[0].spanKm - at("carte-1").maps[0].spanKm) < 1e-6);
  assert.deepEqual(
    names(f).map((b) => b.id),
    ["Imuhaghtamahaq", "Imajeghentamajaq", "Imushaghtamasheq"]
  );
  assert.ok(!f.boxes.some((b) => b.kind === "key" && b.id === "Amazigh"));
  // The stack box is the one reserved since beat 1: the name never moved.
  // Compared at 100 %: the names zoom with the map around (540, 1010).
  const unzoomed = (frame, b) =>
    1010 + (b.y - 1010) / seriesFrameState(seq, frame.frame).layers[0].zoom;
  const beat1 = names(at("carte-1"));
  names(f).forEach((b, i) => {
    const [y, y1] = [unzoomed(f, b), unzoomed(at("carte-1"), beat1[i])];
    assert.ok(Math.abs(y - y1) < 1, `${b.id} at y ${y}, ${y1} in beat 1`);
  });
});

// @req REQ-186
test("beat 4: after the photograph the map comes back by the cross-fade, everything at once, nothing replays", () => {
  assert.deepEqual(at("photographie").maps, []);
  for (const name of ["retour-100ms", "retour-200ms", "carte-4"]) {
    const f = at(name);
    assert.equal(f.maps.length, 1, name);
    assert.equal(f.maps[0].moving, false);
    assert.deepEqual(
      names(f).map((b) => b.id),
      ["Imuhaghtamahaq", "Imajeghentamajaq", "Imushaghtamasheq"]
    );
  }
  const state = seriesFrameState(seq, MOMENTS["retour-100ms"]);
  assert.deepEqual(
    state.layers.map((l) => +l.opacity.toFixed(3)),
    [1, 0.333]
  );
});

// Mean absolute difference over the pixels no text, name or area box covers.
async function imageryDifference(a, b) {
  const [pa, pb] = await Promise.all(
    [a, b].map((f) => sharp(f.png).removeAlpha().raw().toBuffer())
  );
  const masked = [...a.boxes, ...b.boxes].filter((x) => x.kind !== "image");
  const free = (x, y) =>
    !masked.some(
      (m) =>
        x >= m.x - 24 &&
        x <= m.x + m.w + 24 &&
        y >= m.y - 24 &&
        y <= m.y + m.h + 24
    );
  let sum = 0;
  let count = 0;
  for (let y = 0; y < 1920; y += 4)
    for (let x = 0; x < 1080; x += 4) {
      if (!free(x, y)) continue;
      const i = (y * 1080 + x) * 3;
      for (let c = 0; c < 3; c++) sum += Math.abs(pa[i + c] - pb[i + c]);
      count += 3;
    }
  return sum / count;
}

// @req REQ-186
test("check 5: between two cards of one run with one view, the imagery is not cross-faded", async (t) => {
  // Beat 2 framing the regions only: the same view as beat 1.
  const same = episode({
    edit: (deck) => {
      const card = deck.cards.find((c) => c.id.endsWith("carte-2"));
      card.map.areas = card.map.areas.filter((a) => a.ink !== "d");
    },
    script: (beats) =>
      beats.map((b) =>
        b.card.endsWith("carte-2")
          ? {
              ...b,
              chunks: [
                { text: "C'est le même mot partout,", duration: 2.4 },
                ...b.chunks.slice(1),
              ],
            }
          : b
      ),
  });
  const cs = same.cardStarts[2] - 9;
  const change = Array.from({ length: 10 }, (_, k) => cs + k);
  const rendered = await renderSeriesFrames(same, [cs - 9, ...change], {
    assets,
    diagnose: true,
  });
  const [before, ...during] = rendered;
  for (const f of during) {
    assert.equal(f.maps.length, 1, `frame ${f.frame}: one map`);
    assert.equal(f.imageryPaints, 0, `frame ${f.frame}: imagery not redrawn`);
  }
  // Across the change the imagery moves only by the slow zoom: no more than
  // over nine frames inside one card.
  const across = await imageryDifference(during[0], during.at(-1));
  const inside = await imageryDifference(before, during[0]);
  t.diagnostic(`mean difference: ${across} across, ${inside} inside`);
  assert.ok(across < 2, `across the change: ${across}`);
  assert.ok(
    across <= inside * 1.5 + 0.25,
    `${across} across, ${inside} inside`
  );
});

// The engine frames beside the accepted boards, at 430 px.
const BOARDS = new URL(
  "../design-system/proposals/1.5.0-proposition/boards/",
  import.meta.url
);
const PAIRS = [
  ["carte 1", "video-150-carte-1.jpg", "carte-1"],
  ["carte 2", "video-150-carte-2.jpg", "carte-2"],
  ["carte 3", "video-150-carte-3.jpg", "carte-3"],
  ["carte 4", "video-150-carte-4.jpg", "carte-4"],
  ["entrée", "video-150-entree.jpg", "entree-imuhagh"],
  ["retour, 100 ms", "video-150-changement.jpg", "retour-100ms"],
];
// @req REQ-186
test("the engine frames are written beside the boards when asked", async (t) => {
  if (!evidence) return t.skip("ETHNIAFRICA_SEQUENCE_EVIDENCE is not set");
  const out = join(evidence, "engine-frames");
  mkdirSync(out, { recursive: true });
  for (const name of Object.keys(MOMENTS))
    writeFileSync(
      join(out, `${name}.jpg`),
      await sharp(at(name).png).jpeg({ quality: 82 }).toBuffer()
    );
  const [W, H, gap, top] = [430, 764, 24, 54];
  const columns = 4;
  const rows = Math.ceil((PAIRS.length * 2) / columns);
  const width = gap + columns * (W + gap);
  const height = rows * (top + H) + gap;
  const tiles = [];
  const labels = [];
  let k = 0;
  for (const [label, board, moment] of PAIRS)
    for (const [kind, source] of [
      ["Planche", new URL(board, BOARDS).pathname],
      ["Moteur", at(moment).png],
    ]) {
      const left = gap + (k % columns) * (W + gap);
      const y = Math.floor(k / columns) * (top + H) + top;
      tiles.push({
        input: await sharp(source).resize(W, H).toBuffer(),
        left,
        top: y,
      });
      labels.push(
        `<text x="${left}" y="${y - 16}" font-family="Nunito Sans, sans-serif" font-size="22" fill="#f3e9da">${kind} : ${label}</text>`
      );
      k++;
    }
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${labels.join("")}</svg>`
  );
  await sharp({
    create: { width, height, channels: 3, background: "#14100c" },
  })
    .composite([...tiles, { input: svg, left: 0, top: 0 }])
    .jpeg({ quality: 82 })
    .toFile(join(evidence, "planches-et-moteur-430.jpg"));
  writeFileSync(
    join(evidence, "engine-frames", "frames.json"),
    JSON.stringify(
      Object.fromEntries(
        Object.keys(MOMENTS).map((name) => {
          const f = at(name);
          return [
            name,
            {
              frame: f.frame,
              maps: f.maps.map((m) => ({
                id: m.id,
                spanKm: Math.round(m.spanKm),
                moving: m.moving,
              })),
              imageryPaints: f.imageryPaints,
              names: names(f).map((b) => [
                b.id,
                b.ink,
                ...[b.x, b.y, b.w, b.h].map(Math.round),
              ]),
            },
          ];
        })
      ),
      null,
      1
    ) + "\n"
  );
});
