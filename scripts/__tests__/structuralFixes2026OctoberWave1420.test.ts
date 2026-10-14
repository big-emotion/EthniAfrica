import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";

// The structural questions the name-history long tail (ETNI-2011, waves 14 to
// 20) left open after the arbitration of #1729: codes, family filing, scopes,
// two renames and one fold. Ruled on 2026-10-14.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");
const LEDGER_FILE = "_retired-identifiers.json";
const RULED_ON = "2026-10-14";

// Where a live reference to a retired id can sit. The archive notes and the
// demography CSV are frozen exports; the wave plans under docs/editorial/strategy
// are generated before each wave and name subjects not yet worked.
const REFERENCE_ROOTS: Array<[string, RegExp]> = [
  ["dataset/source/afrik", /\.json$/],
  ["docs/editorial", /\.(json|md)$/],
  ["src", /\.(ts|tsx)$/],
  ["scripts/__tests__", /\.ts$/],
];
const GENERATED_PLANS = /name-history-(long-tail-waves|priority-core)\.md$/;

const RENAMES: Array<[string, string]> = [
  ["PPL_KWA", "PPL_GWA"],
  ["PPL_LALA_LAMBA", "PPL_LAMBA_ZAMBIA"],
];
const FOLDS: Array<[string, string]> = [["PPL_NABT", "PPL_NABDAM"]];

