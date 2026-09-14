import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockLimit } = vi.hoisted(() => ({ mockLimit: vi.fn() }));

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock("@upstash/ratelimit", () => {
  const Ratelimit = Object.assign(
    vi.fn().mockImplementation(function () {
      return { limit: mockLimit };
    }),
    { slidingWindow: vi.fn().mockReturnValue({ type: "sliding" }) }
  );
  return { Ratelimit };
});

vi.mock("@/lib/api/logger", () => ({
  logger: { warn: vi.fn() },
}));

import { logger } from "@/lib/api/logger";
import { checkContactRateLimit } from "@/lib/ratelimit/contactRateLimit";

describe("checkContactRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // @req REQ-045
  it("lets a sender through while their quota lasts, counted by client address", async () => {
    mockLimit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 3_600_000,
    });

    await expect(checkContactRateLimit("203.0.113.9")).resolves.toEqual({
      allowed: true,
    });
    expect(mockLimit).toHaveBeenCalledWith("contact:ip:203.0.113.9");
  });

  // @req REQ-045
  it("refuses a sender whose quota is spent and says when to come back", async () => {
    mockLimit.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 120_000,
    });

    const decision = await checkContactRateLimit("203.0.113.9");

    expect(decision.allowed).toBe(false);
    // `in` narrows where `allowed` cannot: strictNullChecks is off here.
    expect("retryAfter" in decision).toBe(true);
    if ("retryAfter" in decision) {
      expect(decision.retryAfter).toBeGreaterThanOrEqual(119);
      expect(decision.retryAfter).toBeLessThanOrEqual(120);
    }
  });

  // @req REQ-045
  it("lets the message through, and says so, when Upstash is not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");

    await expect(checkContactRateLimit("203.0.113.9")).resolves.toEqual({
      allowed: true,
    });
    expect(mockLimit).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  // @req REQ-045
  it("lets the message through when the limiter itself fails", async () => {
    mockLimit.mockRejectedValue(new Error("redis down"));

    await expect(checkContactRateLimit("203.0.113.9")).resolves.toEqual({
      allowed: true,
    });
    expect(logger.warn).toHaveBeenCalled();
  });
});
