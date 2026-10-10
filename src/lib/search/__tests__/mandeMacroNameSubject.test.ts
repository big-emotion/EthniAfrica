import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readNaming } from "@/lib/search/naming";
import { selectNameSubject } from "@/lib/search/nameSubject";
import type { SearchResult } from "@/types/afrik-frontend";

const CORPUS = join(process.cwd(), "dataset/source/afrik");

const FICHE_PATHS: Record<string, string> = {
  FLG_MANDE: "famille_linguistique/FLG_MANDE.json",
  PPL_MANDE_MACRO: "peuples/FLG_MANDE/PPL_MANDE_MACRO.json",
  PPL_MALINKE: "peuples/FLG_MANDE/PPL_MALINKE.json",
};

function readFiche(id: string) {
  return JSON.parse(readFileSync(join(CORPUS, FICHE_PATHS[id]), "utf8"));
}

// Reads the corpus fiches themselves: the answer depends on which names each
// fiche records, so a hand-written fixture would keep passing while the data
// sent the reader nowhere.
function searchResultFromFiche(id: string): SearchResult {
  const fiche = readFiche(id);
  const isFamily = id.startsWith("FLG_");
  return {
    type: isFamily ? "languageFamily" : "people",
    id,
    name: isFamily ? fiche.nameFr : fiche.nameMain,
    languageFamilyId: isFamily ? undefined : fiche.languageFamilyId,
    relevance: 1,
    naming: readNaming(isFamily ? "languageFamily" : "people", fiche.content),
  };
}

const results = Object.keys(FICHE_PATHS).map(searchResultFromFiche);

const subjectsWithNameHistory = (query: string) =>
  selectNameSubject(results, query)
    .map((subject) => subject.id)
    .filter((id) => readFiche(id).nameHistory)
    .sort();

describe("the Mandé macro-group defers its name history", () => {
  // The macro-group is a grouping by language, not a people with a name of
  // its own: the history of « Mandé » and « Mandingue » is written once, on
  // the family and on the Malinké, and the macro-group points there.
  // @req REQ-178
  it("carries no name history of its own and points the reader to the family and the Malinké", () => {
    const macro = readFiche("PPL_MANDE_MACRO");

    expect(macro.nameHistory).toBeUndefined();
    expect(macro.languageFamilyId).toBe("FLG_MANDE");
    expect(macro.content.searchAnswer.lead).toMatch(/famille mandé/);
    expect(macro.content.searchAnswer.lead).toMatch(/Malinké/);
  });

  // @req REQ-178
  it("answers « Mandé » with the family's name history", () => {
    expect(subjectsWithNameHistory("mandé")).toEqual(["FLG_MANDE"]);
  });

  // @req REQ-178
  it("answers « Mandingue » with the family's and the Malinké's name histories", () => {
    expect(subjectsWithNameHistory("mandingue")).toEqual([
      "FLG_MANDE",
      "PPL_MALINKE",
    ]);
  });
});
