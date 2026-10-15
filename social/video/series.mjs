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
} from "./sequence.mjs";
import { MAP_FRAME, checkSeriesMapCard } from "./series-map.mjs";

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
// recommendation, a faster chunk loads with a warning; 20 is the limit, past
// which a subtitle cannot be read and the chunk is refused.
const VOICE = {
  lead: 0.15,
  hold: 0.2,
  tail: 0.5,
  recommendedCps: 17,
  maxCps: 20,
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
  const seen = new Set();
  const cards = beats.map((beat, i) => {
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
    return structuredClone(card);
  });
  if (cards[0].type !== "opener")
    fail("A series video opens on its opener card");
  if (cards.at(-1).type !== "closing")
    fail("A series video ends on its closing card");
  const key = (c) =>
    JSON.stringify([
      c.series?.id ?? c.series?.name,
      c.series?.episode,
      c.theme ?? "nuit",
    ]);
  if (!cards[0].series) fail("A series video's cards carry the series band");
  if (cards.some((c) => key(c) !== key(cards[0])))
    fail("A series video shows one series, one episode and one theme");

  // The « série » ending (operator, decision 5 of 13 October 2026): it asks
  // for a search, so like ending A it promises a page that must exist.
  const ending = input.ending;
  if (ending?.pageOnline !== true)
    fail("The « série » ending promises a page: it needs pageOnline: true");
  if (typeof ending.search !== "string" || !ending.search.trim())
    fail("The « série » ending names what to search");
  const closing = beats
    .at(-1)
    .chunks.slice(-2)
    .map((c) => c.text);
  const expected = searchSentence(ending.search);
  const spaces = (t) => t.replace(/\s+/gu, " ");
  if (
    closing.length !== 2 ||
    closing.some((t, i) => spaces(t) !== spaces(expected[i]))
  )
    fail(`The closing card's last two chunks are « ${expected.join(" ")} »`);
  // The searched name never breaks across the two subtitle lines, as the
  // design's ending board shows it: its spaces are set unbreakable.
  const unbreakable = searchSentence(ending.search.replace(/\s+/gu, " "));
  const firstClosing = beats.at(-1).chunks.length - 2;
  const shown = (c, card, k) =>
    card === beats.length - 1 && k >= firstClosing
      ? unbreakable[k - firstClosing]
      : c.text;

  const texts = beats.flatMap((b) => b.chunks.map((c) => c.text));
  const chunks = beats.flatMap((beat, card) =>
    beat.chunks.map((c, k) => {
      const text = shown(c, card, k);
      const lines = chunkLines(text);
      for (const line of lines) {
        const text = line.map((r) => r.text).join("");
        if (subtitleLineWidth(text) > LAYOUT.subtitle.maxLineWidth)
          fail(
            `« ${text} » is wider than 900 px: a series subtitle line holds 900 px`
          );
      }
      return { text, card, lines };
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
    band: { ...cards[0].series },
    ending: { search: ending.search, pageOnline: true },
    voice,
    chunks,
  };
  schedule(seq, voice.chunks);
  return seq;
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
    chunk.fullFrom = k ? chunk.appear : chunk.appear + VOICE.fade;
    chunk.fullTo = next
      ? next.appear
      : Math.max(chunk.fullFrom, toFrame(chunk.words.at(-1).end + VOICE.hold));
    chunk.gone = next ? next.appear : chunk.fullTo + VOICE.fade;
    const framesFor = (cps) =>
      Math.ceil((subtitleCharacters(chunk.text) / cps) * FPS - 1e-9);
    const shown = chunk.gone - chunk.appear;
    if (shown < framesFor(VOICE.maxCps))
      fail(
        `« ${chunk.text} » would read faster than ${VOICE.maxCps} characters a second; the voice needs ${Math.ceil(((framesFor(VOICE.maxCps) - shown) * 1000) / FPS)} ms more`
      );
    if (shown < framesFor(VOICE.recommendedCps)) fastChunks.push(chunk.text);
  });
  // A card is fully in when its first chunk appears; the cross-fade that
  // brings it in takes the 300 ms before.
  seq.cardStarts = seq.cards.map((_, i) =>
    i ? chunks.find((c) => c.card === i).appear : 0
  );
  seq.cardStarts.forEach((start, i) => {
    if (i && start - CROSS_FADE < seq.cardStarts[i - 1])
      fail(
        `Card ${seq.cards[i].id} comes before the cross-fade into the card before it ends`
      );
  });
  const voiceEnd = Math.ceil((seq.voice.duration + VOICE.tail) * FPS - 1e-9);
  seq.frames = Math.max(
    seq.cardStarts.at(-1) + CLOSING_HOLD,
    voiceEnd,
    chunks.at(-1).gone
  );
  const seconds = seq.frames / FPS;
  seq.warnings = [];
  if (fastChunks.length)
    seq.warnings.push(
      `${fastChunks.length} chunk(s) read faster than the recommended ${VOICE.recommendedCps} characters a second: ${fastChunks.map((t) => `« ${t} »`).join(", ")}`
    );
  if (seconds < RECOMMENDED_LENGTH[0] || seconds > RECOMMENDED_LENGTH[1])
    seq.warnings.push(
      `A series video's recommended length is ${RECOMMENDED_LENGTH[0]} to ${RECOMMENDED_LENGTH[1]} s; this one lasts ${seconds.toFixed(1)} s`
    );
}

export const seriesFrameCount = (seq) => seq.frames;

export function seriesFrameState(seq, frame) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= seq.frames)
    fail(`Frame ${frame} is outside the video, 0 to ${seq.frames - 1}`);
  const starts = seq.cardStarts;
  // The card on screen alone, or the one under a cross-fade.
  let current = 0;
  while (current + 1 < starts.length && frame >= starts[current + 1]) current++;
  const zoom = (i) => {
    const from = i ? starts[i] - CROSS_FADE + 1 : 0; // first frame drawn
    const to = i + 1 < starts.length ? starts[i + 1] - 1 : null;
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
  const chunk = seq.chunks.find((c) => frame >= c.appear && frame < c.gone);
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
};
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
    const [x0, x1] = b.kind === "slot" ? LAYOUT.slot.x : LAYOUT.x;
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
  }
  return problems;
}
