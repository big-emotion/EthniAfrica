import { describe, expect, it } from "vitest";

import { readAnswer } from "../answer";
import type { SearchEvidence } from "../evidence";

function evidenceFor(
  fieldPath: string,
  statement: string,
  sourceId: string
): SearchEvidence {
  return {
    assertion: { statement, fieldPath, sourceCount: 1, lastHumanAuditAt: null },
    sources: [{ id: sourceId, title: sourceId, tier: "referenced" }],
    standing: "referenced",
  };
}

describe("readAnswer — people", () => {
  const fula = {
    content: {
      appellations: {
        selfAppellation: "Fulɓe",
        exonyms: ["Peul", "Fulani"],
        originOfExonyms: "Le français a pris « peul » au wolof.",
      },
      demography: {
        totalPopulation: 40_000_000,
        distributionByCountry: [
          { country: "NGA", population: 14_000_000 },
          { country: "GIN", population: 5_000_000 },
        ],
      },
      origins: {
        migrationRoutes: ["Vers le Fouta Djallon", "Vers le Baghirmi"],
      },
    },
    root: { nameMain: "Fula", languageFamilyId: "FLG_ATLANTIQUE" },
  };

  // @req REQ-178
  it("reads the distribution by country and the origin of the other forms", () => {
    const answer = readAnswer("people", fula.content, fula.root, {
      evidence: [
        evidenceFor(
          "content.appellations.originOfExonyms",
          "Le français a pris « peul » au wolof.",
          "src-1"
        ),
      ],
    });

    expect(answer.kind).toBe("people");
    expect(answer.title).toBe("Fula");
    expect(answer.where).toEqual({
      unit: "population",
      estimate: true,
      rows: [
        { countryId: "NGA", value: 14_000_000 },
        { countryId: "GIN", value: 5_000_000 },
      ],
    });
    expect(answer.origin?.accounts[0].text).toBe(
      "Le français a pris « peul » au wolof."
    );
    expect(answer.origin?.accounts[0].evidence).toHaveLength(1);
    expect(answer.what.facts).toMatchObject({
      population: 40_000_000,
      countryCount: 2,
      familyId: "FLG_ATLANTIQUE",
    });
    expect(answer.next).toEqual({
      template: "migration",
      params: { routeCount: 2 },
    });
  });

  // @req REQ-178
  it("lists the self-given form first and carries each form's short line", () => {
    const answer = readAnswer("people", fula.content, fula.root, {
      nameRecords: [
        {
          id: "n1",
          entityType: "people",
          entityId: "PPL_FULA",
          form: "Peul",
          kind: "exonym",
          shortLine: "La forme française.",
          problematic: false,
          usedToday: true,
          evidence: [],
        },
      ],
    });

    expect(answer.names[0]).toMatchObject({ form: "Fulɓe", selfGiven: true });
    expect(answer.names.find(({ form }) => form === "Peul")?.shortLine).toBe(
      "La forme française."
    );
  });

  // @req REQ-178
  it("omits every block the fiche does not fill", () => {
    const answer = readAnswer("people", {}, { nameMain: "X" });

    expect(answer).not.toHaveProperty("origin");
    expect(answer).not.toHaveProperty("where");
    expect(answer).not.toHaveProperty("next");
    expect(answer).not.toHaveProperty("publications");
    expect(answer.what).not.toHaveProperty("lead");
    expect(answer.sources).toEqual({ count: 0 });
  });

  // @req REQ-178
  it("takes the lead and the follow-up from the fiche when it writes them", () => {
    const answer = readAnswer(
      "people",
      {
        ...fula.content,
        searchAnswer: {
          lead: "Un peuple d'éleveurs du Sahel.",
          followUp: "Pourquoi tant de noms ?",
        },
      },
      fula.root
    );

    expect(answer.what.lead).toBe("Un peuple d'éleveurs du Sahel.");
    expect(answer.next).toEqual({ question: "Pourquoi tant de noms ?" });
  });

  // @req REQ-178
  it("ignores a lead the gate would refuse", () => {
    const answer = readAnswer(
      "people",
      {
        searchAnswer: { lead: "x".repeat(300), followUp: "Pas une question." },
      },
      { nameMain: "X" }
    );

    expect(answer.what).not.toHaveProperty("lead");
    expect(answer).not.toHaveProperty("next");
  });
});

describe("readAnswer — country", () => {
  // @req REQ-178
  it("leaves the share not yet split by people as unsplitPercent", () => {
    const answer = readAnswer(
      "country",
      {
        demographics: {
          peoples: [
            {
              name: "Ovimbundu",
              percentageInCountry: 37,
              peopleId: "PPL_OVIMBUNDU",
            },
            {
              name: "Autres groupes ethniques",
              percentageInCountry: 63,
              peopleId: null,
            },
          ],
        },
        historicalNames: { formerNames: ["Afrique occidentale portugaise"] },
      },
      { nameFr: "Angola", etymology: "Du titre ngola." },
      { documentedPeopleCount: 12 }
    );

    expect(answer.where).toEqual({
      unit: "percent",
      estimate: true,
      rows: [{ peopleId: "PPL_OVIMBUNDU", value: 37 }],
      unsplitPercent: 63,
      documentedPeopleCount: 12,
    });
    expect(answer.what.facts.peopleCount).toBe(12);
    expect(answer.next).toEqual({
      template: "formerName",
      params: { formerName: "Afrique occidentale portugaise" },
    });
  });
});

