import { describe, expect, it } from "vitest";

import {
  readAlliances,
  isIndexableStanding,
  readDesignatedSocialUnit,
  readGaps,
  readHomonyms,
  readNisbaSubtype,
  readOrigin,
  readNameStanding,
  readPatronymeSources,
  readPermittedGivenNames,
  readSpellings,
  readTotemicFoodProhibition,
  readTransmissionMode,
} from "@/lib/patronymes/content";

describe("patronyme content readers (REQ-133)", () => {
  // @req REQ-133
  it("reads each spelling with the countries attesting it", () => {
    const forms = readSpellings({
      spellings: [
        {
          spelling: "Camara",
          attestations: [
            { countryId: "LBR", sourceRefs: ["corpus-ppl-vai-organisation"] },
            { countryId: "SLE", sourceRefs: ["corpus-ppl-vai-organisation"] },
          ],
        },
        "not an object",
      ],
    });
    expect(forms).toEqual([{ spelling: "Camara", countryIds: ["LBR", "SLE"] }]);
  });

  // @req REQ-133
  it("does not repeat a country attesting the same spelling twice", () => {
    const forms = readSpellings({
      spellings: [
        {
          spelling: "Camara",
          attestations: [
            { countryId: "MLI", sourceRefs: ["a"] },
            { countryId: "MLI", sourceRefs: ["b"] },
          ],
        },
      ],
    });
    expect(forms).toEqual([{ spelling: "Camara", countryIds: ["MLI"] }]);
  });

  // @req REQ-133
  it("reads nothing from the retired attestedForms key", () => {
    // The key the fiche read for months, which no dossier has ever written.
    expect(readSpellings({ attestedForms: [{ spelling: "Keïta" }] })).toEqual(
      []
    );
    expect(readSpellings({})).toEqual([]);
    expect(readSpellings({ spellings: "not-an-array" })).toEqual([]);
  });

  // @req REQ-133
  it("reads a non-hereditary transmission mode, written by four dossiers", () => {
    expect(readTransmissionMode({ transmissionMode: "non_hereditary" })).toBe(
      "non_hereditary"
    );
  });

  // @req REQ-133
  it("reads the gap notes an editor wrote for the fields left empty", () => {
    expect(
      readGaps({
        gaps: [
          { fieldPath: "alliances", reason: "Aucune alliance documentée." },
          { fieldPath: "bearers" },
          "not an object",
        ],
      })
    ).toEqual([
      { fieldPath: "alliances", reason: "Aucune alliance documentée." },
    ]);
  });

  // @req REQ-133
  it("reads the dossier's own sources", () => {
    expect(
      readPatronymeSources({
        sources: [
          {
            sourceKey: "corpus-ppl-vai",
            title: "Fiche PPL_VAI",
            url: null,
            tier: "referenced",
            notes: "Passage clanique.",
          },
        ],
      })
    ).toEqual([
      {
        title: "Fiche PPL_VAI",
        url: null,
        tier: "referenced",
        notes: "Passage clanique.",
      },
    ]);
  });

  // @req REQ-147
  it("reads the standing as the best tier the dossier cites", () => {
    expect(
      readNameStanding({
        sources: [
          { title: "Blog", tier: "unverified" },
          { title: "Histoire générale de l'Afrique", tier: "official" },
          { title: "Bamadaba", tier: "referenced" },
        ],
      })
    ).toEqual({ tier: "official", sourceCount: 3, aiGeneratedCount: 0 });
  });

  // @req REQ-147
  it("counts the AI-generated sources without letting them change the tier", () => {
    expect(
      readNameStanding({
        sources: [
          { title: "Bamadaba", tier: "referenced" },
          { title: "Relevé", tier: "unverified", source_kind: "ai_generated" },
          { title: "Relevé", tier: "unverified", source_kind: "ai_generated" },
        ],
      })
    ).toEqual({ tier: "referenced", sourceCount: 3, aiGeneratedCount: 2 });
  });

  // The thin-dossier case this feature has to label: one AI-written coverage
  // survey and nothing else.
  // @req REQ-147
  it("reads a lone AI-generated survey as unverified, and says so", () => {
    expect(
      readNameStanding({
        sources: [
          { title: "Relevé", tier: "unverified", source_kind: "ai_generated" },
        ],
      })
    ).toEqual({ tier: "unverified", sourceCount: 1, aiGeneratedCount: 1 });
  });

  // The one rule the sitemap and the page's robots directive share: a name is
  // offered to crawlers when a person wrote at least one readable source it
  // cites. A dossier resting only on machine-written sources is published and
  // labelled, but not offered (operator decision 2026-09-30).
  // @req REQ-147
  it("offers a name to crawlers only when at least one readable source is human-written", () => {
    const standing = (
      ...sources: { title: string; tier: string; source_kind?: string }[]
    ) => readNameStanding({ sources });
    const ai = {
      title: "Relevé",
      tier: "unverified",
      source_kind: "ai_generated",
    };

    expect(isIndexableStanding(null)).toBe(false);
    expect(isIndexableStanding(standing(ai))).toBe(false);
    expect(isIndexableStanding(standing(ai, ai))).toBe(false);
    expect(
      isIndexableStanding(standing(ai, { title: "Blog", tier: "unverified" }))
    ).toBe(true);
    expect(
      isIndexableStanding(standing({ title: "Blog", tier: "unverified" }))
    ).toBe(true);
    expect(
      isIndexableStanding(standing(ai, { title: "GHA", tier: "official" }))
    ).toBe(true);
  });

  // @req REQ-147
  it("reports no standing when the dossier cites nothing readable", () => {
    expect(readNameStanding({})).toBeNull();
    expect(readNameStanding({ sources: [] })).toBeNull();
    expect(readNameStanding({ sources: ["not an object"] })).toBeNull();
  });

  // An unrecognised provenance is not the AI one. `readSource` already floors
  // an unknown tier at unverified; the marker has no such floor to fall to,
  // and claiming it would mark a fiche the corpus never marked.
  // @req REQ-147
  it("does not mark a provenance the vocabulary does not carry", () => {
    expect(
      readNameStanding({
        sources: [{ title: "X", tier: "referenced", source_kind: "invented" }],
      })
    ).toEqual({ tier: "referenced", sourceCount: 1, aiGeneratedCount: 0 });
  });

  // @req REQ-133
  it("reads alliances by their attested term", () => {
    expect(
      readAlliances({
        alliances: [
          { targetPatronymeId: "PAT_TRAORE", allianceType: "sanankuya" },
          { allianceType: "orphaned" },
        ],
      })
    ).toEqual([{ targetPatronymeId: "PAT_TRAORE", allianceType: "sanankuya" }]);
  });

  // @req REQ-133
  it("reads homonyms with what distinguishes them", () => {
    expect(
      readHomonyms({
        homonyms: [
          {
            label: "Bambara",
            entityType: "people",
            distinction: "Peuple mandé, sans lien étymologique démontré.",
          },
        ],
      })
    ).toEqual([
      {
        label: "Bambara",
        entityType: "people",
        distinction: "Peuple mandé, sans lien étymologique démontré.",
      },
    ]);
  });

  // @req REQ-133
  it("reads a known transmission mode", () => {
    expect(readTransmissionMode({ transmissionMode: "patrilineal" })).toBe(
      "patrilineal"
    );
  });

  // @req REQ-133
  it("returns null for an unrecognised or absent transmission mode", () => {
    expect(readTransmissionMode({ transmissionMode: "unknown-value" })).toBe(
      null
    );
    expect(readTransmissionMode({})).toBe(null);
  });

  // @req REQ-133
  it("reads a known designated social unit", () => {
    expect(readDesignatedSocialUnit({ designatedSocialUnit: "lineage" })).toBe(
      "lineage"
    );
  });

  // @req REQ-133
  it("returns null for an unrecognised designated social unit", () => {
    expect(readDesignatedSocialUnit({ designatedSocialUnit: "nope" })).toBe(
      null
    );
  });

  // @req REQ-133
  it("reads the three origin strands the corpus actually writes", () => {
    const origin = readOrigin({
      origin: {
        oralTraditions: [
          {
            claim: "Le nom vient du Mandé.",
            claimStatus: "contested",
            griot: "Fadama Diarra",
            transcription: "Monteil 1962, p. 44",
          },
        ],
        writtenChronicles: [{ claim: "Cité dans la Charte du Manden." }],
        linguisticReconstructions: [],
      },
    });

    expect(origin.oralTraditions).toEqual([
      {
        claim: "Le nom vient du Mandé.",
        claimStatus: "contested",
        griot: "Fadama Diarra",
        transcription: "Monteil 1962, p. 44",
        carrier: null,
        collection: null,
        collector: null,
        context: null,
      },
    ]);
    expect(origin.writtenChronicles).toEqual([
      {
        claim: "Cité dans la Charte du Manden.",
        claimStatus: null,
        griot: null,
        transcription: null,
        carrier: null,
        collection: null,
        collector: null,
        context: null,
      },
    ]);
    expect(origin.linguisticReconstructions).toEqual([]);
  });

  // An account with no griot and no transcript must come through exactly as
  // recorded: nothing is invented to fill the shape (audit finding C10).
  // @req REQ-133
  it("reads an oral account by its carrier and collection without inventing a griot or a transcript", () => {
    const origin = readOrigin({
      origin: {
        oralTraditions: [
          {
            claim: "Un récit transmis relie ce nom à une lignée.",
            claimStatus: "claimed",
            carrier: "Une aînée de la famille, nom tenu à sa demande",
            collection: "mediated",
            collector: "Un enseignant qui l'a recueillie",
            context: "Récit transmis en dioula, à Bobo-Dioulasso",
          },
        ],
      },
    });

    expect(origin.oralTraditions).toEqual([
      {
        claim: "Un récit transmis relie ce nom à une lignée.",
        claimStatus: "claimed",
        griot: null,
        transcription: null,
        carrier: "Une aînée de la famille, nom tenu à sa demande",
        collection: "mediated",
        collector: "Un enseignant qui l'a recueillie",
        context: "Récit transmis en dioula, à Bobo-Dioulasso",
      },
    ]);
  });

  // @req REQ-133
  it("ignores a collection mode outside the three the record can state", () => {
    const [account] = readOrigin({
      origin: { oralTraditions: [{ claim: "X.", collection: "on tape" }] },
    }).oralTraditions;

    expect(account.collection).toBeNull();
  });

  // @req REQ-133
  it("keeps an oral tradition and a written chronicle side by side", () => {
    const origin = readOrigin({
      origin: {
        oralTraditions: [{ claim: "Version griotique." }],
        writtenChronicles: [{ claim: "Version chroniquée." }],
      },
    });

    // Two testimonies about one name, neither overruling the other — the
    // reason the corpus writes three lists rather than one classification.
    expect(origin.oralTraditions).toHaveLength(1);
    expect(origin.writtenChronicles).toHaveLength(1);
  });

  // @req REQ-133
  it("returns four empty strands rather than null when origin is absent", () => {
    expect(readOrigin({})).toEqual({
      oralTraditions: [],
      writtenChronicles: [],
      historicalSyntheses: [],
      linguisticReconstructions: [],
    });
    // The shape the reader used to require, which no dossier has ever had.
    expect(
      readOrigin({ origin: { originType: "griot_oral_tradition" } })
    ).toEqual({
      oralTraditions: [],
      writtenChronicles: [],
      historicalSyntheses: [],
      linguisticReconstructions: [],
    });
  });

  // @req REQ-133
  it("reads a historical synthesis as its own strand", () => {
    const origin = readOrigin({
      origin: {
        historicalSyntheses: [
          {
            claim: "Une synthèse situe la migration au XVIe siècle.",
            claimStatus: "contested",
          },
        ],
      },
    });

    expect(origin.historicalSyntheses).toHaveLength(1);
    expect(origin.historicalSyntheses[0]).toMatchObject({
      claim: "Une synthèse situe la migration au XVIe siècle.",
      claimStatus: "contested",
    });
    expect(origin.linguisticReconstructions).toEqual([]);
  });

  // @req REQ-133
  it("reads the totemic-clan subtype fields", () => {
    expect(
      readTotemicFoodProhibition({ totemicFoodProhibition: "Hyène" })
    ).toBe("Hyène");
    expect(
      readPermittedGivenNames({ permittedGivenNames: ["Aissata", "Boubou"] })
    ).toEqual(["Aissata", "Boubou"]);
  });

  // @req REQ-133
  it("returns empty/null for absent totemic-clan fields", () => {
    expect(readTotemicFoodProhibition({})).toBe(null);
    expect(readPermittedGivenNames({})).toEqual([]);
  });

  // @req REQ-133
  it("reads the nisba subtype", () => {
    expect(readNisbaSubtype({ nisbaSubtype: "geographic" })).toBe("geographic");
  });

  // @req REQ-133
  it("returns null for an unrecognised nisba subtype", () => {
    expect(readNisbaSubtype({ nisbaSubtype: "invented" })).toBe(null);
  });

  // @req REQ-133
  it("reads a claimed filiation as an origin strand, where the corpus puts it", () => {
    // There is no `filiationClaims` reader any more: the key it read appears
    // in no model, no parser and no dossier, so the section that depended on
    // it could never render. A contested descent claim is an oral tradition
    // with a claimStatus, which is where the corpus has always written it.
    const origin = readOrigin({
      origin: {
        oralTraditions: [
          {
            claim: "Descendance de Soundiata Keïta",
            claimStatus: "contested",
          },
        ],
      },
    });

    expect(origin.oralTraditions[0]).toMatchObject({
      claim: "Descendance de Soundiata Keïta",
      claimStatus: "contested",
    });
  });
});
