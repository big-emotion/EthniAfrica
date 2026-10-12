import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import { loadAllWordFiches } from "../../src/lib/afrik/loaders/wordJsonLoader";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// The duplicates, renames and retirements that waves 12 (peoples) and 13
// (family names) of the long tail found, ruled by the operator on 2026-10-12
// (ETNI-2011). Wave 13 found no family-name duplicate: Said/Saidi,
// Seidi/Saidi, Sassou/Nguesso, Saleh/Soilihi and Khama/Seretse stay apart.

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

const LEDGER_DECISIONS: Array<[string, string, string]> = [
  ["PPL_KHAINAI", "PPL_GONA", "merged"],
  ["PPL_KOYRA", "PPL_KOORETE", "merged"],
  ["PPL_SWAHILI_MOZAMBIQUE", "PPL_MWANI", "renamed"],
];

// Retired with no keeper: the ledger records them as « withdrawn », a
// retirement with no successor and so no redirect.
const RETIRED_WITHOUT_SUCCESSOR = ["PPL_YERIMA", "PPL_KIRDI"];

const RETIRED = [
  ...LEDGER_DECISIONS.map(([id]) => id),
  ...RETIRED_WITHOUT_SUCCESSOR,
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

interface Source {
  title: string;
  page?: string;
  url: string | null;
}

interface Account {
  statement: string;
  birth?: true;
  hypothesisGroup?: string;
  formAsWritten?: string;
  sources: Source[];
}

interface NameEntry {
  nameText: string;
  selfGiven: boolean;
  accounts: Account[];
}

function namesOf(fiche: { nameHistory?: { names: NameEntry[] } }) {
  return fiche.nameHistory?.names ?? [];
}

const citedTitles = (name: NameEntry) =>
  name.accounts.flatMap((account) =>
    account.sources.map((source) => source.title)
  );

describe("ledger and redirects of the wave-12 folds", () => {
  // @req REQ-178
  it.each(LEDGER_DECISIONS)(
    "redirects %s to %s (%s), ruled 2026-10-12",
    (id, keeper, decision) => {
      const entry = retiredIdentifiers.find(
        (candidate) => candidate.retiredId === id
      );

      expect(RETIRED_PEOPLE_IDS[id]).toBe(keeper);
      expect(RETIRED_PEOPLE_IDS[keeper]).toBeUndefined();
      expect(entry?.decision).toBe(decision);
      expect(entry?.decidedOn).toBe("2026-10-12");
      expect(peopleFile(keeper)).toBeDefined();
    }
  );

  // @req REQ-178
  it.each(RETIRED_WITHOUT_SUCCESSOR)(
    "withdraws %s in the ledger, with no keeper to redirect to",
    (id) => {
      const entry = retiredIdentifiers.find(
        (candidate) => candidate.retiredId === id
      );

      expect(entry).toMatchObject({
        decision: "withdrawn",
        successorId: null,
        decidedOn: "2026-10-12",
      });
      expect(entry?.reason.length).toBeGreaterThan(40);
      expect(RETIRED_PEOPLE_IDS[id]).toBeUndefined();
      expect(peopleFile(id)).toBeUndefined();
    }
  );

  // @req REQ-178
  it("leaves no fiche for a retired id, and nothing pointing at one", () => {
    const pattern = new RegExp(`\\b(${RETIRED.join("|")})\\b`);
    const dangling = REFERENCE_ROOTS.flatMap(([root, files]) =>
      filesUnder(resolve(ROOT, root), files)
    ).filter((file) => pattern.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
    for (const id of RETIRED) expect(peopleFile(id)).toBeUndefined();
  });
});

describe("what the keepers carry over", () => {
  // @req REQ-178
  it("moves the ǁGana name history, with both its sources, onto PPL_GONA", () => {
    const gona = readPeople("PPL_GONA");
    const gana = namesOf(gona).find((name) => name.nameText === "ǁGana");

    expect(gona.nameMain).toBe("Gana");
    expect(gana?.selfGiven).toBe(true);
    expect(citedTitles(gana)).toEqual([
      "Glottolog 5.3 — //Gana (gana1274)",
      "A name as a mnemonic device: an ethnographic study of personal names among the Central San (|Gui and ||Gana)",
    ]);
    expect(gona.nameHistory.summary).toMatch(/^Le nom Gana\b/);
    expect(gona.nameHistory.summary).not.toMatch(/Khainai/);
  });

  // @req REQ-178
  it("keeps Koyra as a name of PPL_KOORETE, the Koorete language kqy", () => {
    const koorete = readPeople("PPL_KOORETE");

    expect(koorete.content.languages.isoCodes).toEqual(["kqy"]);
    expect(koorete.content.appellations.exonyms).toContain("Koyra");
    expect(namesOf(koorete).map((name) => name.nameText)).toContain("Koyra");
  });

  // @req REQ-178
  it("refocuses the Mozambican Swahili fiche on the Mwani, as PPL_MWANI", () => {
    const mwani = readPeople("PPL_MWANI");
    const names = namesOf(mwani);
    const waswahili = names.find((name) => name.nameText === "Waswahili");

    expect(peopleFile("PPL_MWANI")).toMatch(/FLG_NIGERCONGO\/PPL_MWANI\.json$/);
    expect(mwani.nameMain).toBe("Mwani");
    expect(mwani.content.appellations.mainName).toBe("Mwani");
    expect(mwani.content.languages.isoCodes).toContain("wmw");
    expect(names[0]).toMatchObject({ nameText: "Mwani", selfGiven: true });
    expect(mwani.nameHistory.summary).toMatch(/^Le nom Mwani\b/);
    expect(
      waswahili?.accounts.find((account) => account.formAsWritten)
    ).toMatchObject({
      formAsWritten: "Kisuaheli",
      sources: [expect.objectContaining({ page: "p. 8" })],
    });
  });

  // @req REQ-178
  it("leaves the Cameroonian Kirdi row as a grouping with no people fiche", () => {
    const cameroon = JSON.parse(
      readFileSync(resolve(AFRIK, "pays/CMR.json"), "utf8")
    );
    const kirdi = cameroon.content.majorPeoples.find(
      (row: { name: string }) => row.name === "Kirdi"
    );

    expect(kirdi.peopleId).toBeNull();
  });
});

describe("the word Kirdi", () => {
  const wordFile = resolve(AFRIK, "mots/WRD_KIRDI.json");
  const kirdiAccounts = (): Account[] => {
    if (!existsSync(wordFile)) return [];
    const word = JSON.parse(readFileSync(wordFile, "utf8"));
    return (
      namesOf(word).find((name) => name.nameText === "Kirdi")?.accounts ?? []
    );
  };
  const pages = (title: RegExp) =>
    kirdiAccounts().flatMap((account) =>
      account.sources
        .filter((source) => title.test(source.title))
        .map((source) => source.page)
    );

  // @req REQ-196
  it("loads as a word fiche, beside WRD_RACE", () => {
    const { words, errors } = loadAllWordFiches(AFRIK);

    expect(errors).toEqual([]);
    expect(words.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["WRD_RACE", "WRD_KIRDI"])
    );
  });

  // @req REQ-196
  it("is born with Denham's « Kirdies » and cites his « Kerdies » note", () => {
    const accounts = kirdiAccounts();
    const birth = accounts.find((account) => account.birth);

    expect(birth?.formAsWritten).toBe("Kirdies");
    expect(birth?.sources[0].page).toBe("p. 45");
    expect(
      accounts.some(
        (account) =>
          account.formAsWritten === "Kerdies" &&
          /Mohammedan faith/.test(account.statement) &&
          account.sources[0].page === "p. 145, note"
      )
    ).toBe(true);
  });

  // @req REQ-196
  it("cites Müller-Kosack p. 27, Pontié p. 7 note 2 and Seignobos's glossary", () => {
    expect(pages(/The Way of the Beer/)).toContain("p. 27");
    expect(pages(/Les Guiziga du Cameroun septentrional/)).toContain(
      "p. 7, note 2"
    );
    expect(pages(/Atlas de la province Extrême-Nord/)).toContain("p. 167-171");
  });

  // @req REQ-196
  it("sets its competing origins side by side in one hypothesis group", () => {
    const origins = kirdiAccounts().filter(
      (account) => account.hypothesisGroup
    );

    expect(origins.length).toBeGreaterThanOrEqual(3);
    expect(
      new Set(origins.map((account) => account.hypothesisGroup)).size
    ).toBe(1);
    for (const origin of origins) expect(origin.statement).toMatch(/selon /);
  });

  // @req REQ-196
  it("tells that the word was taken up as a name of pride", () => {
    const statements = kirdiAccounts()
      .map((account) => account.statement)
      .join(" ");

    expect(statements).toMatch(/Kirditude/);
    expect(statements).toMatch(/Dynamique culturelle kirdi/);
  });
});
