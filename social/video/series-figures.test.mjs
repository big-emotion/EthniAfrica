// @req REQ-186
// Cartes 1.14.0, figures and facts drawn on the map (handoff.md « Renderer
// integration of 1.14.0 », checks 1 to 10) on the frame model of the boards'
// five scenes (fixtures/series-figures.mjs). No browser is needed; the drawn
// frames are checked in series-figures.acceptance.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { FIGURES, largestRemainder, formatCount } from "./series-figures.mjs";
import { MARKS } from "./series-map.mjs";
import { CUES } from "./series-cues.mjs";
import { figuresDemo } from "./fixtures/series-figures.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const fresh = () => {
  const dir = mkdtempSync(join(tmpdir(), "series-figures-"));
  dirs.push(dir);
  return dir;
};
const load = (options = {}) => {
  const dir = fresh();
  return { seq: loadSeriesVideo(figuresDemo(dir, options), { dir }), dir };
};
const { seq, dir } = load();
const cardOf = (id) => seq.cards.findIndex((c) => c.id === id);
const plan = (id) => seq.mapSequence.cards[cardOf(id)].figures;
const layer = (frame, i) =>
  seriesFrameState(seq, frame).layers.find((l) => l.card === i);
const mapAt = (frame, i) =>
  (layer(frame, i) ?? seriesFrameState(seq, frame).layers.find((l) => l.map))
    .map;
const figuresAt = (frame, i) =>
  mapAt(frame, i).marks.figures.find((f) => f.card === i);
const CHIFFRES = cardOf("fig-chiffres");
const range = (a, b, step = 1) => {
  const out = [];
  for (let f = a; f < b; f += step) out.push(f);
  return out;
};
const refuses = (options, pattern) =>
  assert.throws(() => {
    const d = fresh();
    loadSeriesVideo(figuresDemo(d, options), { dir: d });
  }, pattern);
const editCard = (id, change) => ({
  deck: (deck) => {
    change(deck.cards.find((c) => c.id === id));
    return deck;
  },
});

// @req REQ-186
test("check 1: the head's number is the count of the drawings on screen times the unit, never with the title", () => {
  const fp = plan("fig-chiffres");
  let counted = 0;
  for (const f of fp.figures.filter((x) => x.count)) {
    for (const frame of range(f.start, f.end, 3)) {
      const l = layer(frame, CHIFFRES);
      const fig = figuresAt(frame, CHIFFRES);
      const drawn =
        f.count.kind === "cascade"
          ? fig.cascade.states.length
          : fig.units.filter((u) => u.id === f.count.id).length;
      assert.equal(l.figure.id, f.id, `frame ${frame}`);
      assert.equal(l.figure.value, drawn * f.per, `frame ${frame}`);
      if (l.figure.opacity === 1) assert.equal(l.head, 0, `frame ${frame}`);
      counted++;
    }
  }
  assert.ok(counted > 50);
});

// @req REQ-186
test("check 1: the last count lands on the spoken figure, written as French numbers", () => {
  const last = (f) => layer(f.end - 1, CHIFFRES).figure;
  const [states, people, , languages] = plan("fig-chiffres").figures;
  assert.deepEqual([last(states).num, last(states).unit], ["54", "pays"]);
  assert.deepEqual(
    [last(people).num, last(people).unit],
    ["1,5", "milliard d’habitants"]
  );
  assert.deepEqual(
    [last(languages).pre, last(languages).num, last(languages).unit],
    ["plus de", "2 000", "langues"]
  );
  assert.deepEqual(formatCount(600000000, "population"), {
    num: "600",
    unit: "millions",
  });
  // The voice says 53, the map counts 54 states: refused.
  refuses(
    {
      script: (beats) => {
        const c = beats.find((b) => b.card === "fig-chiffres");
        c.chunks[1].text = "De 53 pays.";
        return beats;
      },
      ...editCard("fig-chiffres", (card) => {
        card.figures[0].say = "53";
        card.cascade.say = "53";
      }),
    },
    /Le décompte ne tombe pas sur le chiffre dit/
  );
});

// @req REQ-186
test("check 2: the 54 states swell in 45 frames, west to east; the uncounted territories stay dashed and unnamed", () => {
  const c = plan("fig-chiffres").cascade;
  assert.equal(c.states.length, 54);
  assert.equal(
    c.states.at(-1).start - c.states[0].start,
    FIGURES.cascade.frames
  );
  const lon = (id) => c.land.counted.find((s) => s.id === id).centre[0];
  for (let k = 1; k < c.states.length; k++)
    assert.ok(lon(c.states[k].id) >= lon(c.states[k - 1].id));
  assert.deepEqual(c.uncounted, ["U1", "U2"]);
  const f = figuresAt(c.states.at(-1).start + 30, CHIFFRES).cascade;
  assert.equal(f.states.length, 54);
  assert.ok(f.uncounted.every((id) => !f.states.some((s) => s.id === id)));
  // Unnamed: no text on the map names them.
  const texts = mapAt(c.states.at(-1).start + 30, CHIFFRES).texts;
  assert.ok(!texts.some((t) => /^U\d/.test(t.text)));
  // At the next fact they step back to the context fill, 40 % of their own.
  const later = figuresAt(c.context + 30, CHIFFRES).cascade;
  assert.ok(
    Math.abs(later.fill - FIGURES.cascade.fill * FIGURES.cascade.context) < 1e-9
  );
});

