// @req REQ-186
// The era map's capture time (« tribu » episode, 21 October 2026): with
// Cartes 1.13.0 every frame of an era card took 20 to 40 s to capture on
// SwiftShader, past the 20 s screenshot timeout, while a satellite frame of
// the same piece takes about 1 s. The engraved coast was stroked from every
// vertex of the sequence's coast, on screen or not, three times up to 81.5 px
// wide under masks, on every frame of the push.
//
// The budget is 5 s per era frame: about four satellite frames on the
// operator's machine (0.6 to 1.4 s each) and a quarter of the capture
// timeout, so a render running several workers keeps its margin. The views
// are the « tribu » piece's coastal era cards, set on the boards' fixture:
// northern Algeria (the Mediterranean coast in frame) and Kenya (the Indian
// Ocean coast). Needs ETHNIAFRICA_VIDEO_ASSETS; a missing folder skips.
// A view of the whole globe keeps the whole coast in frame and is not
// covered: its frames still take about 19 s.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo } from "./series.mjs";
import { openSeriesRenderer } from "./series-render.mjs";
import { motionDemo } from "./fixtures/series-motion.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const skip = assets ? false : "ETHNIAFRICA_VIDEO_ASSETS is not set";
const dir = mkdtempSync(join(tmpdir(), "series-era-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

const ERA_FRAME_BUDGET_MS = 5000;
// Two era cards of the fixture moved onto coasts; the 1970 and 1925 cards
// stay on paper (the 2026 card is today's satellite).
const COASTAL_VIEWS = {
  "motion-1970": { lon: 3, lat: 33, radius: 3800 },
  "motion-1925": { lon: 38, lat: -1, radius: 2600 },
};

// @req REQ-186
test(
  "an era frame with the coast in view captures within 5 s",
  { skip, timeout: 600000 },
  async () => {
    const seq = loadSeriesVideo(
      motionDemo(dir, {
        deck: (d) => {
          for (const c of d.cards) {
            if (!COASTAL_VIEWS[c.id]) continue;
            c.map.view = { ...COASTAL_VIEWS[c.id] };
            // Burkina Faso is out of these views: its name would leave the
            // map's band, so it stays unnamed.
            c.map.areas = c.map.areas.filter((a) => a.label === "none");
          }
          return d;
        },
      }),
      { dir }
    );
    const at = (id) => seq.cards.findIndex((c) => c.id === id);
    const renderer = await openSeriesRenderer(seq, { diagnose: true, assets });
    try {
      // The first capture of a session pays for the page's warm-up.
      await renderer.draw(seq.cardStarts[at("motion-pop")] + 40);
      await renderer.capture();
      for (const id of Object.keys(COASTAL_VIEWS)) {
        const start = seq.eras.cards[at(id)].start;
        for (const frame of [start + 60, start + 61]) {
          const state = (await renderer.draw(frame)).state;
          const map = state.layers.find((l) => l.map)?.map;
          assert.equal(map?.paper, 1, `frame ${frame} is on paper`);
          const t = Date.now();
          await renderer.capture();
          const ms = Date.now() - t;
          assert.ok(
            ms <= ERA_FRAME_BUDGET_MS,
            `${id}, frame ${frame}: captured in ${ms} ms, budget ${ERA_FRAME_BUDGET_MS} ms`
          );
        }
      }
    } finally {
      await renderer.close();
    }
  }
);
