import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Readers land on Abaza and find an empty fiche. The name is the ethnonym of
// the Abazins of the north-west Caucasus, and in Egypt the name of an
// aristocratic family of the Nile delta. Only the English Wikipedia article was
// read, and it is cited as such: the books it relies on were not consulted.

interface Account {
  statement: string;
  claimStatus?: string;
  birth?: true;
  before?: true;
  sources: Array<{ source_kind: string }>;
}

const fiche = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "dataset/source/afrik/patronymes/PAT_ABAZA.json"),
    "utf8"
  )
);
const accounts: Account[] = fiche.nameHistory.names[0].accounts;

describe("the family name Abaza, from the Caucasus to the Nile delta", () => {
  // @req REQ-196
  it("starts with the Abazin ethnonym as what came before the name", () => {
    const before = accounts.find((account) => account.before);

    expect(before?.statement).toMatch(/Abazins/);
    expect(before?.statement).toMatch(/Caucase/);
  });

  // @req REQ-196
  it("is born once, with a matriarch named Abaza before Muhammad Ali", () => {
    const births = accounts.filter((account) => account.birth);

    expect(births).toHaveLength(1);
    expect(births[0].statement).toMatch(/Muhammad Ali/);
    expect(births[0].statement).toMatch(/selon l'article de Wikipédia/);
  });

  // @req REQ-196
  it("keeps the competing readings side by side, the historian attributed", () => {
    const reading = accounts.find(
      (account) =>
        account.claimStatus === "contested" &&
        /ethnonyme/.test(account.statement) &&
        /al-Sayyid-Marsot/.test(account.statement)
    );

    expect(reading?.statement).toMatch(/ethnonyme/);
    expect(reading?.statement).toMatch(/al-Sayyid-Marsot/);
    expect(reading?.claimStatus).toBe("contested");
  });

  // @req REQ-196
  it("says plainly that only an encyclopedia article was read", () => {
    const consulted = fiche.sources.filter(
      (source: { sourceKey: string }) =>
        source.sourceKey !== "afrik-candidate-queue"
    );

    expect(consulted).toHaveLength(1);
    expect(consulted[0].source_kind).toBe("encyclopedia");
    expect(consulted[0].notes).toMatch(/n'ont pas été consultés/);
  });

  // @req REQ-196
  it("leaves no field silent and ends on a question", () => {
    const paths = fiche.gaps.map((gap: { fieldPath: string }) => gap.fieldPath);

    expect(paths).toEqual(
      expect.arrayContaining(["bearers", "homonyms", "peoples"])
    );
    for (const gap of fiche.gaps) {
      expect(gap.reason).not.toMatch(/Nous ne documentons pas encore/);
    }
    expect(fiche.searchAnswer.followUp).toMatch(/\?$/);
  });
});
