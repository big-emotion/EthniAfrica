// @req REQ-186
// The document card and the teaching cards (Cartes 1.8.0) drawn in the pinned
// Chromium, on the two demonstrations of fixtures/series-documents.mjs: the
// page drawn twice (blurred by 7 px, sharp under the passage's band), the
// page's edge on dark ground, the underline under each mark entering on its
// word, the foot's one source line, the formula's lines in 960 px, and the
// side-by-side forms and week table above y 1290. Every text keeps its band.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { checkSeriesLayout, loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import {
  documentDemo,
  teachingDemo,
  PASSAGES,
} from "./fixtures/series-documents.mjs";

const root = mkdtempSync(join(tmpdir(), "series-documents-render-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));
const build = (demo, name) => {
  const dir = join(root, name);
  return loadSeriesVideo(demo(dir), { dir });
};
const docs = build(documentDemo, "documents");
const teach = build(teachingDemo, "teaching");
const at = (seq, id) => seq.cards.findIndex((c) => c.id === id);
const first = (seq, id) => seq.cardStarts[at(seq, id)];
const late = (seq, id) => seq.cardStarts[at(seq, id) + 1] - 12;

const docFrames = {
  openerStart: 1,
  middleBefore: docs.cards[at(docs, "serie-mots-02")].markFrame - 1,
  middleLate: late(docs, "serie-mots-02"),
  topStart: first(docs, "serie-mots-03"),
  topLate: late(docs, "serie-mots-03"),
};
const teachFrames = {
  formulaLate: late(teach, "serie-nom-famille-03"),
  sbsStart: first(teach, "serie-nom-famille-04"),
  sbsLate: late(teach, "serie-nom-famille-04"),
  weekStart: first(teach, "serie-nom-famille-06"),
  weekLate: late(teach, "serie-nom-famille-06"),
};
let drawn;
// @req REQ-186
test.before(async () => {
  const render = async (seq, frames) => {
    const out = await renderSeriesFrames(seq, Object.values(frames), {
      diagnose: true,
    });
    return Object.fromEntries(Object.keys(frames).map((k, i) => [k, out[i]]));
  };
  drawn = {
    ...(await render(docs, docFrames)),
    ...(await render(teach, teachFrames)),
  };
});
const pixel = async (png, x, y) => {
  const { data, info } = await sharp(png)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};
const flat = (t) => t.replace(/\s+/gu, " ");

// @req REQ-186
test("1.8.0: every text of the document and teaching cards stays in its band", () => {
  for (const [name, f] of Object.entries(drawn))
    assert.deepEqual(checkSeriesLayout(f.boxes, { demo: true }), [], name);
});

// @req REQ-186
test("1.8.0: the page is drawn twice, blurred by 7 px, and sharp in a band that contains the passage, zoom included", () => {
  for (const name of ["openerStart", "middleLate", "topStart", "topLate"]) {
    const [doc] = drawn[name].documents;
    assert.equal(doc.blur, "blur(7px)", name);
    const { passage, sharp } = doc;
    assert.ok(
      sharp.y <= passage.y && sharp.y + sharp.h >= passage.y + passage.h,
      name
    );
    assert.ok(passage.y - sharp.y >= 47.5, `${name}: ${passage.y - sharp.y}`);
  }
  // At the card's first frame the passage is centred on (540, 1000).
  const [top] = drawn.topStart.documents;
  assert.equal(top.edge, 400);
});

// @req REQ-186
test("1.8.0: near the page's top the frame shows its dark ground above the page, at most 400 px", async () => {
  const ground = await pixel(drawn.topStart.png, 1050, 120);
  ground.forEach((c, k) =>
    assert.ok(Math.abs(c - [11, 8, 6][k]) <= 2, `${ground}`)
  );
  const [doc] = drawn.topStart.documents;
  assert.ok(Math.abs(doc.page.y - 400) < 1, `page top ${doc.page.y}`);
  // The opener's margin brings the page to the frame's top: no edge.
  const [opener] = drawn.openerStart.documents;
  assert.ok(opener.edge < 1, `${opener.edge}`);
});

// @req REQ-186
test("1.8.0: the underline is 7 px under each mark, 5 px below it, in the accent ink, entering on its word", () => {
  const before = drawn.middleBefore.documents[0];
  assert.ok(before.marks.every((m) => m.opacity === 0));
  const [doc] = drawn.middleLate.documents;
  assert.equal(doc.marks.length, PASSAGES.middle.marks.length);
  const s = doc.scale * doc.zoom;
  doc.marks.forEach((m, k) => {
    const [, y, w, h] = PASSAGES.middle.marks[k];
    assert.equal(m.opacity, 1);
    assert.ok(Math.abs(m.h - 7 * doc.zoom) < 0.5, `height ${m.h}`);
    assert.ok(Math.abs(m.w - w * s) < 1, `width ${m.w}`);
    const below = m.y - (doc.page.y + (y + h) * s);
    assert.ok(Math.abs(below - 5 * doc.zoom) < 1, `gap ${below}`);
    assert.equal(m.color, doc.accent);
  });
});

// @req REQ-186
test("1.8.0: a document card's foot is one « Source : » line, a web capture's « Capture : », no credit", () => {
  const foot = (f) =>
    f.boxes.filter((b) => ["source", "credit"].includes(b.kind));
  const middle = foot(drawn.middleLate);
  assert.deepEqual(
    middle.map((b) => b.kind),
    ["source"]
  );
  assert.match(flat(drawn.middleLate.text), /Source : J\. H\. Speke/);
  assert.deepEqual(
    foot(drawn.openerStart).map((b) => b.kind),
    ["source"]
  );
  assert.match(flat(drawn.openerStart.text), /Capture : Speke, page 253/);
  assert.doesNotMatch(flat(drawn.openerStart.text), /Source :/);
});

// @req REQ-186
test("1.8.0: the formula's lines hold in 960 px at 120, 104 or 88 px, and end above y 1290", () => {
  const lines = drawn.formulaLate.boxes.filter((b) => b.kind === "formula");
  assert.ok(lines.length >= 5, `${lines.length} lines`);
  for (const b of lines) {
    assert.ok(b.x >= 59.5 && b.x + b.w <= 1020.5, `${b.id}: x ${b.x}`);
    assert.ok(b.y >= 699.5 && b.y + b.h <= 1290.5, `${b.id}: y ${b.y}`);
    if (b.size)
      assert.ok([120, 104, 88].includes(b.size), `${b.id}: ${b.size}`);
  }
  assert.match(flat(drawn.formulaLate.text), /garçon/);
  assert.match(flat(drawn.formulaLate.text), /Kwa\s*\+\s*ya\s*→\s*Yao/);
});

// @req REQ-186
test("1.8.0: side by side and the week table sit under the title, above y 1290, in places kept from the first frame", () => {
  for (const [startName, lateName] of [
    ["sbsStart", "sbsLate"],
    ["weekStart", "weekLate"],
  ]) {
    const items = (f) => drawn[f].boxes.filter((b) => b.kind === "items");
    const late = items(lateName);
    assert.ok(late.length >= 4, lateName);
    for (const b of late)
      assert.ok(b.y + b.h <= 1290.5, `${lateName}: ${b.id} ${b.y + b.h}`);
    // Places kept: every box drawn at the start sits where it sits late.
    for (const b of items(startName)) {
      const same = late.find((l) => l.id === b.id);
      assert.ok(same && Math.abs(same.y - b.y) < 0.5, `${startName}: ${b.id}`);
    }
  }
  assert.match(flat(drawn.sbsLate.text), /Kouassi · Akissi/);
  assert.match(flat(drawn.sbsLate.text), /Les Nzema nomment les jours/);
  assert.match(flat(drawn.weekLate.text), /garçon · fille/);
});

// @req REQ-186
test("1.8.0: nothing but the page itself paints a background over the image", () => {
  for (const [name, f] of Object.entries(drawn))
    assert.deepEqual(f.backgrounds, [], name);
});
