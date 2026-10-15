import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The rest of the Akan week, after Kouassi and Yao. Six of these fiches had no
// name history, and Kofi and Kwame stood on a coverage entry alone. Every day
// below comes from a source read on 15 October 2026; the Ivorian names sit one
// day later than the Ghanaian ones, which no source read explains.

interface Account {
  statement: string;
  birth?: true;
}

interface Fiche {
  sources: Array<{ sourceKey: string; source_kind: string }>;
  origin: { linguisticReconstructions: Array<{ claimStatus: string }> };
  nameHistory: {
    summary: string;
    names: Array<{ accounts: Account[] }>;
  } | null;
}

function readFiche(id: string): Fiche {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), `dataset/source/afrik/patronymes/${id}.json`),
      "utf8"
    )
  );
}

function accountsOf(fiche: Fiche): Account[] {
  return fiche.nameHistory?.names.flatMap((name) => name.accounts) ?? [];
}

const WEEK = [
  { id: "PAT_KOUADIO", day: /mardi/, girl: /Adjoa/, ivorian: true },
  { id: "PAT_KONAN", day: /mercredi/, girl: /Amlan/, ivorian: true },
  { id: "PAT_KOUAKOU", day: /jeudi/, girl: /Ahou/, ivorian: true },
  { id: "PAT_KOUAME", day: /dimanche/, girl: /Amoin/, ivorian: true },
  { id: "PAT_KOFI", day: /vendredi/, girl: /Afua/, ivorian: false },
  { id: "PAT_KWAME", day: /samedi/, girl: /Amma/, ivorian: false },
  { id: "PAT_KOSSI", day: /dimanche/, girl: /Kossiwa/, ivorian: false },
  { id: "PAT_KOMLAN", day: /mardi/, girl: /Abla/, ivorian: false },
];

describe.each(WEEK)("the day name $id", ({ id, day, girl, ivorian }) => {
  const fiche = readFiche(id);

  // @req REQ-196
  it("rests on sources that were read, not on a coverage entry", () => {
    for (const source of fiche.sources) {
      expect(source.sourceKey).not.toBe("afrik-candidate-queue");
      expect(source.source_kind).not.toBe("ai_generated");
    }
  });

  // @req REQ-196
  it("tells its day and the girl's name in the summary", () => {
    expect(fiche.nameHistory?.summary).toMatch(day);
    expect(fiche.nameHistory?.summary).toMatch(girl);
  });

  // @req REQ-196
  it("has a history with one earliest trace", () => {
    const births = accountsOf(fiche).filter((account) => account.birth);

    expect(births).toHaveLength(1);
  });

  if (ivorian) {
    // @req REQ-196
    it("tells how the 1964 law made it a family name", () => {
      const law = accountsOf(fiche).find((account) =>
        /1964/.test(account.statement)
      );

      expect(law?.statement).toMatch(/nom de famille/);
    });
  }
});

describe("Kouadio", () => {
  // @req REQ-196
  it("is no longer contested: N'Goran-Poamé writes Kouadio for Tuesday", () => {
    const claims = readFiche("PAT_KOUADIO").origin.linguisticReconstructions;

    expect(claims.every((claim) => claim.claimStatus !== "contested")).toBe(
      true
    );
  });
});
