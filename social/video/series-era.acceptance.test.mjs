// @req REQ-186
// The era map's capture time (« tribu » episode, 21 October 2026): with
// Cartes 1.13.0 every frame of an era card took 20 to 40 s to capture on
// SwiftShader, past the 20 s screenshot timeout, while a satellite frame of
// the same piece takes about 1 s. The engraved coast was stroked from every
// vertex of the sequence's coast, on screen or not, three times up to 81.5 px
// wide under masks, on every frame of the push.
//
// The budget is 10 s per era frame, half the capture timeout. On the
// operator's machine an era frame now takes 1 to 2 s alone (a satellite
// frame 0.6 to 1.4 s) and up to about 7 s while three other acceptance files
// render beside it (`node --test` runs files at once); before the fix it
// took 19 to 23 s alone, so the budget still catches the regression. The views
// are the « tribu » piece's coastal era cards, set on the boards' fixture:
// northern Algeria (the Mediterranean coast in frame) and Kenya (the Indian
// Ocean coast). Needs ETHNIAFRICA_VIDEO_ASSETS; a missing folder skips.
//
// A view of the whole globe or of a continent keeps the whole coast in frame:
// its frames took 18 to 23 s, and two episode sessions dropped their era
// cards. More than half of that coast was the far side of the globe, drawn
// mirrored inside it (orthographic, no hemisphere check). Operator, 21
// October 2026: « je valide l'option a », the far side is not drawn.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { loadSeriesVideo } from "./series.mjs";
import { openSeriesRenderer } from "./series-render.mjs";
import { motionDemo } from "./fixtures/series-motion.mjs";

const assets = process.env.ETHNIAFRICA_VIDEO_ASSETS;
const skip = assets ? false : "ETHNIAFRICA_VIDEO_ASSETS is not set";
const dir = mkdtempSync(join(tmpdir(), "series-era-"));
// @req REQ-186
test.after(() => rmSync(dir, { recursive: true, force: true }));

const ERA_FRAME_BUDGET_MS = 10000;
// Two era cards of the fixture moved onto coasts; the 1970 and 1925 cards
// stay on paper (the 2026 card is today's satellite).
const COASTAL_VIEWS = {
  "motion-1970": { lon: 3, lat: 33, radius: 3800 },
  "motion-1925": { lon: 38, lat: -1, radius: 2600 },
};
// The same two cards on the whole globe and on the continent.
const WIDE_VIEWS = {
  "motion-1970": { lon: 20, lat: 5, radius: 465 },
  "motion-1925": { lon: 20, lat: 5, radius: 540 },
};
// The Kenya frame (motion-1925, start + 60) as 2ab6626 drew it, before the
// far side was dropped: nothing of the far side reaches it, so it must stay
// the same pixels (SHA-256 of its raw RGBA). The Algeria frame is not the
// same: its antipode is New Zealand, which was drawn mirrored in the desert.
const KENYA_2AB6626 =
  "574828bf3c63f8b030ebe3c338593b2148ea0f0778939c21270c6a17942f7d81";
const rgbaHash = async (png) =>
  createHash("sha256")
    .update(await sharp(png).ensureAlpha().raw().toBuffer())
    .digest("hex");

function eraSequence(views) {
  return loadSeriesVideo(
    motionDemo(dir, {
      deck: (d) => {
        for (const c of d.cards) {
          if (!views[c.id]) continue;
          c.map.view = { ...views[c.id] };
          // Burkina Faso is out of the coastal views: its name would leave
          // the map's band, so it stays unnamed.
          c.map.areas = c.map.areas.filter((a) => a.label === "none");
        }
        return d;
      },
    }),
    { dir }
  );
}

// Frames 60 and 61 of each era card, each capture timed; the first capture
// of a session pays for the page's warm-up and is not timed.
async function timeEraFrames(views, check) {
  const seq = eraSequence(views);
  const at = (id) => seq.cards.findIndex((c) => c.id === id);
  const renderer = await openSeriesRenderer(seq, { diagnose: true, assets });
  try {
    await renderer.draw(seq.cardStarts[at("motion-pop")] + 40);
    await renderer.capture();
    for (const id of Object.keys(views)) {
      const start = seq.eras.cards[at(id)].start;
      for (const frame of [start + 60, start + 61]) {
        const state = (await renderer.draw(frame)).state;
        const map = state.layers.find((l) => l.map)?.map;
        assert.equal(map?.paper, 1, `frame ${frame} is on paper`);
        const t = Date.now();
        const png = await renderer.capture();
        const ms = Date.now() - t;
        assert.ok(
          ms <= ERA_FRAME_BUDGET_MS,
          `${id}, frame ${frame}: captured in ${ms} ms, budget ${ERA_FRAME_BUDGET_MS} ms`
        );
        await check?.(id, frame - start, png);
      }
    }
  } finally {
    await renderer.close();
  }
}

// @req REQ-186
test(
  "an era frame with the coast in view captures within 10 s",
  { skip, timeout: 600000 },
  () =>
    timeEraFrames(COASTAL_VIEWS, async (id, frame, png) => {
      if (id === "motion-1925" && frame === 60)
        assert.equal(await rgbaHash(png), KENYA_2AB6626);
    })
);

// With the far side dropped, the globe's frames take about 8 s alone (18 to
// 23 s before). The continent's take 10.3 to 12 s: its near side is longer on
// screen, and every vertex of it is still stroked seven times. Bringing it
// under the budget changes the near side (thinning the vertices closer than
// 1 px gave 4.7 s and moved 48,000 pixels), which the operator has not
// decided; until then the continent case runs and reports, as a todo.
// @req REQ-186
test(
  "an era frame of the whole globe captures within 10 s",
  { skip, timeout: 600000 },
  () => timeEraFrames({ "motion-1970": WIDE_VIEWS["motion-1970"] })
);

// @req REQ-186
test(
  "an era frame of a continent captures within 10 s",
  {
    skip,
    todo: "about 10.4 s alone: the next saving changes the near side",
    timeout: 600000,
  },
  () => timeEraFrames({ "motion-1925": WIDE_VIEWS["motion-1925"] })
);
