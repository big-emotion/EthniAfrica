import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = path.join(process.cwd(), "src");
const CODE_FILE = /\.(?:ts|tsx)$/;
const TEST_ONLY =
  /(?:^|\/)(?:__tests__|__fixtures__|test)(?:\/|$)|\.(?:test|stories)\.(?:ts|tsx)$/;
const FIXTURE_REFERENCE = /["'][^"'\r\n]*\/__fixtures__\/[^"'\r\n]*["']/;

function containsFixtureReference(source: string): boolean {
  return FIXTURE_REFERENCE.test(source);
}

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return CODE_FILE.test(entry.name) ? [file] : [];
  });
}

describe("search-feed fixture isolation", () => {
  // @req REQ-180
  it("keeps __fixtures__ imports out of production source files", () => {
    const productionFiles = sourceFiles(SOURCE_ROOT).filter(
      (file) => !TEST_ONLY.test(path.relative(SOURCE_ROOT, file))
    );
    const offenders = productionFiles.filter((file) =>
      containsFixtureReference(fs.readFileSync(file, "utf8"))
    );

    expect(productionFiles.length).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  // @req REQ-180
  it("recognizes every supported module-loading syntax", () => {
    expect(
      [
        'import data from "@/lib/search/__fixtures__/feedCases";',
        'import "@/lib/search/__fixtures__/feedCases";',
        'export { data } from "@/lib/search/__fixtures__/feedCases";',
        'const data = import("@/lib/search/__fixtures__/feedCases");',
        'const data = require("@/lib/search/__fixtures__/feedCases");',
      ].every(containsFixtureReference)
    ).toBe(true);
  });
});
