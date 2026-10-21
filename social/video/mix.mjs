// The sound of the series video (EthniAfrica Cartes 1.13.0, series.md
// « 13. Sound cues », handoff.md « Renderer integration of 1.13.0 », step
// 13): the voice, the cues on the frames of their motions at their levels
// under the voice's peak, the series' bed ducked under the voice, then one
// two-pass loudnorm to −16 LUFS integrated, −1 dBTP, LRA 8. The cues and the
// beds are the operator's files (decision 10: one cue palette for every
// series, one bed per series); without any, the engine keeps the voice alone.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CUE_FAMILIES = [
  "pop",
  "tick",
  "swell",
  "whoosh",
  "rise",
  "draw",
  "impact",
  "drum",
  "ding",
];
export const MIX = {
  integrated: -16,
  truePeak: -1,
  lra: 8,
  bedUnder: 17,
  bedPauseRise: 4,
  pauseMin: 0.8,
  attackMs: 150,
  releaseMs: 500,
  maxPerSecond: 2,
};
const FPS = 30;
const RATE = 48000;
const STEREO = `aformat=sample_fmts=fltp:sample_rates=${RATE}:channel_layouts=stereo`;
const fail = (message) => {
  throw new Error(message);
};

const wavs = (folder) =>
  existsSync(folder) && statSync(folder).isDirectory()
    ? readdirSync(folder)
        .filter((f) => /\.wav$/iu.test(f))
        .sort()
        .map((f) => join(folder, f))
    : [];

// `root/cues/<family>/*.wav` and `root/beds/<series>.wav`.
export function soundLibrary(root = new URL("../sound/", import.meta.url)) {
  const base = root instanceof URL ? fileURLToPath(root) : resolve(root);
  const cues = Object.fromEntries(
    CUE_FAMILIES.map((f) => [f, wavs(join(base, "cues", f))])
  );
  const beds = Object.fromEntries(
    wavs(join(base, "beds")).map((file) => [
      file
        .split("/")
        .at(-1)
        .replace(/\.wav$/iu, ""),
      file,
    ])
  );
  return { cues, beds };
}

export const mixAvailable = (library, series) =>
  Object.values(library.cues).some((files) => files.length > 0) ||
  !!library.beds[series];

// The voice speaks from a word's start to the last word's end; a gap shorter
// than `pauseMin` is not a pause (the bed would pump between words).
export function speechSpans(words, pauseMin = MIX.pauseMin) {
  const spans = [];
  for (const { start, end } of [...words].sort((a, b) => a.start - b.start)) {
    const last = spans.at(-1);
    if (last && start - last[1] < pauseMin) last[1] = Math.max(last[1], end);
    else spans.push([start, end]);
  }
  return spans;
}

// Each cue takes the next file of its family in turn, so a run of pops does
// not repeat one sample, and the same plan always picks the same files.
export function assignCueFiles(cues, library) {
  const used = {};
  const placed = [];
  const missing = [];
  for (const cue of cues) {
    const files = library.cues[cue.family] ?? [];
    if (!files.length) {
      missing.push({ family: cue.family, frame: cue.frame });
      continue;
    }
    const n = (used[cue.family] = (used[cue.family] ?? -1) + 1);
    placed.push({ ...cue, file: files[n % files.length] });
  }
  return { placed, missing };
}

// A RIFF WAV's samples as interleaved floats in [-1, 1]: PCM 16, 24 and 32
// bits, and 32-bit float, plain or extensible.
export function readWav(file) {
  const b = readFileSync(file);
  if (
    b.toString("ascii", 0, 4) !== "RIFF" ||
    b.toString("ascii", 8, 12) !== "WAVE"
  )
    fail(`${file} is not a WAV file`);
  let format = null;
  let data = null;
  for (let at = 12; at + 8 <= b.length;) {
    const id = b.toString("ascii", at, at + 4);
    const size = b.readUInt32LE(at + 4);
    if (id === "fmt ") {
      let tag = b.readUInt16LE(at + 8);
      if (tag === 0xfffe) tag = b.readUInt16LE(at + 32);
      format = {
        tag,
        channels: b.readUInt16LE(at + 10),
        rate: b.readUInt32LE(at + 12),
        bits: b.readUInt16LE(at + 22),
      };
    } else if (id === "data")
      data = b.subarray(at + 8, Math.min(b.length, at + 8 + size));
    at += 8 + size + (size % 2);
  }
  if (!format || !data) fail(`${file}: no fmt or data chunk`);
  const { tag, channels, rate, bits } = format;
  const step = bits / 8;
  const n = Math.floor(data.length / step);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * step;
    if (tag === 3 && bits === 32) out[i] = data.readFloatLE(o);
    else if (tag === 1 && bits === 16) out[i] = data.readInt16LE(o) / 32768;
    else if (tag === 1 && bits === 24) out[i] = data.readIntLE(o, 3) / 8388608;
    else if (tag === 1 && bits === 32)
      out[i] = data.readInt32LE(o) / 2147483648;
    else fail(`${file}: ${bits}-bit format ${tag} is not read`);
  }
  return { rate, channels, data: out };
}

