// Cartes 1.13.0, the story's turns on the map (series.md « 4. Transitions for
// the story's turns » to « 9. The headline band »; handoff.md « Renderer
// integration of 1.13.0 », steps 4 to 9): the whip zoom between distant
// places, the warm flash and the era map, the date counter, drawn marks,
// flags and the headline band. Every time here is a frame number; the page
// draws from these states.
import { monotonePath } from "./page.mjs";
import { DUR, EASE } from "./series-motion.mjs";

const fail = (message) => {
  throw new Error(message);
};

export const TURNS = {
  // The whip: out to the globe (radius 900) in 7 frames, across in 7, in to
  // the new view in 7, through these fractions of the way (the boards').
  whipRadius: 900,
  whipKeys: [0, 7, 14, 21],
  whipAlong: [0, 0.24, 0.785, 1],
  whipMinKm: 2000,
  whipGap: 120,
  // The blur follows the camera's speed on screen, up to 35 % radial and
  // 160 px along the pan.
  blurZoom: 0.35,
  blurPan: 160,
};

// A view as the piece data gives it: `r` (handoff) or `radius`.
export function viewOf(v, what) {
  const radius = v?.radius ?? v?.r;
  if (![v?.lon, v?.lat, radius].every(Number.isFinite))
    fail(`${what}: une vue donne lon, lat et r`);
  return { lon: v.lon, lat: v.lat, radius };
}

