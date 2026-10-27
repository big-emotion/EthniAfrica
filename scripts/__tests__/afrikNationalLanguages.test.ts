import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Three gaps found by the research of « L'Afrique n'est pas un tout » n°5
// (26 November 2026): the video states these facts, so the fiche the profile
// link opens must state them too, from the same sources.

interface Source {
  title?: string;
}

interface CountryFiche {
  summary: string;
  content: {
    culture?: { mainLanguages?: Array<{ name: string; isoCode?: string }> };
    historicalFacts?: { independenceStruggle?: string };
    sources: Source[];
  };
}

const fiche = (id: string): CountryFiche =>
  JSON.parse(
    readFileSync(
      resolve(process.cwd(), `dataset/source/afrik/pays/${id}.json`),
      "utf8"
    )
  );
const cites = (f: CountryFiche, needle: string) =>
  f.content.sources.some((s) => s.title?.includes(needle));

describe("national languages stated by the episode on nation-states", () => {
  // @req REQ-186
  it("lists the DR Congo's four constitutional national languages beside French", () => {
    const cod = fiche("COD");
    const codes = cod.content.culture?.mainLanguages?.map((l) => l.isoCode);
    expect(codes).toEqual(["fra", "ktu", "lin", "swc", "lua"]);
    expect(
      cites(cod, "Constitution of the Democratic Republic of the Congo")
    ).toBe(true);
  });

  // @req REQ-186
  it("records that Swahili became Tanzania's national language under Nyerere", () => {
    const tza = fiche("TZA");
    expect(tza.content.historicalFacts?.independenceStruggle).toMatch(
      /le swahili est déclaré langue nationale/
    );
    expect(cites(tza, "Petzell")).toBe(true);
  });

  // @req REQ-186
  it("says that Sango has been an official language beside French since 1991", () => {
    const caf = fiche("CAF");
    expect(caf.summary).toMatch(
      /depuis 1991, langue officielle avec le français/
    );
    expect(cites(caf, "loi n°91/003")).toBe(true);
  });
});
