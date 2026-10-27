// @req REQ-186
// Narration v4 of « Zaïre », boards S8 and S9 of the canvas
// https://claude.ai/artifact/5eUf5zVorYqaSky3ZebWoT, on the model: the long
// sea route shown whole in grey, its part up to a stop lit in its ink with
// the ship sailing on it and stopping there, the camera closing in on the
// stop once the ship has arrived; the six provinces in six inks, and the
// lords linked to the king. The drawn frames are in
// series-zaire-v4.acceptance.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { flatProject } from "./series-map.mjs";
import { FPS } from "./sequence.mjs";
import { LORDS_TIMING, VOYAGE } from "./series-sequence.mjs";
import { zaireV4Demo, ROUTE_PLACES } from "./fixtures/series-zaire.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-voyage-"));
  dirs.push(dir);
  return loadSeriesVideo(zaireV4Demo(dir, options), { dir });
};
const seq = load();
const card = (s, id) => s.cards.findIndex((c) => c.id === id);
const ROUTE = card(seq, "zaire-route");
const PROVINCES = card(seq, "zaire-provinces");
const mapAt = (s, frame, i) =>
  seriesFrameState(s, frame).layers.find((l) => l.card === i)?.map;
const wordFrame = (s, i, unit) => {
  for (const c of s.chunks.filter((c) => c.card === i)) {
    const w = c.words.find(
      (w) => w.text.replace(/[,.:]+$/u, "").replace(/^l['’]/u, "") === unit
    );
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
const routeOf = (map) => map.marks.drawn.find((m) => m.kind === "route");
const shipOf = (map) => map.marks.drawings.find((d) => d.kind === "caravelle");
const STOP = ROUTE_PLACES.find((p) => p.id === "embouchure").at;

// @req REQ-186
test("the sea route draws whole in grey on its word, nothing lit and no ship yet", () => {
  const plan = seq.mapSequence.cards[ROUTE];
  const route = plan.marks.find((m) => m.kind === "route");
  const map = mapAt(seq, route.start + route.dur + 2, ROUTE);
  const drawn = routeOf(map);
  assert.ok(drawn.sea);
  assert.ok(drawn.context.dots.length > 40, "the whole route in grey");
  assert.equal(drawn.dots.length, 0, "nothing lit before the ship sails");
  assert.deepEqual(drawn.heads, [], "a voyage has its ship, not a head");
  assert.equal(shipOf(map), undefined);
});

// @req REQ-186
test("the lit part runs from the start to the stop, the ship on its tip, and stops there", () => {
  const leave = wordFrame(seq, ROUTE, "navigateurs");
  const arrive = wordFrame(seq, ROUTE, "embouchure");
  const half = Math.round((leave + arrive) / 2);
  const sailing = mapAt(seq, half, ROUTE);
  const ship = shipOf(sailing);
  assert.ok(ship, "the ship sails");
  const lit = routeOf(sailing).dots;
  assert.ok(lit.length > 5);
  // The ship rides the tip of the lit part.
  const tip = routeOf(sailing).tip;
  assert.ok(Math.hypot(ship.x - tip[0], ship.y - tip[1]) < 1);
  const arrived = mapAt(seq, arrive + 3, ROUTE);
  const at = flatProject(arrived.camera, ...STOP);
  const still = shipOf(arrived);
  assert.ok(
    Math.hypot(still.x - at[0], still.y - at[1]) < 1.5,
    `${still.x},${still.y} vs ${at}`
  );
  // It stays at the stop while the camera closes in.
  const later = mapAt(seq, arrive + 3 * FPS, ROUTE);
  const there = flatProject(later.camera, ...STOP);
  const ship2 = shipOf(later);
  assert.ok(Math.hypot(ship2.x - there[0], ship2.y - there[1]) < 1.5);
  // The lit part ends at the stop: the grey goes on to the Indies.
  assert.ok(routeOf(later).context.dots.length > routeOf(later).dots.length);
});

// @req REQ-186
test("the ship is a drawing three quarters of a drawing's height, with no label", () => {
  const arrive = wordFrame(seq, ROUTE, "embouchure");
  const map = mapAt(seq, arrive + 3, ROUTE);
  const ship = shipOf(map);
  assert.equal(ship.h, Math.round(VOYAGE.ship * map.proportion.h));
  assert.equal(ship.label, null);
});

// @req REQ-186
test("the camera closes in on the stop only once the ship has arrived", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-route", (c) => {
          c.map.moves[0].say = "Ses";
        })
      ),
    /zaire-route: un mouvement commence pendant que le navire fait route/
  );
});

