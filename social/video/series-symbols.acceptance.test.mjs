// @req REQ-186
// Cartes 1.16.0 drawn on the verified imagery: the Zaïre flag planted on
// the DR Congo and swapped for the DR Congo flag, the king, the caravel and
// the word bubble turning gold (fixtures/series-zaire.mjs), each frame
// checked by the page's own layout checks. Needs ETHNIAFRICA_VIDEO_ASSETS,
// like the other map acceptance tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { PLANTED, BUBBLE } from "./series-sequence.mjs";
import { FPS } from "./sequence.mjs";
import { zaireDemo } from "./fixtures/series-zaire.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const skip = assets ? false : "ETHNIAFRICA_VIDEO_ASSETS is not set";
const dir = mkdtempSync(join(tmpdir(), "series-symbols-acc-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

let seq;
let drawn;
let at;
const card = (id) => seq.cards.findIndex((c) => c.id === id);
const wordFrame = (i, unit) => {
  for (const c of seq.chunks.filter((c) => c.card === i)) {
    const w = c.words.find((w) => w.text.replace(/[,.:]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const before = async () => {
  if (drawn) return;
  seq = loadSeriesVideo(zaireDemo(dir), { dir });
  const flags = card("zaire-drapeaux");
  const words = card("zaire-mot");
  const plant = wordFrame(flags, "Zaïre");
  const swap = wordFrame(flags, "1997");
  const zaire = wordFrame(words, "Zaïre");
  at = {
    planted: plant + PLANTED.unrollFrom + PLANTED.unroll + 3,
    rising: swap + PLANTED.fold + 2,
    swapped: swap + PLANTED.fold + PLANTED.rise + 3,
    symbols: wordFrame(words, "nzadi") + 6,
    gold: zaire + BUBBLE.glide + 3,
  };
  const frames = Object.values(at);
  drawn = await renderSeriesFrames(seq, frames, { diagnose: true, assets });
};
const frameOf = (name) => drawn.find((r) => r.frame === at[name]);
const run = (name) => frameOf(name).animated[0];

// @req REQ-186
test(
  "drawn: no layout problem on the frames of the planted flag and the symbols",
  { skip },
  async () => {
    await before();
    for (const r of drawn) assert.deepEqual(r.problems, [], `frame ${r.frame}`);
  }
);

// @req REQ-186
test(
  "drawn: the Zaïre flag flies, then the DR Congo flag rises in its place",
  { skip },
  async () => {
    await before();
    const planted = run("planted").planted;
    assert.equal(planted.length, 1);
    assert.equal(planted[0].cloth.flag, "zar");
    assert.ok(planted[0].filter.includes("url"), "second contour");
    const rising = run("rising").planted[0];
    const swapped = run("swapped").planted[0];
    assert.equal(rising.cloth.flag, "cod");
    assert.equal(swapped.cloth.flag, "cod");
    // Rising: lower on the pole than once risen.
    assert.ok(
      rising.cloth.y > swapped.cloth.y + 10,
      `${rising.cloth.y} ${swapped.cloth.y}`
    );
    // Nothing written on the flags' map but the dates.
    const texts = run("swapped")
      .texts.filter((t) => t.opacity > 0)
      .map((t) => t.text);
    assert.deepEqual(texts.sort(), ["1971", "1997"]);
  }
);

// @req REQ-186
test(
  "drawn: the symbols carry no label; the bubble writes its studied word",
  { skip },
  async () => {
    await before();
    const symbols = run("symbols");
    const kinds = symbols.drawings
      .filter((d) => d.opacity > 0)
      .map((d) => d.kind);
    for (const kind of ["roi", "caravelle", "parole"])
      assert.ok(kinds.includes(kind), kind);
    for (const d of symbols.drawings) assert.ok(d.complete, d.kind);
    const shown = (r) =>
      r.texts.filter((t) => t.opacity > 0).map((t) => t.text);
    assert.deepEqual(shown(symbols), ["nzadi"]);
    const gold = run("gold");
    assert.deepEqual(shown(gold), ["Zaïre"]);
    assert.ok(
      gold.drawings.some((d) => d.kind === "parole-or" && d.opacity > 0.9)
    );
  }
);
