import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The corrections the operator approved on 12 October 2026 for the
// « L'Afrique à travers le temps » time-slice carousel: the carousel reads
// `content.kingdoms[].timeRange`, so a missing polity is a blank map and a
// wrong bound puts a state in the wrong century. Each case reads the fiche a
// reader would get.

const AFRIK = resolve(process.cwd(), "dataset/source/afrik");

interface TimeRange {
  startYear: number;
  endYear?: number;
  ongoing?: boolean;
  precision: string;
  datingNote?: string;
}

interface Kingdom {
  name: string;
  period: string;
  timeRange?: TimeRange;
  politicalCenters: string[];
  historicalRole: string;
}

interface Source {
  title: string;
  url: string | null;
  tier: string;
  notes?: string;
}

interface CountryFiche {
  content: { kingdoms: Kingdom[]; sources: Source[] };
}

function country(id: string): CountryFiche {
  return JSON.parse(
    readFileSync(resolve(AFRIK, "pays", `${id}.json`), "utf8")
  ) as CountryFiche;
}

function kingdom(id: string, name: RegExp): Kingdom {
  const found = country(id).content.kingdoms.find((entry) =>
    name.test(entry.name)
  );
  if (!found) throw new Error(`${id}: no kingdom matching ${name}`);
  return found;
}

describe("atlas through time — West Africa", () => {
  // @req REQ-148
  it("places Kong in Côte d'Ivoire from Sékou Wattara's accession in 1710 to 1897", () => {
    const kong = kingdom("CIV", /Kong/);
    expect(kong.timeRange.startYear).toBe(1710);
    expect(kong.timeRange.endYear).toBe(1897);
    expect(kong.period).toContain("début du XVIIIe siècle");
    expect(kong.timeRange.datingNote).toContain("1745");
  });

  // @req REQ-148
  it("gives Mali its nineteenth-century states", () => {
    expect(kingdom("MLI", /Macina/).timeRange.startYear).toBe(1818);
    expect(kingdom("MLI", /toucouleur/i).timeRange.startYear).toBe(1852);
    expect(kingdom("MLI", /Samori/).timeRange.endYear).toBe(1898);
    expect(kingdom("MLI", /Kénédougou/).timeRange.endYear).toBe(1898);
  });

  // @req REQ-148
  it("gives Guinea Samori's empire and the Toucouleur state, which reached into it", () => {
    expect(kingdom("GIN", /Samori/).historicalRole).toContain("Kankan");
    expect(kingdom("GIN", /toucouleur/i).historicalRole).toContain(
      "sources du Sénégal et de la Gambie"
    );
  });

  // @req REQ-148
  it("no longer starts the Almoravids in the seventh century and adds Ghana to Mauritania", () => {
    expect(kingdom("MRT", /Almoravide/).timeRange.startYear).toBe(1039);
    expect(kingdom("MRT", /Ghana/).politicalCenters).toContain(
      "Koumbi Saleh (capitale)"
    );
  });

  // @req REQ-148
  it("dates the Mossi kingdoms from the end of the fifteenth century", () => {
    expect(kingdom("BFA", /Mossi/).timeRange.startYear).toBe(1495);
  });

  // @req REQ-148
  it("separates Ife from Oyo in Nigeria", () => {
    expect(kingdom("NGA", /^Ife$/).timeRange.startYear).toBe(1100);
    expect(kingdom("NGA", /Oyo/).politicalCenters).not.toContain("Ile-Ife");
  });
});

describe("atlas through time — North and North-East Africa", () => {
  // @req REQ-148
  it("adds the Ouaddaï and Baguirmi sultanates to Chad", () => {
    expect(kingdom("TCD", /Ouadda/).timeRange.endYear).toBe(1911);
    expect(kingdom("TCD", /Baguirmi/).politicalCenters).toContain(
      "Massenya (capitale)"
    );
  });

  // @req REQ-148
  it("adds the Saadian dynasty to Morocco", () => {
    expect(kingdom("MAR", /saadienne/).politicalCenters).toContain(
      "Fès (à partir de 1554)"
    );
  });

  // @req REQ-148
  it("dates Aksum from about 80 BCE to 825", () => {
    const aksum = kingdom("ETH", /Axoum/);
    expect(aksum.timeRange.startYear).toBe(-80);
    expect(aksum.timeRange.endYear).toBe(825);
  });

  // @req REQ-148
  it("adds Kerma to Sudan and records Darfur's 1874–1898 break", () => {
    expect(kingdom("SDN", /Kerma/).timeRange.startYear).toBe(-1780);
    const darfur = kingdom("SDN", /Darfour/).timeRange.datingNote;
    expect(darfur).toContain("1874");
    expect(darfur).toContain("1898");
  });

  // @req REQ-148
  it("adds the Garamantes and the Karamanli to Libya", () => {
    expect(kingdom("LBY", /Garamantes/).politicalCenters[0]).toContain(
      "Garama"
    );
    expect(kingdom("LBY", /Karamanli/).timeRange).toMatchObject({
      startYear: 1711,
      endYear: 1835,
    });
  });

  // @req REQ-148
  it("ends the Numidian kingdoms with Africa Nova in 46 BCE", () => {
    expect(kingdom("DZA", /numides/).timeRange.endYear).toBe(-46);
  });
});

