import { describe, expect, it } from "vitest";

import { PROVERB_IMAGES } from "@/lib/proverbs/proverbImages";
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

  // @req REQ-157
  it("carries each proverb's photograph, credit and both alts into its publication", () => {
    const proverbs = getDiscoveryPublications().filter(
      (entry) => entry.kind === "proverb"
    );

    for (const entry of proverbs) {
      const picture = PROVERB_IMAGES[entry.id.replace("proverb:", "")];
      expect(entry.image?.src, entry.id).toBe(picture.src);
      expect(entry.image?.filePage, entry.id).toBe(picture.filePage);
      expect(entry.image?.alt?.fr, entry.id).toBe(picture.alt.fr);
      expect(entry.image?.alt?.en, entry.id).toBe(picture.alt.en);
      expect(entry.image?.licence, entry.id).toBe(picture.licence);
    }
  });
});
