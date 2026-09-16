import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/v2/services/confidence", () => ({
  getProvenanceCensusFor: vi.fn(),
}));
vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { getProvenanceCensusFor } from "@/api/v2/services/confidence";
import { readProvenanceCensus } from "../provenanceCensus";

const census = {
  entityType: "country" as const,
  entityId: "CIV",
  assertionCount: 2,
  standings: { official: 2, referenced: 0, unverified: 0, needs_review: 0 },
  lastHumanAuditAt: null,
};

describe("reading a fiche's provenance census", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-084
  it("hands the census through when the fabric answers", async () => {
    vi.mocked(getProvenanceCensusFor).mockResolvedValue(census);

    expect(await readProvenanceCensus("country", "CIV")).toEqual(census);
  });

  // @req REQ-084
  it("drops the banner rather than the fiche when the fabric read fails", async () => {
    vi.mocked(getProvenanceCensusFor).mockRejectedValue(new Error("db down"));

    expect(await readProvenanceCensus("country", "CIV")).toBeNull();
  });
});
