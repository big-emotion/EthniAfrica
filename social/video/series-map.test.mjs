// @req REQ-186
// The series video's map cards on satellite imagery (Cartes 1.4.1): the card
// units converted to longitude and latitude, the still top-down view fitted
// between the head and the foot within the imagery's scale limit, the
// Natural Earth highlight and shared borders, the names, the key and the
// credits. Pure geometry on small synthetic data; no browser, no imagery.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  baseMapProjection,
  cardPoint,
  pathCoordinates,
  mapPath,
  countryIndex,
  sharedBorders,
  fitMapCamera,
  seriesMapView,
  seriesMapCredits,
  checkSeriesMapCard,
  MAP_FRAME,
} from "./series-map.mjs";
import { checkSeriesLayout } from "./series.mjs";
import { project } from "./sequence.mjs";

const design = (p) =>
  JSON.parse(
    readFileSync(new URL(`../design-system/${p}`, import.meta.url), "utf8")
  );
const sample = design("handoff/cards.sample.json");
const card = (id) => structuredClone(sample.cards.find((c) => c.id === id));
const baseMap = (ref) => design(`assets/${ref}`);
// The verified Blue Marble file: 21600 px around the Earth.
const IMAGERY = { width: 21600, credit: "NASA Earth Observatory" };

// Two countries sharing one edge, a third alone on its island.
const square = (iso, name, x0, y0, s) => ({
  type: "Feature",
  properties: {
    ADM0_A3: iso,
    NAME_FR: name,
    LABEL_X: x0 + s / 2,
    LABEL_Y: y0 + s / 2,
  },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x0, y0],
        [x0 + s, y0],
        [x0 + s, y0 + s],
        [x0, y0 + s],
        [x0, y0],
      ],
    ],
  },
});
const WORLD = {
  type: "FeatureCollection",
  features: [
    square("CIV", "Côte d'Ivoire", -8, 5, 5),
    square("GHA", "Ghana", -3, 5, 5),
    square("STP", "Sao Tomé-et-Principe", 6, 0, 1),
  ],
};

// @req REQ-186
test("a base map's meta gives its projection, in both spellings", () => {
  assert.deepEqual(
    baseMapProjection(baseMap("Cartes/afrique-ouest.json").meta),
    { k: 19, lon0: -19, lat0: 30 }
  );
  assert.deepEqual(baseMapProjection(baseMap("Cartes/grands-lacs.json").meta), {
    k: 140,
    lon0: 28.45,
    lat0: 4.42,
  });
  assert.deepEqual(baseMapProjection(baseMap("Cartes/afrique.json").meta), {
    k: 12,
    lon0: -28,
    lat0: 38,
  });
  assert.throws(
    () => baseMapProjection({ projection: "Mercator" }),
    /projection/
  );
});

// @req REQ-186
test("card units become longitude and latitude: lon = λ0 + x / k, lat = φ0 − y / k", () => {
  const p = { k: 140, lon0: 28.45, lat0: 4.42 };
  const [lon, lat] = cardPoint(p, 140, 280);
  assert.ok(Math.abs(lon - 29.45) < 1e-9 && Math.abs(lat - 2.42) < 1e-9);
});

// @req REQ-186
test("every point of an area path converts, control points included", () => {
  const d = "M10,20C30,40 50,60 70,80L90,100Z";
  assert.deepEqual(pathCoordinates(d), [
    [10, 20],
    [30, 40],
    [50, 60],
    [70, 80],
    [90, 100],
  ]);
  assert.equal(
    mapPath(d, ([x, y]) => [x + 1, y * 2]),
    "M11,40C31,80 51,120 71,160L91,200Z"
  );
  assert.throws(() => pathCoordinates("M0,0l10,10"), /absolute/);
  assert.throws(() => pathCoordinates("M0,0H10"), /absolute/);
});

// @req REQ-186
test("the borders are the edges two countries share, never a coastline", () => {
  const lines = sharedBorders(WORLD, [-20, 20, -10, 20]);
  const points = lines.flat();
  assert.ok(points.length >= 2);
  assert.ok(
    points.every(([lon]) => lon === -3),
    JSON.stringify(lines)
  );
  const lats = points.map(([, lat]) => lat).sort((a, b) => a - b);
  assert.deepEqual([lats[0], lats.at(-1)], [5, 10]);
  // Outside the frame's bounds, nothing.
  assert.deepEqual(sharedBorders(WORLD, [10, 20, 10, 20]), []);
});

