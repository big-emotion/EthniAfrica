// @req REQ-186
// Regenerates the Mega-Chad outline from the verified ETOPO 2022 tile and
// compares it with the committed file. The DEM is not in git: point
// ETHNIAFRICA_VIDEO_ASSETS at its folder. A missing folder fails; it is
// never reported as a pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildMegaChad, OUTPUT } from "./shoreline.mjs";

// @req REQ-186
test("the committed outline is what the DEM gives, byte for byte", async () => {
  const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
  assert.ok(assets, "Set ETHNIAFRICA_VIDEO_ASSETS to the verified DEM folder");
  const committed = await readFile(OUTPUT, "utf8");
  const { generated } = JSON.parse(committed).properties;
  assert.equal(await buildMegaChad(assets, generated), committed);
});
