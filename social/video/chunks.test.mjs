// @req REQ-186
// Subtitle chunks of EthniAfrica Vidéo carte 0.4.0-proposition (accepted
// 12 October 2026): chunking, the reading rule, cuts within a sentence and
// the spoken-word highlight. Expected values come from the design's
// timing.md and timeline.json for the 58.9 s Sahara example.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  loadSequence,
  frameState,
  frameCount,
  chapterTimeline,
  subtitleCharacters,
  chunkUnits,
  chunkWords,
  chunkLines,
  readingSeconds,
  highlightAt,
  voicedChunkStart,
  checkWordTimes,
} from "./sequence.mjs";

const NBSP = " ";
const fixtures = new URL("./fixtures/", import.meta.url);
const saharaJson = JSON.parse(
  readFileSync(new URL("sahara.chapters.sequence.json", fixtures))
);
const sahara = (change = () => {}) => {
  const input = structuredClone(saharaJson);
  change(input);
  return loadSequence(input, { dir: fixtures });
};
const lineTexts = (lines) => lines.map((l) => l.map((r) => r.text).join(""));
const frameOf = (seconds) => Math.round(seconds * 30);
const near = (actual, expected, what) =>
  assert.ok(
    Math.abs(actual - expected) <= 1 / 30 + 1e-9,
    `${what}: ${actual} s, expected ${expected} s`
  );

// The design's timeline.json, chunk by chunk: text as the reader sees it,
// characters, words, lines, appear, full opacity from and to, gone.
const TIMELINE = [
  ["Sahara vient de l'arabe", 23, 4, 1, 7.3, 7.5, 9.4, 9.4],
  [
    `ṣaḥrāʾ${NBSP}(صحراء), «${NBSP}désert${NBSP}».`,
    27,
    3,
    2,
    9.4,
    9.4,
    11.2,
    11.2,
  ],
  ["Le lien avec la couleur", 23, 5, 1, 11.5, 11.5, 13.4, 13.4],
  ["du sol est une hypothèse.", 25, 5, 1, 13.4, 13.4, 15.1, 15.3],
  [`Vers${NBSP}1154, al-Idrīsī`, 20, 3, 1, 16.8, 17.0, 18.7, 18.7],
  ["nomme ainsi le désert", 21, 4, 1, 18.7, 18.7, 20.1, 20.1],
  ["entre le pays des Berbères", 26, 5, 1, 20.1, 20.1, 21.9, 21.9],
  ["et celui des Noirs.", 19, 4, 1, 21.9, 21.9, 23.2, 23.4],
  [`Hérodote disait «${NBSP}Libye${NBSP}»`, 25, 3, 1, 24.9, 25.1, 27.1, 27.1],
  ["l'Afrique à l'ouest de l'Égypte.", 32, 5, 2, 27.1, 27.1, 29.3, 29.3],
  ["Chez les Touaregs,", 18, 3, 1, 29.6, 29.6, 31.1, 31.1],
  ["ténéré et tanezruft", 19, 3, 1, 31.1, 31.1, 32.5, 32.5],
  ["sont des sortes de désert.", 26, 5, 1, 32.5, 32.5, 34.3, 34.5],
  [
    `Aujourd'hui, le nom «${NBSP}Sahara${NBSP}»`,
    30,
    4,
    2,
    36.0,
    36.2,
    38.5,
    38.5,
  ],
  ["nomme tout le désert.", 21, 4, 1, 38.5, 38.5, 39.9, 39.9],
  [
    `À l'est, le «${NBSP}désert${NBSP}libyque${NBSP}».`,
    31,
    5,
    2,
    40.2,
    40.2,
    42.6,
    42.8,
  ],
  [`Il y a 14${NBSP}500 ans environ,`, 26, 6, 1, 46.5, 46.7, 48.8, 48.8],
  ["un grand lac couvrait ce bassin.", 32, 6, 2, 48.8, 48.8, 51.0, 51.0],
  ["La fin de cette période", 23, 5, 1, 51.3, 51.3, 53.2, 53.2],
  ["humide reste discutée.", 22, 3, 1, 53.2, 53.2, 54.7, 54.9],
];

