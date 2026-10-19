import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The long Burkina Faso video (19 October 2026) sends its viewers to these
// fiches. Each fact it narrates must be answered there, with its source and
// with the disagreement between sources kept visible.

const read = (path: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));

const bfa = read("dataset/source/afrik/pays/BFA.json");
const mossi = read("dataset/source/afrik/peuples/FLG_GUR/PPL_MOSSI.json");
const dioula = read("dataset/source/afrik/peuples/FLG_MANDE/PPL_DIOULA.json");
const fula = read("dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json");

type Source = { title: string; url?: string | null; tier?: string };
const STANDINGS = ["official", "referenced", "unverified", "needs_review"];

const allSources = (node: unknown, found: Source[] = []): Source[] => {
  if (Array.isArray(node)) node.forEach((item) => allSources(item, found));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "sources" && Array.isArray(value)) found.push(...value);
      allSources(value, found);
    }
  }
  return found;
};

const citedWithTier = (fiche: unknown, titlePart: string) => {
  const matches = allSources(fiche).filter((s) => s.title.includes(titlePart));
  expect(
    matches.length,
    `no source titled like "${titlePart}"`
  ).toBeGreaterThan(0);
  for (const s of matches) expect(STANDINGS).toContain(s.tier);
};

const bfaColonization: string = bfa.content.historicalNames.colonization;
const mossiEvents: string = mossi.content.origins.majorHistoricalEvents;

describe("Burkina Faso: the dating of the Mossi kingdoms", () => {
  // @req REQ-178
  it("keeps the UNESCO passage whole: early formations in the 12th c., Ouagadougou c. 1495, Yatenga c. 1540", () => {
    const account = bfa.nameHistory.names[0].accounts[4].statement;
    expect(account).toContain("milieu du XIIe siècle");
    expect(account).toContain("1495");
    expect(account).toContain("1540");
    expect(account).toMatch(/Izard et Joseph Ki-Zerbo/);
  });

  // @req REQ-178
  it("tells the Middle Ages date as a debate between named historians, not an unattributed 11th century", () => {
    const middleAges = bfa.content.historicalFacts.middleAges;
    expect(middleAges).not.toMatch(/\(XIe siècle\)/);
    expect(middleAges).toContain("Delafosse");
    expect(middleAges).toContain("Izard");
    citedWithTier(bfa, "Histoire générale de l'Afrique, IV, ch. 9");
  });
});

describe("Burkina Faso: the peoples and languages the name comes from", () => {
  // @req REQ-178
  it("lists the Dioula and the Songhay among the country's peoples and languages", () => {
    const ids = (list: Array<{ peopleId?: string }>) =>
      list.map((p) => p.peopleId);
    for (const id of ["PPL_DIOULA", "PPL_SONGHAY_GURMA"]) {
      expect(ids(bfa.content.majorPeoples)).toContain(id);
      expect(ids(bfa.content.demographics.peoples)).toContain(id);
    }
    const codes = bfa.content.culture.mainLanguages.map(
      (l: { isoCode: string }) => l.isoCode
    );
    expect(codes).toEqual(expect.arrayContaining(["dyu", "hmb"]));
  });

  // @req REQ-178
  it("gives the number of languages as Ethnologue's count, with Ethnologue's address", () => {
    expect(bfa.content.culture.culturalTraditions).toMatch(
      /66 selon l'inventaire Ethnologue/
    );
    const ethnologue = bfa.content.sources.find(
      (s: Source) => s.title === "SIL Ethnologue – Languages of Burkina Faso"
    );
    expect(ethnologue.url).toBe("https://www.ethnologue.com/country/BF/");
    expect(ethnologue.tier).not.toBe("needs_review");
  });

  // @req REQ-178
  it("records the Liptako emirate, centred on Dori, from 1810", () => {
    const liptako = bfa.content.kingdoms.find(
      (k: { name: string }) => k.name === "Émirat du Liptako"
    );
    expect(liptako.entryType).toBe("polity");
    expect(liptako.timeRange.startYear).toBe(1810);
    expect(liptako.politicalCenters.join(" ")).toContain("Dori");
    citedWithTier(bfa, "Fülânîler");
  });

  // The video says the region had « des sociétés sans roi » before the
  // colony; the fiche called the Lobi, Dagara and Gurunsi « chefferies »,
  // which its sources contradict.
  // @req REQ-178
  it("says, with who says it, that several peoples lived without a king, and no longer calls them chiefdoms", () => {
    const { precolonial } = bfa.content.historicalNames;
    expect(precolonial).toMatch(
      /sans roi[^.]*Izard et Joseph Ki-Zerbo|Izard et Joseph Ki-Zerbo[^.]*sans roi/
    );
    expect(precolonial).toMatch(/Lobi[^.]*Fiéloux|Fiéloux[^.]*Lobi/);
    expect(precolonial).not.toMatch(/chefferies bobo, lobi/);
    expect(bfa.content.historicalFacts.precolonial).not.toMatch(
      /chefferies gur \(Bobo, Gourounsi, Dagara, Lobi\)/
    );
    const gur = bfa.content.kingdoms.find((k: { dominantPeoples: string[] }) =>
      k.dominantPeoples.includes("Lobi")
    );
    expect(gur.name).not.toBe("Chefferies Gur");
    expect(gur.historicalRole).toMatch(/sans roi/);
    citedWithTier(bfa, "Du Niger à la Volta");
    citedWithTier(bfa, "Les sentiers de la nuit");
  });
});

