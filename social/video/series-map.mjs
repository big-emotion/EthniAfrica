// The series video's map cards on satellite imagery (EthniAfrica Cartes
// 1.4.1, series.md « Map cards on satellite imagery », handoff.md « Renderer
// integration of 1.4.1 »). A map card is a still, top-down view of the
// satellite video's flat style, fitted around its subject and drawn with that
// video's overlays: this module turns the card and its base map into that
// view, in frame pixels, with no browser. series-page.mjs draws it.
import { readFileSync } from "node:fs";
import { project, unproject, placeLabels, estimateWidth } from "./sequence.mjs";
import { FLAG_STATES } from "./series-turns.mjs";

export const MAP_FRAME = {
  // The subject's box, centred on the target: x 120 to 960, y 750 to 1270.
  centre: [540, 1010],
  box: [840, 520],
  // Names on the map, at most six, never under the head or the subtitle.
  names: { x: [60, 1020], y: [724, 1296] },
  maxNames: 6,
  // A subject shorter than this at the scale limit is refused.
  minSubject: 120,
  // No source pixel enlarged past 1.5 at the end of the card's slow zoom.
  maxScale: 1.5,
  maxZoom: 1.04,
  // A map card's foot holds its key: it may start at y 1600.
  foot: [1600, 1786],
};
// The verified imagery of the series map cards (series.md, « Scale limit »).
export const MAP_IMAGERY = "bmng-2004-07-topo-bathy";
const EARTH_KM = 6371;
const fail = (message) => {
  throw new Error(message);
};
const round = (n) => +n.toFixed(1);

// What the satellite grammar draws. An atlas card is refused as a whole; any
// other field is refused rather than silently dropped.
const ATLAS_FIELDS = ["atlas", "categorical", "marks", "dimOutside"];
const DRAWN = new Set([
  "data",
  "dataRef",
  // The carousel's window on its base map: the video frames the subject.
  "view",
  "borders",
  "highlight",
  "areas",
  "labels",
  "places",
  "countryLabels",
  "waterLabels",
  // Nudges a carousel name by card pixels: the video places names by rule.
  "labelOffsets",
  "caption",
]);

// A card of a map sequence (1.5.0) draws its areas from the repository's
// files and its own borders; the 1.4.1 fields that need the base map or
// Natural Earth's countries (highlight, card-unit labels and places) have no
// place in a sequence and are refused like any other undrawn field.
const SEQUENCE_DRAWN = new Set(["sequence", "areas", "borders", "caption"]);
// 1.11.0, the animated satellite map (handoff, « Card data »): the fields a
// map phase adds beside the 1.5.0 ones. A card with none of them is drawn
// exactly as in 1.5.0.
const ANIMATED_DRAWN = {
  view: ["lon", "lat", "radius"],
  moves: ["say", "lon", "lat", "radius"],
  arrows: [
    "id",
    "from",
    "to",
    "via",
    "people",
    "ink",
    "foreign",
    "say",
    "bend",
    "both",
    "trace",
    "out",
    // A sea voyage, checked against the land when the map renders.
    "sea",
  ],
  // 1.16.0: a drawing is a symbol (`kind`) or a planted flag (`flag`, and
  // the `swap` that folds it for another); a word bubble carries its studied
  // `word` and may `morph` into another; `label: false` writes nothing.
  drawings: [
    "kind",
    "flag",
    "at",
    "say",
    "until",
    "label",
    "swap",
    "word",
    "morph",
  ],
  words: ["text", "kind", "at", "say", "until", "people", "ink"],
  // 1.13.0: a place may carry an id, which drawn marks name.
  // 1.16.0: `label: "none"` keeps the dot and writes no name; a universal
  // map writes a place's name only when `label: "name"` and it is studied.
  places: ["id", "name", "at", "say", "side", "label"],
  facts: ["say", "shows"],
  rename: ["from", "to", "dates", "at", "say"],
  // The foot's key, when the plan groups its marks (« Royaumes », « Chemin
  // des Mossi ») instead of listing every area.
  key: ["swatch", "label"],
};
const ANIMATED_AREA = ["id", "people", "states", "nameAt", "label"];
const AREA_FIELDS = ["file", "name", "ink", "lang", "say", "langSay"];
export const AREA_INKS = ["a", "b", "c", "d"];
// Narration v4 of « Zaïre », board S9 (approved 27 October 2026): six
// provinces of one kingdom, each in its own colour, need two more inks than
// the four of a sequence. They are the board's green and pink, kept for
// approximate zones only, which are hatched and dashed: on a filled certain
// area, an arrow or a word, four inks stay the rule, so a people's ink never
// competes with them.
export const ZONE_INKS = ["e", "f"];
const AREA_DIR = new URL("./data/areas/", import.meta.url);

// The map drawings (assets/Illustrations/README.md) and the label each takes
// under it on the map. The eight of series 1 carry a French word; the
// symbols of 1.16.0 carry none, so a map reads without French.
export const ILLUSTRATIONS = {
  or: "or",
  kola: "kola",
  eleveurs: "éleveurs",
  cavaliers: "cavaliers",
  commercants: "commerçants",
  guerres: "guerres",
  colonne: "colonne française",
  travailleurs: "travailleurs",
  caravelle: null,
  padrao: null,
  fort: null,
  roi: null,
  seigneur: null,
  conseil: null,
  nzimbu: null,
  "or-barre": null,
  tribut: null,
  tissu: null,
  ivoire: null,
  parole: null,
  "parole-or": null,
  registre: null,
  theatre: null,
  canne: null,
  epices: null,
  peuple: null,
  traversee: null,
};
// The word bubble's two states: the people's word on cream paper, the word
// it became in gold (reached by a morph).
export const BUBBLE_KINDS = { from: "parole", to: "parole-or" };

