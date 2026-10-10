import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";
import { resolveAfrikFiche } from "../resolveAfrikFiche";

// The redirect registry is the one file that must keep naming a retired id.
const REDIRECT_REGISTRY = "_retired-identifiers.json";

// Where a live reference to a people id can sit. The archive `.txt` notes and
// the demography CSV are frozen exports and were left alone by every earlier fold.
const REFERENCE_ROOTS: Array<[string, RegExp]> = [
  ["dataset/source/afrik", /\.json$/],
  ["docs/editorial", /\.json$/],
  ["src", /\.(ts|tsx)$/],
];

interface Fold {
  retired: string[];
  keeper: string;
  /** One item per kind that only the retired fiche held, proving the carry-over. */
  carried: {
    sourceTitle: string;
    subGroup?: string;
    dialect?: string;
    exonym?: string;
    isoCode?: string;
    country?: string;
  };
}

const FOLDS: Fold[] = [
  {
    retired: ["PPL_LANGO"],
    keeper: "FLG_NILOTIQUE/PPL_LANGI",
    carried: {
      sourceTitle: "Lango Cultural Foundation — Clans et vie sociale",
      subGroup: "Lango d'Oyam",
      dialect: "LebLango d'Amolatar",
      exonym: "Lang'o",
    },
  },
  {
    retired: ["PPL_GURMA"],
    keeper: "FLG_GUR/PPL_GOURMANTCHE",
    carried: {
      sourceTitle:
        "Salif Titamba Lankoande — Les Gourmantché. Presses Africaines du Burkina, Ouagadougou, 2006",
      subGroup: "Gurma du Bénin",
      exonym: "Gurmanche",
    },
  },
  {
    retired: ["PPL_FULA_FORET"],
    keeper: "FLG_ATLANTIQUE/PPL_FULA",
    carried: {
      sourceTitle: "African Voice Newspaper — The Fula of Guinea",
      subGroup: "Fulbe Kpele",
      country: "GAB",
    },
  },
  {
    retired: ["PPL_KIKONGO"],
    keeper: "FLG_BANTU/PPL_KONGO",
    carried: {
      sourceTitle: "Glottolog : Kongo, ISO 639-3 : kon/kng",
      exonym: "Kikongo",
      isoCode: "ldi",
    },
  },
  {
    retired: ["PPL_NDEBELE_NORD", "PPL_NDEBELE_ZIM"],
    keeper: "FLG_BANTU/PPL_NDEBELE",
    carried: {
      sourceTitle: "South African History Online — Mfecane",
      subGroup: "Amaveni",
      exonym: "Tabele",
    },
  },
  {
    retired: ["PPL_SOTHO_NORD"],
    keeper: "FLG_NIGERCONGO/PPL_PEDI",
    carried: {
      sourceTitle:
        "Delius, Peter — The Land Belongs to Us: The Pedi Polity, the Boers and the British in the Nineteenth-Century Transvaal. Berkeley: University of California Press, 1984",
      subGroup: "Pulana",
      dialect: "Sepulana",
      exonym: "Sepedi",
    },
  },
  {
    retired: ["PPL_TSHOKWE"],
    keeper: "FLG_NIGERCONGO/PPL_CHOKWE",
    carried: {
      sourceTitle:
        "Bastin, Marie-Louise — Arts of the Angolan Peoples, I: Chokwe. Museu do Dundo, 1961",
      subGroup: "Tshokwe de Zambie",
      dialect: "Kichokwe",
    },
  },
  {
    // Everything the Zimbabwe fiche held was already the keeper's.
    retired: ["PPL_KARANGA_ZIM"],
    keeper: "FLG_NIGERCONGO/PPL_KARANGA",
    carried: {
      sourceTitle:
        "Chigwedere, Aeneas. The Karanga Empire. Books for Africa, Harare, 1986",
    },
  },
  {
    retired: ["PPL_YAO_MOZ", "PPL_YAO_MALAWI"],
    keeper: "FLG_BANTU/PPL_YAO",
    carried: {
      sourceTitle:
        "Smithsonian Folkways — Ceremonial, dance, and story songs from the Yao people of Malawi",
      subGroup: "Yao de Zomba",
      dialect: "Chiconono",
      exonym: "Wahiao",
    },
  },
  {
    retired: ["PPL_LOMWE_MOZ", "PPL_LOMWE_MALA"],
    keeper: "FLG_NIGERCONGO/PPL_LOMWE",
    carried: {
      sourceTitle:
        "INE Mozambique — IV Recensement General de la Population et de l'Habitat 2017",
      subGroup: "Lomwe de Gurue",
      dialect: "Chilomwe de Phalombe",
    },
  },
  {
    retired: ["PPL_KIRUNDI_TUTSI"],
    keeper: "FLG_BANTU/PPL_TUTSI_BURUNDI",
    carried: {
      sourceTitle: "Joshua Project — Tutsi in Burundi",
      exonym: "Batutsi",
    },
  },
  {
    retired: ["PPL_LUO_PAGU"],
    keeper: "FLG_NILOTIQUE/PPL_LUO",
    carried: {
      sourceTitle:
        "RSIS International — Population Movements and the Gem Community in Western Kenya",
      subGroup: "Jo-Gem",
      dialect: "Trans-Yala",
    },
  },
];

