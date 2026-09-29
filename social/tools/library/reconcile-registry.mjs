/**
 * Apply verified corrections to the private registry — the only bulk-capable
 * write S2 makes, and deliberately the smallest.
 *
 *     node social/tools/library/reconcile-registry.mjs --corrections <file.json>
 *     node social/tools/library/reconcile-registry.mjs --corrections <file.json> \
 *       --backup-label <label> --write
 *
 * Without `--write` it prints the diff and touches nothing. With it, the
 * registry is first copied to `publications.json.avant-<label>` beside itself —
 * the library's own convention for a point of return — and never over an
 * existing copy. A run that would change nothing writes nothing and makes no
 * backup, so running it twice is safe. Moving folders and regenerating views
 * stay with the library's tools; this only edits the entries.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { registryFile } from "../paths.mjs";
import { planCorrections } from "./reconcile-plan.mjs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      corrections: { type: "string" },
      "backup-label": { type: "string" },
      write: { type: "boolean", default: false },
    },
  }));
} catch (error) {
  fail(error.message);
}
if (!values.corrections) fail("--corrections <file.json> is required.");
if (
  values.write &&
  !/^[a-z0-9][a-z0-9-]*$/.test(values["backup-label"] ?? "")
) {
  fail("--write needs --backup-label (lowercase letters, digits, hyphens).");
}

const file = registryFile();
if (!file || !existsSync(file))
  fail("registry not found: is ETHNIAFRICA_SOCIAL_POSTS set?");

const original = readFileSync(file, "utf8");
const registry = JSON.parse(original);
// The registry has no version history and is partly hand-edited. If parsing and
// re-serialising would change a byte this run does not mean to touch, the write
// would be an unreviewable rewrite of the whole file, so it is refused.
const indent = original.match(/^[ \t]+(?=")/m)?.[0] ?? "  ";
const trailing = original.endsWith("\n") ? "\n" : "";
const serialize = (value) => JSON.stringify(value, null, indent) + trailing;
if (values.write && serialize(registry) !== original) {
  fail(
    `refused: rewriting ${file} would change bytes this run does not touch. Nothing was written.`
  );
}

const { corrections } = JSON.parse(readFileSync(values.corrections, "utf8"));
const { changes, refusals } = planCorrections(registry.posts, corrections);

for (const change of changes) {
  console.log(`~ ${change.post}`);
  console.log(`    before ${JSON.stringify(change.before)}`);
  console.log(`    after  ${JSON.stringify(change.after)}`);
  console.log(
    `    from   ${change.sources.map((s) => `${s.kind}:${s.ref}`).join(", ")}`
  );
}
for (const refusal of refusals)
  console.log(`! ${refusal.post}: ${refusal.reason}`);
console.log(`${changes.length} change(s), ${refusals.length} refusal(s).`);

if (!values.write) {
  console.log("Dry run: nothing was written. Re-run with --write.");
  process.exit(0);
}
if (changes.length === 0) process.exit(0);

const backup = `${file}.avant-${values["backup-label"]}`;
if (existsSync(backup))
  fail(`backup already exists, not overwritten: ${backup}`);
copyFileSync(file, backup);

for (const change of changes) {
  const entry = registry.posts.find(
    (candidate) => candidate.id === change.post
  );
  Object.assign(entry, change.after);
}
writeFileSync(file, serialize(registry));
console.log(`backup: ${backup}`);
console.log(`written: ${file}`);
