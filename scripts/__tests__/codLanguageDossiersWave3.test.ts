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
  familyId: string;
  peoples: Array<{ name: string; peopleId: string }>;
  content: {
    vehicularRole: string;
    vitalityStatus: { status: string; scale: string; asOf: number };
    sources: Array<{ url: string | null; tier: string }>;
  };
  _translation?: { deferred?: { en?: string } };
};

const projectRoot = process.cwd();
const deferralReason =
  "English translation is deferred until the French DRC country enrichment pass is stable.";
const expected = {
  hav: {
    glottocode: "havu1238",
    nameFr: "Havu (kihavu)",
    nameEn: "Havu",
    alternateNames: ["Haavu", "Kihavu"],
    vitality: "Vigorous",
    people: { name: "Havu", peopleId: "PPL_HAVU" },
  },
  hke: {
    glottocode: "hund1239",
    nameFr: "Hunde (kihunde)",
    nameEn: "Hunde",
    alternateNames: ["Kihunde", "Kobi", "Rukobi"],
    vitality: "Vigorous",
    people: { name: "Hunde", peopleId: "PPL_HUNDE" },
  },
  nnb: {
    glottocode: "nand1264",
    nameFr: "Nande (kinande)",
    nameEn: "Nande",
    alternateNames: ["Kinande", "Kinandi", "Orundande"],
    vitality: "Developing",
    people: { name: "Nande", peopleId: "PPL_NANDE" },
  },
} as const;

function readDossier(id: keyof typeof expected): LanguageDossier | null {
  const file = resolve(projectRoot, `dataset/source/afrik/langues/${id}.json`);
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, "utf8")) as LanguageDossier)
    : null;
}

describe("DRC evidence-prioritized language dossier wave 3", () => {
  // @req REQ-136
  it.each(Object.keys(expected) as Array<keyof typeof expected>)(
    "creates the conservative %s language dossier",
    (id) => {
      const record = expected[id];
      expect(readDossier(id)).toMatchObject({
        id,
        isoCode639_3: id,
        glottocode: record.glottocode,
        nameFr: record.nameFr,
        nameEn: record.nameEn,
        alternateNames: record.alternateNames,
        spellingAliases: [],
        familyId: "FLG_BANTU",
        peoples: [record.people],
        content: {
          vehicularRole: "non_vehicular",
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
    "cites the exact Glottolog record for %s",
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

  // @req REQ-145
  it.each(Object.keys(expected) as Array<keyof typeof expected>)(
    "records the temporary English translation deferral for %s",
    (id) => {
      expect(readDossier(id)?._translation?.deferred?.en).toBe(deferralReason);
    }
  );
});
