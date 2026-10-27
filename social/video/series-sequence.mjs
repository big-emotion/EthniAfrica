// The map sequence of the series video (EthniAfrica Cartes 1.5.0, series.md
// « Map sequence », handoff.md « Renderer integration of 1.5.0 »): consecutive
// map cards with the same `map.sequence` share one map; each area enters on
// the word of the subtitle that says it, its name and its language after it;
// the view changes only during a card change. This module plans the
// sequence from the cards and the voice's word times, and gives the map's
// state at any frame, with no clock and no browser.
import {
  MAP_FRAME,
  MARKS,
  AREA_INKS,
  ZONE_INKS,
  ILLUSTRATIONS,
  BUBBLE_KINDS,
  areaStyle,
  arrowWidth,
  drawingHeight,
  fitMapCamera,
  flatProject,
  frameBounds,
  isAnimatedCard,
  loadSequenceArea,
  markInk,
  pushedBand,
  sequenceCredits,
} from "./series-map.mjs";
import { FPS, chunkUnits, estimateWidth, placeLabels } from "./sequence.mjs";
import { GLOBE, globeCamera, globeGrade } from "./page.mjs";
import {
  EASE,
  DUR,
  popAt,
  exitAt,
  popExit,
  swellAt,
  pushAt,
} from "./series-motion.mjs";
import {
  viewOf,
  planWhip,
  whipCamera,
  whipBlur,
  checkWhipGaps,
  planFlags,
  flagUnroll,
  eraAt,
  FLAGS,
  FLAG_STATES,
  voiceNamesState,
} from "./series-turns.mjs";
import { loadRiver } from "./rivers.mjs";
import {
  FIGURES,
  FIGURE_MARKS,
  planFigures,
  figuresAt,
  figureTexts,
  figureMarkOn,
  figureHeadAt,
  letteringFits,
  unitBox,
} from "./series-figures.mjs";
import {
  arrowCurve,
  cumulative,
  pointAt,
  polyline,
  arrowHead,
} from "./series-paths.mjs";
import { RECAP } from "./series-subject.mjs";
import { dirname } from "node:path";

// Frames at 30 fps (handoff.md, « Timing » and « Change of view »).
export const SEQUENCE_TIMING = {
  entry: 21, // an area fades in over 700 ms; two entries 700 ms apart
  nameAt: 0.6, // a name starts when its area is 60 % in
  name: 9,
  lang: 9,
  move: 27, // a change of view, 900 ms from the outgoing card's change start
  nameSwap: 5, // names leave in the move's first 5 frames, return 5 after
};
const CROSS_FADE = 9;
const MAX_NAMES = 4;
const fail = (message) => {
  throw new Error(message);
};
const toFrame = (seconds) => Math.round(seconds * FPS);
// Progress over `duration` frames, eased as an entry (0.4.0).
const span = (frames, duration) => EASE.enter(frames / duration);
// The first frame after an entry's start at which its area is at 0.6.
const NAME_DELAY = (() => {
  let k = 0;
  while (EASE.enter(k / SEQUENCE_TIMING.entry) < SEQUENCE_TIMING.nameAt) k++;
  return k;
})();

// The 0.4.0 placement rule with the 1.5.0 label: the name at 32/38 and, in
// a box reserved from the name's entry, its language at 26/30 under it.
const LABEL_STYLES = {
  stack: {
    sizes: [32],
    box: (text) => {
      const [name, lang] = text.split("\n");
      return [
        Math.max(estimateWidth(name, 32, 0.55), estimateWidth(lang, 26, 0.55)),
        68,
      ];
    },
  },
  area: { sizes: [32], box: (text) => [estimateWidth(text, 32, 0.55), 38] },
};

