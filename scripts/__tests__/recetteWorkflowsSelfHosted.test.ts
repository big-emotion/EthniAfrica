import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// REQ-176: recette must not depend on the retired hosted project's quota or
// billing state. These six workflows are the ones that used to read it.
const WORKFLOWS = [
  "migrate-recette.yml",
  "recette-data-sync.yml",
  "e2e.yml",
  "a11y.yml",
  "lighthouse.yml",
] as const;

// The retired hosted-project secret names. `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
// `SUPABASE_SERVICE_ROLE_KEY` also back the self-hosted stack's *internal* env
// var names inside a step (e.g. `NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.RECETTE_SUPABASE_URL }}`),
// so this checks the `secrets.<name>` reference form specifically, not the
// left-hand env var name, which is unrelated to which project it is fed from.
const RETIRED_SECRET_REFS = [
  "secrets.NEXT_PUBLIC_SUPABASE_URL",
  "secrets.SUPABASE_SERVICE_ROLE_KEY",
  "secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "secrets.RECETTE_SUPABASE_DB_URL",
];

function readWorkflow(name: string): string {
  return readFileSync(
    resolve(import.meta.dirname, "../../.github/workflows", name),
    "utf8"
  );
}

describe("recette workflows read the self-hosted database, not the retired hosted project", () => {
  for (const name of WORKFLOWS) {
    // @req REQ-176
    it(`${name} references no retired hosted-project secret`, () => {
      const workflow = readWorkflow(name);
      for (const ref of RETIRED_SECRET_REFS) {
        expect(workflow).not.toContain(ref);
      }
    });

    // Since ETNI-1948, a11y.yml's one job (`axe`) reads no repository secret
    // at all — its database is the ephemeral-supabase action's own, started
    // fresh inside the job. `ephemeralSupabaseWiring.test.ts` holds that job
    // to the ephemeral action; this file's job is only "not the retired
    // hosted project", checked above, which an absent reference satisfies.
    if (name === "a11y.yml") continue;

    // @req REQ-176
    it(`${name} reads a RECETTE_SUPABASE_* secret`, () => {
      const workflow = readWorkflow(name);
      expect(workflow).toMatch(
        /secrets\.RECETTE_SUPABASE_(URL|ANON_KEY|SERVICE_ROLE_KEY)/
      );
    });
  }

  // migrate-recette.yml reaches the database over an SSH tunnel (no published
  // port on recette's Postgres, same as production's own migrate job), so it
  // is checked separately for the SSH secrets rather than a Supabase REST one.
  // @req REQ-176
  it("migrate-recette.yml tunnels over SSH rather than a stored DB URL", () => {
    const workflow = readWorkflow("migrate-recette.yml");
    expect(workflow).toContain("secrets.SUPABASE_SSH_KEY");
    expect(workflow).toContain("secrets.SUPABASE_SSH_HOST");
    expect(workflow).not.toContain("secrets.RECETTE_SUPABASE_DB_URL");
  });

  // deploy-preview-recette.yml only fires a Vercel deploy hook — the database
  // its resulting preview reads is a Vercel project environment variable, set
  // outside this repository, not a GitHub Actions secret this file could name.
  // @req REQ-176
  it("deploy-preview-recette.yml names no retired hosted-project secret", () => {
    const workflow = readWorkflow("deploy-preview-recette.yml");
    for (const ref of RETIRED_SECRET_REFS) {
      expect(workflow).not.toContain(ref);
    }
  });
});
