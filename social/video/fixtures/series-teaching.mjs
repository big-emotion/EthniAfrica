// A short series video for Cartes 1.12.0, teaching cards in motion on the
// parchment card, timed on a synthetic silent voice and built from the
// series 3 sample cards (« Kouassi et Yao »): the Baoulé week table, the
// Friday formula, the drawings of Yaw and Kwasi, the drawing of Kwa and the
// 1964 law, between an opener on a photograph and the closing card.
//
// The texts are the boards' demonstration text, not validated facts, except
// the law's quotation and source, which are the law's own words (the boards'
// « relative au nom » and « Journal officiel » are not).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARDS, closingChunks, writeSyntheticVoice } from "./series-pays.mjs";

const sample = JSON.parse(readFileSync(CARDS, "utf8"));
const card = (id) => structuredClone(sample.cards.find((c) => c.id === id));
const DEMO = "Démonstration : texte non validé";
const TANOBOASE = card("serie-nom-famille-07");

// Pagnet 2005, as the boards give it: day, the day's word, girl, boy.
export const BAOULE_WEEK = [
  ["lundi", "kissié", "Akissi", "Kouassi"],
  ["mardi", "djolai", "Adjoua", "Kouadjo"],
  ["mercredi", "mlan", "Amlan", "Konan"],
  ["jeudi", "houé", "Ahou", "Kouakou"],
  ["vendredi", "ya", "Aya", "Yao"],
  ["samedi", "foué", "Affoué", "Koffi"],
  ["dimanche", "monlin", "Amoin", "Kouamé"],
];

export const WEEK = {
  people: "Baoulé",
  region: "Côte d’Ivoire",
  say: "jour",
  rows: BAOULE_WEEK,
  highlights: [
    { day: "lundi", say: "lundi" },
    { day: "vendredi", say: "vendredi" },
  ],
};

export const FORMULA = {
  day: { html: "vendredi se dit <r>ya</r>", say: "ya" },
  lines: [
    {
      label: "fille",
      states: [
        { say: "A", items: [{ id: "A", text: "A" }] },
        {
          say: "jour",
          items: ["A", { op: "+" }, { id: "ya", text: "ya", day: true }],
        },
        { say: "Aya", move: "join", items: ["A", "ya"] },
      ],
    },
    {
      label: "garçon",
      states: [
        { say: "Kwa", items: [{ id: "K", text: "Kwa" }] },
        {
          say: "avec",
          items: ["K", { op: "+" }, { id: "y", text: "ya", day: true }],
        },
        { say: "Ce", move: "join", items: ["K", "y"] },
        { say: "tombé", move: "fall", items: ["K"] },
        {
          say: "Yao",
          move: "become",
          items: [{ id: "y", text: "Yao", day: [0, 2] }],
        },
      ],
    },
  ],
  notes: [{ html: "on entend encore Kw<r>a</r>o", say: "Kwao", hold: 2 }],
};

export const LAW_QUOTE = {
  lines: [
    "Ce nom devient son nom patronymique",
    "ainsi que celui de ses enfants",
    "mineurs […]",
  ],
  source: "Loi n° 64-381 du 7 octobre 1964, article 3",
  say: "famille",
  marks: [{ words: "son nom patronymique", say: "famille" }],
};

const parchment = (id, fields) => {
  const c = card(id);
  for (const k of ["image", "credit", "body", "forms", "note", "date", "map"])
    delete c[k];
  return { ...c, type: "explanation", ground: "parchment", ...fields };
};