const ALL_RETIRED = FOLDS.flatMap((fold) => fold.retired);

function filesUnder(directory: string, pattern: RegExp): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return filesUnder(path, pattern);
    return pattern.test(entry) && entry !== REDIRECT_REGISTRY ? [path] : [];
  });
}

function peopleFile(relativePath: string): string {
  return resolve(
    process.cwd(),
    "dataset/source/afrik/peuples",
    `${relativePath}.json`
  );
}

function readPeople(relativePath: string) {
  return JSON.parse(readFileSync(peopleFile(relativePath), "utf8"));
}

function readCountry(iso3: string): string {
  return readFileSync(
    resolve(process.cwd(), "dataset/source/afrik/pays", `${iso3}.json`),
    "utf8"
  );
}

// A locator cited with and without its trailing slash is still one locator.
function locator(url: string): string {
  return url.replace(/\/+$/, "");
}

interface Account {
  period: { from: number | null };
  statement: string;
}

function accountsOf(
  fiche: { nameHistory: { names: unknown[] } },
  name: string
) {
  const entry = (
    fiche.nameHistory.names as Array<{ nameText: string; accounts: Account[] }>
  ).find((candidate) => candidate.nameText === name);
  return entry?.accounts ?? [];
}

describe("duplicate people fiches folded on 2026-10-11", () => {
  // @req REQ-178
  it.each(FOLDS.map((fold) => [fold.retired.join(", "), fold] as const))(
    "redirects %s to its keeper in one hop, with the ruling dated",
    (_label, fold) => {
      const keeperId = fold.keeper.split("/")[1];
      for (const retired of fold.retired) {
        expect(RETIRED_PEOPLE_IDS[retired], retired).toBe(keeperId);
        const entry = retiredIdentifiers.find(
          (candidate) => candidate.retiredId === retired
        );
        expect(entry?.decidedOn, retired).toBe("2026-10-11");
      }
      expect(RETIRED_PEOPLE_IDS[keeperId]).toBeUndefined();
    }
  );

  // @req REQ-178
  it("leaves no fiche file for a retired id, and nothing pointing at one", () => {
    const retired = new RegExp(`\\b(${ALL_RETIRED.join("|")})\\b`);
    const dangling = REFERENCE_ROOTS.flatMap(([root, pattern]) =>
      filesUnder(resolve(process.cwd(), root), pattern)
    ).filter((file) => retired.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
    const leftover = ALL_RETIRED.flatMap((id) =>
      readdirSync(resolve(process.cwd(), "dataset/source/afrik/peuples"))
        .map((family) =>
          resolve(
            process.cwd(),
            "dataset/source/afrik/peuples",
            family,
            `${id}.json`
          )
        )
        .filter((file) => existsSync(file))
    );
    expect(leftover).toEqual([]);
  });

  // @req REQ-178
  it.each(FOLDS.map((fold) => [fold.keeper, fold] as const))(
    "%s carries what only the retired fiche held",
    (_label, fold) => {
      const fiche = readPeople(fold.keeper);
      const { sources, ethnicities, languages, appellations } = fiche.content;
      const { sourceTitle, subGroup, dialect, exonym, isoCode, country } =
        fold.carried;

      expect(
        sources.map((source: { title: string }) => source.title)
      ).toContain(sourceTitle);
      if (subGroup) {
        expect(
          ethnicities.some((line: string) => line.includes(subGroup)),
          subGroup
        ).toBe(true);
      }
      if (dialect) {
        expect(
          languages.dialects.some((line: string) => line.includes(dialect)),
          dialect
        ).toBe(true);
      }
      if (exonym) expect(appellations.exonyms).toContain(exonym);
      if (isoCode) expect(languages.isoCodes).toContain(isoCode);
      if (country) expect(fiche.currentCountries).toContain(country);
    }
  );

  // @req REQ-178
  it.each(FOLDS.map((fold) => [fold.keeper] as const))(
    "%s cites each title and each locator once",
    (keeper) => {
      const { sources } = readPeople(keeper).content;
      const titles = sources.map((source: { title: string }) => source.title);
      const urls = sources
        .map((source: { url: string | null }) => source.url)
        .filter(Boolean)
        .map(locator);

      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(urls).size).toBe(urls.length);
    }
  );

  // « ladde » is the bush: Fulbe ladde are the herders who live there, not
  // the Fulbe at large, so the name belongs with the nomads.
  // @req REQ-178
  it("gives « Fulbe ladde » to the nomadic Fulbe, not to PPL_FULA", () => {
    const named = (keeper: string) =>
      readPeople(keeper).content.appellations.exonyms.some((name: string) =>
        /fulbe ladde/i.test(name)
      );

    expect(named("FLG_NIGERCONGO/PPL_FULA_NOMADES")).toBe(true);
    expect(named("FLG_ATLANTIQUE/PPL_FULA")).toBe(false);
  });

  // The pan-regional Tutsi fiche spoke for Rwanda, Congo and Uganda too; the
  // keeper is the Tutsi of Burundi, and the Rwandan Tutsi have their own fiche.
  // @req REQ-178
  it("keeps PPL_TUTSI_BURUNDI to Burundi and Kirundi", () => {
    const fiche = readPeople("FLG_BANTU/PPL_TUTSI_BURUNDI");

    expect(fiche.currentCountries).toEqual(["BDI"]);
    expect(fiche.content.languages.isoCodes).not.toContain("kin");
  });

  // @req REQ-178
  it("keeps every name-history account the Malawi Lomwe fiche had written", () => {
    const lomwe = readPeople("FLG_NIGERCONGO/PPL_LOMWE");
    const alomwe = accountsOf(lomwe, "Lomwe");
    const nguru = accountsOf(lomwe, "Nguru");

    expect(alomwe.some((account) => account.period.from === 1966)).toBe(true);
    expect(
      alomwe.some((account) => account.statement.includes("puissante tribu"))
    ).toBe(true);
    expect(nguru.some((account) => account.period.from === 1915)).toBe(true);
    expect(
      nguru.some((account) => account.statement.includes("main-d'œuvre"))
    ).toBe(true);
    expect(
      nguru.some(
        (account) =>
          account.period.from === 1943 && account.statement.includes("banni")
      )
    ).toBe(true);
  });

  // @req REQ-178
  it("links Ghana and Benin's Gurma to PPL_GOURMANTCHE", () => {
    expect(readCountry("GHA")).toContain('"PPL_GOURMANTCHE"');
    expect(readCountry("BEN")).toContain('"PPL_GOURMANTCHE"');
  });

  // @req REQ-178
  it("answers to « Lango », « Tshokwe », « Gurma » and « Kikongo » with the keeper, never the retired fiche", () => {
    const people = (query: string) =>
      resolveAfrikFiche(query)
        .filter((match) => match.kind === "people")
        .map((match) => match.id);

    expect(people("Lango")).toContain("PPL_LANGI");
    expect(people("Tshokwe")).toContain("PPL_CHOKWE");
    expect(people("Gurma")).toContain("PPL_GOURMANTCHE");
    expect(people("Kikongo")).toContain("PPL_KONGO");
    for (const query of ["Lango", "Tshokwe", "Gurma", "Kikongo", "Matabele"]) {
      expect(
        people(query).filter((id) => ALL_RETIRED.includes(id)),
        query
      ).toEqual([]);
    }
  });
});