// 1.11.0, the marks on the map (series.md, « Where the marks sit », 4 to 6).
export const MARKS = {
  band: { x: [60, 1020], y: [724, 1296] },
  maxTexts: 8,
  maxWords: 2,
  clearance: 12,
  maxDrawings: 3,
  maxArrowsFull: 3,
  // The colonial power's ink, outside the four (token map-foreign).
  foreign: "#f3e9da",
  phraseChars: 26,
  // Font size and line height of each word style and of the labels.
  styles: {
    // Ratios: the advance of an average letter in em, measured on the
    // boards' drawn boxes (frames-report.json of the 1.11.0 boards).
    phrase: { size: 40, line: 48, ratio: 0.52, outline: 6 },
    name: { size: 40, line: 48, ratio: 0.52, outline: 6 },
    date: { size: 80, line: 80, ratio: 0.5, outline: 9 },
    country: { size: 64, line: 70, ratio: 0.62, outline: 8 },
    dates: { size: 30, line: 36, ratio: 0.52, outline: 4 },
    label: { size: 28, line: 32, ratio: 0.48, outline: 4 },
    place: { size: 28, line: 32, ratio: 0.62, outline: 0 },
  },
};
// The proportion rule (series.md, « 5. Proportions »): s is the shorter side
// of the smallest lit area's box on screen.
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const arrowWidth = (s) => clamp(Math.round(s / 14), 5, 10);
export const drawingHeight = (s) => clamp(Math.round(1.1 * s), 100, 150);

// Series.md, « 2. Area states »: the fill, edge, keyline, hatching and name
// of an area between context (lit 0) and lit (lit 1). At lit 1 these are the
// 1.4.1 grammar's own values, so a lit area reads as before.
// `hatch` is the opacity of an approximate area's hatching; a certain area
// has none. The page draws with this very function (sent as source).
export function areaStyle(lit) {
  const r = (n) => Math.round(n * 1000) / 1000;
  return {
    fill: r(0.1 + 0.2 * lit),
    edge: r(2.5 + 1.5 * lit),
    edgeOpacity: r(0.6 + 0.4 * lit),
    keyline: r(5 + 3 * lit),
    keylineOpacity: r(0.55 * (0.6 + 0.4 * lit)),
    hatch: r(0.35 + 0.65 * lit),
    name: r(0.6 + 0.4 * lit),
  };
}

// The band names are placed in so that, pushed `push` times around the map's
// centre (540, 1010) by the end of their card, they are still inside `band`:
// marks keep their pixel size while the map grows under them (1.13.0).
export function pushedBand(band, push) {
  const [cx, cy] = MAP_FRAME.centre;
  const inward = (v, c) => c + (v - c) / push;
  return {
    x: [inward(band.x[0], cx), inward(band.x[1], cx)],
    y: [inward(band.y[0], cy), inward(band.y[1], cy)],
  };
}

export const isAnimatedCard = (card) =>
  card.opening === "globe" ||
  Object.keys(ANIMATED_DRAWN).some((k) => k in (card.map ?? {})) ||
  (card.map?.areas ?? []).some((a) => ANIMATED_AREA.some((k) => k in a));

export function checkSeriesMapCard(card) {
  const map = card.map ?? fail(`Card ${card.id} has no map`);
  if (ATLAS_FIELDS.some((k) => k in map))
    fail(`Card ${card.id}: Carte d'atlas : carrousel seulement`);
  const sequence = "sequence" in map;
  for (const k of Object.keys(map))
    if (
      !(sequence ? SEQUENCE_DRAWN : DRAWN).has(k) &&
      !(sequence && k in ANIMATED_DRAWN)
    )
      fail(
        `Card ${card.id}: map.${k} has no equivalent on satellite imagery; the video cannot draw it`
      );
  if (!["none", "quiet", "strong", undefined].includes(map.borders))
    fail(
      `Card ${card.id}: borders « ${map.borders} » are not drawn on imagery (none, quiet or strong)`
    );
  if (card.opening !== undefined) {
    if (card.opening !== "globe" || card.type !== "opener")
      fail(`Card ${card.id}: only the opener opens, on the globe`);
    if (!sequence || !map.view)
      fail(
        `Card ${card.id}: the globe opens on a map sequence's first view (map.view)`
      );
    if (map.moves?.length)
      fail(`Card ${card.id}: the globe is the opener's only camera move`);
  }
  if (sequence) checkSequenceAreas(card);
  if (sequence && isAnimatedCard(card)) checkAnimatedFields(card);
}