// @req REQ-186
test("countries are found by their Natural Earth code, with their French name", () => {
  const index = countryIndex(WORLD);
  assert.equal(index.get("CIV").name, "Côte d'Ivoire");
  assert.deepEqual(index.get("CIV").label, [-5.5, 7.5]);
  assert.equal(index.get("GHA").polygons.length, 1);
});

// @req REQ-186
test("the subject fills 840 × 520 around (540, 1010), between the head and the foot", () => {
  // About 1500 km by 900 km of West Africa: the fit, not the limit, decides.
  const box = { west: -12, east: 2, south: 4, north: 12 };
  const cam = fitMapCamera(box, IMAGERY);
  assert.equal(cam.capped, false);
  assert.equal(cam.centreY, MAP_FRAME.centre[1]);
  assert.ok(Math.abs(cam.lon + 5) < 1e-9 && Math.abs(cam.lat - 8) < 1e-9);
  const corners = [
    [box.west, box.south],
    [box.east, box.north],
    [box.west, box.north],
    [box.east, box.south],
  ].map(([lon, lat]) => project(cam, lon, lat));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  assert.ok(Math.min(...xs) >= 120 - 1 && Math.max(...xs) <= 960 + 1);
  assert.ok(Math.min(...ys) >= 750 - 1 && Math.max(...ys) <= 1270 + 1);
  assert.ok(
    Math.max(...xs) - Math.min(...xs) > 838 ||
      Math.max(...ys) - Math.min(...ys) > 518,
    "the subject fills its box on one side"
  );
});

// @req REQ-186
test("a small subject is drawn at the scale limit: 1.5 at most at 104 %", () => {
  // About 500 km across: it would fit closer than the imagery allows.
  const cam = fitMapCamera(
    { west: 29, east: 33.5, south: -1, north: 2 },
    IMAGERY
  );
  assert.equal(cam.capped, true);
  const scale = cam.radius * ((2 * Math.PI) / IMAGERY.width);
  assert.ok(scale * 1.04 <= 1.5 + 1e-9, `scale ${scale * 1.04} at 104 %`);
  assert.ok(scale * 1.04 > 1.49);
  assert.ok(cam.spanKm > 1380 && cam.spanKm < 1400, `${cam.spanKm} km`);
});

// @req REQ-186
test("a subject under 120 px at the limit is refused", () => {
  // A city, about 50 km across.
  assert.throws(
    () =>
      fitMapCamera({ west: 3.2, east: 3.6, south: 6.3, north: 6.7 }, IMAGERY),
    /Sujet trop petit pour l'imagerie vérifiée/
  );
});

// @req REQ-186
test("a highlighted country: its outline as a certain area, its name, its key", () => {
  const c = card("serie-nom-famille-02");
  const view = seriesMapView(
    c,
    baseMap(c.map.dataRef),
    countryIndex(WORLD),
    WORLD,
    IMAGERY
  );
  assert.equal(view.areas.length, 1);
  assert.deepEqual([view.areas[0].ink, view.areas[0].uncertain], ["a", false]);
  assert.match(view.areas[0].d, /^M[\d.]+,[\d.]+L/);
  // `quiet` borders: the CIV and GHA shared edge, dashed.
  assert.equal(view.borders.length, 1);
  assert.equal(view.borders[0].strong, false);
  assert.deepEqual(
    view.names.map((n) => [n.text, n.style]),
    [["Côte d'Ivoire", "region"]]
  );
  const [name] = view.names;
  assert.ok(name.box.y >= 724 && name.box.y + name.box.h <= 1296);
  assert.deepEqual(view.key, [
    { swatch: "certain-a", label: c.map.highlight.legend },
  ]);
  assert.ok(
    view.subject.y >= 750 - 1 && view.subject.y + view.subject.h <= 1271
  );
  assert.equal(view.camera.centreY, 1010);
  assert.ok(view.scale > 0 && view.scale * 1.04 <= 1.5);
  // Bounds of the region the imagery must cover, with a margin.
  const [west, east, south, north] = view.bounds;
  assert.ok(west < -8 && east > 2 && south < 5 && north > 10);
});

