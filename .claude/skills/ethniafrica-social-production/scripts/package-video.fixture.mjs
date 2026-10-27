// @req REQ-186
// Synthetic video delivery: a plain-colour 9:16 video encoded by FFmpeg on a
// generated silent voice, never a real piece, voice or approval. The
// sequence is the voiced Sahara test variant without its demo marks, drawing
// the engine's sourced areas instead of the mockups.
import { after } from "node:test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  copyFileSync,
  cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  loadSequence,
  frameCount,
} from "../../../../social/video/sequence.mjs";
import {
  writeVoice,
  voicedInput,
  SPOKEN,
} from "../../../../social/video/fixtures/voiced.mjs";
import { installPackageFixture } from "./package.fixture.mjs";

const sha = (b) => createHash("sha256").update(b).digest("hex");
const DATA = resolve("social/video/data");
const AREAS = join(DATA, "areas");
const template = mkdtempSync(join(tmpdir(), "ethnia-video-package-base-"));
after(() => rmSync(template, { recursive: true, force: true }));
const voice = writeVoice(template);
const sequence = voicedInput(voice, (input) => {
  delete input.demo;
  input.voice = { audio: "voice.wav", words: "words.json" };
  for (const chapter of input.chapters)
    for (const feature of chapter.features ?? []) {
      feature.file = feature.file.replace("synthetic-areas/", "areas/");
      delete feature.illustrative;
    }
  input.chapters[1].caption.source = "al-Idrīsī, 1154";
});
const frames = frameCount(
  loadSequence(
    {
      ...structuredClone(sequence),
      voice: { audio: voice.audio, words: voice.words },
    },
    { dir: DATA }
  )
);
// A plain-colour 9:16 export of `frames` frames on `audio`, as encodeVideo
// would deliver it for a sequence of that length.
function encode(frames, audio, file) {
  const seconds = frames / 30;
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "color=c=0x56606a:s=1080x1920:r=30",
    "-i",
    audio,
    "-frames:v",
    String(frames),
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-af",
    `apad=whole_dur=${seconds}`,
    "-t",
    String(seconds),
    "-map_metadata",
    "-1",
    "-fflags",
    "+bitexact",
    "-y",
    file,
  ]);
}
encode(frames, voice.audio, join(template, "video.mp4"));

export function installVideoPackageFixture(
  root,
  piece = "piece",
  networks = ["instagram", "facebook"]
) {
  const f = installPackageFixture(root, piece, networks);
  const input = `${piece}/video-input`;
  const final = `${piece}/video-final`;
  mkdirSync(join(root, input, "areas"), { recursive: true });
  mkdirSync(join(root, final), { recursive: true });
  for (const area of ["desert", "berberes", "noirs"])
    copyFileSync(
      join(AREAS, `${area}.geojson`),
      join(root, input, "areas", `${area}.geojson`)
    );
  copyFileSync(voice.audio, join(root, input, "voice.wav"));
  copyFileSync(voice.words, join(root, input, "words.json"));
  copyFileSync(join(template, "video.mp4"), join(root, final, "video.mp4"));
  f.file("video-input/sequence.json", sequence);
  const design = f.file("video-design.json", {
    name: "EthniAfrica Vidéo carte",
    version: "0.4.0-proposition",
    status: "accepted",
  });
  // The manifest binds the sequence as encodeVideo does: the hash of the
  // loaded sequence, whose voice paths resolve inside this root.
  const manifestWriter =
    (inputDir, finalDir) =>
    (change = () => {}) => {
      const raw = JSON.parse(
        readFileSync(join(root, inputDir, "sequence.json"))
      );
      const seq = loadSequence(raw, { dir: join(root, inputDir) });
      const manifest = {
        schema: 1,
        design: seq.design,
        style: seq.style,
        width: 1080,
        height: 1920,
        fps: 30,
        frames: frameCount(seq),
        audio: { sha256: seq.voice.sha256, duration: seq.voice.duration },
        demo: false,
        productionReady: false,
        runtime: { note: "Synthetic test manifest" },
        hashes: {
          sequence: sha(JSON.stringify(seq)),
          video: sha(readFileSync(join(root, finalDir, "video.mp4"))),
        },
      };
      change(manifest);
      writeFileSync(
        join(root, finalDir, "manifest.json"),
        JSON.stringify(manifest, null, 2) + "\n"
      );
    };
  const writeManifest = manifestWriter(input, final);
  writeManifest();
  const config = {
    schema: 1,
    kind: "video",
    sequence: `${input}/sequence.json`,
    video: final,
    design,
    research: f.config.research,
    campaign: f.config.campaign,
    networks: f.config.networks.map((n) => ({
      network: n.network,
      caption: n.caption,
      firstComment: null,
      link: { placement: "none" },
      capability: {
        account: "Synthetic account",
        checkedAt: "2026-10-13",
        observation: "Test only: video upload, copy limits and accessibility",
        evidence: n.capability.evidence,
        format: "video",
        maxDurationSeconds: 90,
        aspect: "9:16",
        captionMax: 2000,
        commentMax: 2000,
        altRoute: "unavailable",
        autoCaptions: "available",
        altInstruction:
          "Les sous-titres sont dans l'image. Ne pas ajouter les sous-titres automatiques.",
        linkPlacements: ["none"],
      },
    })),
  };
  const configPath = `${piece}/package-input.json`;
  const save = () => f.file("package-input.json", config);
  save();
  // Gives `network` its own cut, a copy of the shared one in its own folders,
  // and moves the package to one video per network once every network has one.
  // With `tail`, the cut's voice ends that many seconds after its last word,
  // so the cut is longer than the shared one and is encoded again.
  const cutFor = (network, { tail } = {}) => {
    const cutInput = `${input}-${network}`;
    const cutFinal = `${final}-${network}`;
    cpSync(join(root, input), join(root, cutInput), { recursive: true });
    cpSync(join(root, final), join(root, cutFinal), { recursive: true });
    if (tail !== undefined) {
      const longer = writeVoice(template, SPOKEN, { tail });
      copyFileSync(longer.audio, join(root, cutInput, "voice.wav"));
      copyFileSync(longer.words, join(root, cutInput, "words.json"));
      const raw = JSON.parse(
        readFileSync(join(root, cutInput, "sequence.json"))
      );
      encode(
        frameCount(loadSequence(raw, { dir: join(root, cutInput) })),
        join(root, cutInput, "voice.wav"),
        join(root, cutFinal, "video.mp4")
      );
    }
    const adaptation = config.networks.find((n) => n.network === network);
    adaptation.sequence = `${cutInput}/sequence.json`;
    adaptation.video = cutFinal;
    if (config.networks.every((n) => n.video)) {
      delete config.sequence;
      delete config.video;
    }
    save();
    const writeCutManifest = manifestWriter(cutInput, cutFinal);
    writeCutManifest();
    return {
      sequence: adaptation.sequence,
      final: cutFinal,
      writeManifest: writeCutManifest,
    };
  };
  return {
    ...f,
    config,
    configPath,
    save,
    sequence: `${input}/sequence.json`,
    final,
    writeManifest,
    cutFor,
  };
}

export function videoPackageFixture(t, networks) {
  const root = mkdtempSync(join(tmpdir(), "ethnia-video-package-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return installVideoPackageFixture(root, "piece", networks);
}
