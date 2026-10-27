// Teaching cards in motion and the parchment card of the series video
// (EthniAfrica Cartes 1.12.0, series.md « Teaching cards in motion and the
// parchment card », handoff « Renderer integration of 1.12.0 »): what such a
// card may carry, when each of its parts moves, and its state on a frame.
// The page (series-page.mjs) measures and draws; every time here is a frame
// number, every place there a function of these states.
import { existsSync } from "node:fs";
import { FPS } from "./sequence.mjs";
import { EASE, DUR, PUSH, pushAt, popAt, exitAt } from "./series-motion.mjs";
import { wordOf } from "./series-sequence.mjs";
import { groundMotion } from "../series-idents/ground.mjs";
import { planScene, sceneAt, sceneMarkup } from "./series-scenes.mjs";

// Frames at 30 fps, as the handoff gives them in milliseconds.
export const TEACHING = {
  cascade: { each: 9, apart: 3, rise: 16 },
  highlight: 12,
  recede: 0.4,
  maxLit: 2,
  appear: { frames: 9, rise: 12 },
  moves: { join: 14, fall: 15, become: 9 },
  joinOp: 5,
  fall: { drop: 104, scale: 0.55, opacity: 0.3 },
  movesApart: 21,
  note: 9,
  drawing: { frames: 12, rise: 8, name: 5, quality: 9, label: 9 },
  date: { frames: 15, from: 0.94 },
  quote: { frames: 9, apart: 8 },
  underline: 12,
  words: { frames: 12, rise: 12 },
  maxBlocks: 3,
  phase: 180,
  readCps: 21,
};
const MOVES = Object.keys(TEACHING.moves);
const BLOCK_WORDS = ["", "un", "deux", "trois", "quatre", "cinq", "six"];

const fail = (message) => {
  throw new Error(message);
};
export const isParchment = (card) => card.ground === "parchment";
// A 1.12.0 week table names its people; the 1.8.0 one has two sides.
const movingWeek = (card) => card.week?.people !== undefined;
const movingFormula = (card) => card.formula?.lines !== undefined;

// Checked when the cards load, before anything is timed.
export function checkTeachingCard(card) {
  const id = card.id;
  if (card.ground !== undefined && !isParchment(card))
    fail(`Card ${id}: ground est « parchment » ou absent (« ${card.ground} »)`);
  if (card.drawings !== undefined && !isParchment(card))
    fail(`Card ${id}: Dessin hors de la carte parchemin`);
  for (const [field, used] of [
    ["week", movingWeek(card)],
    ["formula", movingFormula(card)],
    ["quote", card.quote?.lines !== undefined],
    ["words", card.words !== undefined],
  ])
    if (used && !isParchment(card))
      fail(`Card ${id}: ${field} en mouvement hors de la carte parchemin`);
  // 1.13.0: an episode about a word, on the parchment.
  if (card.type === "word") return checkWordCard(card);
  if (!isParchment(card)) return;
  const blocks = [
    movingWeek(card),
    movingFormula(card),
    card.drawings,
    card.quote,
    card.quote?.source,
    card.words?.length,
  ].filter(Boolean).length;
  if (blocks > TEACHING.maxBlocks)
    fail(
      `Card ${id}: ${BLOCK_WORDS[blocks] ?? blocks} blocs sous la tête ; trois au plus`
    );
  if (movingWeek(card))
    for (const row of card.week.rows)
      if (row.length !== 4 || row.some((t) => typeof t !== "string"))
        fail(
          `Card ${id}: une ligne du tableau de la semaine est « jour, mot du jour, fille, garçon »`
        );
  if (card.drawings) {
    if (!(card.drawings.length >= 1 && card.drawings.length <= 2))
      fail(`Card ${id}: un ou deux dessins par carte`);
    for (const d of card.drawings)
      if (
        !existsSync(
          new URL(
            `../design-system/assets/Illustrations/${d.kind}.svg`,
            import.meta.url
          )
        )
      )
        fail(
          `Card ${id}: pas de dessin « ${d.kind} » dans assets/Illustrations`
        );
  }
  for (const mark of card.quote?.marks ?? [])
    if (!card.quote.lines.some((line) => line.includes(mark.words)))
      fail(
        `Card ${id}: le soulignement « ${mark.words} » n'est pas sur une ligne de la citation`
      );
  if (movingFormula(card)) {
    // The boards set two lines, at y 760 and 980.
    if (card.formula.lines.length > 2)
      fail(`Card ${id}: une formule tient deux lignes au plus`);
    resolveFormula(card);
  }
}