describe("readAnswer — patronyme", () => {
  // @req REQ-178
  it("reads all four origin collections and crowns none", () => {
    const answer = readAnswer(
      "patronyme",
      {},
      {
        nameMain: "Camara",
        origin: {
          oralTraditions: [{ claim: "Un récit oral.", claimStatus: "claimed" }],
          writtenChronicles: [],
          historicalSyntheses: [
            { claim: "Une synthèse.", claimStatus: "claimed" },
          ],
          linguisticReconstructions: [],
        },
        countries: [{ countryId: "MLI" }, { countryId: "GIN" }],
      }
    );

    expect(
      answer.origin?.accounts.map(({ attribution }) => attribution)
    ).toEqual(["oral", "synthesis"]);
    expect(answer.origin?.debated).toBe(false);
    expect(answer.where).toEqual({
      unit: "presence",
      estimate: false,
      rows: [
        { countryId: "MLI", value: null },
        { countryId: "GIN", value: null },
      ],
    });
  });

  // @req REQ-178
  it("counts a patronyme that only has historicalSyntheses as answered", () => {
    const answer = readAnswer(
      "patronyme",
      {},
      {
        nameMain: "Darboe",
        origin: {
          historicalSyntheses: [
            { claim: "Une synthèse.", claimStatus: "claimed" },
          ],
        },
      }
    );

    expect(answer.origin?.accounts).toHaveLength(1);
  });

  // @req REQ-178
  it("attaches each account's own evidence and counts distinct sources", () => {
    const answer = readAnswer(
      "patronyme",
      {},
      {
        nameMain: "Camara",
        origin: {
          oralTraditions: [{ claim: "Un récit oral.", claimStatus: "claimed" }],
          writtenChronicles: [
            { claim: "Une chronique.", claimStatus: "claimed" },
          ],
        },
      },
      {
        evidence: [
          evidenceFor("origin.oralTraditions.0.claim", "Un récit oral.", "a"),
          evidenceFor("origin.writtenChronicles.0", "Une chronique.", "a"),
        ],
      }
    );

    expect(
      answer.origin?.accounts.map(({ evidence }) => evidence.length)
    ).toEqual([1, 1]);
    expect(answer.sources.count).toBe(1);
  });

  // @req REQ-178
  it("flags a contested account as debated", () => {
    const answer = readAnswer(
      "patronyme",
      {},
      {
        nameMain: "X",
        origin: {
          oralTraditions: [{ claim: "Un récit.", claimStatus: "contested" }],
        },
      }
    );

    expect(answer.origin?.debated).toBe(true);
  });
});

describe("readAnswer — language and family", () => {
  const speakers = {
    byCountry: [
      {
        country: "COD",
        speakers: 34_000_000,
        source: { title: "Estimation", tier: "referenced" },
      },
      {
        country: "COG",
        speakers: 4_500_000,
        source: { title: "Estimation", tier: "referenced" },
      },
    ],
  };

  // @req REQ-178
  it("reads the declared speaker estimates, in persons, never a sum of peoples", () => {
    const answer = readAnswer(
      "language",
      {
        alternateNames: ["Bangala"],
        whyProblematic: "Une explication du nom.",
        speakers,
      },
      { id: "lin", nameFr: "Lingala" },
      { peopleCount: 2 }
    );

    expect(answer.where).toEqual({
      unit: "speakers",
      estimate: true,
      rows: [
        { countryId: "COD", value: 34_000_000 },
        { countryId: "COG", value: 4_500_000 },
      ],
    });
    expect(answer.what.facts.population).toBeUndefined();
  });

  // @req REQ-178
  it("draws no where block without declared speakers", () => {
    const answer = readAnswer(
      "language",
      { alternateNames: ["Bangala"] },
      { id: "lin", nameFr: "Lingala" },
      { peopleCount: 2 }
    );

    expect(answer).not.toHaveProperty("where");
  });

  // @req REQ-178
  it("reads the family's declared estimates from its content", () => {
    const answer = readAnswer(
      "languageFamily",
      { speakers },
      { nameFr: "Bantou" }
    );

    expect(answer.where?.unit).toBe("speakers");
  });

  // @req REQ-178
  it("marks the origin debated when the fiche says so", () => {
    const answer = readAnswer(
      "language",
      { whyProblematic: "Deux lectures s'opposent.", originDebated: true },
      { id: "lin", nameFr: "Lingala" }
    );

    expect(answer.origin?.debated).toBe(true);
  });
});
