// @req REQ-186
// The series video drawn in the pinned Chromium, full screen (Cartes 1.4.0):
// the image fills the frame, only text sits on it, and every text box the
// browser drew stays in its band on every card of the series 1 model and on
// the ending. No veil or panel is drawn over the image. Needs no imagery
// outside git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSeriesVideo,
  seriesFrameCount,
  seriesFrameState,
  checkSeriesLayout,
  LAYOUT,
} from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-render-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));
const seq = loadSeriesVideo(seriesDemo(dir), { dir });

// The cover, every chunk once fully drawn (so every card and the ending),
// two frames in each card change (one in each half) and the last frame.
const keyFrames = [
  0,
  ...seq.chunks.map((c) => c.fullFrom),
  ...seq.cardStarts.slice(1).flatMap((s) => [s - 6, s - 3]),
  seriesFrameCount(seq) - 1,
];
let frames;
// @req REQ-186
test.before(async () => {
  frames = await renderSeriesFrames(seq, keyFrames, { diagnose: true });
});

// @req REQ-186
test("every text box stays in its band, on every card and the ending", () => {
  const seen = new Set();
  for (const f of frames) {
    f.state.layers.forEach((l) => seen.add(l.card));
    assert.deepEqual(
      checkSeriesLayout(f.boxes, { demo: true }),
      [],
      `frame ${f.frame}`
    );
  }
  assert.equal(seen.size, seq.cards.length);
});

// @req REQ-186
test("the image fills the whole frame, and nothing darkens it", () => {
  for (const f of frames) {
    for (const p of f.pictures)
      assert.ok(
        p.x <= 0.5 && p.y <= 0.5 && p.x + p.w >= 1079.5 && p.y + p.h >= 1919.5,
        `frame ${f.frame}: ${p.id} covers ${JSON.stringify(p)}`
      );
    // Only the lit word, the « image à trouver » slot and the demo tape may
    // paint a background over the image: no veil, scrim, band or panel.
    assert.deepEqual(f.backgrounds, [], `frame ${f.frame}`);
  }
});

// @req REQ-186
test("the library's web renditions are reported as too small for a final video", () => {
  const images = frames.flatMap((f) =>
    f.boxes.filter((b) => b.kind === "image")
  );
  assert.ok(images.length);
  assert.ok(images.every((b) => b.scale > LAYOUT.maxImageScale));
  assert.match(
    checkSeriesLayout(images).join(),
    /Image trop petite pour la vidéo/
  );
});

// @req REQ-186
test("subtitle lines sit between y 1316 and 1452, centred, at most 900 px wide", () => {
  const lines = frames.flatMap((f) =>
    f.boxes.filter((b) => b.kind === "subtitle")
  );
  assert.ok(lines.length >= seq.chunks.length);
  for (const b of lines) {
    assert.ok(b.w <= LAYOUT.subtitle.maxLineWidth, `${b.id} is ${b.w} px`);
    assert.ok(
      b.y >= 1316 - 0.5 && b.y + b.h <= 1452 + 0.5,
      `${b.id} at y ${b.y}`
    );
    assert.ok(Math.abs(b.x + b.w / 2 - 540) <= 1, `${b.id} is centred`);
  }
});

// @req REQ-186
test("the spoken word is lit whenever a chunk is fully drawn", () => {
  for (const f of frames.filter((f) => f.state.subtitle?.opacity === 1))
    assert.equal(
      f.lit,
      f.state.subtitle.highlight === null ? 0 : 1,
      `frame ${f.frame}`
    );
});

// @req REQ-186
test("French spacing: a narrow no-break space before ? and :", () => {
  const all = frames.map((f) => f.text).join("\n");
  assert.match(all, /nom\u202f\?/);
  assert.match(all, /Source\u202f:/);
  assert.doesNotMatch(all, / [?:!;]/);
});

// @req REQ-186
test("no frame of a series video says « Faites défiler »", () => {
  for (const f of frames) assert.doesNotMatch(f.text, /Faites défiler/i);
  assert.equal(seq.cards[0].cue, "Faites défiler");
});