describe("Burkina Faso: the colony, its borders and its dissolution", () => {
  // @req REQ-178
  it("says the 1919 borders are those of seven cercles that already existed", () => {
    expect(bfaColonization).toMatch(/sept cercles qui existaient déjà/);
  });

  // @req REQ-178
  it("gives both reasons for 1932, each with who gives it", () => {
    expect(bfaColonization).toContain("« appréciables économies »");
    expect(bfaColonization).toMatch(/Joseph Abo Kobi[^.]*main-d'œuvre/);
    expect(bfa.nameHistory.names[1].accounts[3].statement).toContain("Kobi");
    citedWithTier(
      bfa,
      "L'éclatement de la Haute-Volta et de la Côte d'Ivoire de 1932 à 1947"
    );
  });

  // @req REQ-178
  it("gives the Mossi kings' demands and the aim against the RDA as causes of 1947", () => {
    expect(bfaColonization).toContain("Blaise Diagne");
    expect(bfaColonization).toContain("Rassemblement démocratique africain");
    expect(bfa.nameHistory.names[1].accounts[2].statement).toContain("Kobi");
  });

  // @req REQ-178
  it("names Maurice Yaméogo as president from December 1959, before independence", () => {
    expect(bfa.content.historicalFacts.independenceStruggle).toMatch(
      /Maurice Yaméogo[^.]*décembre 1959/
    );
  });

  // @req REQ-178
  it("records the borders kept at independence under the OAU Cairo resolution", () => {
    expect(bfa.content.historicalFacts.postIndependence).toContain(
      "AHG/Res. 16(I)"
    );
    citedWithTier(bfa, "AHG/Res. 16(I)");
  });

  // @req REQ-178
  it("cites the Maharaux paper and the Jeune Afrique article under one title and one standing each", () => {
    for (const url of [
      "https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers08-09/010014865-32.pdf",
      "https://www.jeuneafrique.com/48652/politique/le-4-ao-t-1984-thomas-sankara-rebaptisait-la-haute-volta-en-burkina-faso/",
    ]) {
      const uses = [...allSources(bfa), ...allSources(mossi)].filter(
        (s) => s.url === url
      );
      expect(new Set(uses.map((s) => s.title)).size).toBe(1);
      expect(new Set(uses.map((s) => s.tier)).size).toBe(1);
    }
  });
});

describe("Mossi: the conquest, the exile and the colony", () => {
  // @req REQ-178
  it("no longer says the Mogho Naaba accepted the protectorate", () => {
    expect(mossi.content.historicalRole.conflictsOrAlliances).not.toMatch(
      /accepta le protectorat/
    );
    expect(mossi.content.historicalRole.conflictsOrAlliances).toContain(
      "Wobgo"
    );
  });

  // @req REQ-178
  it("tells Wobgo's flight, his exile at Zongoiri near Gambaga and his death in 1904, on a cited source", () => {
    expect(mossiEvents).toMatch(/1897[^.]*Sighiri/);
    expect(mossiEvents).toContain("Zongoiri");
    expect(mossiEvents).toContain("Gambaga");
    expect(mossiEvents).toMatch(/1904/);
    citedWithTier(mossi, "The Rise of the 'Impenetrable Hedge'");
  });

  // @req REQ-178
  it("dates Yatenga to about 1540 and tells the early date as an attributed debate", () => {
    expect(mossiEvents).not.toMatch(/1495 : fondation du royaume de Yatenga/);
    expect(mossiEvents).toMatch(/1540[^.]*Yatenga|Yatenga[^.]*1540/);
    expect(mossi.content.historicalRole.kingdomsOrChiefdoms).not.toMatch(
      /11e siecle/
    );
    expect(mossi.content.historicalRole.kingdomsOrChiefdoms).toContain("Izard");
    expect(mossi.content.origins.ancientOrigins).toContain("Izard");
  });

  // @req REQ-178
  it("adds 1932 and 1947 to the Mossi events", () => {
    expect(mossiEvents).toMatch(/1932[^.]*plantations/);
    expect(mossiEvents).toMatch(/1947/);
    citedWithTier(
      mossi,
      "L'éclatement de la Haute-Volta et de la Côte d'Ivoire de 1932 à 1947"
    );
  });
});

describe("Dioula and Fulɓe: the routes into the country", () => {
  // @req REQ-178
  it("traces the Dioula route from the Mali empire, the Manden, towards the south", () => {
    const route = dioula.content.origins.migrationRoutes.find((r: string) =>
      r.includes("Manden")
    );
    expect(route).toBeDefined();
    expect(route).toContain("Niane");
  });

  // @req REQ-178
  it("brings the Fulɓe from the Niger bend into Jelgooji and Liptako, and records Dori 1810", () => {
    expect(fula.content.origins.migrationRoutes.join(" ")).toContain(
      "boucle du Niger"
    );
    const zones = fula.content.origins.historicalSettlementZones.join(" ");
    expect(zones).toContain("Djelgôdji");
    expect(zones).toContain("Liptako");
    expect(fula.content.origins.majorHistoricalEvents).toMatch(
      /1810[^.]*Dori[^.]*Brahima Seydou/
    );
    expect(fula.content.historicalRole.kingdomsOrChiefdoms).toMatch(
      /Liptako[^.]*Sokoto/
    );
    citedWithTier(fula, "Fülânîler");
  });
});
