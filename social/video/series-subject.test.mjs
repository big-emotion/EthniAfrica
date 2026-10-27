// @req REQ-186
// Cartes 1.13.0, one subject over many episodes (series.md « 11 »; handoff.md
// « Renderer integration of 1.13.0 », step 11, check 12): the subject key
// (social/series/subjects/<id>.json) fixes the ink, the base view and the
// kicker formula; the recap card, after the intro, shows the previous
// episode's last map desaturated, its marks popping 18 frames apart, 6 s at
// most (4 s on a short).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { motionDemo, RECAP } from "./fixtures/series-motion.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-subject-"));
  dirs.push(dir);
  return loadSeriesVideo(motionDemo(dir, options), { dir });
};
const seq = load();
const subject = JSON.parse(
  readFileSync(new URL("../series/subjects/BFA.json", import.meta.url), "utf8")
);

// @req REQ-186
test("the subject key sets the opener's view and composes its kicker; the band keeps the series' number", () => {
  assert.deepEqual(
    { ...seq.cards[0].map.view },
    { lon: subject.view.lon, lat: subject.view.lat, radius: subject.view.r }
  );
  assert.equal(seq.cards[0].videoKicker, "Burkina Faso · épisode 2");
  assert.deepEqual(seq.band, { id: "pays", episode: 23 });
  assert.equal(seq.subject.id, "BFA");
  assert.throws(
    () => load({ edit: (input) => (input.subject.id = "XYZ") }),
    /Sujet inconnu : social\/series\/subjects\/XYZ\.json manque/u
  );
});

// Check 12: the recap card.
// @req REQ-186
test("check 12: the recap card comes right after the intro, under « Dans l’épisode précédent », 180 frames at most", () => {
  const i = seq.cards.findIndex((c) => c.id === "rappel");
  assert.equal(i, 2);
  assert.equal(seq.cards[1].type, "intro");
  const card = seq.cards[i];
  assert.equal(card.videoKicker, "Dans l’épisode précédent");
  assert.equal(card.title, RECAP.title);
  const frames = seq.cardStarts[i + 1] - seq.cardStarts[i];
  assert.ok(frames <= 180, `${frames} frames`);
  assert.throws(
    () =>
      load({
        // A second sentence carries the recap past 6 s.
        recapChunks: [
          { text: "La Haute-Volta devient le Burkina Faso.", duration: 3.0 },
          { text: "Et voilà pour la suite", duration: 3.6 },
        ],
      }),
    /Rappel de plus de 6 s/u
  );
  assert.throws(
    () => load({ edit: (input) => (input.subject.episode = 1) }),
    /pas de rappel au premier épisode/u
  );
});

// @req REQ-186
test("check 12: the recap's map at 30 % saturation, its marks popping 18 frames apart", () => {
  const i = seq.cards.findIndex((c) => c.id === "rappel");
  const start = seq.cardStarts[i];
  const map = (f) =>
    seriesFrameState(seq, f).layers.find((l) => l.card === i)?.map;
  assert.ok(Math.abs(map(start + 30).desat - 0.7) < 1e-9);
  const cp = seq.mapSequence.cards[i];
  const area =
    seq.mapSequence.entries[
      Object.keys(seq.mapSequence.entries).find((k) =>
        k.includes("bfa-haute-volta")
      )
    ].start;
  const words = cp.words.map((w) => w.start);
  const all = [area, ...words].sort((a, b) => a - b);
  assert.equal(all.length, RECAP.marks.length);
  for (let k = 1; k < all.length; k++) assert.equal(all[k] - all[k - 1], 18);
  // The colour comes back on the next card.
  const next = seq.cardStarts[i + 1] + 15;
  const after = seriesFrameState(seq, next).layers.find((l) => l.map)?.map;
  assert.ok(!after?.desat);
});
