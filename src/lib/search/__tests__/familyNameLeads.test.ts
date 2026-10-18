import { describe, expect, it } from "vitest";

import {
  corpusEntities,
  familyNameLeadForm,
  familyNameLeads,
  fichesRecordingWord,
  nameHits,
  NEIGHBOUR_FLOOR,
  neighbours,
  peopleLeadForm,
  proseHits,
  similarity,
} from "@/lib/search/__fixtures__/corpusNameModel";

// What no chip may print as a name: a piece of a phrase the self-appellation
// was cut into, two names, or a sentence (brief 16, seventh and eighth
// reviews). The equal sign alone is allowed: « =|Hoa » writes a click.
const PIECE_OF_A_PHRASE = /[()/;:.«»0-9]| = | ou /;

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

// A people lead through one of its other names (brief 16): migration 110
// scores a people's filed name, self-appellation and exonyms at 0.2, and names
// the form that scored.
describe("which people a misspelling resembles (REQ-125)", () => {
  // The example of brief 16: Pakhallas is the name the Dioula gave the
  // Koulango, recorded by the Koulango fiche alone, and no fiche marks it as
  // a name that hurts. No fiche writes « pakhalas » anywhere, sources
  // included, and Koulango begins with another letter: the chip names
  // Pakhallas, the line names the fiche.
  // @req REQ-125
  it("reaches Koulango for « pakhalas » only through its exonym Pakhallas, a word no fiche records", () => {
    const leads = neighbours("pakhalas", { formsOfAPeople: true });

    expect(leads.map((item) => item.key)).toEqual(["PPL_KOULANGO"]);
    expect(peopleLeadForm("pakhalas", leads[0])).toBe("Pakhallas");
    expect(familyNameLeads("pakhalas")).toEqual([]);
    expect(nameHits("pakhalas")).toEqual([]);
    expect(proseHits("pakhalas")).toEqual([]);
    expect(fichesRecordingWord("pakhalas")).toEqual([]);
  });

  // The page's examples of a form two fiches record, and of a fiche filed
  // with a bracket: Iteso and Kumam both record Ikumama; the fiche filed
  // « Diola (Joola / Jola) » records Ajamataw, the name the Diola give
  // themselves. Neither typed word is written by any fiche.
  // @req REQ-125
  it("reaches Iteso and Kumam for « icumama », and Diola for « ajumataw », through the form each records", () => {
    const ikumama = neighbours("icumama", { formsOfAPeople: true });
    const ajamataw = neighbours("ajumataw", { formsOfAPeople: true });

    expect(ikumama.map((item) => item.key).sort()).toEqual([
      "PPL_ITESO",
      "PPL_KUMAM",
    ]);
    expect(ikumama.map((item) => peopleLeadForm("icumama", item))).toEqual([
      "Ikumama",
      "Ikumama",
    ]);
    expect(ajamataw.map((item) => item.key)).toEqual(["PPL_DIOLA"]);
    expect(peopleLeadForm("ajumataw", ajamataw[0])).toBe("Ajamataw");
    for (const query of ["icumama", "ajumataw"]) {
      expect(familyNameLeads(query)).toEqual([]);
      expect(proseHits(query)).toEqual([]);
      expect(fichesRecordingWord(query)).toEqual([]);
    }
  });

  // Migration 110 splits a self-appellation on its commas alone, so a
  // bracket holding a comma is cut in two: « Baganda (sg. Muganda,
  // pl. Abaganda) » gives « pl. Abaganda) », « Kumam (ou Ikokolemu,
  // Akokolemu) » gives « Akokolemu) ». Such a piece is not scored: a lead is
  // offered only under a form that is one name and that itself scored
  // (eighth review of brief 16). Falling back to the filed name said that
  // Kumam (0.00 against « akokolemou »), Kongo (0.17) or « Baganda / Ganda »
  // (0.19) resembles the word typed, below the 0.2 floor. No fiche writes
  // these three words; the peoples they still reach do so through a form
  // that is one name.
  // @req REQ-125
  it("offers no lead from a piece of a phrase: no Baganda for « abagenda », no Kumam for « akokolemou », no Kongo for « mukongu »", () => {
    const cases = [
      ["abagenda", "PPL_BAGANDA"],
      ["akokolemou", "PPL_KUMAM"],
      ["mukongu", "PPL_KONGO"],
    ];

    for (const [query, key] of cases) {
      const leads = neighbours(query, { formsOfAPeople: true });
      const fiche = corpusEntities().find((item) => item.key === key);

      expect(
        leads.map((item) => item.key),
        query
      ).not.toContain(key);
      expect(peopleLeadForm(query, fiche!), query).toBeUndefined();
      for (const lead of leads.filter((item) => item.kind === "people")) {
        const chip = peopleLeadForm(query, lead);
        expect(chip, `${query} → ${lead.key}`).not.toMatch(PIECE_OF_A_PHRASE);
        expect(
          similarity(chip!, query),
          `${query} → ${lead.key}: ${chip}`
        ).toBeGreaterThanOrEqual(NEIGHBOUR_FLOOR);
      }
      expect(nameHits(query), query).toEqual([]);
      expect(proseHits(query), query).toEqual([]);
    }
  });

  // The examples of brief 16 keep their lead: each is reached through a
  // form that is one name, and that form's own score clears the floor.
  // @req REQ-125
  it("keeps the leads of « pakhalas », « icumama » and « ajumataw », each named by the form that scored", () => {
    const cases: [string, string, string][] = [
      ["pakhalas", "PPL_KOULANGO", "Pakhallas"],
      ["icumama", "PPL_ITESO", "Ikumama"],
      ["icumama", "PPL_KUMAM", "Ikumama"],
      ["ajumataw", "PPL_DIOLA", "Ajamataw"],
    ];

    for (const [query, key, form] of cases) {
      const lead = neighbours(query, { formsOfAPeople: true }).find(
        (item) => item.key === key
      );

      expect(lead, `${query} → ${key}`).toBeDefined();
      expect(peopleLeadForm(query, lead!)).toBe(form);
      expect(similarity(form, query)).toBeGreaterThanOrEqual(NEIGHBOUR_FLOOR);
    }
  });

  // Every form a people fiche records, typed as written. When the people is
  // a lead, the chip is the form that scored: its filed name or a form that
  // is one name, whose own score clears the floor. A piece of a phrase (a
  // bracket, a slash, a semicolon, a colon, a full stop, guillemets, a date,
  // « = » or two names joined by « ou »: « pl. Abaganda) », « etc. »,
  // « 1995 », « nkop = terre », « Yacouba ou Yakuba ») is never the chip,
  // and never makes a people a lead under another name.
  // @req REQ-125
  it("never names a piece of a phrase, nor offers a people through one, over every form of every people fiche", () => {
    const misnamed = corpusEntities()
      .filter((item) => item.kind === "people")
      .flatMap((item) => {
        const filed = item.filedName.replace(/\s*\([^)]*\)\s*$/, "").trim();
        return item.forms.map((form) => ({
          key: item.key,
          form,
          filed,
          chip: peopleLeadForm(form, item),
        }));
      })
      .filter(
        ({ form, filed, chip }) =>
          chip !== undefined &&
          ((chip !== filed && PIECE_OF_A_PHRASE.test(chip)) ||
            similarity(chip, form) < NEIGHBOUR_FLOOR)
      );

    expect(misnamed).toEqual([]);
  });

  // The withdrawn example: the Peul fiche writes « Felata », as François de
  // Medeiros wrote the name Fellata, and records Fellata as a name that can
  // be an insult in Sudan and Chad. A spelling our fiches record is no
  // misspelling to correct.
  // @req REQ-125
  it("finds « felata » written by the Peul fiche", () => {
    expect(fichesRecordingWord("felata")).toContain("PPL_FULA");
    expect(proseHits("felata").map((item) => item.key)).toContain("PPL_FULA");
  });
});
