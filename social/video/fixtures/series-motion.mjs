// Motion and sound (Cartes 1.13.0) on the boards' seven scenes (the design
// package's scenes113.js: pop, whip, era, marks, band, recap, word), in the
// new piece data, as two short pieces timed on a synthetic silent voice:
//
//  - motionDemo: the opener on the globe, the intro, the recap of episode 1,
//    the pop, two whip zooms (Ouagadougou to Paris and back), three era cards
//    with the counter and the flags, the closing;
//  - wordDemo: the drawn marks, the headline band, the word card and its map.
//
// Every fact is the boards' demonstration text, under the demo tape, to be
// checked by an episode session against its sources (Binger's route, Kong
// in 1897, Salaga's kola, the senses of Burkina, Faso and -bè, the variant
// spellings, the flags' adoption dates). The areas are the repository's files
// (social/video/data/areas/), the river Natural Earth's (data/rivers/).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CARDS,
  closingChunks,
  introChunks,
  writeSyntheticVoice,
} from "./series-pays.mjs";

const DEMO = "Démonstration : texte non validé";
const BFA = { lon: -1.57, lat: 12.25 };
// The 1.11.0 limit (5157) divided by the push: the boards frame a 10 s card
// at 4865 (scenes113.js); these shots last up to about 19 s, so 4600.
const R0 = 4600;
const VIEW = { lon: BFA.lon, lat: BFA.lat, radius: R0 };
// The three era cards keep one view for about 25 s: framed wider for it.
const ERA_VIEW = { lon: BFA.lon, lat: BFA.lat, radius: 4400 };

// The towns the scenes name, as the boards place them.
export const PLACES = {
  ouaga: { id: "ouaga", name: "Ouagadougou", at: [-1.53, 12.37] },
  bobo: { id: "bobo", name: "Bobo-Dioulasso", at: [-4.3, 11.18] },
  paris: { id: "paris", name: "Paris", at: [2.35, 48.86] },
  bamako: { id: "bamako", name: "Bamako", at: [-8.0, 12.64], side: "left" },
  sikasso: { id: "sikasso", name: "Sikasso", at: [-5.67, 11.32] },
  kong: { id: "kong", name: "Kong", at: [-4.61, 9.15] },
  salaga: { id: "salaga", name: "Salaga", at: [-0.52, 8.55] },
};
const place = (id, say) => ({ ...PLACES[id], ...(say && { say }) });

const BURKINA = {
  file: "bfa-burkina-faso.geojson",
  id: "burkina-faso",
  name: "BURKINA FASO",
  ink: "a",
  label: "country",
  nameAt: [-1.6, 12.35],
};
const HAUTE_VOLTA = {
  file: "bfa-haute-volta.geojson",
  id: "haute-volta",
  name: "HAUTE-VOLTA",
  ink: "a",
  label: "country",
  nameAt: [-1.6, 12.35],
};

const mapCard = (id, title, map, extra = {}) => ({
  id,
  type: "map",
  theme: "nuit",
  series: { id: "pays", episode: 23 },
  kicker: "Burkina Faso",
  title,
  demo: DEMO,
  map: { sequence: "bfa-113", ...map },
  ...extra,
});

function sample(id) {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  return structuredClone(deck.cards.find((c) => c.id === id));
}
const closing = () => {
  const c = sample("serie-pays-07");
  c.series = { id: "pays", episode: 23 };
  return c;
};

// The last map card of episode 1, as its recap shows it (scene 6).
export const EPISODE_1_LAST_MAP = mapCard(
  "episode-1-carte-finale",
  "Un nouveau nom",
  {
    sequence: "bfa-113-rappel",
    view: VIEW,
    areas: [{ ...HAUTE_VOLTA }],
    words: [
      { text: "4 août 1984", kind: "date", at: [-1.57, 10.6], say: "1984" },
    ],
    rename: {
      from: "HAUTE-VOLTA",
      to: "BURKINA FASO",
      dates: "de 1919 à 1984",
      at: [-1.6, 12.35],
      say: "devient",
    },
  }
);

