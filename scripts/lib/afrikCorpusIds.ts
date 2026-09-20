/**
 * Which corpus ids actually exist, read straight off the fiches in
 * `dataset/source/afrik` — the same tree `validateAfrikData.ts` reads,
 * never the database. A CI gate has no Supabase credentials and does not
 * need any: the fiche is the editorial source of truth.
 */
import { readdirSync } from "node:fs";
import path from "node:path";

export type CorpusKind =
  "people" | "country" | "family" | "language" | "patronyme";

const AFRIK_ROOT = path.join(__dirname, "../../dataset/source/afrik");

function idsFromFlatDir(
  dir: string,
  filter?: (name: string) => boolean
): Set<string> {
  let names: string[];
  try {
    names = readdirSync(path.join(AFRIK_ROOT, dir));
  } catch {
    return new Set();
  }
  return new Set(
    names
      .filter((name) => name.endsWith(".json") && (!filter || filter(name)))
      .map((name) => name.slice(0, -".json".length))
  );
}

function peopleIds(): Set<string> {
  let familyDirs: string[];
  try {
    familyDirs = readdirSync(path.join(AFRIK_ROOT, "peuples"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return new Set();
  }
  const ids = new Set<string>();
  for (const familyDir of familyDirs) {
    for (const file of readdirSync(
      path.join(AFRIK_ROOT, "peuples", familyDir)
    )) {
      if (file.startsWith("PPL_") && file.endsWith(".json")) {
        ids.add(file.slice(0, -".json".length));
      }
    }
  }
  return ids;
}

const cache: Partial<Record<CorpusKind, Set<string>>> = {};

function idsFor(kind: CorpusKind): Set<string> {
  if (!cache[kind]) {
    switch (kind) {
      case "people":
        cache.people = peopleIds();
        break;
      case "country":
        cache.country = idsFromFlatDir("pays");
        break;
      case "family":
        cache.family = idsFromFlatDir("famille_linguistique", (name) =>
          name.startsWith("FLG_")
        );
        break;
      case "language":
        cache.language = idsFromFlatDir("langues");
        break;
      case "patronyme":
        cache.patronyme = idsFromFlatDir("patronymes", (name) =>
          name.startsWith("PAT_")
        );
        break;
    }
  }
  return cache[kind]!;
}

export function corpusIdExists(kind: CorpusKind, id: string): boolean {
  return idsFor(kind).has(id);
}