function teachingDeck() {
  const opener = card("serie-nom-famille-01");
  opener.image = structuredClone(TANOBOASE.image);
  opener.credit = TANOBOASE.credit;
  return {
    version: sample.version,
    logo: sample.logo,
    cards: [
      opener,
      parchment("serie-nom-famille-02", {
        kicker: "Un nom pour chaque jour",
        title: "Sept jours, sept *noms*",
        week: structuredClone(WEEK),
        source: "J.-M. Pagnet, 2005 (baoulé)",
      }),
      parchment("serie-nom-famille-03", {
        kicker: "La fabrication du nom",
        title: "Un nom fait avec le *jour*",
        formula: structuredClone(FORMULA),
        source: "M. Delafosse, 1900 ; J.-M. Pagnet, 2005",
      }),
      parchment("serie-nom-famille-04", {
        kicker: "Ce que le nom dit",
        title: "Le nom de l’*âme*",
        drawings: [
          {
            kind: "courageux",
            name: "Yaw",
            quality: "le courageux",
            say: "Yaw",
          },
          { kind: "agile", name: "Kwasi", quality: "l’agile", say: "Kwasi" },
        ],
        attribution: {
          name: "Kofi Agyekum",
          role: "linguiste, université du Ghana",
          say: "Agyekum",
        },
        source: undefined,
      }),
      parchment("serie-nom-famille-05", {
        kicker: "Ce que le nom dit",
        title: "*Kwa*, le serviteur ?",
        drawings: [
          {
            kind: "serviteur",
            name: "Kwa",
            quality: "serviteur de l’esprit de son jour ?",
            say: "serviteur",
            qualitySay: "esprit",
          },
        ],
        attribution: { name: "Kwasi Konadu", role: "historien", say: "Konadu" },
        source: undefined,
      }),
      parchment("serie-nom-famille-06", {
        kicker: "Côte d’Ivoire",
        title: undefined,
        date: "7 octobre 1964",
        dateLabel: "Loi sur le nom",
        dateSay: "1964",
        quote: structuredClone(LAW_QUOTE),
        words: [
          { html: "un jour de <r>naissance</r>", say: "naissance" },
          { html: "→ le nom d’une <r>lignée</r>", say: "lignée" },
        ],
        source: "loi n° 64-381 du 7 octobre 1964, article 3",
      }),
      card("serie-nom-famille-07"),
    ],
  };
}

const chunks = (texts, seconds) =>
  texts.map((text) => ({ text, duration: seconds }));
export const TEACHING_SCRIPT = [
  {
    card: "serie-nom-famille-01",
    chunks: chunks(["Yao, Kouassi, Aya :", "des noms de jours."], 3),
  },
  {
    card: "serie-nom-famille-02",
    chunks: chunks(
      [
        "Chez eux, l'enfant reçoit",
        "le nom du jour",
        "où il est né :",
        "lundi, Akissi et Kouassi,",
        "vendredi, Aya et Yao.",
      ],
      2.2
    ),
  },
  {
    card: "serie-nom-famille-03",
    chunks: chunks(
      [
        "Vendredi se dit ya.",
        "Pour une fille, on ajoute A",
        "devant le jour :",
        "A, ya... Aya.",
        "Pour un garçon, Kwa",
        "avec ya. Ce Kwa",
        "est tombé : Yao,",
        "on entend parfois Kwao.",
        "un même nom, deux formes.",
      ],
      2.4
    ),
  },
  {
    card: "serie-nom-famille-04",
    chunks: chunks(
      [
        "Au Ghana, le linguiste",
        "Kofi Agyekum rappelle :",
        "Yaw, c'est le courageux ;",
        "Kwasi, c'est l'agile.",
      ],
      2.4
    ),
  },
  {
    card: "serie-nom-famille-05",
    chunks: chunks(
      [
        "Et selon l'historien Kwasi Konadu,",
        "Kwa voudrait dire serviteur :",
        "chaque garçon servirait",
        "l'esprit de son jour.",
      ],
      2.2
    ),
  },
  {
    card: "serie-nom-famille-06",
    chunks: chunks(
      [
        "En Côte d'Ivoire,",
        "c'est une loi qui le fixe.",
        "En 1964, elle fait du nom",
        "son nom de famille,",
        "transmis à ses enfants.",
        "Un jour de naissance",
        "est devenu le nom",
        "d'une lignée, chez eux.",
      ],
      2.2
    ),
  },
  { card: "serie-nom-famille-07", chunks: closingChunks() },
];

// `deck(cards)` changes the cards, `script(beats)` the voice script and
// `edit(input)` the sequence, before they are written and timed.
export function teachingCardsDemo(
  dir,
  { deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  const cards = deck(teachingDeck());
  const beats = script(structuredClone(TEACHING_SCRIPT));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cards.json"), JSON.stringify(cards));
  writeSyntheticVoice(dir, beats);
  const input = {
    design: "EthniAfrica Cartes 1.12.0-proposition (démonstration)",
    demo: DEMO,
    cards: "cards.json",
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
