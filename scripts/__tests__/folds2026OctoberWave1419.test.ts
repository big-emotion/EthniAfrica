import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import retiredPatronymes from "../../dataset/source/afrik/patronymes/_retired-identifiers.json";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";
import { getPatronymeRoute } from "../../src/lib/routing";

// The duplicates, groupings and unattested fiches that waves 14 to 19 of the
// long tail found (peoples in 14, 16 and 18; family names in 15, 17 and 19),
// arbitrated on the operator's rulings of 2026-10-14 (ETNI-2011). The wave
// agents reported them and folded or retired nothing.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");
const LEDGER_FILE = "_retired-identifiers.json";
const RULED_ON = "2026-10-14";
const SADJO_2019 = "sadjo-2019-kaabu";

// Where a live reference to an id can sit. The archive `.txt` notes and the
// demography CSV are frozen exports, left alone by every earlier fold. The
// wave-order lists under docs/editorial/strategy are generated plans that
// name the subjects of a wave before they are worked, so they cannot be held
// to the corpus. The validator's report under logs/ is a local artefact.
const REFERENCE_ROOTS: Array<[string, RegExp]> = [
  ["dataset/source/afrik", /\.json$/],
  ["docs/editorial", /\.(json|md)$/],
  ["src", /\.(ts|tsx)$/],
  ["scripts/__tests__", /\.ts$/],
];
const GENERATED_PLANS = /name-history-(long-tail-waves|priority-core)\.md$/;

const PEOPLE_FOLDS: Array<[string, string]> = [
  ["PPL_NIABOUA", "PPL_NYABWA"],
  ["PPL_MOUSGOUM", "PPL_MUSGU"],
  ["PPL_LALA_SOLI", "PPL_SOLI"],
  ["PPL_SWAKA", "PPL_LALA_SWAKA"],
  ["PPL_RUFIJI", "PPL_NDENGEREKO"],
  ["PPL_LEYA", "PPL_TOKALEYA"],
  ["PPL_WONNIN", "PPL_GODIE"],
  ["PPL_LALA_AMBO", "PPL_AMBO"],
  ["PPL_CHUMBURUNG", "PPL_NCHUMURU"],
  ["PPL_TONGA_ILA", "PPL_ILA"],
  ["PPL_LUNDA_CHOKWE", "PPL_LUNDA"],
  ["PPL_GOVA", "PPL_MBUKUSHU"],
  ["PPL_LALA_UNGA", "PPL_UNGA"],
  ["PPL_MANCANHA", "PPL_MANKANYA"],
  ["PPL_BODI", "PPL_MEEN"],
];

// Retired with no keeper: unattested as a people, or a place.
const PEOPLE_WITHDRAWN = [
  "PPL_GBODJIBO",
  "PPL_KPANA",
  "PPL_HOBA",
  "PPL_TSAO",
  "PPL_WANDYA",
  "PPL_ANTSALOVA",
];

const PATRONYME_FOLDS: Array<[string, string]> = [
  ["PAT_DJALO", "PAT_DIALLO"],
  ["PAT_BAH", "PAT_BA"],
];
const PATRONYME_WITHDRAWN = ["PAT_FADICCA", "PAT_KOUM"];

const RETIRED_PEOPLE = [...PEOPLE_FOLDS.map(([id]) => id), ...PEOPLE_WITHDRAWN];
const RETIRED_PATRONYMES = [
  ...PATRONYME_FOLDS.map(([id]) => id),
  ...PATRONYME_WITHDRAWN,
];

function filesUnder(directory: string, pattern: RegExp): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return filesUnder(path, pattern);
    return pattern.test(entry) && entry !== LEDGER_FILE ? [path] : [];
  });
}

function peopleFile(id: string): string | undefined {
  return readdirSync(resolve(AFRIK, "peuples"))
    .map((family) => resolve(AFRIK, "peuples", family, `${id}.json`))
    .find((file) => existsSync(file));
}

function readPeople(id: string) {
  const file = peopleFile(id);
  if (!file) throw new Error(`no fiche for ${id}`);
  return JSON.parse(readFileSync(file, "utf8"));
}

function patronymeFile(id: string) {
  return resolve(AFRIK, "patronymes", `${id}.json`);
}

function readPatronyme(id: string) {
  return JSON.parse(readFileSync(patronymeFile(id), "utf8"));
}

