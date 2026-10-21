// Traces the highest palaeoshoreline of Mega-Chad as an elevation contour on
// NOAA ETOPO 2022, for the Sahara map video.
//
// Operator ruling of 12 October 2026 (design 0.3.0-proposition): the outline
// is the 325 m contour, the highest palaeoshoreline of Leblanc et al. (2006),
// 325 ± 5 m, traced on ETOPO 2022. The designer's mock-up contour is not a
// source and must never replace this file's output.
//
//   ETHNIAFRICA_VIDEO_ASSETS=PATH node social/video/shoreline.mjs [--date YYYY-MM-DD]
//
// writes social/video/data/megachad-325m.geojson. Same DEM and same date give
// the same bytes.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const EARTH_RADIUS_KM = 6371.0088;

export const DEM = {
  name: "ETOPO 2022 Global Relief Model",
  version: "v1",
  resolution: "60 arc-seconds",
  file: "relief/ETOPO_2022_v1_60s_N90W180_surface.tif",
  url: "https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/60s/60s_surface_elev_gtif/ETOPO_2022_v1_60s_N90W180_surface.tif",
  sha256: "9d27d4b8ea8e76977e2988bca667d7c8fa68b927355feffcddd6b4875a7fd08e",
  bytes: 465969062,
  vertical_datum: "EGM2008",
  doi: "10.25921/fd45-gt74",
  citation:
    "NOAA National Centers for Environmental Information. 2022: ETOPO 2022 Global Relief Model. DOI: 10.25921/fd45-gt74.",
  licence:
    "Public domain in the United States; NOAA NCEI dedicates it under CC0-1.0. Credit: NOAA NCEI.",
};

export const SOURCE = {
  citation:
    "Leblanc, M., Favreau, G., Maley, J., Nazoumou, Y., Leduc, C., Stagnitti, F., van Oevelen, P. J., Delclaux, F., Lemoalle, J. (2006). Reconstruction of Megalake Chad using Shuttle Radar Topographic Mission data. Palaeogeography, Palaeoclimatology, Palaeoecology 239 (1–2), 16–27.",
  doi: "10.1016/j.palaeo.2006.01.003",
  passage:
    "p. 16 (abstract) and p. 20 (§3.1): the remains of the highest palaeoshoreline have a constant elevation of 325 ± 5 m amsl on SRTM30, the elevation of the Mayo Kebbi spillway; p. 20 (§3.2): about 340,400 km² at that level.",
};

// The Chad basin read from the DEM, with room on every side: the traced
// lake must not touch the crop edge, or the crop would be cutting it.
const CROP = { west: 5, east: 28, south: 3, north: 26 };
// Open water of present-day Lake Chad (southern pool).
const LAKE_CHAD_TODAY = [14.3, 13.2];
// A check, not a seed: Mega-Chad's northern pool covered the Bodélé.
const BODELE = [17.5, 16.8];
// 0.02° is about 2.2 km, close to one 60″ cell (1.85 km) and well under one
// pixel when the Sahara spans a 1080 px frame (about 4–5 km per pixel), so
// the simplified line keeps the traced shape.
const TOLERANCE_DEG = 0.02;
// Ground inside the lake that stays above 325 m (inselbergs, dune crests).
// Islands smaller than 100 km², about a 2 × 2 px blot on the frame, are
// filled in; larger ones remain holes.
const MIN_HOLE_KM2 = 100;

const round3 = (x) => Math.round(x * 1000) / 1000;

