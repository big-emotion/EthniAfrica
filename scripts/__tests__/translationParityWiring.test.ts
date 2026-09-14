import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const packageJson = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8")
) as { scripts: Record<string, string> };
const workflow = readFileSync(
  resolve(root, ".github/workflows/ci.yml"),
  "utf8"
);
const lintStaged = readFileSync(
  resolve(root, "lint-staged.config.mjs"),
  "utf8"
);
const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8");
const claude = readFileSync(resolve(root, "CLAUDE.md"), "utf8");
const translatorSkill = readFileSync(
  resolve(root, ".claude/skills/afrik-translator/SKILL.md"),
  "utf8"
);

describe("translation parity gate wiring (REQ-145)", () => {
  // @req REQ-145
  it("publishes one package command for local and CI use", () => {
    expect(packageJson.scripts["check:translation-parity"]).toBe(
      "tsx scripts/ci/checkTranslationParity.ts"
    );
  });

  // @req REQ-171
  it("reports the pull request diff in CI without being able to fail the build job", () => {
    const command =
      'npm run check:translation-parity -- --base "origin/$REQ_BASE"';
    expect(workflow).toContain(command);

    const stepStart = workflow.indexOf(command);
    const nextStep = workflow.indexOf("\n      - ", stepStart);
    const step = workflow.slice(stepStart, nextStep);
    expect(step).toMatch(/^\s+continue-on-error: true$/m);
  });

  // REQ-171 relaxes missing, deferred and drifted counterparts only; the
  // glossary is not part of that decision, so it keeps its own blocking step
  // rather than inheriting the parity report's continue-on-error.
  // @req REQ-144
  it("blocks CI on glossary divergences in a step of its own", () => {
    const command = "- run: npm run check:glossary";
    expect(workflow).toContain(command);

    const stepStart = workflow.indexOf(command);
    const nextStep = workflow.indexOf("\n      - ", stepStart + 1);
    const step = workflow.slice(stepStart, nextStep);
    expect(step).not.toContain("continue-on-error");
  });

  // @req REQ-171
  it("never runs the parity check at commit", () => {
    expect(lintStaged).not.toContain("checkTranslationParity");
  });

  // @req REQ-171
  it("documents parity as reported, never blocking", () => {
    for (const instructions of [agents, claude]) {
      expect(instructions).toContain("DEC-055");
      expect(instructions).not.toMatch(/translation-parity[^\n]*blocks/);
    }
    expect(claude).not.toContain(
      "### Bilingual content (`npm run check:translation-parity`, CI-blocking)"
    );
  });

  // @req REQ-145
  it("documents the live gate and French-safe rollout instead of a pending English default", () => {
    for (const instructions of [agents, claude]) {
      expect(instructions).toContain("SITE_LOCALE_MODE");
      expect(instructions).toContain("fr-only");
      expect(instructions).toContain("_translation.deferred.en");
      expect(instructions).not.toContain("Both enforcing surfaces are pending");
      expect(instructions).not.toContain(
        "both land with ETNI-1829 / ETNI-1831"
      );
    }
  });

  // @req REQ-145
  it("keeps the translator skill aligned with full-record sidecars", () => {
    expect(translatorSkill).toContain("full record");
    expect(translatorSkill).not.toContain("**partial overlay**");
  });

  // @req REQ-145
  it("provides the runbook named by the translation command", () => {
    const runbook = readFileSync(
      resolve(root, "docs/runbooks/corpus-translation.md"),
      "utf8"
    );
    expect(runbook).toContain("npm run check:translation-parity");
    expect(runbook).toContain("--staged");
    expect(runbook).toContain("--all");
    expect(runbook).toContain("_translation.deferred.en");
  });
});
