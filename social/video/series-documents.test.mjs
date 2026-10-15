// @req REQ-186
// The document card and the teaching cards of the series video (Cartes
// 1.8.0, handoff « Renderer integration of 1.8.0 », checks 1 to 9): the
// framing on the quoted passage, the sharp band around it, the underline on
// its word, the foot, the formula, the side-by-side forms and the week table.
// On the two short demonstrations of fixtures/series-documents.mjs; no
// browser is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { documentFrame } from "./series-document.mjs";
import {
  documentDemo,
  teachingDemo,
  PASSAGES,
} from "./fixtures/series-documents.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dirs = [];
const load = (demo, options) => {
  const dir = mkdtempSync(join(tmpdir(), "series-documents-"));
  dirs.push(dir);
  return loadSeriesVideo(demo(dir, options), { dir });
};
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const at = (seq, id) => seq.cards.findIndex((c) => c.id === id);
const cardOf = (deck, id) => deck.cards.find((c) => c.id === id);
const withDocument = (id, change) => (deck) => {
  change(cardOf(deck, id));
  return deck;
};
const SPEKE = { src: "Exemples/speke-1863-p253-page.jpg", w: 985, h: 1500 };
const layerOf = (seq, frame, card) =>
  seriesFrameState(seq, frame).layers.find((l) => l.card === card);

// @req REQ-186
test("1.8.0: the passage is set 960 px wide, its centre at (540, 1000), within the cover scale and 1.5", () => {
  const f = documentFrame({ ...SPEKE, document: PASSAGES.middle });
  const cover = Math.max(1080 / 985, 1920 / 1500);
  assert.equal(f.cover, cover);
  assert.equal(f.scale, Math.max(cover, Math.min(1.5, 960 / 706)));
  assert.ok(Math.abs(f.passage.x + f.passage.w / 2 - 540) < 1e-9);
  assert.ok(Math.abs(f.passage.y + f.passage.h / 2 - 1000) < 1e-9);
  assert.ok(Math.abs(f.passage.w - 960) < 1e-9);
  assert.equal(f.edge, 0);
  // A narrow passage stops at 1.5; a page smaller than the frame at cover.
  const narrow = documentFrame({
    ...SPEKE,
    document: { passage: [300, 700, 200, 30], marks: [] },
  });
  assert.equal(narrow.scale, 1.5);
});

// @req REQ-186
test("1.8.0: near the top of a page the frame shows past its edge, 400 px at most, on dark ground", () => {
  const f = documentFrame({ ...SPEKE, document: PASSAGES.top });
  assert.equal(f.edge, 400);
  assert.equal(f.top, 400);
  assert.ok(f.passage.y >= 700 && f.passage.y + f.passage.h <= 1300);
  // The page is clamped to the frame sideways: no edge shows left or right.
  assert.ok(f.left <= 0 && f.left + f.width >= 1080);
});

// @req REQ-186
test("1.8.0: a passage the clear zone cannot hold is refused with its measured box", () => {
  assert.throws(
    () =>
      load(documentDemo, {
        deck: withDocument("serie-mots-02", (c) => {
          c.image.document = { ...PASSAGES.first };
        }),
        script: (beats) => {
          beats[1].chunks[0].text = "Ces rois parlent d'idées,";
          return beats;
        },
      }),
    /serie-mots-02: Passage hors de l'image dégagée : x \d+ à \d+, y \d+ à \d+, échelle 1\.36, bord 400 px/
  );
});

// @req REQ-186
test("1.8.0: the sharp band contains the passage, wherever the passage sits on the page", () => {
  for (let y = 300; y <= 1300; y += 25)
    for (const [x, w] of [
      [96, 706],
      [300, 200],
      [96, 300],
    ]) {
      const f = documentFrame({
        ...SPEKE,
        document: { passage: [x, y, w, 60], marks: [] },
      });
      assert.ok(f.sharp[0] <= f.passage.y - 48 + 1e-9, `y ${y}`);
      assert.ok(f.sharp[1] >= f.passage.y + f.passage.h + 48 - 1e-9, `y ${y}`);
      assert.equal(f.fade, 90);
      assert.equal(f.blur, 7);
    }
});

