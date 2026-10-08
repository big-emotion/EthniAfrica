import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type LanguageDossier = {
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
    vehicularRole: string;
    dialects: string[];
    vitalityStatus: { status: string; scale: string; asOf: number };
    sources: Array<{ url: string | null; tier: string }>;
  };
};

const projectRoot = process.cwd();
const expected = {
  lub: {
    glottocode: "luba1250",
    nameFr: "Kiluba (luba-katanga)",
    nameEn: "Luba-Katanga",
    alternateNames: ["Kiluba", "Luba-Shaba"],
    familyId: "FLG_BANTU",
    role: "non_vehicular",
    vitality: "Threatened",
    peopleLinks: [
      { name: "Luba", peopleId: "PPL_LUBA" },
      { name: "Luba-Katanga", peopleId: "PPL_LUBA_KATANGA" },
    ],
  },
  tll: {
    glottocode: "tete1250",
    nameFr: "Otetela",
    nameEn: "Tetela",
    alternateNames: ["Kitetela", "Sungu"],
    familyId: "FLG_BANTU",
    role: "non_vehicular",
    vitality: "Vigorous",
    peopleLinks: [{ name: "Tetela", peopleId: "PPL_TETELA" }],
  },
  alz: {
    glottocode: "alur1250",
    nameFr: "Alur",
    nameEn: "Alur",
    alternateNames: ["Dho Alur", "Aloro"],
    familyId: "FLG_NILOTIQUE",
    role: "non_vehicular",
    vitality: "Developing",
    peopleLinks: [{ name: "Alur", peopleId: "PPL_ALUR" }],
  },
} as const;

function readDossier(id: keyof typeof expected): LanguageDossier | null {
  const path = resolve(projectRoot, `dataset/source/afrik/langues/${id}.json`);
  return existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as LanguageDossier)
    : null;
}

describe("DRC evidence-prioritized language dossier wave 2", () => {
  // @req REQ-136
  it.each(Object.keys(expected) as Array<keyof typeof expected>)(
    "creates the exact %s dossier with conservative language metadata",
    (id) => {
      const dossier = readDossier(id);
      const record = expected[id];

      expect(dossier).not.toBeNull();
      expect(dossier).toMatchObject({
        id,
        isoCode639_3: id,
        glottocode: record.glottocode,
        nameFr: record.nameFr,
        nameEn: record.nameEn,
        alternateNames: record.alternateNames,
        spellingAliases: [],
        familyId: record.familyId,
        peoples: record.peopleLinks,
        content: {
          vehicularRole: record.role,
          dialects: [],
          vitalityStatus: {
            status: record.vitality,
            scale: "EGIDS (Ethnologue)",
            asOf: 2025,
          },
        },
      });
    }
  );

  // @req REQ-136
  it.each(Object.keys(expected) as Array<keyof typeof expected>)(
    "cites the exact official Glottolog record for %s",
    (id) => {
      expect(readDossier(id)?.content.sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: `https://glottolog.org/resource/languoid/id/${expected[id].glottocode}`,
            tier: "official",
          }),
        ])
      );
    }
  );
});
