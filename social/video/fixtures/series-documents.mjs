// Two short series videos for Cartes 1.8.0, timed on a synthetic silent
// voice, built from the series 4 and series 3 sample cards:
//
// - documentDemo: document cards on the Speke page of the sample deck (public
//   domain, 985 × 1500): an opener framed as a web capture (a margin added
//   above the page, « Capture : » in the foot), a passage in the middle of
//   the page, and one near its top, which shows the page's edge;
// - teachingDemo: the name-making formula, the side-by-side forms and the
//   week table, over the Tanoboase photograph of the sample deck.
//
// The texts are demonstration text: no claim here is a validated fact, and
// the Speke page stands in for the « tribu » episode's documents.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARDS, closingChunks, writeSyntheticVoice } from "./series-pays.mjs";

const sample = JSON.parse(readFileSync(CARDS, "utf8"));
const card = (id) => structuredClone(sample.cards.find((c) => c.id === id));
const SPEKE = { src: "Exemples/speke-1863-p253-page.jpg", w: 985, h: 1500 };
const SPEKE_SOURCE =
  "J. H. Speke, Journal of the Discovery of the Source of the Nile, 1863, p. 253, Internet Archive";
const DEMO = "Démonstration : texte non validé";

// Passages measured on the page's printed lines (source pixels).
export const PASSAGES = {
  // « In short, the system of government, according to barbar- / ous ideas, »
  middle: {
    passage: [96, 586, 706, 66],
    marks: [
      [650, 589, 150, 28],
      [96, 623, 160, 26],
    ],
    say: "barbares",
  },
  // « whom he appointed to be his Wakungŭ, or officers— », near the top: the
  // frame shows past the page's edge.
  top: {
    passage: [96, 294, 706, 72],
    marks: [[580, 297, 220, 30]],
    say: "officiers",
  },
  // The first line: even 400 px of edge cannot bring it to the clear zone.
  first: { passage: [96, 113, 706, 38], marks: [], say: "rois" },
};

const documentCard = (id, title, document, extra = {}) => {
  const c = card(id);
  delete c.credit;
  delete c.body;
  return {
    ...c,
    title,
    image: { ...SPEKE, document: structuredClone(document) },
    source: SPEKE_SOURCE,
    ...extra,
  };
};

function documentDeck() {
  // A web capture's opener: the page's first line, brought to the clear zone
  // by a margin added above the page in a paper colour.
  const opener = documentCard(
    "serie-mots-01",
    "D'où vient le mot *barbare* ?",
    {
      ...PASSAGES.first,
      marks: [[96, 116, 300, 32]],
      pad: 604,
      padColor: "#efe7d6",
    },
    {
      sourceLabel: "Capture",
      source:
        "Speke, page 253, chronique de démonstration, 1863, capturée le 15 octobre 2026",
    }
  );
  const middle = documentCard(
    "serie-mots-02",
    "« Des idées *barbares* »",
    PASSAGES.middle
  );
  const top = documentCard("serie-mots-03", "Des *officiers*", PASSAGES.top);
  const closing = card("serie-mots-07");
  return {
    version: sample.version,
    logo: sample.logo,
    cards: [opener, middle, top, closing],
  };
}

const chunks = (texts, seconds) =>
  texts.map((text) => ({ text, duration: seconds }));
export const DOCUMENT_SCRIPT = [
  {
    card: "serie-mots-01",
    chunks: chunks(["Ces rois, écrit Speke,", "gouvernent tous pareil."], 3.2),
  },
  {
    card: "serie-mots-02",
    chunks: chunks(
      ["Il parle d'idées barbares,", "dans un livre de 1863."],
      3.4
    ),
  },
  {
    card: "serie-mots-03",
    chunks: chunks(
      ["Le roi choisit ses officiers,", "puis les paie bien."],
      3.4
    ),
  },
  {
    card: "serie-mots-07",
    chunks: closingChunks(),
  },
];

function writeDemo(dir, cards, beats) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cards.json"), JSON.stringify(cards));
  writeSyntheticVoice(dir, beats);
  return {
    design: "EthniAfrica Cartes 1.8.0-proposition (démonstration)",
    demo: DEMO,
    cards: "cards.json",
    beats: beats.map((b) => ({
      card: b.card,
      chunks: b.chunks.map(({ text }) => ({ text })),
    })),
    ending: {},
    voice: { audio: "voice.wav", words: "words.json" },
  };
}