// A line's states resolved into what it shows: its pieces in order, each
// standing or fallen, joined to the one before it or not. A state without a
// move lists the line; join, fall and become name the pieces they act on.
export function resolveFormula(card) {
  const id = card.id;
  return card.formula.lines.map((line) => {
    let pieces = [];
    let ops = 0;
    const known = (ref) =>
      pieces.find((p) => p.id === ref) ??
      fail(`Card ${id}: la formule ne connaît pas la pièce « ${ref} »`);
    const snapshots = line.states.map((state, k) => {
      if (typeof state.say !== "string" || !state.say)
        fail(`Card ${id}: chaque état de la formule nomme son mot, say`);
      const move = state.move;
      if (move !== undefined && !MOVES.includes(move))
        fail(
          `Card ${id}: un mouvement de formule est join, fall ou become (« ${move} »)`
        );
      if (move && !k)
        fail(`Card ${id}: le premier état d'une ligne n'est pas un mouvement`);
      const refOf = (item) => (typeof item === "string" ? item : item.id);
      if (!move) {
        pieces = state.items.map((item) => {
          if (item.op) return { id: `op${ops++}`, op: item.op };
          const before = pieces.find((p) => p.id === refOf(item));
          if (typeof item === "string" && !before) known(item);
          return {
            ...(before ?? {}),
            ...(typeof item === "string" ? {} : item),
          };
        });
        // Pieces fallen earlier stay, under where they were.
        return { pieces: pieces.map((p) => ({ ...p })) };
      }
      const named = state.items.map(refOf);
      named.forEach(known);
      if (move === "join") {
        const first = pieces.findIndex((p) => p.id === named[0]);
        pieces = pieces.filter(
          (p, j) => !(p.op && j > first && named.includes(pieces[j + 1]?.id))
        );
        pieces = pieces.map((p) =>
          named.slice(1).includes(p.id) ? { ...p, joined: true } : p
        );
      }
      if (move === "fall")
        pieces = pieces.map((p) =>
          named.includes(p.id) ? { ...p, fallen: true } : p
        );
      if (move === "become")
        pieces = pieces.map((p) => {
          const item = state.items.find((i) => refOf(i) === p.id);
          return item && typeof item !== "string" ? { ...p, ...item } : p;
        });
      return { move, pieces: pieces.map((p) => ({ ...p })) };
    });
    return { label: line.label, snapshots };
  });
}

