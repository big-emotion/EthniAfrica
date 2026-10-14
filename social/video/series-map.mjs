// The series video's map cards on satellite imagery (EthniAfrica Cartes
// 1.4.1, series.md « Map cards on satellite imagery », handoff.md « Renderer
// integration of 1.4.1 »). A map card is a still, top-down view of the
// satellite video's flat style, fitted around its subject and drawn with that
// video's overlays: this module turns the card and its base map into that
// view, in frame pixels, with no browser. series-page.mjs draws it.
import { project, unproject, placeLabels, estimateWidth } from "./sequence.mjs";

export const MAP_FRAME = {
  // The subject's box, centred on the target: x 120 to 960, y 750 to 1270.
  centre: [540, 1010],
  box: [840, 520],
  // Names on the map, at most six, never under the head or the subtitle.
  names: { x: [60, 1020], y: [724, 1296] },
  maxNames: 6,
  // A subject shorter than this at the scale limit is refused.
  minSubject: 120,
  // No source pixel enlarged past 1.5 at the end of the card's slow zoom.
  maxScale: 1.5,
  maxZoom: 1.04,
  // A map card's foot holds its key: it may start at y 1600.
  foot: [1600, 1786],
};
const EARTH_KM = 6371;
const fail = (message) => {
  throw new Error(message);
};
const round = (n) => +n.toFixed(1);

// What the satellite grammar draws. An atlas card is refused as a whole; any
// other field is refused rather than silently dropped.
const ATLAS_FIELDS = ["atlas", "categorical", "marks", "dimOutside"];
const DRAWN = new Set([
  "data",
  "dataRef",
  // The carousel's window on its base map: the video frames the subject.
  "view",
  "borders",
  "highlight",
  "areas",
  "labels",
  "places",
  "countryLabels",
  "waterLabels",
  // Nudges a carousel name by card pixels: the video places names by rule.
  "labelOffsets",
  "caption",
]);

export function checkSeriesMapCard(card) {
  const map = card.map ?? fail(`Card ${card.id} has no map`);
  if (ATLAS_FIELDS.some((k) => k in map))
    fail(`Card ${card.id}: Carte d'atlas : carrousel seulement`);
  for (const k of Object.keys(map))
    if (!DRAWN.has(k))
      fail(
        `Card ${card.id}: map.${k} has no equivalent on satellite imagery; the video cannot draw it`
      );
  if (!["none", "quiet", "strong", undefined].includes(map.borders))
    fail(
      `Card ${card.id}: borders « ${map.borders} » are not drawn on imagery (none, quiet or strong)`
    );
}

// « équirectangulaire, 19 px par degré, origine -19° 30° » or « …, origine
// 28,45° E 4,42° N ».
export function baseMapProjection(meta) {
  const m =
    /([\d.,]+) px par degré, origine ([-\d.,]+)°\s*([EW])?\s+([-\d.,]+)°\s*([NS])?/u.exec(
      meta.projection ?? ""
    ) ?? fail(`No equirectangular projection in « ${meta.projection} »`);
  const num = (s) => Number(s.replace(",", "."));
  return {
    k: num(m[1]),
    lon0: m[3] === "W" ? -num(m[2]) : num(m[2]),
    lat0: m[5] === "S" ? -num(m[4]) : num(m[4]),
  };
}

export const cardPoint = ({ k, lon0, lat0 }, x, y) => [
  lon0 + x / k,
  lat0 - y / k,
];

const pathTokens = (d) => {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  for (const t of tokens)
    if (/[A-Za-z]/.test(t) && !/^[MLCZ]$/.test(t))
      fail(
        `Card paths use absolute M, L, C and Z commands only; « ${t} » found`
      );
  return tokens;
};

// Every coordinate pair of a card path, control points included.
export function pathCoordinates(d) {
  const numbers = pathTokens(d)
    .filter((t) => !/[A-Z]/.test(t))
    .map(Number);
  const pairs = [];
  for (let i = 0; i + 1 < numbers.length; i += 2)
    pairs.push([numbers[i], numbers[i + 1]]);
  return pairs;
}

