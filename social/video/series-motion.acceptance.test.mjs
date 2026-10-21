// @req REQ-186
// Cartes 1.13.0 drawn on the verified imagery (handoff.md « Renderer
// integration of 1.13.0 », checks 3, 5, 6, 7, 9 and 12, as drawn), on the
// boards' scenes (fixtures/series-motion.mjs). Needs ETHNIAFRICA_VIDEO_ASSETS,
// like the other map acceptance tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { motionDemo } from "./fixtures/series-motion.mjs";
import { flashesPerSecond } from "./flash-detector.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const skip = assets ? false : "ETHNIAFRICA_VIDEO_ASSETS is not set";
const dir = mkdtempSync(join(tmpdir(), "series-motion-acc-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

let seq;
let drawn;
const at = (id) => seq.cards.findIndex((c) => c.id === id);
const frameOf = (f) => drawn.get(f);
const before = async () => {
  if (drawn) return;
  seq = loadSeriesVideo(motionDemo(dir), { dir });
  const frames = new Set();
  // Check 3: two frames of one chunk on the pop card.
  const pop = at("motion-pop");
  const chunk = seq.chunks.find(
    (c) => c.card === pop && c.gone - c.fullFrom > 40
  );
  frames.add(chunk.fullFrom + 6).add(chunk.fullFrom + 36);
  // Check 5: every frame around both flashes.
  for (const f of seq.eras.flashes)
    for (let k = -8; k <= 24; k++) frames.add(f.start + k);
  // Check 7: the counter rolling to 1970 and landed.
  const era = seq.eras.cards[at("motion-1970")];
  for (let k = 0; k <= era.frames + 12; k += 4) frames.add(era.start + k);
  // Check 9: Upper Volta's flag waving, two seconds of it.
  const hv = seq.mapSequence.cards[at("motion-1970")].flags.find(
    (f) => f.flag === "hv"
  );
  for (let k = 20; k <= 80; k += 3) frames.add(hv.shows[0][0] + k);
  // Check 12: the recap card and the card after it.
  const recap = at("rappel");
  frames.add(seq.cardStarts[recap] + 60).add(seq.cardStarts[recap + 1] + 30);
  const list = [...frames].sort((a, b) => a - b);
  drawn = new Map(
    (await renderSeriesFrames(seq, list, { diagnose: true, assets })).map(
      (r) => [r.frame, r]
    )
  );
};

// @req REQ-186
test(
  "check 3: band, head, subtitles and foot stay in place while the map pushes in",
  { skip },
  async () => {
    await before();
    const pop = at("motion-pop");
    const chunk = seq.chunks.find(
      (c) => c.card === pop && c.gone - c.fullFrom > 40
    );
    const kinds = [
      "band",
      "head",
      "subtitle",
      "source",
      "credit",
      "key",
      "signature",
    ];
    const boxes = (f) =>
      frameOf(f)
        .boxes.filter((b) => kinds.includes(b.kind))
        .map((b) => [
          b.kind,
          b.id,
          Math.round(b.x),
          Math.round(b.y),
          Math.round(b.w),
          Math.round(b.h),
        ]);
    assert.deepEqual(boxes(chunk.fullFrom + 6), boxes(chunk.fullFrom + 36));
    // The map itself moved under them.
    const radius = (f) => frameOf(f).maps.find((m) => m.camera).camera.radius;
    assert.ok(radius(chunk.fullFrom + 36) > radius(chunk.fullFrom + 6));
  }
);

// @req REQ-186
test(
  "check 5: the flash detector counts one flash for each turn, never three in a second",
  { skip },
  async () => {
    await before();
    for (const f of seq.eras.flashes) {
      const frames = [];
      for (let k = -8; k <= 24; k++)
        frames.push(
          await sharp(frameOf(f.start + k).png)
            .removeAlpha()
            .raw()
            .toBuffer()
        );
      // A turn changes the ground (satellite to paper or back): the flash
      // is one transition of WCAG's pair, the change's other side never
      // returning to where it was. Seen, and far from three a second.
      const { most, transitions } = flashesPerSecond(frames, 1080, 1920);
      assert.ok(most < 3, `${most} flashes in a second`);
      assert.ok(transitions.length >= 1, "the flash is seen");
    }
  }
);

// @req REQ-186
test(
  "check 6: the era map draws no modern border; the coast's engraved lines lie on the sea side",
  { skip },
  async () => {
    await before();
    const f = seq.eras.flashes[0].start + 20;
    const map = frameOf(f).animated[0];
    assert.equal(map.paper, 1);
    assert.equal(map.borders, 0);
    // Down from the Gulf of Guinea's coast at Accra: engraving-dark pixels
    // in the sea under the coast, none on the land above it.
    const camera = frameOf(f).maps.find((m) => m.camera).camera;
    const rad = Math.PI / 180;
    const [lon, lat] = [-0.2, 5.55];
    const l = (lon - camera.lon) * rad,
      p = lat * rad,
      p0 = camera.lat * rad;
    const x = Math.round(540 + camera.radius * Math.cos(p) * Math.sin(l));
    const y = Math.round(
      camera.centreY -
        camera.radius *
          (Math.cos(p0) * Math.sin(p) -
            Math.sin(p0) * Math.cos(p) * Math.cos(l))
    );
    const { data } = await sharp(frameOf(f).png)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const lum = (yy) => {
      const i = 3 * (yy * 1080 + x);
      return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    };
    const dips = (ys) => {
      let n = 0;
      for (const yy of ys)
        if (lum(yy) < Math.min(lum(yy - 2), lum(yy + 2)) - 6) n++;
      return n;
    };
    const range = (from, to) =>
      Array.from({ length: to - from }, (_, k) => from + k);
    assert.ok(
      dips(range(y + 6, y + 48)) >= 2,
      "engraved lines under the coast"
    );
    assert.equal(dips(range(y - 48, y - 6)), 0, "no engraved line on the land");
  }
);

// @req REQ-186
test(
  "check 7: the counter's digits never move sideways and land on the era",
  { skip },
  async () => {
    await before();
    const era = seq.eras.cards[at("motion-1970")];
    const xs = [];
    // While it rolls; the landing's 4 % settle is a scale, not a slide.
    for (let k = 0; k < era.frames; k += 4) {
      const c = frameOf(era.start + k).counters.find(
        (c) => c.card === "motion-1970"
      );
      xs.push(c.digits.map((d) => Math.round(d.x * 10) / 10));
    }
    for (const row of xs) assert.deepEqual(row, xs[0]);
    const landed = frameOf(era.start + era.frames + 12).counters[0].text;
    assert.match(landed, /^1.?9.?7.?0/u);
  }
);

// @req REQ-186
test(
  "check 9: a flag waves more at its fly than at its hoist",
  { skip },
  async () => {
    await before();
    const hv = seq.mapSequence.cards[at("motion-1970")].flags.find(
      (f) => f.flag === "hv"
    );
    const first = [];
    const last = [];
    for (let k = 20; k <= 80; k += 3) {
      const flag = frameOf(hv.shows[0][0] + k).animated[0].flags.find(
        (f) => f.flag === "hv"
      );
      first.push(flag.waves[0]);
      last.push(flag.waves.at(-1));
    }
    const amplitude = (ys) => (Math.max(...ys) - Math.min(...ys)) / 2;
    // 7 px at the fly, about a third of it at the hoist (the boards' wave).
    assert.ok(
      amplitude(last) > 5 && amplitude(last) <= 7.2,
      `fly ${amplitude(last)}`
    );
    assert.ok(
      amplitude(first) < amplitude(last) / 2,
      `hoist ${amplitude(first)}`
    );
  }
);

// @req REQ-186
test(
  "check 12: the recap's map is at 30 % saturation, the colour back on the next card",
  { skip },
  async () => {
    await before();
    const recap = at("rappel");
    const saturation = async (f) => {
      const { data } = await sharp(frameOf(f).png)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let s = 0;
      let n = 0;
      // The sea under the subtitles: imagery only. The recalled marks keep
      // their inks, as on the board.
      for (let y = 1470; y < 1640; y += 7)
        for (let x = 80; x < 1000; x += 7) {
          const i = 3 * (y * 1080 + x);
          const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
          s += Math.max(r, g, b) - Math.min(r, g, b);
          n++;
        }
      return s / n;
    };
    const memory = await saturation(seq.cardStarts[recap] + 60);
    const today = await saturation(seq.cardStarts[recap + 1] + 30);
    assert.ok(memory < today * 0.5, `${memory} against ${today}`);
  }
);
