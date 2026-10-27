// Frame-addressed model of the series video: EthniAfrica Cartes
// 1.4.0-proposition, full screen (series.md, « Vidéo de série »), with its
// map cards on satellite imagery since 1.4.1 (series-map.mjs), built on
// Vidéo carte 0.4.0's chunks, highlight and voice timing. The same cards as
// the carousel, on the operator's voice; every value is a function of the
// frame number, with no clock.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  FPS,
  chunkLines,
  subtitleLineWidth,
  subtitleCharacters,
  highlightAt,
  loadVoice,
  IMAGERY,
} from "./sequence.mjs";
import { EASE, PUSH, pushAt } from "./series-motion.mjs";
import { tierReport } from "./series-tiers.mjs";
import { planCues } from "./series-cues.mjs";
import { loadSubject, recapCard, RECAP } from "./series-subject.mjs";
import {
  checkTurnFields,
  planEras,
  planHeadlines,
  eraAt,
  counterAt,
  headlineAt,
  isMapCard,
} from "./series-turns.mjs";
import {
  MAP_FRAME,
  MAP_IMAGERY,
  MARKS,
  checkSeriesMapCard,
  checkStudiedWords,
  checkUniversalCard,
} from "./series-map.mjs";
import { checkFigureFields, figureHeadAt } from "./series-figures.mjs";
import { INTRO, OUTRO } from "../series-idents/shots.mjs";
import { prepareClipCard, clipShots } from "./series-clip-frames.mjs";
import {
  planMapSequences,
  mapRunState,
  runOfCard,
  wordOf,
  silentCheck,
  MAP_TIMING,
} from "./series-sequence.mjs";
import {
  checkDocumentCard,
  checkFormula,
  checkSideBySide,
  weekCharacters,
} from "./series-document.mjs";
import {
  checkTeachingCard,
  planTeaching,
  checkParchmentPhases,
  teachingLayer,
  isParchment,
} from "./series-teaching.mjs";
import { checkSceneCard } from "./series-scenes.mjs";

// The full-screen bands in frame pixels (series.md and handoff.md,
// « Renderer integration of 1.4.0 »). The image fills the frame; only text
// sits on it, every text between x 60 and 1020, in its own band. Nothing is
// placed after the networks' buttons.
export const LAYOUT = {
  x: [60, 1020],
  tape: [178, 226],
  band: [250, 290],
  head: [318, 700],
  ending: [318, 820],
  clear: [700, 1300],
  focus: [540, 1000],
  subtitle: { y: [1316, 1452], centreX: 540, maxLineWidth: 900 },
  foot: [1652, 1786],
  // The ending's credit sits centred above its signature.
  endingCredit: [1652, 1828],
  signature: [1828, 1884],
  slot: { x: [120, 960], y: [760, 1240] },
  mapSubjectTop: 724,
  // 1.4.1: a map card's foot may start at 1600; its names stay in their band.
  mapFoot: MAP_FRAME.foot,
  mapNames: MAP_FRAME.names,
  maxImageScale: 1.5,
};
// Long dates: the largest size that holds on one line in 960 px, else two
// lines at the smallest, never a third (series.md, « Long dates »).
export const DATE_STEPS = [
  [176, 156],
  [148, 136],
  [124, 118],
  [104, 100],
];
const CROSS_FADE = 9; // 300 ms
const CLOSING_HOLD = 75; // 2.5 s
// Seconds. A recommendation, not a refusal (operator, 15 October 2026): an
// episode may run longer when the research needs it; the warning keeps the
// overrun visible in the loaded sequence and the export manifest.
const RECOMMENDED_LENGTH = [35, 75];
// 0.4.0 voice timing (README, Voice): a chunk appears 150 ms before its first
// word; the last stays 200 ms after its last word, then fades in 200 ms.
// Reading speed (operator, 15 October 2026): 17 characters a second is the
// recommendation, a faster chunk loads with a warning; 21 is the limit, past
// which a subtitle cannot be read and the chunk is refused (series 1 episode
// 19 needed 21 at the voice's natural pace).
const VOICE = {
  lead: 0.15,
  hold: 0.2,
  tail: 0.5,
  recommendedCps: 17,
  maxCps: 21,
  fade: 6,
};
const toFrame = (seconds) => Math.round(seconds * FPS);
const fail = (message) => {
  throw new Error(message);
};

