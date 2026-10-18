// @req REQ-196
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Readers open the Mamba fiche and find a clan name with no explanation of its
// praise lines, its homonym or its neighbour clan. Patricks 2002 (entries MAMBA,
// p. 32, and GININDZA) gives the praise lines and the marriage bars; van Warmelo
// 1935 writes « Mamba or Ginindza » for one chief; Kuper 1964 (p. 59) says that
// Swazi associate mambas with kings. None of them says the clan is named after
// the snake, so the fiche must not say it either.

interface Account {
  period: { from: number | null; to: number | null };
  statement: string;
  claimStatus?: string;
  collection?: string;
  collector?: string;
  birth?: true;
  hypothesisGroup?: string;
  sources: Array<{
    title: string;
    page?: string;
    source_kind: string;
    notes?: string;
  }>;
}

const fiche = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "dataset/source/afrik/patronymes/PAT_MAMBA.json"),
    "utf8"
  )
);
const accounts: Account[] = fiche.nameHistory.names[0].accounts;
const sourceKeys: string[] = fiche.sources.map(
  (source: { sourceKey: string }) => source.sourceKey
);

describe("the Mamba clan name, its praise lines and its neighbours", () => {
  // @req REQ-196
  it("keeps a single birth, the 1935 census", () => {
    const births = accounts.filter((account) => account.birth);

    expect(births).toHaveLength(1);
    expect(births[0].period.from).toBe(1935);
  });

  // @req REQ-196
  it("records the praise lines as an oral text, without an origin story", () => {
    const praise = accounts.find(
      (entry) =>
        /mamba lendze/.test(entry.statement) && entry.claimStatus === "claimed"
    );

    expect(praise).toBeDefined();
    expect(praise.statement).toMatch(/sans traduction/);
    expect(praise.collector).toBe("Richard Patricks");
    expect(praise.sources[0].notes).toMatch(
      /informateurs que l'auteur ne nomme pas/
    );
  });

  // @req REQ-196
  it("ties Mamba to Ginindza by the census, the shared line and the marriage bar", () => {
    const link = accounts.find(
      (account) =>
        /Ginindza/.test(account.statement) && /mariage/.test(account.statement)
    );

    expect(link).toBeDefined();
    expect(link?.sources.map((source) => source.page).join(" ")).toMatch(
      /GININDZA/
    );
    expect(link?.statement).toMatch(/ne disent pas/);
  });

  // @req REQ-196
  it("reports the Swazi link between mambas and kings from Kuper, p. 59", () => {
    const kuper = accounts.find((account) =>
      account.sources.some((source) => source.page === "p. 59")
    );

    expect(kuper?.statement).toMatch(/Hilda Kuper/);
    expect(kuper?.statement).toMatch(/rois/);
    expect(kuper?.hypothesisGroup).toBeUndefined();
    expect(sourceKeys).toContain("kuper-1964-swazi");
  });

  // @req REQ-196
  it("lists the snake word as a homonym and drops its empty gap", () => {
    expect(fiche.homonyms[0].label).toBe("mamba");
    expect(fiche.homonyms[0].sourceRefs).toContain(
      "colenso-1861-zulu-dictionary"
    );
    const gapPaths = fiche.gaps.map(
      (gap: { fieldPath: string }) => gap.fieldPath
    );

    expect(gapPaths).not.toContain("homonyms");
  });

  // @req REQ-196
  it("says what was searched for alliances, not a generic silence", () => {
    const gap = fiche.gaps.find(
      (entry: { fieldPath: string }) => entry.fieldPath === "alliances"
    );

    expect(gap.reason).toMatch(/Ginindza/);
    expect(gap.reason).not.toMatch(/Nous ne documentons pas encore/);
  });
});
