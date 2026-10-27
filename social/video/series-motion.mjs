// Cartes 1.13.0, « 1. Motion tokens » and « 2. The pop » (series.md « Motion
// and sound (1.13.0-proposition) »): one family of curves for the whole
// series video, map and parchment alike (decision 1), and the lengths every
// element shares, in frames at 30 fps. The series modules take every curve
// from here; the lengths accepted in 1.11.0 and 1.12.0 keep their values and
// only take these curve names.
import { cubicBezier } from "./sequence.mjs";

const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Whatever arrives decelerates, whatever leaves accelerates, a move between
// two rests is symmetric, a mark is drawn like a pen, and the date counter
// runs fast and slows as it lands.
export const CURVES = {
  enter: [0.2, 0, 0, 1],
  exit: [0.4, 0, 1, 1],
  move: [0.45, 0, 0.55, 1],
  draw: [0.4, 0, 0.2, 1],
};
export const EASE = {
  enter: cubicBezier(...CURVES.enter),
  exit: cubicBezier(...CURVES.exit),
  move: cubicBezier(...CURVES.move),
  draw: cubicBezier(...CURVES.draw),
  land: (x) => 1 - (1 - clamp01(x)) ** 4,
};

// dur-micro 150 ms … dur-move 1.6 s; the counter takes 1.2, 1.6 or 2.0 s by
// the years it crosses (up to 20, up to 150, beyond).
export const DUR = {
  micro: 5,
  pop: 9,
  exit: 6,
  stamp: 5,
  change: 9,
  band: { in: 12, out: 8 },
  flash: 15,
  whip: 21,
  swell: 21,
  move: 48,
  counter: [36, 48, 60],
};

const lerp = (a, b, k) => a + (b - a) * k;

// The pop, `k` frames after it starts: from 70 % to its overshoot in 180 ms
// (`ease-enter`), down to 100 % by 300 ms (`ease-move`); whole opacity in the
// first 120 ms. A mark under 60 px overshoots to 110 %, so the overshoot is
// seen at all on a phone; past that it would read as a toy (question 2).
const POP = { from: 0.7, over: 1.06, small: 1.1, peakAt: 0.6, opaqueAt: 0.4 };
export function popAt(k, { small = false } = {}) {
  if (k <= 0) return { scale: POP.from, opacity: 0 };
  const p = k / DUR.pop;
  if (p >= 1) return { scale: 1, opacity: 1 };
  const over = small ? POP.small : POP.over;
  const scale =
    p < POP.peakAt
      ? lerp(POP.from, over, EASE.enter(p / POP.peakAt))
      : lerp(over, 1, EASE.move((p - POP.peakAt) / (1 - POP.peakAt)));
  return { scale, opacity: clamp01(p / POP.opaqueAt) };
}

// Leaving, `k` frames after it starts: down to 92 % and out in 200 ms
// (`ease-exit`), never a reversed pop.
export function exitAt(k) {
  if (k <= 0) return { scale: 1, opacity: 1 };
  const e = EASE.exit(clamp01(k / DUR.exit));
  return { scale: lerp(1, 0.92, e), opacity: 1 - e };
}

// The pop and, from `until`, the exit, as one factor on a mark's own state.
export function popExit(frame, start, until = Infinity, options) {
  const p = popAt(frame - start, options);
  const x = exitAt(frame - until);
  return { scale: p.scale * x.scale, opacity: p.opacity * x.opacity };
}

// The swell of an area, `k` frames after it enters: its fill rises to 135 %
// of its level at 55 % of 700 ms and settles to its level. The borders never
// move: an area is a fact of geography, not a sticker.
export function swellAt(k) {
  if (k <= 0) return 0;
  const p = k / DUR.swell;
  if (p >= 1) return 1;
  return p < 0.55
    ? 1.35 * EASE.enter(p / 0.55)
    : 1.35 - 0.35 * EASE.move((p - 0.55) / 0.45);
}

// The continuous camera (series.md « 3 »): 6 % every 10 s on map and picture
// cards, 3 % on parchment content, at a constant rate from the first frame.
export const PUSH = { map: 0.06, picture: 0.06, parchment: 0.03, every: 300 };
export const pushAt = (frames, rate = PUSH.map) =>
  frames <= 0 ? 1 : (1 + rate) ** (frames / PUSH.every);
