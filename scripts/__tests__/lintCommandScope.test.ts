import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8")
) as { scripts: Record<string, string> };

describe("lint command scope", () => {
  // @req REQ-085
  it("uses a dedicated cache file for the owned source directories", () => {
    expect(packageJson.scripts.lint).toBe(
      "eslint --cache --cache-strategy content --cache-location node_modules/.cache/eslint-src-scripts src scripts"
    );
  });
});
