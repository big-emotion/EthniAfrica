import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

interface EditorialSource {
  title?: string;
}

interface PeopleFiche {
  id: string;
  nameMain: string;
  languageFamilyId: string;
  currentCountries: string[];
  classificationStatus?: string;
  content: {
    appellations: {
      exonyms: string[];
      linguisticFamily?: string;
      whyProblematic?: string;
    };
    origins: {
      unificationsOrDivisions: string;
    };
    languages: {
      isoCodes: string[];
    };
    demography: {
      totalPopulation: number | null;
      referenceYear: number;
      distributionByCountry: Array<{
        country: string;
        population: number | null;
        percentage: number | null;
      }>;
    };
    sources: EditorialSource[];
  };
}

interface CountryPeopleEntry {
  peopleId?: string | null;
  languageFamily?: string | null;
  population?: number | null;
  percentageInCountry?: number | null;
  mainLanguageCode?: string;
}

interface CountryFiche {
  content: {
    majorPeoples: CountryPeopleEntry[];
    demographics: {
      peoples: CountryPeopleEntry[];
    };
    culture?: {
      mainLanguages?: Array<{ name?: string; isoCode?: string }>;
    };
  };
}

function readJson<T>(relativePath: string): T {
  const absolutePath = resolve(root, relativePath);
  expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

describe("AFRIK editorial corrections from community review", () => {
  // @req REQ-023
  it("documents Minyanka as a discoverable people without inventing demographics", () => {
    const minyanka = readJson<PeopleFiche>(
      "dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_MINYANKA.json"
    );
    const mali = readJson<CountryFiche>("dataset/source/afrik/pays/MLI.json");

    expect(minyanka).toMatchObject({
      id: "PPL_MINYANKA",
      nameMain: "Minyanka",
      languageFamilyId: "FLG_NIGERCONGO",
      currentCountries: expect.arrayContaining(["MLI", "BFA"]),
      content: {
        languages: {
          isoCodes: ["myk"],
        },
        demography: {
          totalPopulation: null,
          referenceYear: 2025,
        },
      },
    });
    expect(minyanka.content.appellations.exonyms).toEqual(
      expect.arrayContaining(["Mianka", "Minianka", "Mamara"])
    );
    expect(minyanka.content.demography.distributionByCountry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          country: "MLI",
          population: null,
          percentage: null,
        }),
      ])
    );
    expect(
      mali.content.majorPeoples.find(
        (people) => people.peopleId === "PPL_MINYANKA"
      )
    ).toMatchObject({ languageFamily: "FLG_NIGERCONGO" });
    expect(
      mali.content.demographics.peoples.find(
        (people) => people.peopleId === "PPL_MINYANKA"
      )
    ).toMatchObject({
      population: null,
      percentageInCountry: null,
    });
    expect(
      mali.content.demographics.peoples.find(
        (people) => people.peopleId === "PPL_MINYANKA"
      )?.mainLanguageCode
    ).toBe("myk");

    const percentageTotal = mali.content.demographics.peoples.reduce(
      (total, people) => total + (people.percentageInCountry ?? 0),
      0
    );
    expect(percentageTotal).toBe(100);
  });

  // @req REQ-023
  it("classifies the Liberian Bassa consistently in the Kru family", () => {
    const bassa = readJson<PeopleFiche>(
      "dataset/source/afrik/peuples/FLG_KROU/PPL_BASSA.json"
    );
    const liberia = readJson<CountryFiche>(
      "dataset/source/afrik/pays/LBR.json"
    );
    const serializedLiberia = JSON.stringify(liberia);

    expect(
      existsSync(
        resolve(root, "dataset/source/afrik/peuples/FLG_MANDE/PPL_BASSA.json")
      )
    ).toBe(false);
    expect(bassa.languageFamilyId).toBe("FLG_KROU");
    expect(bassa.content.appellations.linguisticFamily).toBe("FLG_KROU");
    expect(bassa.content.appellations.whyProblematic).not.toContain(
      "afro-asiatique"
    );
    expect(serializedLiberia).not.toContain("PPL_BASSA_LIBERIA");

    const countryEntries = [
      ...liberia.content.majorPeoples,
      ...liberia.content.demographics.peoples,
    ].filter((people) => people.peopleId === "PPL_BASSA");
    expect(countryEntries).toHaveLength(2);
    expect(
      countryEntries.every((people) => people.languageFamily === "FLG_KROU")
    ).toBe(true);

    const demographicCsv = readFileSync(
      resolve(root, "public/peuple_demographie_globale.csv"),
      "utf8"
    );
    expect(demographicCsv).not.toContain("PPL_BASSA,BASSA,FLG_MANDE");
  });

  // @req REQ-023
  it("uses the documented Bété codes and preserves the Bété-Dida distinction", () => {
    const bete = readJson<PeopleFiche>(
      "dataset/source/afrik/peuples/FLG_KROU/PPL_BETE.json"
    );
    const dida = readJson<PeopleFiche>(
      "dataset/source/afrik/peuples/FLG_KROU/PPL_DIDA.json"
    );
    const coteDIvoire = readJson<CountryFiche>(
      "dataset/source/afrik/pays/CIV.json"
    );
    const serializedBete = JSON.stringify(bete);
    const serializedCountry = JSON.stringify(coteDIvoire);

    expect(bete.content.languages.isoCodes).toEqual(["bev", "bet", "btg"]);
    expect(serializedBete).not.toMatch(/\b(?:byf|beb|btv)\b/);
    expect(serializedCountry).not.toMatch(/\b(?:byf|beb|btv)\b/);
    expect(dida.content.languages.isoCodes).toEqual(["dic", "gud"]);
    expect(dida.classificationStatus).toBe("colonial-legacy");
    expect(bete.content.origins.unificationsOrDivisions).toContain("Dida");
    expect(dida.content.appellations.whyProblematic).toContain("Gagnoa");
    expect(
      bete.content.sources.some((source) => source.title?.includes("Dozon"))
    ).toBe(true);
    expect(
      dida.content.sources.some((source) => source.title?.includes("Dozon"))
    ).toBe(true);

    const beteLanguage = coteDIvoire.content.culture?.mainLanguages?.find(
      (language) => language.name === "Bété"
    );
    expect(beteLanguage?.isoCode).toBe("btg");

    const demographicCsv = readFileSync(
      resolve(root, "public/peuple_demographie_globale.csv"),
      "utf8"
    );
    expect(demographicCsv).not.toContain("PPL_BETE,Bété,FLG_NIGERCONGO");
    expect(demographicCsv).not.toContain("PPL_DIDA,Dida,FLG_NIGERCONGO");
  });
});

