#!/usr/bin/env tsx
/**
 * Search-answer coverage report (REQ-178).
 *
 * Counts how many fiches fill each field the result page reads, so the fill
 * rate can be raised on purpose and watched by a human. It is a report, not a
 * gate: a missing field is a declared silence on the page, and failing a build
 * on it would hold back fiches that are correct as they stand. Only a
 * malformed invocation exits non-zero.
 *
 * Denominators are counted from the directories, never written down here.
 * `shortLine` lives on the name records (`noms/PPL_*.json`, `names[]`), not on
 * the people fiche, so it is measured per people against the number of peoples.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface CoverageRow {
  field: string;
  class: string;
  filled: number;
  total: number;
}

// Fiches are read defensively: every field is optional and checked by shape,
// so the report survives a record the strict models would reject.
type Fiche = Record<string, unknown>;

function at(value: unknown, ...keys: string[]): unknown {
  return keys.reduce<unknown>(
    (node, key) =>
      node && typeof node === "object"
        ? (node as Record<string, unknown>)[key]
        : undefined,
    value
  );
}

const ORIGIN_COLLECTIONS = [
  "oralTraditions",
  "writtenChronicles",
  "historicalSyntheses",
  "linguisticReconstructions",
];

function readJsonFile(file: string): Fiche | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? (parsed as Fiche) : null;
  } catch {
    return null;
  }
}

function listEntries(directory: string) {
  try {
    return readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** Fiches directly inside `directory` whose file name matches `pattern`. */
function readFiches(directory: string, pattern: RegExp): Fiche[] {
  return listEntries(directory)
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => readJsonFile(path.join(directory, entry.name)))
    .filter((fiche): fiche is Fiche => fiche !== null);
}

function readPeoples(datasetRoot: string): Fiche[] {
  const peoplesRoot = path.join(datasetRoot, "peuples");
  return listEntries(peoplesRoot)
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("FLG_"))
    .flatMap((family) =>
      readFiches(path.join(peoplesRoot, family.name), /^PPL_.*\.json$/)
    );
}

const filledText = (value: unknown) =>
  typeof value === "string" && value.trim() !== "";
const filledList = (value: unknown) => Array.isArray(value) && value.length > 0;

export function measureSearchAnswerCoverage(
  datasetRoot: string,
  productionsRoot: string
): CoverageRow[] {
  const peoples = readPeoples(datasetRoot);
  const nameRecords = readFiches(
    path.join(datasetRoot, "noms"),
    /^PPL_.*\.json$/
  );
  const countries = readFiches(
    path.join(datasetRoot, "pays"),
    /^[^_].*\.json$/
  );
  const languages = readFiches(
    path.join(datasetRoot, "langues"),
    /^[^_].*\.json$/
  );
  const families = readFiches(
    path.join(datasetRoot, "famille_linguistique"),
    /^FLG_.*\.json$/
  );
  const patronymes = readFiches(
    path.join(datasetRoot, "patronymes"),
    /^PAT_.*\.json$/
  );
  const words = readFiches(productionsRoot, /\.json$/);

  const row = (
    field: string,
    cls: string,
    fiches: Fiche[],
    isFilled: (fiche: Fiche) => boolean
  ): CoverageRow => ({
    field,
    class: cls,
    filled: fiches.filter(isFilled).length,
    total: fiches.length,
  });

  // Patronymes have no `content` wrapper; every other class nests it there.
  const searchAnswerRows = (
    cls: string,
    fiches: Fiche[],
    prefix: string[] = ["content"]
  ) => [
    row("searchAnswer.lead", cls, fiches, (f) =>
      filledText(at(f, ...prefix, "searchAnswer", "lead"))
    ),
    row("searchAnswer.followUp", cls, fiches, (f) =>
      filledText(at(f, ...prefix, "searchAnswer", "followUp"))
    ),
  ];

  return [
    {
      field: "names[].shortLine",
      class: "people",
      filled: nameRecords.filter((record) => {
        const names = at(record, "names");
        return (
          Array.isArray(names) &&
          names.some((name) => filledText(at(name, "shortLine")))
        );
      }).length,
      total: peoples.length,
    },
    ...searchAnswerRows("people", peoples),
    ...searchAnswerRows("country", countries),
    ...searchAnswerRows("language", languages),
    ...searchAnswerRows("family", families),
    ...searchAnswerRows("patronyme", patronymes, []),
    row("whyProblematic", "language", languages, (f) =>
      filledText(at(f, "whyProblematic"))
    ),
    row("speakers.byCountry", "language", languages, (f) =>
      filledList(at(f, "content", "speakers", "byCountry"))
    ),
    row("speakers.byCountry", "family", families, (f) =>
      filledList(at(f, "content", "speakers", "byCountry"))
    ),
    row("origin", "patronyme", patronymes, (f) =>
      ORIGIN_COLLECTIONS.some((collection) =>
        filledList(at(f, "origin", collection))
      )
    ),
    row("demographics.peoples", "country", countries, (f) =>
      filledList(at(f, "content", "demographics", "peoples"))
    ),
    row("answer", "word", words, (f) => {
      const answer = at(f, "answer");
      return !!answer && typeof answer === "object" && !Array.isArray(answer);
    }),
  ];
}

export function formatCoverageReport(rows: CoverageRow[]): string {
  const fieldWidth = Math.max(5, ...rows.map((r) => r.field.length));
  const classWidth = Math.max(5, ...rows.map((r) => r.class.length));
  const cells = rows.map((r) => {
    const ratio = `${r.filled}/${r.total}`;
    const share =
      r.total === 0 ? "n/a" : `${((r.filled / r.total) * 100).toFixed(1)}%`;
    return { r, ratio, share };
  });
  const ratioWidth = Math.max(5, ...cells.map((c) => c.ratio.length));
  const lines = cells.map(
    ({ r, ratio, share }) =>
      `${r.class.padEnd(classWidth)}  ${r.field.padEnd(fieldWidth)}  ${ratio.padStart(ratioWidth)}  ${share.padStart(6)}`
  );
  return [
    `${"class".padEnd(classWidth)}  ${"field".padEnd(fieldWidth)}  ${"filled".padStart(ratioWidth)}  ${"share".padStart(6)}`,
    ...lines,
    "",
    "shortLine is read from names[].shortLine in noms/PPL_*.json; a people counts once if any of its names carries one.",
  ].join("\n");
}

export function renderCoverageReport(rows: CoverageRow[], json: boolean) {
  return json ? JSON.stringify(rows, null, 2) : formatCoverageReport(rows);
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--json");
  if (unknown.length > 0) {
    console.error(
      `report:search-answer-coverage — unknown argument ${unknown[0]} (usage: [--json])`
    );
    process.exitCode = 2;
    return;
  }
  const repoRoot = process.cwd();
  const datasetRoot = path.join(repoRoot, "dataset/source/afrik");
  const productionsRoot = path.join(repoRoot, "docs/productions/mot");
  if (!existsSync(datasetRoot)) {
    console.error(
      `report:search-answer-coverage — ${datasetRoot} not found; run from the repository root`
    );
  }
  console.log(
    renderCoverageReport(
      measureSearchAnswerCoverage(datasetRoot, productionsRoot),
      args.includes("--json")
    )
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
