// @req REQ-193
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { checkPlaceFicheModel } from "../validateAfrikData";

const REAL_DATASET = join(__dirname, "..", "..", "dataset", "source", "afrik");

function source(overrides: Record<string, unknown> = {}) {
  return {
    title: "Histoire de la commune",
    author: "Mairie de Yamoussoukro",
    year: null,
    url: "https://example.org/historique",
    tier: "referenced",
    ...overrides,
  };
}

function historySource(overrides: Record<string, unknown> = {}) {
  return { ...source(), source_kind: "government", ...overrides };
}

function validPlace(overrides: Record<string, unknown> = {}) {
  return {
    _meta: { format: "AFRIK JSON v2", entity: "lieu" },
    id: "LOC_TEST",
    placeType: "ville",
    nameMain: "Testkro",
    countryId: "CIV",
    associatedPeoples: [{ peopleId: "PPL_A" }],
    summary: "Une ville de test.",
    gaps: [],
    sources: [source()],
    nameHistory: {
      summary: "Le nom Testkro est le nom actuel de ce lieu.",
      names: [
        {
          nameText: "Testkro",
          nameStatus: "current",
          selfGiven: true,
          languageOfOrigin: "bci",
          namedBy: null,
          accounts: [
            {
              period: { from: null, to: null, label: "contemporain" },
              statement: "Le nom Testkro signifie le village de Test.",
              aspect: "meaning",
              sources: [historySource()],
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

// The first account of the first name: the one the source tests vary.
function firstAccount(place: Record<string, unknown>) {
  const history = place.nameHistory as {
    names: Array<{ accounts: Array<Record<string, unknown>> }>;
  };
  return history.names[0].accounts[0];
}

describe("place fiche validator (REQ-193)", () => {
  let tmpDir: string;

  function writePlace(fileName: string, place: Record<string, unknown>) {
    const dir = join(tmpDir, "lieux");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, fileName), JSON.stringify(place));
  }

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_loc_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(join(tmpDir, "pays"), { recursive: true });
    writeFileSync(
      join(tmpDir, "pays", "CIV.json"),
      JSON.stringify({ id: "CIV" })
    );
    mkdirSync(join(tmpDir, "peuples", "FLG_TEST"), { recursive: true });
    writeFileSync(
      join(tmpDir, "peuples", "FLG_TEST", "PPL_A.json"),
      JSON.stringify({ id: "PPL_A" })
    );
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  // @req REQ-193
  it("passes when the corpus has no place directory yet", () => {
    expect(checkPlaceFicheModel(tmpDir).ok).toBe(true);
  });

  // @req REQ-193
  it("passes a fiche that follows the model and points at fiches that exist", () => {
    writePlace("LOC_TEST.json", validPlace());
    const result = checkPlaceFicheModel(tmpDir);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  // @req REQ-193
  it("fails when the country it points at has no fiche, naming file and id", () => {
    writePlace("LOC_TEST.json", validPlace({ countryId: "XXX" }));
    const result = checkPlaceFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/LOC_TEST\.json.*XXX/);
  });

  // @req REQ-193
  it("fails when an associated people has no fiche, naming file and id", () => {
    writePlace(
      "LOC_TEST.json",
      validPlace({ associatedPeoples: [{ peopleId: "PPL_GHOST" }] })
    );
    const result = checkPlaceFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/LOC_TEST\.json.*PPL_GHOST/);
  });

  // @req REQ-193
  it("fails when the filename differs from the id", () => {
    writePlace("LOC_OTHER.json", validPlace());
    const result = checkPlaceFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/LOC_TEST\.json/);
  });

  // @req REQ-193
  it("fails when the id is not in the LOC_ namespace", () => {
    writePlace("PPL_TEST.json", validPlace({ id: "PPL_TEST" }));
    expect(checkPlaceFicheModel(tmpDir).ok).toBe(false);
  });

  // @req REQ-196
  it("fails when an account of a name cites no source", () => {
    const place = validPlace();
    firstAccount(place).sources = [];
    writePlace("LOC_TEST.json", place);
    expect(checkPlaceFicheModel(tmpDir).ok).toBe(false);
  });

  // @req REQ-196
  it("fails when a source declares no tier", () => {
    const place = validPlace();
    firstAccount(place).sources = [historySource({ tier: undefined })];
    writePlace("LOC_TEST.json", place);
    expect(checkPlaceFicheModel(tmpDir).ok).toBe(false);
  });

  // @req REQ-196
  it("passes a name sourced only at unverified, with a warning naming it", () => {
    const place = validPlace();
    firstAccount(place).sources = [historySource({ tier: "unverified" })];
    writePlace("LOC_TEST.json", place);
    const result = checkPlaceFicheModel(tmpDir);
    expect(result.ok).toBe(true);
    expect(result.warnings.join("\n")).toMatch(/LOC_TEST\.json.*Testkro/);
  });

  // @req REQ-196
  it("fails when the place carries no nameHistory: its names live nowhere else", () => {
    writePlace("LOC_TEST.json", validPlace({ nameHistory: undefined }));
    const result = checkPlaceFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/LOC_TEST\.json.*nameHistory/);
  });

  // DEC-071: a legacy block beside nameHistory would be a second, drifting
  // source of truth for the same names.
  // @req REQ-196
  it.each(["names", "accounts", "attestations"])(
    "refuses a place that still carries the legacy %s key, naming it",
    (legacyKey) => {
      writePlace("LOC_TEST.json", validPlace({ [legacyKey]: [] }));
      const result = checkPlaceFicheModel(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.join("\n")).toMatch(
        new RegExp(`LOC_TEST\\.json.*${legacyKey}`)
      );
    }
  );

  // @req REQ-193
  it("passes on the corpus as committed", () => {
    const result = checkPlaceFicheModel(REAL_DATASET);
    expect(result.errors).toEqual([]);
  });
});
