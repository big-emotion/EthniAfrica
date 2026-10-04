import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(
    resolve(process.cwd(), `dataset/source/afrik/peuples/${path}`),
    "utf8"
  );

/**
 * A word the project calls pejorative when it reports it (« Kirdi … païen »)
 * is not used in the fiche's own voice to describe a people's religion or
 * past. Where a source's loaded word is the subject, it stays, attributed.
 */
describe("fiches describing a people in their own voice", () => {
  // @req REQ-143
  it("do not call a people's traditional religion « païenne »", () => {
    for (const [file, bad] of [
      ["FLG_KROU/PPL_KODIA_KROU.json", "etaient a l'origine paiens"],
      ["FLG_NIGERCONGO/PPL_HALPULAAR.json", "dynastie paienne"],
      ["FLG_COUCHITIQUE/PPL_AGAW.json", "paiens"],
      ["FLG_COUCHITIQUE/PPL_AGAW.json", "chretien-paien"],
    ] as const) {
      expect(read(file), `${file}: ${bad}`).not.toContain(bad);
    }
  });

  // @req REQ-143
  it("do not call the early inhabitants of a region « primitifs »", () => {
    expect(read("FLG_NIGERCONGO/PPL_TSWA.json")).not.toContain(
      "habitants primitifs"
    );
    expect(read("FLG_BENOUECONGO/PPL_ESAN.json")).not.toContain(
      "Benin primitif"
    );
  });

  // @req REQ-143
  it("present the Hamitic origin of the Bahima as a thesis, not as their probable origin", () => {
    const text = read("FLG_BANTU/PPL_BANYANKOLE.json");
    expect(text).not.toContain("probablement d'origine hamitique");
    expect(text).toContain("thèse dite hamitique");
  });

  // @req REQ-143
  it("keep the attributed reports of the same words, which are the subject there", () => {
    expect(read("FLG_SOUDANIQUECENTRAL/PPL_SARA.json")).toContain("paien");
    expect(read("FLG_COUCHITIQUE/PPL_QEMANT.json")).toContain("paien");
  });
});
