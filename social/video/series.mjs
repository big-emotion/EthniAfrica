// Frame-addressed model of the series video: EthniAfrica Cartes
// 1.4.0-proposition, full screen (series.md, « Vidéo de série »), with its
// map cards on satellite imagery since 1.4.1 (series-map.mjs), built on
// Vidéo carte 0.4.0's chunks, highlight and voice timing. The same cards as
// the carousel, on the operator's voice; every value is a function of the
// frame number, with no clock.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  FPS,
  chunkLines,
  subtitleLineWidth,
  subtitleCharacters,
  highlightAt,
  loadVoice,
  enter,
  leave,
  IMAGERY,
} from "./sequence.mjs";
import { MAP_FRAME, MAP_IMAGERY, checkSeriesMapCard } from "./series-map.mjs";
import {
  planMapSequences,
  mapRunState,
  runOfCard,
  wordOf,
} from "./series-sequence.mjs";
import {
  checkDocumentCard,
  checkFormula,
  checkSideBySide,
  weekCharacters,
} from "./series-document.mjs";

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
const ZOOM = 0.04; // 100 → 104 %
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

export const searchSentence = (name) => [
  `Cherchez ${name} sur EthniAfrica,`,
  "lien en profil.",
];
// 1.7.0 (series.md, « Vidéo longue et chapitres »): the general invitation
// names nothing and leads to the search page.
export const GENERAL_SENTENCE = [
  "Vous aussi, cherchez votre nom sur EthniAfrica,",
  "lien en profil.",
];
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
const REMINDER = [75, 120];
const SOURCE_LABELS = ["Source", "Sources", "Hypothèses"];

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
  const seen = new Set();
  const entries = beats.map((beat, i) => {
    if (beat.type === "chapter") {
      const n = beat.chapter;
      const title =
        chapters[n - 1]?.title ??
        fail(`Beat ${i + 1}: chapter ${n} has no title in chapters`);
      if (beat.chunks?.length)
        fail(`Chapter ${n}: a chapter card is not voiced; the voice is silent`);
      return {
        card: {
          id: `chapitre-${n}`,
          type: "chapter",
          chapter: { n, of: chapters.length, title },
          // An image of its own brings its own credit: a CC BY-SA picture
          // shown without its attribution breaks its licence.
          ...(beat.image && { image: structuredClone(beat.image) }),
          ...(beat.image && beat.credit && { credit: beat.credit }),
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
    if (card.type === "map") checkSeriesMapCard(card);
    checkLongCardFields(card);
    // 1.8.0: the document card and the teaching cards.
    if (card.image?.document) checkDocumentCard(card);
    if (card.formula) checkFormula(card);
    if (card.sbs) checkSideBySide(card);
    return { card: structuredClone(card), chunks: beat.chunks };
  });
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
  // A silent card (chapter, next episode) shows the band and theme of the
  // episode, and by default the image of the card after it: a run of one
  // image, where only the head changes.
  const silent = (card, next) => {
    card.series = structuredClone(first.series);
    if (first.theme) card.theme = first.theme;
    if (!card.image && next.image) {
      card.image = structuredClone(next.image);
      if (next.credit) card.credit = next.credit;
    }
  };
  entries.forEach((e, i) => {
    if (e.card.type === "chapter") silent(e.card, entries[i + 1].card);
  });
  if (entries.some((e) => key(e.card) !== key(first)))
    fail("A series video shows one series, one episode and one theme");

  // The « série » ending (operator, decision 5 of 13 October 2026): it asks
  // for a search, so like ending A it promises a page that must exist. Since
  // 1.7.0 it may instead invite every viewer to search their own name.
  const ending = input.ending;
  if (ending?.pageOnline !== true)
    fail("The « série » ending promises a page: it needs pageOnline: true");
  const general = ending.general === true;
  if (!general && (typeof ending.search !== "string" || !ending.search.trim()))
    fail("The « série » ending names what to search");
  const expected = general ? GENERAL_SENTENCE : searchSentence(ending.search);
  const closingChunks = entries.at(-1).chunks;
  const closing = closingChunks.slice(-2).map((c) => c.text);
  const spaces = (t) => t.replace(/\s+/gu, " ");
  if (
    closing.length !== 2 ||
    closing.some((t, i) => spaces(t) !== spaces(expected[i]))
  )
    fail(`The closing card's last two chunks are « ${expected.join(" ")} »`);
  // Cartes 1.6.0, decision 1: the voice says the signature line, one printed
  // line per chunk, before the search sentence. The line is the accepted
  // design's (version.json), the same text the cards' bundle draws.
  const signature = version.signatureLine.split(/(?<=,) /u);
  const said = closingChunks.map((c) => spaces(c.text));
  if (
    said.length !== signature.length + 2 ||
    signature.some((t, i) => said[i] !== t)
  )
    fail(
      `La ligne de signature n'est pas dite mot pour mot : la carte de clôture dit « ${signature.join(" ")} », puis la phrase de recherche`
    );
  // 1.7.0: the next episode, printed under the pill after the named
  // invitation (one line, measured on « Afrique »); after the general one,
  // which takes two lines, on a silent card of its own before the ending.
  if (typeof ending.next === "string" && ending.next.trim()) {
    const closingCard = entries.at(-1).card;
    if (general) {
      const own = { id: "prochain-episode", type: "next", title: ending.next };
      silent(own, closingCard);
      entries.splice(-1, 0, { card: own, chunks: [] });
    } else closingCard.next = ending.next;
  }
  const last = entries.length - 1;
  const cards = entries.map((e) => e.card);
  const texts = entries.flatMap((e) => e.chunks.map((c) => c.text));
  const chunks = entries.flatMap((entry, card) =>
    entry.chunks.map(({ text }) => {
      // 1.6.0: the ending prints the line and the invitation itself, so the
      // closing card's chunks are voiced but never shown as subtitles; the
      // subtitle rules (3 to 6 words, 900 px, reading speed) do not apply
      // to them. The general invitation's first chunk has 7 words (1.7.0).
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
    ending: {
      ...(general ? { general: true } : { search: ending.search }),
      pageOnline: true,
      ...(ending.next && { next: ending.next }),
    },
    voice,
    chunks,
  };
  schedule(seq, voice.chunks);
  // 1.5.0: consecutive map cards of one `map.sequence` share one map.
  seq.mapSequence = planMapSequences(seq, IMAGERY[MAP_IMAGERY]);
  planLongVideo(seq, input);
  return seq;
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
    // 1.7.0: before a silent card (a chapter, the next episode) the last
    // chunk leaves after its last word, so the silence shows no subtitle.
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
  const isSilent = (c) => c.type === "chapter" || c.type === "next";
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
  // The silent card holds at full opacity until the next card's change
  // begins: long enough to read its title at 21 characters a second plus
  // 0.3 s, and a chapter card 1.2 s at least.
  seq.cards.forEach((card, i) => {
    if (!isSilent(card)) return;
    const title = card.type === "chapter" ? card.chapter.title : card.title;
    const need = Math.max(
      card.type === "chapter" ? CHAPTER_HOLD : 0,
      Math.ceil(([...title].length / READ_CPS + 0.3) * FPS - 1e-9)
    );
    const full = seq.cardStarts[i + 1] - CROSS_FADE - seq.cardStarts[i];
    if (full < need)
      fail(
        `${card.type === "chapter" ? `Chapitre ${card.chapter.n}` : "Prochain épisode"} : le silence est trop court de ${Math.ceil(((need - full) * 1000) / FPS)} ms; the voice script lengthens the pause`
      );
  });
  const voiceEnd = Math.ceil((seq.voice.duration + VOICE.tail) * FPS - 1e-9);
  seq.frames = Math.max(
    seq.cardStarts.at(-1) + CLOSING_HOLD,
    voiceEnd,
    chunks.at(-1).gone
  );
  seq.warnings = [];
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
    if (["opener", "closing", "chapter", "next"].includes(card.type)) return;
    if (card.signed) card.videoKicker = "Nous pensons";
    else if (chapter && !card.date)
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
    const frame = (c) =>
      JSON.stringify([c.image?.src, c.image?.focus, c.image?.video]);
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
  if (card.formula) {
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
  if (card.week) {
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

export function seriesFrameState(seq, frame) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= seq.frames)
    fail(`Frame ${frame} is outside the video, 0 to ${seq.frames - 1}`);
  const starts = seq.cardStarts;
  // The card on screen alone, or the one under a cross-fade.
  let current = 0;
  while (current + 1 < starts.length && frame >= starts[current + 1]) current++;
  // 1.7.0: a run of one image zooms once, from its first card's first frame
  // to its last card's end.
  const imageRun = (i) => seq.imageRuns?.[i] ?? -1;
  const zoom = (i) => {
    let a = i;
    let b = i;
    if (imageRun(i) >= 0) {
      while (a > 0 && imageRun(a - 1) === imageRun(i)) a--;
      while (b + 1 < starts.length && imageRun(b + 1) === imageRun(i)) b++;
    }
    const from = a ? starts[a] - CROSS_FADE + 1 : 0; // first frame drawn
    const to = b + 1 < starts.length ? starts[b + 1] - 1 : null;
    if (to === null) return 1; // the ending shows no photograph
    return 1 + (ZOOM * (frame - from)) / (to - from);
  };
  // `opacity` is the image's, `text` the card's own text (head, foot): the
  // images cross-fade over the whole change while the heads swap inside it,
  // out in the first half and in during the second, never both at once
  // (operator, 14 October 2026).
  const layers = [{ card: current, opacity: 1, zoom: zoom(current), text: 1 }];
  const next = current + 1;
  if (next < starts.length && frame > starts[next] - CROSS_FADE) {
    const p = (frame - (starts[next] - CROSS_FADE)) / CROSS_FADE;
    layers[0].text = Math.max(0, 1 - 2 * p);
    layers.push({
      card: next,
      opacity: p,
      zoom: zoom(next),
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
  // Items and the quoted person enter on their word, over 9 frames, their
  // place kept from the card's first frame.
  const arrive = (from) =>
    frame <= from
      ? 0
      : frame >= from + CROSS_FADE
        ? 1
        : enter((frame - from) / CROSS_FADE);
  for (const l of layers) {
    const card = seq.cards[l.card];
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
  }
  // A map sequence's card shows its run's map, zoomed once over the run.
  // Between two cards of one run the map is drawn once, by the outgoing
  // card's layer: the incoming card brings only its head and foot.
  const runs = layers.map((l) => runOfCard(seq.mapSequence, l.card));
  for (const [i, l] of layers.entries()) {
    if (runs[i] < 0) continue;
    l.map = mapRunState(seq, runs[i], frame);
    l.zoom = l.map.zoom;
    if (i && runs[i] === runs[i - 1]) l.opacity = 0;
  }
  const chunk = seq.chunks.find(
    (c) => !c.hidden && frame >= c.appear && frame < c.gone
  );
  const subtitle = chunk
    ? {
        lines: chunk.lines,
        opacity:
          frame < chunk.fullFrom
            ? enter((frame - chunk.appear) / VOICE.fade)
            : frame < chunk.fullTo
              ? 1
              : 1 - leave((frame - chunk.fullTo) / VOICE.fade),
        highlight: highlightAt(chunk.words, frame / FPS),
      }
    : null;
  return { layers, subtitle };
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
  // the subtitle band; a chapter title in the head, at most 900 px wide.
  items: [LAYOUT.head[0], 1290],
  attribution: [LAYOUT.head[0], 1300],
  "chapter-title": LAYOUT.head,
  // 1.8.0: the formula in the clear zone, ending above y 1290.
  formula: [LAYOUT.clear[0], 1290],
};
const X_BANDS = { slot: LAYOUT.slot.x, "chapter-title": [60, 960] };
export function checkSeriesLayout(boxes, { demo = false } = {}) {
  const problems = [];
  const near = 0.5;
  const names = boxes.filter((b) => b.kind === "map-name");
  if (names.length > MAP_FRAME.maxNames)
    problems.push(
      `${names.length} names on the map: more than six names, ${MAP_FRAME.maxNames} at most`
    );
  names.forEach((a, i) =>
    names.slice(i + 1).forEach((b) => {
      if (
        a.x < b.x + b.w &&
        b.x < a.x + a.w &&
        a.y < b.y + b.h &&
        b.y < a.y + a.h
      )
        problems.push(`${a.id}: overlaps ${b.id}`);
    })
  );
  for (const b of boxes) {
    const [left, right, top, bottom] = [b.x, b.x + b.w, b.y, b.y + b.h];
    const say = (what) => problems.push(`${b.id}: ${what}`);
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
      b.kind === "map-name"
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
