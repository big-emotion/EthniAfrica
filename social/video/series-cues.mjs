// Cartes 1.13.0, the sound cues (series.md « 13. Sound cues »; handoff.md
// « Renderer integration of 1.13.0 », step 13): every visible motion that
// sounds, as the plan lists it, on its frame, with its family and its peak
// level under the voice's peak (dB). mix.mjs places the operator's files on
// them; without files the plan is only listed, and the video keeps the voice
// alone. Every cue doubles a visible event: nothing is said by a sound alone.
import { FPS } from "./sequence.mjs";
import { DUR } from "./series-motion.mjs";
import { counterTicks } from "./series-turns.mjs";
import { MAP_TIMING } from "./series-sequence.mjs";
import { FIGURES } from "./series-figures.mjs";

// The table's rows: the family a motion takes and its level.
export const CUES = {
  pop: { family: "pop", level: -20 },
  tick: { family: "tick", level: -26 },
  swell: { family: "swell", level: -20 },
  flag: { family: "swell", level: -23 },
  whoosh: { family: "whoosh", level: -16 },
  rise: { family: "rise", level: -16 },
  bandIn: { family: "whoosh", level: -18 },
  bandOut: { family: "whoosh", level: -24 },
  lift: { family: "whoosh", level: -24 },
  recap: { family: "whoosh", level: -22 },
  draw: { family: "draw", level: -22 },
  drawStrong: { family: "draw", level: -20 },
  impact: { family: "impact", level: -17 },
  whipLanding: { family: "impact", level: -21 },
  drum: { family: "drum", level: -16 },
  ding: { family: "ding", level: -18 },
};
// Which sounds first when two would crowd one second: the turns of the
// story, then what enters on the map, then the pops.
const PRIORITY = {
  impact: 0,
  rise: 0,
  whoosh: 0,
  drum: 0,
  ding: 0,
  swell: 1,
  draw: 1,
  pop: 2,
};
const SHARE = 4.5; // 150 ms: a pop that close to an impact shares it
const PER_SECOND = 2;
// The ident's own moments: « S'abonner » turns « Abonné » at 2.0 s of the
// intro (social/series-idents/ident.html); the end card's networks rise at
// 7.15 s (endcard.html).
const INTRO_FOLLOW = 2.0;
const OUTRO_NETWORKS = 7.15;
// The chapter card's current dot (series-page.mjs, CHAPTER_STEPS).
const CHAPTER_DOT = { first: 0.3, step: 0.12 };

