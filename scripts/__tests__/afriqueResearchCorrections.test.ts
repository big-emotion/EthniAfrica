import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The « Afrique » social piece (series 6, episode 1, 2026-10-15) re-read the
// sources on the name of the continent. It found that no fiche answered the
// search « Afrique », that Alkebulan is printed in 1575 rather than first in
// 1970, that the Greek reading a-phrikê is not Leo Africanus's, and that
// Ifrīqiya is the Arabic form of Latin Africa, not a Berber name. The operator
// approved the place fiche and the corrections on 15 October 2026; these
// assertions keep them from regressing.

const read = (path: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const fiche = (path: string) => read(`dataset/source/afrik/${path}`);

interface Account {
  statement: string;
}
interface NameEntry {
  nameText: string;
  accounts: Account[];
}

const allStrings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(allStrings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(allStrings)
        : [];

describe("the place fiche Afrique", () => {
  const afrique = fiche("lieux/LOC_AFRIQUE.json");
  const names: NameEntry[] = afrique.nameHistory.names;
  const nameEntry = (text: string) =>
    names.find((entry) => entry.nameText === text);

  // @req REQ-193
  it("covers every country fiche of the continent", () => {
    const countryFiches = readdirSync(
      resolve(process.cwd(), "dataset/source/afrik/pays")
    )
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""))
      .sort();

    expect(afrique.placeType).toBe("autre");
    expect([...afrique.countryIds].sort()).toEqual(countryFiches);
  });

  // @req REQ-196
  it("dates Alkebulan to Thevet's Cosmographie of 1575, not to 1970", () => {
    const alkebulan = nameEntry("Alkebulan");

    expect(alkebulan.accounts[0].statement).toContain("1575");
    expect(alkebulan.accounts[0].statement).toContain("André Thevet");
  });

  // @req REQ-196
  it("never gives the Greek reading a-phrikê to Leo Africanus", () => {
    const greek = nameEntry("Africa").accounts.find((account) =>
      account.statement.includes("aphrikē")
    );

    expect(greek.statement).toContain(
      "Le chapitre de Léon l'Africain sur le nom de l'Afrique ne contient pas cette explication."
    );
  });
});

describe("the Tunisia fiche on Ifrīqiya", () => {
  const tunisia = fiche("pays/TUN.json");

  // @req REQ-196
  it("says that the sense of Ifrīqiya varies, after Monès's account", () => {
    const statement: string =
      tunisia.nameHistory.names[0].accounts[5].statement;

    expect(statement).toContain("selon l'historien Hussain Monès.");
    expect(statement).toContain(
      "Le sens du nom varie toutefois selon les auteurs."
    );
  });

  // @req REQ-196
  it("no longer calls Ifrīqiya a Berber name", () => {
    expect(tunisia.content.historicalNames.antiquity).not.toContain(
      "nom berbère"
    );
    expect(tunisia.content.historicalNames.formerNames[0]).toBe(
      "Ifriqiya (forme arabe du latin Africa)"
    );
  });

  // @req REQ-196
  it("flags the portal's Greek reading as wrongly attributed to Leo", () => {
    expect(tunisia.content.sources[6].notes).toContain(
      "cette attribution ne se vérifie pas"
    );
  });
});

describe("the Libya fiche on Ifrīqiya", () => {
  // @req REQ-196
  it("counts Tripolitania in Ifrīqiya only in the wide sense", () => {
    const libya = fiche("pays/LBY.json");

    expect(libya.content.historicalNames.middleAges).toContain(
      "forme arabe du latin Africa"
    );
    expect(libya.content.historicalNames.middleAges).toContain("au sens large");
  });
});

describe("the Banu Ifran fiche", () => {
  // @req REQ-196
  it("adds Vycichl's cautious link between Afrī and Īfrī", () => {
    const banuIfran = fiche("patronymes/PAT_BANU_IFRAN.json");
    const reconstructions = allStrings(
      banuIfran.nameHistory.names.flatMap((name: NameEntry) => name.accounts)
    );

    expect(reconstructions.some((text) => text.includes("Vycichl"))).toBe(true);
  });
});

describe("the published word piece 008 on « Afrique »", () => {
  const piece = read("docs/productions/mot/008-afrique-province-romaine.json");
  const french = allStrings(piece.answer).join(" ");

  // @req REQ-186
  it("no longer says the Romans used Africa only for one region", () => {
    expect(french).not.toContain("ne nommait qu'une région");
  });

  // @req REQ-186
  it("no longer gives the Greek reading to Leo Africanus", () => {
    expect(french).not.toContain("Léon l'Africain le tirait du grec");
  });
});
