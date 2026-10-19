// @req REQ-186
// The addendum of Cartes 1.10.0 (handoff, « Renderer integration of
// 1.10.0 », « small text on the image », checks 7 and 8), drawn in the
// pinned Chromium: the calm zones under small text on a busy picture, the
// 36 px kicker and the 26 px foot with its credit in the cream ink.
//
// The pictures are made here: a 12 px checkerboard stands for Tiébélé's
// painted court (every 9 × 9 px window holds black and white, so it measures
// far over 10), a smooth gradient for a calm sky. The episode's own pictures,
// Tiébélé and Bobo-Dioulasso, are measured in its acceptance render
// (proposals/1.10.0-proposition/integration-*/video-tests.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { plainPictureDemo, PICTURE } from "./fixtures/series-legibility.mjs";

const root = mkdtempSync(join(tmpdir(), "series-closing-"));
const assets = fileURLToPath(
  new URL("../design-system/assets/", import.meta.url)
);
const pictures = mkdtempSync(join(assets, "calm-"));
const picture = (name) => `${pictures.slice(assets.length)}/${name}.png`;
// @req REQ-186
test.after(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(pictures, { recursive: true, force: true });
});
const build = (name, src, change) => {
  const dir = join(root, name);
  return loadSeriesVideo(plainPictureDemo(dir, picture(src), change), { dir });
};

// A three-line opener and a foot with a two-line source and a two-line
// credit (handoff check 8).
const LONG_TITLE = "Qui a choisi le nom *Burkina Faso* en 1984 ?";
const LONG_SOURCE =
  "Alain Maharaux, 1995, p. 9 · Michel Izard, 1985, p. 263 · Histoire générale de l'Afrique, UNESCO, vol. VIII, 1998";
const LONG_CREDIT =
  "Photo : Angeline A. van Achterberg, Grande Mosquée de Bobo-Dioulasso, 2001, ASC Leiden, CC BY-SA 4.0, recadrée";
const longer = (deck) => {
  const opener = deck.cards.find((c) => c.id === "serie-pays-01");
  opener.title = LONG_TITLE;
  const second = deck.cards.find((c) => c.id === "serie-pays-02");
  second.source = LONG_SOURCE;
  second.credit = LONG_CREDIT;
};
const calmOff = (deck) =>
  deck.cards.forEach((c) => c.image && (c.image.calm = false));