interface TogoFiche {
  content: {
    historicalFacts: { independenceStruggle: string; postIndependence: string };
  };
  summary: string;
  etymology: string;
  nameOriginActor: string;
  nameHistory: {
    names: Array<{ accounts: Array<{ statement: string }> }>;
  };
}

// The Togo episode (pays-20, 26 October 2026) compared the fiche with its
// sources: the name first designated a lakeside locality, its first meaning
// stays disputed, and no source names who coined it.
describe("AFRIK Togo fiche, name history", () => {
  const togo = () => readJson<TogoFiche>("dataset/source/afrik/pays/TGO.json");

  // @req REQ-023
  it("does not give the name one settled meaning or one namer", () => {
    const { summary, etymology, nameOriginActor } = togo();

    expect(summary).not.toContain("au-delà de l'eau");
    expect(summary).toContain("1884");
    expect(etymology).toContain("plusieurs lectures");
    expect(etymology).not.toContain("viendrait de");
    expect(nameOriginActor).not.toContain("nommé par les peuples locaux");
    expect(nameOriginActor).toContain("ne donnent pas le nom");
  });

  // @req REQ-023
  it("keeps the German adoption after the locality, not before it", () => {
    const { etymology, nameOriginActor } = togo();

    expect(etymology).not.toContain("officialisé par les colonisateurs");
    expect(nameOriginActor).not.toContain("officialisé par les colonisateurs");
  });

  // @req REQ-023
  it("dates Olympio's presidency from 1961, not from independence", () => {
    const { independenceStruggle, postIndependence } =
      togo().content.historicalFacts;

    expect(independenceStruggle).not.toContain("devient premier président");
    expect(independenceStruggle).toContain("premier ministre");
    expect(postIndependence).toContain(
      "présidence de Sylvanus Olympio (1961-1963"
    );
  });

  // @req REQ-023
  it("gives Olympio's office on independence day, prime minister", () => {
    const statement = togo().nameHistory.names[0].accounts[0].statement;

    expect(statement).toContain("Sylvanus Olympio");
    expect(statement).toContain("premier ministre");
    expect(statement).not.toContain("premier président");
  });
});

