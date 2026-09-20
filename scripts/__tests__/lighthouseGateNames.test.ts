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
 * Branch protection on `recette` matches a required check by its name. The gate
 * used to be named after the number of routes it visits, and that number
 * moved: renaming the job alone left the old name never reported and blocked
 * every pull request with all checks green. It was renamed in three steps, a
 * temporary alias job carrying the old name while protection was switched.
 *
 * This holds the end state. The name has no route count, so the next route
 * added is not a rename, and the retired name is not reported by anything: a
 * job that reported it again would be an alias nobody requires any more.
 */
describe("the Lighthouse gate's check name", () => {
  // @req REQ-085
  it("names the gate without the number of routes it visits", () => {
    expect(job("gate")).toMatch(/\n {4}name: Lighthouse gate\n/);
  });

  // @req REQ-085
  it("reports no check under the retired, route-counting name", () => {
    expect(workflow).not.toMatch(/name: Lighthouse gate \(\d+ routes\)/);
  });
});
