import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const skillPath = resolve(
  import.meta.dirname,
  "../../.claude/skills/ethniafrica-infra/SKILL.md"
);

// The repository is public, and this skill is the file most tempted to name a
// host. It may describe the architecture; it may not carry anything that
// addresses or locates a machine. The patterns are shapes, never the real
// values: a deny-list of the actual addresses would publish them here instead.
const IDENTIFIER_SHAPES: Array<[string, RegExp]> = [
  ["an IPv4 address", /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ["an IPv6 address", /\b(?:[0-9a-f]{1,4}:){4,7}[0-9a-f]{1,4}\b/i],
  // Well-known ports (443, 5432, 8000…) are architecture; a five-digit port is
  // a host's own choice and a reconnaissance detail.
  ["a non-standard port number", /\b(?:[1-5]\d{4}|6[0-5]\d{3})\b/],
  ["a provider-assigned server name", /\bvps-[0-9a-f]{6,}\b/i],
  ["a link", /\bhttps?:\/\//i],
  ["an e-mail address", /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i],
];

function readSkill(): string {
  return readFileSync(skillPath, "utf8");
}

describe("ethniafrica-infra skill disclosure", () => {
  // @req REQ-032
  it("declares the name of its own directory", () => {
    expect(readSkill()).toMatch(/^---\nname: ethniafrica-infra\n/);
  });

  // @req REQ-032
  it.each(IDENTIFIER_SHAPES)("carries no %s", (_label, shape) => {
    const offendingLines = readSkill()
      .split("\n")
      .filter((line) => shape.test(line));
    expect(offendingLines).toEqual([]);
  });

  // @req REQ-032
  it("states the disclosure rule before any architecture", () => {
    const sections = readSkill()
      .split("\n")
      .filter((line) => line.startsWith("## "));
    expect(sections[0]).toMatch(/disclosure/i);
  });
});
