// @req REQ-186
// Teaching cards in motion and the parchment card of the series video
// (Cartes 1.12.0, series.md « Teaching cards in motion and the parchment
// card », handoff.md « Renderer integration of 1.12.0 », checks 1 to 7): the
// frame model, on the demonstration of fixtures/series-teaching.mjs. No
// browser is needed; series-teaching.render.test.mjs checks the drawing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { TEACHING } from "./series-teaching.mjs";
import { groundMotion } from "../series-idents/ground.mjs";
import { teachingCardsDemo } from "./fixtures/series-teaching.mjs";
import { teachingDemo } from "./fixtures/series-documents.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dirs = [];
const load = (demo, options) => {
  const dir = mkdtempSync(join(tmpdir(), "series-teaching-"));
  dirs.push(dir);
  return loadSeriesVideo(demo(dir, options), { dir });
};
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const seq = load(teachingCardsDemo);
const at = (s, id) => s.cards.findIndex((c) => c.id === id);
const layerOf = (s, frame, card) =>
  seriesFrameState(s, frame).layers.find((l) => l.card === card);
const word = (s, i, text) =>
  Math.round(
    s.chunks
      .filter((c) => c.card === i)
      .flatMap((c) => c.words)
      .find(
        (w) =>
          w.text.replace(/^l['’]/u, "").replace(/[\s\p{P}]+$/u, "") === text
      ).start * 30
  );
const change = (id, edit) => ({
  deck: (deck) => {
    edit(deck.cards.find((c) => c.id === id));
    return deck;
  },
});
const WEEK = at(seq, "serie-nom-famille-02");
const FORMULA = at(seq, "serie-nom-famille-03");
const PAIR = at(seq, "serie-nom-famille-04");
const KWA = at(seq, "serie-nom-famille-05");
const LAW = at(seq, "serie-nom-famille-06");
const close = (a, b) => Math.abs(a - b) < 1e-9;

// Check 1: the ground.
// @req REQ-186
test("1.12.0: a parchment card moves the idents' grain and glow on the clock of its run of parchment cards", () => {
  const runStart = seq.cardStarts[WEEK] - 9 + 1;
  for (const f of [
    seq.cardStarts[WEEK],
    seq.cardStarts[FORMULA] + 40,
    seq.cardStarts[LAW] + 3,
  ]) {
    const card = seriesFrameState(seq, f).layers.find((l) => l.ground);
    const expected = groundMotion((f - runStart) / 30);
    assert.deepEqual(card.ground, expected, `frame ${f}`);
  }
  // The idents' own numbers: grain ((f × 73) mod 256 − 128, (f × 151) mod
  // 256 − 128), glow (60 sin 0.35 t, 50 cos 0.27 t).
  const m = groundMotion(2);
  assert.deepEqual(m.grain, [
    ((60 * 73) % 256) - 128,
    ((60 * 151) % 256) - 128,
  ]);
  assert.ok(
    close(m.glow[0], 60 * Math.sin(0.7)) &&
      close(m.glow[1], 50 * Math.cos(0.54))
  );
  // A photograph has no ground.
  assert.equal(layerOf(seq, 10, 0).ground, undefined);
});

// @req REQ-186
test("1.12.0: two parchment cards in a row keep their ground; only the head and content change", () => {
  const f = seq.cardStarts[FORMULA] - 4;
  const [out, inc] = seriesFrameState(seq, f).layers;
  assert.equal(out.card, WEEK);
  assert.equal(inc.card, FORMULA);
  assert.equal(out.opacity, 1);
  assert.equal(inc.opacity, 0);
  assert.deepEqual(out.ground, inc.ground);
  assert.ok(out.text < 1 || inc.text > 0);
});

// @req REQ-186
test("1.12.0: the band and the signature cross-fade to their Parchemin inking during the change into a parchment card", () => {
  const start = seq.cardStarts[WEEK];
  assert.equal(seriesFrameState(seq, start - 9).parchment, 0);
  const mid = seriesFrameState(seq, start - 4).parchment;
  assert.ok(mid > 0 && mid < 1, `${mid}`);
  assert.equal(seriesFrameState(seq, start).parchment, 1);
  assert.equal(seriesFrameState(seq, seq.cardStarts[LAW] + 20).parchment, 1);
  assert.equal(seriesFrameState(seq, 10).parchment, 0);
});

// Check 2: the week table.
// @req REQ-186
test("1.12.0: the week table's rows arrive in a cascade on its word, 9 frames each, 3 frames apart, rising 16 px", () => {
  const entry = word(seq, WEEK, "jour");
  const rows = (f) => layerOf(seq, f, WEEK).week.rows;
  assert.ok(rows(entry).every((r) => r.opacity === 0));
  for (let k = 0; k < 7; k++) {
    const r0 = rows(entry + 3 * k)[k];
    assert.equal(r0.opacity, 0, `row ${k} before`);
    assert.equal(r0.rise, TEACHING.cascade.rise);
    const r1 = rows(entry + 3 * k + 9)[k];
    assert.deepEqual([r1.opacity, r1.rise], [1, 0], `row ${k} after`);
  }
  const mid = rows(entry + 4)[0];
  assert.ok(
    mid.opacity > 0 && mid.opacity < 1 && mid.rise > 0 && mid.rise < 16
  );
});

// @req REQ-186
test("1.12.0: a lit row's band comes in 12 frames on its day's word; the other rows recede to 40 %, two lit at most", () => {
  const lundi = word(seq, WEEK, "lundi");
  const vendredi = word(seq, WEEK, "vendredi");
  const week = (f) => layerOf(seq, f, WEEK).week;
  assert.ok(week(lundi).lit.every((v) => v === 0));
  const one = week(lundi + 12);
  assert.deepEqual(one.lit, [1, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(
    one.rows.map((r) => r.opacity),
    [1, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]
  );
  const two = week(seq.cardStarts[WEEK + 1] - 10);
  assert.deepEqual(two.lit, [1, 0, 0, 0, 1, 0, 0]);
  assert.deepEqual(
    two.rows.map((r) => r.opacity),
    [1, 0.4, 0.4, 0.4, 1, 0.4, 0.4]
  );
  assert.ok(vendredi > lundi + 12);
  // A third lit row makes the first go back.
  const three = load(
    teachingCardsDemo,
    change("serie-nom-famille-02", (c) =>
      c.week.highlights.push({ day: "mardi", say: "Aya" })
    )
  );
  const end = layerOf(three, three.cardStarts[WEEK + 1] - 10, WEEK).week;
  assert.deepEqual(end.lit, [0, 1, 0, 0, 1, 0, 0]);
});

// @req REQ-186
test("1.12.0: a summary table without its word enters whole with its card", () => {
  const s = load(
    teachingCardsDemo,
    change("serie-nom-famille-02", (c) => delete c.week.say)
  );
  const rows = layerOf(s, s.cardStarts[WEEK], WEEK).week.rows;
  assert.ok(rows.every((r) => r.opacity === 1 && r.rise === 0));
});

// @req REQ-186
test("1.12.0: a week table one people per card, girl | day | boy, is refused when its card is too short to read it", () => {
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-02", (c) => c.week.rows[0].push("Kwadwo"))
      ),
    /serie-nom-famille-02: une ligne du tableau de la semaine est « jour, mot du jour, fille, garçon »/
  );
  assert.throws(
    () =>
      load(teachingCardsDemo, {
        script: (beats) => {
          beats[1].chunks.forEach((c) => (c.duration = 1.4));
          return beats;
        },
      }),
    /serie-nom-famille-02: Tableau trop long pour sa carte : le couper en deux, du lundi au jeudi et du vendredi au dimanche \(152 caractères, 7\.2 s à 21 caractères par seconde ; la carte dure \d\.\d s\)/
  );
});

// Check 3: the formula.
// @req REQ-186
test("1.12.0: each formula move starts on its word and lasts its frames: appear 9, join 14, fall 15, become 9", () => {
  const plan = seq.cards[FORMULA].formulaPlan;
  const boy = plan.lines[1];
  assert.deepEqual(
    boy.frames,
    ["Kwa", "avec", "Ce", "tombé", "Yao"].map((w) => word(seq, FORMULA, w))
  );
  assert.deepEqual(boy.durations, [9, 9, 14, 15, 9]);
  const line = (f) => layerOf(seq, f, FORMULA).formula.lines[1];
  assert.deepEqual(line(boy.frames[0] - 1), {
    label: 0,
    from: -1,
    to: -1,
    t: 0,
  });
  for (const [k, n] of boy.durations.entries()) {
    const f = boy.frames[k];
    assert.deepEqual(
      line(f),
      { label: line(f).label, from: k - 1, to: k, t: 0 },
      `state ${k} start`
    );
    assert.equal(line(f + n).t, 1, `state ${k} end`);
    assert.ok(line(f + 1).t > 0 && line(f + 1).t < 1);
  }
  // The last state holds to the end of the card.
  assert.deepEqual(line(seq.cardStarts[FORMULA + 1] - 1), {
    label: 1,
    from: 3,
    to: 4,
    t: 1,
  });
  // The day line on its word, the note for its 2 s.
  const day = word(seq, FORMULA, "ya");
  assert.equal(layerOf(seq, day, FORMULA).formula.day, 0);
  assert.equal(layerOf(seq, day + 9, FORMULA).formula.day, 1);
  const kwao = word(seq, FORMULA, "Kwao");
  assert.equal(layerOf(seq, kwao + 9, FORMULA).formula.notes[0], 1);
  assert.equal(layerOf(seq, kwao + 60 + 9, FORMULA).formula.notes[0], 0);
});

// @req REQ-186
test("1.12.0: the formula's states are resolved into pieces: joined, fallen and changed parts", () => {
  const boy = seq.cards[FORMULA].formulaPlan.lines[1].snapshots;
  const show = (s) =>
    s.pieces
      .map((p) =>
        p.op ? p.op : `${p.text}${p.fallen ? "↓" : ""}${p.joined ? "⁀" : ""}`
      )
      .join(" ");
  assert.deepEqual(boy.map(show), [
    "Kwa",
    "Kwa + ya",
    "Kwa ya⁀",
    "Kwa↓ ya⁀",
    "Kwa↓ Yao⁀",
  ]);
  assert.deepEqual(boy[4].pieces[1].day, [0, 2]);
  assert.equal(boy[1].pieces[2].day, true);
});

// @req REQ-186
test("1.12.0: two moves of one line closer than 21 frames are refused, and a move names pieces on the line", () => {
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-03", (c) => {
          c.formula.lines[1].states[3].say = "Kwa";
          c.formula.lines[1].states[2].say = "ya";
        })
      ),
    /serie-nom-famille-03/
  );
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change(
          "serie-nom-famille-03",
          (c) => (c.formula.lines[1].states[3].items = ["Z"])
        )
      ),
    /serie-nom-famille-03: la formule ne connaît pas la pièce « Z »/
  );
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-03", (c) =>
          c.formula.lines.push(c.formula.lines[0])
        )
      ),
    /serie-nom-famille-03: une formule tient deux lignes au plus/
  );
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change(
          "serie-nom-famille-03",
          (c) => (c.formula.lines[1].states[3].move = "spin")
        )
      ),
    /serie-nom-famille-03: un mouvement de formule est join, fall ou become \(« spin »\)/
  );
});

