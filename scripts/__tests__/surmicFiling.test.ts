import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The Surmic peoples were filed under four families (Cushitic, Omotic,
// Nilotic, Nilo-Saharan) although every source their fiches cite classes the
// language as Nilo-Saharan. Glottolog (surm1244) lists all six languages in
// one Surmic family and, by Güldemann 2018, finds no sound basis to join it to
// Eastern Sudanic; the corpus has no Surmic fiche, so they sit together under
// the Nilo-Saharan fiche, which already treats Surmic as one of its branches.

const AFRIK = resolve(process.cwd(), "dataset/source/afrik");
const SURMIC_PEOPLES = [
  "PPL_SURI",
  "PPL_MURSI",
  "PPL_BODI",
  "PPL_MEEN",
  "PPL_MURLE",
  "PPL_MAJANG",
];

function peopleFile(id: string): string | undefined {
  return readdirSync(resolve(AFRIK, "peuples"))
    .map((family) => resolve(AFRIK, "peuples", family, `${id}.json`))
    .find((file) => existsSync(file));
}

describe("the Surmic peoples", () => {
  // @req REQ-178
  it.each(SURMIC_PEOPLES)("files %s under the Nilo-Saharan family", (id) => {
    const file = peopleFile(id);
    const fiche = JSON.parse(readFileSync(file as string, "utf8"));

    expect(file).toMatch(/FLG_NILOSAHARIENNE\//);
    expect(fiche.languageFamilyId).toBe("FLG_NILOSAHARIENNE");
    expect(fiche.content.appellations.linguisticFamily).toBe(
      "FLG_NILOSAHARIENNE"
    );
  });

  // @req REQ-178
  it("lists the moved peoples among the family's associated peoples", () => {
    const family = JSON.parse(
      readFileSync(
        resolve(AFRIK, "famille_linguistique/FLG_NILOSAHARIENNE.json"),
        "utf8"
      )
    );
    const listed = family.content.associatedPeoples.map(
      (entry: { peopleId: string }) => entry.peopleId
    );

    expect(listed).toEqual(
      expect.arrayContaining([
        "PPL_SURI",
        "PPL_MURSI",
        "PPL_BODI",
        "PPL_MEEN",
        "PPL_MURLE",
      ])
    );
  });
});
