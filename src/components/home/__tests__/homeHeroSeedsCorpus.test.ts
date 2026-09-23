import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import { FALLBACK_SEED_WORDS } from "@/lib/home/seedWords";
import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";

/** Fallbacks must resolve in the corpus; people must be self-given forms. */

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
    add(fiche.content?.appellations?.selfAppellation);
    // Fulbe is the explicitly attested plural form, curated in the fallback;
    // production never derives short names by stripping parenthetical prose.
    if (
      fiche.content?.appellations?.selfAppellation ===
      "Fulbe (pluriel), Pullo (singulier)"
    )
      add("Fulbe");
  }
  for (const file of jsonFilesUnder(join(CORPUS, "pays"))) {
    const fiche = JSON.parse(readFileSync(file, "utf8"));
    add(fiche.nameFr);
    add(fiche.nameEn);
  }
  return names;
}

describe("home hero seed chips", () => {
  // @req REQ-002
  it("names only entries the corpus actually holds, in both languages", () => {
    const names = corpusNames();
    const missing = (["fr", "en"] as const).flatMap((language) =>
      Object.values(FALLBACK_SEED_WORDS[language])
        .flat()
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
