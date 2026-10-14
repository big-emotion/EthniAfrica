import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { getLocalizedRoute } from "@/lib/routing";
import { LINGALA_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import type { SearchResult } from "@/types/afrik-frontend";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

const companions: SearchCompanionsData = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  quiz: { count: 0, item: null },
};

const lingala: SearchResult = {
  type: "language",
  id: "lin",
  name: "Lingala",
  exactMatch: true,
  naming: {
    forms: [],
    eras: [],
    presentation: { forms: [], eras: [], disagreements: [], evidence: [] },
  },
};

const nextSteps = [
  {
    kind: "Famille de langues",
    name: "Bantou",
    reason: "Le nom bantou désigne une famille de langues.",
  },
];

// Brief 1, approved 2026-10-14: docs/design/mockups/site/search-*.dc.html.
describe("SearchFeed — the page no longer ends on the timeline", () => {
  // @req REQ-198
  it("follows the timeline with its sources, the closing band and the next step, in that order", () => {
    const { container } = render(
      <SearchFeed
        query="lingala"
        language="fr"
        state="exact"
        results={[lingala]}
        subjects={[lingala]}
        leads={[]}
        companions={companions}
        nameHistories={[{ subject: lingala, nameHistory: LINGALA_HISTORY }]}
        nextSteps={nextSteps}
      />
    );

    const order = Array.from(
      container.querySelectorAll(
        "[data-name-timeline], [data-name-sources], [data-name-closing], [data-name-next]"
      ),
      (node) =>
        [
          "data-name-timeline",
          "data-name-sources",
          "data-name-closing",
          "data-name-next",
        ].find((attribute) => node.hasAttribute(attribute))
    );
    expect(order).toEqual([
      "data-name-timeline",
      "data-name-sources",
      "data-name-closing",
      "data-name-next",
    ]);
    expect(
      screen.getByRole("button", { name: "Signaler une erreur" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bantou/ })).toBeInTheDocument();
  });

  // @req REQ-198
  it("gives an unknown name a declared silence and a next step", () => {
    const { container } = render(
      <SearchFeed
        query="zzqxv"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={companions}
        nextSteps={nextSteps}
      />
    );

    expect(
      screen.getByText(
        "Aucune source sur le nom zzqxv n’est enregistrée dans le projet."
      )
    ).toBeInTheDocument();
    // The page's own « Nous nous sommes trompés ? » card is its invitation.
    expect(
      container.querySelector("[data-name-closing]")?.textContent
    ).not.toContain("Signaler une erreur");
    expect(container.querySelector("[data-name-next]")).not.toBeNull();
  });
});
