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
  ILLUSTRATIONS,
  areaStyle,
  arrowWidth,
  drawingHeight,
  fitMapCamera,
  flatProject,
  frameBounds,
  isAnimatedCard,
  loadSequenceArea,
  markInk,
  sequenceCredits,
} from "./series-map.mjs";
import {
  FPS,
  chunkUnits,
  cubicBezier,
  enter,
  leave,
  symmetric,
  estimateWidth,
  placeLabels,
} from "./sequence.mjs";
import { GLOBE, globeCamera, globeGrade } from "./page.mjs";

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
const ZOOM = 0.04;
const MAX_NAMES = 4;
const fail = (message) => {
  throw new Error(message);
};
const toFrame = (seconds) => Math.round(seconds * FPS);
// Progress over `duration` frames, eased as an entry (0.4.0).
const span = (frames, duration) => enter(frames / duration);
// The first frame after an entry's start at which its area is at 0.6.
const NAME_DELAY = (() => {
  let k = 0;
  while (enter(k / SEQUENCE_TIMING.entry) < SEQUENCE_TIMING.nameAt) k++;
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
        if (owner[a.file] && owner[a.file] !== run.sequence)
          fail(`Area ${a.file} is in two map sequences of one video`);
        owner[a.file] = run.sequence;
        const area = (areas[a.file] ??= {
          ...loadSequenceArea(a.file),
          sequence: run.sequence,
          name: a.name,
          ink: a.ink,
          lang: a.lang,
        });
        if (animated[run.sequence]) {
          const id = a.id ?? a.file.replace(/\.geojson$/u, "");
          if (area.id !== undefined && area.id !== id)
            fail(`Area ${a.file}: one id across the sequence`);
          if (
            ids[`${run.sequence}:${id}`] &&
            ids[`${run.sequence}:${id}`] !== a.file
          )
            fail(`Two areas of sequence ${run.sequence} share the id ${id}`);
          ids[`${run.sequence}:${id}`] = a.file;
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
        if (a.say !== undefined) {
          if (area.say) fail(`Area ${a.file} enters once: nothing replays`);
          area.say = { card, ...wordOf(seq, card, a.say) };
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
function sequenceView(spec, areas, order, imagery) {
  const files = order.filter((f) => spec.map.areas.some((a) => a.file === f));
  const points = files.flatMap((f) => outerPoints(areas[f]));
  const fitted = fitMapCamera(extent(points), imagery, points);
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
    band: MAP_FRAME.names,
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
  checkView(spec, view);
  return view;
}

// Check 4 on each view, at 100 % and at the end of the slow zoom around
// (540, 1010): the subject between y 724 and the foot, the scale limit, the
// names in the map band.
function checkView(spec, view) {
  const s = view.subject;
  const cy = view.camera.centreY;
  const top = cy + (s.y - cy) * MAP_FRAME.maxZoom;
  const bottom = cy + (s.y + s.h - cy) * MAP_FRAME.maxZoom;
  if (top < 724)
    fail(
      `Card ${spec.id}: Le sujet de la carte passe sous la tête (y ${Math.round(top)})`
    );
  if (bottom > MAP_FRAME.foot[0])
    fail(
      `Card ${spec.id}: the map's subject runs into the foot (y ${Math.round(bottom)})`
    );
  if (view.scale * MAP_FRAME.maxZoom > MAP_FRAME.maxScale + 1e-9)
    fail(`Card ${spec.id}: the imagery is enlarged past ${MAP_FRAME.maxScale}`);
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
    // 1.11.0: the slow zoom does not run on a card that moves, nor on the
    // globe; a run that holds one keeps its scale.
    run.zoomOff = run.cards.some(
      (i) => seq.cards[i].opening === "globe" || seq.cards[i].map.moves?.length
    );
  }
  const views = {};
  for (const run of runs)
    for (const i of run.cards)
      views[i] = animated[run.sequence]
        ? animatedView(seq.cards[i], areas, order, imagery, run.zoomOff)
        : sequenceView(seq.cards[i], areas, order, imagery);
  const cameras = Object.values(views).map((v) => v.camera);
  const plan = {
    runs,
    imageryWidth: imagery.width,
    areas,
    entries,
    events,
    eventsByFile: byFile,
    order,
    views,
    animated,
    cards: {},
  };
  for (const run of runs) {
    for (const [k, i] of run.cards.entries()) {
      if (animated[run.sequence])
        plan.cards[i] = planAnimatedCard(seq, plan, run, k, imagery);
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
  for (const run of runs)
    if (animated[run.sequence])
      for (const i of run.cards) checkAnimatedCard(seq, i);
  return plan;
}

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
  const camera = moving
    ? moveCamera(before.camera, view.camera, enter(t / SEQUENCE_TIMING.move))
    : { ...view.camera };
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
      : entered(f) * (1 - leave(t / SEQUENCE_TIMING.move));
  const shown = plan.order.filter(
    (f) => view.files.includes(f) || leaving.includes(f)
  );
  const swap = !moved
    ? 1
    : t <= SEQUENCE_TIMING.nameSwap
      ? 1 - leave(t / SEQUENCE_TIMING.nameSwap)
      : t < SEQUENCE_TIMING.move
        ? 0
        : enter((t - SEQUENCE_TIMING.move) / SEQUENCE_TIMING.nameSwap);
  const nameOpacity = (f) => {
    const e = entries[f];
    const own =
      e?.start === undefined
        ? entered(f)
        : span(frame - e.start - NAME_DELAY, SEQUENCE_TIMING.name);
    return (
      own * (leaving.includes(f) ? 1 - leave(t / SEQUENCE_TIMING.move) : 1)
    );
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
    const own = nameOpacity(n.file);
    const lang = n.lang
      ? Math.min(
          own,
          entries[n.file]?.lang === undefined
            ? 1
            : span(frame - entries[n.file].lang, SEQUENCE_TIMING.lang)
        )
      : 0;
    let box = n.box;
    if (moving) {
      const [x, y] = flatProject(camera, ...n.anchor);
      const [x0, y0] = flatProject(before.camera, ...n.anchor);
      box = { ...box, x: box.x + x - x0, y: box.y + y - y0 };
    }
    return {
      file: n.file,
      text: n.text,
      ...(n.lang && { lang: n.lang }),
      ink: n.ink,
      box,
      opacity: own * swap,
      langOpacity: lang * swap,
    };
  });
  // A key item follows its area.
  const keys = {};
  for (const f of shown) keys[f] = opacity(f);
  return {
    run: r,
    camera,
    moving,
    zoom: 1 + (ZOOM * (frame - run.from)) / (run.to - run.from),
    scale: (camera.radius * 2 * Math.PI) / plan.imageryWidth,
    areas: shown.map((f) => ({ file: f, opacity: opacity(f) })),
    names,
    keys,
    // The subject is checked on each still view, never in a move.
    subject: moving ? null : view.subject,
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
const drawEase = cubicBezier(0.4, 0, 0.2, 1);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (frames, duration, ease = symmetric) =>
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
function checkScale(spec, camera, imagery, zoom) {
  const scale = ((camera.radius * 2 * Math.PI) / imagery.width) * zoom;
  if (scale > MAP_FRAME.maxScale + 1e-9) {
    const limit = (MAP_FRAME.maxScale * imagery.width) / (2 * Math.PI) / zoom;
    fail(
      `Card ${spec.id}: Vue plus proche que l'imagerie vérifiée : ${Math.round(kmAcross(camera.radius))} km de large, ${Math.round(kmAcross(limit))} km au moins`
    );
  }
}

// One animated card's views: its own view, then the view after each move,
// with the area names placed once for each; its key and credits.
function animatedView(spec, areas, order, imagery, zoomOff) {
  const map = spec.map;
  if (!map.view)
    fail(`Card ${spec.id}: an animated map card frames its plan (map.view)`);
  const entry = (f) => map.areas.find((a) => a.file === f);
  const files = order.filter((f) => entry(f));
  const centreY = MAP_FRAME.centre[1];
  const cams = [map.view, ...(map.moves ?? [])].map(({ lon, lat, radius }) => ({
    lon,
    lat,
    radius,
    centreY,
  }));
  const zoom = zoomOff ? 1 : MAP_FRAME.maxZoom;
  for (const c of cams) checkScale(spec, c, imagery, zoom);
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
        band: MAP_FRAME.names,
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
    credits:
      spec.opening === "globe"
        ? { ...credits, globe: `Imagerie : ${imagery.credit}` }
        : credits,
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
    const s = (frame - m.start) / (m.end - m.start);
    const h = s * s * (3 - 2 * s);
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

// An arrow's path on screen: a quadratic curve bent by `bend` of its length
// to one side, or a Catmull-Rom curve through its via points.
function arrowCurve(a, camera) {
  const pts = [a.from, ...(a.via ?? []), a.to].map((p) =>
    flatProject(camera, ...p)
  );
  const out = [];
  if (pts.length === 2) {
    const [A, B] = pts;
    const [dx, dy] = [B[0] - A[0], B[1] - A[1]];
    const C = [
      (A[0] + B[0]) / 2 - dy * a.bend,
      (A[1] + B[1]) / 2 + dx * a.bend,
    ];
    for (let i = 0; i <= 80; i++) {
      const s = i / 80;
      const u = 1 - s;
      out.push([
        u * u * A[0] + 2 * u * s * C[0] + s * s * B[0],
        u * u * A[1] + 2 * u * s * C[1] + s * s * B[1],
      ]);
    }
    return out;
  }
  for (let k = 0; k < pts.length - 1; k++) {
    const [p0, p1, p2, p3] = [
      pts[Math.max(0, k - 1)],
      pts[k],
      pts[k + 1],
      pts[Math.min(pts.length - 1, k + 2)],
    ];
    for (let j = 0; j < 40; j++) {
      const u = j / 40;
      const [u2, u3] = [u * u, u * u * u];
      out.push(
        [0, 1].map(
          (c) =>
            0.5 *
            (2 * p1[c] +
              (-p0[c] + p2[c]) * u +
              (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 +
              (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3)
        )
      );
    }
  }
  out.push(pts.at(-1));
  return out;
}
const cumulative = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++)
    c.push(
      c[i - 1] +
        Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    );
  return c;
};
function pointAt(pts, cum, length) {
  const L = Math.min(Math.max(length, 0), cum.at(-1));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < L) i++;
  const s = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  const [a, b] = [pts[i - 1], pts[i]];
  return {
    x: a[0] + (b[0] - a[0]) * s,
    y: a[1] + (b[1] - a[1]) * s,
    angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
  };
}
const xy = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
function polyline(pts, cum, a, b) {
  const p = pointAt(pts, cum, a);
  const q = pointAt(pts, cum, b);
  const inner = pts.filter((_, i) => cum[i] > a && cum[i] < b);
  return "M" + [[p.x, p.y], ...inner, [q.x, q.y]].map(xy).join("L");
}
// The notched head, 3.6 w long and 3.2 w wide, its point on the tip.
function arrowHead(p, w) {
  const [L, W] = [3.6 * w, 3.2 * w];
  const [c, s] = [Math.cos(p.angle), Math.sin(p.angle)];
  const P = (f, g) => [p.x + c * f - s * g, p.y + s * f + c * g];
  return {
    x: p.x,
    y: p.y,
    angle: p.angle,
    d:
      "M" +
      [P(0, 0), P(-L, W / 2), P(-L * 0.72, 0), P(-L, -W / 2)]
        .map(xy)
        .join("L") +
      "Z",
  };
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
  const cp = { card: i, start, end, view: view.camera, globe, moves };
  const cameraAt = (f) => cardCamera(cp, f).camera;
  // Arrows in the order of their words, one drawing at a time.
  const arrows = [];
  const said = (map.arrows ?? [])
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
    const [lo, hi] = MAP_TIMING.arrow;
    const dur = Math.min(
      hi,
      Math.max(lo, Math.round(length / MAP_TIMING.arrowPx))
    );
    arrows.push({
      id: a.id,
      ...shape,
      both: !!a.both,
      ink: markInk(a, seq.inks, `${what}, arrow ${a.id}`),
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
  const drawings = (map.drawings ?? []).map((d) => ({
    kind: d.kind,
    at: d.at,
    start: word(d.say),
    end: d.until !== undefined ? word(d.until) : Infinity,
    label: d.label ?? ILLUSTRATIONS[d.kind],
  }));
  const words = (map.words ?? [])
    .map((w) => {
      const kind = w.kind ?? "phrase";
      return {
        text: w.text,
        kind,
        // A colony's name set as a word counts among the names, not the words.
        word: kind !== "name",
        lines: kind === "date" ? [w.text] : wrapPhrase(spec, w.text),
        at: w.at,
        start: word(w.say),
        ...(w.until !== undefined && { until: word(w.until) }),
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
  }));
  const rename = map.rename && { ...map.rename, start: word(map.rename.say) };
  // The frames the imagery shows: the globe's dive and every move.
  const cameras = [];
  if (globe)
    for (let f = 6; f < GLOBE.keys[2]; f += 6) cameras.push(cameraAt(f));
  for (const m of moves)
    for (let f = m.start + 6; f < m.end; f += 6) cameras.push(cameraAt(f));
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
  for (const e of plan.eventsByFile[file] ?? []) {
    if (e.start > frame) break;
    const p = frame - e.start;
    if (e.to === "enter")
      opacity = Math.max(opacity, ramp(p, MAP_TIMING.enter, enter));
    else if (e.to === "lit") {
      if (opacity < 1)
        opacity = Math.max(opacity, ramp(p, MAP_TIMING.enter, enter));
      lit += (1 - lit) * ramp(p, MAP_TIMING.state);
    } else if (e.to === "context") lit -= lit * ramp(p, MAP_TIMING.state);
    else if (e.to === "out") opacity *= 1 - ramp(p, MAP_TIMING.out, leave);
    else {
      const q = ramp(p, MAP_TIMING.ink);
      inks = [
        ...inks.map((l) => ({ ink: l.ink, w: l.w * (1 - q) })),
        { ink: e.to.slice(4), w: q },
      ].filter((l) => l.w > 0.001);
    }
  }
  return { opacity, lit, inks };
}
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
      factor = 1 - leave((frame - (m.start - fade)) / fade);
      break;
    }
    if (frame < m.end) {
      factor = 0;
      break;
    }
    stop = n + 1;
    factor = frame < m.end + fade ? enter((frame - m.end) / fade) : 1;
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

// The marks of one card at a frame, faded by `fade` (the card change).
function cardMarks(cp, frame, camera, proportion, fade, names) {
  const at = (p) => flatProject(camera, ...p);
  const arrows = cp.arrows.flatMap((a) => {
    if (frame < a.start) return [];
    const pts = arrowCurve(a, camera);
    const cum = cumulative(pts);
    const L = cum.at(-1);
    const k = drawEase(clamp01((frame - a.start) / a.dur));
    const traced =
      a.trace !== undefined && frame >= a.trace
        ? ramp(frame - a.trace, MAP_TIMING.trace)
        : 0;
    const out =
      a.out !== undefined && frame >= a.out
        ? ramp(frame - a.out, MAP_TIMING.out, leave)
        : 0;
    const opacity =
      Math.min(1, (frame - a.start) / MAP_TIMING.arrowFade) *
      (1 - (1 - MAP_TIMING.traceTo) * traced) *
      (1 - out) *
      fade;
    if (opacity <= 0 && frame > a.start) return [];
    const w = proportion.w;
    const Lh = 3.6 * w;
    const [lo, hi] = [8, L - 14];
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
        // Once it starts to trace or leave, it no longer counts as full.
        full:
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
      ramp(frame - d.start, MAP_TIMING.drawing, enter) *
      (frame >= d.end ? 1 - ramp(frame - d.end, MAP_TIMING.drawing, leave) : 1);
    const opacity = inOut * fade;
    if (opacity <= 0) return [];
    const [x, y] = at(d.at);
    const h = proportion.h;
    return [
      {
        kind: d.kind,
        x,
        y,
        h,
        w: (h * 4) / 3,
        opacity,
        rise:
          MAP_TIMING.rise *
          (1 - ramp(frame - d.start, MAP_TIMING.drawing, enter)),
        label: d.label,
        labelOpacity:
          opacity *
          ramp(
            frame - d.start - MAP_TIMING.labelDelay,
            MAP_TIMING.label,
            enter
          ),
      },
    ];
  });
  const words = cp.words.flatMap((w) => {
    if (frame < w.start) return [];
    const opacity =
      ramp(frame - w.start, MAP_TIMING.word, enter) *
      (frame >= w.end ? 1 - ramp(frame - w.end, MAP_TIMING.word, leave) : 1) *
      fade;
    if (opacity <= 0) return [];
    const [x, y] = at(w.at);
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
        // Leaving: a third word made it go, or its own `until` came.
        leaving: frame >= w.end,
      },
    ];
  });
  const places = cp.places.flatMap((p) => {
    if (frame < p.start) return [];
    const opacity = ramp(frame - p.start, MAP_TIMING.place, enter) * fade;
    const [x, y] = at(p.at);
    return [
      {
        name: p.name,
        side: p.side,
        x,
        y,
        opacity,
        nameOpacity: opacity * names,
      },
    ];
  });
  let rename = null;
  if (cp.rename) {
    const r = cp.rename;
    const s = clamp01((frame - r.start) / MAP_TIMING.rename);
    const h = s * s * (3 - 2 * s);
    const [x, y] = at(r.at);
    rename = {
      from: {
        text: r.from,
        x,
        y,
        dy: -118 * h + 0,
        scale: 1 - 0.38 * h,
        opacity: (1 - 0.15 * h) * fade,
      },
      to: {
        text: r.to,
        x,
        y,
        dy: 0,
        scale: 1,
        opacity:
          ramp(frame - r.start - MAP_TIMING.renameNew, MAP_TIMING.word, enter) *
          fade,
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
            enter
          ) * fade,
      },
    };
  }
  return { arrows, drawings, words, places, rename };
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
  for (const d of marks.drawings)
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
  for (const w of marks.words) {
    const [bw, bh] = styleBox(w.kind === "date" ? "date" : "phrase", w.lines);
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
  let camera;
  let moving;
  if (changing && t < SEQUENCE_TIMING.move) {
    camera = moveCamera(
      prev.endCamera,
      cp.view,
      enter(t / SEQUENCE_TIMING.move)
    );
    moving = true;
  } else ({ camera, moving } = cardCamera(cp, frame));
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
    const opacity = leaving.includes(f)
      ? st.opacity * (1 - leave(t / SEQUENCE_TIMING.move))
      : st.opacity;
    return {
      file: f,
      id: a.id,
      opacity,
      lit: st.lit,
      inks: st.inks,
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
      ? 1 - leave(t / SEQUENCE_TIMING.nameSwap)
      : t < SEQUENCE_TIMING.move
        ? 0
        : enter((t - SEQUENCE_TIMING.move) / SEQUENCE_TIMING.nameSwap);
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
    const own = clamp01((a.opacity - 0.6) / 0.4) * areaStyle(a.lit).name;
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
      },
    ];
  });
  // The card's marks; the outgoing card's fade out during the change.
  const fadeIn = prev ? ramp(t, CROSS_FADE, enter) : 1;
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
    for (const key of ["arrows", "drawings", "words", "places"])
      marks[key] = [...old[key], ...marks[key]];
    marks.rename ??= old.rename;
  }
  const keys = {};
  for (const a of areas) keys[a.file] = a.opacity;
  return {
    run: r,
    camera,
    grade: cp.globe ? globeGrade(frame) : 1,
    moving,
    zoom: run.zoomOff
      ? 1
      : 1 + (ZOOM * (frame - run.from)) / (run.to - run.from),
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
    if (map.marks.drawings.length > MARKS.maxDrawings)
      fail(`${what}: ${map.marks.drawings.length} dessins : trois au plus`);
    if (map.marks.arrows.filter((a) => a.full).length > MARKS.maxArrowsFull)
      fail(`${what}: Trois flèches au plus à pleine intensité`);
    if (map.moving) continue;
    for (const t of shown)
      if (!inside(t.box, MARKS.band))
        fail(
          `${what}: « ${t.text} » hors de la bande de la carte (y ${Math.round(t.box.y)} à ${Math.round(t.box.y + t.box.h)})`
        );
    for (const d of map.marks.drawings) {
      const box = {
        x: d.x - d.w / 2,
        y: d.y - (d.h * 124) / 120,
        w: d.w,
        h: (d.h * 124) / 120,
      };
      if (!inside(box, MARKS.band))
        fail(`${what}: le dessin ${d.kind} hors de la bande de la carte`);
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
    .flatMap((c) =>
      c.words.map((w, n) => ({ ...w, unit: chunkUnits(c.text)[n] }))
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
function markOn(map, mark) {
  const [kind, ...rest] = mark.split(":");
  const value = rest.join(":");
  if (kind === "area")
    return map.areas.some((a) => a.id === value && a.opacity >= 0.6);
  if (kind === "arrow")
    return map.marks.arrows.some((a) => a.id === value && a.k >= 0.5);
  if (kind === "illus")
    return map.marks.drawings.some((d) => d.kind === value && d.opacity >= 0.6);
  return map.texts.some(
    (t) => t.opacity >= 0.6 && norm(t.text).includes(norm(value))
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
        if (fact.shows.some((m) => markOn(mapRunState(seq, r, f), m))) {
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
