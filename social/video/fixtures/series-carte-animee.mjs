// The animated satellite map (Cartes 1.11.0) on the boards' plans: the
// opening globe, the Mossi, 1932 and 1984, as Claude Design drew them from
// the animatic of the Burkina Faso episode (series 1, episode 19), on a
// synthetic silent voice timed like the boards' subtitles. The text is the
// boards' demonstration text, under the demo tape; the areas are the
// repository's files (social/video/data/areas/), built from the episode's
// research. The Mossi plan's views are closer than the 2 km imagery allows,
// so the sequence draws on the 500 m mosaic.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CARDS, closingChunks, writeSyntheticVoice } from "./series-pays.mjs";

const DEMO = "Démonstration : texte non validé";
const BFA = { lon: -1.57, lat: 12.25 };
// The 2 km file's closest view, just inside its 1.5 limit (1336 km across).
const LIMIT = 5150;
const MOSSI_SOURCE =
  "M. Izard ; Encyclopædia Universalis ; aires approximatives";

const mapCard = (id, kicker, title, map) => ({
  id,
  type: "map",
  theme: "nuit",
  series: { id: "pays", episode: 1 },
  kicker,
  title,
  demo: DEMO,
  map: { sequence: "burkina", ...map },
});

// The Mossi plan of video-1110-mossi.jpg and its six facts
// (video-1110-sans-le-son.jpg, after).
export const MOSSI_MAP = {
  view: { lon: -2.2, lat: 11.6, radius: 3300 },
  moves: [{ say: "cavaliers", lon: -1.2, lat: 12.15, radius: 6600 }],
  areas: [
    {
      file: "bfa-burkina-faso.geojson",
      name: "Burkina Faso",
      ink: "a",
      label: "none",
      states: [{ say: "Mossi", to: "context" }],
    },
    {
      file: "bfa-mamprugu.geojson",
      id: "mamprugu",
      name: "Royaume mamprusi",
      people: "mossi",
      say: "venus",
      // The board placed it at 9.9° N, at the map band's edge; 0.15° further
      // north the 1.13.0 push keeps it in the band to the end of the plan.
      nameAt: [0.3, 10.05],
      states: [{ say: "XVe", to: "context" }],
    },
    {
      file: "bfa-mossi-tenkodogo.geojson",
      id: "tenkodogo",
      name: "Tenkodogo",
      people: "mossi",
      say: "fondent",
      nameAt: [0.85, 11.62],
    },
    {
      file: "bfa-mossi-ouagadougou.geojson",
      id: "ouaga",
      name: "Royaume de Ouagadougou",
      people: "mossi",
      say: "royaumes",
      nameAt: [-3.4, 11.75],
    },
    {
      file: "bfa-mossi-yatenga.geojson",
      id: "yatenga",
      name: "Yatenga",
      people: "mossi",
      say: "mossi",
      nameAt: [-3.55, 14.15],
    },
  ],
  arrows: [
    {
      id: "gambaga-tenkodogo",
      from: [-0.442, 10.53],
      to: [-0.37, 11.6],
      people: "mossi",
      say: "fondent",
      bend: -0.3,
      trace: "XVe",
    },
    {
      id: "tenkodogo-ouaga",
      from: [-0.5, 11.75],
      to: [-1.45, 12.2],
      people: "mossi",
      say: "royaumes",
      bend: 0.25,
      trace: "XVe",
    },
    {
      id: "ouaga-yatenga",
      from: [-1.7, 12.6],
      to: [-2.3, 13.45],
      people: "mossi",
      say: "mossi",
      bend: -0.25,
      trace: "XVe",
    },
  ],
  drawings: [{ kind: "cavaliers", at: [-3.2, 10.2], say: "ancêtres" }],
  words: [
    {
      text: "mooré",
      at: [-1.6, 14.0],
      say: "Mossi",
      until: "cavaliers",
    },
    {
      text: "princesse Yennenga",
      at: [0.9, 13.3],
      say: "avec",
      until: "royaumes",
    },
    {
      text: "XVe siècle",
      kind: "century",
      at: [0.45, 13.85],
      say: "vers",
    },
  ],
  places: [
    { name: "Gambaga", at: [-0.442, 10.53], say: "venus", side: "left" },
  ],
  facts: [
    { say: "parlent le mooré", shows: ["text:mooré"] },
    { say: "leurs ancêtres sont des cavaliers", shows: ["illus:cavaliers"] },
    {
      say: "venus du nord du Ghana actuel",
      shows: ["area:mamprugu", "text:Gambaga"],
    },
    { say: "avec la princesse Yennenga", shows: ["text:Yennenga"] },
    {
      say: "Ils fondent les royaumes mossi",
      shows: [
        "area:tenkodogo",
        "area:ouaga",
        "area:yatenga",
        "arrow:gambaga-tenkodogo",
      ],
    },
    {
      say: "vers la fin du XVe siècle, selon Michel Izard",
      shows: ["text:XVe"],
    },
  ],
  key: [
    { swatch: "uncertain-a", label: "Royaumes (aires approximatives)" },
    { swatch: "arrow-a", label: "Chemin des Mossi" },
  ],
  caption: { source: MOSSI_SOURCE },
};

