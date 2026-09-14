import { describe, expect, it } from "vitest";
import {
  authorizedSourceCatalog,
  authorizedSourceCatalogSchema,
  evaluateSourceUrl,
} from "@/lib/sources/authorized-source-catalog";

/** The messages a catalogue is refused with, or none when it loads. */
function catalogueIssues(value: unknown): string[] {
  const parsed = authorizedSourceCatalogSchema.safeParse(value);
  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.message);
}

const wikipedia = {
  key: "wikipedia",
  name: "Wikipedia",
  tier: "unverified",
  sourceKind: "discovery",
  matchDomains: ["wikipedia.org"],
};

describe("authorized source catalogue", () => {
  // @req REQ-092
  it("contains unique stable keys and coherent tiers", () => {
    expect(catalogueIssues(authorizedSourceCatalog)).toEqual([]);

    expect(
      new Set(authorizedSourceCatalog.entries.map((entry) => entry.key)).size
    ).toBe(authorizedSourceCatalog.entries.length);
  });

  // @req REQ-092
  it("rejects a discovery surface claiming authority", () => {
    const issues = catalogueIssues({
      version: 99,
      entries: [{ ...wikipedia, tier: "official" }],
    });
    expect(issues).toEqual([
      'wikipedia: a discovery source cannot be tiered "official"',
    ]);
  });

  // The catalogue is read once, at import: refusing it there is what keeps an
  // incoherent file from tiering citations for a whole build.
  // @req REQ-092
  it("refuses a catalogue that files two sources under one key", () => {
    expect(
      catalogueIssues({ version: 99, entries: [wikipedia, wikipedia] })
    ).toEqual(["Duplicate source key: wikipedia"]);
  });

  // @req REQ-092
  it.each([
    ["https://www.un.org/development/desa/pd/", "official"],
    ["https://glottolog.org/", "official"],
    ["https://www.jstor.org/stable/123", "referenced"],
    ["https://growup.ethz.ch/atlas/pdf/Madagascar.pdf", "referenced"],
    ["https://en.wikipedia.org/wiki/Yoruba_people", "unverified"],
    ["https://www.worldcat.org/title/example", "unverified"],
    ["https://chat.openai.com/", "unverified"],
  ])("tiers %s as %s", (url, tier) => {
    expect(evaluateSourceUrl(url)).toMatchObject({ tier });
  });

  // @req REQ-092
  it("keeps AI provenance on the source_kind axis, not the tier", () => {
    expect(evaluateSourceUrl("https://claude.ai/chat/123")).toEqual({
      key: "ai-generated",
      tier: "unverified",
      sourceKind: "ai_generated",
    });
  });

  // @req REQ-092
  it("tiers an off-catalogue source as unverified rather than refusing it", () => {
    expect(evaluateSourceUrl("https://unclassified.example/evidence")).toEqual({
      key: "unknown",
      tier: "unverified",
      sourceKind: "unknown",
    });
  });
});
