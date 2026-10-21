// @req REQ-186
// Rebuilds the river paths from the pinned Natural Earth file and compares
// them with the committed files. The download is not in git: point
// ETHNIAFRICA_VIDEO_ASSETS at its folder; without it the test is skipped,
// never reported as passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { RIVERS, RIVERS_DIR, buildRivers } from "./rivers.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;

// @req REQ-186
test(
  "the committed rivers are what the pinned download gives, byte for byte",
  { skip: !assets && "ETHNIAFRICA_VIDEO_ASSETS is not set" },
  async () => {
    const built = await buildRivers(assets);
    assert.deepEqual([...built.keys()].sort(), RIVERS.map((r) => r.id).sort());
    for (const [id, text] of built)
      assert.equal(
        text,
        await readFile(new URL(`${id}.geojson`, RIVERS_DIR), "utf8"),
        id
      );
  }
);
