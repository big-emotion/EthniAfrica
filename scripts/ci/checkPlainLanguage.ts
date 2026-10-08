import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";

import {
  classifyFindings,
  extractCopy,
  lintCopy,
  readCopy,
  type CopyUnit,
} from "../lib/plainLanguage";

const ROOT = resolve(import.meta.dirname, "../..");

function eligible(file: string): boolean {
  if (
    /(?:^|\/)(?:__tests__|__fixtures__|archive|test|stories|_[^/]+)(?:\/|$)|\.(?:test|spec|stories)\.|\.d\.ts$/.test(
      file
    )
  )
    return false;
  if (file.startsWith("src/")) return /(?:\.[cm]?[jt]sx?|\.json)$/.test(file);
  if (file.startsWith("dataset/source/afrik/"))
    return /\.(json|csv)$/.test(file);
  if (file.startsWith("docs/productions/"))
    return (
      !/\/README\.md$/.test(file) && /\.(json|md|txt|srt|vtt|html)$/.test(file)
    );
  return false;
}

/** Includes new local content as well as versioned content; git errors are failures. */
// @req REQ-178
export function editorialPaths(root = ROOT): string[] {
  return [
    ...new Set(
      execFileSync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
      )
        .split("\0")
        .filter((file) => eligible(file) && existsSync(resolve(root, file)))
    ),
  ].sort();
}

// @req REQ-178
export function readStagedCopy(root = ROOT): CopyUnit[] {
  const files = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    { cwd: root, encoding: "utf8" }
  )
    .split("\0")
    .filter(eligible);
  return files.flatMap((file) =>
    extractCopy(
      file,
      execFileSync("git", ["show", `:${file}`], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      })
    )
  );
}

function baseline(root: string): string[] {
  const saved = JSON.parse(
    readFileSync(resolve(root, ".vale/baseline.json"), "utf8")
  );
  if (
    saved.version !== 1 ||
    !Array.isArray(saved.errors) ||
    saved.errors.some(
      (key: unknown) => typeof key !== "string" || !/^[a-f0-9]{64}$/.test(key)
    )
  )
    throw new Error("Invalid plain-language baseline.");
  return saved.errors;
}

// @req REQ-178
export function checkEditorialFiles(
  files: string[],
  options: { root?: string; strict?: boolean } = {}
) {
  if (files.length === 0)
    throw new Error("No editorial files supplied; no approval was produced.");
  const root = options.root ?? ROOT;
  const units = files.flatMap((file) => {
    const copy = readCopy(file, root);
    if (options.strict && !copy.length)
      throw new Error(
        `No readable editorial text in ${file}; no approval was produced.`
      );
    return copy;
  });
  if (units.length === 0)
    throw new Error(
      "No readable editorial text found; no approval was produced."
    );
  return {
    ...classifyFindings(lintCopy(units), options.strict ? [] : baseline(root)),
    files: files.length,
    units: units.length,
  };
}

/** Runs before the canonical import creates a database client or writes any rows. */
// @req REQ-178
export function assertCorpusLanguage(): void {
  const files = editorialPaths().filter((file) =>
    file.startsWith("dataset/source/afrik/")
  );
  const report = checkEditorialFiles(files);
  if (report.errors.length)
    throw new Error(
      `Plain-language check refused the import (${report.errors.length} new errors). Run npm run check:editorial.`
    );
}

function main(): void {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const audit = args.includes("--audit");
  const staged = args.includes("--staged");
  const edited = args.includes("--edited");
  const files = args
    .filter((arg) => !arg.startsWith("--"))
    .map((file) => relative(ROOT, resolve(file)).replaceAll("\\", "/"));
  const unknown = args.find(
    (arg) =>
      arg.startsWith("--") &&
      !["--strict", "--audit", "--staged", "--edited"].includes(arg)
  );
  if (unknown) throw new Error(`Unknown option: ${unknown}`);
  if (strict && audit)
    throw new Error("--strict and --audit cannot be combined.");
  if (edited) {
    if (files.length !== 1 || staged || strict || audit)
      throw new Error(
        "--edited requires exactly one file and no other option."
      );
    if (!eligible(files[0])) return;
  }
  if (strict && !files.length)
    throw new Error(
      "No final text files supplied. Use npm run check:publication -- <files>."
    );
  if (staged && (strict || audit || files.length))
    throw new Error("--staged must be used alone.");
  const report = staged
    ? {
        ...classifyFindings(lintCopy(readStagedCopy()), baseline(ROOT)),
        files: "staged",
        units: "staged",
      }
    : checkEditorialFiles(files.length ? files : editorialPaths(), {
        strict: strict || audit,
      });
  for (const finding of [...report.errors, ...report.warnings].slice(0, 30)) {
    console.log(
      `${finding.unit.file}:${finding.unit.location}: ${finding.severity} ${finding.rule}: ${finding.message}`
    );
  }
  console.log(
    `Plain language: ${report.files} files; ${report.units} text units; ${report.errors.length} errors; ${report.warnings.length} review warnings; ${report.legacy.length} unchanged legacy errors.`
  );
  console.log(
    "Mechanical checks only. Review meaning, attribution and final presentation before publication."
  );
  if (!audit && report.errors.length) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
