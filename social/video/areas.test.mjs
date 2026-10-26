// @req REQ-186
// The approximate areas of the Sahara map video (design 0.4.0). Two kinds of
// check: the raster rules on small synthetic shapes (no download needed), and
// the committed artefacts themselves. Regenerating the artefacts from the
// pinned Natural Earth files is in areas.acceptance.test.mjs, since those
// files stay outside git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

// Towns of the Burkina Faso episode (its research's map-data/README.md, or
// GeoNames centres rounded to 0.01°).
const TOWN = {
  ouagadougou: [-1.52, 12.37],
  bobo: [-4.3, 11.18],
  dori: [-0.04, 14.04],
  djibo: [-1.63, 14.1],
  ouahigouya: [-2.42, 13.58],
  fada: [0.36, 12.06],
  tenkodogo: [-0.37, 11.78],
  gambaga: [-0.44, 10.53],
  niani: [-8.38, 11.37],
  gao: [-0.04, 16.27],
  djenne: [-4.55, 13.9],
  bamako: [-8.0, 12.65],
  dakar: [-17.44, 14.69],
  nouakchott: [-15.98, 18.08],
  nema: [-7.25, 16.62],
  kankan: [-9.3, 10.38],
  bouake: [-5.03, 7.69],
  parakou: [2.63, 9.34],
  zinder: [8.99, 13.8],
  say: [2.36, 13.1],
};
const BFA_BOX = { west: -6, east: 2.6, south: 9.2, north: 15.2 };
const EPISODE_EXPECTED = {
  "bfa-burkina-faso": {
    kind: "certain",
    category: "country",
    box: BFA_BOX,
    covers: [TOWN.ouagadougou, TOWN.bobo, TOWN.dori],
    excludes: [TOWN.say, TOWN.bamako, TOWN.gambaga],
  },
  "bfa-haute-volta": {
    kind: "certain",
    category: "historical-name",
    box: BFA_BOX,
    covers: [TOWN.ouagadougou, TOWN.bobo, TOWN.dori],
    excludes: [TOWN.say, TOWN.bamako],
  },
  "bfa-cercle-de-say": {
    category: "historical-name",
    box: { west: 0, east: 3.5, south: 11, north: 14.5 },
    covers: [[1.9, 12.9]],
    excludes: [TOWN.ouagadougou, TOWN.zinder],
  },
  "bfa-hv32-cote-divoire": {
    category: "historical-name",
    box: BFA_BOX,
    covers: [TOWN.ouagadougou, TOWN.bobo],
    excludes: [TOWN.dori, TOWN.ouahigouya, TOWN.fada],
  },
  "bfa-hv32-soudan": {
    category: "historical-name",
    box: BFA_BOX,
    covers: [TOWN.ouahigouya],
    excludes: [TOWN.ouagadougou, TOWN.dori],
  },
  "bfa-hv32-niger": {
    category: "historical-name",
    box: BFA_BOX,
    covers: [TOWN.dori, TOWN.fada],
    excludes: [TOWN.ouagadougou, TOWN.ouahigouya],
  },
  "bfa-mamprugu": {
    category: "people",
    box: { west: -2, east: 1, south: 9.5, north: 11.2 },
    covers: [TOWN.gambaga],
    excludes: [TOWN.ouagadougou],
  },
  "bfa-mossi-yatenga": {
    category: "people",
    box: { west: -3.6, east: -1.5, south: 12.8, north: 14.4 },
    covers: [TOWN.ouahigouya],
    excludes: [TOWN.ouagadougou],
  },
  "bfa-mossi-ouagadougou": {
    category: "people",
    box: { west: -2.8, east: -0.5, south: 11.2, north: 13.2 },
    covers: [TOWN.ouagadougou],
    excludes: [TOWN.ouahigouya, TOWN.tenkodogo],
  },
  "bfa-mossi-tenkodogo": {
    category: "people",
    box: { west: -1.2, east: 0.6, south: 11.0, north: 12.4 },
    covers: [TOWN.tenkodogo],
    excludes: [TOWN.ouagadougou],
  },
  "bfa-manden": {
    category: "people",
    box: { west: -10.5, east: -7, south: 10.5, north: 13.2 },
    covers: [TOWN.niani],
    excludes: [TOWN.bobo, TOWN.bamako],
  },
  "bfa-macina": {
    category: "region",
    box: { west: -6.5, east: -2.5, south: 13.3, north: 17.2 },
    covers: [TOWN.djenne],
    excludes: [TOWN.dori],
  },
  "bfa-liptako": {
    category: "people",
    box: { west: -1.5, east: 1.5, south: 13, north: 15.2 },
    covers: [TOWN.dori],
    excludes: [TOWN.djibo, TOWN.ouagadougou],
  },
  "bfa-jelgooji": {
    category: "people",
    box: { west: -2.5, east: -0.8, south: 13.5, north: 14.8 },
    covers: [TOWN.djibo],
    excludes: [TOWN.dori],
  },
  "bfa-songhay": {
    category: "people",
    box: { west: -4, east: 2.5, south: 13.8, north: 17.5 },
    covers: [TOWN.gao],
    excludes: [TOWN.ouagadougou],
  },
  "bfa-aof-senegal": {
    kind: "certain",
    category: "historical-name",
    box: { west: -18, east: -11, south: 12, north: 17 },
    covers: [[-15, 14.5]],
    excludes: [TOWN.bamako],
  },
  "bfa-aof-mauritanie": {
    kind: "certain",
    category: "historical-name",
    box: { west: -17.5, east: -4.5, south: 14.5, north: 27.5 },
    covers: [[-12, 20]],
    excludes: [TOWN.nema, TOWN.dakar],
  },
  "bfa-aof-hodh": {
    category: "historical-name",
    box: { west: -11.5, east: -5, south: 15, north: 21 },
    covers: [TOWN.nema],
    excludes: [TOWN.bamako],
  },
  "bfa-aof-soudan-francais": {
    kind: "certain",
    category: "historical-name",
    box: { west: -12.5, east: 4.5, south: 10, north: 25.5 },
    covers: [TOWN.bamako, TOWN.gao],
    excludes: [TOWN.ouagadougou, TOWN.dakar],
  },
  "bfa-aof-guinee": {
    kind: "certain",
    category: "historical-name",
    box: { west: -15.5, east: -7.5, south: 7, north: 13 },
    covers: [TOWN.kankan],
    excludes: [TOWN.bamako],
  },
  "bfa-aof-cote-divoire": {
    kind: "certain",
    category: "historical-name",
    box: { west: -9, east: -2.4, south: 4, north: 11 },
    covers: [TOWN.bouake],
    excludes: [TOWN.bobo],
  },
  "bfa-aof-dahomey": {
    kind: "certain",
    category: "historical-name",
    box: { west: 0.5, east: 4, south: 6, north: 12.5 },
    covers: [TOWN.parakou],
    excludes: [TOWN.zinder],
  },
  "bfa-aof-niger": {
    kind: "certain",
    category: "historical-name",
    box: { west: 0, east: 16.2, south: 11.5, north: 23.6 },
    covers: [TOWN.zinder],
    excludes: [TOWN.ouagadougou, [1.9, 12.9]],
  },
  "bfa-langue-moore": {
    category: "language",
    box: { west: -3, east: 0.5, south: 11, north: 14 },
    covers: [TOWN.ouagadougou],
    excludes: [TOWN.bobo, TOWN.dori],
  },
  "bfa-langue-jula": {
    category: "language",
    box: { west: -5.5, east: -3, south: 10, north: 12.2 },
    covers: [TOWN.bobo],
    excludes: [TOWN.ouagadougou],
  },
  "bfa-langue-fulfulde": {
    category: "language",
    box: { west: -2, east: 1.5, south: 13.3, north: 15.2 },
    covers: [TOWN.dori],
    excludes: [TOWN.ouagadougou],
  },
};