const ledgerEntry = <Entry extends { retiredId: string }>(
  ledger: Entry[],
  id: string
) => ledger.find((candidate) => candidate.retiredId === id);

describe("ledger and redirects of the waves 14 to 19 arbitration", () => {
  // @req REQ-178
  it.each(PEOPLE_FOLDS)(
    "redirects %s to %s, ruled 2026-10-14",
    (id, keeper) => {
      const entry = ledgerEntry(retiredIdentifiers, id);

      expect(RETIRED_PEOPLE_IDS[id]).toBe(keeper);
      expect(RETIRED_PEOPLE_IDS[keeper]).toBeUndefined();
      expect(entry).toMatchObject({
        decision: "merged",
        successorId: keeper,
        decidedOn: RULED_ON,
      });
      expect(peopleFile(keeper)).toBeDefined();
    }
  );

  // @req REQ-178
  it.each(PEOPLE_WITHDRAWN)(
    "withdraws %s with no keeper to redirect to",
    (id) => {
      const entry = ledgerEntry(retiredIdentifiers, id);

      expect(entry).toMatchObject({
        decision: "withdrawn",
        successorId: null,
        decidedOn: RULED_ON,
      });
      expect(entry?.reason.length).toBeGreaterThan(40);
      expect(RETIRED_PEOPLE_IDS[id]).toBeUndefined();
    }
  );

  // @req REQ-178
  it("keeps Mandé du Sud as a grouping, recorded as kept distinct", () => {
    const entry = ledgerEntry(retiredIdentifiers, "PPL_MANDE_DU_SUD");

    expect(entry).toMatchObject({
      decision: "kept-distinct",
      successorId: null,
      decidedOn: RULED_ON,
    });
    expect(peopleFile("PPL_MANDE_DU_SUD")).toBeDefined();
    expect(RETIRED_PEOPLE_IDS.PPL_MANDE_DU_SUD).toBeUndefined();
  });

  // @req REQ-178
  it("leaves no fiche for a retired id, and nothing pointing at one", () => {
    const pattern = new RegExp(
      `\\b(${[...RETIRED_PEOPLE, ...RETIRED_PATRONYMES].join("|")})\\b`
    );
    const dangling = REFERENCE_ROOTS.flatMap(([root, files]) =>
      filesUnder(resolve(ROOT, root), files)
    )
      .filter((file) => !GENERATED_PLANS.test(file))
      .filter((file) => !file.includes("/logs/"))
      .filter((file) => !file.endsWith("folds2026OctoberWave1419.test.ts"))
      .filter((file) => pattern.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
    for (const id of RETIRED_PEOPLE) expect(peopleFile(id)).toBeUndefined();
    for (const id of RETIRED_PATRONYMES)
      expect(existsSync(patronymeFile(id))).toBe(false);
  });
});

describe("the family-name ledger", () => {
  // @req REQ-141
  it.each(PATRONYME_FOLDS)("folds %s into %s", (id, keeper) => {
    expect(ledgerEntry(retiredPatronymes, id)).toMatchObject({
      decision: "merged",
      successorId: keeper,
      decidedOn: RULED_ON,
    });
    expect(existsSync(patronymeFile(keeper))).toBe(true);
  });

  // @req REQ-141
  it.each(PATRONYME_WITHDRAWN)("withdraws %s with no successor", (id) => {
    const entry = ledgerEntry(retiredPatronymes, id);

    expect(entry).toMatchObject({
      decision: "withdrawn",
      successorId: null,
      decidedOn: RULED_ON,
    });
    expect(entry?.reason.length).toBeGreaterThan(40);
  });

  // The operator keeps these four: a history from a family testimony is
  // handled separately, and none of them may be folded or withdrawn here.
  // @req REQ-141
  it.each(["PAT_KOLLO", "PAT_BIKADAL", "PAT_ATEBA", "PAT_NONO"])(
    "keeps %s as a fiche",
    (id) => {
      expect(existsSync(patronymeFile(id))).toBe(true);
      expect(ledgerEntry(retiredPatronymes, id)).toBeUndefined();
    }
  );
});

describe("what the keepers carry over", () => {
  // @req REQ-178
  it("gives Soli its own code, sby, with the Glottolog page that holds it", () => {
    const soli = readPeople("PPL_SOLI");

    expect(soli.content.languages.isoCodes).toEqual(["sby"]);
    expect(
      soli.content.sources.map((source: { url: string }) => source.url)
    ).toContain("https://glottolog.org/resource/languoid/id/soli1239");
  });

  // @req REQ-178
  it("keeps the Chumburung language code and its Glottolog page on Nchumuru", () => {
    const nchumuru = readPeople("PPL_NCHUMURU");

    expect(nchumuru.content.languages.isoCodes).toContain("ncu");
    expect(
      nchumuru.content.sources.map((source: { url: string }) => source.url)
    ).toContain("https://glottolog.org/resource/languoid/id/chum1261");
  });

  // @req REQ-141
  it("adds Djaló and Jaló, Guinea-Bissau, to PAT_DIALLO on Sadjo 2019", () => {
    const diallo = readPatronyme("PAT_DIALLO");
    const spellings = diallo.spellings.map(
      (entry: { spelling: string }) => entry.spelling
    );
    const sadjo = diallo.sources.find(
      (source: { sourceKey: string }) => source.sourceKey === SADJO_2019
    );

    expect(spellings).toEqual(expect.arrayContaining(["Djaló", "Jaló"]));
    expect(sadjo.url).toMatch(/repositorio\.unilab\.edu\.br/);
    for (const spelling of ["Djaló", "Jaló"]) {
      const entry = diallo.spellings.find(
        (candidate: { spelling: string }) => candidate.spelling === spelling
      );
      expect(entry.attestations).toEqual([
        { countryId: "GNB", sourceRefs: ["sadjo-2019-kaabu"] },
      ]);
    }
  });

  // @req REQ-141
  it("adds Guinea and the Fula to PAT_BA on Vieillard and Straussberger", () => {
    const ba = readPatronyme("PAT_BA");
    const sourceKeys = ba.sources.map(
      (source: { sourceKey: string }) => source.sourceKey
    );
    const guinea = ba.countries.find(
      (entry: { countryId: string }) => entry.countryId === "GIN"
    );
    const fula = ba.peoples.find(
      (entry: { peopleId: string }) => entry.peopleId === "PPL_FULA"
    );

    expect(sourceKeys).toEqual(
      expect.arrayContaining([
        "vieillard-fouta-clans",
        "straussberger-2016-futa",
      ])
    );
    expect(guinea.sourceRefs).toEqual(
      expect.arrayContaining([
        "vieillard-fouta-clans",
        "straussberger-2016-futa",
      ])
    );
    expect(fula.status).toBe("attested");
  });

  // @req REQ-141
  it("drops the Chukwuma spelling from PAT_CHUKWU: a different name", () => {
    const spellings = readPatronyme("PAT_CHUKWU").spellings.map(
      (entry: { spelling: string }) => entry.spelling
    );

    expect(spellings).toEqual(["Chukwu"]);
  });
});

describe("references repointed", () => {
  // @req REQ-149
  it("points the Guinea-Bissau Mancanha row at PPL_MANKANYA", () => {
    const guineaBissau = JSON.parse(
      readFileSync(resolve(AFRIK, "pays/GNB.json"), "utf8")
    );
    const row = guineaBissau.content.majorPeoples.find(
      (entry: { name: string }) => entry.name === "Mancanha"
    );

    expect(row.peopleId).toBe("PPL_MANKANYA");
  });

  // @req REQ-149
  it("lists the Me'en once among the Nilo-Saharan peoples, not the Bodi beside them", () => {
    const family = JSON.parse(
      readFileSync(
        resolve(AFRIK, "famille_linguistique/FLG_NILOSAHARIENNE.json"),
        "utf8"
      )
    );
    const listed = JSON.stringify(family);

    expect(listed).not.toContain("PPL_BODI");
    expect(listed).toContain("PPL_MEEN");
  });

  // @req REQ-178
  it("tells the Godié anecdote on PPL_GODIE, without the Wonnin self-name", async () => {
    const { DID_YOU_KNOW_FACTS } = await import("@/lib/home/didYouKnowFacts");
    const fact = DID_YOU_KNOW_FACTS.find(
      (entry: { id: string }) => entry.id === "wonnin-godie"
    );

    expect(fact?.entities).toContainEqual(
      expect.objectContaining({ kind: "people", id: "PPL_GODIE" })
    );
    expect(JSON.stringify(fact)).not.toMatch(/Wonnin est le nom/);
  });
});

describe("source titles, one title and one locator", () => {
  const titlesAt = (url: string, roots: string[]) => {
    const found = new Set<string>();
    const walk = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (record.url === url && typeof record.title === "string")
          found.add(record.title);
        Object.values(record).forEach(walk);
      }
    };
    for (const root of roots)
      for (const file of filesUnder(resolve(AFRIK, root), /\.json$/))
        if (!file.includes("/archive/"))
          walk(JSON.parse(readFileSync(file, "utf8")));
    return [...found];
  };

  // @req REQ-136
  it("cites the Landinfo report under one title", () => {
    expect(
      titlesAt("https://www.landinfo.no/asset/514/1/514_1.pdf", ["peuples"])
    ).toEqual(["Côte d'Ivoire: Ethnicity, Ivoirité and Conflict"]);
  });

  // @req REQ-136
  it("cites the Waters article on Rukwa under one title", () => {
    expect(
      titlesAt(
        "https://asq.africa.ufl.edu/wp-content/uploads/sites/168/Waters-V11Is1.pdf",
        ["peuples"]
      )
    ).toEqual([
      "Social Organization and Social Status in Nineteenth and Twentieth Century Rukwa, Tanzania",
    ]);
  });

  // @req REQ-136
  it("cites Ndoma 1977 under the title on its first page, at one address", () => {
    const nsimba = readPatronyme("PAT_NSIMBA");
    const nzuzi = readPatronyme("PAT_NZUZI");
    const locators = [nsimba, nzuzi].flatMap((fiche) =>
      fiche.sources
        .filter((source: { url: string }) => /ans-names/.test(source.url))
        .map((source: { title: string; url: string }) => [
          source.title,
          source.url,
        ])
    );

    expect(new Set(locators.map(([title]) => title))).toEqual(
      new Set(["Kongo Personal Names Today: a Sketch"])
    );
    expect(new Set(locators.map(([, url]) => url)).size).toBe(1);
  });

  // @req REQ-136
  it("credits Totela's Crane article to Thera Marie Crane", () => {
    const totela = JSON.stringify(readPeople("PPL_TOTELA"));

    expect(totela).not.toContain("Teresa Crane");
    expect(totela).toContain("Thera Marie Crane, Completion and Dissociation");
  });

  // @req REQ-136
  it("credits the Majang grammar to Joswig 2019, not to Dimmendaal 2025", () => {
    const majang = JSON.stringify(readPeople("PPL_MAJANG"));

    expect(majang).not.toContain("Dimmendaal, Gerrit Jan et al.");
    expect(majang).toContain("Joswig, Andreas – The Majang Language");
  });

  // @req REQ-136
  it("dates Ahland's Gumuz thesis 2012 and Harlow's Mosiye thesis 2016", () => {
    expect(JSON.stringify(readPeople("PPL_GUMUZ"))).not.toContain(
      "University of Oregon, 2004"
    );
    expect(JSON.stringify(readPeople("PPL_MOSIYE"))).not.toContain(
      "Arca), 2013"
    );
  });
});

