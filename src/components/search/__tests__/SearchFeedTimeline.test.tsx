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

    expect(lens("Histoire du nom")).toHaveAttribute("aria-pressed", "true");
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
      screen.queryByRole("button", { name: "Histoire du nom" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /Histoire du nom/ })
    ).not.toBeInTheDocument();
  });

  // « Yoruba » names a people, whose name history is written, and a language,
  // whose history is not yet. The timeline must not crown the people as the
  // page's answer nor drop the language without a word (REQ-178).
  describe("when the searched name answers to several subjects", () => {
    const yorubaPeople: SearchResult = {
      ...lingala,
      type: "people",
      id: "PPL_YORUBA",
      name: "Yoruba",
      nameEn: "Yoruba",
    };
    const yorubaLanguage: SearchResult = {
      ...lingala,
      type: "language",
      id: "yor",
      name: "Yoruba",
      nameEn: "Yoruba",
    };

    function renderSharedName() {
      return render(
        <SearchFeed
          query="Yoruba"
          language="fr"
          state="exact"
          results={[yorubaPeople, yorubaLanguage]}
          subjects={[yorubaPeople, yorubaLanguage]}
          leads={[]}
          companions={companions}
          nameHistories={[
            { subject: yorubaPeople, nameHistory: LINGALA_HISTORY },
          ]}
        />
      );
    }

    // @req REQ-178
    it("titles the page with the searched name and crowns no subject", () => {
      renderSharedName();

      const titles = screen.getAllByRole("heading", { level: 1 });
      expect(titles).toHaveLength(1);
      expect(titles[0]).toHaveTextContent("Yoruba");
      expect(
        screen.getByRole("heading", { level: 2, name: "Lingala" })
      ).toBeInTheDocument();
    });

    // @req REQ-178
    it("names the subject whose history is not written yet and leads to its answer", () => {
      renderSharedName();

      const others = screen.getByRole("region", {
        name: "Ce nom désigne aussi",
      });
      expect(others).toHaveTextContent("Langue · Yoruba");
      fireEvent.click(screen.getByRole("button", { name: "Voir tout" }));
      expect(lens("Tout")).toHaveAttribute("aria-pressed", "true");
    });
  });
});
