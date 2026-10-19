import { describe, expect, it } from "vitest";

import { parsePatronymeFile } from "@/lib/afrik/parsers/patronymeParser";
import type { PatronymeDossier } from "@/lib/afrik/parsers/patronymeTypes";
import { migratePatronymeOriginToNameHistory } from "../migratePatronymeOriginToNameHistory";

function dossier(overrides: Record<string, unknown> = {}): PatronymeDossier {
  return {
    _meta: {
      format: "AFRIK JSON v2",
      entity: "patronyme",
      directives: "Fixture",
    },
    id: "PAT_TEST",
    nameMain: "Test",
    spellings: [
      {
        spelling: "Test",
        attestations: [{ countryId: "MLI", sourceRefs: ["oral-source"] }],
      },
    ],
    nameSystem: "clan_name",
    transmissionMode: "other",
    designatedSocialUnit: "other",
    origin: {
      oralTraditions: [
        {
          claim: "Des anciens racontent cet épisode.",
          claimStatus: "contested",
          carrier: "Des anciens du village",
          collection: "mediated",
          collector: "Une chercheuse",
          context: "Entretiens menés dans le village.",
          sourceRefs: ["oral-source"],
        },
      ],
      writtenChronicles: [],
      historicalSyntheses: [],
      linguisticReconstructions: [],
    },
    peoples: [],
    countries: [],
    alliances: [],
    casteOrSocialFunction: null,
    bearers: [],
    homonyms: [],
    sources: [
      {
        sourceKey: "oral-source",
        title: "Récit transmis par les anciens",
        url: null,
        tier: "unverified",
        source_kind: "oral_tradition",
        notes: "Récit recueilli sur place.",
      },
    ],
    gaps: [
      { fieldPath: "origin", reason: "Fixture" },
      { fieldPath: "nameHistory", reason: "Fixture" },
    ],
    ...overrides,
  } as unknown as PatronymeDossier;
}

