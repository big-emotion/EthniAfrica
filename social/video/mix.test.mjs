// @req REQ-186
// The sound mix of Cartes 1.13.0 (series.md « 13. Sound cues », handoff.md
// « Renderer integration of 1.13.0 », step 13 and check 13). Every sound is
// synthesized here by FFmpeg's own generators at known levels: no sound
// library is downloaded, and none of the operator's files is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
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
import {
  CUE_FAMILIES,
  MIX,
  soundLibrary,
  speechSpans,
  assignCueFiles,
  mixSound,
  mixAvailable,
  readWav,
  loudnessLog,
  bedFor,
} from "./mix.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-mix-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

const peakOf = (data) => {
  let p = 0;
  for (const x of data) p = Math.max(p, Math.abs(x));
  return p;
};
const lavfi = (source, file, codec = "pcm_s16le", channels = 1) =>
  execFileSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", source]
      .concat(["-ac", String(channels), "-ar", "48000", "-c:a", codec])
      .concat(["-y", file])
  );

// A « voice » of 14 s: three phrases of pink noise (fixed seed) at a known
// level, with a 1.2 s pause and a 2 s pause between them.
const PHRASES = [
  [0.5, 4],
  [5.2, 8.7],
  [10.7, 13.5],
];
const SECONDS = 14;
const speaking = PHRASES.map(([a, b]) => `between(t,${a},${b})`).join("+");
const voice = join(dir, "voice.wav");
lavfi(
  `anoisesrc=d=${SECONDS}:c=pink:seed=7:a=0.35,volume=0:enable='not(${speaking})'`,
  voice
);
// Words of 0.4 s, 0.05 s apart, filling each phrase to its end.
const words = PHRASES.flatMap(([a, b]) => {
  const out = [];
  for (let t = a; t + 0.4 <= b + 1e-9; t += 0.45)
    out.push({ start: +t.toFixed(3), end: +(t + 0.4).toFixed(3) });
  if (out.at(-1).end < b) out.push({ start: +(b - 0.4).toFixed(3), end: b });
  return out;
});

// A sustained pad, looped by the mix.
const bed = join(dir, "bed.wav");
lavfi(
  "aevalsrc='0.2*sin(2*PI*220*t)+0.12*sin(2*PI*330*t)+0.06*sin(2*PI*440*t)':d=4:s=48000",
  bed,
  "pcm_s16le",
  2
);

// A cue palette in three sample formats, so the WAV reader reads each.
const lib = join(dir, "sound");
const cueFile = (family, name, source, codec) => {
  mkdirSync(join(lib, "cues", family), { recursive: true });
  const file = join(lib, "cues", family, name);
  lavfi(source, file, codec);
  return file;
};
cueFile(
  "pop",
  "pop-a.wav",
  "aevalsrc='0.5*sin(2*PI*800*t)':d=0.09:s=48000",
  "pcm_s16le"
);
cueFile(
  "pop",
  "pop-b.wav",
  "aevalsrc='0.4*sin(2*PI*900*t)':d=0.09:s=48000",
  "pcm_s24le"
);
cueFile(
  "impact",
  "impact.wav",
  "aevalsrc='0.7*sin(2*PI*60*t)':d=0.45:s=48000",
  "pcm_f32le"
);
cueFile(
  "draw",
  "draw.wav",
  "aevalsrc='0.3*sin(2*PI*3000*t)':d=1.5:s=48000",
  "pcm_s32le"
);
// A whoosh whose loudest sample sits 0.3 s into the file.
cueFile(
  "whoosh",
  "whoosh.wav",
  "aevalsrc='sin(2*PI*600*t)*exp(-pow((t-0.3)/0.06,2))':d=0.5:s=48000",
  "pcm_s16le"
);

// @req REQ-186
test("speechSpans merges the voice's words across gaps under 0.8 s", () => {
  const spans = speechSpans([
    { start: 0.2, end: 0.6 },
    { start: 0.9, end: 1.3 },
    { start: 2.2, end: 2.5 },
    { start: 3.25, end: 3.5 },
  ]);
  assert.deepEqual(spans, [
    [0.2, 1.3],
    [2.2, 3.5],
  ]);
  assert.equal(MIX.pauseMin, 0.8);
  assert.deepEqual(speechSpans(words), PHRASES);
});

