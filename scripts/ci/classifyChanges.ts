/**
 * Decide how much of the CI a pull request has to run, from the paths it touches.
 *
 *   npx tsx scripts/ci/classifyChanges.ts origin/recette   prints `scope=docs|corpus|code`
 *
 * Most PRs here edit a ledger or a fiche and nothing else, and used to wait for
 * the whole suite. The default is deliberately the expensive answer: a path this
 * file does not recognise is code, and so is an empty or unreadable diff, so a
 * mistake in the table costs minutes rather than skipping a gate.
 *
 * Why not `vitest --changed`: it follows imports, and dozens of tests read
 * `dataset/` and `docs/` straight off the disk. The docs and corpus scopes run
 * those tests by name instead (see ci.yml).
 */
import { execFileSync } from "node:child_process";

type ChangeScope = "docs" | "corpus" | "code";

const isDocumentation = (file: string) =>
  file.startsWith("docs/") || /^[^/]+\.md$/.test(file);
const isCorpus = (file: string) => file.startsWith("dataset/");

export function classifyChanges(files: string[]): ChangeScope {
  if (files.length === 0) return "code";
  if (!files.every((file) => isDocumentation(file) || isCorpus(file))) {
    return "code";
  }
  return files.some(isCorpus) ? "corpus" : "docs";
}

function main(base: string) {
  const files = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  console.log(`scope=${classifyChanges(files)}`);
}

if (process.argv[1]?.endsWith("classifyChanges.ts")) {
  const base = process.argv[2];
  if (!base) {
    console.error("usage: classifyChanges.ts <base-ref>");
    process.exit(2);
  }
  main(base);
}
