import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const fichePath = join(
  process.cwd(),
  "dataset/source/afrik/patronymes/PAT_TRAORE.json"
);

describe("oral accounts transcribed in name histories (REQ-161)", () => {
  // @req REQ-161
  it("names the Djeli Mamadou Kouyaté account beside Niane's book", () => {
    const fiche = JSON.parse(readFileSync(fichePath, "utf8"));
    const accounts = fiche.nameHistory.names[0].accounts.filter(
      (account: { sources: Array<{ title?: string; author?: string }> }) =>
        account.sources.some(
          (source) =>
            source.title === "Soundjata ou l'épopée mandingue" &&
            source.author?.includes("Djeli Mamadou Kouyaté")
        )
    );

    expect(accounts).toHaveLength(3);
    for (const account of accounts) {
      expect(account.sources).toContainEqual(
        expect.objectContaining({
          source_kind: "oral_tradition",
          title:
            "Récit du griot Djeli Mamadou Kouyaté, de Djeliba Koro près de Siguiri",
          tier: "unverified",
        })
      );
      expect(account.sources).toContainEqual(
        expect.objectContaining({
          title: "Soundjata ou l'épopée mandingue",
          source_kind: "academic",
        })
      );
    }
  });
});
