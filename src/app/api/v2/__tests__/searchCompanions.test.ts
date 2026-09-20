import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/api/v2/handlers/searchCompanions", () => ({
  getSearchCompanionsHandler: vi.fn(),
}));

vi.mock("@/lib/api/cors", () => ({
  jsonWithCors: vi.fn((data, init) => new Response(JSON.stringify(data), init)),
  corsOptionsResponse: vi.fn(() => new Response(null, { status: 204 })),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { getSearchCompanionsHandler } from "@/api/v2/handlers/searchCompanions";
import { CORPUS_CACHE_CONTROL } from "@/api/v2/utils/corpusRoute";
import { GET, OPTIONS } from "../search/companions/route";

const emptyEnvelope = {
  data: {
    subjects: [],
    shorts: { count: 0, items: [] },
    anecdotes: { count: 0, items: [] },
    proverbs: { count: 0, items: [] },
    images: { count: 0, items: [] },
    quiz: { count: 0, item: null },
  },
  meta: {
    license: "CC-BY-SA-4.0",
    attribution: "EthniAfrica — ethniafrica.com",
  },
  errors: [],
};

describe("GET /api/v2/search/companions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSearchCompanionsHandler).mockResolvedValue(emptyEnvelope);
  });

  // @req REQ-180
  it("parses typed subjects and caches a successful response for one hour", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/v2/search/companions?subjects=people:PPL_BASSA,country:CMR&lang=en"
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(CORPUS_CACHE_CONTROL);
    expect(getSearchCompanionsHandler).toHaveBeenCalledWith({
      lang: "en",
      subjects: [
        { type: "people", id: "PPL_BASSA" },
        { type: "country", id: "CMR" },
      ],
    });
  });

  // @req REQ-180
  it("allows no subjects for a recent-content fallback", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v2/search/companions")
    );

    expect(response.status).toBe(200);
    expect(getSearchCompanionsHandler).toHaveBeenCalledWith({
      lang: "fr",
      subjects: [],
    });
  });

  // @req REQ-180
  it.each([
    ["subjects=person:PRS_1", "subjects"],
    ["subjects=country:NGA&lang=es", "lang"],
    [
      `subjects=${Array.from({ length: 21 }, (_, index) => `people:PPL_${index}`).join(",")}`,
      "subjects",
    ],
  ])("rejects invalid query parameters: %s", async (query, field) => {
    const response = await GET(
      new NextRequest(`http://localhost/api/v2/search/companions?${query}`)
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(body.errors[0]).toMatchObject({
      code: "VALIDATION_ERROR",
      field,
    });
    expect(getSearchCompanionsHandler).not.toHaveBeenCalled();
  });

  // @req REQ-180
  it("returns an uncached internal error when companion loading fails", async () => {
    vi.mocked(getSearchCompanionsHandler).mockRejectedValue(
      new Error("database unavailable")
    );

    const response = await GET(
      new NextRequest(
        "http://localhost/api/v2/search/companions?subjects=country:NGA"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(body.errors[0].code).toBe("INTERNAL_ERROR");
  });

  // @req REQ-180
  it("returns the shared CORS preflight response", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