// @req REQ-186
test("the stop is one of the route's stops, and the ship leaves before it arrives", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-route", (c) => {
          c.marks[0].highlight.to = [0, 0];
        })
      ),
    /zaire-route: la partie éclairée s'arrête à une étape de la route/
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-route", (c) => {
          c.marks[0].highlight.until = "Indes";
        })
      ),
    /zaire-route: le navire arrive après son départ/
  );
});

// @req REQ-186
test("only a sea route carries a ship; sea is true or absent", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-route", (c) => {
          delete c.marks[0].sea;
        })
      ),
    /zaire-route: seule une route maritime \(sea\) a un navire/
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-route", (c) => {
          c.marks[0].sea = "oui";
        })
      ),
    /zaire-route: sea est true ou absent/
  );
});

// @req REQ-186
test("the six provinces take six inks; e and f only on approximate zones", () => {
  const plan = seq.mapSequence;
  const inks = Object.values(plan.areas)
    .filter((a) => a.sequence === "kongo")
    .map((a) => a.ink)
    .sort();
  assert.deepEqual(inks, ["a", "b", "c", "d", "e", "f"]);
  for (const a of Object.values(plan.areas).filter(
    (a) => a.sequence === "kongo"
  ))
    assert.ok(a.uncertain, `${a.id} is hatched`);
  assert.throws(
    () =>
      load(
        editCard("zaire-mot", (c) => {
          c.map.areas[0].ink = "e";
        })
      ),
    /Encre e : réservée aux zones approximatives/
  );
});

// @req REQ-186
test("a lord pops on each province, one by one, each linked to the king in gold", () => {
  const plan = seq.mapSequence.cards[PROVINCES];
  const lords = plan.marks.find((m) => m.kind === "lords");
  const start = wordFrame(seq, PROVINCES, "Chacune");
  assert.equal(lords.start, start);
  const link = wordFrame(seq, PROVINCES, "nommé");
  const early = mapAt(seq, start + LORDS_TIMING.apart + 1, PROVINCES);
  const shown = (m) =>
    m.marks.drawings.filter((d) => d.lord && d.opacity > 0).length;
  assert.equal(shown(early), 2, "one by one");
  const all = mapAt(seq, link + LORDS_TIMING.link + 6, PROVINCES);
  assert.equal(shown(all), 5);
  const mark = all.marks.drawn.find((m) => m.kind === "lords");
  assert.equal(mark.links.length, 5);
  const king = flatProject(all.camera, 14.24, -6.27);
  for (const l of mark.links) {
    assert.ok(Math.hypot(l.from[0] - king[0], l.from[1] - king[1]) < 1);
    assert.equal(l.k, 1, "drawn to its lord");
  }
  // Lords belong to their mark: they never count among the three drawings,
  // and carry no label on a universal map.
  for (const d of all.marks.drawings.filter((d) => d.lord)) {
    assert.equal(d.kind, "seigneur");
    assert.equal(d.label, null);
    assert.ok(d.h < all.proportion.h);
  }
  // Before the king is named, no link.
  const before = mapAt(seq, link - 2, PROVINCES);
  assert.ok(
    before.marks.drawn
      .find((m) => m.kind === "lords")
      .links.every((l) => l.k === 0)
  );
});

// @req REQ-186
test("lords stand on areas of the card, never elsewhere", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-provinces", (c) => {
          c.marks[0].areas.push("cod-rdc");
        })
      ),
    /zaire-provinces: un seigneur se tient sur une aire de la carte \(« cod-rdc »\)/
  );
});

// @req REQ-186
test("the facts of both maps are marked while they are said", async () => {
  const { silentCheck } = await import("./series-sequence.mjs");
  const facts = silentCheck(seq).filter((f) =>
    ["zaire-route", "zaire-provinces"].includes(f.card)
  );
  assert.ok(facts.length >= 6);
  for (const f of facts) assert.ok(f.pass, JSON.stringify(f));
});
