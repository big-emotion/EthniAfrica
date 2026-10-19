// @req REQ-186
// The parallel final render (operator, 19 October 2026) on a short animated
// map: the opener on the globe, the 1984 card of the animated satellite map
// (fixtures/series-carte-animee.mjs) and the closing card, over a voice that
// is a tone rather than silence, so the audio comparison means something.
// Rendered once in one slice and once in three, the two videos must hold the
// same frames, the same duration and the same audio track; a failing slice
// fails the whole render and leaves no video. The imagery is not in git:
// point ETHNIAFRICA_VIDEO_ASSETS at its folder. A missing folder fails; it
// is never reported as passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesSlices } from "./series.mjs";
import { encodeSeriesVideo, renderSeriesFrames } from "./series-render.mjs";
import { wavBytes, SAMPLE_RATE } from "./voice.mjs";
import { animatedDemo } from "./fixtures/series-carte-animee.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const root = mkdtempSync(join(tmpdir(), "series-parallel-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const KEEP = ["serie-pays-01", "carte-animee-1984", "serie-pays-07"];

// `edit(deck)` changes the cards of the short sequence.
function shortSequence(name, edit = () => {}) {
  const dir = join(root, name);
  const input = animatedDemo(dir, {
    edit: (deck) => {
      deck.cards = deck.cards.filter((c) => KEEP.includes(c.id));
      edit(deck);
    },
    script: (beats) => beats.filter((b) => KEEP.includes(b.card)),
  });
  // A 440 Hz tone the length of the synthetic voice, its hash in the words.
  const words = JSON.parse(readFileSync(join(dir, "words.json"), "utf8"));
  const samples = Math.round(words.audio.duration * SAMPLE_RATE);
  const tone = new Int16Array(samples).map((_, i) =>
    Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE))
  );
  const audio = wavBytes(tone, SAMPLE_RATE);
  writeFileSync(join(dir, "voice.wav"), audio);
  words.audio.sha256 = sha(audio);
  writeFileSync(join(dir, "words.json"), JSON.stringify(words));
  return loadSeriesVideo(input, { dir });
}

const probe = (file) =>
  JSON.parse(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-count_frames",
      "-show_entries",
      "stream=codec_type,nb_frames,nb_read_frames,avg_frame_rate,duration:format=duration",
      "-of",
      "json",
      file,
    ]).toString()
  );
// The audio packets as stored, hashed without decoding them.
const audioTrack = (file) =>
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    file,
    "-map",
    "0:a",
    "-c",
    "copy",
    "-f",
    "md5",
    "-",
  ]).toString();
// One decoded frame as RGB bytes.
const decoded = (file, frame) =>
  execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      file,
      "-vf",
      `select=eq(n\\,${frame})`,
      "-frames:v",
      "1",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 }
  );

let seq, one, three;
// @req REQ-186
test.before(async () => {
  if (!assets) return;
  seq = shortSequence("short");
  one = await encodeSeriesVideo(seq, join(root, "one"), {
    diagnose: true,
    workers: 1,
  });
  three = await encodeSeriesVideo(seq, join(root, "three"), {
    diagnose: true,
    workers: 3,
  });
});

// @req REQ-186
test("the verified assets are present", () => {
  assert.ok(
    assets,
    "Set ETHNIAFRICA_VIDEO_ASSETS to the verified imagery folder"
  );
});

// @req REQ-186
test("the short sequence is cut twice, inside the animated map card", (t) => {
  if (!assets) return t.skip("no imagery");
  const map = seq.cards.findIndex((c) => c.id === "carte-animee-1984");
  const [from, to] = [seq.cardStarts[map], seq.cardStarts[map + 1]];
  assert.equal(three.manifest.workers, 3);
  assert.deepEqual(
    three.manifest.cuts,
    seriesSlices(seq, 3)
      .slice(1)
      .map((s) => s.from)
  );
  for (const cut of three.manifest.cuts)
    assert.ok(cut >= from && cut < to, `cut ${cut} outside ${from} to ${to}`);
  assert.equal(one.manifest.workers, 1);
  assert.deepEqual(one.manifest.cuts, []);
});

