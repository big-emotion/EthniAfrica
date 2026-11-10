import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Readers land on Bagayoko and find a fiche that says nothing of the status the
// name carries. The dictionary of Mande clan names (jamuw), already cited by the
// fiche, gives the entry Bàgayɔgɔ two statuses: nùmu and hɔ̀rɔn.

const fiche = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "dataset/source/afrik/patronymes/PAT_BAGAYOKO.json"),
    "utf8"
  )
);

describe("the family name Bagayoko, status given by the jamuw dictionary", () => {
  // @req REQ-196
  it("states both statuses of the entry, attributed to the dictionary", () => {
    const value: string = fiche.casteOrSocialFunction?.value ?? "";

    expect(value).toMatch(/nùmu/);
    expect(value).toMatch(/hɔ̀rɔn/);
    expect(value).toMatch(/dictionnaire des jamuw/);
    expect(fiche.casteOrSocialFunction.sourceRefs).toEqual(["bamadaba-jamuw"]);
  });

  // @req REQ-196
  it("no longer lists the status as an unexplored gap", () => {
    const paths = fiche.gaps.map((gap: { fieldPath: string }) => gap.fieldPath);

    expect(paths).not.toContain("casteOrSocialFunction");
  });
});
