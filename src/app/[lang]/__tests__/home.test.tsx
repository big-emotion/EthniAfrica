import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_DOMAIN, OG_DESCRIPTION, OG_TITLE } from "@/lib/brand";
import { FALLBACK_SEED_WORDS } from "@/lib/home/seedWords";
import { homePurposeCopy } from "@/lib/i18n/copy/homePurpose";
const { loadSeeds, counts, globe } = vi.hoisted(() => ({
  loadSeeds: vi.fn(),
  counts: vi.fn(),
  globe: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/home/loadSeedWords", () => ({ loadSeedWords: loadSeeds }));
vi.mock("@/lib/home/corpusCounts", () => ({ getCorpusCounts: counts }));
vi.mock("@/api/v2/services/continentPeopleCounts", () => ({
  getContinentPeopleCounts: globe,
}));
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
import Home, { generateMetadata } from "../page";
const routeParams = (lang: string) => Promise.resolve({ lang });
describe("minimal home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadSeeds.mockImplementation(
      async (language) => FALLBACK_SEED_WORDS[language]
    );
  });
  // @req REQ-115
  it.each(["fr", "en"] as const)(
    "offers search, project and contribution in %s without loading retired sections",
    async (language) => {
      render(await Home({ params: routeParams(language) }));
      const layout = screen.getByTestId("page-layout");
      expect(
        Array.from(layout.children).map(
          (node) => node.getAttribute("data-testid") ?? node.className
        )
      ).toEqual(["home-hero", "home-project", "home-contribute"]);
      expect(screen.getByRole("search")).toBeInTheDocument();
      expect(
        screen.getByRole("link", {
          name: homePurposeCopy[language].contribute.linkLabel,
        })
      ).toHaveAttribute("href", `/${language}/contribute`);
      expect(screen.getByTestId("home-contribute")).toHaveTextContent(
        homePurposeCopy[language].contribute.corrections
      );
      expect(screen.getByTestId("home-contribute")).toHaveTextContent(
        homePurposeCopy[language].contribute.code
      );
      expect(counts).not.toHaveBeenCalled();
      expect(globe).not.toHaveBeenCalled();
      expect(loadSeeds).toHaveBeenCalledWith(language);
    }
  );
  // @req REQ-002
  it("loads new examples on every request and passes them to the search", async () => {
    loadSeeds.mockResolvedValue({
      ...FALLBACK_SEED_WORDS.fr,
      country: ["Rwanda", "Togo"],
    });
    const first = render(await Home({ params: routeParams("fr") }));
    expect(screen.getByRole("button", { name: "Rwanda" })).toBeInTheDocument();
    first.unmount();
    loadSeeds.mockResolvedValue({
      ...FALLBACK_SEED_WORDS.fr,
      country: ["Togo", "Rwanda"],
    });
    render(await Home({ params: routeParams("fr") }));
    expect(screen.getByRole("button", { name: "Togo" })).toBeInTheDocument();
    expect(loadSeeds).toHaveBeenCalledTimes(2);
  });
  // @req REQ-044
  it("declares the canonical and OpenGraph metadata", async () => {
    const metadata = await generateMetadata({ params: routeParams("fr") });

    expect(metadata.alternates?.canonical).toBe(
      `https://${CANONICAL_DOMAIN}/fr`
    );
    expect(metadata.title).toBe(OG_TITLE);
    expect(metadata.description).toBe(OG_DESCRIPTION);
    expect(metadata.openGraph?.title).toBe(OG_TITLE);
    expect(metadata.openGraph?.description).toBe(OG_DESCRIPTION);
    expect(metadata.openGraph?.url).toBe(`https://${CANONICAL_DOMAIN}/fr`);
  });

  // An English home declaring `/fr` canonical would tell every crawler the
  // page is a duplicate of the French one.
  // @req REQ-140
  it("points the canonical at the locale the route was served in", async () => {
    const metadata = await generateMetadata({ params: routeParams("en") });

    expect(metadata.alternates?.canonical).toBe(
      `https://${CANONICAL_DOMAIN}/en`
    );
    expect(metadata.openGraph?.url).toBe(`https://${CANONICAL_DOMAIN}/en`);
  });

  // @req REQ-140
  it("hands the shell the route's locale rather than a fixed one", async () => {
    render(await Home({ params: routeParams("en") }));

    expect(screen.getByTestId("page-layout")).toHaveAttribute(
      "data-language",
      "en"
    );
  });
});
