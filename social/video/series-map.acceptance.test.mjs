// @req REQ-186
// The series video's map cards drawn on the verified satellite imagery in
// the pinned Chromium (Cartes 1.4.1): the view fills the frame with nothing
// darkening it, the subject sits between the head and the foot, names and
// key stay in their bands, the scale limit holds at the end of the zoom, and
// a Parchemin map card is drawn exactly like a Nuit one. The imagery and
// Natural Earth's countries are not in git: point ETHNIAFRICA_VIDEO_ASSETS at
// their folder. A missing folder fails; it is never reported as passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo, checkSeriesLayout, LAYOUT } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { seriesDemo, closingChunks } from "./fixtures/series-pays.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);

// Series 3's model with a map card second, timed on the demonstration voice.
function familleVideo(card2 = "serie-nom-famille-02", theme) {
  const dir = mkdtempSync(join(tmpdir(), "series-map-"));
  dirs.push(dir);
  const seq = loadSeriesVideo(
    seriesDemo(dir, {
      script: (beats) =>
        beats.map((beat, i) => ({
          ...beat,
          card: `serie-nom-famille-0${i + 1}`,
          chunks: i === beats.length - 1 ? closingChunks() : beat.chunks,
        })),
    }),
    { dir }
  );
  // Another series' map card takes this episode's band and theme, as an
  // episode would carry it.
  const deck = JSON.parse(readFileSync(seq.cardsFile, "utf8"));
  if (card2 !== "serie-nom-famille-02") {
    seq.cards[1] = structuredClone(deck.cards.find((c) => c.id === card2));
    seq.cards[1].series = seq.cards[0].series;
  }
  for (const c of seq.cards) c.theme = theme ?? seq.cards[0].theme;
  return seq;
}
// The map card fully drawn at 100 %, and its last frame before the change.
const mapFrames = (seq) => {
  const card = seq.cards.findIndex((c) => c.type === "map");
  return [
    seq.chunks.find((c) => c.card === card).fullFrom,
    seq.cardStarts[card + 1] - 10,
  ];
};

// @req REQ-186
test("the verified assets are present", () => {
  assert.ok(assets, "Set ETHNIAFRICA_VIDEO_ASSETS to the verified assets");
});

// @req REQ-186
test("a highlighted country on imagery: full frame, subject between head and foot", async () => {
  const seq = familleVideo();
  const frames = await renderSeriesFrames(seq, mapFrames(seq), { assets });
  for (const f of frames) {
    assert.equal(f.maps.length, 1);
    assert.equal(f.maps[0].id, "serie-nom-famille-02");
    for (const p of f.pictures)
      assert.ok(
        p.x <= 0.5 && p.y <= 0.5 && p.x + p.w >= 1079.5 && p.y + p.h >= 1919.5,
        `${p.id} covers ${JSON.stringify(p)}`
      );
    assert.deepEqual(f.backgrounds, [], `frame ${f.frame}`);
    // Not a demonstration: the imagery must hold the 1.5 limit, zoom included.
    assert.deepEqual(checkSeriesLayout(f.boxes), [], `frame ${f.frame}`);
    const subject = f.boxes.find((b) => b.kind === "map-subject");
    assert.ok(subject.y >= LAYOUT.mapSubjectTop - 0.5);
    assert.ok(subject.y + subject.h <= LAYOUT.mapFoot[0] + 0.5);
    const image = f.boxes.find((b) => b.kind === "image");
    assert.ok(image.scale <= LAYOUT.maxImageScale, `scale ${image.scale}`);
    assert.deepEqual(
      f.boxes.filter((b) => b.kind === "map-name").map((b) => b.id),
      ["Côte d'Ivoire"]
    );
    assert.match(f.text, /Source : fiches EthniAfrica Yao et Kouassi\n/u);
    assert.match(
      f.text,
      /Imagerie : NASA Earth Observatory ; frontières : Natural Earth, domaine public/u
    );
    assert.doesNotMatch(f.text, /fond Natural Earth/);
  }
  // The slow zoom grows the subject around (540, 1010).
  const [a, b] = frames.map((f) =>
    f.boxes.find((x) => x.kind === "map-subject")
  );
  assert.ok(b.w > a.w * 1.03, `${a.w} then ${b.w}`);
});

// @req REQ-186
test("two areas across a border, refused in 1.4.0, are drawn at the scale limit", async () => {
  const seq = familleVideo("serie-frontieres-02");
  const [f] = await renderSeriesFrames(seq, mapFrames(seq).slice(1), {
    assets,
  });
  assert.equal(f.maps[0].capped, true);
  assert.ok(
    f.maps[0].spanKm > 1380 && f.maps[0].spanKm < 1400,
    `${f.maps[0].spanKm} km`
  );
  assert.deepEqual(checkSeriesLayout(f.boxes), []);
  const keys = f.boxes.filter((b) => b.kind === "key");
  assert.deepEqual(
    keys.map((k) => k.id),
    [
      "Peuple X (fictif)",
      "Même peuple, autre État (fictif)",
      "Frontières actuelles",
    ]
  );
  // Two columns from three items: the first two share their row.
  assert.ok(Math.abs(keys[0].y - keys[1].y) < 1 && keys[1].x > keys[0].x + 400);
  assert.ok(keys.every((k) => k.map && k.y >= LAYOUT.mapFoot[0] - 0.5));
  assert.deepEqual(
    f.boxes.filter((b) => b.kind === "map-name").map((b) => b.id),
    ["Peuple X", "Peuple X"]
  );
});

// @req REQ-186
test("a Parchemin map card is drawn exactly like a Nuit one", async () => {
  const pixels = async (theme) => {
    const seq = familleVideo("serie-frontieres-02", theme);
    const [f] = await renderSeriesFrames(seq, mapFrames(seq).slice(0, 1), {
      assets,
    });
    return sharp(f.png).raw().toBuffer();
  };
  const [nuit, parchemin] = [await pixels("nuit"), await pixels("parchemin")];
  assert.ok(nuit.equals(parchemin), "the two frames differ");
});
