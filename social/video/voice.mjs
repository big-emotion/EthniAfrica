// Voices a video script with ElevenLabs and writes the audio and the word
// times the renderer reads (Vidéo carte 0.4.0, highlight.withVoice).
//
//   node social/video/voice.mjs --script SCRIPT.json [--voice VOICE_ID] --out DIR
//
// Without --voice, the house voice; without `voiceSettings` in the script,
// its neutral rhythm (see HOUSE_VOICE below).
//
// Writes DIR/voice.wav (16-bit mono PCM, 48 kHz) and DIR/words.json. Every
// request is billed: the tests run the pure steps on fixtures and never call
// the API. The key comes from ELEVENLABS_API_KEY, or from the `elevenlabs` MCP
// server entry of the user-level Claude Code config, as in the reel-clip
// skill's transcribe.mjs.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chunkUnits } from "./sequence.mjs";

export const SAMPLE_RATE = 48000;
const MODEL = "eleven_multilingual_v2";
// MP3 is the format every ElevenLabs plan returns; FFmpeg decodes it to the
// PCM the pauses are counted in.
const OUTPUT_FORMAT = "mp3_44100_128";

const fail = (message) => {
  throw new Error(message);
};
const sameText = (a, b) =>
  a.normalize("NFC").replace(/\s+/gu, " ") ===
  b.normalize("NFC").replace(/\s+/gu, " ");

// A chunk's units as the script gives them, checked against the units the
// renderer highlights: the screen text decides, `spoken` only changes what
// the voice says.
function scriptUnits(chunk, what) {
  const screen = chunkUnits(chunk.text);
  if (!chunk.units) return screen.map((text) => ({ text }));
  if (chunk.units.length !== screen.length)
    fail(
      `${what} « ${chunk.text} » has ${screen.length} units; the script lists ${chunk.units.length}`
    );
  return chunk.units.map((unit, i) => {
    const { text, spoken } = typeof unit === "string" ? { text: unit } : unit;
    if (!sameText(text ?? "", screen[i]))
      fail(`${what}: unit ${i + 1} is « ${screen[i]} », not « ${text} »`);
    if (spoken !== undefined && !(typeof spoken === "string" && spoken.trim()))
      fail(`${what}: the spoken form of « ${screen[i]} » is empty`);
    return { text: screen[i], ...(spoken && { spoken }) };
  });
}

