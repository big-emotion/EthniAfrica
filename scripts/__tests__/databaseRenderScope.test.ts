import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Which CI runs are allowed to read the recette database.
 *
 * The hosted project behind `recette` is on a free plan metered by egress, and
 * it was blocked for exceeding it. Three required checks build the app and
 * render pages against it on every pull request, and the CI build read it
 * through `sitemap.xml`. This suite holds the two cuts:
 *
 * - the CI build never receives the real Supabase secrets;
 * - the three rendering jobs skip their database half when a pull request
 *   touches only documentation — and fail closed, rendering whenever they
 *   cannot prove that.
 *
 * The scope step's shell is executed here with a stubbed `gh`, so the
 * fail-closed cases are measured on the script the runner will run, not
 * inferred from its text.
 */

const WORKFLOW_DIR = resolve(process.cwd(), ".github/workflows");

function readWorkflow(name: string): string {
  return readFileSync(join(WORKFLOW_DIR, name), "utf8");
}

/** One job's block: from `  <id>:` to the next job or the end of the file. */
function jobBlock(workflow: string, id: string): string {
  const jobs = readWorkflow(workflow).split(/^jobs:$/m)[1] ?? "";
  const start = jobs.search(new RegExp(`^  ${id}:$`, "m"));
  if (start === -1) return "";
  const rest = jobs.slice(start + 1);
  const next = rest.search(/^ {2}[a-z][a-z0-9-]*:$/m);
  return next === -1 ? jobs.slice(start) : jobs.slice(start, start + 1 + next);
}

/** The job's steps, each as its own block of text, in order. */
function stepsOf(job: string): string[] {
  const body = job.split(/^ {4}steps:$/m)[1] ?? "";
  return body
    .split(/^(?= {6}- )/m)
    .filter((step) => step.startsWith("      - "));
}

/** A step's `if:` expression, or "" when it has none. */
function conditionOf(step: string): string {
  return step.match(/^ {6}(?:- | {2})if: (.+)$/m)?.[1] ?? "";
}

/** The literal `run: |` script of a step, dedented. */
function runScriptOf(step: string): string {
  const lines = step.split("\n");
  const runAt = lines.findIndex((line) => /^\s*(?:- )?run: \|$/.test(line));
  if (runAt === -1) return "";
  const keyIndent = lines[runAt].search(/\S/);
  const body: string[] = [];
  for (const line of lines.slice(runAt + 1)) {
    if (line.trim() !== "" && line.search(/\S/) <= keyIndent) break;
    body.push(line);
  }
  const indent = Math.min(
    ...body.filter((line) => line.trim()).map((line) => line.search(/\S/))
  );
  return body.map((line) => line.slice(indent)).join("\n");
}

const RENDERING_JOBS = [
  { workflow: "a11y.yml", job: "axe" },
  { workflow: "lighthouse.yml", job: "gate" },
  { workflow: "e2e.yml", job: "smoke" },
];