// @req REQ-186
test("1.12.0: two moves of one line at least 21 frames apart", () => {
  // In the demonstration, « Ce Kwa / est tombé » leaves the join and the fall
  // their 21 frames; moved closer, the card is refused with the gap.
  assert.throws(
    () =>
      load(teachingCardsDemo, {
        script: (beats) => {
          beats[2].chunks[5].text = "avec ya. Ce tombé";
          beats[2].chunks[6].text = "est Kwa : Yao,";
          return beats;
        },
      }),
    /serie-nom-famille-03: deux mouvements de la ligne « garçon » à \d+ images l'un de l'autre ; 21 au moins/
  );
});

// Check 4: drawings.
// @req REQ-186
test("1.12.0: a drawing is refused off the parchment card", () => {
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-04", (c) => delete c.ground)
      ),
    /serie-nom-famille-04: Dessin hors de la carte parchemin/
  );
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-04", (c) => (c.drawings[0].kind = "lion"))
      ),
    /serie-nom-famille-04: pas de dessin « lion » dans assets\/Illustrations/
  );
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-04", (c) =>
          c.drawings.push(c.drawings[0], c.drawings[1])
        )
      ),
    /serie-nom-famille-04: un ou deux dessins par carte/
  );
});

// @req REQ-186
test("1.12.0: a drawing enters on its word in 12 frames rising 8 px; its name 5 frames later, its quality 9 frames later or on its own word", () => {
  const yaw = word(seq, PAIR, "Yaw");
  const d = (f) => layerOf(seq, f, PAIR).drawings[0];
  assert.deepEqual(d(yaw), { opacity: 0, rise: 8, name: 0, quality: 0 });
  assert.equal(d(yaw + 12).opacity, 1);
  assert.equal(d(yaw + 12).rise, 0);
  assert.equal(d(yaw + 5).name, 0);
  assert.equal(d(yaw + 5 + 9).name, 1);
  assert.equal(d(yaw + 9).quality, 0);
  assert.equal(d(yaw + 18).quality, 1);
  const esprit = word(seq, KWA, "esprit");
  const k = (f) => layerOf(seq, f, KWA).drawings[0];
  assert.equal(k(esprit).quality, 0);
  assert.equal(k(esprit + 9).quality, 1);
  assert.equal(k(word(seq, KWA, "serviteur") + 12).opacity, 1);
});

