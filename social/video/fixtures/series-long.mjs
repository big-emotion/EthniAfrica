// A long series video (Cartes 1.7.0) built from the series 6 sample cards,
// timed on a synthetic silent voice: three chapters, a figures card, a
// readings card labelled « Hypothèses », a quoted person, the hook reminder
// on the opener's image, a signed card, and the 1.6.0 ending. About 2 min 05.
// The texts are demonstration text: no claim here is a validated fact.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARDS, closingChunks, writeSyntheticVoice } from "./series-pays.mjs";

const sample = JSON.parse(readFileSync(CARDS, "utf8"));
const card = (id) => structuredClone(sample.cards.find((c) => c.id === id));

// The deck: the series 6 cards with the 1.7.0 fields of the video.
function longDeck() {
  const opener = card("serie-afrique-tout-01");
  const figures = {
    ...card("serie-afrique-tout-02"),
    title: "Un continent immense",
    figures: {
      items: [
        { value: "54", label: "pays", say: "54" },
        {
          value: "1,5",
          unit: "milliard",
          label: "d'habitants",
          say: "milliard",
        },
        { pre: "plus de", value: "2 000", label: "langues", say: "langues" },
      ],
    },
  };
  const readings = {
    ...card("serie-afrique-tout-04"),
    title: "D'où vient le mot ?",
    sourceLabel: "Hypothèses",
    readings: {
      items: [
        {
          label: "berbère",
          text: "la terre des Afri",
          by: "lecture souvent reprise",
          say: "Afri",
        },
        {
          label: "phénicien",
          text: "un mot pour la poussière",
          say: "phénicien",
        },
        { label: "latin", text: "aprica, ensoleillée", say: "aprica" },
      ],
    },
  };
  const quoted = {
    ...card("serie-afrique-tout-02"),
    id: "serie-afrique-tout-02-cite",
    title: "Un nom venu de l'extérieur",
    attribution: {
      name: "Florence Abena Dolphyne",
      role: "linguiste ghanéenne",
      say: "Dolphyne",
    },
  };
  const reminder = {
    ...card("serie-afrique-tout-06"),
    id: "serie-afrique-tout-rappel",
    title: "Comment finit-il par nommer tout un continent ?",
    image: structuredClone(opener.image),
    credit: opener.credit,
  };
  delete reminder.source;
  const plain = card("serie-afrique-tout-05");
  const signed = {
    ...card("serie-afrique-tout-06"),
    title: "D'abord, accepter que nous sommes différents",
    signed: true,
  };
  delete signed.source;
  const closing = card("serie-afrique-tout-07");
  return {
    version: sample.version,
    logo: sample.logo,
    cards: [
      opener,
      figures,
      readings,
      quoted,
      reminder,
      plain,
      signed,
      closing,
    ],
  };
}

// The voice script: each content beat's chunks, a silence before each chapter.
const chunks = (texts, seconds) =>
  texts.map((text) => ({ text, duration: seconds }));
export const LONG_SCRIPT = [
  {
    card: "serie-afrique-tout-01",
    chunks: chunks(
      ["L'Afrique n'est pas un seul bloc.", "Alors d'où vient son nom ?"],
      5
    ),
  },
  { chapter: 1, silence: 2.4 },
  {
    card: "serie-afrique-tout-02",
    chunks: chunks(
      [
        "Le continent compte 54 pays,",
        "plus d'un milliard et demi d'habitants",
        "et plus de 2 000 langues.",
      ],
      6.5
    ),
  },
  {
    card: "serie-afrique-tout-04",
    chunks: chunks(
      ["On a proposé les Afri,", "un mot phénicien,", "ou le latin aprica."],
      7
    ),
  },
  { chapter: 2, silence: 2.4 },
  {
    card: "serie-afrique-tout-02-cite",
    chunks: chunks(
      ["Pour la linguiste Dolphyne,", "le nom vient d'ailleurs."],
      11
    ),
  },
  {
    card: "serie-afrique-tout-rappel",
    chunks: chunks(["Alors comment ce nom", "finit-il par tout nommer ?"], 6),
  },
  {
    card: "serie-afrique-tout-05",
    chunks: chunks(["Le nom s'étend,", "de province en continent."], 8),
  },
  { chapter: 3, silence: 2.4 },
  {
    card: "serie-afrique-tout-06",
    chunks: chunks(
      ["Nous pensons qu'il faut d'abord", "accepter nos différences."],
      8.5
    ),
  },
  {
    card: "serie-afrique-tout-07",
    chunks: closingChunks(),
  },
];
export const LONG_CHAPTERS = [
  { title: "Un continent entier" },
  { title: "D'où vient le mot" },
  { title: "Ce que nous pensons" },
];

// `deck(cards)` changes the cards, `script(beats)` the voice script and
// `edit(input)` the sequence, before they are written and timed.
export function longDemo(
  dir,
  { deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cards.json"), JSON.stringify(deck(longDeck())));
  const beats = script(structuredClone(LONG_SCRIPT));
  writeSyntheticVoice(dir, beats);
  const input = {
    design:
      "EthniAfrica Cartes 1.7.0-proposition, vidéo longue (démonstration)",
    demo: "Démonstration : texte non validé",
    cards: "cards.json",
    chapters: structuredClone(LONG_CHAPTERS),
    beats: beats.map((b) =>
      b.chapter
        ? { type: "chapter", chapter: b.chapter }
        : { card: b.card, chunks: b.chunks.map(({ text }) => ({ text })) }
    ),
    reminder: "serie-afrique-tout-rappel",
    ending: { next: "le pays des Noirs" },
    voice: { audio: "voice.wav", words: "words.json" },
  };
  edit(input);
  return input;
}