const db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
// The loudest sample and when it plays, in seconds.
function peakOf(file) {
  const { rate, channels, data } = readWav(file);
  let peak = 0;
  let at = 0;
  for (let i = 0; i < data.length; i++)
    if (Math.abs(data[i]) > peak) [peak, at] = [Math.abs(data[i]), i];
  return {
    db: db(peak),
    seconds: Math.floor(at / channels) / rate,
    duration: data.length / channels / rate,
  };
}

function ffmpeg(args, level = "info") {
  const run = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-loglevel", level, ...args],
    {
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
    }
  );
  if (run.status !== 0) fail(`FFmpeg failed: ${run.stderr.slice(-2000)}`);
  return run.stderr;
}

// EBU R128 on a file (ebur128, true peak on): the integrated loudness, its
// range, the true peak and, every 100 ms, the momentary (M, 400 ms) and
// short-term (S, 3 s) loudness at the window's end `t`.
export function loudnessLog(file) {
  const log = ffmpeg(
    [
      "-i",
      file,
      "-af",
      "ebur128=peak=true:framelog=verbose",
      "-f",
      "null",
      "-",
    ],
    "verbose"
  );
  const frames = [
    ...log.matchAll(
      /t:\s*([\d.]+)\s+TARGET:.*?M:\s*(-?[\d.]+|-inf)\s+S:\s*(-?[\d.]+|-inf)/gu
    ),
  ].map((m) => ({
    t: +m[1],
    M: Number(m[2].replace("-inf", "-Infinity")),
    S: Number(m[3].replace("-inf", "-Infinity")),
  }));
  const summary = log.slice(log.lastIndexOf("Summary:"));
  const num = (re) =>
    Number((summary.match(re) ?? fail(`No ${re} in the ebur128 summary`))[1]);
  return {
    integrated: num(/I:\s*(-?[\d.]+) LUFS/u),
    lra: num(/LRA:\s*(-?[\d.]+) LU/u),
    truePeak: num(/Peak:\s*(-?[\d.]+|-inf) dBFS/u),
    frames,
  };
}

// The constant key that drives the bed's compressor: 0.5 (−6 dB) while the
// voice speaks, silence in its pauses. The compressor then sees the same
// level for every word, so the bed goes down by exactly bedPauseRise
// whatever the voice says, whereas keyed on the voice itself the reduction
// would follow each syllable and the bed would pump. A hard knee (1 dB) and
// ratio 20 give a reduction of (key − threshold) × (1 − 1 / 20) dB once the
// envelope has settled, so the threshold sits bedPauseRise ÷ 0.95 dB under
// the key.
const KEY = 0.5;
const RATIO = 20;
const PAUSE_UNDER = MIX.bedUnder - MIX.bedPauseRise;
// A mono file is duplicated on both sides at full level: FFmpeg's own
// rematrix would take 3 dB off it (the centre mix level), and a cue's level
// under the voice would be off by as much.
const stereo = (file) =>
  (readWav(file).channels === 1 ? "pan=stereo|c0=c0|c1=c0," : "") + STEREO;
// Loudness as the stereo mix hears it: BS.1770 counts a mono file once, its
// duplicated stereo twice, 3.01 dB louder.
const stereoLoudness = (file) =>
  loudnessLog(file).integrated +
  (readWav(file).channels === 1 ? 10 * Math.log10(2) : 0);
const THRESHOLD = KEY / 10 ** (MIX.bedPauseRise / (1 - 1 / RATIO) / 20);
const keyExpression = (spans) =>
  spans.length
    ? `${KEY}*(${spans.map(([a, b]) => `between(t,${a},${b})`).join("+")})`
    : "0";

