import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadPatronymeNextSteps } from "@/lib/fiche/patronymeNextSteps";
import { loadPatronymeFiche } from "@/lib/fiche/ficheExistence";

vi.mock("@/lib/fiche/ficheExistence", () => ({
  loadPatronymeFiche: vi.fn(),
}));

const loadName = vi.mocked(loadPatronymeFiche);

describe("loadPatronymeNextSteps (REQ-198)", () => {
  beforeEach(() => loadName.mockReset());

  // @req REQ-198
  it("offers up to four allied names with a readable summary", async () => {
    loadName.mockImplementation(
      async (id) =>
        ({
          nameHistory: {
            names: [{ nameText: id }],
            summary: `Une histoire connue de ${id}. Une autre phrase.`,
          },
        }) as never
    );

    const cards = await loadPatronymeNextSteps(
      [
        { id: "PAT_DIARRA", name: "Diarra" },
        { id: "PAT_DIOP", name: "Diop" },
        { id: "PAT_TOURE", name: "Touré" },
        { id: "PAT_DIAWARA", name: "Diawara" },
        { id: "PAT_OTHER", name: "Autre" },
      ],
      "fr"
    );

    expect(cards.map(({ name, reason }) => [name, reason])).toEqual([
      ["Diarra", "Une histoire connue de PAT_DIARRA."],
      ["Diop", "Une histoire connue de PAT_DIOP."],
      ["Touré", "Une histoire connue de PAT_TOURE."],
      ["Diawara", "Une histoire connue de PAT_DIAWARA."],
    ]);
    expect(loadName).toHaveBeenCalledTimes(5);
  });

  // @req REQ-198
  it("continues through alliances without summaries to fill four next names", async () => {
    loadName.mockImplementation(async (id) =>
      ["PAT_KONE", "PAT_CONDE"].includes(id)
        ? ({ nameHistory: { names: [], summary: " " } } as never)
        : ({
            nameHistory: {
              names: [],
              summary: `Une histoire connue de ${id}.`,
            },
          } as never)
    );

    const cards = await loadPatronymeNextSteps(
      [
        { id: "PAT_DIARRA", name: "Diarra" },
        { id: "PAT_DIOP", name: "Diop" },
        { id: "PAT_KONE", name: "Koné" },
        { id: "PAT_TOURE", name: "Touré" },
        { id: "PAT_CONDE", name: "Condé" },
        { id: "PAT_DIAWARA", name: "Diawara" },
      ],
      "fr"
    );

    expect(cards.map((card) => card.name)).toEqual([
      "Diarra",
      "Diop",
      "Touré",
      "Diawara",
    ]);
    expect(loadName).toHaveBeenCalledTimes(6);
  });

  // @req REQ-198
  it("uses the four allied names approved for the Traoré fiche", async () => {
    loadName.mockImplementation(
      async (id) =>
        ({
          nameHistory: {
            names: [],
            summary: `Le nom ${id} est documenté.`,
          },
        }) as never
    );

    const cards = await loadPatronymeNextSteps(
      [
        { id: "PAT_DIARRA", name: "Diarra" },
        { id: "PAT_DIOP", name: "Diop" },
        { id: "PAT_KONE", name: "Koné" },
        { id: "PAT_TOURE", name: "Touré" },
        { id: "PAT_CONDE", name: "Condé" },
        { id: "PAT_DIAWARA", name: "Diawara" },
      ],
      "fr",
      "PAT_TRAORE"
    );

    expect(cards.map((card) => card.name)).toEqual([
      "Diarra",
      "Diop",
      "Touré",
      "Diawara",
    ]);
  });

  // @req REQ-198
  it("skips missing summaries and duplicate targets", async () => {
    loadName.mockImplementation(async (id) =>
      id === "PAT_EMPTY"
        ? ({ nameHistory: { names: [], summary: " " } } as never)
        : ({ nameHistory: { names: [], summary: "Une phrase." } } as never)
    );

    const cards = await loadPatronymeNextSteps(
      [
        { id: "PAT_EMPTY", name: "Vide" },
        { id: "PAT_ONE", name: "Un" },
        { id: "PAT_ONE", name: "Un autre" },
      ],
      "fr"
    );

    expect(cards.map((card) => card.name)).toEqual(["Un"]);
  });

  // @req REQ-198
  it("continues when one allied fiche cannot be read", async () => {
    loadName.mockImplementation(async (id) => {
      if (id === "PAT_ERROR") throw new Error("unreachable");
      return { nameHistory: { names: [], summary: "Une phrase." } } as never;
    });

    const cards = await loadPatronymeNextSteps(
      [
        { id: "PAT_ERROR", name: "Erreur" },
        { id: "PAT_OK", name: "Bien" },
      ],
      "fr"
    );

    expect(cards.map((card) => card.name)).toEqual(["Bien"]);
  });
});
