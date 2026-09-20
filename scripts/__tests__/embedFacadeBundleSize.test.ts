import { describe, expect, it } from "vitest";

import {
  EMBED_FACADE_BUNDLE_BUDGET_BYTES,
  evaluateEmbedFacadeBudget,
  measureEmbedFacadeGzipBytes,
} from "../embed-facade-bundle-size";

describe("embed facade bundle budget", () => {
  // @req REQ-181
  it("is 8 KB gzipped: consent, one piece of state, the URL builder, focus and copy", () => {
    expect(EMBED_FACADE_BUNDLE_BUDGET_BYTES).toBe(8 * 1024);
  });

  // @req REQ-181
  it("passes under the budget and names the island that grew when it does not", () => {
    const under = evaluateEmbedFacadeBudget(6 * 1024);
    expect(under.passed).toBe(true);
    expect(under.message).toContain("budget: 8 KB");

    const over = evaluateEmbedFacadeBudget(9 * 1024);
    expect(over.passed).toBe(false);
    expect(over.message).toContain("Embed facade bundle is");
    expect(over.message).toContain("exceeding the 8 KB budget by 1.00 KB");
  });

  // The built facade, not a stand-in: a facade that has grown a player
  // abstraction or a provider registry fails here rather than in review.
  // @req REQ-181
  it("holds the facade as built to its budget", async () => {
    const bytes = await measureEmbedFacadeGzipBytes();

    expect(bytes).toBeGreaterThan(0);
    expect(bytes).toBeLessThanOrEqual(EMBED_FACADE_BUNDLE_BUDGET_BYTES);
  }, 60_000);
});
