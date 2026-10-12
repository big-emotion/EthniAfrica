import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import retiredPatronymes from "../../dataset/source/afrik/patronymes/_retired-identifiers.json";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";

const RETIRED_PATRONYME_IDS: Record<string, string> = Object.fromEntries(
  retiredPatronymes.map((entry) => [entry.retiredId, entry.successorId])
);

// The duplicates that waves 10 (peoples) and 11 (family names) of the long
// tail found, folded on the operator's ruling of 2026-10-12 (ETNI-2011).

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");
const LEDGER_FILE = "_retired-identifiers.json";
const RULED_ON = "2026-10-12";

// Where a live reference to an id can sit. The archive `.txt` notes and the
// demography CSV are frozen exports, left alone by every earlier fold.
const REFERENCE_ROOTS: Array<[string, RegExp]> = [
  ["dataset/source/afrik", /\.json$/],
  ["docs/editorial", /\.(json|md)$/],
  ["src", /\.(ts|tsx)$/],
];

const PEOPLE_FOLDS: Array<[string, string]> = [
  ["PPL_SURMA", "PPL_SURI"],
  ["PPL_BIJAOGO", "PPL_BIDYOGO"],
  ["PPL_BIJAGO_BIDYOGO", "PPL_BIDYOGO"],
  ["PPL_FANG_GABON", "PPL_FANG"],
  ["PPL_FANG_EQGUINEE", "PPL_FANG"],
  ["PPL_BETI_FANG", "PPL_BETI"],
  ["PPL_WEST_TAA", "PPL_TAA"],
  ["PPL_TSAO_KXA", "PPL_HOA"],
  ["PPL_GBELE", "PPL_KPELLE"],
  ["PPL_NDEBELE_MZ", "PPL_NGUNI"],
  ["PPL_NDEBELE_MACRO", "PPL_NDEBELE"],
];

// Not a duplicate: the fiche was never about a Swahili people. It keeps its
// subject under the name the sources give it.
const PEOPLE_RENAMES: Array<[string, string]> = [
  ["PPL_SWAHILI_YEMEN", "PPL_MUWALLADEEN"],
];

const PATRONYME_FOLDS: Array<[string, string]> = [
  ["PAT_TURAY", "PAT_TOURE"],
  ["PAT_TOURAY", "PAT_TOURE"],
  ["PAT_TESFAY", "PAT_TESFAYE"],
];

const RETIRED = [...PEOPLE_FOLDS, ...PEOPLE_RENAMES, ...PATRONYME_FOLDS].map(
  ([id]) => id
);

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

function readFamily(id: string) {
  return JSON.parse(
    readFileSync(resolve(AFRIK, "famille_linguistique", `${id}.json`), "utf8")
  );
}

function readName(id: string) {
  return JSON.parse(
    readFileSync(resolve(AFRIK, "patronymes", `${id}.json`), "utf8")
  );
}

const sourceTitles = (id: string): string[] =>
  readPeople(id).content.sources.map(
    (source: { title: string }) => source.title
  );

const exonymsOf = (id: string): string[] =>
  readPeople(id).content.appellations.exonyms;

