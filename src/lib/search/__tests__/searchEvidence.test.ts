import { describe, expect, it } from "vitest";

import {
  searchSourceStanding,
  strongestSearchSourceStanding,
  toSourceChainEvidence,
  type SearchEvidence,
} from "@/lib/search/evidence";

describe("search evidence", () => {
  // @req REQ-180
  it("keeps an unclassified source awaiting review", () => {
    expect(searchSourceStanding(null)).toBe("needs_review");
    expect(searchSourceStanding("retired-tier")).toBe("needs_review");
  });

  // @req REQ-180
  it("summarises a mixed citation by its strongest source", () => {
    expect(
      strongestSearchSourceStanding([
        { tier: "needs_review" },
        { tier: "unverified" },
        { tier: "official" },
        { tier: "referenced" },
      ])
    ).toBe("official");
  });

  // @req REQ-180
  it("adapts to the source sheet without losing assertion or source data", () => {
    const evidence: SearchEvidence = {
      assertion: {
        id: "assertion-one",
        statement: "A recorded position.",
        confidenceScore: 0.85,
        sourceCount: 1,
        lastHumanAuditAt: "2026-09-01",
      },
      sources: [
        {
          id: "source-one",
          title: "A source",
          tier: "referenced",
          url: "https://example.org/source",
        },
      ],
      standing: "referenced",
    };

    const adapted = toSourceChainEvidence(evidence);

    expect(adapted.assertion).toBe(evidence.assertion);
    expect(adapted.sources).toBe(evidence.sources);
    expect(adapted.assertion.confidenceScore).toBe(0.85);
  });

  // @req REQ-180
  it("does not invent confidence for an otherwise complete sourced assertion", () => {
    const evidence: SearchEvidence = {
      assertion: {
        id: "assertion-without-score",
        statement: "A sourced statement.",
        sourceCount: 1,
        lastHumanAuditAt: null,
      },
      sources: [{ id: "source-one", title: "A source", tier: "referenced" }],
      standing: "referenced",
    };

    expect(toSourceChainEvidence(evidence).assertion).not.toHaveProperty(
      "confidenceScore"
    );
  });
});
