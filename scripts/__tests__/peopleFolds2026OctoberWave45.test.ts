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
    sourceTitle?: string;
    subGroup?: string;
    dialect?: string;
    exonym?: string;
    isoCode?: string;
    country?: string;
  };
}

const FOLDS: Fold[] = [
  {
    retired: ["PPL_SENA_MOZ", "PPL_SENA_ZAMB"],
    keeper: "FLG_NIGERCONGO/PPL_SENA",
    carried: {
      sourceTitle: "Central Statistical Office Zambia — Census 2022",
      subGroup: "Sena de la province Orientale de Zambie",
      dialect: "Cisena de la Zambezia",
      country: "ZMB",
    },
  },
  {
    retired: ["PPL_NDAU_MOZ", "PPL_NDAU_ZIM"],
    keeper: "FLG_NIGERCONGO/PPL_NDAU",
    carried: {
      sourceTitle: "CITE Zimbabwe — The Ndau people of Zimbabwe",
      subGroup: "Ndau de Machaze",
      dialect: "Chimanimani",
    },
  },
  {
    retired: ["PPL_KONGO_BRAZZA"],
    keeper: "FLG_BANTU/PPL_KONGO",
    carried: {
      sourceTitle: "Minority Rights Group International — Republic of Congo",
      subGroup: "Kamba / Hangala",
      exonym: "Bacongo",
      isoCode: "vif",
    },
  },
  {
    retired: ["PPL_GIO"],
    keeper: "FLG_MANDE/PPL_DAN",
    carried: {
      sourceTitle: "Liberia Population and Housing Census 2022 – LISGIS",
      subGroup: "Gio (Dan du Liberia",
      exonym: "Yakouba",
    },
  },
  {
    retired: ["PPL_HUMBE"],
    keeper: "FLG_NIGERCONGO/PPL_NKHUMBI",
    carried: {
      sourceTitle:
        "Glottolog 5.3 – Nkhumbi, glottolog.org/resource/languoid/id/nkhu1238 (2025)",
      exonym: "Otjingumbi",
    },
  },
  {
    retired: ["PPL_MANYIKA_ZIM"],
    keeper: "FLG_NIGERCONGO/PPL_MANYIKA",
    carried: {
      sourceTitle: "Joshua Project — Manyika in Zimbabwe",
      subGroup: "VaWahwesa",
      exonym: "ChiManyika speakers",
    },
  },
  {
    retired: ["PPL_AZANDE_SUD"],
    keeper: "FLG_SOUDANIQUECENTRAL/PPL_ZANDE",
    carried: {
      sourceTitle: "Joshua Project — Azande in South Sudan",
      subGroup: "Mbomu",
      dialect: "Makaraka",
      exonym: "Bazende",
    },
  },
  {
    retired: ["PPL_AGNI"],
    keeper: "FLG_KWA/PPL_ANYI",
    carried: {
      sourceTitle: "DICE Missouri - Agni (Anyin) database",
      subGroup: "Agni-Diabe",
      dialect: "Anyin du Ghana",
      exonym: "Anya",
    },
  },
  {
    retired: ["PPL_MAKONDE_MOZ", "PPL_MAKONDE_TANZ"],
    keeper: "FLG_BANTU/PPL_MAKONDE",
    carried: {
      sourceTitle: "Museu do Aljube — Mueda Plateau Meeting 1960",
      subGroup: "Makonde installés à Dar es Salaam",
      dialect: "Kimakonde de Lindi",
      exonym: "Kimakonde",
    },
  },
  {
    retired: ["PPL_TEDA"],
    keeper: "FLG_SAHARIEN/PPL_TOUBOU",
    carried: {
      sourceTitle: "Britannica — Teda people",
      subGroup: "Teda du Kawar",
      exonym: "Tubu",
    },
  },
  {
    retired: ["PPL_KUNG"],
    keeper: "FLG_KXA/PPL_JUHOANSI",
    carried: {
      sourceTitle: "SIL Ethnologue — Kx'a language subgroup",
      subGroup: "Okongo !Xun",
      dialect: "Kung-Ekoka",
      exonym: "!Kung",
      isoCode: "kxu",
      country: "AGO",
    },
  },
  {
    retired: ["PPL_LWENA"],
    keeper: "FLG_BANTU/PPL_LUVALE",
    carried: {
      sourceTitle: "Glottolog — Luvale (luva1239)",
      subGroup: "Lwena",
      dialect: "Lovale",
    },
  },
  {
    // Everything but one clan name and one plural was already the keeper's.
    retired: ["PPL_KOREKORE_ZIM"],
    keeper: "FLG_NIGERCONGO/PPL_KOREKORE",
    carried: { subGroup: "Tande", exonym: "VaKorekore" },
  },
  {
    retired: ["PPL_TSWA_MOZ", "PPL_TSWA_CALANGA"],
    keeper: "FLG_NIGERCONGO/PPL_TSWA",
    carried: {
      sourceTitle: "CLEAR Global — Language data for Mozambique (2024)",
      subGroup: "Vatswa urbanises de Maputo",
      exonym: "Batswa",
    },
  },
  {
    retired: ["PPL_ABRON"],
    keeper: "FLG_KWA/PPL_BONO",
    carried: {
      sourceTitle:
        "Terray, Emmanuel - A History of the Abron Kingdom of Gyaman, Michigan State University, 1980",
    },
  },
  {
    retired: ["PPL_KULLO"],
    keeper: "FLG_OMOTIQUE/PPL_DAWRO",
    carried: {
      sourceTitle:
        "The Case of the Dawro in Ethiopia – Jimma University Journals, 2021",
      dialect: "Kucha",
      exonym: "Dawaro",
    },
  },
  {
    retired: ["PPL_LUNDA_NORTE"],
    keeper: "FLG_BANTU/PPL_LUNDA",
    carried: {
      sourceTitle: "Country Studies — Angola, Lunda-Chokwe",
      subGroup: "Minungu",
      dialect: "Komungo",
    },
  },
  {
    retired: ["PPL_RONGA_MOZ"],
    keeper: "FLG_NIGERCONGO/PPL_RONGA",
    carried: {
      sourceTitle:
        "Instituto Nacional de Estatistica de Mocambique — www.ine.gov.mz",
      subGroup: "Varhonga de Gaza",
    },
  },
  {
    retired: ["PPL_ATTIE"],
    keeper: "FLG_KWA/PPL_AKYE",
    carried: {
      sourceTitle:
        "UNESCO : Les savoir-faire liés à la fabrication de l'attiéké (2024)",
      subGroup: "Bodins",
      dialect: "Dialecte Kétin",
      exonym: "Atché",
    },
  },
  {
    // A classification category, not a people: only what names the Luo of
    // Kenya is carried; a Suba fiche is a separate follow-up.
    retired: ["PPL_LUO_BANTU"],
    keeper: "FLG_NILOTIQUE/PPL_LUO",
    carried: { sourceTitle: "Britannica — Luo people" },
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

describe("duplicate people fiches of waves 4 and 5 folded on 2026-10-11", () => {
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

      if (sourceTitle) {
        expect(
          sources.map((source: { title: string }) => source.title)
        ).toContain(sourceTitle);
      }
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

  // The Calanga fiche spoke of the Kalanga of Zimbabwe and Botswana as well as
  // the Tswa: that name goes to the Kalanga fiche, which already cites the
  // Calanga fiche's Kalanga source, and Botswana stays off the Tswa keeper.
  // @req REQ-178
  it("gives the Calanga name to PPL_KALANGA, not PPL_TSWA", () => {
    const kalanga = readPeople("FLG_BANTU/PPL_KALANGA");
    const tswa = readPeople("FLG_NIGERCONGO/PPL_TSWA");

    expect(kalanga.content.appellations.exonyms).toContain("Calanga");
    expect(tswa.content.appellations.exonyms).not.toContain("Calanga");
    expect(tswa.currentCountries).not.toContain("BWA");
  });

  // The « attrapé » etymology rests on popular sites only.
  // @req REQ-178
  it("does not carry the « attrapé » etymology to PPL_AKYE", () => {
    const text = JSON.stringify(readPeople("FLG_KWA/PPL_AKYE"));

    expect(text).not.toMatch(/attrap/i);
  });

  // @req REQ-178
  it("gives PPL_ABRON its own ledger entry", () => {
    const entry = retiredIdentifiers.find(
      (candidate) => candidate.retiredId === "PPL_ABRON"
    );

    expect(entry).toMatchObject({
      decision: "merged",
      successorId: "PPL_BONO",
    });
  });

  // @req REQ-178
  it("links Mozambique, Congo and Liberia to the keepers", () => {
    expect(readCountry("MOZ")).toContain('"PPL_SENA"');
    expect(readCountry("MOZ")).toContain('"PPL_MAKONDE"');
    expect(readCountry("COG")).toContain('"PPL_KONGO"');
    expect(readCountry("LBR")).toContain('"PPL_DAN"');
  });

  // Nine queries over the whole corpus: under a full parallel run this
  // outlasts the default five seconds.
  // @req REQ-178
  it("answers to « Gio », « Teda », « !Kung », « Lwena » and « Kullo » with the keeper, never the retired fiche", () => {
    const people = (query: string) =>
      resolveAfrikFiche(query)
        .filter((match) => match.kind === "people")
        .map((match) => match.id);

    expect(people("Gio")).toContain("PPL_DAN");
    expect(people("!Kung")).toContain("PPL_JUHOANSI");
    expect(people("Lwena")).toContain("PPL_LUVALE");
    expect(people("Kullo")).toContain("PPL_DAWRO");
    expect(people("Agni")).toContain("PPL_ANYI");
    for (const query of [
      "Gio",
      "Teda",
      "!Kung",
      "Lwena",
      "Kullo",
      "Agni",
      "Humbe",
      "Abron",
      "Attié",
    ]) {
      expect(
        people(query).filter((id) => ALL_RETIRED.includes(id)),
        query
      ).toEqual([]);
    }
  }, 30_000);
});
