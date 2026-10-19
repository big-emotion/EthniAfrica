import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { nameRecordsFromHistory } from "../../src/lib/afrik/nameHistoryRecords";
import { parseNameHistory } from "../../src/lib/afrik/parsers/nameHistoryParser";
import { parsePatronymeFile } from "../../src/lib/afrik/parsers/patronymeParser";

// The additions the operator approved on 2026-10-18 from the questions of
// waves 24 and 25 of the long tail (ETNI-2011): names and fiches a source
// opened for this pass could carry. Each case reads what a reader would get.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");

const BLENCH_ATLAS_URL =
  "https://web.archive.org/web/20250528003305/https://www.rogerblench.info/Language/Africa/Nigeria/Atlas%20of%20Nigerian%20Languages%202020.pdf";
const SNL_GUR_URL = "https://snl.no/gurspr%C3%A5k";
const NISR_2025_URL =
  "https://statistics.gov.rw/sites/default/files/documents/2026-07/CRVS%20%20BOOKLET%202025%20FINAL.pdf";
const LIENHARDT_1988_URL =
  "https://ora.ox.ac.uk/objects/uuid%3A29267519-7f9c-46c7-826d-75f043d7ce60";
const SELIGMAN_1932_URL = "https://archive.org/details/in.ernet.dli.2015.57118";
const DULLEY_2021_URL = "https://doi.org/10.1017/S0001972021000553";
const CONGO_GAZETTE_2024_URL =
  "https://www.sgg.cg/JO/2024/congo-jo-2024-49.pdf";
const DENNETT_1898_URL =
  "https://archive.org/details/notesonfolkloreo00dennuoft";
const MOLONY_2014_URL = "https://books.google.com/books?id=qDE3BAAAQBAJ";
const AMBRONN_1906_URL =
  "https://archive.org/details/mitteilungen-von-forschungsreisenden-und-gelehrten-aus-den_1906";
const TESSMANN_1913_URL = "https://archive.org/details/diepangwevlkerku01tess";
const ORSTOM_HAUT_NYONG_1968_URL =
  "https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers15-04/02870.pdf";

interface Source {
  title: string;
  url: string | null;
  page?: string;
  notes?: string;
  source_kind?: string;
  sourceKey?: string;
}

interface Account {
  period: { from: number | null; to: number | null; label: string };
  era?: string;
  statement: string;
  aspect?: string;
  birth?: true;
  formAsWritten?: string;
  hypothesisGroup?: string;
  sources: Source[];
}

interface NameEntry {
  nameText: string;
  selfGiven: boolean;
  namedBy: string | null;
  periodLabel?: string;
  variantSpelling?: true;
  accounts: Account[];
}

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(AFRIK, relativePath), "utf8"));
}

const readPatronyme = (id: string) => readJson(`patronymes/${id}.json`);

function nameOf(fiche: { nameHistory: { names: NameEntry[] } }, text: string) {
  const entry = fiche.nameHistory.names.find(
    (candidate) => candidate.nameText === text
  );
  if (!entry) throw new Error(`no name « ${text} »`);
  return entry;
}

function citesUrl(account: Account, url: string) {
  return account.sources.some((source) => source.url === url);
}

function sourceRefsFor(fiche: { sources: Source[] }, url: string) {
  return fiche.sources
    .filter((source) => source.url === url)
    .map((source) => source.sourceKey);
}

describe("the oral verification list after waves 24 and 25", () => {
  const doc = () =>
    readFileSync(
      resolve(ROOT, "docs/editorial/strategy/self-names-to-verify-orally.md"),
      "utf8"
    );

  // @req REQ-178
  it("adds Baka and Bedzan, and Winye, to the names to check orally, and no name nobody approved", () => {
    const section = doc().split("## Waves 24 and 25 of the long tail")[1];

    expect(section).toBeDefined();
    for (const expected of [
      "`PPL_PYGMEES_AUTOCHTONES`",
      "Baka",
      "Bedzan",
      "`PPL_WIYANA`",
      "Winye",
    ]) {
      expect(section).toContain(expected);
    }
    expect(section).not.toContain("`PPL_JARAWA`");
  });
});

