// @req REQ-186
// The Mega-Chad outline drawn in the Sahara map video. Two kinds of check:
// the tracing rules on small synthetic grids (no DEM needed), and the
// committed artefact itself. Regenerating the artefact from the real DEM is
// in shoreline.acceptance.test.mjs, since the DEM stays outside git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  traceShoreline,
  shorelineFeature,
  ringAreaKm2,
  coastOf,
} from "./shoreline.mjs";

const artefact = JSON.parse(
  readFileSync(new URL("./data/megachad-325m.geojson", import.meta.url))
);

// Chad basin, generous: the hydrological basin spans roughly 7–24° E and
// 5–24° N. Any vertex outside it means a line from another basin leaked in.
const CHAD_BASIN = { west: 7, east: 25, south: 5, north: 25 };
const LAKE_CHAD_TODAY = [14.3, 13.2];
const BODELE = [17.5, 16.8];
// Benue valley below the Mayo Kebbi spillway: lower than 325 m, but outside
// the Chad basin. The fill must stop at the spillway, not flow on.
const GAROUA_BENUE = [13.4, 9.3];

function insideRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

const polygons = (geometry) =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

function covers(geometry, point) {
  return polygons(geometry).some(
    ([outer, ...holes]) =>
      insideRing(point, outer) && !holes.some((h) => insideRing(point, h))
  );
}

function segmentsCross([a, b], [c, d]) {
  const orient = (p, q, r) =>
    Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return (
    orient(a, b, c) * orient(a, b, d) < 0 &&
    orient(c, d, a) * orient(c, d, b) < 0
  );
}

function selfCrossings(rings) {
  const edges = rings.flatMap((ring) =>
    ring.slice(1).map((p, i) => [ring[i], p])
  );
  let crossings = 0;
  for (let i = 0; i < edges.length; i++)
    for (let j = i + 1; j < edges.length; j++)
      if (segmentsCross(edges[i], edges[j])) crossings++;
  return crossings;
}

// A synthetic DEM, 1 unit per cell, north row first. Ground at 400 m with:
// a seeded basin at 300 m holding an island at 360 m; a pass at 324.99 m
// from the basin into an outer lowland at 200 m that reaches the grid edge
// (the spillway case); and a separate closed depression at 250 m.
function syntheticGrid() {
  const width = 60;
  const height = 40;
  const data = new Float32Array(width * height).fill(400);
  const set = (x0, x1, y0, y1, z) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) data[y * width + x] = z;
  };
  set(5, 25, 5, 25, 300);
  set(13, 16, 13, 16, 360);
  set(26, 26, 15, 15, 324.99);
  set(27, 59, 12, 18, 200);
  set(40, 50, 28, 35, 250);
  return { width, height, west: 0, north: 40, cell: 1, data };
}

// @req REQ-186
test("the trace keeps only the seeded basin and stops at its spillway", () => {
  const trace = traceShoreline(syntheticGrid(), {
    level: 325,
    seed: [15, 30],
  });
  const geometry = { type: "Polygon", coordinates: trace.rings };
  assert.ok(covers(geometry, [6.5, 30.5]), "basin floor is lake");
  assert.ok(!covers(geometry, [14.5, 25.5]), "the island is a hole");
  assert.ok(
    !covers(geometry, [45.5, 8.5]),
    "the closed depression is left out"
  );
  assert.ok(
    !covers(geometry, [40.5, 25.5]),
    "the lowland past the pass is left out"
  );
  assert.equal(trace.spill.elevation, 324.99);
  assert.deepEqual([trace.spill.lon, trace.spill.lat], [26.5, 24.5]);
});

// @req REQ-186
test("a basin that never overflows reports no spillway", () => {
  const grid = syntheticGrid();
  for (let y = 12; y <= 18; y++) grid.data[y * grid.width + 26] = 400;
  const trace = traceShoreline(grid, { level: 325, seed: [15, 30] });
  assert.equal(trace.spill, null);
});

// @req REQ-186
test("a seed above the contour level is refused", () => {
  assert.throws(
    () => traceShoreline(syntheticGrid(), { level: 325, seed: [1, 39] }),
    /seed/i
  );
});

// @req REQ-186
test("the same grid gives byte-identical output", () => {
  const options = {
    level: 325,
    seed: [15, 30],
    tolerance: 0.2,
    minHoleKm2: 0,
    provenance: { generated: "2026-10-12" },
  };
  const first = JSON.stringify(shorelineFeature(syntheticGrid(), options));
  const again = JSON.stringify(shorelineFeature(syntheticGrid(), options));
  assert.equal(first, again);
});

