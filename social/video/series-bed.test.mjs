// @req REQ-186
// An episode chooses its own bed by name (operator, 21 October 2026): the
// loader keeps the piece's `bed` for the mix, which resolves it in
// social/sound/beds/library (mix.test.mjs covers the resolution).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { wordCardDemo } from "./fixtures/series-motion.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-bed-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

// @req REQ-186
test("the loader keeps the episode's bed, and no bed when the piece names none", () => {
  const piece = join(dir, "piece");
  const input = wordCardDemo(piece);
  assert.equal(loadSeriesVideo(input, { dir: piece }).bed, undefined);
  assert.equal(
    loadSeriesVideo({ ...input, bed: "mandingue" }, { dir: piece }).bed,
    "mandingue"
  );
});
