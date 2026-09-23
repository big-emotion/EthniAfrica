import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";

vi.mock("@/lib/home/loadSeedWords", () => ({
  loadSeedWords: async () => undefined,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

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
  it("reads search, project and contribution in that order", async () => {
    const { container } = await renderHome();

    const search = screen.getByRole("search");
    const contribution = screen.getByTestId("home-contribute");
    const project = screen.getByTestId("home-project");
    expect(precedes(search, project)).toBe(true);
    expect(precedes(project, contribution)).toBe(true);
    expect(container.querySelector(".home-hero-visual")).toBeNull();
  });

  // @req REQ-113
  it("carries no retired section", async () => {
    await renderHome();

    for (const testId of [
      "home-did-you-know",
      "home-stories",
      "home-counts",
      "home-featured",
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
  it("keeps one h1 and three purposeful section headings", async () => {
    await renderHome();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "Pourquoi EthniAfrica ?",
      "Des sources pour comprendre",
      "Faisons grandir EthniAfrica ensemble",
    ]);
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
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