// After the schedule: the frames on which each part of a teaching card moves.
export function planTeaching(seq, i) {
  const card = seq.cards[i];
  const start = seq.cardStarts[i];
  const end = seq.cardStarts[i + 1] ?? seq.frames;
  const said = (word) => wordOf(seq, i, word).frame;
  const plan = {};
  if (movingWeek(card)) {
    const { rows } = card.week;
    const characters = rows.flat().reduce((n, t) => n + [...t].length, 0);
    const need = Math.ceil((characters / TEACHING.readCps) * FPS - 1e-9);
    if (end - start < need)
      fail(
        `Card ${card.id}: Tableau trop long pour sa carte : le couper en deux, du lundi au jeudi et du vendredi au dimanche (${characters} caractères, ${(characters / TEACHING.readCps).toFixed(1)} s à ${TEACHING.readCps} caractères par seconde ; la carte dure ${((end - start) / FPS).toFixed(1)} s)`
      );
    // A table that comes back (the summary) has no word: it enters whole.
    const entry = card.week.say === undefined ? null : said(card.week.say);
    const lights = (card.week.highlights ?? [])
      .map((h) => {
        const row = rows.findIndex(([day]) => day === h.day);
        if (row < 0)
          fail(`Card ${card.id}: pas de ligne « ${h.day} » à éclairer`);
        return { row, frame: said(h.say) };
      })
      .sort((a, b) => a.frame - b.frame);
    plan.week = { entry, lights };
  }
  if (movingFormula(card)) {
    const resolved = resolveFormula(card);
    card.formulaPlan = {
      day: card.formula.day && {
        html: card.formula.day.html,
        frame: said(card.formula.day.say),
      },
      lines: resolved.map((line, n) => {
        const states = card.formula.lines[n].states;
        const frames = states.map((s) => said(s.say));
        if (frames.some((f, k) => k && f <= frames[k - 1]))
          fail(
            `Card ${card.id}: les états de la formule suivent l'ordre de la voix`
          );
        let last = null;
        states.forEach((s, k) => {
          if (!s.move) return;
          if (last !== null && frames[k] - frames[last] < TEACHING.movesApart)
            fail(
              `Card ${card.id}: deux mouvements de la ligne « ${line.label} » à ${frames[k] - frames[last]} images l'un de l'autre ; ${TEACHING.movesApart} au moins`
            );
          last = k;
        });
        const durations = states.map((s) =>
          s.move ? TEACHING.moves[s.move] : TEACHING.appear.frames
        );
        return { ...line, frames, durations };
      }),
      notes: (card.formula.notes ?? []).map((note) => {
        const from = said(note.say);
        return {
          html: note.html,
          from,
          to: note.hold ? from + Math.round(note.hold * FPS) : null,
        };
      }),
    };
  }
  if (card.drawings)
    plan.drawings = card.drawings.map((d) => {
      const frame = said(d.say);
      return {
        frame,
        quality: d.qualitySay
          ? said(d.qualitySay)
          : frame + TEACHING.drawing.quality,
      };
    });
  if (card.date && isParchment(card))
    plan.date = card.dateSay ? said(card.dateSay) : start;
  if (card.quote?.lines)
    plan.quote = {
      frame: said(card.quote.say),
      marks: (card.quote.marks ?? []).map((m) => said(m.say)),
    };
  if (card.words) plan.words = card.words.map((w) => said(w.say));
  // Narration v4 of « Zaïre »: an illustrated scene, drawn once by the page.
  if (card.scene) {
    plan.scene = planScene(card, said, end);
    card.sceneSvg = sceneMarkup(card.scene.kind);
  }
  // 1.13.0: a word card's parts, forms and stamp.
  if (card.type === "word") {
    plan.word = planWord(card, said);
    plan.changes = [
      plan.word.split,
      ...plan.word.parts.flatMap((p) => [p.tag, p.sense]),
      plan.word.join,
      plan.word.addPop,
      plan.word.addMove,
      ...plan.word.forms,
      plan.word.stamp,
    ];
  }
  card.teachingPlan = plan;
}

// A run of parchment cards is a picture phase: 180 frames at least.
export function checkParchmentPhases(seq) {
  let first = -1;
  seq.cards.forEach((card, i) => {
    if (!isParchment(card)) return;
    if (first < 0) first = i;
    if (isParchment(seq.cards[i + 1] ?? {})) return;
    const frames =
      (seq.cardStarts[i + 1] ?? seq.frames) - seq.cardStarts[first];
    if (frames < TEACHING.phase)
      fail(
        `Card ${seq.cards[first].id}: Phase parchemin de moins de 6 s (${(frames / FPS).toFixed(1)} s)`
      );
    first = -1;
  });
}

// From 0 to 1 over `frames` frames from `from`, eased in and out of rest.
const progress = (frame, from, frames) =>
  frame <= from
    ? 0
    : frame >= from + frames
      ? 1
      : EASE.enter((frame - from) / frames);
const linear = (frame, from, frames) =>
  frame <= from ? 0 : frame >= from + frames ? 1 : (frame - from) / frames;

// The first frame drawn of the run of parchment cards a card belongs to: the
// ground's clock, so two cards in a row keep one ground.
const runClock = (seq, i, crossFade) => {
  let a = i;
  while (a > 0 && isParchment(seq.cards[a - 1])) a--;
  return a ? seq.cardStarts[a] - crossFade + 1 : 0;
};