// @req REQ-186
test("characters, words and lines of every Sahara chunk match timeline.json", () => {
  const chunks = chapterTimeline(sahara()).chapters.flatMap((c) => c.chunks);
  assert.equal(chunks.length, TIMELINE.length);
  chunks.forEach((chunk, i) => {
    const [text, chars, words, lines] = TIMELINE[i];
    // A line break replaces a plain space, so joining with one restores it.
    assert.equal(lineTexts(chunk.lines).join(" "), text);
    assert.equal(subtitleCharacters(chunk.text), chars, `${text} characters`);
    assert.equal(chunkWords(chunk.text), words, `${text} words`);
    assert.equal(chunk.lines.length, lines, `${text} lines`);
  });
});

// @req REQ-186
test("a chunk holds 3 to 6 words; a number with its space is one word", () => {
  assert.equal(chunkWords(`Il y a 14${NBSP}500 ans environ,`), 6);
  assert.equal(chunkWords(`Hérodote disait «${NBSP}Libye${NBSP}»`), 3);
  assert.throws(() => chunkLines("Deux mots."), /3 to 6 words/);
  assert.throws(
    () => chunkLines("Un deux trois quatre cinq six sept."),
    /3 to 6 words/
  );
  assert.doesNotThrow(() => chunkLines("Un deux trois quatre cinq six."));
});

// @req REQ-186
test("one line when it fits; else two balanced lines at plain spaces, after a comma when possible", () => {
  assert.deepEqual(lineTexts(chunkLines("entre le pays des Berbères")), [
    "entre le pays des Berbères",
  ]);
  assert.deepEqual(lineTexts(chunkLines("l'Afrique à l'ouest de l'Égypte.")), [
    "l'Afrique à l'ouest",
    "de l'Égypte.",
  ]);
  // « Aujourd'hui, le » / « nom « Sahara » » would be better balanced; the
  // comma wins.
  assert.deepEqual(
    lineTexts(chunkLines(`Aujourd'hui, le nom «${NBSP}Sahara${NBSP}»`)),
    ["Aujourd'hui,", `le nom «${NBSP}Sahara${NBSP}»`]
  );
  assert.deepEqual(
    lineTexts(chunkLines(`À l'est, le «${NBSP}désert${NBSP}libyque${NBSP}».`)),
    ["À l'est,", `le «${NBSP}désert${NBSP}libyque${NBSP}».`]
  );
  // A no-break group is never split, even when that leaves no break at all.
  assert.throws(
    () =>
      chunkLines(
        `Le «${NBSP}grand${NBSP}désert${NBSP}des${NBSP}Berbères${NBSP}» ici.`
      ),
    /26 characters/
  );
});

// @req REQ-186
test("a line measured wider than 900 px at 56 px goes to two lines", () => {
  // 26 characters of wide capitals: within the count, beyond the measure.
  const wide = "MWMWMW WMWMWM MWMWMW WMWMW";
  assert.equal(subtitleCharacters(wide), 26);
  assert.equal(chunkLines(wide).length, 2);
});

// @req REQ-186
test("a transcription with its Arabic script is one unit, alone on its line", () => {
  const text = `*ṣaḥrāʾ*${NBSP}(صحراء), «${NBSP}désert${NBSP}».`;
  assert.deepEqual(chunkUnits(text), [
    `ṣaḥrāʾ${NBSP}(صحراء),`,
    `«${NBSP}désert${NBSP}».`,
  ]);
  const lines = chunkLines(text);
  assert.deepEqual(lineTexts(lines), [
    `ṣaḥrāʾ${NBSP}(صحراء),`,
    `«${NBSP}désert${NBSP}».`,
  ]);
  assert.deepEqual(lines[0][0], { text: "ṣaḥrāʾ", italic: true, unit: 0 });
  assert.equal(lines[0].find((r) => r.arabic).text, "صحراء");
  // The group takes its own line, so this two-line chunk cannot share it.
  assert.throws(
    () => chunkLines(`Le mot *ṣaḥrāʾ*${NBSP}(صحراء) dit désert.`),
    /own line/
  );
  assert.throws(() => chunkLines("Le mot صحراء veut dire."), /Arabic/);
});

