import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import retiredPatronymes from "../../dataset/source/afrik/patronymes/_retired-identifiers.json";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";

const RETIRED_PATRONYME_IDS: Record<string, string> = Object.fromEntries(
  retiredPatronymes.map((entry) => [entry.retiredId, entry.successorId])
);

// The duplicates that waves 6 (peoples) and 7 (family names) of the long tail
// found, folded on the operator's ruling of 2026-10-11 (ETNI-2011).

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");
const LEDGER_FILE = "_retired-identifiers.json";

// Where a live reference to an id can sit. The archive `.txt` notes and the
// demography CSV are frozen exports, left alone by every earlier fold.
const REFERENCE_ROOTS: Array<[string, RegExp]> = [
  ["dataset/source/afrik", /\.json$/],
  ["docs/editorial", /\.(json|md)$/],
  ["src", /\.(ts|tsx)$/],
];

const PEOPLE_FOLDS: Array<[string, string]> = [
  ["PPL_LALA_BISA", "PPL_BISA"],
  ["PPL_PAPELO", "PPL_ANAFRO_CRIOULO"],
  ["PPL_SONGHAY_MACRO", "PPL_SONGHAI"],
  ["PPL_KRAHN", "PPL_WE"],
  ["PPL_NYASA", "PPL_NYANJA"],
];

const PATRONYME_FOLDS: Array<[string, string]> = [
  ["PAT_DARBOE", "PAT_DABO"],
  ["PAT_FOFANAH", "PAT_FOFANA"],
  ["PAT_YOUSSOUF", "PAT_YUSUF"],
  ["PAT_YOUSSEF", "PAT_YUSUF"],
  ["PAT_OSMAN", "PAT_OUSMANE"],
  ["PAT_ALLY", "PAT_ALI"],
  ["PAT_BEN_ALI", "PAT_BENALI"],
  ["PAT_ABOUBAKAR", "PAT_ABUBAKAR"],
  ["PAT_CEESAY", "PAT_CISSE"],
  ["PAT_SESAY", "PAT_CISSE"],
];

const RETIRED = [...PEOPLE_FOLDS, ...PATRONYME_FOLDS].map(([id]) => id);

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

function readName(id: string) {
  return JSON.parse(
    readFileSync(resolve(AFRIK, "patronymes", `${id}.json`), "utf8")
  );
}

interface Account {
  period: { from: number | null };
  statement: string;
}

interface NameEntry {
  nameText: string;
  accounts: Account[];
}

function namesOf(fiche: { nameHistory?: { names: NameEntry[] } }) {
  return fiche.nameHistory?.names ?? [];
}

function spellingsOf(fiche: {
  spellings: Array<{ spelling: string; attestations: { countryId: string }[] }>;
}) {
  return new Map(
    fiche.spellings.map((entry) => [
      entry.spelling,
      entry.attestations.map((attestation) => attestation.countryId),
    ])
  );
}

