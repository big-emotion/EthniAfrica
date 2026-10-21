// Cartes 1.14.0, figures and facts drawn on the map (series.md « Figures and
// facts drawn on the map (1.14.0-proposition) »; handoff.md « Renderer
// integration of 1.14.0 »): the figure head that counts what the map shows,
// the states' cascade, units placed by the source's breakdown, the row of
// five, the glasses, letterings, stamps, the empty name frame and what
// travels. This module checks a card's fields, plans them on the voice's
// frames and gives their state at any frame; series-page.mjs draws them.
// Pins become the animated map's own arrows and names (series-sequence.mjs).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MARKS, checkMapWord, flatProject, pushedBand } from "./series-map.mjs";
import { EASE, DUR, popAt, exitAt, swellAt } from "./series-motion.mjs";
import { arrowCurve, cumulative, pointAt } from "./series-paths.mjs";
import { chunkUnits, estimateWidth } from "./sequence.mjs";

const fail = (message) => {
  throw new Error(message);
};
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (frames, duration, ease = EASE.move) =>
  ease(clamp01(frames / duration));
const isPoint = (p) =>
  Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

// Sizes in frame pixels at 1080 × 1920, lengths in frames at 30 fps
// (tokens.json: unit-person, unit-bubble, figure-number, dur-cascade,
// dur-unit-step, dur-gauge, dur-letter-step, dur-travel).
export const FIGURES = {
  cascade: { frames: 45, context: 0.4, fill: 0.32 },
  person: { h: 92, step: 3 },
  bubble: { h: 40, step: 1.5 },
  // A unit, a reading or a name steps back to 35 % when the next fact comes.
  dim: 0.35,
  dimFrames: 12,
  outFrames: 9,
  row: { h: 118, gap: 116, feet: 1240, step: 2.4, light: 9 },
  // The boards' row: the world's four in the muted wash, the lit one third.
  rowVariants: [2, 5, 1, 4, 6],
  gauge: {
    fill: 36,
    in: 12,
    cy: 1000,
    w: 270,
    h: 282,
    centres: { 1: [540], 2: [290, 800] },
    ticks: [0, 20, 40, 60],
  },
  lettering: { step: 2, letter: 8, sizes: [50, 64], size: 60, track: 0.26 },
  stamp: { from: 1.4, frames: 5, maxWords: 2, rotate: -6, unknown: -8 },
  frame: { draw: 27, w: 540, h: 150, fill: 29, fillFrom: 0.55 },
  travel: { drawing: 57, h: 100, trail: 16 },
  pinArrow: [18, 24],
  // The silent viewing check's thresholds for the new marks.
  shown: 0.6,
};

// The drawings a figure uses, in assets/Illustrations/ (README, « Added in
// 1.14.0-proposition »), with their foot in their own viewBox.
export const UNIT_DRAWINGS = {
  person: [1, 2, 3, 4, 5, 6].map((n) => `personne-${n}`),
  bubble: ["bulle"],
  book: "livre",
};
const TRAVEL_DRAWINGS = ["livre"];

// ---------------------------------------------------------------------------
// The card's new fields, checked before anything is timed.
const FIELDS = {
  figures: [
    "id",
    "count",
    "text",
    "per",
    "format",
    "unit",
    "pre",
    "say",
    "until",
  ],
  cascade: ["id", "states", "order", "say", "context", "out"],
  units: ["id", "kind", "value", "per", "byRegion", "say", "dim", "out", "key"],
  row: ["id", "of", "lit", "say", "light", "out"],
  gauges: ["id", "shape", "value", "scale", "label", "name", "say", "out"],
  pins: ["id", "name", "at", "to", "say", "dim", "side", "dy", "bend"],
  letterings: ["text", "from", "to", "bend", "say", "dim", "out", "size"],
  stamps: ["id", "text", "at", "say", "out"],
  frame: ["id", "at", "w", "h", "say", "fill", "out"],
  travel: [
    "id",
    "drawing",
    "text",
    "from",
    "via",
    "to",
    "say",
    "move",
    "ink",
    "out",
  ],
};
export const FIGURE_FIELDS = Object.keys(FIELDS);
// A card carries figures on the map (the 1.7.0 head figures are an object
// with items, not a list).
export const hasFigures = (card) =>
  Array.isArray(card.figures) ||
  FIGURE_FIELDS.some((k) => k !== "figures" && card[k] !== undefined);

