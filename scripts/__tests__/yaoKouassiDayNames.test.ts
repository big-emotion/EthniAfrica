import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Kouassi and Yao are Akan day names. The Ivorian sources put the whole cycle
// one day later than the Ghanaian ones (Kouassi on Monday, Kwasi on Sunday);
// Étienne (1968) records the gap and no source read explains it. The two
// fiches leaned on coverage entries for their Ghanaian spellings and ignored
// the Yao people of Malawi, who answer to the same search.

interface Account {
  statement: string;
  birth?: true;
  formAsWritten?: string;
  sources: Array<{ author: string; source_kind: string }>;
}

interface Fiche {
  spellings: Array<{
    spelling: string;
    attestations: Array<{ countryId: string; sourceRefs: string[] }>;
  }>;
  sources: Array<{ sourceKey: string; tier: string; source_kind: string }>;
  homonyms: Array<{ entityType: string; label: string }>;
  nameHistory: {
    summary: string;
    names: Array<{ nameText: string; accounts: Account[] }>;
  };
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
  return fiche.nameHistory.names.flatMap((name) => name.accounts);
}

function attestationCountries(fiche: Fiche, spelling: string): string[] {
  const entry = fiche.spellings.find((s) => s.spelling === spelling);
  return entry ? entry.attestations.map((a) => a.countryId) : [];
}

describe.each([
  ["PAT_KOUASSI", "Kwasi", /lundi/, /dimanche/],
  ["PAT_YAO", "Yaw", /vendredi/, /jeudi/],
])("the day name %s", (id, ghanaianForm, ivorianDay, ghanaianDay) => {
  const fiche = readFiche(id);

  // @req REQ-196
  it("rests on sources that were read, not on a coverage entry", () => {
    for (const source of fiche.sources) {
      expect(source.sourceKey).not.toBe("afrik-candidate-queue");
      expect(source.source_kind).not.toBe("ai_generated");
    }
  });

  // @req REQ-196
  it(`attests ${ghanaianForm} in Ghana, where the twi sources write it`, () => {
    expect(attestationCountries(fiche, ghanaianForm)).toContain("GHA");
  });

  // @req REQ-196
  it("records the one-day gap between the two sides, attributed to Étienne", () => {
    const gap = accountsOf(fiche).find((account) =>
      account.sources.some((source) => source.author === "Pierre Étienne")
    );

    expect(gap?.statement).toMatch(ivorianDay);
    expect(gap?.statement).toMatch(ghanaianDay);
    expect(gap?.statement).toMatch(/n'explique pas|n'expliquent pas/);
  });

  // @req REQ-196
  it("tells how a birth name became a family name in Côte d'Ivoire", () => {
    const law = accountsOf(fiche).find((account) =>
      /1964/.test(account.statement)
    );

    expect(law?.statement).toMatch(/nom de famille/);
  });
});

describe("Yao, beyond the day name", () => {
  const fiche = readFiche("PAT_YAO");

  // @req REQ-196
  it("names the Yao people of southern Africa as a homonym", () => {
    expect(fiche.homonyms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entityType: "people" }),
      ])
    );
  });

  // @req REQ-196
  it("is born with Quow, written at Elmina in 1781, as Konadu reports", () => {
    const births = accountsOf(fiche).filter((account) => account.birth);
    const yaw = births.find((account) => account.formAsWritten === "Quow");

    expect(yaw?.statement).toMatch(/1781/);
    expect(yaw?.sources.map((source) => source.author)).toContain(
      "Kwasi Konadu"
    );
  });

  // @req REQ-196
  it("gives the girl's name next to the boy's", () => {
    expect(fiche.nameHistory.summary).toMatch(/Aya/);
    expect(fiche.nameHistory.summary).toMatch(/Yaa/);
  });
});

describe("Kouassi, beyond the day name", () => {
  // @req REQ-196
  it("gives the girl's name next to the boy's", () => {
    const summary = readFiche("PAT_KOUASSI").nameHistory.summary;

    expect(summary).toMatch(/Akissi/);
    expect(summary).toMatch(/Akosua/);
  });
});
