import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/ci.yml"),
  "utf8"
);

describe("dependency audit workflow", () => {
  // @req REQ-091
  it("audits the lockfile through npm's supported bulk advisory endpoint", () => {
    expect(workflow).toContain(
      "npm audit --package-lock-only --audit-level=high"
    );
    expect(workflow).toContain("for attempt in 1 2 3");
    expect(workflow).not.toContain("run: npm audit --audit-level=high");
  });
});