export function checkFigureFields(card) {
  if (!hasFigures(card)) return;
  const what = `Card ${card.id}`;
  if (card.type !== "map" || !card.map?.view)
    fail(
      `${what}: les figures sur la carte demandent une carte animée (map.view)`
    );
  const list = (k) => {
    const v = card[k];
    if (v === undefined) return [];
    const items = ["cascade", "row", "frame"].includes(k) ? [v] : v;
    if (!Array.isArray(items)) fail(`${what}: ${k} est une liste`);
    for (const item of items) {
      for (const f of Object.keys(item))
        if (!FIELDS[k].includes(f))
          fail(
            `${what}: ${k}.${f} n'est pas un champ des figures sur la carte`
          );
      if (typeof item.say !== "string" || !item.say)
        fail(`${what}: ${k} nomme son mot (say)`);
    }
    return items;
  };
  const ids = new Set();
  const own = (k, item) => {
    if (typeof item.id !== "string" || !item.id)
      fail(`${what}: ${k} porte son id`);
    if (ids.has(`${k}:${item.id}`)) fail(`${what}: deux ${k} « ${item.id} »`);
    ids.add(`${k}:${item.id}`);
  };
  for (const c of list("cascade")) {
    own("cascade", c);
    if (typeof c.states !== "string")
      fail(`${what}: la cascade nomme le fichier de ses États (states)`);
    if ((c.order ?? "west-east") !== "west-east")
      fail(`${what}: la cascade va d'ouest en est`);
  }
  for (const u of list("units")) {
    own("units", u);
    if (!["person", "bubble"].includes(u.kind))
      fail(`${what}: une unité est un personnage ou une bulle (« ${u.kind} »)`);
    if (!(u.value > 0) || !(u.per > 0))
      fail(`${what}: une unité donne value et per`);
    if (!Number.isInteger(u.value / u.per))
      fail(
        `${what}: Unité qui ne divise pas le chiffre (${u.value} pour ${u.per})`
      );
    if (typeof u.key !== "string" || !u.key.trim())
      fail(`${what}: l'unité ${u.id} donne sa clé pour le pied (key)`);
  }
  for (const r of list("row")) {
    own("row", r);
    if (!Number.isInteger(r.of) || r.of < 2 || !Number.isInteger(r.lit))
      fail(`${what}: une rangée donne of et lit`);
    if (r.lit < 0 || r.lit >= r.of || !r.light)
      fail(
        `${what}: la rangée allume un de ses personnages sur un mot (light)`
      );
  }
  const gauges = list("gauges");
  for (const g of gauges) {
    own("gauges", g);
    if (!(g.shape === "world" || /^area:\S/u.test(g.shape ?? "")))
      fail(`${what}: un verre a la forme du monde ou d'une aire (area:<id>)`);
    if (!(g.value >= 0) || !(g.scale > 0) || g.value > g.scale)
      fail(`${what}: un verre se remplit de value sur scale`);
  }
  if (gauges.length > 2) fail(`${what}: deux verres au plus`);
  for (const p of list("pins")) {
    own("pins", p);
    if (typeof p.name !== "string" || !isPoint(p.at) || p.to === undefined)
      fail(`${what}: une épingle donne name, at et to`);
    checkMapWord(card, { text: p.name, kind: "name" });
  }
  for (const l of list("letterings")) {
    if (typeof l.text !== "string" || !isPoint(l.from) || !isPoint(l.to))
      fail(`${what}: un nom posé donne text, from et to`);
    checkMapWord(card, { text: l.text, kind: "name" });
    const [lo, hi] = FIGURES.lettering.sizes;
    if (l.size !== undefined && (l.size < lo || l.size > hi))
      fail(`${what}: un nom posé tient entre ${lo} et ${hi} px`);
  }
  for (const s of list("stamps")) {
    own("stamps", s);
    if (typeof s.text !== "string" || !isPoint(s.at))
      fail(`${what}: un tampon donne text et at`);
    if (s.text.split(/\s+/u).filter(Boolean).length > FIGURES.stamp.maxWords)
      fail(`${what}: Tampon : deux mots au plus (« ${s.text} »)`);
  }
  for (const f of list("frame")) {
    own("frame", f);
    if (!isPoint(f.at) && typeof f.at !== "string")
      fail(`${what}: le cadre se pose sur [lon, lat] ou une aire`);
    if (f.fill !== undefined) {
      if (typeof f.fill.text !== "string" || !f.fill.say)
        fail(`${what}: le nom qui remplit le cadre donne text et say`);
      checkMapWord(card, { text: f.fill.text, kind: "name" });
      if (!/^arrow:\S/u.test(f.fill.along ?? ""))
        fail(`${what}: le nom arrive le long d'une flèche (along: arrow:<id>)`);
    }
  }
  for (const t of list("travel")) {
    own("travel", t);
    if ((t.drawing === undefined) === (t.text === undefined))
      fail(`${what}: ce qui voyage est un dessin ou un mot`);
    if (t.drawing !== undefined && !TRAVEL_DRAWINGS.includes(t.drawing))
      fail(
        `${what}: pas de dessin « ${t.drawing} » qui voyage (${TRAVEL_DRAWINGS.join(", ")})`
      );
    if (t.from === undefined || t.to === undefined || !t.move)
      fail(`${what}: ce qui voyage donne from, to et move`);
  }
  for (const f of list("figures")) {
    if ((f.count === undefined) === (f.text === undefined))
      fail(`${what}: un chiffre de tête compte (count) ou s'écrit (text)`);
    if (f.count !== undefined && !/^(cascade|units):\S/u.test(f.count))
      fail(
        `${what}: un chiffre compte une cascade ou des unités (« ${f.count} »)`
      );
    if (typeof f.unit !== "string" || !f.unit)
      fail(`${what}: un chiffre de tête donne son unité`);
    if (!["population", undefined].includes(f.format))
      fail(`${what}: le format d'un chiffre est population ou rien`);
  }
}

// ---------------------------------------------------------------------------
// The episode's data: the states a cascade lights, and a source's regional
// breakdown. Both are files of the piece (resolved like its voice), each
// with its source: the design invents neither.
const readJson = (file, dir, what) => {
  try {
    return JSON.parse(readFileSync(resolve(dir, file), "utf8"));
  } catch (error) {
    return fail(`${what}: fichier illisible ${file} (${error.message})`);
  }
};
const polygonRings = (g) =>
  g.type === "Polygon"
    ? [g.coordinates]
    : g.type === "MultiPolygon"
      ? g.coordinates
      : [];
