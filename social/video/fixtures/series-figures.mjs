// Figures and facts drawn on the map (Cartes 1.14.0) on the boards' five
// scenes (the design package's scenes114.js: chiffres, lectures, livre,
// noms, cadre), in the new card data, between the episode « Afrique »'s
// opener and closing, timed on a synthetic silent voice. The sentences are
// the episode's narration (series 6, n° 1); the piece still carries the demo
// tape, since it is a test of the engine, not the episode.
//
// The states the cascade lights and the units' regional breakdown are the
// piece's own files, written here. By default the states are synthetic
// squares inside the continent's outline, which is enough for the plan; the
// drawn acceptance test passes Natural Earth's countries (`world`) so the
// cascade shows the 54 states and the two territories the source does not
// count. The breakdown's values are the episode's sourced ones (UN, World
// Population Prospects 2024, 2025, by M49 region; Glottolog 5.3 points by
// region), so the units fall as on the episode.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CARDS, closingChunks, writeSyntheticVoice } from "./series-pays.mjs";

const DEMO = "Démonstration : test du moteur, pas l'épisode";
const CONTINENT = { lon: 17, lat: 1, radius: 515 };
const AFRIQUE = {
  file: "tribu-afrique.geojson",
  id: "afrique",
  name: "Afrique",
  ink: "a",
  label: "none",
};
export const POINTS = {
  carthage: [10.32, 36.85],
  fes: [-5, 34.03],
  grenade: [-3.6, 37.18],
  rome: [12.5, 41.9],
  athenes: [23.73, 37.98],
  tyr: [35.2, 33.27],
  aures: [6.5, 35.3],
  italie: [13.5, 41.5],
};

// The 54 African UN Member States (the episode's research, claim
// c-54-states), Natural Earth's codes (South Sudan is SDS there), and the
// two units of African land without a seat.
export const UN_54 =
  "DZA AGO BEN BWA BFA BDI CPV CMR CAF TCD COM COG COD CIV DJI EGY GNQ ERI SWZ ETH GAB GMB GHA GIN GNB KEN LSO LBR LBY MDG MWI MLI MRT MUS MAR MOZ NAM NER NGA RWA STP SEN SYC SLE SOM ZAF SDS SDN TZA TGO TUN UGA ZMB ZWE".split(
    " "
  );
