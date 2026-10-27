// @req REQ-186
// Illustrated scenes on the parchment card, narration v4 of « Zaïre »
// (boards S10 to S13): the royal council and the crown, the nzimbu market,
// the baptism at the Kongo court, the exchanges between the two kingdoms.
// Model only: what each scene draws, when each gesture moves, and what its
// card may write. The drawn frames are in series-zaire-v4.render.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { SCENE, SCENE_KINDS, sceneMarkup } from "./series-scenes.mjs";
import { FPS } from "./sequence.mjs";
import { zaireV4Demo } from "./fixtures/series-zaire.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-scenes-"));
  dirs.push(dir);
  return loadSeriesVideo(zaireV4Demo(dir, options), { dir });
};
const seq = load();
const card = (id) => seq.cards.findIndex((c) => c.id === id);
const layerAt = (i, frame) =>
  seriesFrameState(seq, frame).layers.find((l) => l.card === i);
const wordFrame = (i, unit) => {
  for (const c of seq.chunks.filter((c) => c.card === i)) {
    const w = c.words.find((w) => w.text.replace(/[,.:]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const editCard = (id, change) => ({
  deck: (deck) => {
    change(deck.cards.find((c) => c.id === id));
    return deck;
  },
});

// @req REQ-186
test("each scene is drawn in the drawings' hand: ink line, no word, no face", () => {
  for (const kind of Object.keys(SCENE_KINDS)) {
    const svg = sceneMarkup(kind);
    assert.match(svg, /viewBox="0 0 960 720"/u, kind);
    assert.match(svg, /stroke="#23170d"/u, kind);
    assert.doesNotMatch(svg, /<text/u, `${kind} writes no word`);
    // Ids from nested drawings are prefixed, never the drawings' own.
    for (const [, id] of svg.matchAll(/ id="([^"]+)"/gu))
      assert.match(id, /^sc-/u, `${kind}: id ${id}`);
  }
  // The council: twelve members, four of them women in head wraps, and
  // the crown apart, to come down on the king.
  const council = sceneMarkup("conseil");
  assert.equal(council.match(/data-part="member-\d+"/gu).length, 12);
  assert.equal(council.match(/data-part="arm-\d+"/gu).length, 12);
  assert.equal(
    council.match(
      /Q[\d.]+,[\d.]+ [\d.]+,[\d.]+ Z" fill="#(e8b96a|c0581c|6cc3b5|e3876a)"/gu
    ).length,
    4
  );
  assert.match(council, /data-part="crown"/u);
});

// @req REQ-186
test("the council enters on its word, raises its hands, and the crown comes down on the king", () => {
  const i = card("zaire-conseil");
  const enter = wordFrame(i, "roi");
  const hands = wordFrame(i, "conseil");
  const crown = wordFrame(i, "membres");
  const before = layerAt(i, enter - 1).scene;
  assert.equal(before["member-0"].opacity, 0);
  const inScene = layerAt(i, enter + 12 * SCENE.apart + SCENE.enter).scene;
  for (let k = 0; k < 12; k++)
    assert.equal(inScene[`member-${k}`].opacity, 1, `member ${k}`);
  assert.equal(
    layerAt(i, hands - 1).scene["arm-0"].rotate,
    0,
    "hands down before their word"
  );
  const raised = layerAt(i, hands + 11 * SCENE.handsApart + SCENE.hands).scene;
  assert.equal(Math.abs(raised["arm-0"].rotate), 150);
  assert.equal(Math.abs(raised["arm-11"].rotate), 150);
  // The crown waits above, unseen, then lands on the head.
  assert.equal(layerAt(i, crown - 1).scene.crown.opacity, 0);
  const half = layerAt(i, crown + SCENE.crown / 2).scene.crown;
  assert.ok(half.y < -10, `still coming down: ${half.y}`);
  const landed = layerAt(i, crown + SCENE.crown).scene.crown;
  assert.equal(landed.y, 0);
  assert.equal(landed.opacity, 1);
});

// @req REQ-186
test("at the market the shells go to the seller, then the basket to the buyer; no gold", () => {
  const i = card("zaire-nzimbu");
  const give = wordFrame(i, "commercer");
  const receive = wordFrame(i, "coquillages");
  const atGive = layerAt(i, give).scene;
  assert.equal(atGive.shells.x, 0);
  const given = layerAt(i, give + SCENE.reach + SCENE.pass).scene;
  assert.ok(given.shells.x > 60, "the shells crossed to the seller's hand");
  assert.equal(given.basket.x, 0, "the basket waits its word");
  const received = layerAt(i, receive + SCENE.pass).scene;
  assert.ok(received.basket.x < -200, "the basket crossed to the buyer");
  assert.doesNotMatch(sceneMarkup("nzimbu"), /"or"|or\.svg|gold/u);
});

// @req REQ-186
test("at the baptism the cross enters, the vessel tips and three drops fall once on the king", () => {
  const i = card("zaire-bapteme");
  const cross = wordFrame(i, "Portugal");
  const water = wordFrame(i, "baptiser");
  assert.equal(layerAt(i, cross - 1).scene.cross.opacity, 0);
  assert.equal(layerAt(i, cross + SCENE.enter).scene.cross.opacity, 1);
  const falling = layerAt(i, water + SCENE.tilt + 4).scene;
  assert.ok(falling["drop-0"].opacity > 0);
  assert.ok(falling.vessel.rotate < 0, "the vessel tips");
  // All gone once fallen: the water does not loop.
  const done = layerAt(
    i,
    water + SCENE.tilt + 2 * SCENE.dropApart + SCENE.drop + 1
  ).scene;
  for (const k of [0, 1, 2]) assert.equal(done[`drop-${k}`].opacity, 0);
});

// @req REQ-186
test("the exchanges: two ships cross the sea, one each way, on their word", () => {
  const i = card("zaire-echanges");
  const ships = wordFrame(i, "alors");
  const before = layerAt(i, ships).scene;
  assert.equal(before["ship-out"].x, 0);
  const after = layerAt(i, ships + SCENE.ships).scene;
  assert.ok(after["ship-out"].x > 150, "towards the Kongo house, right");
  assert.ok(after["ship-back"].x < -150, "towards Portugal, left");
});

// @req REQ-186
test("a scene writes only a date in figures or a studied word, in its head", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-nzimbu", (c) => {
          c.date = "le marché";
        })
      ),
    /zaire-nzimbu: une scène porte une date en chiffres ou un mot étudié, pas « le marché »/
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-bapteme", (c) => {
          c.dateLabel = "Baptême";
        })
      ),
    /zaire-bapteme: une scène n'écrit qu'une date ou un mot étudié/
  );
  // The kicker is the chapter's, even under a date.
  const c = seq.cards[card("zaire-bapteme")];
  assert.equal(c.videoKicker, "2 · Le royaume du Kongo");
});

// @req REQ-186
test("a scene is a parchment card's whole content, with every gesture named", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-conseil", (c) => {
          delete c.scene.beats.crown;
        })
      ),
    /zaire-conseil: la scène conseil nomme le mot de chaque geste \(hands, crown\)/
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-conseil", (c) => {
          c.ground = undefined;
        })
      ),
    /zaire-conseil: une scène illustrée se joue sur le parchemin/
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-conseil", (c) => {
          c.scene.kind = "danse";
        })
      ),
    /zaire-conseil: pas de scène « danse »/
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-conseil", (c) => {
          c.scene.beats.hands = "Le";
        })
      ),
    /zaire-conseil: le geste hands \(« Le »\) vient avant l'entrée de la scène/
  );
  // The crown on the card's last word would still be coming down when the
  // card leaves.
  assert.throws(
    () =>
      load(
        editCard("zaire-conseil", (c) => {
          c.scene.beats.crown = "femmes";
        })
      ),
    /zaire-conseil: le geste crown \(« femmes »\) n'a pas le temps de finir avant la fin de la carte/
  );
});
