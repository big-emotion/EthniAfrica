import { describe, expect, it } from "vitest";

import {
  ELSEWHERE_ANCHORS,
  elsewhereAnchorFor,
} from "@/lib/search/elsewhereAnchors";

describe("« Pendant ce temps, ailleurs » anchors", () => {
  // @req REQ-198
  it("is a fixed list of 20 to 30 events", () => {
    expect(ELSEWHERE_ANCHORS.length).toBeGreaterThanOrEqual(20);
    expect(ELSEWHERE_ANCHORS.length).toBeLessThanOrEqual(30);
  });

  // @req REQ-198
  it("cites at least one typed source for every event", () => {
    for (const anchor of ELSEWHERE_ANCHORS) {
      expect(anchor.sources.length, anchor.sentence).toBeGreaterThan(0);
    }
  });

  // The register (« Meanwhile, elsewhere »): the outside event is a short
  // second sentence carrying its date, and none opens on « Ailleurs ».
  // @req REQ-198
  it("states each event in one sentence that ends on its date", () => {
    for (const anchor of ELSEWHERE_ANCHORS) {
      expect(anchor.sentence).not.toMatch(/^Ailleurs/);
      expect(anchor.sentence).toMatch(new RegExp(`${anchor.year}\\.$`));
    }
  });

  // @req REQ-198
  it("keeps the events in date order, one per year", () => {
    const years = ELSEWHERE_ANCHORS.map(({ year }) => year);
    expect(years).toEqual([...new Set(years)].sort((a, b) => a - b));
  });
});

describe("elsewhereAnchorFor", () => {
  // @req REQ-198
  it("finds the event within five years of a dated tile", () => {
    expect(elsewhereAnchorFor({ from: 1902, to: 1902 })?.year).toBe(1905);
  });

  // @req REQ-198
  it("takes the event nearest the middle of a long period", () => {
    expect(elsewhereAnchorFor({ from: 1000, to: 1099 })?.year).toBe(1066);
  });

  // @req REQ-198
  it("finds nothing for an undated tile or a year with no event near it", () => {
    expect(elsewhereAnchorFor({ from: null, to: null })).toBeUndefined();
    expect(elsewhereAnchorFor({ from: 1670, to: 1670 })).toBeUndefined();
  });
});