// @req REQ-186
test("three slices: the same frame count, rate and duration as one", (t) => {
  if (!assets) return t.skip("no imagery");
  const [a, b] = [probe(one.file), probe(three.file)];
  const video = (p) => p.streams.find((s) => s.codec_type === "video");
  for (const p of [a, b]) {
    assert.equal(Number(video(p).nb_frames), seq.frames);
    assert.equal(Number(video(p).nb_read_frames), seq.frames);
    assert.equal(video(p).avg_frame_rate, "30/1");
  }
  assert.equal(video(b).duration, video(a).duration);
  assert.equal(b.format.duration, a.format.duration);
  assert.equal(three.manifest.frames, one.manifest.frames);
});

// @req REQ-186
test("three slices: the same audio track as one", (t) => {
  if (!assets) return t.skip("no imagery");
  const [a, b] = [probe(one.file), probe(three.file)];
  const audio = (p) => p.streams.find((s) => s.codec_type === "audio");
  assert.equal(audio(b).duration, audio(a).duration);
  assert.equal(audioTrack(three.file), audioTrack(one.file));
});

// @req REQ-186
test("three slices: the manifest describes the joined file and every slice's problems", (t) => {
  if (!assets) return t.skip("no imagery");
  assert.equal(three.manifest.hashes.video, sha(readFileSync(three.file)));
  assert.deepEqual(three.manifest.layoutProblems, one.manifest.layoutProblems);
  // The same record but for the video's bytes and how it was cut.
  const record = (m) => ({
    ...m,
    hashes: { ...m.hashes, video: null },
    workers: null,
    cuts: null,
  });
  assert.deepEqual(record(three.manifest), record(one.manifest));
  // The slices are deleted once joined.
  assert.deepEqual(readdirSync(join(root, "three")).sort(), [
    "manifest.json",
    "video.mp4",
  ]);
});

// @req REQ-186
test("at each cut, the frames drawn are the single pass's, pixel for pixel", async (t) => {
  if (!assets) return t.skip("no imagery");
  // A slice's browser first draws the 30 frames before its slice, unkept;
  // the single pass draws the cut after every frame from 0. Both must give
  // the same picture. A browser's very first frame does not: a few edges
  // are anti-aliased otherwise until a frame has been drawn (5 pixels at
  // frame 239 of this sequence).
  const run = (from, to) =>
    renderSeriesFrames(
      seq,
      Array.from({ length: to - from + 1 }, (_, k) => from + k),
      { diagnose: true }
    );
  const single = await run(0, three.manifest.cuts.at(-1));
  for (const cut of three.manifest.cuts) {
    const slice = (await run(cut - 30, cut)).at(-1);
    assert.ok(slice.png.equals(single[cut].png), `frame ${cut}`);
  }
});

// @req REQ-186
test("at each cut, the encoded frames match the single pass's within x264's loss", (t) => {
  if (!assets) return t.skip("no imagery");
  // The drawn frames are the same (above); the encoded ones cannot be byte
  // for byte, since each slice starts its own group of pictures and x264
  // at CRF 16 is lossy. They must stay far above visible difference.
  for (const cut of three.manifest.cuts)
    for (const f of [cut - 1, cut]) {
      const [a, b] = [decoded(one.file, f), decoded(three.file, f)];
      assert.equal(a.length, b.length);
      let squares = 0;
      let worst = 0;
      for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        squares += d * d;
        worst = Math.max(worst, Math.abs(d));
      }
      const psnr = 10 * Math.log10((255 * 255) / (squares / a.length || 1e-9));
      t.diagnostic(`frame ${f}: PSNR ${psnr.toFixed(1)} dB, ${worst} at most`);
      assert.ok(psnr > 40, `frame ${f}: PSNR ${psnr.toFixed(1)} dB`);
    }
});

// @req REQ-186
test("a failing slice fails the whole render and leaves no video", async (t) => {
  if (!assets) return t.skip("no imagery");
  // The closing card asks to scroll, which every frame refuses: the last
  // slice fails when it reaches it, while the others are drawing.
  const failing = shortSequence("failing", (deck) => {
    deck.cards.at(-1).credit += " Faites défiler";
  });
  const out = join(root, "failing-out");
  await assert.rejects(
    encodeSeriesVideo(failing, out, { diagnose: true, workers: 3 }),
    /Faites défiler/
  );
  assert.deepEqual(readdirSync(out), []);
});
