import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/api/v2/handlers/auditLog", () => ({
  handleFlagAuditTrailRead: vi.fn(),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn() },
}));

import { handleFlagAuditTrailRead } from "@/api/v2/handlers/auditLog";
import { logger } from "@/lib/api/logger";
import { GET, OPTIONS } from "@/app/api/v2/flags/[id]/audit/route";

const params = Promise.resolve({ id: "00EZK83QDV" });

function request(headers: Record<string, string> = {}) {
  return new NextRequest(
    "https://ethniafrica.com/api/v2/flags/00EZK83QDV/audit",
    { headers }
  );
}

const envelope = {
  data: { publicSlug: "00EZK83QDV", entries: [] },
  meta: { license: "CC-BY-SA-4.0", attribution: "EthniAfrica" },
  errors: [],
};

describe("GET /api/v2/flags/[id]/audit", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-041
  it("hands the handler the bearer token and serves its status uncached", async () => {
    vi.mocked(handleFlagAuditTrailRead).mockResolvedValue({
      status: 200,
      body: envelope,
    });

    const response = await GET(request({ authorization: "Bearer mod-token" }), {
      params,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(handleFlagAuditTrailRead).toHaveBeenCalledWith("00EZK83QDV", {
      accessToken: "mod-token",
    });
    await expect(response.json()).resolves.toMatchObject({ errors: [] });
  });

  /**
   * A malformed or absent Authorization header reaches the handler as no
   * token at all, which refuses. Parsing it into something truthy here is how
   * an authorisation gate gets opened by the layer that only reads requests.
   */
  // @req REQ-041
  it("passes no token when the header is absent or not a bearer", async () => {
    vi.mocked(handleFlagAuditTrailRead).mockResolvedValue({
      status: 401,
      body: envelope,
    });

    await GET(request(), { params });
    await GET(request({ authorization: "Basic abc" }), { params });

    for (const call of vi.mocked(handleFlagAuditTrailRead).mock.calls) {
      expect(call[1]).toEqual({ accessToken: null });
    }
  });

  // @req REQ-041
  it("answers 500 without leaking the failure to the caller", async () => {
    vi.mocked(handleFlagAuditTrailRead).mockRejectedValue(
      new Error("permission denied for relation audit_log")
    );

    const response = await GET(request({ authorization: "Bearer mod-token" }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("audit_log");
    expect(logger.error).toHaveBeenCalled();
  });

  // @req REQ-041
  it("answers the CORS preflight", () => {
    expect(OPTIONS().status).toBeLessThan(400);
  });
});
