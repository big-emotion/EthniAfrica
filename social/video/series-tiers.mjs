// Cartes 1.13.0, format tiers (series.md « 10. Format tiers »; handoff.md
// « Renderer integration of 1.13.0 », step 10): the same grammar at three
// lengths. The plan reports every change of the video (a mark that enters or
// leaves, a camera move, a whip, a flash, a card change, a headline band, a
// counter roll, a part's move), its median and longest gap; picture phases,
// chapter cards and the idents move by their push or their glow and are left
// out of the gaps. A subtitle chunk, the lit word and the push are no change.
import { FPS } from "./sequence.mjs";

const fail = (message) => {
  throw new Error(message);
};

// Seconds, except `recap` and `wordAlone` (frames at 30 fps). `strong` is
// whip zooms and flashes together; a long video allows one a chapter and the
// twist.
export const TIERS = {
  short: {
    name: "courte",
    length: [30, 60],
    median: 2,
    longest: 3.5,
    strong: 3,
    bands: 2,
    recap: 120,
    wordAlone: 600,
  },
  medium: {
    name: "moyenne",
    length: [60, 180],
    median: 2.5,
    longest: 4.5,
    strong: 5,
    bands: 2,
    recap: 180,
    wordAlone: 900,
  },
  long: {
    name: "longue",
    length: [180, 360],
    median: 3,
    longest: 6,
    strong: null,
    bands: 2,
    recap: 180,
    wordAlone: 900,
  },
};

// The gaps between consecutive changes (frames), a gap whose middle lies in
// an excluded span left out: their median and their longest.
export function gapsOf(changes, excluded) {
  const gaps = [];
  for (let k = 1; k < changes.length; k++) {
    const middle = (changes[k] + changes[k - 1]) / 2;
    if (excluded.some(([a, b]) => middle >= a && middle <= b)) continue;
    gaps.push(changes[k] - changes[k - 1]);
  }
  if (!gaps.length) return { median: 0, longest: 0 };
  const sorted = gaps.toSorted((a, b) => a - b);
  const mid = sorted.length / 2;
  const median =
    sorted.length % 2
      ? sorted[Math.floor(mid)]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  return { median, longest: sorted.at(-1) };
}

const finite = (f) => Number.isFinite(f);

// Every frame on which something changes, from the plans the video has made.
function changeFrames(seq, crossFade) {
  const out = [];
  const add = (...frames) => out.push(...frames.filter(finite));
  seq.cardStarts.forEach((s, i) => i && add(s - crossFade));
  const plan = seq.mapSequence;
  if (plan) {
    for (const e of plan.events ?? []) add(e.start);
    for (const e of Object.values(plan.entries ?? {})) add(e.start, e.lang);
    for (const [i, cp] of Object.entries(plan.cards)) {
      const start = seq.cardStarts[i];
      for (const m of cp.moves) add(m.start);
      for (const a of cp.arrows) add(a.start, a.trace, a.out);
      for (const d of cp.drawings) add(d.start, d.end);
      for (const w of cp.words) add(w.start, w.end);
      for (const p of cp.places) if (p.start > start) add(p.start);
      if (cp.rename) add(cp.rename.start);
      for (const m of cp.marks ?? []) add(m.start, m.end);
      for (const f of cp.flags ?? []) for (const [a, b] of f.shows) add(a, b);
    }
  }
  for (const f of seq.eras?.flashes ?? []) add(f.start);
  for (const c of Object.values(seq.eras?.cards ?? {}))
    if (c.frames) add(c.start);
  for (const b of seq.headlines ?? []) add(b.start, b.end);
  for (const card of seq.cards) {
    add(...(card.itemFrames ?? []), card.attributionFrame, card.markFrame);
    add(...(card.formulaFrames ?? []), ...(card.weekFrames ?? []));
    if (card.sbsFrames)
      add(...card.sbsFrames.rows, card.sbsFrames.days, card.sbsFrames.note);
    const t = card.teachingPlan;
    if (t) {
      if (t.week) add(t.week.entry, ...t.week.lights.map((l) => l.frame));
      for (const d of t.drawings ?? []) add(d.frame, d.quality);
      add(
        t.date,
        t.quote?.frame,
        ...(t.quote?.marks ?? []),
        ...(t.words ?? [])
      );
      add(...(t.changes ?? []));
    }
    for (const line of card.formulaPlan?.lines ?? []) add(...line.frames);
    for (const note of card.formulaPlan?.notes ?? []) add(note.from, note.to);
  }
  return [...new Set(out.map(Math.round))]
    .filter((f) => f >= 0 && f < seq.frames)
    .sort((a, b) => a - b);
}

