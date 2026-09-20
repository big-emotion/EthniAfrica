import { describe, expect, expectTypeOf, it } from "vitest";

import {
  FEED_BLOCKS,
  FEED_ZONES,
  OWED_PARTS,
  SEARCH_RESULT_STATES,
  type FeedBlockId,
  type FeedZone,
  type OwedPartId,
  type SearchResultState,
} from "@/lib/search/resultGrammar";

describe("search-result feed grammar", () => {
  // @req REQ-180
  it("keeps one canonical order for top-level blocks and owed parts", () => {
    expect(FEED_BLOCKS).toEqual([
      "lenses",
      "verdict",
      "appellations",
      "shorts",
      "origins",
      "peoples",
      "shared-name",
      "tiles",
      "atlas-holds",
      "plates",
      "quiz",
      "images",
      "problem",
      "near-name",
      "fiches",
      "owed",
      "further",
    ]);
    expect(new Set(FEED_BLOCKS).size).toBe(FEED_BLOCKS.length);

    expect(OWED_PARTS).toEqual(["silences", "conviction", "invitation"]);
    expect(FEED_BLOCKS).not.toContain("silences");
    expect(FEED_BLOCKS).not.toContain("conviction");
    expect(FEED_BLOCKS).not.toContain("invitation");
  });

  // @req REQ-180
  it("publishes stable manifest vocabularies from their tuples", () => {
    expect(FEED_ZONES).toEqual(["first", "primary", "secondary", "closing"]);
    expect(SEARCH_RESULT_STATES).toEqual([
      "exact",
      "widened",
      "typo",
      "unknown",
      "loading",
      "failed",
    ]);

    expectTypeOf<FeedBlockId>().toEqualTypeOf<(typeof FEED_BLOCKS)[number]>();
    expectTypeOf<OwedPartId>().toEqualTypeOf<(typeof OWED_PARTS)[number]>();
    expectTypeOf<FeedZone>().toEqualTypeOf<(typeof FEED_ZONES)[number]>();
    expectTypeOf<SearchResultState>().toEqualTypeOf<
      (typeof SEARCH_RESULT_STATES)[number]
    >();
  });
});
