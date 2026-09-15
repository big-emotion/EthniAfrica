/**
 * Refuse any configured host identifier in the public repository.
 *
 *   npx tsx scripts/ci/checkInfraDisclosure.ts            every tracked file
 *   npx tsx scripts/ci/checkInfraDisclosure.ts --staged   what is about to be committed
 *
 * Two rules, one gate. **Terms** — the real addresses, ports, provider and
 * locations — come from `INFRA_DISCLOSURE_TERMS` and are checked on every
 * tracked file; `scripts/lib/infraDisclosure.ts` says why they are not in the
 * repository. **Shapes** — anything that addresses or locates a machine at all —
 * are checked on the files whose purpose is to describe the infrastructure, and
 * need no variable, so a fork, a Dependabot run and a fresh clone still enforce
 * that much. With no variable configured the check says which half it ran.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

import {
  SHAPE_GUARDED_PATHS,
  findDisclosures,
  findIdentifierShapes,
  parseDisclosureTerms,
} from "../lib/infraDisclosure";

const VARIABLE = "INFRA_DISCLOSURE_TERMS";

/**
 * Binaries, lockfiles and the corpus. A city name is a legitimate word in a
 * people's migration history; it is only a leak next to a server.
 */
const SKIP =
  /(^|\/)(package-lock\.json|node_modules\/|dataset\/)|\.(png|jpe?g|gif|webp|ico|svg|pdf|mp4|mov|woff2?|ttf|otf|zip|tgz)$/i;

function configuredTerms(): string[] {
  const fromEnvironment = parseDisclosureTerms(process.env[VARIABLE]);
  if (fromEnvironment.length > 0 || !existsSync(".env.local")) {
    return fromEnvironment;
  }
  const declaration = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((line) => line.startsWith(`${VARIABLE}=`));
  return parseDisclosureTerms(
    declaration?.slice(VARIABLE.length + 1).replace(/^"|"$/g, "")
  );
}

function candidateFiles(stagedOnly: boolean): string[] {
  const args = stagedOnly
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR"]
    : ["ls-files"];
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .filter((file) => file && !SKIP.test(file));
}

function main(): number {
  const offences: string[] = [];

  for (const file of SHAPE_GUARDED_PATHS) {
    if (!existsSync(file)) continue;
    for (const { line, shape } of findIdentifierShapes(
      readFileSync(file, "utf8")
    )) {
      offences.push(`  ${file}:${line} — ${shape}`);
    }
  }

  const terms = configuredTerms();
  if (terms.length === 0) {
    console.log(
      `ℹ ${VARIABLE} is not configured — only the ${SHAPE_GUARDED_PATHS.length} shape-guarded file(s) were checked`
    );
  }

  for (const file of terms.length === 0
    ? []
    : candidateFiles(process.argv.includes("--staged"))) {
    let content: string;
    try {
      if (statSync(file).size > 2_000_000) continue;
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const { line, term } of findDisclosures(content, terms)) {
      // The position, never the term: CI logs of a public repository are
      // public too, and echoing the match would publish it there.
      offences.push(`  ${file}:${line} — term #${terms.indexOf(term) + 1}`);
    }
  }

  if (offences.length > 0) {
    console.error(
      `✖ ${offences.length} host identifier(s) in tracked files:\n${offences.join("\n")}\n` +
        `Name the machine by its role instead ("the application host", "the Supabase host"); ` +
        `concrete values belong in GitHub secrets and the operator's private notes.`
    );
    return 1;
  }
  console.log(
    `✔ no host identifier (${terms.length} term(s), ${SHAPE_GUARDED_PATHS.length} shape-guarded file(s))`
  );
  return 0;
}

process.exit(main());
