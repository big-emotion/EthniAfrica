// Cartes 1.16.0, maps understood without reading, on two plans of the
// canvas « Zaïre — symboles des cartes » (boards S1 and S6,
// https://claude.ai/artifact/5eUf5zVorYqaSky3ZebWoT): the Zaïre flag planted
// on the lit DR Congo and swapped for the DR Congo flag in 1997, then the
// Kongo king, the Portuguese caravel and the word « nzadi » becoming
// « Zaïre ». Demonstration text on a synthetic silent voice; the area is the
// repository's Natural Earth polygon of the DR Congo.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CARDS, closingChunks, writeSyntheticVoice } from "./series-pays.mjs";

const DEMO = "Démonstration : texte non validé";
const RDC = {
  file: "cod-rdc.geojson",
  id: "rdc",
  name: "République démocratique du Congo",
  ink: "a",
};

const mapCard = (id, kicker, title, map) => ({
  id,
  type: "map",
  theme: "nuit",
  series: { id: "pays", episode: 1 },
  kicker,
  title,
  demo: DEMO,
  map: { sequence: "zaire", ...map },
});

// Board S1: the country lit, the Zaïre flag planted on « Zaïre », folded
// on « 1997 » while the DR Congo flag rises; the two dates as numbers.
export const FLAG_MAP = {
  view: { lon: 23.6, lat: -3.2, radius: 2700 },
  areas: [{ ...RDC, say: "Congo" }],
  drawings: [
    {
      flag: "zar",
      at: [23.6, -2.6],
      say: "Zaïre",
      swap: { flag: "cod", say: "1997" },
    },
  ],
  words: [
    { text: "1971", kind: "date", at: [17.2, -0.4], say: "1971" },
    { text: "1997", kind: "date", at: [28.6, -7.4], say: "1997" },
  ],
  facts: [
    { say: "1971, le Congo devient", shows: ["text:1971"] },
    { say: "Zaïre, sous Mobutu", shows: ["flag:zar"] },
    { say: "le nom de Congo", shows: ["flag:cod", "text:1997"] },
  ],
  caption: {
    source: "Natural Earth ; drapeaux d'après les descriptions officielles",
  },
};

// Board S6: the king at Mbanza Kongo, the caravel off the estuary, and the
// people's word that the Portuguese hear as « Zaïre ».
export const WORD_MAP = {
  view: { lon: 13.4, lat: -6.0, radius: 4000 },
  areas: [{ ...RDC, states: [{ say: "Kongo", to: "context" }] }],
  drawings: [
    { kind: "roi", at: [15.4, -5.0], say: "royaume" },
    { kind: "caravelle", at: [10.6, -5.0], say: "Portugais" },
    {
      kind: "parole",
      word: "nzadi",
      at: [13.4, -7.6],
      say: "disent",
      morph: { word: "Zaïre", say: "Zaïre", to: [12.3, -7.6] },
    },
  ],
  facts: [
    { say: "royaume du Kongo", shows: ["illus:roi"] },
    { say: "Portugais arrivent en 1482", shows: ["illus:caravelle"] },
    { say: "disent nzadi, le grand fleuve", shows: ["illus:parole"] },
    { say: "entendent Zaïre", shows: ["illus:parole"] },
  ],
  caption: { source: "W. H. Bentley, 1887 ; Natural Earth" },
};

export function zaireCards() {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  const sample = (id) => structuredClone(deck.cards.find((c) => c.id === id));
  return {
    version: deck.version,
    logo: deck.logo,
    cards: [
      sample("serie-pays-01"),
      mapCard(
        "zaire-drapeaux",
        "1971",
        "Un nouveau nom",
        structuredClone(FLAG_MAP)
      ),
      mapCard(
        "zaire-mot",
        "Le fleuve",
        "Un mot entendu",
        structuredClone(WORD_MAP)
      ),
      sample("serie-pays-07"),
    ],
  };
}

