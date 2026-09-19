import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const source = readFileSync(
  resolve(
    process.cwd(),
    "src/components/relations/RelationsListWithSourceSheet.tsx"
  ),
  "utf8"
);

describe("relations client payload", () => {
  // @req REQ-097 FR75 NFR1
  test("loads the source sheet only when a sourced relation is opened", () => {
    expect(source).not.toMatch(
      /import\s+SourceChainSheet\s+from\s+["']@\/components\/source-transparency\/SourceChainSheet["']/
    );
    expect(source).toContain(
      'import("@/components/source-transparency/SourceChainSheet")'
    );
    expect(source).toContain("activeItem && (");
  });
});
