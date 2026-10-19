import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATASET_ROOT = join(
  __dirname,
  "..",
  "..",
  "dataset",
  "source",
  "afrik",
  "lieux"
);
const PLACE_FILES = [
  "LOC_YAMOUSSOUKRO.json",
  "LOC_DALOA.json",
  "LOC_GAGNOA.json",
  "LOC_SAHARA.json",
  "LOC_AFRIQUE.json",
];

function familyAccounts() {
  return PLACE_FILES.flatMap((file) => {
    const fiche = JSON.parse(readFileSync(join(DATASET_ROOT, file), "utf-8"));
    const names = fiche.nameHistory?.names ?? [];
    return names.flatMap((name: { accounts?: unknown[] }) =>
      (name.accounts ?? [])
        .filter(
          (account): account is Record<string, unknown> =>
            typeof account === "object" && account !== null
        )
        .filter((account) => account.accountKind === "family")
        .map((account) => ({ file, account }))
    );
  });
}

describe("place family accounts", () => {
  // @req REQ-196
  it("tags only the source-identified Yaha M'so family account", () => {
    const tagged = familyAccounts();

    expect(tagged).toHaveLength(1);
    expect(tagged[0].file).toBe("LOC_YAMOUSSOUKRO.json");
    expect(tagged[0].account.statement).toContain("Yaha M'so");
  });
});
