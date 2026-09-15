import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import {
  checkStrictModelKeys,
  checkCountryFamilyReferences,
  checkCountryPeopleMembership,
} from "../validateAfrikData";

/**
 * The people, family and country fiches are the three kinds the validator
 * never held to their strict models, and the drift the audit of 2026-09-14
 * measured (every people fiche, every family fiche, 13 countries) is an
 * editorial program, not a code fix. So the gate is a two-way ratchet: a new
 * drifting key fails, and so does a burn-down nobody recorded.
 */

function writeJson(root: string, relative: string, value: unknown) {
  const full = join(root, relative);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, JSON.stringify(value));
}

function writeModels(modelsRoot: string) {
  writeJson(modelsRoot, "modele-peuple.json", {
    _meta: {},
    id: "PPL_XXXXX",
    currentCountries: [],
    content: { appellations: { mainName: "", exonyms: [] }, sources: [] },
  });
  writeJson(modelsRoot, "modele-linguistique.json", {
    _meta: {},
    id: "FLG_XXXXX",
    content: {
      decolonialHeader: { currentName: "", totalSpeakers: "" },
      sources: [],
    },
  });
  writeJson(modelsRoot, "modele-pays.json", {
    _meta: {},
    id: "XXX",
    content: { culture: { mainLanguages: [], religions: [] }, sources: [] },
  });
}

const conformingPeople = (id: string, currentCountries: string[] = []) => ({
  id,
  currentCountries,
  content: { appellations: { mainName: "X", exonyms: [] }, sources: [] },
});

const conformingCountry = (
  id: string,
  content: Record<string, unknown> = {}
) => ({
  id,
  content: {
    culture: { mainLanguages: [], religions: [] },
    sources: [],
    ...content,
  },
});

