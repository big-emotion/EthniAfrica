import { describe, expect, it } from "vitest";

import { PROVERBS } from "@/lib/proverbs/proverbs";
import {
  PROVERBS_EN,
  localizeProverb,
  type ProverbTranslation,
} from "@/lib/proverbs/proverbs.en";
import {
  frenchResidue,
  glossaryBreaches,
  readsAsUntranslated,
} from "@/test/englishBankParity";

const frenchById = new Map(PROVERBS.map((entry) => [entry.id, entry]));

/** The prose an English reader reads; names and citations are checked apart. */
function translatedProse(entry: ProverbTranslation): string[] {
  return [
    entry.text,
    entry.meaning,
    entry.origin.note,
    ...entry.sources.flatMap((source) => (source.notes ? [source.notes] : [])),
  ].filter((text) => text.trim() !== "");
}

/**
 * Proper names the English notes carry with their own accents: the people and
 * institutions a citation names, which no English form replaces.
 */
const PROPER_NAMES_IN_NOTES = [
  "Léopold Sédar Senghor",
  "Hampâté Bâ",
  "Félix Houphouët-Boigny",
  "Cahiers d'études africaines",
  "Institut national de l'audiovisuel",
  "Journal des Africanistes",
  "Persée",
  "Baoulé",
  "Mooré",
];

/** Strings that stay verbatim in English and must not condemn a sentence. */
function invariantNames(id: string): string[] {
  const french = frenchById.get(id)!;
  return [
    ...PROPER_NAMES_IN_NOTES,
    ...(french.original ? [french.original.text] : []),
    ...french.entities.map((entity) => entity.label),
    ...french.sources.map((source) => source.title),
  ];
}

describe("the English proverb bank — parity with the French (REQ-145)", () => {
  // @req REQ-145
  it("carries exactly the proverbs the French bank holds", () => {
    expect(Object.keys(PROVERBS_EN).sort()).toEqual(
      PROVERBS.map((entry) => entry.id).sort()
    );
  });

  // @req REQ-145
  it("translates every string rather than leaving one empty or French", () => {
    const untranslated: string[] = [];

    for (const [id, entry] of Object.entries(PROVERBS_EN)) {
      const french = frenchById.get(id)!;
      const pairs: Array<[string, string]> = [
        [french.text, entry.text],
        [french.meaning, entry.meaning],
      ];
      for (const [fr, en] of pairs) {
        if (readsAsUntranslated(fr, en)) untranslated.push(`${id}: ${en}`);
      }
      for (const text of translatedProse(entry)) {
        const residue = frenchResidue(text, invariantNames(id));
        if (residue) untranslated.push(`${id}: "${residue}" in ${text}`);
      }
    }

    expect(untranslated).toEqual([]);
  });

  // @req REQ-145
  it("keeps the shape of each proverb: status, chips and citations in the same order", () => {
    for (const [id, entry] of Object.entries(PROVERBS_EN)) {
      const french = frenchById.get(id)!;

      expect(entry.origin.status, id).toBe(french.origin.status);
      expect(entry.origin.note.trim() === "", id).toBe(
        french.origin.note.trim() === ""
      );
      expect(
        entry.entities.map((entity) => `${entity.kind}:${entity.id}`),
        id
      ).toEqual(french.entities.map((entity) => `${entity.kind}:${entity.id}`));
      expect(entry.sources.length, id).toBe(french.sources.length);
    }
  });
});

describe("the English proverb bank — invariants (REQ-143)", () => {
  // The original is the proverb itself; translating or respelling it would
  // replace the people's words with ours.
  // @req REQ-143
  it("keeps the original text, people names, source titles, URLs and tiers verbatim", () => {
    for (const [id, entry] of Object.entries(PROVERBS_EN)) {
      const french = frenchById.get(id)!;

      expect(entry.original?.text, id).toBe(french.original?.text);
      expect(entry.original?.lang, id).toBe(french.original?.lang);
      for (const [index, entity] of entry.entities.entries()) {
        expect(entity.label.trim(), `${id} chip ${index}`).not.toBe("");
        if (entity.kind === "people") {
          expect(entity.label, `${id} chip ${index}`).toBe(
            french.entities[index].label
          );
        }
      }
      for (const [index, source] of entry.sources.entries()) {
        const original = french.sources[index];
        expect(source.title, `${id} source ${index}`).toBe(original.title);
        expect(source.url, `${id} source ${index}`).toBe(original.url);
        expect(source.tier, `${id} source ${index}`).toBe(original.tier);
      }
    }
  });
});

describe("the English proverb bank — provenance and register", () => {
  // @req REQ-142
  it("declares machine provenance on every proverb", () => {
    for (const entry of Object.values(PROVERBS_EN)) {
      expect(entry.provenance).toBe("machine");
    }
  });

  // @req REQ-144
  it("respects the glossary and writes British English without contractions", () => {
    const contraction =
      /\b(?:don|doesn|isn|aren|wasn|weren|can|won|didn|hasn|haven|couldn|wouldn|shouldn)'t\b|\b(?:it|that|there|what|who)'s\b|\b(?:they|we|you)'re\b/i;
    const offenders: string[] = [];

    for (const [id, entry] of Object.entries(PROVERBS_EN)) {
      for (const text of translatedProse(entry)) {
        const hit = text.match(contraction);
        if (hit) offenders.push(`${id}: ${hit[0]}`);
        for (const breach of glossaryBreaches(text)) {
          offenders.push(`${id}: ${breach}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("localizeProverb", () => {
  // @req REQ-145
  it("returns the French proverb untouched on /fr and its English twin on /en", () => {
    const french = PROVERBS[0];

    expect(localizeProverb(french, "fr")).toBe(french);
    expect(localizeProverb(french, "en")).toMatchObject({
      id: french.id,
      text: PROVERBS_EN[french.id].text,
      translationKind: "machine",
    });
  });
});
