// @req REQ-186
// The idents are encoded as the series video is: H.264, 1080 × 1920, 30 fps,
// yuv420p, one frame per render(t) step, and the same time always gives the
// same picture.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { renderClip } from "./render.mjs";
import { INTRO } from "./shots.mjs";

test("an excerpt is encoded at the series format, frame for frame", async () => {
  const dir = await mkdtemp(join(tmpdir(), "idents-"));
  try {
    const out = join(dir, "intro.mp4");
    const { frames, hashes } = await renderClip(INTRO, out, {
      from: 1.0,
      to: 1.2,
      repeat: 1.1,
    });
    assert.equal(frames, 6);
    const probe = JSON.parse(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-count_frames",
        "-show_entries",
        "stream=codec_name,width,height,r_frame_rate,pix_fmt,nb_read_frames",
        "-of",
        "json",
        out,
      ])
    ).streams[0];
    assert.deepEqual(
      {
        codec: probe.codec_name,
        w: probe.width,
        h: probe.height,
        fps: probe.r_frame_rate,
        pix: probe.pix_fmt,
        n: +probe.nb_read_frames,
      },
      { codec: "h264", w: 1080, h: 1920, fps: "30/1", pix: "yuv420p", n: 6 }
    );
    assert.equal(
      hashes[0],
      hashes[1],
      "the same time renders the same picture"
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
