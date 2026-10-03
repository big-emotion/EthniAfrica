import { describe, expect, it } from "vitest";

import type { PeopleNamesDossier } from "@/api/v2/schemas/names";
import { peopleNameAnswer } from "@/lib/fiche/nameAnswer";

type DossierName = PeopleNamesDossier["names"][number];

function form(overrides: Partial<DossierName>): DossierName {
  return {
    id: "nr",
    nameText: "Forme",
    nameType: "exonym",
    languageOfOrigin: null,
    meaning: null,
    periodLabel: null,
    imposition: null,
    assertionId: "a",
    sources: [],
    confidence: null,
    attestations: [],
    shortLine: null,
    namedBy: null,
    originDebated: false,
    usedIn: [],
    pronunciation: null,
    ...overrides,
  };
}

const dossier: PeopleNamesDossier = {
  peopleId: "PPL_FULA",
  autonym: "Fulɓe",
  names: [
    form({
      nameText: "Fulɓe",
      nameType: "endonym",
      languageOfOrigin: "ful",
      shortLine: "Le nom qu'ils se donnent.",
      originDebated: true,
      meaning: "Deux pistes, aucune retenue.",
      pronunciation: {
        respelling: "foul-bé",
        audio: null,
        source: {
          title: "Guide",
          author: "A",
          year: 2000,
          url: "u",
          tier: "referenced",
        },
      },
    }),
    form({ nameText: "Peul", namedBy: "les Wolof", usedIn: ["fra"] }),
    form({ nameText: "Fulɓe", nameType: "historical_spelling" }),
    form({
      nameText: "Toucouleur",
      imposition: {
        imposedBy: "Ethnographes coloniaux",
        impositionPeriod: null,
        whyProblematic: "Une ethnie séparée par classement.",
        contemporaryUsage: null,
      },
      originDebated: true,
    }),
  ],
};

describe("peopleNameAnswer", () => {
  // @req REQ-190
  it("answers with the self-name first, its line, its pronunciation and its badges", () => {
    const answer = peopleNameAnswer(undefined, dossier, "fr");

    expect(answer.self).toMatchObject({
      form: "Fulɓe",
      lang: "ff",
      line: "Le nom qu'ils se donnent.",
      pronunciation: { respelling: "foul-bé", audioUrl: null },
      detail: "Deux pistes, aucune retenue.",
    });
    expect(answer.self.badges).toEqual(["own", "debated"]);
  });

  // @req REQ-190
  it("lists every other form once, each with the badges its fields carry", () => {
    const answer = peopleNameAnswer(undefined, dossier, "fr");

    expect(answer.others.map((other) => other.form)).toEqual([
      "Peul",
      "Toucouleur",
    ]);
    expect(answer.others[0].line).toBe("Donné par les Wolof.");
    expect(answer.others[0].badges).toEqual(["outside", "usage:fra"]);
    expect(answer.others[1].badges).toEqual(["imposed", "debated"]);
  });

  // @req REQ-190
  it("falls back on the fiche's appellations when no name record exists", () => {
    const answer = peopleNameAnswer(
      {
        selfAppellation: "Eʋeawo",
        exonyms: ["Ewhe (graphie coloniale)"],
        originOfExonyms: "La graphie « Ewhe » vient des rapports coloniaux.",
        whyProblematic: "Une graphie administrative, jamais employée par eux.",
      },
      null,
      "fr",
      "ewe"
    );

    expect(answer.self).toMatchObject({ form: "Eʋeawo", lang: "ee" });
    expect(answer.self.badges).toEqual(["own"]);
    expect(answer.others).toEqual([
      expect.objectContaining({
        form: "Ewhe (graphie coloniale)",
        badges: ["outside"],
      }),
    ]);
    expect(answer.othersNote).toBe(
      "La graphie « Ewhe » vient des rapports coloniaux."
    );
    // Opened on demand, never in the first reading.
    expect(answer.othersProblem).toBe(
      "Une graphie administrative, jamais employée par eux."
    );
  });

  // @req REQ-190
  it("has no self-name to show when the fiche declares none", () => {
    const answer = peopleNameAnswer({ exonyms: ["Nom"] }, null, "fr");

    expect(answer.self).toBeNull();
    expect(answer.others.map((other) => other.form)).toEqual(["Nom"]);
  });
});
