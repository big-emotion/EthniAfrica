import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import retiredPatronymes from "../../dataset/source/afrik/patronymes/_retired-identifiers.json";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";

const RETIRED_PATRONYME_IDS: Record<string, string> = Object.fromEntries(
  retiredPatronymes.map((entry) => [entry.retiredId, entry.successorId])
);

// The duplicates that waves 8 (peoples) and 9 (family names) of the long tail
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
  ["PPL_ARI", "PPL_AARI"],
  ["PPL_BERI", "PPL_ZAGHAWA"],
  ["PPL_MAHN", "PPL_MANO"],
  ["PPL_MWANGA", "PPL_NAMWANGA"],
  ["PPL_SANGO", "PPL_SANGO_SCT"],
  ["PPL_BABUR", "PPL_BURA"],
  ["PPL_KOULOUGO", "PPL_KOULANGO"],
  ["PPL_KLAO", "PPL_KRU"],
  ["PPL_LALA_LENJE", "PPL_LENJE"],
  ["PPL_MANJAK_BAINUK", "PPL_MANJAK"],
];

// PAT_ABUBAKAR → PAT_ABOUBAKAR is not here: #1661 had already folded
// PAT_ABOUBAKAR into PAT_ABUBAKAR, the final keeper.
const PATRONYME_FOLDS: Array<[string, string]> = [
  ["PAT_MOUSSA", "PAT_MUSA"],
  ["PAT_ABDALLA", "PAT_ABDALLAH"],
  ["PAT_DA_SILVA", "PAT_SILVA"],
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

interface NameEntry {
  nameText: string;
  accounts: Array<{ period: { from: number | null }; birth?: true }>;
}

function namesOf(fiche: { nameHistory?: { names: NameEntry[] } }) {
  return fiche.nameHistory?.names ?? [];
}

const sourceTitles = (id: string): string[] =>
  readPeople(id).content.sources.map(
    (source: { title: string }) => source.title
  );

describe("ledgers and redirects of the wave-8 and wave-9 folds", () => {
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
  it("keeps PAT_ABUBAKAR as the keeper of the Aboubakar forms", () => {
    expect(RETIRED_PATRONYME_IDS.PAT_ABOUBAKAR).toBe("PAT_ABUBAKAR");
    expect(existsSync(resolve(AFRIK, "patronymes", "PAT_ABUBAKAR.json"))).toBe(
      true
    );
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
  // @req REQ-178
  it("gives PPL_AARI the Ara and Aro forms Glottolog lists", () => {
    const exonyms = readPeople("PPL_AARI").content.appellations.exonyms;

    expect(exonyms).toEqual(expect.arrayContaining(["Ara", "Aro"]));
  });

  // @req REQ-178
  it("lists PPL_AARI under the Omotic family", () => {
    const family = JSON.parse(
      readFileSync(
        resolve(AFRIK, "famille_linguistique/FLG_OMOTIQUE.json"),
        "utf8"
      )
    );

    expect(JSON.stringify(family)).toContain('"PPL_AARI"');
  });

  // @req REQ-178
  it("carries Libya and its source to PPL_ZAGHAWA", () => {
    expect(readPeople("PPL_ZAGHAWA").currentCountries).toContain("LBY");
    expect(sourceTitles("PPL_ZAGHAWA")).toContain(
      "Joshua Project — Zaghawa in Libya"
    );
  });

  // @req REQ-178
  it.each([
    ["PPL_MANO", "Ethnologue – Maan language (mev), SIL International, 2024"],
    ["PPL_NAMWANGA", "Mwanga of Zambia – PeopleGroups.org"],
    ["PPL_SANGO_SCT", "APiCS Online — Survey chapter: Sango (lingua franca)"],
    ["PPL_KOULANGO", "Ethnologue — Kulango, Bondoukou (KZC)"],
    ["PPL_KRU", "Minority Rights Group — Liberia"],
    [
      "PPL_LENJE",
      "Boswell, D. – Chipimpi, Vulgar Clans, and Lala-Lamba Ethnohistory (reference aux Lenje), 2008",
    ],
  ])("%s cites « %s »", (id, title) => {
    expect(sourceTitles(id)).toContain(title);
  });

  // @req REQ-178
  it("keeps Babur and Pabir as names of PPL_BURA", () => {
    const names = namesOf(readPeople("PPL_BURA")).map((name) => name.nameText);

    expect(names).toEqual(expect.arrayContaining(["Babur", "Pabir"]));
  });

  // @req REQ-178
  it("splits the Gambian Manjak / Bainuk row into the two peoples", () => {
    const gambia = JSON.stringify(
      JSON.parse(readFileSync(resolve(AFRIK, "pays/GMB.json"), "utf8"))
    );

    expect(gambia).toContain('"PPL_MANJAK"');
    expect(gambia).toContain('"PPL_BAINOUK"');
    expect(readPeople("PPL_BAINOUK").content.languages.isoCodes).toContain(
      "bcb"
    );
  });

  // @req REQ-178
  it("repoints the Central African and Congolese rows to PPL_SANGO_SCT", () => {
    for (const country of ["CAF", "COG"]) {
      const text = readFileSync(resolve(AFRIK, `pays/${country}.json`), "utf8");
      expect(text).toContain('"PPL_SANGO_SCT"');
    }
  });

  // @req REQ-178
  it.each([
    "PPL_AARI",
    "PPL_ZAGHAWA",
    "PPL_MANO",
    "PPL_NAMWANGA",
    "PPL_SANGO_SCT",
    "PPL_KOULANGO",
    "PPL_KRU",
    "PPL_LENJE",
    "PPL_JARAWA",
    "PPL_AFIZERE",
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

describe("the Jarawa split", () => {
  // @req REQ-178
  it("keeps PPL_JARAWA for the Jarawa of Bauchi, who speak Bankal and Gwak", () => {
    const jarawa = readPeople("PPL_JARAWA");

    expect(jarawa.content.languages.isoCodes).toEqual(["jjr", "jgk"]);
    expect(JSON.stringify(jarawa.content)).not.toMatch(/Agwom|Fobur/);
    expect(namesOf(jarawa).map((name) => name.nameText)).not.toContain(
      "Afizere"
    );
  });

  // @req REQ-178
  it("gives the Afizere of Jos a fiche of their own, speaking Izere", () => {
    const afizere = readPeople("PPL_AFIZERE");
    const names = namesOf(afizere).map((name) => name.nameText);

    expect(afizere.languageFamilyId).toBe("FLG_BENOUECONGO");
    expect(afizere.content.languages.isoCodes).toEqual(["izr"]);
    expect(names).toEqual(
      expect.arrayContaining(["Afizere", "Jarawa", "Fuganang"])
    );
    expect(
      namesOf(afizere)
        .find((name) => name.nameText === "Jarawa")
        ?.accounts.some((account) => account.birth)
    ).toBe(true);
  });

  // @req REQ-178
  it("cites no candidate-queue source on the new fiche", () => {
    const kinds = readPeople("PPL_AFIZERE").content.sources.map(
      (source: { source_kind?: string }) => source.source_kind
    );

    expect(kinds).not.toContain("ai_generated");
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

  // @req REQ-133
  it.each([
    ["PAT_MUSA", "Moussa", "NER"],
    ["PAT_ABDALLAH", "Abdalla", "SDN"],
    ["PAT_SILVA", "da Silva", "AGO"],
    ["PAT_SILVA", "Silva", "AGO"],
  ])("%s spells it « %s » in %s", (id, spelling, country) => {
    expect(spellings(id).get(spelling)).toContain(country);
  });

  // @req REQ-133
  it("keeps Moussa's Niger and Zarma facts on PAT_MUSA", () => {
    const musa = readName("PAT_MUSA");

    expect(
      musa.countries.map((entry: { countryId: string }) => entry.countryId)
    ).toContain("NER");
    expect(
      musa.peoples.map((entry: { peopleId: string }) => entry.peopleId)
    ).toContain("PPL_ZARMA");
  });

  // @req REQ-133
  it("keeps the Angola attestation on PAT_SILVA", () => {
    expect(
      readName("PAT_SILVA").countries.map(
        (entry: { countryId: string }) => entry.countryId
      )
    ).toContain("AGO");
  });

  // @req REQ-133
  it.each(["PAT_MUSA", "PAT_ABDALLAH", "PAT_SILVA"])(
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
