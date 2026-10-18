import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The operator's rulings of 2026-10-18 on the era and evidence questions that
// waves 24 and 25 of the long tail (ETNI-2011) and their arbitration (#1842)
// left open. The operator approved every recommendation; the reasoning is in
// colonial-periods.md and name-history-priority-core.md. Each case reads the
// fiche a reader would get.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");

interface Account {
  period: { from: number | null; to: number | null; label: string };
  era?: string;
  statement: string;
  hypothesisGroup?: string;
}

interface NameEntry {
  nameText: string;
  accounts: Account[];
}

function readFiche(relativePath: string): {
  nameHistory: { names: NameEntry[] };
} {
  return JSON.parse(
    readFileSync(resolve(AFRIK, `${relativePath}.json`), "utf8")
  );
}

function readDoc(relativePath: string) {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function accountsOf(fiche: string, name: string) {
  const entry = readFiche(fiche).nameHistory.names.find(
    (candidate) => candidate.nameText === name
  );
  if (!entry) throw new Error(`no name « ${name} » in ${fiche}`);
  return entry.accounts;
}

function everyAccountOf(fiche: string) {
  return readFiche(fiche).nameHistory.names.flatMap((entry) => entry.accounts);
}

const PALENQUERO = "peuples/FLG_CREOLE/PPL_PALENQUERO";
const RAIZAL = "peuples/FLG_CREOLE/PPL_RAIZAL";
const SCT_FAMILY = "famille_linguistique/FLG_SOUDANIQUECENTRAL";

// The Colombia row: Spanish rule until the Republic of Colombia was proclaimed
// on 17 December 1819, `modern` after it.
const COLOMBIA_MODERN_FROM = 1819;

// [fiche, name, period.from, era]. `null`: ruled to stay without an era.
const ERA_RULINGS: Array<[string, string, number, string | null]> = [
  // Johnston wrote as the protectorate's former Special Commissioner; the
  // Uganda protectorate dates from 1894. Keane's Upper Nile of 1898-1899 was
  // not yet under one rule.
  ["peuples/FLG_NILOTIQUE/PPL_NILOTIQUE_MACRO", "Nilotes", 1902, "colonial"],
  ["peuples/FLG_NILOTIQUE/PPL_NILOTIQUE_MACRO", "Nilotes", 1899, null],
  // Greenberg's first articles, 1949-1950: every Saharan and Central Sudanic
  // territory was then under colonial rule. The family fiches now agree with
  // the macro fiches.
  ["famille_linguistique/FLG_SAHARIEN", "Saharien", 1949, "colonial"],
  ["peuples/FLG_SAHARIEN/PPL_SAHARIEN_MACRO", "Sahariens", 1949, "colonial"],
  [SCT_FAMILY, "Soudanique central", 1949, "colonial"],
  [
    "peuples/FLG_SOUDANIQUECENTRAL/PPL_SCT_MACRO",
    "Soudaniques centraux",
    1949,
    "colonial",
  ],
  // Delagoa Bay had only a Dutch fort in 1730 (rule 5), as for the birth.
  ["patronymes/PAT_BALOYI", "Baloyi", 1730, "polity"],
  ["patronymes/PAT_BALOYI", "Baloyi", 1729, "polity"],
  // The new Colombia row.
  [PALENQUERO, "Palenqueros", 1713, "colonial"],
  [PALENQUERO, "Palenqueros", 1948, "modern"],
  [PALENQUERO, "Palenqueros", 2001, "modern"],
  [PALENQUERO, "Palenqueros", 2018, "modern"],
  [RAIZAL, "Raizales", 1953, "modern"],
  [RAIZAL, "Raizales", 1991, "modern"],
  // Confirmed as they are.
  ["peuples/FLG_CREOLE/PPL_ANNOBON", "Annobonais", 1777, null],
  ["peuples/FLG_BANTU/PPL_PYGMEES_AUTOCHTONES", "Pygmée", 1888, null],
  ["peuples/FLG_ATLANTIQUE/PPL_NALU", "Nalou", 1879, null],
  ["peuples/FLG_ATLANTIQUE/PPL_KUSSI", "Kasanga", 1841, "polity"],
  ["patronymes/PAT_CO", "Có", 1885, null],
];

describe("era rulings of 2026-10-18 on waves 24 and 25", () => {
  // @req REQ-178
  it.each(ERA_RULINGS)("%s « %s » %s is %s", (fiche, name, from, era) => {
    const accounts = accountsOf(fiche, name).filter(
      (account) => account.period.from === from
    );

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era ?? null).toBe(era);
  });

  // Rule 8 would leave a period running to 1963 without an era: the account
  // keeps Greenberg's 1949-1950 and 1954 tables, and the 1963 placement stays
  // told by its own hypothesis tile.
  // @req REQ-178
  it("ends the Central Sudanic account of Greenberg's first articles in 1954", () => {
    const accounts = accountsOf(SCT_FAMILY, "Soudanique central");
    const firstArticles = accounts.filter(({ period }) => period.from === 1949);

    expect(firstArticles).toHaveLength(1);
    expect(firstArticles[0].period.to).toBe(1954);
    expect(firstArticles[0].statement).not.toMatch(/1963/);
    expect(
      accounts.some(
        (account) =>
          account.period.from === 1963 && /chari-nil/.test(account.statement)
      )
    ).toBe(true);
  });

  // @req REQ-178
  it.each([PALENQUERO, RAIZAL])(
    "gives every %s account the era of the Colombia row",
    (fiche) => {
      const accounts = everyAccountOf(fiche);

      expect(accounts.length).toBeGreaterThan(0);
      for (const account of accounts) {
        const colonial =
          account.period.from !== null &&
          account.period.from < COLOMBIA_MODERN_FROM;
        expect(account.era).toBe(colonial ? "colonial" : "modern");
      }
    }
  );

  // @req REQ-178
  it("records the Colombia row and the rulings in the colonial-periods table", () => {
    const doc = readDoc("docs/editorial/strategy/colonial-periods.md");

    expect(doc).toMatch(/\| Colombia/);
    expect(doc).toContain("17 Dec. 1819");
    expect(doc).toMatch(/## Rulings of 2026-10-18/);
    expect(doc).toMatch(/Letsie/);
  });
});
