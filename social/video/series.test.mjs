// @req REQ-186
// The series video (Cartes 1.3.0, layout B) as a schedule: the cover, the
// 300 ms cross-fades, every card voiced once, the length and the « série »
// ending, on the series 1 demonstration script. No browser is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkSeriesLayout,
  loadSeriesVideo,
  seriesFrameState,
  seriesFrameCount,
} from "./series.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dirs = [];
function demo(options) {
  const dir = mkdtempSync(join(tmpdir(), "series-video-"));
  dirs.push(dir);
  return loadSeriesVideo(seriesDemo(dir, options), { dir });
}
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);

const FPS = 30;
const states = (seq) =>
  Array.from({ length: seriesFrameCount(seq) }, (_, f) =>
    seriesFrameState(seq, f)
  );

test("frame 0 is the cover: the opener alone, with its band, and no subtitle", () => {
  const seq = demo();
  const cover = seriesFrameState(seq, 0);
  assert.deepEqual(cover.layers, [{ card: 0, opacity: 1, zoom: 1 }]);
  assert.equal(seq.cards[0].type, "opener");
  assert.deepEqual(seq.band, { id: "pays", episode: 1 });
  assert.equal(cover.subtitle, null);
});

test("the demonstration script lasts 35 to 45 s", () => {
  const seconds = seriesFrameCount(demo()) / FPS;
  assert.ok(seconds >= 35 && seconds <= 45, `${seconds} s`);
});

test("each card change is one 300 ms cross-fade and nothing else moves", () => {
  const seq = demo();
  const all = states(seq);
  const fades = [];
  all.forEach((s, f) => {
    assert.ok(
      s.layers.length <= 2,
      `frame ${f} draws ${s.layers.length} cards`
    );
    if (s.layers.length === 2) fades.push(f);
  });
  // Six changes between seven cards, each 9 frames of mixing (0 → 1 over
  // 300 ms: opacity 1/9 … 8/9, then the new card alone).
  const runs = [];
  for (const f of fades)
    if (runs.length && runs.at(-1).at(-1) === f - 1) runs.at(-1).push(f);
    else runs.push([f]);
  assert.equal(runs.length, seq.cards.length - 1);
  runs.forEach((run, k) => {
    assert.equal(run.length, 8, `change ${k + 1} mixes ${run.length} frames`);
    run.forEach((f, j) => {
      const [under, over] = all[f].layers;
      assert.equal(under.card, k);
      assert.equal(under.opacity, 1);
      assert.equal(over.card, k + 1);
      assert.ok(Math.abs(over.opacity - (j + 1) / 9) < 1e-9);
    });
    assert.deepEqual(
      all[run.at(-1) + 1].layers.map((l) => [l.card, l.opacity]),
      [[k + 1, 1]]
    );
  });
});

test("the photograph zooms from 100 to 104 % while its card is on screen", () => {
  const seq = demo();
  const zooms = new Map();
  states(seq).forEach((s) =>
    s.layers.forEach((l) =>
      zooms.set(l.card, [...(zooms.get(l.card) ?? []), l.zoom])
    )
  );
  for (const [card, list] of zooms) {
    assert.equal(list[0], 1, `card ${card} starts at 100 %`);
    if (card < seq.cards.length - 1)
      assert.ok(
        Math.abs(list.at(-1) - 1.04) < 1e-9,
        `card ${card} ends at 104 %`
      );
    list.forEach((z, i) => assert.ok(i === 0 || z >= list[i - 1]));
  }
});

test("every card is voiced once, while it is on screen alone", () => {
  const seq = demo();
  const voiced = seq.chunks.map((c) => c.card);
  assert.deepEqual(
    [...new Set(voiced)],
    seq.cards.map((_, i) => i)
  );
  for (const chunk of seq.chunks) {
    const s = seriesFrameState(seq, chunk.appear);
    assert.deepEqual(
      s.layers.map((l) => [l.card, l.opacity]),
      [[chunk.card, 1]]
    );
  }
});

test("the last two chunks are the search sentence, on the closing card", () => {
  const seq = demo();
  const last = seq.chunks.slice(-2);
  assert.deepEqual(
    last.map((c) => c.text.replace(/\s/gu, " ")),
    ["Cherchez Burkina Faso sur EthniAfrica,", "lien en profil."]
  );
  assert.ok(last.every((c) => seq.cards[c.card].type === "closing"));
});

test("the searched name stays whole on one subtitle line", () => {
  const [search] = demo().chunks.slice(-2);
  const lines = search.lines.map((line) => line.map((r) => r.text).join(""));
  assert.deepEqual(lines, ["Cherchez Burkina\u00a0Faso", "sur EthniAfrica,"]);
});

test("the closing card holds until the voice ends plus 0.5 s, 2.5 s at least", () => {
  const seq = demo();
  const closingIn = seq.cardStarts.at(-1);
  const count = seriesFrameCount(seq);
  assert.equal(
    count,
    Math.max(closingIn + 75, Math.ceil((seq.voice.duration + 0.5) * FPS - 1e-9))
  );
});

test("the series ending is refused without pageOnline: true", () => {
  for (const pageOnline of [undefined, false, "true"])
    assert.throws(
      () => demo({ edit: (input) => (input.ending.pageOnline = pageOnline) }),
      /pageOnline: true/
    );
});

test("the closing chunks must say the search sentence for the ending's name", () => {
  assert.throws(
    () => demo({ edit: (input) => (input.ending.search = "Haute-Volta") }),
    /Cherchez Haute-Volta sur EthniAfrica,/
  );
});

test("a video outside 35 to 45 s is refused", () => {
  assert.throws(
    () =>
      demo({
        script: (beats) =>
          beats.map((b) => ({
            ...b,
            chunks: b.chunks.map((c) => ({ ...c, duration: c.duration * 1.3 })),
          })),
      }),
    /35 to 45 s/
  );
});

test("an opener first, a closing card last, and one series for every card", () => {
  assert.throws(
    () => demo({ edit: (input) => input.beats.reverse() }),
    /opener/
  );
  assert.throws(
    () =>
      demo({
        edit: (input) => (input.beats[1].card = "serie-nom-famille-02"),
      }),
    /one series/
  );
});

test("a subtitle line estimated wider than 840 px is refused", () => {
  assert.throws(
    () =>
      demo({
        script: (beats) => {
          beats[1].chunks[0].text = "MMMM MMMM MMMM MMMM";
          return beats;
        },
      }),
    /840 px/
  );
});

test("the safe zone narrows to x 760 below y 840; sources and credits are exempt", () => {
  const box = (kind, x, y, w, h) => ({ id: kind, kind, x, y, w, h });
  assert.deepEqual(checkSeriesLayout([box("ending", 120, 362, 840, 228)]), []);
  assert.equal(checkSeriesLayout([box("head", 120, 1100, 700, 80)]).length, 1);
  assert.equal(checkSeriesLayout([box("ending", 100, 400, 800, 80)]).length, 1);
  assert.equal(checkSeriesLayout([box("band", 120, 250, 500, 34)]).length, 1);
  assert.match(
    checkSeriesLayout([box("head", 120, 880, 600, 80)])[0],
    /902 to 1248/
  );
  assert.match(
    checkSeriesLayout([box("subtitle", 110, 700, 860, 68)]).join(),
    /over 840/
  );
  assert.deepEqual(
    checkSeriesLayout(
      ["source", "credit", "signature", "tape"].map((k) =>
        box(k, 0, 1300, 1080, 30)
      )
    ),
    []
  );
});
