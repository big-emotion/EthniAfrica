#!/usr/bin/env npx tsx

/**
 * Points the Codex entry point at the canonical skill.
 *
 * `.agents/` is gitignored as a runtime mirror, so a clone never carries it and
 * this has to be run once per checkout — the same class of local git state as
 * `git remote set-head origin recette`. Idempotent, and it refuses to delete a
 * real directory standing where the link belongs.
 *
 * `--reconcile` lets it replace such a directory, but only a stale copy: every
 * file must equal the canonical file today or a version the canonical skill
 * once had in git history. A directory holding anything else is listed file by
 * file and left untouched. Without the flag, behaviour is unchanged.
 */

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import {
  CANONICAL_SKILLS_DIR,
  MIRROR_SKILLS_DIR,
  linkMirrorSkill,
  listCanonicalSkills,
  reconcileMirrorSkill,
} from "./lib/skillParity";

function git(projectRoot: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    // `git show <sha>:<path>` fails for a commit that deleted the file.
    return null;
  }
}

/** True when `contents` is a version this canonical file has ever had. */
function knownVersionOf(
  projectRoot: string,
  skill: string
): (path: string, contents: string) => boolean {
  return (path, contents) => {
    const repoPath = `${CANONICAL_SKILLS_DIR}/${skill}/${path}`;
    const commits =
      git(projectRoot, ["log", "--all", "--format=%H", "--", repoPath]) ?? "";
    return commits
      .split("\n")
      .filter(Boolean)
      .some(
        (sha) => git(projectRoot, ["show", `${sha}:${repoPath}`]) === contents
      );
  };
}

function main(): void {
  const projectRoot = resolve(import.meta.dirname, "..");
  const flags = process.argv.slice(2).filter((arg) => arg.startsWith("-"));
  const reconcile = flags.includes("--reconcile");
  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const skills =
    requested.length > 0 ? requested : listCanonicalSkills(projectRoot);

  let blocked = 0;
  for (const skill of skills) {
    const result = reconcile
      ? reconcileMirrorSkill(
          projectRoot,
          skill,
          knownVersionOf(projectRoot, skill)
        )
      : linkMirrorSkill(projectRoot, skill);
    if (result.action === "blocked") {
      blocked += 1;
      console.error(`✗ ${skill}: ${result.detail}`);
      continue;
    }
    const verb =
      result.action === "already-linked"
        ? "already points"
        : result.action === "reconciled"
          ? "stale copy replaced, now points"
          : "now points";
    console.log(
      `✓ ${skill}: ${MIRROR_SKILLS_DIR}/${skill} ${verb} at ${CANONICAL_SKILLS_DIR}/${skill}`
    );
  }

  process.exit(blocked > 0 ? 1 : 0);
}

main();