// The centroid of a state's largest outer ring: its place in the cascade.
function centroid(polygons) {
  let best = null;
  for (const [ring] of polygons) {
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
// A FeatureCollection, one feature a unit: `id`, `counted` (a state the
// source counts, or a territory it does not), its source and licence.
export function loadStates(file, dir, what) {
  const g = readJson(file, dir, what);
  if (g.type !== "FeatureCollection" || !g.features?.length)
    fail(`${what}: ${file} est une FeatureCollection d'États`);
  const units = g.features.map((f) => {
    const p = f.properties ?? {};
    if (typeof p.id !== "string" || typeof p.counted !== "boolean")
      fail(`${what}: chaque État de ${file} donne id et counted`);
    for (const k of ["source", "licence"])
      if (typeof p[k] !== "string" || !p[k].trim())
        fail(`${what}: l'État ${p.id} de ${file} n'a pas de ${k}`);
    const polygons = polygonRings(f.geometry ?? {});
    if (!polygons.length) fail(`${what}: l'État ${p.id} n'a pas de contour`);
    return {
      id: p.id,
      name: p.name ?? p.id,
      counted: p.counted,
      polygons,
      centre: centroid(polygons),
    };
  });
  return {
    counted: units.filter((u) => u.counted),
    uncounted: units.filter((u) => !u.counted),
  };
}
// { source, regions: { <id>: { value, states: [ids] } }, land }: the units
// of each region by largest remainder, then placed inside its states' land.
export function loadRegions(file, dir, what) {
  const r = readJson(file, dir, what);
  if (typeof r.source !== "string" || !r.source.trim())
    fail(`${what}: ${file} cite sa source`);
  if (typeof r.land !== "string")
    fail(`${what}: ${file} nomme sa terre (land)`);
  const regions = Object.entries(r.regions ?? {}).map(([id, x]) => {
    if (!(x.value >= 0) || !Array.isArray(x.states) || !x.states.length)
      fail(`${what}: la région ${id} de ${file} donne value et states`);
    return { id, value: x.value, states: x.states };
  });
  if (!regions.length) fail(`${what}: ${file} n'a pas de région`);
  return { source: r.source, land: r.land, regions };
}
// Largest remainder: `total` units shared out by value, ties to the first.
export function largestRemainder(values, total) {
  const sum = values.reduce((a, b) => a + b, 0);
  const exact = values.map((v) => (v / sum) * total);
  const out = exact.map(Math.floor);
  const order = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  const missing = total - out.reduce((a, b) => a + b, 0);
  for (let k = 0; k < missing; k++) out[order[k].i]++;
  return out;
}

const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
};
const inPolygons = (x, y, polygons) =>
  polygons.some(
    (p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h))
  );
// mulberry32: the units' fixed seed, so a frame is the same on every run.
function seeded(text) {
  let a = [...text].reduce(
    (h, c) => Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0,
    2166136261
  );
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A unit's box on screen from its foot point, as the boards draw it.
export function unitBox(kind, x, y, h = FIGURES[kind].h) {
  if (kind === "person")
    return { x: x - 0.24 * h, y: y - 0.96 * h, w: 0.48 * h, h: 1.04 * h };
  const w = (h * 44) / 38;
  return { x: x - (w * 12) / 44, y: y - (h * 36) / 38, w, h };
}
const inside = (b, band) =>
  b.x >= band.x[0] &&
  b.x + b.w <= band.x[1] &&
  b.y >= band.y[0] &&
  b.y + b.h <= band.y[1];

// Units inside each region's land, spread by best candidate (the point of
// 40 drawn in the land and the band that is farthest from those placed),
// all on the camera of their first frame, in the band their card's push
// leaves them.
function placeByRegion(u, breakdown, land, camera, band, what) {
  const byId = new Map(
    [...land.counted, ...land.uncounted].map((s) => [s.id, s])
  );
  const counts = largestRemainder(
    breakdown.regions.map((r) => r.value),
    u.value / u.per
  );
  const placed = [];
  const random = seeded(u.id);
  breakdown.regions.forEach((region, k) => {
    const polygons = region.states.flatMap((id) => {
      const s =
        byId.get(id) ??
        fail(`${what}: la région ${region.id} nomme un État absent (${id})`);
      return s.polygons;
    });
    const pts = polygons.flatMap((p) => p[0]);
    const [w, e] = [
      Math.min(...pts.map((p) => p[0])),
      Math.max(...pts.map((p) => p[0])),
    ];
    const [s, n] = [
      Math.min(...pts.map((p) => p[1])),
      Math.max(...pts.map((p) => p[1])),
    ];
    for (let c = 0; c < counts[k]; c++) {
      let best = null;
      let tries = 0;
      let found = 0;
      while (found < 40 && tries < 4000) {
        tries++;
        const lon = w + (e - w) * random();
        const lat = s + (n - s) * random();
        if (!inPolygons(lon, lat, polygons)) continue;
        const [x, y] = flatProject(camera, lon, lat);
        if (!inside(unitBox(u.kind, x, y), band)) continue;
        found++;
        const gap = Math.min(
          Infinity,
          ...placed.map((q) => Math.hypot(q.x - x, q.y - y))
        );
        if (!best || gap > best.gap) best = { lon, lat, x, y, gap };
      }
      if (!best)
        fail(
          `${what}: la région ${region.id} n'a pas de terre dans la bande de la carte pour ses unités`
        );
      placed.push({
        at: [+best.lon.toFixed(3), +best.lat.toFixed(3)],
        x: best.x,
        y: best.y,
        region: region.id,
      });
    }
  });
  return {
    placed,
    counts: Object.fromEntries(
      breakdown.regions.map((r, k) => [r.id, counts[k]])
    ),
  };
}
// Without a breakdown the units stand in a row in the map band, off the land.
function placeInRow(u) {
  const n = u.value / u.per;
  const box = unitBox(u.kind, 0, 0);
  const gap = Math.min(box.w * 1.25, 900 / n);
  return Array.from({ length: n }, (_, k) => ({
    screen: [540 + (k - (n - 1) / 2) * gap, MARKS.band.y[1] - 24],
  }));
}

// The number the voice says in the chunk that holds `say`: « 54 », « 2 000 ».
function spokenNumber(seq, i, say) {
  for (const c of seq.chunks.filter((x) => x.card === i)) {
    const units = chunkUnits(c.text);
    const k = units.findIndex(
      (u) => u.replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "") === say
    );
    if (k < 0) continue;
    const after = units.slice(k).join(" ");
    const m = after.match(/\d[\d   ]*\d|\d/u);
    return m ? Number(m[0].replace(/[   ]/gu, "")) : null;
  }
  return null;
}