// 1.10.0: the voice's transcript gives ' where the cards print ’, and
// spaces may be doubled or unbreakable; neither changes what is said.
const sameWords = (t) => t.replace(/['’]/gu, "’").replace(/\s+/gu, " ").trim();
// A video over 90 s is long: 3 to 7 chapters of 15 s at least, 2 to 4 min
// recommended. Lengths only warn; a missing chapter refuses.
const LONG = {
  from: 90,
  chapters: [3, 7],
  minChapter: 15,
  length: [120, 240],
};
// The reading speed of everything printed in 1.7.0 (titles, items), and a
// chapter card's least full-opacity span, 1.2 s.
const READ_CPS = 21;
const CHAPTER_HOLD = 36;
// The animated chapter card (operator, 20 October 2026): the line and the
// dots come first, the title enters 1.25 s into the card; the hold counts
// from there, so the title is still read for as long as before.
export const CHAPTER_TITLE_IN = 38;
const REMINDER = [75, 120];
const SOURCE_LABELS = ["Source", "Sources", "Hypothèses"];

// The continent's outline from the design system's Africa base map (Natural
// Earth, projected for the carousel cards), read once.
let africa = null;
const africaBackdrop = () => {
  if (!africa) {
    const base = JSON.parse(
      readFileSync(
        new URL("../design-system/assets/Cartes/afrique.json", import.meta.url),
        "utf8"
      )
    );
    africa = { d: base.africa, viewBox: base.meta.viewBox };
  }
  return africa;
};

// `input.cards` is the cards JSON (the carousel's), resolved from `dir`.
export function loadSeriesVideo(input, { dir = "." } = {}) {
  const cardsFile = resolve(
    dir,
    input.cards ?? fail("A series video names its cards JSON")
  );
  const deck = JSON.parse(readFileSync(cardsFile, "utf8"));
  const version = JSON.parse(
    readFileSync(
      new URL("../design-system/version.json", import.meta.url),
      "utf8"
    )
  );
  if (version.status !== "accepted" || deck.version !== version.version)
    fail(
      `The cards are ${deck.version}; the accepted design is ${version.version}`
    );
  if (version.videoLayout !== "full")
    fail("The accepted design does not set the full-screen video layout");

  const beats = input.beats;
  if (!Array.isArray(beats) || beats.length < 2)
    fail("A series video has an opener, a closing card and the cards between");
  // 1.7.0: a long video's chapters. A chapter card is a beat of the sequence,
  // not a card of the deck: it has no chunks, and its title is the script's.
  const chapters = input.chapters ?? [];
  // 1.13.0: the subject key, fixed for every episode on one subject.
  const subject = input.subject ? loadSubject(input.subject) : null;
  // 1.16.0: the words under study, the only words its maps may write.
  const studied = input.studiedWords ?? null;
  if (studied !== null) checkStudiedWords(studied);
  const seen = new Set();
  const entries = beats.map((beat, i) => {
    // The intro bumper (social/series-idents), operator, 19 October 2026:
    // right after the opener, voiced with the fixed sentence and subtitled.
    if (beat.type === "intro") {
      if (i !== 1)
        fail("L'intro vient juste après la carte d'ouverture, jamais ailleurs");
      const said = sameWords((beat.chunks ?? []).map((c) => c.text).join(" "));
      if (said !== sameWords(INTRO.voice))
        fail(`L'intro n'est pas dite mot pour mot : « ${INTRO.voice} »`);
      return {
        card: { id: "generique-intro", type: "intro" },
        chunks: beat.chunks,
      };
    }
    if (beat.type === "chapter") {
      const n = beat.chapter;
      const title =
        chapters[n - 1]?.title ??
        fail(`Beat ${i + 1}: chapter ${n} has no title in chapters`);
      if (beat.chunks?.length)
        fail(`Chapter ${n}: a chapter card is not voiced; the voice is silent`);
      // Operator, 20 October 2026: the chapter card is text on the dark
      // ground, for every series video.
      if (beat.image || beat.credit)
        fail(
          `Chapitre ${n} : une carte de chapitre ne montre que son texte, sans image (décision opérateur du 20 octobre 2026)`
        );
      return {
        card: {
          id: `chapitre-${n}`,
          type: "chapter",
          chapter: { n, of: chapters.length, title },
        },
        chunks: [],
      };
    }
    const card = deck.cards.find((c) => c.id === beat.card);
    if (!card) fail(`Beat ${i + 1}: no card ${beat.card} in ${input.cards}`);
    if (seen.has(card.id))
      fail(`Card ${card.id} is voiced twice; each card is voiced once`);
    seen.add(card.id);
    if (!Array.isArray(beat.chunks) || !beat.chunks.length)
      fail(`Card ${card.id} is not voiced: every card is voiced once`);
    if (card.demo && !input.demo)
      fail(
        `Card ${card.id} is demonstration text: the video must carry its demo tape`
      );
    if (!input.demo && /(^|\/)a-trouver-[^/]*$/.test(card.image?.src ?? ""))
      fail(`Card ${card.id} still shows « image à trouver »`);
    // A map card is drawn on satellite imagery; an atlas card is refused.
    if (card.type === "map" || card.opening !== undefined) {
      checkSeriesMapCard(card);
      // 1.16.0: an episode with studied words has universal maps.
      if (studied) checkUniversalCard(card, studied);
      else if ((card.map?.drawings ?? []).some((d) => d.word !== undefined))
        fail(
          `Card ${card.id}: une bulle porte le mot étudié : le déclarer dans studiedWords`
        );
    }
    checkLongCardFields(card);
    // 1.8.0: the document card and the teaching cards.
    if (card.image?.document) checkDocumentCard(card);
    if (card.formula && !card.formula.lines) checkFormula(card);
    if (card.sbs) checkSideBySide(card);
    // 1.12.0: the parchment card and the teaching cards in motion.
    checkTeachingCard(card);
    // Narration v4 of « Zaïre »: an illustrated scene on the parchment.
    checkSceneCard(card, studied);
    // 1.13.0: the story's turns (whip, era, flags, headline band).
    checkTurnFields(card);
    // 1.14.0: figures and facts drawn on the map.
    checkFigureFields(card);
    const own = structuredClone(card);
    // 1.16.0: on a universal map nothing is named by default; a studied
    // word is written only where the script asks for it.
    if (studied && own.map) {
      for (const a of own.map.areas ?? []) a.label ??= "none";
      for (const p of own.map.places ?? []) p.label ??= "none";
      for (const d of own.map.drawings ?? []) if (!d.flag) d.label ??= false;
    }
    // 1.15.0: a card whose picture is an external clip.
    if (own.image?.clip || own.image?.clips)
      prepareClipCard(own, dir, { proof: !!input.demo });
    // 1.13.0: the globe lands on the subject's base view; the opener's
    // kicker is the subject's formula.
    if (subject && own.type === "opener") {
      own.videoKicker = subject.kicker;
      if (own.opening === "globe") own.map.view = { ...subject.view };
    }
    return { card: own, chunks: beat.chunks };
  });
  // 1.13.0: the recap card, after the intro, on the previous episode's
  // last map (a card of the deck that is not voiced as a beat of its own).
  if (input.recap) {
    if (!subject || subject.episode < 2)
      fail(
        "Le rappel suit un épisode précédent : pas de rappel au premier épisode"
      );
    if (entries[1]?.card.type !== "intro")
      fail("Le rappel vient juste après l'intro");
    const source =
      deck.cards.find((c) => c.id === input.recap.map) ??
      fail(`Le rappel nomme une carte absente : ${input.recap.map}`);
    checkSeriesMapCard(source);
    entries.splice(2, 0, {
      card: recapCard(source, input.recap),
      chunks: input.recap.chunks,
    });
  }
  const numbers = entries.flatMap((e) =>
    e.card.type === "chapter" ? [e.card.chapter.n] : []
  );
  if (numbers.some((n, i) => n !== i + 1) || numbers.length !== chapters.length)
    fail("The chapter cards are numbered 1 to N, once each, in order");
  if (entries[0].card.type !== "opener")
    fail("A series video opens on its opener card");
  if (entries.at(-1).card.type !== "closing")
    fail("A series video ends on its closing card");
  const key = (c) =>
    JSON.stringify([
      c.series?.id ?? c.series?.name,
      c.series?.episode,
      c.theme ?? "nuit",
    ]);
  const first = entries[0].card;
  if (!first.series) fail("A series video's cards carry the series band");
  // A silent card (a chapter card) belongs to the episode's series and theme;
  // it draws its own dark ground, no picture.
  const silent = (card) => {
    card.series = structuredClone(first.series);
    if (first.theme) card.theme = first.theme;
  };
  // The enriched chapter card (« Zaïre », board S14, approved 27 October
  // 2026, for every series video with chapters): the video's title as a
  // reminder at the top, the chapters before and after the current one, and
  // the EthniAfrica map of Africa dimmed behind.
  const chapterOf = (n) =>
    n >= 1 && n <= chapters.length ? { n, title: chapters[n - 1].title } : null;
  entries.forEach((e) => {
    if (e.card.type !== "chapter") return;
    const c = e.card.chapter;
    Object.assign(c, {
      video: first.title,
      prev: chapterOf(c.n - 1),
      next: chapterOf(c.n + 1),
      backdrop: africaBackdrop(),
    });
  });
  entries.forEach((e) => {
    if (e.card.type === "chapter") silent(e.card);
    // The intro draws its own parchment, but belongs to the episode.
    if (e.card.type === "intro") {
      e.card.series = structuredClone(first.series);
      if (first.theme) e.card.theme = first.theme;
    }
  });
  if (entries.some((e) => key(e.card) !== key(first)))
    fail("A series video shows one series, one episode and one theme");

  // Cartes 1.10.0: the ending is fixed, one chunk per printed line, the same
  // lines the cards' bundle draws (version.json). Since the operator's words
  // of 27 October 2026 the voice says the invitation first, then the closing
  // line, though the card prints the line above the invitation. Nothing on
  // the ending names a search, so the input only says the next episode; the
  // 1.7.0 fields load and warn.
  const ending = input.ending ?? {};
  const retired = ["search", "general", "pageOnline"].filter((k) =>
    Object.hasOwn(ending, k)
  );
  const spoken = [...version.invitationLines, ...version.signatureLines];
  const said = entries.at(-1).chunks.map((c) => sameWords(c.text));
  if (
    said.length !== spoken.length ||
    spoken.some((t, i) => said[i] !== sameWords(t))
  )
    fail(
      `La fin n'est pas dite mot pour mot : « ${spoken.join(" / ")} », un morceau par ligne imprimée`
    );
  // « Prochain épisode » always sits under the pill (the 1.7.0 card of its
  // own is retired).
  const next =
    typeof ending.next === "string" && ending.next.trim() ? ending.next : null;
  if (next) entries.at(-1).card.next = next;
  // The end card (social/series-idents) in place of the 1.10.0 ending: the
  // same words, said the same way, over the search of the episode's name.
  // Its answer comes from a layer file copied from the name's live page.
  const idents = input.idents ?? {};
  if (idents.outro) {
    const layers = String(idents.outro);
    const file = new URL(
      `../series-idents/layers/${layers}.json`,
      import.meta.url
    );
    if (!existsSync(file))
      fail(
        `La fin n'a pas la réponse de ce nom : layers/${layers}.json manque dans social/series-idents`
      );
    const outroNext = idents.next ?? next;
    entries.at(-1).card.outro = {
      layers,
      ...(outroNext && { next: outroNext }),
    };
  }
  const last = entries.length - 1;
  const cards = entries.map((e) => e.card);
  const texts = entries.flatMap((e) => e.chunks.map((c) => c.text));
  const chunks = entries.flatMap((entry, card) =>
    entry.chunks.map(({ text }) => {
      // The ending prints the line and the invitation itself (1.6.0, 1.10.0),
      // so the closing card's chunks are voiced but never shown as
      // subtitles; the subtitle rules (3 to 6 words, 900 px, reading speed)
      // do not apply to them.
      const hidden = card === last;
      const lines = hidden ? [] : chunkLines(text);
      for (const line of lines) {
        const text = line.map((r) => r.text).join("");
        if (subtitleLineWidth(text) > LAYOUT.subtitle.maxLineWidth)
          fail(
            `« ${text} » is wider than 900 px: a series subtitle line holds 900 px`
          );
      }
      return { text, card, lines, hidden };
    })
  );
  if (!input.voice) fail("A series video is spoken: it needs a voice");
  const voice = loadVoice(input.voice, texts, dir);
  const seq = {
    design: input.design,
    demo: input.demo ?? null,
    cardsFile,
    logo: deck.logo,
    cards,
    band: { ...first.series },
    ending: { ...(next && { next }) },
    voice,
    chunks,
    // 1.11.0: one ink per people for the whole episode.
    ...(input.inks && { inks: { ...input.inks } }),
    // 1.13.0: the subject's own ink, wherever the piece inks the subject.
    ...(subject &&
      input.inks?.[subject.id] !== undefined && {
        inks: { ...input.inks, [subject.id]: subject.ink },
      }),
    ...(subject && { subject }),
    // The imagery under the map cards; the scale limit reads its width
    // (decision 1 of 1.11.0: the 500 m mosaic once verified and pinned).
    mapImagery: input.mapImagery ?? MAP_IMAGERY,
    // 1.13.0: the year the satellite shows, for the counter and the flags.
    ...(input.today !== undefined && { today: input.today }),
    ...(studied && { studiedWords: [...studied] }),
    // The episode's own bed, by name in social/sound/beds/library (mix.mjs bedFor).
    ...(input.bed !== undefined && { bed: input.bed }),
  };
  if (!IMAGERY[seq.mapImagery]?.width)
    fail(`No verified imagery « ${seq.mapImagery} » for the map cards`);
  schedule(seq, voice.chunks);
  placeRecapMarks(seq, input.tier);
  if (retired.length)
    seq.warnings.push(
      `L'entrée de fin ne prend plus que next : ${retired.join(", ")} ignoré (1.10.0, la fin est fixe)`
    );
  // 1.5.0: consecutive map cards of one `map.sequence` share one map.
  // 1.13.0: the eras, their flashes and counters, before the maps that
  // draw them; the headline bands.
  const word = (i, unit) => wordOf(seq, i, unit).frame;
  seq.eras = planEras(seq, word, CROSS_FADE);
  seq.mapSequence = planMapSequences(seq, IMAGERY[seq.mapImagery]);
  seq.headlines = planHeadlines(seq, word);
  checkPicturePhases(seq);
  // 1.11.0: every fact of a map phase has its mark on screen while it is
  // said. A proof warns; the final export refuses (series-render.mjs).
  seq.silent = silentCheck(seq);
  for (const f of seq.silent.filter((f) => !f.pass))
    seq.warnings.push(
      `Fait sans marque à l'écran : « ${f.say} » (${f.card}, ${Math.round(f.coverage * 100)} % du temps, ${f.delay === null ? "aucune marque" : `première marque après ${Math.round((f.delay * 1000) / FPS)} ms`})`
    );
  planLongVideo(seq, input);
  checkParchmentPhases(seq);
  // 1.13.0: the change rate against the piece's format tier.
  const tiers = tierReport(seq, input.tier, CROSS_FADE);
  seq.tierReport = tiers.report;
  seq.warnings.push(...tiers.warnings);
  // 1.13.0: the sound cues on their frames, for mix.mjs.
  seq.cues = planCues(seq, CROSS_FADE);
  return seq;
}

// 1.13.0, the recap card: 6 s at most (4 s on a short); its marks pop on
// their own frames, 18 apart, once the card has come in.
function placeRecapMarks(seq, tier) {
  const i = seq.cards.findIndex((c) => c.isRecap);
  if (i < 0) return;
  const start = seq.cardStarts[i];
  const frames = seq.cardStarts[i + 1] - start;
  const most = tier === "short" ? 120 : 180;
  if (frames > most)
    fail(
      `Rappel de plus de ${most / FPS} s : ${(frames / FPS).toFixed(1)} s (une phrase, la carte et ses marques)`
    );
  const map = seq.cards[i].map;
  for (const mark of [...map.areas, ...map.words])
    mark.sayFrame = start + RECAP.first + RECAP.apart * mark.recapMark;
}

// 1.11.0, « 9. Map phases and picture phases »: a picture between two map
// cards of an animated sequence is a phase of its own, 6 s at least.
function checkPicturePhases(seq) {
  const plan = seq.mapSequence;
  if (!plan) return;
  const animatedMap = (i) => {
    const r = runOfCard(plan, i);
    return r >= 0 && plan.animated[plan.runs[r].sequence];
  };
  const isMap = (i) =>
    seq.cards[i].type === "map" || seq.cards[i].opening === "globe";
  for (let i = 1; i + 1 < seq.cards.length; i++) {
    // A chapter card and the intro are titles, not pictures.
    if (["chapter", "intro"].includes(seq.cards[i].type)) continue;
    if (isMap(i) || !isMap(i - 1) || !isMap(i + 1)) continue;
    if (!animatedMap(i - 1) && !animatedMap(i + 1)) continue;
    const frames = seq.cardStarts[i + 1] - seq.cardStarts[i];
    if (frames < MAP_TIMING.pictureMin)
      fail(
        `Card ${seq.cards[i].id}: Image isolée de moins de 6 s entre deux cartes (${(frames / FPS).toFixed(1)} s)`
      );
  }
}

// 1.7.0: what a video card may carry, checked before anything is timed.
function checkLongCardFields(card) {
  const id = card.id;
  // 1.8.0: « Capture » labels a web capture's foot, on a document card only.
  const capture = card.sourceLabel === "Capture" && card.image?.document;
  if (
    card.sourceLabel !== undefined &&
    !SOURCE_LABELS.includes(card.sourceLabel) &&
    !capture
  )
    fail(
      `Card ${id}: sourceLabel « ${card.sourceLabel} » is one of ${SOURCE_LABELS.join(", ")}, or « Capture » on a document card`
    );
  if (typeof card.source === "string" && /^\p{L}+\s*:/u.test(card.source))
    fail(
      `Card ${id}: Le champ source porte déjà son étiquette (« ${card.source.split(":")[0]} : »); use sourceLabel`
    );
  if (card.signed && card.source)
    fail(`Card ${id}: Une carte signée ne porte pas de source`);
  if (!card.signed && card.kicker === "Nous pensons" && card.source)
    fail(`Card ${id}: « Nous pensons » sur une carte sourcée`);
  const readings = card.readings?.items;
  if (readings && (readings.length < 1 || readings.length > 5))
    fail(`Card ${id}: une liste tient cinq lectures au plus`);
  const figures = card.figures?.items;
  if (figures && (figures.length < 3 || figures.length > 4))
    fail(`Card ${id}: une carte de chiffres en tient trois ou quatre`);
}

function schedule(seq, words) {
  const chunks = words.map((w, k) => ({
    ...seq.chunks[k],
    words: w,
    appear: toFrame(w[0].start - VOICE.lead),
  }));
  seq.chunks = chunks;
  if (chunks[0].appear < 1)
    fail("The first word comes too early: frame 0, the cover, has no subtitle");
  const fastChunks = [];
  chunks.forEach((chunk, k) => {
    const next = chunks[k + 1];
    // 1.7.0: before a silent card (a chapter card) the last chunk leaves
    // after its last word, so the silence shows no subtitle.
    const silenceAfter = next && next.card - chunk.card > 1;
    chunk.fullFrom = k ? chunk.appear : chunk.appear + VOICE.fade;
    chunk.fullTo =
      next && !silenceAfter
        ? next.appear
        : Math.max(
            chunk.fullFrom,
            toFrame(chunk.words.at(-1).end + VOICE.hold)
          );
    chunk.gone =
      next && !silenceAfter ? next.appear : chunk.fullTo + VOICE.fade;
    const framesFor = (cps) =>
      Math.ceil((subtitleCharacters(chunk.text) / cps) * FPS - 1e-9);
    if (chunk.hidden) return; // voiced, never read as a subtitle
    const shown = chunk.gone - chunk.appear;
    if (shown < framesFor(VOICE.maxCps))
      fail(
        `« ${chunk.text} » would read faster than ${VOICE.maxCps} characters a second; the voice needs ${Math.ceil(((framesFor(VOICE.maxCps) - shown) * 1000) / FPS)} ms more`
      );
    if (shown < framesFor(VOICE.recommendedCps)) fastChunks.push(chunk.text);
  });
  // A card is fully in when its first chunk appears; the cross-fade that
  // brings it in takes the 300 ms before. A silent card is fully in when the
  // last chunk before it has gone.
  const isSilent = (c) => c.type === "chapter";
  seq.cardStarts = [];
  seq.cards.forEach((card, i) => {
    if (!i) return seq.cardStarts.push(0);
    if (!isSilent(card))
      return seq.cardStarts.push(chunks.find((c) => c.card === i).appear);
    const before = chunks.findLast((c) => c.card < i);
    seq.cardStarts.push(
      Math.max(before.gone, seq.cardStarts[i - 1] + CROSS_FADE)
    );
  });
  seq.cardStarts.forEach((start, i) => {
    if (i && start - CROSS_FADE < seq.cardStarts[i - 1])
      fail(
        `Card ${seq.cards[i].id} comes before the cross-fade into the card before it ends`
      );
  });
  // A chapter card holds at full opacity until the next card's change
  // begins: long enough to read its title at 21 characters a second plus
  // 0.3 s, and 1.2 s at least.
  seq.cards.forEach((card, i) => {
    if (!isSilent(card)) return;
    const need =
      CHAPTER_TITLE_IN +
      Math.max(
        CHAPTER_HOLD,
        Math.ceil(
          ([...card.chapter.title].length / READ_CPS + 0.3) * FPS - 1e-9
        )
      );
    const full = seq.cardStarts[i + 1] - CROSS_FADE - seq.cardStarts[i];
    if (full < need)
      fail(
        `Chapitre ${card.chapter.n} : le silence est trop court de ${Math.ceil(((need - full) * 1000) / FPS)} ms; the voice script lengthens the pause`
      );
  });
  const voiceEnd = Math.ceil((seq.voice.duration + VOICE.tail) * FPS - 1e-9);
  // The end card plays whole, from the first frame of its card change.
  const outro = seq.cards.at(-1).outro
    ? seq.cardStarts.at(-1) - CROSS_FADE + Math.round(OUTRO.duration * FPS)
    : 0;
  seq.frames = Math.max(
    seq.cardStarts.at(-1) + CLOSING_HOLD,
    voiceEnd,
    chunks.at(-1).gone,
    outro
  );
  seq.warnings = seq.cards.flatMap((c) =>
    clipShots(c).flatMap((s) => s.warnings)
  );
  if (fastChunks.length)
    seq.warnings.push(
      `${fastChunks.length} chunk(s) read faster than the recommended ${VOICE.recommendedCps} characters a second: ${fastChunks.map((t) => `« ${t} »`).join(", ")}`
    );
}

// 1.7.0, after the schedule: the length and its chapters, the chapter kicker,
// items entering on their word, the reminder, the signed position and the
// runs of one image.
function planLongVideo(seq, input) {
  const seconds = seq.frames / FPS;
  const chapterCards = seq.cards.flatMap((c, i) =>
    c.type === "chapter" ? [i] : []
  );
  const chaptered = chapterCards.length > 0;
  if (
    seconds > LONG.from &&
    (chapterCards.length < LONG.chapters[0] ||
      chapterCards.length > LONG.chapters[1])
  )
    fail(
      `Vidéo longue sans chapitres: ${seconds.toFixed(1)} s needs ${LONG.chapters[0]} to ${LONG.chapters[1]} chapters, it has ${chapterCards.length}`
    );
  const ending = seq.cards.length - 1;
  chapterCards.forEach((i, k) => {
    const end = seq.cardStarts[chapterCards[k + 1] ?? ending];
    const span = (end - seq.cardStarts[i]) / FPS;
    if (span < LONG.minChapter)
      fail(
        `Chapitre ${seq.cards[i].chapter.n} dure ${span.toFixed(1)} s : ${LONG.minChapter} s au moins`
      );
  });
  const [low, high] = chaptered ? LONG.length : RECOMMENDED_LENGTH;
  if (seconds < low || seconds > high)
    seq.warnings.push(
      chaptered
        ? `A long video's recommended length is 2 to 4 min; this one lasts ${seconds.toFixed(1)} s`
        : `A series video's recommended length is ${low} to ${high} s; this one lasts ${seconds.toFixed(1)} s`
    );

  // The chapter kicker, composed for the video only: the card's own kicker
  // stays for the carousel. A dated card keeps its marker label.
  let chapter = null;
  seq.cards.forEach((card, i) => {
    if (card.type === "chapter") chapter = card.chapter;
    // 1.15.0: a clip card shows one still per frame, so each shot's footage
    // must last as long as the shot stays on screen. A shot after the first
    // enters on a word of the voice (`say`), or when the footage before it
    // runs out; a montage cuts at 2 s a shot at least, 2.5 s for the last.
    const shots = clipShots(card);
    if (shots.length) planClipCuts(seq, i, shots);
    if (["opener", "closing", "chapter", "intro"].includes(card.type)) return;
    if (card.signed) card.videoKicker = "Nous pensons";
    // A scene's date is its head's figure, not a dated card's marker: it
    // keeps the chapter (board S12, « 3 · Le royaume du Kongo » over 1491).
    else if (chapter && (!card.date || card.scene))
      card.videoKicker = `${chapter.n} · ${chapter.title}`;
    // Items and the quoted person enter on the word that says them, and the
    // card holds long enough to read its items at 21 characters a second.
    const items = card.readings?.items ?? card.figures?.items;
    if (items) {
      card.itemFrames = items.map((it) => wordOf(seq, i, it.say).frame);
      const characters = items
        .flatMap((it) => [it.label, it.text, it.by, it.pre, it.value, it.unit])
        .filter(Boolean)
        .reduce((n, t) => n + [...t].length, 0);
      const need = Math.ceil((characters / READ_CPS) * FPS - 1e-9);
      const end = seq.cardStarts[i + 1] ?? seq.frames;
      if (end - seq.cardStarts[i] < need)
        fail(
          `Card ${card.id}: ses éléments demandent ${Math.ceil(((need - (end - seq.cardStarts[i])) * 1000) / FPS)} ms de plus à ${READ_CPS} caractères par seconde`
        );
    }
    if (card.attribution)
      card.attributionFrame = wordOf(seq, i, card.attribution.say).frame;
    planTeachingCard(seq, i);
  });

  // The hook reminder shows the opener's image and framing again.
  if (input.reminder) {
    const i = seq.cards.findIndex((c) => c.id === input.reminder);
    if (i < 0)
      fail(`The reminder names no card of the video: ${input.reminder}`);
    // A clip's stills are filed under its own card, so two cards showing the
    // same shot are compared by the shot itself (1.15.0 footage-first opener).
    const frame = (c) => {
      const shot = c.image?.clip;
      return JSON.stringify(
        shot
          ? ["clip", shot.src, shot.in, shot.fx, shot.mode ?? "fill", shot.trim]
          : [c.image?.src, c.image?.focus, c.image?.video]
      );
    };
    if (frame(seq.cards[i]) !== frame(seq.cards[0]))
      fail(
        `Le rappel ne montre pas l'image d'ouverture: ${input.reminder} shows another image or framing`
      );
    const at = seq.cardStarts[i] / FPS;
    seq.reminder = { card: input.reminder, seconds: +at.toFixed(2) };
    if (at < REMINDER[0] || at > REMINDER[1])
      seq.warnings.push(
        `Le rappel tombe à ${at.toFixed(1)} s, hors de la fenêtre entre ${REMINDER[0]} et ${REMINDER[1]} s`
      );
  }
  if (!seq.cards.some((c) => c.signed))
    seq.warnings.push(
      "Aucune carte signée : chaque vidéo porte une part de la position signée (décision 4)"
    );

  // Runs of one image: consecutive cards on one image file and framing
  // change their heads only, under one zoom over the whole run. A document's
  // framing is its passage (1.8.0): two passages of one page are two images.
  const image = (c) =>
    c.image && c.type !== "closing" && c.type !== "map"
      ? JSON.stringify([
          c.image.src,
          c.image.focus,
          c.image.video,
          c.image.document?.passage,
        ])
      : null;
  let run = -1;
  seq.imageRuns = seq.cards.map((c, i) => {
    const same = i && image(c) && image(c) === image(seq.cards[i - 1]);
    if (!same) run = image(c) ? run + 1 : run;
    return image(c) ? run : -1;
  });
}

// 1.8.0: what enters on its word on a document or a teaching card. Rows and
// steps keep their place from the card's first frame; only opacity changes.
function planTeachingCard(seq, i) {
  const card = seq.cards[i];
  const start = seq.cardStarts[i];
  const end = seq.cardStarts[i + 1] ?? seq.frames;
  if (card.image?.document)
    card.markFrame = wordOf(seq, i, card.image.document.say).frame;
  if (card.formula && !card.formula.lines) {
    card.formulaFrames = card.formula.steps.map(
      (step) => wordOf(seq, i, step.say).frame
    );
    if (card.formulaFrames.some((f, k) => k && f <= card.formulaFrames[k - 1]))
      fail(
        `Card ${card.id}: les étapes de la formule suivent l'ordre de la voix`
      );
  }
  if (card.sbs) {
    // A row enters on its first name (« Kouassi » of « Kouassi · Akissi »),
    // or on its first cell's own `say`.
    const { rows, daysSay, note, noteSay } = card.sbs;
    card.sbsFrames = {
      rows: rows.map(
        ([cell]) => wordOf(seq, i, cell.say ?? cell.name.split(/\s/u)[0]).frame
      ),
      days: daysSay ? wordOf(seq, i, daysSay).frame : start,
      ...(note && { note: noteSay ? wordOf(seq, i, noteSay).frame : start }),
    };
  }
  // 1.12.0: a parchment card's parts move on their words.
  if (isParchment(card)) planTeaching(seq, i);
  if (card.week && card.week.people === undefined) {
    // A day the voice names enters on its word; the others with the card.
    card.weekFrames = card.week.rows.map(([day]) => {
      try {
        return wordOf(seq, i, day).frame;
      } catch {
        return start;
      }
    });
    const need = Math.ceil((weekCharacters(card.week) / READ_CPS) * FPS - 1e-9);
    if (end - start < need)
      fail(
        `Card ${card.id}: Tableau de la semaine : ${Math.ceil(((need - (end - start)) * 1000) / FPS)} ms de lecture manquent à ${READ_CPS} caractères par seconde ; coupez-le en deux cartes, du lundi au jeudi et du vendredi au dimanche`
      );
  }
}

export const seriesFrameCount = (seq) => seq.frames;

// The parallel final render (operator, 19 October 2026): `workers` slices
// [from, to) covering the video, each drawn by its own browser from its
// first frame. A map or photo card draws each frame from its number alone,
// so a cut falls inside one, outside a card change. An ident does not: its
// glyphs' anti-aliasing depends on its own earlier frames, so no cut falls
// in an ident nor in the IDENT_LEAD frames before it. Each cut is the
// allowed frame nearest an even share; with fewer allowed frames than
// workers, the video has fewer slices.
const IDENT_LEAD = 30;
export function seriesSlices(seq, workers) {
  if (!Number.isInteger(workers) || workers < 1)
    fail(`workers: a whole number from 1, not ${workers}`);
  const count = seq.frames;
  const starts = seq.cardStarts;
  const end = (i) => starts[i + 1] ?? count;
  const idents = seq.cards.flatMap((c, i) =>
    c.type === "intro" || c.outro
      ? [[starts[i] - CROSS_FADE - IDENT_LEAD, end(i)]]
      : []
  );
  const allowed = [];
  for (const [i, card] of seq.cards.entries()) {
    if (card.type !== "map" && !card.image) continue;
    for (let f = Math.max(1, starts[i]); f <= end(i) - CROSS_FADE; f++)
      if (!idents.some(([a, b]) => f >= a && f < b)) allowed.push(f);
  }
  const cuts = [];
  for (let k = 1; k < workers; k++) {
    const target = (k * count) / workers;
    let best;
    for (const f of allowed)
      if (
        f > (cuts.at(-1) ?? 0) &&
        (best === undefined || Math.abs(f - target) < Math.abs(best - target))
      )
        best = f;
    if (best !== undefined) cuts.push(best);
  }
  const bounds = [0, ...cuts, count];
  return cuts.concat(count).map((to, k) => ({ from: bounds[k], to }));
}

export function seriesFrameState(seq, frame) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= seq.frames)
    fail(`Frame ${frame} is outside the video, 0 to ${seq.frames - 1}`);
  const starts = seq.cardStarts;
  // The card on screen alone, or the one under a cross-fade.
  let current = 0;
  while (current + 1 < starts.length && frame >= starts[current + 1]) current++;
  // 1.7.0: a run of one image zooms once, from its first card's first frame
  // to its last card's end. 1.13.0 (decision 3): the zoom is the maps'
  // push, 6 % every 10 s; `zoomEnd` is where it stands on the run's last
  // frame, so the page can hold a picture too small to push still.
  const imageRun = (i) => seq.imageRuns?.[i] ?? -1;
  const zoomSpan = (i) => {
    let a = i;
    let b = i;
    if (imageRun(i) >= 0) {
      while (a > 0 && imageRun(a - 1) === imageRun(i)) a--;
      while (b + 1 < starts.length && imageRun(b + 1) === imageRun(i)) b++;
    }
    const from = a ? starts[a] - CROSS_FADE + 1 : 0; // first frame drawn
    const to = b + 1 < starts.length ? starts[b + 1] - 1 : null;
    return { from, to };
  };
  const zooms = (i) => {
    const { from, to } = zoomSpan(i);
    // The ending shows no photograph, and footage is never pushed in
    // (1.15.0, §2: a push is allowed on a static source only).
    if (to === null || clipShots(seq.cards[i]).length)
      return { zoom: 1, zoomEnd: 1 };
    return {
      zoom: pushAt(frame - from, PUSH.picture),
      zoomEnd: pushAt(to - from, PUSH.picture),
    };
  };
  // `opacity` is the image's, `text` the card's own text (head, foot): the
  // images cross-fade over the whole change while the heads swap inside it,
  // out in the first half and in during the second, never both at once
  // (operator, 14 October 2026).
  const layers = [{ card: current, opacity: 1, ...zooms(current), text: 1 }];
  const next = current + 1;
  let change = 0;
  if (next < starts.length && frame > starts[next] - CROSS_FADE) {
    const p = (frame - (starts[next] - CROSS_FADE)) / CROSS_FADE;
    change = p;
    layers[0].text = Math.max(0, 1 - 2 * p);
    layers.push({
      card: next,
      opacity: p,
      ...zooms(next),
      text: Math.max(0, 2 * p - 1),
    });
  }
  // 1.7.0: within a run of one image only the heads change; the image is
  // the outgoing card's, not cross-faded.
  if (
    layers.length === 2 &&
    imageRun(current) >= 0 &&
    imageRun(current) === imageRun(next)
  )
    layers[1].opacity = 0;
  // 1.12.0: two parchment cards in a row keep their ground, drawn by the
  // outgoing card; only the head and the content change.
  const parchment = (i) => i < seq.cards.length && isParchment(seq.cards[i]);
  if (layers.length === 2 && parchment(current) && parchment(next))
    layers[1].opacity = 0;
  // Items and the quoted person enter on their word, over 9 frames, their
  // place kept from the card's first frame.
  const arrive = (from) =>
    frame <= from
      ? 0
      : frame >= from + CROSS_FADE
        ? 1
        : EASE.enter((frame - from) / CROSS_FADE);
  for (const l of layers) {
    const card = seq.cards[l.card];
    const shots = clipShots(card);
    if (shots.length) {
      // The shot on screen is the last one whose cut has passed.
      const at = frame - starts[l.card];
      let shot = shots.length - 1;
      while (shot > 0 && at < shots[shot].cut) shot--;
      l.clipShot = shot;
      l.clipFrame = Math.min(
        Math.max(at - shots[shot].cut, 0),
        shots[shot].count - 1
      );
    }
    if (card.itemFrames) l.items = card.itemFrames.map(arrive);
    if (card.attributionFrame !== undefined)
      l.attribution = arrive(card.attributionFrame);
    // 1.8.0: the underline, the formula's steps (each fading out as the next
    // fades in, in place), the rows and days of the teaching cards.
    if (card.markFrame !== undefined) l.mark = arrive(card.markFrame);
    if (card.formulaFrames)
      l.steps = card.formulaFrames.map(
        (f, k) =>
          arrive(f) * (1 - arrive(card.formulaFrames[k + 1] ?? Infinity))
      );
    if (card.sbsFrames) {
      l.rows = card.sbsFrames.rows.map(arrive);
      l.days = arrive(card.sbsFrames.days);
      if (card.sbsFrames.note !== undefined)
        l.note = arrive(card.sbsFrames.note);
    }
    if (card.weekFrames) l.rows = card.weekFrames.map(arrive);
    teachingLayer(seq, l, frame, CROSS_FADE);
  }
  // A map sequence's card shows its run's map, zoomed once over the run.
  // Between two cards of one run the map is drawn once, by the outgoing
  // card's layer: the incoming card brings only its head and foot.
  const runs = layers.map((l) => runOfCard(seq.mapSequence, l.card));
  for (const [i, l] of layers.entries()) {
    if (runs[i] < 0) continue;
    l.map = mapRunState(seq, runs[i], frame);
    l.zoom = l.map.zoom;
    l.zoomEnd = l.map.zoom;
    if (i && runs[i] === runs[i - 1]) l.opacity = 0;
  }
  // An ident runs on its own clock, from the first frame of the change that
  // brings it in, and holds its last frame.
  for (const l of layers) {
    const card = seq.cards[l.card];
    const clip = card.type === "intro" ? INTRO : card.outro ? OUTRO : null;
    if (!clip) continue;
    const t = (frame - (starts[l.card] - CROSS_FADE)) / FPS;
    l.ident = { clip: clip.id, t: Math.min(clip.duration, Math.max(0, t)) };
  }
  // The chapter card's animation runs from its own first frame.
  for (const l of layers)
    if (seq.cards[l.card].type === "chapter")
      l.chapter = { t: Math.max(0, (frame - starts[l.card]) / FPS) };
  // 1.13.0: an era card's counter in its head; a headline band in the head's
  // place; the era map's flash and paper inks.
  for (const l of layers) {
    const era = seq.eras?.cards[l.card];
    if (era?.from !== undefined) {
      l.counter = counterAt(era, frame);
      l.head = l.counter.head;
    }
    const band = seq.headlines?.find((b) => b.card === l.card);
    if (band) {
      l.headline = headlineAt(band, frame);
      l.head = l.headline.head;
    }
    // 1.14.0: the figure head in the head's place; the kicker and the title
    // step aside while a figure shows.
    const figures = seq.mapSequence?.cards[l.card]?.figures;
    const fig = figures ? figureHeadAt(figures, frame) : null;
    if (fig) {
      l.figure = fig.figure;
      l.head = Math.min(l.head ?? 1, fig.head);
    }
  }
  const era = seq.eras ? eraAt(seq.eras, frame) : null;
  // The paper inks hold for the map on screen, not for a picture after it.
  const paperInks = !!era?.inks && isMapCard(seq.cards[current]);
  const chunk = seq.chunks.find(
    (c) => !c.hidden && frame >= c.appear && frame < c.gone
  );
  const subtitle = chunk
    ? {
        lines: chunk.lines,
        opacity:
          frame < chunk.fullFrom
            ? EASE.enter((frame - chunk.appear) / VOICE.fade)
            : frame < chunk.fullTo
              ? 1
              : 1 - EASE.exit((frame - chunk.fullTo) / VOICE.fade),
        highlight: highlightAt(chunk.words, frame / FPS),
        // 1.12.0: said over a parchment card, in its ink without outline;
        // 1.13.0: over the era map too.
        ...((parchment(chunk.card) || paperInks) && { parchment: true }),
      }
    : null;
  const turns = {
    ...(era?.flash > 0 && { flash: era.flash }),
    ...(paperInks && { paperInks: true }),
  };
  if (!seq.cards.some(isParchment) && !paperInks)
    return { layers, subtitle, ...turns };
  // 1.12.0: how much of the frame is parchment, for the band's and the
  // signature's two inkings; the era map takes the Parchemin inks too.
  const weight = paperInks
    ? 1
    : (parchment(current) ? 1 - change : 0) + (parchment(next) ? change : 0);
  return { layers, subtitle, parchment: weight, ...turns };
}

