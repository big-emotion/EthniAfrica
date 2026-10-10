import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  checkNameHistoryBlocks,
  checkWordFicheModel,
} from "../validateAfrikData";

function nameHistory(overrides: Record<string, unknown> = {}) {
  return {
    summary:
      "Le nom racisme est récent ; ses origines sont présentées plus bas.",
    names: [
      {
        nameText: "racisme",
        nameStatus: "current",
        selfGiven: false,
        languageOfOrigin: "fra",
        namedBy: null,
        accounts: [
          {
            period: { from: 1900, to: 1910, label: "Début du XXe siècle" },
            statement:
              "Le mot racisme apparaît en français au début du XXe siècle.",
            birth: true,
            sources: [
              {
                title: "Dictionnaire historique de la langue française",
                author: "Alain Rey",
                year: 1992,
                url: null,
                tier: "referenced",
                source_kind: "linguistic_reference",
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function validWord(overrides: Record<string, unknown> = {}) {
  return {
    _meta: { format: "AFRIK JSON v2", entity: "mot" },
    id: "WRD_TEST",
    nameMain: "racisme",
    wordLanguage: "fra",
    definition:
      "Un mot dont l'histoire éclaire la façon dont l'Afrique a été nommée.",
    relatedSubjects: [
      {
        id: "PPL_A",
        relation: "Un peuple dont le nom porte la trace de ce mot.",
      },
    ],
    nameHistory: nameHistory(),
    gaps: [],
    sources: [],
    ...overrides,
  };
}

describe("word fiche validator (REQ-196)", () => {
  let tmpDir: string;

  function writeWord(fileName: string, word: Record<string, unknown>) {
    const dir = join(tmpDir, "mots");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, fileName), JSON.stringify(word));
  }

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_wrd_${Date.now()}_${Math.random().toString(36).slice(2)}`
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

  // @req REQ-196
  it("passes when the corpus has no word directory yet", () => {
    expect(checkWordFicheModel(tmpDir).ok).toBe(true);
  });

  // @req REQ-196
  it("passes a word fiche that follows the model and points at fiches that exist", () => {
    writeWord("WRD_TEST.json", validWord());
    const result = checkWordFicheModel(tmpDir);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  // A word fiche exists only to tell the history of the word: without the
  // block it says nothing, so here — unlike the other classes — it is required.
  // @req REQ-196
  it("fails a word fiche with no nameHistory, naming the file", () => {
    const word = validWord();
    delete (word as Record<string, unknown>).nameHistory;
    writeWord("WRD_TEST.json", word);
    const result = checkWordFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/WRD_TEST\.json.*nameHistory/);
  });

  // @req REQ-196
  it("fails when the file name does not match the id", () => {
    writeWord("WRD_OTHER.json", validWord());
    const result = checkWordFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/WRD_OTHER\.json.*WRD_TEST\.json/);
  });

  // @req REQ-196
  it("fails when the id does not start with WRD_", () => {
    writeWord("RACISME.json", validWord({ id: "RACISME" }));
    expect(checkWordFicheModel(tmpDir).ok).toBe(false);
  });

  // @req REQ-196
  it("fails when a related subject has no fiche, naming file and id", () => {
    writeWord(
      "WRD_TEST.json",
      validWord({ relatedSubjects: [{ id: "PPL_GHOST", relation: "x" }] })
    );
    const result = checkWordFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/WRD_TEST\.json.*PPL_GHOST/);
  });

  // @req REQ-196
  it("fails on a top-level key the model does not declare", () => {
    writeWord("WRD_TEST.json", validWord({ etymology: "Du latin…" }));
    const result = checkWordFicheModel(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/etymology/);
  });

  // @req REQ-196
  it("holds a word's nameHistory to the shared schema", () => {
    const twoBirths = nameHistory();
    const account = (twoBirths.names as Array<{ accounts: unknown[] }>)[0]
      .accounts[0];
    (twoBirths.names as Array<{ accounts: unknown[] }>)[0].accounts.push(
      account
    );
    writeWord("WRD_TEST.json", validWord({ nameHistory: twoBirths }));
    expect(checkNameHistoryBlocks(tmpDir).ok).toBe(false);
  });

  // @req REQ-196
  it("ships a model whose keys are the ones the validator accepts", () => {
    const model = JSON.parse(
      readFileSync(
        join(__dirname, "..", "..", "public", "modele-mot.json"),
        "utf-8"
      )
    );
    expect(Object.keys(model).sort()).toEqual(Object.keys(validWord()).sort());
  });
});
