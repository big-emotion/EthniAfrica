import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

interface LanguageDossier {
  id: string;
  isoCode639_3: string;
  glottocode: string;
  nameFr: string;
  nameEn: string;
  alternateNames: string[];
  spellingAliases: string[];
  familyId: string;
  peoples: Array<{ name: string; peopleId: string }>;
  content: {
    vehicularRole: string | null;
    dialects: string[];
    vitalityStatus: {
      status: string;
      scale: string;
      asOf: number;
    } | null;
    sources: Array<{
      title: string;
      url: string | null;
      tier: string;
      notes: string;
    }>;
  };
}

const projectRoot = process.cwd();
const dossierIds = ["ktu", "swc", "lua"] as const;
const expected = {
  ktu: {
    glottocode: "kitu1246",
    nameFr: "Kituba de la République démocratique du Congo",
    nameEn: "Kituba (Democratic Republic of Congo)",
    sourceUrl: "https://glottolog.org/resource/languoid/id/kitu1246",
  },
  swc: {
    glottocode: "cong1236",
    nameFr: "Swahili du Congo",
    nameEn: "Congo Swahili",
    sourceUrl: "https://glottolog.org/resource/languoid/id/cong1236",
  },
  lua: {
    glottocode: "luba1249",
    nameFr: "Tshiluba",
    nameEn: "Luba-Lulua",
    sourceUrl: "https://glottolog.org/resource/languoid/id/luba1249",
  },
} as const;

function dossierPath(id: string): string {
  return resolve(projectRoot, `dataset/source/afrik/langues/${id}.json`);
}

function readDossier(id: string): LanguageDossier | null {
  const path = dossierPath(id);
  return existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as LanguageDossier)
    : null;
}

describe("DRC national-language dossier wave", () => {
  // @req REQ-136
  it.each(dossierIds)("creates a strict %s language dossier", (id) => {
    const dossier = readDossier(id);

    expect(dossier).not.toBeNull();
    expect(dossier).toMatchObject({
      id,
      isoCode639_3: id,
      glottocode: expected[id].glottocode,
      nameFr: expected[id].nameFr,
      nameEn: expected[id].nameEn,
      familyId: "FLG_BANTU",
      content: {
        vehicularRole: "regional_lingua_franca",
        vitalityStatus: {
          status: "Wider communication",
          scale: "EGIDS (Ethnologue)",
          asOf: 2025,
        },
      },
    });
  });

  // @req REQ-136
  it.each(dossierIds)("cites the exact Glottolog record for %s", (id) => {
    const dossier = readDossier(id);

    expect(dossier?.content.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: expected[id].sourceUrl,
          tier: "official",
        }),
      ])
    );
  });

  // @req REQ-136
  it("links Tshiluba only to the reviewed people-code signals", () => {
    expect(readDossier("lua")?.peoples).toEqual([
      { name: "Luba", peopleId: "PPL_LUBA" },
      { name: "Luba-Kasaï", peopleId: "PPL_LUBA_KASAI" },
      { name: "Lulua", peopleId: "PPL_LULUA" },
    ]);
    expect(readDossier("ktu")?.peoples).toEqual([]);
    expect(readDossier("swc")?.peoples).toEqual([]);
  });
});
