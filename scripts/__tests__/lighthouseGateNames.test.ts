import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(import.meta.dirname, "../../.github/workflows/lighthouse.yml"),
  "utf8"
);

// One job's own text, from its key up to the next top-level job key.
function job(key: string): string {
  const start = workflow.indexOf(`\n  ${key}:\n`);
  if (start === -1) throw new Error(`Job "${key}" not found in lighthouse.yml`);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

/**
 * Branch protection on `recette` matches a required check by its name. The
 * gate used to be named after the number of routes it visits, and that number
 * moved: renaming the job alone left the old name never reported and blocked
 * every pull request with all checks green.
 *
 * So the rename is done in three steps, and this holds the middle one: the job
 * has its permanent, count-free name, and a second job keeps reporting the old
 * name until protection requires the new one, then goes.
 */
describe("the Lighthouse gate's check names", () => {
  // @req REQ-085
  it("names the gate without the number of routes it visits", () => {
    expect(job("gate")).toMatch(/\n {4}name: Lighthouse gate\n/);
  });

  // @req REQ-085
  it("keeps reporting the old required name until branch protection is switched", () => {
    const alias = job("gate-legacy-name");

    expect(alias).toMatch(/\n {4}name: Lighthouse gate \(4 routes\)\n/);
    expect(alias).toMatch(/\n {4}needs: gate\n/);
  });

  // A skipped required check counts as passing. An alias that were skipped
  // when the gate fails would switch the gate off under its old name, so it
  // has to run whatever the gate did, and fail unless the gate succeeded.
  // @req REQ-085
  it("fails the old name whenever the gate did not succeed, and is never skipped", () => {
    const alias = job("gate-legacy-name");

    expect(alias).toMatch(/\n {4}if: always\(\)/);
    expect(alias).toContain("${{ needs.gate.result }}");
    expect(alias).toContain('[ "$GATE_RESULT" = "success" ]');
    expect(alias).not.toContain("continue-on-error");
  });
});
