import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import pygmeeAnswer from "../../src/lib/search/nameAnswers/data/pygmee.json";
import { NOMMER_FIGURES } from "../../src/lib/dossiers/nommer/figures";
import { searchAnswerSentenceProblems } from "../../src/lib/search/answer";

// The structural and factual corrections the operator approved on
// 2026-10-18 from the questions of waves 24 and 25 (ETNI-2011): two family
// moves, three headline renames, one locator per cited work, page fixes read
// on the scans, and the leftovers of the Mucubal and Cabo Verde arbitration.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");

const WELLBY_URL = "https://archive.org/details/twixtsirdarmenel00welliala";
const DELAFOSSE_1900_URL = "https://archive.org/details/biostor-268194";
const BARTH_VOL_3_URL = "https://archive.org/details/travelsdiscoveri31857bart";
const NACHTIGAL_VOL_2_URL = "https://archive.org/details/bub_gb_rxwGAAAAQAAJ";
const IBN_KHALDOUN_TOME_1_URL =
  "https://archive.org/details/ibn-khaldun-histoire-des-berberes-et-des-dynasties-musulmanes-de-l-afrique-septentrionale-v-1";
const HGA_III_URL = "https://unesdoc.unesco.org/ark:/48223/pf0000184312";
const HGA_V_URL = "https://unesdoc.unesco.org/ark:/48223/pf0000184292";
const HGA_VI_URL = "https://unesdoc.unesco.org/ark:/48223/pf0000184314";
const IWGIA_BAKA_URL =
  "https://iwgia.org/images/publications/0584_informe_13_fre_opt.pdf";
const SCHWEINFURTH_VOL_2_URL =
  "https://archive.org/details/heartofafrica02schw_0";
const PATRICKS_URL =
  "https://archive.org/details/tibongo-netinanatelo-temaswati-swazi-surnames-and-their-praisenames";
const IRB_OGADEN_URL = "https://www.ecoi.net/en/document/1428637.html";
const MANSUUR_DEAD_URL =
  "https://wardheernews.com/wp-content/uploads/2021/06/Somali-names-and-indvidual-identity-By-Abdalla-Mansuur.pdf";
const MANSUUR_WAYBACK_URL = `https://web.archive.org/web/20210920113414/${MANSUUR_DEAD_URL}`;
const BURTON_FIRST_FOOTSTEPS_URL =
  "https://archive.org/details/firstfootstepsi00burtgoog";
const OLIVEIRA_2023_URL = "https://pmc.ncbi.nlm.nih.gov/articles/PMC10516492/";
const MATHIOT_URL =
  "https://www.nation.sc/articles/15689/we-the-people-of-seychelles";
const LUSA_2022_URL =
  "https://www.verangola.net/va/pt/112022/Ambiente/33520/Seca-no-sul-do-pa%C3%ADs-leva-pastores-cada-vez-mais-longe-em-busca-de-pasto.htm";

const CORPUS_ROOTS = [
  "peuples",
  "patronymes",
  "famille_linguistique",
  "mots",
  "pays",
  "langues",
  "lieux",
];

type Citation = Record<string, unknown> & {
  url?: string | null;
  title?: string;
  author?: string;
  page?: string;
  notes?: string;
  source_kind?: string;
};

function jsonFilesUnder(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return jsonFilesUnder(path);
    return entry.endsWith(".json") && !entry.startsWith("_") ? [path] : [];
  });
}

function citationsOf(fiche: unknown, url: string): Citation[] {
  const found: Citation[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      const record = value as Citation;
      if (record.url === url) found.push(record);
      Object.values(record).forEach(walk);
    }
  };
  walk(fiche);
  return found;
}

const corpusFiles = CORPUS_ROOTS.flatMap((root) =>
  jsonFilesUnder(resolve(AFRIK, root))
);

function everyCitationOf(url: string): Citation[] {
  return corpusFiles.flatMap((file) =>
    citationsOf(JSON.parse(readFileSync(file, "utf8")), url)
  );
}

/** One work, one locator: what every citation of a URL says about a field. */
function distinct(url: string, field: keyof Citation): Set<unknown> {
  return new Set(
    everyCitationOf(url)
      .map((citation) => citation[field])
      .filter((value) => value !== undefined)
  );
}

function peoplePath(id: string): string | undefined {
  const family = readdirSync(resolve(AFRIK, "peuples")).find((folder) =>
    existsSync(resolve(AFRIK, "peuples", folder, `${id}.json`))
  );
  return family && resolve(AFRIK, "peuples", family, `${id}.json`);
}

