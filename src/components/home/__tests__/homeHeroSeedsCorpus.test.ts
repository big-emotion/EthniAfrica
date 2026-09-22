import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";

/**
 * The three seed chips are fixed copy now, so nothing ties them to the corpus
 * but this test. A chip that runs a query returning nothing, on the one screen
 * that has to say the corpus is not thin, is the failure it exists to catch —
 * a first pass of the old fallback pool shipped four such words.
 *
 * It reads `dataset/source/afrik/`, not Supabase: the atlas charter §4 is
 * explicit that an interface may only call a name present when it has
 * consulted the source of truth rather than a projection of it. A chip may
 * name a patronyme, a language or a people under any form the fiche files it
 * under — « Peul » is an exonym of the Fulbe entry, which is exactly the form
 * a French reader types.
 */

const CORPUS = join(process.cwd(), "dataset/source/afrik");

function jsonFilesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return jsonFilesUnder(path);
    return entry.endsWith(".json") ? [path] : [];
  });
}

function strings(values: unknown): string[] {
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string")
    : [];
}

function corpusNames(): Set<string> {
  const names = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value) names.add(value);
  };

  for (const file of jsonFilesUnder(join(CORPUS, "patronymes"))) {
    const fiche = JSON.parse(readFileSync(file, "utf8"));
    add(fiche.nameMain);
    for (const spelling of fiche.spellings ?? []) add(spelling?.spelling);
  }
  for (const file of jsonFilesUnder(join(CORPUS, "langues"))) {
    const fiche = JSON.parse(readFileSync(file, "utf8"));
    add(fiche.nameFr);
    add(fiche.nameEn);
    strings(fiche.alternateNames).forEach(add);
  }
  for (const file of jsonFilesUnder(join(CORPUS, "peuples"))) {
    const fiche = JSON.parse(readFileSync(file, "utf8"));
    add(fiche.nameMain);
    strings(fiche.content?.appellations?.exonyms).forEach(add);
  }
  return names;
}

describe("home hero seed chips", () => {
  // @req REQ-002
  it("names only entries the corpus actually holds, in both languages", () => {
    const names = corpusNames();
    const missing = (["fr", "en"] as const).flatMap((language) =>
      homeHeroCopy[language].seeds
        .filter((word) => !names.has(word))
        .map((word) => `${language}: ${word}`)
    );

    expect(missing).toEqual([]);
  });

  // The placeholder and the chips give the same examples, so the reader who
  // reads one and taps the other meets one set.
  // @req REQ-002
  it("offers the placeholder's own examples", () => {
    for (const language of ["fr", "en"] as const) {
      const copy = homeHeroCopy[language];
      for (const word of copy.seeds) {
        expect(copy.searchPlaceholder).toContain(word);
      }
    }
  });
});
