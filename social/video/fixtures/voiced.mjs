// A voiced variant of the Sahara demo for the tests: its first two chapters,
// an intro, an outro and ending A inviting to the whole site, timed on a
// synthetic voice. No real voice is ever recorded here: the audio is
// generated silence or a test tone.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chunkUnits } from "../sequence.mjs";
import { wavBytes, SAMPLE_RATE } from "../voice.mjs";

const saharaJson = JSON.parse(
  readFileSync(new URL("sahara.chapters.sequence.json", import.meta.url))
);
const round = (s) => Math.round(s * 1000) / 1000;

// The spoken chunks in video order: intro, chapters, outro. `at` places a
// chunk's first word on the audio timeline, `pause` leaves silence before
// it and starts a sentence; otherwise it follows the last word. A unit lasts
// 75 ms per character, about 13 characters a second, under the design's 17.
export const INTRO = [{ text: "Un nom venu de très loin", at: 0.5 }];
export const CHAPTER_1 = [
  { text: "Sahara vient de l'arabe", at: 7.5 },
  { text: "*ṣaḥrāʾ* (صحراء), « désert »." },
  { text: "Le lien avec la couleur", pause: 0.5 },
  { text: "du sol est une hypothèse." },
];
export const CHAPTER_2 = [
  { text: "Vers 1154, al-Idrīsī", pause: 2.5 },
  { text: "nomme ainsi le désert" },
  { text: "entre le pays des Berbères" },
  { text: "et celui des Noirs." },
];
export const OUTRO = [
  { text: "Retrouvez tout l'atlas", pause: 2.5 },
  { text: "sur le site ethniafrica.com" },
];
export const SPOKEN = [...INTRO, ...CHAPTER_1, ...CHAPTER_2, ...OUTRO];

export function speak(chunks, { tail = 1 } = {}) {
  let t = 0;
  const timed = chunks.map((chunk) => {
    t = chunk.at ?? t + (chunk.pause ?? 0);
    const words = chunkUnits(chunk.text).map((text) => {
      const length = [...text].length + 1;
      const word = {
        text,
        start: round(t),
        end: round(t + length * 0.075 - 0.02),
      };
      t += length * 0.075;
      return word;
    });
    return { text: chunk.text, words };
  });
  return { chunks: timed, duration: round(t + tail) };
}

const silence = (duration) =>
  wavBytes(new Int16Array(Math.round(duration * SAMPLE_RATE)), SAMPLE_RATE);

let files = 0;
// Writes the audio (`audio(duration)` returns its bytes; silence by
// default) and its words JSON into `dir`; `edit` changes the words before
// they are written.
export function writeVoice(
  dir,
  chunks = SPOKEN,
  { edit = () => {}, tail, audio = silence } = {}
) {
  const { chunks: timed, duration } = speak(chunks, { tail });
  const bytes = audio(duration, timed);
  const id = files++;
  const audioFile = join(dir, `voice-${id}.wav`);
  writeFileSync(audioFile, bytes);
  const words = {
    audio: {
      file: `voice-${id}.wav`,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      duration,
    },
    chunks: timed,
  };
  edit(words);
  const wordsFile = join(dir, `words-${id}.json`);
  writeFileSync(wordsFile, JSON.stringify(words));
  return { audio: audioFile, words: wordsFile, timed: words.chunks, duration };
}

export function voicedInput(voice, change = () => {}) {
  const input = structuredClone(saharaJson);
  input.chapters = input.chapters.slice(0, 2);
  const sentencesOf = (chunks) => {
    const sentences = [];
    for (const chunk of chunks) {
      if (!sentences.length || chunk.pause !== undefined) sentences.push([]);
      sentences.at(-1).push({ text: chunk.text });
    }
    return sentences;
  };
  input.intro = { sentences: sentencesOf(INTRO) };
  input.outro = { sentences: sentencesOf(OUTRO) };
  input.ending = {
    variant: "A",
    pageOnline: true,
    page: "home",
    sentence: "Tout l'atlas des noms est en ligne.",
  };
  input.voice = { audio: voice.audio, words: voice.words };
  change(input);
  return input;
}
