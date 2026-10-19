// Builds the approximate areas of the Sahara map video (design 0.4.0) from
// pinned Natural Earth downloads and one corpus fiche.
//
// Design 0.4.0 draws each of these as a hatched area with a dashed edge,
// legend « Zone approximative ». The operator accepts reconstructions, but
// every area needs a documented source and a rule anyone can rerun. The
// designer's hand-drawn placeholder (sahara-areas-mock.json) is never an
// input.
//
//   ETHNIAFRICA_VIDEO_ASSETS=PATH node social/video/areas.mjs
//
// writes social/video/data/areas/<id>.geojson. Same downloads give the same
// bytes: the files carry no generation date.
//
// Why a raster: every area is a boolean combination of source polygons
// (Sahara minus east of the Nile, Africa minus part of Egypt, the land north
// of the Sahara). Painting the sources on one 0.05° grid makes those
// combinations exact cell operations with no clipping library, and the
// outline is traced back with the Mega-Chad contour tracer. 0.05° is about
// 5.5 km, under one pixel when Africa fills a 1080 px frame (about 8 km per
// pixel).
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { contourRings, ringAreaKm2, simplifyRing } from "./shoreline.mjs";

const NATURAL_EARTH_LICENCE =
  "Public domain (Natural Earth terms of use: « All versions of Natural Earth raster + vector map data found on this website are in the public domain »). Credit: Made with Natural Earth.";

export const DOWNLOADS = {
  ecoregions: {
    name: "Ecoregions 2017 (RESOLVE), shapefile",
    version: "2017, archive of 7 May 2019",
    file: "areas/Ecoregions2017.zip",
    url: "https://storage.googleapis.com/teow2016/Ecoregions2017.zip",
    sha256: "be36d6209e443038d02e309f0447c6e7f2a62f5fe60c605ffe90d064952f2a60",
  },
  regions: {
    name: "Natural Earth 1:10m Physical Vectors, Geography Regions (polygons)",
    version: "5.1.2",
    file: "areas/ne_10m_geography_regions_polys.geojson",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_geography_regions_polys.geojson",
    sha256: "b7b26e50ea917d3696aec87f932def2bf5f890f5770e441d59c162c6f4c92a77",
  },
  countries: {
    name: "Natural Earth 1:50m Cultural Vectors, Admin 0 Countries",
    version: "5.1.2",
    file: "areas/ne_50m_admin_0_countries.geojson",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson",
    sha256: "3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb",
  },
  places: {
    name: "Natural Earth 1:10m Cultural Vectors, Populated Places (simple)",
    version: "5.1.2",
    file: "areas/ne_10m_populated_places_simple.geojson",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_populated_places_simple.geojson",
    sha256: "fd3fa867a320cbd5c5b6bb5bc550afeec2939fb2cef688e508007282a55ac42f",
  },
  // The same file the river layer already uses (video-assets SOURCES.md);
  // the v5.1.2 tag serves identical bytes.
  rivers: {
    name: "Natural Earth 1:10m Physical Vectors, Rivers + lake centerlines",
    version: "5.1.2",
    file: "geometry/ne_10m_rivers_lake_centerlines.geojson",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_rivers_lake_centerlines.geojson",
    sha256: "bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a",
  },
  // Glottolog 5.3 (tag v5.3 of glottolog-cldf, DOI 10.5281/zenodo.18840967),
  // CC BY 4.0. The tag's metadata title still reads 5.2.1; the tag and DOI
  // are 5.3. Language points for the present-day Amazigh area (Cartes 1.5.0).
  glottologLanguages: {
    name: "Glottolog 5.3, CLDF languages",
    version: "5.3",
    file: "areas/glottolog-5.3-languages.csv",
    url: "https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.3/cldf/languages.csv",
    sha256: "1a50a393bc81568b656f9522be18aa4f80f38e94309ba6c863d583234adfbb89",
  },
  glottologValues: {
    name: "Glottolog 5.3, CLDF values (classification, endangerment)",
    version: "5.3",
    file: "areas/glottolog-5.3-values.csv",
    url: "https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.3/cldf/values.csv",
    sha256: "a8601cb04ccc6a310538217f772d2461853aa0ea49e3bfe24c7396570fc4ea25",
  },
};

const cite = (key) => {
  const d = DOWNLOADS[key];
  return `${d.name}, version ${d.version}, ${d.url}, SHA-256 ${d.sha256}`;
};

// Covers Africa with a margin, so no area touches the grid edge and every
// traced ring closes.
export const GRID = {
  west: -20,
  north: 40,
  cell: 0.05,
  width: 1500,
  height: 1540,
};
// Douglas–Peucker at one grid cell, then rounding to 0.01°.
const TOLERANCE_DEG = 0.05;
// Parts and holes under 5,000 km² (about 9 × 9 px when Africa fills 1080 px)
// are left out: oases, inselbergs and slivers of coast.
const MIN_PART_KM2 = 5000;
// Radius around each Tuareg anchor place: about 110 km, one degree of
// latitude, so an anchor stands for its surroundings, not for a dot.
const ANCHOR_RADIUS_DEG = 1;

export const OUTPUT_DIR = new URL("./data/areas/", import.meta.url);

const SCRIPT_RULE = "Built by social/video/areas.mjs";
const RASTER_RULE = `on a ${GRID.cell}° grid (cells whose centre falls inside), traced back as the cell boundary, simplified by Douglas–Peucker at ${TOLERANCE_DEG}° and rounded to 0.01°; parts and holes under ${MIN_PART_KM2} km² dropped`;

// Even–odd scanline fill at cell centres. Each polygon fills its own rings
// even–odd (holes stay empty); polygons are then merged.
export function rasterize(grid, geometry) {
  const { west, north, cell, width, height } = grid;
  const mask = new Uint8Array(width * height);
  const parts =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const rings of parts) {
    // Each edge is filed under the rows whose centre latitude it crosses,
    // so a ring of many thousand vertices costs one pass, not one per row.
    const rows = new Map();
    for (const ring of rings)
      for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[i + 1];
        if (y1 === y2) continue;
        const first = Math.max(
          0,
          Math.floor((north - Math.max(y1, y2)) / cell - 0.5)
        );
        const last = Math.min(
          height - 1,
          Math.ceil((north - Math.min(y1, y2)) / cell - 0.5)
        );
        for (let y = first; y <= last; y++) {
          const lat = north - (y + 0.5) * cell;
          if (y1 > lat === y2 > lat) continue;
          if (!rows.has(y)) rows.set(y, []);
          rows.get(y).push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
    for (const [y, crossings] of rows) {
      crossings.sort((a, b) => a - b);
      for (let k = 0; k + 1 < crossings.length; k += 2) {
        const from = Math.max(0, Math.ceil((crossings[k] - west) / cell - 0.5));
        const to = Math.min(
          width - 1,
          Math.floor((crossings[k + 1] - west) / cell - 0.5)
        );
        for (let x = from; x <= to; x++) mask[y * width + x] = 1;
      }
    }
  }
  return mask;
}