function readPeople(id: string) {
  const path = peoplePath(id);
  if (!path) throw new Error(`no fiche for ${id}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function readCorpus(relative: string) {
  return JSON.parse(readFileSync(resolve(AFRIK, relative), "utf8"));
}

describe("family moves approved on 2026-10-18", () => {
  // @req REQ-178
  it("files PPL_NDAI under Niger-Congo, where Glottolog puts the Mbum languages", () => {
    const fiche = readPeople("PPL_NDAI");

    expect(
      existsSync(resolve(AFRIK, "peuples/FLG_SOUDANIQUECENTRAL/PPL_NDAI.json"))
    ).toBe(false);
    expect(peoplePath("PPL_NDAI")).toMatch(/FLG_NIGERCONGO\/PPL_NDAI\.json$/);
    expect(fiche.languageFamilyId).toBe("FLG_NIGERCONGO");
    expect(fiche.content.appellations.linguisticFamily).toBe("FLG_NIGERCONGO");
  });

  // @req REQ-178
  it("files PPL_YOHOURE under the Mande family, as its own text and Glottolog say", () => {
    const fiche = readPeople("PPL_YOHOURE");

    expect(
      existsSync(resolve(AFRIK, "peuples/FLG_BENOUECONGO/PPL_YOHOURE.json"))
    ).toBe(false);
    expect(peoplePath("PPL_YOHOURE")).toMatch(/FLG_MANDE\/PPL_YOHOURE\.json$/);
    expect(fiche.languageFamilyId).toBe("FLG_MANDE");
    expect(fiche.content.appellations.linguisticFamily).toBe("FLG_MANDE");
  });

  // @req REQ-178
  it("drops the Kresh and Kara classifications from PPL_FURU's content, as Boyeldieu and Glottolog ask", () => {
    const content = readPeople("PPL_FURU").content;
    const prose = JSON.stringify({ ...content, sources: [] });

    expect(prose).not.toMatch(
      /class\w* (initialement )?(parmi les langues |dans le groupe )?Kresh/i
    );
    expect(prose).not.toMatch(/anciennement class\w* Kresh/i);
    expect(prose).not.toMatch(/Kara/);
    expect(content.appellations.ethnoLinguisticGroup).toMatch(/sara/i);
  });
});

describe("headlines renamed on 2026-10-18", () => {
  // @req REQ-178
  it("heads PPL_WIYANA Winye, keeps Wiyana findable and no longer places the people in Ghana", () => {
    const fiche = readPeople("PPL_WIYANA");
    const appellations = fiche.content.appellations;

    expect(fiche.nameMain).toBe("Winye");
    expect(appellations.mainName).toBe("Winye");
    expect(appellations.exonyms).toContain("Wiyana");
    expect(fiche.currentCountries).toEqual(["BFA"]);
    expect(appellations.currentCountries).toEqual(["BFA"]);
    expect(
      fiche.content.demography.distributionByCountry.map(
        (row: { country: string }) => row.country
      )
    ).toEqual(["BFA"]);
    // originOfExonyms keeps its definition of Gourounsi, a label it says
    // covers peoples on both sides of the border; it places no Winye there.
    const placed = {
      ...fiche.content,
      appellations: { ...appellations, originOfExonyms: "" },
    };
    expect(JSON.stringify(placed)).not.toMatch(/Ghana|ghan[ée]/i);
    expect(fiche.nameHistory.summary).not.toMatch(/nom principal/);
  });

  // @req REQ-178
  it("heads PPL_MUCUVAL Kuvale, the sourced self-name, and keeps Mucuval findable", () => {
    const fiche = readPeople("PPL_MUCUVAL");
    const appellations = fiche.content.appellations;

    expect(fiche.nameMain).toBe("Kuvale");
    expect(appellations.mainName).toBe("Kuvale");
    expect(appellations.selfAppellation).toBe("Kuvale");
    expect(appellations.exonyms).toContain("Mucuval");
  });

  // @req REQ-178
  it("leaves no unsourced OvaKuvale in PPL_MUCUVAL, and no Mucubal told as another people", () => {
    const fiche = readPeople("PPL_MUCUVAL");
    const prose = JSON.stringify(fiche);

    expect(prose).not.toMatch(/OvaKuvale/);
    expect(prose).not.toMatch(/Comme les Mucubal/);
    expect(prose).not.toMatch(/Zemba, Mucubal/);
    expect(prose).not.toMatch(/Himba et des Mucubal/);
  });

  // @req REQ-178
  it("heads PPL_AUSTRO_MACRO Malgaches and opens its summary on that name", () => {
    const fiche = readPeople("PPL_AUSTRO_MACRO");

    expect(fiche.nameMain).toBe("Malgaches");
    expect(fiche.content.appellations.mainName).toBe("Malgaches");
    expect(fiche.nameHistory.summary).toMatch(/^Le nom Malgaches /);
    expect(fiche.nameHistory.summary).toMatch(/Malagasy/);
  });
});

describe("macro-groups point to their family, as the Mandé macro-group does", () => {
  const MACRO_FAMILIES: Array<[string, RegExp]> = [
    ["PPL_NILOTIQUE_MACRO", /famille nilotique/],
    ["PPL_GUR_MACRO", /famille gur/],
    ["PPL_KROU_MACRO", /famille krou/],
    ["PPL_AUSTRO_MACRO", /famille austronésienne/],
    ["PPL_ATLANTIQUE_MACRO", /famille atlantique/],
    ["PPL_BENOUECONGO_MACRO", /famille bénoué-congo/],
    ["PPL_OMOTIQUE_MACRO", /famille omotique/],
  ];

  // @req REQ-178
  it.each(MACRO_FAMILIES)(
    "gives %s a lead that points to its family and that the page will print",
    (id, family) => {
      const fiche = readPeople(id);
      const lead = fiche.content.searchAnswer?.lead;

      expect(lead).toMatch(family);
      expect(searchAnswerSentenceProblems("lead", lead)).toEqual([]);
      expect(fiche.nameHistory).toBeDefined();
    }
  );
});

describe("pages read again on the scans", () => {
  // @req REQ-136
  it("cites Wellby's « hilly district of Gamo » on PPL_GAMO at the printed p. 151", () => {
    const citations = citationsOf(readPeople("PPL_GAMO"), WELLBY_URL);

    expect(citations.length).toBeGreaterThan(0);
    for (const citation of citations) expect(citation.page).toBe("p. 151");
  });

  // @req REQ-136
  it("cites Delafosse 1900 at the printed pages 334 and 335, under one title and kind", () => {
    const citations = everyCitationOf(DELAFOSSE_1900_URL);
    const pages = new Set(citations.map((citation) => citation.page));

    expect(citations.length).toBeGreaterThan(5);
    for (const page of pages) expect(page).toMatch(/^p\. 33[45](-335)?$/);
    expect(distinct(DELAFOSSE_1900_URL, "title").size).toBe(1);
    expect(distinct(DELAFOSSE_1900_URL, "source_kind")).toEqual(
      new Set(["archive"])
    );
  });

  // @req REQ-141
  it("reads the GININDZA entry of Patricks on p. 19 in PAT_MAMBA", () => {
    const citations = citationsOf(
      readCorpus("patronymes/PAT_MAMBA.json"),
      PATRICKS_URL
    );

    expect(
      citations.some((citation) =>
        /GININDZA \(p\. 19\)/.test(citation.page ?? "")
      )
    ).toBe(true);
    for (const citation of citations) {
      expect(citation.page ?? "").not.toMatch(/entre les p\. 17 et 20/);
      expect(citation.notes ?? "").not.toMatch(/n'est pas lisible/);
    }
  });
});

describe("one title, one author, one address per work", () => {
  // @req REQ-133
  it.each([
    ["Barth, Travels and Discoveries, vol. 3", BARTH_VOL_3_URL],
    ["Nachtigal, Sahara und Sudan, vol. 2", NACHTIGAL_VOL_2_URL],
    ["Ibn Khaldoun, Histoire des Berbères, tome I", IBN_KHALDOUN_TOME_1_URL],
    ["Schweinfurth, The Heart of Africa, vol. II", SCHWEINFURTH_VOL_2_URL],
    ["Burton, First Footsteps in East Africa", BURTON_FIRST_FOOTSTEPS_URL],
    ["the Canadian board's answer on the Ogaden", IRB_OGADEN_URL],
    ["Mathiot, We, the people of Seychelles", MATHIOT_URL],
  ])("cites %s under one title", (_work, url) => {
    expect(everyCitationOf(url).length).toBeGreaterThan(1);
    expect(distinct(url, "title").size).toBe(1);
  });

  // @req REQ-133
  it.each([
    ["Ibn Khaldoun, tome I", IBN_KHALDOUN_TOME_1_URL, /tome I\b/],
    ["Lange, HGA III ch. 15", HGA_III_URL, /ch\. 15 /],
    ["de Medeiros, HGA III ch. 5", HGA_III_URL, /ch\. 5 /],
    ["Wondji, HGA V ch. 13", HGA_V_URL, /ch\. 13 /],
    ["Boahen, HGA VI ch. 3", HGA_VI_URL, /ch\. 3 /],
  ])("cites %s under one author and one title", (_work, url, chapter) => {
    const citations = everyCitationOf(url).filter((citation) =>
      chapter.test(citation.title ?? "")
    );
    const authors = new Set(
      citations.map((citation) => citation.author).filter(Boolean)
    );
    const titles = new Set(citations.map((citation) => citation.title));

    expect(citations.length).toBeGreaterThan(1);
    expect(authors.size).toBe(1);
    expect(titles.size).toBe(1);
  });

  // @req REQ-133
  it("credits Oliveira et al. 2023 under one author string and one title", () => {
    expect(distinct(OLIVEIRA_2023_URL, "author")).toEqual(
      new Set(["Sandra Oliveira et al."])
    );
    const kwadi = citationsOf(readPeople("PPL_KWADI"), OLIVEIRA_2023_URL);
    const titles = new Set(kwadi.map((citation) => citation.title));
    expect(titles).toEqual(
      new Set([
        "Genome-wide variation in the Angolan Namib Desert reveals unique pre-Bantu ancestry",
      ])
    );
  });

  // @req REQ-133
  it("gives the Ogaden answer the reference number the page prints, SOM106011.E", () => {
    const prose = JSON.stringify(everyCitationOf(IRB_OGADEN_URL));

    expect(prose).not.toMatch(/SOM106004/);
    expect(prose).toMatch(/SOM106011\.E/);
  });

  // @req REQ-133
  it("points every citation of Mansuur 2021 at the Wayback copy, the address that still answers", () => {
    expect(everyCitationOf(MANSUUR_DEAD_URL)).toEqual([]);
    expect(everyCitationOf(MANSUUR_WAYBACK_URL).length).toBeGreaterThan(10);
    expect(distinct(MANSUUR_WAYBACK_URL, "title").size).toBe(1);
  });

  // @req REQ-178
  it("cites the IWGIA report in the Pygmée answer under its own title and author", () => {
    const [fiche] = citationsOf(
      readPeople("PPL_PYGMEES_AUTOCHTONES"),
      IWGIA_BAKA_URL
    );
    const answerSources = citationsOf(pygmeeAnswer, IWGIA_BAKA_URL);

    expect(answerSources.length).toBeGreaterThan(0);
    for (const source of answerSources) {
      expect(source.title).toBe(fiche.title);
      expect(source.author).toBe("Aili Pyhälä");
    }
  });
});

describe("prose corrected from the sources", () => {
  // @req REQ-178
  it("explains « Pygmée » on PPL_PYGMEES_AUTOCHTONES from its own history", () => {
    const origin = readPeople("PPL_PYGMEES_AUTOCHTONES").content.appellations
      .originOfExonyms;

    expect(origin).not.toMatch(/pyrgme/);
    expect(origin).not.toMatch(/Afrique de l'Ouest/);
    expect(origin).toMatch(/pugm/);
    expect(origin).toMatch(/Homère/);
  });

  // @req REQ-178
  it("places PPL_MUCAHONA where the Lusa dispatch puts the Muhakaona, and says where Oncocua comes from", () => {
    const content = readPeople("PPL_MUCAHONA").content;

    expect(content.appellations.historicalRegion).toMatch(/Virei/);
    expect(content.appellations.historicalRegion).toMatch(/Namibe/);
    expect(content.sources.map((source: Citation) => source.url)).toContain(
      LUSA_2022_URL
    );
    for (const zone of content.origins.historicalSettlementZones as string[]) {
      if (/Oncocua/.test(zone)) expect(zone).toMatch(/selon/);
    }
  });

  // @req REQ-178
  it("drops Cabo Verde's unsourced « Africains d'origine récente » population row", () => {
    const rows = readCorpus("pays/CPV.json").content.demographics.peoples;

    expect(
      rows.find(
        (row: { name: string }) => row.name === "Africains d'origine récente"
      )
    ).toBeUndefined();
  });
});

describe("the Nommer method text", () => {
  // @req REQ-113
  it("gives the contested and colonial-legacy counts the corpus holds today", () => {
    const fiches = jsonFilesUnder(resolve(AFRIK, "peuples")).map((file) =>
      JSON.parse(readFileSync(file, "utf8"))
    );
    const count = (status: string) =>
      fiches.filter((fiche) => fiche.classificationStatus === status).length;
    const figure = NOMMER_FIGURES["status-contested-or-colonial"];
    const method = figure.kind === "counted" ? figure.method : "";

    expect(method).toContain(`contested (${count("contested")})`);
    expect(method).toContain(`colonial-legacy (${count("colonial-legacy")})`);
  });
});
