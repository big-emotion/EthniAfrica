// The map sequence of the series video (EthniAfrica Cartes 1.5.0, series.md
// « Map sequence », handoff.md « Renderer integration of 1.5.0 »): consecutive
// map cards with the same `map.sequence` share one map; each area enters on
// the word of the subtitle that says it, its name and its language after it;
// the view changes only during a card change. This module plans the
// sequence from the cards and the voice's word times, and gives the map's
// state at any frame, with no clock and no browser.
import {
  MAP_FRAME,
  fitMapCamera,
  flatProject,
  frameBounds,
  loadSequenceArea,
  sequenceCredits,
} from "./series-map.mjs";
import {
  FPS,
  chunkUnits,
  enter,
  leave,
  estimateWidth,
  placeLabels,
} from "./sequence.mjs";

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
function wordOf(seq, card, word) {
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
function collectAreas(seq, runs) {
  const areas = {};
  const owner = {};
  const names = {};
  for (const run of runs)
    for (const card of run.cards)
      for (const a of seq.cards[card].map.areas) {
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
  for (const inks of Object.values(names)) {
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
    const name = c.type === "map" && c.map.sequence;
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
  const areas = collectAreas(seq, runs);
  const entries = scheduleEntries(areas);
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
  const views = {};
  for (const run of runs)
    for (const i of run.cards)
      views[i] = sequenceView(seq.cards[i], areas, order, imagery);
  const starts = seq.cardStarts;
  const cameras = Object.values(views).map((v) => v.camera);
  for (const run of runs) {
    const [first, last] = [run.cards[0], run.cards.at(-1)];
    run.from = first ? starts[first] - CROSS_FADE + 1 : 0;
    run.to = last + 1 < starts.length ? starts[last + 1] - 1 : seq.frames - 1;
    for (const [k, i] of run.cards.entries())
      if (k && !sameCamera(views[run.cards[k - 1]].camera, views[i].camera))
        for (const t of [0.25, 0.5, 0.75])
          cameras.push(
            moveCamera(views[run.cards[k - 1]].camera, views[i].camera, t)
          );
  }
  return {
    runs,
    imageryWidth: imagery.width,
    areas,
    entries,
    order,
    views,
    // The still views and samples of each move, with the ground each frame
    // shows: the renderer decides which need the full-resolution region.
    cameras: cameras.map((camera) => ({ camera, bounds: frameBounds(camera) })),
  };
}

export const runOfCard = (plan, card) =>
  plan ? plan.runs.findIndex((r) => r.cards.includes(card)) : -1;

// The run's map at a frame: its camera, zoom, areas, names and key items.
export function mapRunState(seq, r, frame) {
  const plan = seq.mapSequence;
  const run = plan.runs[r];
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