describe("ledgers and redirects of the wave-10 and wave-11 folds", () => {
  // @req REQ-178
  it.each(PEOPLE_FOLDS)("redirects %s to %s as a merge", (id, keeper) => {
    const entry = retiredIdentifiers.find((row) => row.retiredId === id);

    expect(RETIRED_PEOPLE_IDS[id]).toBe(keeper);
    expect(RETIRED_PEOPLE_IDS[keeper]).toBeUndefined();
    expect(entry?.decision).toBe("merged");
    expect(entry?.decidedOn).toBe(RULED_ON);
  });

  // @req REQ-178
  it.each(PEOPLE_RENAMES)("redirects %s to %s as a rename", (id, successor) => {
    const entry = retiredIdentifiers.find((row) => row.retiredId === id);

    expect(RETIRED_PEOPLE_IDS[id]).toBe(successor);
    expect(RETIRED_PEOPLE_IDS[successor]).toBeUndefined();
    expect(entry?.decision).toBe("renamed");
    expect(entry?.decidedOn).toBe(RULED_ON);
  });

  // @req REQ-133
  it.each(PATRONYME_FOLDS)("redirects %s to %s", (id, keeper) => {
    expect(RETIRED_PATRONYME_IDS[id]).toBe(keeper);
    expect(RETIRED_PATRONYME_IDS[keeper]).toBeUndefined();
    expect(
      retiredPatronymes.find((entry) => entry.retiredId === id)?.decidedOn
    ).toBe(RULED_ON);
  });

  // @req REQ-178
  it("leaves no fiche for a retired id, and nothing pointing at one", () => {
    const pattern = new RegExp(`\\b(${RETIRED.join("|")})\\b`);
    const dangling = REFERENCE_ROOTS.flatMap(([root, files]) =>
      filesUnder(resolve(ROOT, root), files)
    ).filter((file) => pattern.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
    for (const [id] of [...PEOPLE_FOLDS, ...PEOPLE_RENAMES])
      expect(peopleFile(id)).toBeUndefined();
    for (const [id] of PATRONYME_FOLDS)
      expect(existsSync(resolve(AFRIK, "patronymes", `${id}.json`))).toBe(
        false
      );
  });
});

describe("the Suri keeper", () => {
  // @req REQ-178
  it("takes the Shuri, Dhuri and Churi forms Glottolog lists", () => {
    expect(exonymsOf("PPL_SURI")).toEqual(
      expect.arrayContaining(["Shuri", "Dhuri", "Churi"])
    );
    expect(sourceTitles("PPL_SURI")).toContain(
      "Joshua Project — Suri, Tirmaga-Chai in Ethiopia"
    );
  });

  // @req REQ-178
  it("sits in the Nilo-Saharan family with Majang, not in Cushitic", () => {
    const suri = readPeople("PPL_SURI");

    expect(peopleFile("PPL_SURI")).toContain("/FLG_NILOSAHARIENNE/");
    expect(suri.languageFamilyId).toBe("FLG_NILOSAHARIENNE");
    expect(suri.content.appellations.linguisticFamily).toBe(
      "FLG_NILOSAHARIENNE"
    );
    expect(
      readFamily("FLG_NILOSAHARIENNE").content.associatedPeoples.map(
        (member: { peopleId: string }) => member.peopleId
      )
    ).toContain("PPL_SURI");
  });
});

describe("what the other people keepers carry over", () => {
  // @req REQ-178
  it("gives PPL_BIDYOGO the Bugago form and the Guinea-Bissau row", () => {
    expect(exonymsOf("PPL_BIDYOGO")).toContain("Bugago");
    expect(readFileSync(resolve(AFRIK, "pays/GNB.json"), "utf8")).toContain(
      '"PPL_BIDYOGO"'
    );
  });

  // @req REQ-178
  it("names the Esangui clan on PPL_FANG", () => {
    expect(JSON.stringify(readPeople("PPL_FANG").content.ethnicities)).toMatch(
      /Esangui/
    );
  });

  // @req REQ-178
  it.each([
    ["PPL_SURI", "Joshua Project — Suri, Tirmaga-Chai in Ethiopia"],
    ["PPL_BIDYOGO", "Joshua Project – Bijogo in Guinea-Bissau"],
    [
      "PPL_BIDYOGO",
      "Minority Rights Group – Guinea-Bissau country profile, 2024",
    ],
    ["PPL_FANG", "Minority Rights Group — Equatorial Guinea"],
    ["PPL_BETI", "Encyclopedia Britannica — Fang"],
    ["PPL_TAA", "Glottolog — West !Xoon"],
  ])("%s cites « %s »", (id, title) => {
    expect(sourceTitles(id)).toContain(title);
  });

  // @req REQ-178
  it("leaves Hietshware to the Tshwa", () => {
    expect(exonymsOf("PPL_SHUA")).not.toContain("Hietshware");
    expect(exonymsOf("PPL_TSHUWA")).toContain("Hietshware");
  });

  // @req REQ-178
  it.each([
    "PPL_SURI",
    "PPL_BIDYOGO",
    "PPL_FANG",
    "PPL_BETI",
    "PPL_TAA",
    "PPL_HOA",
    "PPL_KPELLE",
    "PPL_NGUNI",
    "PPL_NDEBELE",
    "PPL_MUWALLADEEN",
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

describe("the Muwalladeen fiche", () => {
  // @req REQ-178
  it("names the Muwalladeen and keeps their name history", () => {
    const fiche = readPeople("PPL_MUWALLADEEN");

    expect(fiche.nameMain).toBe("Muwalladeen");
    expect(fiche.content.appellations.mainName).toBe("Muwalladeen");
    expect(
      fiche.nameHistory.names.map((name: { nameText: string }) => name.nameText)
    ).toEqual(["Muwalladeen"]);
  });

  // @req REQ-178
  it("does not give the Muwalladeen the names of the Akhdam", () => {
    const { appellations, ethnicities } = readPeople("PPL_MUWALLADEEN").content;
    const names = JSON.stringify([
      appellations.selfAppellation,
      appellations.exonyms,
      ethnicities,
    ]);

    expect(names).not.toMatch(/Akhdam|Muhamasheen/);
  });
});

describe("what the family-name keepers carry over", () => {
  const spellings = (id: string) =>
    new Map(
      readName(id).spellings.map(
        (entry: {
          spelling: string;
          attestations: Array<{ countryId: string }>;
        }) => [
          entry.spelling,
          entry.attestations.map((attestation) => attestation.countryId),
        ]
      )
    );
  const countries = (id: string) =>
    readName(id).countries.map(
      (entry: { countryId: string }) => entry.countryId
    );

  // @req REQ-133
  it.each([
    ["PAT_TOURE", "Turay", "SLE"],
    ["PAT_TOURE", "Touray", "GMB"],
    ["PAT_TESFAYE", "Tesfay", "ERI"],
    ["PAT_TESFAYE", "Tesfai", "ERI"],
  ])("%s spells it « %s » in %s", (id, spelling, country) => {
    expect(spellings(id).get(spelling)).toContain(country);
    expect(countries(id)).toContain(country);
  });

  // @req REQ-133
  it.each(["PAT_TOURE", "PAT_TESFAYE"])(
    "%s declares each source once and cites every one",
    (id) => {
      const fiche = readName(id);
      const keys = fiche.sources.map(
        (source: { sourceKey: string }) => source.sourceKey
      );
      const cited = new Set(
        JSON.stringify(fiche)
          .match(/"sourceRefs":\[[^\]]*\]/g)
          ?.flatMap((block) => block.match(/"([^"[\]]+)"/g) ?? [])
          .map((quoted) => quoted.slice(1, -1))
          .filter((token) => token !== "sourceRefs")
      );

      expect(new Set(keys).size).toBe(keys.length);
      for (const key of cited) expect(keys, `${id}: ${key}`).toContain(key);
    }
  );
});
