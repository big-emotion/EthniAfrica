import { fireEvent, render, screen } from "@testing-library/react";
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
  nameEn: "Lingala",
  exactMatch: true,
  naming: {
    forms: [],
    eras: [],
    presentation: { forms: [], eras: [], disagreements: [], evidence: [] },
  },
};

function renderFeed(
  nameHistories = [{ subject: lingala, nameHistory: LINGALA_HISTORY }]
) {
  return render(
    <SearchFeed
      query="lingala"
      language="fr"
      state="exact"
      results={[lingala]}
      subjects={[lingala]}
      leads={[]}
      companions={companions}
      nameHistories={nameHistories}
    />
  );
}

const lens = (name: string) => screen.getByRole("button", { name });

describe("SearchFeed — the name-history timeline lens", () => {
  // @req REQ-198
  it("opens on the timeline when the searched subject has a name history", () => {
    renderFeed();

    expect(lens("Timeline")).toHaveAttribute("aria-pressed", "true");
    expect(lens("Tout")).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("list", { name: /Histoire du nom Lingala/ })
    ).toBeInTheDocument();
  });

  // « Tout » stays one tap away, and brings the answer back.
  // @req REQ-198
  it("keeps the answer one tap away under « Tout »", () => {
    renderFeed();
    fireEvent.click(lens("Tout"));

    expect(lens("Tout")).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("list", { name: /Histoire du nom/ })
    ).not.toBeInTheDocument();
  });

  // @req REQ-198
  it("keeps the answer as the default when no subject has a name history", () => {
    renderFeed([]);

    expect(
      screen.queryByRole("button", { name: "Timeline" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /Histoire du nom/ })
    ).not.toBeInTheDocument();
  });
});
