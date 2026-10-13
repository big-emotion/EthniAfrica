// @req REQ-186
// Areas that follow the text, EthniAfrica Vidéo carte 0.4.0-proposition
// (accepted 12 October 2026): an area enters with the chunk that names it,
// earlier areas step down smoothly, names are placed by one deterministic
// rule, and every area file carries its provenance. Unit tests use
// synthetic squares; the Sahara demo draws synthetic polygons marked as mockups.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSequence,
  frameState,
  frameCount,
  chapterTimeline,
  holdLayout,
  placeLabels,
  tapeText,
  chapterLabels,
} from "./sequence.mjs";

const fixtures = new URL("./fixtures/", import.meta.url);
const saharaJson = JSON.parse(
  readFileSync(new URL("sahara.chapters.sequence.json", fixtures))
);
const sahara = (change = () => {}) => {
  const input = structuredClone(saharaJson);
  change(input);
  return loadSequence(input, { dir: fixtures });
};
const frameOf = (seconds) => Math.round(seconds * 30);

const PROVENANCE = {
  name: "Aire de test",
  kind: "approximate",
  category: "region",
  source: "synthetic square for the renderer tests",
  citation: "none",
  derivation: "four corners typed by hand",
  licence: "CC0 1.0",
};
const square = (lon, lat, size, properties = PROVENANCE) => ({
  type: "Feature",
  properties,
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [lon, lat],
        [lon + size, lat],
        [lon + size, lat + size],
        [lon, lat + size],
        [lon, lat],
      ],
    ],
  },
});

