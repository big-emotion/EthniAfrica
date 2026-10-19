import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadCountryFiche, loadPeopleFiche } = vi.hoisted(() => ({
  loadCountryFiche: vi.fn(),
  loadPeopleFiche: vi.fn(),
}));

vi.mock("@/lib/fiche/ficheExistence", () => ({
  loadCountryFiche,
  loadPeopleFiche,
}));

import { loadPlaceNextSteps } from "@/lib/fiche/placeNextSteps";

describe("loadPlaceNextSteps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadCountryFiche.mockResolvedValue({
      nameMain: "Côte d'Ivoire",
      nameHistory: {
        summary: "Le nom Côte d'Ivoire désigne un pays. Une autre phrase.",
      },
    });
    loadPeopleFiche.mockResolvedValue({
      nameMain: "Guro",
      nameHistory: {
        summary: "Le nom Guro désigne un peuple. Une autre phrase.",
      },
    });
  });

  // @req REQ-198
  it("offers the linked country, then the first associated people using their fiche names and first sentences", async () => {
    const cards = await loadPlaceNextSteps({
      countries: [{ id: "CIV", name: "Côte d'Ivoire" }],
      associatedPeoples: [
        { id: "PPL_GURO", name: "Guro" },
        { id: "PPL_BAOULE", name: "Baoulé" },
      ],
      language: "fr",
    });

    expect(cards).toEqual([
      {
        relation: "country",
        kind: "Pays",
        name: "Côte d'Ivoire",
        reason: "Le nom Côte d'Ivoire désigne un pays.",
      },
      {
        relation: "people",
        kind: "Peuple",
        name: "Guro",
        reason: "Le nom Guro désigne un peuple.",
      },
    ]);
    expect(loadCountryFiche).toHaveBeenCalledExactlyOnceWith("CIV");
    expect(loadPeopleFiche).toHaveBeenCalledExactlyOnceWith("PPL_GURO");
  });

  // @req REQ-198
  it("skips missing fiches and fiches without a summary", async () => {
    loadCountryFiche.mockResolvedValueOnce(null);
    loadPeopleFiche.mockResolvedValueOnce({
      nameMain: "Guro",
      nameHistory: { summary: "  " },
    });

    const cards = await loadPlaceNextSteps({
      countries: [{ id: "CIV", name: "Côte d'Ivoire" }],
      associatedPeoples: [
        { id: "PPL_GURO", name: "Guro" },
        { id: "PPL_BAOULE", name: "Baoulé" },
      ],
      language: "fr",
    });

    expect(cards).toEqual([]);
    expect(loadCountryFiche).toHaveBeenCalledExactlyOnceWith("CIV");
    expect(loadPeopleFiche).toHaveBeenCalledTimes(1);
    expect(loadPeopleFiche).toHaveBeenCalledWith("PPL_GURO");
  });
});