// `deck(cards)` changes the cards, `script(beats)` the voice script and
// `edit(input)` the sequence, before they are written and timed.
export function documentDemo(
  dir,
  { deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  const input = writeDemo(
    dir,
    deck(documentDeck()),
    script(structuredClone(DOCUMENT_SCRIPT))
  );
  edit(input);
  return input;
}

const TANOBOASE = card("serie-nom-famille-04").image;
const TANOBOASE_CREDIT = card("serie-nom-famille-04").credit;
const name = (text) => ({ text, role: "name" });
const day = (text) => ({ text, role: "day" });
const op = (text) => ({ text, role: "op" });
const dropped = (text) => ({ text, role: "dropped" });
const girl = { label: "fille", parts: [name("A"), op("+"), day("ya")] };
const girlDone = {
  label: "fille",
  parts: [name("A"), op("+"), day("ya"), op("="), name("A*ya*")],
};
export const FORMULA = {
  steps: [
    { say: "ya", day: "vendredi se dit *ya*", rows: [{ parts: [day("ya")] }] },
    { say: "A", day: "vendredi se dit *ya*", rows: [girl] },
    { say: "Aya", day: "vendredi se dit *ya*", rows: [girlDone] },
    {
      say: "Kwa",
      day: "vendredi se dit *ya*",
      rows: [
        girlDone,
        { label: "garçon", parts: [name("Kwa"), op("+"), day("ya")] },
      ],
    },
    {
      say: "Yao",
      day: "vendredi se dit *ya*",
      rows: [
        girlDone,
        {
          label: "garçon",
          parts: [dropped("Kwa"), op("+"), day("ya"), op("→"), name("*Ya*o")],
        },
      ],
    },
  ],
};
export const SBS = {
  heads: ["Côte d'Ivoire (baoulé)", "Ghana (twi)"],
  rows: [
    [
      { name: "Kouassi · Akissi", day: "lundi" },
      { name: "Kwasi · Akosua", day: "dimanche" },
    ],
    [
      { name: "Yao · Aya", day: "vendredi" },
      { name: "Yaw · Yaa", day: "jeudi" },
    ],
  ],
  daysSay: "plus",
  note: "Les Nzema nomment les jours comme les Baoulé, et leurs enfants comme les Ashanti.",
  noteSay: "Nzema",
};
export const WEEK = {
  heads: ["Baoulé", "Twi (ashanti)"],
  rows: [
    ["lundi", ["kissié", "Kouassi", "Akissi"], ["Dwoda", "Kwadwo", "Adwoa"]],
    ["mardi", ["djolai", "Kouadjo", "Adjoua"], ["Benada", "Kwabena", "Abena"]],
    ["mercredi", ["mlan", "Konan", "Amlan"], ["Wukuda", "Kwaku", "Akua"]],
    ["jeudi", ["houé", "Kouakou", "Ahou"], ["Yawda", "Yaw", "Yaa"]],
    ["vendredi", ["ya", "Yao", "Aya"], ["Fida", "Kofi", "Afua"]],
    ["samedi", ["foué", "Koffi", "Affoué"], ["Memeneda", "Kwame", "Amma"]],
    ["dimanche", ["monlin", "Kouamé", "Amoin"], ["Kwasida", "Kwasi", "Akosua"]],
  ],
};

function teachingDeck() {
  const opener = card("serie-nom-famille-01");
  const photo = (id, title, extra) => {
    const c = card(id);
    delete c.forms;
    delete c.note;
    delete c.body;
    return {
      ...c,
      type: "explanation",
      title,
      image: structuredClone(TANOBOASE),
      credit: TANOBOASE_CREDIT,
      source: "Delafosse, 1900 ; Pagnet, 2005 ; Christaller, 1881",
      ...extra,
    };
  };
  return {
    version: sample.version,
    logo: sample.logo,
    cards: [
      opener,
      photo("serie-nom-famille-03", "Un nom fait avec le *jour*", {
        formula: structuredClone(FORMULA),
      }),
      photo("serie-nom-famille-04", "Les mêmes *noms*", {
        sbs: structuredClone(SBS),
      }),
      photo("serie-nom-famille-06", "Sept jours, sept *noms*", {
        week: structuredClone(WEEK),
      }),
      card("serie-nom-famille-07"),
    ],
  };
}

export const TEACHING_SCRIPT = [
  {
    card: "serie-nom-famille-01",
    chunks: chunks(["Yao, Kouassi, Aya :", "des noms de jours."], 3),
  },
  {
    card: "serie-nom-famille-03",
    chunks: chunks(
      [
        "Vendredi se dit ya.",
        "Pour une fille, A,",
        "on obtient Aya.",
        "Pour un garçon, Kwa,",
        "et le nom devient Yao.",
        "Deux noms du vendredi.",
      ],
      2.6
    ),
  },
  {
    card: "serie-nom-famille-04",
    chunks: chunks(
      [
        "Kouassi se dit Kwasi,",
        "et Yao se dit Yaw,",
        "mais un jour plus tôt.",
        "Les Nzema font les deux.",
      ],
      2.8
    ),
  },
  {
    card: "serie-nom-famille-06",
    chunks: chunks(
      [
        "Chaque jour a ses noms,",
        "du lundi au dimanche,",
        "pour un garçon ou une fille,",
        "chez les Baoulé et les Ashanti.",
      ],
      3
    ),
  },
  {
    card: "serie-nom-famille-07",
    chunks: closingChunks(),
  },
];

export function teachingDemo(
  dir,
  { deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  const input = writeDemo(
    dir,
    deck(teachingDeck()),
    script(structuredClone(TEACHING_SCRIPT))
  );
  edit(input);
  return input;
}
