// @req REQ-186
// Regenerates the Sahara video's approximate areas from the pinned Natural
// Earth files and compares them with the committed files. The downloads are
// not in git: point ETHNIAFRICA_VIDEO_ASSETS at their folder. A missing
// folder fails; it is never reported as a pass.
//
// The designer's hand-drawn placeholder (sahara-areas-mock.json, design
// 0.4.0) is checked too when ETHNIAFRICA_VIDEO_AREAS_MOCK points at it: no
// committed area may reuse its vertices. Without the variable that check is
// reported as skipped, not passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AREA_IDS, OUTPUT_DIR, buildAreas, readVerified } from "./areas.mjs";

const verticesOf = (geometry) =>
  geometry.coordinates.flat(geometry.type === "MultiPolygon" ? 2 : 1);

const committed = (id) =>
  readFile(new URL(`${id}.geojson`, OUTPUT_DIR), "utf8");

// @req REQ-186
test("the committed areas are what the pinned sources give, byte for byte", async () => {
  const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
  assert.ok(
    assets,
    "Set ETHNIAFRICA_VIDEO_ASSETS to the verified assets folder"
  );
  const built = await buildAreas(assets);
  assert.deepEqual([...built.keys()].sort(), [...AREA_IDS].sort());
  for (const id of AREA_IDS)
    assert.equal(built.get(id), await committed(id), id);
});

// The CIV/GHA border must be Natural Earth's line in both country areas, so
// it is the same line wherever the episode draws it.
// @req REQ-186
test("Côte d'Ivoire and Ghana are Natural Earth's polygons, rounded to 0.01°", async () => {
  const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
  assert.ok(
    assets,
    "Set ETHNIAFRICA_VIDEO_ASSETS to the verified assets folder"
  );
  const countries = await readVerified(assets, "countries");
  const round = (x) => Math.round(x * 100) / 100;
  // Rounding can make neighbouring vertices equal; the file keeps one.
  const roundedRing = (ring) =>
    ring
      .map(([lon, lat]) => [round(lon), round(lat)])
      .filter(
        (p, i, all) =>
          i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]
      );
  const rounded = ({ type, coordinates }) =>
    type === "Polygon"
      ? coordinates.map(roundedRing)
      : coordinates.map((p) => p.map(roundedRing));
  for (const [id, a3] of [
    ["yk-cote-divoire", "CIV"],
    ["yk-ghana", "GHA"],
  ]) {
    const ne = countries.features.find((f) => f.properties.ADM0_A3 === a3);
    const { geometry } = JSON.parse(await committed(id));
    assert.equal(geometry.type, ne.geometry.type, id);
    // Compared as JSON text: the file cannot hold -0, which rounding yields.
    assert.equal(
      JSON.stringify(geometry.coordinates),
      JSON.stringify(rounded(ne.geometry)),
      id
    );
  }
});

// @req REQ-186
test("no committed area reuses the mock-up's vertices", async (t) => {
  const mockPath = process.env.ETHNIAFRICA_VIDEO_AREAS_MOCK;
  if (!mockPath) {
    t.skip("ETHNIAFRICA_VIDEO_AREAS_MOCK is not set: mock-up not compared");
    return;
  }
  const mock = JSON.parse(await readFile(mockPath, "utf8"));
  const key = ([lon, lat]) => `${lon.toFixed(2)},${lat.toFixed(2)}`;
  const mockVertices = new Set(
    mock.features.flatMap((f) => verticesOf(f.geometry)).map(key)
  );
  for (const id of AREA_IDS) {
    const { geometry } = JSON.parse(await committed(id));
    const vertices = verticesOf(geometry);
    const shared = vertices.filter((v) => mockVertices.has(key(v)));
    // A few coincidences on a 0.01° lattice are possible; a traced copy
    // would share most of its vertices.
    assert.ok(
      shared.length <= Math.max(3, vertices.length * 0.02),
      `${id} shares ${shared.length} of ${vertices.length} vertices with the mock-up`
    );
  }
});