// Towns of the « Kouassi et Yao » episode (GeoNames centres rounded to 0.01°).
const YK_TOWN = {
  bouake: [-5.03, 7.69],
  abengourou: [-3.5, 6.73],
  bondoukou: [-2.8, 8.04],
  abidjan: [-4.01, 5.32],
  korhogo: [-5.63, 9.46],
  man: [-7.55, 7.41],
  kumasi: [-1.62, 6.69],
  sunyani: [-2.33, 7.34],
  // Fante country; Cape Coast itself sits on the simplified coastline.
  mankessim: [-1.02, 5.27],
  accra: [-0.19, 5.56],
  tamale: [-0.84, 9.4],
  ho: [0.47, 6.6],
  lome: [1.22, 6.13],
};
const CIV_BOX = { west: -8.7, east: -2.4, south: 4.3, north: 10.8 };
const GHA_BOX = { west: -3.3, east: 1.3, south: 4.7, north: 11.2 };
const YK_EXPECTED = {
  "yk-baoule": {
    category: "people",
    box: CIV_BOX,
    covers: [YK_TOWN.bouake],
    excludes: [YK_TOWN.abidjan, YK_TOWN.korhogo, YK_TOWN.abengourou],
  },
  "yk-akan-civ": {
    category: "people",
    box: CIV_BOX,
    covers: [YK_TOWN.bouake, YK_TOWN.abengourou, YK_TOWN.bondoukou],
    excludes: [YK_TOWN.korhogo, YK_TOWN.man, YK_TOWN.kumasi],
  },
  "yk-twi": {
    category: "language",
    box: GHA_BOX,
    covers: [YK_TOWN.kumasi, YK_TOWN.sunyani],
    excludes: [YK_TOWN.accra, YK_TOWN.tamale, YK_TOWN.bouake],
  },
  "yk-akan-gha": {
    category: "people",
    box: GHA_BOX,
    covers: [YK_TOWN.kumasi, YK_TOWN.sunyani, YK_TOWN.mankessim],
    excludes: [YK_TOWN.tamale, YK_TOWN.ho, YK_TOWN.accra, YK_TOWN.bouake],
  },
  "yk-cote-divoire": {
    kind: "certain",
    category: "country",
    box: CIV_BOX,
    covers: [YK_TOWN.abidjan, YK_TOWN.bouake, YK_TOWN.korhogo],
    excludes: [YK_TOWN.kumasi, YK_TOWN.accra],
  },
  "yk-ghana": {
    kind: "certain",
    category: "country",
    box: GHA_BOX,
    covers: [YK_TOWN.accra, YK_TOWN.kumasi, YK_TOWN.tamale],
    excludes: [YK_TOWN.abidjan, YK_TOWN.lome],
  },
};

