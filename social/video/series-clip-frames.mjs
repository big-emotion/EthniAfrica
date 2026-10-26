// The stills of an external clip for the series video (Cartes
// 1.15.0-proposition). The page draws a clip card from one JPEG per frame of
// the 30 fps grid, already scaled to the frame's height and cut on the focal
// point, so the browser never decodes video and every export draws the same
// pixels from the same source.
import { execFile, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { FRAME_SECONDS, snapToFrame } from "./series-clip.mjs";

const run = promisify(execFile);
const WIDTH = 1080;
const HEIGHT = 1920;

// What the clip checks need to know about a source file; null when it is
// missing or unreadable, so the check reports « introuvable » rather than a
// stack trace.
export function probeSource(src) {
  if (!existsSync(src)) return null;
  try {
    const out = execFileSync(
      "ffprobe",
      [
        ...["-v", "error", "-select_streams", "v:0"],
        ...["-show_entries", "stream=codec_name,width,height:format=duration"],
        ...["-of", "json", src],
      ],
      { encoding: "utf8" }
    );
    const { streams, format } = JSON.parse(out);
    const [video] = streams;
    if (!video) return null;
    return {
      codec: video.codec_name,
      width: video.width,
      height: video.height,
      duration: Number(format.duration),
    };
  } catch {
    return null;
  }
}

// `fx` is the focal point across the source, 0 to 1 (spec §4); the window is
// 1080 px wide on a source scaled to 1920 px tall, so its left edge is
// clamped inside the picture.
export async function extractClipFrames({ src, in: from, out, fx = 0.5, dir }) {
  if (existsSync(dir))
    throw new Error(`Le dossier d'images existe déjà : ${dir}`);
  await mkdir(dir, { recursive: true });
  const count = Math.round(
    (snapToFrame(out) - snapToFrame(from)) / FRAME_SECONDS
  );
  const crop = `crop=${WIDTH}:${HEIGHT}:x='min(max(iw*${fx}-${WIDTH / 2},0),iw-${WIDTH})':y=0`;
  await run("ffmpeg", [
    ...["-v", "error", "-y", "-ss", String(snapToFrame(from))],
    ...["-i", src],
    ...["-vf", `fps=30,scale=-2:${HEIGHT}:flags=lanczos,${crop}`],
    ...["-frames:v", String(count)],
    // Bit-exact output, so two runs on one source give the same files.
    ...["-fflags", "+bitexact", "-flags:v", "+bitexact", "-q:v", "2"],
    join(dir, "%04d.jpg"),
  ]);
  const files = (await readdir(dir)).sort().map((f) => join(dir, f));
  if (files.length !== count)
    throw new Error(
      `${src} : ${files.length} images extraites pour ${count} demandées ; la source est plus courte que out`
    );
  return { count, files };
}