// @req REQ-186
test("overlong chunks are refused rather than shrunk", () => {
  assert.throws(
    () => chunkLines("Anticonstitutionnellementissimes mots ici."),
    /26 characters/
  );
  assert.throws(
    () =>
      chunkLines(
        "Ceci est vraiment beaucoup trop long pour deux lignes de sous-titre."
      ),
    /3 to 6 words|26 characters/
  );
});

// @req REQ-186
test("full opacity is characters ÷ 15 + lead, 1.2 to 4 s, rounded up to 0.1 s", () => {
  for (const [chars, plain, lead] of [
    [12, 1.2, 1.2],
    [20, 1.4, 1.7],
    [26, 1.8, 2.1],
    [40, 2.7, 3.0],
    [70, 4, 4],
  ]) {
    assert.equal(readingSeconds(chars), plain, `${chars} characters`);
    assert.equal(
      readingSeconds(chars, { afterEmptyBand: true }),
      lead,
      `${chars} characters after an empty band`
    );
  }
  // At least 0.3 s after the chunk's last entry ends: chunk 3.2.2 names
  // Ténéré then Tanezrouft, whose entry ends 1.1 s after the chunk appears.
  assert.equal(readingSeconds(19, { entriesEnd: 1.1 }), 1.4);
});

// @req REQ-186
test("the Sahara example reproduces timeline.json's chunk times and chapter starts within one frame", () => {
  const timeline = chapterTimeline(sahara());
  [6.4, 15.9, 24.0, 35.1, 45.6].forEach((start, i) =>
    near(timeline.chapters[i].start, start, `chapter ${i + 1}`)
  );
  const chunks = timeline.chapters.flatMap((c) => c.chunks);
  chunks.forEach((chunk, i) => {
    const [text, , , , appear, fullFrom, fullTo, gone] = TIMELINE[i];
    near(chunk.appear, appear, `${text} appears`);
    near(chunk.fullFrom, fullFrom, `${text} full from`);
    near(chunk.fullTo, fullTo, `${text} full to`);
    near(chunk.gone, gone, `${text} gone`);
  });
  near(timeline.chapters[4].travel.start, 43.2, "travel start");
  near(timeline.chapters[4].travel.duration, 1.8, "travel duration");
  near(timeline.ending.start, 54.9, "ending");
  near(timeline.ending.closingIn, 55.9, "closing block");
  near(timeline.total, 58.9, "total");
  assert.equal(frameCount(sahara()), 1767);
});

// @req REQ-186
test("within a sentence chunks cut on the same frame; between sentences 300 ms of empty band", () => {
  const seq = sahara();
  const timeline = chapterTimeline(seq);
  for (const chapter of timeline.chapters) {
    const chunks = chapter.chunks;
    for (let k = 1; k < chunks.length; k++) {
      const [before, now] = [chunks[k - 1], chunks[k]];
      const gap = Math.round((now.appear - before.gone) * 30);
      assert.equal(
        gap,
        now.sentence === before.sentence ? 0 : 9,
        `${now.text}: ${gap} empty frames`
      );
    }
    // No fade and no empty frame inside a sentence: full opacity throughout.
    for (const chunk of chunks.slice(1, -1))
      for (let f = frameOf(chunk.appear); f < frameOf(chunk.fullTo); f++) {
        const { subtitle } = frameState(seq, f);
        assert.equal(subtitle.opacity, 1, `frame ${f}`);
        assert.equal(
          lineTexts(subtitle.lines).join(" "),
          lineTexts(chunk.lines).join(" ")
        );
      }
  }
});

