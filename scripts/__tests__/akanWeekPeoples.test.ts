import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Each Akan day name is carried by several peoples, under several forms, and
// not always on the same day. Dolphyne (1975, published 1986) and Grottanelli
// (1977) add the Nzema and state the gap outright: the Nzema give Twi names on
// Twi days while using Baoulé-Agni day words. Every family fiche should walk a
// reader through boy, girl and day, people by people.

interface Account {
  statement: string;
  period: { from: number | null };
  birth?: true;
  sources: Array<{ author: string }>;
}

interface Fiche {
  _meta: { directives: string };
  spellings: Array<{ spelling: string }>;
  peoples: Array<{ peopleId: string }>;
  nameHistory: { summary: string; names: Array<{ accounts: Account[] }> };
}

const path = (id: string) =>
  resolve(process.cwd(), `dataset/source/afrik/patronymes/${id}.json`);
const readFiche = (id: string): Fiche =>
  JSON.parse(readFileSync(path(id), "utf8"));
const accountsOf = (fiche: Fiche) =>
  fiche.nameHistory.names.flatMap((name) => name.accounts);

const FAMILIES = [
  { id: "PAT_KOUASSI", nzema: ["Kwasi", "Akasi"], fante: "Kwesi" },
  { id: "PAT_KOUADIO", nzema: ["Kodwo", "Adwoba"], fante: "Kojo" },
  { id: "PAT_KWABENA", nzema: ["Kabenla", "Abenlema"], fante: "Kobina" },
  { id: "PAT_KOUAKOU", nzema: ["Kaku", "Akuba"], fante: "Kweku" },
  { id: "PAT_YAO", nzema: ["Kwao", "Yaba"], fante: "Ekow" },
  { id: "PAT_KOFI", nzema: ["Kofi", "Afiba"], fante: "Fiifi" },
  { id: "PAT_KWAME", nzema: ["Kwame", "Ama"], fante: "Kwamina" },
  { id: "PAT_KOUAME", nzema: ["Kwame", "Ama"], fante: "Kwamina" },
];

describe.each(FAMILIES)("the day-name family $id", ({ id, nzema, fante }) => {
  // @req REQ-196
  it("exists", () => {
    expect(existsSync(path(id))).toBe(true);
  });

  const fiche = existsSync(path(id)) ? readFiche(id) : null;

  // @req REQ-196
  it("walks through the peoples: Nzema boy and girl, Fante form", () => {
    const peoples = accountsOf(fiche).find((account) =>
      account.sources.some(
        (source) => source.author === "Vinigi L. Grottanelli"
      )
    );

    expect(peoples?.statement).toMatch(/Nzema/);
    for (const name of nzema) expect(peoples?.statement).toContain(name);
    expect(peoples?.statement).toContain(fante);
    expect(fiche.peoples.map((p) => p.peopleId)).toContain("PPL_NZEMA");
  });

  // @req REQ-196
  it("gives Dolphyne's explanation of the gap as her hypothesis", () => {
    const hypothesis = accountsOf(fiche).find((account) =>
      account.sources.every(
        (source) => source.author === "Florence Abena Dolphyne"
      )
    );

    expect(hypothesis?.statement).toMatch(/semaine/);
    expect(hypothesis?.statement).toMatch(/hypothèse/);
  });

  // @req REQ-196
  it("no longer says that no source explains the gap", () => {
    const text = JSON.stringify(fiche.nameHistory);

    expect(text).not.toMatch(/ne l'expliquent pas non plus/);
    expect(text).not.toMatch(/sans que les sources lues expliquent/);
  });

  // @req REQ-196
  it("is no longer described as an unresearched coverage stub", () => {
    expect(fiche._meta.directives).not.toMatch(/ne porte aucune recherche/);
  });
});

describe("Kwabena", () => {
  // @req REQ-196
  it("is the Twi Tuesday name, first written by Christaller in 1881", () => {
    const fiche = readFiche("PAT_KWABENA");
    const birth = accountsOf(fiche).find((account) => account.birth);

    expect(fiche.nameHistory.summary).toMatch(/mardi/);
    expect(birth?.period.from).toBe(1881);
    expect(birth?.statement).toMatch(/Christaller/);
  });
});
