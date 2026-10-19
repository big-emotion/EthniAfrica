// @req REQ-186
// The animated satellite map (Cartes 1.11.0) drawn on the verified imagery
// in the pinned Chromium: the boards' plans (fixtures/series-carte-animee.mjs)
// on a synthetic silent voice, the Mossi plan on the 500 m mosaic. Checks 1,
// 2, 4, 5, 6 and 8 of the handoff on the drawn frames; checks 3, 7, 9 and 10
// are on the frame model (series-animated.test.mjs). The imagery is not in
// git: point ETHNIAFRICA_VIDEO_ASSETS at its folder. A missing folder fails;
// it is never reported as passed. With ETHNIAFRICA_SEQUENCE_EVIDENCE set to
// a folder, the frames are written there.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { areaStyle } from "./series-map.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const evidence = process.env.ETHNIAFRICA_SEQUENCE_EVIDENCE;
const dir = mkdtempSync(join(tmpdir(), "series-animated-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));
const seq = loadSeriesVideo(animatedDemo(dir), { dir });
const card = (id) => seq.cards.findIndex((c) => c.id === id);
const [MOSSI, SPLIT, RENAME] = [
  "carte-animee-mossi",
  "carte-animee-1932",
  "carte-animee-1984",
].map(card);
const plan = seq.mapSequence.cards;
const rename = plan[RENAME].rename.start;
const FRAMES = {
  cover: 0,
  dive: 120,
  arrival: 132,
  grade: 138,
  // The opener after the dive, before the change into the next card.
  still: seq.cardStarts[1] - 12,
  mossiStill: seq.cardStarts[MOSSI] + 30,
  mamprusi: seq.mapSequence.entries["bfa-mamprugu.geojson"].start + 40,
  arrow: plan[MOSSI].arrows[1].start + 6,
  mossiEnd: seq.cardStarts[SPLIT] - 12,
  split: plan[SPLIT].moves[0].end + 20,
  beforeRename: rename - 1,
  afterRename: rename + 40,
};
// Every third frame of the map cards, for the layout checks.
const sweep = [];
for (let f = 0; f < seq.cardStarts.at(-1); f += 3) sweep.push(f);
let shots;
const shot = (f) => shots.get(f);
const pixels = async (png) =>
  sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });

// @req REQ-186
test("the verified assets are present", () => {
  assert.ok(
    assets,
    "Set ETHNIAFRICA_VIDEO_ASSETS to the verified imagery folder"
  );
});

// @req REQ-186
test.before(async () => {
  if (!assets) return;
  const frames = [...new Set([...Object.values(FRAMES), ...sweep])].sort(
    (a, b) => a - b
  );
  shots = new Map(
    (await renderSeriesFrames(seq, frames, { diagnose: true })).map((r) => [
      r.frame,
      r,
    ])
  );
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    for (const [name, f] of Object.entries(FRAMES))
      writeFileSync(join(evidence, `${name}-${f}.png`), shot(f).png);
  }
});

// @req REQ-186
test("check 6: on every third frame, every text and drawing in the map band, eight texts, two words, 12 px clear", (t) => {
  if (!assets) return t.skip("no imagery");
  const problems = sweep.flatMap((f) =>
    (shot(f).problems ?? []).map((p) => `frame ${f}: ${p}`)
  );
  assert.deepEqual(problems, []);
});

// @req REQ-186
test("check 1: frame 0 is the whole globe, radius 300 around (540, 1010), under the band and the head", async (t) => {
  if (!assets) return t.skip("no imagery");
  const s = shot(FRAMES.cover);
  assert.ok(s.boxes.some((b) => b.kind === "band"));
  assert.ok(s.boxes.some((b) => b.kind === "head"));
  assert.equal(s.state.subtitle, null);
  // Outside the disc the shader draws space and the atmosphere's glow,
  // which falls with the distance d from the limb as exp(−d ÷ 13.5): at the
  // right radius and centre the drawn glow matches it on four sides.
  const { data, info } = await pixels(s.png);
  const at = (x, y) => {
    const i = (Math.round(y) * info.width + Math.round(x)) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const SPACE = [7, 6, 5];
  const ATMOS = [143, 184, 204];
  const glow = (d) =>
    SPACE.map((c, k) => c + (ATMOS[k] - c) * 0.55 * Math.exp(-d / 13.5));
  for (const d of [3, 8, 20])
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
    ]) {
      // The shader reads pixel centres: column x is at x + 0.5.
      const [x, y] = [540 + dx * (300 + d), 1010 + dy * (300 + d)];
      const got = at(x, y);
      const dist = Math.hypot(x + 0.5 - 540, y + 0.5 - 1010) - 300;
      const want = glow(dist);
      got.forEach((c, k) =>
        assert.ok(
          Math.abs(c - want[k]) <= 2,
          `glow ${d} px out at (${dx}, ${dy}): ${got} for ${want.map(Math.round)}`
        )
      );
    }
});