// Check 5: the parchment text card.
// @req REQ-186
test("1.12.0: the parchment text card's date grows from 94 to 100 % in 15 frames; quotation lines 9 frames, 8 apart; underline 12; words 12, rising 12 px", () => {
  const l = (f) => layerOf(seq, f, LAW);
  const date = word(seq, LAW, "1964");
  assert.deepEqual(l(date).date, { opacity: 0, scale: 0.94 });
  assert.deepEqual(l(date + 15).date, { opacity: 1, scale: 1 });
  const quote = word(seq, LAW, "famille");
  assert.deepEqual(l(quote).quote.lines, [0, 0, 0]);
  assert.deepEqual(l(quote + 9).quote.lines.slice(0, 1), [1]);
  assert.equal(l(quote + 8).quote.lines[1], 0);
  assert.equal(l(quote + 16 + 9).quote.lines[2], 1);
  assert.equal(l(quote + 16 + 9).quote.source, 1);
  assert.equal(l(quote).quote.marks[0], 0);
  assert.equal(l(quote + 12).quote.marks[0], 1);
  assert.ok(l(quote + 6).quote.marks[0] > 0 && l(quote + 6).quote.marks[0] < 1);
  const lignee = word(seq, LAW, "lignée");
  assert.deepEqual(l(lignee).words[1], { opacity: 0, rise: 12 });
  assert.deepEqual(l(lignee + 12).words[1], { opacity: 1, rise: 0 });
  // Everything stays to the end of the card.
  const end = l(seq.cardStarts[LAW + 1] - 10);
  assert.deepEqual(
    [
      end.date.opacity,
      ...end.quote.lines,
      end.quote.source,
      ...end.quote.marks,
      ...end.words.map((w) => w.opacity),
    ],
    [1, 1, 1, 1, 1, 1, 1, 1]
  );
});

