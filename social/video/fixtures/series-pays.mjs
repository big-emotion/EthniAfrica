// The series 1 demonstration video (Cartes 1.4.0, full screen), built from the
// design's voice script `video.model.json` and timed on a synthetic voice:
// generated silence whose word times spread each chunk's units over the
// chunk's scripted duration. No real voice is recorded here; the operator's
// voice replaces it, timed by voice.mjs or by hand in the same words JSON.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chunkUnits } from "../sequence.mjs";
import { wavBytes, SAMPLE_RATE } from "../voice.mjs";

const model = JSON.parse(
  readFileSync(
    new URL(
      "../../design-system/proposals/1.3.0-proposition/video.model.json",
      import.meta.url
    )
  )
);
export const CARDS = fileURLToPath(
  new URL("../../design-system/handoff/cards.sample.json", import.meta.url)
);
// The accepted ending (Cartes 1.10.0, words of 27 October 2026): the
// invitation, then the closing line, voiced one printed line per chunk, at
// about 16 characters a second.
const { signatureLines, invitationLines } = JSON.parse(
  readFileSync(
    new URL("../../design-system/version.json", import.meta.url),
    "utf8"
  )
);
// The first word is said 0.6 s in, so the cover (frame 0) has no subtitle.
const LEAD = 0.6;
const round = (s) => Math.round(s * 1000) / 1000;
export const closingChunks = () =>
  [...invitationLines, ...signatureLines].map((text) => ({
    text,
    duration: round([...text].length / 16),
  }));

// The intro bumper's sentence (social/series-idents), in four subtitle
// chunks, at about 16 characters a second.
export const introChunks = () =>
  [
    "Avec EthniAfrica, on part des noms",
    "qu'on emploie en français",
    "pour mieux comprendre l'Afrique",
    "et ses peuples.",
  ].map((text) => ({ text, duration: round([...text].length / 16) }));

// Generated silence whose word times spread each chunk's units over the
// chunk's scripted duration, from 0.6 s in; writes voice.wav and words.json.
// A beat's `silence` (seconds, 1.7.0) is a pause before its chunks, the one a
// chapter card fills.
export function writeSyntheticVoice(dir, beats) {
  let t = LEAD;
  const timed = beats.flatMap((beat) => {
    t += beat.silence ?? 0;
    return (beat.chunks ?? []).map(({ text, duration }) => {
      const units = chunkUnits(text);
      const letters = units.reduce((n, u) => n + [...u].length + 1, 0);
      const pace = (duration - 0.2) / letters;
      let at = t;
      const words = units.map((unit) => {
        const length = ([...unit].length + 1) * pace;
        const word = {
          text: unit,
          start: round(at),
          end: round(at + length * 0.9),
        };
        at += length;
        return word;
      });
      t += duration;
      return { text, words };
    });
  });
  const duration = round(t);
  const audio = wavBytes(
    new Int16Array(Math.round(duration * SAMPLE_RATE)),
    SAMPLE_RATE
  );
  writeFileSync(join(dir, "voice.wav"), audio);
  writeFileSync(
    join(dir, "words.json"),
    JSON.stringify({
      audio: {
        file: "voice.wav",
        sha256: createHash("sha256").update(audio).digest("hex"),
        duration,
      },
      chunks: timed,
    })
  );
}

// `edit(input)` changes the sequence before it is returned; `script(beats)`
// changes the spoken chunks before they are timed.
export function seriesDemo(dir, { edit = () => {}, script = (b) => b } = {}) {
  mkdirSync(dir, { recursive: true });
  const beats = script(
    model.beats.map((beat, i) => ({
      card: `serie-${beat.card}`,
      // 1.10.0: the closing card says the closing line and the invitation,
      // in place of the 1.3.0 script's search sentence.
      chunks:
        i === model.beats.length - 1
          ? closingChunks()
          : beat.chunks.map(({ text, duration }) => ({ text, duration })),
    }))
  );
  writeSyntheticVoice(dir, beats);
  const input = {
    // The script is 1.3.0's; the layout is the accepted 1.4.0 full screen.
    design: "EthniAfrica Cartes 1.5.0-proposition, vidéo de série plein écran",
    // The cards' own tape, as on the carousel and the design's boards.
    demo: JSON.parse(readFileSync(CARDS, "utf8")).cards.find(
      (c) => c.id === beats[0].card
    ).demo,
    cards: CARDS,
    // A beat without a card (the intro bumper) keeps its type.
    beats: beats.map((beat) => ({
      ...(beat.type ? { type: beat.type } : { card: beat.card }),
      chunks: beat.chunks.map(({ text }) => ({ text })),
    })),
    ending: {},
    voice: { audio: "voice.wav", words: "words.json" },
  };
  edit(input);
  return input;
}

// node social/video/fixtures/series-pays.mjs --out DIR writes the voice files
// and series.sequence.json, ready for series-render.mjs.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--out");
  if (at < 0) throw new Error("Usage: series-pays.mjs --out DIR");
  const dir = resolve(process.argv[at + 1]);
  const input = seriesDemo(dir);
  writeFileSync(
    join(dir, "series.sequence.json"),
    JSON.stringify(input, null, 2) + "\n"
  );
  console.log(join(dir, "series.sequence.json"));
}