// What a parchment card's layer shows on `frame`.
export function teachingLayer(seq, l, frame, crossFade) {
  const card = seq.cards[l.card];
  if (!isParchment(card)) return;
  l.ground = groundMotion((frame - runClock(seq, l.card, crossFade)) / FPS);
  // 1.13.0: its content pushes in 3 % every 10 s from the card's first
  // frame; the ground keeps its own clock.
  const first = l.card ? seq.cardStarts[l.card] - crossFade + 1 : 0;
  l.push = pushAt(frame - first, PUSH.parchment);
  const plan = card.teachingPlan;
  if (plan.week) {
    const { entry, lights } = plan.week;
    const { each, apart, rise } = TEACHING.cascade;
    // The lit rows: a third makes the first go back.
    const lit = card.week.rows.map(() => 0);
    const on = [];
    for (const light of lights) {
      if (frame < light.frame) break;
      on.push(light);
      if (on.length > TEACHING.maxLit) {
        const back = on.shift();
        lit[back.row] = -light.frame;
      }
    }
    lit.forEach((v, k) => {
      if (v < 0) lit[k] = 1 - progress(frame, -v, TEACHING.highlight);
    });
    for (const light of on)
      lit[light.row] = progress(frame, light.frame, TEACHING.highlight);
    const recede = lights.length
      ? progress(frame, lights[0].frame, TEACHING.highlight)
      : 0;
    l.week = {
      rows: card.week.rows.map((_, k) => {
        const p = entry === null ? 1 : progress(frame, entry + k * apart, each);
        const dim = 1 - (1 - TEACHING.recede) * recede;
        return {
          opacity: p * (lit[k] + (1 - lit[k]) * dim),
          rise: rise * (1 - p),
        };
      }),
      lit,
    };
  }
  if (card.formulaPlan) {
    const { day, lines, notes } = card.formulaPlan;
    l.formula = {
      day: day ? progress(frame, day.frame, TEACHING.appear.frames) : 1,
      lines: lines.map(({ frames, durations }) => {
        const to = frames.findLastIndex((f) => frame >= f);
        return {
          label:
            to < 0 ? 0 : progress(frame, frames[0], TEACHING.appear.frames),
          from: to < 0 ? -1 : to - 1,
          to,
          // `p` runs linearly over the move, `t` is its progress on `ease-move`.
          p: to < 0 ? 0 : linear(frame, frames[to], durations[to]),
          t: to < 0 ? 0 : EASE.move(linear(frame, frames[to], durations[to])),
        };
      }),
      notes: notes.map(
        ({ from, to }) =>
          progress(frame, from, TEACHING.note) *
          (to === null ? 1 : 1 - progress(frame, to, TEACHING.note))
      ),
    };
  }
  if (plan.drawings)
    l.drawings = plan.drawings.map(({ frame: f, quality }) => {
      const p = progress(frame, f, TEACHING.drawing.frames);
      // 1.13.0: the drawing's name and quality pop under it.
      const name = popAt(frame - f - TEACHING.drawing.name);
      const said = popAt(frame - quality);
      return {
        opacity: p,
        rise: TEACHING.drawing.rise * (1 - p),
        name: name.opacity,
        nameScale: name.scale,
        quality: said.opacity,
        qualityScale: said.scale,
      };
    });
  if (plan.date !== undefined) {
    const p = progress(frame, plan.date, TEACHING.date.frames);
    l.date = {
      opacity: p,
      scale: TEACHING.date.from + (1 - TEACHING.date.from) * p,
    };
  }
  if (plan.quote) {
    const { frames, apart } = TEACHING.quote;
    const lines = card.quote.lines.map((_, k) =>
      progress(frame, plan.quote.frame + k * apart, frames)
    );
    l.quote = {
      lines,
      source: card.quote.source ? lines.at(-1) : undefined,
      marks: plan.quote.marks.map((f) => linear(frame, f, TEACHING.underline)),
    };
  }
  if (plan.words)
    // 1.13.0: free words pop on their word, from their centre.
    l.words = plan.words.map((f) => {
      const { opacity, scale } = popAt(frame - f);
      return { opacity, scale };
    });
  if (plan.word) l.word = wordAt(plan.word, frame);
  if (plan.scene) l.scene = sceneAt(plan.scene, frame);
}

// ---------------------------------------------------------------------------
// Cartes 1.13.0, « 12. Episodes about a word »: the word in Anton 170, its
// parts lifting apart (450 ms, ease-move, to 80 %, 150 px apart) with their
// language and sense popping in under each; a part joining to make a derived
// form (1.12.0's join, 450 ms); the forms as pills; the first attestation as
// a stamp dropping from 140 % in 180 ms. The page lays them out; here, when.
export const WORD = {
  lift: TEACHING.moves.join,
  senseAfter: TEACHING.appear.frames,
  // The added part pops just after the join starts, then moves against its
  // base once the others have gone.
  addPop: 6,
  addMove: 21,
  stampFrom: 1.4,
  stampOpaque: 2.4,
};

