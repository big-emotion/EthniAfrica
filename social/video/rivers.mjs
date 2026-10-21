// The river paths of the series video's drawn marks (EthniAfrica Cartes
// 1.13.0, series.md « 7. Drawn marks »; handoff « Renderer integration of
// 1.13.0 », step 7): a river named by the voice is drawn from its source to
// its mouth, so each path is one line, ordered that way, built from Natural
// Earth's rivers and lake centerlines (public domain) and committed under
// data/rivers/.
//
//   ETHNIAFRICA_VIDEO_ASSETS=PATH node social/video/rivers.mjs
//
// writes data/rivers/<id>.geojson. The same pinned download gives the same
// bytes.
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { DOWNLOADS, readVerified } from "./areas.mjs";

export const RIVERS_DIR = new URL("./data/rivers/", import.meta.url);

// `match` lists the Natural Earth `name` values whose features make the
// river; `source` and `mouth` are hints, to start the chain and to check it.
// The Red Volta (Nazinon) is not in Natural Earth's 1:10m file, so it is not
// built. Natural Earth names the Volta only below the confluence, inside
// Lake Volta: its Black and White branches are rivers of their own.
export const RIVERS = [
  {
    id: "niger",
    name: "Niger",
    match: ["Niger"],
    source: [-10.7, 9.1],
    // The delta has several mouths; the longest chain ends on the western
    // branch, by Warri.
    mouth: [5.5, 5.14],
  },
  {
    id: "volta-noire",
    name: "Volta Noire",
    match: ["Mouhoun"],
    source: [-5.26, 11.14],
    mouth: [-0.98, 8.66],
  },
  {
    id: "volta-blanche",
    name: "Volta Blanche",
    match: ["Nakanbé"],
    source: [-2.08, 14.01],
    mouth: [-0.97, 8.66],
  },
  {
    id: "volta",
    name: "Volta",
    match: ["Volta"],
    source: [-0.98, 8.66],
    mouth: [0.67, 5.76],
  },
];

// Two segment ends closer than this are one point: Natural Earth's river
// and lake centerline pieces meet a few metres apart (the White Volta's
// river and lake pieces are 0.00004° apart, its lake piece and the Volta's
// 0.002°).
const SNAP_DEG = 0.01;
const TOLERANCE_DEG = 0.02;
const fail = (message) => {
  throw new Error(message);
};

const lines = (geometry) =>
  geometry.type === "LineString"
    ? [geometry.coordinates]
    : geometry.type === "MultiLineString"
      ? geometry.coordinates
      : [];
const dist = ([ax, ay], [bx, by]) => Math.hypot(bx - ax, by - ay);
const lengthOf = (points) =>
  points.reduce((n, p, i) => (i ? n + dist(points[i - 1], p) : 0), 0);

// Douglas–Peucker on an open path, both ends kept.
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

const cite = () => {
  const d = DOWNLOADS.rivers;
  return `${d.name}, version ${d.version}, ${d.url}, SHA-256 ${d.sha256}`;
};

// Natural Earth gives a river as segments in no reliable direction, with
// branches (the inner delta, the mouths of the Niger). The path is the
// longest chain of whole segments, joined end to end, that starts at the
// segment end nearest the source hint: every simple chain is tried, so the
// main stem wins over a side branch.
export function buildRiver(geojson, spec) {
  const segments = geojson.features
    .filter((f) => spec.match.includes(f.properties.name))
    .flatMap((f) => lines(f.geometry))
    .filter((l) => l.length > 1);
  if (!segments.length)
    fail(`No Natural Earth feature named ${spec.match.join(" or ")}`);
  const ends = segments.flatMap((s, i) => [
    { seg: i, at: 0, p: s[0] },
    { seg: i, at: 1, p: s.at(-1) },
  ]);
  const start = ends.reduce((best, e) =>
    dist(e.p, spec.source) < dist(best.p, spec.source) ? e : best
  );
  const lengths = segments.map(lengthOf);
  let best = { length: -1, chain: [] };
  const walk = (point, used, chain, length) => {
    if (length > best.length) best = { length, chain: [...chain] };
    for (const e of ends) {
      if (used.has(e.seg) || dist(e.p, point) > SNAP_DEG) continue;
      const s = segments[e.seg];
      const oriented = e.at === 0 ? s : [...s].reverse();
      used.add(e.seg);
      chain.push(oriented);
      walk(oriented.at(-1), used, chain, length + lengths[e.seg]);
      chain.pop();
      used.delete(e.seg);
    }
  };
  walk(start.p, new Set(), [], 0);
  const joined = best.chain.flatMap((s, i) => (i ? s.slice(1) : s));
  const coordinates = simplifyPath(joined, TOLERANCE_DEG)
    .map(([lon, lat]) => [+lon.toFixed(3), +lat.toFixed(3)])
    .filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  const properties = {
    name: spec.name,
    kind: "river",
    source: cite(),
    citation: `Natural Earth, Rivers + lake centerlines, the features named ${spec.match.map((m) => `« ${m} »`).join(", ")} (rivers and lake centerlines).`,
    derivation: `Built by social/video/rivers.mjs: the features' segments joined end to end (ends closer than ${SNAP_DEG}° are one point) into the longest chain of whole segments starting at the segment end nearest ${spec.source.join(", ")}, so the line runs from source to mouth; simplified by Douglas–Peucker at ${TOLERANCE_DEG}° and rounded to 0.001°.`,
    licence:
      "Geometry: Public domain (Natural Earth terms of use: « All versions of Natural Earth raster + vector map data found on this website are in the public domain »). Credit: Made with Natural Earth.",
    date: "Present day (Natural Earth 5.1.2, 2022)",
  };
  return {
    type: "Feature",
    properties,
    geometry: { type: "LineString", coordinates },
  };
}

// id → the file's text, one JSON line as the area files.
export async function buildRivers(assets) {
  const geojson = await readVerified(assets, "rivers");
  return new Map(
    RIVERS.map((spec) => [
      spec.id,
      `${JSON.stringify(buildRiver(geojson, spec))}\n`,
    ])
  );
}

const PROVENANCE = ["name", "source", "citation", "derivation", "licence"];
export function loadRiver(id) {
  let feature;
  try {
    if (!/^[\w-]+$/u.test(id)) throw new Error("not an id");
    feature = JSON.parse(
      readFileSync(new URL(`${id}.geojson`, RIVERS_DIR), "utf8")
    );
  } catch {
    fail(`Fleuve absent de social/video/data/rivers : ${id}`);
  }
  const p = feature.properties ?? {};
  if (p.kind !== "river" || feature.geometry?.type !== "LineString")
    fail(`River ${id}: not a river LineString`);
  for (const field of PROVENANCE)
    if (typeof p[field] !== "string" || !p[field].trim())
      fail(`River ${id}: no ${field}`);
  return { id, name: p.name, points: feature.geometry.coordinates };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
  if (!assets)
    throw new Error(
      "Set ETHNIAFRICA_VIDEO_ASSETS to the verified assets folder"
    );
  await mkdir(RIVERS_DIR, { recursive: true });
  for (const [id, text] of await buildRivers(assets)) {
    await writeFile(new URL(`${id}.geojson`, RIVERS_DIR), text);
    const { coordinates } = JSON.parse(text).geometry;
    console.log(
      `${id}: ${coordinates.length} vertices, from ${coordinates[0]} to ${coordinates.at(-1)}`
    );
  }
}
