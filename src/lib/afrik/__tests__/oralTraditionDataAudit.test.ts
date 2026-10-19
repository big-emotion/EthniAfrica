import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const datogaPath = join(
  process.cwd(),
  "dataset/source/afrik/peuples/FLG_NILOTIQUE/PPL_DATOGA.json"
);
const nGuessanPath = join(
  process.cwd(),
  "dataset/source/afrik/patronymes/PAT_N_GUESSAN.json"
);

describe("oral tradition source attribution in audited fiches (REQ-161)", () => {
  // @req REQ-161
  it("identifies the named Barabaig account carrier alongside Mhajida's book", () => {
    const fiche = JSON.parse(readFileSync(datogaPath, "utf8"));
    const account = fiche.nameHistory.names
      .find((name: { nameText: string }) => name.nameText === "Barabaig")
      .accounts.find(
        (entry: { period: { from: number | null } }) =>
          entry.period.from === 2014
      );

    expect(account.sources).toContainEqual(
      expect.objectContaining({
        source_kind: "oral_tradition",
        title:
          "Entretien de Samwel Shanga Mhajida avec Makaranga, Datoga du Wembere",
        author: "Samwel Shanga Mhajida",
        year: 2014,
        tier: "unverified",
      })
    );
    expect(account.sources).toContainEqual(
      expect.objectContaining({
        title:
          "The Collapse of a Pastoral Economy : the Datoga of Central and Northern Tanzania from the 1830s to the 2000s",
        author: "Samwel Shanga Mhajida",
        year: 2019,
        source_kind: "academic",
      })
    );
  });

  // @req REQ-161
  it("does not treat Pagnet's written account of a naming custom as oral testimony", () => {
    const fiche = JSON.parse(readFileSync(nGuessanPath, "utf8"));
    const account = fiche.nameHistory.names[0].accounts[0];

    expect(account.sources).not.toContainEqual(
      expect.objectContaining({ source_kind: "oral_tradition" })
    );
    expect(fiche.origin.oralTraditions).toEqual([]);
  });
});
