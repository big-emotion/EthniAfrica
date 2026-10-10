import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readNaming } from "@/lib/search/naming";
import { selectNameSubject } from "@/lib/search/nameSubject";
import type { SearchResult } from "@/types/afrik-frontend";

const CORPUS = join(process.cwd(), "dataset/source/afrik");

const FICHE_PATHS: Record<string, string> = {
  PPL_KIRDI: "peuples/FLG_TCHADIQUE/PPL_KIRDI.json",
  PPL_MAFA: "peuples/FLG_TCHADIQUE/PPL_MAFA.json",
  PPL_SARA: "peuples/FLG_SOUDANIQUECENTRAL/PPL_SARA.json",
  PPL_MANDE_DU_SUD: "peuples/FLG_MANDE/PPL_MANDE_DU_SUD.json",
};

function readFiche(id: string) {
  return JSON.parse(readFileSync(join(CORPUS, FICHE_PATHS[id]), "utf8"));
}

// Reads the corpus fiches themselves: whether « kirdi » reaches a name history
// depends on which names each fiche records, so a hand-written fixture would
// keep passing while the data sent the reader nowhere.
function searchResultFromFiche(id: string): SearchResult {
  const fiche = readFiche(id);
  return {
    type: "people",
    id,
    name: fiche.nameMain,
    languageFamilyId: fiche.languageFamilyId,
    relevance: 1,
    naming: readNaming("people", fiche.content),
  };
}

const results = Object.keys(FICHE_PATHS).map(searchResultFromFiche);

const subjectsWithNameHistory = (query: string) =>
  selectNameSubject(results, query)
    .map((subject) => subject.id)
    .filter((id) => readFiche(id).nameHistory)
    .sort();

// Operator ruling on wave 3 of ETNI-2011: Kirdi is an outsiders' name laid on
// some forty peoples, and Mandé du Sud a linguists' branch. Neither is a
// people, so neither carries a name history; each says so on the answer page
// and the names stay on the member peoples.
describe("umbrella entries that are not peoples", () => {
  // @req REQ-178
  it("Kirdi says it is a name given to many peoples and points to the Mafa and the Sara", () => {
    const kirdi = readFiche("PPL_KIRDI");

    expect(kirdi.nameHistory).toBeUndefined();
    expect(kirdi.content.searchAnswer.lead).toMatch(/pas un peuple/);
    expect(kirdi.content.searchAnswer.lead).toMatch(/Mafa/);
    expect(kirdi.content.searchAnswer.lead).toMatch(/Sara/);
  });

  // @req REQ-178
  it("answers « Kirdi » with the Mafa's and the Sara's name histories", () => {
    expect(subjectsWithNameHistory("kirdi")).toEqual(["PPL_MAFA", "PPL_SARA"]);
  });

  // @req REQ-178
  it("Mandé du Sud says it is a grouping by language, not a people", () => {
    const mandeDuSud = readFiche("PPL_MANDE_DU_SUD");

    expect(mandeDuSud.nameHistory).toBeUndefined();
    expect(mandeDuSud.languageFamilyId).toBe("FLG_MANDE");
    expect(mandeDuSud.content.searchAnswer.lead).toMatch(/pas un peuple/);
    expect(mandeDuSud.content.searchAnswer.lead).toMatch(/langue/);
  });
});
