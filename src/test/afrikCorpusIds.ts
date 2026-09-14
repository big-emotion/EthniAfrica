import { readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

/**
 * The ids a chip may point at, read from the fiches in git.
 *
 * A chip checked only for a non-empty id passes on a typo and on a people the
 * atlas does not hold; the reader then finds the 404 before we do. Reading the
 * directories is the only version of that check that can fail for the reason
 * it gives.
 */
// @req REQ-113
export function afrikCorpusIds(): {
  country: Set<string>;
  people: Set<string>;
  family: Set<string>;
} {
  const root = resolve(process.cwd(), "dataset/source/afrik");
  const stem = (file: string) => basename(file, ".json");

  const country = new Set(readdirSync(join(root, "pays")).map(stem));
  const family = new Set(
    readdirSync(join(root, "famille_linguistique")).map(stem)
  );

  const people = new Set<string>();
  const peoplesRoot = join(root, "peuples");
  for (const branch of readdirSync(peoplesRoot)) {
    const branchPath = join(peoplesRoot, branch);
    if (!statSync(branchPath).isDirectory()) continue;
    for (const file of readdirSync(branchPath)) {
      if (file.startsWith("PPL_") && file.endsWith(".json")) {
        people.add(stem(file));
      }
    }
  }

  return { country, people, family };
}
