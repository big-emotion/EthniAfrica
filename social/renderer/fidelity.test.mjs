// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { compareImages } from "./fidelity.mjs";

const json = async (path) => JSON.parse(await readFile(path, "utf8"));

// @req REQ-186
test("the reference manifest pins the accepted design version and every sample card", async () => {
  const manifest = await json("social/renderer/reference-manifest.json");
  const version = await json("social/design-system/version.json");
  const samples = await json("social/design-system/handoff/cards.sample.json");
  assert.equal(manifest.designVersion, version.version);
  assert.equal(samples.version, version.version);
  assert.deepEqual(
    manifest.files.map((f) => f.id).sort(),
    samples.cards.map((c) => c.id).sort()
  );
  for (const f of manifest.files) assert.equal(f.file, `${f.id}.png`);
});

const image = (colour, width = 100) =>
  sharp({ create: { width, height: 100, channels: 3, background: colour } })
    .png()
    .toBuffer();
// @req REQ-186
test("identical decoded images pass; a real visual change or dimensions fail", async () => {
  const a = await image("#efe6d6");
  assert.equal((await compareImages(a, a)).ok, true);
  assert.equal((await compareImages(a, await image("#000000"))).ok, false);
  assert.equal((await compareImages(a, await image("#efe6d6", 99))).ok, false);
});
// @req REQ-186
test("small antialiasing differences pass without accepting shifted blocks", async () => {
  const a = await image("#ffffff");
  const faint = await image("#fafafa");
  // A global colour shift is not antialiasing, even if each channel differs by <16.
  assert.equal((await compareImages(a, faint)).ok, false);
  const patch = await sharp({
    create: { width: 5, height: 5, channels: 3, background: "#fafafa" },
  })
    .png()
    .toBuffer();
  const b = await sharp(a)
    .composite([{ input: patch, left: 40, top: 40 }])
    .png()
    .toBuffer();
  assert.equal((await compareImages(a, b)).ok, true);
});
