import { describe, expect, it, vi } from "vitest";
vi.mock("@sentry/nextjs", () => ({
  withSentryConfig: (config: unknown) => config,
}));

describe("dossier deployment assets", () => {
  // @req REQ-114
  it("includes the source records in server traces", async () => {
    const { default: config } = await import("../../next.config");
    expect(config.outputFileTracingIncludes?.["/*/dossiers/*"]).toEqual(
      expect.arrayContaining(["./dataset/source/afrik/dossiers/*.json"])
    );
  });
});