// @req REQ-186
test("the artefact is closed rings inside the Chad basin", () => {
  assert.equal(artefact.type, "Feature");
  assert.ok(["Polygon", "MultiPolygon"].includes(artefact.geometry.type));
  for (const rings of polygons(artefact.geometry))
    for (const ring of rings) {
      assert.ok(ring.length >= 4);
      assert.deepEqual(ring[0], ring.at(-1), "ring is closed");
      for (const [lon, lat] of ring) {
        assert.ok(lon >= CHAD_BASIN.west && lon <= CHAD_BASIN.east, `${lon}`);
        assert.ok(lat >= CHAD_BASIN.south && lat <= CHAD_BASIN.north, `${lat}`);
        assert.equal(lon, Number(lon.toFixed(3)), "rounded to 0.001°");
        assert.equal(lat, Number(lat.toFixed(3)), "rounded to 0.001°");
      }
    }
});

// @req REQ-186
test("the artefact is the basin of present-day Lake Chad and the Bodélé", () => {
  assert.ok(covers(artefact.geometry, LAKE_CHAD_TODAY));
  assert.ok(covers(artefact.geometry, BODELE));
  assert.ok(!covers(artefact.geometry, GAROUA_BENUE));
  assert.equal(selfCrossings(polygons(artefact.geometry).flat()), 0);
});

// @req REQ-186
test("the artefact records where it comes from", () => {
  const p = artefact.properties;
  assert.equal(p.contour.level_m, 325);
  assert.equal(p.contour.uncertainty_m, 5);
  assert.equal(p.source.doi, "10.1016/j.palaeo.2006.01.003");
  assert.match(p.source.citation, /Leblanc/);
  assert.match(p.source.passage, /325 ± 5 m/);
  assert.equal(p.dem.name, "ETOPO 2022 Global Relief Model");
  assert.equal(p.dem.version, "v1");
  assert.equal(p.dem.resolution, "60 arc-seconds");
  assert.match(p.dem.url, /^https:\/\/www\.ngdc\.noaa\.gov\//);
  assert.equal(
    p.dem.sha256,
    "9d27d4b8ea8e76977e2988bca667d7c8fa68b927355feffcddd6b4875a7fd08e"
  );
  assert.equal(p.dem.doi, "10.25921/fd45-gt74");
  assert.match(p.dem.licence, /CC0/);
  assert.equal(p.script, "social/video/shoreline.mjs");
  assert.match(p.generated, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(p.selection.rule, /Lake Chad/);
});

// @req REQ-186
test("the recorded area and vertex count match the geometry", () => {
  const p = artefact.properties;
  const area = polygons(artefact.geometry).reduce(
    (sum, [outer, ...holes]) =>
      sum + ringAreaKm2(outer) - holes.reduce((s, h) => s + ringAreaKm2(h), 0),
    0
  );
  assert.equal(p.area_km2, Math.round(area / 100) * 100);
  const vertices = polygons(artefact.geometry)
    .flat()
    .reduce((n, ring) => n + ring.length - 1, 0);
  assert.equal(p.vertices, vertices);
});

// Cartes 1.13.0, the era map's coast: two countries side by side on a sea.
// Their shared border is no coast; the six outer edges are, joined.
// @req REQ-186
test("1.13.0: the era map's coast is every edge one country owns, never a shared border", () => {
  const square = (x0, x1) => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [x0, 0],
          [x1, 0],
          [x1, 1],
          [x0, 1],
          [x0, 0],
        ],
      ],
    },
  });
  const world = {
    type: "FeatureCollection",
    features: [square(0, 1), square(1, 2)],
  };
  const { lines, land } = coastOf(world, [-1, 3, -1, 2]);
  assert.equal(land.length, 2);
  const edges = lines.flatMap((l) =>
    l.slice(1).map((p, i) =>
      [l[i], p]
        .map((q) => q.join(","))
        .sort()
        .join("|")
    )
  );
  assert.equal(edges.length, 6);
  assert.ok(!edges.includes("1,0|1,1"), "the shared border is no coast");
  // Outside the bounds, nothing.
  assert.deepEqual(coastOf(world, [5, 6, 5, 6]), { lines: [], land: [] });
});
