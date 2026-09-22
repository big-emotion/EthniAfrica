// @req REQ-034
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const STORED_HASH =
  "pbkdf2v1:600000:AAAAAAAAAAAAAAAAAAAAAA==:deadbeef1234567890abcdef12345678deadbeef1234567890abcdef12345678";

const mocks = vi.hoisted(() => ({
  hashApiKey: vi.fn(),
  applyKeyIssuanceRateLimit: vi.fn(),
  keyRows: [] as Array<Record<string, unknown>>,
  insertError: null as { message: string } | null,
}));

vi.mock("@/lib/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/auth")>()),
  hashApiKey: mocks.hashApiKey,
}));

vi.mock("@/lib/api/rate-limit", () => ({
  applyKeyIssuanceRateLimit: mocks.applyKeyIssuanceRateLimit,
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// A small in-memory api_keys table: the route, handler and service run for
// real against it, so the one-key-per-address rule is what is being tested.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => {
        const filters: Array<[string, unknown]> = [];
        const query = {
          eq: (column: string, value: unknown) => {
            filters.push([column, value]);
            return query;
          },
          is: (column: string, value: unknown) => {
            filters.push([column, value]);
            return query;
          },
          maybeSingle: async () => ({
            data:
              mocks.keyRows.find((row) =>
                filters.every(([column, value]) => row[column] === value)
              ) ?? null,
            error: null,
          }),
        };
        return query;
      },
      insert: async (row: Record<string, unknown>) => {
        if (mocks.insertError) return { error: mocks.insertError };
        mocks.keyRows.push({ revoked_at: null, ...row });
        return { error: null };
      },
    }),
  }),
}));

import * as issueRoute from "../route";
import { API_ATTRIBUTION, API_LICENSE } from "@/api/v2/utils/response";

const { POST } = issueRoute;

function post(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/v2/keys/issue", {
    method: "POST",
    headers,
  });
}

describe("POST /api/v2/keys/issue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.keyRows.length = 0;
    mocks.insertError = null;
    mocks.hashApiKey.mockResolvedValue(STORED_HASH);
    mocks.applyKeyIssuanceRateLimit.mockResolvedValue(null);
  });

  // Creating a key is a write. A GET that writes can be fired by a link
  // preview, a crawler or a cross-site image tag, so only POST is exported
  // and Next.js answers every other verb with 405.
  // @req REQ-034
  it("exports no GET handler", () => {
    expect("GET" in issueRoute).toBe(false);
  });

  // @req REQ-034
  it("issues a public key to a caller and stores only its hash", async () => {
    const response = await POST(post({ "x-forwarded-for": "203.0.113.1" }));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.meta).toEqual({
      license: API_LICENSE,
      attribution: API_ATTRIBUTION,
    });
    expect(json.errors).toEqual([]);
    expect(json.data.tier).toBe("public");
    expect(json.data.key.startsWith("pub_")).toBe(true);
    expect(mocks.keyRows).toHaveLength(1);
    expect(mocks.keyRows[0]).toMatchObject({
      tier: "public",
      active: true,
      ip_address: "203.0.113.1",
      key_hash: STORED_HASH,
    });
    expect(JSON.stringify(mocks.keyRows)).not.toContain(json.data.key);
  });

  // @req REQ-034
  it("never returns the stored hash and forbids caching the response", async () => {
    const response = await POST(post({ "x-forwarded-for": "203.0.113.1" }));
    const body = await response.text();

    expect(body).not.toContain(STORED_HASH);
    expect(body).not.toContain("key_hash");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  // @req REQ-034
  it("refuses a second key to the same address without hashing again", async () => {
    await POST(post({ "x-forwarded-for": "203.0.113.1" }));
    const second = await POST(post({ "x-forwarded-for": "203.0.113.1" }));
    const json = await second.json();

    expect(second.status).toBe(409);
    expect(json.data).toBeNull();
    expect(json.errors).toEqual([
      {
        code: "RATE_LIMITED",
        message:
          "An active public API key has already been issued for this IP address.",
      },
    ]);
    expect(mocks.hashApiKey).toHaveBeenCalledTimes(1);
    expect(mocks.keyRows).toHaveLength(1);
  });

  // The client writes the front of X-Forwarded-For; only the hop the proxy
  // appended identifies it. Rotating the prefix must not mint a new identity.
  // @req REQ-034
  it("keeps one identity when a caller prepends spoofed addresses", async () => {
    const first = await POST(
      post({ "x-forwarded-for": "1.1.1.1, 203.0.113.1" })
    );
    const second = await POST(
      post({ "x-forwarded-for": "9.9.9.9, 203.0.113.1" })
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(mocks.keyRows.map((row) => row.ip_address)).toEqual(["203.0.113.1"]);
  });

  // @req REQ-034
  it("gives two different callers a key each", async () => {
    const first = await POST(post({ "x-forwarded-for": "203.0.113.1" }));
    const second = await POST(post({ "x-forwarded-for": "203.0.113.2" }));

    expect([first.status, second.status]).toEqual([201, 201]);
  });

  // @req REQ-034
  it("refuses to issue when no address names the caller", async () => {
    const response = await POST(post());

    expect(response.status).toBe(400);
    expect(mocks.hashApiKey).not.toHaveBeenCalled();
    expect(mocks.keyRows).toHaveLength(0);
  });

  // @req REQ-034
  it("answers with the limiter's rejection before doing any work", async () => {
    mocks.applyKeyIssuanceRateLimit.mockResolvedValue(
      NextResponse.json({ error: "rate_limited" }, { status: 429 })
    );

    const response = await POST(post({ "x-forwarded-for": "203.0.113.1" }));

    expect(response.status).toBe(429);
    expect(mocks.hashApiKey).not.toHaveBeenCalled();
    expect(mocks.keyRows).toHaveLength(0);
  });

  // @req REQ-034
  it("answers 500 with a generic message when storing the key fails", async () => {
    mocks.insertError = { message: "connection string leaked here" };

    const response = await POST(post({ "x-forwarded-for": "203.0.113.1" }));
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(body).errors).toEqual([
      { code: "INTERNAL_ERROR", message: "Failed to issue API key" },
    ]);
    expect(body).not.toContain("leaked");
  });

  // @req REQ-034
  it("answers the CORS preflight", () => {
    const response = issueRoute.OPTIONS();

    expect(response.headers.get("access-control-allow-methods")).toContain(
      "POST"
    );
  });
});
