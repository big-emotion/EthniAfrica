// @req REQ-186
import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutFor, sourceRect, toReelPoint } from "./layout.mjs";

test("a wide source takes the band gabarit of the interview reels", () => {
  assert.equal(layoutFor(1280, 720).name, "band");
});

test("a tall source takes the full-height gabarit of the « sauvage » reel", () => {
  assert.equal(layoutFor(1080, 1920).name, "portrait");
  assert.equal(layoutFor(720, 1280).name, "portrait");
});

test("a 16:9 source fills the band edge to edge", () => {
  assert.deepEqual(sourceRect(layoutFor(1280, 720), 1280, 720), {
    x: 0,
    y: 336,
    w: 1080,
    h: 608,
  });
});

test("a 4:3 archive keeps its proportions, centred in the band", () => {
  assert.deepEqual(sourceRect(layoutFor(640, 480), 640, 480), {
    x: 135,
    y: 336,
    w: 810,
    h: 608,
  });
});

test("a 9:16 source fills the portrait frame measured on the published reel", () => {
  assert.deepEqual(sourceRect(layoutFor(1080, 1920), 1080, 1920), {
    x: 96,
    y: 96,
    w: 888,
    h: 1578,
  });
});

test("a point given as a fraction of the source frame lands on the reel", () => {
  const rect = { x: 96, y: 96, w: 888, h: 1578 };
  assert.deepEqual(toReelPoint(rect, 0.5, 0.25), { x: 540, y: 491 });
});
