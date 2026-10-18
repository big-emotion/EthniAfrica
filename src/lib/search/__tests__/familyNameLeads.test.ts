import { describe, expect, it } from "vitest";

import {
  familyNameLeads,
  nameHits,
  proseHits,
} from "@/lib/search/__fixtures__/corpusNameModel";

// DEC-075 over the real family-name fiches of the repository, through the
// pg_trgm model of corpusNameModel.ts. The SQL of migration 109 stays the
// authority; its verification block re-checks these on recette.
describe("which family names are a spelling of the searched name (DEC-075)", () => {
  const leadIds = (query: string) =>
    familyNameLeads(query).map((item) => item.key);

  // @req REQ-125
  it("offers Tchicaya for « tchikaya », and neither Tchalla nor Tchoumba", () => {
    expect(leadIds("tchikaya")).toContain("PAT_TCHICAYA");
    expect(leadIds("tchikaya")).not.toContain("PAT_TCHALLA");
    expect(leadIds("tchikaya")).not.toContain("PAT_TCHOUMBA");
  });

  // @req REQ-125
  it("offers Mutombo for « muzombo »", () => {
    expect(leadIds("muzombo")).toContain("PAT_MUTOMBO");
  });

  // Main's example of several choices with a fiche found that is not one of
  // them (brief 16): Sanogo and Sanou begin like « sanoh », and the Kuranko
  // fiche names Sanoh among its clans. Held here so the example stays one
  // the rules produce.
  // @req REQ-125
  it("offers Sanogo and Sanou for « sanoh », whose search also finds the Kuranko fiche", () => {
    expect(leadIds("sanoh")).toEqual(
      expect.arrayContaining(["PAT_SANOGO", "PAT_SANOU"])
    );
    expect(nameHits("sanoh")).toEqual([]);
    expect(proseHits("sanoh").map((item) => item.key)).toContain("PPL_KURANKO");
    expect(leadIds("sanoh")).not.toContain("PPL_KURANKO");
  });

  // Mukasa begins with another letter; Bukuru begins with b but shares too
  // little with « bukasa ».
  // @req REQ-125
  it("offers no family name for « bukasa »", () => {
    expect(leadIds("bukasa")).toEqual([]);
  });

  // The first letter changes, so the spelling is not offered; the search
  // itself still finds what it finds.
  // @req REQ-125
  it("does not offer Tchicaya for « chikaya »", () => {
    expect(leadIds("chikaya")).not.toContain("PAT_TCHICAYA");
  });

  // Migration 109 scores the filed name and `spellings[].spelling` only. An
  // attestation's country code is no form of the name: « cog » is not a
  // spelling of Tchicaya because it was attested in Congo.
  // @req REQ-125
  it("scores only the filed name and the recorded spellings, not their attestations", () => {
    expect(leadIds("cog")).not.toContain("PAT_TCHICAYA");
  });

  // @req REQ-125
  it("offers nothing for a query under three letters", () => {
    expect(familyNameLeads("tc")).toEqual([]);
  });
});
