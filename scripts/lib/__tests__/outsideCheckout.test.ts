import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { resolveOutputDir } from "../outsideCheckout";

const created: string[] = [];

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "ethni-out-"));
  created.push(dir);
  return dir;
}

afterEach(() => {
  while (created.length)
    rmSync(created.pop()!, { recursive: true, force: true });
});

describe("resolveOutputDir", () => {
  // @req REQ-032
  it("creates a private directory outside any checkout and returns its absolute path", () => {
    const target = join(scratch(), "meta", "runs");

    const resolved = resolveOutputDir(target);

    expect(resolved).toBe(target);
    expect(statSync(resolved).isDirectory()).toBe(true);
    // Comments name people: the directory is for its owner alone.
    expect(statSync(resolved).mode & 0o077).toBe(0);
  });

  // @req REQ-032
  it("refuses a directory inside a git checkout, whether .git is a folder or a worktree file", () => {
    // A worktree's `.git` is a file, not a directory, so both shapes are checked.
    const folderRepo = scratch();
    mkdirSync(join(folderRepo, ".git"));
    const worktreeRepo = scratch();
    writeFileSync(join(worktreeRepo, ".git"), "gitdir: elsewhere\n");

    expect(() => resolveOutputDir(join(folderRepo, "out"))).toThrow(
      /inside a git checkout/
    );
    expect(() => resolveOutputDir(join(worktreeRepo, "deep", "out"))).toThrow(
      /inside a git checkout/
    );
  });

  // @req REQ-032
  it("refuses to guess when no directory is given", () => {
    expect(() => resolveOutputDir(undefined)).toThrow(/--out/);
    expect(() => resolveOutputDir("")).toThrow(/--out/);
  });
});
