import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../services/confidence", () => ({
  getProvenanceCensusFor: vi.fn(),
}));

import { getProvenanceCensusFor } from "../../services/confidence";
import { getProvenanceCensusHandler } from "../confidence";

const census = {
  entityType: "country" as const,
  entityId: "CIV",
  assertionCount: 21,
  standings: {
    official: 4,
    referenced: 11,
    unverified: 4,
    needs_review: 2,
  },
  lastHumanAuditAt: "2026-03-12T00:00:00.000Z",
};

describe("the provenance census handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-084
  it("serves the four counts and the audit stamp in the Module #0 envelope", async () => {
    vi.mocked(getProvenanceCensusFor).mockResolvedValue(census);

    const envelope = await getProvenanceCensusHandler("country", "CIV");

    expect(getProvenanceCensusFor).toHaveBeenCalledWith("country", "CIV");
    expect(envelope.data).toEqual(census);
    expect(envelope.meta.license).toBe("CC-BY-SA-4.0");
    expect(envelope.errors).toEqual([]);
  });

  // @req REQ-084
  it("puts no confidence figure on the envelope's meta", async () => {
    vi.mocked(getProvenanceCensusFor).mockResolvedValue(census);

    const envelope = await getProvenanceCensusHandler("country", "CIV");

    // The census exists because an aggregate over chapters of unequal
    // provenance describes none of them. Handing one back on `meta` would
    // put the figure it refuses one field away from the counts.
    expect(envelope.meta.confidence).toBeUndefined();
  });
});