const PARTS = [
  [
    "bfa-hv32-cote-divoire.geojson",
    "Rattaché à la colonie de Côte d'Ivoire",
    "c",
  ],
  ["bfa-hv32-soudan.geojson", "Rattaché au Soudan français", "d"],
  ["bfa-hv32-niger.geojson", "Rattaché au Niger", "b"],
];
// The 1932 plan of video-1110-1932.jpg: Haute-Volta split into three, each
// part first in the ink it had, then in its colony's.
export const SPLIT_MAP = {
  view: { lon: BFA.lon, lat: BFA.lat, radius: LIMIT },
  moves: [{ say: "partage", lon: -2.0, lat: 11.8, radius: 3250 }],
  areas: [
    {
      file: "bfa-haute-volta.geojson",
      id: "haute-volta",
      name: "Haute-Volta",
      ink: "a",
      nameAt: [-1.55, 12.55],
      states: [
        { say: "partage", to: "out" },
        { say: "1947", to: "lit" },
      ],
    },
    ...PARTS.map(([file, name, ink]) => ({
      file,
      name,
      ink: "a",
      label: "none",
      say: "partage",
      states: [
        { say: "colonies", to: `ink:${ink}` },
        { say: "1947", to: "out" },
      ],
    })),
  ],
  arrows: [
    {
      id: "vers-cote-divoire",
      from: [-3.4, 11.2],
      to: [-6.0, 9.4],
      ink: "c",
      say: "Côte",
      bend: 0.1,
      trace: "travailleurs",
      out: "1947",
    },
    {
      id: "vers-soudan",
      from: [-3.0, 13.9],
      to: [-4.3, 15.6],
      ink: "d",
      say: "Soudan",
      bend: 0.1,
      trace: "travailleurs",
      out: "1947",
    },
    {
      id: "vers-niger",
      from: [1.0, 13.3],
      to: [2.9, 14.4],
      ink: "b",
      say: "Niger",
      bend: 0.1,
      trace: "travailleurs",
      out: "1947",
    },
    {
      id: "travailleurs",
      from: [-1.52, 12.1],
      to: [-4.0, 7.6],
      people: "mossi",
      say: "travailleurs",
      bend: -0.2,
      out: "1947",
    },
  ],
  drawings: [
    {
      kind: "travailleurs",
      at: [0.3, 8.8],
      say: "envoyer",
      until: "1947",
      label: "travailleurs mossi",
    },
  ],
  words: [
    {
      text: "Côte d'Ivoire",
      kind: "name",
      ink: "c",
      at: [-6.7, 8.85],
      say: "Côte",
      until: "1947",
    },
    {
      text: "Soudan français",
      kind: "name",
      ink: "d",
      // 0.15° south of the board's place, for the 1.13.0 push.
      at: [-4.5, 16],
      say: "Soudan",
      until: "1947",
    },
    {
      text: "Niger",
      kind: "name",
      ink: "b",
      at: [3.2, 14.95],
      say: "Niger",
      until: "1947",
    },
    {
      text: "plantations",
      at: [-6.2, 7.6],
      say: "plantations",
      until: "1947",
    },
    { text: "1947", kind: "date", at: [-2.8, 11.2], say: "1947" },
  ],
  facts: [
    {
      say: "partage entre trois colonies voisines",
      shows: [
        "area:bfa-hv32-cote-divoire",
        "area:bfa-hv32-soudan",
        "area:bfa-hv32-niger",
      ],
    },
    {
      say: "des travailleurs mossi",
      shows: ["illus:travailleurs", "arrow:travailleurs"],
    },
    {
      say: "En 1947, la Haute-Volta est recréée",
      shows: ["text:1947", "area:haute-volta"],
    },
  ],
  caption: {
    source: "décret du 5 septembre 1932 ; limites des cercles approximatives",
  },
};