function motionCards() {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  const opener = sample("serie-pays-01");
  for (const k of ["image", "credit", "imageAlt"]) delete opener[k];
  Object.assign(opener, {
    series: { id: "pays", episode: 23 },
    title: "Trois langues dans un *nom*",
    demo: DEMO,
    opening: "globe",
    map: {
      sequence: "bfa-113",
      view: { ...VIEW },
      areas: [{ ...BURKINA, say: "Burkina" }],
    },
  });
  return {
    version: deck.version,
    logo: deck.logo,
    cards: [
      opener,
      // Scene 1: the pop and the swell.
      mapCard(
        "motion-pop",
        "Où se trouve le pays",
        {
          view: { ...VIEW },
          areas: [{ ...BURKINA }],
          places: [
            place("ouaga", "Ouagadougou"),
            place("bobo", "Bobo-Dioulasso"),
          ],
          words: [
            {
              text: "le pays des hommes intègres",
              at: [-1.57, 10.1],
              say: "hommes",
            },
          ],
        },
        { marks: [{ kind: "pin", at: "ouaga", say: "Ouagadougou" }] }
      ),
      // Scene 2: the whip zoom to Paris, and back.
      mapCard(
        "motion-paris",
        "Une colonie née à Paris",
        {
          view: { ...VIEW },
          areas: [{ ...BURKINA }],
          places: [place("paris", "Paris")],
          words: [
            { text: "un décret du ministre", at: [2.35, 47.4], say: "décret" },
          ],
        },
        { whip: { to: { lon: 2.35, lat: 48.86, r: 3200 }, say: "Paris" } }
      ),
      mapCard(
        "motion-retour",
        "La colonie de Haute-Volta",
        {
          view: { lon: 2.35, lat: 48.86, radius: 3200 },
          // The colony's outline enters on the 1925 era card: an area enters
          // once in a sequence. Here its name, after the whip lands.
          areas: [{ ...BURKINA, label: "none" }],
          words: [{ text: "Haute-Volta", at: [-1.57, 11.0], say: "colonie" }],
        },
        {
          whip: {
            to: { lon: BFA.lon, lat: BFA.lat, r: R0 },
            say: "Haute-Volta",
          },
        }
      ),
      // Scene 3: the era map, the counter and the flags.
      mapCard(
        "motion-1970",
        "Un drapeau par époque",
        {
          view: { ...ERA_VIEW },
          areas: [{ ...BURKINA, label: "none" }],
        },
        {
          era: { date: 1970, label: "République de Haute-Volta", say: "1970" },
          flags: [
            {
              area: "burkina-faso",
              flag: "bfa",
              from: "1984-08-04",
              say: "drapeau",
            },
            {
              area: "burkina-faso",
              flag: "hv",
              from: "1959-12-09",
              to: "1984-08-04",
              say: "noir",
            },
          ],
        }
      ),
      mapCard(
        "motion-1925",
        "Une colonie",
        {
          view: { ...ERA_VIEW },
          areas: [
            { ...BURKINA, label: "none" },
            { ...HAUTE_VOLTA, say: "colonie" },
          ],
        },
        {
          era: { date: 1925, label: "Colonie de Haute-Volta", say: "1925" },
          flags: [
            {
              area: "burkina-faso",
              flag: "hv",
              from: "1959-12-09",
              to: "1984-08-04",
              say: "Haute-Volta",
            },
          ],
        }
      ),
      mapCard(
        "motion-aujourdhui",
        "Le Burkina Faso",
        {
          view: { ...ERA_VIEW },
          areas: [{ ...BURKINA, label: "none" }],
        },
        {
          era: { date: 2026, label: "Burkina Faso, aujourd’hui", say: "1984" },
          flags: [
            {
              area: "burkina-faso",
              flag: "hv",
              from: "1959-12-09",
              to: "1984-08-04",
              say: "Haute-Volta",
            },
            {
              area: "burkina-faso",
              flag: "bfa",
              from: "1984-08-04",
              say: "Burkina",
            },
          ],
        }
      ),
      closing(),
      EPISODE_1_LAST_MAP,
    ],
  };
}

const chunks = (list) => list.map(([text, duration]) => ({ text, duration }));
export const MOTION_SCRIPT = [
  {
    card: "serie-pays-01",
    chunks: chunks([
      ["Le Burkina Faso a trois langues", 2.8],
      ["dans un seul nom.", 3.0],
    ]),
  },
  { type: "intro", chunks: introChunks() },
  {
    card: "motion-pop",
    chunks: chunks([
      ["Ce pays d'Afrique de l'Ouest", 2.4],
      ["a pour capitale Ouagadougou,", 2.2],
      ["à l'ouest, Bobo-Dioulasso.", 2.2],
      ["Son nom veut dire", 1.6],
      ["le pays des hommes intègres.", 2.4],
    ]),
  },
  {
    card: "motion-paris",
    chunks: chunks([
      ["Le 1er mars 1919, à Paris,", 2.4],
      ["un décret du ministre", 2.4],
      ["crée une colonie nouvelle.", 2.8],
    ]),
  },
  {
    card: "motion-retour",
    chunks: chunks([
      ["Elle s'appelle la Haute-Volta.", 2.6],
      ["C'est une colonie française.", 3.4],
    ]),
  },
  {
    card: "motion-1970",
    chunks: chunks([
      ["Le drapeau du Burkina Faso.", 2.2],
      ["En 1970, le pays s'appelle Haute-Volta,", 3.0],
      ["noir, blanc, rouge, les trois Volta.", 3.2],
    ]),
  },
  {
    card: "motion-1925",
    chunks: chunks([
      ["Avant, la Haute-Volta", 1.8],
      ["en 1925 est une colonie française.", 3.6],
    ]),
  },
  {
    card: "motion-aujourdhui",
    chunks: chunks([
      ["La Haute-Volta devient,", 2.0],
      ["depuis 1984, le Burkina Faso.", 3.6],
    ]),
  },
  { card: "serie-pays-07", chunks: closingChunks() },
];

