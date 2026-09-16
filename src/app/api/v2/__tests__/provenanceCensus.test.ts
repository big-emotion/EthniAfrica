import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/api/v2/handlers/confidence", () => ({
  getProvenanceCensusHandler: vi.fn(),
}));

vi.mock("@/lib/api/cors", () => ({
  jsonWithCors: vi.fn((data, init) => {
    const response = new Response(JSON.stringify(data), init);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }),
  corsOptionsResponse: vi.fn(() => new Response(null, { status: 204 })),
}));

import { getProvenanceCensusHandler } from "@/api/v2/handlers/confidence";
import { GET } from "../confidence/[entityType]/[entityId]/census/route";

const envelope = {
  data: {
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
  },
  meta: {
    license: "CC-BY-SA-4.0",
    attribution: "EthniAfrica — ethniafrica.com",
  },
  errors: [],
};

function request(entityType: string, entityId: string) {
  return GET(
    new NextRequest(
      `http://localhost/api/v2/confidence/${entityType}/${entityId}/census`
    ),
    { params: Promise.resolve({ entityType, entityId }) }
  );
}

describe("GET /api/v2/confidence/[entityType]/[entityId]/census", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-084
  it("serves a country's census, which the confidence record itself cannot", async () => {
    vi.mocked(getProvenanceCensusHandler).mockResolvedValue(envelope);

    const response = await request("country", "CIV");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getProvenanceCensusHandler).toHaveBeenCalledWith("country", "CIV");
    expect(body.data.standings.needs_review).toBe(2);
  });

  // @req REQ-084
  it("refuses an entity type the census does not cover", async () => {
    const response = await request("relation", "REL_X");

    expect(response.status).toBe(400);
    expect(getProvenanceCensusHandler).not.toHaveBeenCalled();
  });

  // @req REQ-084
  it("answers 500 rather than an empty census when the fabric read fails", async () => {
    vi.mocked(getProvenanceCensusHandler).mockRejectedValue(
      new Error("db down")
    );

    const response = await request("country", "CIV");
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.errors[0].code).toBe("INTERNAL_ERROR");
  });
});
