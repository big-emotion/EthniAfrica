#!/usr/bin/env npx tsx

/**
 * Advisory report: which generic skill packs were derived from a file of this
 * repository that has changed since.
 *
 *   npm run check:skill-drift -- --packs <directory of packs>
 *   SKILL_PACKS_DIR=<directory> npm run check:skill-drift
 *
 * Each pack carries a `derived-from.json` listing `{ path, sha256 }` for every
 * file it was copied from, `path` relative to this repository's root. Exit code
 * is 0 whatever is found, because the packs live in another repository and a
 * stale one is a prompt to look, not a reason to block a pull request here.
 * `--strict` turns drift into exit code 1 for a local check.
 */

import { resolve } from "node:path";

import { checkSkillDrift } from "../lib/skillDrift";

function argument(flag: string): string | undefined {
  const at = process.argv.indexOf(flag);
  return at === -1 ? undefined : process.argv[at + 1];
}

function main(): void {
  const root = resolve(import.meta.dirname, "../..");
  const packsDir = argument("--packs") ?? process.env.SKILL_PACKS_DIR;

  if (!packsDir) {
    console.log(
      "skill drift: no packs directory given (--packs <dir> or SKILL_PACKS_DIR) — nothing to compare"
    );
    return;
  }

  const report = checkSkillDrift(root, resolve(packsDir));
  let drifted = 0;
  for (const pack of report.packs) {
    if (pack.status === "in-sync") {
      console.log(`✓ ${pack.pack}: in sync`);
      continue;
    }
    drifted += 1;
    console.warn(`! ${pack.pack}: ${pack.status}`);
    for (const finding of pack.findings) {
      console.warn(`    ${finding.kind}: ${finding.path}`);
    }
  }
  console.log(
    `skill drift: ${report.packs.length} pack(s) with a manifest, ${drifted} drifted, ${report.withoutManifest} without derived-from.json (tolerated)`
  );
  if (drifted > 0 && process.argv.includes("--strict")) process.exitCode = 1;
}

main();