function checkWordCard(card) {
  const id = card.id;
  if (!isParchment(card))
    fail(`Card ${id}: Carte de mot hors du parchemin (ground: "parchment")`);
  const { word, parts, join, forms, stamp } = card;
  if (typeof word !== "string" || !word.trim())
    fail(`Card ${id}: une carte de mot donne son mot (word)`);
  if (!Array.isArray(parts) || parts.length < 1 || parts.length > 3)
    fail(`Card ${id}: un mot a une à trois parties`);
  for (const p of parts)
    if (![p.text, p.lang, p.sense, p.say].every((v) => typeof v === "string"))
      fail(`Card ${id}: une partie donne text, lang, sense et say`);
  if (parts.map((p) => p.text).join(" ") !== word)
    fail(`Card ${id}: Les parties ne refont pas le mot « ${word} »`);
  if (join) {
    if (!parts.some((p) => p.text === join.base))
      fail(
        `Card ${id}: la jonction part d'une partie du mot (« ${join.base} »)`
      );
    if (
      ![join.add, join.lang, join.sense, join.say].every(
        (v) => typeof v === "string"
      )
    )
      fail(`Card ${id}: la jonction donne add, lang, sense et say`);
  }
  for (const f of forms ?? [])
    if (![f.text, f.kind, f.say].every((v) => typeof v === "string"))
      fail(`Card ${id}: une forme donne text, kind et say`);
  if ((forms ?? []).length > 4) fail(`Card ${id}: quatre formes au plus`);
  if (
    stamp &&
    ![stamp.date, stamp.label, stamp.say].every((v) => typeof v === "string")
  )
    fail(`Card ${id}: le tampon donne date, label et say`);
}

// When each part of a word card moves, after the schedule.
export function planWord(card, said) {
  const split = said(card.parts[0].say);
  const parts = card.parts.map((p) => {
    const tag = Math.max(said(p.say), split + WORD.lift);
    return { tag, sense: tag + WORD.senseAfter };
  });
  const join = card.join && said(card.join.say);
  return {
    split,
    parts,
    base: card.join
      ? card.parts.findIndex((p) => p.text === card.join.base)
      : -1,
    ...(card.join && {
      join,
      addPop: join + WORD.addPop,
      addMove: join + WORD.addMove,
      addTag: join + WORD.addMove + WORD.lift,
    }),
    forms: (card.forms ?? []).map((f) => said(f.say)),
    ...(card.stamp && { stamp: said(card.stamp.say) }),
  };
}

const exitFrom = (frame, from) => exitAt(frame - from);
export function wordAt(w, frame) {
  const ease = (from, frames) =>
    EASE.move(Math.min(1, Math.max(0, (frame - from) / frames)));
  const joined = w.join !== undefined ? ease(w.join, WORD.lift) : 0;
  const leaving =
    w.join !== undefined ? exitFrom(frame, w.join) : { opacity: 1, scale: 1 };
  const parts = w.parts.map((p, k) => {
    const pop = (from) => {
      const s = popAt(frame - from);
      return {
        opacity: s.opacity * leaving.opacity,
        scale: s.scale * leaving.scale,
      };
    };
    // The base stays and comes back to rest; the other parts leave.
    const own = k === w.base || w.join === undefined ? 1 : leaving.opacity;
    return { opacity: own, tag: pop(p.tag), sense: pop(p.sense) };
  });
  const stampK =
    w.stamp === undefined
      ? 0
      : EASE.enter(Math.min(1, Math.max(0, (frame - w.stamp) / DUR.stamp)));
  return {
    split: ease(w.split, WORD.lift),
    parts,
    join: joined,
    base: w.base,
    ...(w.join !== undefined && {
      add: {
        ...popAt(frame - w.addPop),
        move: ease(w.addMove, WORD.lift),
        tag: popAt(frame - w.addTag),
        sense: popAt(frame - w.addTag - WORD.senseAfter),
      },
    }),
    forms: w.forms.map((f) => popAt(frame - f)),
    ...(w.stamp !== undefined && {
      stamp: {
        scale:
          frame < w.stamp
            ? WORD.stampFrom
            : WORD.stampFrom + (1 - WORD.stampFrom) * stampK,
        opacity: Math.min(1, Math.max(0, (frame - w.stamp) / WORD.stampOpaque)),
      },
    }),
  };
}
