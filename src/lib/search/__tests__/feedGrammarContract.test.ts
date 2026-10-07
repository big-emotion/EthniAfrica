import { describe, expect, expectTypeOf, it } from "vitest";

import {
  ANSWER_BLOCKS,
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
      "answer-what",
      "answer-origin",
      "answer-names",
      "answer-where",
      "answer-next",
      "answer-sources",
      "fiche-link",
      "shorts",
      "plates",
      "quiz",
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

  // The six answer blocks are the page's answer, in the order the operator
  // validated; the blocks that used to stack under them left « Tout ».
  // @req REQ-178
  it("keeps the six answer blocks contiguous and in the validated order", () => {
    expect(ANSWER_BLOCKS).toEqual([
      "answer-what",
      "answer-origin",
      "answer-names",
      "answer-where",
      "answer-next",
      "answer-sources",
    ]);
    const first = FEED_BLOCKS.indexOf(ANSWER_BLOCKS[0]);
    expect(FEED_BLOCKS.slice(first, first + 6)).toEqual([...ANSWER_BLOCKS]);
    for (const retired of [
      "origins",
      "peoples",
      "shared-name",
      "tiles",
      "atlas-holds",
      "problem",
      "near-name",
    ]) {
      expect(FEED_BLOCKS).not.toContain(retired);
    }
  });

  // @req REQ-180
  it("publishes stable manifest vocabularies from their tuples", () => {
    expect(FEED_ZONES).toEqual(["first", "primary", "closing"]);
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
