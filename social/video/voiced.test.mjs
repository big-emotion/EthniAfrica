// @req REQ-186
// The voiced schedule of Vidéo carte 0.4.0 (timing.md §2, version.json
// highlight.withVoice and areas.entry.t0Voice): the voice's word times place
// every chunk, entry, chapter change and the ending; the spoken word is
// highlighted. The audio here is generated silence, never a real voice, and
// no test calls a paid API.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSequence,
  frameState,
  frameCount,
  chapterTimeline,
} from "./sequence.mjs";
import { SPOKEN, speak, writeVoice, voicedInput } from "./fixtures/voiced.mjs";

const fixtures = new URL("./fixtures/", import.meta.url);
const saharaJson = JSON.parse(
  readFileSync(new URL("sahara.chapters.sequence.json", fixtures))
);
const work = mkdtempSync(join(tmpdir(), "ethniafrica-voiced-"));
after(() => rmSync(work, { recursive: true, force: true }));

const round = (s) => Math.round(s * 1000) / 1000;
const toFrame = (s) => Math.round(s * 30);
const voiceFiles = (chunks, options) => writeVoice(work, chunks, options);
const voiced = (voice = voiceFiles(), change) =>
  loadSequence(voicedInput(voice, change), { dir: fixtures });

// @req REQ-186
test("a voiced sequence loads its audio and word times", () => {
  const voice = voiceFiles();
  const seq = voiced(voice);
  assert.equal(seq.voice.duration, voice.duration);
  assert.equal(seq.voice.chunks.length, SPOKEN.length);
});

// @req REQ-186
test("each chunk appears 150 ms before its first word and is cut when the next appears", () => {
  const voice = voiceFiles();
  const seq = voiced(voice);
  const timeline = chapterTimeline(seq);
  const chunks = [
    ...timeline.intro,
    ...timeline.chapters.flatMap((c) => c.chunks),
    ...timeline.outro,
  ];
  assert.equal(chunks.length, SPOKEN.length);
  chunks.forEach((chunk, k) => {
    const first = voice.timed[k].words[0].start;
    assert.equal(chunk.appear, toFrame(first - 0.15) / 30, chunk.text);
  });
  // Within a chapter the next chunk replaces the last on the same frame,
  // across a sentence pause too.
  for (const chapter of timeline.chapters)
    for (let k = 1; k < chapter.chunks.length; k++)
      assert.equal(chapter.chunks[k - 1].gone, chapter.chunks[k].appear);
  const appear = toFrame(voice.timed[3].words[0].start - 0.15);
  const before = frameState(seq, appear - 1).subtitle;
  const now = frameState(seq, appear).subtitle;
  assert.equal(now.opacity, 1);
  assert.notDeepEqual(now.lines, before.lines);
});

// @req REQ-186
test("a chapter's last chunk fades out 200 ms after its last word ends", () => {
  const voice = voiceFiles();
  const seq = voiced(voice);
  const [one] = chapterTimeline(seq).chapters;
  const lastWord = voice.timed[4].words.at(-1);
  const last = one.chunks.at(-1);
  assert.equal(last.fullTo, toFrame(lastWord.end + 0.2) / 30);
  assert.equal(Math.round((last.gone - last.fullTo) * 30), 6);
  const first = one.chunks[0];
  assert.equal(Math.round((first.fullFrom - first.appear) * 30), 6);
});

// @req REQ-186
test("the box sits on the spoken unit, leaves 100 ms after a word before a pause, and moves by a cut", () => {
  const voice = voiceFiles();
  const seq = voiced(voice);
  const words = voice.timed[1].words; // « Sahara vient de l'arabe »
  const at = (s) => frameState(seq, Math.ceil(s * 30 - 1e-9));
  assert.equal(at(words[0].start - 0.1).subtitle.highlight, null);
  words.forEach((w, i) =>
    assert.equal(at(w.start).subtitle.highlight, i, w.text)
  );
  // « *ṣaḥrāʾ* (صحراء), « désert ». » ends a sentence; 500 ms of silence
  // follow, so the box leaves 100 ms after its last word.
  const pausing = voice.timed[2].words.at(-1);
  assert.equal(at(pausing.end + 0.05).subtitle.highlight, 1);
  assert.equal(at(pausing.end + 0.15).subtitle.highlight, null);
  // A transcription with its Arabic script is one unit.
  assert.equal(at(voice.timed[2].words[0].start).subtitle.highlight, 0);
});