describe("PPL_JARAWA after reading Blench's Atlas of Nigerian Languages", () => {
  const jarawa = () => readJson("peuples/FLG_TCHADIQUE/PPL_JARAWA.json");

  // Zhar is the speakers' name for their language (the Atlas's field 1.B),
  // not a name of the people: as a name block beside selfNameUnknown it
  // could only be typed an outside name, which it is not.
  // @req REQ-178
  it("keeps the self-name unknown and publishes no Zhar name: the Atlas names the language, not the people", () => {
    const fiche = jarawa();
    const parsed = parseNameHistory(fiche.nameHistory);

    expect(parsed.success).toBe(true);
    expect(fiche.nameHistory.selfNameUnknown).toBe(true);
    expect(
      nameRecordsFromHistory(parsed.data).map((record) => record.nameText)
    ).not.toContain("Zhar");
  });

  // @req REQ-178
  it("tells, after the Atlas, that Jarawa is a Hausa name and that Bankal speakers call their language Zhar", () => {
    const account = nameOf(jarawa(), "Jarawa").accounts.find((candidate) =>
      citesUrl(candidate, BLENCH_ATLAS_URL)
    );

    expect(account?.statement).toMatch(/haoussa/);
    expect(account?.statement).toMatch(/Zhar/);
    expect(account?.sources[0].page).toBe("pp. 48-49");
  });

  // @req REQ-178
  it("lists the Atlas once among the fiche's sources", () => {
    const atlas = jarawa().content.sources.filter(
      (source: Source) => source.url === BLENCH_ATLAS_URL
    );

    expect(atlas).toHaveLength(1);
    expect(atlas[0].source_kind).toBe("linguistic_reference");
  });
});

describe("FLG_GUR takes the Krause hypothesis", () => {
  // @req REQ-196
  it("tells it as Rolf Theil's attributed explanation, cited as on the Gur macro fiche", () => {
    const family = readJson("famille_linguistique/FLG_GUR.json");
    const macro = readJson("peuples/FLG_GUR/PPL_GUR_MACRO.json");
    const krause = (fiche: { nameHistory: { names: NameEntry[] } }) =>
      nameOf(fiche, "Gur").accounts.find(
        (account) => !account.birth && citesUrl(account, SNL_GUR_URL)
      );

    const account = krause(family);
    expect(account?.statement).toMatch(/viendrait/);
    expect(account?.statement).toMatch(/Krause/);
    expect(account?.statement).toMatch(/1895/);
    expect(account?.sources[0].title).toBe(krause(macro)?.sources[0].title);
    expect(family.nameHistory.summary).not.toMatch(/n'expliquent pas/);
    expect(parseNameHistory(family.nameHistory).success).toBe(true);
  });

  // The 1895 trace is reported, not read: the operator rules whether it may
  // be a birth (name-history-priority-core.md), so 1927 stays the birth and
  // says what it is, and the namer credits neither man alone.
  // @req REQ-196
  it("keeps 1927 as the oldest trace read, beside Krause's reported 1895 proposal", () => {
    const gur = nameOf(readJson("famille_linguistique/FLG_GUR.json"), "Gur");
    const birth = gur.accounts.find((account) => account.birth);

    expect(birth?.period.from).toBe(1927);
    expect(birth?.statement).not.toMatch(/que le projet connaît/);
    expect(birth?.statement).toMatch(/que nous avons lue/);
    expect(birth?.statement).toMatch(/Krause/);
    expect(birth?.statement).toMatch(/1895/);
    expect(gur.periodLabel).not.toMatch(/^Depuis 1927/);
    expect(gur.namedBy).toMatch(/Westermann/);
    expect(gur.namedBy).toMatch(/Krause/);
  });
});

describe("PAT_IRAKOZE in Rwanda", () => {
  const irakoze = () => readPatronyme("PAT_IRAKOZE");

  // @req REQ-141
  it("attests Rwanda on the national statistics of 2025", () => {
    const fiche = irakoze();
    const [nisrKey] = sourceRefsFor(fiche, NISR_2025_URL);
    const rwanda = fiche.countries.find(
      (entry: { countryId: string }) => entry.countryId === "RWA"
    );
    const spelling = fiche.spellings.find(
      (entry: { spelling: string }) => entry.spelling === "Irakoze"
    );

    expect(nisrKey).toBeDefined();
    expect(rwanda).toMatchObject({ status: "attested", sourceRefs: [nisrKey] });
    expect(spelling.attestations).toContainEqual({
      countryId: "RWA",
      sourceRefs: [nisrKey],
    });
    expect(parsePatronymeFile(fiche).success).toBe(true);
  });

  // @req REQ-196
  it("writes a usage history from the NISR table, for boys and for girls", () => {
    const accounts = nameOf(irakoze(), "Irakoze").accounts.filter((account) =>
      citesUrl(account, NISR_2025_URL)
    );
    const text = accounts.map((account) => account.statement).join(" ");

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) {
      expect(account.aspect).toBe("usage");
      expect(account.era).toBe("modern");
      expect(account.sources[0].page).toBe("p. 12");
    }
    expect(text).toMatch(/2 637/);
    expect(text).toMatch(/3 079/);
  });
});

