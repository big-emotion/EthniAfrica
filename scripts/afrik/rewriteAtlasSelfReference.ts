/**
 * Rewrites the corpus sentences in which the project calls itself "the atlas".
 *
 * Operator ruling, 2026-09-22: a reader never reads "atlas" as the name of the
 * project; it speaks as « nous ». `gaps[].reason` and `sources[].notes` are
 * published verbatim, and 1 686 of the 2 272 offending fields were three
 * sentences a generator repeated, so a phrase table does most of the work.
 * Whatever the table does not know is left for a curator: the
 * reader-facing-register gate names it, and a guessed rewrite of a
 * hand-written sentence is how its meaning gets lost.
 *
 * Files are edited as text, never re-serialised (a JSON round trip reformats
 * 1 693 of the 1 749 records), and every edit is checked against the same
 * rewrite applied to the parsed record before anything is written.
 *
 * English sidecar hashes are not refreshed: the parity report is advisory, and
 * refreshing would declare in sync a sidecar whose English was not rewritten
 * the same way.
 *
 * Usage: npx tsx scripts/afrik/rewriteAtlasSelfReference.ts [--write]
 */
import fs from "node:fs";
import path from "node:path";

const A = "['’]";

/**
 * Longest phrases first. Lowercase « atlas » only: the titles of real works and
 * the Atlas mountains are capitalised and never matched.
 */
const PHRASES: ReadonlyArray<[RegExp, string]> = [
  [
    new RegExp(`L${A}atlas ne documente pas encore`, "g"),
    "Nous ne documentons pas encore",
  ],
  [
    new RegExp(`au relevé de couverture de l${A}atlas`, "g"),
    "à notre relevé de couverture",
  ],
  [
    new RegExp(`l${A}atlas ne le documente pas encore`, "g"),
    "nous ne le documentons pas encore",
  ],
  [
    new RegExp(`l${A}atlas ne la documente pas encore`, "g"),
    "nous ne la documentons pas encore",
  ],
  [
    new RegExp(`ayant lui-même une fiche dans l${A}atlas`, "g"),
    "ayant lui-même sa fiche ici",
  ],
  [
    new RegExp(`un nom déjà présent dans l${A}atlas`, "g"),
    "un nom qui a déjà sa fiche ici",
  ],
  [
    new RegExp(`Fiche des (\\p{L}+) de l${A}atlas`, "gu"),
    "Fiche EthniAfrica des $1",
  ],
  [new RegExp(`L${A}atlas rappelle`, "g"), "Nous rappelons"],
  [new RegExp(`les fiches peuple de l${A}atlas`, "g"), "nos fiches peuple"],
  [new RegExp(`figurent dans l${A}atlas`, "g"), "sont documentés ici"],
  [new RegExp(`noms de l${A}atlas`, "g"), "noms documentés ici"],
  [new RegExp(`nom de l${A}atlas`, "g"), "nom documenté ici"],
  [/The atlas does not yet document/g, "We do not yet document"],
  [/the atlas does not yet document/g, "we do not yet document"],
];

export function rewriteAtlasSelfReference(text: string): string {
  return PHRASES.reduce((out, [pattern, to]) => out.replace(pattern, to), text);
}

function rewriteEveryString(value: unknown): unknown {
  if (typeof value === "string") return rewriteAtlasSelfReference(value);
  if (Array.isArray(value)) return value.map(rewriteEveryString);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        rewriteEveryString(child),
      ])
    );
  }
  return value;
}

const STRING_LITERAL = /"(?:[^"\\]|\\.)*"/g;

export function rewriteAtlasSelfReferenceInRecord(raw: string): string {
  const text = raw.replace(STRING_LITERAL, (literal) => {
    const value = JSON.parse(literal) as string;
    const rewritten = rewriteAtlasSelfReference(value);
    return rewritten === value ? literal : JSON.stringify(rewritten);
  });
  if (text === raw) return raw;

  const expected = JSON.stringify(rewriteEveryString(JSON.parse(raw)));
  if (JSON.stringify(JSON.parse(text)) !== expected) {
    throw new Error("A text edit diverged from the parsed rewrite");
  }
  return text;
}

const ROOTS = ["dataset/source/afrik", "dataset/translations/en"];
const SKIPPED_DIRECTORIES = new Set(["archive", "logs"]);

function listRecords(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name))
        found.push(...listRecords(child));
    } else if (entry.name.endsWith(".json")) {
      found.push(child);
    }
  }
  return found.sort();
}

function main(): void {
  const write = process.argv.includes("--write");
  let records = 0;
  for (const root of ROOTS) {
    for (const file of listRecords(path.join(process.cwd(), root))) {
      const raw = fs.readFileSync(file, "utf8");
      const text = rewriteAtlasSelfReferenceInRecord(raw);
      if (text === raw) continue;
      records += 1;
      if (write) fs.writeFileSync(file, text, "utf8");
    }
  }
  process.stdout.write(
    `${write ? "Rewrote" : "Would rewrite"} ${records} record(s).${write ? "" : " Run with --write to apply."}\n`
  );
}

if (process.argv[1]?.endsWith("rewriteAtlasSelfReference.ts")) {
  main();
}
