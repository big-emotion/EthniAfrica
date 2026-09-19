import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const storybookConfig = readFileSync(
  resolve(process.cwd(), ".storybook/main.ts"),
  "utf8"
);

describe("Storybook static assets", () => {
  // @req REQ-091
  it("gives Storybook sole ownership of the public directory copy", () => {
    expect(storybookConfig).toContain('staticDirs: ["../public"]');
    expect(storybookConfig).toContain("config.publicDir = false");
  });
});