// Each area: its label category, a generous box it must stay inside, places
// it must cover and places it must leave out. The boxes catch a leak (an
// area spilling into Arabia or the ocean); the places catch a wrong rule.
// Series 1, episode 20, Togo (Cartes 1.15.0): the country the name now
// designates, in today's border.
const TGO_BOX = { west: -0.2, east: 1.9, south: 5.8, north: 11.2 };
const TGO_EXPECTED = {
  "tgo-togo": {
    kind: "certain",
    category: "country",
    box: TGO_BOX,
    covers: [
      YK_TOWN.lome,
      [1.48, 6.23], // Togoville, on the lake
      [1.13, 8.98], // Sokodé
      [0.2, 10.87], // Dapaong
    ],
    excludes: [YK_TOWN.accra, YK_TOWN.abidjan, [2.43, 6.37]], // Cotonou
  },
};
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
  // Series 1, episode 19, Burkina Faso (Cartes 1.11.0): the country from
  // Natural Earth, the historical areas from the episode's pinned research.
  ...EPISODE_EXPECTED,
  // Series 4, episode 1, « tribu » (Cartes 1.11.0): Morgan's « Africa » of
  // 1877 is the whole mainland; the 1948 census is the colony of Kenya.
  "tribu-afrique": {
    kind: "certain",
    category: "region",
    box: { west: -18, east: 52, south: -35.5, north: 38 },
    covers: [
      [-16.93, 14.79], // Thiès (Dakar's peninsula is thinner than a cell)
      [31.24, 30.04], // Cairo: Egypt is part of the continent here
      [18.42, -33.92], // Cape Town
      [43.65, 3.11], // Baidoa, Somalia (coastal towns sit on the simplified edge)
    ],
    excludes: [
      [46.9, -19], // Madagascar: the mainland only
      [45, 24], // Arabia
      [14, 37.5], // Sicily
    ],
  },
  "tribu-kenya": {
    kind: "certain",
    category: "historical-name",
    box: { west: 33.5, east: 42, south: -5, north: 5.5 },
    covers: [
      [36.82, -1.29], // Nairobi
      [36.95, -0.42], // Nyeri, Kikuyu country
      [39.67, -4.05], // Mombasa
    ],
    excludes: [
      [32.58, 0.35], // Kampala
      [39.28, -6.79], // Dar es Salaam
      [38.74, 9.03], // Addis Ababa
    ],
  },
  // Series 3, episode 1, « Kouassi et Yao » (Cartes 1.12.0): four
  // approximate areas from the episode's pinned research, kept inside their
  // country, and the two countries from Natural Earth.
  ...YK_EXPECTED,
  ...TGO_EXPECTED,
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
    assert.equal(p.kind, expected.kind ?? "approximate");
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

