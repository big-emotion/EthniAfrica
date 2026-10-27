// @req REQ-186
// Narration v4 of « Zaïre » drawn in the pinned Chromium, boards S10 to S14:
// the four illustrated scenes on parchment at their gestures, and the
// enriched chapter card. The map cards stand in as pictures here, so no
// imagery is needed (their frames are in series-zaire-v4.acceptance.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkSeriesLayout, loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { SCENE } from "./series-scenes.mjs";
import { FPS } from "./sequence.mjs";
import { zaireV4Demo } from "./fixtures/series-zaire.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-zaire-v4-render-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));
// The three map cards become pictures, the opener's photograph.
const seq = loadSeriesVideo(
  zaireV4Demo(dir, {
    deck: (deck) => {
      const image = structuredClone(deck.cards[0].image);
      const credit = deck.cards[0].credit;
      for (const c of deck.cards.filter((c) => c.type === "map")) {
        c.type = "explanation";
        delete c.map;
        delete c.marks;
        Object.assign(c, { image, credit });
      }
      return deck;
    },
  }),
  { dir }
);
const at = (id) => seq.cards.findIndex((c) => c.id === id);
const wordFrame = (i, unit) => {
  for (const c of seq.chunks.filter((c) => c.card === i)) {
    const w = c.words.find((w) => w.text.replace(/[,.:]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const keyFrames = {
  council: wordFrame(at("zaire-conseil"), "membres") + SCENE.crown + 1,
  market: wordFrame(at("zaire-nzimbu"), "coquillages") + SCENE.pass,
  baptism: wordFrame(at("zaire-bapteme"), "baptiser") + SCENE.tilt + 5,
  exchanges: wordFrame(at("zaire-echanges"), "alors") + SCENE.ships / 2,
  chapter: seq.cardStarts[at("chapitre-2")] + 66,
};
let frames;
// @req REQ-186
test.before(async () => {
  frames = await renderSeriesFrames(seq, Object.values(keyFrames), {
    diagnose: true,
  });
});
const frameOf = (name) => frames.find((f) => f.frame === keyFrames[name]);
const flat = (t) => t.replace(/\s+/gu, " ");

// @req REQ-186
test("every frame of the scenes and the chapter card keeps its texts in their bands", () => {
  for (const f of frames) {
    assert.deepEqual(
      checkSeriesLayout(f.boxes, { demo: true }),
      [],
      `frame ${f.frame}`
    );
  }
});

// @req REQ-186
test("the scenes are drawn on the parchment, inside the card's content band", () => {
  for (const [name, kind] of [
    ["council", "conseil"],
    ["market", "nzimbu"],
    ["baptism", "bapteme"],
    ["exchanges", "echanges"],
  ]) {
    const f = frameOf(name);
    const card = f.parchment.find((p) => p.scene?.kind === kind);
    assert.ok(card, `${name}: no ${kind} scene drawn`);
    const { scene } = card;
    assert.ok(scene.y >= 318 && scene.y + scene.h <= 1300, `${name} y`);
    assert.ok(
      scene.parts.some((p) => p.opacity > 0.9),
      `${name}: parts in`
    );
    // The parchment's own inks, no outline.
    for (const t of card.texts) assert.equal(t.stroke, "0px", t.text);
  }
  // The crown has landed on the king; a drop is falling at the baptism.
  const council = frameOf("council").parchment.find((p) => p.scene).scene;
  const crown = council.parts.find((p) => p.id === "crown");
  assert.equal(crown.opacity, 1);
  assert.match(crown.transform, /^translate\(0\.00 0\.00\)/u);
  const baptism = frameOf("baptism").parchment.find((p) => p.scene).scene;
  assert.ok(baptism.parts.some((p) => /^drop-/u.test(p.id) && p.opacity > 0));
  // The head writes only the date or the studied word.
  assert.match(flat(frameOf("baptism").text), /1491/u);
  assert.match(flat(frameOf("market").text), /nzimbu/u);
});

// @req REQ-186
test("the enriched chapter card: the video's title, the chapters before and after, n sur N", () => {
  const f = frameOf("chapter");
  const text = flat(f.text);
  assert.match(text, /D’où vient le nom Zaïre|D'où vient le nom Zaïre/u);
  assert.match(text, /1 · La route des Indes/u);
  assert.match(text, /2 sur 3/u);
  assert.match(text, /Le royaume du Kongo/u);
  assert.match(text, /3 · Le nom du fleuve/u);
  const near = f.boxes.filter((b) => b.kind === "chapter-near");
  const title = f.boxes.find((b) => b.kind === "chapter-title");
  const count = f.boxes.find((b) => b.kind === "chapter-count");
  assert.equal(near.length, 2);
  const [before, after] = near.sort((a, b) => a.y - b.y);
  assert.ok(before.y + before.h <= count.y, "the chapter before over n sur N");
  assert.ok(after.y >= title.y + title.h, "the chapter after under the title");
});
