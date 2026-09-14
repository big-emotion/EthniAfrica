/**
 * Static analysis of migration 090 — the admin queue's ruling drafts.
 *
 * Same discipline as the other migration contracts here: the SQL text is read
 * for its contract, no Postgres is applied in CI.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SOURCE_TIERS, SOURCE_TIER_RULING_DECISIONS } from "@/types/sources";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

function readMigration(prefix: string): string {
  const name = readdirSync(MIGRATIONS).find((file) => file.startsWith(prefix));
  if (!name) throw new Error(`No migration starting with ${prefix}`);
  return readFileSync(join(MIGRATIONS, name), "utf8");
}

const ddl = readMigration("090_").replace(/--[^\n]*/g, "");

function allowedValues(constraintName: string): string[] {
  const declaration = new RegExp(
    `CONSTRAINT ${constraintName}\\s+CHECK[\\s\\S]*?IN\\s*\\(([^)]*)\\)`
  ).exec(ddl);
  if (!declaration) throw new Error(`No CHECK … IN (…) for ${constraintName}`);
  return Array.from(declaration[1].matchAll(/'([^']+)'/g), (m) => m[1]);
}

describe("090 — source_tier_ruling_drafts", () => {
  // A draft stating needs_review would be a ruling that rules nothing.
  // @req REQ-092
  it("admits exactly the three tiers, never needs_review", () => {
    expect(
      allowedValues("source_tier_ruling_drafts_tier_check").sort()
    ).toEqual([...SOURCE_TIERS].sort());
  });

  // @req REQ-092
  it("admits exactly the decisions the ledger knows", () => {
    expect(
      allowedValues("source_tier_ruling_drafts_decision_check").sort()
    ).toEqual([...SOURCE_TIER_RULING_DECISIONS].sort());
  });

  // @req REQ-092
  it("refuses a draft with no rationale", () => {
    expect(ddl).toMatch(/rationale\s+TEXT\s+NOT NULL/);
    expect(ddl).toMatch(
      /CONSTRAINT source_tier_ruling_drafts_rationale_check\s+CHECK\s*\(\s*btrim\(rationale\)\s*<>\s*''\s*\)/
    );
  });

  // Moderators' drafts and their rationales are not public: service_role only,
  // the way admin_allowlist is (migration 074).
  // @req REQ-042
  it("enables RLS and grants no policy at all", () => {
    expect(ddl).toMatch(
      /ALTER TABLE source_tier_ruling_drafts ENABLE ROW LEVEL SECURITY/
    );
    expect(ddl).not.toMatch(/CREATE POLICY/i);
    expect(ddl).not.toMatch(/\bGRANT\b/i);
  });
});