// The same path with every pair mapped by `f`, commands kept.
export function mapPath(d, f) {
  let out = "";
  let pending = [];
  let first = true;
  const flush = () => {
    for (let i = 0; i + 1 < pending.length; i += 2) {
      const [x, y] = f([pending[i], pending[i + 1]]);
      out += `${first ? "" : " "}${round(x)},${round(y)}`;
      first = false;
    }
    pending = [];
  };
  for (const t of pathTokens(d)) {
    if (/[A-Z]/.test(t)) {
      flush();
      out += t;
      first = true;
    } else pending.push(Number(t));
  }
  flush();
  return out;
}

const polygonsOf = (g) =>
  g.type === "Polygon"
    ? [g.coordinates]
    : g.type === "MultiPolygon"
      ? g.coordinates
      : [];

// Natural Earth 1:50m admin 0, by ADM0_A3 (the codes the base maps use).
export function countryIndex(geojson) {
  const index = new Map();
  for (const f of geojson.features) {
    const p = f.properties;
    index.set(p.ADM0_A3, {
      name: p.NAME_FR ?? p.NAME,
      label: [p.LABEL_X, p.LABEL_Y],
      polygons: polygonsOf(f.geometry),
    });
  }
  return index;
}

// The land borders: every edge two countries share, joined into lines.
// Natural Earth's countries share their border vertices exactly, so a
// coastline (an edge of one country only) is never drawn.
export function sharedBorders(geojson, [west, east, south, north]) {
  const inside = ([lon, lat]) =>
    lon >= west && lon <= east && lat >= south && lat <= north;
  const owners = new Map();
  const point = new Map();
  const id = (p) => {
    const key = `${p[0]},${p[1]}`;
    point.set(key, p);
    return key;
  };
  for (const f of geojson.features)
    for (const polygon of polygonsOf(f.geometry))
      for (const ring of polygon)
        for (let i = 0; i + 1 < ring.length; i++) {
          if (!inside(ring[i]) && !inside(ring[i + 1])) continue;
          const [a, b] = [id(ring[i]), id(ring[i + 1])].sort();
          if (a === b) continue;
          const key = `${a}|${b}`;
          if (!owners.has(key)) owners.set(key, new Set());
          owners.get(key).add(f.properties.ADM0_A3);
        }
  const next = new Map();
  const link = (a, b) => {
    if (!next.has(a)) next.set(a, []);
    next.get(a).push(b);
  };
  for (const [key, isos] of owners) {
    if (isos.size < 2) continue;
    const [a, b] = key.split("|");
    link(a, b);
    link(b, a);
  }
  const used = new Set();
  const edge = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const lines = [];
  const walk = (start) => {
    for (const first of next.get(start)) {
      if (used.has(edge(start, first))) continue;
      const line = [start];
      let [from, to] = [start, first];
      for (;;) {
        used.add(edge(from, to));
        line.push(to);
        if (next.get(to).length !== 2) break;
        const after = next.get(to).find((n) => n !== from);
        if (used.has(edge(to, after))) break;
        [from, to] = [to, after];
      }
      lines.push(line.map((k) => point.get(k)));
    }
  };
  const nodes = [...next.keys()].sort();
  // Line ends and junctions first, then the closed loops left.
  nodes.filter((n) => next.get(n).length !== 2).forEach(walk);
  nodes.forEach(walk);
  return lines;
}

// The still top-down view: centred on the middle of the subject's longitude
// and latitude box at (540, 1010); the largest radius that keeps every
// subject point within 840 × 520 around it; capped by the imagery's scale
// limit at the end of the card's zoom.
export function fitMapCamera(box, imagery, points) {
  const lon = (box.west + box.east) / 2;
  const lat = (box.south + box.north) / 2;
  const centreY = MAP_FRAME.centre[1];
  const unit = { lon, lat, radius: 1, centreY };
  const sample = points ?? [
    ...[0, 0.25, 0.5, 0.75, 1].flatMap((t) => [
      [box.west + t * (box.east - box.west), box.south],
      [box.west + t * (box.east - box.west), box.north],
      [box.west, box.south + t * (box.north - box.south)],
      [box.east, box.south + t * (box.north - box.south)],
    ]),
  ];
  let fit = Infinity;
  for (const [x, y] of sample) {
    const p = project(unit, x, y);
    const dx = Math.abs(p.x - MAP_FRAME.centre[0]);
    const dy = Math.abs(p.y - centreY);
    if (dx > 0) fit = Math.min(fit, MAP_FRAME.box[0] / 2 / dx);
    if (dy > 0) fit = Math.min(fit, MAP_FRAME.box[1] / 2 / dy);
  }
  const limit =
    (MAP_FRAME.maxScale * imagery.width) / (2 * Math.PI) / MAP_FRAME.maxZoom;
  const radius = Math.min(fit, limit);
  const camera = { lon, lat, radius, centreY };
  const xs = [];
  const ys = [];
  for (const [x, y] of sample) {
    const p = project(camera, x, y);
    xs.push(p.x);
    ys.push(p.y);
  }
  const long = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys)
  );
  if (long < MAP_FRAME.minSubject)
    fail(
      `Sujet trop petit pour l'imagerie vérifiée: ${Math.round(long)} px across at the imagery's limit, ${MAP_FRAME.minSubject} at least`
    );
  return {
    ...camera,
    capped: fit > limit,
    spanKm: (1080 / radius) * EARTH_KM,
  };
}

