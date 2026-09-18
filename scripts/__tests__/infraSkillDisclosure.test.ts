import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SHAPE_GUARDED_PATHS,
  findIdentifierShapes,
} from "../lib/infraDisclosure";

// What the skill may not carry is defined once, in scripts/lib/infraDisclosure.ts,
// and enforced by `npm run check:infra-disclosure` on every tracked file. This
// suite holds the two things the gate cannot know: that the file is the skill it
// claims to be, and that its disclosure rule comes before the architecture it
// describes.
const skillPath = resolve(
  import.meta.dirname,
  "../../.claude/skills/ethniafrica-infra/SKILL.md"
);

function readSkill(): string {
  return readFileSync(skillPath, "utf8");
}

describe("ethniafrica-infra skill", () => {
  // @req REQ-032
  it("declares the name of its own directory", () => {
    expect(readSkill()).toMatch(/^---\nname: ethniafrica-infra\n/);
  });

  // @req REQ-032
  it("states the disclosure rule before any architecture", () => {
    const sections = readSkill()
      .split("\n")
      .filter((line) => line.startsWith("## "));
    expect(sections[0]).toMatch(/disclosure/i);
  });

  // @req REQ-032
  it("carries nothing that addresses or locates a machine", () => {
    expect(findIdentifierShapes(readSkill())).toEqual([]);
  });

  // @req REQ-032
  it("is covered by the gate that enforces that rule", () => {
    expect(SHAPE_GUARDED_PATHS).toContain(
      ".claude/skills/ethniafrica-infra/SKILL.md"
    );
  });
});
