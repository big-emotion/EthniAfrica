/**
 * The name index is projected from each people fiche (REQ-196): its
 * nameHistory names first, then the names its appellations block yields.
 * These tests read the real fiches the retired name_records table used to
 * be the only home of, so a fresh load cannot silently lose them again.
 */
import { describe, expect, it } from "vitest";

import { loadPeople } from "@/lib/afrik/loaders/peopleJsonLoader";
import { peopleNameIndex } from "@/lib/afrik/peopleNameIndex";
import type { People } from "@/types/afrik";

async function fiche(peopleId: string): Promise<People> {
  const parsed = await loadPeople(peopleId);
  if (!parsed.success) throw new Error(`${peopleId} did not load`);
  return parsed.data;
}

function formsOf(people: People): string[] {
  return peopleNameIndex(people).entries.map((entry) => entry.nameText);
}

const SOURCED = [
  { title: "Ethnologue", url: "https://example.org/e", tier: "official" },
] as const;

function people(overrides: Partial<People>): People {
  return {
    id: "PPL_TEST",
    nameMain: "Test",
    languageFamilyId: "FLG_TEST",
    currentCountries: [],
    content: {
      appellations: { selfAppellation: "Testa", exonyms: ["Tosti"] },
      sources: [...SOURCED],
    },
    ...overrides,
  } as People;
}

describe("peopleNameIndex on the corpus", () => {
  // @req REQ-196
  it("indexes the forms only the folded records held: Futankooɓe, Fellata, Union Ibo", async () => {
    expect(formsOf(await fiche("PPL_FULA"))).toEqual(
      expect.arrayContaining(["Futankooɓe", "Fellata"])
    );
    expect(formsOf(await fiche("PPL_IGBO"))).toContain("Union Ibo");
  });

  // @req REQ-196
  it("reads a nameHistory name from the block, with its own sources", async () => {
    const fellata = peopleNameIndex(await fiche("PPL_FULA")).entries.find(
      (entry) => entry.nameText === "Fellata"
    );

    expect(fellata.origin).toBe("nameHistory");
    expect(fellata.sources.length).toBeGreaterThan(0);
  });
});

describe("peopleNameIndex", () => {
  // @req REQ-196
  it("lists the block's names before the names derived from appellations", () => {
    const index = peopleNameIndex(
      people({
        nameHistory: {
          summary: "Résumé.",
          names: [
            {
              nameText: "Testa",
              nameStatus: "current",
              selfGiven: true,
              languageOfOrigin: null,
              namedBy: null,
              accounts: [],
            },
          ],
        },
      })
    );

    expect(
      index.entries.map(({ nameText, nameType, origin }) => ({
        nameText,
        nameType,
        origin,
      }))
    ).toEqual([
      { nameText: "Testa", nameType: "endonym", origin: "nameHistory" },
      { nameText: "Tosti", nameType: "exonym", origin: "appellation" },
    ]);
  });

  // @req REQ-196
  it("cites the fiche's sources for a derived name, and carries the fiche's whyProblematic on exonyms only", () => {
    const index = peopleNameIndex(
      people({
        content: {
          appellations: {
            selfAppellation: "Testa",
            exonyms: ["Tosti"],
            whyProblematic: "Nom colonial.",
          },
          sources: [...SOURCED],
        } as People["content"],
      })
    );
    const [endonym, exonym] = index.entries;

    expect(endonym.whyProblematic).toBeNull();
    expect(exonym.whyProblematic).toBe("Nom colonial.");
    expect(exonym.sources).toEqual([
      {
        title: "Ethnologue",
        url: "https://example.org/e",
        year: null,
        tier: "official",
      },
    ]);
  });

  // @req REQ-196
  it("publishes no derived name for a fiche citing no official or referenced source", () => {
    const index = peopleNameIndex(
      people({
        content: {
          appellations: { selfAppellation: "Testa", exonyms: ["Tosti"] },
          sources: [{ title: "Blog", url: null, tier: "unverified" }],
        } as People["content"],
      })
    );

    expect(index.entries).toEqual([]);
    expect(index.unsourced).toBe(true);
  });

  // @req REQ-196
  it("returns the segments the appellation grammar refused", () => {
    const index = peopleNameIndex(
      people({
        content: {
          appellations: {
            selfAppellation: "Testa",
            exonyms: ["Diverses appellations selon les sous-groupes"],
          },
          sources: [...SOURCED],
        } as People["content"],
      })
    );

    expect(index.rejected).toEqual([
      "Diverses appellations selon les sous-groupes",
    ]);
  });
});
