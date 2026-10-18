import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import { getLocalizedRoute } from "@/lib/routing";
import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";
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
    relation: "family" as const,
    kind: "Famille de langues",
    name: "Bantou",
    reason: "Le nom bantou désigne une famille de langues.",
  },
];

const peul: SearchResult = {
  type: "people",
  id: "PPL_FULA",
  name: "Fula (Fulbe / Peul)",
  exactMatch: true,
  naming: lingala.naming,
};
const peulNextSteps = [
  {
    relation: "namer" as const,
    kind: "Peuple",
    name: "Wolof",
    reason: "Le nom Wolof est celui que ce peuple se donne.",
  },
  {
    relation: "family" as const,
    kind: "Famille de langues",
    name: "Atlantique",
    reason: "Le nom atlantique désigne un ensemble de langues.",
  },
];

// Board search-peul-430 (approved 2026-10-14): one subject, so the fiche link
// stays under the timeline (line 129), before « Les sources » (146).
describe("SearchFeed — the end of a one-subject timeline", () => {
  const renderPeul = (
    onResultNavigate?: (type: string, rank: number, surface?: string) => void
  ) =>
    render(
      <SearchFeed
        query="peul"
        language="fr"
        state="exact"
        results={[peul]}
        subjects={[peul]}
        leads={[]}
        companions={companions}
        nameHistories={[{ subject: peul, nameHistory: PEUL_HISTORY }]}
        nextSteps={peulNextSteps}
        onResultNavigate={onResultNavigate}
      />
    );

  // @req REQ-198
  it("puts « Voir la fiche complète » before « Les sources du nom Peul »", () => {
    renderPeul();

    const ficheLink = screen.getByRole("link", {
      name: /Voir la fiche complète/,
    });
    const sources = screen.getByRole("heading", {
      level: 2,
      name: "Les sources du nom Peul",
    });
    expect(
      ficheLink.compareDocumentPosition(sources) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // Measured over 30 days: one timeline click recorded, because the next
  // step's links reported nothing.
  // @req REQ-198
  it("reports a next-step click on its own surface, with its rank", () => {
    const onResultNavigate = vi.fn();
    renderPeul(onResultNavigate);

    fireEvent.click(screen.getByRole("link", { name: /Wolof/ }));
    fireEvent.click(screen.getByRole("link", { name: /Atlantique/ }));

    expect(onResultNavigate.mock.calls).toEqual([
      ["namer", 1, "next"],
      ["family", 2, "next"],
    ]);
  });
});

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
    const closing = container.querySelector("[data-name-closing]")!;
    expect(closing).toHaveTextContent(nameClosingCopy.fr.conviction);
    // The verdict's « Proposer une source » is the page's one invitation, so
    // the band asks for nothing (brief 12, part A).
    expect(closing.textContent).not.toContain("Signaler une erreur");
    const invitation = screen.getByRole("button", {
      name: "Proposer une source",
    });
    const next = container.querySelector("[data-name-next]")!;
    expect(invitation.closest('[data-feed-block="verdict"]')).not.toBeNull();
    expect(
      invitation.compareDocumentPosition(closing) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      closing.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