// Lowest level at which water from the seed can reach each cell (priority
// flood). The first border cell reached tells where, and from what level,
// the basin overflows out of the crop.
function fillLevels(grid, seedIndex) {
  const { width, height, data } = grid;
  const levels = new Float64Array(width * height).fill(Infinity);
  const heap = [];
  const less = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const push = (item) => {
    heap.push(item);
    for (let c = heap.length - 1; c > 0;) {
      const p = (c - 1) >> 1;
      if (!less(heap[c], heap[p])) break;
      [heap[c], heap[p]] = [heap[p], heap[c]];
      c = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let c = 0; ;) {
        const l = 2 * c + 1;
        let m = c;
        if (l < heap.length && less(heap[l], heap[m])) m = l;
        if (l + 1 < heap.length && less(heap[l + 1], heap[m])) m = l + 1;
        if (m === c) break;
        [heap[c], heap[m]] = [heap[m], heap[c]];
        c = m;
      }
    }
    return top;
  };
  levels[seedIndex] = data[seedIndex];
  push([data[seedIndex], seedIndex]);
  let overflow = null;
  while (heap.length) {
    const [level, i] = pop();
    if (level > levels[i]) continue;
    const x = i % width;
    const y = (i - x) / width;
    if (
      !overflow &&
      (x === 0 || y === 0 || x === width - 1 || y === height - 1)
    )
      overflow = level;
    const neighbours = [
      x > 0 && i - 1,
      x < width - 1 && i + 1,
      y > 0 && i - width,
      y < height - 1 && i + width,
    ];
    for (const j of neighbours) {
      if (j === false) continue;
      const next = Math.max(level, data[j]);
      if (next < levels[j]) {
        levels[j] = next;
        push([next, j]);
      }
    }
  }
  return { levels, overflow };
}

// Marching squares over cell centres. `lake[i]` marks the cells kept; every
// other cell is lifted to at least the level, so only the kept basin's
// outline is traced. A saddle keeps diagonal lake cells apart, matching the
// 4-neighbour fill.
export function contourRings(grid, lake, level) {
  const { width, height, data } = grid;
  const value = (x, y) => {
    const i = y * width + x;
    return lake[i] ? data[i] : Math.max(data[i], level);
  };
  const points = new Map();
  const point = (key, ax, ay, bx, by) => {
    if (!points.has(key)) {
      const a = value(ax, ay);
      const b = value(bx, by);
      const t = (level - a) / (b - a);
      points.set(key, [ax + t * (bx - ax), ay + t * (by - ay)]);
    }
    return key;
  };
  const links = new Map();
  const link = (a, b) => {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ]) {
      if (!links.has(from)) links.set(from, []);
      links.get(from).push(to);
    }
  };
  for (let y = 0; y < height - 1; y++)
    for (let x = 0; x < width - 1; x++) {
      const tl = value(x, y) < level;
      const tr = value(x + 1, y) < level;
      const br = value(x + 1, y + 1) < level;
      const bl = value(x, y + 1) < level;
      const T = tl !== tr && point(`h${x},${y}`, x, y, x + 1, y);
      const B = bl !== br && point(`h${x},${y + 1}`, x, y + 1, x + 1, y + 1);
      const L = tl !== bl && point(`v${x},${y}`, x, y, x, y + 1);
      const R = tr !== br && point(`v${x + 1},${y}`, x + 1, y, x + 1, y + 1);
      const edges = [T, R, B, L].filter(Boolean);
      if (edges.length === 2) link(edges[0], edges[1]);
      else if (edges.length === 4) {
        if (tl) {
          link(L, T);
          link(R, B);
        } else {
          link(T, R);
          link(B, L);
        }
      }
    }
  const rings = [];
  const used = new Set();
  for (const start of links.keys()) {
    if (used.has(start)) continue;
    const ring = [start];
    used.add(start);
    for (let previous = null, current = start; ;) {
      const next = links
        .get(current)
        .find((k) => k !== previous && !used.has(k));
      if (next === undefined) break;
      ring.push(next);
      used.add(next);
      previous = current;
      current = next;
    }
    ring.push(start);
    rings.push(ring.map((k) => points.get(k)));
  }
  return rings;
}