// @req REQ-186
test("the WAV reader reads 16, 24 and 32-bit integers and 32-bit floats", () => {
  const files = soundLibrary(lib).cues;
  const peaks = [
    readWav(files.pop[0]),
    readWav(files.pop[1]),
    readWav(files.impact[0]),
    readWav(files.draw[0]),
  ].map((w) => peakOf(w.data));
  for (const [peak, want] of peaks.map((p, i) => [p, [0.5, 0.4, 0.7, 0.3][i]]))
    assert.ok(Math.abs(peak - want) < 0.01, `peak ${peak}, want ${want}`);
});

// @req REQ-186
test("the library lists cue files by family, sorted; cues rotate through them; a family without files is reported", () => {
  const library = soundLibrary(lib);
  assert.deepEqual(Object.keys(library.cues), CUE_FAMILIES);
  assert.deepEqual(
    library.cues.pop.map((f) => f.split("/").at(-1)),
    ["pop-a.wav", "pop-b.wav"]
  );
  const { placed, missing } = assignCueFiles(
    [
      { family: "pop", frame: 10, level: -20 },
      { family: "pop", frame: 40, level: -20 },
      { family: "tick", frame: 50, level: -26 },
      { family: "pop", frame: 70, level: -20 },
    ],
    library
  );
  assert.deepEqual(
    placed.map((c) => c.file.split("/").at(-1)),
    ["pop-a.wav", "pop-b.wav", "pop-a.wav"]
  );
  assert.deepEqual(missing, [{ family: "tick", frame: 50 }]);
});

// @req REQ-186
test("without cue or bed files the engine keeps the voice alone", () => {
  for (const root of [join(dir, "nowhere"), join(dir, "empty")]) {
    mkdirSync(join(dir, "empty"), { recursive: true });
    const library = soundLibrary(root);
    assert.ok(CUE_FAMILIES.every((f) => library.cues[f].length === 0));
    assert.deepEqual(library.beds, {});
    assert.equal(mixAvailable(library, "serie-pays"), false);
  }
  const library = soundLibrary(lib);
  assert.equal(mixAvailable(library, "serie-pays"), true);
  assert.equal(
    mixAvailable({ cues: { pop: [] }, beds: { a: bed } }, "a"),
    true
  );
});

const FRAME = 1 / 30;
const CUES = [
  { family: "pop", frame: 30, level: -20 },
  { family: "impact", frame: 140, level: -17 },
  { family: "draw", frame: 200, level: -22, length: 15 },
  { family: "whoosh", frame: 300, level: -16, align: "peak" },
  { family: "pop", frame: 400, level: -20 },
];

// @req REQ-186
test("each cue lands on its frame; a whoosh peaks on its frame; a draw lasts its length", async () => {
  const { placed } = assignCueFiles(CUES, soundLibrary(lib));
  const out = join(dir, "cues.wav");
  await mixSound({
    voice,
    words,
    cues: placed,
    bed: null,
    seconds: SECONDS,
    out,
    solo: "cues",
  });
  const w = readWav(out);
  const level = (i) => Math.abs(w.data[i * w.channels]);
  const n = w.data.length / w.channels;
  const onset = (from) => {
    for (let i = Math.round(from * w.rate); i < n; i++)
      if (level(i) > 1e-3) return i / w.rate;
    return null;
  };
  for (const c of placed.filter((c) => c.family !== "whoosh")) {
    const at = onset(c.frame * FRAME - 0.2);
    assert.ok(
      Math.abs(at - c.frame * FRAME) <= FRAME,
      `${c.family} starts at ${at} s, its frame is ${c.frame * FRAME} s`
    );
  }
  const draw = placed.find((c) => c.family === "draw");
  let last = 0;
  for (let i = Math.round(draw.frame * FRAME * w.rate); i < n; i++)
    if (level(i) > 1e-3) last = i / w.rate;
    else if (i / w.rate > draw.frame * FRAME + 1) break;
  assert.ok(
    Math.abs(last - (draw.frame + draw.length) * FRAME) <= FRAME,
    `the draw ends at ${last} s, not after its 15 frames`
  );
  const whoosh = placed.find((c) => c.family === "whoosh");
  let peak = 0;
  let at = 0;
  for (
    let i = Math.round((whoosh.frame * FRAME - 0.5) * w.rate);
    i < Math.round((whoosh.frame * FRAME + 0.5) * w.rate);
    i++
  )
    if (level(i) > peak) [peak, at] = [level(i), i / w.rate];
  assert.ok(
    Math.abs(at - whoosh.frame * FRAME) <= FRAME,
    `the whoosh peaks at ${at} s, its frame is ${whoosh.frame * FRAME} s`
  );
});

