import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const fichePath = join(
  process.cwd(),
  "dataset/source/afrik/patronymes/PAT_CAMARA.json"
);

describe("oral narration sources in priority fiches (REQ-161)", () => {
  // @req REQ-161
  it("credits the narrated accounts separately from their written records", () => {
    const fiche = JSON.parse(readFileSync(fichePath, "utf8"));
    const accounts = fiche.nameHistory.names.flatMap(
      (name: { accounts: Array<{ statement: string; sources: unknown[] }> }) =>
        name.accounts
    );

    const babouAccount = accounts.find((account) =>
      account.statement.includes("Kamanjan Boro")
    );
    expect(babouAccount?.sources).toContainEqual(
      expect.objectContaining({
        title: "Récit du griot Babou Condé, de Fadama",
        author: "Babou Condé",
        source_kind: "oral_tradition",
        tier: "unverified",
      })
    );

    const kouyateAccount = accounts.find((account) =>
      account.statement.includes("deux branches")
    );
    expect(kouyateAccount?.sources).toContainEqual(
      expect.objectContaining({
        title:
          "Récit du griot Djeli Mamadou Kouyaté, de Djeliba Koro près de Siguiri",
        author: "Djeli Mamadou Kouyaté",
        source_kind: "oral_tradition",
        tier: "unverified",
      })
    );
  });
});
