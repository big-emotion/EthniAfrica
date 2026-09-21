import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The nightly confidence job ran `npx tsx scripts/checkSourceUrls.ts` bare and
// failed every night: both scripts import src/lib/supabase/admin.ts, whose
// `import "server-only"` throws outside the `react-server` condition. Vitest
// aliases that package to a stub, so no unit suite noticed. This suite takes
// each step's command from the workflow itself and runs it the way the runner
// does, minus the credentials, so a script that stops at its dry-run guard has
// proven that every module loaded.
const workflowText = readFileSync(
  resolve(process.cwd(), ".github/workflows/confidence-recompute.yml"),
  "utf8"
);

// A line match, not a YAML parse: js-yaml is only an npm override here, not a
// declared dependency, and the steps are single-line `run:` commands.
function commandRunning(script: string): string {
  const line = workflowText
    .split("\n")
    .map((candidate) => candidate.trim())
    .find(
      (candidate) => candidate.startsWith("run:") && candidate.includes(script)
    );
  if (!line) throw new Error(`no workflow step runs ${script}`);
  return line.replace(/^run:\s*/, "");
}

function runLikeTheWorkflow(script: string) {
  const tsxArgs = commandRunning(script).replace(/^npx tsx\s+/, "");

  // Empty credentials send the script down its dry-run branch, so nothing
  // after the imports can reach a database.
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  };

  return spawnSync(
    process.execPath,
    [
      resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
      ...tsxArgs.split(/\s+/),
    ],
    { cwd: process.cwd(), env, encoding: "utf8" }
  );
}

describe("confidence-recompute workflow module graph", () => {
  // @req REQ-031
  it.each(["scripts/checkSourceUrls.ts", "scripts/recomputeConfidence.ts"])(
    "loads %s under the flags the nightly job passes",
    (script) => {
      const run = runLikeTheWorkflow(script);

      expect(run.stderr).not.toContain("server-only");
      expect(run.status).toBe(0);
      expect(`${run.stdout}${run.stderr}`).toContain("DRY RUN");
    },
    60_000
  );
});
