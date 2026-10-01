/**
 * Web derivatives of released media, computed without touching the masters.
 *
 * Every derivative is a function of its source bytes and these settings, so a
 * repeated run produces identical files and the manifest can compare hashes
 * instead of timestamps. Videos are never re-encoded here: a published reel
 * plays from its YouTube edition, and a native copy needs a durable host and a
 * cleared soundtrack that do not exist yet.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import sharp from "sharp";

export const WEBP_SETTINGS = { quality: 80, effort: 4, maxWidth: 1080 };

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function encode(input) {
  const { data, info } = await sharp(input)
    .resize({ width: WEBP_SETTINGS.maxWidth, withoutEnlargement: true })
    .webp({ quality: WEBP_SETTINGS.quality, effort: WEBP_SETTINGS.effort })
    .toBuffer({ resolveWithObject: true });
  return {
    data,
    width: info.width,
    height: info.height,
    bytes: data.length,
    sha256: sha256(data),
  };
}

/** A WebP of a still image (a slide, a thumbnail, a cover). */
export function webpFromImage(path) {
  return encode(readFileSync(path));
}

/**
 * A WebP of the frame one second into a video — the same instant the release
 * kit uses for its thumbnails — when the release shipped no poster of its own.
 */
export function webpFromVideoFrame(path, atSeconds = 1) {
  const run = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-ss",
      String(atSeconds),
      "-i",
      path,
      "-frames:v",
      "1",
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 }
  );
  if (run.status !== 0 || !run.stdout?.length) {
    throw new Error(
      `ffmpeg could not read a frame: ${run.stderr?.toString().trim() || run.error?.message}`
    );
  }
  return encode(run.stdout);
}
