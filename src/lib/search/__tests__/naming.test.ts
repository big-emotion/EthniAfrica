import { describe, expect, it } from "vitest";

import { readNaming } from "@/lib/search/naming";
import type { SearchNameRecord } from "@/lib/search/naming";

/**
 * Five classes store their naming under five different keys, and the result
 * page has one promise to keep. These assert that each reader returns the same
 * shape — and, twice over, that the reader does not improve on the corpus:
 * a qualifier is never parsed out of a form, and an absent field stays absent.
 */

describe("the naming projection", () => {
  // @req REQ-044
  it("reads a people from content.appellations", () => {
    const naming = readNaming("people", {
      appellations: {
        selfAppellation: "Fang (prononcé fàŋ)",
        exonyms: ["Pahouin", "Pangwe", "Pamue"],
        originOfExonyms: "Les trois noms européens viennent d'un même mot.",
        whyProblematic: "Pahouin est parfois tenu pour péjoratif.",
        contemporaryUsage: "Fang est la forme en usage.",
      },
    });

    expect(naming.selfGiven).toBe("Fang (prononcé fàŋ)");
    expect(naming.forms.map((form) => form.form)).toEqual([
      "Pahouin",
      "Pangwe",
      "Pamue",
    ]);
    expect(naming.origin).toContain("même mot");
    expect(naming.problem).toContain("péjoratif");
    expect(naming.usageToday).toContain("en usage");
    expect(naming.eras).toEqual([]);
  });

  // 75.4 % of the corpus's 3 127 exonyms are bare forms, and the quarter that
  // are not carry their qualifier inside the string in 677 distinct free-text
  // values. Splitting on the parenthesis would publish those values as if they
  // were a controlled vocabulary.
  // @req REQ-044
  it("never parses a qualifier out of the form", () => {
    const naming = readNaming("people", {
      appellations: { exonyms: ["Mandingue (français colonial)"] },
    });

    expect(naming.forms[0].form).toBe("Mandingue (français colonial)");
    expect(naming.forms[0].qualifier).toBeUndefined();
  });

  // @req REQ-044
  it("reads a country's six eras, which is the only class that dates its names", () => {
    const naming = readNaming(
      "country",
      {
        historicalNames: {
          antiquity: "Nom antique",
          colonization: "Nom colonial",
          contemporary: "Nom actuel",
        },
      },
      { etymology: "Du portugais.", nameOriginActor: "Les navigateurs." }
    );

    expect(naming.origin).toContain("portugais");
    expect(naming.eras.map((era) => era.era)).toEqual([
      "antiquity",
      "colonization",
      "contemporary",
    ]);
    expect(naming.eras[0].text).toBe("Nom antique");
  });

  // @req REQ-044
  it("reads a family from content.decolonialHeader", () => {
    const naming = readNaming("languageFamily", {
      decolonialHeader: {
        selfAppellation: "Ce qu'elle se donne",
        historicalAppellations: ["Hamito-sémitique"],
        originOfHistoricalTerm: "Forgé au XIXe siècle.",
        whyProblematic: "Le terme porte une hiérarchie.",
        contemporaryUsage: "Afro-asiatique aujourd'hui.",
      },
    });

    expect(naming.selfGiven).toBe("Ce qu'elle se donne");
    expect(naming.forms.map((form) => form.form)).toEqual(["Hamito-sémitique"]);
    expect(naming.origin).toContain("XIXe");
  });

  // The one class whose model already carries what the page wants: a form with
  // its own attestations and its own sources.
  // @req REQ-044
  it("reads a patronyme's spellings with where each is attested", () => {
    const naming = readNaming(
      "patronyme",
      {},
      {
        spellings: [
          { spelling: "Ababda", attestations: [{ countryId: "EGY" }] },
          {
            spelling: "Ababdeh",
            attestations: [{ countryId: "EGY" }, { countryId: "SDN" }],
          },
        ],
        origin: {
          writtenChronicles: [{ claim: "Barnard reproduit la forme." }],
        },
      }
    );

    expect(naming.forms.map((form) => form.form)).toEqual([
      "Ababda",
      "Ababdeh",
    ]);
    expect(naming.forms[1].attestedIn).toEqual(["EGY", "SDN"]);
    expect(naming.origin).toContain("Barnard");
  });

  // @req REQ-044
  it("reads a language's alternate names, and finds no origin because none exists", () => {
    const naming = readNaming(
      "language",
      {},
      {
        alternateNames: ["Dho Alur", "Aloro"],
      }
    );

    expect(naming.forms.map((form) => form.form)).toEqual([
      "Dho Alur",
      "Aloro",
    ]);
    expect(naming.origin).toBeUndefined();
  });

  // A class with nothing to say returns the empty shape rather than undefined,
  // so the page's conditions are field checks and never null guards.
  // @req REQ-044
  it("returns the empty shape for a class that carries no naming", () => {
    const naming = readNaming("place", {}, {});

    expect(naming.forms).toEqual([]);
    expect(naming.eras).toEqual([]);
    expect(naming.selfGiven).toBeUndefined();
  });

  // @req REQ-180
  it("builds per-form presentation facts from one structured name record", () => {
    const records: SearchNameRecord[] = [
      {
        id: "name-mandingo",
        entityType: "people",
        entityId: "PPL_MANDE",
        form: "Mandingo",
        kind: "exonym",
        languageOfOrigin: "eng",
        meaning: "The English rendering of Mandingue",
        periodLabel: "colonial period",
        imposedBy: "British administrations",
        impositionPeriod: "nineteenth century",
        problematic: true,
        usedToday: true,
        claimStatus: "contested",
        evidence: [
          {
            assertion: {
              id: "assertion-mandingo",
              statement: "Mandingo is attested in English-language sources.",
              position: "English-language usage",
              fieldPath: "content.appellations.exonyms.0",
              confidenceScore: 0.8,
              sourceCount: 1,
              lastHumanAuditAt: "2026-09-01",
            },
            sources: [
              {
                id: "source-mandingo",
                title: "A referenced work",
                url: "https://example.org/source",
                year: 1972,
                tier: "referenced",
              },
            ],
            standing: "referenced",
          },
        ],
      },
    ];

    const naming = readNaming(
      "people",
      {
        appellations: {
          selfAppellation: "Maninka",
          exonyms: ["Mandingo"],
        },
      },
      { id: "PPL_MANDE" },
      records
    );

    expect(naming.presentation.forms).toEqual([
      {
        form: "Maninka",
        selfGiven: true,
        attestations: [],
        evidence: [],
      },
      expect.objectContaining({
        form: "Mandingo",
        selfGiven: false,
        origin: {
          languageCode: "eng",
          meaning: "The English rendering of Mandingue",
          imposedBy: "British administrations",
          period: "nineteenth century",
        },
        attestationPeriod: "colonial period",
        problematic: "recorded",
        currentUsage: "recorded",
        claimStatus: "contested",
      }),
    ]);
    expect(naming.presentation.forms[1].evidence).toHaveLength(1);
  });

  // @req REQ-180
  it("keeps an explicitly contested patronym origin as positions instead of resolving it", () => {
    const evidence = [
      {
        assertion: {
          id: "assertion-problem",
          statement: "One source records ‘problem’.",
          fieldPath: "origin.linguisticReconstructions.0.claim",
          sourceCount: 1,
          lastHumanAuditAt: null,
        },
        sources: [
          {
            id: "source-a",
            title: "First source",
            tier: "referenced" as const,
          },
        ],
        standing: "referenced" as const,
      },
      {
        assertion: {
          id: "assertion-sanctuary",
          statement: "Another records ‘sanctuary’.",
          fieldPath: "origin.linguisticReconstructions.1.claim",
          sourceCount: 1,
          lastHumanAuditAt: null,
        },
        sources: [
          {
            id: "source-b",
            title: "Second source",
            tier: "official" as const,
          },
        ],
        standing: "official" as const,
      },
    ];
    const naming = readNaming(
      "patronyme",
      {},
      {
        nameMain: "Riek",
        spellings: [{ spelling: "Riek", attestations: [{ countryId: "SSD" }] }],
        origin: {
          linguisticReconstructions: [
            {
              claim: "One source records ‘problem’.",
              claimStatus: "contested",
              sourceRefs: ["source-a"],
            },
            {
              claim: "Another records ‘sanctuary’.",
              claimStatus: "claimed",
              sourceRefs: ["source-b"],
            },
          ],
        },
      },
      [],
      evidence
    );

    expect(naming.presentation.disagreements).toEqual([
      {
        positions: [
          {
            statement: "One source records ‘problem’.",
            claimStatus: "contested",
            evidence: [evidence[0]],
          },
          {
            statement: "Another records ‘sanctuary’.",
            claimStatus: "claimed",
            evidence: [evidence[1]],
          },
        ],
      },
    ]);
  });

  // @req REQ-180
  it("does not confuse disagreement path indices 1 and 10", () => {
    const claims = Array.from({ length: 11 }, (_, index) => ({
      claim: `Recorded position ${index}.`,
      claimStatus: index === 1 ? "contested" : "claimed",
    }));
    const evidence = [1, 10].map((index) => ({
      assertion: {
        id: `assertion-${index}`,
        statement: `Recorded position ${index}.`,
        fieldPath: `origin.linguisticReconstructions.${index}.claim`,
        sourceCount: 1,
        lastHumanAuditAt: null,
      },
      sources: [
        {
          id: `source-${index}`,
          title: `Source ${index}`,
          tier: "referenced" as const,
        },
      ],
      standing: "referenced" as const,
    }));

    const naming = readNaming(
      "patronyme",
      {},
      { origin: { linguisticReconstructions: claims } },
      [],
      evidence
    );
    const positions = naming.presentation.disagreements[0].positions;

    expect(positions[1].evidence[0].sources[0].id).toBe("source-1");
    expect(positions[10].evidence[0].sources[0].id).toBe("source-10");
    expect(positions[1].evidence).toHaveLength(1);
    expect(positions[10].evidence).toHaveLength(1);
  });

  // @req REQ-180
  it("never leaks workshop or scholarly vocabulary into presentation facts", () => {
    const naming = readNaming(
      "language",
      {
        alternateNames: ["Bangala"],
        whyProblematic: "The corpus calls this an exonym.",
      },
      {},
      [
        {
          id: "name-bangala",
          entityType: "language",
          entityId: "lin",
          form: "Bangala",
          kind: "historical_spelling",
          meaning: "Corpus AFRIK — content.alternateNames",
          imposedBy: "missionaries",
          problematic: true,
          usedToday: false,
          evidence: [],
        },
      ]
    );

    expect(naming.presentation.forms[0]).toMatchObject({
      form: "Bangala",
      problematic: "recorded",
      origin: { imposedBy: "missionaries" },
    });
    expect(naming.presentation.forms[0].origin).not.toHaveProperty("meaning");
    expect(JSON.stringify(naming.presentation)).not.toMatch(
      /corpus|exonym|endonym|autonym|etymolog/i
    );
  });

  // @req REQ-180
  it("projects all five subject classes without deriving missing facts", () => {
    const projections = [
      readNaming("people", {
        appellations: { selfAppellation: "Fang", exonyms: ["Pahouin"] },
      }),
      readNaming("languageFamily", {
        decolonialHeader: {
          selfAppellation: "Afro-asiatique",
          historicalAppellations: ["Hamito-sémitique"],
        },
      }),
      readNaming(
        "country",
        {
          historicalNames: {
            formerNames: ["Niger Area"],
            contemporary: "Nigeria",
          },
        },
        {}
      ),
      readNaming("language", { alternateNames: ["Bangala"] }),
      readNaming(
        "patronyme",
        {},
        {
          spellings: [
            { spelling: "Traoré", attestations: [{ countryId: "MLI" }] },
          ],
        }
      ),
    ];

    expect(projections.map((item) => item.presentation.forms.length)).toEqual([
      2, 2, 1, 1, 1,
    ]);
    expect(projections[2].presentation.eras.map(({ era }) => era)).toEqual([
      "formerNames",
      "contemporary",
    ]);
    expect(projections[3].presentation.forms[0]).not.toHaveProperty("origin");
    expect(projections[4].presentation.forms[0].attestations).toEqual(["MLI"]);
  });
});