const signedArea = (ring) =>
  ring
    .slice(1)
    .reduce((s, [x2, y2], i) => s + (ring[i][0] * y2 - x2 * ring[i][1]), 0) / 2;

function insideRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

const round2 = (x) => Math.round(x * 100) / 100;

function roundRing(ring) {
  const out = [];
  for (const [lon, lat] of ring) {
    const p = [round2(lon), round2(lat)];
    const last = out.at(-1);
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
}

/**
 * The outline of the cells set in `mask`, as GeoJSON. Rings are nested by
 * containment on the unsimplified trace (contours of one mask never cross),
 * so a ring inside an odd number of others is a hole of the smallest ring
 * holding it.
 */
export function traceMask(grid, mask, options = {}) {
  const {
    tolerance = TOLERANCE_DEG,
    minPartKm2 = MIN_PART_KM2,
    maxParts = Infinity,
    exteriorOnly = false,
  } = options;
  const { west, north, cell, width, height } = grid;
  const data = new Float32Array(width * height);
  for (let i = 0; i < data.length; i++) data[i] = mask[i] ? 0 : 1;
  const all = new Uint8Array(width * height).fill(1);
  const traced = contourRings({ width, height, data }, all, 0.5).map((ring) =>
    ring.map(([x, y]) => [west + (x + 0.5) * cell, north - (y + 0.5) * cell])
  );
  const areas = traced.map(ringAreaKm2);
  const parents = traced.map((ring, i) => {
    let parent = -1;
    traced.forEach((other, j) => {
      if (j === i || areas[j] <= areas[i]) return;
      if (!insideRing(ring[0], other)) return;
      if (parent === -1 || areas[j] < areas[parent]) parent = j;
    });
    return parent;
  });
  const depth = (i) => (parents[i] === -1 ? 0 : 1 + depth(parents[i]));
  const orient = (ring, ccw) =>
    signedArea(ring) > 0 === ccw ? ring : [...ring].reverse();
  const finish = (i, ccw) =>
    orient(roundRing(simplifyRing(traced[i], tolerance)), ccw);
  const polygons = traced
    .map((_, i) => i)
    .filter((i) => depth(i) % 2 === 0 && areas[i] >= minPartKm2)
    .sort((a, b) => areas[b] - areas[a])
    .slice(0, maxParts)
    .map((i) => {
      const holes = traced
        .map((_, j) => j)
        .filter(
          (j) => !exteriorOnly && parents[j] === i && areas[j] >= minPartKm2
        )
        .sort((a, b) => areas[b] - areas[a]);
      // RFC 7946: exterior counter-clockwise, holes clockwise.
      return [finish(i, true), ...holes.map((j) => finish(j, false))].filter(
        (ring) => ring.length >= 4
      );
    });
  return polygons.length === 1
    ? { type: "Polygon", coordinates: polygons[0] }
    : { type: "MultiPolygon", coordinates: polygons };
}

const and = (...masks) =>
  masks[0].map((v, i) => (masks.every((m) => m[i]) ? 1 : 0));
const not = (mask) => mask.map((v) => (v ? 0 : 1));

function maskWhere(grid, keep) {
  const { west, north, cell, width, height } = grid;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (keep(west + (x + 0.5) * cell, north - (y + 0.5) * cell))
        mask[y * width + x] = 1;
  return mask;
}

// For each row, the westernmost longitude where the Nile (or its White Nile
// course) crosses the row's latitude. North of the river's last vertex, the
// delta apex near Cairo, the apex longitude is used; where no reach crosses
// a row south of the delta, the row has no Nile and nothing is cut.
function nileLongitudeByRow(grid, nile) {
  const lines = nile.flatMap((f) =>
    f.geometry.type === "LineString"
      ? [f.geometry.coordinates]
      : f.geometry.coordinates
  );
  const apex = lines.flat().reduce((a, p) => (p[1] > a[1] ? p : a));
  return Array.from({ length: grid.height }, (_, y) => {
    const lat = grid.north - (y + 0.5) * grid.cell;
    if (lat >= apex[1]) return apex[0];
    let west = Infinity;
    for (const line of lines)
      for (let i = 0; i < line.length - 1; i++) {
        const [x1, y1] = line[i];
        const [x2, y2] = line[i + 1];
        if (y1 > lat !== y2 > lat)
          west = Math.min(west, x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
      }
    return west;
  });
}

function westOf(grid, lonByRow) {
  const mask = new Uint8Array(grid.width * grid.height);
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++)
      if (grid.west + (x + 0.5) * grid.cell < lonByRow[y])
        mask[y * grid.width + x] = 1;
  return mask;
}

// Cells north of the northernmost cell of `mask` in their column; columns
// where `mask` is empty give nothing.
function northOf(grid, mask) {
  const out = new Uint8Array(grid.width * grid.height);
  for (let x = 0; x < grid.width; x++) {
    let top = -1;
    for (let y = 0; y < grid.height && top < 0; y++)
      if (mask[y * grid.width + x]) top = y;
    for (let y = 0; y < top; y++) out[y * grid.width + x] = 1;
  }
  return out;
}

function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out.at(-2), out.at(-1), p) <= 0)
        out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  const ring = [...half(sorted), ...half([...sorted].reverse())];
  return [...ring, ring[0]];
}

// A 32-point circle of `radius` degrees of latitude, widened in longitude
// so it stays round on the ground.
function circle([lon, lat], radius) {
  const scale = 1 / Math.cos((lat * Math.PI) / 180);
  return Array.from({ length: 32 }, (_, k) => {
    const a = (2 * Math.PI * k) / 32;
    return [lon + radius * scale * Math.cos(a), lat + radius * Math.sin(a)];
  });
}