// @req REQ-186
test("an area enters at the start of the first word of the chunk naming it", () => {
  const voice = voiceFiles();
  const seq = voiced(voice);
  const [, two] = chapterTimeline(seq).chapters;
  const naming = two.chunks.find((c) =>
    c.entries.some((e) => e.ref === "berberes")
  );
  const word = voice.timed[1 + 4 + 2].words[0].start;
  assert.equal(naming.entries[0].at, toFrame(word) / 30);
  const frame = toFrame(word);
  assert.equal(frameState(seq, frame).features.berberes.opacity, 0);
  assert.ok(frameState(seq, frame + 3).features.berberes.opacity > 0);
});

// @req REQ-186
test("a chapter change keeps its order between the two chapters' speech", () => {
  const voice = voiceFiles();
  const seq = voiced(voice);
  const [one, two] = chapterTimeline(seq).chapters;
  // The last chunk has gone when everything leaves; the next chapter enters
  // 900 ms before its first chunk appears.
  assert.equal(one.exit, one.chunks.at(-1).gone);
  assert.ok(two.start >= one.exit + 0.6 - 1e-9);
  assert.ok(Math.abs(two.chunks[0].appear - two.start - 0.9) < 1e-9);
  for (let f = toFrame(one.exit + 0.4); f < toFrame(two.start); f++)
    assert.equal(frameState(seq, f).subtitle, null, `frame ${f}`);
});

// @req REQ-186
test("a gap too short for a chapter change is refused with the silence it needs", () => {
  const short = SPOKEN.map((c) =>
    c.text === "Vers 1154, al-Idrīsī" ? { ...c, pause: 1 } : c
  );
  const exit = chapterTimeline(voiced()).chapters[0].exit * 30;
  const timed = speak(short).chunks;
  const first = timed[1 + 4].words[0].start;
  const needed = exit + 12 + 6 + 27 - toFrame(first - 0.15);
  assert.throws(
    () => voiced(voiceFiles(short)),
    new RegExp(
      `Chapter 2 .*needs ${Math.ceil((needed * 1000) / 30)} ms more silence`
    )
  );
});

// @req REQ-186
test("a camera travel needs its own silence", () => {
  const voice = voiceFiles();
  assert.throws(
    () =>
      voiced(voice, (input) => {
        input.chapters[1].camera = { lon: 8, lat: 18.7, radius: 1500 };
      }),
    /Chapter 2 .*ms more silence/
  );
});

// @req REQ-186
test("the opening lasts until the intro speech ends; chapter 1 needs its silence after it", () => {
  const voice = voiceFiles();
  const seq = voiced(voice);
  const timeline = chapterTimeline(seq);
  assert.equal(timeline.intro.length, 1);
  assert.ok(timeline.chapters[0].start >= 6.4 - 1e-9);
  assert.ok(timeline.chapters[0].start >= timeline.intro[0].gone - 1e-9);
  // The intro is spoken over the opening, in the subtitle band, with its box.
  const word = voice.timed[0].words[2];
  const state = frameState(seq, Math.ceil(word.start * 30));
  assert.equal(state.chapter, 0);
  assert.equal(state.subtitle.highlight, 2);
  // An intro that runs into chapter 1's first words is refused.
  const late = SPOKEN.map((c, k) => (k === 0 ? { ...c, at: 5.5 } : c));
  assert.throws(() => voiced(voiceFiles(late)), /Chapter 1 .*ms more silence/);
});

// @req REQ-186
test("the outro is spoken over the ending block, which holds until the audio ends plus 0.5 s", () => {
  const voice = voiceFiles(SPOKEN, { tail: 1.2 });
  const seq = voiced(voice);
  const timeline = chapterTimeline(seq);
  assert.equal(timeline.outro.length, 2);
  assert.ok(timeline.outro[0].appear >= timeline.ending.closingIn + 0.5 - 1e-9);
  assert.equal(frameCount(seq), Math.ceil((voice.duration + 0.5) * 30 - 1e-9));
  const word = voice.timed.at(-1).words[3];
  const state = frameState(seq, Math.ceil(word.start * 30));
  assert.equal(state.closing.variant, "A");
  assert.equal(state.subtitle.highlight, 3);
  // An outro that starts before the closing block is in is refused.
  const early = SPOKEN.map((c) =>
    c.text === "Retrouvez tout l'atlas" ? { ...c, pause: 0.3 } : c
  );
  assert.throws(() => voiced(voiceFiles(early)), /outro .*ms more silence/i);
});

// @req REQ-186
test("a short ending still holds 2.5 s after the closing block", () => {
  const seq = voiced(voiceFiles(SPOKEN, { tail: 0 }));
  const { ending } = chapterTimeline(seq);
  assert.ok(frameCount(seq) >= Math.round((ending.closingIn + 3) * 30));
});

