import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));

const bfa = read("dataset/source/afrik/pays/BFA.json");
const gur = read("dataset/source/afrik/famille_linguistique/FLG_GUR.json");
const accounts = (nameIndex: number) =>
  bfa.nameHistory.names[nameIndex].accounts as Array<{ statement: string }>;

describe("the origin of the name Burkina Faso", () => {
  // @req REQ-178
  it("names the ordinance by its number, as a 1985 ordinance cites it", () => {
    expect(bfa.nameOriginActor).toContain("84-043/CNR/PRES");
    expect(accounts(0)[3].statement).toContain("84-043/CNR/PRES");
  });

  // @req REQ-178
  it("tells the council's choice as one witness's account, not as an established fact", () => {
    const ordinance = accounts(0)[3].statement;
    expect(ordinance).toContain("Congo Kaboré");
    expect(ordinance).toMatch(/récit d'un seul témoin/);
  });

  // @req REQ-178
  it("traces the -bè ending to fulfulde instead of calling it unestablished", () => {
    expect(bfa.etymology).not.toMatch(/ne sont pas établis/);
    expect(bfa.etymology).toMatch(/-bè, qui vient du fulfulde/);
  });

  // @req REQ-178
  it("gives burkina as the upright person, the quality being burkĩndi", () => {
    expect(bfa.etymology).not.toMatch(/qui dit l'intégrité/);
    expect(bfa.etymology).toContain("burkĩndi");
  });

  // @req REQ-178
  it("traces Volta back to Portuguese sailors without claiming why they chose the word", () => {
    const volta = accounts(1)[4].statement;
    expect(volta).toContain("Duarte Pacheco Pereira");
    expect(volta).toMatch(/ne dit pas pourquoi/);
  });
});

describe("the name voltaïque for the Gur languages", () => {
  // @req REQ-178
  it("dates its first known use to Delafosse in 1914, not 1924 or Koelle 1854", () => {
    const birth = gur.nameHistory.names[1].accounts[1];
    expect(birth.period.from).toBe(1914);
    expect(gur.content.historyAndOrigins.emergencePeriod).not.toMatch(
      /Koelle \(1854\)[^;.]*Voltaic/
    );
  });
});
