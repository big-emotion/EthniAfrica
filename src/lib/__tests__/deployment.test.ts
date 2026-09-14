import { afterEach, describe, expect, it, vi } from "vitest";

import { isProductionDeployment } from "@/lib/deployment";

describe("isProductionDeployment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // @req REQ-059
  it("trusts VERCEL_ENV over NODE_ENV, because Vercel builds previews in production mode", () => {
    vi.stubEnv("NODE_ENV", "production");

    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isProductionDeployment()).toBe(false);

    vi.stubEnv("VERCEL_ENV", "production");
    expect(isProductionDeployment()).toBe(true);
  });

  // @req REQ-059
  it("reads NODE_ENV when VERCEL_ENV is absent, as on the self-hosted server", () => {
    vi.stubEnv("VERCEL_ENV", "");

    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionDeployment()).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(isProductionDeployment()).toBe(false);
  });
});