describe("migratePatronymeOriginToNameHistory", () => {
  // @req REQ-196
  it("moves an oral account with its status, provenance and cited source", () => {
    const migrated = migratePatronymeOriginToNameHistory(dossier());
    const account = migrated.nameHistory?.names[0].accounts[0];

    expect(account).toMatchObject({
      period: { from: null, to: null, label: "Origine non datée" },
      statement: "Des anciens racontent cet épisode.",
      claimStatus: "contested",
      carrier: "Des anciens du village",
      collection: "mediated",
      collector: "Une chercheuse",
      sources: [
        {
          title: "Récit transmis par les anciens",
          author: "Auteur non précisé",
          year: null,
          url: null,
          tier: "unverified",
          source_kind: "oral_tradition",
        },
      ],
    });
    expect(account?.sources[0].notes).toContain(
      "Entretiens menés dans le village."
    );
    expect(migrated.origin).toEqual({
      oralTraditions: [],
      writtenChronicles: [],
      historicalSyntheses: [],
      linguisticReconstructions: [],
    });
    expect(migrated.gaps.some((gap) => gap.fieldPath === "origin")).toBe(false);
    expect(parsePatronymeFile(migrated).success).toBe(true);
  });

  // @req REQ-196
  it("creates a primary-name history when a patronyme has none", () => {
    const migrated = migratePatronymeOriginToNameHistory(dossier());

    expect(migrated.nameHistory?.names[0]).toMatchObject({
      nameText: "Test",
      nameStatus: "current",
      selfGiven: false,
      accounts: [expect.objectContaining({ claimStatus: "contested" })],
    });
  });

  // @req REQ-196
  it("uses the reviewed chapter author for the Wondji source record", () => {
    const input = dossier({
      origin: {
        oralTraditions: [
          {
            claim: "Le chapitre rapporte cet épisode.",
            sourceRefs: ["hga-v-wondji"],
          },
        ],
        writtenChronicles: [],
        historicalSyntheses: [],
        linguisticReconstructions: [],
      },
      sources: [
        {
          sourceKey: "hga-v-wondji",
          title:
            "Histoire générale de l'Afrique, V, ch. 13 : Les États et les cultures de la côte de haute Guinée",
          url: "https://unesdoc.unesco.org/ark:/48223/pf0000184292",
          tier: "official",
          source_kind: "intergovernmental",
          notes: "UNESCO, 1999 ; chapitre de C. Wondji.",
        },
      ],
    });

    const migrated = migratePatronymeOriginToNameHistory(input);

    expect(migrated.nameHistory?.names[0].accounts[0].sources[0].author).toBe(
      "Christophe Wondji"
    );
  });

  // @req REQ-196
  it("keeps separate chapters that share a volume URL as separate sources", () => {
    const input = dossier({
      nameHistory: {
        summary: "Le dossier décrit le nom.",
        originExplained: true,
        names: [
          {
            nameText: "Test",
            nameStatus: "current",
            selfGiven: false,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: { from: null, to: null, label: "Origine non datée" },
                statement: "Un premier épisode.",
                sources: [
                  {
                    title: "Volume V, chapitre 12",
                    author: "Auteur du chapitre 12",
                    year: 1999,
                    url: "https://unesdoc.unesco.org/volume-v",
                    tier: "official",
                    source_kind: "intergovernmental",
                  },
                ],
              },
            ],
          },
        ],
      },
      origin: {
        oralTraditions: [
          { claim: "Un autre épisode.", sourceRefs: ["chapter-13"] },
        ],
        writtenChronicles: [],
        historicalSyntheses: [],
        linguisticReconstructions: [],
      },
      sources: [
        {
          sourceKey: "chapter-13",
          title: "Volume V, chapitre 13",
          url: "https://unesdoc.unesco.org/volume-v",
          tier: "official",
          source_kind: "intergovernmental",
        },
      ],
    });

    const migrated = migratePatronymeOriginToNameHistory(input);
    const sources = migrated.nameHistory?.names[0].accounts[1].sources ?? [];

    expect(sources).toHaveLength(1);
    expect(sources[0].title).toBe("Volume V, chapitre 13");
    expect(migrated.nameHistory?.names[0].accounts[0].sources).toHaveLength(1);
  });

  // @req REQ-196
  it("uses only an explicit reviewed mapping to merge with existing history", () => {
    const input = dossier({
      nameHistory: {
        summary: "Le dossier décrit le nom.",
        originExplained: true,
        names: [
          {
            nameText: "Test",
            nameStatus: "current",
            selfGiven: false,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: { from: null, to: null, label: "Origine non datée" },
                statement: "Des anciens racontent cet épisode.",
                sources: [
                  {
                    title: "Récit transmis par les anciens",
                    author: "Une chercheuse",
                    year: null,
                    url: null,
                    tier: "unverified",
                    source_kind: "oral_tradition",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const migrated = migratePatronymeOriginToNameHistory(input, [
      {
        originType: "oralTraditions",
        originIndex: 0,
        targetName: "Test",
        targetStatements: ["Des anciens racontent cet épisode."],
      },
    ]);

    expect(migrated.nameHistory?.names[0].accounts).toHaveLength(1);
    expect(migrated.nameHistory?.names[0].accounts[0].claimStatus).toBe(
      "contested"
    );
    expect(migrated.nameHistory?.names[0].accounts[0].sources).toHaveLength(1);
  });

  // @req REQ-196
  it("allows a reviewed oral account to match its source by an explicit URL", () => {
    const input = dossier({
      nameHistory: {
        summary: "Le dossier décrit le nom.",
        originExplained: true,
        names: [
          {
            nameText: "Test",
            nameStatus: "current",
            selfGiven: false,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: { from: null, to: null, label: "Récit ancien" },
                statement: "Les anciens racontent cet épisode.",
                sources: [
                  {
                    title: "Récit oral recueilli",
                    author: "Les anciens",
                    year: 1911,
                    url: "https://archive.org/details/example",
                    tier: "unverified",
                    source_kind: "oral_tradition",
                  },
                ],
              },
            ],
          },
        ],
      },
      origin: {
        oralTraditions: [
          {
            claim: "Les anciens racontent cet épisode.",
            claimStatus: "claimed",
            sourceRefs: ["roscoe"],
          },
        ],
        writtenChronicles: [],
        historicalSyntheses: [],
        linguisticReconstructions: [],
      },
      sources: [
        {
          sourceKey: "roscoe",
          title: "The Baganda",
          url: "https://archive.org/details/example",
          tier: "referenced",
          source_kind: "academic",
        },
      ],
    });

    const migrated = migratePatronymeOriginToNameHistory(input, [
      {
        originType: "oralTraditions",
        originIndex: 0,
        targetName: "Test",
        targetPeriod: "Récit ancien",
        targetSourceUrl: "https://archive.org/details/example",
      },
    ]);

    expect(migrated.nameHistory?.names[0].accounts[0].sources).toHaveLength(2);
    expect(migrated.nameHistory?.names[0].accounts[0].claimStatus).toBe(
      "claimed"
    );
  });

  // @req REQ-196
  it("merges a reviewed period match, checks source overlap, and preserves oral notes", () => {
    const input = dossier({
      nameHistory: {
        summary: "Le dossier décrit le nom.",
        originExplained: true,
        names: [
          {
            nameText: "Test",
            nameStatus: "current",
            selfGiven: false,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: {
                  from: null,
                  to: null,
                  label: "Récit recueilli en 2017",
                },
                statement: "Une version déjà documentée.",
                sources: [
                  {
                    title: "Récit transmis par les anciens",
                    author: "Une chercheuse",
                    year: null,
                    url: null,
                    tier: "unverified",
                    source_kind: "oral_tradition",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const migrated = migratePatronymeOriginToNameHistory(input, [
      {
        originType: "oralTraditions",
        originIndex: 0,
        targetName: "Test",
        targetPeriod: "Récit recueilli en 2017",
      },
    ]);

    const account = migrated.nameHistory?.names[0].accounts[0];
    expect(migrated.nameHistory?.names[0].accounts).toHaveLength(1);
    expect(account?.claimStatus).toBe("contested");
    expect(account?.sources[0].notes).toContain(
      "Entretiens menés dans le village."
    );
  });

  // @req REQ-196
  it("rejects a reviewed period match without a shared source", () => {
    const input = dossier({
      nameHistory: {
        summary: "Le dossier décrit le nom.",
        originExplained: true,
        names: [
          {
            nameText: "Test",
            nameStatus: "current",
            selfGiven: false,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: {
                  from: null,
                  to: null,
                  label: "Récit recueilli en 2017",
                },
                statement: "Un autre compte.",
                sources: [
                  {
                    title: "Une autre source",
                    author: "Une chercheuse",
                    year: null,
                    url: null,
                    tier: "unverified",
                    source_kind: "oral_tradition",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(() =>
      migratePatronymeOriginToNameHistory(input, [
        {
          originType: "oralTraditions",
          originIndex: 0,
          targetName: "Test",
          targetPeriod: "Récit recueilli en 2017",
        },
      ])
    ).toThrow("no unique reviewed target account");
  });

  // @req REQ-196
  it("keeps same-source but separately worded claims apart without a review mapping", () => {
    const input = dossier({
      nameHistory: {
        summary: "Le dossier décrit le nom.",
        originExplained: true,
        names: [
          {
            nameText: "Test",
            nameStatus: "current",
            selfGiven: false,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: { from: null, to: null, label: "Origine non datée" },
                statement: "Une version voisine de cet épisode est racontée.",
                sources: [
                  {
                    title: "Récit transmis par les anciens",
                    author: "Une chercheuse",
                    year: null,
                    url: null,
                    tier: "unverified",
                    source_kind: "oral_tradition",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const migrated = migratePatronymeOriginToNameHistory(input);

    expect(migrated.nameHistory?.names[0].accounts).toHaveLength(2);
    expect(migrated.nameHistory?.names[0].accounts[1].claimStatus).toBe(
      "contested"
    );
  });
});
