import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `check:action-pins` reads `uses:` lines only. Two other inputs choose the
 * code a workflow runs and slipped past it: the Supabase CLI version handed to
 * `setup-cli` (the binary that applies production DDL) and the `ref:` Ferry's
 * source is checked out at. Both floated — `latest` and a movable tag.
 */

const WORKFLOW_DIR = resolve(process.cwd(), ".github/workflows");

const lines = readdirSync(WORKFLOW_DIR)
  .filter((file) => /\.ya?ml$/.test(file))
  .flatMap((file) =>
    readFileSync(join(WORKFLOW_DIR, file), "utf8")
      .split("\n")
      .map((text, index) => ({ where: `${file}:${index + 1}`, text }))
  );

describe("workflow inputs that choose the code a job runs", () => {
  // @req REQ-085
  it("never installs the Supabase CLI at `latest`", () => {
    const floating = lines
      .filter(({ text }) =>
        /^\s*version:\s*["']?latest["']?\s*(#.*)?$/.test(text)
      )
      .map(({ where }) => where);
    expect(floating).toEqual([]);
  });

  // @req REQ-085
  it("checks Ferry out at a commit SHA, not a movable tag", () => {
    const refs = lines.flatMap(({ where, text }) => {
      const match = text.match(/^\s*FERRY_REF:\s*(\S+)/);
      return match ? [{ where, ref: match[1] }] : [];
    });
    expect(refs.length).toBeGreaterThan(0);
    const movable = refs.filter(({ ref }) => !/^[0-9a-f]{40}$/.test(ref));
    expect(movable).toEqual([]);
  });
});
