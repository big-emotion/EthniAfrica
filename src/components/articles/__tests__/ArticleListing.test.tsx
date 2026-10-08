import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArticleListing } from "@/components/articles/ArticleListing";
import { articleHref } from "@/components/articles/articlePaths";
import type { ArticleSummary } from "@/lib/articles/corpus";
import { HUB_PAGE_SIZE } from "@/lib/dossiers/paging";
import { getLocalizedRoute } from "@/lib/routing";

const summaryOf = (index: number): ArticleSummary => ({
  id: `article-${index}`,
  slug: `article-${index}`,
  title: `Article ${index}`,
  excerpt: `Ce que développe l'article ${index}.`,
  publishedAt: "2026-09-25",
  poster: { src: `posters/${index}.webp`, width: 540, height: 960 },
  formats: ["video"],
});

const catalogueOf = (count: number) =>
  Array.from({ length: count }, (_, index) => summaryOf(index));

const list = () => screen.getByRole("region", { name: "Tous les articles" });

describe("ArticleListing", () => {
  // @req REQ-114
  it("links each card to its article, with its excerpt and its date", () => {
    render(
      <ArticleListing
        language="fr"
        summaries={catalogueOf(1)}
        page={1}
        failed={false}
      />
    );

    const card = within(list()).getByRole("link", { name: /Article 0/ });
    expect(card).toHaveAttribute("href", articleHref("fr", "article-0"));
    expect(screen.getByText("Ce que développe l'article 0.")).toBeVisible();
    expect(screen.getByText("25 septembre 2026")).toBeInTheDocument();
  });

  // @req REQ-108
  it("shows one page at a time and says where the reader is", () => {
    render(
      <ArticleListing
        language="fr"
        summaries={catalogueOf(HUB_PAGE_SIZE + 1)}
        page={1}
        failed={false}
      />
    );

    expect(within(list()).getAllByRole("heading", { level: 2 })).toHaveLength(
      HUB_PAGE_SIZE
    );
    expect(screen.getByText("Page 1 sur 2")).toBeInTheDocument();
    const pager = screen.getByRole("navigation", {
      name: "Pages des articles",
    });
    expect(
      within(pager).getByRole("link", { name: "Suivant" })
    ).toHaveAttribute(
      "href",
      `${getLocalizedRoute("fr", "dossiersHub")}?page=2`
    );
    // The step it cannot take is stated, not a link to the same page.
    expect(within(pager).queryByRole("link", { name: "Précédent" })).toBeNull();
  });

  // @req REQ-108
  it("serves the rest of the catalogue on the next page", () => {
    render(
      <ArticleListing
        language="fr"
        summaries={catalogueOf(HUB_PAGE_SIZE + 1)}
        page={2}
        failed={false}
      />
    );

    expect(within(list()).getAllByRole("heading", { level: 2 })).toHaveLength(
      1
    );
    expect(screen.getByText("Page 2 sur 2")).toBeInTheDocument();
  });

  // A single page needs no pager: « Page 1 sur 1 » is furniture.
  // @req REQ-108
  it("draws no pager when everything fits on one page", () => {
    render(
      <ArticleListing
        language="fr"
        summaries={catalogueOf(3)}
        page={1}
        failed={false}
      />
    );
    expect(
      screen.queryByRole("navigation", { name: "Pages des articles" })
    ).toBeNull();
  });

  // @req REQ-114
  it("keeps the retained collections one tap away", () => {
    render(
      <ArticleListing language="fr" summaries={[]} page={1} failed={false} />
    );

    for (const [name, page] of [
      ["Anecdotes", "anecdotes"],
      ["Proverbes", "proverbs"],
    ] as const) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        getLocalizedRoute("fr", page)
      );
    }
  });

  // An empty catalogue and a failed read are two different facts, and
  // printing the first over the second tells the reader something false.
  // @req REQ-114
  it("says honestly that nothing is published yet", () => {
    render(
      <ArticleListing language="fr" summaries={[]} page={1} failed={false} />
    );

    expect(
      screen.getByText(/Aucun article n'est encore publié/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // @req REQ-114
  it("reports a failed read as a failure, never as an empty catalogue", () => {
    render(
      <ArticleListing
        language="fr"
        summaries={catalogueOf(2)}
        page={1}
        failed
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /n'ont pas pu être chargés/
    );
    expect(screen.queryByText(/Aucun article n'est encore publié/)).toBeNull();
    expect(
      screen.queryByRole("region", { name: "Tous les articles" })
    ).toBeNull();
    // The collections do not depend on the article bank and stay reachable.
    expect(screen.getByRole("link", { name: "Anecdotes" })).toBeInTheDocument();
  });
});