export function planCues(seq, crossFade) {
  const cues = [];
  const add = (row, frame, extra = {}) => {
    if (Number.isFinite(frame) && frame >= 0 && frame < seq.frames)
      cues.push({
        family: CUES[row].family,
        frame: Math.round(frame),
        level: CUES[row].level,
        ...extra,
      });
  };
  const changeStart = (i) => seq.cardStarts[i] - crossFade;
  const plan = seq.mapSequence;
  if (plan) {
    // An area's swell; its name rides on it.
    for (const e of plan.events ?? [])
      if (e.to === "enter") add("swell", e.start);
    for (const [file, e] of Object.entries(plan.entries ?? {}))
      if (!plan.animated[plan.areas[file]?.sequence]) add("swell", e.start);
    for (const [i, cp] of Object.entries(plan.cards)) {
      const start = seq.cardStarts[i];
      for (const w of cp.words) add("pop", w.start);
      for (const p of cp.places) if (p.start > start) add("pop", p.start);
      for (const d of cp.drawings) add("pop", d.start + MAP_TIMING.labelDelay);
      for (const a of cp.arrows) add("draw", a.start, { length: a.dur });
      if (cp.rename) add("pop", cp.rename.start + MAP_TIMING.renameNew);
      for (const m of cp.marks ?? []) {
        if (m.kind === "pin") add("pop", m.start);
        else
          add(
            ["circle", "cross"].includes(m.kind) ? "drawStrong" : "draw",
            m.start,
            {
              length: m.dur,
            }
          );
      }
      for (const f of cp.flags ?? []) for (const [a] of f.shows) add("flag", a);
      for (const m of cp.moves.filter((x) => x.whip)) {
        // The whoosh peaks on the whip's fastest frame, mid-path.
        add("whoosh", m.start + 10, { align: "peak" });
        add("whipLanding", m.end);
      }
      if (seq.cards[i].isRecap)
        add("recap", start, { align: "peak", reverse: true });
      // 1.14.0 (series.md « Figures and facts drawn on the map »): a tick per
      // state or unit, 25 a second at most, an impact when the count lands,
      // a pop on the last unit; the glasses swell, a lettering draws for its
      // length, a stamp and a filled frame land, a drawing travels.
      const fp = cp.figures;
      if (fp) {
        const ticks = (frames) => {
          let last = -Infinity;
          for (const f of frames)
            if (f - last >= FPS / 25) {
              add("tick", f);
              last = f;
            }
        };
        if (fp.cascade) {
          ticks(fp.cascade.states.map((s) => s.start));
          add("impact", fp.cascade.states.at(-1).start + 1);
        }
        for (const u of fp.units) {
          ticks(u.items.slice(0, -1).map((it) => it.start));
          add("pop", u.items.at(-1).start + 1);
        }
        if (fp.row) add("pop", fp.row.light);
        for (const g of fp.gauges) {
          add("swell", g.start);
          add("pop", g.start + FIGURES.gauge.fill);
        }
        for (const l of fp.letterings)
          add("draw", l.start, {
            length: [...l.text].length * FIGURES.lettering.step,
          });
        for (const s of fp.stamps) add("impact", s.start + DUR.stamp);
        if (fp.frame) {
          add("draw", fp.frame.start, { length: FIGURES.frame.draw });
          if (fp.frame.fill) {
            add("whoosh", fp.frame.fill.start, { align: "peak" });
            add("impact", fp.frame.fill.start + FIGURES.frame.fill);
          }
        }
        for (const t of fp.travel) {
          add("pop", t.start);
          add("draw", t.move, { length: FIGURES.travel.drawing });
        }
      }
    }
  }
  for (const f of seq.eras?.flashes ?? [])
    add("rise", f.start + 4, { align: "peak" });
  for (const c of Object.values(seq.eras?.cards ?? {})) {
    if (!c.frames) continue;
    for (const t of counterTicks(c)) add("tick", t);
    add("impact", c.start + c.frames);
  }
  for (const b of seq.headlines ?? []) {
    add("bandIn", b.start + 2, { align: "peak" });
    add("impact", b.start + DUR.band.in + 2);
    add("bandOut", b.end + 4, { align: "peak" });
  }
  seq.cards.forEach((card, i) => {
    const t = card.teachingPlan;
    if (t) {
      for (const d of t.drawings ?? []) add("pop", d.frame + 5);
      for (const f of t.words ?? []) add("pop", f);
      const w = t.word;
      if (w) {
        add("lift", w.split + 7, { align: "peak" });
        for (const p of w.parts) add("pop", p.tag);
        if (w.addPop !== undefined) add("pop", w.addPop);
        for (const f of w.forms) add("pop", f);
        if (w.stamp !== undefined) add("impact", w.stamp + DUR.stamp);
      }
    }
    if (card.type === "chapter")
      add(
        "drum",
        seq.cardStarts[i] +
          Math.round(
            (CHAPTER_DOT.first + (card.chapter.n - 1) * CHAPTER_DOT.step) * FPS
          )
      );
    if (card.type === "intro") add("ding", changeStart(i) + INTRO_FOLLOW * FPS);
    if (card.outro) add("ding", changeStart(i) + OUTRO_NETWORKS * FPS);
  });
  return thin(cues);
}

// Two cues in any second at most, ticks aside, the turns kept first; a pop
// within 150 ms of an impact shares it.
function thin(cues) {
  const ticks = cues.filter((c) => c.family === "tick");
  const rest = cues
    .filter((c) => c.family !== "tick")
    .sort(
      (a, b) => PRIORITY[a.family] - PRIORITY[b.family] || a.frame - b.frame
    );
  const kept = [];
  for (const c of rest) {
    if (
      c.family === "pop" &&
      kept.some(
        (k) => k.family === "impact" && Math.abs(k.frame - c.frame) < SHARE
      )
    )
      continue;
    const crowded = [...Array(FPS).keys()].some((d) => {
      const from = c.frame - d;
      return (
        kept.filter((k) => k.frame >= from && k.frame < from + FPS).length >=
        PER_SECOND
      );
    });
    if (!crowded) kept.push(c);
  }
  return [...kept, ...ticks].sort((a, b) => a.frame - b.frame);
}
