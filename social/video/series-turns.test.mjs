// @req REQ-186
// Cartes 1.13.0, the story's turns on the frame model (handoff.md « Renderer
// integration of 1.13.0 », steps 4 to 9, checks 4 to 10), on the boards'
// scenes (fixtures/series-motion.mjs): the whip zoom, the warm flash and the
// era map, the date counter, the drawn marks, the flags and the headline
// band. series-motion.render.test.mjs checks the drawing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { DUR } from "./series-motion.mjs";
import { counterTicks, counterValue } from "./series-turns.mjs";
import { FPS } from "./sequence.mjs";
import { motionDemo, wordDemo } from "./fixtures/series-motion.mjs";

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (demo, options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-turns-"));
  dirs.push(dir);
  return loadSeriesVideo(demo(dir, options), { dir });
};
const motion = load(motionDemo, { recap: false });
const at = (s, id) => s.cards.findIndex((c) => c.id === id);
const mapAt = (s, frame) =>
  seriesFrameState(s, frame).layers.find((l) => l.map && l.opacity > 0)?.map ??
  seriesFrameState(s, frame).layers.find((l) => l.map).map;
const wordFrame = (s, i, unit) => {
  for (const c of s.chunks.filter((c) => c.card === i)) {
    const w = c.words.find(
      (w) => w.text.replace(/^l['’]/u, "").replace(/[,.:;]+$/u, "") === unit
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
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const PARIS = at(motion, "motion-paris");

// Check 4: the whip zoom.
// @req REQ-186
test("check 4: the whip zoom is one camera path of 21 frames, out to radius 900 and in, zero speed at both ends", () => {
  const whip = motion.mapSequence.cards[PARIS].moves.find((m) => m.whip);
  assert.ok(whip, "a whip on the Paris card");
  assert.equal(whip.start, wordFrame(motion, PARIS, "Paris"));
  assert.equal(whip.end - whip.start, DUR.whip);
  // The whip runs its own path, unpushed; the landing pushes from there.
  const rest = (f) => mapAt(motion, f).camera;
  // Out to the globe, across, in.
  assert.ok(close(rest(whip.start + 7).radius, 900, 1e-6));
  assert.ok(close(rest(whip.start + 14).radius, 900, 1e-6));
  assert.ok(close(rest(whip.end).radius, 3200, 1e-6));
  assert.ok(
    close(rest(whip.end).lat, 48.86) && close(rest(whip.end).lon, 2.35)
  );
  // Zero speed at both ends.
  const step = (f) =>
    Math.abs(rest(f + 1).lat - rest(f).lat) +
    Math.abs(Math.log(rest(f + 1).radius / rest(f).radius));
  // Zero speed at both ends: the first and last frames move a fifth of the
  // fastest frame at most.
  let fastest = 0;
  for (let f = whip.start; f < whip.end; f++)
    fastest = Math.max(fastest, step(f));
  assert.ok(step(whip.start) < fastest / 5, `first step ${step(whip.start)}`);
  assert.ok(
    step(whip.end - 1) < fastest / 5,
    `last step ${step(whip.end - 1)}`
  );
  assert.ok(mapAt(motion, whip.start + 10).whip.zoom >= 0);
});

// @req REQ-186
test("check 4: no mark is drawn during the whip; marks leave in the 6 frames before it", () => {
  const whip = motion.mapSequence.cards[PARIS].moves.find((m) => m.whip);
  const before = mapAt(motion, whip.start - DUR.exit - 1);
  assert.ok(before.areas.some((a) => a.opacity > 0.9));
  for (let f = whip.start; f < whip.end; f++) {
    const map = mapAt(motion, f);
    assert.ok(
      map.areas.every((a) => a.opacity === 0),
      `frame ${f}: an area shows`
    );
    assert.ok(
      map.names.every((n) => n.opacity === 0),
      `frame ${f}: a name`
    );
    for (const key of ["words", "places", "drawings", "arrows", "pins"])
      assert.ok(
        (map.marks[key] ?? []).every((m) => !(m.opacity > 0)),
        `frame ${f}: ${key}`
      );
  }
  // The new place's marks enter after it lands.
  const after = mapAt(motion, whip.end + 12);
  assert.ok(
    after.marks.places.some((p) => p.name === "Paris" && p.opacity > 0)
  );
});

// @req REQ-186
test("check 4: a whip between two places under 2,000 km apart, or within 4 s of another, is refused", () => {
  assert.throws(
    () =>
      load(motionDemo, {
        recap: false,
        ...editCard("motion-paris", (c) => {
          c.whip.to = { lon: -4.3, lat: 11.18, r: 4400 };
        }),
      }),
    /Lancer rapide entre deux lieux proches : un mouvement de caméra suffit/
  );
  assert.throws(
    () =>
      load(motionDemo, {
        recap: false,
        // The way out on the Paris card's last word, the way back on the
        // next card's first sentence: under 4 s apart.
        ...editCard("motion-paris", (c) => (c.whip.say = "colonie")),
      }),
    /Deux lancers rapides à moins de 4 s/
  );
});

const words = load(wordDemo);
const Y1970 = at(motion, "motion-1970");
const Y1925 = at(motion, "motion-1925");
const TODAY = at(motion, "motion-aujourdhui");
const layerOf = (s, frame, i) =>
  seriesFrameState(s, frame).layers.find((l) => l.card === i);

// Check 5: the flash.
// @req REQ-186
test("check 5: one warm flash for each turn between today and a past date, peaking at 92 % on its frame 4", () => {
  const { flashes } = motion.eras;
  // To 1970 on paper, back to today on the satellite; 1970 to 1925 stays on
  // paper, under the counter alone.
  assert.deepEqual(
    flashes.map((f) => [motion.cards[f.card].id, f.paper]),
    [
      ["motion-1970", true],
      ["motion-aujourdhui", false],
    ]
  );
  const f = flashes[0].start;
  assert.equal(f, wordFrame(motion, Y1970, "1970"));
  const flash = (k) => seriesFrameState(motion, f + k).flash ?? 0;
  assert.equal(flash(-1), 0);
  assert.ok(close(flash(4), 0.92));
  for (let k = 0; k < 15; k++) assert.ok(flash(k) <= 0.92 + 1e-9);
  assert.equal(flash(15), 0);
  // The paper rises between frames 3 and 9, the inks turn at frame 4.
  const map = (k) => layerOf(motion, f + k, Y1970).map;
  assert.equal(map(3).paper, 0);
  assert.ok(map(6).paper > 0 && map(6).paper < 1);
  assert.equal(map(9).paper, 1);
  assert.equal(map(3).paperInks, false);
  assert.equal(map(4).paperInks, true);
  // The band, the signature and the subtitles take the Parchemin inks.
  assert.equal(seriesFrameState(motion, f + 4).parchment, 1);
  assert.equal(seriesFrameState(motion, f + 30).subtitle?.parchment, true);
  // Never two within 2 s: back to today on the next card, 1925 said early.
  assert.throws(
    () =>
      load(motionDemo, {
        recap: false,
        deck: (deck) => {
          const c = deck.cards.find((x) => x.id === "motion-1925");
          c.era.date = 2026;
          c.era.say = "Avant";
          c.flags = [];
          deck.cards.find((x) => x.id === "motion-1970").era.say = "Volta";
          deck.cards.find((x) => x.id === "motion-aujourdhui").flags.shift();
          return deck;
        },
      }),
    /Deux éclairs à moins de 2 s/
  );
});

// Check 7: the counter.
// @req REQ-186
test("check 7: the counter rolls on ease-land from the date before to the era's, lands on it, one tick a year, 25 a second at most", () => {
  const era = motion.eras.cards[Y1970];
  assert.deepEqual([era.from, era.to, era.frames], [2026, 1970, 48]);
  const counter = (k) => layerOf(motion, era.start + k, Y1970).counter;
  assert.equal(counter(0).year, 2026);
  assert.equal(counter(48).year, 1970);
  // Fast first, slow as it lands.
  assert.ok(2026 - counter(12).value > (counter(36).value - 1970) * 3);
  // The digits never change in number, so they never shift.
  for (let k = 0; k <= 60; k += 3) assert.equal(counter(k).digits, 4);
  // The 4 % settle, then the label.
  assert.ok(counter(51).settle > 1.03);
  assert.equal(counter(60).settle, 1);
  assert.equal(counter(47).labelOpacity, 0);
  assert.equal(counter(48 + 9).labelOpacity, 1);
  // The head gives way to the counter; the 1925 card continues it.
  assert.equal(counter(10).head, 0);
  assert.equal(motion.eras.cards[Y1925].continued, true);
  assert.equal(
    layerOf(motion, motion.cardStarts[Y1925], Y1925).counter.year,
    1970
  );
  const ticks = counterTicks(era);
  assert.ok(ticks.length <= Math.ceil((era.frames / 30) * 25) + 1);
  for (let k = 1; k < ticks.length; k++)
    assert.ok(ticks[k] - ticks[k - 1] >= 1.2);
  assert.equal(motion.eras.cards[TODAY].to, 2026);
});

// Check 9: flags.
// @req REQ-186
test("check 9: a flag follows the counter: Burkina Faso's leaves as it passes 1984, Upper Volta's comes in and stays", () => {
  const cp = motion.mapSequence.cards[Y1970];
  const [bfa, hv] = cp.flags;
  assert.equal(bfa.flag, "bfa");
  assert.equal(hv.flag, "hv");
  const era = motion.eras.cards[Y1970];
  // Burkina Faso's flag from its word to the frame the counter passes 1984.
  assert.equal(bfa.shows.length, 1);
  const passes1984 = bfa.shows[0][1] + 1;
  assert.ok(counterValue(era, passes1984) < 1983.5);
  assert.ok(counterValue(era, passes1984 - 1) >= 1983.5);
  // Upper Volta's from its own word, to the end of the card.
  assert.equal(hv.shows.at(-1)[1], Infinity);
  assert.equal(hv.shows[0][0], wordFrame(motion, Y1970, "noir"));
  const area = (f) =>
    layerOf(motion, f, Y1970).map.areas.find((a) => a.id === "burkina-faso");
  assert.equal(area(hv.shows[0][0] + 18).flag, 1);
});

// @req REQ-186
test("check 9: a flag on a people, on a colony or out of its state's period is refused", () => {
  const flagOn = (area) =>
    editCard("motion-1925", (c) => {
      c.map.areas.push({
        file: "bfa-mossi-ouagadougou.geojson",
        id: "mossi",
        name: "Royaume de Ouagadougou",
        ink: "b",
      });
      c.flags[0].area = area;
    });
  assert.throws(
    () => load(motionDemo, { recap: false, ...flagOn("mossi") }),
    /Drapeau sur une aire qui n'est pas un État/
  );
  assert.throws(
    () => load(motionDemo, { recap: false, ...flagOn("haute-volta") }),
    /Drapeau sur une aire qui n'est pas un État/
  );
  assert.throws(
    () =>
      load(motionDemo, {
        recap: false,
        ...editCard(
          "motion-1925",
          (c) =>
            (c.flags[0] = {
              area: "burkina-faso",
              flag: "bfa",
              from: "1984-08-04",
              say: "Haute-Volta",
            })
        ),
      }),
    /Drapeau hors de la période de l'État/
  );
  assert.throws(
    () =>
      load(motionDemo, {
        recap: false,
        ...editCard("motion-pop", (c) => {
          c.flags = [
            {
              area: "burkina-faso",
              flag: "hv",
              from: "1959-12-09",
              to: "1984-08-04",
              say: "capitale",
            },
          ];
        }),
      }),
    /Drapeau hors de la période de l'État/
  );
});

// The operator's answer 6 (21 October 2026): a flag's state is « named by
// the voice ». Printed on the card is not enough: the Burkina Faso episode's
// 1984 card shows « BURKINA FASO » as its rename while the voice says « un
// nouveau nom », and takes no flag.
// @req REQ-186
test("check 9: a flag's state must be named by the voice, printed on the card is not enough", () => {
  const flagOnPop = editCard("motion-pop", (c) => {
    c.flags = [
      { area: "burkina-faso", flag: "bfa", from: "1984-08-04", say: "hommes" },
    ];
    c.map.words.push({ text: "BURKINA FASO", at: [-1.57, 14.2], say: "nom" });
  });
  assert.throws(
    () => load(motionDemo, { recap: false, ...flagOnPop }),
    /Drapeau d'un État que la voix ne nomme pas \(« Burkina Faso »\)/
  );
});

// Check 8: drawn marks.
const TRAITS = at(words, "motion-traits");
// @req REQ-186
test("check 8: drawn marks take their widths from the arrow width, three at most on screen", () => {
  const cp = words.mapSequence.cards[TRAITS];
  const river = cp.marks.find((m) => m.kind === "river");
  const map = layerOf(words, river.start + 20, TRAITS).map;
  const W = map.proportion.w;
  const drawn = map.marks.drawn.find((m) => m.kind === "river");
  assert.ok(close(drawn.widths.core, (5 * W) / 7));
  assert.ok(close(drawn.widths.keyline, (9 * W) / 7));
  // Drawn from its source: part of it at frame 20, all of it once drawn.
  assert.ok(drawn.k > 0 && drawn.k < 1 && drawn.tip);
  const route = cp.marks.find((m) => m.kind === "route");
  const r = layerOf(
    words,
    route.start + route.dur,
    TRAITS
  ).map.marks.drawn.find((m) => m.kind === "route");
  assert.equal(r.k, 1);
  assert.ok(close(r.r, W / 2));
  for (let k = 1; k < r.dots.length; k++)
    assert.ok(
      Math.hypot(
        r.dots[k][0] - r.dots[k - 1][0],
        r.dots[k][1] - r.dots[k - 1][1]
      ) <=
        2.4 * W + 1
    );
  for (let f = cp.start; f < cp.end; f += 3)
    assert.ok(layerOf(words, f, TRAITS).map.marks.drawn.length <= 3);
  // A fourth mark at once is refused.
  assert.throws(
    () =>
      load(wordDemo, {
        ...editCard("motion-traits", (c) => {
          for (const m of c.marks) delete m.until;
        }),
      }),
    /Trop de traits à la fois/
  );
});

// @req REQ-186
test("check 8: a circle round an area, a cross on a people are refused", () => {
  assert.throws(
    () =>
      load(wordDemo, {
        ...editCard(
          "motion-traits",
          (c) => (c.marks.find((m) => m.kind === "circle").at = "burkina-faso")
        ),
      }),
    /Un cercle entoure un lieu, jamais une aire/
  );
  assert.throws(
    () =>
      load(wordDemo, {
        edit: (input) => (input.inks = { mossi: "b" }),
        ...editCard(
          "motion-traits",
          (c) => (c.marks.find((m) => m.kind === "cross").at = "mossi")
        ),
      }),
    /Une croix ne marque jamais un peuple/
  );
});

// Check 10: the headline band.
const BANDEAU = at(words, "motion-bandeau");
// @req REQ-186
test("check 10: the headline band slides in on its word, the head steps aside, its words are the voice's", () => {
  const band = words.headlines.find((b) => b.card === BANDEAU);
  assert.equal(band.start, wordFrame(words, BANDEAU, "choisi"));
  const l = (k) => layerOf(words, band.start + k, BANDEAU);
  assert.equal(l(-6).head, 1);
  assert.equal(l(0).head, 0);
  assert.ok(l(0).headline.lines[0].x < -1000);
  assert.ok(l(6).headline.lines[0].blur > 0);
  assert.equal(l(12).headline.lines[0].x, 0);
  assert.equal(l(12).headline.lines[0].blur, 0);
  assert.equal(l(14).headline.lines[1].x, 0);
  assert.equal(l(40).headline.lines[1].keyScale, 1);
  assert.throws(
    () =>
      load(wordDemo, {
        ...editCard(
          "motion-bandeau",
          (c) => (c.headline.lines = ["Un nom inventé", "en [[1984]]"])
        ),
      }),
    /Bandeau de titre : « inventé » n'est pas dit par la voix/
  );
  assert.throws(
    () =>
      load(wordDemo, {
        deck: (deck) => {
          deck.cards.find((c) => c.id === "motion-traits").headline = {
            lines: ["Le Niger"],
            say: "Niger",
            until: "Binger",
          };
          deck.cards.find((c) => c.id === "motion-langues").headline = {
            lines: ["Trois langues"],
            say: "trois",
            until: "nom",
          };
          return deck;
        },
      }),
    /Bandeau de titre : deux par vidéo/
  );
  assert.throws(
    () =>
      load(motionDemo, {
        recap: false,
        ...editCard(
          "motion-1970",
          (c) =>
            (c.headline = { lines: ["En 1970"], say: "1970", until: "noir" })
        ),
      }),
    /Bandeau de titre : jamais avec le compteur/
  );
});
