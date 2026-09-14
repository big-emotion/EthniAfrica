import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildSourceReviewQueue,
  citationKey,
  filterSourceReviewQueue,
} from "@/lib/sources/sourceReviewQueue";

let datasetRoot: string;

function writeFiche(relativePath: string, sources: unknown[]) {
  const file = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ content: { sources } }), "utf8");
}

const WPP = "ONU – World Population Prospects 2025";

beforeEach(() => {
  datasetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "review-queue-"));
  writeFiche("pays/BEN.json", [
    { title: WPP, url: null, tier: "needs_review" },
    { title: "Déjà tranché", url: null, tier: "official" },
  ]);
  writeFiche("peuples/FLG_X/PPL_A.json", [
    { title: WPP, url: null, tier: "needs_review" },
    { title: WPP, url: "https://population.un.org", tier: "needs_review" },
  ]);
  writeFiche("famille_linguistique/FLG_X.json", [
    { title: "Glottolog", url: "https://glottolog.org", tier: "needs_review" },
  ]);
  // Outside the three fiche kinds a ruling is made for.
  writeFiche("noms/PPL_A.json", [{ title: "Nom", url: null }]);
});

afterEach(() => {
  fs.rmSync(datasetRoot, { recursive: true, force: true });
});

describe("buildSourceReviewQueue", () => {
  // A ruling names one exact title + url, so the queue has one card per pair,
  // listing every fiche it would apply to.
  // @req REQ-092
  it("groups the citations awaiting review by exact title and url", () => {
    const queue = buildSourceReviewQueue(datasetRoot);

    expect(queue.map((item) => [item.title, item.url])).toEqual([
      [WPP, null],
      ["Glottolog", "https://glottolog.org"],
      [WPP, "https://population.un.org"],
    ]);
    expect(queue[0].fiches).toEqual([
      { path: "pays/BEN.json", ficheId: "BEN", kind: "pays" },
      { path: "peuples/FLG_X/PPL_A.json", ficheId: "PPL_A", kind: "peuples" },
    ]);
  });
});

describe("filterSourceReviewQueue", () => {
  // @req REQ-092
  it("narrows by fiche kind, address, fiche and decision state", () => {
    const queue = buildSourceReviewQueue(datasetRoot);
    const decided = new Set([citationKey(WPP, null)]);

    expect(
      filterSourceReviewQueue(queue, { kind: "famille_linguistique" }, decided)
    ).toHaveLength(1);
    expect(
      filterSourceReviewQueue(queue, { hasUrl: false }, decided).map(
        (item) => item.url
      )
    ).toEqual([null]);
    expect(
      filterSourceReviewQueue(queue, { fiche: "ppl_a" }, decided)
    ).toHaveLength(2);
    expect(
      filterSourceReviewQueue(queue, { state: "decided" }, decided).map(
        (item) => item.key
      )
    ).toEqual([citationKey(WPP, null)]);
    expect(
      filterSourceReviewQueue(queue, { state: "to-review" }, decided)
    ).toHaveLength(2);
  });
});