describe("PAT_MACHAR among the Dinka", () => {
  const machar = () => readPatronyme("PAT_MACHAR");

  // @req REQ-141
  it("links the Dinka on Lienhardt and Seligman, keeping the Nuer", () => {
    const fiche = machar();
    const dinka = fiche.peoples.find(
      (entry: { peopleId: string }) => entry.peopleId === "PPL_DINKA"
    );
    const expected = [
      ...sourceRefsFor(fiche, LIENHARDT_1988_URL),
      ...sourceRefsFor(fiche, SELIGMAN_1932_URL),
    ];

    expect(expected).toHaveLength(2);
    expect(dinka).toMatchObject({ status: "attested" });
    expect(dinka.sourceRefs).toEqual(expect.arrayContaining(expected));
    expect(
      fiche.peoples.map((entry: { peopleId: string }) => entry.peopleId)
    ).toContain("PPL_NUER");
    expect(parsePatronymeFile(fiche).success).toBe(true);
  });

  // @req REQ-196
  it("writes its history from the two books, the close form macar first", () => {
    const entry = nameOf(machar(), "Machar");
    const birth = entry.accounts.find((account) => account.birth);
    const meaning = entry.accounts.find(
      (account) =>
        account.aspect === "meaning" && citesUrl(account, LIENHARDT_1988_URL)
    );

    expect(birth?.formAsWritten).toBe("macar");
    expect(birth?.statement).toMatch(/forme proche/);
    expect(birth?.sources[0]).toMatchObject({
      url: SELIGMAN_1932_URL,
      page: "p. 169",
    });
    expect(meaning?.statement).toMatch(/bœuf noir/);
  });
});

describe("Ekuikui and Kalandula, throne names of Bailundo", () => {
  // @req REQ-133
  it.each(["PAT_EKUIKUI", "PAT_KALANDULA"])(
    "files %s as a sovereign's personal name, the closest box, from Dulley 2021",
    (id) => {
      const fiche = readPatronyme(id);
      const gap = fiche.gaps.find(
        ({ fieldPath }: { fieldPath: string }) => fieldPath === "nameSystem"
      );
      const [dulleyKey] = sourceRefsFor(fiche, DULLEY_2021_URL);

      expect(parsePatronymeFile(fiche).success).toBe(true);
      expect(fiche.nameSystem).toBe("non_hereditary_patronymic");
      expect(fiche.designatedSocialUnit).toBe("individual");
      expect(gap.reason).toMatch(/nom de règne/);
      expect(gap.reason).toMatch(/la case la plus proche/);
      expect(fiche.peoples).toEqual([
        {
          peopleId: "PPL_OVIMBUNDU",
          status: "attested",
          sourceRefs: [dulleyKey],
        },
      ]);
      expect(JSON.stringify(fiche)).not.toMatch(/afrik-candidate-queue/);
      expect(
        fiche.nameHistory.names[0].accounts.every((account: Account) =>
          citesUrl(account, DULLEY_2021_URL)
        )
      ).toBe(true);
    }
  );

  // @req REQ-196
  it("tells the meaning Ekuikui II gave his name on taking the throne", () => {
    const meaning = nameOf(
      readPatronyme("PAT_EKUIKUI"),
      "Ekuikui"
    ).accounts.find((account) => account.aspect === "meaning");

    expect(meaning?.statement).toMatch(/oiseau/);
    expect(meaning?.sources[0].page).toBe("p. 730");
  });
});

describe("PAT_MAVOUNGOU, attested as a family name in Congo", () => {
  const mavoungou = () => readPatronyme("PAT_MAVOUNGOU");

  // @req REQ-141
  it("attests Congo on the Journal officiel, not on the candidate queue", () => {
    const fiche = mavoungou();
    const [gazetteKey] = sourceRefsFor(fiche, CONGO_GAZETTE_2024_URL);

    expect(gazetteKey).toBeDefined();
    expect(
      fiche.countries.find(
        (entry: { countryId: string }) => entry.countryId === "COG"
      )
    ).toMatchObject({ status: "attested", sourceRefs: [gazetteKey] });
    expect(parsePatronymeFile(fiche).success).toBe(true);
  });

  // @req REQ-196
  it("restores the withdrawn history, Dennett's Mavungu as the birth", () => {
    const entry = nameOf(mavoungou(), "Mavoungou");
    const birth = entry.accounts.find((account) => account.birth);

    expect(birth?.formAsWritten).toBe("Mavungu");
    expect(birth?.sources[0]).toMatchObject({
      url: DENNETT_1898_URL,
      page: "p. 42",
    });
    expect(
      entry.accounts.some(
        (account) =>
          account.aspect === "usage" &&
          citesUrl(account, CONGO_GAZETTE_2024_URL)
      )
    ).toBe(true);
  });
});

