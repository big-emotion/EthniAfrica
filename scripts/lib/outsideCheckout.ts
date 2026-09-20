import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * Where the audience tooling may write, and where it may not.
 *
 * Comments name people, and this repository is public, so an output directory
 * inside any git checkout is refused rather than trusted to be gitignored — the
 * same guard the render engine applies to its own output. `.git` is checked for
 * existence, not for being a directory, because a worktree's `.git` is a file.
 */
export function resolveOutputDir(dir: string | undefined): string {
  if (!dir) {
    throw new Error(
      "An output directory is required: pass --out <dir>, outside any git checkout."
    );
  }
  const target = resolve(dir);

  for (let current = target; ; current = dirname(current)) {
    if (existsSync(join(current, ".git"))) {
      throw new Error(
        `Refusing to write into ${target}: it is inside a git checkout (${current}). Comments name people; keep them out of the repository.`
      );
    }
    if (dirname(current) === current) break;
  }

  mkdirSync(target, { recursive: true, mode: 0o700 });
  return target;
}
