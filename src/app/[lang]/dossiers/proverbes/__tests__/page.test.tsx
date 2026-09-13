import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  PROVERBS,
  proverbEntities,
  proverbsConcerning,
} from "@/lib/proverbs/proverbs";
import { PROVERBS_EN } from "@/lib/proverbs/proverbs.en";
import { getLocalizedRoute } from "@/lib/routing";

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import ProverbsPage from "@/app/[lang]/dossiers/proverbes/page";

async function renderPage(entite?: string, lang = "fr") {
  render(
    await ProverbsPage({
      params: Promise.resolve({ lang }),
      searchParams: Promise.resolve({ entite }),
    })
  );
  return document.querySelectorAll("article[data-proverb]");
}

/**
 * The filter panel's links, read from the DOM rather than the accessibility
 * tree: `getByRole` over fifty-four cards, sixty times, took 13 s under the
 * full suite and timed out, while asserting nothing a selector does not.
 */
function filterLinks(): HTMLAnchorElement[] {
  return [
    ...document.querySelectorAll<HTMLAnchorElement>(
      "details.proverbs-filter a"
    ),
  ];
}

describe("The proverbs dossier (REQ-113)", () => {
  // @req REQ-113
  it("prints the whole bank when no entity is chosen", async () => {
    const cards = await renderPage();

    expect(PROVERBS.length).toBeGreaterThan(0);
    expect(cards).toHaveLength(PROVERBS.length);
  });

  // @req REQ-113
  it("narrows the list to the proverbs concerning the chosen entity", async () => {
    const entity = proverbEntities()[0];
    const key = `${entity.kind}:${entity.id}`;
    const cards = await renderPage(key);

    expect([...cards].map((card) => card.id)).toEqual(
      proverbsConcerning(key).map((entry) => entry.id)
    );
    expect(
      filterLinks()
        .filter((link) => link.getAttribute("aria-current") === "page")
        .map((link) => link.textContent)
    ).toEqual([entity.label]);
  });

  // Measured at 430 px: opening the panel for the reader who chose « Zoulou »
  // put forty country pills between them and the first result. The choice is
  // named above the list instead, with the way back beside it.
  // @req REQ-113
  it("names the chosen entity above the list and keeps the panel folded", async () => {
    const entity = proverbEntities()[0];
    await renderPage(`${entity.kind}:${entity.id}`);

    const scope = screen.getByTestId("proverbs-scope");
    expect(scope).toHaveTextContent(entity.label);
    expect(
      within(scope).getByRole("link", { name: "Tous les proverbes" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "proverbs"));
    expect(
      document.querySelector("details.proverbs-filter")
    ).not.toHaveAttribute("open");
  });

  // A filter link kept from a retired proverb still lands on a page that says
  // something, rather than on a blank list.
  // @req REQ-113
  it("says so when no proverb concerns the chosen entity", async () => {
    const cards = await renderPage("people:PPL_NOBODY");

    expect(cards).toHaveLength(0);
    expect(
      screen.getByText(
        "Aucun proverbe publié ne concerne cette entrée de l'atlas."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-113
  it("offers every entity the bank names as a filter link", async () => {
    await renderPage();

    const offered = new Map(
      filterLinks().map((link) => [link.getAttribute("href"), link.textContent])
    );
    for (const entity of proverbEntities()) {
      const href = `${getLocalizedRoute("fr", "proverbs")}?entite=${encodeURIComponent(`${entity.kind}:${entity.id}`)}`;
      expect(offered.get(href), href).toBe(entity.label);
    }
  });

  // @req REQ-145
  it("prints the English bank on /en", async () => {
    await renderPage(undefined, "en");

    const first = PROVERBS[0];
    expect(
      document.querySelector(`article[id="${first.id}"] h2`)
    ).toHaveTextContent(PROVERBS_EN[first.id].text);
  });
});