describe("PAT_NYERERE gets back the caterpillar story, from Molony", () => {
  const nyerere = () => readPatronyme("PAT_NYERERE");

  // @req REQ-136
  it("tells it in the origin and the name history, cited at Molony's page 32", () => {
    const fiche = nyerere();
    const [molonyKey] = sourceRefsFor(fiche, MOLONY_2014_URL);
    const account = nameOf(fiche, "Nyerere").accounts.find((candidate) =>
      citesUrl(candidate, MOLONY_2014_URL)
    );

    expect(molonyKey).toBeDefined();
    expect(fiche.origin.historicalSyntheses).toEqual([]);
    expect(account?.statement).toMatch(/chenilles/);
    expect(account?.statement).toMatch(/selon/);
    expect(account?.sources[0].page).toBe("p. 32");
    expect(JSON.stringify(fiche)).not.toMatch(/wikipedia/i);
    expect(
      fiche.gaps.some(
        ({ fieldPath }: { fieldPath: string }) => fieldPath === "origin"
      )
    ).toBe(false);
    expect(parsePatronymeFile(fiche).success).toBe(true);
  });
});

describe("the Maka and Njem fiches that replace the forest-peoples label", () => {
  const model = JSON.parse(
    readFileSync(resolve(ROOT, "public/modele-peuple.json"), "utf8")
  );
  const FICHES: Array<[string, string, string, string]> = [
    ["PPL_MAKA", "Maka", "mcp", AMBRONN_1906_URL],
    ["PPL_NJEM", "Njem", "njy", TESSMANN_1913_URL],
  ];

  // @req REQ-178
  it.each(FICHES)(
    "%s is a Bantu people fiche named %s, speaking %s",
    (id, name, iso) => {
      const path = `peuples/FLG_BANTU/${id}.json`;
      expect(existsSync(resolve(AFRIK, path))).toBe(true);
      const fiche = readJson(path);

      expect(fiche.nameMain).toBe(name);
      expect(fiche.languageFamilyId).toBe("FLG_BANTU");
      expect(fiche.content.languages.isoCodes).toEqual([iso]);
      expect(Object.keys(fiche.content.appellations).sort()).toEqual(
        Object.keys(model.content.appellations).sort()
      );
      for (const key of Object.keys(fiche.content)) {
        expect(Object.keys(model.content)).toContain(key);
      }
      for (const source of fiche.content.sources) {
        expect(source.source_kind).toBeDefined();
      }
    }
  );

  // @req REQ-196
  it.each(FICHES)(
    "%s carries a name history whose self-name is unknown",
    (id, name, _iso, witness) => {
      const fiche = readJson(`peuples/FLG_BANTU/${id}.json`);
      const entry = nameOf(fiche, name);

      expect(parseNameHistory(fiche.nameHistory).success).toBe(true);
      expect(fiche.nameHistory.selfNameUnknown).toBe(true);
      expect(fiche.content.appellations.selfAppellation).toBeNull();
      expect(entry.accounts.some((account) => account.birth)).toBe(true);
      expect(entry.accounts.some((account) => citesUrl(account, witness))).toBe(
        true
      );
    }
  );

  // @req REQ-196
  it("dates the Maka birth to Engelhardt's crossing, read in Ambronn's report", () => {
    const birth = nameOf(
      readJson("peuples/FLG_BANTU/PPL_MAKA.json"),
      "Maka"
    ).accounts.find((account) => account.birth);

    expect(birth?.formAsWritten).toBe("Maka");
    expect(birth?.sources[0]).toMatchObject({
      url: AMBRONN_1906_URL,
      page: "p. 213",
    });
  });

  // Page V of the ORSTOM dictionary gives the Ndjem as the main group of
  // eight cantons, five of them « Ndjem & Pygmées » by ditto marks, four of
  // them named Dzimou: counting only the cantons named Ndjem gave 4 140.
  // @req REQ-196
  it("counts the eight cantons where the 1968 ORSTOM table gives the Ndjem as the main group", () => {
    const fiche = readJson("peuples/FLG_BANTU/PPL_NJEM.json");
    const table = nameOf(fiche, "Ndjem").accounts.find((account) =>
      citesUrl(account, ORSTOM_HAUT_NYONG_1968_URL)
    );
    const demography = fiche.content.demography.source;

    expect(table?.statement).toMatch(/huit cantons/);
    expect(table?.statement).toMatch(/Pygmées/);
    expect(table?.sources[0].notes).toMatch(/DZIMOU/);
    expect(demography).toMatch(/12 204/);
    expect(demography).not.toMatch(/4 140/);
    expect(fiche.content.appellations.contemporaryUsage).toMatch(
      /huit cantons/
    );
  });
});