// The recap card enters on a reversed whoosh (series.md « 13 »): played
// backwards, its loudest sample still lands on its frame.
// @req REQ-186
test("a reversed whoosh plays backwards and still peaks on its frame", async () => {
  const cue = {
    family: "whoosh",
    frame: 150,
    level: -16,
    align: "peak",
    reverse: true,
  };
  const { placed } = assignCueFiles([cue], soundLibrary(lib));
  const out = join(dir, "reversed.wav");
  await mixSound({
    voice,
    words,
    cues: placed,
    bed: null,
    seconds: SECONDS,
    out,
    solo: "cues",
  });
  const w = readWav(out);
  let peak = 0;
  let at = 0;
  for (let i = 0; i < w.data.length / w.channels; i++) {
    const v = Math.abs(w.data[i * w.channels]);
    if (v > peak) [peak, at] = [v, i / w.rate];
  }
  assert.ok(Math.abs(at - cue.frame * FRAME) <= FRAME, `peaks at ${at} s`);
});

// @req REQ-186
test("each cue's peak sits its level under the voice's peak", async () => {
  const { placed } = assignCueFiles(CUES, soundLibrary(lib));
  const out = join(dir, "levels.wav");
  await mixSound({
    voice,
    words,
    cues: placed,
    bed: null,
    seconds: SECONDS,
    out,
    solo: "cues",
  });
  const w = readWav(out);
  const v = readWav(voice);
  const db = (x) => 20 * Math.log10(x);
  const voicePeak = db(peakOf(v.data));
  for (const c of placed) {
    const a = Math.round((c.frame * FRAME - 0.4) * w.rate);
    let peak = 0;
    for (let i = a; i < a + 0.9 * w.rate; i++)
      peak = Math.max(peak, Math.abs(w.data[i * w.channels]));
    assert.ok(
      Math.abs(db(peak) - (voicePeak + c.level)) < 0.5,
      `${c.family}: ${db(peak).toFixed(1)} dBFS, want ${(voicePeak + c.level).toFixed(1)}`
    );
  }
});

// Short-term loudness (EBU R128, 3 s) of the voice and of the bed, each
// rendered alone through the very gains and ducking of the full mix before
// its normalisation. loudnorm applies one gain to the whole mix, so the
// distance between the two stems is the distance in the final mix; read on
// the summed mix it could not be told apart.
// @req REQ-186
test("the bed sits 17 dB under the voice while it speaks, and rises 4 dB in a pause", async (ctx) => {
  const stem = async (solo) => {
    const out = join(dir, `stem-${solo}.wav`);
    await mixSound({
      voice,
      words,
      cues: [],
      bed,
      seconds: SECONDS,
      out,
      solo,
    });
    return loudnessLog(out).frames;
  };
  const [v, b] = [await stem("voice"), await stem("bed")];
  const at = (frames, t, key) =>
    frames.reduce((best, f) =>
      Math.abs(f.t - t) < Math.abs(best.t - t) ? f : best
    )[key];
  // Windows inside the first two phrases, and the end of the 2 s pause.
  for (const t of [3.9, 8.6]) {
    const under = at(v, t, "S") - at(b, t, "S");
    ctx.diagnostic(`bed under the voice at ${t} s: ${under.toFixed(2)} dB`);
    assert.ok(
      Math.abs(under - MIX.bedUnder) <= 1,
      `at ${t} s the bed is ${under.toFixed(2)} dB under the voice`
    );
  }
  const rise = at(b, 10.6, "M") - at(b, 8.6, "M");
  ctx.diagnostic(`bed rise in the pause: ${rise.toFixed(2)} dB`);
  assert.ok(
    Math.abs(rise - MIX.bedPauseRise) <= 1,
    `the bed rises ${rise.toFixed(2)} dB in the pause`
  );
});