const scratch = mkdtempSync(join(tmpdir(), "render-scope-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

interface ScopeRun {
  headRef?: string;
  changedFiles?: string[];
  apiFails?: boolean;
}

/** Runs the scope step's script and returns the `render` output it wrote. */
function runScope(
  script: string,
  {
    headRef = "perf/some-branch",
    changedFiles = [],
    apiFails = false,
  }: ScopeRun
): { render: string | undefined; stdout: string } {
  const bin = mkdtempSync(join(scratch, "bin-"));
  const gh = join(bin, "gh");
  const listing = join(bin, "changed_files");
  writeFileSync(listing, changedFiles.map((file) => `${file}\n`).join(""));
  writeFileSync(
    gh,
    apiFails
      ? '#!/usr/bin/env bash\necho "HTTP 502" >&2\nexit 1\n'
      : `#!/usr/bin/env bash\ncat '${listing}'\n`
  );
  chmodSync(gh, 0o755);
  const output = join(bin, "github_output");
  writeFileSync(output, "");

  // The runner's own flags for a bash step.
  const run = spawnSync("bash", ["-e", "-o", "pipefail", "-c", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      GITHUB_OUTPUT: output,
      GITHUB_REPOSITORY: "big-emotion/EthniAfrica",
      GH_TOKEN: "token",
      PR: "1234",
      HEAD_REF: headRef,
    },
  });
  expect(run.status, run.stderr).toBe(0);

  const render = readFileSync(output, "utf8").match(/^render=(.*)$/m)?.[1];
  return { render, stdout: run.stdout };
}

describe("CI build never reads the database", () => {
  // @req REQ-032
  it("builds with placeholder Supabase values, never the repository secrets", () => {
    const build = stepsOf(jobBlock("ci.yml", "build")).find((step) =>
      /run: npm run build$/m.test(step)
    );

    expect(build).toBeDefined();
    expect(build).not.toMatch(/secrets\./);
    expect(build).toMatch(
      /NEXT_PUBLIC_SUPABASE_URL: "https:\/\/placeholder\.supabase\.co"/
    );
  });
});

describe.each(RENDERING_JOBS)(
  "$workflow › $job skips the database for documentation-only PRs",
  ({ workflow, job }) => {
    const steps = stepsOf(jobBlock(workflow, job));
    const scopeAt = steps.findIndex((step) => /^\s+id: scope$/m.test(step));
    const scope = steps[scopeAt] ?? "";
    const script = runScriptOf(scope);

    // @req REQ-032
    it("lists the pull request's files right after checkout", () => {
      expect(scopeAt).toBe(1);
      expect(steps[0]).toMatch(/uses: actions\/checkout@/);
      expect(scope).toMatch(/GH_TOKEN: \$\{\{ github\.token \}\}/);
      expect(scope).toMatch(
        /PR: \$\{\{ github\.event\.pull_request\.number \}\}/
      );
      expect(scope).toMatch(/HEAD_REF: \$\{\{ github\.head_ref \}\}/);
      expect(script).toContain(
        'gh api --paginate "repos/$GITHUB_REPOSITORY/pulls/$PR/files"'
      );
      // A rename out of src/ into docs/ lists docs/ as its filename.
      expect(script).toContain(".previous_filename");
    });

    // @req REQ-032
    it("may read the pull request's files", () => {
      expect(readWorkflow(workflow)).toMatch(
        /^\s+pull-requests: (read|write)$/m
      );
    });

    // @req REQ-032
    it.each([
      [["docs/runbooks/a.md"]],
      [["docs/audience/2026-09-14.md", ".claude/skills/x/SKILL.md"]],
      [["README.md", "CLAUDE.md"]],
    ])("skips when every changed file is documentation: %j", (changedFiles) => {
      const { render, stdout } = runScope(script, { changedFiles });

      expect(render).toBe("false");
      expect(stdout).toMatch(/::notice::/);
    });

    // @req REQ-032
    it.each([
      [["docs/a.md", "src/app/page.tsx"]],
      [["dataset/source/afrik/pays/NGA.json"]],
      [["e2e/smoke.spec.ts"]],
      [["scripts/a11y-test.ts"]],
      [[".github/workflows/a11y.yml"]],
      [["public/modele-peuple.json"]],
      [["src/components/home/README.md"]],
    ])(
      "renders when any changed file is not documentation: %j",
      (changedFiles) => {
        expect(runScope(script, { changedFiles }).render).toBe("true");
      }
    );

    // @req REQ-032
    it("renders when the file list cannot be read", () => {
      expect(runScope(script, { apiFails: true }).render).toBe("true");
    });

    // @req REQ-032
    it("renders when the file list comes back empty", () => {
      expect(runScope(script, { changedFiles: [] }).render).toBe("true");
    });

    // @req REQ-032
    it("renders a pull request from recette whatever it changes", () => {
      expect(
        runScope(script, { headRef: "recette", changedFiles: ["docs/a.md"] })
          .render
      ).toBe("true");
    });

    // @req REQ-032
    it("guards every step that builds, serves or reads the app with the scope", () => {
      const secretGuarded = steps.filter((step) =>
        conditionOf(step).includes("steps.secrets.outputs.present == 'true'")
      );

      expect(secretGuarded.length).toBeGreaterThan(0);
      expect(
        steps.filter((step) =>
          /run: (npm run build$|npm run start &$|npx next start )/m.test(step)
        )
      ).toSatisfy((serving: string[]) =>
        serving.every((step) => secretGuarded.includes(step))
      );
      for (const step of secretGuarded) {
        expect(conditionOf(step)).toContain(
          "steps.scope.outputs.render == 'true'"
        );
      }
    });
  }
);

describe("a11y.yml › axe", () => {
  // @req REQ-032
  it("audits live routes only when secrets are present and the scope renders", () => {
    const run = stepsOf(jobBlock("a11y.yml", "axe")).find((step) =>
      step.includes("npx tsx scripts/a11y-test.ts")
    );

    expect(conditionOf(run ?? "")).toBe("");
    expect(run).toContain(
      "A11Y_LIVE_BASE_URL: ${{ steps.secrets.outputs.present == 'true' && steps.scope.outputs.render == 'true' && 'http://localhost:3000' || '' }}"
    );
  });
});
