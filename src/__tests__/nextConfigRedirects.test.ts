import { describe, expect, it, vi } from "vitest";

import retiredPatronymes from "../../dataset/source/afrik/patronymes/_retired-identifiers.json";
import { getPatronymeRoute } from "@/lib/routing";

// `next.config.ts` is wrapped by withSentryConfig, and @sentry/nextjs breaks
// on import under vitest (memory: sentry-1072-casse-limport-des-tests). The
// wrapper adds nothing a redirect test needs.
vi.mock("@sentry/nextjs", () => ({
  withSentryConfig: (config: unknown) => config,
}));

type Redirect = { source: string; destination: string; permanent: boolean };

async function loadRedirects(): Promise<Redirect[]> {
  const { default: nextConfig } = await import("../../next.config");
  return (await nextConfig.redirects()) as Redirect[];
}

const RETIRED_PATRONYME_IDS: Record<string, string> = Object.fromEntries(
  retiredPatronymes.map((entry) => [entry.retiredId, entry.successorId])
);

const destinationOf = (redirects: Redirect[], source: string) =>
  redirects.find((redirect) => redirect.source === source);

describe("the appellations → noms redirect", () => {
  // @req REQ-141
  it("sends a retired patronyme address to the patronyme slug", async () => {
    const entry = destinationOf(
      await loadRedirects(),
      "/fr/atlas/appellations/:slug"
    );

    expect(entry?.destination).toBe(getPatronymeRoute("fr", ":slug"));
    expect(entry?.permanent).toBe(true);
  });

  // `redirects` runs before the proxy, so an English destination would cost
  // a second 308 there; the retired English address lands in French at once.
  // @req REQ-140
  it("sends the retired English address straight to the French slug", async () => {
    const entry = destinationOf(
      await loadRedirects(),
      "/en/atlas/appellations/:slug"
    );

    expect(entry?.destination).toBe(getPatronymeRoute("fr", ":slug"));
    expect(entry?.permanent).toBe(true);
  });

  // @req REQ-141
  it("keeps no locale wildcard", async () => {
    for (const redirect of await loadRedirects()) {
      expect(redirect.source).not.toContain(":lang");
      expect(redirect.destination).not.toContain(":lang");
    }
  });
});

describe("the folded patronyme addresses", () => {
  // A folded PAT_ fiche's published addresses would otherwise answer 404 to
  // anyone who held them; the patronyme ledger lists every fold.
  // @req REQ-141
  it.each(Object.entries(RETIRED_PATRONYME_IDS))(
    "sends %s to the French fiche of %s",
    async (retiredId, successorId) => {
      const redirects = await loadRedirects();

      for (const source of [
        getPatronymeRoute("fr", retiredId),
        `/en/atlas/names/${retiredId}`,
      ]) {
        const entry = destinationOf(redirects, source);
        expect(entry?.destination, source).toBe(
          getPatronymeRoute("fr", successorId)
        );
        expect(entry?.permanent).toBe(true);
      }
    }
  );

  // @req REQ-141
  it("still sends PAT_KAMARA to PAT_CAMARA", () => {
    expect(RETIRED_PATRONYME_IDS.PAT_KAMARA).toBe("PAT_CAMARA");
  });
});

describe("a retired people id in the API", () => {
  // The fiche pages redirect a retired id through the ledger, but the API kept
  // serving the stale row until a prune, then answered 404. An API client
  // holds the old id the same way a bookmark holds the old page. `:rest*`
  // also matches the bare id, so one entry covers the detail and its sub-routes.
  // @req REQ-084
  it.each([
    ["PPL_JOLA", "PPL_DIOLA"],
    ["PPL_FULANI", "PPL_FULA"],
  ])("sends %s and its sub-routes to %s", async (retiredId, successorId) => {
    const entry = destinationOf(
      await loadRedirects(),
      `/api/v2/peoples/${retiredId}/:rest*`
    );

    expect(entry?.destination).toBe(`/api/v2/peoples/${successorId}/:rest*`);
    expect(entry?.permanent).toBe(true);
  });

  // A kept-distinct decision records why two ids stay apart; its id is live.
  // @req REQ-084
  it("leaves an id the ledger kept distinct alone", async () => {
    const entry = destinationOf(
      await loadRedirects(),
      "/api/v2/peoples/PPL_KISI/:rest*"
    );

    expect(entry).toBeUndefined();
  });
});