// Check 1 of 1.5.0: a sequence's areas are files of social/video/data/areas/,
// built by areas.mjs from cited sources; the engine reads no inline path.
function checkSequenceAreas(card) {
  const { sequence, areas } = card.map;
  if (typeof sequence !== "string" || !sequence.trim())
    fail(`Card ${card.id}: map.sequence names its sequence`);
  if (!Array.isArray(areas))
    fail(`Card ${card.id}: a map sequence lists its areas`);
  for (const a of areas) {
    const what = `Card ${card.id}, area ${a.name ?? a.file}`;
    if (
      "paths" in a ||
      typeof a.file !== "string" ||
      !/^[\w-][\w.-]*\.geojson$/u.test(a.file)
    )
      fail(
        `${what}: a sequence area is a file of social/video/data/areas/; inline paths and other folders are refused`
      );
    if (typeof a.name !== "string" || !a.name.trim())
      fail(`${what}: an area carries its name`);
    // 1.11.0: the ink follows the people; a territory gives its own.
    if (a.people !== undefined && a.ink !== undefined)
      fail(`${what}: an area gives its people or ink, not both`);
    if (
      a.people === undefined &&
      !AREA_INKS.includes(a.ink) &&
      !ZONE_INKS.includes(a.ink)
    )
      fail(
        `${what}: ink « ${a.ink} » is not one of the four area inks, a to d (e and f for approximate zones)`
      );
  }
}

const isPoint = (p) =>
  Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
// The new fields' shapes, before anything is timed: an unknown field is
// refused rather than silently dropped, as for the 1.4.1 grammar.
function checkAnimatedFields(card) {
  const map = card.map;
  const say = (where, s) => {
    if (typeof s !== "string" || !s.trim())
      fail(`Card ${card.id}: ${where} names its word (say)`);
  };
  const fields = (where, item, allowed) => {
    for (const k of Object.keys(item))
      if (!allowed.includes(k))
        fail(
          `Card ${card.id}: ${where}.${k} is not a field of the animated map`
        );
  };
  if (map.view) {
    fields("map.view", map.view, ANIMATED_DRAWN.view);
    if (!["lon", "lat", "radius"].every((k) => Number.isFinite(map.view[k])))
      fail(`Card ${card.id}: map.view gives lon, lat and radius`);
  }
  for (const k of [
    "moves",
    "arrows",
    "drawings",
    "words",
    "places",
    "facts",
    "key",
  ]) {
    if (map[k] === undefined) continue;
    if (!Array.isArray(map[k])) fail(`Card ${card.id}: map.${k} is a list`);
    map[k].forEach((item, i) =>
      fields(`map.${k}[${i}]`, item, ANIMATED_DRAWN[k])
    );
  }
  map.areas.forEach((a, i) =>
    fields(`map.areas[${i}]`, a, [...AREA_FIELDS, ...ANIMATED_AREA])
  );
  for (const [i, a] of map.areas.entries()) {
    for (const s of a.states ?? []) {
      say(`map.areas[${i}].states`, s.say);
      if (!/^(lit|context|out|ink:[a-d])$/u.test(s.to ?? ""))
        fail(
          `Card ${card.id}: area ${a.name} goes to « ${s.to} »: lit, context, ink:a to ink:d or out`
        );
    }
    if (a.nameAt !== undefined && !isPoint(a.nameAt))
      fail(`Card ${card.id}: area ${a.name}'s nameAt is [lon, lat]`);
    if (!["area", "country", "none", undefined].includes(a.label))
      fail(`Card ${card.id}: area ${a.name}'s label is area, country or none`);
  }
  for (const m of map.moves ?? []) {
    say("a move", m.say);
    if (!["lon", "lat", "radius"].every((k) => Number.isFinite(m[k])))
      fail(`Card ${card.id}: a move gives lon, lat and radius`);
  }
  const ids = new Set();
  for (const a of map.arrows ?? []) {
    say(`arrow ${a.id}`, a.say);
    if (typeof a.id !== "string" || ids.has(a.id))
      fail(`Card ${card.id}: every arrow has its own id`);
    ids.add(a.id);
    if (![a.from, a.to, ...(a.via ?? [])].every(isPoint))
      fail(`Card ${card.id}: arrow ${a.id} runs from [lon, lat] to [lon, lat]`);
    const owners = [a.people, a.ink, a.foreign].filter((x) => x !== undefined);
    if (owners.length !== 1)
      fail(
        `Card ${card.id}: arrow ${a.id} gives one of people, ink or foreign`
      );
    if (a.ink !== undefined && !AREA_INKS.includes(a.ink))
      fail(`Card ${card.id}: arrow ${a.id}'s ink is a to d`);
    if (a.foreign !== undefined && a.foreign !== true)
      fail(`Card ${card.id}: arrow ${a.id}: foreign is true or absent`);
    if (a.sea !== undefined && a.sea !== true)
      fail(`Card ${card.id}: arrow ${a.id}: sea est true ou absent`);
  }
  for (const d of map.drawings ?? []) checkDrawing(card, d, say);
  for (const w of map.words ?? []) {
    say(`word « ${w.text} »`, w.say);
    if (typeof w.text !== "string" || !w.text.trim() || !isPoint(w.at))
      fail(`Card ${card.id}: a word gives its text and where it sits`);
    // 1.14.0 (question 4): the free phrase is retired; a map word is a
    // name, a date or a century.
    checkMapWord(card, w);
    if (w.people !== undefined && w.ink !== undefined)
      fail(
        `Card ${card.id}: word « ${w.text} » gives its people or ink, not both`
      );
  }
  for (const p of map.places ?? []) {
    if (typeof p.name !== "string" || !p.name.trim() || !isPoint(p.at))
      fail(`Card ${card.id}: a place gives its name and where it is`);
    if (!["name", "none", undefined].includes(p.label))
      fail(`Card ${card.id}: place ${p.name}'s label is name or none`);
  }
  for (const f of map.facts ?? []) {
    say("a fact", f.say);
    if (!Array.isArray(f.shows) || !f.shows.length)
      fail(`Card ${card.id}: the fact « ${f.say} » names its marks`);
    // 1.14.0: the figures on the map are marks of a fact too.
    for (const s of f.shows)
      if (
        !/^(area|arrow|illus|flag|lords|text|count|cascade|units|row|gauge|lettering|stamp|frame|travel):\S/u.test(
          s
        )
      )
        fail(
          `Card ${card.id}: the mark « ${s} » is area:, arrow:, illus:, flag:, lords:, text: or a figure's (count:, cascade:, units:, row:, gauge:, lettering:, stamp:, frame:, travel:)`
        );
  }
  if (map.rename) {
    fields("map.rename", map.rename, ANIMATED_DRAWN.rename);
    say("the rename", map.rename.say);
    if (
      !["from", "to", "dates"].every(
        (k) => typeof map.rename[k] === "string"
      ) ||
      !isPoint(map.rename.at)
    )
      fail(`Card ${card.id}: a rename gives from, to, dates and at`);
  }
}

