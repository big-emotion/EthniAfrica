import { describe, expect, it } from "vitest";

import {
  OUTCOME_RANK,
  READER_QUERIES,
} from "@/lib/search/__fixtures__/readerQueries";
import {
  searchAfter,
  searchBefore,
} from "@/lib/search/__fixtures__/readerQueryPipeline";

// The model is a regression instrument over the corpus names in the repository
// (see corpusNameModel.ts); the SQL functions remain the authority.
describe("what readers really typed (search_query_log, September 2026)", () => {
  // @req REQ-178
  it("covers at least twenty-five real queries", () => {
    expect(READER_QUERIES.length).toBeGreaterThanOrEqual(25);
  });

  // @req REQ-178
  it.each(READER_QUERIES)(
    "$typed — $problem → $outcome",
    ({ typed, outcome, answered }) => {
      const after = searchAfter(typed);

      expect(after.outcome).toBe(outcome);
      expect(after.reviewedAnswer).toBe(answered === true);
    }
  );

  // A tolerance that helps one reader by hurting another is not tolerance.
  // @req REQ-178
  it.each(READER_QUERIES)("$typed is never worse than before", ({ typed }) => {
    expect(OUTCOME_RANK[searchAfter(typed).outcome]).toBeGreaterThanOrEqual(
      OUTCOME_RANK[searchBefore(typed).outcome]
    );
  });

  // The neighbour is offered, never substituted: a query that reached only a
  // neighbour has no entry answering to it.
  // @req REQ-178
  it("lists near names only when no entry answers to the name", () => {
    for (const { typed } of READER_QUERIES) {
      const after = searchAfter(typed);
      if (after.outcome === "neighbour") {
        expect(after.reached.length).toBeGreaterThan(0);
        expect(searchBefore(typed).outcome).not.toBe("hit");
      }
    }
  });
});