// Tuareg anchors, each taken from PPL_TUAREG (historicalRegion,
// historicalSettlementZones, ethnicities) and found in Natural Earth: a
// region polygon where Natural Earth has one, else the nearest listed town.
export const TUAREG_ANCHORS = {
  regions: [
    ["AHAGGAR MTS.", "Monts Hoggar / Ahaggar (Kel Ahaggar)"],
    ["Tassili-n-Ajjer", "Ajjer (Kel Ajjer)"],
    ["AÏR MTS.", "Massif de l'Aïr (Kel Ayr, Kel Owey)"],
  ],
  places: [
    ["Tamanrasset", "DZA", "Kel Ahaggar, centre à Tamanrasset"],
    ["Djanet", "DZA", "Ajjer, Algerian side"],
    ["Ghat", "LBY", "Kel Ajjer, oasis de Ghat (Fezzan et Ajjer)"],
    [
      "Tessalit",
      "MLI",
      "Adrar des Ifoghas (Kel Adagh); Kidal is not in Natural Earth",
    ],
    ["Timbuktu", "MLI", "Kel Adagh, régions de Kidal et Tombouctou"],
    ["Gorom Gorom", "BFA", "Nord du Burkina Faso (Oudalan)"],
    [
      "Tahoua",
      "NER",
      "Azawagh, Iwillimmidan Kel Denneg (Tchin-Tabaraden lies in Tahoua region; it is not in Natural Earth)",
    ],
    ["Agadez", "NER", "Kel Ayr, Agadez"],
    ["Zinder", "NER", "Kel Gres, région de Zinder et Tanut"],
  ],
};

export async function readVerified(assets, key) {
  const download = DOWNLOADS[key];
  const bytes = await readFile(join(assets, download.file));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== download.sha256)
    throw new Error(`${download.file} differs from the pinned download`);
  if (download.file.endsWith(".zip")) return bytes;
  if (download.file.endsWith(".csv")) return bytes.toString("utf8");
  return JSON.parse(bytes.toString("utf8"));
}

// RFC 4180 rows: quoted fields may hold commas, doubled quotes and newlines.
function csvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') ((field += '"'), i++);
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(field), (field = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      (row.push(field), rows.push(row), (row = []), (field = ""));
    } else field += c;
  }
  if (field || row.length) (row.push(field), rows.push(row));
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, k) => [h, r[k]])));
}

/**
 * Glottolog's living Berber languages with a point: level « language »,
 * classified under berb1260, not marked extinct (aes-extinct). A point is a
 * language's centre as Glottolog gives it, not the area where it is spoken.
 */
export function berberLanguagePoints(languagesCsv, valuesCsv) {
  const berber = new Set();
  const extinct = new Set();
  for (const v of csvRows(valuesCsv)) {
    if (
      v.Parameter_ID === "classification" &&
      v.Value.split("/").includes("berb1260")
    )
      berber.add(v.Language_ID);
    if (v.Parameter_ID === "aes" && v.Code_ID === "aes-extinct")
      extinct.add(v.Language_ID);
  }
  return csvRows(languagesCsv)
    .filter(
      (l) =>
        l.Level === "language" &&
        berber.has(l.ID) &&
        !extinct.has(l.ID) &&
        l.Latitude !== "" &&
        l.Longitude !== ""
    )
    .map((l) => ({
      glottocode: l.Glottocode,
      name: l.Name,
      point: [Number(l.Longitude), Number(l.Latitude)],
    }));
}