// A `say` names a unit of the card's subtitle, its punctuation and an elided
// particle aside: « qu'Amazigh, » says Amazigh.
const sameWord = (unit, word) => {
  const bare = unit.replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "");
  return (
    bare === word || bare.replace(/^\p{L}{1,3}['’](?=\p{L})/u, "") === word
  );
};
export function wordOf(seq, card, word) {
  let k = 0;
  for (const chunk of seq.chunks) {
    if (chunk.card !== card) continue;
    const i = chunkUnits(chunk.text).findIndex((u) => sameWord(u, word));
    if (i >= 0)
      return { frame: toFrame(chunk.words[i].start), at: `${k}:${i}` };
    k++;
  }
  return fail(
    `Card ${seq.cards[card].id}: Mot de la carte absent du sous-titre (« ${word} »)`
  );
}

const extent = (points) => ({
  west: Math.min(...points.map((p) => p[0])),
  east: Math.max(...points.map((p) => p[0])),
  south: Math.min(...points.map((p) => p[1])),
  north: Math.max(...points.map((p) => p[1])),
});
const within = (a, b) =>
  a.west >= b.west &&
  a.east <= b.east &&
  a.south >= b.south &&
  a.north <= b.north;
const outerPoints = (area) => area.polygons.flatMap((p) => p[0]);

// Where an area's name is anchored: the centroid of its largest outer ring.
function labelAnchor(area) {
  let best = null;
  for (const [ring] of area.polygons) {
    let a = 0;
    let x = 0;
    let y = 0;
    for (let i = 0; i + 1 < ring.length; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const cross = x0 * y1 - x1 * y0;
      a += cross;
      x += (x0 + x1) * cross;
      y += (y0 + y1) * cross;
    }
    if (!best || Math.abs(a) > Math.abs(best.a)) best = { a, x, y };
  }
  return [best.x / (3 * best.a), best.y / (3 * best.a)];
}

const sameCamera = (a, b) =>
  a.lon === b.lon && a.lat === b.lat && a.radius === b.radius;

// lon and lat linear, radius log-linear, at the eased progress `t`.
export function moveCamera(from, to, t) {
  if (t >= 1) return { ...to };
  return {
    lon: from.lon + (to.lon - from.lon) * t,
    lat: from.lat + (to.lat - from.lat) * t,
    radius: Math.exp(
      Math.log(from.radius) + (Math.log(to.radius) - Math.log(from.radius)) * t
    ),
    centreY: to.centreY,
  };
}

// The key an area is planned under: its file, or for the recap card (1.13.0)
// the file in the recap's own sequence.
const areaKey = (card, a) => (card.isRecap ? `rappel|${a.file}` : a.file);

// Every area of every sequence, once, with what the cards say of it: one
// name, one ink, one language, entered once.
function collectAreas(seq, runs, animated) {
  const areas = {};
  const owner = {};
  const names = {};
  const ids = {};
  for (const run of runs)
    for (const card of run.cards)
      for (const entry of seq.cards[card].map.areas) {
        // 1.11.0: the ink follows the people (input.inks).
        const a = animated[run.sequence]
          ? {
              ...entry,
              ink: markInk(
                entry,
                seq.inks,
                `Card ${seq.cards[card].id}, area ${entry.name}`
              ),
            }
          : entry;
        // 1.13.0: the recap card shows the previous episode's areas, which
        // this episode may draw again in its own sequence: keyed apart.
        const key = areaKey(seq.cards[card], a);
        if (owner[key] && owner[key] !== run.sequence)
          fail(`Area ${a.file} is in two map sequences of one video`);
        owner[key] = run.sequence;
        const area = (areas[key] ??= {
          ...loadSequenceArea(a.file),
          file: key,
          sequence: run.sequence,
          name: a.name,
          ink: a.ink,
          lang: a.lang,
        });
        if (ZONE_INKS.includes(area.ink) && !area.uncertain)
          fail(
            `Area ${a.file}: Encre ${area.ink} : réservée aux zones approximatives (hachurées), quatre encres sinon`
          );
        if (animated[run.sequence]) {
          const id = a.id ?? a.file.replace(/\.geojson$/u, "");
          if (area.id !== undefined && area.id !== id)
            fail(`Area ${a.file}: one id across the sequence`);
          if (
            ids[`${run.sequence}:${id}`] &&
            ids[`${run.sequence}:${id}`] !== key
          )
            fail(`Two areas of sequence ${run.sequence} share the id ${id}`);
          ids[`${run.sequence}:${id}`] = key;
          area.id = id;
          area.people ??= a.people;
          for (const s of a.states ?? [])
            (area.states ??= []).push({
              card,
              to: s.to,
              ...wordOf(seq, card, s.say),
            });
        }
        if (area.name !== a.name || area.ink !== a.ink)
          fail(
            `Area ${a.file}: one name, one ink across the sequence (« ${area.name} », ${area.ink})`
          );
        if (
          a.lang !== undefined &&
          area.lang !== undefined &&
          a.lang !== area.lang
        )
          fail(`Area ${a.file}: one language across the sequence`);
        area.lang ??= a.lang;
        if (a.say !== undefined || a.sayFrame !== undefined) {
          if (area.say) fail(`Area ${a.file} enters once: nothing replays`);
          // 1.13.0: the recap card's marks enter on frames of their own.
          area.say =
            a.sayFrame !== undefined
              ? { card, frame: a.sayFrame, at: `frame ${a.sayFrame}` }
              : { card, ...wordOf(seq, card, a.say) };
        }
        if (a.langSay !== undefined) {
          if (area.langSay) fail(`Area ${a.file}: its language enters once`);
          area.langSay = { card, ...wordOf(seq, card, a.langSay) };
        }
        (names[run.sequence] ??= new Map()).set(a.name, a.ink);
      }
  for (const [sequence, inks] of Object.entries(names)) {
    // 1.11.0 refines « one colour per name »: the ink follows the people, so
    // several names share their people's ink; four inks a sequence at most.
    if (animated[sequence]) continue;
    if (inks.size > MAX_NAMES)
      fail(
        `Cinq noms en couleur : quatre au plus (${[...inks.keys()].join(", ")})`
      );
    if (new Set(inks.values()).size < inks.size)
      fail("One colour per name: two names of a sequence share an ink");
  }
  return areas;
}

// Entry frames: on the word, or 21 frames after the previous entry of the
// sequence if that is later; areas named by one word enter together.
function scheduleEntries(areas) {
  const entries = {};
  const said = Object.values(areas)
    .filter((a) => a.say)
    .sort((a, b) => a.say.frame - b.say.frame || a.say.card - b.say.card);
  const last = {};
  for (const a of said) {
    const before = last[a.sequence];
    const key = `${a.say.card}:${a.say.at}`;
    const start =
      before?.key === key
        ? before.start
        : Math.max(
            a.say.frame,
            (before?.start ?? -Infinity) + SEQUENCE_TIMING.entry
          );
    last[a.sequence] = { key, start };
    entries[a.file] = { start };
  }
  for (const a of Object.values(areas)) {
    if (!a.langSay) continue;
    (entries[a.file] ??= {}).lang = a.langSay.frame;
  }
  return entries;
}

// Areas never said are on the map from the start; then the order of entry.
const entryOrder = (areas, entries) =>
  Object.keys(areas).sort(
    (a, b) =>
      (entries[a]?.start ?? -Infinity) - (entries[b]?.start ?? -Infinity)
  );

// One card's still view: fitted as in 1.4.1 on the areas it frames, its
// names placed once for the whole card, its key and credits.
function sequenceView(spec, areas, order, imagery, push) {
  const files = order.filter((f) =>
    spec.map.areas.some((a) => areaKey(spec, a) === f)
  );
  const points = files.flatMap((f) => outerPoints(areas[f]));
  const fitted = fitMapCamera(extent(points), imagery, points, push);
  const camera = {
    lon: fitted.lon,
    lat: fitted.lat,
    radius: fitted.radius,
    centreY: fitted.centreY,
  };
  const at = (lon, lat) => flatProject(camera, lon, lat);
  const labels = files.map((f) => {
    const a = areas[f];
    const [x, y] = at(...a.anchor);
    return {
      key: f,
      text: a.lang ? `${a.name}\n${a.lang}` : a.name,
      style: a.lang ? "stack" : "area",
      anchor: { x, y },
    };
  });
  if (labels.length > MAP_FRAME.maxNames)
    fail(
      `Card ${spec.id}: ${labels.length} names on the map, ${MAP_FRAME.maxNames} at most (a stack counts one)`
    );
  const placed = placeLabels(labels, [], {
    band: pushedBand(MAP_FRAME.names, push),
    styles: LABEL_STYLES,
  });
  // A name with no room stays in the key, where every name is listed (0.4.0).
  const names = placed.flatMap((p, i) => {
    if (!p.box) return [];
    const a = areas[files[i]];
    return [
      {
        file: a.file,
        text: a.name,
        ...(a.lang && { lang: a.lang }),
        ink: a.ink,
        anchor: a.anchor,
        box: p.box,
      },
    ];
  });
  const key = files.map((f) => ({
    file: f,
    swatch: `${areas[f].uncertain ? "uncertain" : "certain"}-${areas[f].ink}`,
    label: areas[f].name,
  }));
  if (spec.map.borders === "strong")
    key.push({ swatch: "border-strong", label: "Frontières actuelles" });
  const xs = [];
  const ys = [];
  for (const [lon, lat] of points) {
    const [x, y] = at(lon, lat);
    xs.push(x);
    ys.push(y);
  }
  const view = {
    camera,
    files,
    capped: fitted.capped,
    spanKm: fitted.spanKm,
    scale: (camera.radius * 2 * Math.PI) / imagery.width,
    names,
    key,
    borders: spec.map.borders ?? "none",
    credits: sequenceCredits(spec.map, imagery),
    subject: {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    },
  };
  checkView(spec, view, push);
  return view;
}

// Check 4 on each view, at 100 % and at the end of its push around
// (540, 1010) (1.13.0; the slow zoom before): the subject between y 724 and
// the foot, the scale limit, the names in the map band.
function checkView(spec, view, push) {
  const s = view.subject;
  const cy = view.camera.centreY;
  const top = cy + (s.y - cy) * push;
  const bottom = cy + (s.y + s.h - cy) * push;
  if (top < 724)
    fail(
      `Card ${spec.id}: Le sujet de la carte passe sous la tête (y ${Math.round(top)})`
    );
  if (bottom > MAP_FRAME.foot[0])
    fail(
      `Card ${spec.id}: the map's subject runs into the foot (y ${Math.round(bottom)})`
    );
  if (view.scale * push > MAP_FRAME.maxScale + 1e-9)
    fail(
      `Card ${spec.id}: Poussée au-delà de la limite de l'imagerie : cadrer plus large`
    );
  const [x0, x1] = MAP_FRAME.names.x;
  const [y0, y1] = MAP_FRAME.names.y;
  for (const { text, box } of view.names)
    if (box.x < x0 || box.x + box.w > x1 || box.y < y0 || box.y + box.h > y1)
      fail(`Card ${spec.id}: « ${text} » leaves the map band`);
}

// The sequence plan, or null when the video has none: its runs of
// consecutive cards, the areas, their entries, each card's view and the
// cameras its frames use.
export function planMapSequences(seq, imagery) {
  const runs = [];
  seq.cards.forEach((c, i) => {
    // 1.11.0: the opener on the globe is the first card of its sequence.
    const name = (c.type === "map" || c.opening === "globe") && c.map?.sequence;
    if (!name) return;
    const last = runs.at(-1);
    if (last?.sequence === name && last.cards.at(-1) === i - 1)
      last.cards.push(i);
    else runs.push({ sequence: name, cards: [i] });
  });
  if (!runs.length) return null;
  for (const name of new Set(runs.map((r) => r.sequence))) {
    const kinds = new Set(
      runs
        .filter((r) => r.sequence === name)
        .flatMap((r) => r.cards.map((i) => seq.cards[i].map.borders ?? "none"))
    );
    if (kinds.size > 1)
      fail(
        `Map sequence ${name} draws one kind of border, not ${[...kinds].join(" and ")}`
      );
  }
  // A sequence is animated (1.11.0) when one of its cards uses a new field;
  // the others are drawn exactly as in 1.5.0.
  const animated = {};
  for (const run of runs)
    animated[run.sequence] ||= run.cards.some((i) =>
      isAnimatedCard(seq.cards[i])
    );
  for (const name of Object.keys(animated)) animated[name] ||= false;
  if (Object.values(animated).some(Boolean)) checkInks(seq.inks);
  const areas = collectAreas(seq, runs, animated);
  const { entries, events, byFile } = scheduleEvents(seq, areas, animated);
  const order = entryOrder(areas, entries);
  const seen = [];
  for (const f of order) {
    const a = areas[f];
    a.anchor = labelAnchor(a);
    const box = extent(outerPoints(a));
    // An area inside an earlier one is hatched the other way (0.4.0).
    a.hatch = seen.some((b) => within(box, b)) ? 135 : 45;
    seen.push(box);
  }
  const starts = seq.cardStarts;
  for (const run of runs) {
    const [first, last] = [run.cards[0], run.cards.at(-1)];
    run.from = first ? starts[first] - CROSS_FADE + 1 : 0;
    run.to = last + 1 < starts.length ? starts[last + 1] - 1 : seq.frames - 1;
    run.globe = run.cards.some((i) => seq.cards[i].opening === "globe");
  }
  // 1.13.0, the continuous camera: every map card pushes in from its first
  // frame to its last, multiplied with every move; it replaces the slow zoom
  // of 1.4.0 and its exceptions of 1.11.0. A card's span runs from its change
  // of view (a run's first card from its first frame; the opener on the
  // globe from the dive's landing, the dive being its camera move) to the
  // frame before the next card's change. Each card is framed for its own
  // push, so the push of a card stays its own (series.md « 3 »).
  const span = (run, k) => {
    const i = run.cards[k];
    const from = k
      ? starts[i] - CROSS_FADE
      : run.globe
        ? Math.max(run.from, GLOBE.keys[2])
        : run.from;
    const to =
      k + 1 < run.cards.length
        ? starts[run.cards[k + 1]] - CROSS_FADE - 1
        : run.to;
    return { from, to };
  };
  // A 1.5.0 card frames the areas it lists, so consecutive cards listing the
  // same areas keep one view and one push: they are framed together, for
  // the push of all of them.
  const listed = (i) =>
    JSON.stringify(seq.cards[i].map.areas.map((a) => a.file).sort());
  const framedFor = (run, k) => {
    if (animated[run.sequence]) return span(run, k);
    let [a, b] = [k, k];
    while (a > 0 && listed(run.cards[a - 1]) === listed(run.cards[k])) a--;
    while (
      b + 1 < run.cards.length &&
      listed(run.cards[b + 1]) === listed(run.cards[k])
    )
      b++;
    return { from: span(run, a).from, to: span(run, b).to };
  };
  // A return to the same areas after a picture shows the same view: cards
  // listing the same areas are framed for the largest push among them.
  const pushes = {};
  const framing = (run, i) =>
    animated[run.sequence] ? `card ${i}` : `${run.sequence} ${listed(i)}`;
  for (const run of runs)
    run.cards.forEach((i, k) => {
      const { from, to } = framedFor(run, k);
      const key = framing(run, i);
      pushes[key] = Math.max(pushes[key] ?? 1, pushAt(to - from));
    });
  const views = {};
  for (const run of runs)
    run.cards.forEach((i) => {
      const push = pushes[framing(run, i)];
      views[i] = animated[run.sequence]
        ? animatedView(seq.cards[i], areas, order, imagery, push)
        : sequenceView(seq.cards[i], areas, order, imagery, push);
    });
  // Cards that keep one camera make one shot and continue one push, so
  // nothing jumps at their change; a change of view starts the next card's
  // own push, which the move between the two views blends in.
  // A whip zoom lands on a new place: the push starts again from its landing
  // (`landings`), the place before it having been left (1.13.0).
  const shots = {};
  const landings = {};
  for (const run of runs) {
    let shot = null;
    run.cards.forEach((i, k) => {
      const { from, to } = span(run, k);
      const before = k ? views[run.cards[k - 1]] : null;
      const endOfBefore =
        before && (before.stops?.at(-1).camera ?? before.camera);
      if (shot && sameCamera(endOfBefore, views[i].camera)) shot.to = to;
      else shot = { from, to };
      shots[i] = shot;
      const whip = seq.cards[i].whip;
      if (whip) {
        const start = wordOf(seq, i, whip.say).frame;
        shot.to = start;
        shot = { from: start + DUR.whip, to };
        landings[i] = shot;
      }
    });
  }
  for (const shot of new Set([
    ...Object.values(shots),
    ...Object.values(landings),
  ]))
    shot.end = pushAt(shot.to - shot.from);
  const pushEnd = (i) => Math.max(shots[i].end, landings[i]?.end ?? 1);
  // A shot of several cards pushes further than each card alone: its views
  // are checked again at the shot's end.
  for (const run of runs)
    for (const i of run.cards) {
      if (animated[run.sequence])
        for (const stop of views[i].stops)
          checkScale(seq.cards[i], stop.camera, imagery, pushEnd(i));
      else checkView(seq.cards[i], views[i], shots[i].end);
    }
  // The still views, and each pushed as far as its shot goes.
  const cameras = runs.flatMap((run) =>
    run.cards.flatMap((i) =>
      (views[i].stops?.map((s) => s.camera) ?? [views[i].camera]).flatMap(
        (c) => [c, { ...c, radius: c.radius * pushEnd(i) }]
      )
    )
  );
  const plan = {
    runs,
    imageryWidth: imagery.width,
    areas,
    entries,
    events,
    eventsByFile: byFile,
    order,
    views,
    shots,
    landings,
    animated,
    cards: {},
  };
  for (const run of runs) {
    for (const [k, i] of run.cards.entries()) {
      if (animated[run.sequence])
        plan.cards[i] = planAnimatedCard(seq, plan, run, k);
      const before = k
        ? (plan.cards[run.cards[k - 1]]?.endCamera ??
          views[run.cards[k - 1]].camera)
        : null;
      if (before && !sameCamera(before, views[i].camera))
        for (const t of [0.25, 0.5, 0.75])
          cameras.push(moveCamera(before, views[i].camera, t));
      // Every frame of a move inside a card, and of the globe's dive.
      for (const camera of plan.cards[i]?.cameras ?? []) cameras.push(camera);
    }
  }
  // The still views and samples of each move, with the ground each frame
  // shows: the renderer decides which need the full-resolution region.
  plan.cameras = cameras.map((camera) => ({
    camera,
    bounds: frameBounds(camera),
  }));
  seq.mapSequence = plan;
  // 1.13.0: never two whips within 4 s.
  checkWhipGaps(
    Object.entries(plan.cards).flatMap(([i, cp]) =>
      cp.moves
        .filter((m) => m.whip)
        .map((m) => ({ card: seq.cards[i].id, start: m.start }))
    )
  );
  for (const run of runs)
    if (animated[run.sequence])
      for (const i of run.cards) checkAnimatedCard(seq, i);
  return plan;
}

// 1.13.0, around a whip zoom: what was on the map leaves in the 6 frames
// before it (`ease-exit`) and does not come back, the new place being far
// away; what comes after enters once it has landed (series.md « 4 »).
function whipShown(cp, frame, start) {
  const whip = cp.moves.find((m) => m.whip);
  if (!whip) return 1;
  if (start >= whip.start) return frame < whip.end ? 0 : 1;
  const leave = whip.start - DUR.exit;
  if (frame < leave) return 1;
  if (frame >= whip.start) return 0;
  return 1 - EASE.exit((frame - leave) / DUR.exit);
}

// An animated card's camera at `frame`, pushed (1.13.0): its moves under the
// push of its shot; a whip from where that push had brought the camera to
// the new place, which then pushes from the landing.
function cameraOfCard(plan, i, frame) {
  const cp = plan.cards[i];
  const whip = cp.moves.find((m) => m.whip);
  if (whip && frame >= whip.start) {
    if (frame >= whip.end)
      return {
        camera: pushedCamera(whip.to, plan.landings[i], frame),
        moving: false,
      };
    const from = pushedCamera(whip.from, plan.shots[i], whip.start);
    return {
      camera: whipCamera({ ...whip, from }, frame),
      moving: frame > whip.start,
    };
  }
  const { camera, moving } = cardCamera(cp, frame);
  return { camera: pushedCamera(camera, plan.shots[i], frame), moving };
}

// A camera pushed as far as its shot has gone at `frame` (1.13.0).
const pushedCamera = (camera, shot, frame) => ({
  ...camera,
  radius: camera.radius * pushAt(frame - shot.from),
});

// A box drawn at rest, grown `push` times around the map's centre.
const pushedBox = (b, push, centreY) => ({
  x: 540 + (b.x - 540) * push,
  y: centreY + (b.y - centreY) * push,
  w: b.w * push,
  h: b.h * push,
});

export const runOfCard = (plan, card) =>
  plan ? plan.runs.findIndex((r) => r.cards.includes(card)) : -1;

// The run's map at a frame: its camera, zoom, areas, names and key items.
export function mapRunState(seq, r, frame) {
  const plan = seq.mapSequence;
  const run = plan.runs[r];
  if (plan.animated[run.sequence]) return animatedRunState(seq, r, frame);
  const changeStart = (card) => seq.cardStarts[card] - CROSS_FADE;
  let k = 0;
  while (k + 1 < run.cards.length && frame > changeStart(run.cards[k + 1])) k++;
  const view = plan.views[run.cards[k]];
  const before = k ? plan.views[run.cards[k - 1]] : null;
  // Frames since this card's change began; a run's first card has none.
  const t = before ? frame - changeStart(run.cards[k]) : Infinity;
  const moved = !!before && !sameCamera(before.camera, view.camera);
  const moving = moved && t < SEQUENCE_TIMING.move;
  // 1.13.0: the continuous push of the card's shot; a change of view blends
  // the outgoing shot's push into the incoming one's.
  const shot = plan.shots[run.cards[k]];
  const push = pushAt(frame - shot.from);
  const camera = moving
    ? moveCamera(
        pushedCamera(before.camera, plan.shots[run.cards[k - 1]], frame),
        pushedCamera(view.camera, shot, frame),
        EASE.enter(t / SEQUENCE_TIMING.move)
      )
    : pushedCamera(view.camera, shot, frame);
  const { entries } = plan;
  const newcomer = (f) => before && !before.files.includes(f);
  const leaving = before
    ? before.files.filter(
        (f) => !view.files.includes(f) && t < SEQUENCE_TIMING.move
      )
    : [];
  const entered = (f) =>
    entries[f]?.start === undefined
      ? // Listed with no word: on the map from the start, or, when a later
        // card adds it, faded in with the change.
        newcomer(f)
        ? span(t, SEQUENCE_TIMING.entry)
        : 1
      : span(frame - entries[f].start, SEQUENCE_TIMING.entry);
  const opacity = (f) =>
    view.files.includes(f)
      ? entered(f)
      : entered(f) * (1 - EASE.exit(t / SEQUENCE_TIMING.move));
  const shown = plan.order.filter(
    (f) => view.files.includes(f) || leaving.includes(f)
  );
  const swap = !moved
    ? 1
    : t <= SEQUENCE_TIMING.nameSwap
      ? 1 - EASE.exit(t / SEQUENCE_TIMING.nameSwap)
      : t < SEQUENCE_TIMING.move
        ? 0
        : EASE.enter((t - SEQUENCE_TIMING.move) / SEQUENCE_TIMING.nameSwap);
  // 1.13.0: a said area's name pops once its area is at 0.6 (the 1.5.0
  // name's 9 frames are the pop's).
  const namePop = (f) => {
    const e = entries[f];
    const pop =
      e?.start === undefined
        ? { opacity: entered(f), scale: 1 }
        : popAt(frame - e.start - NAME_DELAY);
    const out = leaving.includes(f)
      ? 1 - EASE.exit(t / SEQUENCE_TIMING.move)
      : 1;
    return { opacity: pop.opacity * out, scale: pop.scale };
  };
  // Until the move ends the names are the outgoing view's, carried by their
  // area's anchor under the moving camera; then the new view's.
  const source = moving ? before : view;
  const names = [
    ...source.names,
    ...(before && !moved
      ? before.names.filter((n) => leaving.includes(n.file))
      : []),
  ].map((n) => {
    const { opacity: own, scale } = namePop(n.file);
    const lang = n.lang
      ? Math.min(
          own,
          entries[n.file]?.lang === undefined
            ? 1
            : popAt(frame - entries[n.file].lang).opacity
        )
      : 0;
    // A name keeps its pixel size and follows its anchor under the camera.
    const [x, y] = flatProject(camera, ...n.anchor);
    const [x0, y0] = flatProject(source.camera, ...n.anchor);
    const box = { ...n.box, x: n.box.x + x - x0, y: n.box.y + y - y0 };
    return {
      file: n.file,
      text: n.text,
      ...(n.lang && { lang: n.lang }),
      ink: n.ink,
      box,
      opacity: own * swap,
      langOpacity: lang * swap,
      scale,
    };
  });
  // A key item follows its area.
  const keys = {};
  for (const f of shown) keys[f] = opacity(f);
  return {
    run: r,
    camera,
    moving,
    zoom: 1,
    push,
    scale: (camera.radius * 2 * Math.PI) / plan.imageryWidth,
    areas: shown.map((f) => ({
      file: f,
      opacity: opacity(f),
      // 1.13.0: a said area swells as it enters.
      swell:
        entries[f]?.start === undefined ? 1 : swellAt(frame - entries[f].start),
    })),
    names,
    keys,
    // The subject is checked on each still view, never in a move; it grows
    // with the push around the map's centre.
    subject: moving ? null : pushedBox(view.subject, push, camera.centreY),
  };
}

// ---------------------------------------------------------------------------
// Cartes 1.11.0, the animated satellite map (series.md « The animated
// satellite map », handoff.md « Renderer integration of 1.11.0 »). A
// sequence with one card using the new fields is planned and drawn here;
// a 1.5.0 sequence never reaches this code.

// Frames at 30 fps (handoff, step 2).
export const MAP_TIMING = {
  enter: 21, // an area enters over 700 ms, eased (0.2, 0, 0, 1)
  state: 15, // lit to context and back, 500 ms, symmetric
  ink: 18, // a change of ink, 600 ms, symmetric
  out: 15, // leaving, 500 ms, eased (0.4, 0, 1, 1)
  gap: 21, // two area events 700 ms apart, unless one word moves them
  arrowPx: 20, // an arrow draws 600 px a second ...
  arrow: [24, 48], // ... between 0.8 and 1.6 s
  arrowFade: 5, // its stroke comes in over 150 ms
  arrowGap: 21, // two arrow starts 700 ms apart at least
  trace: 15, // to trace (45 %) over 500 ms
  traceTo: 0.45,
  drawing: 12, // a drawing comes in over 400 ms, rising 8 px
  rise: 8,
  labelDelay: 5, // its label 150 ms later, over 300 ms
  label: 9,
  word: 9, // a word in and out over 300 ms
  place: 9,
  move: 48, // a move inside a card, 1.6 s
  moveGap: 60, // two moves 2 s apart at least
  maxMoves: 2,
  maxRatio: 2.5,
  nameFade: 5, // names fade out in the 150 ms before a move, back after it
  rename: 30, // the old name steps aside over 1 s ...
  renameNew: 15, // ... the new one enters 500 ms after it starts ...
  renameDates: 24, // ... and the dates at 0.8 s
  pictureMin: 180, // a picture phase holds 6 s at least
  openerMin: 165, // the opener on the globe holds 5.5 s at least
  silentStep: 3, // the silent viewing check samples every 100 ms
  silentCoverage: 0.8,
  silentDelay: 21,
};
// 1.16.0, a flag planted on its place (series.md « 1.16.0 », 3): the pole
// pops from its foot (the pop's one bounce, the canvas's « rebond ») and
// the cloth unrolls from the hoist as a territory's flag does (600 ms);
// swapped, the cloth folds back to the hoist (400 ms) and the next flag
// rises from the foot to the top of the pole (600 ms). Its size follows
// the drawings' height h: the pole is h tall, the cloth 0.72 h wide, 3:2.
export const PLANTED = {
  unrollFrom: 4,
  unroll: FLAGS.unroll,
  fold: FLAGS.rollBack,
  rise: FLAGS.unroll,
  cloth: 0.72,
  ratio: 2 / 3,
};
// 1.16.0, the word bubble: it glides towards its listener in 950 ms (the
// 1.14.0 name brought from outside) and turns gold with its new word over
// the last 300 ms; without a destination it turns in place.
export const BUBBLE = { glide: 28, morph: 9, text: 40 / 120 };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (frames, duration, ease = EASE.move) =>
  ease(clamp01(frames / duration));
const round2 = (n) => Math.round(n * 100) / 100;

function checkInks(inks = {}) {
  const used = new Map();
  for (const [people, ink] of Object.entries(inks)) {
    if (!AREA_INKS.includes(ink))
      fail(`inks: ${people}'s ink « ${ink} » is one of a to d`);
    if (used.has(ink))
      fail(
        `Une encre par peuple : ${used.get(ink)} et ${people} partagent l'encre ${ink}`
      );
    used.set(ink, people);
  }
}

// Area events of an animated sequence, entries and states together, each on
// its word or 21 frames after the event before it; one word, one start. On
// the globe nothing enters before the dive ends (4.4 s).
function scheduleEvents(seq, areas, animated) {
  const entries = scheduleEntries(
    Object.fromEntries(
      Object.entries(areas).filter(([, a]) => !animated[a.sequence])
    )
  );
  const queue = [];
  for (const a of Object.values(areas)) {
    if (!animated[a.sequence]) continue;
    if (a.say)
      queue.push({ file: a.file, to: "enter", ...a.say, seq: a.sequence });
    for (const s of a.states ?? [])
      queue.push({ file: a.file, ...s, seq: a.sequence });
  }
  queue.sort((x, y) => x.frame - y.frame || x.card - y.card);
  const events = [];
  const byFile = {};
  const last = {};
  for (const e of queue) {
    const word = `${e.card}:${e.at}`;
    const before = last[e.seq];
    const floor =
      seq.cards[e.card].opening === "globe" ? GLOBE.keys[2] : -Infinity;
    const start =
      before?.word === word
        ? before.start
        : Math.max(
            e.frame,
            floor,
            (before?.start ?? -Infinity) + MAP_TIMING.gap
          );
    last[e.seq] = { word, start };
    const event = { file: e.file, to: e.to, card: e.card, word, start };
    events.push(event);
    (byFile[e.file] ??= []).push(event);
    if (e.to === "enter") entries[e.file] = { start };
  }
  return { entries, events, byFile };
}

const ANIMATED_LABELS = {
  area: { sizes: [32], box: (t) => [estimateWidth(t, 32, 0.55), 38] },
  // The country's name as in 1.4.1's region names: Anton, tracked 0.12 em.
  country: {
    sizes: [44],
    box: (t) => [estimateWidth(t, 44, 0.58) + 0.12 * 44 * [...t].length, 52],
  },
};
const kmAcross = (radius) => (1080 / radius) * 6371;
// The scale limit at rest, then at the end of the run's push (1.13.0): a view
// the push would carry past the limit is framed wider.
function checkScale(spec, camera, imagery, push) {
  const scale = (camera.radius * 2 * Math.PI) / imagery.width;
  const limit = (MAP_FRAME.maxScale * imagery.width) / (2 * Math.PI);
  if (scale > MAP_FRAME.maxScale + 1e-9)
    fail(
      `Card ${spec.id}: Vue plus proche que l'imagerie vérifiée : ${Math.round(kmAcross(camera.radius))} km de large, ${Math.round(kmAcross(limit))} km au moins`
    );
  if (scale * push > MAP_FRAME.maxScale + 1e-9)
    fail(
      `Card ${spec.id}: Poussée au-delà de la limite de l'imagerie : cadrer plus large (${Math.round(kmAcross(camera.radius))} km de large, ${Math.round(kmAcross(limit / push))} km au moins pour une poussée de ${Math.round((push - 1) * 100)} %)`
    );
}

// One animated card's views: its own view, then the view after each move,
// with the area names placed once for each; its key and credits.
function animatedView(spec, areas, order, imagery, push) {
  const map = spec.map;
  if (!map.view)
    fail(`Card ${spec.id}: an animated map card frames its plan (map.view)`);
  const entry = (f) => map.areas.find((a) => areaKey(spec, a) === f);
  const files = order.filter((f) => entry(f));
  const centreY = MAP_FRAME.centre[1];
  // 1.13.0: a whip lands on a view of its own, after the card's moves.
  const cams = [
    map.view,
    ...(map.moves ?? []),
    ...(spec.whip ? [viewOf(spec.whip.to, `Card ${spec.id}, whip`)] : []),
  ].map(({ lon, lat, radius }) => ({ lon, lat, radius, centreY }));
  for (const c of cams) checkScale(spec, c, imagery, push);
  const labelled = files.filter((f) => (entry(f).label ?? "area") !== "none");
  const place = (camera) => {
    const at = (p) => flatProject(camera, ...p);
    const fixed = [];
    const free = [];
    for (const f of labelled) {
      const style = entry(f).label ?? "area";
      const text = areas[f].name;
      if (entry(f).nameAt) {
        const [x, y] = at(entry(f).nameAt);
        const [w, h] = ANIMATED_LABELS[style].box(text);
        fixed.push({
          file: f,
          text,
          style,
          anchor: entry(f).nameAt,
          box: { x: x - w / 2, y: y - h / 2, w, h },
        });
      } else {
        const [x, y] = at(areas[f].anchor);
        free.push({
          key: f,
          file: f,
          text,
          style,
          anchor: { x, y },
          lonlat: areas[f].anchor,
        });
      }
    }
    const placed = placeLabels(
      free,
      fixed.map((n) => n.box),
      {
        band: pushedBand(MAP_FRAME.names, push),
        styles: ANIMATED_LABELS,
      }
    );
    return [
      ...fixed,
      ...free.flatMap((n, k) =>
        placed[k].box
          ? [
              {
                file: n.file,
                text: n.text,
                style: n.style,
                anchor: n.lonlat,
                box: placed[k].box,
              },
            ]
          : []
      ),
    ].map((n) => ({ ...n, ink: areas[n.file].ink }));
  };
  const stops = cams.map((camera) => ({ camera, names: place(camera) }));
  // The opener on the globe has no key: its foot is the credit alone.
  const key =
    spec.opening === "globe"
      ? []
      : map.key
        ? map.key.map((k) => ({ swatch: k.swatch, label: k.label }))
        : files.map((f) => ({
            file: f,
            swatch: `${areas[f].uncertain ? "uncertain" : "certain"}-${areas[f].ink}`,
            label: areas[f].name,
          }));
  if (!map.key && map.borders === "strong")
    key.push({ swatch: "border-strong", label: "Frontières actuelles" });
  const credits = sequenceCredits(map, imagery);
  return {
    camera: stops[0].camera,
    files,
    stops,
    names: stops[0].names,
    labels: Object.fromEntries(files.map((f) => [f, entry(f).label ?? "area"])),
    capped: false,
    spanKm: kmAcross(stops[0].camera.radius),
    scale: (stops[0].camera.radius * 2 * Math.PI) / imagery.width,
    key,
    borders: map.borders ?? "none",
    credits: {
      ...credits,
      ...(spec.opening === "globe" && {
        globe: `Imagerie : ${imagery.credit}`,
      }),
      // 1.13.0: the era map is the imagery re-inked, its coast Natural
      // Earth's.
      ...(spec.era && {
        era: "Carte d’époque : imagerie NASA retraitée, Natural Earth",
      }),
    },
    subject: null,
  };
}

// A move inside a card, or the globe: one camera path through its keys with
// zero speed at both ends, the radius in log (series.md, « 7 »).
function cardCamera(cp, frame) {
  if (cp.globe && frame < GLOBE.keys[2])
    return { camera: globeCamera(cp.view, frame), moving: frame > 0 };
  let camera = cp.view;
  for (const m of cp.moves) {
    if (frame < m.start) break;
    if (frame >= m.end) {
      camera = m.to;
      continue;
    }
    // 1.13.0: the whip zoom runs its own path, out to the globe and in.
    if (m.whip)
      return { camera: whipCamera(m, frame), moving: frame > m.start };
    const s = (frame - m.start) / (m.end - m.start);
    const h = EASE.move(s);
    return {
      camera: {
        lon: m.from.lon + (m.to.lon - m.from.lon) * h,
        lat: m.from.lat + (m.to.lat - m.from.lat) * h,
        radius: Math.exp(
          Math.log(m.from.radius) +
            (Math.log(m.to.radius) - Math.log(m.from.radius)) * h
        ),
        centreY: m.to.centreY,
      },
      moving: frame > m.start,
    };
  }
  return { camera: { ...camera }, moving: false };
}

// A phrase on the map: 26 characters a line, two lines at most.
function wrapPhrase(spec, text) {
  const lines = [];
  for (const word of text.split(/\s+/u)) {
    const line = lines.at(-1);
    if (
      line !== undefined &&
      [...`${line} ${word}`].length <= MARKS.phraseChars
    )
      lines[lines.length - 1] = `${line} ${word}`;
    else lines.push(word);
  }
  if (lines.length > 2)
    fail(
      `Card ${spec.id}: « ${text} » tient plus de deux lignes de ${MARKS.phraseChars} caractères`
    );
  return lines;
}

function checkMoves(spec, moves) {
  if (moves.length > MAP_TIMING.maxMoves)
    fail(
      `Card ${spec.id}: Deux mouvements au plus dans une carte (${moves.length})`
    );
  moves.forEach((m, n) => {
    if (n && m.start - moves[n - 1].start < MAP_TIMING.moveGap)
      fail(
        `Card ${spec.id}: 60 images au moins entre deux mouvements (${m.start - moves[n - 1].start})`
      );
    const ratio = Math.max(
      m.to.radius / m.from.radius,
      m.from.radius / m.to.radius
    );
    if (ratio > MAP_TIMING.maxRatio + 1e-9)
      fail(
        `Card ${spec.id}: un mouvement change l'échelle de ${ratio.toFixed(2)} fois : rapport de 2,5 au plus`
      );
  });
}

// One animated card's timeline: its moves, arrows, drawings, words, places
// and rename, each on the start frame of its word.
function planAnimatedCard(seq, plan, run, k) {
  const i = run.cards[k];
  const spec = seq.cards[i];
  const map = spec.map;
  const view = plan.views[i];
  const what = `Card ${spec.id}`;
  const word = (w) => wordOf(seq, i, w).frame;
  const globe = spec.opening === "globe";
  const start = seq.cardStarts[i];
  const end =
    i + 1 < seq.cardStarts.length
      ? seq.cardStarts[i + 1] - CROSS_FADE
      : seq.frames;
  if (globe && end + CROSS_FADE < MAP_TIMING.openerMin)
    fail(
      `${what}: L'ouverture du globe tient 5,5 s au moins (${((end + CROSS_FADE) / FPS).toFixed(1)} s)`
    );
  const moves = [];
  for (const [n, m] of (map.moves ?? []).entries()) {
    const s = word(m.say);
    moves.push({
      start: s,
      end: s + MAP_TIMING.move,
      from: view.stops[n].camera,
      to: view.stops[n + 1].camera,
    });
  }
  checkMoves(spec, moves);
  if (spec.whip)
    moves.push(
      planWhip(
        spec,
        word(spec.whip.say),
        view.stops.at(-2).camera,
        view.stops.at(-1).camera,
        moves
      )
    );
  // A move inside the card starts once the change of view into the card,
  // 27 frames from its change, is over: two camera paths never overlap.
  const before = k ? plan.cards[run.cards[k - 1]] : null;
  if (before && !sameCamera(before.endCamera, view.camera)) {
    const free = seq.cardStarts[i] - CROSS_FADE + SEQUENCE_TIMING.move;
    if (moves.some((m) => m.start < free))
      fail(
        `${what}: un mouvement commence pendant le changement de vue entre deux cartes (avant l'image ${free})`
      );
  }
  const cp = { card: i, start, end, view: view.camera, globe, moves };
  const cameraAt = (f) => cardCamera(cp, f).camera;
  // 1.13.0 and 1.14.0: a place by its id among the run's places, or a point.
  const placeAt = placeFinder(seq, run, what);
  // 1.14.0: a pin is a reading's name popped where its language comes from,
  // with a teal arrow (ink b) to the place the word named; it steps back to
  // 35 % on its `dim`.
  const pins = (spec.pins ?? []).map((p) => ({
    id: p.id,
    from: p.at,
    to: placeAt(p.to),
    say: p.say,
    bend: p.bend ?? 0.12,
    pin: true,
    ...(typeof p.to === "string" && {
      place: {
        name: placeAt.places[p.to].name,
        at: placeAt.places[p.to].at,
        side: placeAt.places[p.to].side ?? "right",
      },
    }),
    ...(p.dim !== undefined && { dim: p.dim }),
  }));
  // Arrows in the order of their words, one drawing at a time.
  const arrows = [];
  const said = [...(map.arrows ?? []), ...pins]
    .map((a) => ({ a, at: word(a.say) }))
    .sort((x, y) => x.at - y.at);
  for (const { a, at } of said) {
    const prev = arrows.at(-1);
    const s = Math.max(
      at,
      prev ? prev.start + Math.max(MAP_TIMING.arrowGap, prev.dur) : -Infinity
    );
    const shape = { from: a.from, to: a.to, via: a.via, bend: a.bend ?? 0.18 };
    const length = cumulative(arrowCurve(shape, cameraAt(s))).at(-1);
    const [lo, hi] = a.pin ? FIGURES.pinArrow : MAP_TIMING.arrow;
    const dur = Math.min(
      hi,
      Math.max(lo, Math.round(length / MAP_TIMING.arrowPx))
    );
    arrows.push({
      id: a.id,
      ...shape,
      both: !!a.both,
      ...(a.sea && { sea: true }),
      ink: a.pin ? "b" : markInk(a, seq.inks, `${what}, arrow ${a.id}`),
      ...(a.pin && { pin: true }),
      ...(a.place && { place: a.place }),
      ...(a.dim !== undefined && { dim: word(a.dim) }),
      start: s,
      dur,
      length,
      ...(a.trace !== undefined && { trace: word(a.trace) }),
      ...(a.out !== undefined && { out: word(a.out) }),
    });
  }
  for (const a of arrows)
    for (const m of moves)
      if (m.start < a.start + a.dur && a.start < m.end)
        fail(
          `${what}: un mouvement tombe pendant qu'une flèche se trace (${a.id})`
        );
  const drawings = (map.drawings ?? []).map((d) => {
    const start = word(d.say);
    const base = {
      at: d.at,
      start,
      end: d.until !== undefined ? word(d.until) : Infinity,
    };
    // 1.16.0: a flag planted on its place, and the one it is swapped for.
    if (d.flag !== undefined) {
      for (const flag of [d.flag, d.swap?.flag].filter(Boolean))
        if (!voiceNamesState(seq, i, flag))
          fail(
            `${what}: Drapeau d'un État que la voix ne nomme pas (« ${FLAG_STATES[flag]} »)`
          );
      const swap = d.swap && { flag: d.swap.flag, start: word(d.swap.say) };
      if (swap && swap.start < start + PLANTED.unrollFrom + PLANTED.unroll)
        fail(
          `${what}: le drapeau ${d.flag} se replie avant d'être planté (swap)`
        );
      return {
        ...base,
        kind: "flag",
        flag: d.flag,
        ...(swap && { swap }),
        label: null,
        images: [],
      };
    }
    // 1.16.0: the word bubble, and the word it becomes on its morph.
    const morph = d.morph && {
      word: d.morph.word,
      start: word(d.morph.say),
      ...(d.morph.to && { to: d.morph.to }),
    };
    if (morph && morph.start <= start)
      fail(`${what}: la bulle change de mot après être apparue (morph)`);
    return {
      ...base,
      kind: d.kind,
      label: d.label === false ? null : (d.label ?? ILLUSTRATIONS[d.kind]),
      ...(d.word !== undefined && { word: d.word }),
      ...(morph && { morph }),
      images: morph ? [d.kind, BUBBLE_KINDS.to] : [d.kind],
    };
  });
  // 1.14.0: a pin's name under its point, in the reading arrow's ink.
  const pinWords = (spec.pins ?? []).map((p) => ({
    text: p.name,
    kind: "name",
    at: p.at,
    // Under its point (above with `side: "above"`), or `dy` px from it.
    offset: p.dy ?? (p.side === "above" ? -38 : 40),
    say: p.say,
    ink: "b",
    ...(p.dim !== undefined && { dim: p.dim }),
  }));
  const words = [...(map.words ?? []), ...pinWords]
    .map((w) => {
      const kind = w.kind ?? "phrase";
      return {
        text: w.text,
        kind,
        // A colony's name set as a word counts among the names, not the words.
        word: kind !== "name" && kind !== "country",
        lines:
          kind === "date" || kind === "country" || kind === "century"
            ? [w.text]
            : wrapPhrase(spec, w.text),
        ...(w.offset && { offset: w.offset }),
        at: w.at,
        start: w.sayFrame ?? word(w.say),
        ...(w.until !== undefined && { until: word(w.until) }),
        ...(w.dim !== undefined && { dim: word(w.dim) }),
        ink:
          w.people !== undefined || w.ink !== undefined
            ? markInk(w, seq.inks, `${what}, « ${w.text} »`)
            : null,
      };
    })
    .sort((a, b) => a.start - b.start);
  for (const w of words) w.end = w.until ?? Infinity;
  // Two words at once: a third makes the oldest leave.
  for (const w of words) {
    if (!w.word) continue;
    const on = words
      .filter((o) => o !== w && o.word && o.start <= w.start && o.end > w.start)
      .sort((a, b) => a.start - b.start);
    if (on.length >= MARKS.maxWords) on[0].end = w.start;
  }
  const places = (map.places ?? []).map((p) => ({
    name: p.name,
    at: p.at,
    side: p.side ?? "right",
    start: p.say !== undefined ? word(p.say) : start,
    written: p.label !== "none",
  }));
  const rename = map.rename && { ...map.rename, start: word(map.rename.say) };
  // 1.13.0: flags inside a state, following the counter; drawn marks.
  const areaById = (ref) =>
    Object.values(plan.areas).find(
      (a) => a.sequence === run.sequence && a.id === ref
    );
  const flags = seq.eras
    ? planFlags(
        seq,
        i,
        (j, unit) => wordOf(seq, j, unit).frame,
        areaById,
        seq.eras.cards[i]?.from === undefined ? null : seq.eras.cards[i],
        end + CROSS_FADE
      )
    : [];
  const marks = planMarks(seq, i, run, cameraAt, areaById);
  // The camera closes in on a voyage's stop once the ship is there: a ship
  // and the ground moving at once lose the route.
  for (const mk of marks.filter((x) => x.highlight))
    for (const mv of moves.filter((x) => !x.whip))
      if (mv.start < mk.highlight.end && mk.highlight.start < mv.end)
        fail(
          `${what}: un mouvement commence pendant que le navire fait route (images ${mk.highlight.start} à ${mk.highlight.end})`
        );
  const pushed = (c, f) => pushedCamera(c, plan.shots[i], f);
  // 1.14.0: the figures drawn on the map, on the camera as pushed; units
  // are placed in the band the rest of the card's push leaves them.
  const shotPush = (f) => pushAt(f - plan.shots[i].from);
  const figures = planFigures(seq, i, {
    word,
    end,
    dir: dirname(seq.cardsFile),
    cameraAt: (f) => pushed(cameraAt(f), f),
    pushFrom: (f) => shotPush(end) / shotPush(f),
    placeAt,
    areaOf: (id) => areaById(id),
    arrowOf: (id) => arrows.find((a) => a.id === id),
  });
  // The frames the imagery shows: the globe's dive and every move.
  const cameras = [];
  if (globe)
    for (let f = 6; f < GLOBE.keys[2]; f += 6) cameras.push(cameraAt(f));
  for (const m of moves)
    for (let f = m.start + 6; f < m.end; f += 6)
      cameras.push(pushed(cameraAt(f), f));
  const firstMark = Math.min(
    ...view.files.map((f) => plan.entries[f]?.start ?? Infinity),
    Infinity
  );
  return {
    ...cp,
    arrows,
    drawings,
    words,
    places,
    rename,
    flags,
    marks,
    figures,
    // 1.13.0: the recap card's map is a memory, desaturated.
    recap: !!spec.isRecap,
    facts: map.facts ?? [],
    endCamera: moves.at(-1)?.to ?? view.camera,
    cameras,
    firstMark,
  };
}

// An area's opacity, lit and inks at a frame, from its events (series.md,
// « 2. Area states »). `base` is the opacity of an area with no entry of its
// own: on the map from the start, or faded in with the card change.
function areaState(plan, file, frame, base) {
  let opacity = base ?? 0;
  let lit = 1;
  let inks = [{ ink: plan.areas[file].ink, w: 1 }];
  // 1.13.0: the fill swells as the area enters; the outline does not move.
  let swell = 1;
  for (const e of plan.eventsByFile[file] ?? []) {
    if (e.start > frame) break;
    const p = frame - e.start;
    if (e.to === "enter") {
      opacity = Math.max(opacity, ramp(p, MAP_TIMING.enter, EASE.enter));
      swell = swellAt(p);
    } else if (e.to === "lit") {
      if (opacity < 1)
        opacity = Math.max(opacity, ramp(p, MAP_TIMING.enter, EASE.enter));
      lit += (1 - lit) * ramp(p, MAP_TIMING.state);
    } else if (e.to === "context") lit -= lit * ramp(p, MAP_TIMING.state);
    else if (e.to === "out") opacity *= 1 - ramp(p, MAP_TIMING.out, EASE.exit);
    else {
      const q = ramp(p, MAP_TIMING.ink);
      inks = [
        ...inks.map((l) => ({ ink: l.ink, w: l.w * (1 - q) })),
        { ink: e.to.slice(4), w: q },
      ].filter((l) => l.w > 0.001);
    }
  }
  return { opacity, lit, inks, swell };
}
// Every ink an area takes over its sequence: its own first, then each ink
// change in the order of its events, as areaState reads them. The page makes
// one layer per ink in setup, in this order (operator, 19 October 2026).
const AREA_STATES = new Set(["enter", "lit", "context", "out"]);
export const areaInks = (plan, file) => [
  ...new Set([
    plan.areas[file].ink,
    ...(plan.eventsByFile[file] ?? [])
      .filter((e) => !AREA_STATES.has(e.to))
      .map((e) => e.to.slice(4)),
  ]),
];
function screenBox(area, camera) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [lon, lat] of outerPoints(area)) {
    const [x, y] = flatProject(camera, lon, lat);
    [x0, y0, x1, y1] = [
      Math.min(x0, x),
      Math.min(y0, y),
      Math.max(x1, x),
      Math.max(y1, y),
    ];
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Names fade out in the 5 frames before a move inside the card and come
// back 5 frames after it, at the next view's places.
function nameStop(cp, frame) {
  let stop = 0;
  let factor = 1;
  const fade = MAP_TIMING.nameFade;
  for (const [n, m] of cp.moves.entries()) {
    if (frame < m.start - fade) break;
    if (frame < m.start) {
      factor = 1 - EASE.exit((frame - (m.start - fade)) / fade);
      break;
    }
    if (frame < m.end) {
      factor = 0;
      break;
    }
    stop = n + 1;
    factor = frame < m.end + fade ? EASE.enter((frame - m.end) / fade) : 1;
  }
  return { stop, factor };
}

const textBox = (x, y, w, h) => ({ x: x - w / 2, y: y - h / 2, w, h });
const styleBox = (style, lines) => {
  const s = MARKS.styles[style];
  const w = Math.max(...lines.map((l) => estimateWidth(l, s.size, s.ratio)));
  return [
    w +
      (style === "country"
        ? 0.1 * s.size * Math.max(...lines.map((l) => [...l].length))
        : 0),
    s.line * lines.length,
  ];
};

// ---------------------------------------------------------------------------
// 1.13.0, drawn marks (series.md « 7. Drawn marks »): a river named by the
// voice, a dotted route for one journey, a hand-drawn circle round a place,
// a cross for what ended, a pin, a curved double arrow for an exchange.
// Their widths scale with the arrow width W of 1.11.0, the table's values
// standing at W = 7, the boards' width.
export const DRAWN = {
  maxOnScreen: 3,
  pxPerFrame: 500 / 30,
  river: [45, 60],
  route: [24, 75],
  circle: 14,
  cross: { stroke: 4, apart: 4, half: 22 },
  exchange: 24,
  exchangeBend: 0.25,
  exchangeGap: 13,
  circleBox: { rx: 150, ry: 62, dx: 92, overshoot: 0.45 },
  // Round a place whose name is not written (a universal map, 1.16.0): the
  // circle has no name to take in, so it rings the dot alone (board S8).
  circleBare: 46,
  boardWidth: 7,
};
const KINDS = ["river", "route", "circle", "cross", "pin", "exchange", "lords"];
// Narration v4 of « Zaïre », board S8: a long sea route is first shown whole
// in grey (its context: where the voyage leads), then its part up to a stop
// lights in its ink while the ship sails on its tip, from its word to the
// stop's word, eased (`ease-move`), and stays there. The ship is a symbol at
// three quarters of a drawing's height, the board's 110 px at h = 150.
export const VOYAGE = {
  ship: 0.75,
  contextInk: "#cfc4b2",
  contextOpacity: 0.75,
  contextR: 0.4,
};
// Board S9: the lords of a kingdom's provinces, each on its province, pop
// one by one (200 ms apart, the drawings' 400 ms entry) at 60 % of a
// drawing's height (the board's 82 px lords beside a 122 px king); on the
// king's word a gold line draws from him to each of them in 400 ms, as
// they were named by him. One mark, however many lords: they read as one
// figure, the kingdom, so they count once among the drawn marks and never
// among the three drawings.
export const LORDS_TIMING = {
  apart: 6,
  link: 12,
  lord: 0.6,
  ink: "#ffd36b",
  width: 4,
  keyline: 9,
};
const isPoint = (p) =>
  Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const clampFrames = (length, [lo, hi]) =>
  Math.min(hi, Math.max(lo, Math.round(length / DRAWN.pxPerFrame)));

// A place by its id among the run's places (1.13.0), or a [lon, lat] point.
function placeFinder(seq, run, what) {
  const places = {};
  for (const j of run.cards)
    for (const p of seq.cards[j].map.places ?? []) if (p.id) places[p.id] = p;
  const placeAt = (ref) => {
    if (isPoint(ref)) return ref;
    const p = places[ref];
    if (!p) fail(`${what}: lieu inconnu pour un trait : « ${ref} »`);
    return p.at;
  };
  placeAt.places = places;
  return placeAt;
}

function planMarks(seq, i, run, cameraAt, areaById) {
  const card = seq.cards[i];
  const what = `Card ${card.id}`;
  const word = (w) => wordOf(seq, i, w).frame;
  const placeAt = placeFinder(seq, run, what);
  const places = placeAt.places;
  return (card.marks ?? []).map((m) => {
    if (!KINDS.includes(m.kind))
      fail(`${what}: un trait est ${KINDS.join(", ")} (« ${m.kind} »)`);
    if (typeof m.say !== "string" || !m.say)
      fail(`${what}: un trait nomme son mot (say)`);
    const start = word(m.say);
    const end = m.until === undefined ? Infinity : word(m.until);
    const base = { kind: m.kind, start, end };
    const ink = () => markInk(m, seq.inks, `${what}, ${m.kind}`) ?? "w";
    if (m.kind === "river") {
      const river = loadRiver(m.path);
      const length = cumulative(
        river.points.map((p) => flatProject(cameraAt(start), ...p))
      ).at(-1);
      return {
        ...base,
        points: river.points,
        dur: clampFrames(length, DRAWN.river),
      };
    }
    if (m.kind === "route") {
      if (m.sea !== undefined && m.sea !== true)
        fail(`${what}: sea est true ou absent`);
      const via = (m.via ?? []).map(placeAt);
      if (via.length < 2)
        fail(`${what}: une route passe par deux lieux au moins`);
      const shape = {
        from: via[0],
        to: via.at(-1),
        via: via.slice(1, -1),
        bend: 0,
      };
      const length = cumulative(arrowCurve(shape, cameraAt(start))).at(-1);
      const dur = clampFrames(length, DRAWN.route);
      let highlight = null;
      if (m.highlight) {
        const h = m.highlight;
        if (!m.sea) fail(`${what}: seule une route maritime (sea) a un navire`);
        const [lon, lat] = placeAt(h.to);
        const stop = via.findIndex(
          (p, k) => k > 0 && p[0] === lon && p[1] === lat
        );
        if (stop < 1)
          fail(
            `${what}: la partie éclairée s'arrête à une étape de la route (highlight.to)`
          );
        if (!Object.hasOwn(ILLUSTRATIONS, h.ship))
          fail(`${what}: no drawing « ${h.ship} » for the ship`);
        const [from, to] = [word(h.say), word(h.until)];
        if (to <= from)
          fail(`${what}: le navire arrive après son départ (highlight.until)`);
        if (from < start + dur)
          fail(`${what}: le navire part une fois la route tracée en gris`);
        highlight = { stop, start: from, end: to, ship: h.ship };
      }
      return {
        ...base,
        shape,
        ink: ink(),
        dur,
        sea: !!m.sea,
        ...(highlight && { highlight }),
      };
    }
    if (m.kind === "lords") {
      const lords = (m.areas ?? []).map((id) => {
        const onCard = (card.map.areas ?? []).some(
          (a) => (a.id ?? a.file.replace(/\.geojson$/u, "")) === id
        );
        const area = onCard && areaById(id);
        if (!area)
          fail(
            `${what}: un seigneur se tient sur une aire de la carte (« ${id} »)`
          );
        return { area: id, at: area.anchor };
      });
      if (!lords.length) fail(`${what}: des seigneurs sur leurs aires (areas)`);
      return {
        ...base,
        id: m.id ?? "lords",
        king: placeAt(m.king),
        lords,
        links: m.linkSay === undefined ? start : word(m.linkSay),
        dur: (lords.length - 1) * LORDS_TIMING.apart + MAP_TIMING.drawing,
      };
    }
    if (m.kind === "exchange") {
      const [a, b] = (m.between ?? []).map(placeAt);
      if (!a || !b) fail(`${what}: un échange relie deux lieux (between)`);
      return { ...base, a, b, ink: ink(), dur: DRAWN.exchange };
    }
    // A circle surrounds a place and a cross marks one: never an area, a
    // people or a person (series.md « 7 »).
    if (typeof m.at === "string" && areaById(m.at))
      fail(
        m.kind === "cross"
          ? `${what}: Une croix ne marque jamais un peuple ni une aire (« ${m.at} »)`
          : `${what}: Un cercle entoure un lieu, jamais une aire (« ${m.at} »)`
      );
    if (typeof m.at === "string" && Object.hasOwn(seq.inks ?? {}, m.at))
      fail(`${what}: Une croix ne marque jamais un peuple (« ${m.at} »)`);
    const at = placeAt(m.at);
    const side =
      typeof m.at === "string" ? (places[m.at]?.side ?? "right") : "right";
    if (m.kind === "circle") {
      const bare = typeof m.at === "string" && places[m.at]?.label === "none";
      return { ...base, at, side, ...(bare && { bare }), dur: DRAWN.circle };
    }
    if (m.kind === "cross")
      return { ...base, at, dur: DRAWN.cross.apart + DRAWN.cross.stroke };
    return { ...base, at, dur: DUR.pop };
  });
}

const offsetPoints = (pts, by) =>
  pts.map((p, n) => {
    const [q1, q2] = [
      pts[Math.max(0, n - 1)],
      pts[Math.min(pts.length - 1, n + 1)],
    ];
    const ang = Math.atan2(q2[1] - q1[1], q2[0] - q1[0]);
    return [p[0] - Math.sin(ang) * by, p[1] + Math.cos(ang) * by];
  });

// The drawn marks of a card at a frame, in frame pixels.
function drawnMarks(cp, frame, camera, proportion, fade, shown) {
  const W = proportion.w;
  const k = W / DRAWN.boardWidth;
  return cp.marks.flatMap((m) => {
    if (frame < m.start) return [];
    const out =
      frame >= m.end ? exitAt(frame - m.end) : { opacity: 1, scale: 1 };
    const opacity = out.opacity * fade * shown(m.start);
    if (!(opacity > 0)) return [];
    const drawn = EASE.draw(clamp01((frame - m.start) / m.dur));
    const mark = { kind: m.kind, opacity, k: drawn, start: m.start };
    if (m.kind === "river") {
      const pts = m.points.map((p) => flatProject(camera, ...p));
      const cum = cumulative(pts);
      const L = cum.at(-1) * drawn;
      const tip = pointAt(pts, cum, L);
      return [
        {
          ...mark,
          d: L > 0 ? polyline(pts, cum, 0, L) : "",
          tip: drawn < 1 ? [tip.x, tip.y] : null,
          widths: { core: 5 * k, keyline: 9 * k, glow: 16 * k },
          // The glow breathes ±12 % at 0.5 Hz.
          glow: 0.6 + 0.12 * Math.sin((2 * Math.PI * 0.5 * frame) / 30),
        },
      ];
    }
    if (m.kind === "route") {
      const pts = arrowCurve(m.shape, camera);
      const cum = cumulative(pts);
      const L = cum.at(-1) * drawn;
      const headW = 0.8 * W;
      const dotsTo = (from, to) => {
        const out = [];
        for (let s = 6; s <= to; s += 2.4 * W)
          if (s > from) {
            const p = pointAt(pts, cum, s);
            out.push([+p.x.toFixed(1), +p.y.toFixed(1)]);
          }
        return out;
      };
      if (m.highlight) {
        // The lit part ends at the stop, the 40th sample of each segment.
        const h = m.highlight;
        const stopAt = m.shape.via.length === 0 ? cum.at(-1) : cum[40 * h.stop];
        const sailed =
          frame < h.start
            ? 0
            : EASE.move(clamp01((frame - h.start) / (h.end - h.start)));
        const lit = stopAt * sailed;
        const tip = pointAt(pts, cum, lit);
        return [
          {
            ...mark,
            ink: m.ink,
            sea: true,
            r: W / 2,
            dots: frame < h.start ? [] : dotsTo(-1, lit),
            heads: [],
            w: W,
            tip: [+tip.x.toFixed(1), +tip.y.toFixed(1)],
            context: {
              dots: dotsTo(frame < h.start ? -1 : lit, L),
              r: W * VOYAGE.contextR,
            },
            ship:
              frame < h.start
                ? null
                : { kind: h.ship, x: tip.x, y: tip.y, start: h.start },
          },
        ];
      }
      const dots = dotsTo(-1, L - 3.6 * headW);
      const tip = pointAt(pts, cum, Math.max(L, 1));
      return [
        {
          ...mark,
          ink: m.ink,
          ...(m.sea && { sea: true }),
          r: W / 2,
          dots,
          heads: [arrowHead(tip, headW)],
          w: W,
        },
      ];
    }
    if (m.kind === "lords") {
      const king = flatProject(camera, ...m.king);
      return [
        {
          ...mark,
          id: m.id,
          links: m.lords.map((l, n) => {
            const to = flatProject(camera, ...l.at);
            const from = Math.max(m.links, m.start + n * LORDS_TIMING.apart);
            const k = EASE.draw(clamp01((frame - from) / LORDS_TIMING.link));
            const end = [
              king[0] + (to[0] - king[0]) * k,
              king[1] + (to[1] - king[1]) * k,
            ];
            return {
              area: l.area,
              from: king,
              to,
              k,
              d:
                k > 0
                  ? `M${king.map((v) => v.toFixed(1)).join(",")}L${end.map((v) => v.toFixed(1)).join(",")}`
                  : "",
            };
          }),
          widths: {
            line: LORDS_TIMING.width * k,
            keyline: LORDS_TIMING.keyline * k,
          },
          lords: m.lords.map((l, n) => ({
            at: flatProject(camera, ...l.at),
            start: m.start + n * LORDS_TIMING.apart,
          })),
        },
      ];
    }
    if (m.kind === "exchange") {
      const lanes = [
        [m.a, m.b],
        [m.b, m.a],
      ].map(([from, to]) => {
        const pts = offsetPoints(
          arrowCurve({ from, to, bend: DRAWN.exchangeBend }, camera),
          DRAWN.exchangeGap / 2
        );
        const cum = cumulative(pts);
        const w = 0.85 * W;
        const s1 = 10 + (cum.at(-1) - 22) * drawn;
        const lineEnd = s1 - 3.6 * w * 0.7;
        return {
          d: lineEnd > 10 ? polyline(pts, cum, 10, lineEnd) : "",
          head: arrowHead(pointAt(pts, cum, s1), w),
          w,
        };
      });
      return [{ ...mark, ink: m.ink, lanes }];
    }
    const [x, y] = flatProject(camera, ...m.at);
    if (m.kind === "circle") {
      const { overshoot } = DRAWN.circleBox;
      const [rx, ry, dx] = m.bare
        ? [DRAWN.circleBare, DRAWN.circleBare, 0]
        : [DRAWN.circleBox.rx, DRAWN.circleBox.ry, DRAWN.circleBox.dx];
      const cx = x + (m.side === "left" ? -dx : dx);
      const pts = [];
      const span = 2 * Math.PI + overshoot;
      for (let n = 0; n <= 64; n++) {
        const u = n / 64;
        const a = -2.2 + span * u;
        const wob =
          1 + 0.04 * Math.sin(3 * a + 1.3) + 0.025 * Math.sin(5 * a) - 0.05 * u;
        pts.push([
          cx + rx * wob * Math.cos(a),
          y + ry * wob * Math.sin(a) - 4 * u,
        ]);
      }
      const cum = cumulative(pts);
      const L = cum.at(-1) * drawn;
      return [
        {
          ...mark,
          d: L > 0 ? polyline(pts, cum, 0, L) : "",
          widths: { line: 7 * k, keyline: 13 * k },
        },
      ];
    }
    if (m.kind === "cross") {
      const s = DRAWN.cross.half * k;
      const strokes = [
        [-1, -1, 1, 1, 0],
        [1, -1, -1, 1, DRAWN.cross.apart],
      ].flatMap(([ax, ay, bx, by, delay]) => {
        const q = EASE.draw(
          clamp01((frame - m.start - delay) / DRAWN.cross.stroke)
        );
        if (q <= 0) return [];
        const [x1, y1] = [x + ax * s, y + ay * s];
        return [[x1, y1, x1 + (bx - ax) * s * q, y1 + (by - ay) * s * q]];
      });
      return [{ ...mark, strokes, width: 9 * k }];
    }
    // A pin pops from its tip as a small mark, to 110 %.
    const pop = popAt(frame - m.start, { small: true });
    return [
      {
        ...mark,
        x,
        y,
        scale: pop.scale * out.scale,
        opacity: opacity * pop.opacity,
      },
    ];
  });
}

// 1.14.0: a reading steps back to 35 % from its `dim` frame.
const dimmed = (frame, dim) =>
  dim === undefined || frame < dim
    ? 1
    : 1 - (1 - FIGURES.dim) * ramp(frame - dim, FIGURES.dimFrames);

// The marks of one card at a frame, faded by `fade` (the card change).
// 1.16.0: a planted flag at `frame`: the pole's pop, how far the cloth is
// unrolled from the hoist (`cloth`), how high it flies (`hoist`, 1 at the
// top of the pole) and which flag it is. Its box holds the pole and the
// cloth at the top: the rising flag never leaves it.
function plantedAt(d, frame, [x, y], h, opacity) {
  const k = frame - d.start;
  let flag = d.flag;
  let cloth = ramp(k - PLANTED.unrollFrom, PLANTED.unroll, EASE.enter);
  let hoist = 1;
  if (d.swap && frame >= d.swap.start) {
    const s = frame - d.swap.start;
    if (s < PLANTED.fold) cloth *= 1 - ramp(s, PLANTED.fold, EASE.exit);
    else {
      flag = d.swap.flag;
      cloth = 1;
      hoist = ramp(s - PLANTED.fold, PLANTED.rise, EASE.enter);
    }
  }
  const w = h * PLANTED.cloth;
  const pole = Math.max(4, Math.round(h / 18));
  return {
    kind: "flag",
    flag,
    x,
    y,
    h,
    w,
    pole: popAt(k).scale,
    poleWidth: pole,
    cloth,
    hoist,
    opacity,
    box: { x: x - pole, y: y - h, w: w + 2 * pole, h },
    rise: 0,
    label: null,
    labelOpacity: 0,
    labelScale: 1,
  };
}

// 1.16.0: the word bubble on its morph: where it is as it glides, its word
// (the new one from half way through the turn) and how gold it is.
function bubbleAt(d, frame, at) {
  const from = at(d.at);
  const k = frame - d.morph.start;
  if (k < 0) return { at: from, word: d.word, gold: 0 };
  const glide = d.morph.to ? BUBBLE.glide : BUBBLE.morph;
  const to = d.morph.to ? at(d.morph.to) : from;
  const g = ramp(k, glide, EASE.move);
  const gold = ramp(k - (glide - BUBBLE.morph), BUBBLE.morph, EASE.move);
  return {
    at: [from[0] + (to[0] - from[0]) * g, from[1] + (to[1] - from[1]) * g],
    word: gold >= 0.5 ? d.morph.word : d.word,
    gold,
  };
}

function cardMarks(cp, frame, camera, proportion, fade, names) {
  const at = (p) => flatProject(camera, ...p);
  // 1.13.0: around a whip zoom, a mark's own visibility.
  const shown = (start) => whipShown(cp, frame, start);
  const arrows = cp.arrows.flatMap((a) => {
    if (frame < a.start) return [];
    const pts = arrowCurve(a, camera);
    const cum = cumulative(pts);
    const L = cum.at(-1);
    const k = EASE.draw(clamp01((frame - a.start) / a.dur));
    const traced =
      a.trace !== undefined && frame >= a.trace
        ? ramp(frame - a.trace, MAP_TIMING.trace)
        : 0;
    const out =
      a.out !== undefined && frame >= a.out
        ? ramp(frame - a.out, MAP_TIMING.out, EASE.exit)
        : 0;
    const opacity =
      Math.min(1, (frame - a.start) / MAP_TIMING.arrowFade) *
      (1 - (1 - MAP_TIMING.traceTo) * traced) *
      (1 - out) *
      dimmed(frame, a.dim) *
      fade *
      shown(a.start);
    if (opacity <= 0 && frame > a.start) return [];
    const w = proportion.w;
    const Lh = 3.6 * w;
    // A reading's arrow stops where its head is 12 px clear of its place's
    // dot and name (1.14.0): several readings meet on one named place.
    const lo = 8;
    let hi = L - 14;
    if (a.place) {
      const [px, py] = flatProject(camera, ...a.place.at);
      const wn = estimateWidth(a.place.name, 28, MARKS.styles.place.ratio);
      const clear = [
        { x: px - 8, y: py - 8, w: 16, h: 16 },
        {
          x: a.place.side === "left" ? px - 14 - wn : px + 14,
          y: py - 16,
          w: wn,
          h: 32,
        },
      ];
      const near = (h) => {
        const xs = h.d.match(/-?[\d.]+/gu).map(Number);
        const [hx, hy] = [
          xs.filter((_, n) => !(n % 2)),
          xs.filter((_, n) => n % 2),
        ];
        const b = {
          x: Math.min(...hx),
          y: Math.min(...hy),
          w: Math.max(...hx) - Math.min(...hx),
          h: Math.max(...hy) - Math.min(...hy),
        };
        return clear.some(
          (c) =>
            b.x - 12 < c.x + c.w &&
            c.x - 12 < b.x + b.w &&
            b.y - 12 < c.y + c.h &&
            c.y - 12 < b.y + b.h
        );
      };
      while (hi > lo + 40 && near(arrowHead(pointAt(pts, cum, hi), w))) hi -= 3;
    }
    let [s0, s1] = [lo, lo + (hi - lo) * k];
    if (a.both) {
      const [mid, half] = [(lo + hi) / 2, ((hi - lo) / 2) * k];
      [s0, s1] = [mid - half, mid + half];
    }
    const [lineA, lineB] = [a.both ? s0 + Lh * 0.7 : s0, s1 - Lh * 0.7];
    const tip = pointAt(pts, cum, s1);
    const heads = [arrowHead(tip, w)];
    if (a.both) {
      const back = pointAt(pts, cum, s0);
      heads.push(arrowHead({ ...back, angle: back.angle + Math.PI }, w));
    }
    return [
      {
        id: a.id,
        ink: a.ink,
        w,
        k,
        opacity,
        // Once it starts to trace or leave, it no longer counts as full;
        // a pin's arrow belongs to its reading (1.14.0), not to the routes.
        full:
          !a.pin &&
          !(a.trace !== undefined && frame >= a.trace) &&
          !(a.out !== undefined && frame >= a.out),
        d: lineB > lineA ? polyline(pts, cum, lineA, lineB) : "",
        tip: [tip.x, tip.y],
        heads,
      },
    ];
  });
  const drawings = cp.drawings.flatMap((d) => {
    if (frame < d.start) return [];
    const inOut =
      ramp(frame - d.start, MAP_TIMING.drawing, EASE.enter) *
      (frame >= d.end
        ? 1 - ramp(frame - d.end, MAP_TIMING.drawing, EASE.exit)
        : 1);
    const opacity = inOut * fade * shown(d.start);
    if (opacity <= 0) return [];
    const h = proportion.h;
    if (d.kind === "flag") return [plantedAt(d, frame, at(d.at), h, opacity)];
    const bubble = d.morph ? bubbleAt(d, frame, at) : null;
    const [x, y] = bubble ? bubble.at : at(d.at);
    return [
      {
        kind: d.kind,
        x,
        y,
        h,
        w: (h * 4) / 3,
        box: {
          x: x - (h * 2) / 3,
          y: y - (h * 124) / 120,
          w: (h * 4) / 3,
          h: (h * 124) / 120,
        },
        ...(d.word !== undefined && {
          word: bubble?.word ?? d.word,
          gold: bubble?.gold ?? 0,
          ...(bubble && { before: d.word, after: d.morph.word }),
        }),
        opacity,
        rise:
          MAP_TIMING.rise *
          (1 - ramp(frame - d.start, MAP_TIMING.drawing, EASE.enter)),
        label: d.label,
        // 1.13.0: the label pops under its drawing.
        labelOpacity:
          d.label === null
            ? 0
            : opacity * popAt(frame - d.start - MAP_TIMING.labelDelay).opacity,
        labelScale: popAt(frame - d.start - MAP_TIMING.labelDelay).scale,
      },
    ];
  });
  const words = cp.words.flatMap((w) => {
    if (frame < w.start) return [];
    // 1.13.0: a word pops on its word and leaves by the exit.
    const pop = popExit(frame, w.start, w.end);
    const opacity = pop.opacity * dimmed(frame, w.dim) * fade * shown(w.start);
    if (opacity <= 0) return [];
    const [x, y0] = at(w.at);
    // Two recap texts named at one place stand one under the other.
    const y = y0 + (w.offset ?? 0);
    return [
      {
        text: w.text,
        kind: w.kind,
        word: w.word,
        lines: w.lines,
        ink: w.ink,
        x,
        y,
        opacity,
        scale: pop.scale,
        // Leaving: a third word made it go, or its own `until` came.
        leaving: frame >= w.end,
      },
    ];
  });
  const places = cp.places.flatMap((p) => {
    if (frame < p.start) return [];
    // 1.13.0: the dot pops as a small mark, to 110 %, its name to 106 %
    // from the side of its point.
    const dot = popAt(frame - p.start, { small: true });
    const label = popAt(frame - p.start);
    const opacity = dot.opacity * fade * shown(p.start);
    const [x, y] = at(p.at);
    return [
      {
        name: p.name,
        side: p.side,
        x,
        y,
        opacity,
        scale: dot.scale,
        nameOpacity:
          p.written !== false
            ? label.opacity * fade * names * shown(p.start)
            : 0,
        nameScale: label.scale,
      },
    ];
  });
  let rename = null;
  if (cp.rename) {
    const r = cp.rename;
    const s = clamp01((frame - r.start) / MAP_TIMING.rename);
    const h = EASE.move(s);
    const [x, y] = at(r.at);
    const fadeR = fade * shown(cp.start);
    rename = {
      from: {
        text: r.from,
        x,
        y,
        dy: -118 * h + 0,
        scale: 1 - 0.38 * h,
        opacity: (1 - 0.15 * h) * fadeR,
      },
      to: {
        text: r.to,
        x,
        y,
        dy: 0,
        scale: 1,
        opacity:
          ramp(
            frame - r.start - MAP_TIMING.renameNew,
            MAP_TIMING.word,
            EASE.enter
          ) * fadeR,
      },
      dates: {
        text: r.dates,
        x,
        y,
        dy: -78,
        scale: 1,
        opacity:
          ramp(
            frame - r.start - MAP_TIMING.renameDates,
            MAP_TIMING.word,
            EASE.enter
          ) * fadeR,
      },
    };
  }
  const drawn = drawnMarks(cp, frame, camera, proportion, fade, shown);
  // The voyage's ship and a kingdom's lords are drawings that belong to
  // their drawn mark.
  const figure = (kind, [x, y], h, opacity, rise, extra) => ({
    kind,
    x,
    y,
    h,
    w: (h * 4) / 3,
    box: {
      x: x - (h * 2) / 3,
      y: y + rise - (h * 124) / 120,
      w: (h * 4) / 3,
      h: (h * 124) / 120,
    },
    opacity,
    rise,
    label: null,
    labelOpacity: 0,
    labelScale: 1,
    ...extra,
  });
  for (const m of drawn) {
    if (m.ship)
      drawings.push(
        figure(
          m.ship.kind,
          [m.ship.x, m.ship.y],
          Math.round(VOYAGE.ship * proportion.h),
          m.opacity *
            ramp(frame - m.ship.start, MAP_TIMING.drawing, EASE.enter),
          0,
          { ship: true }
        )
      );
    if (m.kind === "lords")
      for (const l of m.lords) {
        const p = ramp(frame - l.start, MAP_TIMING.drawing, EASE.enter);
        if (!(p > 0)) continue;
        drawings.push(
          figure(
            "seigneur",
            l.at,
            Math.round(LORDS_TIMING.lord * proportion.h),
            m.opacity * p,
            MAP_TIMING.rise * (1 - p),
            { lord: m.id, of: `lords ${m.id}` }
          )
        );
      }
  }
  // 1.14.0: the figures drawn on the map.
  const figures = cp.figures
    ? [figuresAt(cp.figures, frame, camera, fade, shown)]
    : [];
  return { arrows, drawings, words, places, rename, drawn, figures };
}

// The texts on the map at a frame, with their estimated boxes: what the
// eight-text rule counts and what the silent viewing check reads.
function mapTexts(names, marks) {
  const texts = names.map((n) => ({
    text: n.text,
    kind: "name",
    word: false,
    opacity: n.opacity,
    box: n.box,
  }));
  for (const p of marks.places)
    texts.push({
      text: p.name,
      kind: "place",
      word: false,
      opacity: p.nameOpacity,
      box: {
        x:
          p.side === "left"
            ? p.x - 14 - estimateWidth(p.name, 28, MARKS.styles.place.ratio)
            : p.x + 14,
        y: p.y - 16,
        w: estimateWidth(p.name, 28, MARKS.styles.place.ratio),
        h: 32,
      },
    });
  for (const d of marks.drawings) {
    // 1.16.0: the bubble's studied word is written inside it, a word on
    // the map like the others.
    if (d.word !== undefined) {
      const top = d.y + d.rise - (d.h * 124) / 120;
      texts.push({
        text: d.word,
        kind: "word",
        word: true,
        opacity: d.opacity,
        box: textBox(
          d.x,
          top + (d.h * 50) / 120,
          estimateWidth(d.word, d.h * BUBBLE.text, 0.5),
          d.h * BUBBLE.text
        ),
      });
    }
    if (d.label === null) continue;
    texts.push({
      text: d.label,
      kind: "label",
      word: false,
      opacity: d.labelOpacity,
      box: textBox(
        d.x,
        d.y + 8 + 16,
        estimateWidth(d.label, 28, MARKS.styles.label.ratio),
        32
      ),
    });
  }
  for (const w of marks.words) {
    const [bw, bh] = styleBox(
      w.kind === "century"
        ? "dates"
        : w.kind === "date" || w.kind === "country"
          ? w.kind
          : "phrase",
      w.lines
    );
    texts.push({
      text: w.text,
      kind: "word",
      word: w.word,
      leaving: w.leaving,
      opacity: w.opacity,
      box: textBox(w.x, w.y, bw, bh),
    });
  }
  if (marks.rename)
    for (const [part, style] of [
      ["from", "country"],
      ["to", "country"],
      ["dates", "dates"],
    ]) {
      const t = marks.rename[part];
      const [bw, bh] = styleBox(style, [t.text]);
      texts.push({
        text: t.text,
        kind: "rename",
        word: false,
        opacity: t.opacity,
        box: textBox(t.x, t.y + t.dy, bw * t.scale, bh * t.scale),
      });
    }
  // 1.14.0: letterings, stamps, the glasses' ages and names, a name brought
  // into its frame, a word that travels.
  for (const f of marks.figures ?? []) texts.push(...figureTexts(f));
  return texts;
}

// The run's map at a frame, for an animated sequence.
function animatedRunState(seq, r, frame) {
  const plan = seq.mapSequence;
  const run = plan.runs[r];
  const changeStart = (card) => seq.cardStarts[card] - CROSS_FADE;
  let k = 0;
  while (k + 1 < run.cards.length && frame > changeStart(run.cards[k + 1])) k++;
  const i = run.cards[k];
  const cp = plan.cards[i];
  const view = plan.views[i];
  const prevCard = k ? run.cards[k - 1] : null;
  const prev = k ? plan.cards[prevCard] : null;
  const t = prev ? frame - changeStart(i) : Infinity;
  const changing = !!prev && !sameCamera(prev.endCamera, cp.view);
  // 1.13.0: the continuous push of the card's shot, multiplied with every
  // camera move; a change of view blends the two shots' pushes.
  const shot = plan.shots[i];
  let camera;
  let moving;
  if (changing && t < SEQUENCE_TIMING.move) {
    camera = moveCamera(
      cameraOfCard(plan, prevCard, frame).camera,
      pushedCamera(cp.view, shot, frame),
      EASE.enter(t / SEQUENCE_TIMING.move)
    );
    moving = true;
  } else ({ camera, moving } = cameraOfCard(plan, i, frame));
  const push = camera.radius / cardCamera(cp, frame).camera.radius;
  const before = prev ? plan.views[prevCard] : null;
  const leaving = before
    ? before.files.filter(
        (f) => !view.files.includes(f) && t < SEQUENCE_TIMING.move
      )
    : [];
  const newcomer = (f) => before && !before.files.includes(f);
  const shown = plan.order.filter(
    (f) => view.files.includes(f) || leaving.includes(f)
  );
  const areas = shown.map((f) => {
    const a = plan.areas[f];
    const base =
      plan.entries[f]?.start === undefined
        ? newcomer(f)
          ? span(t, SEQUENCE_TIMING.entry)
          : 1
        : null;
    const st = areaState(plan, f, frame, base);
    const opacity =
      (leaving.includes(f)
        ? st.opacity * (1 - EASE.exit(t / SEQUENCE_TIMING.move))
        : st.opacity) *
      // 1.13.0: an area on before a whip leaves with the other marks.
      whipShown(cp, frame, plan.entries[f]?.start ?? -Infinity);
    return {
      file: f,
      id: a.id,
      opacity,
      lit: st.lit,
      inks: st.inks,
      swell: st.swell,
      box: screenBox(a, camera),
    };
  });
  const lit = areas.filter((a) => a.lit > 0.5 && a.opacity > 0.5);
  const s = lit.length
    ? Math.min(...lit.map((a) => Math.min(a.box.w, a.box.h)))
    : Infinity;
  const proportion = { s, w: arrowWidth(s), h: drawingHeight(s) };
  // Names: the outgoing card's during a change of view between cards (as in
  // 1.5.0), the current view's otherwise; they fade around a move.
  const swap = !changing
    ? 1
    : t <= SEQUENCE_TIMING.nameSwap
      ? 1 - EASE.exit(t / SEQUENCE_TIMING.nameSwap)
      : t < SEQUENCE_TIMING.move
        ? 0
        : EASE.enter((t - SEQUENCE_TIMING.move) / SEQUENCE_TIMING.nameSwap);
  const { stop, factor } =
    changing && t < SEQUENCE_TIMING.move + SEQUENCE_TIMING.nameSwap
      ? { stop: 0, factor: 1 }
      : nameStop(cp, frame);
  const globeOn = cp.globe && frame < GLOBE.keys[2];
  const source =
    changing && t < SEQUENCE_TIMING.move
      ? before.stops.at(-1)
      : view.stops[stop];
  const names = source.names.flatMap((n) => {
    const a = areas.find((x) => x.file === n.file);
    if (!a) return [];
    // 1.13.0: while its area enters, a name pops once the area is at 0.6;
    // then it follows its area's state as in 1.11.0.
    const entry = plan.entries[n.file]?.start;
    const pop =
      entry !== undefined && frame < entry + MAP_TIMING.enter
        ? popAt(frame - entry - NAME_DELAY)
        : { opacity: clamp01((a.opacity - 0.6) / 0.4), scale: 1 };
    const own =
      pop.opacity *
      areaStyle(a.lit).name *
      whipShown(cp, frame, entry ?? -Infinity);
    let box = n.box;
    if (source.camera !== camera) {
      const [x, y] = flatProject(camera, ...n.anchor);
      const [x0, y0] = flatProject(source.camera, ...n.anchor);
      box = { ...box, x: box.x + x - x0, y: box.y + y - y0 };
    }
    return [
      {
        file: n.file,
        text: n.text,
        style: n.style,
        ink: a.inks.at(-1)?.ink ?? n.ink,
        box,
        opacity: own * swap * factor * (globeOn ? 0 : 1),
        scale: pop.scale,
      },
    ];
  });
  // The card's marks; the outgoing card's fade out during the change.
  const fadeIn = prev ? ramp(t, CROSS_FADE, EASE.enter) : 1;
  const marks = cardMarks(cp, frame, camera, proportion, fadeIn, swap * factor);
  if (prev && t < CROSS_FADE) {
    const old = cardMarks(
      prev,
      frame,
      camera,
      proportion,
      1 - t / CROSS_FADE,
      0
    );
    for (const key of [
      "arrows",
      "drawings",
      "words",
      "places",
      "drawn",
      "figures",
    ])
      marks[key] = [...old[key], ...marks[key]];
    marks.rename ??= old.rename;
  }
  const whipping = cp.moves.some(
    (m) => m.whip && frame > m.start && frame <= m.end
  );
  // 1.13.0: the card's flags, unrolled from the hoist, and the era map.
  const flagsOf = (card, fade) =>
    card.flags.flatMap((f) => {
      const unroll = flagUnroll(f, frame) * fade;
      return unroll > 0 ? [{ file: f.file, flag: f.flag, unroll }] : [];
    });
  const flags = [
    ...(prev && t < CROSS_FADE ? flagsOf(prev, 1 - t / CROSS_FADE) : []),
    ...flagsOf(cp, prev ? ramp(t, CROSS_FADE, EASE.enter) : 1),
  ];
  // A flag replaces its area's fill, under its outline.
  for (const a of areas)
    a.flag = Math.max(
      0,
      ...flags.filter((f) => f.file === a.file).map((f) => f.unroll)
    );
  const era = seq.eras ? eraAt(seq.eras, frame) : null;
  const keys = {};
  for (const a of areas) keys[a.file] = a.opacity;
  return {
    ...(flags.length && {
      flags: flags.map((f) => ({
        ...f,
        opacity: era?.inks ? FLAGS.paperOpacity : FLAGS.opacity,
        // The cloth's wave and its moving light, on the video's clock.
        t: frame / FPS,
      })),
    }),
    ...(era && { paper: era.paper, paperInks: era.inks }),
    ...(cp.recap && { desat: RECAP.desat }),
    run: r,
    camera,
    grade: cp.globe ? globeGrade(frame) : 1,
    moving,
    zoom: 1,
    push,
    scale: (camera.radius * 2 * Math.PI) / plan.imageryWidth,
    areas,
    names,
    keys,
    subject: null,
    animated: true,
    marks,
    texts: mapTexts(names, marks),
    proportion,
    // The opener's credit: the imagery alone during the globe, then the
    // 1.4.1 line from the first mark on.
    credit: cp.globe && frame < cp.firstMark ? "globe" : "map",
    // 1.13.0: the whip's blur, from the camera's speed on screen.
    ...(whipping && {
      whip: whipBlur(
        cameraOfCard(plan, i, frame - 1).camera,
        camera,
        flatProject
      ),
    }),
  };
}

const NUMBERS = { 9: "Neuf", 10: "Dix", 11: "Onze", 12: "Douze" };
const inside = (b, band) =>
  b.x >= band.x[0] - 0.5 &&
  b.x + b.w <= band.x[1] + 0.5 &&
  b.y >= band.y[0] - 0.5 &&
  b.y + b.h <= band.y[1] + 0.5;
// Checks 5 and 6 of 1.11.0 on the model, every 100 ms of the card: eight
// texts on the map and two words at most, three drawings, three arrows at
// full strength, and every text and drawing in the map band on still
// frames (estimated boxes; the drawn page is checked again at export).
function checkAnimatedCard(seq, i) {
  const plan = seq.mapSequence;
  const cp = plan.cards[i];
  const r = runOfCard(plan, i);
  const what = `Card ${seq.cards[i].id}`;
  for (let f = cp.start; f < cp.end; f += MAP_TIMING.silentStep) {
    const map = mapRunState(seq, r, f);
    // A word on its way out is not counted: the third that made it go is.
    const shown = map.texts.filter((t) => t.opacity > 0 && !t.leaving);
    if (shown.length > MARKS.maxTexts)
      fail(
        `${what}: ${NUMBERS[shown.length] ?? shown.length} textes sur la carte : huit au plus (${shown.map((t) => t.text).join(", ")})`
      );
    if (shown.filter((t) => t.word).length > MARKS.maxWords)
      fail(`${what}: trois mots sur la carte : deux au plus`);
    const drawings = map.marks.drawings.filter((d) => !d.lord);
    if (drawings.length > MARKS.maxDrawings)
      fail(`${what}: ${drawings.length} dessins : trois au plus`);
    if (map.marks.arrows.filter((a) => a.full).length > MARKS.maxArrowsFull)
      fail(`${what}: Trois flèches au plus à pleine intensité`);
    // 1.13.0: three drawn marks at most besides areas and arrows.
    if (map.marks.drawn.length > DRAWN.maxOnScreen)
      fail(
        `${what}: Trop de traits à la fois (${map.marks.drawn.map((m) => m.kind).join(", ")}, image ${f})`
      );
    if (map.moving) continue;
    for (const t of shown.filter((x) => !x.moving))
      if (!inside(t.box, MARKS.band))
        fail(
          `${what}: « ${t.text} » hors de la bande de la carte (x ${Math.round(t.box.x)} à ${Math.round(t.box.x + t.box.w)}, y ${Math.round(t.box.y)} à ${Math.round(t.box.y + t.box.h)}, image ${f})`
        );
    for (const d of map.marks.drawings)
      if (!inside(d.box, MARKS.band))
        fail(
          `${what}: le dessin ${d.flag ? `drapeau ${d.flag}` : d.kind} hors de la bande de la carte`
        );
    // 1.14.0: units in the map band, every letter of a lettering on its
    // path.
    for (const fig of map.marks.figures) {
      for (const u of fig.units)
        if (!inside(unitBox(u.kind, u.x, u.y), MARKS.band))
          fail(
            `${what}: une unité ${u.id} hors de la bande de la carte (image ${f})`
          );
      for (const l of fig.letterings)
        if (!letteringFits(l))
          fail(`${what}: « ${l.text} » déborde de son tracé`);
    }
  }
}

// ---------------------------------------------------------------------------
// The silent viewing check (series.md, « 10 »): every fact a map phase says
// has its mark on screen while it is said.
const norm = (s) =>
  s.normalize("NFC").replace(/[’']/gu, "'").replace(/\s+/gu, " ").toLowerCase();
const bare = (unit) => unit.replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "");
function factSpan(seq, card, say) {
  const words = seq.chunks
    .filter((c) => c.card === card)
    // A unit written with a space (« 2 000 ») is read as its words, each
    // with the unit's times, so a fact can name it as the subtitle shows it.
    .flatMap((c) =>
      c.words.flatMap((w, n) =>
        chunkUnits(c.text)
          [n].split(/[\s  ]+/u)
          // « Éthiopie » keeps its word, not its guillemets.
          .filter((unit, k, all) => bare(unit) || all.length === 1)
          .map((unit) => ({ ...w, unit }))
      )
    );
  const wanted = say.split(/\s+/u).map((w) => norm(bare(w)));
  for (let a = 0; a + wanted.length <= words.length; a++)
    if (wanted.every((w, n) => norm(bare(words[a + n].unit)) === w))
      return {
        from: toFrame(words[a].start),
        to: toFrame(words[a + wanted.length - 1].end),
      };
  return fail(
    `Card ${seq.cards[card].id}: Fait absent du sous-titre (« ${say} »)`
  );
}
// A mark counts on screen only: in the frame, from 60 % opacity, an arrow
// from half drawn.
const onScreen = (b) =>
  b.x < 1080 && b.x + b.w > 0 && b.y < 1920 && b.y + b.h > 0;
const pointOn = ([x, y]) => onScreen({ x, y, w: 0, h: 0 });
function markOn(map, mark, head) {
  const [kind, ...rest] = mark.split(":");
  const value = rest.join(":");
  // 1.14.0: the figure head and the figures on the map.
  if (FIGURE_MARKS.includes(kind))
    return figureMarkOn(map.marks.figures, head, mark);
  if (kind === "area")
    return map.areas.some(
      (a) => a.id === value && a.opacity >= 0.6 && onScreen(a.box)
    );
  if (kind === "arrow")
    return map.marks.arrows.some(
      (a) => a.id === value && a.k >= 0.5 && pointOn(a.tip)
    );
  if (kind === "illus")
    return map.marks.drawings.some(
      (d) => d.kind === value && d.opacity >= 0.6 && pointOn([d.x, d.y])
    );
  // A kingdom's lords count from their first lord at 60 %.
  if (kind === "lords")
    return map.marks.drawings.some(
      (d) => d.lord === value && d.opacity >= 0.6 && pointOn([d.x, d.y])
    );
  // 1.16.0: a planted flag counts from 60 % opacity once its cloth shows:
  // the planting is the mark, as an arrow counts while it draws.
  if (kind === "flag")
    return map.marks.drawings.some(
      (d) =>
        d.flag === value &&
        d.opacity >= 0.6 &&
        d.cloth > 0 &&
        pointOn([d.x, d.y])
    );
  return map.texts.some(
    (t) =>
      t.opacity >= 0.6 && onScreen(t.box) && norm(t.text).includes(norm(value))
  );
}
export function silentCheck(seq) {
  const plan = seq.mapSequence;
  if (!plan) return [];
  const out = [];
  for (const [card, cp] of Object.entries(plan.cards)) {
    const i = Number(card);
    const r = runOfCard(plan, i);
    for (const fact of cp.facts) {
      const { from, to } = factSpan(seq, i, fact.say);
      let total = 0;
      let covered = 0;
      let first = null;
      for (let f = from; f <= to; f += MAP_TIMING.silentStep) {
        total++;
        const map = mapRunState(seq, r, f);
        const head = cp.figures ? figureHeadAt(cp.figures, f) : null;
        if (fact.shows.some((m) => markOn(map, m, head))) {
          covered++;
          first ??= f;
        }
      }
      const coverage = total ? covered / total : 0;
      const delay = first === null ? null : first - from;
      out.push({
        card: seq.cards[i].id,
        say: fact.say,
        shows: fact.shows,
        frames: [from, to],
        coverage: round2(coverage),
        delay,
        pass:
          coverage >= MAP_TIMING.silentCoverage &&
          delay !== null &&
          delay <= MAP_TIMING.silentDelay,
      });
    }
  }
  return out;
}
