import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/languageFamilyService", () => ({
  getLanguageFamilyById: vi.fn(async () => ({
    nameHistory: {
      summary: "Le nom bantou désigne une famille de langues. Suite.",
    },
  })),
}));
vi.mock("@/lib/fiche/ficheExistence", () => ({
  loadPeopleFiche: vi.fn(async (id: string) =>
    id === "PPL_NONE"
      ? null
      : { nameHistory: { summary: "Le nom Havu désigne un peuple. Suite." } }
  ),
}));

import { loadLanguageNextSteps } from "@/lib/fiche/languageNextSteps";

// Brief 3, approved 2026-10-15: docs/design/mockups/site/language-*.dc.html.
describe("loadLanguageNextSteps — « Poursuivre avec un autre nom » on a language", () => {
  // @req REQ-198
  it("offers the family, then the first people with a summary", async () => {
    const cards = await loadLanguageNextSteps({
      family: { id: "FLG_BANTU", name: "Bantou" },
      speakingPeoples: [
        { id: "PPL_NONE", name: "Sans fiche" },
        { id: "PPL_HAVU", name: "Havu" },
      ],
      language: "fr",
    });

    expect(cards).toEqual([
      {
        kind: "Famille de langues",
        name: "Bantou",
        reason: "Le nom bantou désigne une famille de langues.",
      },
      {
        kind: "Peuple",
        name: "Havu",
        reason: "Le nom Havu désigne un peuple.",
      },
    ]);
  });
});