// Spherical polygon area, the formula d3-geo and Turf use for small rings.
export function ringAreaKm2(ring) {
  const rad = Math.PI / 180;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [l1, p1] = ring[i];
    const [l2, p2] = ring[i + 1];
    sum += (l2 - l1) * rad * (2 + Math.sin(p1 * rad) + Math.sin(p2 * rad));
  }
  return Math.abs((sum * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

const signedArea = (ring) =>
  ring
    .slice(1)
    .reduce((s, [x2, y2], i) => s + (ring[i][0] * y2 - x2 * ring[i][1]), 0) / 2;

function simplifyPath(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const length = Math.hypot(bx - ax, by - ay);
    let worst = -1;
    let far = 0;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = length
        ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length
        : Math.hypot(px - ax, py - ay);
      if (d > far) {
        far = d;
        worst = i;
      }
    }
    if (worst > 0 && far > tolerance) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// Douglas–Peucker on a closed ring, split at its first vertex and the vertex
// farthest from it so both anchors are real corners of the ring.
export function simplifyRing(ring, tolerance) {
  const [x0, y0] = ring[0];
  let far = 0;
  for (let i = 1; i < ring.length - 1; i++)
    if (
      Math.hypot(ring[i][0] - x0, ring[i][1] - y0) >
      Math.hypot(ring[far][0] - x0, ring[far][1] - y0)
    )
      far = i;
  const first = simplifyPath(ring.slice(0, far + 1), tolerance);
  const second = simplifyPath(ring.slice(far), tolerance);
  return [...first, ...second.slice(1)];
}

function roundRing(ring) {
  const out = [];
  for (const [lon, lat] of ring) {
    const p = [round3(lon), round3(lat)];
    const last = out.at(-1);
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
}

const cellOf = (grid, [lon, lat]) => {
  const x = Math.floor((lon - grid.west) / grid.cell);
  const y = Math.floor((grid.north - lat) / grid.cell);
  return y * grid.width + x;
};

/**
 * The outline of the lake that a water level `level` would hold around
 * `seed`, cut at the basin's spillway. Rings are [lon, lat] at cell-centre
 * precision, outer ring first.
 *
 * Selection: a cell belongs to the lake when water from the seed reaches it
 * without rising to the level. If the basin overflows the grid edge below
 * the level, the fill stops strictly below that spill elevation, so the
 * outline closes across the spillway instead of flowing into the next basin.
 * Every other contour at the same level (other basins, isolated hollows)
 * is ignored.
 */
export function traceShoreline(grid, { level, seed }) {
  const seedIndex = cellOf(grid, seed);
  if (!(grid.data[seedIndex] < level))
    throw new Error(`The seed ${seed} is not below ${level} m`);
  const { levels, overflow } = fillLevels(grid, seedIndex);
  const ceiling = overflow !== null && overflow < level ? overflow : level;
  const lake = levels.map((l) => (l < ceiling ? 1 : 0));
  const { width, height } = grid;
  for (let x = 0; x < width; x++)
    if (lake[x] || lake[(height - 1) * width + x])
      throw new Error("The lake reaches the grid edge; widen the crop");
  for (let y = 0; y < height; y++)
    if (lake[y * width] || lake[y * width + width - 1])
      throw new Error("The lake reaches the grid edge; widen the crop");
  let spill = null;
  if (ceiling === overflow) {
    const i = levels.findIndex(
      (l, j) => l === overflow && grid.data[j] === overflow
    );
    spill = {
      elevation: Math.round(overflow * 100) / 100,
      lon: grid.west + ((i % width) + 0.5) * grid.cell,
      lat: grid.north - (Math.floor(i / width) + 0.5) * grid.cell,
    };
  }
  const toLonLat = ([x, y]) => [
    grid.west + (x + 0.5) * grid.cell,
    grid.north - (y + 0.5) * grid.cell,
  ];
  const rings = contourRings(grid, lake, level)
    .map((ring) => ring.map(toLonLat))
    .sort((a, b) => ringAreaKm2(b) - ringAreaKm2(a));
  let cells = 0;
  let cellAreaKm2 = 0;
  const side = (grid.cell * Math.PI * EARTH_RADIUS_KM) / 180;
  for (let i = 0; i < lake.length; i++)
    if (lake[i]) {
      cells++;
      const lat = grid.north - (Math.floor(i / width) + 0.5) * grid.cell;
      cellAreaKm2 += side * side * Math.cos((lat * Math.PI) / 180);
    }
  return { rings, spill, cells, cellAreaKm2 };
}

/** The traced outline as a GeoJSON Feature with its provenance. */
export function shorelineFeature(grid, options) {
  const {
    level,
    seed,
    check = [],
    tolerance = TOLERANCE_DEG,
    minHoleKm2 = MIN_HOLE_KM2,
    provenance = {},
  } = options;
  const trace = traceShoreline(grid, { level, seed });
  const [outer, ...holes] = trace.rings.map((ring) =>
    roundRing(simplifyRing(ring, tolerance))
  );
  const kept = holes.filter(
    (h) => h.length >= 4 && ringAreaKm2(h) >= minHoleKm2
  );
  // RFC 7946: exterior counter-clockwise, holes clockwise.
  const orient = (ring, ccw) =>
    signedArea(ring) > 0 === ccw ? ring : [...ring].reverse();
  const coordinates = [
    orient(outer, true),
    ...kept.map((h) => orient(h, false)),
  ];
  const area =
    ringAreaKm2(coordinates[0]) - kept.reduce((s, h) => s + ringAreaKm2(h), 0);
  const geometry = { type: "Polygon", coordinates };
  for (const point of check)
    if (!coversPoint(geometry, point))
      throw new Error(`The traced lake does not cover ${point}`);
  return {
    type: "Feature",
    properties: {
      name: "Méga-Tchad",
      kind: "highest palaeoshoreline, elevation contour",
      crs: "EPSG:4326, [longitude, latitude]",
      contour: { level_m: level, uncertainty_m: 5 },
      source: SOURCE,
      dem: DEM,
      selection: {
        rule: "The 325 m contour around the connected low ground that water from present-day Lake Chad reaches without rising to 325 m. Where the basin overflows below that level (the Mayo Kebbi spillway towards the Benue), the fill stops at the spill elevation, so the line closes across the spillway. Every other 325 m line (other basins, isolated hollows) is ignored. The result must cover the Bodélé depression, Mega-Chad's northern pool.",
        seed,
        check,
        spill: trace.spill,
      },
      simplification: {
        method: "Douglas–Peucker on each ring, then rounding to 0.001°",
        tolerance_deg: tolerance,
        min_hole_km2: minHoleKm2,
        holes_traced: holes.length,
        holes_kept: kept.length,
      },
      area_km2: Math.round(area / 100) * 100,
      raster_area_km2: Math.round(trace.cellAreaKm2 / 100) * 100,
      vertices: coordinates.reduce((n, r) => n + r.length - 1, 0),
      script: "social/video/shoreline.mjs",
      ...provenance,
    },
    geometry,
  };
}

function coversPoint(geometry, [x, y]) {
  const inRing = (ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  };
  const [outer, ...holes] = geometry.coordinates;
  return inRing(outer) && !holes.some(inRing);
}

/** Reads the Chad basin crop of the verified ETOPO 2022 tile. */
export async function readChadGrid(assets) {
  const { default: sharp } = await import("sharp");
  const bytes = await readFile(join(assets, DEM.file));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== DEM.sha256)
    throw new Error(`The DEM differs from the verified one: ${DEM.file}`);
  const source = sharp(bytes, { limitInputPixels: false });
  const { width, height } = await source.metadata();
  const cell = 360 / width;
  if (height * cell !== 180)
    throw new Error("Expected a global grid with square cells");
  const crop = {
    left: Math.round((CROP.west + 180) / cell),
    top: Math.round((90 - CROP.north) / cell),
    width: Math.round((CROP.east - CROP.west) / cell),
    height: Math.round((CROP.north - CROP.south) / cell),
  };
  const raw = await source
    .extractChannel(0)
    .extract(crop)
    .raw({ depth: "float" })
    .toBuffer();
  return {
    width: crop.width,
    height: crop.height,
    west: CROP.west,
    north: CROP.north,
    cell,
    data: new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4),
  };
}

// Cartes 1.13.0, the era map's coast (series.md « 5. The era map »): the
// present-day coastline, as the series video's era map engraves it, taken
// from Natural Earth's countries rather than from the imagery's colours.
// Natural Earth's countries share their border vertices exactly, so an edge
// that belongs to one country only is a coast (the complement of
// series-map.mjs's sharedBorders). `land` is every polygon ring touching
// `bounds`, for the sea to be painted around. Edges are joined into lines.
export function coastOf(world, [west, east, south, north]) {
  const inside = ([lon, lat]) =>
    lon >= west && lon <= east && lat >= south && lat <= north;
  const polygons = (g) =>
    g.type === "Polygon"
      ? [g.coordinates]
      : g.type === "MultiPolygon"
        ? g.coordinates
        : [];
  const owners = new Map();
  const point = new Map();
  const land = [];
  const key = (p) => {
    const k = `${p[0]},${p[1]}`;
    point.set(k, p);
    return k;
  };
  for (const f of world.features)
    for (const polygon of polygons(f.geometry))
      for (const ring of polygon) {
        if (!ring.some(inside)) continue;
        land.push(ring);
        for (let i = 0; i + 1 < ring.length; i++) {
          const [a, b] = [key(ring[i]), key(ring[i + 1])];
          if (a === b) continue;
          const edge = a < b ? `${a}|${b}` : `${b}|${a}`;
          owners.set(edge, (owners.get(edge) ?? 0) + 1);
        }
      }
  const next = new Map();
  for (const [edge, n] of owners) {
    if (n !== 1) continue;
    const [a, b] = edge.split("|");
    if (!inside(point.get(a)) && !inside(point.get(b))) continue;
    for (const [p, q] of [
      [a, b],
      [b, a],
    ]) {
      if (!next.has(p)) next.set(p, []);
      next.get(p).push(q);
    }
  }
  const used = new Set();
  const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const lines = [];
  const walk = (start) => {
    for (const first of next.get(start)) {
      if (used.has(edgeKey(start, first))) continue;
      const line = [start];
      let [from, to] = [start, first];
      for (;;) {
        used.add(edgeKey(from, to));
        line.push(to);
        if (next.get(to).length !== 2) break;
        const after = next.get(to).find((n) => n !== from);
        if (used.has(edgeKey(to, after))) break;
        [from, to] = [to, after];
      }
      lines.push(line.map((k) => point.get(k)));
    }
  };
  const nodes = [...next.keys()].sort();
  nodes.filter((n) => next.get(n).length !== 2).forEach(walk);
  nodes.forEach(walk);
  return { lines, land };
}

export const OUTPUT = new URL("./data/megachad-325m.geojson", import.meta.url);

export async function buildMegaChad(assets, generated) {
  const grid = await readChadGrid(assets);
  const feature = shorelineFeature(grid, {
    level: 325,
    seed: LAKE_CHAD_TODAY,
    check: [BODELE],
    provenance: { generated },
  });
  return `${JSON.stringify(feature)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
  if (!assets)
    throw new Error("Set ETHNIAFRICA_VIDEO_ASSETS to the DEM folder");
  const at = process.argv.indexOf("--date");
  const generated =
    at > 0 ? process.argv[at + 1] : new Date().toISOString().slice(0, 10);
  const text = await buildMegaChad(assets, generated);
  await writeFile(OUTPUT, text);
  const { properties } = JSON.parse(text);
  console.log(
    `Wrote ${fileURLToPath(OUTPUT)}: ${properties.area_km2} km², ${properties.vertices} vertices, spill ${JSON.stringify(properties.selection.spill)}`
  );
}