// The longitude and latitude the frame shows, with a margin: the region the
// full-resolution imagery must cover.
function frameBounds(camera) {
  const lons = [];
  const lats = [];
  for (let x = 0; x <= 1080; x += 90)
    for (let y = 0; y <= 1920; y += 120) {
      const g = unproject(camera, x, y);
      if (!g) continue;
      lons.push(g.lon);
      lats.push(g.lat);
    }
  return [
    Math.max(-180, Math.floor(Math.min(...lons)) - 1),
    Math.min(180, Math.ceil(Math.max(...lons)) + 1),
    Math.max(-90, Math.floor(Math.min(...lats)) - 1),
    Math.min(90, Math.ceil(Math.max(...lats)) + 1),
  ];
}

export function seriesMapCredits(map, imagery) {
  return {
    source: (map.caption?.source ?? "")
      .replace(/\s*;\s*fond [^;]*$/u, "")
      .trim(),
    imagery: `Imagerie : ${imagery.credit} ; frontières : Natural Earth, domaine public`,
  };
}

// The 0.4.0 placement rule at the series sizes (series.md, « Names »).
const LABEL_STYLES = {
  region: {
    sizes: [44, 40, 36],
    box: (t, s) => [estimateWidth(t, s, 0.58), s + 8],
  },
  area: { sizes: [32], box: (t, s) => [estimateWidth(t, s, 0.55), s + 6] },
  water: { sizes: [26], box: (t, s) => [estimateWidth(t, s, 0.55), s + 4] },
};
const inkOf = (tone) => (tone ?? "area-a").replace("area-", "");

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