// Problems with the boxes the browser drew on one frame. `boxes` are
// { id, kind, x, y, w, h } in frame pixels; an "image" box also carries its
// `scale` (frame pixels per source pixel, zoom included), and a demonstration
// only reports an enlarged image, since the library holds web renditions.
const BANDS = {
  tape: LAYOUT.tape,
  band: LAYOUT.band,
  head: LAYOUT.head,
  ending: LAYOUT.ending,
  pill: LAYOUT.ending,
  subtitle: LAYOUT.subtitle.y,
  key: LAYOUT.foot,
  source: LAYOUT.foot,
  credit: LAYOUT.foot,
  "ending-credit": LAYOUT.endingCredit,
  signature: LAYOUT.signature,
  slot: LAYOUT.slot.y,
  // 1.7.0: readings and figures end above y 1290; the quoted person above
  // the subtitle band.
  items: [LAYOUT.head[0], 1290],
  attribution: [LAYOUT.head[0], 1300],
  // The chapter card (operator, 20 October 2026): the line, the dots and
  // « n sur N » above the centre, the title centred under them.
  // 1.14.0: the figure head's three lines sit in the head's place.
  "figure-pre": LAYOUT.head,
  "figure-number": LAYOUT.head,
  "figure-unit": LAYOUT.head,
  "chapter-count": [720, 940],
  // Board S14: the video's title at the top, the chapters around the title.
  "chapter-video": [290, 460],
  "chapter-near": [720, 1300],
  "chapter-title": [940, 1300],
  // 1.8.0: the formula in the clear zone, ending above y 1290.
  formula: [LAYOUT.clear[0], 1290],
  // 1.12.0: a parchment card's content, between the head and y 1300.
  parchment: [LAYOUT.head[0], 1300],
};
const X_BANDS = {
  slot: LAYOUT.slot.x,
  "chapter-count": [60, 1020],
  "chapter-title": [60, 1020],
  "chapter-video": [60, 1020],
  "chapter-near": [60, 1020],
};
// The figure head (1.14.0): Anton 176 on a 156 px line overflows its line box
// by about 10 px at the top and its outline adds 13 px, so « plus de » keeps
// this much clearance above the number's line box (operator, 21 October 2026:
// « le million cache le plus de »).
export const FIGURE_PRE_GAP = 24;
export function checkSeriesLayout(boxes, { demo = false } = {}) {
  const problems = [];
  const near = 0.5;
  const pre = boxes.find((b) => b.kind === "figure-pre");
  const num = boxes.find((b) => b.kind === "figure-number");
  if (pre && num && num.y - (pre.y + pre.h) < FIGURE_PRE_GAP - near)
    problems.push(
      `« plus de » touche le chiffre : ${Math.round(num.y - (pre.y + pre.h))} px, ${FIGURE_PRE_GAP} au moins`
    );
  // 1.11.0: on an animated map, eight texts at most, two of them words, 12 px
  // clear of each other, of the drawings and of the arrows' heads.
  const animated = boxes.some((b) => b.animated);
  const names = boxes.filter(
    (b) => b.kind === "map-name" || b.kind === "map-word"
  );
  // A word made to go by a third is not counted while it fades out.
  const words = names.filter((b) => b.kind === "map-word" && !b.leaving);
  const counted = names.filter((b) => !b.leaving).length;
  if (animated && counted > MARKS.maxTexts)
    problems.push(
      `${counted} texts on the map: ${MARKS.maxTexts} at most (1.11.0)`
    );
  else if (!animated && names.length > MAP_FRAME.maxNames)
    problems.push(
      `${names.length} names on the map: more than six names, ${MAP_FRAME.maxNames} at most`
    );
  if (words.length > MARKS.maxWords)
    problems.push(
      `${words.length} words on the map: ${MARKS.maxWords} at most`
    );
  const marks = animated
    ? [
        ...names,
        ...boxes.filter(
          (b) => b.kind === "map-drawing" || b.kind === "map-head"
        ),
        // A mark fading in or out over another, in a change, is not yet or
        // no longer read: clearance is checked from half strength.
      ].filter((b) => !b.moving && (b.opacity ?? 1) >= 0.5)
    : names;
  const clear = animated ? MARKS.clearance : 0;
  marks.forEach((a, i) =>
    marks.slice(i + 1).forEach((b) => {
      // A drawing and its own label, a head and another head.
      if (a.of !== undefined && a.of === b.of) return;
      if (a.kind === "map-head" && b.kind === "map-head") return;
      if (
        a.x - clear < b.x + b.w &&
        b.x - clear < a.x + a.w &&
        a.y - clear < b.y + b.h &&
        b.y - clear < a.y + a.h
      )
        problems.push(
          clear
            ? `${a.id}: within ${clear} px of ${b.id}`
            : `${a.id}: overlaps ${b.id}`
        );
    })
  );
  for (const b of boxes) {
    const [left, right, top, bottom] = [b.x, b.x + b.w, b.y, b.y + b.h];
    const say = (what) => problems.push(`${b.id}: ${what}`);
    // An arrow's head is checked for clearance only; a mark moving with the
    // camera is checked once the view is still.
    if (b.kind === "map-head" || (b.animated && b.moving)) continue;
    if (b.kind === "image") {
      if (b.scale > LAYOUT.maxImageScale + 1e-9 && !demo)
        say(
          `Image trop petite pour la vidéo: enlarged ${b.scale.toFixed(2)} times, 1.5 at most`
        );
      continue;
    }
    // 1.8.0, check 5: the blur never covers the passage.
    if (b.kind === "document") {
      const { passage: p, sharp: s } = b;
      if (s.y > p.y + near || s.y + s.h < p.y + p.h - near)
        say(
          `Le flou couvre le passage: sharp from y ${Math.round(s.y)} to ${Math.round(s.y + s.h)}, passage from ${Math.round(p.y)} to ${Math.round(p.y + p.h)}`
        );
      continue;
    }
    if (b.kind === "map-subject") {
      if (top < LAYOUT.mapSubjectTop - near)
        say(
          `Le sujet de la carte passe sous la tête: it starts at y ${Math.round(top)}, above ${LAYOUT.mapSubjectTop}`
        );
      if (bottom > LAYOUT.mapFoot[0] + near)
        say(
          `the map's subject runs into the foot, below y ${LAYOUT.mapFoot[0]}`
        );
      if (Math.max(b.w, b.h) < MAP_FRAME.minSubject - near)
        say(
          `Sujet trop petit pour l'imagerie vérifiée: ${Math.round(Math.max(b.w, b.h))} px, ${MAP_FRAME.minSubject} at least`
        );
      continue;
    }
    const band =
      b.kind === "map-name" || b.kind === "map-word" || b.kind === "map-drawing"
        ? LAYOUT.mapNames.y
        : b.map && BANDS[b.kind] === LAYOUT.foot
          ? LAYOUT.mapFoot
          : BANDS[b.kind];
    if (!band) {
      say(`unknown kind ${b.kind}`);
      continue;
    }
    const [x0, x1] = X_BANDS[b.kind] ?? LAYOUT.x;
    if (left < x0 - near || right > x1 + near)
      say(
        `x ${Math.round(left)} to ${Math.round(right)} leaves x ${x0} to ${x1}`
      );
    if (top < band[0] - near || bottom > band[1] + near)
      say(
        `y ${Math.round(top)} to ${Math.round(bottom)} leaves its band, y ${band[0]} to ${band[1]}`
      );
    if (b.kind === "subtitle" && b.w > LAYOUT.subtitle.maxLineWidth + near)
      say(`a subtitle line is ${Math.round(b.w)} px wide, over 900`);
    if (b.kind === "formula" && b.size && b.w > 960 + near)
      say(
        `La formule ne tient pas dans 960 px à 88 px: ${Math.round(b.w)} px at ${b.size} px`
      );
    if (b.maxLines && b.lines > b.maxLines)
      say(`${b.lines} lines, ${b.maxLines} at most`);
  }
  return problems;
}