// @req REQ-186
test("1.12.0: three blocks at most under the head of a parchment card", () => {
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-06", (c) => {
          c.drawings = [
            { kind: "agile", name: "Kwasi", quality: "l’agile", say: "loi" },
          ];
        })
      ),
    /serie-nom-famille-06: quatre blocs sous la tête ; trois au plus/
  );
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change(
          "serie-nom-famille-06",
          (c) => (c.quote.marks[0].words = "son nom de famille")
        )
      ),
    /serie-nom-famille-06: le soulignement « son nom de famille » n'est pas sur une ligne de la citation/
  );
});

// Phases.
// @req REQ-186
test("1.12.0: a run of parchment cards is a picture phase, 180 frames at least", () => {
  const short = (deck) => {
    deck.cards = deck.cards.filter((c) =>
      [
        "serie-nom-famille-01",
        "serie-nom-famille-04",
        "serie-nom-famille-07",
      ].includes(c.id)
    );
    deck.cards[1].drawings.pop();
    return deck;
  };
  assert.throws(
    () =>
      load(teachingCardsDemo, {
        deck: short,
        script: (beats) => {
          const kept = beats.filter((b) =>
            [
              "serie-nom-famille-01",
              "serie-nom-famille-04",
              "serie-nom-famille-07",
            ].includes(b.card)
          );
          kept[1].chunks = [
            { text: "Kofi Agyekum rappelle :", duration: 2 },
            { text: "Yaw, c'est le courageux.", duration: 2.2 },
          ];
          return kept;
        },
      }),
    /serie-nom-famille-04: Phase parchemin de moins de 6 s \(\d\.\d s\)/
  );
});