// One member of a zip archive, read through its central directory. The
// Ecoregions archive is plain deflate without zip64, which is all this
// handles; anything else fails loudly.
function zipMember(zip, name) {
  let end = zip.length - 22;
  while (end >= 0 && zip.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("Not a zip archive");
  let entry = zip.readUInt32LE(end + 16);
  for (let k = zip.readUInt16LE(end + 10); k > 0; k--) {
    const method = zip.readUInt16LE(entry + 10);
    const compressed = zip.readUInt32LE(entry + 20);
    const nameLength = zip.readUInt16LE(entry + 28);
    const skip =
      nameLength + zip.readUInt16LE(entry + 30) + zip.readUInt16LE(entry + 32);
    if (zip.toString("utf8", entry + 46, entry + 46 + nameLength) === name) {
      const local = zip.readUInt32LE(entry + 42);
      const start =
        local +
        30 +
        zip.readUInt16LE(local + 26) +
        zip.readUInt16LE(local + 28);
      const raw = zip.subarray(start, start + compressed);
      if (method === 0) return raw;
      if (method === 8) return inflateRawSync(raw);
      throw new Error(`${name}: unsupported zip method ${method}`);
    }
    entry += 46 + skip;
  }
  throw new Error(`${name} is not in the archive`);
}

// The polygons of the named ecoregions, read from the shapefile and its
// attribute table (record n of the .shp is row n of the .dbf). Each record
// becomes one GeoJSON Polygon holding all its rings, which the even–odd
// fill of rasterize() reads correctly whatever their winding.
function ecoregionPolygons(zip, names) {
  const dbf = zipMember(zip, "Ecoregions2017.dbf");
  const shp = zipMember(zip, "Ecoregions2017.shp");
  const records = dbf.readUInt32LE(4);
  const headerLength = dbf.readUInt16LE(8);
  const recordLength = dbf.readUInt16LE(10);
  let nameField = null;
  for (let o = 32, at = 1; dbf[o] !== 0x0d; o += 32) {
    const field = dbf.toString("latin1", o, o + 11).replace(/\0.*$/, "");
    if (field === "ECO_NAME") nameField = { at, length: dbf[o + 16] };
    at += dbf[o + 16];
  }
  const nameOf = (row) => {
    const o = headerLength + row * recordLength + nameField.at;
    return dbf.toString("utf8", o, o + nameField.length).trim();
  };
  const found = new Map(names.map((n) => [n, []]));
  for (let o = 100, row = 0; o < shp.length && row < records; row++) {
    const length = shp.readInt32BE(o + 4) * 2;
    const content = o + 8;
    o = content + length;
    const name = nameOf(row);
    if (!found.has(name) || shp.readInt32LE(content) !== 5) continue;
    const parts = shp.readInt32LE(content + 36);
    const points = shp.readInt32LE(content + 40);
    const starts = Array.from({ length: parts }, (_, k) =>
      shp.readInt32LE(content + 44 + 4 * k)
    );
    const xy = content + 44 + 4 * parts;
    const rings = starts.map((first, k) =>
      Array.from({ length: (starts[k + 1] ?? points) - first }, (_, i) => [
        shp.readDoubleLE(xy + 16 * (first + i)),
        shp.readDoubleLE(xy + 16 * (first + i) + 8),
      ])
    );
    found.get(name).push({ type: "Polygon", coordinates: rings });
  }
  for (const [name, list] of found)
    if (!list.length) throw new Error(`No ecoregion named ${name}`);
  return found;
}

function only(features, test, what) {
  const found = features.filter(test);
  if (found.length !== 1)
    throw new Error(`Expected one ${what}, found ${found.length}`);
  return found[0];
}

// Cartes 1.11.0: the areas of the Burkina Faso episode (series 1, episode
// 19). Its research drew the historical areas by hand around the places its
// texts name, with no georeferenced map (map-data/README.md of the
// production): they are approximate, hatched, and say so. The research files
// are pinned here like the downloads; the country itself comes from Natural
// Earth, so its border is the same line wherever it is drawn.
const EPISODE_DIR = "areas/bfa-2026-10-19";
const fail = (message) => {
  throw new Error(message);
};
export const EPISODE_SOURCES = {
  mossi: {
    file: "scene7-mossi.geojson",
    sha256: "90889ebf578a2a7664b9cf1813a8b84080ef0828145cab438651b83eb0c9d931",
  },
  manden: {
    file: "scene8-manden.geojson",
    sha256: "44edf98a04a80085e80b14a9b551fdf752579b5ea3db040b22fa8d278ffc0255",
  },
  peuls: {
    file: "scene9-peuls.geojson",
    sha256: "14b7eb8eb55ff6d6d530d235073ece49f9f98aace810bbbfa9e954b6efcd0c14",
  },
  songhay: {
    file: "scene10-songhay.geojson",
    sha256: "e6a42b2a024de22a209ce5b2da054a00fb9d248860b6dc166708e0794de352dd",
  },
  aof: {
    file: "scene15-aof.geojson",
    sha256: "47f9a0e022e9b901450611d0de12318edd95281e2101fccef0c61f40396e85b5",
  },
  partition: {
    file: "scene16-partition-1932.geojson",
    sha256: "91e6e3722a705f5210f16582cd47b929242628ba65fae2e015733aaab3405298",
  },
  // The episode's carousel cards, for the language areas of the card bfa-03.
  cards: {
    file: "cards.json",
    sha256: "9550399d4b8758e9512850ba4a67b75f01d27ad176041907621c10c9746d5443",
  },
};
const EPISODE_RESEARCH =
  "EthniAfrica, Burkina Faso episode (series 1, episode 19), map research of 19 October 2026";
const EPISODE_LICENCE =
  "Geometry: EthniAfrica, CC BY-SA 4.0 (drawn by the episode's research from the cited texts).";
const citeEpisode = (key) =>
  `${EPISODE_RESEARCH}, ${EPISODE_SOURCES[key].file}, SHA-256 ${EPISODE_SOURCES[key].sha256}`;

async function readEpisode(assets, key) {
  const { file, sha256 } = EPISODE_SOURCES[key];
  const bytes = await readFile(join(assets, EPISODE_DIR, file));
  if (createHash("sha256").update(bytes).digest("hex") !== sha256)
    throw new Error(
      `${EPISODE_DIR}/${file} differs from the pinned research file`
    );
  return JSON.parse(bytes.toString("utf8"));
}

// The research's `source` object as one line of text.
const researchCitation = (source) =>
  [source.author, source.title, source.year, source.page_or_map, source.url]
    .filter(Boolean)
    .join(", ");

// A polygon as drawn, each ring rounded to 0.01° and closed.
function passThrough(geometry) {
  const close = (ring) => {
    const r = roundRing(ring);
    const [a, b] = [r[0], r.at(-1)];
    return a[0] === b[0] && a[1] === b[1] ? r : [...r, a];
  };
  return geometry.type === "Polygon"
    ? { type: "Polygon", coordinates: geometry.coordinates.map(close) }
    : {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((p) => p.map(close)),
      };
}

// A card path of afrique-ouest.json (equirectangular, 19 px a degree, origin
// 19° W 30° N) in longitude and latitude, each cubic segment sampled 8 times.
const AFRIQUE_OUEST = { k: 19, lon0: -19, lat0: 30 };
function cardPathRing(d, { k, lon0, lat0 }) {
  if ((d.match(/[A-Za-z]/g) ?? []).some((c) => !"MCZ".includes(c)))
    throw new Error("A language ellipse uses the commands M, C and Z only");
  const numbers = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const points = [[numbers[0], numbers[1]]];
  for (let i = 2; i + 5 < numbers.length; i += 6) {
    const p0 = points.at(-1);
    const [x1, y1, x2, y2, x3, y3] = numbers.slice(i, i + 6);
    for (let s = 1; s <= 8; s++) {
      const t = s / 8;
      const u = 1 - t;
      const at = (a, b, c, e) =>
        u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * e;
      points.push([at(p0[0], x1, x2, x3), at(p0[1], y1, y2, y3)]);
    }
  }
  return points.map(([x, y]) => [lon0 + x / k, lat0 - y / k]);
}

// What each episode area is drawn from: `from` is the research file and
// feature id; `rule` says how: as drawn (the default), kept inside the
// country, the country itself (Natural Earth), or a language ellipse of
// the card bfa-03.
const EPISODE_AREAS = {
  "bfa-burkina-faso": {
    rule: "country",
    name: "Burkina Faso",
    category: "country",
    date: "Since 4 August 1984, in the borders of 1947",
  },
  "bfa-haute-volta": {
    rule: "country",
    name: "Haute-Volta",
    category: "historical-name",
    from: ["aof", "haute-volta-1919"],
    date: "1919 to 1932, then 1947 to 1984",
  },
  "bfa-cercle-de-say": {
    from: ["aof", "cercle-de-say"],
    rule: "traced",
    category: "historical-name",
  },
  "bfa-hv32-cote-divoire": {
    from: ["partition", "hv32-cote-divoire"],
    rule: "inside-country",
    category: "historical-name",
  },
  "bfa-hv32-soudan": {
    from: ["partition", "hv32-soudan"],
    rule: "inside-country",
    category: "historical-name",
  },
  "bfa-hv32-niger": {
    from: ["partition", "hv32-niger"],
    rule: "inside-country",
    category: "historical-name",
  },
  "bfa-mamprugu": { from: ["mossi", "mamprugu"], category: "people" },
  "bfa-mossi-yatenga": { from: ["mossi", "mossi-yatenga"], category: "people" },
  "bfa-mossi-ouagadougou": {
    from: ["mossi", "mossi-ouagadougou"],
    category: "people",
  },
  "bfa-mossi-tenkodogo": {
    from: ["mossi", "mossi-tenkodogo"],
    category: "people",
  },
  "bfa-manden": { from: ["manden", "manden-noyau"], category: "people" },
  "bfa-macina": { from: ["peuls", "macina"], category: "region" },
  "bfa-liptako": { from: ["peuls", "liptako"], category: "people" },
  "bfa-jelgooji": { from: ["peuls", "jelgooji"], category: "people" },
  "bfa-songhay": { from: ["songhay", "songhay-noyau"], category: "people" },
  "bfa-aof-senegal": { from: ["aof", "senegal"], category: "historical-name" },
  "bfa-aof-mauritanie": {
    from: ["aof", "mauritanie"],
    category: "historical-name",
  },
  "bfa-aof-hodh": { from: ["aof", "hodh"], category: "historical-name" },
  "bfa-aof-soudan-francais": {
    from: ["aof", "soudan-francais"],
    category: "historical-name",
  },
  "bfa-aof-guinee": { from: ["aof", "guinee"], category: "historical-name" },
  "bfa-aof-cote-divoire": {
    from: ["aof", "cote-divoire"],
    category: "historical-name",
  },
  "bfa-aof-dahomey": { from: ["aof", "dahomey"], category: "historical-name" },
  "bfa-aof-niger": { from: ["aof", "niger"], category: "historical-name" },
  "bfa-langue-moore": {
    rule: "language",
    label: "mooré (Moose)",
    name: "mooré",
  },
  "bfa-langue-jula": { rule: "language", label: "jula (Dioula)", name: "jula" },
  "bfa-langue-fulfulde": {
    rule: "language",
    label: "fulfulde (Fulɓe)",
    name: "fulfulde",
  },
};

function languageArea(def, card) {
  const area =
    card.map.areas.find((a) => a.label === def.label) ??
    fail(`No ${def.label} on the card bfa-03`);
  const { caption } = card.map;
  return {
    geometry: passThrough({
      type: "Polygon",
      coordinates: [cardPathRing(area.paths[0], AFRIQUE_OUEST)],
    }),
    properties: {
      kind: "approximate",
      name: def.name,
      category: "language",
      source: `M. Bougma, AIDELF, 2014, after the censuses of 1985 to 2006; ${citeEpisode("cards")}`,
      citation: `${caption.source}: ${caption.what} (${caption.when}). Provenance of the card bfa-03: ${card.provenance}`,
      derivation: `${SCRIPT_RULE}: the ellipse « ${def.label} » of the card bfa-03, in the card units of afrique-ouest.json (equirectangular, 19 px a degree, origin 19° W 30° N), each cubic segment sampled 8 times and rounded to 0.01°. The research drew it from the extent of the regions the source names; it marks where the language is most spoken, not a limit.`,
      licence: EPISODE_LICENCE,
      date: "Censuses of 1985 to 2006",
    },
  };
}

function countryArea(def, country, research) {
  const p = def.from && research(def.from).properties;
  return {
    geometry: passThrough(country.geometry),
    properties: {
      kind: "certain",
      name: def.name,
      category: def.category,
      source: `${cite("countries")}${p ? `; ${researchCitation(p.source)}; ${citeEpisode(def.from[0])}` : ""}`,
      citation: p
        ? `${researchCitation(p.source)}. ${p.note}`
        : "Natural Earth, Admin 0 Countries, feature BFA (Burkina Faso).",
      derivation: `${SCRIPT_RULE}: the Natural Earth 1:50m polygon of Burkina Faso (ADM0_A3 BFA), rounded to 0.01°.${p ? " The research takes today's border for the colony: the 1947 law restored the limits of 5 September 1932, which the present state keeps; the cercle de Say, in Haute-Volta until 1927, is the separate area bfa-cercle-de-say." : ""}`,
      licence: `Geometry: ${NATURAL_EARTH_LICENCE}`,
      date: def.date,
    },
  };
}

function researchArea(def, f, countryMask) {
  const p = f.properties;
  const inside = def.rule === "inside-country";
  const traced = def.rule === "traced";
  const how = inside
    ? `, kept inside the Natural Earth polygon of Burkina Faso so its outer edge is the country's; ${RASTER_RULE}`
    : traced
      ? `, painted on the grid and traced back, which removes the small loop its last edges make across its first; ${RASTER_RULE}`
      : ", as drawn, rounded to 0.01°";
  return {
    geometry: inside
      ? traceMask(GRID, and(rasterize(GRID, f.geometry), countryMask), {
          maxParts: 1,
        })
      : traced
        ? traceMask(GRID, rasterize(GRID, f.geometry), { maxParts: 1 })
        : passThrough(f.geometry),
    properties: {
      kind: p.certainty === "certain" ? "certain" : "approximate",
      name: p.label,
      category: def.category,
      source: `${researchCitation(p.source)}; ${citeEpisode(def.from[0])}${inside ? `; ${cite("countries")}` : ""}`,
      citation: researchCitation(p.source),
      derivation: `${SCRIPT_RULE}: the research's polygon « ${p.id} » (${p.note.replace(/\s*\.$/u, "")})${how}.${p.part_of ? ` Part of « ${p.part_of} » in the research.` : ""}`,
      licence: inside
        ? `${EPISODE_LICENCE} Outer edge: ${NATURAL_EARTH_LICENCE}`
        : p.certainty === "certain"
          ? `${EPISODE_LICENCE} The research simplified Natural Earth's border (public domain).`
          : EPISODE_LICENCE,
      date: p.date,
    },
  };
}

/** The episode's areas as the exact text of their GeoJSON files. */
async function buildEpisodeAreas(assets, countries) {
  const files = {};
  for (const key of Object.keys(EPISODE_SOURCES))
    files[key] = await readEpisode(assets, key);
  const research = ([key, id]) =>
    only(files[key].features, (f) => f.properties.id === id, `${key} ${id}`);
  const country = only(
    countries.features,
    (f) => f.properties.ADM0_A3 === "BFA",
    "country BFA"
  );
  const countryMask = rasterize(GRID, country.geometry);
  const languages =
    files.cards.cards.find((c) => c.id === "bfa-03") ??
    fail("No card bfa-03 in the pinned cards");
  const built = new Map();
  for (const [id, def] of Object.entries(EPISODE_AREAS)) {
    const { properties, geometry } =
      def.rule === "language"
        ? languageArea(def, languages)
        : def.rule === "country"
          ? countryArea(def, country, research)
          : researchArea(def, research(def.from), countryMask);
    built.set(
      id,
      `${JSON.stringify({ type: "Feature", properties, geometry })}\n`
    );
  }
  return built;
}

export const AREA_IDS = [
  "sahara",
  "desert",
  "berberes",
  "noirs",
  "libye",
  "touaregs",
  "libyque",
  "touareg-imuhagh",
  "touareg-imajeghen",
  "touareg-imushagh",
  "amazigh",
  // Series 1, episode 19, Burkina Faso (Cartes 1.11.0).
  ...Object.keys(EPISODE_AREAS),
];

const GLOTTOLOG_CITATION =
  "Hammarström, Harald, Robert Forkel, Martin Haspelmath and Sebastian Bank. 2026. Glottolog 5.3. Leipzig: Max Planck Institute for Evolutionary Anthropology. DOI 10.5281/zenodo.18840967.";
const GLOTTOLOG_LICENCE =
  "Glottolog 5.3, CC BY 4.0 (dc:license of the CLDF metadata): credit Hammarström et al. 2026.";
const CHAKER_CITATION =
  "Salem Chaker, « Amaziɣ (le/un Berbère) », Encyclopédie berbère, IV, 1986, p. 562-568, § 6: Amāheγ/Imūhaγ in the Ahaggar and the Ajjer, Amājeγ/Imājeγen in the Aïr and the south (Niger-Mali), Amāšeγ/Imūšaγ in the Adrar des Ifoghas.";

const ECOREGIONS_CITATION =
  "Dinerstein, E., Olson, D., Joshi, A., et al. (2017). An Ecoregion-Based Approach to Protecting Half the Terrestrial Realm. BioScience 67 (6), 534–545. DOI 10.1093/biosci/bix014.";
const ECOREGIONS_LICENCE =
  "Ecoregions 2017 © Resolve, CC BY 4.0 (LICENSE field of every record): credit Dinerstein et al. 2017.";
const IDRISI_CITATION =
  "al-Idrīsī, Nuzhat al-mushtāq fī ikhtirāq al-āfāq (1154), first climate, second section, on Ghana, in R. Dozy and M. J. de Goeje (eds., trans.), Description de l'Afrique et de l'Espagne par Edrîsî, Leiden, Brill, 1866, French translation p. 9: « Le pays de Ghana touche […] au nord au grand désert (Sahara) qui sépare le Soudan du pays des Berbers ». The gloss « (Sahara) » is the translators'.";
const IDRISI_LIMITS =
  "This is EthniAfrica's reconstruction of a medieval description, not a border: al-Idrīsī drew no line between these lands.";
const idrisiLicence = (geometry) =>
  `Geometry: ${geometry} Text: the 1866 edition is in the public domain.`;

// The Sahara as Ecoregions 2017 divides it: every ecoregion named after the
// Sahara, plus the Tibesti and Jebel Uweinat massifs that sit inside it.
export const SAHARA_ECOREGIONS = [
  "Saharan Atlantic coastal desert",
  "North Saharan Xeric Steppe and Woodland",
  "West Sahara desert",
  "East Sahara Desert",
  "South Sahara desert",
  "West Saharan montane xeric woodlands",
  "East Saharan montane xeric woodlands",
  "Tibesti-Jebel Uweinat montane xeric woodlands",
  "Saharan halophytics",
];
// The Sahel belt: its savanna and the two flooded savannas it encloses (the
// Inner Niger Delta and Lake Chad), which would otherwise be holes in it.
export const SAHEL_ECOREGIONS = [
  "Sahelian Acacia savanna",
  "Inner Niger Delta flooded savanna",
  "Lake Chad flooded savanna",
];

function definitions(sources) {
  const {
    ecoregions,
    regions,
    countries,
    places,
    rivers,
    glottologLanguages,
    glottologValues,
  } = sources;
  const amazighPoints = berberLanguagePoints(
    glottologLanguages,
    glottologValues
  );
  const closedCircle = (point) => {
    const ring = circle(point, ANCHOR_RADIUS_DEG);
    return [...ring, ring[0]];
  };
  const region = (name) =>
    only(
      regions.features,
      (f) => f.properties.NAME === name && f.properties.REGION === "Africa",
      `region ${name}`
    ).geometry;
  const grid = GRID;
  const union = (geometries) =>
    geometries
      .map((g) => rasterize(grid, g))
      .reduce((a, b) => a.map((v, i) => v | b[i]));
  const africa = union(
    countries.features
      .filter((f) => f.properties.CONTINENT === "Africa")
      .map((f) => f.geometry)
  );
  const eco = ecoregionPolygons(ecoregions, [
    ...SAHARA_ECOREGIONS,
    ...SAHEL_ECOREGIONS,
  ]);
  const sahara = and(
    union(SAHARA_ECOREGIONS.flatMap((n) => eco.get(n))),
    africa
  );
  const sahel = and(union(SAHEL_ECOREGIONS.flatMap((n) => eco.get(n))), africa);
  const egypt = rasterize(
    grid,
    only(countries.features, (f) => f.properties.ADM0_A3 === "EGY", "Egypt")
      .geometry
  );
  const nile = rivers.features.filter((f) =>
    ["Nile", "El Bahr el Abyad", "Bahr el Jebel"].includes(f.properties.name)
  );
  const westOfNile = westOf(grid, nileLongitudeByRow(grid, nile));

  const landRule =
    "Africa's land is the union of the Natural Earth Admin 0 countries whose CONTINENT is Africa";
  const saharaRule = `the Sahara is the union of the Ecoregions 2017 ecoregions ${SAHARA_ECOREGIONS.join(", ")}, on Africa's land (${landRule})`;
  const nileRule =
    "« west of the Nile » keeps, on each grid row, the cells west of the westernmost crossing of the Natural Earth rivers named Nile, El Bahr el Abyad or Bahr el Jebel; north of the river's last vertex (the delta apex near Cairo) the apex longitude is used";
  const both = `${NATURAL_EARTH_LICENCE} ${ECOREGIONS_LICENCE}`;

  const anchors = [
    ...TUAREG_ANCHORS.regions.flatMap(([name]) =>
      (region(name).type === "Polygon"
        ? [region(name).coordinates]
        : region(name).coordinates
      ).flatMap((rings) => rings[0])
    ),
    ...TUAREG_ANCHORS.places.flatMap(([name, iso]) =>
      circle(
        only(
          places.features,
          (f) => f.properties.name === name && f.properties.adm0_a3 === iso,
          `place ${name}`
        ).geometry.coordinates,
        ANCHOR_RADIUS_DEG
      )
    ),
  ];
  const tuaregHull = {
    type: "Polygon",
    coordinates: [convexHull(anchors)],
  };

  return {
    sahara: {
      mask: sahara,
      properties: {
        name: "Sahara",
        category: "region",
        source: `${cite("ecoregions")}; ${cite("countries")}`,
        citation: `${ECOREGIONS_CITATION} Ecoregions: ${SAHARA_ECOREGIONS.join(", ")}.`,
        derivation: `${SCRIPT_RULE}: ${saharaRule}; ${RASTER_RULE}. Ecoregion limits follow vegetation and climate; the desert's edge is a gradient, not a line.`,
        licence: both,
        date: "Present day (Ecoregions 2017)",
      },
    },
    desert: {
      mask: and(sahara, westOfNile),
      properties: {
        name: "Grand désert",
        category: "historical-name",
        source: `al-Idrīsī as edited by Dozy and de Goeje (1866); ${cite("ecoregions")}; ${cite("countries")}; ${cite("rivers")}`,
        citation: IDRISI_CITATION,
        derivation: `${SCRIPT_RULE}: the Sahara (the translators gloss al-Idrīsī's great desert as the Sahara) kept west of the Nile, because the passage sets the desert between the Sudan and the Berbers' land, both west of Egypt; ${saharaRule}; ${nileRule}; ${RASTER_RULE}. ${IDRISI_LIMITS}`,
        licence: idrisiLicence(both),
        date: "c. 1154",
      },
    },
    berberes: {
      mask: and(
        africa,
        not(sahara),
        northOf(grid, sahara),
        not(egypt),
        westOfNile
      ),
      properties: {
        name: "Pays des Berbères",
        category: "historical-name",
        source: `al-Idrīsī as edited by Dozy and de Goeje (1866); ${cite("ecoregions")}; ${cite("countries")}; ${cite("rivers")}`,
        citation: IDRISI_CITATION,
        derivation: `${SCRIPT_RULE}: Africa's land north of the Sahara in its own grid column, between the desert and the Mediterranean or the Atlantic, outside Egypt (Natural Earth Admin 0, ADM0_A3 EGY) and west of the Nile; ${saharaRule}; ${nileRule}; ${RASTER_RULE}. ${IDRISI_LIMITS} Berber-speaking peoples also lived in the desert itself (the veiled Ṣanhāja of the Arabic geographers); this area leaves them to the desert.`,
        licence: idrisiLicence(both),
        date: "c. 1154",
      },
    },
    noirs: {
      mask: and(sahel, not(sahara), westOfNile),
      properties: {
        name: "Pays des Noirs",
        category: "historical-name",
        source: `al-Idrīsī as edited by Dozy and de Goeje (1866); ${cite("ecoregions")}; ${cite("countries")}; ${cite("rivers")}`,
        citation: `${IDRISI_CITATION} The translators render the Arabic name of this land as « Soudan »; the Arabic bilād al-sūdān means the land of the Blacks. ${ECOREGIONS_CITATION}`,
        derivation: `${SCRIPT_RULE}: the Ecoregions 2017 ecoregions ${SAHEL_ECOREGIONS.join(", ")} on Africa's land, outside the Sahara and west of the Nile; ${landRule}; ${nileRule}; ${RASTER_RULE}. ${IDRISI_LIMITS} The Sahel stands for the belt south of the desert that the passage describes (Ghana, with the Lamlam to its south); the medieval Sudan also reached into the savanna further south, which al-Idrīsī knew only by hearsay.`,
        licence: idrisiLicence(both),
        date: "c. 1154",
      },
    },
    libye: {
      mask: and(africa, not(and(egypt, not(westOfNile)))),
      maxParts: 1,
      properties: {
        name: "Libye",
        category: "historical-name",
        source: `Herodotus, Histories, book IV; ${cite("countries")}; ${cite("rivers")}`,
        citation:
          "Herodotus, Histories IV.41–42 (trans. G. C. Macaulay, 1890): « after Egypt Libya succeeds at once » and « Libya furnishes proofs about itself that it is surrounded by sea, except so much of it as borders upon Asia »; IV.181: the Ammonians (Siwa), ten days' journey from Thebes, live in Libya; IV.197: Libyans live in the north of Libya and Ethiopians in the south.",
        derivation: `${SCRIPT_RULE}: Africa's land minus the part of Egypt (Natural Earth Admin 0, ADM0_A3 EGY) east of the Nile, so that Libya begins after Egypt's Nile and keeps Siwa; only the mainland is kept (islands such as Madagascar are dropped); ${landRule}; ${nileRule}; ${RASTER_RULE}. Herodotus drew no map: his Libya is the whole continent after Egypt, and he knew its south only from the report of a voyage around it. The valley's west bank, which he counted as Egypt (II.18), is under one pixel at this scale.`,
        licence: `Geometry: ${NATURAL_EARTH_LICENCE} Text: Macaulay's translation (1890) is in the public domain.`,
        date: "c. 430 BCE",
      },
    },
    touaregs: {
      mask: and(rasterize(grid, tuaregHull), africa),
      properties: {
        name: "Kel Tamasheq (Touaregs)",
        category: "people",
        source: `EthniAfrica corpus fiche PPL_TUAREG (dataset/source/afrik/peuples/FLG_BERBERE/PPL_TUAREG.json); ${cite("regions")}; ${cite("places")}; ${cite("countries")}`,
        citation: `PPL_TUAREG, content.appellations.historicalRegion, content.origins.historicalSettlementZones and content.ethnicities. Anchors: ${TUAREG_ANCHORS.regions.map(([n, why]) => `${n} (${why})`).join("; ")}; ${TUAREG_ANCHORS.places.map(([n, iso, why]) => `${n}, ${iso} (${why})`).join("; ")}.`,
        derivation: `${SCRIPT_RULE}: the convex hull of the anchors (every outer-ring vertex of the named Natural Earth Geography Regions polygons, and a circle of ${ANCHOR_RADIUS_DEG}° radius around each Natural Earth town), on Africa's land; ${landRule}; ${RASTER_RULE}. A people's area, never a state. The hull overstates: it takes in empty desert (Tanezrouft, Ténéré) and lands shared with Songhay, Zarma, Hausa, Arab and Tubu neighbours. It leaves out the Kinnin enclave in northern Darfur and the seasonal and modern migrations the fiche lists. Compared by eye with GREG (Weidmann, Rød and Cederman 2010, digitized from the Soviet Atlas Narodov Mira of 1964; no licence stated, so not used as geometry): the same core, but GREG reaches further north-east, to Ghadames and the Fezzan, and further east in Niger.`,
        licence: `Corpus fiche CC BY-SA 4.0 (EthniAfrica). Geometry: ${NATURAL_EARTH_LICENCE}`,
        date: "Present day, as the corpus fiche records it (October 2026)",
      },
    },
    libyque: {
      mask: and(rasterize(grid, region("LIBYAN DESERT")), sahara, westOfNile),
      properties: {
        name: "Désert libyque",
        category: "region",
        source: `${cite("regions")}; ${cite("ecoregions")}; ${cite("countries")}; ${cite("rivers")}`,
        citation: `Natural Earth, Geography Regions polygons, feature LIBYAN DESERT (FEATURECLA Desert, SCALERANK 3, NAME_FR « désert Libyque »), the modern name of the eastern Sahara. ${ECOREGIONS_CITATION}`,
        derivation: `${SCRIPT_RULE}: the Natural Earth region polygon LIBYAN DESERT, kept inside the Sahara and west of the Nile (Natural Earth's label region runs south into the savanna to 9° N, which the Sahara clip removes); ${saharaRule}; ${nileRule}; ${RASTER_RULE}. Natural Earth draws generalized regions for labelling, not surveyed limits.`,
        licence: both,
        date: "Present day (Natural Earth 5.1.2, 2022; Ecoregions 2017)",
      },
    },
    // Cartes 1.5.0: one area per Tuareg self-name, one name one outline.
    "touareg-imuhagh": {
      mask: and(
        union([region("AHAGGAR MTS."), region("Tassili-n-Ajjer")]),
        africa
      ),
      maxParts: 1,
      exteriorOnly: true,
      properties: {
        name: "Imuhagh",
        category: "people",
        source: `Salem Chaker, Encyclopédie berbère, 1986; ${cite("regions")}; ${cite("countries")}`,
        citation: `${CHAKER_CITATION} Regions: Natural Earth Geography Regions AHAGGAR MTS. and Tassili-n-Ajjer.`,
        derivation: `${SCRIPT_RULE}: the union of the Natural Earth Geography Regions polygons AHAGGAR MTS. and Tassili-n-Ajjer, on Africa's land (${landRule}), kept as one part with its exterior ring only, so the gap between the two regions is filled; ${RASTER_RULE}. Natural Earth draws generalized regions for labelling: the area marks where the form Imuhagh is said, not a limit.`,
        licence: `Geometry: ${NATURAL_EARTH_LICENCE}`,
        date: "Present day (Chaker 1986; Natural Earth 5.1.2, 2022)",
      },
    },
    "touareg-imajeghen": {
      mask: and(rasterize(grid, region("AÏR MTS.")), africa),
      maxParts: 1,
      exteriorOnly: true,
      properties: {
        name: "Imajeghen",
        category: "people",
        source: `Salem Chaker, Encyclopédie berbère, 1986; ${cite("regions")}; ${cite("countries")}`,
        citation: `${CHAKER_CITATION} Region: Natural Earth Geography Regions AÏR MTS.`,
        derivation: `${SCRIPT_RULE}: the Natural Earth Geography Regions polygon AÏR MTS., on Africa's land (${landRule}); ${RASTER_RULE}. Chaker gives Imajeghen for the Aïr and the south (Iwellemmeden, Kel Gress); the area draws the Aïr only, where Natural Earth has a region.`,
        licence: `Geometry: ${NATURAL_EARTH_LICENCE}`,
        date: "Present day (Chaker 1986; Natural Earth 5.1.2, 2022)",
      },
    },
    "touareg-imushagh": {
      mask: and(
        rasterize(grid, {
          type: "Polygon",
          coordinates: [
            closedCircle(
              only(
                places.features,
                (f) =>
                  f.properties.name === "Tessalit" &&
                  f.properties.adm0_a3 === "MLI",
                "place Tessalit"
              ).geometry.coordinates
            ),
          ],
        }),
        africa
      ),
      maxParts: 1,
      properties: {
        name: "Imushagh",
        category: "people",
        source: `Salem Chaker, Encyclopédie berbère, 1986; ${cite("places")}; ${cite("countries")}`,
        citation: `${CHAKER_CITATION} Anchor: Natural Earth populated place Tessalit, MLI (Adrar des Ifoghas; the Adrar is not a Natural Earth region and Kidal is not a Natural Earth place).`,
        derivation: `${SCRIPT_RULE}: a circle of ${ANCHOR_RADIUS_DEG}° radius around the Natural Earth town Tessalit (the anchor rule of the Tuareg area), on Africa's land (${landRule}); ${RASTER_RULE}. It stands for the Adrar des Ifoghas, centred on its northern town rather than on Kidal; the massif reaches further south.`,
        licence: `Geometry: ${NATURAL_EARTH_LICENCE}`,
        date: "Present day (Chaker 1986; Natural Earth 5.1.2, 2022)",
      },
    },
    amazigh: {
      mask: and(
        union(
          amazighPoints.map(({ point }) => ({
            type: "Polygon",
            coordinates: [closedCircle(point)],
          }))
        ),
        africa
      ),
      properties: {
        name: "Amazigh",
        category: "people",
        source: `${cite("glottologLanguages")}; ${cite("glottologValues")}; ${cite("countries")}`,
        citation: `${GLOTTOLOG_CITATION} The ${amazighPoints.length} living Berber languages with a point (classification under berb1260, level language, not aes-extinct): ${amazighPoints.map((l) => `${l.name} (${l.glottocode})`).join(", ")}.`,
        derivation: `${SCRIPT_RULE}: the union of circles of ${ANCHOR_RADIUS_DEG}° radius around Glottolog's point for each living Berber language, on Africa's land (${landRule}); ${RASTER_RULE}. A point is a language's centre, not where it is spoken: the area understates large ranges (Tamasheq has one point for more than 1,000 km), leaves the Arabic-speaking lands between the circles and the diaspora out, and gives no number of speakers. Endangered languages count like large ones.`,
        licence: `${GLOTTOLOG_LICENCE} Geometry: ${NATURAL_EARTH_LICENCE}`,
        date: "Present day (Glottolog 5.3, 2026)",
      },
    },
  };
}

/** Every area as the exact text of its GeoJSON file. */
export async function buildAreas(assets) {
  const sources = {};
  for (const key of Object.keys(DOWNLOADS))
    sources[key] = await readVerified(assets, key);
  const defined = definitions(sources);
  const built = await buildEpisodeAreas(assets, sources.countries);
  for (const id of AREA_IDS) {
    if (built.has(id)) continue;
    const { mask, maxParts, exteriorOnly, properties } = defined[id];
    const feature = {
      type: "Feature",
      properties: { kind: "approximate", ...properties },
      geometry: traceMask(GRID, mask, { maxParts, exteriorOnly }),
    };
    built.set(id, `${JSON.stringify(feature)}\n`);
  }
  return built;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
  if (!assets)
    throw new Error(
      "Set ETHNIAFRICA_VIDEO_ASSETS to the verified assets folder"
    );
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const [id, text] of await buildAreas(assets)) {
    await writeFile(new URL(`${id}.geojson`, OUTPUT_DIR), text);
    const { geometry } = JSON.parse(text);
    const rings =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;
    const vertices = rings.flat().reduce((n, r) => n + r.length - 1, 0);
    console.log(
      `${id}: ${geometry.type}, ${rings.length} part(s), ${vertices} vertices`
    );
  }
}
