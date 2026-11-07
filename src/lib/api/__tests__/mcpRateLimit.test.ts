// @req REQ-059
/**
 * ChatGPT and Claude reach /api/v2/mcp from a few shared egress addresses, so
 * the default anonymous bucket (60 a minute per address) would throttle every
 * user of an assistant together. The endpoint gets its own anonymous bucket,
 * larger and set by MCP_RATE_LIMIT_IP_RPM. These tests go through the real
 * proxy() and only replace the Upstash client.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { limitByPrefix } = vi.hoisted(() => ({
  limitByPrefix: new Map<string, ReturnType<typeof vi.fn>>(),
}));

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(function () {
    return {};
  }),
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    vi.fn().mockImplementation(function (options: {
      prefix: string;
      limiter: { max: number };
    }) {
      const limit = vi.fn().mockResolvedValue({
        success: true,
        limit: options.limiter.max,
        remaining: 1,
        reset: Date.now() + 60_000,
      });
      limitByPrefix.set(options.prefix, limit);
      return { limit };
    }),
    { slidingWindow: vi.fn((max: number) => ({ max })) }
  ),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@/lib/api/auth", () => ({ validateApiKey: vi.fn() }));
vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { validateApiKey } from "@/lib/api/auth";
import { _resetLimitersForTest } from "@/lib/api/rate-limit";
import { proxy } from "@/proxy";

const call = (path: string, headers: Record<string, string> = {}) =>
  proxy(
    new NextRequest(`http://localhost${path}`, {
      method: path === "/api/v2/mcp" ? "POST" : "GET",
      headers: { "x-forwarded-for": "203.0.113.7", ...headers },
    })
  );

describe("anonymous rate limit of /api/v2/mcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limitByPrefix.clear();
    _resetLimitersForTest();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubEnv("RATE_LIMIT_IP_RPM", "");
    vi.stubEnv("MCP_RATE_LIMIT_IP_RPM", "");
  });

  // @req REQ-059
  it("counts an anonymous agent call in its own bucket, not the default one", async () => {
    await call("/api/v2/mcp");
    expect(limitByPrefix.get("rl:ip:mcp")).toHaveBeenCalledTimes(1);
    expect(limitByPrefix.get("rl:ip")).not.toHaveBeenCalled();
  });

  // @req REQ-059
  it("keeps every other anonymous route in the default bucket", async () => {
    await call("/api/v2/peoples");
    expect(limitByPrefix.get("rl:ip")).toHaveBeenCalledTimes(1);
    expect(limitByPrefix.get("rl:ip:mcp")).not.toHaveBeenCalled();
  });

  // @req REQ-059
  it("allows 600 calls a minute by default, ten times the default bucket", async () => {
    const agent = await call("/api/v2/mcp");
    const site = await call("/api/v2/peoples");
    expect(agent.headers.get("X-RateLimit-Limit")).toBe("600");
    expect(site.headers.get("X-RateLimit-Limit")).toBe("60");
  });

  // @req REQ-059
  it("takes the size from MCP_RATE_LIMIT_IP_RPM and ignores a value that is not a positive number", async () => {
    vi.stubEnv("MCP_RATE_LIMIT_IP_RPM", "1500");
    const sized = await call("/api/v2/mcp");
    expect(sized.headers.get("X-RateLimit-Limit")).toBe("1500");

    _resetLimitersForTest();
    vi.stubEnv("MCP_RATE_LIMIT_IP_RPM", "lots");
    const malformed = await call("/api/v2/mcp");
    expect(malformed.headers.get("X-RateLimit-Limit")).toBe("600");
  });

  // @req REQ-059
  it("still refuses a key that does not validate with 401", async () => {
    vi.mocked(validateApiKey).mockResolvedValue({
      valid: false,
      reason: "invalid_key",
    } as never);
    const response = await call("/api/v2/mcp", {
      Authorization: "Bearer not-a-key",
    });
    expect(response.status).toBe(401);
  });
});
