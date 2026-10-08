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

function validPlace(overrides: Record<string, unknown> = {}) {
  return {
    _meta: { format: "AFRIK JSON v2", entity: "lieu" },
    id: "LOC_TEST",
    placeType: "ville",
    nameMain: "Testkro",
    countryId: "CIV",
    associatedPeoples: [{ peopleId: "PPL_A" }],
    summary: "Une ville de test.",
    names: [
      {
        nameText: "Testkro",
        nameStatus: "current",
        languageOfOrigin: "bci",
        meaning: "Le village de Test.",
        shortLine: "Le village de Test.",
        namedBy: null,
        originDebated: false,
        periodLabel: "contemporain",
        contemporaryUsage: null,
        accounts: [],
        attestations: [],
        sources: [source()],
      },
    ],
    gaps: [],
    sources: [source()],
    ...overrides,
  };
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

  // @req REQ-193
  it("fails when a form cites no source", () => {
    const place = validPlace();
    (place.names as Array<Record<string, unknown>>)[0].sources = [];
    writePlace("LOC_TEST.json", place);
    expect(checkPlaceFicheModel(tmpDir).ok).toBe(false);
  });

  // @req REQ-193
  it("fails when a source declares no tier", () => {
    const place = validPlace();
    (place.names as Array<Record<string, unknown>>)[0].sources = [
      source({ tier: undefined }),
    ];
    writePlace("LOC_TEST.json", place);
    expect(checkPlaceFicheModel(tmpDir).ok).toBe(false);
  });

  // @req REQ-193
  it("passes a form sourced only at unverified, with a warning naming it", () => {
    const place = validPlace();
    (place.names as Array<Record<string, unknown>>)[0].sources = [
      source({ tier: "unverified" }),
    ];
    writePlace("LOC_TEST.json", place);
    const result = checkPlaceFicheModel(tmpDir);
    expect(result.ok).toBe(true);
    expect(result.warnings.join("\n")).toMatch(/LOC_TEST\.json.*Testkro/);
  });

  // @req REQ-193
  it("keeps every account of a form attributed to its own sources", () => {
    const place = validPlace();
    (place.names as Array<Record<string, unknown>>)[0].accounts = [
      { statement: "Un récit sans source.", periodLabel: "1904", sources: [] },
    ];
    writePlace("LOC_TEST.json", place);
    expect(checkPlaceFicheModel(tmpDir).ok).toBe(false);
  });

  // @req REQ-193
  it("passes on the corpus as committed", () => {
    const result = checkPlaceFicheModel(REAL_DATASET);
    expect(result.errors).toEqual([]);
  });
});
