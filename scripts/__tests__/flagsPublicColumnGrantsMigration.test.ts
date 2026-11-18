/**
 * Static analysis of migration 116 — what the anon key and a self-registered
 * session can reach once public reader accounts open.
 *
 * Same discipline as the other migration contracts here: the SQL text is read
 * for its contract, no Postgres is applied in CI. The live behaviour (an anon
 * PostgREST call refused on `contribution_payload`) is covered by
 * `supabase/__tests__/flags-rls.test.ts` when a local stack is running.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PUBLIC_FLAG_SELECT } from "@/lib/flags/publicFlagColumns";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

function readMigration(prefix: string): string {
  const name = readdirSync(MIGRATIONS).find((file) => file.startsWith(prefix));
  if (!name) throw new Error(`No migration starting with ${prefix}`);
  return readFileSync(join(MIGRATIONS, name), "utf8");
}

const flat = (text: string) =>
  text
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();

const ddl = () => flat(readMigration("116_"));

const PUBLIC_ROLES = "anon, authenticated";

function grantedSelectColumns(sql: string, table: string): string[] {
  const match = new RegExp(
    `GRANT SELECT \\(([^)]*)\\) ON (?:public\\.)?${table} TO ${PUBLIC_ROLES};`,
    "i"
  ).exec(sql);
  if (!match) throw new Error(`No column-level SELECT grant on ${table}`);
  return match[1].split(",").map((column) => column.trim());
}

describe("116 flags: the public reads public columns only", () => {
  // @req REQ-014
  it("withdraws every table-level privilege before granting columns", () => {
    const sql = ddl();
    const revoke = sql.indexOf(
      `REVOKE ALL ON public.flags FROM ${PUBLIC_ROLES};`
    );
    const grant = sql.indexOf("GRANT SELECT (");

    expect(revoke).toBeGreaterThan(-1);
    expect(grant).toBeGreaterThan(revoke);
  });

  // @req REQ-014
  it("grants exactly the columns the public API and pages select", () => {
    const granted = grantedSelectColumns(ddl(), "flags");

    expect(granted).toEqual(PUBLIC_FLAG_SELECT.split(", "));
  });

  // @req REQ-014
  it("never grants the contributor's details or moderation internals", () => {
    const granted = grantedSelectColumns(ddl(), "flags");

    for (const privateColumn of [
      "contribution_payload",
      "contributor_display_name_snapshot",
      "moderator_id",
      "human_verified",
      "revision_draft_id",
    ]) {
      expect(granted).not.toContain(privateColumn);
    }
  });

  // @req REQ-012
  it("drops the policies that let a session write flags directly", () => {
    const sql = ddl();

    expect(sql).toContain(
      "DROP POLICY IF EXISTS flags_contributor_insert ON public.flags;"
    );
    expect(sql).toContain(
      "DROP POLICY IF EXISTS flags_contributor_withdraw ON public.flags;"
    );
    expect(sql).not.toMatch(/CREATE POLICY \w+ ON (public\.)?flags/i);
  });
});

describe("116 contributor_profiles: no one raises their own role", () => {
  // @req REQ-042
  it("drops both self-write policies", () => {
    const sql = ddl();

    expect(sql).toContain(
      "DROP POLICY IF EXISTS contributor_profiles_self_update ON public.contributor_profiles;"
    );
    expect(sql).toContain(
      "DROP POLICY IF EXISTS contributor_profiles_own_rw ON public.contributor_profiles;"
    );
  });

  // @req REQ-042
  it("withdraws every write privilege from the public roles", () => {
    expect(ddl()).toContain(
      `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.contributor_profiles FROM ${PUBLIC_ROLES};`
    );
  });
});

describe("116 audit_log: no client reads the trail directly", () => {
  // @req REQ-041
  it("drops the public read policy and every privilege", () => {
    const sql = ddl();

    expect(sql).toContain(
      "DROP POLICY IF EXISTS audit_log_read_public ON public.audit_log;"
    );
    expect(sql).toContain(
      `REVOKE ALL ON public.audit_log FROM ${PUBLIC_ROLES};`
    );
  });
});

describe("116 source working assets: uploads are the service's", () => {
  // @req REQ-093
  it("drops the owner write policies on the table and on storage", () => {
    const sql = ddl();

    for (const verb of ["insert", "update", "delete"]) {
      expect(sql).toContain(
        `DROP POLICY IF EXISTS source_working_assets_owner_${verb} ON public.source_working_assets;`
      );
      expect(sql).toContain(
        `DROP POLICY IF EXISTS source_working_assets_objects_owner_${verb} ON storage.objects;`
      );
    }
    expect(sql).toContain(
      `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.source_working_assets FROM ${PUBLIC_ROLES};`
    );
  });
});
