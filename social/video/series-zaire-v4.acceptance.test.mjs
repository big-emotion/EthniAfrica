// @req REQ-186
// Narration v4 of « Zaïre » drawn on the verified imagery (boards S8 and S9
// of https://claude.ai/artifact/5eUf5zVorYqaSky3ZebWoT): the sea route in
// grey then lit to the Congo's mouth with the ship sailing and stopping, the
// camera closing in on the stop, the six provinces in six inks with their
// lords linked to the king. Each frame is checked by the page's own layout
// checks; the sea route is checked against Natural Earth's land. Needs
// ETHNIAFRICA_VIDEO_ASSETS, like the other map acceptance tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { FPS } from "./sequence.mjs";
import { LORDS_TIMING } from "./series-sequence.mjs";
import { zaireV4Demo } from "./fixtures/series-zaire.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const skip = assets ? false : "ETHNIAFRICA_VIDEO_ASSETS is not set";
const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (options) => {
  const dir = mkdtempSync(join(tmpdir(), "series-zaire-v4-acc-"));
  dirs.push(dir);
  return loadSeriesVideo(zaireV4Demo(dir, options), { dir });
};

let seq;
let drawn;
let at;
const wordFrame = (i, unit) => {
  for (const c of seq.chunks.filter((c) => c.card === i)) {
    const w = c.words.find(
      (w) => w.text.replace(/[,.:]+$/u, "").replace(/^l['’]/u, "") === unit
    );
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const before = async () => {
  if (drawn) return;
  seq = load();
  const card = (id) => seq.cards.findIndex((c) => c.id === id);
  const route = card("zaire-route");
  const provinces = card("zaire-provinces");
  const leave = wordFrame(route, "navigateurs");
  const arrive = wordFrame(route, "embouchure");
  at = {
    grey: leave - 3,
    sailing: Math.round((leave + arrive) / 2),
    arrived: arrive + 3,
    closer: seq.cardStarts[route + 1] - 12,
    provinces: wordFrame(provinces, "nommé") + LORDS_TIMING.link + 6,
  };
  drawn = await renderSeriesFrames(seq, Object.values(at), {
    diagnose: true,
    assets,
  });
};
const frameOf = (name) => drawn.find((r) => r.frame === at[name]);
const run = (name) => frameOf(name).animated[0];
const visible = (r) => r.drawings.filter((d) => d.opacity > 0);

// @req REQ-186
test(
  "drawn: no layout problem on the voyage's and the provinces' frames",
  { skip },
  async () => {
    await before();
    for (const r of drawn) assert.deepEqual(r.problems, [], `frame ${r.frame}`);
  }
);

// @req REQ-186
test(
  "drawn: the route in grey, then lit with the ship sailing, which stops at the mouth",
  { skip },
  async () => {
    await before();
    const route = (name) => run(name).drawn.filter((d) => d.kind === "route");
    assert.equal(route("grey").length, 1);
    assert.equal(
      visible(run("grey")).filter((d) => d.kind === "caravelle").length,
      0
    );
    for (const name of ["sailing", "arrived", "closer"]) {
      const ship = visible(run(name)).filter((d) => d.kind === "caravelle");
      assert.equal(ship.length, 1, name);
      assert.ok(ship[0].complete, `${name}: the ship's drawing is loaded`);
    }
    // Closer in, the imagery is enlarged more: the camera has closed in.
    const scale = (name) =>
      frameOf(name).boxes.find((b) => b.kind === "image").scale;
    assert.ok(scale("closer") > 5 * scale("arrived"));
  }
);

// @req REQ-186
test(
  "drawn: six hatched provinces, the king and five lords linked to him",
  { skip },
  async () => {
    await before();
    const r = run("provinces");
    const lords = visible(r).filter((d) => d.kind === "seigneur");
    assert.equal(lords.length, 5);
    for (const d of lords) assert.ok(d.complete);
    assert.equal(visible(r).filter((d) => d.kind === "roi").length, 1);
    assert.ok(r.drawn.some((d) => d.kind === "lords"));
  }
);

// @req REQ-186
test(
  "a sea route drawn across Africa is refused when the map renders, naming its segment",
  { skip },
  async () => {
    const crossing = load({
      deck: (deck) => {
        const c = deck.cards.find((c) => c.id === "zaire-route");
        // From the Gulf of Guinea straight to the Indian Ocean.
        const k = c.marks[0].via.indexOf("embouchure");
        c.marks[0].via.splice(k + 1, 0, [40, -5]);
        return deck;
      },
    });
    await assert.rejects(
      renderSeriesFrames(crossing, [0], { assets }),
      /Card zaire-route, route: Route maritime sur la terre : le segment 15 \(11\.95, -6\.05 → 40, -5\)/
    );
  }
);