describe("Ga-Dangme stays a grouping of the Ga and the Dangme", () => {
  // @req REQ-178
  it("is kept, with the decision recorded and no redirect", () => {
    const entry = retiredIdentifiers.find(
      (candidate) => candidate.retiredId === "PPL_GA_DANGME"
    );

    expect(existsSync(peopleFile("FLG_KWA/PPL_GA_DANGME"))).toBe(true);
    expect(entry).toMatchObject({
      decision: "kept-distinct",
      successorId: null,
      decidedOn: "2026-10-11",
    });
    expect(RETIRED_PEOPLE_IDS.PPL_GA_DANGME).toBeUndefined();
  });

  // A grouping has no history of its own: its peoples' histories are on
  // their fiches, and it sends the reader there.
  // @req REQ-178
  it("tells no history of its own and points to the Ga and Dangme fiches", () => {
    const grouping = readPeople("FLG_KWA/PPL_GA_DANGME");
    const { origins, historicalRole, ethnicities } = grouping.content;

    expect(grouping.nameHistory).toBeUndefined();
    expect(origins.ancientOrigins).toBeNull();
    expect(origins.migrationRoutes).toEqual([]);
    expect(historicalRole.kingdomsOrChiefdoms).toBeNull();
    expect(ethnicities).toHaveLength(2);
    expect(ethnicities[0]).toMatch(/^Ga\b.*fiche Ga\b/);
    expect(ethnicities[1]).toMatch(/^Dangme\b.*fiche Dangme\b/);
  });
});
