import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const repository = resolve(import.meta.dirname, "../..");
const temporaryRoots: string[] = [];
const skills = [
  "afrik-curator",
  "ethniafrica-structure",
  "ethniafrica-produire",
  "ethniafrica-production",
];

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "production-agent-"));
  temporaryRoots.push(root);
  for (const path of [
    "scripts/setupAgentSkillLinks.ts",
    "scripts/ci/checkSkillParity.ts",
    "scripts/lib/skillParity.ts",
  ]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    copyFileSync(join(repository, path), join(root, path));
  }
  for (const name of skills) {
    const directory = join(root, ".claude/skills", name);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "SKILL.md"), `---\nname: ${name}\n---\n`);
  }
  return root;
}

function run(root: string, script: string, ...args: string[]) {
  return spawnSync(
    process.execPath,
    [
      join(repository, "node_modules/tsx/dist/cli.mjs"),
      join(root, script),
      ...args,
    ],
    { cwd: root, encoding: "utf8" }
  );
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("production agent provisioning", () => {
  // @req REQ-032
  it("provisions the orchestrator on a fresh checkout with the default command", () => {
    const root = fixture();
    const result = run(root, "scripts/setupAgentSkillLinks.ts");
    expect(result.status, result.stderr).toBe(0);
    expect(
      realpathSync(join(root, ".agents/skills/ethniafrica-production"))
    ).toBe(realpathSync(join(root, ".claude/skills/ethniafrica-production")));
    expect(run(root, "scripts/setupAgentSkillLinks.ts").status).toBe(0);
  });

  // @req REQ-032
  it("rejects a divergent orchestrator even when the existing skills match", () => {
    const root = fixture();
    const mirror = join(root, ".agents/skills/ethniafrica-production");
    mkdirSync(mirror, { recursive: true });
    writeFileSync(
      join(mirror, "SKILL.md"),
      "---\nname: ethniafrica-production\n---\nStale workflow\n"
    );
    const result = run(root, "scripts/ci/checkSkillParity.ts");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("ethniafrica-production: content-mismatch");
  });
});