// The recap card of episode 2 (scene 6): one sentence over the last map of
// episode 1, its marks popping again.
export const RECAP = {
  map: "episode-1-carte-finale",
  title: "La Haute-Volta devient le Burkina Faso",
  marks: ["area:haute-volta", "text:BURKINA FASO", "text:4 août 1984"],
  chunks: chunks([["La Haute-Volta devient le Burkina Faso.", 3.0]]),
};

function write(dir, deck, beats, edit, extra) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cards.json"), JSON.stringify(deck, null, 2));
  writeSyntheticVoice(dir, beats);
  const input = {
    design: "EthniAfrica Cartes 1.13.0-proposition (démonstration)",
    demo: DEMO,
    cards: "cards.json",
    today: 2026,
    inks: {},
    beats: beats
      .filter((b) => !b.recap)
      .map((b) => ({
        ...(b.type ? { type: b.type } : { card: b.card }),
        chunks: b.chunks.map(({ text }) => ({ text })),
      })),
    ending: {},
    voice: { audio: "voice.wav", words: "words.json" },
    ...extra,
  };
  edit(input);
  return input;
}

// `recap: false` leaves the recap card out; `deck(deck)` and `script(beats)`
// change the cards and the voice before they are written.
export function motionDemo(
  dir,
  {
    recap = true,
    recapChunks = RECAP.chunks,
    deck = (d) => d,
    script = (b) => b,
    edit = () => {},
  } = {}
) {
  const beats = script(structuredClone(MOTION_SCRIPT));
  // The recap's sentence is said right after the intro.
  if (recap)
    beats.splice(2, 0, { recap: true, card: RECAP.map, chunks: recapChunks });
  return write(dir, deck(motionCards()), beats, edit, {
    subject: { id: "BFA", episode: 2 },
    tier: "medium",
    ...(recap && {
      recap: {
        map: RECAP.map,
        title: RECAP.title,
        marks: RECAP.marks,
        chunks: recapChunks.map(({ text }) => ({ text })),
      },
    }),
  });
}

function wordCards() {
  const deck = JSON.parse(readFileSync(CARDS, "utf8"));
  const opener = sample("serie-pays-01");
  opener.series = { id: "pays", episode: 23 };
  return {
    version: deck.version,
    logo: deck.logo,
    cards: [
      opener,
      // Scene 4: drawn marks.
      mapCard(
        "motion-traits",
        "Routes et marchés",
        {
          view: { lon: -4.1, lat: 11.0, radius: 2950 },
          areas: [{ ...BURKINA, label: "none" }],
          places: [
            place("bamako", "Binger"),
            place("ouaga", "atteint"),
            place("kong", "Kong"),
            place("salaga", "Salaga"),
          ],
          words: [
            {
              text: "le Niger",
              at: [-6.4, 14.4],
              say: "Niger",
              until: "Binger",
            },
          ],
        },
        {
          marks: [
            { kind: "river", path: "niger", say: "Niger", until: "Binger" },
            {
              kind: "route",
              // Sikasso and Bobo-Dioulasso are on the way, not named on the map.
              via: [
                "bamako",
                PLACES.sikasso.at,
                "kong",
                PLACES.bobo.at,
                "ouaga",
              ],
              foreign: true,
              say: "Binger",
              until: "Kong",
            },
            { kind: "circle", at: "ouaga", say: "atteint", until: "Kong" },
            { kind: "cross", at: "kong", say: "détruite" },
            {
              kind: "exchange",
              between: ["ouaga", "salaga"],
              ink: "a",
              say: "Salaga",
            },
          ],
        }
      ),
      // Scene 5: the headline band.
      mapCard(
        "motion-bandeau",
        "Trois langues dans un nom",
        {
          view: { ...VIEW },
          areas: [{ ...BURKINA }],
        },
        {
          headline: {
            lines: ["Un nom choisi", "en [[1984]]"],
            say: "choisi",
            until: "révolution",
          },
        }
      ),
      // Scene 7: the word card, then its map.
      {
        id: "motion-mot",
        type: "word",
        ground: "parchment",
        theme: "nuit",
        series: { id: "pays", episode: 23 },
        kicker: "Burkina Faso",
        title: "Trois langues dans un nom",
        demo: DEMO,
        word: "Burkina Faso",
        parts: [
          {
            text: "Burkina",
            lang: "mooré",
            sense: "l’intégrité",
            say: "mooré",
          },
          { text: "Faso", lang: "dioula", sense: "la patrie", say: "dioula" },
        ],
        join: {
          base: "Burkina",
          add: "bè",
          lang: "fulfulde",
          sense: "les gens de",
          say: "bè",
        },
        forms: [
          { text: "Burkinabé", kind: "variante", say: "Burkinabé" },
          { text: "Burkinabe", kind: "anglais", say: "anglais" },
        ],
        stamp: {
          date: "4 août 1984",
          label: "premier emploi officiel",
          say: "août",
        },
        source: "formes et sens à vérifier (démonstration)",
      },
      mapCard("motion-langues", "Trois langues dans un nom", {
        sequence: "bfa-113-langues",
        view: { ...VIEW },
        areas: [
          {
            file: "bfa-langue-moore.geojson",
            id: "moore",
            name: "mooré",
            ink: "a",
            label: "none",
            say: "mooré",
          },
          {
            file: "bfa-langue-jula.geojson",
            id: "jula",
            name: "dioula",
            ink: "b",
            label: "none",
            say: "dioula",
          },
          {
            file: "bfa-langue-fulfulde.geojson",
            id: "fulfulde",
            name: "fulfulde",
            ink: "c",
            label: "none",
            say: "fulfulde",
          },
        ],
        words: [
          { text: "Burkina", at: [-1.39, 12.55], ink: "a", say: "mooré" },
          { text: "Faso", at: [-4.49, 10.85], ink: "b", say: "dioula" },
        ],
      }),
      closing(),
    ],
  };
}

