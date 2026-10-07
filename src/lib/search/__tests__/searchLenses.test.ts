import { describe, expect, it } from "vitest";

import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { buildFeedLenses } from "@/lib/search/searchLenses";

const labels = searchFeedCopy.fr.filters;

describe("feed lenses", () => {
  // A tab that opens onto nothing is a promise the page cannot keep, so a
  // lens with no content is not offered rather than offered with a zero.
  // @req REQ-178
  it("offers « Tout » alone when nothing else has content", () => {
    expect(
      buildFeedLenses(
        { shorts: 0, stories: 0, images: 0, quiz: 0, fiches: 0 },
        labels
      )
    ).toEqual([{ id: "all", label: "Tout" }]);
  });

  // @req REQ-178
  it("lists the lenses that have content, in the validated order, each with its count", () => {
    expect(
      buildFeedLenses(
        { shorts: 5, stories: 3, images: 6, quiz: 1, fiches: 98 },
        labels
      )
    ).toEqual([
      { id: "all", label: "Tout" },
      { id: "shorts", label: "Shorts", count: 5 },
      { id: "stories", label: "Récits", count: 3 },
      { id: "images", label: "Images", count: 6 },
      { id: "quiz", label: "Jeux", count: 1 },
      { id: "fiches", label: "Fiches", count: 98 },
    ]);
  });

  // @req REQ-178
  it("never carries a zero or a missing count onto a tab", () => {
    const lenses = buildFeedLenses(
      { shorts: 0, stories: 2, images: 0, quiz: 0, fiches: 7 },
      labels
    );

    expect(lenses.map(({ id }) => id)).toEqual(["all", "stories", "fiches"]);
    for (const lens of lenses.slice(1)) expect(lens.count).toBeGreaterThan(0);
  });
});