const YK_NAMES = {
  "yk-baoule": "Baoulé",
  "yk-akan-civ": "Akan de Côte d'Ivoire",
  "yk-twi": "Twi",
  "yk-akan-gha": "Akan du Ghana",
  "yk-cote-divoire": "Côte d'Ivoire",
  "yk-ghana": "Ghana",
};
const featureOf = (id) => JSON.parse(readFileSync(fileOf(id), "utf8"));

// @req REQ-186
test("the Togo area is Natural Earth's polygon, named Togo, in today's border", () => {
  const p = featureOf("tgo-togo").properties;
  assert.equal(p.name, "Togo");
  assert.match(p.citation, /feature TGO/);
  assert.match(p.derivation, /ADM0_A3 TGO/);
  assert.match(p.date, /1960/);
});

// @req REQ-186
test("the « Kouassi et Yao » areas carry their names, and the Ghana side its licence caveat", () => {
  for (const [id, name] of Object.entries(YK_NAMES))
    assert.equal(featureOf(id).properties.name, name, id);
  for (const id of ["yk-twi", "yk-akan-gha"]) {
    const p = featureOf(id).properties;
    assert.match(p.citation, /Murdock/);
    assert.match(p.citation, /Nunn/);
    assert.match(p.licence, /no licence stated by the digitiser/i);
  }
  for (const id of ["yk-baoule", "yk-akan-civ"])
    assert.match(featureOf(id).properties.citation, /Vennetier/);
});

function distanceToSegment([x, y], [[x1, y1], [x2, y2]]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(
    0,
    Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1))
  );
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

// The approximate areas are traced back from grid cells whose centre lies in
// the country, so their edge may stand off the border by half a cell, the
// Douglas–Peucker tolerance and the rounding: 0.08° at most.
const BORDER_SLACK_DEG = 0.08;
for (const [id, countryId] of [
  ["yk-baoule", "yk-cote-divoire"],
  ["yk-akan-civ", "yk-cote-divoire"],
  ["yk-twi", "yk-ghana"],
  ["yk-akan-gha", "yk-ghana"],
]) {
  // @req REQ-186
  test(`area ${id} lies inside ${countryId}`, () => {
    const country = featureOf(countryId).geometry;
    const border = polygons(country)
      .flat()
      .flatMap((ring) => ring.slice(1).map((p, i) => [ring[i], p]));
    for (const vertex of polygons(featureOf(id).geometry).flat(2))
      assert.ok(
        covers(country, vertex) ||
          border.some((s) => distanceToSegment(vertex, s) <= BORDER_SLACK_DEG),
        `${id}: ${vertex} lies outside ${countryId}`
      );
  });
}

// @req REQ-186
test("Côte d'Ivoire and Ghana share one border line, vertex for vertex", () => {
  const key = ([lon, lat]) => `${lon},${lat}`;
  const civ = new Set(
    polygons(featureOf("yk-cote-divoire").geometry).flat(2).map(key)
  );
  const shared = polygons(featureOf("yk-ghana").geometry)
    .flat(2)
    .filter((v) => civ.has(key(v)));
  const lats = shared.map(([, lat]) => lat);
  assert.ok(shared.length >= 20, `only ${shared.length} shared vertices`);
  // From the coast to the tripoint with Burkina Faso.
  assert.ok(Math.min(...lats) < 5.2, `border starts at ${Math.min(...lats)}`);
  assert.ok(Math.max(...lats) > 9.4, `border ends at ${Math.max(...lats)}`);
});

// The country rule was generalised for this episode: the Burkina Faso files
// it already wrote must keep their bytes.
// @req REQ-186
test("the Burkina Faso country areas keep their bytes", () => {
  const sha = (id) =>
    createHash("sha256")
      .update(readFileSync(fileOf(id)))
      .digest("hex");
  assert.equal(
    sha("bfa-burkina-faso"),
    "b3c2825b68b1551639d47d7da1fad9ec42308a3b07f53816ef3d4e1b65db49a5"
  );
  assert.equal(
    sha("bfa-haute-volta"),
    "57d6d035de2063f69e992f7f3d48638ea582677749032488ce3a3951d0492951"
  );
});