// A drawing of the animated map: a symbol of assets/Illustrations/ or, since
// 1.16.0, a flag of assets/Flags/ planted on its place.
function checkDrawing(card, d, say) {
  const what = `Card ${card.id}`;
  if ((d.kind === undefined) === (d.flag === undefined))
    fail(
      `${what}: un dessin ou un drapeau planté, l'un des deux (kind ou flag)`
    );
  const name = d.kind ?? `drapeau ${d.flag}`;
  say(`drawing ${name}`, d.say);
  if (!isPoint(d.at)) fail(`${what}: drawing ${name} sits at [lon, lat]`);
  if (d.label !== undefined && d.label !== false && typeof d.label !== "string")
    fail(`${what}: drawing ${name}: label is a word or false`);
  if (d.flag !== undefined) {
    const known = (id) => {
      if (!Object.hasOwn(FLAG_STATES, id))
        fail(
          `${what}: pas de drapeau « ${id} » dans assets/Flags (${Object.keys(FLAG_STATES).join(", ")})`
        );
    };
    known(d.flag);
    if (d.swap !== undefined) {
      if (typeof d.swap !== "object" || !d.swap.flag || !d.swap.say)
        fail(
          `${what}: un drapeau en remplace un autre par swap: { flag, say }`
        );
      known(d.swap.flag);
    }
    if (d.word !== undefined || d.morph !== undefined || d.label !== undefined)
      fail(`${what}: un drapeau planté n'écrit rien (word, morph, label)`);
    return;
  }
  if (!Object.hasOwn(ILLUSTRATIONS, d.kind))
    fail(
      `${what}: no drawing « ${d.kind} » in assets/Illustrations/ (${Object.keys(ILLUSTRATIONS).join(", ")})`
    );
  if (d.swap !== undefined)
    fail(`${what}: seul un drapeau planté se remplace (swap)`);
  if (d.kind === BUBBLE_KINDS.from) {
    if (typeof d.word !== "string" || !d.word.trim())
      fail(`${what}: une bulle porte le mot étudié (word)`);
    if (d.morph !== undefined) {
      const { word, say: on, to, ...rest } = d.morph;
      if (
        typeof word !== "string" ||
        !word.trim() ||
        !on ||
        Object.keys(rest).length
      )
        fail(`${what}: une bulle change de mot par morph: { word, say, to? }`);
      if (to !== undefined && !isPoint(to))
        fail(`${what}: la bulle glisse vers [lon, lat] (morph.to)`);
    }
  } else if (d.word !== undefined || d.morph !== undefined)
    fail(`${what}: seule une bulle (parole) porte un mot`);
}

// ---------------------------------------------------------------------------
// Cartes 1.16.0, symbols not words (series.md « 1.16.0 »). An episode that
// declares its studied words (`studiedWords` on the series video) has
// universal maps: a text on the map is a date or a century, or one of those
// words; everything else is a symbol, a flag or a movement. The foot
// (sources, key) and the subtitles are not the map.
export function checkStudiedWords(words) {
  if (
    !Array.isArray(words) ||
    !words.length ||
    words.some((w) => typeof w !== "string" || !w.trim())
  )
    fail("studiedWords liste les mots étudiés de l'épisode, non vides");
}
const folded = (text) =>
  String(text).trim().normalize("NFC").toLocaleLowerCase("fr");
export const isStudiedWord = (studied, text) =>
  studied.some((w) => folded(w) === folded(text));
// A date or a century is written in figures, not in French: « 1482 »,
// « 1971–1997 », « ≤ 1400 », « XVe ». A number with a unit word (« 2 000
// langues ») is a phrase.
const FIGURES_ONLY = /^[\d\s\p{Pd}/.,?≤≥~]+$|^[IVXLC]+e$/u;
export const writtenOnUniversalMap = (studied, text) =>
  FIGURES_ONLY.test(String(text).trim()) || isStudiedWord(studied, text);
