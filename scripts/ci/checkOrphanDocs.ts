/**
 * Documents nothing points at.
 *
 * `check:dead` holds unreferenced *code* at zero; prose had no equivalent, and
 * the measurement that prompted this said why it mattered: **15 of 84 tracked
 * documents were referenced by nothing at all**, two of them written that same
 * week. A document nothing points at is a document nobody reads — the charter
 * that governs a surface, the runbook for the outage, the audit somebody paid
 * for.
 *
 * The cause was structural rather than careless: `docs/` had no index, so a
 * document was reachable only if another document happened to mention it.
 * `--write` regenerates `docs/README.md`; the default run is the gate.
 *
 * **The ceiling is a ratchet, exactly as `DEAD_CODE_CEILINGS` is**: a count
 * above it fails, and so does a count below it, with the line to change. A
 * ceiling left standing above the real number is a licence to climb back to it.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** Read the constant, not a copy of it in prose. */
export const ORPHAN_DOC_CEILING = 0;

/**
 * A README is a directory's own entry point, by the same convention knip uses
 * for `scripts/**`: it is reachable because somebody opening the folder finds
 * it, not because another file links it.
 */
function isEntryPoint(file: string): boolean {
  return path.basename(file) === "README.md";
}

function tracked(): string[] {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

const BINARY = /\.(png|jpe?g|webp|gif|ico|pdf|ttf|otf|woff2?|mp4|mp3|zip)$/i;

/**
 * Every tracked text file except one, concatenated: the haystack a reference to
 * that one document hides in.
 *
 * Excluding the document itself is the whole point. A first version counted
 * occurrences across everything and allowed one, to forgive a self-mention —
 * which silently forgave the index entry too, so adding the index changed
 * nothing and the gate stayed red for reasons it could not explain.
 */
function referencesTo(doc: string, files: string[]): number {
  const base = path.basename(doc);
  let count = 0;
  for (const file of files) {
    if (file === doc || BINARY.test(file)) continue;
    try {
      count += fs.readFileSync(file, "utf8").split(base).length - 1;
    } catch {
      // A path git tracks but the worktree does not hold is not a reference.
    }
  }
  return count;
}

function firstHeading(file: string): string {
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (line.startsWith("# ")) return line.slice(2).trim();
  }
  return path.basename(file);
}

const GROUPS: ReadonlyArray<readonly [string, string]> = [
  ["design", "Design — the charters and the reviewed renderings"],
  ["editorial", "Editorial — doctrine, audits and essays"],
  ["audience", "Audience — the dated reports the publishing chain reads"],
  ["runbooks", "Runbooks — procedures, and records of ones already run"],
  ["adr", "Decisions"],
  ["confluence-spec", "Spec — the pointers to Confluence"],
  ["templates", "Templates"],
  ["plans", "Plans"],
];

function buildIndex(docs: string[]): string {
  const lines: string[] = [
    "# Documentation index",
    "",
    "Every document tracked under `docs/`. Generated — regenerate it with",
    "`npm run docs:index` rather than editing it by hand.",
    "",
    "It exists because reachability used to be accidental: 15 of 84 documents",
    "were referenced by nothing at all, two of them written that same week.",
    "`npm run check:orphan-docs` holds the count at zero from both sides.",
    "",
  ];

  const placed = new Set<string>();
  for (const [prefix, heading] of GROUPS) {
    const members = docs.filter((doc) => doc.startsWith(`docs/${prefix}/`));
    if (members.length === 0) continue;
    lines.push(`## ${heading}`, "");
    for (const doc of members) {
      placed.add(doc);
      lines.push(`- [${firstHeading(doc)}](${doc.slice("docs/".length)})`);
    }
    lines.push("");
  }

  const rest = docs.filter((doc) => !placed.has(doc));
  if (rest.length > 0) {
    lines.push("## Elsewhere", "");
    for (const doc of rest) {
      lines.push(`- [${firstHeading(doc)}](${doc.slice("docs/".length)})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main(): void {
  const write = process.argv.includes("--write");
  const files = tracked();
  const docs = files
    .filter((file) => file.startsWith("docs/") && file.endsWith(".md"))
    .filter((file) => file !== "docs/README.md")
    .sort();

  if (write) {
    fs.writeFileSync("docs/README.md", buildIndex(docs), "utf8");
    console.log(`docs/README.md — ${docs.length} document(s)`);
    return;
  }

  const orphans = docs.filter(
    (doc) => !isEntryPoint(doc) && referencesTo(doc, files) === 0
  );

  for (const orphan of orphans) {
    console.error(`::error file=${orphan}::nothing references ${orphan}`);
  }

  console.log(
    `check:orphan-docs — ${orphans.length} orphan(s) among ${docs.length} document(s), ceiling ${ORPHAN_DOC_CEILING}`
  );

  if (orphans.length > ORPHAN_DOC_CEILING) {
    console.error(
      `\nEach one is linked from docs/README.md — run \`npm run docs:index\` — or deleted.\n` +
        `An orphan is a candidate for deletion, not a verdict: a dated ledger is\n` +
        `linked, a superseded proposal is removed.`
    );
    process.exit(1);
  }

  if (orphans.length < ORPHAN_DOC_CEILING) {
    console.error(
      `\nLower ORPHAN_DOC_CEILING to ${orphans.length} in scripts/ci/checkOrphanDocs.ts.\n` +
        `A ceiling above the real number is a licence to climb back to it.`
    );
    process.exit(1);
  }
}

main();
