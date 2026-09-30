import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/queries/afrik/sitemapEntries", () => ({
  getSitemapEntityIds: vi.fn(),
}));
vi.mock("@/lib/supabase/queries/afrik/translations", () => ({
  getAfrikTranslation: vi.fn(),
  getAfrikTranslationIds: vi.fn(),
}));
// The bank on disk is empty on this branch; the sitemap's composition is what
// is under test, so the corpus read is the one thing replaced.
vi.mock("@/lib/articles/corpus", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/articles/corpus")>()),
  readArticleCorpus: vi.fn(),
}));

import sitemap from "../sitemap";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import {
  assembleArticleCorpus,
  readArticleCorpus,
} from "@/lib/articles/corpus";
import {
  carouselArticle,
  videoArticle,
} from "@/lib/articles/__tests__/fixtures";
import { getSitemapEntityIds } from "@/lib/supabase/queries/afrik/sitemapEntries";
import { getAfrikTranslationIds } from "@/lib/supabase/queries/afrik/translations";

const record = (raw: { id: string }) => ({ filename: `${raw.id}.json`, raw });

describe("sitemap.xml — articles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SITE_LOCALE_MODE", "fr-only");
    (getSitemapEntityIds as ReturnType<typeof vi.fn>).mockResolvedValue({
      peoples: [],
      countries: [],
      families: [],
      languages: [],
      patronymes: [],
    });
    (getAfrikTranslationIds as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });
  afterEach(() => vi.unstubAllEnvs());

  // @req REQ-110
  it("lists every published article once, and never a draft", async () => {
    (readArticleCorpus as ReturnType<typeof vi.fn>).mockReturnValue(
      assembleArticleCorpus([
        record(videoArticle({ id: "live-one" })),
        record(carouselArticle({ id: "live-two" })),
        record(
          videoArticle({ id: "wip", status: "draft", publishedAt: undefined })
        ),
      ])
    );

    const urls = (await sitemap()).map((entry) => entry.url);
    const base = `https://${CANONICAL_DOMAIN}`;

    expect(urls).toContain(`${base}/fr/dossiers/live-one`);
    expect(urls).toContain(`${base}/fr/dossiers/live-two`);
    expect(
      urls.filter((u) => u.endsWith("/fr/dossiers/live-one"))
    ).toHaveLength(1);
    expect(urls.some((u) => u.includes("/wip"))).toBe(false);
  });

  // @req REQ-110
  it("does not list an English article URL while articles have no English text", async () => {
    vi.stubEnv("SITE_LOCALE_MODE", "bilingual-fr-default");
    (readArticleCorpus as ReturnType<typeof vi.fn>).mockReturnValue(
      assembleArticleCorpus([record(videoArticle({ id: "live-one" }))])
    );

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((u) => /\/en\/dossiers\/live-one$/.test(u))).toBe(false);
  });
});
