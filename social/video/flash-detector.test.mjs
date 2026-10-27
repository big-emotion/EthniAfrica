// @req REQ-186
// The flash detector (flash-detector.mjs) on synthetic frames: a light that
// rises and falls once is one flash; three on and off in a second are three;
// a slow fade or a change over a small area is none.
import { test } from "node:test";
import assert from "node:assert/strict";
import { flashesPerSecond } from "./flash-detector.mjs";

const W = 60;
const H = 60;
const frame = (value, area = 1) => {
  const b = Buffer.alloc(W * H * 3, 20);
  for (let y = 0; y < Math.round(H * area); y++)
    b.fill(value, y * W * 3, (y + 1) * W * 3);
  return b;
};

// @req REQ-186
test("a light that rises in 4 frames and falls in 11 is one flash", () => {
  const values = [
    20, 20, 90, 160, 220, 240, 220, 190, 160, 130, 100, 80, 60, 40, 20, 20,
  ];
  const { flashes, most } = flashesPerSecond(
    values.map((v) => frame(v)),
    W,
    H
  );
  assert.equal(flashes, 1);
  assert.equal(most, 1);
});

// @req REQ-186
test("three flashes in a second are counted as three", () => {
  const values = [20, 240, 20, 240, 20, 240, 20, 20, 20, 20];
  const { most } = flashesPerSecond(
    values.map((v) => frame(v)),
    W,
    H
  );
  assert.equal(most, 3);
});

// @req REQ-186
test("a slow fade, or a change on a small part of the frame, is no flash", () => {
  const slow = Array.from({ length: 30 }, (_, k) => frame(20 + k * 2));
  assert.equal(flashesPerSecond(slow, W, H).flashes, 0);
  const small = [20, 240, 20, 240, 20].map((v) => frame(v, 0.2));
  assert.equal(flashesPerSecond(small, W, H).flashes, 0);
});
