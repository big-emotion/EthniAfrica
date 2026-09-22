import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";

const fixtureCounts = {
  peoples: 4213,
  countries: 91,
  families: 37,
  languages: 748,
  nameForms: 3134,
  migrations: 5,
};

// The hero carries an interactive island since the search field landed in it,
// and useRouter throws outside an app-router tree rather than degrading.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/home/corpusCounts", () => ({
  getCorpusCounts: vi.fn(async () => fixtureCounts),
}));

vi.mock("@/api/v2/services/continentPeopleCounts", () => ({
  getContinentPeopleCounts: vi.fn(async () => ({})),
}));

// The document plan is asserted on the globe draw, the one that adds no
// heading of its own; the anecdote draw's h2 is HomeDrawnVisual.test.tsx's
// concern.
vi.mock("@/lib/home/homeHeroVisuals", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/home/homeHeroVisuals")>();
  return {
    ...actual,
    drawHomeHeroVisual: () => ({ kind: "globe" }),
  };
});

// The campaign window depends on the date the suite runs; the plan is
// asserted without the tile, whose heading home.test.tsx covers.
vi.mock("@/lib/home/featuredCampaigns", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/home/featuredCampaigns")>();
  return { ...actual, getActiveFeaturedCampaign: () => null };
});

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

vi.mock("@/components/atlas/ContinentGlobeStage", () => ({
  ContinentGlobeStage: () => <div data-testid="home-globe-stage" />,
}));

import Home from "../page";

const renderHome = async () =>
  render(await Home({ params: Promise.resolve({ lang: "fr" }) }));

/** Document order of two nodes, as the reader scrolls them. */
const precedes = (first: Element, second: Element) =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  );

describe("home — what the reader meets, and in what order (REQ-113)", () => {
  // The DOM is the phone composition, and every wider layout reuses those
  // nodes rather than maintaining a second reading order.
  // @req REQ-113
  it("reads the search first and the drawn visual after the stories", async () => {
    const { container } = await renderHome();

    const search = screen.getByRole("search");
    const stories = screen.getByTestId("home-stories");
    const visual = container.querySelector(".home-hero-visual")!;
    const counts = screen.getByTestId("home-counts");

    expect(precedes(search, stories)).toBe(true);
    expect(precedes(stories, visual)).toBe(true);
    expect(precedes(visual, counts)).toBe(true);
  });

  // @req REQ-113
  it("carries no retired section", async () => {
    await renderHome();

    for (const testId of [
      "home-did-you-know",
      "home-purpose-blocks",
      "home-hero-purpose",
      "access-axes",
      "home-synthesis-rail",
      "home-featured-module",
      "home-trust-strip",
    ]) {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    }
  });

  // One page title; each lower section files itself with an h2, and only the
  // story cards sit a rung below. The figures are values, not headings.
  // @req REQ-113
  it("keeps one h1, one h2 per section, and h3 only on the story cards", async () => {
    await renderHome();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "Des histoires à découvrir",
      "Pourquoi EthniAfrica ?",
      "Des sources pour comprendre",
      "EthniAfrica en quelques repères",
    ]);
    const cards = screen.getByTestId("home-stories");
    for (const heading of screen.getAllByRole("heading", { level: 3 })) {
      expect(cards).toContainElement(heading);
    }
  });

  // The one action is named by the home's question and described by the
  // sentence that says what can be typed. No retired axis copy survives
  // around it to compete for the first decision.
  // @req REQ-113
  it("names the search by its question and describes what it accepts", async () => {
    const { container } = await renderHome();

    expect(container.textContent).not.toMatch(/il arrive avec/i);
    expect(container.textContent).not.toMatch(/il repart avec/i);
    const field = screen.getByRole("combobox", {
      name: homeHeroCopy.fr.searchLabel,
    });
    expect(field).toHaveAccessibleDescription(homeHeroCopy.fr.description);
  });
});