// @req REQ-186
test("check 3: fifteen people for 1.5 billion, each region's units on its land, the key in the foot while they show", () => {
  const u = plan("fig-chiffres").units.find((x) => x.id === "habitants");
  assert.equal(u.items.length, 15);
  assert.deepEqual(u.regions, {
    eastern: 5,
    western: 4,
    northern: 3,
    middle: 2,
    southern: 1,
  });
  const breakdown = JSON.parse(
    readFileSync(join(dir, "population-regions.json"), "utf8")
  );
  const states = JSON.parse(readFileSync(join(dir, "etats.geojson"), "utf8"));
  const inside = ([x, y], [ring]) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        c = !c;
    }
    return c;
  };
  for (const it of u.items) {
    const land = breakdown.regions[it.region].states.map(
      (id) => states.features.find((f) => f.properties.id === id).geometry
    );
    assert.ok(
      land.some((g) => inside(it.at, g.coordinates)),
      `${it.region} ${it.at}`
    );
  }
  const languages = plan("fig-chiffres").units.find((x) => x.id === "langues");
  assert.equal(languages.items.length, 20);
  assert.deepEqual(
    largestRemainder([960, 736, 471, 111, 58], 20),
    [8, 6, 4, 1, 1]
  );
  // Units pop 3 frames apart (bubbles 1.5), west to east.
  assert.equal(u.items[1].start - u.items[0].start, FIGURES.person.step);
  const key = (frame) =>
    figuresAt(frame, CHIFFRES).unitKeys.find((k) => k.id === "habitants");
  assert.ok(key(u.items.at(-1).start + 5).opacity > 0.99);
  assert.equal(key(u.out + 20).opacity, 0);
  // The refusals.
  refuses(
    editCard("fig-chiffres", (card) => (card.units[0].value = 1550000000)),
    /Unité qui ne divise pas le chiffre/
  );
});

// @req REQ-186
test("check 4: a row of five, the third lit on its word with its ring", () => {
  const r = plan("fig-chiffres").row;
  assert.equal(r.items.length, 5);
  const row = figuresAt(r.light + FIGURES.row.light + 1, CHIFFRES).row;
  assert.deepEqual(
    row.items.map((it) => it.colour),
    [0, 0, 1, 0, 0]
  );
  assert.equal(row.items[2].ring, 1);
  assert.deepEqual(
    row.items.map((it) => it.x),
    [308, 424, 540, 656, 772]
  );
  assert.ok(row.items.every((it) => it.y === 1240 && it.h === 118));
  const before = figuresAt(r.light - 1, CHIFFRES).row;
  assert.ok(before.items.every((it) => it.colour === 0));
});

// @req REQ-186
test("check 5: the glasses fill to 20/60 and 31/60, the age on the waterline", () => {
  const [africa, world] = plan("fig-chiffres").gauges;
  for (const [g, level] of [
    [africa, 20 / 60],
    [world, 31 / 60],
  ]) {
    const at = (frame) =>
      figuresAt(frame, CHIFFRES).gauges.find((x) => x.id === g.id);
    assert.ok(at(g.start + 1).fill < 0.15);
    const full = at(g.start + FIGURES.gauge.fill);
    assert.equal(full.fill, 1);
    assert.ok(
      Math.abs(full.waterline - (g.top + g.height * (1 - level))) < 1e-9
    );
    assert.equal(full.target, full.waterline);
    // The age is written on the waterline, inside the glass.
    const label = mapAt(g.start + FIGURES.gauge.fill + 9, CHIFFRES).texts.find(
      (t) => t.text === g.label
    );
    assert.equal(label.box.y + label.box.h, full.target + 4);
    assert.ok(label.box.y >= g.top);
  }
  assert.equal(africa.ticks.join(), "0,20,40,60");
});

// @req REQ-186
test("check 6: every letter on its path, inside the map band; a lettering too long for its path is refused", () => {
  for (const id of ["fig-lectures", "fig-noms"]) {
    const i = cardOf(id);
    const cp = seq.mapSequence.cards[i];
    for (const l of cp.figures.letterings) {
      const f = figuresAt(l.start + 40, i).letterings.find(
        (x) => x.text === l.text
      );
      assert.ok(
        f.box.y >= MARKS.band.y[0] && f.box.y + f.box.h <= MARKS.band.y[1],
        l.text
      );
      assert.ok(
        f.letters.every((x) => x === 1),
        l.text
      );
    }
  }
  refuses(
    editCard("fig-noms", (card) => {
      card.letterings[3].text = "KEMETKEMETKEMET";
    }),
    /Phrase sur la carte|déborde de son tracé/
  );
  refuses(
    editCard("fig-noms", (card) => (card.letterings[0].size = 80)),
    /un nom posé tient entre 50 et 64 px/
  );
});