export function checkUniversalCard(card, studied) {
  const map = card.map ?? {};
  const written = (text) => {
    if (!writtenOnUniversalMap(studied, text))
      fail(
        `Card ${card.id}: Carte universelle (1.16.0) : « ${text} » s'écrit en français ; le montrer par un symbole (map.drawings) ou un drapeau. Sur la carte ne s'écrivent que les dates et le mot étudié (${studied.join(", ")})`
      );
  };
  for (const w of map.words ?? [])
    if (w.kind !== "date" && w.kind !== "century") written(w.text);
  for (const d of map.drawings ?? []) {
    if (typeof d.label === "string") written(d.label);
    for (const word of [d.word, d.morph?.word])
      if (word !== undefined && !isStudiedWord(studied, word))
        fail(
          `Card ${card.id}: une bulle porte le mot étudié de l'épisode (${studied.join(", ")}), pas « ${word} »`
        );
  }
  for (const a of map.areas ?? [])
    if (a.label === "area" || a.label === "country") written(a.name);
  for (const p of map.places ?? []) if (p.label === "name") written(p.name);
  if (map.rename) for (const k of ["from", "to"]) written(map.rename[k]);
  for (const p of card.pins ?? []) written(p.name);
  for (const l of card.letterings ?? []) written(l.text);
  for (const s of card.stamps ?? []) written(s.text);
}

// ---------------------------------------------------------------------------
// Words on the map (series.md « 1.11.0 Words on the map », changed by
// 1.14.0, question 4): the free phrase is retired. A map word is a name, a
// date or a century; a word with more than four words, a colon or a verb the
// loader knows is a sentence, to be drawn or put in the headline band.
export const MAP_WORD_KINDS = ["name", "date", "century"];
// The verbs the loader can detect: the forms the series' narrations use
// (être, avoir and the verbs of naming, saying and becoming). A list, not a
// grammar: a sentence it misses still fails the operator's review.
const VERBS = new Set(
  (
    "est sont était étaient fut a ont avait avaient devient deviennent devenu " +
    "devenue nomme nomment nommait nommé désigne désignent désignait reste " +
    "restent existe existent existait signifie signifiait veut voulait dit " +
    "disent disaient disait appelle appellent appelait écrit écrivent montre " +
    "montrent fonde fondent fondé vient viennent venait parle parlent " +
    "circule circulent circulaient impose imposé étend étendu étendent"
  ).split(" ")
);
const PHRASE =
  "Phrase sur la carte : la dessiner, ou la mettre dans le bandeau";