// The voice's words of the chunk that holds `say`, bare and lower case.
function chunkWords(seq, i, say) {
  const bare = (u) =>
    u
      .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "")
      .replace(/[’]/gu, "'")
      .toLowerCase();
  for (const c of seq.chunks.filter((x) => x.card === i)) {
    const units = chunkUnits(c.text).map(bare);
    if (
      units.includes(bare(say)) ||
      units.some((u) => u.replace(/^\p{L}{1,3}'/u, "") === bare(say))
    )
      return units.flatMap((u) => [u, u.replace(/^\p{L}{1,3}'/u, "")]);
  }
  return [];
}

// ---------------------------------------------------------------------------
// The plan of one card's figures. `ctx` gives `word(unit)` (a frame), `end`
// (the card's last frame), `cameraAt(frame)`, `push` (the card's push at its
// end), `placeAt(ref)` ([lon, lat] of a place id or a point), `areaOf(id)`
// (the run's area of that id), `arrowOf(id)` (a planned arrow) and `dir`.
export function planFigures(seq, i, ctx) {
  const card = seq.cards[i];
  if (!hasFigures(card)) return null;
  const what = `Card ${card.id}`;
  const { word, end } = ctx;
  const until = (w) => (w === undefined ? Infinity : word(w));
  const plan = { card: i };

  if (card.cascade) {
    const c = card.cascade;
    const land = loadStates(c.states, ctx.dir, what);
    const states = land.counted.toSorted((a, b) => a.centre[0] - b.centre[0]);
    const start = word(c.say);
    const n = states.length;
    plan.cascade = {
      id: c.id,
      file: c.states,
      start,
      states: states.map((s, k) => ({
        id: s.id,
        start:
          start +
          (n > 1 ? Math.round((k * FIGURES.cascade.frames) / (n - 1)) : 0),
      })),
      uncounted: land.uncounted.map((s) => s.id),
      context: until(c.context),
      out: until(c.out),
      land,
    };
  }
  plan.units = (card.units ?? []).map((u) => {
    const start = word(u.say);
    const camera = ctx.cameraAt(start);
    let items;
    let regions = null;
    if (u.byRegion) {
      const breakdown = loadRegions(u.byRegion, ctx.dir, what);
      const land =
        plan.cascade?.file === breakdown.land
          ? plan.cascade.land
          : loadStates(breakdown.land, ctx.dir, what);
      const band = pushedBand(MARKS.band, ctx.pushFrom(start));
      const r = placeByRegion(u, breakdown, land, camera, band, what);
      items = r.placed;
      regions = r.counts;
    } else items = placeInRow(u);
    const lonOf = (it) =>
      it.at ? flatProject(camera, ...it.at)[0] : it.screen[0];
    items = items.toSorted((a, b) => lonOf(a) - lonOf(b));
    const step = FIGURES[u.kind].step;
    return {
      id: u.id,
      kind: u.kind,
      per: u.per,
      value: u.value,
      key: u.key,
      regions,
      start,
      dim: until(u.dim),
      out: until(u.out),
      items: items.map((it, k) => ({
        ...(it.at ? { at: it.at } : { screen: it.screen }),
        region: it.region,
        start: start + Math.round(k * step),
        drawing: u.kind === "person" ? UNIT_DRAWINGS.person[k % 6] : "bulle",
      })),
    };
  });
  if (card.row) {
    const r = card.row;
    const start = word(r.say);
    plan.row = {
      id: r.id,
      of: r.of,
      lit: r.lit,
      start,
      light: word(r.light),
      out: until(r.out),
      items: Array.from({ length: r.of }, (_, k) => ({
        x: 540 + (k - (r.of - 1) / 2) * FIGURES.row.gap,
        start: start + Math.round(k * FIGURES.row.step),
        drawing: `personne-${FIGURES.rowVariants[k % FIGURES.rowVariants.length]}`,
      })),
    };
  }
  const gauges = card.gauges ?? [];
  plan.gauges = gauges.map((g, k) => {
    const cx = FIGURES.gauge.centres[gauges.length][k];
    let rings = null;
    let h = FIGURES.gauge.w;
    if (g.shape !== "world") {
      const area =
        ctx.areaOf(g.shape.slice(5)) ??
        fail(`${what}: le verre ${g.id} nomme une aire absente (${g.shape})`);
      rings = area.polygons.map((p) => p[0]).filter((r) => r.length > 30);
      h = FIGURES.gauge.h;
    }
    return {
      id: g.id,
      shape: g.shape,
      cx,
      cy: FIGURES.gauge.cy,
      w: FIGURES.gauge.w,
      h,
      rings,
      level: g.value / g.scale,
      scale: g.scale,
      ticks: FIGURES.gauge.ticks.filter((t) => t <= g.scale),
      label: g.label,
      name: g.name,
      start: word(g.say),
      out: until(g.out),
    };
  });
  for (const g of plan.gauges) Object.assign(g, glassGeometry(g));
  plan.letterings = (card.letterings ?? []).map((l) => ({
    text: l.text,
    from: l.from,
    to: l.to,
    bend: l.bend ?? 0.12,
    size: l.size ?? FIGURES.lettering.size,
    start: word(l.say),
    dim: until(l.dim),
    out: until(l.out),
  }));
  plan.stamps = (card.stamps ?? []).map((s) => {
    const said = chunkWords(seq, i, s.say);
    const words = s.text.toLowerCase().replace(/[’]/gu, "'").split(/\s+/u);
    const unknown =
      s.text === "?" && said.some((w) => w === "inconnu" || w === "inconnue");
    if (!unknown && !words.every((w) => said.includes(w)))
      fail(`${what}: Tampon hors de la narration (« ${s.text} »)`);
    return {
      id: s.id,
      text: s.text,
      at: s.at,
      start: word(s.say),
      out: until(s.out),
      rotate: s.text === "?" ? FIGURES.stamp.unknown : FIGURES.stamp.rotate,
    };
  });
  if (card.frame) {
    const f = card.frame;
    const at = isPoint(f.at)
      ? f.at
      : (() => {
          const area =
            ctx.areaOf(f.at) ??
            fail(`${what}: le cadre se pose sur une aire absente (${f.at})`);
          return centroid(area.polygons);
        })();
    plan.frame = {
      id: f.id,
      at,
      w: f.w ?? FIGURES.frame.w,
      h: f.h ?? FIGURES.frame.h,
      start: word(f.say),
      out: until(f.out),
      ...(f.fill && {
        fill: {
          text: f.fill.text,
          start: word(f.fill.say),
          from: (
            ctx.arrowOf(f.fill.along.slice(6)) ??
            fail(
              `${what}: le nom arrive le long d'une flèche absente (${f.fill.along})`
            )
          ).from,
        },
      }),
    };
  }
  plan.travel = (card.travel ?? []).map((t) => ({
    id: t.id,
    drawing: t.drawing,
    text: t.text,
    path: [
      ctx.placeAt(t.from),
      ...(t.via ?? []).map(ctx.placeAt),
      ctx.placeAt(t.to),
    ],
    start: word(t.say),
    move: word(t.move),
    out: until(t.out),
    ink: t.ink ?? "a",
  }));
  // The head: one figure at a time, each until the next or its `until`.
  const specs = card.figures ?? [];
  plan.figures = specs.map((f, k) => {
    const start = word(f.say);
    const next = specs[k + 1] ? word(specs[k + 1].say) - DUR.micro : end;
    const source = f.count ? f.count.split(":") : null;
    return {
      id: f.id ?? (source ? source[1] : f.text),
      count: source && { kind: source[0], id: source[1] },
      per: f.per ?? 1,
      format: f.format,
      text: f.text,
      pre: f.pre,
      unit: f.unit,
      start,
      end: f.until !== undefined ? word(f.until) : next,
    };
  });
  for (const f of plan.figures) {
    if (!f.count) continue;
    const final = finalCount(plan, f) * f.per;
    const spoken = spokenNumber(seq, i, specs[plan.figures.indexOf(f)].say);
    const units =
      f.count.kind === "units"
        ? plan.units.find((u) => u.id === f.count.id)
        : null;
    if (
      (spoken !== null && spoken !== final) ||
      (units && units.value !== final)
    )
      fail(
        `${what}: Le décompte ne tombe pas sur le chiffre dit (${final} pour ${spoken ?? units.value})`
      );
  }
  return plan;
}

function finalCount(plan, f) {
  if (f.count.kind === "cascade") {
    if (plan.cascade?.id !== f.count.id)
      fail(`Card: pas de cascade « ${f.count.id} »`);
    return plan.cascade.states.length;
  }
  const u =
    plan.units.find((x) => x.id === f.count.id) ??
    fail(`Card: pas d'unités « ${f.count.id} »`);
  return u.items.length;
}

// A glass on screen: its outline (Africa's silhouette fitted in its box, or
// a globe), its height and its top, the waterline at its level.
function glassGeometry(g) {
  if (!g.rings) {
    const r = Math.min(g.w, g.h) / 2;
    return {
      top: g.cy - r,
      height: 2 * r,
      d: `M${g.cx - r},${g.cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`,
    };
  }
  const pts = g.rings.flat();
  const [lo0, lo1] = [
    Math.min(...pts.map((p) => p[0])),
    Math.max(...pts.map((p) => p[0])),
  ];
  const [la0, la1] = [
    Math.min(...pts.map((p) => p[1])),
    Math.max(...pts.map((p) => p[1])),
  ];
  const k = Math.min(g.w / (lo1 - lo0), g.h / (la1 - la0));
  const ox = g.cx - ((lo1 - lo0) * k) / 2;
  const oy = g.cy - ((la1 - la0) * k) / 2;
  const d = g.rings
    .map(
      (r) =>
        "M" +
        r
          .map(
            ([lon, lat]) =>
              `${(ox + (lon - lo0) * k).toFixed(1)},${(oy + (la1 - lat) * k).toFixed(1)}`
          )
          .join("L") +
        "Z"
    )
    .join("");
  return { top: oy, height: (la1 - la0) * k, d };
}

// ---------------------------------------------------------------------------
// The counts the head shows at `frame`: the drawings on screen.
export function figureCounts(plan, frame) {
  const counts = {};
  if (plan.cascade)
    counts[`cascade:${plan.cascade.id}`] = plan.cascade.states.filter(
      (s) => frame > s.start
    ).length;
  for (const u of plan.units)
    counts[`units:${u.id}`] =
      frame >= u.out
        ? u.items.length
        : u.items.filter((it) => frame > it.start).length;
  return counts;
}
// French numbers: « 2 000 » with a narrow no-break space; a population in
// millions up to a billion, then « 1,5 milliard ».
const NNBSP = " ";
export function formatCount(n, format) {
  if (format === "population") {
    if (n >= 1e9) {
      const b = Math.round(n / 1e8) / 10;
      return {
        num: String(b).replace(".", ","),
        unit: b >= 2 ? "milliards" : "milliard",
      };
    }
    return { num: String(Math.round(n / 1e6)), unit: "millions" };
  }
  return {
    num: String(n).replace(/\B(?=(\d{3})+(?!\d))/gu, NNBSP),
    unit: null,
  };
}
// The figure head at `frame`, or null: its lines, its opacity, and how far
// the card's kicker and title have stepped aside.
export function figureHeadAt(plan, frame) {
  if (!plan?.figures.length) return null;
  const counts = figureCounts(plan, frame);
  let current = null;
  let away = 0;
  for (const f of plan.figures) {
    const o =
      ramp(frame - f.start, DUR.micro) * (1 - ramp(frame - f.end, DUR.micro));
    away = Math.max(
      away,
      ramp(frame - (f.start - DUR.micro), DUR.micro) *
        (1 - ramp(frame - f.end, DUR.micro))
    );
    if (frame >= f.start - DUR.micro && frame < f.end + DUR.micro)
      current = { f, o };
  }
  if (!current) return { head: 1 - away, figure: null };
  const { f, o } = current;
  let num = f.text;
  let unit = f.unit;
  let value = null;
  if (f.count) {
    value = counts[`${f.count.kind}:${f.count.id}`] * f.per;
    const shown = formatCount(value, f.format);
    num = shown.num;
    if (shown.unit) unit = `${shown.unit} ${f.unit}`;
  }
  return {
    head: 1 - away,
    figure: { id: f.id, pre: f.pre ?? null, num, unit, value, opacity: o },
  };
}

// ---------------------------------------------------------------------------
// The figures' state at `frame`, on `camera`, faded by `fade` (the card's
// change) and `shown(start)` (the whip's own visibility).
const dimAt = (frame, dim) =>
  frame < dim
    ? 1
    : 1 - (1 - FIGURES.dim) * ramp(frame - dim, FIGURES.dimFrames);
const outAt = (frame, out) =>
  frame < out ? 1 : 1 - ramp(frame - out, FIGURES.outFrames, EASE.exit);
const quadratic = (a, b, bend) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  return [(a[0] + b[0]) / 2 + dy * bend, (a[1] + b[1]) / 2 - dx * bend];
};

export function figuresAt(plan, frame, camera, fade = 1, shown = () => 1) {
  const at = (p) => flatProject(camera, ...p);
  const out = { card: plan.card };
  if (plan.cascade) {
    const c = plan.cascade;
    const o = fade * shown(c.start) * outAt(frame, c.out);
    const context = frame < c.context ? 0 : ramp(frame - c.context, 15);
    out.cascade = {
      id: c.id,
      file: c.file,
      opacity: o,
      fill:
        FIGURES.cascade.fill * (1 - (1 - FIGURES.cascade.context) * context),
      edge: 1 - 0.5 * context,
      states: c.states
        .filter((s) => frame > s.start)
        .map((s) => ({
          id: s.id,
          swell: swellAt(frame - s.start),
          opacity: EASE.enter(clamp01((frame - s.start) / DUR.swell)),
        })),
      uncounted: frame >= c.start ? c.uncounted : [],
      uncountedOpacity: ramp(frame - c.start, 15),
    };
  }
  out.units = plan.units.flatMap((u) => {
    const o = fade * shown(u.start) * dimAt(frame, u.dim);
    const exit =
      frame >= u.out ? exitAt(frame - u.out) : { opacity: 1, scale: 1 };
    return u.items.flatMap((it) => {
      if (frame <= it.start) return [];
      const p = popAt(frame - it.start, { small: true });
      const [x, y] = it.at ? at(it.at) : it.screen;
      const opacity = o * p.opacity * exit.opacity;
      return opacity > 0
        ? [
            {
              id: u.id,
              kind: u.kind,
              drawing: it.drawing,
              x,
              y,
              h: FIGURES[u.kind].h,
              opacity,
              scale: p.scale * exit.scale,
            },
          ]
        : [];
    });
  });
  out.unitKeys = plan.units.map((u) => ({
    id: u.id,
    kind: u.kind,
    text: u.key,
    opacity: fade * ramp(frame - u.start, DUR.micro) * outAt(frame, u.out),
  }));
  if (plan.row) {
    const r = plan.row;
    const exit =
      frame >= r.out ? exitAt(frame - r.out) : { opacity: 1, scale: 1 };
    const lit = ramp(frame - r.light, FIGURES.row.light);
    out.row = {
      id: r.id,
      items: r.items.flatMap((it, k) => {
        if (frame <= it.start) return [];
        const p = popAt(frame - it.start, { small: true });
        const opacity = fade * shown(r.start) * p.opacity * exit.opacity;
        return opacity > 0
          ? [
              {
                x: it.x,
                y: FIGURES.row.feet,
                h: FIGURES.row.h,
                drawing: it.drawing,
                opacity,
                scale: p.scale * exit.scale,
                colour: k === r.lit ? lit : 0,
                ring: k === r.lit ? lit : 0,
              },
            ]
          : [];
      }),
    };
  }
  out.gauges = plan.gauges.flatMap((g) => {
    const o =
      fade *
      shown(g.start) *
      ramp(frame - g.start, FIGURES.gauge.in, EASE.enter) *
      outAt(frame, g.out);
    if (!(o > 0)) return [];
    const fill = EASE.land(clamp01((frame - g.start) / FIGURES.gauge.fill));
    const label = popAt(frame - g.start - FIGURES.gauge.fill);
    return [
      {
        id: g.id,
        cx: g.cx,
        cy: g.cy,
        w: g.w,
        d: g.d,
        top: g.top,
        height: g.height,
        ticks: g.ticks,
        scale: g.scale,
        level: g.level,
        fill,
        filling: frame >= g.start,
        opacity: o,
        waterline: g.top + g.height * (1 - g.level * fill),
        target: g.top + g.height * (1 - g.level),
        label: g.label,
        labelOpacity: o * label.opacity,
        labelScale: label.scale,
        name: g.name,
        t: frame / 30,
      },
    ];
  });
  out.letterings = plan.letterings.flatMap((l) => {
    if (frame < l.start) return [];
    const o = fade * shown(l.start) * dimAt(frame, l.dim) * outAt(frame, l.out);
    if (!(o > 0)) return [];
    const a = at(l.from);
    const b = at(l.to);
    const c = quadratic(a, b, l.bend);
    const letters = [...l.text].map((_, k) =>
      ramp(
        frame - l.start - k * FIGURES.lettering.step,
        FIGURES.lettering.letter,
        EASE.enter
      )
    );
    return [
      {
        text: l.text,
        a,
        b,
        c,
        size: l.size,
        opacity: o,
        letters,
        box: letteringBox(l.text, l.size, a, b, c),
      },
    ];
  });
  out.stamps = plan.stamps.flatMap((s) => {
    if (frame < s.start) return [];
    const k = ramp(frame - s.start, FIGURES.stamp.frames, EASE.enter);
    const o =
      fade *
      shown(s.start) *
      clamp01((frame - s.start) / 2) *
      outAt(frame, s.out);
    if (!(o > 0)) return [];
    const [x, y] = at(s.at);
    return [
      {
        id: s.id,
        text: s.text,
        x,
        y,
        rotate: s.rotate,
        scale: FIGURES.stamp.from + (1 - FIGURES.stamp.from) * k,
        opacity: o,
        box: stampBox(s.text, x, y),
      },
    ];
  });
  if (plan.frame && frame >= plan.frame.start) {
    const f = plan.frame;
    const [x, y] = at(f.at);
    const drawn = EASE.draw(clamp01((frame - f.start) / FIGURES.frame.draw));
    const o = fade * shown(f.start) * outAt(frame, f.out);
    let fill = null;
    if (f.fill && frame >= f.fill.start) {
      const k = EASE.move(clamp01((frame - f.fill.start) / FIGURES.frame.fill));
      const from = at(f.fill.from);
      const c = quadratic(from, [x, y], 0.05);
      const u = 1 - k;
      fill = {
        text: f.fill.text,
        x: u * u * from[0] + 2 * u * k * c[0] + k * k * x,
        y: u * u * from[1] + 2 * u * k * c[1] + k * k * y,
        scale: FIGURES.frame.fillFrom + (1 - FIGURES.frame.fillFrom) * k,
        k,
        opacity: o * clamp01((frame - f.fill.start) / 6),
      };
    }
    const baseline = f.fill ? 1 - ramp(frame - f.fill.start, 6) : 1;
    out.frame = {
      id: f.id,
      x,
      y,
      w: f.w,
      h: f.h,
      drawn,
      opacity: o,
      baseline:
        frame >= f.start + FIGURES.frame.draw
          ? baseline * (0.55 + 0.25 * Math.sin((frame / 30) * 4))
          : 0,
      fill,
    };
  }
  out.travel = plan.travel.flatMap((t) => {
    if (frame < t.start) return [];
    const o =
      fade * shown(t.start) * ramp(frame - t.start, 6) * outAt(frame, t.out);
    if (!(o > 0)) return [];
    const pts = arrowCurve(
      { from: t.path[0], to: t.path.at(-1), via: t.path.slice(1, -1), bend: 0 },
      camera
    );
    const cum = cumulative(pts);
    const L = cum.at(-1);
    const k = EASE.move(clamp01((frame - t.move) / FIGURES.travel.drawing));
    const p = pointAt(pts, cum, L * k);
    const dots = [];
    for (let s = 6; s <= L * k - 20; s += FIGURES.travel.trail) {
      const q = pointAt(pts, cum, s);
      dots.push([+q.x.toFixed(1), +q.y.toFixed(1)]);
    }
    return [
      {
        id: t.id,
        drawing: t.drawing,
        text: t.text,
        x: p.x,
        y: p.y,
        h: FIGURES.travel.h,
        k,
        opacity: o,
        scale: 1 + 0.08 * Math.sin(Math.PI * k),
        ink: t.ink,
        dots,
      },
    ];
  });
  return out;
}

// Estimated boxes: what the eight-text rule and the band check read before
// the browser draws (the drawn page is checked again at export).
// A lettering's letters sit centred on its path, extended at both ends along
// its tangents by 0.8 of the control arm (as the page draws it): the box is
// the stretch they cover, capitals above it, the 11 px outline around.
const CAP = 0.72;
function letteringPath(a, b, c) {
  const e0 = [a[0] - (c[0] - a[0]) * 0.8, a[1] - (c[1] - a[1]) * 0.8];
  const e1 = [b[0] + (b[0] - c[0]) * 0.8, b[1] + (b[1] - c[1]) * 0.8];
  const pts = [e0];
  for (let s = 0; s <= 1; s += 1 / 40) {
    const u = 1 - s;
    pts.push([
      u * u * a[0] + 2 * u * s * c[0] + s * s * b[0],
      u * u * a[1] + 2 * u * s * c[1] + s * s * b[1],
    ]);
  }
  pts.push(e1);
  return pts;
}
const letteringWidth = (text, size) =>
  estimateWidth(text, size, 0.7 + FIGURES.lettering.track);
function letteringBox(text, size, a, b, c) {
  const pts = letteringPath(a, b, c);
  const cum = cumulative(pts);
  const L = cum.at(-1);
  const half = letteringWidth(text, size) / 2;
  const on = pts.filter((_, k) => Math.abs(cum[k] - L / 2) <= half);
  const xs = on.map((p) => p[0]);
  const ys = on.map((p) => p[1]);
  const pad = 5.5;
  return {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - size * CAP - pad,
    w: Math.max(...xs) - Math.min(...xs) + 2 * pad,
    h: Math.max(...ys) - Math.min(...ys) + size * (CAP + 0.05) + 2 * pad,
  };
}
function stampBox(text, x, y) {
  const q = text === "?";
  const w = q ? 110 : estimateWidth(text.toUpperCase(), 22, 0.75) + 56;
  const h = q ? 140 : 56;
  return { x: x - w / 2, y: y - h / 2, w, h };
}
// The length a lettering's letters need against the path they sit on,
// extended at both ends along its tangents by 0.8 of the control arm.
export const letteringFits = (l) =>
  letteringWidth(l.text, l.size) <=
  cumulative(letteringPath(l.a, l.b, l.c)).at(-1);

// The texts the figures put on the map: what the eight-text rule counts.
export function figureTexts(f) {
  const texts = [];
  for (const l of f.letterings) {
    const half =
      l.letters.filter((x) => x >= 0.5).length >= l.letters.length / 2;
    texts.push({
      text: l.text,
      kind: "lettering",
      word: false,
      opacity: half ? l.opacity : 0,
      box: l.box,
    });
  }
  for (const s of f.stamps)
    texts.push({
      text: s.text,
      kind: "stamp",
      word: false,
      opacity: s.opacity,
      box: s.box,
    });
  for (const g of f.gauges) {
    texts.push({
      text: g.label,
      kind: "gauge",
      word: false,
      opacity: g.labelOpacity,
      box: {
        x: g.cx - estimateWidth(g.label, 72, 0.5) / 2,
        y: g.target - 80,
        w: estimateWidth(g.label, 72, 0.5),
        h: 84,
      },
    });
    if (g.name)
      texts.push({
        text: g.name,
        kind: "gauge",
        word: false,
        opacity: g.opacity,
        box: {
          x: g.cx - estimateWidth(g.name, 32, 0.55) / 2,
          y: g.top + g.height + 14,
          w: estimateWidth(g.name, 32, 0.55),
          h: 38,
        },
      });
  }
  if (f.frame?.fill) {
    const w =
      estimateWidth(f.frame.fill.text, 64, 0.62 + 0.24) * f.frame.fill.scale;
    texts.push({
      text: f.frame.fill.text,
      kind: "frame",
      word: false,
      opacity: f.frame.fill.opacity,
      box: { x: f.frame.fill.x - w / 2, y: f.frame.fill.y - 35, w, h: 70 },
      // A name on its way in is checked in the band once it has landed.
      moving: f.frame.fill.k < 1,
    });
  }
  for (const t of f.travel.filter((x) => x.text)) {
    const w = estimateWidth(t.text, 64, 0.86);
    texts.push({
      text: t.text,
      kind: "travel",
      word: false,
      opacity: t.opacity,
      box: { x: t.x - w / 2, y: t.y - 35, w, h: 70 },
      moving: t.k > 0 && t.k < 1,
    });
  }
  return texts;
}

// What the page needs once, in setup: the states' outlines by file and id,
// and how many images of each drawing a frame may show (a muted row figure
// is its own image, « personne-2|muted »).
export function figureAssets(plans) {
  const states = {};
  const pool = {};
  const add = (key, n = 1) => (pool[key] = (pool[key] ?? 0) + n);
  for (const p of plans) {
    if (p.cascade)
      states[p.cascade.file] = Object.fromEntries(
        [...p.cascade.land.counted, ...p.cascade.land.uncounted].map((s) => [
          s.id,
          s.polygons,
        ])
      );
    for (const u of p.units) for (const it of u.items) add(it.drawing);
    if (p.row)
      for (const it of p.row.items) {
        add(it.drawing);
        add(`${it.drawing}|muted`);
      }
    for (const t of p.travel) if (t.drawing) add(t.drawing);
  }
  return { states, pool };
}

// The silent viewing check's new marks (series.md « 13 »), on one frame's
// figures and head.
export function figureMarkOn(figures, head, mark) {
  const [kind, ...rest] = mark.split(":");
  const id = rest.join(":");
  const of = figures ?? [];
  if (kind === "count")
    return (
      !!head?.figure &&
      head.figure.id === id &&
      head.figure.opacity >= FIGURES.shown
    );
  if (kind === "cascade")
    return of.some(
      (f) =>
        f.cascade?.id === id &&
        f.cascade.states.length > 0 &&
        f.cascade.opacity >= FIGURES.shown
    );
  if (kind === "units")
    return of.some((f) => f.units.some((u) => u.id === id && u.opacity > 0));
  if (kind === "row")
    return of.some((f) => f.row?.id === id && f.row.items.length > 0);
  if (kind === "gauge")
    return of.some((f) =>
      f.gauges.some((g) => g.id === id && g.filling && g.opacity > 0)
    );
  if (kind === "lettering")
    return of.some((f) =>
      f.letterings.some(
        (l) =>
          l.text === id &&
          l.letters.filter((x) => x >= 0.5).length >= l.letters.length / 2 &&
          l.opacity > 0
      )
    );
  if (kind === "stamp")
    return of.some((f) =>
      f.stamps.some((s) => s.id === id && s.opacity >= FIGURES.shown)
    );
  if (kind === "frame")
    return of.some(
      (f) =>
        f.frame?.id === id && f.frame.opacity * f.frame.drawn >= FIGURES.shown
    );
  if (kind === "travel")
    return of.some((f) =>
      f.travel.some((t) => t.id === id && t.opacity >= FIGURES.shown)
    );
  return null;
}
export const FIGURE_MARKS = [
  "count",
  "cascade",
  "units",
  "row",
  "gauge",
  "lettering",
  "stamp",
  "frame",
  "travel",
];
