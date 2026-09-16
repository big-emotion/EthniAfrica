/**
 * Static analysis of migration 091 — DEC-055 points 6 and 7.
 *
 * Same discipline as the other migration contracts here: the SQL text is read
 * for its contract, no Postgres is applied in CI.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

function readMigration(prefix: string): string {
  const name = readdirSync(MIGRATIONS).find((file) => file.startsWith(prefix));
  if (!name) throw new Error(`No migration starting with ${prefix}`);
  return readFileSync(join(MIGRATIONS, name), "utf8");
}

function withoutComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, "");
}

function functionBody(sql: string, name: string): string {
  const pattern = new RegExp(
    `CREATE OR REPLACE FUNCTION ${name}\\([\\s\\S]*?AS \\$\\$([\\s\\S]*?)\\$\\$`,
    "i"
  );
  const match = pattern.exec(sql);
  if (!match) throw new Error(`Missing function ${name}`);
  return match[1];
}

function policy(sql: string, name: string): string {
  const match = new RegExp(
    `CREATE POLICY ${name}[\\s\\S]*?FOR SELECT USING \\(([\\s\\S]*?)\\);`,
    "i"
  ).exec(sql);
  if (!match) throw new Error(`Missing policy ${name}`);
  return match[1];
}

function confidenceTail(sql: string): string {
  const body = functionBody(sql, "recompute_confidence");
  return body
    .slice(body.indexOf("SELECT COUNT(*)::INTEGER"))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The tier condition `enforce_name_record_sources()` puts on a name record
 * that is not a people's: `089` wrote it after `NOT IN ('people', 'patronyme')`,
 * `091` after `<> 'people'`.
 */
function nonPeopleTierCondition(body: string): string {
  const match =
    /\(NEW\.entity_type (?:<> 'people'|NOT IN \('people', 'patronyme'\)) AND (s\.tier [^()]*(?:\([^)]*\))?)\)/.exec(
      body.replace(/\s+/g, " ")
    );
  if (!match) throw new Error("Missing the non-people tier condition");
  return match[1].trim();
}

/**
 * Evaluates that condition for one source's tier. Only the two shapes the
 * migrations use are understood; any other shape throws, so a rewrite of the
 * gate has to come back through this test rather than pass it unread.
 */
function qualifiesAtTier(condition: string, tier: string | null): boolean {
  if (condition === "s.tier IS NOT NULL") return tier !== null;
  const listed = /^s\.tier IN \(([^)]*)\)$/.exec(condition);
  if (!listed) throw new Error(`Unrecognised tier condition: ${condition}`);
  return (
    tier !== null &&
    listed[1]
      .split(",")
      .map((v) => v.trim())
      .includes(`'${tier}'`)
  );
}

const ddl = () => withoutComments(readMigration("091_"));

