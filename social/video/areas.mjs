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
        .filter((j) => parents[j] === i && areas[j] >= minPartKm2)
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

async function readVerified(assets, key) {
  const download = DOWNLOADS[key];
  const bytes = await readFile(join(assets, download.file));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== download.sha256)
    throw new Error(`${download.file} differs from the pinned download`);
  return download.file.endsWith(".zip")
    ? bytes
    : JSON.parse(bytes.toString("utf8"));
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

export const AREA_IDS = [
  "sahara",
  "desert",
  "berberes",
  "noirs",
  "libye",
  "touaregs",
  "libyque",
];

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
  const { ecoregions, regions, countries, places, rivers } = sources;
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
  };
}

/** Every area as the exact text of its GeoJSON file. */
export async function buildAreas(assets) {
  const sources = {};
  for (const key of Object.keys(DOWNLOADS))
    sources[key] = await readVerified(assets, key);
  const defined = definitions(sources);
  const built = new Map();
  for (const id of AREA_IDS) {
    const { mask, maxParts, properties } = defined[id];
    const feature = {
      type: "Feature",
      properties: { kind: "approximate", ...properties },
      geometry: traceMask(GRID, mask, { maxParts }),
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
