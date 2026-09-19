import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const FEED_ROOT = join(__dirname, "..");

function productionSources(): Array<{ file: string; source: string }> {
  return readdirSync(FEED_ROOT)
    .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
    .map((file) => ({
      file,
      source: readFileSync(join(FEED_ROOT, file), "utf8"),
    }));
}

describe("search feed responsive contract", () => {
  // @req REQ-180
  it("keeps one mobile-first column until the explicit 1200 px composition", () => {
    for (const { file, source } of productionSources()) {
      const forbidden = source.match(
        /\b(?:sm|md|lg|xl|2xl):|min-\[(?!1200px\])[^\]]+\]:/g
      );
      expect(forbidden, file).toBeNull();
    }
  });

  // @req REQ-180
  it("uses semantic colour and type tokens instead of literal design values", () => {
    for (const { file, source } of productionSources()) {
      expect(source, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(source, file).not.toMatch(/\btext-\[(?:\d|\.)+(?:px|rem)\]/);
      expect(source, file).not.toMatch(/\brounded-\[(?:\d|\.)+(?:px|rem)\]/);
    }
  });
});
