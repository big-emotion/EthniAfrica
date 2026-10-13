// @req REQ-186
// EthniAfrica Cartes 1.3.0-proposition: the series band, the seven carousel
// models and the 9:16 video model. Proposal tests, run with
// `npm run test:social-series-proposal`; the browser cases need the pinned
// Chromium (see README.md, « Previews »).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SERIES,
  bandText,
  closingLine,
  loadModels,
  PANEL_MAX_WITH_BAND,
} from "./series.mjs";
import { validateInput } from "../../../renderer/render.mjs";
import { openBench } from "./preview.mjs";

const accepted = JSON.parse(
  await readFile(new URL("../../version.json", import.meta.url), "utf8")
);

test("the band reads the series name, then the episode number", () => {
  assert.equal(bandText("pays", 14), "D'où vient le nom de mon pays ? · n° 14");
  assert.equal(bandText("villes", 3), "Ce que les villes racontent · n° 3");
  assert.throws(() => bandText("inconnue", 1), /Unknown series/);
  assert.throws(() => bandText("pays", 0), /episode/);
});

test("the seven series of the 2026-10-13 frame are registered once each", () => {
  assert.deepEqual(
    SERIES.map((s) => s.number),
    [1, 2, 3, 4, 5, 6, 7]
  );
  assert.equal(new Set(SERIES.map((s) => s.campaign)).size, 7);
});

test("the closing sentence is the one every caption ends with", () => {
  assert.equal(
    closingLine("Burkina Faso"),
    "Cherchez Burkina Faso sur EthniAfrica, lien en profil."
  );
});

test("each series has one carousel model of six to eight cards", async () => {
  const models = await loadModels();
  assert.deepEqual(
    models.map((m) => m.series.id),
    SERIES.map((s) => s.id)
  );
  for (const { series, data } of models) {
    const cards = data.cards;
    assert.ok(cards.length >= 6 && cards.length <= 8, series.id);
    assert.equal(cards[0].type, "opener", series.id);
    assert.equal(cards.at(-1).type, "closing", series.id);
    assert.equal(
      cards.at(-1).body,
      closingLine(data.searchName),
      `${series.id} closing sentence`
    );
    for (const card of cards) {
      assert.deepEqual(card.series, data.series, `${card.id} band`);
      assert.ok(card.demo, `${card.id} must carry the demonstration tape`);
      assert.ok(
        card.provenance,
        `${card.id} must say where its text comes from`
      );
    }
  }
});

test("each model is a valid proof sequence for the accepted renderer", async () => {
  for (const { data } of await loadModels()) {
    assert.doesNotThrow(() => validateInput(data, "proof", accepted.version));
    assert.throws(
      () => validateInput(data, "final", accepted.version),
      /Demo content/
    );
  }
});

test("the video model voices every card once, in 35 to 45 seconds, and ends on the search sentence", async () => {
  const video = JSON.parse(
    await readFile(new URL("./video.model.json", import.meta.url), "utf8")
  );
  const [{ data }] = await loadModels();
  assert.deepEqual(
    video.beats.map((b) => b.card),
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
  assert.equal(lastCard, closingLine(data.searchName));
});

let bench;
before(async () => {
  bench = await openBench();
});
after(async () => {
  await bench?.close();
});

test("the band holds on one line for every series at episode 100", async () => {
  for (const s of SERIES) {
    const band = await bench.measureBand({ id: s.id, episode: 100 });
    assert.equal(band.lines, 1, s.id);
    assert.ok(band.right <= 1080 - 72, `${s.id} reaches ${band.right}`);
    assert.equal(band.height, 72, s.id);
  }
});

test("every model card fits under the band with the image window kept", async () => {
  for (const { data } of await loadModels()) {
    const reports = await bench.renderModel(data);
    for (const r of reports) {
      assert.ok(r.ok, `${r.id}: ${JSON.stringify(r.warnings)}`);
      assert.equal(r.collisions || 0, 0, r.id);
      assert.ok(
        r.panelHeight <= PANEL_MAX_WITH_BAND,
        `${r.id} panel ${r.panelHeight}`
      );
      assert.ok(r.band.bottom <= r.panelTop, `${r.id} band meets the panel`);
    }
  }
});

test("a video frame keeps the card in the 4:5 centre and the subtitle in its band", async () => {
  const [{ data }] = await loadModels();
  const frame = await bench.videoFrame(data, {
    card: 1,
    subtitle: "Deux mots, pris à deux langues du pays.",
  });
  assert.deepEqual(frame.size, [1080, 1920]);
  assert.deepEqual([frame.card.top, frame.card.bottom], [285, 1635]);
  assert.ok(frame.subtitle.top >= 1660 && frame.subtitle.bottom <= 1800);
  assert.ok(frame.subtitle.left >= 60 && frame.subtitle.right <= 1020);
});
