/**
 * Static analysis of migration 102 — REQ-199, superseding the per-narrative
 * count of REQ-172 / DEC-055 §6 (migrations 091 and 099).
 *
 * Same discipline as the other migration contracts here: the SQL text is read
 * for its contract, no Postgres is applied in CI. 102 is meant to differ from
 * 099 in the source count only, so the weights and the score tail are compared
 * with 099's rather than pinned as literals.
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
  const match = new RegExp(
    `CREATE OR REPLACE FUNCTION ${name}\\([\\s\\S]*?AS \\$\\$([\\s\\S]*?)\\$\\$`,
    "i"
  ).exec(sql);
  if (!match) throw new Error(`Missing function ${name}`);
  return match[1];
}

const flat = (text: string) => text.replace(/\s+/g, " ").trim();

/** The `COUNT(DISTINCT …)::INTEGER` expression that becomes source_count. */
function sourceCountExpression(body: string): string {
  const match = /COUNT\(DISTINCT ([\s\S]*?)\)::INTEGER,\s*AVG\(/.exec(body);
  if (!match) throw new Error("No source count expression");
  return flat(match[1]);
}

/** The AVG(...) quality expression, up to the INTO. */
function qualityAverage(body: string): string {
  return flat(body.slice(body.indexOf("AVG("), body.indexOf("INTO")));
}

/** Everything after the quality average: flags, recency, formula, upsert. */
function scoreTail(body: string): string {
  return flat(body.slice(body.indexOf("SELECT COUNT(*)::INTEGER")));
}

const ddl = () => withoutComments(readMigration("102_"));
const confidence = () => functionBody(ddl(), "recompute_confidence");
const previous = () =>
  functionBody(withoutComments(readMigration("099_")), "recompute_confidence");

describe("102 several narratives from one carrier count as one source", () => {
  // @req REQ-199
  it("keys an oral source by its narrative's carrier reference when it has one", () => {
    const count = sourceCountExpression(confidence());
    expect(count).toMatch(
      /WHEN s\.source_kind = 'oral_tradition' AND n\.carrier_ref IS NOT NULL THEN 'carrier:' \|\| n\.carrier_ref/
    );
    expect(confidence()).toMatch(
      /LEFT JOIN oral_narratives n ON n\.id = s\.oral_narrative_id/
    );
  });

  // Two carriers yield two keys, and a narrative with no carrier reference
  // falls through to its own source id: neither collapses into another.
  // @req REQ-199
  it("counts every other source, and an oral source without a carrier, by its own id", () => {
    const count = sourceCountExpression(confidence());
    expect(count).toMatch(/WHEN s\.id IS NULL THEN NULL/);
    expect(count).toMatch(/ELSE 'source:' \|\| s\.id::TEXT END$/);
  });

  // REQ-195 set the weights; this migration moves the count, not the weights.
  // @req REQ-199
  it("leaves the quality weights and the score formula as 099 left them", () => {
    expect(qualityAverage(confidence())).toBe(qualityAverage(previous()));
    expect(scoreTail(confidence())).toBe(scoreTail(previous()));
  });

  // Recomputing every stored score would also wipe the URL-health penalties
  // `scripts/recomputeConfidence.ts` applies to unrelated fiches.
  // @req REQ-199
  it("recomputes the stored scores of exactly the entities that cite an oral tradition", () => {
    const sql = flat(ddl());
    expect(sql).toMatch(
      /PERFORM recompute_confidence\(\w+\.entity_type, \w+\.entity_id\)/
    );
    expect(sql).toMatch(
      /SELECT DISTINCT a\.entity_type, a\.entity_id FROM assertions a .*?JOIN sources s ON s\.id = src_id WHERE s\.source_kind = 'oral_tradition'/
    );
  });

  // @req REQ-199
  it("rewrites no source, narrative or name row and leaves the consent gate alone", () => {
    const sql = ddl();
    expect(sql).not.toMatch(/enforce_name_record_sources/);
    expect(sql).not.toMatch(
      /\b(?:UPDATE|DELETE\s+FROM)\s+(?:sources|oral_narratives|name_records)\b/i
    );
  });

  // @req REQ-199
  it("documents the carrier rule on the function and on carrier_ref", () => {
    const sql = ddl();
    expect(sql).toMatch(
      /COMMENT ON FUNCTION recompute_confidence\(TEXT, TEXT\) IS[\s\S]*?REQ-199/
    );
    expect(sql).toMatch(
      /COMMENT ON COLUMN oral_narratives\.carrier_ref IS[\s\S]*?REQ-199/
    );
    expect(sql).not.toMatch(
      /whoever carried it|each narrative counts as its own source/i
    );
  });
});