// A three-chapter sequence whose second chapter draws synthetic areas from
// files written in a temporary folder.
function withAreas(files, change = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "ethniafrica-areas-"));
  try {
    for (const [name, geojson] of Object.entries(files))
      writeFileSync(join(dir, name), JSON.stringify(geojson));
    const input = structuredClone(saharaJson);
    delete input.demo;
    input.chapters[1].features = Object.keys(files).map((name, i) => ({
      kind: "area",
      id: name.replace(".geojson", ""),
      file: name,
      ink: ["a", "b", "c"][i],
      labelAt: [-4 + 10 * i, 20],
    }));
    input.chapters[1].legend = [
      ...Object.keys(files).map((name) => ({
        label: name,
        feature: name.replace(".geojson", ""),
      })),
      { label: "Zone approximative", approximate: true },
    ].slice(-4);
    input.chapters[1].sentences = [
      [
        { text: "Vers 1154, al-Idrīsī" },
        { text: "nomme ainsi le désert", enters: ["one"] },
        { text: "entre le pays des Berbères", enters: ["two"] },
      ],
    ];
    // The other chapters keep their mockup areas out of a non-demo run.
    input.chapters.splice(2);
    change(input);
    return loadSequence(input, { dir });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const twoSquares = () => ({
  "one.geojson": square(-8, 18, 8),
  "two.geojson": square(4, 18, 6),
});

// @req REQ-186
test("an area enters whole with the chunk that names it, its legend item and then its name", () => {
  const seq = sahara();
  const chunk = chapterTimeline(seq).chapters[1].chunks[1];
  assert.equal(chunk.text, "nomme ainsi le désert");
  const t0 = frameOf(chunk.appear);
  const at = (frames) => frameState(seq, t0 + frames);
  assert.equal(at(-1).features.desert.opacity, 0);
  assert.equal(at(0).features.desert.opacity, 0);
  assert.ok(at(9).features.desert.opacity > 0.5);
  assert.equal(at(18).features.desert.opacity, 1);
  // Legend item in its reserved slot, 300 ms.
  assert.equal(at(0).legend[0], 0);
  assert.ok(at(4).legend[0] > 0 && at(4).legend[0] < 1);
  assert.equal(at(9).legend[0], 1);
  // The map name at t0 + 300 ms, in 400 ms.
  assert.equal(at(9).labels.desert, 0);
  assert.ok(at(15).labels.desert > 0);
  assert.equal(at(21).labels.desert, 1);
  // The others wait for their own chunk.
  assert.equal(at(18).features.berberes.opacity, 0);
  assert.equal(at(18).legend[1], 0);
  // « Zone approximative » is not named by a chunk: it is there from the
  // chapter's start.
  assert.equal(at(0).legend[3], 1);
});

// @req REQ-186
test("earlier areas step down to 55 % smoothly in 600 ms, never by a jump", () => {
  const seq = sahara();
  const [, two, three] = chapterTimeline(seq).chapters;
  const desert = (f) => frameState(seq, f).features.desert.opacity;
  const from = frameOf(two.chunks[1].appear);
  const stepDown = frameOf(two.chunks[2].appear);
  const exit = frameOf(two.exit);
  let previous = 0;
  for (let f = from; f < exit; f++) {
    const value = desert(f);
    if (f < stepDown) assert.ok(value >= previous, `rises at ${f}`);
    else {
      assert.ok(value <= previous + 1e-12, `falls at ${f}`);
      // 45 points over 18 frames: an even fall would be 2.5 a frame.
      assert.ok(previous - value < 0.06, `jump at frame ${f}`);
    }
    previous = value;
  }
  assert.equal(desert(stepDown + 18), 0.55);
  // The step-down eases in and out: slow, then faster, then slow.
  const deltas = [3, 9, 15].map(
    (k) => desert(stepDown + k - 1) - desert(stepDown + k)
  );
  assert.ok(deltas[1] > deltas[0] && deltas[1] > deltas[2], `${deltas}`);
  // A third entry finds the first already at 55 %: it stays there.
  assert.equal(desert(frameOf(two.chunks[3].appear) + 18), 0.55);
  assert.equal(
    frameState(seq, frameOf(two.chunks[3].appear) + 18).features.berberes
      .opacity,
    0.55
  );
  assert.ok(three.start > two.exit);
});

// @req REQ-186
test("two entries named by one chunk are 700 ms apart", () => {
  const seq = sahara();
  const chunk = chapterTimeline(seq).chapters[2].chunks[3];
  assert.deepEqual(
    chunk.entries.map((e) => e.ref),
    ["Ténéré", "Tanezrouft"]
  );
  assert.equal(
    Math.round((chunk.entries[1].at - chunk.entries[0].at) * 30),
    21
  );
  const t0 = frameOf(chunk.appear);
  assert.equal(frameState(seq, t0 + 20).names.Tanezrouft, 0);
  assert.ok(frameState(seq, t0 + 8).names["Ténéré"] > 0);
  assert.equal(frameState(seq, t0 + 21 + 12).names.Tanezrouft, 1);
});

const STILL = [
  "camera",
  "grade",
  "dim",
  "text",
  "marker",
  "caption",
  "chapter",
  "closing",
];

// @req REQ-186
test("nothing but what the chunk names moves during a subtitle", () => {
  const seq = sahara();
  const chunks = chapterTimeline(seq).chapters.flatMap((c, chapter) =>
    c.chunks.map((chunk) => ({ ...chunk, chapter }))
  );
  const named = (f) => {
    const t = f / 30;
    const chunk = chunks.find((c) => t >= c.appear && t < c.gone + 1e-9);
    return new Set(chunk?.entries.map((e) => e.ref) ?? []);
  };
  for (let f = 1; f < frameCount(seq); f++) {
    const [before, now] = [frameState(seq, f - 1), frameState(seq, f)];
    if (!(before.subtitle?.opacity > 0 && now.subtitle?.opacity > 0)) continue;
    for (const key of STILL)
      assert.deepEqual(now[key], before[key], `${key} moved at frame ${f}`);
    const refs = named(f);
    for (const group of ["labels", "names", "places"])
      for (const [key, value] of Object.entries(now[group]))
        if (value !== before[group][key])
          assert.ok(refs.has(key), `${group} ${key} changed at frame ${f}`);
    for (const [key, value] of Object.entries(now.features))
      if (value.opacity !== before.features[key].opacity)
        assert.ok(
          refs.has(key) ||
            (value.opacity < before.features[key].opacity &&
              value.opacity >= 0.55),
          `area ${key} changed at frame ${f}`
        );
  }
});

// @req REQ-186
test("approximate areas are hatched, 135° when inside an earlier one", () => {
  const seq = sahara();
  const hatch = (chapter, id) =>
    seq.chapters[chapter].features.find((f) => f.id === id).hatch;
  assert.equal(hatch(1, "desert"), 45);
  assert.equal(hatch(1, "berberes"), 45);
  assert.equal(hatch(1, "noirs"), 45);
  assert.equal(hatch(2, "libye"), 45);
  assert.equal(hatch(2, "touaregs"), 135);
  assert.equal(hatch(3, "sahara"), 45);
  assert.equal(hatch(3, "libyque"), 135);
  for (const f of seq.chapters[1].features)
    assert.equal(
      f.certainty,
      "uncertain",
      "an approximate area is never filled"
    );
  const nested = withAreas({
    "one.geojson": square(-8, 14, 16),
    "two.geojson": square(-4, 18, 4),
  });
  assert.equal(nested.chapters[1].features[1].hatch, 135);
  assert.equal(withAreas(twoSquares()).chapters[1].features[1].hatch, 45);
});

// @req REQ-186
test("a chapter with an approximate area says « Zone approximative » in its legend", () => {
  assert.throws(
    () =>
      withAreas(twoSquares(), (s) => {
        s.chapters[1].legend = s.chapters[1].legend.filter(
          (item) => !item.approximate
        );
      }),
    /Zone approximative/
  );
  const certain = { ...PROVENANCE, kind: "certain" };
  assert.doesNotThrow(() =>
    withAreas(
      {
        "one.geojson": square(-8, 18, 8, certain),
        "two.geojson": square(4, 18, 6, certain),
      },
      (s) => {
        s.chapters[1].legend = s.chapters[1].legend.filter(
          (item) => !item.approximate
        );
      }
    )
  );
});

// @req REQ-186
test("an area file needs its provenance; a mockup is refused outside a demo", () => {
  for (const field of Object.keys(PROVENANCE)) {
    const rest = { ...PROVENANCE };
    delete rest[field];
    assert.throws(
      () =>
        withAreas({
          "one.geojson": square(-8, 18, 8, rest),
          "two.geojson": square(4, 18, 6),
        }),
      new RegExp(field),
      field
    );
  }
  assert.throws(
    () =>
      withAreas({
        "one.geojson": square(-8, 18, 8, { ...PROVENANCE, kind: "probable" }),
        "two.geojson": square(4, 18, 6),
      }),
    /approximate or certain/
  );
  const line = square(-8, 18, 8);
  line.geometry = {
    type: "LineString",
    coordinates: [
      [0, 0],
      [1, 1],
    ],
  };
  assert.throws(
    () => withAreas({ "one.geojson": line, "two.geojson": square(4, 18, 6) }),
    /Polygon or MultiPolygon/
  );
  // A FeatureCollection carries its properties at the top level.
  const collection = {
    type: "FeatureCollection",
    properties: PROVENANCE,
    features: [square(-8, 18, 4, {}), square(-4, 22, 4, {})],
  };
  const loaded = withAreas({
    "one.geojson": collection,
    "two.geojson": square(4, 18, 6),
  });
  assert.equal(loaded.chapters[1].features[0].geometry.type, "MultiPolygon");
  assert.equal(loaded.chapters[1].features[0].source, PROVENANCE.source);

  const mockup = { ...PROVENANCE, mockup: true };
  const files = () => ({
    "one.geojson": square(-8, 18, 8, mockup),
    "two.geojson": square(4, 18, 6),
  });
  assert.throws(() => withAreas(files()), /mockup/i);
  assert.throws(
    () => withAreas(files(), (s) => (s.demo = "proof")),
    /mockup/i,
    "a demo still names the mockup illustrative"
  );
  assert.doesNotThrow(() =>
    withAreas(files(), (s) => {
      s.demo = "proof";
      s.chapters[1].features[0].illustrative = true;
    })
  );
  const placeholder = {
    ...PROVENANCE,
    status: "hand-drawn PLACEHOLDER, not for publication",
  };
  assert.throws(
    () =>
      withAreas({
        "one.geojson": square(-8, 18, 8, placeholder),
        "two.geojson": square(4, 18, 6),
      }),
    /mockup/i
  );
});

// @req REQ-186
test("a demo drawing mockup areas says so on its tape", () => {
  assert.equal(tapeText(sahara()), "Texte illustratif · zones de maquette");
  assert.equal(
    tapeText(withAreas(twoSquares(), (s) => (s.demo = "proof"))),
    "Texte illustratif"
  );
  assert.equal(tapeText(withAreas(twoSquares())), null);
});

// @req REQ-186
test("a chunk may only name what its chapter draws, once", () => {
  assert.throws(
    () => sahara((s) => (s.chapters[1].sentences[0][0].enters = ["libye"])),
    /libye/
  );
  assert.throws(
    () => sahara((s) => (s.chapters[1].sentences[0][0].enters = ["desert"])),
    /once/
  );
});

// @req REQ-186
test("labels are placed in entry order by one deterministic rule, 12 px apart", () => {
  // The 0.3.0 proof drew Tanezrouft and Ténéré over each other. Put both
  // anchors on the same point: the rule must still part them.
  const labels = [
    {
      key: "Ténéré",
      style: "region",
      text: "Ténéré",
      anchor: { x: 500, y: 800 },
    },
    {
      key: "Tanezrouft",
      style: "region",
      text: "Tanezrouft",
      anchor: { x: 500, y: 800 },
    },
  ];
  const placed = placeLabels(labels, []);
  assert.deepEqual(placeLabels(labels, []), placed, "deterministic");
  const [a, b] = placed.map((p) => p.box);
  const clear =
    a.x + a.w + 12 <= b.x ||
    b.x + b.w + 12 <= a.x ||
    a.y + a.h + 12 <= b.y ||
    b.y + b.h + 12 <= a.y;
  assert.ok(clear, `${JSON.stringify(placed)}`);
  // Two region names: 40 px first, on the anchor when it is free.
  assert.equal(placed[0].size, 40);
  assert.equal(placed[0].candidate, 0);
  assert.notEqual(placed[1].candidate, 0);
  // One region name alone starts at 44 px.
  assert.equal(placeLabels(labels.slice(0, 1), [])[0].size, 44);
  // Near the frame edge a name slides sideways, up to a third of its width.
  const [edge] = placeLabels(
    [
      {
        key: "Edge",
        style: "region",
        text: "Tanezrouft",
        anchor: { x: 1000, y: 800 },
      },
    ],
    []
  );
  assert.ok(edge.box.x + edge.box.w <= 1020 && edge.box.x >= 60);
  // With nowhere to go, the name goes to the legend as text.
  const [lost] = placeLabels(
    [
      {
        key: "Lost",
        style: "region",
        text: "Tanezrouft",
        anchor: { x: 540, y: 800 },
      },
    ],
    [{ x: 0, y: 0, w: 1080, h: 1920 }]
  );
  assert.equal(lost.box, null);
});

// @req REQ-186
test("the Sahara chapters place every name inside the map band without overlap", () => {
  const seq = sahara();
  seq.chapters.forEach((_, i) => {
    const names = holdLayout(seq, i).elements.filter((e) =>
      ["label", "name", "place"].includes(e.kind)
    );
    for (const { id, box } of names) {
      assert.ok(
        box.y >= 290 && box.y + box.h <= 1290,
        `${id} in chapter ${i + 1}`
      );
      assert.ok(
        box.x >= 60 && box.x + box.w <= 1020,
        `${id} in chapter ${i + 1}`
      );
    }
    for (let j = 0; j < names.length; j++)
      for (let k = j + 1; k < names.length; k++) {
        const [a, b] = [names[j].box, names[k].box];
        assert.ok(
          a.x + a.w + 12 <= b.x ||
            b.x + b.w + 12 <= a.x ||
            a.y + a.h + 12 <= b.y ||
            b.y + b.h + 12 <= a.y,
          `${names[j].id} and ${names[k].id} in chapter ${i + 1}`
        );
      }
  });
});

// @req REQ-186
test("at most six names and one to four legend items in a chapter", () => {
  assert.throws(
    () =>
      sahara((s) =>
        s.chapters[2].names.push(
          ...["Erg", "Hamada", "Reg", "Tassili", "Aïr"].map((name, i) => ({
            kind: "region",
            name,
            lon: i,
            lat: 20,
          }))
        )
      ),
    /six names/
  );
  assert.throws(
    () =>
      sahara((s) =>
        s.chapters[1].legend.push({ label: "Cinquième", feature: "desert" })
      ),
    /legend/
  );
  // An area without a map name is not counted as a name.
  assert.doesNotThrow(() => sahara());
});

// @req REQ-186
test("an area's name is plain unless the sequence quotes it as a source's own term", () => {
  // A paraphrase never takes the quoted (italic) treatment: quoting is an
  // explicit opt-in per area, never inferred from its category.
  const plain = withAreas(twoSquares());
  assert.deepEqual(
    chapterLabels(plain, 1).map((l) => [l.key, l.style]),
    [
      ["one", "area"],
      ["two", "area"],
    ]
  );
  const quoted = withAreas(twoSquares(), (s) => {
    s.chapters[1].features[0].label = "quoted";
  });
  assert.equal(chapterLabels(quoted, 1)[0].style, "quoted");
  assert.throws(
    () =>
      withAreas(twoSquares(), (s) => {
        s.chapters[1].features[0].label = "bold";
      }),
    /label/
  );
  // The demo's al-Idrīsī bands opt in, as the design draws them.
  assert.ok(chapterLabels(sahara(), 1).every((l) => l.style === "quoted"));
});
