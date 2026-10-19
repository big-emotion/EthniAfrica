// @req REQ-186
// The series idents in the series video (operator, 19 October 2026): the
// intro bumper after the opener card, voiced and subtitled; the end card in
// place of the 1.10.0 ending, after the signed card. Both enter and leave by
// the 300 ms card change and run on their own clock from its first frame.
// No browser is needed.
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
import { seriesDemo, introChunks } from "./fixtures/series-pays.mjs";
import { INTRO, OUTRO } from "../series-idents/shots.mjs";

const FPS = 30;
const CROSS_FADE = 9;
const dirs = [];
function demo({
  intro = true,
  idents = { outro: "peul", next: "Le nom Burkina Faso" },
  script = (b) => b,
  edit = () => {},
} = {}) {
  const dir = mkdtempSync(join(tmpdir(), "series-idents-"));
  dirs.push(dir);
  const input = seriesDemo(dir, {
    script: (beats) =>
      script(
        intro
          ? [
              beats[0],
              { type: "intro", chunks: introChunks() },
              ...beats.slice(1),
            ]
          : beats
      ),
    edit: (i) => {
      if (idents) i.idents = idents;
      edit(i);
    },
  });
  return loadSeriesVideo(input, { dir });
}
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);

const identAt = (seq, frame) =>
  seriesFrameState(seq, frame).layers.filter((l) => l.ident);

test("the intro comes right after the opener, voiced and subtitled", () => {
  const seq = demo();
  assert.equal(seq.cards[1].type, "intro");
  const said = seq.chunks.filter((c) => c.card === 1);
  assert.ok(said.length > 0);
  assert.ok(
    said.every((c) => !c.hidden && c.lines.length > 0),
    "its sentence is subtitled"
  );
});

test("the intro says the fixed sentence word for word", () => {
  assert.throws(
    () =>
      demo({
        script: (b) =>
          b.map((x) =>
            x.type === "intro"
              ? {
                  ...x,
                  chunks: [
                    {
                      text: "Bienvenue sur EthniAfrica, le site des noms",
                      duration: 3,
                    },
                  ],
                }
              : x
          ),
      }),
    /intro/i
  );
});

test("the intro is refused anywhere but after the opener", () => {
  assert.throws(
    () => demo({ script: (b) => [b[0], b[2], b[1], ...b.slice(3)] }),
    /intro/i
  );
});

test("the intro runs on its own clock from the first frame of its card change", () => {
  const seq = demo();
  const start = seq.cardStarts[1];
  const into = identAt(seq, start - CROSS_FADE + 1);
  assert.equal(into.length, 1);
  assert.equal(into[0].ident.clip, "intro");
  assert.ok(Math.abs(into[0].ident.t - 1 / FPS) < 1e-9);
  const full = identAt(seq, start + 30)[0];
  assert.equal(full.opacity, 1);
  assert.ok(Math.abs(full.ident.t - (30 + CROSS_FADE) / FPS) < 1e-9);
  const late = identAt(seq, seq.cardStarts[2] - 1)[0];
  assert.ok(
    late.ident.t <= INTRO.duration,
    "the clip holds its last frame, never runs past it"
  );
});

test("the end card replaces the 1.10.0 ending and carries the episode's name and the next episode", () => {
  const seq = demo();
  const last = seq.cards.at(-1);
  assert.equal(last.type, "closing");
  assert.deepEqual(last.outro, { layers: "peul", next: "Le nom Burkina Faso" });
  const end = identAt(seq, seriesFrameCount(seq) - 1);
  assert.equal(end[0].ident.clip, "outro");
  assert.ok(
    seq.chunks
      .filter((c) => c.card === seq.cards.length - 1)
      .every((c) => c.hidden),
    "every word of the ending is printed, none subtitled"
  );
});

test("the video lasts long enough for the whole end card", () => {
  const seq = demo();
  const from = seq.cardStarts.at(-1) - CROSS_FADE;
  assert.ok(seriesFrameCount(seq) >= from + Math.round(OUTRO.duration * FPS));
});

test("an end card needs the answer of its name, in a layer file", () => {
  assert.throws(
    () => demo({ idents: { outro: "nom-sans-page" } }),
    /layers\/nom-sans-page\.json/
  );
});

test("without idents the video keeps the 1.10.0 ending, unchanged", () => {
  const seq = demo({ intro: false, idents: null });
  assert.equal(seq.cards[1].type === "intro", false);
  assert.equal(seq.cards.at(-1).outro, undefined);
  assert.equal(identAt(seq, seriesFrameCount(seq) - 1).length, 0);
});