// @req REQ-186
test("a chapter's first chunk fades in 200 ms at T + 1500 (T + 3700 after a travel); its last fades out 200 ms", () => {
  const seq = sahara();
  const timeline = chapterTimeline(seq);
  const [one, two] = timeline.chapters;
  const T = one.chunks.at(-1).gone;
  near(two.chunks[0].appear, T + 1.5, "T + 1500 ms");
  const [four, five] = timeline.chapters.slice(3);
  near(five.chunks[0].appear, four.chunks.at(-1).gone + 3.7, "T + 3700 ms");
  const first = frameOf(two.chunks[0].appear);
  assert.equal(frameState(seq, first).subtitle.opacity, 0);
  const rising = frameState(seq, first + 3).subtitle.opacity;
  assert.ok(rising > 0 && rising < 1);
  assert.equal(frameState(seq, first + 6).subtitle.opacity, 1);
  const last = frameOf(one.chunks.at(-1).fullTo);
  const falling = frameState(seq, last + 3).subtitle.opacity;
  assert.ok(falling > 0 && falling < 1);
  assert.equal(frameState(seq, last + 6).subtitle, null);
});

// @req REQ-186
test("a highlight unit is a word with its punctuation and guillemets, a number with its space", () => {
  assert.deepEqual(chunkUnits(`Il y a 14${NBSP}500 ans environ,`), [
    "Il",
    "y",
    "a",
    `14${NBSP}500`,
    "ans",
    "environ,",
  ]);
  assert.deepEqual(
    chunkUnits(`À l'est, le «${NBSP}désert${NBSP}libyque${NBSP}».`),
    ["À", "l'est,", "le", `«${NBSP}désert`, `libyque${NBSP}».`]
  );
});

// @req REQ-186
test("highlight(t) follows word times: to the next start, or 100 ms after a word that ends a pause", () => {
  // timing.md's example: « entre le pays des Berbères ».
  const words = [
    { start: 0.0, end: 0.28 },
    { start: 0.28, end: 0.4 },
    { start: 0.4, end: 0.7 },
    { start: 0.7, end: 0.82 },
    { start: 0.82, end: 1.4 },
  ];
  assert.equal(highlightAt(words, -0.01), null);
  assert.equal(highlightAt(words, 0), 0);
  assert.equal(highlightAt(words, 0.3), 1);
  assert.equal(highlightAt(words, 0.5), 2);
  assert.equal(highlightAt(words, 0.81), 3);
  assert.equal(highlightAt(words, 1.45), 4);
  assert.equal(highlightAt(words, 1.5), null);
  // A pause of 350 ms or more: the box leaves 100 ms after the word ends.
  const paused = [
    { start: 0, end: 0.3 },
    { start: 0.65, end: 0.9 },
    { start: 0.9, end: 1.2 },
  ];
  assert.equal(highlightAt(paused, 0.39), 0);
  assert.equal(highlightAt(paused, 0.41), null);
  assert.equal(highlightAt(paused, 0.65), 1);
  // A pause just under 350 ms keeps the box until the next word starts.
  const short = [
    { start: 0, end: 0.3 },
    { start: 0.64, end: 0.9 },
  ];
  assert.equal(highlightAt(short, 0.6), 0);
  // The chunk appears 150 ms before its first word, with the voice.
  assert.equal(voicedChunkStart(paused), -0.15);
  assert.equal(voicedChunkStart([{ start: 2, end: 2.3 }]), 1.85);
});

// @req REQ-186
test("word times must match the chunk's units, in order", () => {
  const text = "entre le pays des Berbères";
  const five = [0, 0.28, 0.4, 0.7, 0.82].map((start, i, all) => ({
    text: text.split(" ")[i],
    start,
    end: all[i + 1] ?? 1.4,
  }));
  assert.doesNotThrow(() => checkWordTimes(text, five));
  assert.throws(() => checkWordTimes(text, five.slice(1)), /5 units/);
  const swapped = structuredClone(five);
  swapped[2].start = 0.2;
  assert.throws(() => checkWordTimes(text, swapped), /order/);
});

// @req REQ-186
test("without a voice there is no highlight at all", () => {
  const seq = sahara();
  for (let f = 0; f < frameCount(seq); f++) {
    const { subtitle } = frameState(seq, f);
    if (subtitle) assert.equal(subtitle.highlight, null, `frame ${f}`);
  }
  assert.throws(() => sahara((s) => (s.voice = "voice.json")), /voice/i);
});