// Where each shot of a clip card starts, in frames from the card's first, and
// the checks of §2: its time on screen against its footage and the cut rules.
function planClipCuts(seq, i, shots) {
  const card = seq.cards[i];
  const span = (seq.cardStarts[i + 1] ?? seq.frames) - seq.cardStarts[i];
  shots.forEach((shot, k) => {
    shot.cut = !k
      ? 0
      : shot.say
        ? wordOf(seq, i, shot.say).frame - seq.cardStarts[i]
        : shots[k - 1].cut + shots[k - 1].count;
  });
  shots.forEach((shot, k) => {
    const shown = (shots[k + 1]?.cut ?? span) - shot.cut;
    const last = k === shots.length - 1;
    if (shown <= 0)
      fail(
        `Card ${card.id}: les coupes ne se suivent pas dans l'ordre de la voix (plan ${k + 1})`
      );
    if (shots.length > 1 && last && shown < 75)
      fail(
        `Card ${card.id}: le dernier plan reste moins de 2,5 s à l'écran (${shown} images)`
      );
    if (shots.length > 1 && shown < 60)
      fail(
        `Card ${card.id}: le plan ${k + 1} reste moins de 2 s à l'écran (${shown} images)`
      );
    if (shot.count < shown)
      fail(
        shots.length === 1
          ? `Card ${card.id}: le plan dure ${shot.count} images, il est plus court que sa carte (${span} images) : allonger out ou raccourcir la carte`
          : `Card ${card.id}: le plan ${k + 1} dure ${shot.count} images, plus court que son temps à l'écran (${shown} images)`
      );
  });
}