// @req REQ-186
test("1.8.0: every mark lies inside the passage", () => {
  assert.throws(
    () =>
      load(documentDemo, {
        deck: withDocument("serie-mots-02", (c) => {
          c.image.document.marks.push([700, 640, 200, 26]);
        }),
      }),
    /serie-mots-02: Repère hors du passage/
  );
});

// @req REQ-186
test("1.8.0: the underline enters over 9 frames from the start of its word, which the card's chunks say", () => {
  const seq = load(documentDemo);
  const i = at(seq, "serie-mots-02");
  const from = seq.cards[i].documentFrame;
  const word = seq.chunks
    .filter((c) => c.card === i)
    .flatMap((c) => c.words)
    .find((w) => w.text.startsWith("barbares"));
  assert.equal(from, Math.round(word.start * 30));
  assert.equal(layerOf(seq, from, i).mark, 0);
  const ramp = Array.from(
    { length: 10 },
    (_, k) => layerOf(seq, from + k, i).mark
  );
  ramp.slice(1).forEach((m, k) => assert.ok(m > ramp[k], `frame ${k + 1}`));
  assert.equal(ramp[9], 1);
  assert.throws(
    () =>
      load(documentDemo, {
        deck: withDocument("serie-mots-02", (c) => {
          c.image.document.say = "sauvages";
        }),
      }),
    /serie-mots-02: Mot de la carte absent du sous-titre \(« sauvages »\)/
  );
});

// @req REQ-186
test("1.8.0: a document card's foot is one source line; a web capture reads « Capture : » with its date", () => {
  const seq = load(documentDemo);
  assert.equal(seq.cards[0].sourceLabel, "Capture");
  assert.throws(
    () =>
      load(documentDemo, {
        deck: withDocument("serie-mots-02", (c) => {
          c.credit = "Internet Archive";
        }),
      }),
    /serie-mots-02: Une carte document n'a pas de ligne de crédit/
  );
  assert.throws(
    () =>
      load(documentDemo, {
        deck: withDocument("serie-mots-02", (c) => {
          delete c.source;
        }),
      }),
    /serie-mots-02: Une carte document porte sa source/
  );
  assert.throws(
    () =>
      load(documentDemo, {
        deck: withDocument("serie-mots-01", (c) => {
          delete c.sourceLabel;
        }),
      }),
    /serie-mots-01: Une capture web se lit « Capture : »/
  );
  assert.throws(
    () =>
      load(documentDemo, {
        deck: withDocument("serie-mots-01", (c) => {
          c.source = "Speke, page 253, 1863";
        }),
      }),
    /serie-mots-01: La capture ne dit pas sa date/
  );
  // « Capture » is a document card's label only.
  assert.throws(
    () =>
      load(teachingDemo, {
        deck: withDocument("serie-nom-famille-03", (c) => {
          c.sourceLabel = "Capture";
        }),
      }),
    /serie-nom-famille-03: sourceLabel « Capture »/
  );
});

// @req REQ-186
test("1.8.0: the formula's steps enter on their word over 9 frames; the step before fades out in place", () => {
  const seq = load(teachingDemo);
  const i = at(seq, "serie-nom-famille-03");
  const frames = seq.cards[i].formulaFrames;
  assert.equal(frames.length, 5);
  frames.slice(1).forEach((f, k) => assert.ok(f > frames[k]));
  const steps = (frame) => layerOf(seq, frame, i).steps;
  assert.deepEqual(steps(frames[0]), [0, 0, 0, 0, 0]);
  assert.deepEqual(steps(frames[0] + 9), [1, 0, 0, 0, 0]);
  const mid = steps(frames[2] + 4);
  assert.ok(mid[1] > 0 && mid[1] < 1 && mid[2] > 0 && mid[2] < 1);
  assert.deepEqual(steps(frames[4] + 9), [0, 0, 0, 0, 1]);
  // The last state holds to the end of the card.
  assert.deepEqual(steps(seq.cardStarts[i + 1] - 10), [0, 0, 0, 0, 1]);
});