describe("ledgers and redirects of the wave-6 and wave-7 folds", () => {
  // @req REQ-178
  it.each(PEOPLE_FOLDS)(
    "redirects %s to %s, ruled 2026-10-11",
    (id, keeper) => {
      expect(RETIRED_PEOPLE_IDS[id]).toBe(keeper);
      expect(RETIRED_PEOPLE_IDS[keeper]).toBeUndefined();
      expect(
        retiredIdentifiers.find((entry) => entry.retiredId === id)?.decidedOn
      ).toBe("2026-10-11");
    }
  );

  // @req REQ-133
  it.each(PATRONYME_FOLDS)(
    "redirects %s to %s, ruled 2026-10-11",
    (id, keeper) => {
      expect(RETIRED_PATRONYME_IDS[id]).toBe(keeper);
      expect(RETIRED_PATRONYME_IDS[keeper]).toBeUndefined();
      expect(
        retiredPatronymes.find((entry) => entry.retiredId === id)?.decidedOn
      ).toBe("2026-10-11");
    }
  );

  // @req REQ-133
  it("keeps the earlier PAT_KAMARA fold in the same ledger", () => {
    expect(RETIRED_PATRONYME_IDS.PAT_KAMARA).toBe("PAT_CAMARA");
  });

  // @req REQ-178
  it("leaves no fiche for a retired id, and nothing pointing at one", () => {
    const pattern = new RegExp(`\\b(${RETIRED.join("|")})\\b`);
    const dangling = REFERENCE_ROOTS.flatMap(([root, files]) =>
      filesUnder(resolve(ROOT, root), files)
    ).filter((file) => pattern.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
    for (const [id] of PEOPLE_FOLDS) expect(peopleFile(id)).toBeUndefined();
    for (const [id] of PATRONYME_FOLDS)
      expect(existsSync(resolve(AFRIK, "patronymes", `${id}.json`))).toBe(
        false
      );
  });
});

describe("what the people keepers carry over", () => {
  const sourceTitles = (id: string) =>
    readPeople(id).content.sources.map(
      (source: { title: string }) => source.title
    );

  // @req REQ-178
  it("gives the Lala-Bisa cluster figure its source on PPL_BISA", () => {
    expect(sourceTitles("PPL_BISA")).toContain(
      "Joshua Project – Lala-Bisa in Zambia"
    );
    expect(readPeople("PPL_BISA").content.appellations.exonyms).toContain(
      "Wiza"
    );
  });

  // @req REQ-178
  it("carries the Papelo sub-groups to PPL_ANAFRO_CRIOULO, not the name", () => {
    const crioulo = readPeople("PPL_ANAFRO_CRIOULO");

    expect(
      crioulo.content.ethnicities.some((line: string) =>
        line.startsWith("Fijus di Fidalgu")
      )
    ).toBe(true);
    expect(JSON.stringify(crioulo.content.appellations)).not.toContain(
      "Papelo"
    );
  });

  // @req REQ-178
  it("carries Koyra Chiini and the macro-group's sources to PPL_SONGHAI", () => {
    const songhai = readPeople("PPL_SONGHAI");

    expect(songhai.content.languages.isoCodes).toContain("khq");
    expect(songhai.content.languages.isoCodes).not.toContain("son");
    expect(sourceTitles("PPL_SONGHAI")).toContain(
      "SIL Ethnologue – Songhay languages"
    );
  });

  // @req REQ-178
  it("folds Krahn into PPL_WE and keeps PPL_GUERE as the southern Wè", () => {
    expect(sourceTitles("PPL_WE")).toContain(
      "Minority Rights Group - Krou in Cote d'Ivoire"
    );
    expect(peopleFile("PPL_GUERE")).toBeDefined();
  });

  // @req REQ-178
  it("moves Wanyasa to PPL_NYANJA and the Tanzanian Nyasa to PPL_MPOTO", () => {
    const nyanja = readPeople("PPL_NYANJA");
    const wanyasa = namesOf(nyanja).find((name) => name.nameText === "Wanyasa");

    expect(nyanja.content.appellations.exonyms).toContain("Wanyasa");
    expect(wanyasa?.accounts.map((account) => account.period.from)).toEqual(
      expect.arrayContaining([1865, 1906])
    );
    expect(
      readPeople("PPL_MPOTO").content.origins.historicalSettlementZones.join(
        " "
      )
    ).toContain("Mbamba Bay");
  });

  // @req REQ-178
  it("refocuses PPL_LOBI_BIRIFOR on the Birifor", () => {
    const birifor = readPeople("PPL_LOBI_BIRIFOR");

    expect(birifor.nameMain).toBe("Birifor");
    expect(birifor.content.languages.isoCodes).toEqual(["bfo", "biv"]);
    expect(namesOf(birifor).map((name) => name.nameText)).not.toContain("Lobi");
    expect(birifor.content.appellations.exonyms).not.toContain("Lobi");
  });

  // Fiéloux gives the Lobi self-name on p. 7 of Les sentiers de la nuit.
  // @req REQ-178
  it("keeps the Lobi record on PPL_LOBI, with Fiéloux at p. 7", () => {
    const lobi = namesOf(readPeople("PPL_LOBI")).find(
      (name) => name.nameText === "Lobi"
    );
    const fieloux = JSON.stringify(lobi?.accounts[0]);

    expect(fieloux).toContain("Les sentiers de la nuit");
    expect(fieloux).toContain('"p. 7"');
  });

  // @req REQ-178
  it.each([
    "PPL_BISA",
    "PPL_ANAFRO_CRIOULO",
    "PPL_SONGHAI",
    "PPL_WE",
    "PPL_NYANJA",
    "PPL_MPOTO",
    "PPL_LOBI",
    "PPL_LOBI_BIRIFOR",
  ])("%s cites each title and each locator once", (id) => {
    const { sources } = readPeople(id).content;
    const titles = sources.map((source: { title: string }) => source.title);
    const urls = sources
      .map((source: { url: string | null }) => source.url)
      .filter(Boolean)
      .map((url: string) => url.replace(/\/+$/, ""));

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("what the family-name keepers carry over", () => {
  // @req REQ-133
  it.each([
    ["PAT_DABO", "Darboe", "GMB"],
    ["PAT_FOFANA", "Fofanah", "SLE"],
    ["PAT_YUSUF", "Youssouf", "DJI"],
    ["PAT_YUSUF", "Youssef", "EGY"],
    ["PAT_OUSMANE", "Osman", "SDN"],
    ["PAT_ALI", "Ally", "TZA"],
    ["PAT_BENALI", "Ben Ali", "TUN"],
    ["PAT_ABUBAKAR", "Aboubakar", "CMR"],
    ["PAT_ABUBAKAR", "Aboubacar", "CMR"],
    ["PAT_CISSE", "Ceesay", "GMB"],
    ["PAT_CISSE", "Sesay", "SLE"],
  ])("%s spells it « %s » in %s", (id, spelling, country) => {
    expect(spellingsOf(readName(id)).get(spelling)).toContain(country);
  });

  // Youssouf's written accounts are never lost in the fold.
  // @req REQ-133
  it("keeps Youssouf's name history on PAT_YUSUF", () => {
    const yusuf = readName("PAT_YUSUF");
    const youssouf = namesOf(yusuf).find(
      (name) => name.nameText === "Youssouf"
    );

    expect(youssouf?.accounts).toHaveLength(2);
    expect(
      yusuf.bearers.map((bearer: { displayName: string }) => bearer.displayName)
    ).toContain("Omar Ahmed Youssouf");
    expect(yusuf.nameHistory.summary).toMatch(/Youssouf/);
  });

  // @req REQ-133
  it("keeps the Cameroon source on PAT_ABUBAKAR", () => {
    expect(
      readName("PAT_ABUBAKAR").sources.map(
        (source: { sourceKey: string }) => source.sourceKey
      )
    ).toContain("gabana-bello-2025-cameroon-anthroponyms");
  });

  // @req REQ-133
  it.each([
    "PAT_DABO",
    "PAT_FOFANA",
    "PAT_YUSUF",
    "PAT_OUSMANE",
    "PAT_ALI",
    "PAT_BENALI",
    "PAT_ABUBAKAR",
    "PAT_CISSE",
  ])("%s declares each source once and cites every one", (id) => {
    const fiche = readName(id);
    const keys = fiche.sources.map(
      (source: { sourceKey: string }) => source.sourceKey
    );
    const titles = fiche.sources.map(
      (source: { title: string }) => source.title
    );
    const cited = new Set(
      JSON.stringify(fiche)
        .match(/"sourceRefs":\[[^\]]*\]/g)
        ?.flatMap((block) => block.match(/"([^"[\]]+)"/g) ?? [])
        .map((quoted) => quoted.slice(1, -1))
        .filter((token) => token !== "sourceRefs")
    );

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(titles).size).toBe(titles.length);
    for (const key of cited) expect(keys, `${id}: ${key}`).toContain(key);
  });
});

describe("names kept apart but pointed at each other", () => {
  const text = (id: string) => JSON.stringify(readName(id));

  // @req REQ-133
  it.each([
    ["PAT_MOHAMED", ["Mahamadou", "Mahamat"]],
    ["PAT_MAHAMADOU", ["Mahamat", "Mohamed"]],
    ["PAT_MAHAMAT", ["Mahamadou", "Mohamed"]],
    ["PAT_ABUBAKAR", ["Boubacar"]],
    ["PAT_BOUBACAR", ["Abubakar"]],
    ["PAT_MANDELA", ["Madiba"]],
    ["PAT_MADIBA", ["Mandela"]],
  ] as const)("%s names %j", (id, others) => {
    for (const other of others) expect(text(id)).toContain(other);
  });
});