// The spans that move by their own push or glow: pictures, chapter cards,
// the intro and the end card.
function excludedSpans(seq, crossFade) {
  return seq.cards.flatMap((card, i) => {
    const map = card.type === "map" || card.opening === "globe";
    if (map || card.ground === "parchment") return [];
    const from = i ? seq.cardStarts[i] - crossFade : 0;
    const to = (seq.cardStarts[i + 1] ?? seq.frames) - crossFade;
    return [[from, to]];
  });
}

export function tierReport(seq, tierName, crossFade) {
  if (tierName !== undefined && !Object.hasOwn(TIERS, tierName))
    fail(`tier est short, medium ou long (« ${tierName} »)`);
  const tier = tierName ? TIERS[tierName] : null;
  const changes = changeFrames(seq, crossFade);
  const { median, longest } = gapsOf(changes, excludedSpans(seq, crossFade));
  const whips = Object.values(seq.mapSequence?.cards ?? {}).flatMap((cp) =>
    cp.moves.filter((m) => m.whip)
  ).length;
  const strong = whips + (seq.eras?.flashes.length ?? 0);
  const report = {
    tier: tierName ?? null,
    changes,
    median: +(median / FPS).toFixed(2),
    longest: +(longest / FPS).toFixed(2),
    strong,
    bands: seq.headlines?.length ?? 0,
  };
  // The parchment carries one word alone 20 s on a short, 30 s otherwise
  // (decision 11); then a map, a picture or a new word.
  const alone = tier?.wordAlone ?? TIERS.medium.wordAlone;
  const wordWarnings = seq.cards.flatMap((card, i) => {
    if (card.type !== "word") return [];
    const frames = (seq.cardStarts[i + 1] ?? seq.frames) - seq.cardStarts[i];
    return frames > alone
      ? [
          `Le mot seul sur le parchemin dure ${(frames / FPS).toFixed(1)} s : ${alone / FPS} s au plus, puis une carte, une image ou un nouveau mot (${card.id})`,
        ]
      : [];
  });
  if (!tier) return { report, warnings: wordWarnings };
  const chapters = seq.cards.filter((c) => c.type === "chapter").length;
  const strongMax = tier.strong ?? chapters + 1;
  if (strong > strongMax)
    fail(
      `Transitions fortes : ${strong} pour une vidéo ${tier.name}, ${strongMax} au plus (lancers rapides et éclairs)`
    );
  if (report.bands > tier.bands)
    fail(
      `Bandeau de titre : ${report.bands} pour une vidéo ${tier.name}, ${tier.bands} au plus`
    );
  const warnings = [...wordWarnings];
  if (report.longest > tier.longest)
    warnings.push(
      `Intervalle sans changement de ${report.longest} s : ${tier.longest} s au plus pour une vidéo ${tier.name}`
    );
  if (report.median > tier.median)
    warnings.push(
      `Un changement toutes les ${report.median} s en médiane : ${tier.median} s visées pour une vidéo ${tier.name}`
    );
  const seconds = seq.frames / FPS;
  if (seconds < tier.length[0] || seconds > tier.length[1])
    warnings.push(
      `Une vidéo ${tier.name} dure de ${tier.length[0]} à ${tier.length[1]} s ; celle-ci ${seconds.toFixed(1)} s`
    );
  return { report, warnings };
}
