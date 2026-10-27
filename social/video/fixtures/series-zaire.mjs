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

// node social/video/fixtures/series-zaire.mjs --out DIR writes the piece,
// ready for series-render.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out");
  if (at < 0) throw new Error("Usage: series-zaire.mjs --out DIR");
  const dir = resolve(process.argv[at + 1]);
  const input = zaireDemo(dir);
  writeFileSync(
    join(dir, "series.sequence.json"),
    JSON.stringify(input, null, 2) + "\n"
  );
  console.log(join(dir, "series.sequence.json"));
}
