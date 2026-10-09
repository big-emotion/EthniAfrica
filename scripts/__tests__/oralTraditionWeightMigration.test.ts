/**
 * Static analysis of migration 099 — REQ-195, DEC-070 §3, ARCH-029.
 *
 * Same discipline as the other migration contracts here: the SQL text is read
 * for its contract, no Postgres is applied in CI. The weights are read back
 * out of the CASE as numbers, so "oral weighs as writing" is asserted as an
 * equality rather than as a pinned literal that a later re-weighting of
 * `referenced` would silently break.
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

function weightWhen(body: string, condition: string): number {
  const match = new RegExp(
    `WHEN ${condition.replace(/[.()]/g, "\\$&")}\\s+THEN (\\d+(?:\\.\\d+)?)`
  ).exec(body);
  if (!match) throw new Error(`No weight for ${condition}`);
  return Number(match[1]);
}

function aiMultiplier(body: string): number {
  const match =
    /WHEN s\.source_kind = 'ai_generated' THEN (\d+(?:\.\d+)?) ELSE 1\.0/.exec(
      body
    );
  if (!match) throw new Error("No ai_generated multiplier");
  return Number(match[1]);
}

/** Everything after the quality average: flags, recency, formula, upsert. */
function scoreTail(body: string): string {
  return body
    .slice(body.indexOf("SELECT COUNT(*)::INTEGER"))
    .replace(/\s+/g, " ")
    .trim();
}

const ddl = () => withoutComments(readMigration("099_"));
const confidence = () => functionBody(ddl(), "recompute_confidence");

describe("099 oral tradition weighs as writing", () => {
  // @req REQ-195
  it("gives an oral tradition the same quality weight as a referenced written source", () => {
    const body = confidence();
    expect(weightWhen(body, "s.source_kind = 'oral_tradition'")).toBe(
      weightWhen(body, "s.tier = 'referenced'")
    );
  });

  // @req REQ-195
  it("keeps EthniAfrica synthesis and AI-generated sources below a referenced one", () => {
    const body = confidence();
    const referenced = weightWhen(body, "s.tier = 'referenced'");
    expect(weightWhen(body, "s.source_kind = 'ethniafrica_synthesis'")).toBe(
      0.3
    );
    expect(
      weightWhen(body, "s.source_kind = 'ethniafrica_synthesis'")
    ).toBeLessThan(referenced);
    expect(aiMultiplier(body)).toBe(0.5);
    expect(referenced * aiMultiplier(body)).toBeLessThan(referenced);
  });

  // 091 made every narrative its own source (DEC-055 §7, REQ-172); this
  // migration moves a weight, not the count.
  // @req REQ-195
  it("leaves the source count and the score formula as 091 left them", () => {
    const body = confidence();
    expect(body).toMatch(/COUNT\(DISTINCT s\.id\)::INTEGER/);
    expect(body).not.toMatch(/carrier_ref|oral_narratives/);
    expect(scoreTail(body)).toBe(
      scoreTail(
        functionBody(
          withoutComments(readMigration("091_")),
          "recompute_confidence"
        )
      )
    );
  });

  // Recomputing every stored score would also wipe the URL-health penalties
  // `scripts/recomputeConfidence.ts` applies to unrelated fiches.
  // @req REQ-195
  it("recomputes the stored scores of exactly the entities that cite an oral tradition", () => {
    const sql = ddl().replace(/\s+/g, " ");
    expect(sql).toMatch(
      /PERFORM recompute_confidence\(\w+\.entity_type, \w+\.entity_id\)/
    );
    expect(sql).toMatch(
      /SELECT DISTINCT a\.entity_type, a\.entity_id FROM assertions a .*?JOIN sources s ON s\.id = src_id WHERE s\.source_kind = 'oral_tradition'/
    );
  });

  // @req REQ-195
  it("leaves the consent gate alone and rewrites no source, narrative or name row", () => {
    const sql = ddl();
    expect(sql).not.toMatch(/enforce_name_record_sources/);
    expect(sql).not.toMatch(
      /\b(?:UPDATE|DELETE\s+FROM)\s+(?:sources|oral_narratives|name_records)\b/i
    );
    expect(sql).toMatch(
      /COMMENT ON FUNCTION recompute_confidence\(TEXT, TEXT\) IS[\s\S]*?REQ-195/
    );
    expect(sql).not.toMatch(/fixed quality 0\.6/);
  });
});