// The 1984 plan of video-1110-1984.jpg, variant B: the old name steps aside
// with its dates, the new one takes the outline.
export const RENAME_MAP = {
  view: { lon: BFA.lon, lat: BFA.lat, radius: LIMIT },
  areas: [
    {
      file: "bfa-burkina-faso.geojson",
      name: "Burkina Faso",
      ink: "a",
      label: "none",
      states: [{ say: "presque", to: "lit" }],
    },
  ],
  words: [
    {
      text: "frontières gardées",
      at: [-1.6, 11.35],
      say: "frontières",
      until: "août",
    },
    { text: "4 août 1984", kind: "date", at: [-1.6, 10.4], say: "août" },
  ],
  rename: {
    from: "HAUTE-VOLTA",
    to: "BURKINA FASO",
    dates: "de 1919 à 1984",
    at: [-1.6, 12.45],
    say: "nom",
  },
  facts: [
    {
      say: "il garde les frontières héritées de la colonie",
      shows: ["text:frontières", "area:burkina-faso"],
    },
    { say: "un nouveau nom", shows: ["text:HAUTE-VOLTA", "text:BURKINA FASO"] },
  ],
  caption: { source: "ordonnance n° 84-043/CNR/PRES du 2 août 1984" },
};

export function animatedCards() {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  const sample = (id) => structuredClone(deck.cards.find((c) => c.id === id));
  const opener = sample("serie-pays-01");
  delete opener.image;
  delete opener.credit;
  delete opener.imageAlt;
  Object.assign(opener, {
    demo: DEMO,
    opening: "globe",
    map: {
      sequence: "burkina",
      view: { lon: BFA.lon, lat: BFA.lat, radius: LIMIT },
      areas: [
        {
          file: "bfa-burkina-faso.geojson",
          id: "burkina-faso",
          name: "BURKINA FASO",
          ink: "a",
          label: "country",
          nameAt: [-1.6, 12.4],
          say: "Faso",
        },
      ],
    },
  });
  // One name, one ink across the sequence: the opener's « BURKINA FASO »
  // names the same file in the later plans.
  for (const map of [MOSSI_MAP, RENAME_MAP])
    for (const a of map.areas)
      if (a.file === "bfa-burkina-faso.geojson")
        Object.assign(a, { name: "BURKINA FASO", id: "burkina-faso" });
  return {
    version: deck.version,
    logo: deck.logo,
    cards: [
      opener,
      mapCard(
        "carte-animee-mossi",
        "Les Mossi",
        "Des cavaliers venus du sud",
        structuredClone(MOSSI_MAP)
      ),
      mapCard(
        "carte-animee-1932",
        "1932",
        "La Haute-Volta partagée",
        structuredClone(SPLIT_MAP)
      ),
      mapCard(
        "carte-animee-1984",
        "1984",
        "Un nouveau nom",
        structuredClone(RENAME_MAP)
      ),
      sample("serie-pays-07"),
    ],
  };
}