// Check 6: subtitles.
// @req REQ-186
test("1.12.0: a subtitle said over a parchment card is marked for the Parchemin ink; elsewhere unchanged", () => {
  const on = seriesFrameState(seq, word(seq, WEEK, "jour")).subtitle;
  assert.equal(on.parchment, true);
  const off = seriesFrameState(seq, 30).subtitle;
  assert.equal(off.parchment, undefined);
});

// Check 7: everything accepted holds.
// @req REQ-186
test("1.12.0: a video without the new fields has the frame model it had", () => {
  for (const demo of [seriesDemo, teachingDemo]) {
    const s = load(demo);
    for (const card of s.cards)
      assert.equal(card.formulaPlan, undefined, card.id);
    for (let f = 0; f < s.frames; f += 5) {
      const state = seriesFrameState(s, f);
      assert.equal(state.parchment, undefined, `frame ${f}`);
      if (state.subtitle) assert.equal(state.subtitle.parchment, undefined);
      for (const l of state.layers)
        for (const key of [
          "ground",
          "week",
          "formula",
          "drawings",
          "date",
          "quote",
          "words",
        ])
          assert.equal(l[key], undefined, `frame ${f}: ${key}`);
    }
  }
});

// @req REQ-186
test("1.12.0: an unknown ground and the new fields off parchment are refused", () => {
  assert.throws(
    () =>
      load(
        teachingCardsDemo,
        change("serie-nom-famille-02", (c) => (c.ground = "papyrus"))
      ),
    /serie-nom-famille-02: ground est « parchment » ou absent \(« papyrus »\)/
  );
  for (const [id, field] of [
    ["serie-nom-famille-02", "week"],
    ["serie-nom-famille-03", "formula"],
    ["serie-nom-famille-06", "quote"],
  ])
    assert.throws(
      () =>
        load(
          teachingCardsDemo,
          change(id, (c) => delete c.ground)
        ),
      new RegExp(`${id}: ${field} en mouvement hors de la carte parchemin`)
    );
});
