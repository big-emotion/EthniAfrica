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

// @req REQ-186
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

// @req REQ-186
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

// @req REQ-186
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

// @req REQ-186
test("overflow is refused and partial output is removed", async (t) => {
  const d = single("overflow");
  delete d.cards[0].demo;
  const f = await fixture(t, d);
  await assert.rejects(renderSequence(f), /overflow|layout|fit/i);
  await assert.rejects(access(f.output));
});

// @req REQ-186
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

// @req REQ-186
test("missing fonts fail before capture", async (t) => {
  const f = await fixture(t);
  const copy = join(f.root, "design");
  await cp(design, copy, { recursive: true });
  await rm(join(copy, "fonts/Anton-Regular.ttf"));
  await assert.rejects(renderSequence({ ...f, design: copy }), /font|ENOENT/i);
});

// @req REQ-186
test("proof retains demo tape; final mode refuses it", async (t) => {
  const f = await fixture(t, single("seq-1"));
  await assert.rejects(renderSequence(f), /demo/i);
  const r = await renderSequence({ ...f, mode: "proof" });
  assert.equal(r.mode, "proof");
  assert.equal(r.cards[0].demo, true);
  assert.equal(r.productionReady, false);
});

// @req REQ-186
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

// @req REQ-186
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

// @req REQ-186
test("inline accents preserve complete African names in text and alternative text", async (t) => {
  const f = await fixture(t, single("seq-4"));
  const r = await renderSequence({ ...f, mode: "diagnostic" });
  for (const word of ["Buganda", "Baganda", "Muganda", "Luganda"]) {
    assert.ok(r.cards[0].visibleText.includes(word));
    assert.ok(r.cards[0].alt.includes(word));
  }
});

// @req REQ-186
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

// @req REQ-186
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

// @req REQ-186
test("1.2.0 filled maps take dotted borders; unknown layers stay refused", () => {
  for (const id of ["atlas-1914", "atlas-independances"])
    assert.doesNotThrow(() =>
      validateInput(single(id), "diagnostic", samples.version)
    );
  const zigzag = single("atlas-1914");
  zigzag.cards[0].map.borders = "zigzag";
  assert.throws(
    () => validateInput(zigzag, "diagnostic", samples.version),
    /border/i
  );
  const unbordered = single("map-fula");
  unbordered.cards[0].map.borders = "none";
  assert.throws(
    () => validateInput(unbordered, "diagnostic", samples.version),
    /borders/i
  );
});

// @req REQ-186
test("an atlas map with collisions is refused outside diagnostic mode", async (t) => {
  const d = single("atlas-proto-collisions");
  const f = await fixture(t, d);
  const r = await renderSequence({ ...f, mode: "diagnostic" });
  assert.equal(r.cards[0].fit.collisions, 25);
  const proof = await fixture(t, d);
  await assert.rejects(
    renderSequence({ ...proof, mode: "proof" }),
    /Chevauchements|collision/i
  );
  await assert.rejects(access(proof.output));
  const undemo = structuredClone(d);
  delete undemo.cards[0].demo;
  const final = await fixture(t, undemo);
  await assert.rejects(renderSequence(final), /Chevauchements|collision/i);
  await assert.rejects(access(final.output));
});

// @req REQ-186
test("recovery refuses a report carrying collisions or atlas warnings", async (t) => {
  const f = await fixture(t, single("atlas-1880"));
  const r = await renderSequence({ ...f, mode: "proof" });
  assert.equal(r.cards[0].fit.collisions, 0);
  const path = join(f.output, "report.json");
  const original = structuredClone(r);
  r.cards[0].fit.collisions = 2;
  await writeFile(path, JSON.stringify(r));
  await assert.rejects(verifyOutput(f), /collision/i);
  const minGap = structuredClone(original);
  minGap.cards[0].fit.atlas.minGap = 20;
  await writeFile(path, JSON.stringify(minGap));
  await assert.rejects(verifyOutput(f), /atlas/i);
  await writeFile(path, JSON.stringify(original));
  assert.equal((await verifyOutput(f)).cards.length, 1);
});

// @req REQ-186
test("atlas alternative text names regional keys, territories, marks and the period", async (t) => {
  const alt = async (id) => {
    const f = await fixture(t, single(id));
    return (await renderSequence({ ...f, mode: "diagnostic" })).cards[0].alt;
  };
  const card = (id) => samples.cards.find((c) => c.id === id);
  const a1880 = await alt("atlas-1880");
  assert.match(a1880, /Repère de période : 1880/);
  assert.match(a1880, /Ouest : /);
  for (const e of card("atlas-1880").map.atlas.entries.slice(0, 5))
    assert.ok(a1880.includes(e.name.replace(/\*/g, "")), e.name);
  assert.ok(!/(^|\. )\d+\. \d+\./.test(a1880), "bare key numbers in alt");
  const a1914 = await alt("atlas-1914");
  for (const cl of card("atlas-1914").map.categorical.classes)
    assert.ok(a1914.includes(cl.label), cl.label);
  const zone = card("atlas-1914").map.categorical.zones.find(
    (z) => z.label !== false
  );
  assert.ok(a1914.includes(zone.name.replace(/\n/g, " ")), zone.name);
  const indep = await alt("atlas-independances");
  assert.match(indep, /Jamais colonisé/);
  for (const mk of card("atlas-independances").map.marks.filter(
    (m) => m.legend
  ))
    assert.ok(indep.includes(mk.legend), mk.legend);
});

