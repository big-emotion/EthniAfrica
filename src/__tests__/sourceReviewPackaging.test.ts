import { describe, expect, it, vi } from "vitest";
vi.mock("@sentry/nextjs", () => ({
  withSentryConfig: (config: unknown) => config,
}));

describe("source review queue deployment assets", () => {
  // The production image copies `.next/standalone` only, so a page reading the
  // corpus at runtime finds nothing unless its trace names the files.
  // @req REQ-092
  it("ships the three fiche kinds the queue reads in the admin page's server trace", async () => {
    const { default: config } = await import("../../next.config");
    expect(config.outputFileTracingIncludes?.["/*/admin/sources"]).toEqual(
      expect.arrayContaining([
        "./dataset/source/afrik/peuples/**/*.json",
        "./dataset/source/afrik/pays/*.json",
        "./dataset/source/afrik/famille_linguistique/*.json",
      ])
    );
  });

  // The tracer matches the archive's same-named `peuples/` and `pays/`
  // directories, which the queue never reads.
  // @req REQ-092
  it("keeps the pre-JSON corpus archive out of that trace", async () => {
    const { default: config } = await import("../../next.config");
    expect(config.outputFileTracingExcludes?.["/*/admin/sources"]).toContain(
      "./dataset/source/afrik/archive/**"
    );
  });
});
