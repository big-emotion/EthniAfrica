// @req REQ-186
// The ending without « lien en profil » (operator, 26 October 2026), drawn in
// the pinned Chromium: the printed invitation follows the sequence's
// `ending.profileLink: false`, in the same two lines and place as the fixed
// one, and the default ending still prints the link.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameCount } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const root = mkdtempSync(join(tmpdir(), "series-closing-link-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));

const WITHOUT_LINK = [
  "L’importance de",
  "connaître nos noms.",
  "Vous pouvez continuer la recherche",
  "sur EthniAfrica.",
];
const lastFrame = async (name, options) => {
  const dir = join(root, name);
  const seq = loadSeriesVideo(seriesDemo(dir, options), { dir });
  const [frame] = await renderSeriesFrames(seq, [seriesFrameCount(seq) - 1], {
    diagnose: true,
  });
  return frame;
};

// @req REQ-186
test("the ending prints the invitation without « lien en profil » when the sequence drops it", async () => {
  const end = await lastFrame("without", {
    edit: (input) => {
      input.ending = { profileLink: false };
    },
    script: (beats) => {
      beats.at(-1).chunks = WITHOUT_LINK.map((text) => ({ text, duration: 2 }));
      return beats;
    },
  });
  const flat = end.text.replace(/\s+/gu, " ");
  assert.ok(
    flat.includes("Vous pouvez continuer la recherche sur EthniAfrica."),
    flat
  );
  assert.doesNotMatch(flat, /lien en profil/u);
  const [, invitation] = end.boxes.filter((b) => b.kind === "ending");
  assert.ok(Math.abs(invitation.y - 474) <= 1, `invitation at ${invitation.y}`);
  assert.ok(Math.abs(invitation.h - 2 * 40) <= 1, `two lines: ${invitation.h}`);
});

// @req REQ-186
test("the default ending still prints « lien en profil »", async () => {
  const end = await lastFrame("default");
  assert.match(
    end.text.replace(/\s+/gu, " "),
    /sur EthniAfrica, lien en profil\./u
  );
});