const EARTH_KM = 6371;
export function greatCircleKm(a, b) {
  const rad = Math.PI / 180;
  const [p1, p2] = [a.lat * rad, b.lat * rad];
  const dp = p2 - p1;
  const dl = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// The whip's camera at `frame`: one path through four keys, one monotone
// cubic per channel (the radius in log), so it starts and lands with zero
// speed, as the opening globe does.
export function whipCamera(m, frame) {
  const t = Math.min(Math.max(frame - m.start, 0), DUR.whip);
  const along = monotonePath(TURNS.whipKeys, TURNS.whipAlong)(t);
  const logR = monotonePath(
    TURNS.whipKeys,
    [m.from.radius, TURNS.whipRadius, TURNS.whipRadius, m.to.radius].map(
      Math.log
    )
  )(t);
  return {
    lon: m.from.lon + (m.to.lon - m.from.lon) * along,
    lat: m.from.lat + (m.to.lat - m.from.lat) * along,
    radius: Math.exp(logR),
    centreY: m.to.centreY,
  };
}

// The whip of a card, checked: between two places one view cannot hold,
// after the card's moves.
export function planWhip(card, start, from, to, moves) {
  const what = `Card ${card.id}`;
  if (greatCircleKm(from, to) < TURNS.whipMinKm)
    fail(
      `${what}: Lancer rapide entre deux lieux proches : un mouvement de caméra suffit (${Math.round(greatCircleKm(from, to))} km)`
    );
  if (moves.some((m) => m.end > start))
    fail(`${what}: le lancer rapide vient après les mouvements de la carte`);
  return { start, end: start + DUR.whip, from, to, whip: true };
}

// Two whips of one video at least 120 frames apart.
export function checkWhipGaps(whips) {
  const sorted = whips.toSorted((a, b) => a.start - b.start);
  for (let k = 1; k < sorted.length; k++)
    if (sorted[k].start - sorted[k - 1].start < TURNS.whipGap)
      fail(
        `Card ${sorted[k].card}: Deux lancers rapides à moins de 4 s (${sorted[k].start - sorted[k - 1].start} images)`
      );
}

// While a whip runs, the frame is blurred by copies following the camera's
// speed on screen: `zoom` the change of log radius since the frame before,
// `pan` where the previous centre now stands relative to the frame's centre.
export function whipBlur(before, now, project) {
  const zoom = Math.abs(Math.log(now.radius / before.radius));
  const [x, y] = project(now, before.lon, before.lat);
  return { zoom, pan: [540 - x, now.centreY - y] };
}

// ---------------------------------------------------------------------------
// The warm flash and the era map (series.md « 4 » and « 5 »), the date
// counter (« 6 »), flags (« 8 ») and the headline band (« 9 »). `word(i, unit)`
// gives the start frame of a unit of card i's chunks (series-sequence.mjs's
// wordOf), so this module needs no import of the planner.

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (frame, from, frames, ease = EASE.move) =>
  ease(clamp01((frame - from) / frames));

export const ERA = {
  flashPeak: 0.92,
  flashPeakAt: 4,
  // The imagery turns to paper between frames 3 and 9 of the flash, the
  // inks at frame 4, under the flash's peak.
  paperFrom: 3,
  paperTo: 9,
  inksAt: 4,
  flashGap: 60,
  // The counter rolls 36 frames up to 20 years, 48 up to 150, 60 beyond;
  // it lands with a 4 % settle in 6 frames and its label comes over 9.
  settle: 0.04,
  settleFrames: 6,
  label: 9,
  ticksPerSecond: 25,
};

export const isMapCard = (card) =>
  card.type === "map" || card.opening === "globe";

// The flag drawings of assets/Flags/ and the state each one belongs to, by the
// name the voice must say (series.md « 8 », rule 3).
// 1.16.0: the DR Congo's name is said « Congo » as often as in full, so the
// voice naming « Congo » names it.
export const FLAG_STATES = {
  bfa: "Burkina Faso",
  hv: "Haute-Volta",
  zar: "Zaïre",
  cod: "Congo",
  fra: "France",
  bra: "Brésil",
};
// Whether the card's voice names a flag's state (series.md « 8 », rule 3).
export function voiceNamesState(seq, i, flag) {
  const fold = (s) => s.replace(/[’']/gu, "'").toLowerCase();
  const text = fold(
    seq.chunks
      .filter((c) => c.card === i)
      .map((c) => c.text)
      .join(" ")
  );
  return text.includes(fold(FLAG_STATES[flag]));
}

const yearOf = (date, what) => {
  const year = Number(String(date).slice(0, 4));
  if (!Number.isInteger(year)) fail(`${what}: une date commence par l'année`);
  return year;
};

// The fields 1.13.0 adds to a card, checked before anything is timed.
export function checkTurnFields(card) {
  const what = `Card ${card.id}`;
  if (card.era !== undefined) {
    if (!isMapCard(card) || !card.map?.view)
      fail(`${what}: l'époque demande une carte animée (map.view)`);
    const { date, label, say } = card.era;
    if (!Number.isInteger(date) || typeof label !== "string" || !say)
      fail(`${what}: l'époque donne date (une année), label et say`);
  }
  if (card.whip !== undefined) {
    if (!isMapCard(card) || !card.map?.view)
      fail(`${what}: le lancer rapide demande une carte animée (map.view)`);
    viewOf(card.whip.to, `${what}, whip`);
    if (!card.whip.say) fail(`${what}: le lancer rapide nomme son mot (say)`);
  }
  for (const f of card.flags ?? []) {
    if (!isMapCard(card) || !card.map?.view)
      fail(`${what}: un drapeau demande une carte animée (map.view)`);
    if (!Object.hasOwn(FLAG_STATES, f.flag))
      fail(
        `${what}: pas de drapeau « ${f.flag} » dans assets/Flags (${Object.keys(FLAG_STATES).join(", ")})`
      );
    if (!f.say || !f.area || !f.from)
      fail(`${what}: un drapeau donne area, flag, from et say`);
    yearOf(f.from, `${what}, drapeau ${f.flag}`);
    if (f.to !== undefined) yearOf(f.to, `${what}, drapeau ${f.flag}`);
  }
  if (card.headline !== undefined) {
    const { lines, say, until } = card.headline;
    if (!Array.isArray(lines) || !lines.length || !say || !until)
      fail(`${what}: un bandeau de titre donne lines, say et until`);
    const plain = (l) => l.replace(/\[\[|\]\]/gu, "");
    if (lines.length > 2 || lines.some((l) => [...plain(l)].length > 18))
      fail(`${what}: Bandeau de titre : deux lignes de 18 caractères au plus`);
    if (card.era) fail(`${what}: Bandeau de titre : jamais avec le compteur`);
  }
}

// Every era, flash and counter roll of the video, in the order of its cards.
// The map shows today on the satellite until a card gives an era; paper is
// any date before today; a map card without an era after one goes back to
// today. Each change between satellite and paper is one flash.
export function planEras(seq, word, crossFade) {
  const dated = seq.cards.some((c) => c.era || c.flags);
  if (!dated) return null;
  const today = seq.today;
  if (!Number.isInteger(today))
    fail(
      "L'année d'aujourd'hui manque (today) : le compteur et les drapeaux en ont besoin"
    );
  let state = { date: today, paper: false };
  let counterBefore = false;
  const cards = {};
  const flashes = [];
  seq.cards.forEach((card, i) => {
    if (!isMapCard(card)) return;
    if (card.era) {
      const { date, label, say } = card.era;
      if (date > today)
        fail(
          `Card ${card.id}: l'époque ${date} est après aujourd'hui (${today})`
        );
      const start = word(i, say);
      const paper = date < today;
      const years = Math.abs(date - state.date);
      const frames =
        years <= 20
          ? DUR.counter[0]
          : years <= 150
            ? DUR.counter[1]
            : DUR.counter[2];
      if (paper !== state.paper) flashes.push({ card: i, start, paper });
      cards[i] = {
        start,
        from: state.date,
        to: date,
        label,
        frames: state.date === date ? 0 : frames,
        // A counter already on screen on the card before stays in the head.
        continued: counterBefore,
        digits: String(Math.max(state.date, date)).length,
      };
      state = { date, paper };
      counterBefore = true;
      return;
    }
    if (state.paper) {
      // Back to today: the same flash, on the card's change.
      flashes.push({
        card: i,
        start: seq.cardStarts[i] - crossFade,
        paper: false,
      });
    }
    cards[i] = { today: true };
    state = { date: today, paper: false };
    counterBefore = false;
  });
  flashes.sort((a, b) => a.start - b.start);
  for (let k = 1; k < flashes.length; k++)
    if (flashes[k].start - flashes[k - 1].start < ERA.flashGap)
      fail(
        `Card ${seq.cards[flashes[k].card].id}: Deux éclairs à moins de 2 s (${flashes[k].start - flashes[k - 1].start} images)`
      );
  return { today, cards, flashes };
}

// The flash's light at `frame` (0 to 0.92), the paper (0 to 1) and whether
// the inks are the paper's.
export function eraAt(plan, frame) {
  let paper = 0;
  let inks = false;
  let flash = 0;
  for (const f of plan.flashes) {
    if (frame < f.start) break;
    const k = frame - f.start;
    const [a, b] = f.paper ? [0, 1] : [1, 0];
    paper =
      a +
      (b - a) *
        ramp(frame, f.start + ERA.paperFrom, ERA.paperTo - ERA.paperFrom);
    inks = k >= ERA.inksAt ? f.paper : !f.paper;
    if (k < DUR.flash)
      flash =
        ERA.flashPeak *
        (k < ERA.flashPeakAt
          ? EASE.enter(k / ERA.flashPeakAt)
          : 1 -
            EASE.exit((k - ERA.flashPeakAt) / (DUR.flash - ERA.flashPeakAt)));
  }
  return { paper, inks, flash };
}

// The date the card shows at `frame`: before its era's word the date before
// it, then the counter's, which runs on `ease-land` and lands on the era.
export function counterValue(c, frame) {
  if (frame < c.start || !c.frames) return frame < c.start ? c.from : c.to;
  return c.from + (c.to - c.from) * EASE.land((frame - c.start) / c.frames);
}

// The counter in the head of an era card at `frame`.
export function counterAt(c, frame) {
  const value = counterValue(c, frame);
  const landed = frame - (c.start + c.frames);
  const settle =
    landed >= 0 && landed < ERA.settleFrames
      ? 1 + ERA.settle * Math.sin((Math.PI * landed) / ERA.settleFrames)
      : 1;
  const opacity = c.continued ? 1 : ramp(frame, c.start, DUR.micro, EASE.enter);
  return {
    value,
    year: Math.round(value),
    digits: c.digits,
    label: c.label,
    labelOpacity:
      landed >= 0 ? ramp(frame, c.start + c.frames, ERA.label, EASE.enter) : 0,
    settle,
    opacity,
    // The head's kicker and title give way to the counter.
    head: c.continued
      ? 0
      : 1 - ramp(frame, c.start - DUR.micro, DUR.micro, EASE.exit),
  };
}

// The years the counter shows, one tick a year, 25 a second at most.
export function counterTicks(c) {
  const ticks = [];
  let last = Math.round(c.from);
  let lastTick = -Infinity;
  for (let f = c.start; f <= c.start + c.frames; f++) {
    const year = Math.round(counterValue(c, f));
    if (year !== last && f - lastTick >= 30 / ERA.ticksPerSecond) {
      ticks.push(f);
      lastTick = f;
    }
    last = year;
  }
  return ticks;
}

// A card's flags: each checked against the dates the card shows, the area it
// fills and the voice's words, then the frames it shows, following the
// counter: unrolled where the date enters its period, rolled back as the date
// leaves it; a period crossed in under 30 frames shows no flag.
export const FLAGS = {
  unroll: 18,
  rollBack: 12,
  minShown: 30,
  opacity: 0.86,
  paperOpacity: 0.73,
};
export function planFlags(seq, i, word, areaOf, counter, end) {
  const card = seq.cards[i];
  const what = `Card ${card.id}`;
  const shown = counter
    ? [Math.min(counter.from, counter.to), Math.max(counter.from, counter.to)]
    : [seq.today, seq.today];
  return (card.flags ?? []).map((f) => {
    const area = areaOf(f.area);
    if (!area || area.category !== "country")
      fail(`${what}: Drapeau sur une aire qui n'est pas un État (${f.area})`);
    const [from, to] = [
      yearOf(f.from, what),
      f.to === undefined ? Infinity : yearOf(f.to, what),
    ];
    if (to < shown[0] || from > shown[1])
      fail(
        `${what}: Drapeau hors de la période de l'État (${f.flag}, ${f.from} à ${f.to ?? "aujourd'hui"})`
      );
    if (!voiceNamesState(seq, i, f.flag))
      fail(
        `${what}: Drapeau d'un État que la voix ne nomme pas (« ${FLAG_STATES[f.flag]} »)`
      );
    const say = word(i, f.say);
    // The intervals in which the card's date is in the flag's period.
    const intervals = [];
    let open = null;
    for (let fr = say; fr <= end; fr++) {
      const year = counter ? Math.round(counterValue(counter, fr)) : seq.today;
      const inside = year >= from && year <= to;
      if (inside && open === null) open = fr;
      if (!inside && open !== null) {
        intervals.push([open, fr - 1]);
        open = null;
      }
    }
    if (open !== null) intervals.push([open, Infinity]);
    return {
      area: f.area,
      file: area.file,
      flag: f.flag,
      shows: intervals.filter(
        ([a, b]) => b === Infinity || b - a >= FLAGS.minShown
      ),
    };
  });
}

// How far a flag is unrolled at `frame` (0 to 1), from its hoist.
export function flagUnroll(flag, frame) {
  for (const [a, b] of flag.shows) {
    if (frame < a) return 0;
    if (b !== Infinity && frame > b) continue;
    const on = ramp(frame, a, FLAGS.unroll, EASE.enter);
    const off =
      b === Infinity
        ? 0
        : ramp(frame, b - FLAGS.rollBack, FLAGS.rollBack, EASE.exit);
    return on * (1 - off);
  }
  return 0;
}

// Headline bands of a video: two at most, never with the counter, every
// word among the voice's words from its word to its `until`.
const HEADLINE = {
  slide: 1100,
  lineDelay: 2,
  outDelay: 1,
  blur: 34,
  stampFrom: 1.18,
};
const plainWords = (s) =>
  s
    .replace(/\[\[|\]\]/gu, "")
    .toLowerCase()
    .replace(/[’']/gu, "'")
    .split(/[\s,.;:!?«»()]+/u)
    .filter(Boolean);
export function planHeadlines(seq, word) {
  const bands = [];
  seq.cards.forEach((card, i) => {
    if (!card.headline) return;
    const { lines, say, until } = card.headline;
    const start = word(i, say);
    const end = word(i, until);
    if (end <= start)
      fail(`Card ${card.id}: Bandeau de titre : until vient après say`);
    const said = new Set(
      seq.chunks
        .filter((c) => c.card === i)
        .filter(
          (c) =>
            c.words.at(-1).end * 30 >= start && c.words[0].start * 30 <= end
        )
        .flatMap((c) => plainWords(c.text))
    );
    for (const w of lines.flatMap(plainWords))
      if (!said.has(w))
        fail(
          `Card ${card.id}: Bandeau de titre : « ${w} » n'est pas dit par la voix`
        );
    bands.push({ card: i, start, end, lines });
  });
  if (bands.length > 2)
    fail(
      `Card ${seq.cards[bands[2].card].id}: Bandeau de titre : deux par vidéo`
    );
  return bands;
}

// A band's lines at `frame`: each slides in from the left (`ease-enter`), the
// second 2 frames after, blurred along its speed; the key word stamps once
// its line has landed; out to the right at `until`.
export function headlineAt(band, frame) {
  const lines = band.lines.map((text, n) => {
    const t0 = band.start + n * HEADLINE.lineDelay;
    const k = ramp(frame, t0, DUR.band.in, EASE.enter);
    const o = ramp(
      frame,
      band.end + n * HEADLINE.outDelay,
      DUR.band.out,
      EASE.exit
    );
    const moving = (k > 0 && k < 1 ? 1 - k : 0) + (o > 0 && o < 1 ? o : 0);
    const stamp = ramp(frame, t0 + DUR.band.in + 2, DUR.stamp, EASE.enter);
    return {
      text,
      x: -HEADLINE.slide * (1 - k) + HEADLINE.slide * o,
      blur: HEADLINE.blur * moving,
      keyScale: HEADLINE.stampFrom + (1 - HEADLINE.stampFrom) * stamp,
      shown: frame >= t0 && o < 1,
    };
  });
  // The head steps aside 5 frames before the band and back 5 after it.
  const out = ramp(frame, band.start - DUR.micro, DUR.micro);
  const back = ramp(frame, band.end + DUR.band.out, DUR.micro);
  return { lines, head: 1 - Math.min(out, 1 - back) };
}
