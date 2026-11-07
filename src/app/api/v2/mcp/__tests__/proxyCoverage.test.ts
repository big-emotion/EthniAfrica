/**
 * The agent server is an ordinary /api/v2 route, so the proxy meters it like
 * the rest of the public API: the anonymous per-IP bucket without a key, the
 * key's tier with one, a 401 for a key that does not validate, and the same
 * security headers as every other response. These tests drive the real
 * `proxy()` with only the rate limiter and the key check mocked.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@/lib/api/auth", () => ({ validateApiKey: vi.fn() }));
vi.mock("@/lib/api/rate-limit", () => ({
  evaluateRateLimit: vi.fn(),
  applyIpRateLimit: vi.fn().mockResolvedValue(null),
}));

import { validateApiKey } from "@/lib/api/auth";
import { applyIpRateLimit, evaluateRateLimit } from "@/lib/api/rate-limit";
import { proxy } from "@/proxy";

const mcpRequest = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/v2/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });

describe("proxy coverage of /api/v2/mcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluateRateLimit).mockResolvedValue({
      rejection: null,
      headers: { "X-RateLimit-Limit": "60" },
    });
  });

  // @req REQ-052
  it("meters a keyless call in the anonymous bucket and forwards it with rate-limit headers", async () => {
    const response = await proxy(mcpRequest());
    expect(evaluateRateLimit).toHaveBeenCalledTimes(1);
    expect(vi.mocked(evaluateRateLimit).mock.calls[0]).toHaveLength(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
  });

  // @req REQ-033
  it("answers 429 when the bucket is spent", async () => {
    vi.mocked(evaluateRateLimit).mockResolvedValue({
      rejection: Response.json({ error: "rate_limited" }, { status: 429 }),
      headers: {},
    } as never);
    const response = await proxy(mcpRequest());
    expect(response.status).toBe(429);
  });

  // @req REQ-052
  it("refuses a Bearer key that does not validate with 401", async () => {
    vi.mocked(validateApiKey).mockResolvedValue({
      valid: false,
      reason: "invalid_key",
    } as never);
    const response = await proxy(
      mcpRequest({ Authorization: "Bearer not-a-key" })
    );
    expect(applyIpRateLimit).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
  });

  // @req REQ-052
  it("carries the strict API content security policy", async () => {
    const response = await proxy(mcpRequest());
    const csp = response.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/style-src 'self' 'nonce-/);
    expect(csp).not.toContain("'unsafe-inline'");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