describe("validateAfrikData – structural gates on people, family and country fiches", () => {
  let tmpDir: string;
  let datasetRoot: string;
  let modelsRoot: string;

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    datasetRoot = join(tmpDir, "afrik");
    modelsRoot = join(tmpDir, "public");
    mkdirSync(datasetRoot, { recursive: true });
    writeModels(modelsRoot);
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("checkStrictModelKeys", () => {
    // @req REQ-136
    it("passes a conforming people fiche at a zero ceiling, ignoring _meta and _translation", () => {
      writeJson(datasetRoot, "peuples/FLG_BANTU/PPL_ZULU.json", {
        ...conformingPeople("PPL_ZULU"),
        _translation: { deferred: { en: "later" } },
      });

      expect(
        checkStrictModelKeys(datasetRoot, modelsRoot, "peuple", 0)
      ).toMatchObject({ ok: true, errors: [] });
    });

    // @req REQ-136
    it("counts extra keys nested in content.appellations and fails above the ceiling", () => {
      const fiche = conformingPeople("PPL_ZULU");
      (fiche.content.appellations as Record<string, unknown>).linguisticFamily =
        "Bantu";
      writeJson(datasetRoot, "peuples/FLG_BANTU/PPL_ZULU.json", fiche);

      const result = checkStrictModelKeys(datasetRoot, modelsRoot, "peuple", 0);

      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining(
          "peuple strict-model drift rose to 1 (ceiling 0)"
        )
      );
      expect(result.errors).toContainEqual(
        expect.stringMatching(
          /content\.appellations: unexpected key "linguisticFamily" in 1 fiche/
        )
      );
    });

    // @req REQ-136
    it("counts top-level and content-level key drift", () => {
      writeJson(datasetRoot, "peuples/FLG_BANTU/PPL_ZULU.json", {
        id: "PPL_ZULU",
        content: {
          appellations: { mainName: "X", exonyms: [] },
          additionalNotes: "",
        },
      });

      const result = checkStrictModelKeys(datasetRoot, modelsRoot, "peuple", 0);

      expect(result.errors).toContainEqual(
        expect.stringContaining("peuple strict-model drift rose to 3")
      );
      expect(result.errors).toContainEqual(
        expect.stringMatching(/top level: missing key "currentCountries"/)
      );
      expect(result.errors).toContainEqual(
        expect.stringMatching(/content: missing key "sources"/)
      );
      expect(result.errors).toContainEqual(
        expect.stringMatching(/content: unexpected key "additionalNotes"/)
      );
    });

    // @req REQ-136
    it("fails below the ceiling and names the line to change", () => {
      writeJson(
        datasetRoot,
        "peuples/FLG_BANTU/PPL_ZULU.json",
        conformingPeople("PPL_ZULU")
      );

      const result = checkStrictModelKeys(datasetRoot, modelsRoot, "peuple", 2);

      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining(
          "lower STRICT_MODEL_DRIFT_CEILINGS.peuple to 0 in the same change"
        )
      );
    });

    // @req REQ-136
    it("holds family fiches to modele-linguistique.json, decolonialHeader included", () => {
      writeJson(datasetRoot, "famille_linguistique/FLG_BANTU.json", {
        id: "FLG_BANTU",
        content: { decolonialHeader: { currentName: "Bantu" }, sources: [] },
      });

      expect(
        checkStrictModelKeys(datasetRoot, modelsRoot, "famille_linguistique", 1)
      ).toMatchObject({ ok: true, errors: [] });

      const result = checkStrictModelKeys(
        datasetRoot,
        modelsRoot,
        "famille_linguistique",
        0
      );
      expect(result.errors).toContainEqual(
        expect.stringMatching(
          /content\.decolonialHeader: missing key "totalSpeakers" in 1 fiche/
        )
      );
    });

    // @req REQ-136
    it("holds country fiches to modele-pays.json, culture.mainLanguages included", () => {
      writeJson(datasetRoot, "pays/NGA.json", {
        id: "NGA",
        content: { culture: { religions: [] }, sources: [] },
      });

      const result = checkStrictModelKeys(datasetRoot, modelsRoot, "pays", 0);

      expect(result.errors).toContainEqual(
        expect.stringMatching(
          /content\.culture: missing key "mainLanguages" in 1 fiche/
        )
      );
    });
  });

  describe("checkCountryFamilyReferences", () => {
    // @req REQ-149
    it("fails when a country names a family that has no fiche, in either people list", () => {
      writeJson(datasetRoot, "famille_linguistique/FLG_SAHARIEN.json", {
        id: "FLG_SAHARIEN",
      });
      writeJson(
        datasetRoot,
        "pays/NGA.json",
        conformingCountry("NGA", {
          majorPeoples: [
            { peopleId: "PPL_KANURI", languageFamily: "FLG_SAHARIENNE" },
          ],
          demographics: {
            peoples: [
              { peopleId: "PPL_KANURI", languageFamily: "FLG_SAHARIEN" },
            ],
          },
        })
      );

      const result = checkCountryFamilyReferences(datasetRoot);

      expect(result.ok).toBe(false);
      expect(result.errors).toEqual([
        expect.stringMatching(
          /pays\/NGA\.json: content\.majorPeoples\[0\]\.languageFamily names FLG_SAHARIENNE \(PPL_KANURI\)/
        ),
      ]);
    });

    // @req REQ-149
    it("passes resolving families and tolerates a people with no declared family", () => {
      writeJson(datasetRoot, "famille_linguistique/FLG_SAHARIEN.json", {
        id: "FLG_SAHARIEN",
      });
      writeJson(
        datasetRoot,
        "pays/NGA.json",
        conformingCountry("NGA", {
          majorPeoples: [
            { peopleId: "PPL_KANURI", languageFamily: "FLG_SAHARIEN" },
            { peopleId: "PPL_AUTRES", languageFamily: null },
          ],
        })
      );

      expect(checkCountryFamilyReferences(datasetRoot)).toMatchObject({
        ok: true,
        errors: [],
      });
    });
  });

  describe("checkCountryPeopleMembership", () => {
    const listing = (peopleId: string) =>
      conformingCountry("BEN", {
        majorPeoples: [{ peopleId }],
        demographics: { peoples: [{ peopleId }] },
      });

    // @req REQ-149
    it("counts a country listing a people whose currentCountries omits it once, and passes at the ceiling", () => {
      writeJson(
        datasetRoot,
        "peuples/FLG_ATLANTIQUE/PPL_FULA.json",
        conformingPeople("PPL_FULA", ["SEN"])
      );
      writeJson(datasetRoot, "pays/BEN.json", listing("PPL_FULA"));

      expect(checkCountryPeopleMembership(datasetRoot, 1)).toMatchObject({
        ok: true,
        errors: [],
      });
    });

    // @req REQ-149
    it("fails above the ceiling and names the country and the people", () => {
      writeJson(
        datasetRoot,
        "peuples/FLG_ATLANTIQUE/PPL_FULA.json",
        conformingPeople("PPL_FULA", ["SEN"])
      );
      writeJson(datasetRoot, "pays/BEN.json", listing("PPL_FULA"));

      const result = checkCountryPeopleMembership(datasetRoot, 0);

      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("rose to 1 (ceiling 0)")
      );
      expect(result.errors).toContainEqual(
        expect.stringMatching(/pays\/BEN\.json lists PPL_FULA/)
      );
    });

    // @req REQ-149
    it("fails below the ceiling and names the line to change", () => {
      writeJson(
        datasetRoot,
        "peuples/FLG_ATLANTIQUE/PPL_FULA.json",
        conformingPeople("PPL_FULA", ["SEN", "BEN"])
      );
      writeJson(datasetRoot, "pays/BEN.json", listing("PPL_FULA"));

      const result = checkCountryPeopleMembership(datasetRoot, 1);

      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining(
          "lower COUNTRY_PEOPLE_MEMBERSHIP_CEILING to 0 in the same change"
        )
      );
    });
  });
});