// @req REQ-186
test("check 7: a stamp holds two words of the narration at most; « ? » only where it says « inconnue »", () => {
  const s = plan("fig-noms").stamps[0];
  assert.equal(s.text, "sans source");
  refuses(
    editCard(
      "fig-noms",
      (card) => (card.stamps[0].text = "sans aucune source")
    ),
    /Tampon : deux mots au plus/
  );
  refuses(
    editCard("fig-noms", (card) => (card.stamps[0].text = "faux")),
    /Tampon hors de la narration/
  );
  refuses(
    editCard("fig-noms", (card) => (card.stamps[0].text = "?")),
    /Tampon hors de la narration/
  );
  // Landing from 140 % in 5 frames.
  const i = cardOf("fig-noms");
  const at = (frame) => figuresAt(frame, i).stamps[0];
  assert.ok(at(s.start + 1).scale > 1.1);
  assert.equal(at(s.start + FIGURES.stamp.frames).scale, 1);
});

// @req REQ-186
test("check 8: no phrase on any map, eight texts at most", () => {
  for (const [i, cp] of Object.entries(seq.mapSequence.cards))
    for (const frame of range(cp.start, cp.end, 3)) {
      const shown = mapAt(frame, Number(i)).texts.filter(
        (t) => t.opacity > 0 && !t.leaving
      );
      assert.ok(shown.length <= MARKS.maxTexts, `${seq.cards[i].id} ${frame}`);
    }
  for (const [text, kind] of [
    ["la moitié a moins de 20 ans", undefined],
    ["« Libye » : le nom grec", undefined],
    ["origine inconnue", "phrase"],
    ["l'Afrique désigne", "name"],
  ])
    refuses(
      editCard("fig-livre", (card) =>
        card.map.words.push({ text, kind, at: [0, 33], say: "Léon" })
      ),
      /Phrase sur la carte : la dessiner, ou la mettre dans le bandeau/
    );
});

// @req REQ-186
test("check 9: the silent viewing check passes every fact of the five cards", () => {
  const facts = seq.silent.filter((f) => f.card.startsWith("fig-"));
  assert.equal(facts.length, 17);
  for (const f of facts)
    assert.ok(f.pass, `${f.card}: ${f.say} ${f.coverage} ${f.delay}`);
});

// @req REQ-186
test("check 9: the new marks count from their own moments", () => {
  const fp = plan("fig-chiffres");
  const first = fp.units[0].items[0].start;
  const fact = seq.silent.find((f) => f.shows.includes("units:habitants"));
  assert.ok(fact.delay <= 21);
  // The world's glass marks its fact from its first frame of fill.
  const world = seq.silent.find((f) => f.shows.includes("gauge:age-monde"));
  assert.ok(world.delay <= 12);
  assert.ok(first >= fp.figures[1].start);
});

// @req REQ-186
test("the cues: a tick per state, 25 a second at most, an impact when the count lands", () => {
  const c = plan("fig-chiffres").cascade;
  const ticks = seq.cues.filter(
    (q) =>
      q.family === "tick" &&
      q.frame >= c.states[0].start &&
      q.frame <= c.states.at(-1).start
  );
  assert.ok(ticks.length >= 20);
  for (let k = 1; k < ticks.length; k++)
    assert.ok(ticks[k].frame - ticks[k - 1].frame >= 30 / 25 - 1e-9);
  assert.ok(
    seq.cues.some(
      (q) =>
        q.family === CUES.impact.family && q.frame === c.states.at(-1).start + 1
    )
  );
});

// @req REQ-186
test("check 10: a card without the new fields draws no figure and keeps its head", () => {
  const d = fresh();
  const s = loadSeriesVideo(animatedDemo(d), { dir: d });
  for (const frame of range(0, s.frames, 30)) {
    const st = seriesFrameState(s, frame);
    for (const l of st.layers) {
      assert.equal(l.figure, undefined);
      if (l.map?.marks) assert.deepEqual(l.map.marks.figures, []);
    }
  }
});

// @req REQ-186
test("the figures' data are the piece's, each with its source", () => {
  refuses(
    editCard(
      "fig-chiffres",
      (card) => (card.cascade.states = "absent.geojson")
    ),
    /fichier illisible absent.geojson/
  );
  refuses(
    editCard("fig-chiffres", (card) => (card.gauges[0].shape = "africa")),
    /un verre a la forme du monde ou d'une aire/
  );
  refuses(
    editCard("fig-chiffres", (card) => (card.units[0].colour = "red")),
    /units.colour n'est pas un champ des figures sur la carte/
  );
});
