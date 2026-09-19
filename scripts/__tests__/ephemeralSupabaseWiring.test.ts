import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../..");

function readWorkflow(name: string): string {
  return readFileSync(resolve(ROOT, ".github/workflows", name), "utf8");
}

// Isolates one job's own text from a multi-job workflow file, from its
// `name:` line up to (but excluding) the next top-level job's `name:` line
// or end of file — so a sibling job's own, legitimate secret references
// (the full e2e matrix, the nightly Lighthouse Mobile Audit) never fail
// these assertions.
function jobSection(workflow: string, jobNameLine: string): string {
  const start = workflow.indexOf(jobNameLine);
  if (start === -1) {
    throw new Error(`Job "${jobNameLine}" not found in workflow`);
  }
  const rest = workflow.slice(start + jobNameLine.length);
  const nextJobMatch = rest.match(/\n {2}[a-z][\w-]*:\n/);
  const end = nextJobMatch
    ? start + jobNameLine.length + (nextJobMatch.index ?? rest.length)
    : workflow.length;
  return workflow.slice(start, end);
}

// The retired hosted-project secret names and the pre-ETNI-1948 self-hosted
// recette secrets, both now replaced by the ephemeral-supabase action inside
// these three specific jobs.
const RETIRED_SECRET_REFS = [
  "secrets.NEXT_PUBLIC_SUPABASE_URL",
  "secrets.SUPABASE_SERVICE_ROLE_KEY",
  "secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "secrets.RECETTE_SUPABASE_URL",
  "secrets.RECETTE_SUPABASE_ANON_KEY",
  "secrets.RECETTE_SUPABASE_SERVICE_ROLE_KEY",
];

const GATED_JOBS = [
  { file: "a11y.yml", nameLine: "name: axe-core (Storybook)" },
  { file: "lighthouse.yml", nameLine: "name: Lighthouse gate (4 routes)" },
  { file: "e2e.yml", nameLine: "name: Playwright smoke (fr, 430px)" },
] as const;

describe("the three database-reading PR gates use the ephemeral database", () => {
  for (const { file, nameLine } of GATED_JOBS) {
    const section = jobSection(readWorkflow(file), nameLine);

    // @req REQ-176
    it(`${file}'s ${nameLine} uses the ephemeral-supabase action`, () => {
      expect(section).toContain("uses: ./.github/actions/ephemeral-supabase");
    });

    // @req REQ-176
    it(`${file}'s ${nameLine} references no hosted or retired secret`, () => {
      for (const ref of RETIRED_SECRET_REFS) {
        expect(section).not.toContain(ref);
      }
    });
  }

  // @req REQ-176
  it("e2e.yml's full matrix job keeps its own TEST_SUPABASE_*/RECETTE_SUPABASE_* fallback untouched", () => {
    const section = jobSection(
      readWorkflow("e2e.yml"),
      "name: Playwright (${{ matrix.locale }})"
    );
    expect(section).toContain("secrets.TEST_SUPABASE_URL");
    expect(section).toContain("secrets.RECETTE_SUPABASE_URL");
  });
});
