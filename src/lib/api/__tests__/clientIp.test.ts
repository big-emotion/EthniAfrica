import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp } from "@/lib/api/clientIp";

function requestWith(headers: Record<string, string>) {
  return { headers: new Headers(headers) };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("clientIp", () => {
  // The proxy appends the address it saw, so the right-most entry is the only
  // one a client cannot have written.
  // @req REQ-059
  it("reads the right-most hop of X-Forwarded-For by default", () => {
    expect(clientIp(requestWith({ "x-forwarded-for": "198.51.100.9" }))).toBe(
      "198.51.100.9"
    );
  });

  // @req REQ-059
  it("ignores entries a client prepended to the chain", () => {
    const spoofed = requestWith({
      "x-forwarded-for": "1.1.1.1, 2.2.2.2, 198.51.100.9",
    });
    expect(clientIp(spoofed)).toBe("198.51.100.9");
  });

  // @req REQ-059
  it("gives the same identity to two requests that differ only in the spoofed prefix", () => {
    const first = requestWith({ "x-forwarded-for": "1.1.1.1, 198.51.100.9" });
    const second = requestWith({ "x-forwarded-for": "9.9.9.9, 198.51.100.9" });
    expect(clientIp(first)).toBe(clientIp(second));
  });

  // @req REQ-059
  it("skips the configured number of trusted proxies from the right", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
    const chain = requestWith({
      "x-forwarded-for": "1.1.1.1, 198.51.100.9, 10.0.0.7",
    });
    expect(clientIp(chain)).toBe("198.51.100.9");
  });

  // @req REQ-059
  it.each(["0", "-1", "two", ""])(
    "falls back to one hop when TRUSTED_PROXY_HOPS is %j",
    (value) => {
      vi.stubEnv("TRUSTED_PROXY_HOPS", value);
      const chain = requestWith({ "x-forwarded-for": "1.1.1.1, 198.51.100.9" });
      expect(clientIp(chain)).toBe("198.51.100.9");
    }
  );

  // A chain shorter than the trusted depth means the proxy did not add its
  // hop; nothing in it can be attributed to a proxy.
  // @req REQ-059
  it("does not trust a chain shorter than the configured hops", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "3");
    const chain = requestWith({ "x-forwarded-for": "1.1.1.1, 198.51.100.9" });
    expect(clientIp(chain)).toBeNull();
  });

  // @req REQ-059
  it("falls back to X-Real-IP when there is no X-Forwarded-For", () => {
    expect(clientIp(requestWith({ "x-real-ip": " 203.0.113.2 " }))).toBe(
      "203.0.113.2"
    );
  });

  // @req REQ-059
  it("prefers X-Forwarded-For over a client-writable X-Real-IP", () => {
    const both = requestWith({
      "x-forwarded-for": "198.51.100.9",
      "x-real-ip": "6.6.6.6",
    });
    expect(clientIp(both)).toBe("198.51.100.9");
  });

  // @req REQ-059
  it("returns null when no header names a client", () => {
    expect(clientIp(requestWith({}))).toBeNull();
    expect(clientIp(requestWith({ "x-forwarded-for": " , " }))).toBeNull();
  });
});
