import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fiche/ficheExistence", () => ({
  loadLanguageFiche: vi.fn(async (id: string) =>
    id === "hav"
      ? { nameHistory: null }
      : {
          nameHistory: {
            summary: `Le nom ${id} désigne une langue. Suite.`,
          },
        }
  ),
  loadPeopleFiche: vi.fn(async (id: string) =>
    id === "PPL_NONE"
      ? null
      : { nameHistory: { summary: "Le nom Swahili désigne un peuple. Suite." } }
  ),
}));

import {
  loadFamilyNextSteps,
  rankFamilyLanguages,
} from "@/lib/fiche/familyNextSteps";

const spoken = (millions: number) => ({
  speakers: { byCountry: [{ country: "COD", speakers: millions * 1e6 }] },
});

// Brief 4, approved 2026-10-15: docs/design/mockups/site/family-*.dc.html.
describe("familyNextSteps — « Poursuivre avec un autre nom » on a family", () => {
  // @req REQ-198
  it("ranks the languages by declared speakers, then from A to Z", () => {
    expect(
      rankFamilyLanguages([
        { id: "tll", name: "Otetela" },
        { id: "hav", name: "Havu (kihavu)" },
        { id: "lin", name: "Lingala", content: spoken(34) },
      ]).map((entry) => entry.name)
    ).toEqual(["Lingala", "Havu (kihavu)", "Otetela"]);
  });

  // @req REQ-198
  it("offers one language and one people, each with its fiche's first sentence", async () => {
    const cards = await loadFamilyNextSteps({
      languages: [
        { id: "hav", name: "Havu (kihavu)", content: spoken(50) },
        { id: "lin", name: "Lingala", content: spoken(34) },
        { id: "tll", name: "Otetela" },
      ],
      peoples: [
        { id: "PPL_NONE", name: "Sans fiche" },
        { id: "PPL_SWAHILI", name: "Swahili" },
      ],
      language: "fr",
    });

    expect(cards).toEqual([
      {
        kind: "Langue",
        name: "Lingala",
        reason: "Le nom lin désigne une langue.",
      },
      {
        kind: "Peuple",
        name: "Swahili",
        reason: "Le nom Swahili désigne un peuple.",
      },
    ]);
  });
});