let seq;
const drawn = {};
// @req REQ-186
test.before(async () => {
  const { w, h } = PICTURE;
  const checker = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      checker.fill(
        (Math.floor(x / 12) + Math.floor(y / 12)) % 2 ? 235 : 20,
        3 * (y * w + x),
        3 * (y * w + x) + 3
      );
  await sharp(checker, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile(join(pictures, "busy.png"));
  const gradient = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    gradient.fill(Math.round(90 + (60 * y) / h), 3 * y * w, 3 * (y + 1) * w);
  await sharp(gradient, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile(join(pictures, "calm.png"));
  seq = build("busy", "busy", longer);
  const second = seq.cards.findIndex((c) => c.id === "serie-pays-02");
  const subtitled = seq.chunks.find((c) => c.card === second && !c.hidden);
  const frames = [
    0,
    Math.round((subtitled.fullFrom + subtitled.fullTo) / 2),
    seq.frames - 1,
  ];
  for (const [name, demo] of [
    ["busy", seq],
    ["off", build("off", "busy", (d) => (longer(d), calmOff(d)))],
    ["calm", build("calm", "calm", longer)],
  ])
    drawn[name] = await renderSeriesFrames(demo, frames, { diagnose: true });
});

const cardOf = (f, id) => f.calm.find((c) => c.card === id);

// @req REQ-186
test("1.10.0 check 7: on a busy picture every small-text zone is blurred and measures 3.5 or less after", () => {
  const [cover, content, end] = drawn.busy;
  const expect = [
    [cover, "serie-pays-01", ["subtitles"]],
    [content, "serie-pays-02", ["subtitles", "foot"]],
    [end, "serie-pays-07", ["line", "invitation", "pill", "ending-credit"]],
  ];
  for (const [f, id, blocks] of expect) {
    const card = cardOf(f, id);
    assert.ok(card, `${id}: no calm record`);
    assert.ok(card.measure >= 10, `${id}: measures ${card.measure}`);
    assert.equal(card.applied, true, id);
    for (const block of blocks)
      assert.ok(
        card.zones.some((z) => z.block === block),
        `${id}: no ${block} zone in ${card.zones.map((z) => z.block)}`
      );
    for (const z of card.zones) {
      assert.ok(z.before >= 10, `${id} ${z.block}: before ${z.before}`);
      assert.ok(z.after <= 3.5, `${id} ${z.block}: after ${z.after}`);
    }
    assert.equal(f.calmDrawn, card.zones.length, id);
  }
});

// @req REQ-186
test("1.10.0 check 7: a calm picture gets no blur, nor a card with image.calm: false", () => {
  for (const f of drawn.calm) {
    for (const card of f.calm) {
      assert.ok(card.measure < 10, `${card.card}: ${card.measure}`);
      assert.equal(card.applied, false, card.card);
    }
    assert.equal(f.calmDrawn, 0, `frame ${f.frame}`);
  }
  for (const f of drawn.off) {
    for (const card of f.calm) assert.equal(card.applied, false, card.card);
    assert.equal(f.calmDrawn, 0, `frame ${f.frame}`);
  }
});

// @req REQ-186
test("1.10.0 check 7: nothing outside the zones grown by 40 px changes", async () => {
  for (const [i, busy] of drawn.busy.entries()) {
    const off = drawn.off[i];
    const decode = (png) => sharp(png).removeAlpha().raw().toBuffer();
    const [a, b] = await Promise.all([decode(busy.png), decode(off.png)]);
    const zones = busy.calm.flatMap((c) => (c.applied ? c.zones : []));
    const inside = (x, y) =>
      zones.some(
        (z) =>
          x >= z.x - 40 &&
          x < z.x + z.w + 40 &&
          y >= z.y - 40 &&
          y < z.y + z.h + 40
      );
    let outside = 0;
    let moved = 0;
    let changed = 0;
    for (let p = 0; p < 1080 * 1920; p++) {
      const d = Math.max(
        Math.abs(a[3 * p] - b[3 * p]),
        Math.abs(a[3 * p + 1] - b[3 * p + 1]),
        Math.abs(a[3 * p + 2] - b[3 * p + 2])
      );
      if (!d) continue;
      if (inside(p % 1080, Math.floor(p / 1080))) changed++;
      else {
        outside = Math.max(outside, d);
        moved++;
      }
    }
    // The calm zones' layers move the compositing of the text over them: a
    // few hundred pixels outside the zones round one level differently,
    // which no eye sees. Anything more is a change.
    assert.ok(
      outside <= 1 && moved < 1000,
      `frame ${busy.frame}: ${outside} levels outside, ${moved} pixels`
    );
    assert.ok(
      changed > 10000,
      `frame ${busy.frame}: ${changed} pixels blurred`
    );
  }
});

// @req REQ-186
test("1.10.0 check 8: a three-line opener's head still ends at y 700 under the 36 px kicker", () => {
  const cover = drawn.busy[0];
  const head = cover.boxes.filter((b) => b.kind === "head");
  const [kicker, title] = head;
  assert.ok(Math.abs(kicker.y - 318) <= 0.5, `kicker at ${kicker.y}`);
  assert.ok(Math.abs(kicker.h - 42) <= 0.5, `kicker ${kicker.h} px high`);
  assert.ok(Math.abs(title.y - (318 + 42 + 4)) <= 0.5, `title at ${title.y}`);
  assert.ok(
    Math.abs(title.h - 3 * 112) <= 1,
    `title on ${title.h / 112} lines`
  );
  assert.ok(title.y + title.h <= 700.5, `head ends at ${title.y + title.h}`);
});

// @req REQ-186
test("1.10.0 check 8: a two-line source and a two-line credit start at y 1652 or lower", () => {
  const f = drawn.busy[1];
  const source = f.boxes.find((b) => b.kind === "source");
  const credit = f.boxes.find((b) => b.kind === "credit");
  assert.ok(Math.abs(source.h - 64) <= 0.5, `source ${source.h} px`);
  assert.ok(Math.abs(credit.h - 64) <= 0.5, `credit ${credit.h} px`);
  assert.ok(source.y >= 1651.5, `the foot starts at ${source.y}`);
  assert.ok(Math.abs(credit.y + credit.h - 1786) <= 0.5, "bottom at 1786");
});

// @req REQ-186
test("1.10.0: the kicker in the accent ink at 36 px, the source and the credit at 26 px, the credit in on-image-ink", () => {
  const blocks = drawn.busy.flatMap((f) => f.legibility.blocks);
  const of = (cls) => blocks.filter((b) => b.cls.split(" ").includes(cls));
  const ink = of("vf-title")[0].color;
  const accent = of("vf-kick")[0].color;
  assert.notEqual(accent, ink);
  for (const b of of("vf-kick")) {
    assert.equal(b.size, "36px", b.id);
    assert.equal(b.outline, 5, b.id);
    assert.equal(b.color, accent, b.id);
  }
  for (const cls of ["vf-src", "vf-cred"]) {
    assert.ok(of(cls).length > 0, cls);
    for (const b of of(cls)) {
      assert.equal(b.size, "26px", `${cls} ${b.id}`);
      assert.equal(b.outline, 5, `${cls} ${b.id}`);
      assert.equal(b.color, ink, `${cls} ${b.id}`);
    }
  }
});
