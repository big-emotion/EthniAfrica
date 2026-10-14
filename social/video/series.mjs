// Frame-addressed model of the series video: EthniAfrica Cartes
// 1.3.0-proposition, layout B (series.md, « Vidéo de série »), built on
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

// Layout B in frame pixels (series.md). Text sits in the feed's safe zone:
// x 120 to 960 above y 840, x 120 to 760 below it (TikTok's buttons), from
// y 270 to 1248; sources, credits and the signature go under 1248.
export const LAYOUT = {
  band: [270, 342],
  photo: [342, 902],
  subtitle: { y: [700, 836], x: [120, 960], maxLineWidth: 840 },
  head: { y: [902, 1248], x: [120, 760] },
  safe: { x: [120, 960], y: [270, 1248], buttonsFrom: 840, narrowX: 760 },
};
const CROSS_FADE = 9; // 300 ms
const ZOOM = 0.04; // 100 → 104 %
const CLOSING_HOLD = 75; // 2.5 s
const LENGTH = [35, 45]; // seconds
// 0.4.0 voice timing (README, Voice): a chunk appears 150 ms before its first
// word; the last stays 200 ms after its last word, then fades in 200 ms.
const VOICE = { lead: 0.15, hold: 0.2, tail: 0.5, maxCps: 17, fade: 6 };
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
  if (version.acceptance?.videoLayout !== "B")
    fail("The accepted design does not set video layout B");

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
            `« ${text} » is wider than 840 px: a series subtitle line holds 840 px`
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
  chunks.forEach((chunk, k) => {
    const next = chunks[k + 1];
    chunk.fullFrom = k ? chunk.appear : chunk.appear + VOICE.fade;
    chunk.fullTo = next
      ? next.appear
      : Math.max(chunk.fullFrom, toFrame(chunk.words.at(-1).end + VOICE.hold));
    chunk.gone = next ? next.appear : chunk.fullTo + VOICE.fade;
    const needed = Math.ceil(
      (subtitleCharacters(chunk.text) / VOICE.maxCps) * FPS - 1e-9
    );
    if (chunk.gone - chunk.appear < needed)
      fail(
        `« ${chunk.text} » would read faster than 17 characters a second; the voice needs ${Math.ceil(((needed - (chunk.gone - chunk.appear)) * 1000) / FPS)} ms more`
      );
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
  if (seconds < LENGTH[0] || seconds > LENGTH[1])
    fail(
      `A series video lasts 35 to 45 s; this one lasts ${seconds.toFixed(1)} s`
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
  const layers = [{ card: current, opacity: 1, zoom: zoom(current) }];
  const next = current + 1;
  if (next < starts.length && frame > starts[next] - CROSS_FADE)
    layers.push({
      card: next,
      opacity: (frame - (starts[next] - CROSS_FADE)) / CROSS_FADE,
      zoom: zoom(next),
    });
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

// Problems with the text boxes the browser drew on one frame. `boxes` are
// { id, kind, x, y, w, h } in frame pixels; kinds "source", "credit",
// "signature" and "tape" are exempt (under y 1248, or the demo tape).
const EXEMPT = new Set(["source", "credit", "signature", "tape"]);
export function checkSeriesLayout(boxes) {
  const problems = [];
  const { safe, head, subtitle } = LAYOUT;
  const near = 0.5;
  for (const b of boxes) {
    if (EXEMPT.has(b.kind)) continue;
    const [left, right, top, bottom] = [b.x, b.x + b.w, b.y, b.y + b.h];
    const say = (what) => problems.push(`${b.id}: ${what}`);
    if (top < safe.y[0] - near || bottom > safe.y[1] + near)
      say(`y ${Math.round(top)} to ${Math.round(bottom)} leaves y 270 to 1248`);
    const maxX = bottom > safe.buttonsFrom + near ? safe.narrowX : safe.x[1];
    if (left < safe.x[0] - near || right > maxX + near)
      say(
        `x ${Math.round(left)} to ${Math.round(right)} leaves x 120 to ${maxX}`
      );
    if (
      b.kind === "head" &&
      (top < head.y[0] - near || bottom > head.y[1] + near)
    )
      say(`the head of the card runs outside y 902 to 1248`);
    if (b.kind === "subtitle" && b.w > subtitle.maxLineWidth + near)
      say(`a subtitle line is ${Math.round(b.w)} px wide, over 840`);
  }
  return problems;
}
