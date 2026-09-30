import { describe, expect, it } from "vitest";

import { readArticleCorpus } from "../corpus";

// The listing shows its error state when any record is invalid, so one bad
// draft would hide every published article. The gate is here, in the suite
// every pull request runs, rather than at request time.
describe("the committed article bank", () => {
  // @req REQ-114
  it("holds no invalid record", () => {
    expect(readArticleCorpus().errors).toEqual([]);
  });
});
