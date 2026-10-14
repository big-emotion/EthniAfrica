// @req REQ-186
// EthniAfrica Cartes 1.3.0: the series metadata and models against the
// accepted engine. Run with `npm run test:social-series-proposal`; the
// browser cases use the renderer's pinned Chromium (social/renderer/runtime.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import {
  SERIES,
  BAND_HEIGHT,
  PANEL_MAX_WITH_BAND,
  bandText,
  closingLine,
  loadModels,
} from "./series.mjs";
import { validateInput, renderSequence } from "../../../renderer/render.mjs";

const design = fileURLToPath(new URL("../..", import.meta.url));
const accepted = JSON.parse(
  await readFile(join(design, "version.json"), "utf8")
);

// @req REQ-186
test("the band reads the series name, then the episode number", () => {
  assert.equal(bandText("pays", 14), "D'où vient le nom de mon pays ? · n° 14");
  assert.equal(bandText("villes", 3), "Ce que les villes racontent · n° 3");
  assert.throws(() => bandText("inconnue", 1), /Unknown series/);
  assert.throws(() => bandText("pays", 0), /episode/);
});

// @req REQ-186
test("the seven series of the 2026-10-13 frame are registered once each", () => {
  assert.deepEqual(
    SERIES.map((s) => s.number),
    [1, 2, 3, 4, 5, 6, 7]
  );
  assert.equal(new Set(SERIES.map((s) => s.campaign)).size, 7);
});

// @req REQ-186
test("the series names and band limits are the accepted engine's", async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.addScriptTag({ path: join(design, "components/bundle.js") });
  const engine = await page.evaluate(() => ({
    version: window.EthniCards.version,
    series: window.EthniCards.SERIES,
    band: window.EthniCards.BAND_H,
    panel: window.EthniCards.PANEL_MAX_SERIES,
  }));
  assert.equal(engine.version, accepted.version);
  assert.deepEqual(
    engine.series,
    Object.fromEntries(SERIES.map((s) => [s.id, s.name]))
  );
  assert.equal(engine.band, BAND_HEIGHT);
  assert.equal(engine.panel, PANEL_MAX_WITH_BAND);
});

// @req REQ-186
test("the closing sentence is the one every caption ends with", () => {
  assert.equal(
    closingLine("Burkina Faso"),
    "Cherchez Burkina Faso sur EthniAfrica, lien en profil."
  );
});

// @req REQ-186
test("each series has one carousel model of six to eight cards", async () => {
  for (const { series, data } of await loadModels()) {
    const cards = data.cards;
    assert.ok(cards.length >= 6 && cards.length <= 8, series.id);
    assert.equal(cards[0].type, "opener", series.id);
    assert.equal(cards.at(-1).type, "closing", series.id);
    assert.match(
      cards.at(-1).body,
      /^Cherchez .+ sur EthniAfrica, lien en profil\.$/,
      `${series.id} closing sentence`
    );
    for (const [i, card] of cards.entries()) {
      assert.deepEqual(
        card.series,
        { id: series.id, episode: 1 },
        `${card.id} band`
      );
      assert.equal(
        card.id,
        `serie-${series.id}-${String(i + 1).padStart(2, "0")}`
      );
      assert.ok(card.demo, `${card.id} must carry the demonstration tape`);
      assert.ok(
        card.provenance,
        `${card.id} must say where its text comes from`
      );
    }
  }
});

// @req REQ-186
test("each model is a valid proof sequence and never a final one", async () => {
  for (const { data } of await loadModels()) {
    assert.doesNotThrow(() => validateInput(data, "proof", accepted.version));
    assert.throws(
      () => validateInput(data, "final", accepted.version),
      /Demo content/
    );
  }
});

// @req REQ-186
test("the band holds on one line for every series at episode 100", async (t) => {
  const models = await loadModels();
  const cards = models.map(({ data }) => ({
    ...structuredClone(data.cards[0]),
    series: { ...data.cards[0].series, episode: 100 },
  }));
  const root = await mkdtemp(join(tmpdir(), "ethnia-series-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = join(root, "cards.json");
  await writeFile(
    input,
    JSON.stringify({
      version: accepted.version,
      logo: models[0].data.logo,
      cards,
    })
  );
  const r = await renderSequence({
    input,
    output: join(root, "out"),
    design,
    assets: join(design, "assets"),
    mode: "diagnostic",
  });
  for (const card of r.cards) {
    assert.equal(card.fit.series.lines, 1, card.id);
    assert.ok(
      card.fit.series.right <= 1080 - 72,
      `${card.id} reaches ${card.fit.series.right}`
    );
  }
});

// @req REQ-186
test("the video script voices every series 1 card once, in 35 to 45 seconds, and ends on the search sentence", async () => {
  const video = JSON.parse(
    await readFile(new URL("./video.model.json", import.meta.url), "utf8")
  );
  const [{ data }] = await loadModels();
  assert.deepEqual(
    video.beats.map((b) => `serie-${b.card}`),
    data.cards.map((c) => c.id)
  );
  const chunks = video.beats.flatMap((b) => b.chunks);
  const seconds = chunks.reduce((sum, c) => sum + c.duration, 0) + video.hold;
  assert.ok(seconds >= 35 && seconds <= 45, `${seconds} s`);
  for (const { text } of chunks) {
    // Vidéo carte 0.4.0: 3 to 6 words, two lines of at most 26 characters.
    const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
    assert.ok(words.length >= 3 && words.length <= 6, text);
    assert.ok(text.length <= 52, text);
  }
  const lastCard = video.beats
    .at(-1)
    .chunks.map((c) => c.text)
    .join(" ");
  assert.equal(lastCard, data.cards.at(-1).body);
});