describe("language codes the fiches had wrong", () => {
  // @req REQ-136
  it.each([
    ["PPL_OTAMARI_SOMBA", "tbz"],
    ["PPL_YUNGUR", "yun"],
    ["PPL_SOLI", "sby"],
  ])("gives %s the code %s", (id, code) => {
    expect(readPeople(id).content.languages.isoCodes).toEqual([code]);
  });
});

describe("the redirects built from the family-name ledger", () => {
  // @req REQ-141
  it("builds none for a withdrawn family name", async () => {
    const { vi } = await import("vitest");
    vi.doMock("@sentry/nextjs", () => ({
      withSentryConfig: (config: unknown) => config,
    }));
    const { default: nextConfig } = await import("../../next.config");
    const redirects = (await nextConfig.redirects()) as Array<{
      source: string;
      destination: string;
    }>;

    expect(redirects.filter((r) => /\/null\b/.test(r.destination))).toEqual([]);
    expect(
      redirects.find((r) => r.source === getPatronymeRoute("fr", "PAT_FADICCA"))
    ).toBeUndefined();
    expect(
      redirects.find((r) => r.source === getPatronymeRoute("fr", "PAT_DJALO"))
        ?.destination
    ).toBe(getPatronymeRoute("fr", "PAT_DIALLO"));
  });
});