export function checkMapWord(card, w) {
  const what = `Card ${card.id}`;
  if (w.kind === "phrase")
    fail(`${what}: ${PHRASE} (« ${w.text} », la phrase libre est retirée)`);
  if (w.kind !== undefined && !MAP_WORD_KINDS.includes(w.kind))
    fail(
      `${what}: un mot sur la carte est un nom, une date ou un siècle (« ${w.text} »)`
    );
  const words = w.text.split(/\s+/u).filter(Boolean);
  // An initial (« A. Thevet ») is a name, not the verb « a ».
  const verb = words.find(
    (x) =>
      !/^\p{Lu}\.$/u.test(x) &&
      VERBS.has(
        x
          .toLowerCase()
          .replace(/^\p{L}['’]/u, "")
          .replace(/[\p{P}]+$/u, "")
      )
  );
  if (words.length > 4 || w.text.includes(":") || verb)
    fail(`${what}: ${PHRASE} (« ${w.text} »)`);
}

// The ink of a mark: its people's (input.inks), a territory's own, or cream
// for a colonial power, outside the four inks.
export function markInk(mark, inks, what) {
  if (mark.foreign) return "w";
  if (mark.people !== undefined)
    return (
      inks?.[mark.people] ?? fail(`${what}: Peuple sans encre : ${mark.people}`)
    );
  return mark.ink;
}

const polygonRings = (g) =>
  g.type === "Polygon"
    ? [g.coordinates]
    : g.type === "MultiPolygon"
      ? g.coordinates
      : fail(`${g.type} is not an area`);

// One area file with its provenance, as the satellite video reads it.
export function loadSequenceArea(file) {
  let geojson;
  try {
    geojson = JSON.parse(readFileSync(new URL(file, AREA_DIR), "utf8"));
  } catch (error) {
    fail(
      `Area ${file}: not a file of social/video/data/areas/ (${error.message})`
    );
  }
  const feature =
    geojson.type === "FeatureCollection" && geojson.features.length === 1
      ? geojson.features[0]
      : geojson;
  const p = feature.properties ?? {};
  for (const field of ["kind", "source", "licence"])
    if (typeof p[field] !== "string" || !p[field].trim())
      fail(`Area ${file}: no ${field}`);
  if (!["approximate", "certain"].includes(p.kind))
    fail(`Area ${file}: kind is approximate or certain, not ${p.kind}`);
  return {
    file,
    uncertain: p.kind !== "certain",
    // 1.13.0: a flag fills only an area that is a state (category country).
    category: p.category,
    polygons: polygonRings(feature.geometry),
  };
}

// The flat (orthographic, top-down) branch of sequence.mjs's `project`,
// written with no outside reference so the page runs this very function on
// each frame of a change of view.
export function flatProject(camera, lon, lat) {
  const rad = Math.PI / 180;
  const l = (lon - camera.lon) * rad;
  const p = lat * rad;
  const p0 = camera.lat * rad;
  const x = Math.cos(p) * Math.sin(l);
  const y =
    Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
  return [540 + camera.radius * x, camera.centreY - camera.radius * y];
}

// 1.5.0: « contours » when the map draws no border, « frontières » when it
// does. A 1.4.1 card keeps its own line (seriesMapCredits).
export function sequenceCredits(map, imagery) {
  const lines = (map.borders ?? "none") === "none" ? "contours" : "frontières";
  return {
    source: seriesMapCredits(map, imagery).source,
    imagery: `Imagerie : ${imagery.credit} ; ${lines} : Natural Earth, domaine public`,
  };
}

// « équirectangulaire, 19 px par degré, origine -19° 30° » or « …, origine
// 28,45° E 4,42° N ».
export function baseMapProjection(meta) {
  const m =
    /([\d.,]+) px par degré, origine ([-\d.,]+)°\s*([EW])?\s+([-\d.,]+)°\s*([NS])?/u.exec(
      meta.projection ?? ""
    ) ?? fail(`No equirectangular projection in « ${meta.projection} »`);
  const num = (s) => Number(s.replace(",", "."));
  return {
    k: num(m[1]),
    lon0: m[3] === "W" ? -num(m[2]) : num(m[2]),
    lat0: m[5] === "S" ? -num(m[4]) : num(m[4]),
  };
}

export const cardPoint = ({ k, lon0, lat0 }, x, y) => [
  lon0 + x / k,
  lat0 - y / k,
];

const pathTokens = (d) => {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  for (const t of tokens)
    if (/[A-Za-z]/.test(t) && !/^[MLCZ]$/.test(t))
      fail(
        `Card paths use absolute M, L, C and Z commands only; « ${t} » found`
      );
  return tokens;
};

// Every coordinate pair of a card path, control points included.
export function pathCoordinates(d) {
  const numbers = pathTokens(d)
    .filter((t) => !/[A-Z]/.test(t))
    .map(Number);
  const pairs = [];
  for (let i = 0; i + 1 < numbers.length; i += 2)
    pairs.push([numbers[i], numbers[i + 1]]);
  return pairs;
}

// The same path with every pair mapped by `f`, commands kept.
export function mapPath(d, f) {
  let out = "";
  let pending = [];
  let first = true;
  const flush = () => {
    for (let i = 0; i + 1 < pending.length; i += 2) {
      const [x, y] = f([pending[i], pending[i + 1]]);
      out += `${first ? "" : " "}${round(x)},${round(y)}`;
      first = false;
    }
    pending = [];
  };
  for (const t of pathTokens(d)) {
    if (/[A-Z]/.test(t)) {
      flush();
      out += t;
      first = true;
    } else pending.push(Number(t));
  }
  flush();
  return out;
}

const polygonsOf = (g) =>
  g.type === "Polygon"
    ? [g.coordinates]
    : g.type === "MultiPolygon"
      ? g.coordinates
      : [];

// Natural Earth 1:50m admin 0, by ADM0_A3 (the codes the base maps use).
export function countryIndex(geojson) {
  const index = new Map();
  for (const f of geojson.features) {
    const p = f.properties;
    index.set(p.ADM0_A3, {
      name: p.NAME_FR ?? p.NAME,
      label: [p.LABEL_X, p.LABEL_Y],
      polygons: polygonsOf(f.geometry),
    });
  }
  return index;
}

// The land borders: every edge two countries share, joined into lines.
// Natural Earth's countries share their border vertices exactly, so a
// coastline (an edge of one country only) is never drawn.
export function sharedBorders(geojson, [west, east, south, north]) {
  const inside = ([lon, lat]) =>
    lon >= west && lon <= east && lat >= south && lat <= north;
  const owners = new Map();
  const point = new Map();
  const id = (p) => {
    const key = `${p[0]},${p[1]}`;
    point.set(key, p);
    return key;
  };
  for (const f of geojson.features)
    for (const polygon of polygonsOf(f.geometry))
      for (const ring of polygon)
        for (let i = 0; i + 1 < ring.length; i++) {
          if (!inside(ring[i]) && !inside(ring[i + 1])) continue;
          const [a, b] = [id(ring[i]), id(ring[i + 1])].sort();
          if (a === b) continue;
          const key = `${a}|${b}`;
          if (!owners.has(key)) owners.set(key, new Set());
          owners.get(key).add(f.properties.ADM0_A3);
        }
  const next = new Map();
  const link = (a, b) => {
    if (!next.has(a)) next.set(a, []);
    next.get(a).push(b);
  };
  for (const [key, isos] of owners) {
    if (isos.size < 2) continue;
    const [a, b] = key.split("|");
    link(a, b);
    link(b, a);
  }
  const used = new Set();
  const edge = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const lines = [];
  const walk = (start) => {
    for (const first of next.get(start)) {
      if (used.has(edge(start, first))) continue;
      const line = [start];
      let [from, to] = [start, first];
      for (;;) {
        used.add(edge(from, to));
        line.push(to);
        if (next.get(to).length !== 2) break;
        const after = next.get(to).find((n) => n !== from);
        if (used.has(edge(to, after))) break;
        [from, to] = [to, after];
      }
      lines.push(line.map((k) => point.get(k)));
    }
  };
  const nodes = [...next.keys()].sort();
  // Line ends and junctions first, then the closed loops left.
  nodes.filter((n) => next.get(n).length !== 2).forEach(walk);
  nodes.forEach(walk);
  return lines;
}

// The still top-down view: centred on the middle of the subject's longitude
// and latitude box at (540, 1010); the largest radius that keeps every
// subject point within 840 × 520 around it; capped by the imagery's scale
// limit at the end of the card's zoom or, since 1.13.0, of its push: a card
// is framed at the limit divided by its push.
export function fitMapCamera(box, imagery, points, push = MAP_FRAME.maxZoom) {
  const lon = (box.west + box.east) / 2;
  const lat = (box.south + box.north) / 2;
  const centreY = MAP_FRAME.centre[1];
  const unit = { lon, lat, radius: 1, centreY };
  const sample = points ?? [
    ...[0, 0.25, 0.5, 0.75, 1].flatMap((t) => [
      [box.west + t * (box.east - box.west), box.south],
      [box.west + t * (box.east - box.west), box.north],
      [box.west, box.south + t * (box.north - box.south)],
      [box.east, box.south + t * (box.north - box.south)],
    ]),
  ];
  let fit = Infinity;
  for (const [x, y] of sample) {
    const p = project(unit, x, y);
    const dx = Math.abs(p.x - MAP_FRAME.centre[0]);
    const dy = Math.abs(p.y - centreY);
    if (dx > 0) fit = Math.min(fit, MAP_FRAME.box[0] / 2 / dx);
    if (dy > 0) fit = Math.min(fit, MAP_FRAME.box[1] / 2 / dy);
  }
  const limit = (MAP_FRAME.maxScale * imagery.width) / (2 * Math.PI) / push;
  // A push past the slow zoom's 4 % frames the subject smaller, so that at
  // the end of the card it still stands where the 1.4.1 box put it.
  const radius = Math.min(fit * Math.min(1, MAP_FRAME.maxZoom / push), limit);
  const camera = { lon, lat, radius, centreY };
  const xs = [];
  const ys = [];
  for (const [x, y] of sample) {
    const p = project(camera, x, y);
    xs.push(p.x);
    ys.push(p.y);
  }
  const long = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys)
  );
  if (long < MAP_FRAME.minSubject)
    fail(
      `Sujet trop petit pour l'imagerie vérifiée: ${Math.round(long)} px across at the imagery's limit, ${MAP_FRAME.minSubject} at least`
    );
  return {
    ...camera,
    capped: fit > limit,
    spanKm: (1080 / radius) * EARTH_KM,
  };
}

