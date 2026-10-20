// @req REQ-186
// The parallel final render (operator, 19 October 2026): the video is cut
// into slices, one per worker, that together draw every frame once. A cut
// never falls in an ident nor in the 30 frames before one, since an ident's
// glyphs depend on its own earlier frames; it falls inside a map or photo
// card, outside a card change. No browser is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesSlices } from "./series.mjs";
import { seriesDemo, introChunks } from "./fixtures/series-pays.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";

const CROSS_FADE = 9;
const dirs = [];
const fresh = () => {
  const dir = mkdtempSync(join(tmpdir(), "series-slices-"));
  dirs.push(dir);
  return dir;
};
// The series demonstration with both idents: the intro after the opener,
// the end card in place of the ending.
function withIdents() {
  const dir = fresh();
  const input = seriesDemo(dir, {
    script: (beats) => [
      beats[0],
      { type: "intro", chunks: introChunks() },
      ...beats.slice(1),
    ],
    edit: (i) => (i.idents = { outro: "peul", next: "Le nom Burkina Faso" }),
  });
  return loadSeriesVideo(input, { dir });
}
const animated = () => {
  const dir = fresh();
  return loadSeriesVideo(animatedDemo(dir), { dir });
};
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);

const assertCovers = (slices, count) => {
  assert.equal(slices[0].from, 0);
  assert.equal(slices.at(-1).to, count);
  for (const [k, s] of slices.entries()) {
    assert.ok(s.from < s.to, `slice ${k} is empty: ${s.from} to ${s.to}`);
    if (k) assert.equal(s.from, slices[k - 1].to, `gap or overlap at ${k}`);
  }
};

// @req REQ-186
test("the slices cover every frame once, with no gap and no overlap", () => {
  for (const seq of [withIdents(), animated()])
    for (const workers of [1, 2, 3, 4, 5, 7]) {
      const slices = seriesSlices(seq, workers);
      assertCovers(slices, seq.frames);
      assert.equal(slices.length, workers, `${workers} workers`);
    }
});

// @req REQ-186
test("a frame count not divisible by the workers is still covered", () => {
  const seq = animated();
  const workers = [3, 4, 7].find((n) => seq.frames % n);
  assert.ok(workers, `${seq.frames} frames`);
  const slices = seriesSlices(seq, workers);
  assertCovers(slices, seq.frames);
  assert.equal(
    slices.reduce((n, s) => n + s.to - s.from, 0),
    seq.frames
  );
});

// @req REQ-186
test("one worker draws the whole video in one slice", () => {
  const seq = animated();
  assert.deepEqual(seriesSlices(seq, 1), [{ from: 0, to: seq.frames }]);
});

// @req REQ-186
test("the slices are about even: each within half of an even share", () => {
  const seq = animated();
  const slices = seriesSlices(seq, 3);
  const share = seq.frames / 3;
  for (const s of slices)
    assert.ok(Math.abs(s.to - s.from - share) < share / 2, JSON.stringify(s));
});

// @req REQ-186
test("no cut falls in an ident, in the 30 frames before one, or in a card change", () => {
  const seq = withIdents();
  const starts = seq.cardStarts;
  const idents = seq.cards.flatMap((c, i) =>
    c.type === "intro" || c.outro
      ? [[starts[i] - CROSS_FADE - 30, starts[i + 1] ?? seq.frames]]
      : []
  );
  assert.equal(idents.length, 2);
  for (const workers of [2, 3, 4, 6, 8]) {
    const cuts = seriesSlices(seq, workers)
      .slice(1)
      .map((s) => s.from);
    for (const cut of cuts) {
      for (const [a, b] of idents)
        assert.ok(cut < a || cut >= b, `cut ${cut} in ident ${a} to ${b}`);
      const i = starts.findLastIndex((s) => s <= cut);
      const card = seq.cards[i];
      assert.ok(card.type === "map" || card.image, `cut ${cut} on ${card.id}`);
      const end = starts[i + 1] ?? seq.frames;
      assert.ok(
        cut <= end - CROSS_FADE,
        `cut ${cut} in the change to ${i + 1}`
      );
    }
  }
});

// @req REQ-186
test("with fewer places to cut than workers, the video has fewer slices", () => {
  const seq = withIdents();
  const slices = seriesSlices(seq, seq.frames);
  assertCovers(slices, seq.frames);
  assert.ok(slices.length < seq.frames);
});

// @req REQ-186
test("the worker count is a whole number from 1", () => {
  const seq = animated();
  for (const workers of [0, -1, 1.5, NaN])
    assert.throws(() => seriesSlices(seq, workers), /workers/);
});
