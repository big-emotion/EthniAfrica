// @req REQ-186
// The series video drawn in the pinned Chromium: the text boxes the browser
// actually drew stay in the feed's safe zone on every card of the series 1
// model and on the ending, no frame asks to scroll, and the cover is the
// opener with its band and no subtitle. Needs no imagery outside git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSeriesVideo,
  seriesFrameCount,
  checkSeriesLayout,
  LAYOUT,
} from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-render-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));
const seq = loadSeriesVideo(seriesDemo(dir), { dir });

// The cover, every chunk once fully drawn (so every card and the ending),
// one frame in each cross-fade and the last frame.
const keyFrames = [
  0,
  ...seq.chunks.map((c) => c.fullFrom),
  ...seq.cardStarts.slice(1).map((s) => s - 4),
  seriesFrameCount(seq) - 1,
];
// Drawn in diagnostic mode, so a defect is listed rather than stopping the
// run: the test then says which cards break the layout.
let frames;
test.before(async () => {
  frames = await renderSeriesFrames(seq, keyFrames, { diagnose: true });
});

// Open design defect, for the operator (14 October 2026): the date
// « 1er mars 1919 » of serie-pays-04 wraps on two lines in Anton 124/118
// within the 640 px head, so the head grows above y 902 into the
// photograph. The design's own board draws it so (video-B-changement.png).
// The engine refuses it; nothing in the design system is changed to pass.
const KNOWN_DEFECT = "serie-pays-04";

test("every text box stays in the safe zone, on every card and the ending", () => {
  const seen = new Set();
  for (const f of frames) {
    f.state.layers.forEach((l) => seen.add(l.card));
    const shows = f.state.layers.map((l) => seq.cards[l.card].id);
    const problems = checkSeriesLayout(f.boxes);
    if (!shows.includes(KNOWN_DEFECT)) {
      assert.deepEqual(problems, [], `frame ${f.frame}`);
      continue;
    }
    for (const p of problems)
      assert.match(
        p,
        /^(Le nom d'avant|1er mars 1919): the head of the card runs outside y 902 to 1248$/
      );
  }
  assert.equal(seen.size, seq.cards.length);
});

test("a frame whose head leaves y 902 to 1248 is refused outside diagnosis", async () => {
  const card = seq.cards.findIndex((c) => c.id === KNOWN_DEFECT);
  const frame = seq.chunks.find((c) => c.card === card).fullFrom;
  await assert.rejects(
    renderSeriesFrames(seq, [frame]),
    /Layout at frame \d+: Le nom d'avant: the head of the card runs outside y 902 to 1248/
  );
});

test("subtitle lines sit between y 700 and 836, at most 840 px wide", () => {
  const lines = frames.flatMap((f) =>
    f.boxes.filter((b) => b.kind === "subtitle")
  );
  assert.ok(lines.length >= seq.chunks.length);
  for (const b of lines) {
    assert.ok(b.w <= LAYOUT.subtitle.maxLineWidth, `${b.id} is ${b.w} px`);
    assert.ok(
      b.y >= 700 - 0.5 && b.y + b.h <= 836 + 0.5,
      `${b.id} at y ${b.y}`
    );
    assert.ok(Math.abs(b.x + b.w / 2 - 540) <= 1, `${b.id} is centred`);
  }
});

test("the spoken word is lit whenever a chunk is fully drawn", () => {
  for (const f of frames.filter((f) => f.state.subtitle?.opacity === 1))
    assert.equal(
      f.lit,
      f.state.subtitle.highlight === null ? 0 : 1,
      `frame ${f.frame}`
    );
});

test("no frame of a series video says « Faites défiler »", () => {
  for (const f of frames) assert.doesNotMatch(f.text, /Faites défiler/i);
  // The opener carries the cue on the carousel: the video leaves it out.
  assert.equal(seq.cards[0].cue, "Faites défiler");
});

test("the cover is the opener with its band and no subtitle", () => {
  const cover = frames[0];
  assert.deepEqual(
    cover.state.layers.map((l) => l.card),
    [0]
  );
  const kinds = cover.boxes.map((b) => b.kind);
  assert.ok(!kinds.includes("subtitle"));
  const band = cover.boxes.find((b) => b.kind === "band");
  assert.match(band.id, /^D'où vient le nom de mon pays/);
  assert.ok(
    band.x >= 120 && band.x < 121 && band.y >= 270 && band.y + band.h <= 342
  );
  assert.match(cover.text, /Qui a choisi le nom/);
});

test("the ending: slogan from y 362, pill at 872, signature at 980", () => {
  const end = frames.at(-1);
  const slogan = end.boxes.find((b) => b.kind === "ending");
  assert.ok(Math.abs(slogan.y - 362) <= 0.5, `slogan at ${slogan.y}`);
  const pill = end.boxes.find((b) => b.kind === "pill");
  assert.ok(Math.abs(pill.y - 872) <= 0.5, `pill at ${pill.y}`);
  const sign = end.boxes.find((b) => b.kind === "signature");
  assert.ok(Math.abs(sign.y - 980) <= 0.5, `signature at ${sign.y}`);
  assert.match(end.text, /ETHNIAFRICA\.COM/);
});

// Series 3's model carries a map card: its map fills the photograph's
// window with the card's own view, and its names stay in the safe zone.
test("a map card shows its map in the photograph's window", async () => {
  const mapDir = mkdtempSync(join(tmpdir(), "series-map-"));
  try {
    const famille = loadSeriesVideo(
      seriesDemo(mapDir, {
        script: (beats) =>
          beats.map((beat, i) => ({
            ...beat,
            card: `serie-nom-famille-0${i + 1}`,
            chunks:
              i === beats.length - 1
                ? [
                    {
                      text: "Cherchez Kouassi sur EthniAfrica,",
                      duration: 2.8,
                    },
                    { text: "lien en profil.", duration: 1.4 },
                  ]
                : beat.chunks,
          })),
        edit: (input) => (input.ending.search = "Kouassi"),
      }),
      { dir: mapDir }
    );
    const card = famille.cards.findIndex((c) => c.type === "map");
    const frame = famille.chunks.find((c) => c.card === card).fullFrom;
    const [drawn] = await renderSeriesFrames(famille, [frame]);
    // One map, with the card's own frame, filling the 1080 x 560 window
    // (give or take its slow zoom, at most 4 %).
    assert.equal(drawn.maps.length, 1);
    const [map] = drawn.maps;
    assert.equal(
      map.viewBox,
      (famille.cards[card].map.view ?? [0, 0, 1080, 1350]).join(" ")
    );
    const zoom = map.w / 1080;
    assert.ok(zoom >= 1 && zoom <= 1.04, `zoom ${zoom}`);
    assert.ok(
      Math.abs(map.y + map.h / 2 - 622) < 1,
      `centre y ${map.y + map.h / 2}`
    );
    assert.deepEqual(checkSeriesLayout(drawn.boxes), []);
  } finally {
    rmSync(mapDir, { recursive: true, force: true });
  }
});
