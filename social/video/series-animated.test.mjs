// @req REQ-186
// The animated satellite map of the series video (Cartes 1.11.0, series.md
// « The animated satellite map », handoff.md « Renderer integration of
// 1.11.0 », checks 1 to 11): the opening globe, area states, inks by
// people, route arrows, proportions, placement, moves inside a card, the
// name that changes, picture phases and the silent viewing check. Pure
// frame model on the boards' plans (fixtures/series-carte-animee.mjs) and a
// synthetic silent voice; no browser, no imagery.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { flatProject, areaStyle, MARKS } from "./series-map.mjs";
import { MAP_TIMING } from "./series-sequence.mjs";
import { globeCamera, globeGrade } from "./page.mjs";
import { FPS, IMAGERY } from "./sequence.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";
import { touaregDemo } from "./fixtures/series-touareg.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (demo, options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-animated-"));
  dirs.push(dir);
  const input = demo(dir, options);
  options.input?.(input);
  return loadSeriesVideo(input, { dir });
};
const episode = (options) => load(animatedDemo, options);
const seq = episode();
const card = (id) => seq.cards.findIndex((c) => c.id === id);
const MOSSI = card("carte-animee-mossi");
const SPLIT = card("carte-animee-1932");
const RENAME = card("carte-animee-1984");
const editCard = (id, change) => ({
  edit: (deck) => change(deck.cards.find((c) => c.id === id)),
});
const mapAt = (frame, i) => {
  const layers = seriesFrameState(seq, frame).layers;
  return (layers.find((l) => l.card === i) ?? layers.find((l) => l.map))?.map;
};
const wordFrame = (s, i, unit) => {
  for (const c of s.chunks.filter((c) => c.card === i)) {
    const w = c.words.find((w) => w.text.replace(/[,.:]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const area = (map, id) => map.areas.find((a) => a.id === id);
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// @req REQ-186
test("check 1: the opening globe passes its three keys and becomes the first view", () => {
  const view = seq.cards[0].map.view;
  const camera = (f) => mapAt(f, 0).camera;
  const keys = [
    [0, { lon: view.lon + 40, lat: 2, radius: 300 }],
    [54, { lon: view.lon + 7.5, lat: view.lat - 3, radius: 430 }],
    [132, view],
  ];
  for (const [f, k] of keys) {
    const c = camera(f);
    assert.ok(close(c.lon, k.lon) && close(c.lat, k.lat), `frame ${f}`);
    assert.ok(close(c.radius, k.radius, 1e-6), `frame ${f} radius`);
    assert.equal(c.centreY, 1010);
  }
  assert.deepEqual(globeCamera(view, 132), { ...view, centreY: 1010 });
  for (let f = 1; f <= 140; f++) {
    const [a, b] = [camera(f - 1), camera(f)];
    assert.ok(
      b.radius / a.radius <= 1.12,
      `frame ${f}: radius × ${b.radius / a.radius}`
    );
    const [x, y] = flatProject(b, a.lon, a.lat);
    assert.ok(
      Math.hypot(x - 540, y - 1010) <= 40,
      `frame ${f}: centre moves ${Math.hypot(x - 540, y - 1010)} px`
    );
  }
  // Zero speed at both ends of the camera path.
  assert.ok(close(camera(1).lon, camera(0).lon, 0.05));
  assert.ok(close(camera(131).radius, camera(132).radius, view.radius * 0.002));
  // The base grade until 3.4 s, the recede grade from 4.6 s.
  assert.equal(globeGrade(0), 0);
  assert.equal(globeGrade(102), 0);
  assert.equal(globeGrade(138), 1);
  assert.ok(globeGrade(120) > 0 && globeGrade(120) < 1);
  assert.equal(mapAt(0, 0).grade, 0);
  assert.equal(mapAt(140, 0).grade, 1);
  // Frame 0, the cover: no subtitle; the first area enters at 4.4 s or later.
  assert.equal(seriesFrameState(seq, 0).subtitle, null);
  assert.ok(seq.mapSequence.entries["bfa-burkina-faso.geojson"].start >= 132);
  // No slow zoom on a run that opens on the globe.
  assert.equal(mapAt(300, MOSSI).zoom, 1);
});

// @req REQ-186
test("check 1: an opener on the globe holds 5.5 s at least", () => {
  assert.throws(
    () =>
      episode({
        script: (beats) => {
          beats[0].chunks = [{ text: "Le nom Burkina Faso.", duration: 2.4 }];
          return beats;
        },
      }),
    /L'ouverture du globe tient 5,5 s au moins/
  );
});

// @req REQ-186
test("check 2: area states keep their table and their durations", () => {
  const lit = areaStyle(1, false);
  const ctx = areaStyle(0, false);
  assert.deepEqual(lit, {
    fill: 0.3,
    edge: 4,
    edgeOpacity: 1,
    keyline: 8,
    keylineOpacity: 0.55,
    hatch: 1,
    name: 1,
  });
  assert.deepEqual(ctx, {
    fill: 0.1,
    edge: 2.5,
    edgeOpacity: 0.6,
    keyline: 5,
    keylineOpacity: 0.33,
    hatch: 0.35,
    name: 0.6,
  });
  assert.equal(areaStyle(0, true).hatch, 0.35);
  // Mamprusi enters on « Ghana » over 21 frames, lit, and goes to context on
  // « XVe » over 15 frames.
  const ghana = seq.mapSequence.entries["bfa-mamprugu.geojson"].start;
  assert.ok(ghana >= wordFrame(seq, MOSSI, "venus"));
  assert.equal(area(mapAt(ghana, MOSSI), "mamprugu").opacity, 0);
  assert.equal(area(mapAt(ghana + 21, MOSSI), "mamprugu").opacity, 1);
  assert.ok(area(mapAt(ghana + 10, MOSSI), "mamprugu").opacity < 1);
  const xve = seq.mapSequence.events.find(
    (e) => e.file === "bfa-mamprugu.geojson" && e.to === "context"
  ).start;
  assert.equal(area(mapAt(xve, MOSSI), "mamprugu").lit, 1);
  assert.ok(close(area(mapAt(xve + 15, MOSSI), "mamprugu").lit, 0));
  assert.ok(close(area(mapAt(xve + 7, MOSSI), "mamprugu").lit, 0.5, 0.12));
  // A change of ink: two layers cross-fading over 18 frames, the outline put.
  const ink = seq.mapSequence.events.find(
    (e) => e.file === "bfa-hv32-niger.geojson" && e.to === "ink:b"
  ).start;
  const niger = (f) =>
    mapAt(f, SPLIT).areas.find((a) => a.file === "bfa-hv32-niger.geojson");
  assert.deepEqual(niger(ink).inks, [{ ink: "a", w: 1 }]);
  const mid = niger(ink + 9).inks;
  assert.deepEqual(
    mid.map((l) => l.ink),
    ["a", "b"]
  );
  assert.ok(close(mid[0].w + mid[1].w, 1));
  assert.deepEqual(niger(ink + 18).inks, [{ ink: "b", w: 1 }]);
  // Out over 15 frames.
  const out = seq.mapSequence.events.find(
    (e) => e.file === "bfa-haute-volta.geojson" && e.to === "out"
  ).start;
  assert.equal(
    mapAt(out + 15, SPLIT).areas.find(
      (a) => a.file === "bfa-haute-volta.geojson"
    ).opacity,
    0
  );
  // Two area events of a sequence are 21 frames apart unless one word moves
  // them together: « partage » splits Haute-Volta into three parts at once.
  const events = seq.mapSequence.events.toSorted((a, b) => a.start - b.start);
  for (let k = 1; k < events.length; k++)
    if (events[k].word !== events[k - 1].word)
      assert.ok(
        events[k].start - events[k - 1].start >= 21,
        `${events[k].file} ${events[k].to}`
      );
  const split = events.filter(
    (e) => e.word === events.find((x) => x.to === "out").word
  );
  assert.ok(
    split.length >= 4 && split.every((e) => e.start === split[0].start)
  );
});

// @req REQ-186
test("check 3: one ink per people for the episode, four per sequence, the colonial power in cream", () => {
  const mossi = mapAt(seq.cardStarts[SPLIT] - 2, MOSSI).areas.filter(
    (a) => a.id !== "burkina-faso"
  );
  assert.ok(mossi.every((a) => a.inks.at(-1).ink === "a"));
  assert.throws(
    () => episode({ input: (i) => (i.inks.dioula = "a") }),
    /Une encre par peuple/
  );
  assert.throws(
    () =>
      episode(
        editCard(
          "carte-animee-mossi",
          (c) => (c.map.areas[1].people = "kurumba")
        )
      ),
    /Peuple sans encre : kurumba/
  );
  assert.throws(
    () =>
      episode(
        editCard("carte-animee-mossi", (c) => (c.map.areas[1].ink = "b"))
      ),
    /people or ink, not both/
  );
  // A colonial power's arrow is cream and not counted among the inks.
  const s = episode(
    editCard("carte-animee-mossi", (c) =>
      c.map.arrows.push({
        id: "colonne",
        from: [-3.6, 14.35],
        to: [-1.7, 12.6],
        foreign: true,
        say: "XVe",
      })
    )
  );
  const f = s.mapSequence.cards[MOSSI].arrows.find((a) => a.id === "colonne");
  assert.equal(f.ink, "w");
  assert.equal(MARKS.foreign, "#f3e9da");
  const tokens = JSON.parse(
    readFileSync(
      new URL("../design-system/tokens.json", import.meta.url),
      "utf8"
    )
  );
  const named = [];
  const walk = (o) =>
    o && typeof o === "object"
      ? (o.name === "map-foreign" && named.push(o.value),
        Object.values(o).forEach(walk))
      : null;
  walk(tokens);
  assert.deepEqual(named, [MARKS.foreign]);
});

// @req REQ-186
test("check 4: an arrow draws with its head on the tip, for a time set by its length, one at a time", () => {
  const arrows = seq.mapSequence.cards[MOSSI].arrows;
  for (const a of arrows) {
    assert.equal(a.dur, Math.min(48, Math.max(24, Math.round(a.length / 20))));
    const m = mapAt(a.start + 2, MOSSI).marks.arrows.find((x) => x.id === a.id);
    assert.ok(m.k > 0 && m.k < 1);
    assert.equal(m.heads.length, 1);
    // The head sits on the visible line's tip from its first frames.
    assert.ok(
      Math.hypot(m.heads[0].x - m.tip[0], m.heads[0].y - m.tip[1]) < 1e-6
    );
  }
  for (let k = 1; k < arrows.length; k++)
    assert.ok(
      arrows[k].start >=
        Math.max(
          arrows[k - 1].start + 21,
          arrows[k - 1].start + arrows[k - 1].dur
        )
    );
  // Trace: 45 % over 15 frames on « XVe ».
  const trace = arrows[0].trace;
  const at = (f) =>
    mapAt(f, MOSSI).marks.arrows.find((x) => x.id === arrows[0].id).opacity;
  assert.equal(at(trace), 1);
  assert.ok(close(at(trace + 15), 0.45));
  // Four arrows at full strength at once are refused.
  assert.throws(
    () =>
      episode(
        editCard("carte-animee-mossi", (c) => {
          c.map.arrows.forEach((a) => delete a.trace);
          c.map.arrows.push({
            id: "quatre",
            from: [-3, 12],
            to: [-2, 13],
            people: "mossi",
            say: "Izard",
          });
        })
      ),
    /Trois flèches au plus/
  );
});

// @req REQ-186
test("check 5: the smallest lit area sets the arrow's width and the drawing's height on every frame", () => {
  const run = seq.mapSequence.runs[0];
  for (let f = seq.cardStarts[MOSSI]; f < seq.cardStarts[SPLIT] - 9; f += 3) {
    const map = mapAt(f, MOSSI);
    const lit = map.areas.filter((a) => a.lit > 0.5 && a.opacity > 0.5);
    const s = lit.length
      ? Math.min(...lit.map((a) => Math.min(a.box.w, a.box.h)))
      : Infinity;
    assert.equal(map.proportion.s, s, `frame ${f}`);
    assert.equal(
      map.proportion.w,
      Math.min(10, Math.max(5, Math.round(s / 14)))
    );
    assert.equal(
      map.proportion.h,
      Math.min(150, Math.max(100, Math.round(1.1 * s)))
    );
    for (const a of map.marks.arrows) assert.equal(a.w, map.proportion.w);
    for (const d of map.marks.drawings) assert.equal(d.h, map.proportion.h);
  }
  assert.ok(run.cards.includes(MOSSI));
  assert.throws(
    () =>
      episode(
        editCard("carte-animee-mossi", (c) => (c.map.drawings[0].h = 180))
      ),
    /map\.drawings\[0\]\.h/
  );
});

// @req REQ-186
test("check 6: every text and drawing in the map band, eight texts and two words at most", () => {
  for (const i of [MOSSI, SPLIT, RENAME])
    for (
      let f = seq.cardStarts[i];
      f < (seq.cardStarts[i + 1] ?? seq.frames) - 9;
      f += 3
    ) {
      const map = mapAt(f, i);
      if (map.moving) continue;
      const shown = map.texts.filter((t) => t.opacity > 0);
      assert.ok(
        shown.length <= MARKS.maxTexts,
        `frame ${f}: ${shown.length} texts`
      );
      assert.ok(
        shown.filter((t) => t.word).length <= MARKS.maxWords,
        `frame ${f}: words`
      );
    }
  assert.throws(
    () =>
      episode(
        editCard("carte-animee-mossi", (c) =>
          c.map.words.push({
            text: "hors de la bande",
            at: [-1.2, 6.5],
            say: "Ghana",
          })
        )
      ),
    /hors de la bande de la carte/
  );
  // Three colony names on the map when « Niger » is said, and six places.
  assert.throws(
    () =>
      episode(
        editCard("carte-animee-1932", (c) => {
          c.map.places = ["Kaya", "Dori", "Fada", "Gaoua", "Koupéla", "Pô"].map(
            (name, k) => ({
              name,
              at: [-3 + k * 0.8, 12.6 - (k % 2)],
              say: "Niger",
            })
          );
        })
      ),
    /Neuf textes sur la carte : huit au plus/
  );
  // A third word makes the oldest leave: « mooré … » is still on when
  // « les ancêtres » and then « des cavaliers » come.
  const s = episode(
    editCard("carte-animee-mossi", (c) =>
      c.map.words.push(
        { text: "les ancêtres", at: [-2.6, 12.9], say: "ancêtres" },
        { text: "des cavaliers", at: [-2.6, 13.4], say: "sont" }
      )
    )
  );
  const words = s.mapSequence.cards[MOSSI].words;
  const third = words.find((w) => w.text === "des cavaliers");
  assert.equal(words.find((w) => w.text.startsWith("mooré")).end, third.start);
  // « princesse Yennenga » then comes third, and « les ancêtres » leaves.
  assert.equal(
    words.find((w) => w.text === "les ancêtres").end,
    words.find((w) => w.text === "princesse Yennenga").start
  );
});

// @req REQ-186
test("check 7: two moves inside a card at most, 60 frames apart, a ratio of 2.5, never during an arrow", () => {
  const plan = seq.mapSequence.cards[MOSSI];
  assert.equal(plan.moves.length, 1);
  const m = plan.moves[0];
  assert.equal(m.end - m.start, 48);
  assert.equal(m.start, wordFrame(seq, MOSSI, "cavaliers"));
  const camera = (f) => mapAt(f, MOSSI).camera;
  assert.deepEqual(camera(m.start), { ...plan.view, centreY: 1010 });
  assert.ok(close(camera(m.end).radius, 6600));
  // Zero speed at both ends: the first frame barely moves.
  assert.ok(
    Math.abs(Math.log(camera(m.start + 1).radius / camera(m.start).radius)) <
      0.01
  );
  assert.ok(mapAt(m.start + 10, MOSSI).moving);
  const editMoves = (moves) =>
    editCard("carte-animee-mossi", (c) => (c.map.moves = moves));
  assert.throws(
    () =>
      episode(
        editMoves([{ say: "cavaliers", lon: -1.2, lat: 12.15, radius: 9000 }])
      ),
    /rapport de 2,5 au plus/
  );
  assert.throws(
    () =>
      episode(
        editMoves([
          { say: "Mossi", lon: -2, lat: 11.8, radius: 3500 },
          { say: "mooré", lon: -1.9, lat: 11.9, radius: 3700 },
        ])
      ),
    /60 images au moins entre deux mouvements/
  );
  assert.throws(
    () =>
      episode(
        editMoves([
          { say: "Mossi", lon: -2, lat: 11.8, radius: 3500 },
          { say: "Ghana", lon: -1.9, lat: 11.9, radius: 3700 },
          { say: "XVe", lon: -1.8, lat: 12, radius: 4000 },
        ])
      ),
    /Deux mouvements au plus/
  );
  assert.throws(
    () =>
      episode(
        editMoves([{ say: "royaumes", lon: -1.2, lat: 12.15, radius: 6600 }])
      ),
    /pendant qu'une flèche se trace/
  );
  // The 2 km file's limit holds on every frame of a move.
  assert.throws(
    () => episode({ input: (i) => delete i.mapImagery }),
    /Vue plus proche que l'imagerie vérifiée/
  );
  assert.equal(IMAGERY["bmng-2004-07-topo-bathy-500m"].width, 86400);
});

// @req REQ-186
test("check 8: the old name steps aside with its dates, the new one takes the unchanged outline", () => {
  const r = seq.mapSequence.cards[RENAME].rename;
  assert.equal(r.start, wordFrame(seq, RENAME, "nom"));
  const texts = (f) => mapAt(f, RENAME).marks.rename;
  const before = texts(r.start);
  assert.equal(before.from.dy, 0);
  assert.equal(before.from.scale, 1);
  assert.equal(before.to.opacity, 0);
  const after = texts(r.start + 40);
  assert.ok(close(after.from.dy, -118));
  assert.ok(close(after.from.scale, 0.62));
  assert.ok(close(after.from.opacity, 0.85));
  assert.equal(after.to.opacity, 1);
  assert.equal(after.dates.opacity, 1);
  assert.equal(texts(r.start + 15).to.opacity, 0);
  assert.ok(texts(r.start + 20).to.opacity > 0);
  assert.equal(texts(r.start + 24).dates.opacity, 0);
  // The outline does not move: same area, same camera, same state.
  const a = mapAt(r.start - 1, RENAME);
  const b = mapAt(r.start + 40, RENAME);
  assert.deepEqual(a.camera, b.camera);
  assert.deepEqual(area(a, "burkina-faso"), area(b, "burkina-faso"));
});

// @req REQ-186
test("check 9: a picture under 6 s between two map cards is refused", () => {
  const photo = (duration) => ({
    edit: (deck) => {
      const sample = JSON.parse(
        readFileSync(
          new URL(
            "../design-system/handoff/cards.sample.json",
            import.meta.url
          ),
          "utf8"
        )
      );
      const pic = sample.cards.find((c) => c.id === "serie-pays-02");
      deck.cards.splice(2, 0, {
        ...pic,
        id: "image-isolee",
        demo: "Démonstration : texte non validé",
      });
    },
    script: (beats) => {
      beats.splice(2, 0, {
        card: "image-isolee",
        chunks: [
          { text: "Son roi doit fuir", duration: duration / 2 },
          { text: "et meurt en exil.", duration: duration / 2 },
        ],
      });
      return beats;
    },
  });
  assert.throws(
    () => episode(photo(2.6)),
    /Image isolée de moins de 6 s entre deux cartes/
  );
  assert.doesNotThrow(() => episode(photo(6.4)));
});

// @req REQ-186
test("check 10: the silent viewing check on the Mossi plan: six facts pass; without « mooré » the first fails", () => {
  const facts = seq.silent.filter((f) => f.card === seq.cards[MOSSI].id);
  assert.equal(facts.length, 6);
  for (const f of facts) {
    assert.ok(f.pass, `${f.say}: ${f.coverage} ${f.delay}`);
    assert.ok(f.coverage >= 0.8 && f.delay <= 21);
  }
  const without = episode(
    editCard(
      "carte-animee-mossi",
      (c) =>
        (c.map.words = c.map.words.filter((w) => !w.text.startsWith("mooré")))
    )
  );
  const first = without.silent.find((f) => f.card === seq.cards[MOSSI].id);
  assert.equal(first.say, "parlent le mooré");
  assert.equal(first.pass, false);
  assert.equal(first.coverage, 0);
  assert.ok(without.warnings.some((w) => /Fait sans marque à l'écran/.test(w)));
});

// @req REQ-186
test("check 11: a map card without the new fields keeps the 1.5.0 frame model", () => {
  const touareg = load(touaregDemo);
  assert.equal(touareg.mapSequence.animated.touareg, false);
  for (let f = 0; f < touareg.frames; f += 17)
    for (const l of seriesFrameState(touareg, f).layers)
      if (l.map) {
        assert.equal(l.map.marks, undefined);
        assert.equal(l.map.grade, undefined);
      }
});
