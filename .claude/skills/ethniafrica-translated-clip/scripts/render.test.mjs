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
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("refuses a box that would wrap past two lines", async () => {
  const dir = mkdtempSync(join(tmpdir(), "translated-clip-"));
  try {
    const planFile = join(dir, "plan.json");
    writeFileSync(
      planFile,
      JSON.stringify({
        source: join(dir, "absent.mp4"),
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

test("refuses a caption that would wrap past two lines", async () => {
  const dir = mkdtempSync(join(tmpdir(), "translated-clip-"));
  try {
    const planFile = join(dir, "plan.json");
    writeFileSync(
      planFile,
      JSON.stringify({
        source: join(dir, "absent.mp4"),
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
