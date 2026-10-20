// @req REQ-186
// The parallel final render joins its slices with FFmpeg's concat demuxer,
// which reads each entry of the list relative to the list's own folder, not
// to the working directory. A render given a relative --out folder failed
// at the join after every slice was drawn, and lost them (19 October 2026).
// Two tiny slices made by FFmpeg stand in for the browsers: no browser is
// needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { joinSlices } from "./series-render.mjs";

const FRAMES = 10;
const root = mkdtempSync(join(tmpdir(), "series-join-"));
const cwd = process.cwd();
// @req REQ-186
test.after(() => {
  process.chdir(cwd);
  rmSync(root, { recursive: true, force: true });
});

const ffmpeg = (...args) =>
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args, "-y"]);
const slice = (file) =>
  ffmpeg(
    "-f",
    "lavfi",
    "-i",
    `testsrc=size=64x64:rate=30:duration=${FRAMES / 30}`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    file
  );
const frames = (file) =>
  Number(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-count_frames",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=nb_read_frames",
      "-of",
      "csv=p=0",
      file,
    ])
      .toString()
      .trim()
  );

// @req REQ-186
test("slices in a folder given relative to the working directory are joined", async () => {
  // The folders as the operator types them, relative to where the render
  // runs; the list then sits in a folder below the working directory.
  process.chdir(root);
  const out = join("renders", "render-v2");
  mkdirSync(out, { recursive: true });
  ffmpeg("-f", "lavfi", "-i", "anullsrc", "-t", "0.1", "voice.wav");
  const voice = { audio: "voice.wav" };
  const file = join(out, "video.mp4");
  const parts = [0, 1].map((k) => `${file}.part-${k}.mp4`);
  parts.forEach(slice);
  await joinSlices(parts, `${file}.parts.txt`, file, voice, 2 * FRAMES);
  assert.equal(frames(file), 2 * FRAMES);
});
