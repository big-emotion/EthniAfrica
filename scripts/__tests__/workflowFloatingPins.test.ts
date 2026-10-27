import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `check:action-pins` reads `uses:` lines only. The Supabase CLI version handed
 * to `setup-cli` (the binary that applies production DDL) chooses the code a
 * workflow runs and slipped past it: it floated at `latest`.
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
});