// @req REQ-186
test("the mix is -16 LUFS integrated within 0.5 and its true peak is at most -1 dBTP", async (ctx) => {
  const { placed } = assignCueFiles(CUES, soundLibrary(lib));
  const out = join(dir, "mix.wav");
  const result = await mixSound({
    voice,
    words,
    cues: placed,
    bed,
    seconds: SECONDS,
    out,
  });
  const measured = loudnessLog(out);
  assert.ok(
    Math.abs(measured.integrated - MIX.integrated) <= 0.5,
    `${measured.integrated} LUFS`
  );
  assert.ok(measured.truePeak <= MIX.truePeak, `${measured.truePeak} dBTP`);
  assert.equal(result.integrated, measured.integrated);
  assert.equal(result.truePeak, measured.truePeak);
  assert.equal(result.cues, placed.length);
  assert.equal(result.bed, true);
  ctx.diagnostic(
    `mix: ${result.integrated} LUFS, true peak ${result.truePeak} dBTP, LRA ${result.lra} LU`
  );
  const w = readWav(out);
  assert.equal(w.rate, 48000);
  assert.equal(w.channels, 2);
  assert.ok(Math.abs(w.data.length / 2 / 48000 - SECONDS) < 0.01);
  writeFileSync(join(dir, "result.json"), JSON.stringify(result));
});

// A bed library (operator, 21 October 2026): one default bed per series named
// in beds/series.json, and an episode's own bed chosen by name from
// beds/library/. A bed at beds/<series>.wav still serves its series.
const lib2 = join(dir, "sound-library");
mkdirSync(join(lib2, "beds", "library"), { recursive: true });
for (const name of ["mandingue", "rumba-congolaise"])
  writeFileSync(
    join(lib2, "beds", "library", `${name}.wav`),
    readFileSync(bed)
  );
writeFileSync(join(lib2, "beds", "villes.wav"), readFileSync(bed));
writeFileSync(
  join(lib2, "beds", "series.json"),
  JSON.stringify({ pays: "mandingue", "nom-recu": "rumba-congolaise" })
);

// @req REQ-186
test("a series takes its default bed from beds/series.json", () => {
  const library = soundLibrary(lib2);
  assert.equal(
    bedFor(library, "pays"),
    join(lib2, "beds", "library", "mandingue.wav")
  );
  assert.equal(mixAvailable(library, "pays"), true);
});

// @req REQ-186
test("an episode's own bed replaces its series' default", () => {
  assert.equal(
    bedFor(soundLibrary(lib2), "pays", "rumba-congolaise"),
    join(lib2, "beds", "library", "rumba-congolaise.wav")
  );
});

// @req REQ-186
test("an episode bed missing from the library is refused, by name", () => {
  assert.throws(() => bedFor(soundLibrary(lib2), "pays", "kora"), /« kora »/u);
});

// @req REQ-186
test("a series without a default keeps beds/<series>.wav, or no bed", () => {
  const library = soundLibrary(lib2);
  assert.equal(bedFor(library, "villes"), join(lib2, "beds", "villes.wav"));
  assert.equal(bedFor(library, "mots"), null);
});

// @req REQ-186
test("a default naming a bed the library lacks is refused", () => {
  const broken = join(dir, "sound-broken");
  mkdirSync(join(broken, "beds", "library"), { recursive: true });
  writeFileSync(
    join(broken, "beds", "series.json"),
    JSON.stringify({ pays: "absent" })
  );
  assert.throws(() => bedFor(soundLibrary(broken), "pays"), /« absent »/u);
});
