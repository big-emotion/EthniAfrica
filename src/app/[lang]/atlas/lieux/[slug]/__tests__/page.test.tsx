import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CANONICAL_DOMAIN } from "@/lib/brand";
import { getCountryRoute, getPeopleRoute, getPlaceRoute } from "@/lib/routing";
import type { PlaceRecord } from "@/api/v2/services/places";

const { getPlaceByIdMock } = vi.hoisted(() => ({
  getPlaceByIdMock: vi.fn(),
}));

vi.mock("@/api/v2/services/places", () => ({
  getPlaceById: getPlaceByIdMock,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// The shell is client chrome (search overlay, router); the page under test is
// what goes inside it, plus the title and line it hands the hero.
vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    title,
    subtitle,
  }: {
    children: ReactNode;
    title?: string;
    subtitle?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      <p data-testid="hero-subtitle">{subtitle}</p>
      {children}
    </div>
  ),
}));

import PlaceSlugLayout from "../layout";
import PlacePage, { generateMetadata } from "../page";

const DOZON = {
  title: "La société bété",
  author: "Jean-Pierre Dozon",
  year: 1985,
  url: "https://example.org/dozon.pdf",
  tier: "referenced",
  source_kind: "academic",
};

const GAGNOA: PlaceRecord = {
  id: "LOC_GAGNOA",
  placeType: "ville",
  nameMain: "Gagnoa",
  summary:
    "Gagnoa est une ville du centre-ouest de la Côte d'Ivoire, en pays bété.",
  country: { id: "CIV", name: "Côte d'Ivoire" },
  associatedPeoples: [
    {
      id: "PPL_BETE",
      name: "Bété",
      relation: "Les Bété sont la population autochtone du département.",
    },
  ],
  content: {
    gaps: [
      {
        field: "nameHistory.names[0].namedBy",
        reason: "Nous ne savons pas qui a donné ce nom.",
      },
    ],
    sources: [DOZON],
  },
  nameHistory: {
    summary:
      "Le nom Gagnoa est celui d'une ville du centre-ouest de la Côte d'Ivoire ; nous ne lui connaissons pas d'autre nom.",
    names: [
      {
        nameText: "Gagnoa",
        nameStatus: "current",
        selfGiven: true,
        languageOfOrigin: "btg",
        namedBy: null,
        periodLabel: "Depuis 1912 au moins",
        accounts: [
          {
            period: { from: 1912, to: 1912, label: "Début 1912" },
            statement: "Le nom Gagnoa est celui d'un poste fondé en 1912.",
            sources: [DOZON],
          },
        ],
      },
    ],
  } as unknown as PlaceRecord["nameHistory"],
};

const params = (slug: string) => ({
  params: Promise.resolve({ lang: "fr", slug }),
});

beforeEach(() => {
  vi.clearAllMocks();
  getPlaceByIdMock.mockImplementation(async (id: string) =>
    id === "LOC_GAGNOA" ? GAGNOA : null
  );
});

describe("the place page", () => {
  // @req REQ-196
  it("names the place, says what and where it is, and gives its summary", async () => {
    render(await PlacePage(params("LOC_GAGNOA")));

    expect(
      screen.getByRole("heading", { level: 1, name: "Gagnoa" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("hero-subtitle")).toHaveTextContent(
      "Ville · Côte d'Ivoire"
    );
    expect(screen.getByText(GAGNOA.summary)).toBeInTheDocument();
  });

  // @req REQ-196
  it("tells the history of its names with the fiche's name story", async () => {
    render(await PlacePage(params("LOC_GAGNOA")));

    const story = screen.getByTestId("fiche-name-story");
    expect(
      within(story)
        .getAllByTestId("name-story-form")
        .map((row) => row.dataset.form)
    ).toEqual(["Gagnoa"]);
    expect(within(story).getByTestId("name-story-lead")).toHaveTextContent(
      "Le nom Gagnoa est celui d'une ville du centre-ouest de la Côte d'Ivoire ; nous ne lui connaissons pas d'autre nom."
    );
    expect(within(story).getByText("Depuis 1912 au moins")).toBeInTheDocument();
  });

  // Doctrine §1.1: who speaks, never how much to trust them.
  // @req REQ-196
  it("lists its sources with their type and never their tier", async () => {
    const { container } = render(await PlacePage(params("LOC_GAGNOA")));

    const source = screen.getByRole("link", { name: "La société bété" });
    expect(source).toHaveAttribute("href", DOZON.url);
    expect(
      container.querySelector('[data-source-kind="academic"]')
    ).not.toBeNull();
    expect(container.textContent).not.toMatch(/referenced|unverified|tier/i);
  });

  // @req REQ-196
  it("says what the research has not found yet", async () => {
    render(await PlacePage(params("LOC_GAGNOA")));

    expect(
      screen.getByText("Nous ne savons pas qui a donné ce nom.")
    ).toBeInTheDocument();
  });

  // @req REQ-196
  it("leads to its country and to the peoples tied to it", async () => {
    render(await PlacePage(params("LOC_GAGNOA")));

    expect(screen.getByRole("link", { name: "Côte d'Ivoire" })).toHaveAttribute(
      "href",
      getCountryRoute("fr", "CIV")
    );
    expect(screen.getByRole("link", { name: "Bété" })).toHaveAttribute(
      "href",
      getPeopleRoute("fr", "PPL_BETE")
    );
    expect(
      screen.getByText("Les Bété sont la population autochtone du département.")
    ).toBeInTheDocument();
  });

  // @req REQ-196
  it("answers an unknown place with a not-found from its layout, ahead of the loading boundary", async () => {
    await expect(
      PlaceSlugLayout({ children: null, ...params("LOC_NOWHERE") })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      PlaceSlugLayout({ children: "fiche", ...params("LOC_GAGNOA") })
    ).resolves.toBe("fiche");
  });

  // @req REQ-196
  it("names the place in its head and declares its canonical address", async () => {
    const metadata = await generateMetadata(params("LOC_GAGNOA"));

    expect(String(metadata.title)).toContain("Gagnoa");
    expect(metadata.description).toContain("Gagnoa est une ville");
    expect(metadata.alternates?.canonical).toBe(
      `https://${CANONICAL_DOMAIN}${getPlaceRoute("fr", "LOC_GAGNOA")}`
    );
  });
});
