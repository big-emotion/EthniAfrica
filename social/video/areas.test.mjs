// @req REQ-186
// The approximate areas of the Sahara map video (design 0.4.0). Two kinds of
// check: the raster rules on small synthetic shapes (no download needed), and
// the committed artefacts themselves. Regenerating the artefacts from the
// pinned Natural Earth files is in areas.acceptance.test.mjs, since those
// files stay outside git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import {
  AREA_IDS,
  OUTPUT_DIR,
  berberLanguagePoints,
  rasterize,
  traceMask,
} from "./areas.mjs";

const PROPERTY_KEYS = [
  "category",
  "citation",
  "date",
  "derivation",
  "kind",
  "licence",
  "name",
  "source",
];

// Each area: its label category, a generous box it must stay inside, places
// it must cover and places it must leave out. The boxes catch a leak (an
// area spilling into Arabia or the ocean); the places catch a wrong rule.
const EXPECTED = {
  // Series 2, episode 1 (Cartes 1.5.0): one area per self-name, one per name.
  "touareg-imuhagh": {
    category: "people",
    box: { west: 1, east: 12, south: 20, north: 28 },
    covers: [
      [5.5, 23], // Ahaggar
      [8.5, 25.5], // Tassili n'Ajjer
    ],
    excludes: [
      [8.5, 18.5], // Aïr
      [1, 20.2], // Tessalit
    ],
  },
  "touareg-imajeghen": {
    category: "people",
    box: { west: 6, east: 11, south: 15.5, north: 21.5 },
    covers: [[8.5, 18.5]],
    excludes: [[5.5, 23]],
  },
  "touareg-imushagh": {
    category: "people",
    box: { west: -1, east: 3, south: 19, north: 21.5 },
    covers: [[1, 20.2]],
    excludes: [[8.5, 18.5]],
  },
  amazigh: {
    category: "people",
    box: { west: -18, east: 27, south: 12, north: 38 },
    covers: [
      [4.76, 36.41], // Kabyle
      [25.5, 29.2], // Siwi
      [-2.41, 14.2], // Tamasheq
    ],
    excludes: [
      [31.2, 30], // Cairo
      [8.8, 11.2], // Hausaland
    ],
  },
  sahara: {
    category: "region",
    box: { west: -18, east: 40, south: 9, north: 35 },
    covers: [
      [5.5, 23], // Ahaggar
      [-8, 21], // El Djouf
      [26, 25], // Western Desert of Egypt
    ],
    excludes: [
      [3, 36.5], // Algiers coast
      [10, 9], // Jos Plateau, Nigeria
    ],
  },
  desert: {
    category: "historical-name",
    box: { west: -18, east: 33.5, south: 9, north: 35 },
    covers: [
      [5.5, 23],
      [-8, 21],
    ],
    excludes: [
      [34, 24], // east of the Nile, Red Sea hills
      [3, 36.5],
    ],
  },
  berberes: {
    category: "historical-name",
    box: { west: -18, east: 25.5, south: 26, north: 38 },
    covers: [
      [-5, 34], // Fès
      [9.5, 35.5], // central Tunisia
      [13, 32.5], // Tripolitania
    ],
    excludes: [
      [5.5, 23],
      [30, 30.5], // Egypt
    ],
  },
  noirs: {
    category: "historical-name",
    box: { west: -18, east: 34.5, south: 8, north: 24 },
    covers: [
      [0, 14.5], // Niger bend, south of Gao
      [15, 13], // Lake Chad
      [-14, 15], // Senegal valley
    ],
    excludes: [
      [5.5, 23],
      [36, 15], // east of the Nile, Eritrean lowlands
    ],
  },
  libye: {
    category: "historical-name",
    box: { west: -18, east: 52, south: -35.5, north: 38 },
    covers: [
      [25.5, 29.2], // Siwa, the Ammonians (Histories IV.181)
      [13, 32], // Tripolitania
      [20, -25], // the continent south: Libya is surrounded by sea (IV.42)
    ],
    excludes: [
      [33.5, 26], // Egypt east of the Nile
      [45, 24], // Arabia
    ],
  },
  touaregs: {
    category: "people",
    box: { west: -6, east: 13, south: 11, north: 28.5 },
    covers: [
      [5.52, 22.79], // Tamanrasset, Ahaggar
      [7.98, 17.0], // Agadez, Aïr
      [1.41, 18.44], // Kidal, Adrar des Ifoghas
      [10.17, 24.96], // Ghat, Ajjer
    ],
    excludes: [
      [-17.4, 14.7], // Dakar
      [31.2, 30], // Cairo
      [3, 36.5],
    ],
  },
  libyque: {
    category: "region",
    box: { west: 17, east: 35, south: 9, north: 33.5 },
    covers: [[25, 25]], // Gilf Kebir, Western Desert
    excludes: [
      [5.5, 23],
      [-8, 21],
    ],
  },
};