// The longitude and latitude the frame shows, with a margin: the region the
// full-resolution imagery must cover.
export function frameBounds(camera) {
  const lons = [];
  const lats = [];
  for (let x = 0; x <= 1080; x += 90)
    for (let y = 0; y <= 1920; y += 120) {
      const g = unproject(camera, x, y);
      if (!g) continue;
      lons.push(g.lon);
      lats.push(g.lat);
    }
  return [
    Math.max(-180, Math.floor(Math.min(...lons)) - 1),
    Math.min(180, Math.ceil(Math.max(...lons)) + 1),
    Math.max(-90, Math.floor(Math.min(...lats)) - 1),
    Math.min(90, Math.ceil(Math.max(...lats)) + 1),
  ];
}

export function seriesMapCredits(map, imagery) {
  return {
    source: (map.caption?.source ?? "")
      .replace(/\s*;\s*fond [^;]*$/u, "")
      .trim(),
    imagery: `Imagerie : ${imagery.credit} ; frontières : Natural Earth, domaine public`,
  };
}

// The 0.4.0 placement rule at the series sizes (series.md, « Names »).
const LABEL_STYLES = {
  region: {
    sizes: [44, 40, 36],
    box: (t, s) => [estimateWidth(t, s, 0.58), s + 8],
  },
  area: { sizes: [32], box: (t, s) => [estimateWidth(t, s, 0.55), s + 6] },
  water: { sizes: [26], box: (t, s) => [estimateWidth(t, s, 0.55), s + 4] },
};
const inkOf = (tone) => (tone ?? "area-a").replace("area-", "");

const extent = (points) => ({
  west: Math.min(...points.map((p) => p[0])),
  east: Math.max(...points.map((p) => p[0])),
  south: Math.min(...points.map((p) => p[1])),
  north: Math.max(...points.map((p) => p[1])),
});
const within = (a, b) =>
  a.west >= b.west &&
  a.east <= b.east &&
  a.south >= b.south &&
  a.north <= b.north;

