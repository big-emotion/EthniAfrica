/**
 * Static contract for migration 114's spelling-alias search support. The
 * migration re-issues the live search function; these checks keep the alias
 * input guarded and subject to the same one-name rule as other people names.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATION = path.resolve(
  process.cwd(),
  "supabase/migrations/114_afrik_search_leads_spelling_aliases.sql"
);
const sql = readFileSync(MIGRATION, "utf8");

const peopleBranch = () => {
  const start = sql.indexOf("'people'::text AS kind");
  const end = sql.indexOf("'country'::text AS kind", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
};

describe("migration 114 adds spelling aliases to near-miss search", () => {
  // @req REQ-125
  it("re-issues the existing function with its signature, security, and grants", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.afrik_search_leads\(\s*p_q\s+TEXT DEFAULT NULL,\s*p_limit INT\s+DEFAULT 3,\s*p_lang\s+TEXT DEFAULT 'fr'\s*\)/
    );
    expect(sql.match(/CREATE (OR REPLACE )?FUNCTION/g) ?? []).toHaveLength(1);
    expect(sql).toContain("SECURITY INVOKER");
    expect(sql).toContain("SET search_path = public, extensions, pg_temp");
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.afrik_search_leads\(TEXT, INT, TEXT\) FROM PUBLIC/
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.afrik_search_leads\(TEXT, INT, TEXT\)\s+TO anon, authenticated, service_role/
    );
  });

  // @req REQ-125
  it("reads spellingAliases only when the JSON value is an array", () => {
    const people = peopleBranch();

    expect(people).toContain("'{appellations,spellingAliases}'");
    expect(people).toMatch(
      /jsonb_typeof\(p\.content #> '\{appellations,spellingAliases\}'\)\s*=\s*'array'/
    );
    expect(people).toMatch(
      /jsonb_array_elements_text\([\s\S]*?CASE WHEN jsonb_typeof\(p\.content #> '\{appellations,spellingAliases\}'\) = 'array'[\s\S]*?ELSE '\[\]'::jsonb END[\s\S]*?\) AS spelling_alias/
    );
    expect(people).toContain("WHERE piece.value ~ q.one_name");
  });

  // @req REQ-125
  it("lets the shared one-name rule accept up to four words", () => {
    const q = sql.slice(
      sql.indexOf("WITH q AS ("),
      sql.indexOf("candidates AS (")
    );

    expect(q).toMatch(/\{0,3\}\$'::text AS one_name/);
    expect(q).not.toMatch(/\{0,2\}\$'::text AS one_name/);
  });

  // @req REQ-125
  it("accepts combining marks in Arabic and Ethiopic name spellings", () => {
    const q = sql.slice(
      sql.indexOf("WITH q AS ("),
      sql.indexOf("candidates AS (")
    );

    expect(q).toContain("\\u064b-\\u065f");
    expect(q).toContain("\\u135d-\\u135f");
  });

  // @req REQ-125
  it("keeps the migration isolated from schema changes", () => {
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });
});
