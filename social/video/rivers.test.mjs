// @req REQ-186
// The committed river paths of the drawn marks (Cartes 1.13.0, series.md
// « 7. Drawn marks »): each loads, runs from its source to its mouth and
// carries its provenance. No download is needed; rivers.acceptance.test.mjs
// rebuilds them from the pinned Natural Earth file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RIVERS, loadRiver } from "./rivers.mjs";

const near = ([ax, ay], [bx, by]) => Math.hypot(bx - ax, by - ay) <= 1;

// @req REQ-186
test("every river loads as one line from its source to its mouth", () => {
  for (const spec of RIVERS) {
    const river = loadRiver(spec.id);
    assert.equal(river.name, spec.name);
    assert.ok(near(river.points[0], spec.source), `${spec.id} source`);
    assert.ok(near(river.points.at(-1), spec.mouth), `${spec.id} mouth`);
    assert.ok(
      river.points.length >= 10 && river.points.length <= 1000,
      `${spec.id}: ${river.points.length} vertices`
    );
    for (const [lon, lat] of river.points)
      assert.ok(Number.isFinite(lon) && Number.isFinite(lat));
  }
});

// The Niger runs some 4,000 km: its path is the main stem, not a branch.
// @req REQ-186
test("the Niger's path is its main stem, over 30° long", () => {
  const { points } = loadRiver("niger");
  const length = points.reduce(
    (n, p, i) =>
      i ? n + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0,
    0
  );
  assert.ok(length > 30, `${length.toFixed(1)}°`);
});

// The Congo is the Lualaba from Katanga, then the Congo past Kisangani:
// one chain, its long arc crossing the equator twice.
// @req REQ-186
test("the Congo's path runs from the Lualaba's source to the Congo's mouth, over 25° long", () => {
  const { points, name } = loadRiver("congo");
  assert.equal(name, "Congo");
  const length = points.reduce(
    (n, p, i) =>
      i ? n + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0,
    0
  );
  assert.ok(length > 25, `${length.toFixed(1)}°`);
  assert.ok(
    points.some(([, lat]) => lat > 0),
    "north of the equator"
  );
});

// @req REQ-186
test("an unknown river is refused", () => {
  assert.throws(
    () => loadRiver("nil"),
    /Fleuve absent de social\/video\/data\/rivers : nil/
  );
  assert.throws(() => loadRiver("../areas/sahara"), /Fleuve absent/);
});
