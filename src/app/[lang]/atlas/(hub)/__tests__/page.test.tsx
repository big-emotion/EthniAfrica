// @req REQ-114
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockCounts, mockCountries, mockWeekly } = vi.hoisted(() => ({
  mockCounts: vi.fn(),
  mockCountries: vi.fn(),
  mockWeekly: vi.fn(),
}));

vi.mock("@/components/search/UniversalSearchField", () => ({
  UniversalSearchField: () => <input aria-label="Rechercher un nom" />,
}));
vi.mock("@/components/search/NameAddressProvider", () => ({
  NameAddressProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock("@/api/v2/services/countryService", () => ({
  getCountryIndex: mockCountries,
}));
vi.mock("@/api/v2/services/atlasHub", () => ({
  getAtlasHubCounts: mockCounts,
}));
vi.mock("@/lib/search/atlasWeeklyNames", () => ({
  getAtlasWeeklyNames: mockWeekly,
}));
vi.mock("@/api/v2/services/nameAddresses", () => ({
  getNameAddressSpellings: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => children,
}));

import AtlasHubRoute from "../page";
import { AtlasNamesHub } from "@/components/atlas/AtlasNamesHub";
import { getLocalizedRoute, getNameAnswerRoute } from "@/lib/routing";

describe("Atlas names hub", () => {
  // @req REQ-114
  it("renders the approved search entry, alphabetized country links, weekly name cards, and live browse counts", async () => {
    mockCountries.mockResolvedValue([
      { id: "BEN", nameFr: "Bénin" },
      { id: "ZAF", nameFr: "Afrique du Sud" },
    ]);
    mockCounts.mockResolvedValue({
      peoples: 665,
      patronymes: 789,
      countries: 54,
      languages: 39,
      families: 25,
    });
    mockWeekly.mockResolvedValue([
      {
        kind: "Peuple",
        name: "Peul",
        summary: "Le nom Peul désigne un peuple…",
        href: getNameAnswerRoute("fr", "Peul"),
      },
    ]);

    render(await AtlasHubRoute({ params: Promise.resolve({ lang: "fr" }) }));

    expect(mockCounts).toHaveBeenCalledOnce();
  });

  // @req REQ-200
  it("renders the approved search entry, alphabetized country links, weekly cards, and browse counts", () => {
    render(
      <AtlasNamesHub
        language="fr"
        countries={[
          { id: "BEN", nameFr: "Bénin" },
          { id: "ZAF", nameFr: "Afrique du Sud" },
        ]}
        counts={{
          peoples: 665,
          patronymes: 789,
          countries: 54,
          languages: 39,
          families: 25,
        }}
        weeklyNames={[
          {
            kind: "Peuple",
            name: "Peul",
            summary: "Le nom Peul désigne un peuple…",
            href: getNameAnswerRoute("fr", "Peul"),
          },
        ]}
        addressSpellings={[]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Les noms d’Afrique" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Rechercher un nom")).toBeInTheDocument();
    const countries = screen.getAllByRole("link").slice(0, 2);
    expect(countries[0]).toHaveTextContent("Afrique du Sud");
    expect(countries[1]).toHaveTextContent("Bénin");
    expect(screen.getByRole("link", { name: /Peul/ })).toHaveAttribute(
      "href",
      getNameAnswerRoute("fr", "Peul")
    );
    expect(
      screen.getByRole("link", { name: /Les peuples 665/ })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "peoples"));
  });
});
