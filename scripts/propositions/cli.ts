#!/usr/bin/env tsx
/**
 * Entry points for the daily proposals routine.
 *
 *   npm run propositions:list-ripe -- --limit 3   JSON of ripe issues
 *   npm run propositions:guard                    fails unless the branch only touches AFRIK fiches
 *   npm run propositions:finalize -- <slug>       validate, push, open the PR, tell the issue
 *
 * The repository comes from GITHUB_PROPOSALS_REPO ("owner/name").
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { finalizeProposal } from "./finalize";
import { ghCliPort } from "./ghCliPort";
import { guardRawDiff } from "./guard";
import { listRipe } from "./listRipe";
import { runCommand } from "./ports";
import { DEFAULT_RIPE_LIMIT } from "./ripeness";

const BASE_BRANCH = "recette";

function proposalsRepo(): string {
  const repo = process.env.GITHUB_PROPOSALS_REPO ?? "";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error('GITHUB_PROPOSALS_REPO must be set to "owner/name"');
  }
  return repo;
}

function parseLimit(argv: string[]): number {
  const index = argv.indexOf("--limit");
  if (index === -1) return DEFAULT_RIPE_LIMIT;
  const limit = Number(argv[index + 1]);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("--limit expects a positive integer");
  }
  return limit;
}

function main(argv: string[]): number {
  const [command, ...rest] = argv;

  if (command === "list-ripe") {
    const github = ghCliPort(runCommand, proposalsRepo());
    console.log(
      JSON.stringify(listRipe(github, { limit: parseLimit(rest) }), null, 2)
    );
    return 0;
  }

  if (command === "guard") {
    const diff = runCommand("git", [
      "diff",
      "--raw",
      "--no-renames",
      `origin/${BASE_BRANCH}...HEAD`,
    ]);
    if (diff.status !== 0) {
      console.error(`git diff failed: ${diff.stderr.trim()}`);
      return 1;
    }
    const result = guardRawDiff(diff.stdout);
    result.errors.forEach((error) => console.error(error));
    return result.ok ? 0 : 1;
  }

  if (command === "finalize") {
    const slug = rest[0] ?? "";
    const repo = proposalsRepo();
    const outcome = finalizeProposal(slug, {
      github: ghCliPort(runCommand, repo),
      run: runCommand,
      readFile: (path) => readFileSync(path, "utf8"),
      proposalsRepo: repo,
      baseBranch: BASE_BRANCH,
    });
    if (outcome.ok) {
      console.log(outcome.prUrl);
      return 0;
    }
    console.error(outcome.reason);
    return 1;
  }

  console.error(
    "usage: cli.ts list-ripe [--limit N] | guard | finalize <slug>"
  );
  return 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
