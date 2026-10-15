// Series 2, episode 1 (« Touareg ») as a map sequence (Cartes 1.5.0): the
// four beats of the accepted boards, on a synthetic silent voice. The
// subtitles are demonstration text; the areas are the repository's files
// (social/video/data/areas/), the Amazigh one the present-day area built
// from Glottolog 5.3, not al-Idrīsī's « Pays des Berbères » of the boards.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CARDS, signatureChunks, writeSyntheticVoice } from "./series-pays.mjs";

const SOURCE =
  "fiche EthniAfrica Touareg ; aires approximatives d'après Salem Chaker (1986), Natural Earth et Glottolog 5.3";
const REGIONS = [
  {
    file: "touareg-imuhagh.geojson",
    name: "Imuhagh",
    lang: "tamahaq",
    ink: "a",
  },
  {
    file: "touareg-imajeghen.geojson",
    name: "Imajeghen",
    lang: "tamajaq",
    ink: "b",
  },
  {
    file: "touareg-imushagh.geojson",
    name: "Imushagh",
    lang: "tamasheq",
    ink: "c",
  },
];
const AMAZIGH = { file: "amazigh.geojson", name: "Amazigh", ink: "d" };

const mapCard = (n, kicker, title, areas) => ({
  id: `serie-nom-recu-carte-${n}`,
  type: "map",
  theme: "parchemin",
  series: { id: "nom-recu", episode: 1 },
  kicker,
  title,
  demo: "Démonstration : texte non validé",
  map: { sequence: "touareg", areas, caption: { source: SOURCE } },
});

// The four map cards of the boards, the photograph between beats 3 and 4,
// and the episode's opener and closing card from the sample deck.
export function touaregCards() {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  const sample = (id) => structuredClone(deck.cards.find((c) => c.id === id));
  const photo = {
    ...sample("serie-nom-recu-07"),
    id: "serie-nom-recu-ecriture",
    kicker: "Leur écriture",
    title: "Le *tifinagh*, gravé dans la roche",
  };
  delete photo.body;
  return {
    version: deck.version,
    logo: deck.logo,
    cards: [
      sample("serie-nom-recu-01"),
      mapCard(
        1,
        "Comment ils se nomment",
        "Trois façons de dire le même *nom*",
        REGIONS.map((a) => ({ ...a, say: a.name }))
      ),
      mapCard(2, "D'où vient ce mot", "Le même mot qu'*Amazigh*", [
        ...REGIONS,
        { ...AMAZIGH, say: "Amazigh" },
      ]),
      mapCard(
        3,
        "Leur langue",
        "Une langue, trois *noms*",
        REGIONS.map((a) => ({ ...a, langSay: a.lang }))
      ),
      photo,
      mapCard(4, "En résumé", "Leurs noms, leurs *langues*", REGIONS),
      sample("serie-nom-recu-08"),
    ],
  };
}

export const TOUAREG_SCRIPT = [
  {
    card: "serie-nom-recu-01",
    chunks: [
      { text: "Le nom Touareg.", duration: 1.6 },
      { text: "Comment s'appellent-ils eux-mêmes ?", duration: 2.6 },
    ],
  },
  {
    card: "serie-nom-recu-carte-1",
    chunks: [
      { text: "Chez les Touaregs, on dit plutôt", duration: 2.4 },
      // Said fast: Imajeghen comes 0.62 s after Imuhagh and waits for the
      // 700 ms between two entries.
      { text: "Imuhagh, Imajeghen ou Imushagh,", duration: 2.4 },
      { text: "selon la région.", duration: 1.5 },
    ],
  },
  {
    card: "serie-nom-recu-carte-2",
    chunks: [
      { text: "C'est le même mot qu'Amazigh,", duration: 2.4 },
      { text: "prononcé selon les parlers", duration: 1.9 },
      { text: "de chaque région.", duration: 1.4 },
    ],
  },
  {
    card: "serie-nom-recu-carte-3",
    chunks: [
      { text: "Leur langue aussi change de nom", duration: 2.3 },
      { text: "selon la région :", duration: 1.4 },
      { text: "tamahaq, tamajaq ou tamasheq.", duration: 3.0 },
    ],
  },
  {
    card: "serie-nom-recu-ecriture",
    chunks: [
      { text: "Leur écriture, le tifinagh,", duration: 2.0 },
      { text: "est gravée dans la roche.", duration: 2.0 },
    ],
  },
  {
    card: "serie-nom-recu-carte-4",
    chunks: [
      { text: "Imuhagh, Imajeghen ou Imushagh :", duration: 2.6 },
      { text: "trois noms, une même langue.", duration: 2.2 },
    ],
  },
  {
    card: "serie-nom-recu-08",
    chunks: [
      // 1.6.0: the voice says the signature line before the search sentence.
      ...signatureChunks(),
      { text: "Cherchez Touareg sur EthniAfrica,", duration: 2.8 },
      { text: "lien en profil.", duration: 1.4 },
    ],
  },
];

// `edit(deck)` changes the cards before they are written, `script(beats)`
// the spoken chunks before they are timed.
export function touaregDemo(dir, { edit = () => {}, script = (b) => b } = {}) {
  mkdirSync(dir, { recursive: true });
  const deck = touaregCards();
  edit(deck);
  writeFileSync(join(dir, "cards.json"), JSON.stringify(deck, null, 2));
  const beats = script(structuredClone(TOUAREG_SCRIPT));
  writeSyntheticVoice(dir, beats);
  return {
    design: "EthniAfrica Cartes 1.5.0-proposition, séquence de cartes",
    demo: "Démonstration : texte non validé",
    cards: "cards.json",
    beats: beats.map((beat) => ({
      card: beat.card,
      chunks: beat.chunks.map(({ text }) => ({ text })),
    })),
    ending: { search: "Touareg", pageOnline: true },
    voice: { audio: "voice.wav", words: "words.json" },
  };
}

// node social/video/fixtures/series-touareg.mjs --out DIR writes the cards,
// the voice files and series.sequence.json, ready for series-render.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out");
  if (at < 0) throw new Error("Usage: series-touareg.mjs --out DIR");
  const dir = resolve(process.argv[at + 1]);
  const input = touaregDemo(dir);
  writeFileSync(
    join(dir, "series.sequence.json"),
    JSON.stringify(input, null, 2) + "\n"
  );
  console.log(join(dir, "series.sequence.json"));
}
