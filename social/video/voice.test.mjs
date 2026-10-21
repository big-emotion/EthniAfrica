// @req REQ-186
// The voice script → ElevenLabs request texts → words JSON conversion of
// social/video/voice.mjs, on recorded-shape fixtures only: no test calls the
// paid API.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  voiceSegments,
  assembleVoice,
  joinVoice,
  wavBytes,
  SAMPLE_RATE,
} from "./voice.mjs";

const NBSP = "\u00a0";
const fixtures = new URL("./fixtures/voice/", import.meta.url);
const script = JSON.parse(readFileSync(new URL("script.json", fixtures)));
const alignments = JSON.parse(
  readFileSync(new URL("alignment.json", fixtures))
);
const round = (s) => Math.round(s * 1000) / 1000;

// What the API would have returned for each segment: its alignment and
// silent audio 100 ms longer than its last character.
const synthesized = () =>
  alignments.map((alignment) => ({
    alignment,
    pcm: new Int16Array(
      Math.round(
        (alignment.character_end_times_seconds.at(-1) + 0.1) * SAMPLE_RATE
      )
    ),
  }));

// @req REQ-186
test("the script is cut into requests at each pause, with the spoken forms", () => {
  const segments = voiceSegments(script);
  assert.deepEqual(
    segments.map((s) => [s.pauseBeforeMs, s.text]),
    [
      [7400, "Sahara vient de l'arabe sahrâ, désert."],
      [2500, "Vers 1154, al-Idrissi"],
      [0, "Il y a quatorze mille cinq cents ans environ,"],
    ]
  );
  // Each unit keeps its screen text and knows where its spoken form sits.
  const [first] = segments;
  const unit = first.units[4];
  assert.equal(unit.text, `ṣaḥrāʾ${NBSP}(صحراء),`);
  assert.equal(unit.spoken, "sahrâ,");
  assert.equal(first.text.slice(unit.from, unit.to), "sahrâ,");
  // Neighbouring requests are passed as context for the prosody.
  assert.equal(segments[1].previousText, first.text);
  assert.equal(segments[1].nextText, segments[2].text);
});

// @req REQ-186
// Operator, 21 October 2026: a quoted word read with its guillemets came out
// stilted, and spoiled the words around it (« écrivent « tribu » »).
test("the voice reads a quoted word as a plain word: guillemets stay on screen only", () => {
  const quoted = {
    chunks: [
      { text: `ses traducteurs écrivent «${NBSP}tribu${NBSP}» pour qabīla,` },
      {
        text: `en «${NBSP}tribus primitives${NBSP}»`,
        units: [
          "en",
          { text: `«${NBSP}tribus`, spoken: "«tribusse" },
          `primitives${NBSP}»`,
        ],
      },
    ],
  };
  const [segment] = voiceSegments(quoted);
  assert.equal(
    segment.text,
    "ses traducteurs écrivent tribu pour qabīla, en tribusse primitives"
  );
  const tribu = segment.units[3];
  assert.equal(
    tribu.text,
    `«${NBSP}tribu${NBSP}»`,
    "the screen keeps its guillemets"
  );
  assert.equal(segment.text.slice(tribu.from, tribu.to), "tribu");
  assert.equal(segment.units[7].spoken, "tribusse");
});

// @req REQ-186
test("a script's units must be the chunk's own units, in order", () => {
  const broken = structuredClone(script);
  broken.chunks[2].units = [
    "Vers",
    { text: "al-Idrīsī", spoken: "al-Idrissi" },
  ];
  assert.throws(() => voiceSegments(broken), /3 units/);
  const renamed = structuredClone(script);
  renamed.chunks[2].units[2] = { text: "al-Idrisi", spoken: "al-Idrissi" };
  assert.throws(() => voiceSegments(renamed), /al-Idrīsī/);
  const negative = structuredClone(script);
  negative.chunks[1].pauseBeforeMs = -1;
  assert.throws(() => voiceSegments(negative), /pause/);
});

// @req REQ-186
test("character times map back to one word per screen unit, on the joined audio timeline", () => {
  const { wav, words } = assembleVoice(script, synthesized());
  const ends = alignments.map(
    (a) => a.character_end_times_seconds.at(-1) + 0.1
  );
  const offsets = [7.4, 7.4 + ends[0] + 2.5, 7.4 + ends[0] + 2.5 + ends[1]];
  assert.deepEqual(
    words.chunks.map((c) => c.text),
    script.chunks.map((c) => c.text)
  );
  assert.deepEqual(
    words.chunks.map((c) => c.words.length),
    [4, 2, 3, 6]
  );
  const [seg0, seg1, seg2] = alignments.map((a) => ({
    start: a.character_start_times_seconds,
    end: a.character_end_times_seconds,
  }));
  assert.deepEqual(words.chunks[0].words[0], {
    text: "Sahara",
    start: round(offsets[0] + seg0.start[0]),
    end: round(offsets[0] + seg0.end[5]),
  });
  // « sahrâ, » is spoken where the screen shows the transcription and its
  // Arabic script: the word keeps the screen unit and records the form.
  const at = `Sahara vient de l'arabe `.length;
  assert.deepEqual(words.chunks[1].words[0], {
    text: `ṣaḥrāʾ${NBSP}(صحراء),`,
    spoken: "sahrâ,",
    start: round(offsets[0] + seg0.start[at]),
    end: round(offsets[0] + seg0.end[at + 5]),
  });
  const idrissi = "Vers 1154, ".length;
  assert.deepEqual(words.chunks[2].words[2], {
    text: "al-Idrīsī",
    spoken: "al-Idrissi",
    start: round(offsets[1] + seg1.start[idrissi]),
    end: round(offsets[1] + seg1.end.at(-1)),
  });
  const number = "Il y a ".length;
  assert.deepEqual(words.chunks[3].words[3], {
    text: `14${NBSP}500`,
    spoken: "quatorze mille cinq cents",
    start: round(offsets[2] + seg2.start[number]),
    end: round(
      offsets[2] + seg2.end[number + "quatorze mille cinq cents".length - 1]
    ),
  });
  // The audio is the segments and their silences, end to end.
  const duration = (wav.length - 44) / 2 / SAMPLE_RATE;
  assert.equal(words.audio.duration, round(duration));
  assert.ok(Math.abs(duration - (offsets[2] + ends[2])) < 1e-3);
  assert.match(words.audio.sha256, /^[0-9a-f]{64}$/);
});

// @req REQ-186
test("an alignment that does not spell the text sent is refused", () => {
  const answers = synthesized();
  answers[1].alignment = structuredClone(answers[1].alignment);
  answers[1].alignment.characters[0] = "W";
  assert.throws(() => assembleVoice(script, answers), /alignment/);
});

// @req REQ-186
test("pauses are exact runs of silent samples between the segments", () => {
  const one = new Int16Array([1, 2, 3]);
  const two = new Int16Array([4, 5]);
  const { pcm, offsets } = joinVoice(
    [
      { pauseBeforeMs: 0, pcm: one },
      { pauseBeforeMs: 1, pcm: two },
    ],
    2000
  );
  assert.deepEqual([...pcm], [1, 2, 3, 0, 0, 4, 5]);
  assert.deepEqual(offsets, [0, 2.5e-3]);
});

// @req REQ-186
test("the WAV header says 16-bit mono PCM at 48 kHz", () => {
  const wav = wavBytes(new Int16Array(48000), SAMPLE_RATE);
  assert.equal(wav.length, 44 + 96000);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 48000);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.readUInt32LE(40), 96000);
});
