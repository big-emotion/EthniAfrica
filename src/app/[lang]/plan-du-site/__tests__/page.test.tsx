import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SitemapPage from "../page";
import { getTranslation } from "@/lib/translations";

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    language,
  }: {
    children: React.ReactNode;
    language: string;
  }) => (
    <div data-testid="page-layout" data-language={language}>
      {children}
    </div>
  ),
}));

const routeParams = (lang: string) => Promise.resolve({ lang });

describe("the site plan", () => {
  // @req REQ-088
  it("names itself once, from the dictionary of the route's locale", async () => {
    render(await SitemapPage({ params: routeParams("fr") }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: getTranslation("fr").sitemapPage.title,
      })
    ).toBeInTheDocument();
  });
});