// @req REQ-186
test("1.8.0: « = » only when the letters add up; « → » when the form changes", () => {
  assert.throws(
    () =>
      load(teachingDemo, {
        deck: withDocument("serie-nom-famille-03", (c) => {
          const parts = c.formula.steps[4].rows[1].parts;
          parts[0].role = "name";
          parts[3].text = "=";
        }),
      }),
    /serie-nom-famille-03: « = » entre des parties qui ne font pas le résultat : Kwa \+ ya ≠ Yao/
  );
  // A dropped part never adds up: with it the sign is « → ».
  assert.throws(
    () =>
      load(teachingDemo, {
        deck: withDocument("serie-nom-famille-03", (c) => {
          c.formula.steps[2].rows[0].parts[0].role = "dropped";
        }),
      }),
    /« = » entre des parties qui ne font pas le résultat : A \+ ya ≠ Aya/
  );
  assert.throws(
    () =>
      load(teachingDemo, {
        deck: withDocument("serie-nom-famille-03", (c) => {
          c.formula.steps[1].rows[0].parts[1].text = "×";
        }),
      }),
    /serie-nom-famille-03: un opérateur de formule est « \+ », « = » ou « → »/
  );
});

// @req REQ-186
test("1.8.0: side by side, rows enter on their words and the days on daysSay, in places kept from the start", () => {
  const seq = load(teachingDemo);
  const i = at(seq, "serie-nom-famille-04");
  const card = seq.cards[i];
  const word = (text) =>
    Math.round(
      seq.chunks
        .filter((c) => c.card === i)
        .flatMap((c) => c.words)
        .find((w) => w.text.replace(/[,.]$/u, "") === text).start * 30
    );
  assert.deepEqual(card.sbsFrames.rows, [word("Kouassi"), word("Yao")]);
  assert.equal(card.sbsFrames.days, word("plus"));
  assert.equal(card.sbsFrames.note, word("Nzema"));
  const start = layerOf(seq, seq.cardStarts[i], i);
  assert.deepEqual(start.rows, [0, 0]);
  assert.equal(start.days, 0);
  const end = layerOf(seq, seq.cardStarts[i + 1] - 10, i);
  assert.deepEqual([...end.rows, end.days, end.note], [1, 1, 1, 1]);
  for (const [change, message] of [
    [(s) => s.heads.push("Togo"), /deux colonnes/],
    [(s) => s.rows.splice(1), /deux à trois lignes/],
    [(s) => s.rows.push(s.rows[0], s.rows[1]), /deux à trois lignes/],
  ])
    assert.throws(
      () =>
        load(teachingDemo, {
          deck: withDocument("serie-nom-famille-04", (c) => change(c.sbs)),
        }),
      message
    );
});

// @req REQ-186
test("1.8.0: the week table holds its reading time at 21 characters a second, else it is split", () => {
  const seq = load(teachingDemo);
  const i = at(seq, "serie-nom-famille-06");
  // A row the voice names enters on its day; the others with the card.
  const rows = seq.cards[i].weekFrames;
  assert.equal(rows.length, 7);
  assert.ok(rows[0] > seq.cardStarts[i]);
  assert.equal(rows[1], seq.cardStarts[i]);
  assert.throws(
    () =>
      load(teachingDemo, {
        script: (beats) => {
          beats[3].chunks.forEach((c) => (c.duration = 2.2));
          return beats;
        },
      }),
    /serie-nom-famille-06: Tableau de la semaine : \d+ ms de lecture manquent à 21 caractères par seconde ; coupez-le en deux cartes, du lundi au jeudi et du vendredi au dimanche/
  );
});

// @req REQ-186
test("1.8.0: a video without these fields is timed and drawn as with 1.7.0", () => {
  const seq = load(seriesDemo);
  for (const card of seq.cards)
    for (const key of [
      "documentFrame",
      "formulaFrames",
      "sbsFrames",
      "weekFrames",
    ])
      assert.equal(card[key], undefined, `${card.id}.${key}`);
  for (let f = 0; f < seq.frames; f += 7)
    for (const l of seriesFrameState(seq, f).layers)
      for (const key of ["mark", "steps", "rows", "days", "note"])
        assert.equal(l[key], undefined, `frame ${f}: ${key}`);
});
