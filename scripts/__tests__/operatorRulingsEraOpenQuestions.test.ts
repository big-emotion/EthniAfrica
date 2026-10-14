import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The era rulings of 2026-10-14 on the questions that waves 14 to 20 of the
// long tail (ETNI-2011) left open. Each case reads the fiche a reader would
// get; the reasoning is in docs/editorial/strategy/colonial-periods.md.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");

interface Account {
  period: { from: number | null; to: number | null; label: string };
  era?: string;
}

function accountsOf(fiche: string, name: string, label: string): Account[] {
  const data = JSON.parse(
    readFileSync(resolve(AFRIK, `${fiche}.json`), "utf8")
  );
  const entry = data.nameHistory.names.find(
    (candidate: { nameText: string }) => candidate.nameText === name
  );
  if (!entry) throw new Error(`no name « ${name} » in ${fiche}`);
  return entry.accounts.filter(
    (account: Account) => account.period.label === label
  );
}

// [fiche, name, period label, era]. `null`: ruled to stay without an era.
const ERA_RULINGS: Array<[string, string, string, string | null]> = [
  // Great Kabylia was conquered in 1857; Daumas's edition is of 1855.
  [
    "patronymes/PAT_AIT_MENGUELLET",
    "Aït Menguellet",
    "Édition de 1855",
    "polity",
  ],
  // Egypt before 1882 is an Ottoman province, the French occupation included.
  ["patronymes/PAT_GUIRGUIS", "Guirguis", "1801 (1216 de l'hégire)", "polity"],
  [
    "patronymes/PAT_EL_SAYED",
    "El Sayed",
    "Mort en 1121 de l'hégire (1709)",
    "polity",
  ],
  // German administration reached the Nyasa shore in January 1893.
  ["peuples/FLG_BANTU/PPL_KISI", "Kisi", "1900", "colonial"],
  // The Misahöhe station dates from 1890.
  ["peuples/FLG_KWA/PPL_AVATIME", "Avatime", "1898", "colonial"],
  ["peuples/FLG_KWA/PPL_LOGBA", "Logba", "1898", "colonial"],
  ["peuples/FLG_KWA/PPL_TUTRUGBU", "Nyangbo", "1898", "colonial"],
  ["peuples/FLG_KWA/PPL_TAFI", "Tafi", "1898", "colonial"],
  // The Gaza kingdom stood until the Portuguese victory of 1895.
  [
    "peuples/FLG_NIGERCONGO/PPL_TSONGA",
    "Shangaan",
    "Royaume de Gaza, de 1821 environ à 1895",
    "polity",
  ],
  // Wa: treaties of 1896, district of 1897, protectorate of 1901.
  ["peuples/FLG_NIGERCONGO/PPL_WALA", "Wala", "1898", "colonial"],
  // Suriname: Dutch colony from 1667, independent on 25 November 1975.
  [
    "peuples/FLG_CREOLE/PPL_SAAMAKA",
    "Saamaka",
    "Entre 1690 et 1712",
    "colonial",
  ],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Ndyuka", "1712-1760", "colonial"],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Okanisi", "Mai 2022", "modern"],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Okanisi", "Rapportée en 2022", "modern"],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Okanisi", "Proposée en 2002", "modern"],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Okanisi", "1994", "modern"],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Ndyuka", "Usage contemporain", "modern"],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Ndyuka", "Rapportée en 2022", "modern"],
  [
    "peuples/FLG_CREOLE/PPL_OKANISI",
    "Bush Negroes",
    "Usage contemporain",
    "modern",
  ],
  // Left without an era: Mahdist Sudan 1885-1898, the Maroon interior after
  // the treaties, Kondoa before a date of occupation can be opened.
  ["patronymes/PAT_DIGNA", "Digna", "1891", null],
  ["patronymes/PAT_DENG", "Deng", "1887", null],
  ["peuples/FLG_CREOLE/PPL_SAAMAKA", "Saramaka", "1770", null],
  ["peuples/FLG_CREOLE/PPL_OKANISI", "Ndyuka", "1931", null],
  ["peuples/FLG_COUCHITIQUE/PPL_ALAGWA", "Wasi", "1898", null],
  ["peuples/FLG_COUCHITIQUE/PPL_ALAGWA", "Wasi", "Rapportée en 1900", null],
];

describe("era rulings of 2026-10-14 on waves 14 to 20", () => {
  // @req REQ-178
  it.each(ERA_RULINGS)("%s « %s » %s is %s", (fiche, name, label, era) => {
    const accounts = accountsOf(fiche, name, label);

    expect(accounts.length).toBeGreaterThan(0);
    for (const account of accounts) expect(account.era ?? null).toBe(era);
  });

  // @req REQ-178
  it("records the rows and the rulings in the colonial-periods table", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/editorial/strategy/colonial-periods.md"),
      "utf8"
    );

    expect(doc).toMatch(/\| Great Kabylia/);
    expect(doc).toMatch(/\| Suriname/);
    expect(doc).toContain("25 November 1975");
    expect(doc).toMatch(/Rulings of 2026-10-14/);
  });
});
