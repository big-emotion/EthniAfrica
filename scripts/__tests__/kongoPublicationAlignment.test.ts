import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseNameHistory } from "../../src/lib/afrik/parsers/nameHistoryParser";

const fiche = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "dataset/source/afrik/peuples/FLG_BANTU/PPL_KONGO.json"
    ),
    "utf8"
  )
);

describe("Kongo publication corpus alignment", () => {
  // @req REQ-196
  it("locates Mbanza Kongo in present-day Angola with its UNESCO source", () => {
    expect(fiche.content.appellations.originOfExonyms).toContain(
      "actuel Angola"
    );
    expect(fiche.content.appellations.originOfExonyms).not.toContain(
      "Kongo Central, RDC"
    );
    expect(fiche.content.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://whc.unesco.org/en/list/1511",
          source_kind: "intergovernmental",
        }),
      ])
    );
  });

  // @req REQ-196
  it("binds the earlier Bakongo attestation to the 1886 edition without redating every Bentley source", () => {
    const bakongo = fiche.nameHistory.names[1];
    expect(bakongo.periodLabel).toContain("1886");
    const account = bakongo.accounts.find(
      (entry) => entry.formAsWritten === "Bakongo"
    );
    expect(account.period).toMatchObject({ from: 1886, to: 1886 });
    expect(account.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ year: 1886, page: "p. vii" }),
      ])
    );
    expect(fiche.nameHistory.names[0].accounts[1].sources[0].year).toBe(1887);
  });

  // @req REQ-196
  it("keeps the attributed community account separate from dated written attestations", () => {
    const accounts = fiche.nameHistory.names[0].accounts;
    const community = accounts.find((entry) =>
      entry.sources.some((source) => source.source_kind === "community")
    );
    expect(community).toBeDefined();
    expect(community?.period).toMatchObject({ from: 2023, to: 2023 });
    expect(community?.birth).not.toBe(true);
    expect(community?.hypothesisGroup).toBe("origine du nom Kongo");
    expect(community?.sources[0].author).toBe("Masengo ma Mbongolo");
    expect(
      accounts.find((entry) => entry.formAsWritten === "Manjcongo")?.period.from
    ).toBe(1490);
    expect(
      accounts.filter(
        (entry) => entry.hypothesisGroup === "origine du nom Kongo"
      )
    ).toHaveLength(3);
    expect(parseNameHistory(fiche.nameHistory).success).toBe(true);
  });
});
