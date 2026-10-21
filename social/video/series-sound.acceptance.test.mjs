// @req REQ-186
// Cartes 1.13.0, the sound in the export (handoff.md « Renderer integration
// of 1.13.0 », step 13, check 13): with cue files and a bed, the voice is
// mixed with them to −16 LUFS integrated and −1 dBTP at most, the manifest
// records the measured mix, and the picture is the same as the voice-alone
// export's. The cues and the bed are synthesized here (tones and noise at
// known levels), never downloaded; the operator's own files replace them.
// Encodes the word card's short piece twice: about five minutes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { encodeSeriesVideo } from "./series-render.mjs";
import { soundLibrary, CUE_FAMILIES } from "./mix.mjs";
import { wordCardDemo } from "./fixtures/series-motion.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-sound-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));
const ff = (...args) =>
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);

// The piece, its silent voice replaced by a speech-like noise of the same
// length, so the mix has a voice to sit under.
const piece = join(dir, "piece");
const input = wordCardDemo(piece);
const words = JSON.parse(readFileSync(join(piece, "words.json"), "utf8"));
ff(
  "-f",
  "lavfi",
  "-i",
  `anoisesrc=d=${words.audio.duration}:c=pink:r=48000:a=0.3:s=11`,
  "-af",
  "lowpass=f=3000,volume=-6dB,tremolo=f=3:d=0.6",
  "-ar",
  "48000",
  "-ac",
  "1",
  "-c:a",
  "pcm_s16le",
  join(piece, "voice.wav")
);
words.audio.sha256 = createHash("sha256")
  .update(readFileSync(join(piece, "voice.wav")))
  .digest("hex");
writeFileSync(join(piece, "words.json"), JSON.stringify(words));
const seq = loadSeriesVideo(input, { dir: piece });

// A short tone or noise burst per family, and a pad for the series' bed.
const sounds = join(dir, "sound");
for (const family of CUE_FAMILIES) {
  mkdirSync(join(sounds, "cues", family), { recursive: true });
  ff(
    "-f",
    "lavfi",
    "-i",
    `sine=f=${600 + CUE_FAMILIES.indexOf(family) * 120}:d=0.3:r=48000`,
    "-af",
    "afade=t=out:st=0.05:d=0.25,volume=-3dB",
    join(sounds, "cues", family, "a.wav")
  );
}
mkdirSync(join(sounds, "beds"), { recursive: true });
ff(
  "-f",
  "lavfi",
  "-i",
  "anoisesrc=d=8:c=brown:r=48000:a=0.2:s=5",
  "-af",
  "lowpass=f=600",
  join(sounds, "beds", `${seq.band.id}.wav`)
);

const frameHashes = (file) =>
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    file,
    "-map",
    "0:v",
    "-f",
    "framemd5",
    "-",
  ]).toString();

// @req REQ-186
test("check 13: with cues and a bed, the mix is −16 ± 0.5 LUFS and −1 dBTP at most; the picture is the voice-alone export's", async () => {
  const alone = await encodeSeriesVideo(seq, join(dir, "alone"), {
    diagnose: true,
    sound: soundLibrary(join(dir, "none")),
  });
  assert.deepEqual(alone.manifest.sound, { mixed: false });
  const mixed = await encodeSeriesVideo(seq, join(dir, "mixed"), {
    diagnose: true,
    sound: soundLibrary(sounds),
  });
  const s = mixed.manifest.sound;
  assert.equal(s.mixed, true);
  assert.ok(s.cues > 5, `${s.cues} cues`);
  assert.equal(s.bed, true);
  assert.ok(Math.abs(s.integrated + 16) <= 0.5, `${s.integrated} LUFS`);
  assert.ok(s.truePeak <= -1, `${s.truePeak} dBTP`);
  assert.equal(mixed.manifest.cues, seq.cues.length);
  // The video identical without its audio track.
  assert.equal(frameHashes(mixed.file), frameHashes(alone.file));
});
