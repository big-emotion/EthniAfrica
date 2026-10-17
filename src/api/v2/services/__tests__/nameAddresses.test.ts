import { beforeEach, describe, expect, it, vi } from "vitest";

// unstable_cache registrations happen at module load, so they are recorded
// outside the mock — clearAllMocks would otherwise erase them.
const { cacheRegistrations } = vi.hoisted(() => ({
  cacheRegistrations: [] as Array<{ keys: unknown; options: unknown }>,
}));
vi.mock("next/cache", () => ({
  unstable_cache: (
    callback: (...args: unknown[]) => unknown,
    keys: unknown,
    options: unknown
  ) => {
    cacheRegistrations.push({ keys, options });
    return callback;
  },
}));

vi.mock("@/lib/supabase/queries/afrik/nameAddressEntries", () => ({
  getAnsweredNameRows: vi.fn(),
}));

import { CORPUS_AGGREGATE_REVALIDATE_SECONDS } from "@/api/v2/services/corpusCache";
import { getNameAddressSpellings } from "@/api/v2/services/nameAddresses";
import { getAnsweredNameRows } from "@/lib/supabase/queries/afrik/nameAddressEntries";

/**
 * A history as the corpus stores it (the shared schema of REQ-196), telling
 * each name once, with one account citing these tiers.
 */
function history(...names: Array<[string, ...string[]]>) {
  return {
    summary: "Un nom raconté par ses sources.",
    names: names.map(([nameText, ...tiers]) => ({
      nameText,
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: 1900, to: 1950, label: "Début du XXe siècle" },
          statement: `Le nom ${nameText} est attesté.`,
          sources: tiers.map((tier) => ({
            title: `Source ${tier}`,
            author: "Un auteur",
            year: 1950,
            url: null,
            tier,
            source_kind: "academic",
          })),
        },
      ],
    })),
  };
}

const rows = vi.mocked(getAnsweredNameRows);

describe("the spellings that have an address", () => {
  beforeEach(() => {
    rows.mockReset();
  });

  // @req REQ-200
  it("spells each answered form as its history tells it, once", async () => {
    rows.mockResolvedValue([
      { name: "Traore", nameHistory: history(["Traoré", "referenced"]) },
      { name: "Lingala", nameHistory: history(["Lingala", "official"]) },
      // The same form filed by a second kind folds into the first.
      { name: "lingala", nameHistory: history(["lingala", "referenced"]) },
    ]);

    const spellings = await getNameAddressSpellings();

    expect(spellings).toEqual(expect.arrayContaining(["Lingala", "Traoré"]));
    expect(spellings).not.toContain("Traore");
    expect(spellings).not.toContain("lingala");
  });

  // @req REQ-200
  it("keeps back a form whose accounts cite nothing above unverified", async () => {
    rows.mockResolvedValue([
      { name: "Bangala", nameHistory: history(["Bangala", "unverified"]) },
      { name: "Kongo", nameHistory: null },
      { name: "Zande", nameHistory: "not a history" },
    ]);

    const spellings = await getNameAddressSpellings();

    expect(spellings).not.toContain("Bangala");
    expect(spellings).not.toContain("Kongo");
    expect(spellings).not.toContain("Zande");
  });

  // The ledger's words are answered by the production registry, not by a
  // table, and are addressed by their French label.
  // @req REQ-200
  it("adds the published words of the production ledger", async () => {
    rows.mockResolvedValue([]);

    expect(await getNameAddressSpellings()).toEqual(
      expect.arrayContaining(["ethnie", "griot"])
    );
  });

  // @req REQ-200
  it("is recomputed hourly, with the other corpus aggregates", () => {
    expect(cacheRegistrations).toContainEqual({
      keys: ["name-address-spellings"],
      options: { revalidate: CORPUS_AGGREGATE_REVALIDATE_SECONDS },
    });
  });
});
