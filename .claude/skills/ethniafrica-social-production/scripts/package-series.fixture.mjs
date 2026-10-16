// @req REQ-186
// Synthetic series video delivery: the long series demonstration (Cartes,
// chapters, signed card, « série » ending) without its demo marks, on a
// generated silent voice, encoded as a plain-colour 9:16 video by FFmpeg.
// Never a real piece, voice or approval. The manifest is written as
// encodeSeriesVideo writes it, so the package binds what the encoder binds.
import { after } from "node:test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSeriesVideo } from "../../../../social/video/series.mjs";
import { longDemo } from "../../../../social/video/fixtures/series-long.mjs";
import { installPackageFixture } from "./package.fixture.mjs";

const sha = (b) => createHash("sha256").update(b).digest("hex");
const { name, version } = JSON.parse(
  readFileSync(
    new URL("../../../../social/design-system/version.json", import.meta.url)
  )
);
const template = mkdtempSync(join(tmpdir(), "ethnia-series-package-base-"));
after(() => rmSync(template, { recursive: true, force: true }));
// A final deck shows found images only: the sample's « image à trouver »
// placeholders take the opener's photograph.
const input = longDemo(join(template, "input"), {
  deck: (d) => {
    for (const card of d.cards) {
      delete card.demo;
      if (/a-trouver-/.test(card.image?.src ?? ""))
        card.image.src = "Series/lac-lac.jpg";
    }
    return d;
  },
});
delete input.demo;
input.design = `${name} ${version}`;
writeFileSync(
  join(template, "input/series.sequence.json"),
  JSON.stringify(input)
);
const loaded = loadSeriesVideo(input, { dir: join(template, "input") });
const seconds = loaded.frames / 30;
mkdirSync(join(template, "final"));
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-f",
  "lavfi",
  "-i",
  "color=c=0x56606a:s=1080x1920:r=30",
  "-i",
  join(template, "input/voice.wav"),
  "-frames:v",
  String(loaded.frames),
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
  join(template, "final/video.mp4"),
]);
const DESIGN_ASSETS = fileURLToPath(
  new URL("../../../../social/design-system/assets", import.meta.url)
);
const IMAGES = [
  ...new Set(loaded.cards.map((c) => c.image?.src).filter(Boolean)),
];

export function seriesPackageFixture(t, networks = ["instagram", "facebook"]) {
  const root = mkdtempSync(join(tmpdir(), "ethnia-series-package-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const f = installPackageFixture(root, "piece", networks);
  const inputDir = "piece/series-input";
  const final = "piece/series-final";
  cpSync(join(template, "input"), join(root, inputDir), { recursive: true });
  cpSync(join(template, "final"), join(root, final), { recursive: true });
  const sequence = `${inputDir}/series.sequence.json`;
  const assets = "piece/assets";
  for (const src of IMAGES) {
    mkdirSync(dirname(join(root, assets, src)), { recursive: true });
    cpSync(join(DESIGN_ASSETS, src), join(root, assets, src));
  }
  // Each image the video shows has its research and rights record.
  const research = JSON.parse(readFileSync(join(root, f.config.research)));
  const rights = research.images[0].rightsEvidence;
  research.images = IMAGES.map((src) => ({
    file: `${assets}/${src}`,
    sourcePage: "https://example.org/test-image",
    creator: "Test fixture",
    description: "Synthetic image record",
    reuseBasis: "Generated test fixture",
    credit: "Image de test.",
    crop: "Full image",
    rightsEvidence: rights,
  }));
  f.file("research.json", research);
  const writeManifest = (change = () => {}) => {
    const raw = JSON.parse(readFileSync(join(root, sequence)));
    const seq = loadSeriesVideo(raw, { dir: join(root, inputDir) });
    const manifest = {
      schema: 1,
      design: seq.design,
      designVersion: version,
      layout: "full",
      width: 1080,
      height: 1920,
      fps: 30,
      frames: seq.frames,
      cards: seq.cards.map((c) => c.id),
      audio: { sha256: seq.voice.sha256, duration: seq.voice.duration },
      demo: false,
      productionReady: false,
      runtime: { note: "Synthetic test manifest" },
      hashes: {
        sequence: sha(JSON.stringify(seq)),
        cards: sha(readFileSync(seq.cardsFile)),
        video: sha(readFileSync(join(root, final, "video.mp4"))),
      },
    };
    change(manifest);
    writeFileSync(
      join(root, final, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n"
    );
  };
  writeManifest();
  const design = f.file("video-design.json", {
    name,
    version,
    status: "accepted",
  });
  const config = {
    schema: 1,
    kind: "video",
    sequence,
    video: final,
    design,
    assets,
    research: f.config.research,
    networks: f.config.networks.map((n) => ({
      network: n.network,
      caption: n.caption,
      firstComment: null,
      link: { placement: "none" },
      capability: {
        account: "Synthetic account",
        checkedAt: "2026-10-16",
        observation: "Test only: video upload, copy limits and accessibility",
        evidence: n.capability.evidence,
        format: "video",
        maxDurationSeconds: 600,
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
  const configPath = "piece/package-input.json";
  const save = () => f.file("package-input.json", config);
  save();
  return {
    ...f,
    config,
    configPath,
    save,
    sequence,
    cards: `${inputDir}/cards.json`,
    final,
    writeManifest,
  };
}
