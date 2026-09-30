import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentProvider } from "@/hooks/use-consent";
import {
  assembleArticleCorpus,
  type ArticleCorpus,
} from "@/lib/articles/corpus";
import {
  carouselArticle,
  videoArticle,
} from "@/lib/articles/__tests__/fixtures";
import { readDossierCorpus } from "@/lib/dossiers/corpus";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      {title ? <h1>{title}</h1> : null}
      {children}
    </div>
  ),
}));

/**
 * The route reads the real bank on disk, which holds no article yet; the
 * corpus under test is swapped in here so the route's own decisions — what
 * it lists, what it refuses, what it calls a failure — can be observed.
 */
let corpus: ArticleCorpus = { articles: [], errors: [] };
vi.mock("@/lib/articles/corpus", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/articles/corpus")>();
  return { ...actual, readArticleCorpus: () => corpus };
});

import ArticlesListingRoute from "../page";
import DossierRoute, { generateMetadata } from "../[dossier]/page";

const record = (raw: unknown, name: string) => ({
  filename: `${name}.json`,
  raw,
});

const published = videoArticle({ id: "live-article" });
published.fr.title = "Un article publié";
const draft = carouselArticle({
  id: "draft-article",
  status: "draft",
  publishedAt: undefined,
});
draft.fr.slug = "draft-article";
draft.fr.title = "Un titre de brouillon privé";

const listing = async (searchParams: Record<string, string> = {}) =>
  render(
    await ArticlesListingRoute({
      params: Promise.resolve({ lang: "fr" }),
      searchParams: Promise.resolve(searchParams),
    })
  );

describe("the articles listing route", () => {
  beforeEach(() => {
    corpus = assembleArticleCorpus([
      record(published, "live-article"),
      record(draft, "draft-article"),
    ]);
  });

  // @req REQ-114
  it("lists published articles and never a draft's title", async () => {
    await listing();
    expect(screen.getByText("Un article publié")).toBeInTheDocument();
    expect(screen.queryByText("Un titre de brouillon privé")).toBeNull();
  });

  // @req REQ-114
  it("reports an unreadable bank as a failure, not as an empty catalogue", async () => {
    corpus = { articles: [], errors: ["broken.json: JSON parse error"] };
    await listing();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/Aucun article n'est encore publié/)).toBeNull();
  });

  // @req REQ-114
  it("says nothing is published when the bank is empty and readable", async () => {
    corpus = { articles: [], errors: [] };
    await listing();
    expect(
      screen.getByText(/Aucun article n'est encore publié/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // A malformed page number lands on the first page rather than on nothing.
  // @req REQ-108
  it("clamps a page number it cannot serve", async () => {
    await listing({ page: "abc" });
    expect(screen.getByText("Un article publié")).toBeInTheDocument();
  });
});

describe("the shared article route", () => {
  beforeEach(() => {
    corpus = assembleArticleCorpus([
      record(published, "live-article"),
      record(draft, "draft-article"),
    ]);
  });

  const open = async (slug: string, lang = "fr") =>
    render(
      <ConsentProvider>
        {await DossierRoute({
          params: Promise.resolve({ lang, dossier: slug }),
        })}
      </ConsentProvider>
    );

  // @req REQ-114
  it("serves a published article at its French slug", async () => {
    await open("live-article");
    expect(
      screen.getByRole("heading", { level: 1, name: "Un article publié" })
    ).toBeInTheDocument();
  });

  // @req REQ-114
  it("answers 404 for a draft, whatever its slug", async () => {
    await expect(open("draft-article")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  // The legacy research dossiers keep their freeze: an article bank that
  // happens to be readable must not revive them.
  // @req REQ-113
  it("keeps the legacy dossiers withheld", async () => {
    for (const { slug } of readDossierCorpus().dossiers) {
      await expect(open(slug)).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });

  // @req REQ-114
  it("gives the article its own title and a French canonical address", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "fr", dossier: "live-article" }),
    });
    expect(metadata.title).toBe("Un article publié");
    expect(String(metadata.alternates?.canonical)).toMatch(
      /\/fr\/dossiers\/live-article$/
    );
  });

  // @req REQ-114
  it("describes nothing for a draft", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "fr", dossier: "draft-article" }),
    });
    expect(metadata.title).toBeUndefined();
  });
});
