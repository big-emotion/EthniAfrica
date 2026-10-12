import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Schwartz 1993, p. 88, gives an origin for Bakwé, a Krou exonym and the name's
// first written mention (Pobéguin, 1895). Schwartz is the only source read:
// Pobéguin's map was not opened, so its mention is reported second-hand.

interface Account {
  period: { from: number | null };
  era?: string;
  statement: string;
  formAsWritten?: string;
  hypothesisGroup?: string;
  birth?: true;
  sources: Array<{ title: string; page?: string; notes?: string }>;
}
interface NameEntry {
  nameText: string;
  selfGiven: boolean;
  accounts: Account[];
}

const fiche = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "dataset/source/afrik/peuples/FLG_KROU/PPL_BAKWE.json"
    ),
    "utf8"
  )
);
const names: NameEntry[] = fiche.nameHistory.names;
const nameOf = (text: string) =>
  names.find((entry) => entry.nameText === text) as NameEntry;
const SCHWARTZ_1993 = "Sous-peuplement et développement";

describe("the name Bakwé in Schwartz 1993", () => {
  // @req REQ-196
  it("gives the ba-kwè origin as an attributed, conditional hypothesis", () => {
    const origin = nameOf("Bakwé").accounts.find(
      (account) => account.hypothesisGroup
    );

    expect(origin?.statement).toMatch(/^Selon Alfred Schwartz|viendrait de/);
    expect(origin?.statement).toMatch(/ba-kwè/);
    expect(origin?.statement).toMatch(/attraper-tirer/);
    expect(origin?.era).toBe("modern");
    expect(origin?.sources[0]).toMatchObject({ page: "p. 88" });
    expect(origin?.sources[0].title).toContain(SCHWARTZ_1993);
  });

  // @req REQ-196
  it("is born in 1895 with Pobéguin, reported second-hand by Schwartz", () => {
    const { accounts } = nameOf("Bakwé");
    const births = accounts.filter((account) => account.birth);

    expect(births).toHaveLength(1);
    expect(births[0].period.from).toBe(1895);
    expect(births[0].statement).toMatch(/Pobéguin/);
    expect(births[0].sources[0].page).toBe("p. 88");
    expect(births[0].sources[0].notes).toMatch(/second main|pas ouvert/);
    // The spelling of 1895 was not read, so none is invented.
    expect(births[0].formAsWritten).toBeUndefined();
    expect(accounts.find((a) => a.formAsWritten === "Bakoué")?.birth).toBe(
      undefined
    );
  });

  // @req REQ-196
  it("records the Krou exonym Tuwè with its meaning and its source", () => {
    const tuwe = nameOf("Tuwè");

    expect(tuwe.selfGiven).toBe(false);
    expect(tuwe.accounts[0].statement).toMatch(/sous les arbres/);
    expect(tuwe.accounts[0].statement).toMatch(/péjoratif/);
    expect(tuwe.accounts[0].sources[0]).toMatchObject({ page: "p. 88" });
    expect(fiche.content.appellations.exonyms).toContain("Tuwè");
  });

  // @req REQ-196
  it("no longer says the origin of the name is unknown", () => {
    expect(fiche.nameHistory.summary).not.toMatch(/ne sait pas avec certitude/);
    expect(fiche.nameHistory.summary).toMatch(/ba-kwè/);
    expect(JSON.stringify(nameOf("Bakwé"))).not.toMatch(
      /pas encore lu de source qui l'explique/
    );
  });
});