// @req REQ-186
test("areas from card units, a strong border in the key, area names in their ink", () => {
  const c = card("serie-frontieres-02");
  const data = baseMap(c.map.dataRef);
  const view = seriesMapView(c, data, countryIndex(WORLD), WORLD, IMAGERY);
  assert.deepEqual(
    view.areas.map((a) => [a.ink, a.uncertain]),
    [
      ["a", false],
      ["b", false],
    ]
  );
  // The first area's first point, converted then projected.
  const proj = baseMapProjection(data.meta);
  const [lon, lat] = cardPoint(proj, 969, 353);
  const at = project(view.camera, lon, lat);
  assert.ok(
    view.areas[0].d.startsWith(`M${+at.x.toFixed(1)},${+at.y.toFixed(1)}`),
    view.areas[0].d.slice(0, 30)
  );
  assert.equal(view.capped, true);
  assert.deepEqual(
    view.key.map((k) => k.swatch),
    ["certain-a", "certain-b", "border-strong"]
  );
  assert.equal(view.key.at(-1).label, "Frontières actuelles");
  assert.deepEqual(
    view.names.map((n) => [n.text, n.style, n.ink]),
    [
      ["Peuple X", "area", "a"],
      ["Peuple X", "area", "b"],
    ]
  );
  for (const n of view.names)
    assert.ok(n.box && n.box.x >= 60 && n.box.x + n.box.w <= 1020);
});

// @req REQ-186
test("the credits: the source without its base map clause, then the imagery", () => {
  const c = card("serie-nom-famille-02");
  assert.deepEqual(seriesMapCredits(c.map, IMAGERY), {
    source: "fiches EthniAfrica Yao et Kouassi",
    imagery:
      "Imagerie : NASA Earth Observatory ; frontières : Natural Earth, domaine public",
  });
});

// @req REQ-186
test("an atlas card is refused: carousel only", () => {
  for (const id of ["serie-atlas-1880", "serie-atlas-1914-parchemin"])
    assert.throws(
      () => checkSeriesMapCard(card(id)),
      /Carte d'atlas : carrousel seulement/
    );
  assert.throws(
    () => checkSeriesMapCard(card("atlas-independances")),
    /Carte d'atlas : carrousel seulement/
  );
  // A field the satellite grammar does not draw is refused, not dropped.
  const inset = card("map-fula-region");
  assert.throws(() => checkSeriesMapCard(inset), /inset/);
  for (const id of ["serie-nom-famille-02", "serie-frontieres-02"])
    assert.doesNotThrow(() => checkSeriesMapCard(card(id)));
});

// @req REQ-186
test("map names stay between y 724 and 1296, six at most, and never touch", () => {
  const name = (i, y, x = 100 + i * 140) => ({
    id: `name ${i}`,
    kind: "map-name",
    x,
    y,
    w: 120,
    h: 40,
  });
  assert.deepEqual(checkSeriesLayout([name(0, 800), name(1, 900)]), []);
  assert.match(checkSeriesLayout([name(0, 700)]).join(), /724 to 1296/);
  assert.match(checkSeriesLayout([name(0, 1280)]).join(), /724 to 1296/);
  const seven = [0, 1, 2, 3, 4, 5, 6].map((i) => name(i, 800 + i * 50, 100));
  assert.match(checkSeriesLayout(seven).join(), /more than six names/);
  assert.match(
    checkSeriesLayout([name(0, 800, 100), name(1, 820, 150)]).join(),
    /overlaps/
  );
});

// @req REQ-186
test("a map card's foot may start at y 1600; any other foot at 1652", () => {
  const foot = (map) => ({
    id: "key",
    kind: "key",
    x: 60,
    y: 1610,
    w: 400,
    h: 30,
    ...(map && { map: true }),
  });
  assert.deepEqual(checkSeriesLayout([foot(true)]), []);
  assert.match(checkSeriesLayout([foot(false)]).join(), /1652 to 1786/);
});

// @req REQ-186
test("the map's subject stays between y 724 and the foot, and at least 120 px", () => {
  const subject = (y, w, h) => ({
    id: "map",
    kind: "map-subject",
    x: 300,
    y,
    w,
    h,
  });
  assert.deepEqual(checkSeriesLayout([subject(750, 500, 500)]), []);
  assert.match(
    checkSeriesLayout([subject(700, 500, 500)]).join(),
    /passe sous la tête/
  );
  assert.match(
    checkSeriesLayout([subject(1100, 500, 520)]).join(),
    /runs into the foot/
  );
  assert.match(
    checkSeriesLayout([subject(900, 100, 80)]).join(),
    /Sujet trop petit pour l'imagerie vérifiée/
  );
});
