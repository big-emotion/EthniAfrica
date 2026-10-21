// @req REQ-186
// Cartes 1.14.0 drawn on the verified imagery (handoff.md « Renderer
// integration of 1.14.0 », checks 1, 5, 6 and 8, as drawn), on the boards'
// five scenes (fixtures/series-figures.mjs) with Natural Earth's 54 states
// and the two territories the source does not count. Needs
// ETHNIAFRICA_VIDEO_ASSETS, like the other map acceptance tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { readVerified } from "./areas.mjs";
import { MARKS } from "./series-map.mjs";
import { FIGURES } from "./series-figures.mjs";
import { figuresDemo } from "./fixtures/series-figures.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const skip = assets ? false : "ETHNIAFRICA_VIDEO_ASSETS is not set";
const dir = mkdtempSync(join(tmpdir(), "series-figures-acc-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

let seq;
let drawn;
const plan = (id) =>
  seq.mapSequence.cards[seq.cards.findIndex((c) => c.id === id)].figures;
const before = async () => {
  if (drawn) return;
  const world = await readVerified(assets, "countries");
  seq = loadSeriesVideo(figuresDemo(dir, { world }), { dir });
  const fp = plan("fig-chiffres");
  const frames = [
    fp.cascade.states.at(-1).start + 3,
    fp.units[0].items.at(-1).start + 12,
    fp.row.light + 14,
    fp.gauges[1].start + FIGURES.gauge.fill + 12,
    fp.units[1].items.at(-1).start + 12,
    plan("fig-noms").stamps[0].start + 12,
    plan("fig-cadre").frame.fill.start + 40,
  ];
  drawn = await renderSeriesFrames(seq, frames, { diagnose: true, assets });
};
const pixel = async (png, x, y) => {
  const { data } = await sharp(png)
    .extract({ left: Math.round(x), top: Math.round(y), width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return [...data.slice(0, 3)];
};

// @req REQ-186
test(
  "drawn: no layout problem on the five cards' frames",
  { skip },
  async () => {
    await before();
    for (const r of drawn) assert.deepEqual(r.problems, [], `frame ${r.frame}`);
  }
);

// @req REQ-186
test(
  "check 1, drawn: the head shows the count landed on the spoken figure",
  { skip },
  async () => {
    await before();
    const text = (k) => drawn[k].text.replace(/\s+/gu, " ");
    assert.match(text(0), /54 pays/u);
    assert.match(text(1), /1,5 milliard d’habitants/u);
    assert.match(text(2), /1 sur 5 dans le monde/u);
    assert.match(text(4), /plus de 2 000 langues/u);
  }
);

// @req REQ-186
test(
  "check 5, drawn: nothing of the map shows through the glasses",
  { skip },
  async () => {
    await before();
    const png = drawn[3].png;
    const [africa, world] = plan("fig-chiffres").gauges;
    // Above each waterline, inside the glass, away from the globe's lines.
    const points = [
      [africa.cx, africa.top + 0.25 * africa.height],
      [world.cx + 30, world.top + 55],
    ];
    for (const [x, y] of points) {
      const [r, g, b] = await pixel(png, x, y);
      for (const [v, want] of [
        [r, 0x1b],
        [g, 0x15],
        [b, 0x10],
      ])
        assert.ok(Math.abs(v - want) <= 6, `${x},${y}: ${r},${g},${b}`);
    }
    // Under the waterline, the water in the accent ink.
    const [r, g] = await pixel(
      png,
      world.cx + 30,
      world.top + world.height - 30
    );
    assert.ok(r > 180 && g > 140, `water ${r},${g}`);
  }
);

// @req REQ-186
test(
  "check 6 and 8, drawn: letterings and stamps in the map band, eight texts at most",
  { skip },
  async () => {
    await before();
    for (const r of drawn)
      for (const run of r.animated) {
        const shown = run.texts.filter((t) => t.opacity > 0);
        assert.ok(shown.length <= MARKS.maxTexts, `frame ${r.frame}`);
        for (const t of shown.filter((x) =>
          /LIBYE|ALKEBULAN|ÉTHIOPIE|sans source|AFRIQUE/u.test(x.text)
        )) {
          assert.ok(
            t.y >= MARKS.band.y[0] - 0.5 && t.y + t.h <= MARKS.band.y[1] + 0.5,
            `${t.text} y ${t.y}`
          );
          assert.ok(
            t.x >= MARKS.band.x[0] - 0.5 && t.x + t.w <= MARKS.band.x[1] + 0.5,
            `${t.text} x ${t.x}`
          );
        }
      }
  }
);
