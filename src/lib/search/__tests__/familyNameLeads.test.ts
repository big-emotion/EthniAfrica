import { describe, expect, it } from "vitest";

import {
  familyNameLeadForm,
  familyNameLeads,
  fichesRecordingWord,
  nameHits,
  proseHits,
} from "@/lib/search/__fixtures__/corpusNameModel";

// DEC-075 over the real family-name fiches of the repository, through the
// pg_trgm model of corpusNameModel.ts. The SQL of migration 110 stays the
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
  // them (brief 16): Konan and Konaté begin like « konana », each through its
  // filed name; Onana, which the search also finds by its spelling, begins
  // with another letter. No fiche writes the word anywhere, sources
  // included: the example is a spelling our data does not record.
  // @req REQ-125
  it("offers Konan and Konaté for « konana », a word no fiche records", () => {
    const leads = familyNameLeads("konana");

    expect(leads.map((item) => item.key)).toEqual(
      expect.arrayContaining(["PAT_KONAN", "PAT_KONATE"])
    );
    expect(leads.map((item) => familyNameLeadForm("konana", item))).toEqual(
      leads.map((item) => item.filedName)
    );
    expect(leadIds("konana")).not.toContain("PAT_ONANA");
    expect(nameHits("konana")).toEqual([]);
    expect(proseHits("konana")).toEqual([]);
    expect(fichesRecordingWord("konana")).toEqual([]);
  });

  // The first several-choice example, withdrawn: « Sanoh » is one of the
  // Kuranko clans, and Sanou's source note reads « Notice SANOU / SANOH /
  // SANON ». A spelling our fiches record is no misspelling to correct: the
  // query layer offers no lead beside such a fiche until DEC-075 rules on it.
  // @req REQ-125
  it("finds « sanoh » written by the Kuranko and Sanou fiches", () => {
    expect(proseHits("sanoh").map((item) => item.key)).toContain("PPL_KURANKO");
    expect(fichesRecordingWord("sanoh")).toEqual(
      expect.arrayContaining(["PPL_KURANKO", "PAT_SANOU"])
    );
  });

  // Migration 110 returns the form that scored beside the filed name.
  // « jarra » reaches Diarra through its recorded spelling Jara only: Diarra
  // begins with another letter. The page names Jara, the form that is
  // written almost the same way, not Diarra.
  // @req REQ-125
  it("reaches Diarra for « jarra » through its recorded spelling Jara", () => {
    const diarra = familyNameLeads("jarra").find(
      (item) => item.key === "PAT_DIARRA"
    );

    expect(diarra).toBeDefined();
    expect(familyNameLeadForm("jarra", diarra!)).toBe("Jara");
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

  // Migration 110 scores the filed name and `spellings[].spelling` only. An
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
