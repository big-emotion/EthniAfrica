import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

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
  };
}

const FOLDS: Fold[] = [
  {
    retired: ["PPL_SOTHO_SUD", "PPL_SESOTHO_NATL"],
    keeper: "FLG_BANTU/PPL_SOTHO",
    carried: {
      sourceTitle: "Mofolo, Thomas. Chaka. Morija Sesuto Book Depot, 1925",
      subGroup: "Basotho du Gauteng",
      dialect: "Serolong",
      exonym: "Basutho",
    },
  },
  {
    retired: ["PPL_SETSWANA_NATL"],
    keeper: "FLG_BANTU/PPL_TSWANA",
    carried: {
      sourceTitle: "South African History Online — Tswana",
      subGroup: "BaTlokwa",
      dialect: "Sepitori",
      exonym: "Beetjuana",
    },
  },
  {
    retired: ["PPL_ZULU_KWA_ZULU"],
    keeper: "FLG_BANTU/PPL_ZULU",
    carried: {
      sourceTitle: "South African History Online — Inkatha Freedom Party",
      subGroup: "Usuthu",
      dialect: "Zululand Zulu",
    },
  },
  {
    retired: ["PPL_XHOSA_CISKEI"],
    keeper: "FLG_BANTU/PPL_XHOSA",
    carried: {
      sourceTitle: "South African History Online — Ciskei",
      subGroup: "amaGqunukhwebe",
      dialect: "isiMfengu",
    },
  },
  {
    retired: ["PPL_ASHANTI"],
    keeper: "FLG_KWA/PPL_ASANTE",
    carried: {
      sourceTitle:
        "McCaskie, T. C. – State and Society in Pre-colonial Asante, Cambridge University Press, 1995",
    },
  },
  {
    retired: ["PPL_DAGAABA"],
    keeper: "FLG_GUR/PPL_DAGARA",
    carried: {
      sourceTitle: "Craven, A. – The Pottery of Northern Ghana, 1975",
      exonym: "Dagaare",
    },
  },
  {
    retired: ["PPL_KONGO_SUD"],
    keeper: "FLG_BANTU/PPL_KONGO",
    carried: {
      sourceTitle: "VCU Scholars Compass — Transformation of Kongo Minkisi",
      subGroup: "Manianga",
      dialect: "Kintandu",
      isoCode: "kng",
    },
  },
  {
    retired: ["PPL_UMBUNDU"],
    keeper: "FLG_NIGERCONGO/PPL_OVIMBUNDU",
    carried: {
      sourceTitle: "Joshua Project – Ovimbundu, Umbundu in Angola",
    },
  },
  {
    retired: ["PPL_TONGA_LAC"],
    keeper: "FLG_NIGERCONGO/PPL_TONGA_MALA",
    carried: {
      sourceTitle: "Encyclopedia.com — Lakeshore Tonga",
      subGroup: "mphara",
      exonym: "Siska",
    },
  },
  {
    retired: ["PPL_HUTU_BURUNDI"],
    keeper: "FLG_NIGERCONGO/PPL_KIRUNDI_HUTU",
    carried: {
      sourceTitle:
        "Accord d'Arusha pour la Paix et la Réconciliation au Burundi, 2000",
      subGroup: "Bafumbira",
      dialect: "Kinyabwisha",
      exonym: "Wahutu",
    },
  },
  {
    retired: ["PPL_SWAHILI_KENYA", "PPL_SWAHILI_TANZANIE"],
    keeper: "FLG_BANTU/PPL_SWAHILI",
    carried: {
      sourceTitle:
        "UNESCO World Heritage Centre — Ruins of Kilwa Kisiwani and Ruins of Songo Mnara",
      subGroup: "Tumbatu",
      dialect: "Kibajuni",
      exonym: "Zanzibari",
      isoCode: "swh",
    },
  },
  {
    retired: ["PPL_BRONG"],
    keeper: "FLG_KWA/PPL_BONO",
    carried: {
      sourceTitle: "SIL Ethnologue — Abron language [abr]",
      subGroup: "Gyaman",
      exonym: "Akan piesie (premiers Akan)",
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

function readKeeper(relativePath: string) {
  return JSON.parse(readFileSync(peopleFile(relativePath), "utf8"));
}

// A locator cited with and without its trailing slash is still one locator.
function locator(url: string): string {
  return url.replace(/\/+$/, "");
}

describe("duplicate people fiches folded on 2026-10-10", () => {
  // @req REQ-178
  it.each(FOLDS.map((fold) => [fold.retired.join(", "), fold] as const))(
    "redirects %s to its keeper in one hop",
    (_label, fold) => {
      const keeperId = fold.keeper.split("/")[1];
      for (const retired of fold.retired) {
        expect(RETIRED_PEOPLE_IDS[retired], retired).toBe(keeperId);
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
      const fiche = readKeeper(fold.keeper);
      const { sources, ethnicities, languages, appellations } = fiche.content;
      const { sourceTitle, subGroup, dialect, exonym, isoCode } = fold.carried;

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
    }
  );

  // @req REQ-178
  it.each(FOLDS.map((fold) => [fold.keeper] as const))(
    "%s cites each title and each locator once",
    (keeper) => {
      const { sources } = readKeeper(keeper).content;
      const titles = sources.map((source: { title: string }) => source.title);
      const urls = sources
        .map((source: { url: string | null }) => source.url)
        .filter(Boolean)
        .map(locator);

      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(urls).size).toBe(urls.length);
    }
  );

  // Barundi is every Burundian's name and the autonym PPL_RUNDI documents;
  // carried onto the Hutu fiche it would make the Hutu answer to it.
  // @req REQ-178
  it("does not carry Barundi onto the Hutu fiche", () => {
    const { exonyms } = readKeeper("FLG_NIGERCONGO/PPL_KIRUNDI_HUTU").content
      .appellations;

    expect(exonyms.some((name: string) => /barundi/i.test(name))).toBe(false);
  });

  // @req REQ-178
  it("answers to « Ashanti », « Umbundu » and « Brong » with the keeper, never the retired fiche", () => {
    const people = (query: string) =>
      resolveAfrikFiche(query)
        .filter((match) => match.kind === "people")
        .map((match) => match.id);

    expect(people("Ashanti")).toContain("PPL_ASANTE");
    expect(people("Umbundu")).toContain("PPL_OVIMBUNDU");
    expect(people("Brong")).toContain("PPL_BONO");
    for (const query of ["Ashanti", "Umbundu", "Brong", "Dagaaba", "Wahutu"]) {
      expect(
        people(query).filter((id) => ALL_RETIRED.includes(id)),
        query
      ).toEqual([]);
    }
  });
});

describe("Khoikhoi and Hottentot belong to PPL_KHOIKHOI, not the Khoe macro-group", () => {
  // The macro-group names a language grouping with no community of its own;
  // the two names belong to the people who were called by them. The macro
  // keeps « Khoi », which a search for « Khoikhoi » still reaches by the
  // looser plural rule, so only the names it declares are held here.
  // @req REQ-178
  it.each(["Khoikhoi", "Hottentot"])(
    "« %s » is declared by PPL_KHOIKHOI and no longer by PPL_KHOE_MACRO",
    (query) => {
      const declaredBy = resolveAfrikFiche(query)
        .filter(
          (match) =>
            match.kind === "people" &&
            (match.matchType === "exact" || match.matchType === "contains")
        )
        .map((match) => match.id);

      expect(declaredBy).toContain("PPL_KHOIKHOI");
      expect(declaredBy).not.toContain("PPL_KHOE_MACRO");
    }
  );

  // @req REQ-178
  it("keeps both fiches", () => {
    expect(existsSync(peopleFile("FLG_KHOE/PPL_KHOE_MACRO"))).toBe(true);
    expect(existsSync(peopleFile("FLG_KHOE/PPL_KHOIKHOI"))).toBe(true);
  });
});
