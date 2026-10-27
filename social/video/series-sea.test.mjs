// @req REQ-186
// A sea voyage never crosses land (operator, 27 October 2026: « le chemin
// traverse la terre africaine »). A route or arrow marked `sea` is checked
// segment by segment, its curve sampled as it is drawn on screen, against
// the land; only its two ends may touch the coast. Synthetic land here; the
// series' maps check against Natural Earth's countries when they render.
import { test } from "node:test";
import assert from "node:assert/strict";
import { landPolygons, seaRouteOnLand, checkSeaRoute } from "./series-sea.mjs";

// A square island from 0° to 10° in longitude and latitude.
const island = landPolygons({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      },
    },
  ],
});
const camera = { lon: 5, lat: 5, radius: 3000, centreY: 1010 };

// @req REQ-186
test("a route round the coast at sea passes", () => {
  const around = {
    from: [-2, 5],
    via: [
      [-2, -2],
      [5, -2],
    ],
    to: [12, -2],
    bend: 0,
  };
  assert.equal(seaRouteOnLand(around, [camera], island), null);
});

// @req REQ-186
test("a route across the land is refused, naming the segment that crosses it", () => {
  const across = {
    from: [-2, 5],
    via: [
      [-2, -2],
      [12, 8],
    ],
    to: [12, 12],
    bend: 0,
  };
  const hit = seaRouteOnLand(across, [camera], island);
  assert.ok(hit);
  assert.equal(hit.segment, 2);
  assert.deepEqual(hit.from, [-2, -2]);
  assert.deepEqual(hit.to, [12, 8]);
  assert.throws(
    () => checkSeaRoute("Card c, route r", across, [camera], island),
    /Card c, route r: Route maritime sur la terre : le segment 2 \(-2, -2 → 12, 8\) traverse la terre près de -?\d/
  );
});

// @req REQ-186
test("its two ends may touch the coast, nothing in between", () => {
  const coastToCoast = {
    from: [0, 5],
    via: [
      [-1, 5],
      [-1, -1],
      [5, -1],
    ],
    to: [5, 0],
    bend: 0,
  };
  assert.equal(seaRouteOnLand(coastToCoast, [camera], island), null);
  // The same, its last stop drawn well inland.
  const inland = { ...coastToCoast, to: [5, 3] };
  assert.equal(seaRouteOnLand(inland, [camera], island).segment, 4);
});

// @req REQ-186
test("a curve is checked as drawn: a bend that cuts into the land is refused", () => {
  const straight = { from: [-1, 1], to: [-1, 9], bend: 0 };
  assert.equal(seaRouteOnLand(straight, [camera], island), null);
  // Bent towards the island (east, a positive bend here) by 30 % of its length.
  const bent = { ...straight, bend: 0.3 };
  assert.equal(seaRouteOnLand(bent, [camera], island).segment, 1);
});
