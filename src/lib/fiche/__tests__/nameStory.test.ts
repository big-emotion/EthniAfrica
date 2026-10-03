import { describe, expect, it } from "vitest";

import type { PeopleNamesDossier } from "@/api/v2/schemas/names";
import { peopleNamingOf } from "@/lib/fiche/nameStory";

const dossier: PeopleNamesDossier = {
  peopleId: "PPL_FULA",
  autonym: "Fulbe",
  names: [
    {
      id: "n1",
      nameText: "Peul",
      nameType: "exonym",
      languageOfOrigin: "wol",
      meaning: "Du wolof pal.",
      periodLabel: null,
      imposition: {
        imposedBy: "les Français",
        impositionPeriod: "XIXe siècle",
        whyProblematic: "Un mot de l’administration.",
        contemporaryUsage: null,
      },
      assertionId: "a1",
      sources: [],
      confidence: null,
      attestations: [],
      shortLine: null,
      namedBy: null,
      originDebated: false,
      usedIn: [],
      pronunciation: null,
    },
  ],
};

describe("peopleNamingOf", () => {
  // @req REQ-178
  it("carries a name record's origin onto the matching form", () => {
    const naming = peopleNamingOf(
      { selfAppellation: "Fulbe", exonyms: ["Peul", "Fulani"] },
      dossier
    );

    const peul = naming.presentation.forms.find(({ form }) => form === "Peul")!;
    expect(peul.origin).toMatchObject({
      meaning: "Du wolof pal.",
      imposedBy: "les Français",
      period: "XIXe siècle",
    });
    expect(peul.problematic).toBe("recorded");
    expect(
      naming.presentation.forms.find(({ form }) => form === "Fulani")!.origin
    ).toBeUndefined();
  });

  // @req REQ-178
  it("reads the appellations alone when the names dossier is absent", () => {
    const naming = peopleNamingOf(
      {
        selfAppellation: "Fulbe",
        exonyms: ["Peul"],
        originOfExonyms: "Origine.",
      },
      null
    );

    expect(naming.selfGiven).toBe("Fulbe");
    expect(naming.origin).toBe("Origine.");
    expect(naming.forms.map(({ form }) => form)).toEqual(["Peul"]);
  });
});