export const ZAIRE_SCRIPT = [
  {
    card: "serie-pays-01",
    chunks: [
      { text: "Aujourd'hui, l'origine du nom", duration: 2.2 },
      { text: "d'un grand pays d'Afrique.", duration: 2.2 },
    ],
  },
  {
    card: "zaire-drapeaux",
    chunks: [
      { text: "En 1971, le Congo devient", duration: 2.0 },
      { text: "le Zaïre, sous Mobutu.", duration: 2.2 },
      { text: "En 1997, le pays reprend", duration: 2.0 },
      { text: "le nom de Congo.", duration: 2.4 },
    ],
  },
  {
    card: "zaire-mot",
    chunks: [
      { text: "Au royaume du Kongo,", duration: 1.8 },
      { text: "les Portugais arrivent en 1482.", duration: 2.4 },
      { text: "Les habitants disent nzadi,", duration: 2.0 },
      { text: "le grand fleuve.", duration: 1.6 },
      { text: "Les Portugais entendent Zaïre.", duration: 2.4 },
      { text: "Le nom part sur leurs cartes.", duration: 2.4 },
    ],
  },
  { card: "serie-pays-07", chunks: closingChunks() },
];

// `deck(deck)`, `script(beats)` and `edit(input)` change the piece before
// it is written.
export function zaireDemo(
  dir,
  { deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "cards.json"),
    JSON.stringify(deck(zaireCards()), null, 2)
  );
  const beats = script(structuredClone(ZAIRE_SCRIPT));
  writeSyntheticVoice(dir, beats);
  const input = {
    design: "EthniAfrica Cartes 1.16.0-proposition (démonstration)",
    demo: DEMO,
    cards: "cards.json",
    // 1.16.0: the only words written on these maps, besides dates.
    studiedWords: ["nzadi", "Zaïre"],
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

// ---------------------------------------------------------------------------
// Narration v4 (approved 27 October 2026), boards S8 to S14 of the same
// canvas: the sea route to the Indies stopping at the Congo's mouth, the six
// provinces with their lords linked to the king, four illustrated scenes on
// parchment, and the enriched chapter card. Demonstration voice, the
// narration's own sentences.

// Board S8: Lisbon to Calicut round Africa, every stop at sea; the stop at
// the Congo's mouth stands off Soyo, in the estuary.
export const ROUTE_PLACES = [
  { id: "lisbonne", name: "Lisbonne", at: [-9.14, 38.72] },
  { id: "embouchure", name: "Embouchure du Congo", at: [11.95, -6.05] },
  { id: "calicut", name: "Calicut", at: [75.78, 11.25] },
];
export const SEA_ROUTE = {
  kind: "route",
  sea: true,
  via: [
    "lisbonne",
    [-12, 37],
    [-15.5, 33.5],
    [-19.5, 30],
    [-20.5, 25],
    [-19.5, 18],
    [-20.5, 13],
    [-17, 8],
    [-10, 3.5],
    [-2, 3],
    [2, 2],
    [4, -3],
    [9, -4],
    [10.8, -5.5],
    "embouchure",
    [11.2, -9],
    [10.5, -16],
    [12.5, -24],
    [15.5, -33],
    [19.5, -36.5],
    [27, -35.5],
    [34, -29],
    [39, -24],
    [41.3, -17],
    [41.8, -12.5],
    [42.5, -6],
    [44, -1],
    [53, 8],
    [62, 11],
    [70, 11.5],
    "calicut",
  ],
  say: "Portugal",
  ink: "a",
  highlight: {
    to: "embouchure",
    say: "navigateurs",
    until: "embouchure",
    ship: "caravelle",
  },
};
export const ROUTE_MAP = {
  view: { lon: 32, lat: 23, radius: 430 },
  // The view closes in on the stop in two moves, 2.5 times each at most.
  moves: [
    { say: "fleuve", lon: 18, lat: 0, radius: 1075 },
    { say: "océan", lon: 12.6, lat: -6.0, radius: 2687 },
  ],
  areas: [],
  places: structuredClone(ROUTE_PLACES),
  drawings: [{ kind: "epices", at: [77, 14], say: "route", until: "fleuve" }],
  // The date once the camera turns to the stop, clear of the ship.
  words: [{ text: "1482", kind: "date", at: [5, -10], say: "Congo" }],
  facts: [
    { say: "route vers les Indes", shows: ["illus:epices"] },
    { say: "en caravelle", shows: ["illus:caravelle"] },
    { say: "atteint l'embouchure", shows: ["illus:caravelle"] },
  ],
  caption: {
    source:
      "route maritime schématique, le long des côtes ; Natural Earth (domaine public)",
  },
};
// The hand-drawn circle round the stop, once the ship has reached it.
export const STOP_CIRCLE = { kind: "circle", at: "embouchure", say: "Congo" };

// Board S9: the six provinces (areas.mjs, estimation) in six inks, the king
// at Mbanza Kongo and a lord on each province, linked to him in gold.
const PROVINCE_INKS = {
  "kongo-soyo": ["Soyo", "a"],
  "kongo-mbamba": ["Mbamba", "b"],
  "kongo-mpemba": ["Mpemba", "c"],
  "kongo-nsundi": ["Nsundi", "d"],
  "kongo-mpangu": ["Mpangu", "e"],
  "kongo-mbata": ["Mbata", "f"],
};
export const MBANZA_KONGO = [14.24, -6.27];
export const PROVINCES_MAP = {
  view: { lon: 14.7, lat: -6.4, radius: 4900 },
  areas: Object.entries(PROVINCE_INKS).map(([id, [name, ink]]) => ({
    file: `${id}.geojson`,
    id,
    name,
    ink,
    say: "compte",
  })),
  drawings: [{ kind: "roi", at: MBANZA_KONGO, say: "royaume" }],
  key: [{ swatch: "approximate", label: "Provinces (estimation)" }],
  facts: [
    { say: "six provinces", shows: ["area:kongo-soyo"] },
    { say: "Chacune est dirigée par un seigneur", shows: ["lords:seigneurs"] },
    { say: "nommé par le roi", shows: ["illus:roi"] },
  ],
  caption: {
    source:
      "zones approximatives (estimation) d'après J. Vansina, Histoire générale de l'Afrique, UNESCO, vol. IV p. 621",
  },
};
export const LORDS = {
  kind: "lords",
  id: "seigneurs",
  king: MBANZA_KONGO,
  areas: [
    "kongo-soyo",
    "kongo-mbamba",
    "kongo-nsundi",
    "kongo-mpangu",
    "kongo-mbata",
  ],
  say: "Chacune",
  linkSay: "nommé",
};

// Boards S10 to S13: the scenes, on parchment, each part moving on its word.
const parchmentCard = (id, kicker, fields) => ({
  id,
  type: "explanation",
  theme: "nuit",
  series: { id: "pays", episode: 1 },
  kicker,
  demo: DEMO,
  ground: "parchment",
  ...fields,
});
export const SCENES = {
  conseil: {
    kind: "conseil",
    say: "roi",
    beats: { hands: "conseil", crown: "membres" },
  },
  nzimbu: {
    kind: "nzimbu",
    say: "Pour",
    beats: { give: "commercer", receive: "coquillages" },
  },
  bapteme: {
    kind: "bapteme",
    say: "1491",
    beats: { cross: "Portugal", water: "baptiser" },
  },
  echanges: {
    kind: "echanges",
    say: "Commencent",
    beats: { ships: "alors" },
  },
};

export const V4_TITLE = "D'où vient le nom *Zaïre* ?";
export const V4_CHAPTERS = [
  { title: "La route des Indes" },
  { title: "Le royaume du Kongo" },
  { title: "Le nom du fleuve" },
];

export function zaireV4Cards() {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  const sample = (id) => structuredClone(deck.cards.find((c) => c.id === id));
  const opener = sample("serie-pays-01");
  opener.title = V4_TITLE;
  opener.kicker = "Hors-série";
  const route = mapCard(
    "zaire-route",
    "XVe siècle",
    "La route des Indes",
    structuredClone(ROUTE_MAP)
  );
  route.map.sequence = "route";
  route.marks = [structuredClone(SEA_ROUTE), structuredClone(STOP_CIRCLE)];
  const provinces = mapCard(
    "zaire-provinces",
    "Le royaume du Kongo",
    "Six provinces",
    structuredClone(PROVINCES_MAP)
  );
  provinces.map.sequence = "kongo";
  provinces.marks = [structuredClone(LORDS)];
  return {
    version: deck.version,
    logo: deck.logo,
    cards: [
      opener,
      route,
      provinces,
      parchmentCard("zaire-conseil", "Le conseil", {
        date: "12",
        dateSay: "douze",
        scene: structuredClone(SCENES.conseil),
        source:
          "Histoire générale de l'Afrique, UNESCO, vol. V p. 606, d'après A. Hilton",
      }),
      parchmentCard("zaire-nzimbu", "Le marché", {
        date: "nzimbu",
        dateSay: "nzimbu",
        scene: structuredClone(SCENES.nzimbu),
        source: "Histoire générale de l'Afrique, UNESCO, vol. V p. 610",
      }),
      parchmentCard("zaire-bapteme", "Mbanza Kongo", {
        date: "1491",
        dateSay: "1491",
        scene: structuredClone(SCENES.bapteme),
        source: "R. de Pina et G. de Resende (Brásio, Monumenta, I)",
      }),
      parchmentCard("zaire-echanges", "Deux royaumes", {
        scene: structuredClone(SCENES.echanges),
        source: "E. G. Ravenstein, 1900",
      }),
      mapCard(
        "zaire-mot",
        "Le fleuve",
        "Un mot entendu",
        structuredClone(WORD_MAP)
      ),
      sample("serie-pays-07"),
    ],
  };
}

// About 15 characters a second, the narration v4's sentences.
const said = (texts) =>
  texts.map((text) => ({
    text,
    duration: Math.round(([...text].length / 15) * 100) / 100,
  }));
export const ZAIRE_V4_SCRIPT = [
  {
    card: "serie-pays-01",
    chunks: said(["Le 27 octobre 1971,", "le Congo devient le Zaïre."]),
  },
  { chapter: 1, silence: 3.2 },
  {
    card: "zaire-route",
    chunks: said([
      "Au XVe siècle, le Portugal",
      "cherche une route vers les Indes.",
      "Ses navigateurs longent les côtes",
      "de l'Afrique en caravelle.",
      "Vers 1482-1483, l'un d'eux,",
      "Diogo Cão, atteint l'embouchure",
      "du fleuve Congo, là où",
      "le fleuve se jette",
      "dans l'océan Atlantique.",
    ]),
  },
  { chapter: 2, silence: 3.2 },
  {
    card: "zaire-provinces",
    chunks: said([
      "Le royaume compte six provinces.",
      "Chacune est dirigée par un seigneur,",
      "appelé le mani,",
      "nommé par le roi.",
    ]),
  },
  {
    card: "zaire-conseil",
    chunks: said([
      "Le roi lui-même est élu",
      "par un conseil royal",
      "de douze membres,",
      "dont quatre femmes.",
    ]),
  },
  {
    card: "zaire-nzimbu",
    chunks: said([
      "Pour commercer, on paie",
      "avec des coquillages, les nzimbu.",
    ]),
  },
  {
    card: "zaire-bapteme",
    chunks: said([
      "En 1491, il s'allie",
      "au Portugal et se fait baptiser",
      "dans sa capitale, Mbanza Kongo.",
    ]),
  },
  {
    card: "zaire-echanges",
    chunks: said([
      "Commencent alors de nombreux échanges",
      "entre les deux royaumes.",
    ]),
  },
  { chapter: 3, silence: 3.2 },
  {
    card: "zaire-mot",
    chunks: said([
      "Au royaume du Kongo,",
      "les Portugais arrivent en 1482.",
      "Les habitants disent nzadi,",
      "le grand fleuve.",
      "Les Portugais entendent Zaïre.",
      "Le nom part sur leurs cartes,",
      "et le fleuve garde ce nom",
      "pendant des siècles.",
    ]),
  },
  { card: "serie-pays-07", chunks: closingChunks() },
];

export function zaireV4Demo(
  dir,
  { deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "cards.json"),
    JSON.stringify(deck(zaireV4Cards()), null, 2)
  );
  const beats = script(structuredClone(ZAIRE_V4_SCRIPT));
  writeSyntheticVoice(dir, beats);
  const input = {
    design:
      "EthniAfrica Cartes 1.16.0-proposition, narration v4 (démonstration)",
    demo: DEMO,
    cards: "cards.json",
    studiedWords: ["nzadi", "Zaïre", "nzimbu"],
    chapters: structuredClone(V4_CHAPTERS),
    beats: beats.map((b) =>
      b.chapter
        ? { type: "chapter", chapter: b.chapter }
        : { card: b.card, chunks: b.chunks.map(({ text }) => ({ text })) }
    ),
    ending: {},
    voice: { audio: "voice.wav", words: "words.json" },
  };
  edit(input);
  return input;
}

// node social/video/fixtures/series-zaire.mjs --out DIR [--v4] writes the
// piece, ready for series-render.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out");
  if (at < 0) throw new Error("Usage: series-zaire.mjs --out DIR [--v4]");
  const dir = resolve(process.argv[at + 1]);
  const input = process.argv.includes("--v4")
    ? zaireV4Demo(dir)
    : zaireDemo(dir);
  writeFileSync(
    join(dir, "series.sequence.json"),
    JSON.stringify(input, null, 2) + "\n"
  );
  console.log(join(dir, "series.sequence.json"));
}