// One map card as the series frame draws it: camera, overlays and names in
// frame pixels at 100 % (the slow zoom scales them around (540, 1010)), the
// key, the credits, the subject's box and the imagery's enlargement.
// `push` is the card's zoom on its last frame (1.13.0: the push of a
// picture), which the framing leaves room for.
export function seriesMapView(
  card,
  data,
  countries,
  world,
  imagery,
  push = MAP_FRAME.maxZoom
) {
  checkSeriesMapCard(card);
  const map = card.map;
  const proj = baseMapProjection(data.meta);
  const fromCard = ([x, y]) => cardPoint(proj, x, y);
  const highlighted = (map.highlight?.isos ?? []).map(
    (iso) =>
      countries.get(iso) ??
      fail(`Card ${card.id}: no Natural Earth country ${iso}`)
  );
  const areas = (map.areas ?? []).map((a) => ({
    area: a,
    points: a.paths.flatMap((d) => pathCoordinates(d).map(fromCard)),
  }));
  let subject = [
    ...highlighted.flatMap((c) => c.polygons.flatMap((p) => p[0])),
    ...areas.flatMap((a) => a.points),
  ];
  if (!subject.length) {
    const [x, y, w, h] =
      map.view ?? data.meta.viewBox.split(/[ ,]+/).map(Number);
    subject = [fromCard([x, y]), fromCard([x + w, y + h])];
  }
  const camera = fitMapCamera(extent(subject), imagery, subject, push);
  const at = (lon, lat) => {
    const p = project(camera, lon, lat);
    return [p.x, p.y];
  };
  const ring = (points) =>
    "M" +
    points.map(([lon, lat]) => at(lon, lat).map(round).join(",")).join("L");
  const bounds = frameBounds(camera);

  const drawn = [];
  const key = [];
  if (map.highlight) {
    const ink = inkOf(map.highlight.tone);
    drawn.push({
      d: highlighted
        .flatMap((c) => c.polygons.flatMap((p) => p.map((r) => ring(r) + "Z")))
        .join(""),
      ink,
      uncertain: false,
      hatch: 45,
    });
    if (map.highlight.legend)
      key.push({ swatch: `certain-${ink}`, label: map.highlight.legend });
  }
  const seen = [];
  for (const { area: a, points } of areas) {
    const ink = inkOf(a.tone);
    const uncertain = a.kind !== "certain";
    const box = extent(points);
    // An area inside an earlier one is hatched the other way (0.4.0).
    const hatch = seen.some((b) => within(box, b)) ? 135 : 45;
    seen.push(box);
    drawn.push({
      d: a.paths.map((d) => mapPath(d, (p) => at(...fromCard(p)))).join(""),
      ink,
      uncertain,
      hatch,
    });
    const label = a.legend ?? a.label;
    if (label)
      key.push({
        swatch: `${uncertain ? "uncertain" : "certain"}-${ink}`,
        label,
      });
  }
  const borders = [];
  if (map.borders === "quiet" || map.borders === "strong") {
    const lines = sharedBorders(world, bounds);
    if (lines.length)
      borders.push({
        d: lines.map((l) => ring(l)).join(""),
        strong: map.borders === "strong",
      });
    if (map.borders === "strong")
      key.push({ swatch: "border-strong", label: "Frontières actuelles" });
  }

  // Names: the highlighted countries, or every country, then the card's own.
  const [bx, by] = [MAP_FRAME.names.x, MAP_FRAME.names.y];
  const inBand = ([x, y]) =>
    x >= bx[0] && x <= bx[1] && y >= by[0] && y <= by[1];
  const labels = [];
  const add = (text, [x, y], style, ink) =>
    labels.push({
      key: labels.length,
      text,
      style,
      ink,
      anchor: { x, y },
    });
  if (map.countryLabels === "highlight")
    for (const c of highlighted) add(c.name, at(...c.label), "region");
  else if (map.countryLabels === true)
    for (const l of data.labels?.countries ?? []) {
      const p = at(...fromCard([l.x, l.y]));
      if (inBand(p)) add(l.text, p, "region");
    }
  for (const l of map.labels ?? []) {
    if (l.kind === "country" && (map.borders ?? "none") === "none") continue;
    const style =
      l.kind === "area" ? "area" : l.kind === "water" ? "water" : "region";
    add(
      l.text,
      at(...fromCard([l.x, l.y])),
      style,
      l.tone ? inkOf(l.tone) : undefined
    );
  }
  if (map.waterLabels === true)
    for (const lake of data.lakes ?? []) {
      const e = extent(pathCoordinates(lake.d).map(fromCard));
      const p = at((e.west + e.east) / 2, (e.south + e.north) / 2);
      if (lake.name && inBand(p)) add(lake.name, p, "water");
    }
  const places = (map.places ?? []).map((p) => {
    const [x, y] = at(...fromCard([p.x, p.y]));
    const w = estimateWidth(p.name, 28, 0.58);
    return { name: p.name, x, y, box: { x: x + 14, y: y - 17, w, h: 34 } };
  });
  const count = labels.length + places.length;
  if (count > MAP_FRAME.maxNames)
    fail(
      `Card ${card.id}: ${count} names on the map, ${MAP_FRAME.maxNames} at most`
    );
  const obstacles = places.flatMap((p) => [
    p.box,
    { x: p.x - 8, y: p.y - 8, w: 16, h: 16 },
  ]);
  const placed = placeLabels(labels, obstacles, {
    band: MAP_FRAME.names,
    styles: LABEL_STYLES,
  });
  const names = [];
  placed.forEach((p, i) => {
    const l = labels[i];
    if (p.box)
      names.push({
        text: l.text,
        style: l.style,
        ...(l.ink && { ink: l.ink }),
        size: p.size,
        box: p.box,
      });
    // With no room on the map, the name goes to the key as text (0.4.0).
    else key.push({ swatch: "text", label: l.text });
  });

  const xs = [];
  const ys = [];
  for (const [lon, lat] of subject) {
    const [x, y] = at(lon, lat);
    xs.push(x);
    ys.push(y);
  }
  return {
    camera: {
      lon: camera.lon,
      lat: camera.lat,
      radius: camera.radius,
      centreY: camera.centreY,
    },
    capped: camera.capped,
    spanKm: camera.spanKm,
    scale: (camera.radius * 2 * Math.PI) / imagery.width,
    bounds,
    areas: drawn,
    borders,
    names,
    places: places.map(({ name, x, y }) => ({ name, x, y })),
    key,
    credits: seriesMapCredits(map, imagery),
    subject: {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    },
  };
}
