import { describe, expect, it } from "vitest";

import { positiveIntFromEnv, rateLimitWindowFromEnv } from "@/lib/env";

/**
 * The contract that matters here is the failure mode, not the happy path: a
 * typo in an env var must not be able to take a running deployment down, and
 * must not silently become a limit of zero — which on a rate limiter would
 * refuse every request, and on a timeout would abort every query.
 */
describe("positiveIntFromEnv", () => {
  // @req REQ-110
  it("reads a configured value", () => {
    expect(positiveIntFromEnv("42", 10)).toBe(42);
  });

  // @req REQ-110
  it("falls back when the variable is unset or empty", () => {
    expect(positiveIntFromEnv(undefined, 10)).toBe(10);
    expect(positiveIntFromEnv("", 10)).toBe(10);
  });

  // @req REQ-110
  it("falls back rather than throwing on a value that is not a number", () => {
    expect(positiveIntFromEnv("soon", 10)).toBe(10);
  });

  // @req REQ-110
  it("refuses zero and negatives, which would disable the thing they configure", () => {
    expect(positiveIntFromEnv("0", 10)).toBe(10);
    expect(positiveIntFromEnv("-5", 10)).toBe(10);
  });
});

describe("rateLimitWindowFromEnv", () => {
  // @req REQ-110
  it("reads a window in the spelling @upstash/ratelimit accepts", () => {
    expect(rateLimitWindowFromEnv("2 h", "1 h")).toBe("2 h");
    expect(rateLimitWindowFromEnv(" 30 s ", "1 h")).toBe("30 s");
    expect(rateLimitWindowFromEnv("500 ms", "1 h")).toBe("500 ms");
  });

  // @req REQ-110
  it("falls back when the variable is unset or empty", () => {
    expect(rateLimitWindowFromEnv(undefined, "1 h")).toBe("1 h");
    expect(rateLimitWindowFromEnv("", "1 h")).toBe("1 h");
  });

  // A window the limiter library cannot parse would throw when the limiter is
  // built, on the request that first needs it; better to keep the default.
  // @req REQ-110
  it("falls back on anything the limiter would reject, zero included", () => {
    for (const bad of ["soon", "1 fortnight", "h", "-1 h", "0 h", "1.5 h"]) {
      expect(rateLimitWindowFromEnv(bad, "24 h"), bad).toBe("24 h");
    }
  });
});