// Omotic by Glottolog (Ta-Ne-Omotic, South Omotic, Dizoid, Blue Nile Mao),
// filed under the Cushitic family until now. Their own fiches already say so.
const OMOTIC = [
  "PPL_CHARA",
  "PPL_GOFA",
  "PPL_HAMMER",
  "PPL_KACHAMA",
  "PPL_KARO",
  "PPL_MAO",
  "PPL_MELO",
  "PPL_MOCHA",
  "PPL_NAO",
  "PPL_OYDA",
  "PPL_SHINASHA",
  "PPL_YEM",
  "PPL_ZAYSE",
];
// Dullay and the other lowland East Cushitic languages are Cushitic: they stay.
const CUSHITIC_STAYS = [
  "PPL_TSAMAY",
  "PPL_GAWWADA",
  "PPL_MOSIYE",
  "PPL_ARBORE",
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

const familyFolder = (id: string) => peopleFile(id)?.split("/").at(-2);

const ledgerEntry = (id: string) =>
  retiredIdentifiers.find((candidate) => candidate.retiredId === id);

describe("the renames and the fold of the structural arbitration", () => {
  // @req REQ-178
  it.each(RENAMES)("renames %s to %s, ruled 2026-10-14", (retired, renamed) => {
    expect(ledgerEntry(retired)).toMatchObject({
      decision: "renamed",
      successorId: renamed,
      decidedOn: RULED_ON,
    });
    expect(RETIRED_PEOPLE_IDS[retired]).toBe(renamed);
    expect(peopleFile(renamed)).toBeDefined();
    expect(peopleFile(retired)).toBeUndefined();
    expect(readPeople(renamed).id).toBe(renamed);
  });

  // @req REQ-178
  it.each(FOLDS)("folds %s into %s, ruled 2026-10-14", (retired, keeper) => {
    expect(ledgerEntry(retired)).toMatchObject({
      decision: "merged",
      successorId: keeper,
      decidedOn: RULED_ON,
    });
    expect(RETIRED_PEOPLE_IDS[retired]).toBe(keeper);
    expect(RETIRED_PEOPLE_IDS[keeper]).toBeUndefined();
    expect(peopleFile(keeper)).toBeDefined();
    expect(peopleFile(retired)).toBeUndefined();
  });

  // @req REQ-178
  it("leaves nothing in the corpus that still points at a retired id", () => {
    const retired = [...RENAMES, ...FOLDS].map(([id]) => id);
    const pattern = new RegExp(`\\b(${retired.join("|")})\\b`);
    const dangling = REFERENCE_ROOTS.flatMap(([root, files]) =>
      filesUnder(resolve(ROOT, root), files)
    )
      .filter((file) => !GENERATED_PLANS.test(file))
      .filter((file) => !file.includes("/logs/"))
      .filter(
        (file) => !file.endsWith("structuralFixes2026OctoberWave1420.test.ts")
      )
      .filter((file) => pattern.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
  });

  // @req REQ-178
  it("gives the Gwa their own name, not that of the Kwa language family", () => {
    const gwa = readPeople("PPL_GWA");

    expect(gwa.nameMain).toBe("Gwa");
    expect(gwa.content.appellations.mainName).toBe("Gwa");
    expect(gwa.content.appellations.exonyms).not.toContain("Gwa");
    expect(gwa.content.appellations.exonyms).toContain("M'bato");
  });

  // @req REQ-178
  it("makes the Bantu Lamba of Zambia the Lamba fiche, Lala-Lamba a name", () => {
    const lamba = readPeople("PPL_LAMBA_ZAMBIA");

    expect(lamba.nameMain).toBe("Lamba");
    expect(lamba.content.appellations.mainName).toBe("Lamba");
    expect(lamba.content.appellations.exonyms).toContain("Lala-Lamba");
    expect(lamba.content.appellations.exonyms).not.toContain("Lamba");
    expect(lamba.content.languages.isoCodes).toEqual(["lam"]);
  });

  // @req REQ-178
  it("points the Lamba proverb at the renamed fiche", () => {
    const proverbs = readFileSync(
      resolve(ROOT, "src/lib/proverbs/proverbs.ts"),
      "utf8"
    );

    expect(proverbs).toContain('id: "PPL_LAMBA_ZAMBIA"');
    expect(proverbs).not.toContain("PPL_LALA_LAMBA");
  });

  // @req REQ-178
  it("keeps the Nabdam history on the keeper, filed with the Gur", () => {
    const nabdam = readPeople("PPL_NABDAM");

    expect(familyFolder("PPL_NABDAM")).toBe("FLG_GUR");
    expect(nabdam.languageFamilyId).toBe("FLG_GUR");
    expect(nabdam.nameHistory.names.length).toBeGreaterThan(0);
  });
});

describe("Omotic peoples are filed under the Omotic family", () => {
  // @req REQ-149
  it.each(OMOTIC)("files %s under FLG_OMOTIQUE", (id) => {
    expect(familyFolder(id)).toBe("FLG_OMOTIQUE");
    expect(readPeople(id).languageFamilyId).toBe("FLG_OMOTIQUE");
    expect(
      readPeople(id).content.appellations.linguisticFamily ?? "FLG_OMOTIQUE"
    ).toBe("FLG_OMOTIQUE");
  });

  // @req REQ-149
  it.each(CUSHITIC_STAYS)("leaves %s, a Cushitic people, where it is", (id) => {
    expect(familyFolder(id)).toBe("FLG_COUCHITIQUE");
  });

  // @req REQ-149
  it("no longer tells the Chara that the project files them as Cushitic", () => {
    expect(JSON.stringify(readPeople("PPL_CHARA"))).not.toMatch(
      /classés dans les dossiers du projet|classes sous la famille couchitique/
    );
  });
});

describe("language codes the fiches had wrong", () => {
  // @req REQ-136
  it.each([
    ["PPL_LWIMBI", ["lum"]],
    ["PPL_LAMBA", ["las"]],
    ["PPL_GWA", ["gwa"]],
    ["PPL_ANUM", ["gwx"]],
    // Wogo is a Glottolog dialect of Zarma-Kaado with no code of its own:
    // ses is Koyraboro Senni, a different Songhay language.
    ["PPL_WOGO", []],
  ])("gives %s the codes %j", (id, codes) => {
    expect(readPeople(id).content.languages.isoCodes).toEqual(codes);
  });

  // @req REQ-136
  it.each([
    ["PPL_LWIMBI", "luim1238"],
    ["PPL_LAMBA", "lama1275"],
    ["PPL_GWA", "mbat1247"],
    ["PPL_WOGO", "wogo1234"],
  ])("cites the Glottolog page that holds the code of %s", (id, languoid) => {
    const urls = readPeople(id).content.sources.map(
      (source: { url?: string }) => source.url
    );

    expect(urls).toContain(
      `https://glottolog.org/resource/languoid/id/${languoid}`
    );
  });
});

describe("scope and region corrections", () => {
  // @req REQ-136
  it("no longer lists Nao, a different people, as an exonym of the Mao", () => {
    expect(readPeople("PPL_MAO").content.appellations.exonyms).not.toContain(
      "Nao"
    );
  });

  // @req REQ-136
  it("places the Mukulu in the north of Zambia, not in the Western Province", () => {
    const mukulu = readPeople("PPL_MUKULU");
    const region = JSON.stringify(mukulu.content);

    expect(region).not.toMatch(/Province de l'Ouest/);
    expect(mukulu.content.appellations.historicalRegion).toMatch(/Bangweulu/);
  });

  // @req REQ-136
  it("scopes the Nyika to the Nyika of Malawi and Zambia (nkv)", () => {
    const nyika = readPeople("PPL_NYIKA");

    expect(nyika.currentCountries).toEqual(["ZMB", "MWI"]);
    expect(nyika.content.appellations.currentCountries).toEqual(["ZMB", "MWI"]);
    expect(nyika.content.appellations.exonyms).not.toContain("Nyiha");
    expect(
      nyika.content.demography.distributionByCountry.map(
        (row: { country: string }) => row.country
      )
    ).toEqual(["ZMB", "MWI"]);
    expect(nyika.content.demography.totalPopulation).toBe(75000);
  });
});

describe("cross-references between neighbouring name histories", () => {
  const summary = (id: string) => readPeople(id).nameHistory.summary as string;

  // @req REQ-178
  it.each([
    ["PPL_TUMBATU", /fiche des Hadimu/],
    ["PPL_TUMBATU", /fiche des Shirazi/],
    ["PPL_HADIMU", /fiche des Tumbatu/],
    ["PPL_HADIMU", /fiche des Shirazi/],
    ["PPL_SHIRAZI", /Tumbatu/],
    ["PPL_SHIRAZI", /Hadimu/],
  ])("sends the reader of %s to the neighbouring fiche (%s)", (id, pointer) => {
    expect(summary(id)).toMatch(pointer);
  });

  // @req REQ-178
  it.each(["PPL_KWANDI", "PPL_KWANGWA"])(
    "sends the reader of %s to the Lozi for the older name Luyi",
    (id) => {
      expect(summary(id)).toMatch(/fiche des Lozi/);
    }
  );

  // @req REQ-178
  it("lists on the Lozi fiche the peoples that came from the Luyi", () => {
    const lozi = summary("PPL_LOZI");

    for (const name of ["Kwangwa", "Kwandi", "Luyana"])
      expect(lozi).toContain(name);
  });
});
