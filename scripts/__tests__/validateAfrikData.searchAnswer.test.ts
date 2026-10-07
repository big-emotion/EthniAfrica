import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { checkSearchAnswerFields } from "../validateAfrikData";

const OFFICIAL_SOURCE = {
  title: "Ethnologue, entrée lingala",
  url: "https://www.ethnologue.com/language/lin/",
  tier: "official",
};

describe("checkSearchAnswerFields", () => {
  let root: string;

  function writeFiche(relativePath: string, fiche: Record<string, unknown>) {
    const fullPath = join(root, relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, JSON.stringify(fiche));
  }

  const languageWith = (content: Record<string, unknown>) =>
    writeFiche("langues/lin.json", { id: "lin", content });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "afrik-search-answer-"));
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // @req REQ-178
  it("accepts a fiche that carries neither field", () => {
    languageWith({});
    expect(checkSearchAnswerFields(root)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  // @req REQ-178
  it("accepts a lead and a follow-up question within their limits", () => {
    writeFiche("peuples/FLG_X/PPL_FULA.json", {
      id: "PPL_FULA",
      content: {
        searchAnswer: {
          lead: "Le nom qu'ils se donnent : Fulɓe au pluriel, Pullo au singulier.",
          followUp: "Pourquoi des Fulɓe du Sénégal jusqu'au Soudan ?",
        },
      },
    });
    expect(checkSearchAnswerFields(root).ok).toBe(true);
  });

  // @req REQ-178
  it("rejects a lead longer than 220 characters", () => {
    languageWith({ searchAnswer: { lead: "a".repeat(221) } });
    const { ok, errors } = checkSearchAnswerFields(root);
    expect(ok).toBe(false);
    expect(errors.join("\n")).toMatch(/lead.*220/);
  });

  // @req REQ-178
  it("accepts a lead of exactly 220 characters", () => {
    languageWith({ searchAnswer: { lead: "a".repeat(220) } });
    expect(checkSearchAnswerFields(root).ok).toBe(true);
  });

  // @req REQ-178
  it("rejects a follow-up that is not a question", () => {
    languageWith({
      searchAnswer: { followUp: "Les Fulɓe se sont dispersés." },
    });
    const { ok, errors } = checkSearchAnswerFields(root);
    expect(ok).toBe(false);
    expect(errors.join("\n")).toMatch(/followUp.*\?/);
  });

  // @req REQ-178
  it("rejects a follow-up longer than 120 characters", () => {
    languageWith({ searchAnswer: { followUp: `${"a".repeat(120)} ?` } });
    expect(checkSearchAnswerFields(root).ok).toBe(false);
  });

  // @req REQ-178
  it("rejects an empty lead and a key the page does not read", () => {
    languageWith({ searchAnswer: { lead: "  ", verdict: "Un verdict" } });
    const { errors } = checkSearchAnswerFields(root);
    expect(errors.some((error) => /lead.*empty/.test(error))).toBe(true);
    expect(errors.some((error) => /unexpected key "verdict"/.test(error))).toBe(
      true
    );
  });

  // @req REQ-178
  it("rejects the curator's vocabulary and raw identifiers in either field", () => {
    languageWith({
      searchAnswer: {
        lead: "Voir PPL_FULA pour le détail.",
        followUp: "Que dit le protocole de recherche ?",
      },
    });
    const { errors } = checkSearchAnswerFields(root);
    expect(errors.some((error) => /lead.*register/.test(error))).toBe(true);
    expect(errors.some((error) => /followUp.*register/.test(error))).toBe(true);
  });

  // @req REQ-178
  it("rejects the project calling itself an atlas", () => {
    languageWith({ searchAnswer: { lead: "Notre atlas documente ce nom." } });
    expect(checkSearchAnswerFields(root).ok).toBe(false);
  });

  // @req REQ-178
  it("rejects a scholarly word the result page never uses", () => {
    languageWith({
      searchAnswer: { lead: "Un exonyme donné par les voisins." },
    });
    const { errors } = checkSearchAnswerFields(root);
    expect(errors.join("\n")).toMatch(/scholarly/);
  });

  // @req REQ-178
  it("reads patronymes from the top level, where they have no content block", () => {
    writeFiche("patronymes/PAT_CAMARA.json", {
      id: "PAT_CAMARA",
      searchAnswer: { followUp: "Un nom de clan, mais de quel clan ?" },
    });
    expect(checkSearchAnswerFields(root).ok).toBe(true);

    writeFiche("patronymes/PAT_CAMARA.json", {
      id: "PAT_CAMARA",
      searchAnswer: { followUp: "Un nom de clan." },
    });
    expect(checkSearchAnswerFields(root).ok).toBe(false);
  });

  // @req REQ-178
  it.each([true, false])("accepts originDebated: %s on a language", (flag) => {
    languageWith({ originDebated: flag });
    expect(checkSearchAnswerFields(root).ok).toBe(true);
  });

  // @req REQ-178
  it("rejects an originDebated that is not a boolean", () => {
    languageWith({ originDebated: "yes" });
    const { ok, errors } = checkSearchAnswerFields(root);
    expect(ok).toBe(false);
    expect(errors.join("\n")).toMatch(/originDebated must be a boolean/);
  });

  // @req REQ-178
  it("rejects originDebated on a class whose names are read elsewhere", () => {
    writeFiche("peuples/FLG_X/PPL_FULA.json", {
      id: "PPL_FULA",
      content: { originDebated: true },
    });
    expect(checkSearchAnswerFields(root).ok).toBe(false);
  });

  // @req REQ-178
  it("accepts a declared speaker estimate with a tagged source", () => {
    languageWith({
      speakers: {
        byCountry: [
          { country: "COD", speakers: 34000000, source: OFFICIAL_SOURCE },
          { country: "COG", speakers: 4500000, source: OFFICIAL_SOURCE },
        ],
      },
    });
    expect(checkSearchAnswerFields(root).ok).toBe(true);
  });

  // @req REQ-178
  it("rejects a speaker row without a tier on its source", () => {
    languageWith({
      speakers: {
        byCountry: [
          {
            country: "COD",
            speakers: 34000000,
            source: { title: "Ethnologue" },
          },
        ],
      },
    });
    const { errors } = checkSearchAnswerFields(root);
    expect(errors.join("\n")).toMatch(/source\.tier/);
  });

  // @req REQ-178
  it("rejects a speaker row that is not a positive number in a known country", () => {
    languageWith({
      speakers: {
        byCountry: [
          { country: "ZZZ", speakers: 10, source: OFFICIAL_SOURCE },
          { country: "COG", speakers: 0, source: OFFICIAL_SOURCE },
          { country: "COD", speakers: "34 M", source: OFFICIAL_SOURCE },
        ],
      },
    });
    const { errors } = checkSearchAnswerFields(root);
    expect(errors.some((error) => /country "ZZZ"/.test(error))).toBe(true);
    expect(errors.some((error) => /\[1\]\.speakers/.test(error))).toBe(true);
    expect(errors.some((error) => /\[2\]\.speakers/.test(error))).toBe(true);
  });

  // @req REQ-178
  it("rejects the same country declared twice", () => {
    languageWith({
      speakers: {
        byCountry: [
          { country: "COD", speakers: 1, source: OFFICIAL_SOURCE },
          { country: "COD", speakers: 2, source: OFFICIAL_SOURCE },
        ],
      },
    });
    expect(checkSearchAnswerFields(root).errors.join("\n")).toMatch(
      /declared twice/
    );
  });

  // @req REQ-178
  it("rejects an internal note on a speaker source, which readers see verbatim", () => {
    languageWith({
      speakers: {
        byCountry: [
          {
            country: "COD",
            speakers: 34000000,
            source: { ...OFFICIAL_SOURCE, notes: "Tier hérité du catalogue." },
          },
        ],
      },
    });
    expect(checkSearchAnswerFields(root).ok).toBe(false);
  });

  // @req REQ-178
  it("reserves speaker estimates to languages and families", () => {
    writeFiche("peuples/FLG_X/PPL_FULA.json", {
      id: "PPL_FULA",
      content: {
        speakers: {
          byCountry: [
            { country: "SEN", speakers: 4000000, source: OFFICIAL_SOURCE },
          ],
        },
      },
    });
    expect(checkSearchAnswerFields(root).errors.join("\n")).toMatch(
      /only languages and language families/
    );

    rmSync(join(root, "peuples"), { recursive: true });
    writeFiche("famille_linguistique/FLG_BANTU.json", {
      id: "FLG_BANTU",
      content: {
        speakers: {
          byCountry: [
            { country: "COD", speakers: 95000000, source: OFFICIAL_SOURCE },
          ],
        },
      },
    });
    expect(checkSearchAnswerFields(root).ok).toBe(true);
  });
});
