#!/usr/bin/env node
/** Assemble cover and copy beside a sealed release without modifying its manifest. */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  realpathSync,
  mkdtempSync,
  renameSync,
  rmSync,
} from "node:fs";
import {
  dirname,
  join,
  relative,
  resolve,
  isAbsolute,
  extname,
} from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { artifact, digest, requireValue } from "./artifacts.mjs";

export function readFinalDelivery(root, path) {
  const evidence = artifact(root, path);
  const report = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  requireValue(
    report.action === "finalize" &&
      report.ready_to_publish === true &&
      report.proof_only === false,
    "A successful clean finalize report is required"
  );
  for (const name of [
    "video.mp4",
    "captions.srt",
    "narration.fr.txt",
    "CREDITS.md",
    "mobile-preview.png",
    "release-review.json",
  ])
    requireValue(
      typeof report.files?.[name] === "string",
      `Delivery is missing ${name}`
    );
  for (const [name, hash] of Object.entries(report.files))
    requireValue(
      artifact(root, join(dirname(path), name)).sha256 === hash,
      `Delivery file changed: ${name}`
    );
  return { report, evidence };
}

function checkCover(bytes) {
  requireValue(
    bytes.length >= 45 &&
      bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) &&
      bytes.toString("ascii", 12, 16) === "IHDR" &&
      bytes.toString("ascii", bytes.length - 8, bytes.length - 4) === "IEND",
    "Thumbnail must be a PNG export"
  );
  requireValue(
    bytes.readUInt32BE(16) === 1080 && bytes.readUInt32BE(20) === 1920,
    "Thumbnail must be 1080 x 1920; mobile-preview.png is not a cover"
  );
}

export function validatePublicationKit(root, kitPath, deliveryPath) {
  artifact(root, kitPath);
  const kit = JSON.parse(readFileSync(resolve(root, kitPath), "utf8"));
  const { report, evidence } = readFinalDelivery(root, deliveryPath);
  requireValue(
    kit.version === 1 &&
      kit.source_delivery?.path === deliveryPath &&
      kit.source_delivery.sha256 === evidence.sha256,
    "Publication kit source delivery changed"
  );
  requireValue(
    kit.source_video_sha256 === report.files["video.mp4"],
    "Publication kit source video changed"
  );
  requireValue(
    Number.isFinite(kit.at_seconds) && kit.at_seconds >= 0,
    "Invalid thumbnail time"
  );
  const paths = {};
  for (const name of ["thumbnail.png", "publication-copy.md"]) {
    paths[name] = join(dirname(kitPath), name);
    requireValue(
      artifact(root, paths[name]).sha256 === kit.files?.[name],
      `Publication kit file changed: ${name}`
    );
  }
  checkCover(readFileSync(resolve(root, paths["thumbnail.png"])));
  requireValue(
    readFileSync(resolve(root, paths["publication-copy.md"]), "utf8").trim(),
    "Publication Markdown is empty"
  );
  return { kit, paths };
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    timeout: 120000,
  });
  requireValue(
    !result.error && result.status === 0,
    `${command} failed: ${result.error?.message ?? result.stderr}`
  );
  return result.stdout;
}

export function buildPublicationKit(
  root,
  { delivery, copy, at, output = join(dirname(delivery), "publication") }
) {
  root = realpathSync(root);
  const { report, evidence } = readFinalDelivery(root, delivery);
  requireValue(
    Number.isFinite(at) && at >= 0,
    "Thumbnail time must be a finite nonnegative number"
  );
  const sourceCopy = artifact(root, copy);
  requireValue(
    extname(copy).toLowerCase() === ".md",
    "Publication copy must be Markdown"
  );
  const copyBytes = readFileSync(resolve(root, copy));
  requireValue(
    copyBytes.toString("utf8").trim(),
    "Publication Markdown is empty"
  );
  const destination = resolve(root, output);
  const inRoot = (path) => {
    const rel = relative(root, path);
    return rel && !rel.startsWith("..") && !isAbsolute(rel);
  };
  requireValue(
    !isAbsolute(output) && inRoot(destination),
    "Publication output must stay inside the private package"
  );
  const parent = realpathSync(dirname(destination));
  requireValue(
    parent === root || inRoot(parent),
    "Publication output symlink must stay inside the private package"
  );
  requireValue(
    !existsSync(destination),
    "Publication destination already exists; choose a new version"
  );
  const video = resolve(root, dirname(delivery), "video.mp4");
  const probe = JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,avg_frame_rate:format=duration",
      "-of",
      "json",
      video,
    ])
  );
  requireValue(
    probe.streams?.[0]?.width === 1080 && probe.streams[0].height === 1920,
    "Source video must be 1080 x 1920"
  );
  requireValue(
    Number.isFinite(Number(probe.format?.duration)) &&
      at < Number(probe.format.duration),
    "Thumbnail time exceeds the video duration"
  );
  const [numerator, denominator] = String(probe.streams[0].avg_frame_rate)
    .split("/")
    .map(Number);
  const fps = numerator / denominator;
  requireValue(
    Number.isFinite(fps) && fps > 0,
    "Source video frame rate is unavailable"
  );
  // Use the frame containing the chosen instant, including the last frame's interval.
  const frameSeconds = Math.floor(at * fps) / fps;
  const temporary = mkdtempSync(join(parent, ".publication-pending-"));
  try {
    const thumbnail = join(temporary, "thumbnail.png");
    run("ffmpeg", [
      "-v",
      "error",
      "-nostdin",
      "-ss",
      String(frameSeconds),
      "-i",
      video,
      "-map",
      "0:v:0",
      "-frames:v",
      "1",
      "-update",
      "1",
      thumbnail,
    ]);
    checkCover(readFileSync(thumbnail));
    writeFileSync(join(temporary, "publication-copy.md"), copyBytes, {
      flag: "wx",
    });
    const kit = {
      version: 1,
      source_delivery: evidence,
      source_video_sha256: report.files["video.mp4"],
      at_seconds: at,
      frame_seconds: frameSeconds,
      files: {
        "thumbnail.png": digest(readFileSync(thumbnail)),
        "publication-copy.md": digest(copyBytes),
      },
    };
    writeFileSync(
      join(temporary, "publication-kit.json"),
      JSON.stringify(kit, null, 2) + "\n",
      { flag: "wx" }
    );
    requireValue(
      readFinalDelivery(root, delivery).evidence.sha256 === evidence.sha256 &&
        artifact(root, copy).sha256 === sourceCopy.sha256,
      "Source delivery or copy changed during export"
    );
    requireValue(
      !existsSync(destination),
      "Publication destination already exists"
    );
    renameSync(temporary, destination);
    return artifact(root, join(output, "publication-kit.json"));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const { positionals, values } = parseArgs({
      allowPositionals: true,
      options: {
        delivery: { type: "string" },
        copy: { type: "string" },
        at: { type: "string" },
        output: { type: "string" },
      },
    });
    requireValue(
      positionals.length === 1 &&
        values.delivery &&
        values.copy &&
        values.at?.trim(),
      "Usage: node social/tools/production/publication-kit.mjs PROJECT --delivery relative/delivery.json --copy relative/copy.md --at SECONDS [--output relative/new-directory]"
    );
    console.log(
      JSON.stringify(
        buildPublicationKit(positionals[0], {
          ...values,
          at: Number(values.at),
        }),
        null,
        2
      )
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
