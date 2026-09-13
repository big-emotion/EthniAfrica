import { describe, expect, it } from "vitest";

import { findProverb } from "@/lib/proverbs/proverbs";

import { eligiblePublications } from "../catalog";
import { DISCOVERY_PROVERB_IDS, getDiscoveryPublications } from "../entries";

describe("Découvertes source-bank adapter", () => {
  // @req REQ-157
  it("offers existing sourced, photographed anecdotes without copying their prose", () => {
    const entries = getDiscoveryPublications().filter(
      (entry) => entry.kind === "anecdote"
    );
    expect(entries.map((entry) => entry.id)).toEqual([
      "anecdote:burkina-faso",
      "anecdote:guere-wobe",
    ]);
    expect(eligiblePublications(entries)).toHaveLength(2);
    expect(
      entries.every((entry) => entry.image?.filePage.startsWith("https://"))
    ).toBe(true);
    expect(entries.every((entry) => entry.title.fr && entry.title.en)).toBe(
      true
    );
  });

  // The reader is a place a visitor lands on without context, so it only
  // takes proverbs whose people a source with authority names. An estimated
  // or unestablished origin stays in the dossier, where its label is read.
  // @req REQ-157
  it("offers the chosen proverbs only where a source with authority attests their origin", () => {
    const proverbs = getDiscoveryPublications().filter(
      (entry) => entry.kind === "proverb"
    );

    expect(DISCOVERY_PROVERB_IDS.length).toBeGreaterThan(0);
    expect(proverbs.map((entry) => entry.id)).toEqual(
      DISCOVERY_PROVERB_IDS.map((id) => `proverb:${id}`)
    );
    expect(eligiblePublications(proverbs)).toHaveLength(proverbs.length);
    for (const id of DISCOVERY_PROVERB_IDS) {
      expect(findProverb(id)?.origin.status, id).toBe("attested");
    }
  });
});
