// @req REQ-186
// The series idents drawn in the pinned Chromium inside the series video:
// the intro bumper over its card, under the subtitles; the end card in place
// of the 1.10.0 ending, with the episode's next episode; the band and the
// signature hidden while an ident fills the frame. Needs no imagery outside
// git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadSeriesVideo,
  seriesFrameCount,
  checkSeriesLayout,
} from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { seriesDemo, introChunks } from "./fixtures/series-pays.mjs";

const dir = mkdtempSync(join(tmpdir(), "series-idents-render-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));
const seq = loadSeriesVideo(
  seriesDemo(dir, {
    script: (beats) => [
      beats[0],
      { type: "intro", chunks: introChunks() },
      ...beats.slice(1),
    ],
    edit: (input) => {
      input.idents = { outro: "peul", next: "Le nom Burkina Faso" };
    },
  }),
  { dir }
);
const introStart = seq.cardStarts[1];
const subtitled = seq.chunks.find((c) => c.card === 1).fullFrom;
const last = seriesFrameCount(seq) - 1;
let frames;
test.before(async () => {
  frames = await renderSeriesFrames(seq, [introStart - 4, subtitled, last], {
    diagnose: true,
  });
});
const at = (f) => frames.find((x) => x.frame === f);

// @req REQ-186
test("the intro is drawn over its card change, then fills the frame under its subtitle", () => {
  const entering = at(introStart - 4);
  assert.equal(entering.ident.clip, "intro");
  assert.ok(entering.ident.opacity > 0 && entering.ident.opacity < 1);
  const full = at(subtitled);
  assert.equal(full.ident.clip, "intro");
  assert.equal(full.ident.opacity, 1);
  assert.match(full.ident.text, /@ethniafrica/);
  assert.ok(
    full.boxes.some((b) => b.kind === "subtitle"),
    "the sentence is subtitled"
  );
  assert.deepEqual(checkSeriesLayout(full.boxes, { demo: true }), []);
  assert.equal(
    full.chrome,
    0,
    "the band and the signature leave the parchment to the intro"
  );
});

// @req REQ-186
test("the end card closes the video in place of the 1.10.0 ending", () => {
  const end = at(last);
  assert.equal(end.ident.clip, "outro");
  assert.equal(end.ident.opacity, 1);
  assert.match(
    end.ident.text,
    /EthniAfrica\s*:\s*l’importance de\s*connaître nos noms\./
  );
  assert.match(
    end.ident.text.replace(/\s+/gu, " "),
    /Vous pouvez continuer la recherche sur EthniAfrica et vous abonner pour découvrir de nouvelles publications\./
  );
  assert.doesNotMatch(end.ident.text, /lien en profil/);
  assert.ok(
    end.ident.text.indexOf("Vous pouvez") < end.ident.text.indexOf("connaître"),
    "the end card prints the invitation before the line"
  );
  assert.match(end.ident.text, /Prochain épisode\s*:\s*Le nom Burkina Faso/);
  assert.match(end.ident.text, /@ethniafrica/);
  assert.doesNotMatch(
    end.text,
    /Vous pouvez continuer/,
    "the 1.10.0 block is not drawn under it"
  );
  assert.equal(end.chrome, 0);
});
