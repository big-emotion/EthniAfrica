import { describe, expect, it, vi } from "vitest";

import { LOCALES } from "@/lib/locale";
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

describe("the appellations → noms redirect, per locale (DEC-049)", () => {
  // A `:lang` wildcard sent `/en/atlas/appellations/X` to the French word
  // `noms` under `/en` — one entry per locale carries each locale's word.
  // @req REQ-141
  it("sends a retired patronyme address to that locale's patronyme slug", async () => {
    const redirects = await loadRedirects();

    for (const locale of LOCALES) {
      const entry = redirects.find(
        (redirect) => redirect.source === `/${locale}/atlas/appellations/:slug`
      );
      expect(entry, locale).toBeDefined();
      expect(entry.destination).toBe(getPatronymeRoute(locale, ":slug"));
      expect(entry.permanent).toBe(true);
    }
  });

  // @req REQ-141
  it("keeps no locale-agnostic wildcard that would cross the vocabularies", async () => {
    const redirects = await loadRedirects();

    for (const redirect of redirects) {
      expect(redirect.source).not.toContain(":lang");
      expect(redirect.destination).not.toContain(":lang");
    }
  });
});

describe("the folded PAT_KAMARA address, per locale", () => {
  // PAT_KAMARA was an empty duplicate folded into PAT_CAMARA; its published
  // address would otherwise answer 404 to anyone who held it.
  // @req REQ-141
  it("sends the retired PAT_KAMARA fiche to PAT_CAMARA in each locale", async () => {
    const redirects = await loadRedirects();

    for (const locale of LOCALES) {
      const entry = redirects.find(
        (redirect) =>
          redirect.source === getPatronymeRoute(locale, "PAT_KAMARA")
      );
      expect(entry, locale).toBeDefined();
      expect(entry.destination).toBe(getPatronymeRoute(locale, "PAT_CAMARA"));
      expect(entry.permanent).toBe(true);
    }
  });
});
