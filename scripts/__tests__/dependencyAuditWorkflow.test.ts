import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/ci.yml"),
  "utf8"
);

describe("dependency audit workflow", () => {
  // @req REQ-091
  it("blocks newly introduced high-severity vulnerable dependencies", () => {
    expect(workflow).toContain(
      "actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294"
    );
    expect(workflow).toContain("fail-on-severity: high");
    expect(workflow).not.toContain("npm audit");
  });
});