// @req REQ-186
test("the cover is the opener with its band at y 250 and no subtitle", () => {
  const cover = frames[0];
  assert.deepEqual(
    cover.state.layers.map((l) => l.card),
    [0]
  );
  const kinds = cover.boxes.map((b) => b.kind);
  assert.ok(!kinds.includes("subtitle"));
  const band = cover.boxes.find((b) => b.kind === "band");
  assert.match(band.id, /^D'où vient le nom de mon pays/);
  assert.ok(Math.abs(band.x - 60) < 1 && Math.abs(band.y - 250) <= 0.5);
  assert.match(cover.text, /Qui a choisi le nom/);
  const sign = cover.boxes.find((b) => b.kind === "signature");
  assert.ok(
    Math.abs(sign.y + sign.h - 1884) <= 0.5 && Math.abs(sign.x - 60) < 1
  );
});

// @req REQ-186
test("a long date sets on one line, at the largest size that fits", () => {
  const card = seq.cards.findIndex((c) => c.id === "serie-pays-04");
  const f = frames.find(
    (f) => f.state.layers.length === 1 && f.state.layers[0].card === card
  );
  const date = f.boxes.find((b) => b.kind === "head" && b.date);
  assert.equal(date.date.size, 148);
  assert.equal(date.date.lines, 1);
  assert.match(date.id, /1er\s+mars\s+1919/u);
});

// @req REQ-186
test("during a card change, only one card's head shows", () => {
  for (const f of frames.filter((f) => f.state.layers.length === 2)) {
    const heads = f.boxes.filter((b) => b.kind === "head");
    const cards = new Set(heads.map((b) => b.card));
    assert.ok(cards.size <= 1, `frame ${f.frame} shows ${[...cards]}`);
    // The band and the signature stay, whole, through the change.
    assert.ok(f.boxes.some((b) => b.kind === "band"));
    assert.ok(f.boxes.some((b) => b.kind === "signature"));
  }
});

// @req REQ-186
test("the ending: block from y 318, centred signature ending on y 1884", () => {
  const end = frames.at(-1);
  const slogan = end.boxes.find((b) => b.kind === "ending");
  assert.ok(Math.abs(slogan.y - 318) <= 0.5, `slogan at ${slogan.y}`);
  assert.ok(end.boxes.some((b) => b.kind === "pill"));
  const sign = end.boxes.find((b) => b.kind === "signature");
  assert.ok(Math.abs(sign.y + sign.h - 1884) <= 0.5, `signature at ${sign.y}`);
  assert.ok(Math.abs(sign.x + sign.w / 2 - 540) <= 1, "signature centred");
  assert.match(end.text, /ETHNIAFRICA\.COM/);
});

// Series 3's model carries a map card: the map fills the frame with its own
// 9:16 view, its subject brought into the clear zone.
function familleVideo(mapDir, card2 = "serie-nom-famille-02") {
  return loadSeriesVideo(
    seriesDemo(mapDir, {
      script: (beats) =>
        beats.map((beat, i) => ({
          ...beat,
          card: i === 1 ? card2 : `serie-nom-famille-0${i + 1}`,
          chunks:
            i === beats.length - 1
              ? [
                  { text: "Cherchez Kouassi sur EthniAfrica,", duration: 2.8 },
                  { text: "lien en profil.", duration: 1.4 },
                ]
              : beat.chunks,
        })),
      edit: (input) => (input.ending.search = "Kouassi"),
    }),
    { dir: mapDir }
  );
}

// @req REQ-186
test("a map card fills the frame with its own view, its subject in the clear zone", async () => {
  const mapDir = mkdtempSync(join(tmpdir(), "series-map-"));
  try {
    const famille = familleVideo(mapDir);
    const card = famille.cards.findIndex((c) => c.type === "map");
    const frame = famille.chunks.find((c) => c.card === card).fullFrom;
    const [drawn] = await renderSeriesFrames(famille, [frame]);
    assert.equal(drawn.maps.length, 1);
    const [map] = drawn.maps;
    const [, , w, h] = map.viewBox.split(" ").map(Number);
    assert.ok(Math.abs(w / h - 1080 / 1920) < 1e-6, `view ${map.viewBox}`);
    assert.ok(map.w >= 1080 && map.h >= 1920);
    const subject = drawn.boxes.find((b) => b.kind === "map-subject");
    assert.ok(subject.y >= LAYOUT.mapSubjectTop, `subject at ${subject.y}`);
    assert.deepEqual(checkSeriesLayout(drawn.boxes, { demo: true }), []);
  } finally {
    rmSync(mapDir, { recursive: true, force: true });
  }
});

// @req REQ-186
test("a map whose base map is too short for 9:16 is refused", async () => {
  const mapDir = mkdtempSync(join(tmpdir(), "series-map-"));
  try {
    const famille = familleVideo(mapDir);
    famille.cards[1] = structuredClone(
      JSON.parse(
        (await import("node:fs")).readFileSync(famille.cardsFile, "utf8")
      ).cards.find((c) => c.id === "serie-frontieres-02")
    );
    famille.cards[1].theme = famille.cards[0].theme;
    const frame = famille.chunks.find((c) => c.card === 1).fullFrom;
    assert.equal(seriesFrameState(famille, frame).layers[0].card, 1);
    await assert.rejects(
      renderSeriesFrames(famille, [frame]),
      /Le sujet de la carte passe sous la tête/
    );
  } finally {
    rmSync(mapDir, { recursive: true, force: true });
  }
});