const fileOf = (id) => new URL(`${id}.geojson`, OUTPUT_DIR);

const polygons = (geometry) =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

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

function covers(geometry, point) {
  return polygons(geometry).some(
    ([outer, ...holes]) =>
      insideRing(point, outer) && !holes.some((h) => insideRing(point, h))
  );
}

function segmentsCross([a, b], [c, d]) {
  const orient = (p, q, r) =>
    Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return (
    orient(a, b, c) * orient(a, b, d) < 0 &&
    orient(c, d, a) * orient(c, d, b) < 0
  );
}

// Proper crossings between any two edges of any rings of the geometry,
// with a bounding-box prefilter so a few thousand edges stay fast.
function selfCrossings(geometry) {
  const edges = polygons(geometry)
    .flat()
    .flatMap((ring) => ring.slice(1).map((p, i) => [ring[i], p]));
  const boxes = edges.map(([[x1, y1], [x2, y2]]) => [
    Math.min(x1, x2),
    Math.max(x1, x2),
    Math.min(y1, y2),
    Math.max(y1, y2),
  ]);
  let crossings = 0;
  for (let i = 0; i < edges.length; i++)
    for (let j = i + 1; j < edges.length; j++) {
      const [a0, a1, a2, a3] = boxes[i];
      const [b0, b1, b2, b3] = boxes[j];
      if (a1 < b0 || b1 < a0 || a3 < b2 || b3 < a2) continue;
      if (segmentsCross(edges[i], edges[j])) crossings++;
    }
  return crossings;
}

// A 1° grid over a 20° × 20° patch, enough for the raster rules.
const SMALL_GRID = { west: 0, north: 20, cell: 0.5, width: 40, height: 40 };
const square = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
  [x0, y0],
];

// @req REQ-186
test("a polygon with a hole is rasterized and traced back with its hole", () => {
  const mask = rasterize(SMALL_GRID, {
    type: "Polygon",
    coordinates: [square(2, 2, 18, 18), square(8, 8, 12, 12)],
  });
  const geometry = traceMask(SMALL_GRID, mask, {
    tolerance: 0.1,
    minPartKm2: 0,
  });
  assert.equal(geometry.type, "Polygon");
  assert.ok(covers(geometry, [4, 4]));
  assert.ok(!covers(geometry, [10, 10]), "the hole stays a hole");
  assert.ok(!covers(geometry, [19, 19]));
  assert.equal(selfCrossings(geometry), 0);
});

// @req REQ-186
test("exteriorOnly keeps the outer ring and drops every hole", () => {
  const mask = rasterize(SMALL_GRID, {
    type: "Polygon",
    coordinates: [square(2, 2, 18, 18), square(8, 8, 12, 12)],
  });
  const geometry = traceMask(SMALL_GRID, mask, {
    tolerance: 0.1,
    minPartKm2: 0,
    exteriorOnly: true,
  });
  assert.equal(geometry.type, "Polygon");
  assert.equal(geometry.coordinates.length, 1, "one ring, no hole");
  assert.ok(covers(geometry, [10, 10]), "the hole is filled");
});

// @req REQ-186
test("Glottolog's living Berber languages are kept, extinct ones and dialects left out", () => {
  const languages = [
    "ID,Name,Macroarea,Latitude,Longitude,Glottocode,ISO639P3code,Level,Countries,Family_ID,Language_ID,Closest_ISO369P3code,First_Year_Of_Documentation,Last_Year_Of_Documentation,Is_Isolate",
    "kaby1243,Kabyle,Africa,36.4103,4.76137,kaby1243,kab,language,DZ,afro1255,,kab,,,false",
    "guan1277,Guanche,Africa,28.2,-16.5,guan1277,gnc,language,ES,afro1255,,gnc,,,false",
    "less1241,Lesser Kabylian,Africa,36.5,5.1,less1241,,dialect,DZ,afro1255,kaby1243,,,,false",
    "haus1257,Hausa,Africa,11.2,8.8,haus1257,hau,language,NG,afro1255,,hau,,,false",
    'tama1365,"Tamasheq, Mali",Africa,14.2038,-2.41269,tama1365,taq,language,BF;ML,afro1255,,taq,,,false',
  ].join("\n");
  const values = [
    "ID,Language_ID,Parameter_ID,Value,Code_ID,Comment,Source,codeReference",
    "kaby1243-classification,kaby1243,classification,afro1255/berb1260/kaby1244,,,,",
    "kaby1243-aes,kaby1243,aes,2,aes-threatened,Vulnerable,550905,",
    "guan1277-classification,guan1277,classification,afro1255/berb1260/unun9880,,,,",
    "guan1277-aes,guan1277,aes,6,aes-extinct,Extinct,1,",
    "less1241-classification,less1241,classification,afro1255/berb1260/kaby1244/kaby1243,,,,",
    "haus1257-classification,haus1257,classification,afro1255/chad1250/west2718,,,,",
    'tama1365-classification,tama1365,classification,afro1255/berb1260/tuar1240/sout3263,,"a, quoted comma",,',
    "tama1365-aes,tama1365,aes,1,aes-not_endangered,,1,",
  ].join("\n");
  assert.deepEqual(berberLanguagePoints(languages, values), [
    { glottocode: "kaby1243", name: "Kabyle", point: [4.76137, 36.4103] },
    {
      glottocode: "tama1365",
      name: "Tamasheq, Mali",
      point: [-2.41269, 14.2038],
    },
  ]);
});

