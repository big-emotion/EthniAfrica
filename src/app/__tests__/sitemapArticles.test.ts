import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/queries/afrik/sitemapEntries", () => ({
  getSitemapEntityIds: vi.fn(),
}));
// The bank on disk is empty on this branch; the sitemap's composition is what
// is under test, so the corpus read is the one thing replaced.
vi.mock("@/lib/articles/corpus", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/articles/corpus")>()),
  readArticleCorpus: vi.fn(),
}));

import sitemap from "../sitemap";
import { articleHref } from "@/components/articles/articlePaths";
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

const record = (raw: { id: string }) => ({ filename: `${raw.id}.json`, raw });

describe("sitemap.xml — articles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSitemapEntityIds as ReturnType<typeof vi.fn>).mockResolvedValue({
      peoples: [],
      countries: [],
      families: [],
      languages: [],
      patronymes: [],
    });
  });

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

    expect(urls).toContain(`${base}${articleHref("fr", "live-one")}`);
    expect(urls).toContain(`${base}${articleHref("fr", "live-two")}`);
    expect(
      urls.filter((u) => u.endsWith(articleHref("fr", "live-one")))
    ).toHaveLength(1);
    expect(urls.some((u) => u.includes("/wip"))).toBe(false);
  });
});