// @req REQ-186
test("unsafe atlas geometry is refused before it becomes SVG markup", async (t) => {
  const d = single("atlas-1880");
  const entry = d.cards[0].map.atlas.entries.find((e) => e.zone);
  entry.zone.cx = '1" onload="throw 1';
  const f = await fixture(t, d);
  await assert.rejects(
    renderSequence({ ...f, mode: "diagnostic" }),
    /geometry/i
  );
});

// @req REQ-186
test("unsafe map geometry is refused before it becomes SVG markup", async (t) => {
  const d = single("map-a");
  d.cards[0].map.areas[0].paths = ['M0,0\" onload=\"throw 1'];
  const f = await fixture(t, d);
  await assert.rejects(
    renderSequence({ ...f, mode: "diagnostic" }),
    /geometry|SVG/i
  );
});

// The seven names as `EthniCards.SERIES` prints them (social/design-system/series.md).
const SERIES_NAMES = {
  pays: "D'où vient le nom de mon pays ?",
  "nom-recu": "Le nom qu'on leur a donné",
  "nom-famille": "Mon nom, mon histoire",
  mots: "Les mots qu'on nous a collés",
  frontieres: "Un peuple, plusieurs pays",
  "afrique-tout": "L'Afrique n'est pas un tout",
  villes: "Ce que les villes racontent",
};
const finalOf = (card) => {
  const d = single(card.id);
  d.cards[0] = { ...card, folio: "01/01" };
  delete d.cards[0].demo;
  return d;
};

// @req REQ-186
test("1.3.0: final mode refuses a series card that breaks a band rule", async (t) => {
  const withSeries = (id) => ({
    ...structuredClone(samples.cards.find((c) => c.id === id)),
    series: { id: "pays", episode: 2 },
  });
  // seq-4's 870 px panel fits 900, not a series card's 828.
  const tall = withSeries("seq-4");
  const twoLines = withSeries("serie-pays-02");
  twoLines.series.name =
    "Une série au nom beaucoup trop long pour tenir sur une seule ligne du bandeau";
  const focus = withSeries("serie-pays-02");
  focus.image.focus = [0.5, 0.02];
  focus.image.anchor = [0.5, 0.02];
  // 1914 keeps « Tunisie » near the top: under a band it is closer than 12 px.
  const nearBand = withSeries("atlas-1914");
  for (const [card, reason] of [
    [tall, /maximum 828/],
    [twoLines, /deux lignes/],
    [focus, /point focal/],
    [nearBand, /12 px du bandeau/],
  ]) {
    const f = await fixture(t, finalOf(card));
    await assert.rejects(renderSequence(f), reason);
    await assert.rejects(access(f.output));
  }
});

// @req REQ-186
test("1.3.0: an unknown series is an engine error in every mode", async (t) => {
  const d = single("serie-pays-02");
  d.cards[0].series = { id: "inconnue", episode: 1 };
  const f = await fixture(t, d);
  await assert.rejects(
    renderSequence({ ...f, mode: "diagnostic" }),
    /Série inconnue/
  );
});

// @req REQ-186
test("1.3.0: an « image à trouver » slot is a mock-up and cannot be exported as final", () => {
  const d = finalOf(samples.cards.find((c) => c.id === "serie-pays-03"));
  assert.match(d.cards[0].image.src, /a-trouver-/);
  assert.throws(
    () => validateInput(d, "final", samples.version),
    /image à trouver/
  );
  d.cards[0].demo = "Démonstration : texte non validé";
  assert.doesNotThrow(() => validateInput(d, "proof", samples.version));
});

// @req REQ-186
test("1.3.0: recovery refuses a series card over 828 px or with a two-line band", async (t) => {
  const f = await fixture(t, single("serie-pays-02"));
  const r = await renderSequence({ ...f, mode: "proof" });
  assert.equal(r.cards[0].fit.panelMax, 828);
  const path = join(f.output, "report.json");
  const original = structuredClone(r);
  r.cards[0].fit.panelHeight = 850;
  await writeFile(path, JSON.stringify(r));
  await assert.rejects(verifyOutput(f), /layout/i);
  const wrapped = structuredClone(original);
  wrapped.cards[0].fit.series.lines = 2;
  await writeFile(path, JSON.stringify(wrapped));
  await assert.rejects(verifyOutput(f), /layout/i);
  await writeFile(path, JSON.stringify(original));
  assert.equal((await verifyOutput(f)).cards.length, 1);
});

// @req REQ-186
test("1.3.0: every series sample fits, on a one-line band, under 828 px, with the band opening its alternative text", async (t) => {
  const cards = samples.cards.filter((c) => c.series);
  assert.equal(cards.length, 51);
  const f = await fixture(t, {
    version: samples.version,
    logo: samples.logo,
    cards,
  });
  const r = await renderSequence({ ...f, mode: "diagnostic" });
  for (const [i, card] of r.cards.entries()) {
    const spec = cards[i];
    assert.deepEqual(card.fit.warnings, [], card.id);
    assert.equal(card.fit.ok, true, card.id);
    assert.equal(card.fit.series.lines, 1, card.id);
    assert.equal(card.fit.panelMax, 828, card.id);
    assert.ok(card.fit.panelHeight <= 828, card.id);
    const band = `${spec.series.name || SERIES_NAMES[spec.series.id]}, n° ${spec.series.episode}`;
    assert.ok(
      card.alt.startsWith(band),
      `${card.id}: ${card.alt.slice(0, 80)}`
    );
  }
});
