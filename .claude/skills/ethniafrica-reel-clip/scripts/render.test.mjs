// @req REQ-186
// Renders a reel end to end from a synthetic source (FFmpeg test pattern and
// tone), so the check needs FFmpeg and the pinned Chromium but no third-party
// footage.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderClip } from "./render.mjs";

// The engine reads the source size before drawing, so even a refusal test
// needs a real (tiny) video.
const wideSource = (dir) => {
  const file = join(dir, "wide.mp4");
  spawnSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=gray:size=320x180:rate=30:duration=10",
    "-f",
    "lavfi",
    "-i",
    "sine=duration=10",
    "-shortest",
    file,
  ]);
  return file;
};

const probe = (file) =>
  JSON.parse(
    spawnSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_type,width,height",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" }
    ).stdout
  );

const pixel = (file, t, x, y) => [
  ...spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-ss",
      String(t),
      "-i",
      file,
      "-frames:v",
      "1",
      "-vf",
      // A 1×1 crop is impossible in 4:2:0 chroma, so convert first.
      `format=rgb24,crop=1:1:${x}:${y}`,
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-",
    ],
    { encoding: "buffer" }
  ).stdout,
];

// @req REQ-186
test("renders a framed, captioned vertical reel with its SRT and cover", async () => {
  const dir = mkdtempSync(join(tmpdir(), "translated-clip-"));
  try {
    const source = join(dir, "source.mp4");
    spawnSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=1280x720:rate=30:duration=8",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=8",
      "-shortest",
      source,
    ]);
    const planFile = join(dir, "plan.json");
    writeFileSync(
      planFile,
      JSON.stringify({
        source,
        clips: [
          [1, 3],
          [5, 7],
        ],
        credit_line:
          "Une invitée, entretien filmé · source : une chaîne (YouTube)",
        phrases: [
          { start: 1.2, end: 2.8, fr: "Une première phrase," },
          { start: 5.1, end: 6.9, fr: "puis la suite après la coupe." },
        ],
        boxes: [{ start: 1, end: 2.5, text: "SELON ELLE, UN ENCADRÉ" }],
        thumbnail: {
          frame_at: 2,
          title_lines: ["UN TITRE", "DE COUVERTURE"],
          accent: "COUVERTURE",
        },
      })
    );
    const out = join(dir, "out");
    await renderClip(planFile, out);

    const reel = probe(join(out, "reel.mp4"));
    const video = reel.streams.find((s) => s.codec_type === "video");
    assert.deepEqual([video.width, video.height], [1080, 1920]);
    assert.ok(reel.streams.some((s) => s.codec_type === "audio"));
    assert.ok(Math.abs(Number(reel.format.duration) - 4) < 0.15);
    assert.match(
      readFileSync(join(out, "sous-titres-fr.srt"), "utf8"),
      /00:00:02,100 --> 00:00:03,900\npuis la suite après la coupe\./
    );
    assert.ok(existsSync(join(out, "cover.png")));
    // The box's white plate sits just above the source band, then leaves.
    const during = pixel(join(out, "reel.mp4"), 0.7, 540, 285);
    const after = pixel(join(out, "reel.mp4"), 3, 540, 285);
    assert.equal(during.length, 3);
    assert.equal(after.length, 3);
    assert.ok(during.every((c) => c > 235));
    assert.ok(after.some((c) => c < 200));
    assert.ok(
      !existsSync(join(out, "_layers")),
      "intermediate layers are removed"
    );
    const reelFile = join(out, "reel.mp4");
    assert.ok(
      loudness(reelFile, 3.5, 0.3) > -40,
      "source audio reaches the end"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Mean volume in dB of `seconds` of audio from `t`.
function loudness(file, t, seconds) {
  const out = spawnSync(
    "ffmpeg",
    [
      "-ss",
      String(t),
      "-t",
      String(seconds),
      "-i",
      file,
      "-af",
      "volumedetect",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" }
  ).stderr;
  const m = out.match(/mean_volume: (-?[\d.]+|-inf) dB/);
  return !m || m[1] === "-inf" ? -Infinity : Number(m[1]);
}

// @req REQ-186
test("a tall source gets the portrait gabarit and its on-screen text replaced", async () => {
  const dir = mkdtempSync(join(tmpdir(), "reel-clip-"));
  try {
    const source = join(dir, "tall.mp4");
    spawnSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=red:size=720x1280:rate=30:duration=6",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=6",
      "-shortest",
      source,
    ]);
    const planFile = join(dir, "plan.json");
    writeFileSync(
      planFile,
      JSON.stringify({
        source,
        language: "fr",
        clips: [[0, 5]],
        credit_line:
          "Vidéo originale : @autrice · traduite avec son autorisation",
        phrases: [{ start: 3, end: 4.5, text: "Une phrase dite." }],
        overlays: [{ start: 0.5, end: 2, text: "« sauvage »", x: 0.5, y: 0.3 }],
      })
    );
    const out = join(dir, "out");
    await renderClip(planFile, out);
    const reel = join(out, "reel.mp4");

    const inside = pixel(reel, 2.5, 540, 200);
    const margin = pixel(reel, 2.5, 40, 960);
    assert.ok(
      inside[0] > 230 && inside[1] < 40,
      "source drawn near full height"
    );
    assert.ok(
      margin[0] < 225,
      "margin shows the darkened blur, not the source"
    );
    // The overlay sits at 30 % of the source height: 96 + 0.3 × 1578.
    const during = pixel(reel, 1, 540, 569);
    const after = pixel(reel, 2.5, 540, 569);
    assert.ok(
      !(during[0] > 230 && during[1] < 40),
      "overlay covers the source"
    );
    assert.ok(after[0] > 230 && after[1] < 40, "overlay leaves on time");
    assert.ok(existsSync(join(out, "sous-titres-fr.srt")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// @req REQ-186
test("boxes are refused on a tall source, which has no room above the picture", async () => {
  const dir = mkdtempSync(join(tmpdir(), "reel-clip-"));
  try {
    const source = join(dir, "tall.mp4");
    spawnSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=red:size=720x1280:rate=30:duration=2",
      "-f",
      "lavfi",
      "-i",
      "sine=duration=2",
      "-shortest",
      source,
    ]);
    const planFile = join(dir, "plan.json");
    writeFileSync(
      planFile,
      JSON.stringify({
        source,
        clips: [[0, 2]],
        credit_line: "Crédit",
        phrases: [{ start: 0, end: 1.5, text: "Une." }],
        boxes: [{ start: 0, end: 1, text: "POUR ELLE" }],
      })
    );
    await assert.rejects(
      renderClip(planFile, join(dir, "out")),
      /boxes need a wide source/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// @req REQ-186
test("refuses a box that would wrap past two lines", async () => {
  const dir = mkdtempSync(join(tmpdir(), "translated-clip-"));
  try {
    const planFile = join(dir, "plan.json");
    writeFileSync(
      planFile,
      JSON.stringify({
        source: wideSource(dir),
        clips: [[0, 10]],
        credit_line: "Crédit",
        phrases: [{ start: 0, end: 9, fr: "Une phrase." }],
        boxes: [
          {
            start: 0,
            end: 9,
            text: "SELON ELLE, LE DIEU DES MISSIONNAIRES SERVAIT À OPPRIMER",
          },
        ],
      })
    );
    await assert.rejects(
      renderClip(planFile, join(dir, "out")),
      /Boxes over two lines/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// @req REQ-186
test("refuses a caption that would wrap past two lines", async () => {
  const dir = mkdtempSync(join(tmpdir(), "translated-clip-"));
  try {
    const planFile = join(dir, "plan.json");
    writeFileSync(
      planFile,
      JSON.stringify({
        source: wideSource(dir),
        clips: [[0, 10]],
        credit_line: "Crédit",
        phrases: [
          {
            start: 0,
            end: 9,
            fr: "MMMMM MMMMM MMMMM MMMMM MMMMM MMMMM MMMMM MMMMM MMMMM",
          },
        ],
      })
    );
    await assert.rejects(
      renderClip(planFile, join(dir, "out")),
      /over two lines/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