// The boards' subtitles, each chunk lasting about as long as on the board.
export const ANIMATED_SCRIPT = [
  {
    card: "serie-pays-01",
    chunks: [
      { text: "Aujourd'hui, nous allons parler de l'origine", duration: 2.6 },
      { text: "du nom Burkina Faso.", duration: 2.9 },
    ],
  },
  {
    card: "carte-animee-mossi",
    chunks: [
      { text: "Les Mossi, qui parlent le mooré,", duration: 1.6 },
      { text: "racontent que leurs ancêtres", duration: 1.4 },
      { text: "sont des cavaliers", duration: 1.4 },
      { text: "venus du nord du Ghana actuel,", duration: 1.6 },
      { text: "avec la princesse Yennenga", duration: 1.4 },
      { text: "et son fils.", duration: 0.8 },
      { text: "Ils fondent les royaumes mossi,", duration: 4.0 },
      { text: "vers la fin du XVe siècle,", duration: 1.5 },
      { text: "selon Michel Izard.", duration: 1.3 },
    ],
  },
  {
    card: "carte-animee-1932",
    chunks: [
      { text: "En 1932, la France la supprime", duration: 2.0 },
      { text: "et la partage", duration: 1.0 },
      { text: "entre trois colonies voisines :", duration: 1.6 },
      { text: "la Côte d'Ivoire, le Soudan français", duration: 1.8 },
      { text: "et le Niger.", duration: 1.0 },
      { text: "Cela sert à envoyer", duration: 1.1 },
      { text: "des travailleurs mossi", duration: 1.3 },
      { text: "dans les plantations de Côte d'Ivoire.", duration: 3.6 },
      { text: "En 1947, la Haute-Volta est recréée.", duration: 2.2 },
    ],
  },
  {
    card: "carte-animee-1984",
    chunks: [
      { text: "Comme presque tous les États africains,", duration: 1.9 },
      { text: "il garde les frontières", duration: 1.3 },
      { text: "héritées de la colonie.", duration: 1.6 },
      { text: "Le 4 août 1984,", duration: 1.2 },
      { text: "il donne au pays", duration: 1.0 },
      { text: "un nouveau nom.", duration: 1.6 },
      { text: "Selon un témoin de l'époque,", duration: 2.4 },
    ],
  },
  { card: "serie-pays-07", chunks: closingChunks() },
];

// `edit(deck)` changes the cards before they are written, `script(beats)`
// the spoken chunks before they are timed.
export function animatedDemo(dir, { edit = () => {}, script = (b) => b } = {}) {
  mkdirSync(dir, { recursive: true });
  const deck = animatedCards();
  edit(deck);
  writeFileSync(join(dir, "cards.json"), JSON.stringify(deck, null, 2));
  const beats = script(structuredClone(ANIMATED_SCRIPT));
  writeSyntheticVoice(dir, beats);
  return {
    design: "EthniAfrica Cartes 1.11.0-proposition, carte animée",
    demo: DEMO,
    cards: "cards.json",
    // 1.11.0: one ink per people for the whole episode.
    inks: { mossi: "a", dioula: "b", peuls: "c", songhay: "d" },
    // The Mossi plan is closer than the 2 km file allows (decision 1).
    mapImagery: "bmng-2004-07-topo-bathy-500m",
    beats: beats.map((beat) => ({
      card: beat.card,
      chunks: beat.chunks.map(({ text }) => ({ text })),
    })),
    ending: {},
    voice: { audio: "voice.wav", words: "words.json" },
  };
}

// node social/video/fixtures/series-carte-animee.mjs --out DIR writes the
// cards, the voice files and series.sequence.json, ready for series-render.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out");
  if (at < 0) throw new Error("Usage: series-carte-animee.mjs --out DIR");
  const dir = resolve(process.argv[at + 1]);
  const input = animatedDemo(dir);
  writeFileSync(
    join(dir, "series.sequence.json"),
    JSON.stringify(input, null, 2) + "\n"
  );
  console.log(join(dir, "series.sequence.json"));
}
