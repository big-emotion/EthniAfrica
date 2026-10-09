import { describe, expect, it } from "vitest";

import {
  ELSEWHERE_ANCHORS,
  africanRegionsOf,
  elsewhereAnchorFor,
} from "@/lib/search/elsewhereAnchors";

const isAfrican = ({ africanRegions }: { africanRegions: string[] }) =>
  africanRegions.length > 0;

describe("« Pendant ce temps, ailleurs » anchors", () => {
  // @req REQ-198
  it("cites at least one typed source for every event", () => {
    for (const anchor of ELSEWHERE_ANCHORS) {
      expect(anchor.sources.length, anchor.sentence).toBeGreaterThan(0);
    }
  });

  // Operator ruling 2026-10-09 (ETNI-2012 review): the list mixes African
  // events with French and Belgian school history, neither side dominating.
  // @req REQ-198
  it("mixes African events with French and Belgian school history", () => {
    const african = ELSEWHERE_ANCHORS.filter(isAfrican).length;
    const share = african / ELSEWHERE_ANCHORS.length;

    expect(share).toBeGreaterThanOrEqual(0.35);
    expect(share).toBeLessThanOrEqual(0.65);
  });

  // Balanced across the periods the corpus dates: from the 14th century on,
  // where most dated name accounts sit, every century has both kinds.
  // @req REQ-198
  it("has an African and a non-African event in every century from 1300", () => {
    for (let century = 1300; century < 2000; century += 100) {
      const inCentury = ELSEWHERE_ANCHORS.filter(
        ({ year }) => year >= century && year < century + 100
      );
      expect(inCentury.some(isAfrican), `${century}s, African`).toBe(true);
      expect(
        inCentury.some((anchor) => !isAfrican(anchor)),
        `${century}s, outside Africa`
      ).toBe(true);
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

describe("africanRegionsOf", () => {
  // @req REQ-198
  it("reads a subject's African regions from its countries", () => {
    expect(africanRegionsOf(["MLI", "SEN"])).toEqual(["west"]);
    expect(africanRegionsOf(["NGA", "CMR"])).toEqual(["west", "central"]);
    expect(africanRegionsOf(["MOZ", "ZAF"])).toEqual(["east", "southern"]);
  });

  // @req REQ-198
  it("knows no region for a subject without countries", () => {
    expect(africanRegionsOf(undefined)).toEqual([]);
    expect(africanRegionsOf([])).toEqual([]);
    expect(africanRegionsOf(["XXX"])).toEqual([]);
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

  // « Ailleurs » has to stay elsewhere: a West African name is not set
  // against Mansa Moussa, but against an event from another region.
  // @req REQ-198
  it("skips an African event from the subject's own region", () => {
    expect(elsewhereAnchorFor({ from: 1324, to: 1324 }, ["east"])?.year).toBe(
      1324
    );
    expect(elsewhereAnchorFor({ from: 1324, to: 1324 }, ["west"])?.year).toBe(
      1325
    );
    expect(
      elsewhereAnchorFor({ from: 1960, to: 1960 }, ["central"])?.year
    ).toBe(1961);
  });

  // An event can concern two regions (the Mali king in Cairo): it is skipped
  // for a subject from either.
  // @req REQ-198
  it("skips an event that touches any of the subject's regions", () => {
    expect(
      elsewhereAnchorFor({ from: 1324, to: 1324 }, ["north"])?.year
    ).not.toBe(1324);
  });

  // Without a known region, no African event can be shown to be elsewhere,
  // so only events outside Africa are offered.
  // @req REQ-198
  it("offers only events outside Africa when the subject's region is unknown", () => {
    expect(elsewhereAnchorFor({ from: 1324, to: 1324 })).toBeUndefined();
    expect(elsewhereAnchorFor({ from: 1960, to: 1960 }, [])?.year).toBe(1958);
  });
});