// @req REQ-186
test("nothing but what the chunk names moves during a chapter's voiced subtitle", () => {
  const seq = voiced();
  const timeline = chapterTimeline(seq);
  const from = toFrame(timeline.chapters[0].start) + 1;
  const to = toFrame(timeline.ending.start);
  for (let f = from; f < to; f++) {
    const [before, now] = [frameState(seq, f - 1), frameState(seq, f)];
    if (!(before.subtitle?.opacity > 0 && now.subtitle?.opacity > 0)) continue;
    for (const key of ["camera", "grade", "marker", "caption", "text"])
      assert.deepEqual(now[key], before[key], `${key} moved at frame ${f}`);
  }
});

// @req REQ-186
test("word times must match the voice: units, order, audio length, audio file", () => {
  const voice = voiceFiles();
  assert.doesNotThrow(() => voiced(voice));
  const refused = (edit, pattern) =>
    assert.throws(() => voiced(voiceFiles(SPOKEN, { edit })), pattern);
  refused((w) => w.chunks[1].words.pop(), /4 units; the voice gives 3/);
  refused((w) => (w.chunks[1].words[0].text = "Sahra"), /Sahara/);
  refused((w) => {
    const [a, b] = w.chunks[1].words;
    [a.start, b.start] = [b.start, a.start];
  }, /order/);
  refused(
    (w) => (w.chunks.at(-1).words.at(-1).end = w.audio.duration + 1),
    /audio/
  );
  refused((w) => w.chunks.pop(), /chunks/);
  refused(
    (w) => (w.chunks[3].text = "Le lien avec la mer"),
    /Le lien avec la couleur/
  );
  refused((w) => (w.audio.sha256 = "0".repeat(64)), /sha256|SHA-256/i);
  // A spoken form replaces the literal match for its unit only: the unit
  // keeps its place and count.
  assert.doesNotThrow(() =>
    voiced(
      voiceFiles(SPOKEN, {
        edit: (w) => {
          w.chunks[2].words[0].text = "sahrâ,";
          w.chunks[2].words[0].spoken = "sahrâ,";
        },
      })
    )
  );
});

// @req REQ-186
test("a voice never reads faster than 17 characters a second", () => {
  // « Le lien avec la couleur » (23 characters) would stay 0.9 s.
  const voice = voiceFiles(SPOKEN, {
    edit: (w) => {
      const s0 = w.chunks[3].words[0].start;
      const squeeze = (words, from) =>
        words.forEach((word, i) => {
          word.start = round(from + i * 0.15);
          word.end = round(word.start + 0.12);
        });
      squeeze(w.chunks[3].words, s0);
      squeeze(w.chunks[4].words, s0 + 0.9);
    },
  });
  assert.throws(() => voiced(voice), /17 characters a second/);
});

// @req REQ-186
test("intro and outro are spoken: a silent sequence cannot carry them", () => {
  const input = voicedInput(voiceFiles(), (s) => delete s.voice);
  assert.throws(() => loadSequence(input, { dir: fixtures }), /voice/i);
});

// @req REQ-186
test("ending A may invite to the whole site, still only with pageOnline", () => {
  const seq = voiced();
  const last = frameState(seq, frameCount(seq) - 1).closing;
  assert.equal(last.address, "ETHNIAFRICA.COM");
  assert.equal(last.sentence, "Tout l'atlas des noms est en ligne.");
  assert.equal(last.page, "home");
  const silent = (ending) => {
    const input = structuredClone(saharaJson);
    input.ending = ending;
    return () => loadSequence(input, { dir: fixtures });
  };
  assert.doesNotThrow(
    silent({
      variant: "A",
      pageOnline: true,
      page: "home",
      sentence: "Tout l'atlas est en ligne.",
    })
  );
  assert.throws(
    silent({
      variant: "A",
      page: "home",
      sentence: "Tout l'atlas est en ligne.",
    }),
    /pageOnline|page online/
  );
  assert.throws(
    silent({
      variant: "A",
      pageOnline: true,
      page: "somewhere",
      sentence: "x",
    }),
    /page/
  );
  assert.throws(silent({ variant: "B", page: "home" }), /Ending B/);
});

// @req REQ-186
test("a silent sequence keeps no highlight and refuses a malformed voice", () => {
  const input = structuredClone(saharaJson);
  input.voice = "voice.json";
  assert.throws(() => loadSequence(input, { dir: fixtures }), /voice/i);
  input.voice = {
    audio: join(work, "missing.wav"),
    words: join(work, "missing.json"),
  };
  assert.throws(() => loadSequence(input, { dir: fixtures }), /voice/i);
});