export const UNCOUNTED = ["SAH", "SOL"];
// UN M49 sub-regions of Africa (the episode's breakdown file).
export const M49 = {
  northern: "DZA EGY LBY MAR SDN TUN SAH",
  eastern:
    "BDI COM DJI ERI ETH KEN MDG MWI MUS MOZ RWA SYC SOM SOL SDS UGA TZA ZMB ZWE",
  middle: "AGO CMR CAF TCD COG COD GNQ GAB STP",
  southern: "BWA SWZ LSO NAM ZAF",
  western: "BEN BFA CPV CIV GMB GHA GIN GNB LBR MLI MRT NER NGA SEN SLE TGO",
};
const PEOPLE = {
  eastern: 513485693,
  western: 466532788,
  northern: 276302254,
  middle: 219525087,
  southern: 74021757,
};
const LANGUAGES = {
  western: 960,
  middle: 736,
  eastern: 471,
  northern: 111,
  southern: 58,
};
const NE = "Natural Earth 1:50m Cultural Vectors, Admin 0 Countries, 5.1.2";
const PD = "Public domain (Natural Earth)";

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
const square = (lon, lat, d = 1.6) => ({
  type: "Polygon",
  coordinates: [
    [
      [lon - d, lat - d],
      [lon + d, lat - d],
      [lon + d, lat + d],
      [lon - d, lat + d],
      [lon - d, lat - d],
    ],
  ],
});
// Synthetic states: squares on a grid inside the continent's outline, each
// given the region its place falls in, so every region has land.
function syntheticStates() {
  const area = JSON.parse(
    readFileSync(
      new URL("../data/areas/tribu-afrique.geojson", import.meta.url),
      "utf8"
    )
  );
  const g = area.geometry;
  const rings = (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map(
    (p) => p[0]
  );
  const cells = [];
  for (let lat = 33; lat >= -33; lat -= 4)
    for (let lon = -15; lon <= 50; lon += 4)
      if (rings.some((r) => inRing(lon, lat, r))) cells.push([lon, lat]);
  const regionOf = ([lon, lat]) =>
    lat >= 18
      ? "northern"
      : lat <= -17
        ? "southern"
        : lon < 12 && lat > 3
          ? "western"
          : lon < 27
            ? "middle"
            : "eastern";
  // 56 cells spread over the whole continent, north to south.
  const spread = Array.from(
    { length: 56 },
    (_, k) => cells[Math.floor((k * cells.length) / 56)]
  );
  const features = spread.map((c, k) => ({
    type: "Feature",
    properties: {
      id: k < 54 ? `S${String(k + 1).padStart(2, "0")}` : `U${k - 53}`,
      counted: k < 54,
      region: regionOf(c),
      source: "Synthetic square for the engine's test",
      licence: "CC0",
    },
    geometry: square(...c),
  }));
  return features;
}
function naturalEarthStates(world) {
  const units = [...UN_54, ...UNCOUNTED];
  return world.features
    .filter((f) => units.includes(f.properties.ADM0_A3))
    .map((f) => ({
      type: "Feature",
      properties: {
        id: f.properties.ADM0_A3,
        name: f.properties.NAME_FR,
        counted: UN_54.includes(f.properties.ADM0_A3),
        source: NE,
        licence: PD,
      },
      geometry: f.geometry,
    }));
}
function writeData(dir, world) {
  const features = world ? naturalEarthStates(world) : syntheticStates();
  writeFileSync(
    join(dir, "etats.geojson"),
    JSON.stringify({ type: "FeatureCollection", features })
  );
  const states = (region) =>
    world
      ? M49[region].split(" ")
      : features
          .filter((f) => f.properties.region === region)
          .map((f) => f.properties.id);
  const breakdown = (values, source) => ({
    source,
    land: "etats.geojson",
    regions: Object.fromEntries(
      Object.entries(values).map(([id, value]) => [
        id,
        { value, states: states(id) },
      ])
    ),
  });
  writeFileSync(
    join(dir, "population-regions.json"),
    JSON.stringify(
      breakdown(
        PEOPLE,
        "ONU, World Population Prospects 2024, 2025, par région M49"
      )
    )
  );
  writeFileSync(
    join(dir, "langues-regions.json"),
    JSON.stringify(
      breakdown(LANGUAGES, "Glottolog 5.3, points des langues par région M49")
    )
  );
}

const sample = (id) =>
  structuredClone(
    JSON.parse(readFileSync(CARDS, "utf8")).cards.find((c) => c.id === id)
  );
const mapCard = (id, kicker, title, map, extra = {}) => ({
  id,
  type: "map",
  theme: "nuit",
  series: { id: "afrique-tout", episode: 1 },
  kicker,
  title,
  demo: DEMO,
  map: { sequence: "fig-114", ...map },
  ...extra,
});

export function figureCards() {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  const opener = sample("serie-afrique-tout-01");
  opener.demo = DEMO;
  return {
    version: deck.version,
    logo: deck.logo,
    cards: [
      opener,
      // Scene 1: the figure head, the cascade, people, one in five, the two
      // glasses, the speech bubbles.
      mapCard(
        "fig-chiffres",
        "Un continent entier",
        "De quoi parle-t-on ?",
        {
          view: { ...CONTINENT },
          areas: [{ ...AFRIQUE, states: [{ say: "54", to: "context" }] }],
          facts: [
            { say: "54 pays", shows: ["count:etats", "cascade:etats"] },
            {
              say: "milliard et demi d'habitants",
              shows: ["count:habitants", "units:habitants"],
            },
            {
              say: "personne sur cinq dans le monde",
              shows: ["count:un-sur-cinq", "row:un-sur-cinq"],
            },
            {
              say: "moitié des Africains a moins de 20 ans",
              shows: ["gauge:age-afrique"],
            },
            {
              say: "la moitié a moins de 31 ans",
              shows: ["gauge:age-monde"],
            },
            { say: "plus de", shows: ["count:langues", "units:langues"] },
          ],
          key: [],
          caption: {
            source: "ONU, World Population Prospects 2024 ; Glottolog 5.3",
          },
        },
        {
          figures: [
            { count: "cascade:etats", unit: "pays", say: "54" },
            {
              count: "units:habitants",
              per: 100000000,
              format: "population",
              unit: "d’habitants",
              say: "milliard",
            },
            {
              id: "un-sur-cinq",
              text: "1 sur 5",
              unit: "dans le monde",
              say: "personne",
              until: "moitié",
            },
            {
              pre: "plus de",
              count: "units:langues",
              per: 100,
              unit: "langues",
              say: "plus",
            },
          ],
          cascade: {
            id: "etats",
            states: "etats.geojson",
            say: "54",
            context: "milliard",
          },
          units: [
            {
              id: "habitants",
              kind: "person",
              value: 1500000000,
              per: 100000000,
              byRegion: "population-regions.json",
              say: "milliard",
              dim: "près",
              out: "moitié",
              key: "1 personnage = 100 millions d’habitants",
            },
            {
              id: "langues",
              kind: "bubble",
              value: 2000,
              per: 100,
              byRegion: "langues-regions.json",
              say: "plus",
              key: "1 bulle = 100 langues",
            },
          ],
          row: {
            id: "un-sur-cinq",
            of: 5,
            lit: 2,
            say: "personne",
            light: "cinq",
            out: "moitié",
          },
          gauges: [
            {
              id: "age-afrique",
              shape: "area:afrique",
              value: 20,
              scale: 60,
              label: "20 ans",
              name: "Afrique",
              say: "moitié",
              out: "Et",
            },
            {
              id: "age-monde",
              shape: "world",
              value: 31,
              scale: 60,
              label: "31 ans",
              name: "monde",
              // The voice's second « monde »: its first lowercase « la ».
              say: "la",
              out: "Et",
            },
          ],
        }
      ),
      // Scene 2: four readings pinned where their languages come from, and
      // the unknown origin stamped.
      mapCard(
        "fig-lectures",
        "D’où vient le mot",
        "Un coin de la Tunisie",
        {
          view: { lon: 22, lat: 36.4, radius: 1750 },
          areas: [{ ...AFRIQUE }],
          places: [
            {
              id: "carthage",
              name: "Carthage",
              at: POINTS.carthage,
              side: "left",
            },
          ],
          facts: [
            {
              say: "berbère phénicienne latine grecque",
              shows: ["text:berbère"],
            },
            {
              say: "Et l'origine du mot reste inconnue",
              shows: ["lettering:AFRICA", "stamp:inconnue"],
            },
          ],
          key: [],
          caption: { source: "S. Gsell ; W. Vycichl ; T. Kotula" },
        },
        {
          pins: [
            ["berbere", "berbère", "aures", 0.3],
            ["phenicienne", "phénicienne", "tyr", 0.12],
            ["latine", "latine", "rome", -0.15],
            ["grecque", "grecque", "athenes", 0.12],
          ].map(([id, name, from, bend]) => ({
            id,
            name,
            at: POINTS[from],
            to: "carthage",
            say: name,
            dim: "Et",
            bend,
            ...(["rome", "athenes"].includes(from) && { side: "above" }),
          })),
          letterings: [
            {
              text: "AFRICA",
              from: [6.5, 39.4],
              to: [14.5, 39.4],
              bend: 0.04,
              size: 50,
              say: "l'origine",
            },
          ],
          stamps: [
            { id: "inconnue", text: "?", at: [17.2, 42.6], say: "inconnue" },
          ],
        }
      ),
      // Scene 3: Léon l'Africain's book travels from Fès towards Europe.
      mapCard(
        "fig-livre",
        "Le nom s’étend",
        "Un coin de Tunisie, tout un continent ?",
        {
          view: { lon: 4, lat: 37, radius: 1500 },
          areas: [{ ...AFRIQUE }],
          places: [
            {
              id: "grenade",
              name: "Grenade",
              at: POINTS.grenade,
              say: "Grenade",
            },
            {
              id: "fes",
              name: "Fès",
              at: POINTS.fes,
              say: "Fès",
              side: "left",
            },
          ],
          words: [
            {
              text: "Léon l'Africain",
              kind: "name",
              at: [-5, 31.6],
              say: "Léon",
            },
            {
              text: "XVIe siècle",
              kind: "century",
              at: [-5, 30.4],
              say: "XVIe",
            },
            { text: "Europe", kind: "name", at: [10.5, 45.6], say: "Europe" },
          ],
          facts: [
            {
              say: "XVIe siècle Léon l'Africain",
              shows: ["text:XVIe", "text:Léon"],
            },
            {
              say: "description de l'Afrique",
              shows: ["travel:livre"],
            },
            {
              say: "qui sera longtemps la principale source de l'Europe",
              shows: ["travel:livre"],
            },
          ],
          key: [],
          caption: { source: "Salluste ; Pomponius Mela ; F. Cresti" },
        },
        {
          marks: [{ kind: "route", via: ["grenade", "fes"], say: "élevé" }],
          travel: [
            {
              id: "livre",
              drawing: "livre",
              from: "fes",
              via: [[3, 39.5]],
              to: POINTS.italie,
              say: "description",
              move: "longtemps",
            },
          ],
        }
      ),
      // Scene 4: the other names lettered across the lands they named;
      // Alkebulan stamped; Kemet over Egypt.
      mapCard(
        "fig-noms",
        "D’autres noms",
        "Libye, Éthiopie, Alkebulan, Kemet",
        {
          view: { ...CONTINENT },
          moves: [{ say: "Et", lon: 30, lat: 26.5, radius: 1285 }],
          areas: [{ ...AFRIQUE }],
          words: [
            {
              text: "A. Thevet, 1575",
              kind: "name",
              at: [23, -21],
              say: "Thevet",
              until: "Et",
            },
          ],
          facts: [
            { say: "Libye", shows: ["lettering:LIBYE"] },
            {
              say: "Éthiopie a longtemps nommé tout le sud du continent",
              shows: ["lettering:ÉTHIOPIE"],
            },
            {
              say: "Alkebulan sans citer de source",
              shows: ["lettering:ALKEBULAN", "stamp:sans-source"],
            },
            {
              say: "Et Kemet était le nom de l'Égypte",
              shows: ["lettering:KEMET"],
            },
          ],
          key: [],
          caption: {
            source: "Pline ; Hérodote ; A. Thevet, 1575 ; A. Gardiner",
          },
        },
        {
          letterings: [
            {
              text: "LIBYE",
              from: [-12, 22],
              to: [30, 22],
              bend: 0.1,
              say: "Libye",
              dim: "Alkebulan",
              out: "Et",
            },
            {
              text: "ÉTHIOPIE",
              from: [4, -3],
              to: [42, -3],
              bend: 0.1,
              say: "Éthiopie",
              dim: "Alkebulan",
              out: "Et",
            },
            {
              text: "ALKEBULAN",
              from: [-6, 13],
              to: [40, 13],
              bend: 0.06,
              size: 64,
              say: "Alkebulan",
              out: "Et",
            },
            {
              text: "KEMET",
              from: [25.5, 27.2],
              to: [35, 27.2],
              bend: 0.05,
              size: 64,
              say: "Kemet",
            },
          ],
          stamps: [
            {
              id: "sans-source",
              text: "sans source",
              at: [17, 5.5],
              say: "source",
              out: "Et",
            },
          ],
        }
      ),
      // Scene 5: no common name from inside, an empty name frame; then
      // « AFRIQUE » brought from outside along the arrow from the north.
      mapCard(
        "fig-cadre",
        "Sur place",
        "Un nom venu de l’extérieur",
        {
          view: { ...CONTINENT },
          areas: [{ ...AFRIQUE }],
          arrows: [
            {
              id: "dehors",
              from: [11, 39.5],
              to: [15.5, 24],
              foreign: true,
              say: "Le",
              bend: 0.08,
            },
          ],
          facts: [
            {
              say: "ne montrent pas de nom commun venu de l'intérieur pour tout le continent",
              shows: ["frame:cadre"],
            },
            {
              say: "Le nom qui s'est imposé pour tout le continent a donc été étendu depuis l'extérieur",
              shows: ["arrow:dehors", "frame:cadre"],
            },
          ],
          key: [{ swatch: "arrow-w", label: "Un nom venu de l'extérieur" }],
          caption: {
            source: "Africa Check (2017) ; A. Mazrui ; A. Thevet ; A. Gardiner",
          },
        },
        {
          headline: {
            lines: ["Étendu depuis", "[[l'extérieur]]"],
            say: "étendu",
            until: "l'extérieur",
          },
          frame: {
            id: "cadre",
            at: [18.2, 1],
            say: "montrent",
            fill: { text: "AFRIQUE", along: "arrow:dehors", say: "étendu" },
          },
        }
      ),
      sample("serie-afrique-tout-07"),
    ],
  };
}

const chunks = (list) => list.map(([text, duration]) => ({ text, duration }));
export const FIGURE_SCRIPT = [
  {
    card: "serie-afrique-tout-01",
    chunks: chunks([
      ["Aujourd'hui, nous allons parler", 2.0],
      ["de l'origine du nom Afrique.", 2.0],
    ]),
  },
  {
    card: "fig-chiffres",
    chunks: chunks([
      ["D'abord, de quoi parle-t-on ?", 1.8],
      ["De 54 pays.", 2.2],
      ["D'un milliard et demi d'habitants,", 2.0],
      ["près d'une personne sur cinq", 1.6],
      ["dans le monde.", 1.4],
      ["La moitié des Africains", 1.4],
      ["a moins de 20 ans ;", 1.8],
      ["dans le monde, la moitié", 1.6],
      ["a moins de 31 ans.", 1.8],
      ["Et de plus de 2 000 langues.", 2.8],
    ]),
  },
  {
    card: "fig-lectures",
    chunks: chunks([
      ["D'autres lectures existent :", 1.8],
      ["berbère, phénicienne, latine, grecque.", 3.8],
      ["Et l'origine du mot reste inconnue.", 3.4],
    ]),
  },
  {
    card: "fig-livre",
    chunks: chunks([
      ["Au XVIe siècle, Léon l'Africain,", 2.6],
      ["un lettré né à Grenade", 1.3],
      ["et élevé à Fès,", 1.5],
      ["écrit une description de l'Afrique", 1.8],
      ["qui sera longtemps", 0.9],
      ["la principale source de l'Europe.", 2.6],
    ]),
  },
  {
    card: "fig-noms",
    chunks: chunks([
      ["Pourtant, d'autres noms ont circulé.", 2.6],
      ["Les Grecs disaient « Libye ».", 3.2],
      ["« Éthiopie » a longtemps nommé", 2.0],
      ["tout le sud du continent.", 2.0],
      ["En 1575, le cosmographe français", 3.8],
      ["André Thevet écrit que", 1.8],
      ["les Arabes et les Éthiopiens", 1.4],
      ["l'appellent « Alkebulan », sans citer de source.", 3.6],
      ["Et « Kemet » était", 1.3],
      ["le nom de l'Égypte.", 2.4],
    ]),
  },
  {
    card: "fig-cadre",
    chunks: chunks([
      ["Les sources que nous avons lues", 1.8],
      ["ne montrent pas de nom commun,", 1.8],
      ["venu de l'intérieur,", 1.2],
      ["pour tout le continent.", 1.9],
      ["Le nom qui s'est imposé", 1.3],
      ["pour tout le continent", 1.3],
      ["a donc été étendu depuis l'extérieur.", 3.0],
    ]),
  },
  { card: "serie-afrique-tout-07", chunks: closingChunks() },
];

// `world` (Natural Earth's countries) draws the real states; `deck(deck)`,
// `script(beats)` and `edit(input)` change the piece before it is written.
export function figuresDemo(
  dir,
  { world = null, deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  mkdirSync(dir, { recursive: true });
  writeData(dir, world);
  writeFileSync(
    join(dir, "cards.json"),
    JSON.stringify(deck(figureCards()), null, 2)
  );
  const beats = script(structuredClone(FIGURE_SCRIPT));
  writeSyntheticVoice(dir, beats);
  const input = {
    design: "EthniAfrica Cartes 1.14.0-proposition (démonstration)",
    demo: DEMO,
    cards: "cards.json",
    tier: "medium",
    beats: beats.map((b) => ({
      card: b.card,
      chunks: b.chunks.map(({ text }) => ({ text })),
    })),
    ending: {},
    voice: { audio: "voice.wav", words: "words.json" },
  };
  edit(input);
  return input;
}

// node social/video/fixtures/series-figures.mjs --out DIR [--world FILE]
// writes the piece, ready for series-render.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out");
  if (at < 0)
    throw new Error("Usage: series-figures.mjs --out DIR [--world FILE]");
  const dir = resolve(process.argv[at + 1]);
  const w = process.argv.indexOf("--world");
  const world =
    w > 0 ? JSON.parse(readFileSync(process.argv[w + 1], "utf8")) : null;
  const input = figuresDemo(dir, { world });
  writeFileSync(
    join(dir, "series.sequence.json"),
    JSON.stringify(input, null, 2) + "\n"
  );
  console.log(join(dir, "series.sequence.json"));
}
