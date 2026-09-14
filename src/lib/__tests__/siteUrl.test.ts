import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveSiteUrl } from "@/lib/siteUrl";

/**
 * The public site URL feeds the root layout's `metadataBase`, the Atom feed's
 * links, the flag-resolution email and the OpenAPI server. Each of those used
 * to fall back to localhost on its own, so a production deployment missing the
 * variable published links nobody could open — and reported nothing.
 */
describe("resolveSiteUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NEXT_PHASE", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // @req REQ-044
  it("answers the configured public URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ethniafrica.com");

    expect(resolveSiteUrl()).toBe("https://ethniafrica.com");
  });

  // @req REQ-044
  it("gives a host configured without a scheme the http scheme the root layout gave it", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "ethniafrica.local:3000");

    expect(resolveSiteUrl()).toBe("http://ethniafrica.local:3000");
  });

  // @req REQ-044
  it("reads a scheme only where one is written, not in a host that starts with http", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "httpbin.example");
    expect(resolveSiteUrl()).toBe("http://httpbin.example");

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "HTTPS://ethniafrica.com");
    expect(resolveSiteUrl()).toBe("HTTPS://ethniafrica.com");
  });

  // @req REQ-044
  it("falls back to the local dev server outside production", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(resolveSiteUrl()).toBe("http://localhost:3000");
  });

  // @req REQ-044
  it("refuses to answer on a production server with no URL configured", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => resolveSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  // @req REQ-044
  it("lets next build finish without the variable, so the failure lands on the running server", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");

    expect(resolveSiteUrl()).toBe("http://localhost:3000");
  });

  // @req REQ-044
  it("treats a preview deployment, built in production mode, as not production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(resolveSiteUrl()).toBe("http://localhost:3000");
  });
});

const SRC_DIR = join(process.cwd(), "src");
const TEST_PATH = /(^|\/)(__tests__|test)\/|\.(test|spec)\.tsx?$/;

function productionSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) productionSources(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out.filter((file) => !TEST_PATH.test(relative(SRC_DIR, file)));
}

describe("site URL fallback", () => {
  // @req REQ-044
  it("lives in one module, so no caller can fall back to localhost on its own", () => {
    const callers = productionSources(SRC_DIR)
      .filter((file) => relative(SRC_DIR, file) !== join("lib", "siteUrl.ts"))
      .filter((file) =>
        readFileSync(file, "utf8").includes('"http://localhost:3000"')
      )
      .map((file) => relative(SRC_DIR, file));

    expect(callers).toEqual([]);
  });
});