describe("091 oral narratives before review, name records at any tier", () => {
  // @req REQ-172
  it("lets a public narrative exist once its rights are cleared, reviewed or not", () => {
    const sql = ddl();
    expect(sql).toMatch(/pg_get_constraintdef\(oid\) LIKE '%review_status%'/);
    expect(sql).toMatch(
      /ADD CONSTRAINT oral_narratives_public_visibility_check[\s\S]*?visibility = 'restricted'[\s\S]*?visibility = 'public' AND rights_status = 'cleared' AND review_status <> 'rejected'/i
    );
    expect(sql).not.toMatch(/review_status = 'approved'/);
  });

  // @req REQ-172
  it("opens public read to unreviewed narratives and their links, consent still required", () => {
    const sql = ddl();
    for (const name of [
      "oral_narratives_public_read",
      "oral_narrative_links_public_read",
    ]) {
      expect(sql).toMatch(
        new RegExp(`DROP POLICY IF EXISTS ${name} ON oral_narrative`, "i")
      );
      const condition = policy(sql, name);
      expect(condition).toMatch(/visibility = 'public'/);
      expect(condition).toMatch(/rights_status = 'cleared'/);
      expect(condition).toMatch(/review_status <> 'rejected'/);
      expect(condition).not.toMatch(/'approved'/);
    }
  });

  // @req REQ-172
  it("removes the advisor precondition on recording an approval", () => {
    const sql = ddl();
    expect(sql).toMatch(
      /DROP TRIGGER IF EXISTS oral_narratives_advisor_approval ON oral_narratives/i
    );
    expect(sql).toMatch(
      /DROP FUNCTION IF EXISTS enforce_oral_narrative_approval\(\)/i
    );
    expect(sql).not.toMatch(/role = 'advisor'/);
  });

  // @req REQ-172
  it("lets a people name rest on a cleared, linked oral narrative that nobody has reviewed", () => {
    const body = functionBody(ddl(), "enforce_name_record_sources");
    expect(body).toMatch(
      /NEW\.entity_type = 'people'[\s\S]*?s\.source_kind = 'oral_tradition'[\s\S]*?n\.rights_status = 'cleared'[\s\S]*?n\.review_status <> 'rejected'[\s\S]*?l\.entity_type = 'people'[\s\S]*?l\.entity_id = NEW\.entity_id/
    );
    expect(body).not.toMatch(/'approved'/);
    expect(body).toMatch(/s\.source_kind = 'ethniafrica_synthesis'/);
  });

  // @req REQ-173
  it("accepts a name record of every other entity type at any recorded tier", () => {
    const body = functionBody(ddl(), "enforce_name_record_sources");
    expect(body).toMatch(
      /\(NEW\.entity_type <> 'people' AND s\.tier IS NOT NULL\)/
    );
    expect(body).not.toMatch(/NOT IN \('people', 'patronyme'\)/);
    expect(body).toMatch(/assertion_id is required/);
  });

  // The standing stays readable because the gate only admits or refuses: it
  // assigns nothing on NEW and rewrites no source, so the row keeps the tier
  // it was loaded with.
  // @req REQ-173
  it("accepts a country or family name whose only source is unverified, which 089 refused, and keeps that standing as recorded", () => {
    const body = functionBody(ddl(), "enforce_name_record_sources");
    const condition = nonPeopleTierCondition(body);
    expect(qualifiesAtTier(condition, "unverified")).toBe(true);
    expect(qualifiesAtTier(condition, "official")).toBe(true);
    expect(qualifiesAtTier(condition, null)).toBe(false);

    const retired = nonPeopleTierCondition(
      functionBody(
        withoutComments(readMigration("089_")),
        "enforce_name_record_sources"
      )
    );
    expect(qualifiesAtTier(retired, "unverified")).toBe(false);

    expect(body).not.toMatch(/NEW\.\w+\s*:=/);
    expect(body).toMatch(/RETURN NEW;/);
  });

  // @req REQ-172
  it("counts every oral narrative as its own source, weights unchanged", () => {
    const sql = ddl();
    const body = functionBody(sql, "recompute_confidence");
    expect(body).toMatch(/COUNT\(DISTINCT s\.id\)::INTEGER/);
    expect(body).not.toMatch(/carrier_ref/);
    expect(body).not.toMatch(/oral_narratives/);
    expect(body).toMatch(/WHEN s\.source_kind = 'oral_tradition'\s+THEN 0\.6/);
    expect(body).toMatch(
      /WHEN s\.source_kind = 'ethniafrica_synthesis'\s+THEN 0\.3/
    );
    expect(body).toMatch(/s\.source_kind = 'ai_generated' THEN 0\.5 ELSE 1\.0/);
    expect(confidenceTail(sql)).toBe(
      confidenceTail(withoutComments(readMigration("089_")))
    );
  });

  // @req REQ-172
  it("rewrites the function comments so they no longer describe the retired rules", () => {
    const sql = ddl();
    expect(sql).toMatch(
      /COMMENT ON FUNCTION enforce_name_record_sources\(\) IS[\s\S]*?DEC-055/
    );
    expect(sql).toMatch(
      /COMMENT ON FUNCTION recompute_confidence\(TEXT, TEXT\) IS[\s\S]*?DEC-055/
    );
    expect(sql).not.toMatch(/deduplicat/i);
  });

  // @req REQ-172
  it("is repeatable and rewrites no source, narrative or name row", () => {
    const sql = ddl();
    expect(sql).not.toMatch(
      /\b(?:UPDATE|DELETE\s+FROM)\s+(?:sources|oral_narratives|name_records)\b/i
    );
    expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS/i);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION/i);
  });
});
