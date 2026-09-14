import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(
  process.cwd(),
  ".github/workflows/migrations-replay.yml"
);

function readWorkflow(): string {
  return readFileSync(workflowPath, "utf-8");
}

describe("migrations replay workflow", () => {
  // A migration was only ever executed against a database that already held
  // every migration before it. Nothing proved the sequence still builds a
  // schema from nothing, which is exactly what a new contributor's
  // `supabase db reset` asks of it.
  // @req REQ-032
  it("runs on pull requests into recette and main that change a migration, and on demand", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/^\s*pull_request:/m);
    expect(workflow).toMatch(/branches:\s*\[recette, main\]/);
    expect(workflow).toContain('"supabase/migrations/**"');
    expect(workflow).toMatch(/^\s*workflow_dispatch:/m);
    expect(workflow).not.toMatch(/^\s+(push|schedule|pull_request_target):/m);
  });

  // `supabase start` is what supplies the auth and storage schemas and the
  // anon/authenticated/service_role roles the migrations reference; a bare
  // Postgres service container has none of them.
  // @req REQ-032
  it("replays every migration from scratch on the Supabase CLI's local stack", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/uses: supabase\/setup-cli@[0-9a-f]{40}/);
    expect(workflow).toMatch(/run: supabase start\b/);
    expect(workflow).toMatch(/run: supabase db reset\b/);
  });

  // It builds a throwaway database on the runner, so it needs to read the
  // repository and nothing else — and must stay runnable from a fork.
  // @req REQ-032
  it("needs no secret and only read access to the repository", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/^permissions:\s*\n\s+contents: read\s*$/m);
    expect(workflow).not.toContain("secrets.");
    expect(workflow).not.toContain("environment:");
  });
});