interface ZaireAccount {
  statement: string;
  formAsWritten?: string;
  hypothesisGroup?: string;
  actors?: Array<{ name: string; role: string }>;
}

interface CongoKinshasaFiche {
  nameHistory: {
    summary: string;
    names: Array<{ accounts: ZaireAccount[] }>;
  };
}

interface PeopleOrigins {
  content: {
    origins: {
      ancientOrigins: string;
      majorHistoricalEvents: string;
      migrationRoutes: string[];
    };
  };
}

// The Zaïre episode (2026-10-21-zaire-1971-exceptionnel, approved on
// 26 October 2026) compared the fiches with their sources: the state took the
// name on 27 October 1971, the word is centuries older, its nzadi reading has
// more than one attributed source, and Zaïre is not the country's name today.
describe("AFRIK Zaïre name history", () => {
  const congoKinshasa = () =>
    readJson<CongoKinshasaFiche>("dataset/source/afrik/pays/COD.json");
  const zaireAccounts = () => congoKinshasa().nameHistory.names[1].accounts;
  const peopleOrigins = (path: string) =>
    readJson<PeopleOrigins>(`dataset/source/afrik/peuples/${path}`).content
      .origins;

  // @req REQ-023
  it("says who chose the state name, and that the word is older", () => {
    const { summary } = congoKinshasa().nameHistory;

    expect(summary).toContain("choisi le 27 octobre 1971");
    expect(summary).toContain("dès le XVIe siècle");
    expect(summary).toContain("Isidore Ndaywel è Nziem");
  });

  // @req REQ-023
  it("records the 1971 decision with its actors and the steps that followed", () => {
    const decision = zaireAccounts().find((account) =>
      account.statement.includes("le 27 octobre 1971 : ce jour-là")
    );

    expect(decision?.actors?.map((actor) => actor.name)).toEqual([
      "Bureau politique du Mouvement populaire de la révolution",
      "Joseph-Désiré Mobutu",
    ]);
    expect(decision?.statement).toContain("promulgue le 29");
  });

  // @req REQ-023
  it("keeps the earlier accounts first and adds the older written forms", () => {
    const accounts = zaireAccounts();

    expect(accounts).toHaveLength(11);
    expect(accounts[3].formAsWritten).toBe("Enzaze");
    expect(accounts.map((account) => account.formAsWritten)).toContain(
      "Rio Zayre"
    );
    expect(
      accounts.some((account) => account.statement.includes("24 juin 1967"))
    ).toBe(true);
  });

  // @req REQ-023
  it("leaves the origin of the word as three attributed readings", () => {
    const readings = zaireAccounts().filter(
      (account) => account.hypothesisGroup === "origine du nom Zaïre"
    );

    expect(readings).toHaveLength(3);
    expect(readings.at(-1)?.statement).toContain("Rien ne montre");
  });

  // @req REQ-023
  it("does not call the country Zaïre before 1971 or after 1997", () => {
    const ngbande = peopleOrigins(
      "FLG_SOUDANIQUECENTRAL/PPL_NGBANDE.json"
    ).majorHistoricalEvents;
    const bakigaRoute = peopleOrigins("FLG_NIGERCONGO/PPL_BAKIGA.json")
      .migrationRoutes[1];
    const zande = peopleOrigins(
      "FLG_SOUDANIQUECENTRAL/PPL_ZANDE.json"
    ).ancientOrigins;

    expect(ngbande).not.toContain("prend le pouvoir au Zaïre");
    expect(ngbande).toContain("qui devient le Zaïre en 1971");
    expect(bakigaRoute).not.toContain("Zaire actuel");
    expect(bakigaRoute).toContain("actuelle République démocratique du Congo");
    expect(zande).not.toContain("Zaire actuel");
    expect(zande).toContain("de l'actuelle République démocratique du Congo");
  });
});