describe("atlas through time — Central, East and Southern Africa", () => {
  // @req REQ-148
  it("dates Great Zimbabwe 1100–1450 and adds Torwa", () => {
    expect(kingdom("ZWE", /Grand Zimbabwe/).timeRange).toMatchObject({
      startYear: 1100,
      endYear: 1450,
    });
    expect(kingdom("ZWE", /Torwa/).politicalCenters).toContain(
      "Khami (première capitale)"
    );
  });

  // @req REQ-148
  it("gives both readings of the Mutapa end without pretending to a year", () => {
    const mutapa = kingdom("ZWE", /Mutapa/);
    expect(mutapa.timeRange.precision).toBe("approximate");
    expect(mutapa.timeRange.datingNote).toContain("1917");
    expect(mutapa.timeRange.datingNote).toContain("1902");
    expect(mutapa.timeRange.datingNote).toContain("1693");
    expect(mutapa.period).not.toContain("et au-delà");
  });

  // @req REQ-148
  it("adds Loango to Congo, Gaza to Mozambique, and extends Maravi", () => {
    expect(kingdom("COG", /Loango/).politicalCenters).toContain(
      "Loango (cour royale)"
    );
    expect(kingdom("MOZ", /Gaza/).timeRange.endYear).toBe(1895);
    expect(kingdom("MWI", /Maravi/).timeRange.endYear).toBe(1800);
  });

  // @req REQ-148
  it("notes the later dynastic foundations of Rwanda and Burundi", () => {
    expect(kingdom("RWA", /Rwanda/).timeRange.datingNote).toContain(
      "Ruganzu Ndori"
    );
    expect(kingdom("BDI", /Burundi/).timeRange.datingNote).toContain(
      "fin du XVIIe siècle"
    );
  });

  // @req REQ-148
  it("no longer dates the Zulu kingdom to 1574", () => {
    const zulu = JSON.parse(
      readFileSync(resolve(AFRIK, "peuples/FLG_BANTU/PPL_ZULU.json"), "utf8")
    );
    const kingdoms: string = zulu.content.historicalRole.kingdomsOrChiefdoms;
    expect(kingdoms).not.toMatch(/Royaume Zoulou fond/);
    expect(kingdoms).toContain("Shaka");
  });
});

describe("atlas through time — sources", () => {
  const corrected = [
    "CIV",
    "BFA",
    "TCD",
    "MLI",
    "MAR",
    "MRT",
    "ZWE",
    "COG",
    "MOZ",
    "NGA",
    "ETH",
    "SDN",
    "LBY",
    "RWA",
    "BDI",
    "DZA",
    "MWI",
    "GIN",
  ];

  // @req REQ-032
  it("cites the chapters behind each correction in the country model's source shape", () => {
    for (const id of corrected) {
      const sources = country(id).content.sources;
      const unesco = sources.filter((source) =>
        source.url?.startsWith("https://unesdoc.unesco.org/")
      );
      expect(unesco.length, id).toBeGreaterThan(0);
      for (const source of sources) {
        expect(Object.keys(source), `${id}: ${source.title}`).not.toEqual(
          expect.arrayContaining(["page"])
        );
      }
    }
  });

  // @req REQ-032
  it("cites the dated reading of Kong's start and both readings of the Mutapa end", () => {
    const urls = (id: string) =>
      country(id).content.sources.map((source) => source.url);
    expect(urls("CIV")).toContain(
      "https://horizon.documentation.ird.fr/exl-doc/pleins_textes/2022-12/010075008.pdf"
    );
    expect(urls("ZWE")).toContain("https://doi.org/10.1017/S0021853700025809");
  });
});
