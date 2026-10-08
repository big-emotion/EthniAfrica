import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { load } from "js-yaml";

type Job = { needs?: string | string[]; if?: string };
type Workflow = {
  on?: { pull_request: { types?: string[] } };
  // YAML 1.1 reads the bare key `on` as the boolean true.
  true?: { pull_request: { types?: string[] } };
  jobs: Record<string, Job>;
};

const workflow = load(
  readFileSync(
    path.resolve(__dirname, "../../../.github/workflows/ci.yml"),
    "utf8"
  )
) as Workflow;

// Two jobs are their own required-or-informational checks on purpose; every
// other job reaches the merge gate only through `build`.
const STANDALONE = new Set(["gitleaks", "dependency-audit", "build"]);

const asList = (needs: Job["needs"]) =>
  needs === undefined ? [] : Array.isArray(needs) ? needs : [needs];

describe("CI / build, the one required check", () => {
  // @req REQ-054
  it("waits for every job it does not leave standalone, so none can fail without blocking the merge", () => {
    const verdictNeeds = asList(workflow.jobs.build.needs);
    const unwatched = Object.keys(workflow.jobs).filter(
      (name) => !STANDALONE.has(name) && !verdictNeeds.includes(name)
    );

    expect(unwatched).toEqual([]);
  });

  // @req REQ-054
  it("does not skip when a job it waits for failed", () => {
    expect(workflow.jobs.build.if).toMatch(/^always\(\)/);
  });
});

describe("CI on a draft pull request", () => {
  // @req REQ-054
  it("runs when the pull request is marked ready, not only when it is pushed to", () => {
    expect((workflow.on ?? workflow.true)?.pull_request.types).toEqual(
      expect.arrayContaining(["synchronize", "ready_for_review"])
    );
  });

  // @req REQ-054
  it("is skipped at every entry point: the jobs with no needs, and the verdict", () => {
    const entryPoints = Object.entries(workflow.jobs).filter(
      ([name, job]) => name === "build" || asList(job.needs).length === 0
    );

    expect(entryPoints.length).toBeGreaterThan(1);
    for (const [name, job] of entryPoints) {
      expect(job.if, name).toContain(
        "github.event.pull_request.draft == false"
      );
    }
  });
});
