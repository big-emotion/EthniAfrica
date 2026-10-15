// @req REQ-195
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The database refuses a `sources` row typed oral_tradition without an oral
// narrative (constraint sources_oral_narrative_id_check, migration 089).
// Only the sources of a nameHistory account carry the carrier, narrative and
// place the loader turns into that narrative; the plain `sources` list of a
// fiche has none. PAT_KOLLO typed its family testimony oral_tradition in that
// list and the recette synchronization stopped on it.

const AFRIK_ROOT = resolve(__dirname, "../../dataset/source/afrik");

function ficheFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return ficheFiles(path);
    return entry.name.endsWith(".json") && !entry.name.startsWith("_")
      ? [path]
      : [];
  });
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("fiche-level sources and the oral narrative constraint", () => {
  // @req REQ-195
  it("types no source of a fiche's plain sources list as oral_tradition", () => {
    const offenders = ficheFiles(AFRIK_ROOT).flatMap((path) => {
      const sources = readJson(path).sources;
      if (!Array.isArray(sources)) return [];
      return sources
        .filter(
          (source: { source_kind?: string }) =>
            source?.source_kind === "oral_tradition"
        )
        .map((source: { title?: string }) => `${path}: ${source.title}`);
    });
    expect(offenders).toEqual([]);
  });

  // @req REQ-195
  it("tells the Kollo family testimony as an oral account under its own title", () => {
    const kollo = readJson(
      join(AFRIK_ROOT, "patronymes", "PAT_KOLLO.json")
    ) as {
      sources: { title: string }[];
      nameHistory: {
        names: {
          nameText: string;
          accounts: { sources: { title: string; source_kind: string }[] }[];
        }[];
      };
    };
    const ngoKollo = kollo.nameHistory.names.find(
      (name) => name.nameText === "Ngo Kollo"
    );
    const oralSources = (ngoKollo?.accounts ?? [])
      .flatMap((account) => account.sources)
      .filter((source) => source.source_kind === "oral_tradition");
    expect(oralSources).toHaveLength(1);
    const planeTitles = kollo.sources.map((source) => source.title);
    expect(planeTitles).not.toContain(oralSources[0].title);
  });
});
