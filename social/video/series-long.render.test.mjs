// @req REQ-186
// The long series video (Cartes 1.7.0) drawn in the pinned Chromium, on the
// long demonstration: the chapter card, the chapter kicker, readings and
// figures above y 1290, the quoted person above the subtitles, the signed
// card, the source label, the next episode under the pill, and no break
// inside a hyphenated word. Every frame keeps its texts in their bands.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkSeriesLayout,
  loadSeriesVideo,
  seriesFrameCount,
} from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { longDemo } from "./fixtures/series-long.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-long-render-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));
const seq = loadSeriesVideo(longDemo(dir), { dir });
const at = (id) => seq.cards.findIndex((c) => c.id === id);
// A card at full opacity near its end, once everything has entered.
const late = (id) => seq.cardStarts[at(id) + 1] - 12;
// Two seconds in: the dots, « 1 sur 3 » and the title have all entered.
const chapterFrame = seq.cardStarts[at("chapitre-1")] + 60;
// Before the title's entrance: the line and the dots only.
const chapterEarly = seq.cardStarts[at("chapitre-1")] + 15;
const keyFrames = [
  chapterFrame,
  chapterEarly,
  late("serie-afrique-tout-02"),
  late("serie-afrique-tout-04"),
  late("serie-afrique-tout-02-cite"),
  late("serie-afrique-tout-rappel"),
  late("serie-afrique-tout-06"),
  seriesFrameCount(seq) - 1,
];
let frames;
// @req REQ-186
test.before(async () => {
  frames = await renderSeriesFrames(seq, keyFrames, { diagnose: true });
});
const frameAt = (f) => frames[keyFrames.indexOf(f)];
const flat = (t) => t.replace(/\s+/gu, " ");

// @req REQ-186
test("1.7.0: every text of the long video stays in its band", () => {
  for (const f of frames)
    assert.deepEqual(
      checkSeriesLayout(f.boxes, { demo: true }),
      [],
      `frame ${f.frame}`
    );
});

// @req REQ-186
test("the chapter card (operator, 20 October 2026): « 1 sur 3 » then the title, centred on the dark ground, nothing else", () => {
  const f = frameAt(chapterFrame);
  const title = f.boxes.find((b) => b.kind === "chapter-title");
  assert.ok(title, "no chapter title box");
  const centre = title.x + title.w / 2;
  assert.ok(Math.abs(centre - 540) <= 3, `title centred at ${centre}`);
  assert.ok(title.x >= 59.5 && title.x + title.w <= 1020.5, `x ${title.x}`);
  assert.ok(title.y >= 940 && title.y + title.h <= 1300, `y ${title.y}`);
  const count = f.boxes.find((b) => b.kind === "chapter-count");
  assert.ok(count, "no « 1 sur 3 » box");
  // The title sits well clear of « 1 sur 3 », never against it.
  assert.ok(title.y - (count.y + count.h) >= 60, "title against the count");
  assert.match(flat(f.text), /1 sur 3/);
  assert.match(flat(f.text), /Un continent entier/);
  assert.ok(
    !f.boxes.some((b) =>
      ["subtitle", "source", "credit", "image"].includes(b.kind)
    )
  );
  // The band and the signature leave the frame to the chapter card.
  assert.equal(f.chrome, 0);
});

// @req REQ-186
test("the enriched chapter card (board S14): the video's title on top, the next chapter under the title", () => {
  const f = frameAt(chapterFrame);
  const video = f.boxes.find((b) => b.kind === "chapter-video");
  assert.ok(video, "no reminder of the video's title");
  assert.ok(video.y >= 290 && video.y + video.h <= 460, `y ${video.y}`);
  assert.ok(
    flat(f.text).includes(flat(seq.cards[0].title.replace(/\*/gu, ""))),
    "the opener's title"
  );
  const near = f.boxes.filter((b) => b.kind === "chapter-near");
  // Chapter 1 of 3: no chapter before it, « 2 · D'où vient le mot » after.
  assert.equal(near.length, 1);
  assert.match(flat(f.text), /2 · D’où vient le mot|2 · D'où vient le mot/u);
  const title = f.boxes.find((b) => b.kind === "chapter-title");
  assert.ok(near[0].y >= title.y + title.h + 20, "under the title");
});

// @req REQ-186
test("the chapter card animates: the title is not yet in 0.5 s after the card starts", () => {
  const f = frameAt(chapterEarly);
  const title = f.boxes.find((b) => b.kind === "chapter-title");
  assert.ok(!title, "the title is already visible");
});

// @req REQ-186
test("1.7.0: the chapter kicker, and « Nous pensons » with « Position d'EthniAfrica » on the signed card", () => {
  assert.match(
    flat(frameAt(late("serie-afrique-tout-02")).text),
    /1 · Un continent entier/
  );
  const signed = flat(frameAt(late("serie-afrique-tout-06")).text);
  assert.match(signed, /Nous pensons/);
  assert.match(signed, /Position d'EthniAfrica/);
  assert.doesNotMatch(signed, /Source :/);
});

// @req REQ-186
test("1.7.0: readings and figures end above y 1290; the readings carry « Hypothèses »", () => {
  for (const id of ["serie-afrique-tout-02", "serie-afrique-tout-04"]) {
    const items = frameAt(late(id)).boxes.filter((b) => b.kind === "items");
    assert.equal(items.length, 3, id);
    for (const b of items)
      assert.ok(b.y + b.h <= 1290.5, `${id}: ${b.y + b.h}`);
  }
  assert.match(
    flat(frameAt(late("serie-afrique-tout-04")).text),
    /Hypothèses : /
  );
});

// @req REQ-186
test("1.7.0: the quoted person sits above the subtitles, bottom at y 1296", () => {
  const f = frameAt(late("serie-afrique-tout-02-cite"));
  const lines = f.boxes.filter((b) => b.kind === "attribution");
  assert.equal(lines.length, 2);
  const bottom = Math.max(...lines.map((b) => b.y + b.h));
  assert.ok(Math.abs(bottom - 1296) <= 1, `bottom ${bottom}`);
  assert.match(flat(f.text), /Florence Abena Dolphyne/);
});

// 40 px lower than 1.10.0's y 728: the invitation's third line (27 October
// 2026).
// @req REQ-186
test("1.10.0: the next episode under the pill, the block ending at y 768", () => {
  const end = frames.at(-1);
  assert.match(flat(end.text), /Prochain épisode : le pays des Noirs/);
  const block = end.boxes.filter(
    (b) => b.kind === "ending" || b.kind === "pill"
  );
  for (const b of block) assert.ok(b.y >= 317.5, `${b.id}: ${b.y}`);
  const bottom = Math.max(...block.map((b) => b.y + b.h));
  assert.ok(Math.abs(bottom - 768) <= 1, `the block ends at ${bottom}`);
});

// @req REQ-186
test("1.7.0: no line breaks inside a hyphenated word", () => {
  const reminder = frameAt(late("serie-afrique-tout-rappel"));
  assert.match(flat(reminder.text), /finit-il/);
  for (const f of frames)
    assert.deepEqual(f.hyphenBreaks, [], `frame ${f.frame}`);
});