// One map card as the series frame draws it: camera, overlays and names in
// frame pixels at 100 % (the slow zoom scales them around (540, 1010)), the
// key, the credits, the subject's box and the imagery's enlargement.
export function seriesMapView(card, data, countries, world, imagery) {
  checkSeriesMapCard(card);
  const map = card.map;
  const proj = baseMapProjection(data.meta);
  const fromCard = ([x, y]) => cardPoint(proj, x, y);
  const highlighted = (map.highlight?.isos ?? []).map(
    (iso) =>
      countries.get(iso) ??
      fail(`Card ${card.id}: no Natural Earth country ${iso}`)
  );
  const areas = (map.areas ?? []).map((a) => ({
    area: a,
    points: a.paths.flatMap((d) => pathCoordinates(d).map(fromCard)),
  }));
  let subject = [
    ...highlighted.flatMap((c) => c.polygons.flatMap((p) => p[0])),
    ...areas.flatMap((a) => a.points),
  ];
  if (!subject.length) {
    const [x, y, w, h] =
      map.view ?? data.meta.viewBox.split(/[ ,]+/).map(Number);
    subject = [fromCard([x, y]), fromCard([x + w, y + h])];
  }
  const camera = fitMapCamera(extent(subject), imagery, subject);
  const at = (lon, lat) => {
    const p = project(camera, lon, lat);
    return [p.x, p.y];
  };
  const ring = (points) =>
    "M" +
    points.map(([lon, lat]) => at(lon, lat).map(round).join(",")).join("L");
  const bounds = frameBounds(camera);

  const drawn = [];
  const key = [];
  if (map.highlight) {
    const ink = inkOf(map.highlight.tone);
    drawn.push({
      d: highlighted
        .flatMap((c) => c.polygons.flatMap((p) => p.map((r) => ring(r) + "Z")))
        .join(""),
      ink,
      uncertain: false,
      hatch: 45,
    });
    if (map.highlight.legend)
      key.push({ swatch: `certain-${ink}`, label: map.highlight.legend });
  }
  const seen = [];
  for (const { area: a, points } of areas) {
    const ink = inkOf(a.tone);
    const uncertain = a.kind !== "certain";
    const box = extent(points);
    // An area inside an earlier one is hatched the other way (0.4.0).
    const hatch = seen.some((b) => within(box, b)) ? 135 : 45;
    seen.push(box);
    drawn.push({
      d: a.paths.map((d) => mapPath(d, (p) => at(...fromCard(p)))).join(""),
      ink,
      uncertain,
      hatch,
    });
    const label = a.legend ?? a.label;
    if (label)
      key.push({
        swatch: `${uncertain ? "uncertain" : "certain"}-${ink}`,
        label,
      });
  }
  const borders = [];
  if (map.borders === "quiet" || map.borders === "strong") {
    const lines = sharedBorders(world, bounds);
    if (lines.length)
      borders.push({
        d: lines.map((l) => ring(l)).join(""),
        strong: map.borders === "strong",
      });
    if (map.borders === "strong")
      key.push({ swatch: "border-strong", label: "Frontières actuelles" });
  }

  // Names: the highlighted countries, or every country, then the card's own.
  const [bx, by] = [MAP_FRAME.names.x, MAP_FRAME.names.y];
  const inBand = ([x, y]) =>
    x >= bx[0] && x <= bx[1] && y >= by[0] && y <= by[1];
  const labels = [];
  const add = (text, [x, y], style, ink) =>
    labels.push({
      key: labels.length,
      text,
      style,
      ink,
      anchor: { x, y },
    });
  if (map.countryLabels === "highlight")
    for (const c of highlighted) add(c.name, at(...c.label), "region");
  else if (map.countryLabels === true)
    for (const l of data.labels?.countries ?? []) {
      const p = at(...fromCard([l.x, l.y]));
      if (inBand(p)) add(l.text, p, "region");
    }
  for (const l of map.labels ?? []) {
    if (l.kind === "country" && (map.borders ?? "none") === "none") continue;
    const style =
      l.kind === "area" ? "area" : l.kind === "water" ? "water" : "region";
    add(
      l.text,
      at(...fromCard([l.x, l.y])),
      style,
      l.tone ? inkOf(l.tone) : undefined
    );
  }
  if (map.waterLabels === true)
    for (const lake of data.lakes ?? []) {
      const e = extent(pathCoordinates(lake.d).map(fromCard));
      const p = at((e.west + e.east) / 2, (e.south + e.north) / 2);
      if (lake.name && inBand(p)) add(lake.name, p, "water");
    }
  const places = (map.places ?? []).map((p) => {
    const [x, y] = at(...fromCard([p.x, p.y]));
    const w = estimateWidth(p.name, 28, 0.58);
    return { name: p.name, x, y, box: { x: x + 14, y: y - 17, w, h: 34 } };
  });
  const count = labels.length + places.length;
  if (count > MAP_FRAME.maxNames)
    fail(
      `Card ${card.id}: ${count} names on the map, ${MAP_FRAME.maxNames} at most`
    );
  const obstacles = places.flatMap((p) => [
    p.box,
    { x: p.x - 8, y: p.y - 8, w: 16, h: 16 },
  ]);
  const placed = placeLabels(labels, obstacles, {
    band: MAP_FRAME.names,
    styles: LABEL_STYLES,
  });
  const names = [];
  placed.forEach((p, i) => {
    const l = labels[i];
    if (p.box)
      names.push({
        text: l.text,
        style: l.style,
        ...(l.ink && { ink: l.ink }),
        size: p.size,
        box: p.box,
      });
    // With no room on the map, the name goes to the key as text (0.4.0).
    else key.push({ swatch: "text", label: l.text });
  });

  const xs = [];
  const ys = [];
  for (const [lon, lat] of subject) {
    const [x, y] = at(lon, lat);
    xs.push(x);
    ys.push(y);
  }
  return {
    camera: {
      lon: camera.lon,
      lat: camera.lat,
      radius: camera.radius,
      centreY: camera.centreY,
    },
    capped: camera.capped,
    spanKm: camera.spanKm,
    scale: (camera.radius * 2 * Math.PI) / imagery.width,
    bounds,
    areas: drawn,
    borders,
    names,
    places: places.map(({ name, x, y }) => ({ name, x, y })),
    key,
    credits: seriesMapCredits(map, imagery),
    subject: {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    },
  };
}