export const WORD_SCRIPT = [
  {
    card: "serie-pays-01",
    chunks: chunks([
      ["Le Burkina Faso a trois langues", 2.8],
      ["dans un seul nom.", 3.0],
    ]),
  },
  {
    card: "motion-traits",
    chunks: chunks([
      ["Le Niger traverse l'Ouest africain.", 2.8],
      ["En 1888, Binger va", 2.0],
      ["de Bamako à Ouagadougou,", 2.4],
      ["il atteint la ville.", 2.0],
      ["Kong, ville marchande,", 2.0],
      ["est détruite en 1897.", 2.4],
      ["Ouagadougou commerce avec Salaga,", 2.8],
      ["on y vend la kola.", 2.4],
    ]),
  },
  {
    card: "motion-bandeau",
    chunks: chunks([
      ["Ce nom n'est pas ancien,", 2.0],
      ["un nom choisi en 1984,", 2.6],
      ["par le Conseil national", 2.0],
      ["de la révolution.", 2.0],
    ]),
  },
  {
    card: "motion-mot",
    chunks: chunks([
      ["Trois langues, un seul nom.", 2.4],
      ["Burkina, en mooré, l'intégrité,", 2.6],
      ["Faso, en dioula, la patrie.", 2.4],
      ["Pour l'habitant, on ajoute bè,", 2.6],
      ["un suffixe peul, en fulfulde.", 2.4],
      ["On écrit aussi Burkinabé,", 2.2],
      ["ou Burkinabe, en anglais.", 2.2],
      ["Le nom date", 1.4],
      ["du 4 août 1984.", 2.0],
    ]),
  },
  {
    card: "motion-langues",
    chunks: chunks([
      ["Le mooré, le dioula, le fulfulde,", 2.8],
      ["trois langues du pays", 1.8],
      ["dans un seul nom.", 1.8],
    ]),
  },
  { card: "serie-pays-07", chunks: closingChunks() },
];

export function wordDemo(
  dir,
  { deck = (d) => d, script = (b) => b, edit = () => {} } = {}
) {
  return write(
    dir,
    deck(wordCards()),
    script(structuredClone(WORD_SCRIPT)),
    edit,
    { tier: "medium" }
  );
}

// node social/video/fixtures/series-motion.mjs --out DIR [--word] writes the
// cards, the voice and series.sequence.json, ready for series-render.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out");
  if (at < 0) throw new Error("Usage: series-motion.mjs --out DIR [--word]");
  const dir = resolve(process.argv[at + 1]);
  const input = process.argv.includes("--word")
    ? wordDemo(dir)
    : motionDemo(dir);
  writeFileSync(
    join(dir, "series.sequence.json"),
    JSON.stringify(input, null, 2) + "\n"
  );
  console.log(join(dir, "series.sequence.json"));
}
