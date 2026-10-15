import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/patronymes", () => ({
  getPatronymeById: vi.fn(async (id: string) =>
    id === "PAT_GBEDEE"
      ? { id, nameMain: "Gbedee" }
      : {
          id,
          nameMain: "Ba",
          nameHistory: {
            summary: "Le nom Ba est un nom de clan des Peuls. Suite.",
          },
        }
  ),
}));
vi.mock("@/api/v2/services/countryService", () => ({
  getCountryById: vi.fn(async (id: string) => ({
    id,
    nameFr: "Libéria",
    nameHistory: { summary: "Le nom Libéria désigne un pays. Suite." },
  })),
}));

import { loadPeopleNextSteps } from "@/lib/fiche/peopleNextSteps";

// Brief 2, approved 2026-10-15: docs/design/mockups/site/people-*.dc.html.
describe("loadPeopleNextSteps — « Poursuivre avec un autre nom » on a fiche", () => {
  // @req REQ-198
  it("offers the family, then a name the people bears, each with its reason", async () => {
    const cards = await loadPeopleNextSteps({
      family: {
        name: "Atlantique",
        summary: "Le nom atlantique désigne des langues. Suite.",
      },
      borneNames: [
        { id: "PAT_BA", nameMain: "Ba", nameSystem: "clan" } as never,
      ],
      countryCodes: ["SEN"],
      language: "fr",
    });

    expect(cards).toEqual([
      {
        kind: "Famille de langues",
        name: "Atlantique",
        reason: "Le nom atlantique désigne des langues.",
      },
      {
        kind: "Nom de famille",
        name: "Ba",
        reason: "Le nom Ba est un nom de clan des Peuls.",
      },
    ]);
  });

  // @req REQ-198
  it("skips a name whose fiche has no summary and falls back on a country", async () => {
    const cards = await loadPeopleNextSteps({
      family: {
        name: "Krou",
        summary: "Le nom krou désigne une famille. Suite.",
      },
      borneNames: [
        { id: "PAT_GBEDEE", nameMain: "Gbedee", nameSystem: "clan" } as never,
      ],
      countryCodes: ["LBR"],
      language: "fr",
    });

    expect(cards.map((card) => card.name)).toEqual(["Krou", "Libéria"]);
  });
});