// One filter graph for the voice, the cues and the bed, before loudnorm.
// `solo` keeps one stem with every gain of the full mix, for measuring.
function graph({ voice, words, cues, bed, seconds, solo }) {
  const inputs = ["-i", voice];
  const parts = [];
  const mixed = [];
  const keep = (stem) => !solo || solo === stem;
  const voiceLevel = stereoLoudness(voice);
  const voicePeak = peakOf(voice).db;
  parts.push(
    `[0:a]${stereo(voice)},apad=whole_dur=${seconds},atrim=0:${seconds}${keep("voice") ? "" : ",volume=0"}[v]`
  );
  mixed.push("[v]");
  cues.forEach((cue, k) => {
    const input = inputs.length / 2;
    inputs.push("-i", cue.file);
    const peak = peakOf(cue.file);
    const gain = voicePeak + cue.level - peak.db;
    // A reversed cue (the recap card's entry) plays its file backwards: its
    // loudest sample comes as far from its end as it was from its start.
    const peakAt = cue.reverse ? peak.duration - peak.seconds : peak.seconds;
    let delay = cue.frame / FPS - (cue.align === "peak" ? peakAt : 0);
    const chain = [stereo(cue.file), ...(cue.reverse ? ["areverse"] : [])];
    if (delay < 0) {
      chain.push(`atrim=start=${-delay}`, "asetpts=PTS-STARTPTS");
      delay = 0;
    }
    if (cue.length) {
      const length = cue.length / FPS;
      chain.push(
        `atrim=0:${length}`,
        `afade=t=out:st=${Math.max(0, length - 0.03)}:d=0.03`
      );
    }
    chain.push(
      `volume=${keep("cues") ? gain.toFixed(3) : -200}dB`,
      `adelay=${Math.round(delay * 1000)}:all=1`
    );
    parts.push(`[${input}:a]${chain.join(",")}[c${k}]`);
    mixed.push(`[c${k}]`);
  });
  if (bed) {
    const input = inputs.length / 2;
    inputs.push("-stream_loop", "-1", "-i", bed);
    // In a pause the bed sits bedUnder − bedPauseRise under the voice's
    // integrated loudness; the key takes the further bedPauseRise off it
    // while the voice speaks.
    const gain = voiceLevel - PAUSE_UNDER - stereoLoudness(bed);
    const spans = speechSpans(words);
    parts.push(
      `[${input}:a]${stereo(bed)},atrim=0:${seconds},asetpts=PTS-STARTPTS,volume=${keep("bed") ? gain.toFixed(3) : -200}dB[bed0]`,
      `aevalsrc='${keyExpression(spans)}|${keyExpression(spans)}':s=${RATE}:d=${seconds},${STEREO}[key]`,
      `[bed0][key]sidechaincompress=threshold=${THRESHOLD}:ratio=${RATIO}:knee=1:attack=${MIX.attackMs}:release=${MIX.releaseMs}:detection=peak:link=maximum[bed]`
    );
    mixed.push("[bed]");
  }
  parts.push(
    `${mixed.join("")}amix=inputs=${mixed.length}:normalize=0:duration=first,atrim=0:${seconds}[mix]`
  );
  return { inputs, graph: parts.join(";") };
}

const OUTPUT = [
  "-ar",
  String(RATE),
  "-ac",
  "2",
  "-c:a",
  "pcm_s24le",
  "-flags:a",
  "+bitexact",
  "-fflags",
  "+bitexact",
];

// `cues` are placed (assignCueFiles); `bed` is a file or null; `out` is
// written as 48 kHz stereo PCM. The measured result of the final file is
// what the manifest records.
export async function mixSound({
  voice,
  words,
  cues,
  bed,
  seconds,
  out,
  solo,
}) {
  const { inputs, graph: filters } = graph({
    voice,
    words,
    cues,
    bed,
    seconds,
    solo,
  });
  if (solo) {
    ffmpeg([
      ...inputs,
      "-filter_complex",
      filters,
      "-map",
      "[mix]",
      ...OUTPUT,
      "-y",
      out,
    ]);
    return { file: out };
  }
  const target = `I=${MIX.integrated}:TP=${MIX.truePeak}:LRA=${MIX.lra}`;
  const first = ffmpeg([
    ...inputs,
    "-filter_complex",
    `${filters};[mix]loudnorm=${target}:print_format=json[out]`,
    "-map",
    "[out]",
    "-f",
    "null",
    "-",
  ]);
  const json = JSON.parse(
    first.slice(first.lastIndexOf("{"), first.lastIndexOf("}") + 1)
  );
  const measured = [
    `measured_I=${json.input_i}`,
    `measured_TP=${json.input_tp}`,
    `measured_LRA=${json.input_lra}`,
    `measured_thresh=${json.input_thresh}`,
    `offset=${json.target_offset}`,
  ].join(":");
  ffmpeg([
    ...inputs,
    "-filter_complex",
    `${filters};[mix]loudnorm=${target}:${measured}:linear=true,aresample=${RATE}[out]`,
    "-map",
    "[out]",
    ...OUTPUT,
    "-y",
    out,
  ]);
  const result = loudnessLog(out);
  return {
    file: out,
    integrated: result.integrated,
    truePeak: result.truePeak,
    lra: result.lra,
    cues: cues.length,
    bed: !!bed,
  };
}
