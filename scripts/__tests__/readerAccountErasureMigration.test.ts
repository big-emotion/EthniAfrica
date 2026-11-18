/**
 * Static analysis of migration 118 — erasing a reader account keeps its
 * comments and forgets the reader.
 *
 * Same discipline as the other migration contracts: the SQL text is read for
 * its contract, no Postgres is applied in CI.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

function migration118(): string {
  const name = readdirSync(MIGRATIONS).find((file) => file.startsWith("118_"));
  if (!name) throw new Error("No migration starting with 118_");
  return readFileSync(join(MIGRATIONS, name), "utf8")
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("118 erase_contributor_account for reader accounts", () => {
  // @req REQ-213
  it("is re-runnable: the function is replaced, never created twice", () => {
    expect(migration118()).toMatch(
      /CREATE OR REPLACE FUNCTION public\.erase_contributor_account\( target_user_id UUID \)/i
    );
  });

  // @req REQ-213
  it("keeps the comments and replies but drops their author and pseudonym", () => {
    const sql = migration118();

    expect(sql).toMatch(
      /UPDATE public\.flags SET contributor_id = NULL, contributor_display_name_snapshot = NULL/i
    );
    expect(sql).toMatch(
      /UPDATE public\.flag_replies SET author_id = NULL, display_name_snapshot = NULL WHERE author_id = target_user_id/i
    );
    expect(sql).not.toMatch(/DELETE FROM public\.flags\b/i);
    expect(sql).not.toMatch(/DELETE FROM public\.flag_replies\b/i);
  });

  // An address is kept only for its account (REQ-213): the contacts that
  // confirmed the comments go with it.
  // @req REQ-213
  it("forgets the address the comments were confirmed with before deleting the user", () => {
    const sql = migration118();
    const forget = sql.search(/DELETE FROM public\.flag_reporter_contacts/i);
    const deleteUser = sql.search(/DELETE FROM auth\.users/i);

    expect(forget).toBeGreaterThan(-1);
    expect(deleteUser).toBeGreaterThan(forget);
  });

  // @req REQ-213
  it("stays callable by the service role only", () => {
    const sql = migration118();

    expect(sql).toMatch(/SECURITY DEFINER/i);
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.erase_contributor_account\(UUID\) FROM anon, authenticated/i
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.erase_contributor_account\(UUID\) TO service_role/i
    );
  });
});
