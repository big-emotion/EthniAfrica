import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The 2026-09-14 audit found the operator documents describing a system the
// code had left behind: a same-origin API exemption removed in v4.9.0, Node 20
// after the move to 22, a first-admin script that grants a role nothing gates.
// Each claim below is read from the code or the filesystem rather than
// restated, so the prose fails here the day it drifts again.
const REPO_ROOT = path.resolve(__dirname, "../..");

const read = (relativePath: string): string =>
  fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

const OPERATOR_DOCS = ["CLAUDE.md", "README.md", "docs/DEPLOYMENT.md"] as const;

const servedApiResources = (): string[] =>
  fs
    .readdirSync(path.join(REPO_ROOT, "src/app/api/v2"), {
      withFileTypes: true,
    })
    .filter((entry) => entry.isDirectory() && entry.name !== "__tests__")
    .map((entry) => entry.name);

const engineNodeMajor = (): string =>
  JSON.parse(read("package.json")).engines.node.match(/\d+/)[0];

describe("operator documents describe the code as it runs", () => {
  describe.each(OPERATOR_DOCS)("%s", (relativePath) => {
    // Access is no longer decided by Origin or Referer (src/middleware.ts).
    // @req REQ-059
    it("does not claim same-origin API requests are exempt from key validation", () => {
      expect(read(relativePath)).not.toMatch(
        /same-origin requests are exempt|exempts same-origin/i
      );
    });

    // @req REQ-042
    it("names the allowlist script as the way to the moderation console", () => {
      expect(read(relativePath)).toContain("seedAdminAllowlist.ts");
    });
  });

  describe.each(["README.md", "docs/DEPLOYMENT.md"])("%s", (relativePath) => {
    // @req REQ-059
    it("quotes the Node major that package.json engines pins", () => {
      const quoted = [
        ...read(relativePath).matchAll(/Node\W{0,3}(\d+)\.x/g),
      ].map((match) => match[1]);

      expect(quoted.length).toBeGreaterThan(0);
      expect(new Set(quoted)).toEqual(new Set([engineNodeMajor()]));
    });
  });

  // @req REQ-059
  it("README lists every resource served under /api/v2", () => {
    const resourceSentence = read("README.md").match(
      /Resources under `\/api\/v2\/`:([^]*?)\n\n/
    );

    expect(resourceSentence).not.toBeNull();
    for (const resource of servedApiResources()) {
      expect(resourceSentence[1]).toContain(`\`${resource}\``);
    }
  });

  // A bare run surveys the whole tree; CI reports the pull request's diff
  // through --base. Neither blocks (REQ-171, DEC-055), so the flag is what
  // tells an operator which of the two reports a CI annotation came from.
  // @req REQ-171
  it("AGENTS.md names the diff-scoped parity report CI prints", () => {
    expect(read("AGENTS.md")).toContain("check:translation-parity -- --base");
  });

  // @req REQ-059
  it("the audit skill does not require an API contract file that does not exist", () => {
    const skill = read(".claude/skills/ethniafrica-audit/SKILL.md");

    expect(fs.existsSync(path.join(REPO_ROOT, "docs/api-contracts.md"))).toBe(
      false
    );
    expect(skill).not.toContain("docs/api-contracts.md");
  });
});