// @req REQ-186
test("two separate parts become a MultiPolygon, and tiny parts are dropped", () => {
  const mask = rasterize(SMALL_GRID, {
    type: "MultiPolygon",
    coordinates: [
      [square(1, 1, 8, 8)],
      [square(11, 11, 19, 19)],
      [square(9.6, 1, 10.4, 1.6)],
    ],
  });
  const kept = traceMask(SMALL_GRID, mask, {
    tolerance: 0.1,
    minPartKm2: 20000,
  });
  assert.equal(kept.type, "MultiPolygon");
  assert.equal(kept.coordinates.length, 2);
  assert.ok(covers(kept, [4, 4]) && covers(kept, [15, 15]));
  assert.ok(!covers(kept, [10, 1.3]), "the sliver under the threshold");
});

// @req REQ-186
test("tracing is deterministic", () => {
  const mask = rasterize(SMALL_GRID, {
    type: "Polygon",
    coordinates: [
      [
        [2, 3],
        [17, 2],
        [12, 9],
        [18, 17],
        [3, 15],
        [2, 3],
      ],
    ],
  });
  const options = { tolerance: 0.2, minPartKm2: 0 };
  assert.equal(
    JSON.stringify(traceMask(SMALL_GRID, mask, options)),
    JSON.stringify(traceMask(SMALL_GRID, mask, options))
  );
});

for (const id of AREA_IDS) {
  // @req REQ-186
  test(`area ${id}: a committed, valid, provenanced approximate area`, () => {
    const expected = EXPECTED[id];
    assert.ok(expected, `no expectation written for ${id}`);
    assert.ok(existsSync(fileOf(id)), `missing data/areas/${id}.geojson`);
    const text = readFileSync(fileOf(id), "utf8");
    assert.doesNotMatch(text, /mock/i, "nothing marked as a mock-up");
    const feature = JSON.parse(text);
    assert.equal(feature.type, "Feature");
    const p = feature.properties;
    assert.deepEqual(Object.keys(p).sort(), PROPERTY_KEYS);
    for (const key of PROPERTY_KEYS)
      assert.ok(
        typeof p[key] === "string" && p[key].trim().length > 0,
        `${id}: ${key} must be a non-empty string`
      );
    assert.equal(p.kind, "approximate");
    assert.equal(p.category, expected.category);
    assert.doesNotMatch(p.name, /[«»"]/, "no quotation marks in the label");
    assert.match(p.derivation, /social\/video\/areas\.mjs/);
    assert.match(p.source, /SHA-256 [0-9a-f]{64}/, "pinned download");
    assert.match(p.licence, /public domain|CC/i);

    const { geometry } = feature;
    assert.ok(["Polygon", "MultiPolygon"].includes(geometry.type));
    const { box } = expected;
    for (const rings of polygons(geometry))
      for (const ring of rings) {
        assert.ok(ring.length >= 4, "a ring has at least three corners");
        assert.deepEqual(ring[0], ring.at(-1), "ring is closed");
        for (const [lon, lat] of ring) {
          assert.ok(lon >= box.west && lon <= box.east, `${id} lon ${lon}`);
          assert.ok(lat >= box.south && lat <= box.north, `${id} lat ${lat}`);
          assert.equal(lon, Number(lon.toFixed(2)), "rounded to 0.01°");
          assert.equal(lat, Number(lat.toFixed(2)), "rounded to 0.01°");
        }
      }
    assert.equal(selfCrossings(geometry), 0, `${id} has crossing edges`);
    for (const point of expected.covers)
      assert.ok(covers(geometry, point), `${id} should cover ${point}`);
    for (const point of expected.excludes)
      assert.ok(!covers(geometry, point), `${id} should leave out ${point}`);
  });
}

// @req REQ-186
test("every expected area is built, and nothing else sits in the folder", () => {
  assert.deepEqual([...AREA_IDS].sort(), Object.keys(EXPECTED).sort());
  assert.deepEqual(
    readdirSync(OUTPUT_DIR).sort(),
    AREA_IDS.map((id) => `${id}.geojson`).sort()
  );
});
