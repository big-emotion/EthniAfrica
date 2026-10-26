// The stills of an external clip for the series video (Cartes
// 1.15.0-proposition). The page draws a clip card from one JPEG per frame of
// the 30 fps grid, already scaled to the frame's height and cut on the focal
// point, so the browser never decodes video and every export draws the same
// pixels from the same source.
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, statSync, writeFileSync } from "node:fs";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { FRAME_SECONDS, snapToFrame, checkClipPhase } from "./series-clip.mjs";

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

// A clip card as the loader keeps it: the source checked against the spec's
// rules, the stills' names and the 1080×1920 size the page expects, the
// footage held at its own zoom and never blurred (the calm zones measure one
// picture, not a moving one). The check's warnings stay on the clip.
// The stills of one clip, extracted once and shared: the parallel render's
// slices each open their own browser, and all of them ask for the same
// frames. The folder is named by what decides the pixels (the file, its cut
// and its focal point) and appears whole by a rename, so a slice that comes
// second finds a finished folder or loses the race harmlessly.
export async function ensureClipFrames(
  { src, in: from, out, fx = 0.5 },
  root = join(tmpdir(), "ethnia-clip-frames")
) {
  const { size, mtimeMs } = statSync(src);
  const key = createHash("sha256")
    .update(JSON.stringify([src, size, mtimeMs, from, out, fx]))
    .digest("hex")
    .slice(0, 16);
  const dir = join(root, key);
  const count = Math.round(
    (snapToFrame(out) - snapToFrame(from)) / FRAME_SECONDS
  );
  if (existsSync(join(dir, "done"))) return { dir, count };
  await mkdir(root, { recursive: true });
  const part = `${dir}.part-${process.pid}-${Math.random().toString(36).slice(2)}`;
  try {
    await extractClipFrames({ src, in: from, out, fx, dir: part });
    writeFileSync(join(part, "done"), "");
    await rename(part, dir);
  } catch (error) {
    await rm(part, { recursive: true, force: true });
    // Another slice finished the same folder first.
    if (!existsSync(join(dir, "done"))) throw error;
  }
  return { dir, count };
}

export function prepareClipCard(card, dir) {
  const clip = card.image.clip;
  const src = resolve(dir, clip.src);
  const { errors, warnings } = checkClipPhase(
    { kind: "clip", id: card.id, ...clip, src },
    probeSource
  );
  if (errors.length) throw new Error(errors.join("\n"));
  const count = Math.round(
    (snapToFrame(clip.out) - snapToFrame(clip.in)) / FRAME_SECONDS
  );
  card.image = {
    src: `clip/${card.id}/0001.jpg`,
    w: WIDTH,
    h: HEIGHT,
    focus: [0.5, 0.5],
    calm: false,
    clip: { ...clip, src, count, warnings },
  };
}
