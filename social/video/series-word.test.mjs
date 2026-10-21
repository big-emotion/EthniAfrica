// @req REQ-186
// Cartes 1.13.0, episodes about a word (series.md « 12 »; handoff.md
// « Renderer integration of 1.13.0 », step 12): the word on the parchment,
// its parts lifting apart with their language and sense, a part joining, the
// forms as pills, the first attestation as a stamp; the parchment alone 20 s
// on a short, 30 s on a longer video.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { DUR, popAt } from "./series-motion.mjs";
import { FPS } from "./sequence.mjs";
import { wordCardDemo } from "./fixtures/series-motion.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-word-"));
  dirs.push(dir);
  return loadSeriesVideo(wordCardDemo(dir, options), { dir });
};
const seq = load();
const MOT = seq.cards.findIndex((c) => c.id === "motion-mot");
const word = (unit) => {
  for (const c of seq.chunks.filter((c) => c.card === MOT)) {
    const w = c.words.find(
      (w) => w.text.replace(/[,.:;]+$/u, "").replace(/^l['’]/u, "") === unit
    );
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const at = (f) =>
  seriesFrameState(seq, f).layers.find((l) => l.card === MOT).word;
const editWord = (change) => ({
  deck: (deck) => {
    change(deck.cards.find((c) => c.id === "motion-mot"));
    return deck;
  },
});

// @req REQ-186
test("1.13.0: the parts lift apart on the first part's word, in 450 ms, their tag and sense popping in", () => {
  const split = word("mooré");
  assert.equal(at(split).split, 0);
  assert.ok(at(split + 7).split > 0 && at(split + 7).split < 1);
  assert.equal(at(split + 14).split, 1);
  const [burkina, faso] = at(split + 40).parts;
  assert.equal(burkina.tag.opacity, 1);
  assert.equal(burkina.sense.opacity, 1);
  // Faso's tag on its own word.
  const dioula = word("dioula");
  assert.equal(at(dioula - 1).parts[1].tag.opacity, 0);
  assert.ok(
    Math.abs(at(dioula + 5).parts[1].tag.scale - popAt(5).scale) < 1e-9
  );
  assert.equal(faso.sense.opacity, at(split + 40).parts[1].sense.opacity);
});

// @req REQ-186
test("1.13.0: a part joins to make the inhabitant's form; the forms pop in as pills; the stamp drops from 140 %", () => {
  const j = word("bè");
  const before = at(j - 1);
  assert.equal(before.join, 0);
  assert.equal(at(j + 14).join, 1);
  // The other part and the tags leave by the exit.
  assert.equal(at(j + DUR.exit).parts[1].opacity, 0);
  assert.equal(at(j + DUR.exit).parts[0].tag.opacity, 0);
  // The added part pops, then moves against its base.
  assert.equal(at(j + 6).add.scale, popAt(0).scale);
  assert.equal(at(j + 21 + 14).add.move, 1);
  const form = word("Burkinabé");
  assert.ok(Math.abs(at(form + 5).forms[0].scale - popAt(5).scale) < 1e-9);
  const s = word("août");
  assert.ok(Math.abs(at(s).stamp.scale - 1.4) < 1e-9);
  assert.equal(at(s + DUR.stamp).stamp.scale, 1);
});

// @req REQ-186
test("1.13.0: a word card is refused off the parchment, or when its parts do not make the word", () => {
  assert.throws(
    () => load(editWord((c) => delete c.ground)),
    /Carte de mot hors du parchemin/u
  );
  assert.throws(
    () => load(editWord((c) => (c.word = "Burkina-Faso"))),
    /Les parties ne refont pas le mot « Burkina-Faso »/u
  );
});

// @req REQ-186
test("1.13.0: the parchment carries one word alone 20 s on a short, 30 s on a longer video", () => {
  const short = load({ edit: (input) => (input.tier = "short") });
  const s = (short.cardStarts[MOT + 1] - short.cardStarts[MOT]) / FPS;
  assert.ok(s < 20, `${s} s`);
  assert.ok(!short.warnings.some((w) => /Le mot seul/u.test(w)));
  const long = load({
    edit: (input) => (input.tier = "short"),
    script: (beats) => {
      for (const c of beats.find((b) => b.card === "motion-mot").chunks)
        c.duration = 3.2;
      return beats;
    },
  });
  assert.ok(
    long.warnings.some((w) => /Le mot seul sur le parchemin dure/u.test(w)),
    long.warnings.join(" | ")
  );
});
