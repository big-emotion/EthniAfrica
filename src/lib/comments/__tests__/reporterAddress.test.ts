import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hashReporterAddress } from "@/lib/comments/reporterAddress";

describe("hashReporterAddress", () => {
  beforeEach(() => {
    vi.stubEnv("ANTIBOT_HMAC_SECRET", "server-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // @req REQ-212
  it("gives one address one stable hash, and never the address itself", () => {
    const first = hashReporterAddress("203.0.113.7");

    expect(hashReporterAddress("203.0.113.7")).toBe(first);
    expect(hashReporterAddress("203.0.113.8")).not.toBe(first);
    expect(first).not.toContain("203.0.113");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  /**
   * A plain digest of an IPv4 address is reversed by hashing all four
   * billion of them. Keyed by a server secret, the table cannot be built
   * without the secret.
   */
  // @req REQ-212
  it("depends on the server secret", () => {
    const withFirstSecret = hashReporterAddress("203.0.113.7");
    vi.stubEnv("ANTIBOT_HMAC_SECRET", "another-secret");

    expect(hashReporterAddress("203.0.113.7")).not.toBe(withFirstSecret);
  });

  // @req REQ-212
  it("refuses to hash without a secret rather than hash with an empty key", () => {
    vi.stubEnv("ANTIBOT_HMAC_SECRET", "");

    expect(() => hashReporterAddress("203.0.113.7")).toThrow(/secret/i);
  });

  // An unforwarded address is one shared reporter: it counts once, not never.
  // @req REQ-212
  it("hashes a missing address into one shared bucket", () => {
    expect(hashReporterAddress(undefined)).toBe(hashReporterAddress(undefined));
  });
});
