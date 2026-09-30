/**
 * Recover published social posts as draft articles.
 *
 *     node social/tools/articles-import/run.mjs --out <private dir> \
 *       [--curation <private curation.json>] [--cutoff YYYY-MM-DD] \
 *       [--only id,id] [--write] [--resnapshot]
 *
 * A dry run (the default) reads and verifies everything and writes nothing.
 * `--write` writes the manifest, the report and the WebP derivatives under
 * `--out`, and draft records under `content/articles/`.
 *
 * `--out` has no default on purpose: the manifest names private files and
 * must live outside this public repository, and spelling a workstation path
 * here would publish it.
 */
import path from "node:path";
import fs from "node:fs";
import { parseArgs } from "node:util";

import { repoRoot } from "../paths.mjs";
import { runImport } from "./import.mjs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      out: { type: "string" },
      curation: { type: "string" },
      cutoff: { type: "string" },
      only: { type: "string" },
      write: { type: "boolean", default: false },
      resnapshot: { type: "boolean", default: false },
    },
  }));
} catch (error) {
  fail(error.message);
}

// Read after `../paths.mjs` has folded `.env.local` into the environment; an
// empty value is not a value.
const postsRoot = (process.env.ETHNIAFRICA_SOCIAL_POSTS ?? "").trim();
const workshopRoot = (process.env.ETHNIAFRICA_SOCIAL_PROJECTS ?? "").trim();
if (!postsRoot)
  fail("ETHNIAFRICA_SOCIAL_POSTS is not set: no library to recover from.");
if (!workshopRoot)
  fail(
    "ETHNIAFRICA_SOCIAL_PROJECTS is not set: no workshop to read sources from."
  );
if (!values.out)
  fail("--out is required: a private directory outside the repository.");
const outDir = path.resolve(values.out);
if (outDir.startsWith(repoRoot() + path.sep)) {
  fail(
    "--out must be outside the repository: the manifest names private files."
  );
}
if (values.cutoff && !/^\d{4}-\d{2}-\d{2}$/.test(values.cutoff))
  fail("--cutoff expects YYYY-MM-DD.");

const curation = values.curation
  ? JSON.parse(fs.readFileSync(values.curation, "utf8"))
  : {};
const result = await runImport({
  postsRoot: path.resolve(postsRoot),
  workshopRoot: path.resolve(workshopRoot),
  siteLedgerDir: path.join(repoRoot(), "docs", "productions"),
  dossierDir: path.join(repoRoot(), "dataset", "source", "afrik", "dossiers"),
  articlesDir: path.join(repoRoot(), "content", "articles"),
  outDir,
  curation,
  write: values.write,
  cutoff: values.cutoff ?? null,
  only: values.only
    ? new Set(values.only.split(",").map((s) => s.trim()))
    : null,
  resnapshot: values.resnapshot,
});

const tally = {};
for (const c of result.candidates)
  tally[c.disposition] = (tally[c.disposition] ?? 0) + 1;
const bytes = result.candidates
  .flatMap((c) => c.derivatives ?? [])
  .reduce((n, d) => n + d.bytes, 0);
console.log(
  `${values.write ? "written" : "dry run"}: ${result.candidates.length} candidates — ` +
    Object.entries(tally)
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", ") +
    `; derivatives ${bytes} bytes`
);
for (const c of result.candidates.filter((x) => x.draft)) {
  console.log(`  ${c.draft.action.padEnd(9)} content/articles/${c.draft.file}`);
}