// @req REQ-186
test("check 1: when the camera stops, the globe is the flat map: no cut, no fade", async (t) => {
  if (!assets) return t.skip("no imagery");
  // A window of ground clear of every mark and text.
  const crop = async (f) =>
    await sharp(shot(f).png)
      .extract({ left: 20, top: 760, width: 100, height: 120 })
      .removeAlpha()
      .raw()
      .toBuffer();
  const still = await crop(FRAMES.still);
  const diff = async (f) => {
    const a = await crop(f);
    let max = 0;
    for (let i = 0; i < a.length; i++)
      max = Math.max(max, Math.abs(a[i] - still[i]));
    return max;
  };
  // From 4.6 s the recede grade is reached: the very still view.
  assert.equal(await diff(FRAMES.grade), 0);
  // At 4.4 s the camera has stopped and the grade is still ending (3.4 to
  // 4.6 s): the difference is the grade's alone.
  const arrival = await diff(FRAMES.arrival);
  assert.deepEqual(
    shot(FRAMES.arrival).state.layers[0].map.camera,
    shot(FRAMES.still).state.layers[0].map.camera
  );
  assert.ok(
    arrival <= 6,
    `4.4 s differs from the still view by ${arrival} levels`
  );
  t.diagnostic(`4.4 s against the still view: ${arrival} levels at most`);
});

// @req REQ-186
test("check 2: lit and context areas drawn with the state table's fill, edge and keyline", (t) => {
  if (!assets) return t.skip("no imagery");
  const drawn = shot(FRAMES.mamprusi).animated[0].areas;
  const layer = (file) => drawn.find((a) => a.file === file).layers[0];
  const lit = areaStyle(1);
  const ctx = areaStyle(0);
  const mamprusi = layer("bfa-mamprugu.geojson");
  assert.equal(mamprusi.fill, lit.hatch);
  assert.equal(mamprusi.edge, lit.edge);
  assert.equal(mamprusi.keyline, lit.keyline);
  const country = layer("bfa-burkina-faso.geojson");
  assert.equal(country.fill, ctx.fill);
  assert.equal(country.edge, ctx.edge);
  assert.equal(country.edgeOpacity, ctx.edgeOpacity);
  assert.equal(country.keyline, ctx.keyline);
});

// @req REQ-186
test("checks 4 and 5: the head on the tip while it draws; the arrow's width and the drawing's height from the smallest lit area", (t) => {
  if (!assets) return t.skip("no imagery");
  const s = shot(FRAMES.arrow);
  const map = s.state.layers.find((l) => l.map).map;
  const a = map.marks.arrows.find((x) => x.k > 0 && x.k < 1);
  assert.ok(a, "an arrow drawing at this frame");
  const head = s.animated[0].heads.find((h) => h.id === a.id);
  assert.ok(
    a.tip[0] >= head.x - 1 &&
      a.tip[0] <= head.x + head.w + 1 &&
      a.tip[1] >= head.y - 1 &&
      a.tip[1] <= head.y + head.h + 1,
    `tip ${a.tip} outside the head ${JSON.stringify(head)}`
  );
  assert.ok(Math.max(head.w, head.h) <= 3.6 * a.w + 6 + 1);
  for (const f of [FRAMES.mamprusi, FRAMES.mossiEnd, FRAMES.split]) {
    const sh = shot(f);
    const m = sh.state.layers.find((l) => l.map).map;
    for (const d of sh.animated[0].drawings) {
      assert.ok(
        Math.abs(d.h - (m.proportion.h * 132) / 120) < 0.6,
        `${d.kind} ${d.h}`
      );
      assert.ok(d.complete, `${d.kind} decoded`);
      assert.match(d.filter, /oi-ring-3/);
    }
    assert.ok(m.proportion.w <= 10 && m.proportion.h <= 150);
  }
});

// @req REQ-186
test("check 8: across the rename the outline's pixels do not move; both names stay readable", async (t) => {
  if (!assets) return t.skip("no imagery");
  // The country's southern border, below every text of the plan.
  const crop = async (f) =>
    sharp(shot(f).png)
      .extract({ left: 300, top: 1150, width: 480, height: 110 })
      .removeAlpha()
      .raw()
      .toBuffer();
  const [a, b] = [
    await crop(FRAMES.beforeRename),
    await crop(FRAMES.afterRename),
  ];
  assert.ok(a.equals(b), "the border's pixels changed across the rename");
  const texts = shot(FRAMES.afterRename).animated[0].texts;
  for (const name of ["HAUTE-VOLTA", "BURKINA FASO", "de 1919 à 1984"])
    assert.ok(
      texts.some((x) => x.text === name && x.opacity >= 0.85),
      name
    );
});

// @req REQ-186
test("a frame is a function of its number: drawn first, or after the frames before it", async (t) => {
  if (!assets) return t.skip("no imagery");
  // Frame 621, the Haute-Volta outline over the Mossi kingdoms, once stacked
  // its areas in the order this browser had first drawn them: drawn after
  // frame 321, or after the 30 frames before it, 36,737 pixels differed
  // from the same frame drawn first. A parallel render's slice starts in a
  // fresh browser, so the frame must not depend on what came before.
  const at = 621;
  const before = Array.from({ length: 30 }, (_, k) => at - 30 + k);
  const drawn = async (frames) =>
    (
      await pixels(
        (await renderSeriesFrames(seq, frames, { diagnose: true })).at(-1).png
      )
    ).data;
  const fresh = await drawn([at]);
  for (const history of [[321], before]) {
    const after = await drawn([...history, at]);
    let differ = 0;
    for (let i = 0; i < fresh.length; i += 3)
      if (
        fresh[i] !== after[i] ||
        fresh[i + 1] !== after[i + 1] ||
        fresh[i + 2] !== after[i + 2]
      )
        differ++;
    assert.equal(differ, 0, `after frame ${history[0]}: ${differ} px differ`);
  }
});

// @req REQ-186
test("the frame model drives the drawn page: one state per frame, nothing replays", (t) => {
  if (!assets) return t.skip("no imagery");
  for (const f of [FRAMES.mossiStill, FRAMES.split])
    assert.deepEqual(shot(f).state, seriesFrameState(seq, f));
});
