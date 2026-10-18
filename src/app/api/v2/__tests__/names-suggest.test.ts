// @req REQ-200
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/api/v2/handlers/nameSuggestions", () => ({
  nameSuggestionsHandler: vi.fn(async (query: string) => ({
    data: { query, suggestions: [] },
    meta: {},
    errors: [],
  })),
}));

import { nameSuggestionsHandler } from "@/api/v2/handlers/nameSuggestions";
import { GET, OPTIONS } from "../names/suggest/route";

describe("GET /api/v2/names/suggest", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-200
  it("defaults limit to eight and sets CORS and cache headers", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v2/names/suggest?q=pe")
    );
    expect(response.status).toBe(200);
    expect(nameSuggestionsHandler).toHaveBeenCalledWith("pe", 8);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "GET"
    );
    expect(response.headers.get("Vary")).toContain("Origin");
    expect(response.headers.get("Cache-Control")).toBe("s-maxage=3600");
  });

  // @req REQ-200
  it("rejects a one-character prefix with the standard validation envelope", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v2/names/suggest?q=p")
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      errors: [{ code: "VALIDATION_ERROR", field: "q" }],
    });
    expect(nameSuggestionsHandler).not.toHaveBeenCalled();
  });

  // @req REQ-200
  it("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