// Guillemets are for the eye. Read aloud they made the model stiffen on the
// quoted word and on its neighbours (operator, 21 October 2026), so the voice
// gets the sentence plain; the screen keeps them.
const withoutGuillemets = (text) =>
  text.replace(/[  ]?[«»“”"][  ]?/gu, "").trim();

// A unit ends its sentence when its spoken form ends on . ! ? or … and the
// next unit opens a new one (a capital or a digit): « après… rien » goes on,
// and so do « av. » and a single initial, whatever follows them.
const SENTENCE_END = /[.!?…]["'’)\]]*$/u;
const ABBREVIATION = /^(?:\p{Lu}|av|apr|cf|env|ibid|Mme|St)\.$/u;
const SENTENCE_START = /^["'‘(\[]*[\p{Lu}\p{N}]/u;
const endsSentence = (said, next) =>
  SENTENCE_END.test(said) &&
  !ABBREVIATION.test(said) &&
  SENTENCE_START.test(next);

// Silence after each sentence that has no pause of its own. Read as separate
// requests, sentences otherwise follow each other with only the few
// milliseconds of room the model leaves at either end, which sounds like one
// sentence running into the next. Operator-tuned range: 350 to 450 ms.
export const SENTENCE_PAUSE_MS = 400;

// What each request is told of its neighbours. `previous` (the default) sends
// the sentence before as `previous_text`: the model then opens on the same
// pitch and pace, and that text says nothing about how this sentence ends.
// `next_text` does, and it made eleven_multilingual_v2 read every full stop as
// a continuation (operator, 27 October 2026); `both` keeps it reachable for a
// comparison, `none` sends no context at all.
const CONTEXTS = ["previous", "none", "both"];

// One request per sentence: a sentence keeps its prosody and ends on its own
// punctuation, with nothing after it to rise towards. A pause is silence of
// an exact length rather than a break tag whose length the model may
// stretch. A chunk with `pauseBeforeMs`, even 0, starts a new request with
// exactly that silence; a sentence end without one gets `sentencePauseMs`.
export function voiceSegments(script) {
  const chunks = script.chunks;
  if (!Array.isArray(chunks) || !chunks.length)
    fail("A voice script needs chunks");
  const sentencePause = script.sentencePauseMs ?? SENTENCE_PAUSE_MS;
  if (!(Number.isInteger(sentencePause) && sentencePause >= 0))
    fail("A sentence pause is a whole number of milliseconds, 0 or more");
  const context = script.context ?? "previous";
  if (!CONTEXTS.includes(context))
    fail(`The voice context is one of ${CONTEXTS.join(", ")}, not ${context}`);
  const segments = [];
  let lastSaid = null;
  chunks.forEach((chunk, c) => {
    const what = `Chunk ${c + 1}`;
    if (typeof chunk.text !== "string" || !chunk.text.trim())
      fail(`${what} needs its text`);
    const pause = chunk.pauseBeforeMs;
    if (pause !== undefined && !(Number.isInteger(pause) && pause >= 0))
      fail(`${what}: a pause is a whole number of milliseconds, 0 or more`);
    scriptUnits(chunk, what).forEach((unit, u) => {
      const said = withoutGuillemets(unit.spoken ?? unit.text);
      if (!said) fail(`${what}: « ${unit.text} » has nothing left to say`);
      if (u === 0 && pause !== undefined)
        segments.push({ pauseBeforeMs: pause, text: "", units: [] });
      else if (lastSaid === null)
        segments.push({ pauseBeforeMs: 0, text: "", units: [] });
      else if (endsSentence(lastSaid, said))
        segments.push({ pauseBeforeMs: sentencePause, text: "", units: [] });
      const segment = segments.at(-1);
      if (segment.text) segment.text += " ";
      const from = segment.text.length;
      segment.text += said;
      if (unit.spoken) unit.spoken = said;
      segment.units.push({ chunk: c, ...unit, from, to: segment.text.length });
      lastSaid = said;
    });
  });
  segments.forEach((segment, i) => {
    if (i && context !== "none") segment.previousText = segments[i - 1].text;
    if (i < segments.length - 1 && context === "both")
      segment.nextText = segments[i + 1].text;
  });
  return segments;
}

const round = (s) => Math.round(s * 1000) / 1000;

// A unit runs from the start of its first spoken character to the end of
// its last, spaces excluded.
function unitTimes(segment, alignment, offset) {
  if (alignment?.characters?.join("") !== segment.text)
    fail(
      `The ElevenLabs alignment does not spell the text sent: « ${segment.text} »`
    );
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  return segment.units.map((unit) => {
    const spoken = [];
    for (let i = unit.from; i < unit.to; i++)
      if (!/\s/u.test(segment.text[i])) spoken.push(i);
    return {
      chunk: unit.chunk,
      word: {
        text: unit.text,
        ...(unit.spoken && { spoken: unit.spoken }),
        start: round(offset + starts[spoken[0]]),
        end: round(offset + ends[spoken.at(-1)]),
      },
    };
  });
}

// Segments joined end to end, each after its pause, in samples so the
// silences are exact. `offsets` are each segment's start in seconds.
export function joinVoice(parts, rate) {
  let length = 0;
  const starts = parts.map((part) => {
    length += Math.round((part.pauseBeforeMs * rate) / 1000);
    const at = length;
    length += part.pcm.length;
    return at;
  });
  const pcm = new Int16Array(length);
  parts.forEach((part, i) => pcm.set(part.pcm, starts[i]));
  return { pcm, offsets: starts.map((at) => at / rate) };
}

export function wavBytes(pcm, rate) {
  const header = Buffer.alloc(44);
  const size = pcm.length * 2;
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + size, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(size, 40);
  return Buffer.concat([
    header,
    Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength),
  ]);
}

// The pure end of the pipeline: what each request returned (its alignment
// and its audio decoded to PCM at SAMPLE_RATE) becomes the WAV and the
// words JSON, one word per screen unit, chunk by chunk in script order.
export function assembleVoice(
  script,
  synthesized,
  { file = "voice.wav" } = {}
) {
  const segments = voiceSegments(script);
  if (synthesized.length !== segments.length)
    fail(`${segments.length} requests, ${synthesized.length} answers`);
  const { pcm, offsets } = joinVoice(
    segments.map((s, i) => ({
      pauseBeforeMs: s.pauseBeforeMs,
      pcm: synthesized[i].pcm,
    })),
    SAMPLE_RATE
  );
  const chunks = script.chunks.map((chunk) => ({
    text: chunk.text,
    words: [],
  }));
  segments.forEach((segment, i) => {
    for (const { chunk, word } of unitTimes(
      segment,
      synthesized[i].alignment,
      offsets[i]
    ))
      chunks[chunk].words.push(word);
  });
  const wav = wavBytes(pcm, SAMPLE_RATE);
  return {
    wav,
    words: {
      audio: {
        file,
        sha256: createHash("sha256").update(wav).digest("hex"),
        duration: round(pcm.length / SAMPLE_RATE),
      },
      chunks,
    },
  };
}

async function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const config = JSON.parse(
    await readFile(join(homedir(), ".claude.json"), "utf8").catch(() => "{}")
  );
  const find = (node) => {
    if (!node || typeof node !== "object") return null;
    if (node.elevenlabs?.env?.ELEVENLABS_API_KEY)
      return node.elevenlabs.env.ELEVENLABS_API_KEY;
    for (const value of Object.values(node)) {
      const hit = find(value);
      if (hit) return hit;
    }
    return null;
  };
  const key = find(config);
  if (!key)
    throw new Error(
      "No ElevenLabs key: set ELEVENLABS_API_KEY or configure the elevenlabs MCP server"
    );
  return key;
}

// The house voice, chosen by the operator on « tribu » (22 October 2026).
// At the default stability (0.5) voices trembled and hesitated; this one,
// held steady with no style, reads plainly without lifting sentence ends.
// 0.95 keeps the subtitles under 21 characters a second without pauses
// inside sentences.
export const HOUSE_VOICE = "M4ZqLOXSFqxSkn9RDxFO";
const HOUSE_VOICE_SETTINGS = {
  stability: 0.9,
  similarity_boost: 0.8,
  style: 0,
  use_speaker_boost: true,
  speed: 0.95,
};

// eleven_multilingual_v2 refuses `language_code` (only the Turbo and Flash
// v2.5 models take it): the French comes from the text itself.
export function requestBody(segment, script) {
  return {
    text: segment.text,
    model_id: script.model ?? MODEL,
    ...(script.seed !== undefined && { seed: script.seed }),
    voice_settings: script.voiceSettings ?? HOUSE_VOICE_SETTINGS,
    ...(segment.previousText && { previous_text: segment.previousText }),
    ...(segment.nextText && { next_text: segment.nextText }),
  };
}

async function synthesize(segment, script, voiceId, key) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify(requestBody(segment, script)),
    }
  );
  if (!response.ok)
    fail(`ElevenLabs answered ${response.status}: ${await response.text()}`);
  const answer = await response.json();
  const decoded = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-f",
      "mp3",
      "-i",
      "-",
      "-ac",
      "1",
      "-ar",
      String(SAMPLE_RATE),
      "-f",
      "s16le",
      "-",
    ],
    {
      input: Buffer.from(answer.audio_base64, "base64"),
      maxBuffer: 1 << 30,
    }
  );
  if (decoded.status !== 0)
    fail(`FFmpeg could not decode the voice: ${decoded.stderr}`);
  const bytes = decoded.stdout;
  return {
    alignment: answer.alignment,
    pcm: new Int16Array(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)
    ),
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      script: { type: "string" },
      voice: { type: "string", default: HOUSE_VOICE },
      out: { type: "string" },
    },
  });
  if (!values.script || !values.out)
    fail(
      "Usage: node social/video/voice.mjs --script SCRIPT.json [--voice VOICE_ID] --out DIR"
    );
  const script = JSON.parse(await readFile(resolve(values.script), "utf8"));
  const segments = voiceSegments(script);
  const key = await apiKey();
  const synthesized = [];
  for (const segment of segments)
    synthesized.push(await synthesize(segment, script, values.voice, key));
  const { wav, words } = assembleVoice(script, synthesized);
  await mkdir(resolve(values.out), { recursive: true });
  await writeFile(join(resolve(values.out), "voice.wav"), wav);
  await writeFile(
    join(resolve(values.out), "words.json"),
    JSON.stringify(words, null, 2) + "\n"
  );
  console.log(
    `${segments.length} requests, ${words.audio.duration} s: ${join(values.out, "voice.wav")}`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
