import { describe, expect, it } from "vitest";

import { eligiblePublications } from "../catalog";
import { getDiscoveryPublications } from "../entries";

describe("Découvertes source-bank adapter", () => {
  // @req REQ-157
  it("offers existing sourced, photographed anecdotes without copying their prose", () => {
    const entries = getDiscoveryPublications();
    expect(entries.map((entry) => entry.id)).toEqual([
      "anecdote:burkina-faso",
      "anecdote:guere-wobe",
    ]);
    expect(eligiblePublications(entries)).toHaveLength(2);
    expect(
      entries.every((entry) => entry.image.filePage.startsWith("https://"))
    ).toBe(true);
    expect(entries.every((entry) => entry.title.fr && entry.title.en)).toBe(
      true
    );
  });
});
