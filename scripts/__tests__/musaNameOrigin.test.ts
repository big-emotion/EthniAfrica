import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Readers land on Moussa (retired into PAT_MUSA) and find no origin. Jeffery
// 1938 (p. 274-275) gives the Qur'an as the name's earliest known use and the
// Hebrew, Syriac or Ethiopic route as hypotheses; the UNESCO General History of
// Africa (IV, ch. 6, Niane) attests Kanku Mūsā, Mansa Mūsā I of Mali, 1307-1332.

interface Account {
  period: { from: number | null; to: number | null };
  era?: string;
  statement: string;
  formAsWritten?: string;
  aspect?: string;
  birth?: true;
  before?: true;
  sources: Array<{ title: string; page?: string }>;
}

const fiche = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "dataset/source/afrik/patronymes/PAT_MUSA.json"),
    "utf8"
  )
);
const accounts: Account[] = fiche.nameHistory.names[0].accounts;
const sourceKeys = fiche.sources.map(
  (source: { sourceKey: string }) => source.sourceKey
);

describe("the name Musa, from the Qur'an to the Mali empire", () => {
  // @req REQ-196
  it("is born in the Qur'an as Mūsā, after Jeffery", () => {
    const births = accounts.filter((account) => account.birth);

    expect(births).toHaveLength(1);
    expect(births[0].formAsWritten).toBe("Mūsā");
    expect(births[0].period.from).toBe(600);
    expect(births[0].statement).toMatch(/Coran/);
    expect(births[0].sources[0]).toMatchObject({ page: "p. 274-275" });
  });

  // @req REQ-196
  it("tells the Hebrew route as what came before, attributed to Jeffery", () => {
    const before = accounts.find((account) => account.before);

    expect(before?.statement).toMatch(/^Avant le nom Musa/);
    expect(before?.statement).toMatch(/Selon Arthur Jeffery/);
    expect(before?.statement).toMatch(/syriaque ou l'éthiopien/);
  });

  // @req REQ-196
  it("is borne by Kanku Mūsā of Mali, per the UNESCO General History", () => {
    const mansa = accounts.find(
      (account) => account.formAsWritten === "Kanku Mūsā"
    );

    expect(mansa?.period).toMatchObject({ from: 1307, to: 1332 });
    expect(mansa?.sources[0]).toMatchObject({ page: "p. 171" });
    expect(fiche.origin.writtenChronicles[0].claim).toMatch(/Ibn Khaldūn/);
    expect(fiche.origin.historicalSyntheses).toHaveLength(1);
  });

  // @req REQ-196
  it("keeps Schön 1876 as a written mention, no longer the birth", () => {
    const schon = accounts.find((account) => account.formAsWritten === "Mūsa");

    expect(schon?.birth).toBeUndefined();
    expect(schon?.statement).toMatch(/Schön/);
  });

  // @req REQ-196
  it("records the Hausa homonym mūsa, « chat », and cites every new source", () => {
    expect(fiche.homonyms[0].label).toMatch(/chat/);
    expect(sourceKeys).toEqual(
      expect.arrayContaining([
        "hga-iv-niane",
        "jeffery-1938-musa",
        "schon-1876-musa",
      ])
    );
  });

  // @req REQ-196
  it("leaves no field silent: each empty field says what was searched", () => {
    const gapPaths = fiche.gaps.map(
      (gap: { fieldPath: string }) => gap.fieldPath
    );

    expect(gapPaths).not.toContain("origin.writtenChronicles");
    expect(gapPaths).not.toContain("homonyms");
    expect(gapPaths).toEqual(
      expect.arrayContaining(["bearers", "alliances", "casteOrSocialFunction"])
    );
    expect(fiche.searchAnswer.followUp).toMatch(/\?$/);
  });
});
