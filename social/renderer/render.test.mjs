// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, cp, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { validateInput, renderSequence, verifyOutput } from "./render.mjs";

const design = resolve("social/design-system");
const samples = JSON.parse(
  await readFile(join(design, "handoff/cards.sample.json"))
);
const single = (id = "seq-5") => ({
  version: samples.version,
  logo: samples.logo,
  cards: [
    {
      ...structuredClone(samples.cards.find((c) => c.id === id)),
      folio: "01/01",
    },
  ],
});
async function fixture(t, data = single()) {
  const root = await mkdtemp(join(tmpdir(), "ethnia-cards-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = join(root, "cards.json");
  await writeFile(input, JSON.stringify(data));
  return {
    root,
    input,
    output: join(root, "export"),
    design,
    assets: join(design, "assets"),
  };
}

test("input rejects empty, duplicate, unknown, mixed-theme, bad-folio and demo sequences", () => {
  for (const change of [
    (d) => (d.cards = []),
    (d) => d.cards.push(d.cards[0]),
    (d) => (d.cards[0].type = "unknown"),
    (d) => (d.cards[0].folio = "02/01"),
    (d) => (d.cards[0].demo = "Not approved"),
    (d) => (d.cards[0].image.src = "../secret.png"),
    (d) => (d.cards[0].image.src = "https://example.org/image.png"),
    (d) => (d.version = "old"),
  ]) {
    const d = single();
    change(d);
    assert.throws(() => validateInput(d, "final", samples.version));
  }
  const d = single();
  d.cards.push({
    ...d.cards[0],
    id: "other",
    theme: "parchemin",
    folio: "02/02",
  });
  d.cards[0].folio = "01/02";
  assert.throws(() => validateInput(d, "proof", samples.version), /theme/i);
  assert.doesNotThrow(() =>
    validateInput(single("seq-1"), "proof", samples.version)
  );
});

test("a final export is complete, numbered, sRGB and tied to inputs and exports", async (t) => {
  const f = await fixture(t);
  const report = await renderSequence(f);
  assert.equal(report.mode, "final");
  assert.equal(report.cards.length, 1);
  assert.equal(report.cards[0].file, "01.png");
  assert.ok(report.cards[0].alt.includes("Source") === false);
  const meta = await sharp(join(f.output, "01.png")).metadata();
  assert.equal(meta.width, 1080);
  assert.equal(meta.height, 1350);
  assert.equal(meta.space, "srgb");
  assert.equal((await verifyOutput(f)).cards.length, 1);
  await assert.rejects(renderSequence(f), /exists/i);
  await writeFile(join(f.output, "01.png"), "incomplete");
  await assert.rejects(verifyOutput(f), /export|hash/i);
});

test("stale input and empty reports cannot pass recovery", async (t) => {
  const f = await fixture(t);
  await renderSequence(f);
  const original = await readFile(f.input);
  await writeFile(f.input, JSON.stringify(single("seq-7")));
  await assert.rejects(verifyOutput(f), /input|stale/i);
  await writeFile(f.input, original);
  const p = join(f.output, "report.json");
  const report = JSON.parse(await readFile(p));
  report.cards = [];
  await writeFile(p, JSON.stringify(report));
  await assert.rejects(verifyOutput(f), /count|empty|cards/i);
});

test("overflow is refused and partial output is removed", async (t) => {
  const d = single("overflow");
  delete d.cards[0].demo;
  const f = await fixture(t, d);
  await assert.rejects(renderSequence(f), /overflow|layout|fit/i);
  await assert.rejects(access(f.output));
});

test("missing and undecodable images cannot pass a fit report", async (t) => {
  const f = await fixture(t);
  const d = single();
  d.cards[0].image.src = "missing.png";
  await writeFile(f.input, JSON.stringify(d));
  await assert.rejects(renderSequence(f), /asset|ENOENT/i);
  await writeFile(join(f.root, "broken.png"), "not an image");
  d.logo = "broken.png";
  d.cards[0].image.src = "broken.png";
  await writeFile(f.input, JSON.stringify(d));
  await assert.rejects(
    renderSequence({ ...f, assets: f.root }),
    /image|decode/i
  );
  await assert.rejects(access(f.output));
});

test("missing fonts fail before capture", async (t) => {
  const f = await fixture(t);
  const copy = join(f.root, "design");
  await cp(design, copy, { recursive: true });
  await rm(join(copy, "fonts/Anton-Regular.ttf"));
  await assert.rejects(renderSequence({ ...f, design: copy }), /font|ENOENT/i);
});

test("proof retains demo tape; final mode refuses it", async (t) => {
  const f = await fixture(t, single("seq-1"));
  await assert.rejects(renderSequence(f), /demo/i);
  const r = await renderSequence({ ...f, mode: "proof" });
  assert.equal(r.mode, "proof");
  assert.equal(r.cards[0].demo, true);
  assert.equal(r.productionReady, false);
});

test("alternative text includes rendered quotation, translation and status band", async (t) => {
  const d = single("seq-7");
  d.cards[0].quote = {
    original: "A recorded name.",
    lang: "en",
    translation: "Un nom transmis.",
    attribution: "Document de démonstration",
  };
  delete d.cards[0].body;
  const f = await fixture(t, d);
  const r = await renderSequence({ ...f, mode: "diagnostic" });
  assert.match(r.cards[0].alt, /A recorded name/);
  assert.match(r.cards[0].alt, /Traduction.*Un nom transmis/s);
  assert.equal(r.productionReady, false);
});

test("map alternative text contains the actual scale and figures", async (t) => {
  const f = await fixture(t, single("map-fula-nombre-region"));
  const r = await renderSequence({ ...f, mode: "diagnostic" });
  const c = samples.cards.find((c) => c.id === "map-fula-nombre-region");
  for (const cl of c.map.choropleth.classes)
    assert.ok(r.cards[0].alt.includes(cl.label));
  for (const value of Object.values(c.map.choropleth.labels))
    assert.ok(r.cards[0].alt.includes(value));
  assert.ok(r.cards[0].alt.includes(c.map.caption.when));
});

test("inline accents preserve complete African names in text and alternative text", async (t) => {
  const f = await fixture(t, single("seq-4"));
  const r = await renderSequence({ ...f, mode: "diagnostic" });
  for (const word of ["Buganda", "Baganda", "Muganda", "Luganda"]) {
    assert.ok(r.cards[0].visibleText.includes(word));
    assert.ok(r.cards[0].alt.includes(word));
  }
});

test("recovery refuses an incomplete fit record and changed design dependencies", async (t) => {
  const f = await fixture(t);
  const copy = join(f.root, "design");
  await cp(design, copy, { recursive: true });
  f.design = copy;
  const r = await renderSequence(f);
  const path = join(f.output, "report.json");
  const original = structuredClone(r);
  r.cards[0].fit = { ok: true };
  await writeFile(path, JSON.stringify(r));
  await assert.rejects(verifyOutput(f), /fit|layout|report/i);
  await writeFile(path, JSON.stringify(original));
  const css = join(copy, "components/bundle.css");
  await writeFile(css, (await readFile(css, "utf8")) + "\n");
  await assert.rejects(verifyOutput(f), /dependency|design|stale/i);
});

test("the review page opens at phone width and keeps each card's alternative text", async (t) => {
  const f = await fixture(t);
  const r = await renderSequence(f);
  const html = await readFile(join(f.output, "review.html"), "utf8");
  assert.match(html, /320/);
  assert.match(html, /375/);
  assert.match(html, /430/);
  assert.match(html, /600/);
  assert.match(html, /470/);
  assert.ok(html.includes("01.png"));
  assert.ok(html.includes(r.cards[0].alt.slice(0, 20)));
});

test("unsafe map geometry is refused before it becomes SVG markup", async (t) => {
  const d = single("map-a");
  d.cards[0].map.areas[0].paths = ['M0,0\" onload=\"throw 1'];
  const f = await fixture(t, d);
  await assert.rejects(
    renderSequence({ ...f, mode: "diagnostic" }),
    /geometry|SVG/i
  );
});
