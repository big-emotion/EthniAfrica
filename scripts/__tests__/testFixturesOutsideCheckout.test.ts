import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Several tests walk src/, scripts/__tests__/ and the corpus to prove no live
// reference to a retired id is left. Vitest runs files in parallel, so a
// fixture folder another test creates and deletes inside those trees vanishes
// mid-walk and fails the walker with ENOENT. Fixtures belong in the OS temp
// directory, never beside the test file.

const ROOT = process.cwd();
const TEST_ROOTS = ["src", "scripts"];
const TEST_FILE = /\.test\.tsx?$/;
const FIXTURE_BESIDE_TEST = /join\(\s*__dirname,\s*`tmp_/;

function testFilesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    if (entry === "node_modules") return [];
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return testFilesUnder(path);
    return TEST_FILE.test(entry) ? [path] : [];
  });
}

describe("test fixtures", () => {
  // @req REQ-178
  it("are never created inside the checkout, where parallel walkers read", () => {
    const offenders = TEST_ROOTS.flatMap((root) =>
      testFilesUnder(resolve(ROOT, root))
    )
      .filter((file) => FIXTURE_BESIDE_TEST.test(readFileSync(file, "utf8")))
      .map((file) => relative(ROOT, file));

    expect(offenders).toEqual([]);
  });
});
