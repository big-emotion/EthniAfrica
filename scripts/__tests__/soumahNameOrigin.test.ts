import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Readers land on Soumah and find an empty fiche behind a filled name history.
// André Arcin (La Guinée française, 1907, p. 281, 298-299) is the oldest
// written account the project holds: the Souma are the chiefs of the central
// Soso, their great fief is the Gania, and their first coastal state is the
// Dubréka. The Bamadaba clan-name dictionary lists Suma and Sumaoro apart.

const fiche = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "dataset/source/afrik/patronymes/PAT_SOUMAH.json"),
    "utf8"
  )
);
const sourceKeys: string[] = fiche.sources.map(
  (source: { sourceKey: string }) => source.sourceKey
);

describe("the clan name Soumah, after Arcin (1907)", () => {
  // @req REQ-196
  it("writes Arcin's account of the Souma into the origin, with its page", () => {
    const chronicle = fiche.nameHistory.names[0].accounts.find(
      (account: { statement: string }) => /Gania/.test(account.statement)
    );

    expect(chronicle.statement).toMatch(/Arcin/);
    expect(chronicle.statement).toMatch(/Gania/);
    expect(chronicle.statement).toMatch(/Dubréka/);
    expect(chronicle.claimStatus).toBe("claimed");
    expect(
      chronicle.sources.some(
        (source: { page?: string }) => source.page === "p. 298-299"
      )
    ).toBe(true);
    expect(sourceKeys).toContain("arcin-1907-guinee-francaise");
  });

  // @req REQ-196
  it("keeps Arcin's Keïta kinship and Suma / Sumaoro as attributed hypotheses", () => {
    const claims = fiche.nameHistory.names[0].accounts.map(
      (entry: { statement: string }) => entry.statement
    );

    expect(claims.some((claim: string) => /Keïta/.test(claim))).toBe(true);
    expect(claims.some((claim: string) => /Sumaoro/.test(claim))).toBe(true);
  });

  // @req REQ-196
  it("gives the clan's social function and its Soumaré relative, each sourced", () => {
    expect(fiche.casteOrSocialFunction.value).toMatch(/chefs/);
    expect(sourceKeys).toContain(fiche.casteOrSocialFunction.sourceRefs[0]);
    expect(fiche.homonyms[0].entityId).toBe("PAT_SOUMARE");
    expect(fiche.homonyms[0].distinction).toMatch(/fils de Souma/);
  });

  // @req REQ-196
  it("no longer cites the coverage queue for what a source now attests", () => {
    for (const spelling of fiche.spellings) {
      for (const attestation of spelling.attestations) {
        expect(attestation.sourceRefs).not.toContain("afrik-candidate-queue");
      }
    }
    expect(fiche.peoples[0].sourceRefs).not.toContain("afrik-candidate-queue");
  });

  // @req REQ-196
  it("leaves no field silent: the remaining gaps say what was searched", () => {
    const paths = fiche.gaps.map((gap: { fieldPath: string }) => gap.fieldPath);

    expect(paths).not.toContain("origin");
    expect(paths).not.toContain("homonyms");
    expect(paths).toEqual(
      expect.arrayContaining(["origin.oralTraditions", "bearers"])
    );
    for (const gap of fiche.gaps) {
      expect(gap.reason).not.toMatch(/Nous ne documentons pas encore/);
    }
  });
});
