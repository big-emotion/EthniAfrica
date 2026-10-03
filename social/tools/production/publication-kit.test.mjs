import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  buildPublicationKit,
  validatePublicationKit,
} from "./publication-kit.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ffmpegAvailable = spawnSync("ffmpeg", ["-version"]).status === 0;

// @req REQ-032
test(
  "extracts a full-size cover and exact French Markdown from a clean release without overwriting it",
  { skip: !ffmpegAvailable },
  () => {
    const root = mkdtempSync(join(tmpdir(), "publication-kit-"));
    try {
      mkdirSync(join(root, "release"));
      const video = join(root, "release/video.mp4");
      const encode = spawnSync(
        "ffmpeg",
        [
          "-v",
          "error",
          "-f",
          "lavfi",
          "-i",
          "color=c=0x211c15:s=1080x1920:r=1:d=2",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          video,
        ],
        { encoding: "utf8" }
      );
      assert.equal(encode.status, 0, encode.stderr);
      const files = { "video.mp4": hash(readFileSync(video)) };
      for (const name of [
        "captions.srt",
        "narration.fr.txt",
        "CREDITS.md",
        "mobile-preview.png",
        "release-review.json",
      ]) {
        writeFileSync(join(root, "release", name), `Fixture ${name}`);
        files[name] = hash(readFileSync(join(root, "release", name)));
      }
      const delivery = "release/delivery.json";
      writeFileSync(
        join(root, delivery),
        JSON.stringify({
          action: "finalize",
          ready_to_publish: true,
          proof_only: false,
          files,
        })
      );
      const copy =
        "## Instagram (reel)\nD’où vient ce nom ?\n\nSource : notre dossier validé.\n";
      writeFileSync(join(root, "copy.md"), copy);
      const before = readFileSync(join(root, delivery));
      const result = buildPublicationKit(root, {
        delivery,
        copy: "copy.md",
        at: 0.5,
      });
      assert.equal(
        readFileSync(
          join(root, "release/publication/publication-copy.md"),
          "utf8"
        ),
        copy
      );
      assert.deepEqual(readFileSync(join(root, delivery)), before);
      assert.equal(
        validatePublicationKit(root, result.path, delivery).kit.at_seconds,
        0.5
      );
      const cli = spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL("./publication-kit.mjs", import.meta.url)),
          root,
          "--delivery",
          delivery,
          "--copy",
          "copy.md",
          "--at",
          "0.5",
          "--output",
          "release/publication-v2",
        ],
        { encoding: "utf8" }
      );
      assert.equal(cli.status, 0, cli.stderr);
      assert.equal(
        JSON.parse(cli.stdout).path,
        "release/publication-v2/publication-kit.json"
      );
      const decoded = spawnSync(
        "ffmpeg",
        [
          "-v",
          "error",
          "-i",
          join(root, "release/publication/thumbnail.png"),
          "-f",
          "null",
          "-",
        ],
        { encoding: "utf8" }
      );
      assert.equal(decoded.status, 0, decoded.stderr);
      assert.throws(
        () => buildPublicationKit(root, { delivery, copy: "copy.md", at: 0.5 }),
        /exists/
      );
      const lastFrame = buildPublicationKit(root, {
        delivery,
        copy: "copy.md",
        at: 1.99,
        output: "release/last-frame",
      });
      assert.equal(
        validatePublicationKit(root, lastFrame.path, delivery).kit
          .frame_seconds,
        1
      );
      for (const at of [-1, NaN, Infinity, 99]) {
        assert.throws(
          () =>
            buildPublicationKit(root, {
              delivery,
              copy: "copy.md",
              at,
              output: "release/bad-time",
            }),
          /time|duration/
        );
        assert(!existsSync(join(root, "release/bad-time")));
      }
      writeFileSync(join(root, "empty.md"), "   ");
      assert.throws(
        () =>
          buildPublicationKit(root, {
            delivery,
            copy: "empty.md",
            at: 0.5,
            output: "release/empty",
          }),
        /empty/
      );
      assert.throws(
        () =>
          buildPublicationKit(root, {
            delivery,
            copy: "copy.md",
            at: 0.5,
            output: "../escape",
          }),
        /inside/
      );
      writeFileSync(video, "Changed video");
      assert.throws(
        () => validatePublicationKit(root, result.path, delivery),
        /changed/
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
);
