import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/089_oral_tradition_name_provenance.sql"
);

function ddl(): string {
  return readFileSync(migrationPath, "utf8").replace(/--[^\n]*/g, "");
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

function confidenceTail(sql: string): string {
  const body = functionBody(sql, "recompute_confidence");
  const tail = body.slice(body.indexOf("SELECT COUNT(*)::INTEGER"));
  return tail
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("089 oral tradition name provenance migration", () => {
  // @req REQ-161
  it("admits both new source kinds while requiring unverified tier and an oral narrative only for oral sources", () => {
    const sql = ddl();
    expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS sources_source_kind_check/i);
    expect(sql).toContain("'oral_tradition'");
    expect(sql).toContain("'ethniafrica_synthesis'");
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS oral_narrative_id UUID/i);
    expect(sql).toMatch(
      /oral_narrative_id UUID REFERENCES oral_narratives\(id\)/i
    );
    expect(sql).toMatch(
      /source_kind IS NOT DISTINCT FROM 'oral_tradition' AND oral_narrative_id IS NOT NULL/i
    );
    expect(sql).toMatch(
      /source_kind IS DISTINCT FROM 'oral_tradition' AND oral_narrative_id IS NULL/i
    );
    expect(sql).toMatch(
      /source_kind IS DISTINCT FROM 'oral_tradition'[\s\S]*?source_kind IS DISTINCT FROM 'ethniafrica_synthesis'[\s\S]*?OR tier IS NOT DISTINCT FROM 'unverified'/i
    );
  });

  // @req REQ-161
  it("extends narrative kinds and records a pseudonymous carrier and approval evidence", () => {
    const sql = ddl();
    for (const kind of ["song", "genealogy", "motto", "proverb"]) {
      expect(sql).toContain(`'${kind}'`);
    }
    for (const field of [
      "carrier_role",
      "carrier_ref",
      "consent_evidence",
      "approved_by",
    ]) {
      expect(sql).toMatch(
        new RegExp(`ADD COLUMN IF NOT EXISTS ${field}\\b`, "i")
      );
    }
    expect(sql).toMatch(/approved_by UUID REFERENCES auth\.users\(id\)/i);
  });

  // @req REQ-161
  it("requires an advisor role whenever a narrative is approved", () => {
    const sql = ddl();
    const body = functionBody(sql, "enforce_oral_narrative_approval");
    expect(body).toMatch(/NEW\.review_status = 'approved'/);
    expect(body).toMatch(/NEW\.approved_by IS NULL/);
    expect(body).toMatch(
      /user_roles[\s\S]*?user_id = NEW\.approved_by[\s\S]*?role = 'advisor'/
    );
    expect(sql).toMatch(
      /CREATE TRIGGER oral_narratives_advisor_approval[\s\S]*?BEFORE INSERT OR UPDATE ON oral_narratives/i
    );
    expect(sql).toMatch(
      /FUNCTION enforce_oral_narrative_approval\(\)[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public, auth, pg_temp/i
    );
    expect(sql).toMatch(
      /REVOKE EXECUTE ON FUNCTION enforce_oral_narrative_approval\(\)\s+FROM PUBLIC, anon, authenticated/i
    );
  });

  // @req REQ-161
  it("allows a people name from one cleared, approved oral account linked to the same people", () => {
    const body = functionBody(ddl(), "enforce_name_record_sources");
    expect(body).toMatch(/NEW\.entity_type = 'people'/);
    expect(body).toMatch(/s\.source_kind = 'oral_tradition'/);
    expect(body).toMatch(/n\.review_status = 'approved'/);
    expect(body).toMatch(/n\.rights_status = 'cleared'/);
    expect(body).toMatch(/l\.entity_type = 'people'/);
    expect(body).toMatch(/l\.entity_id = NEW\.entity_id/);
    expect(body).toMatch(/s\.source_kind = 'ethniafrica_synthesis'/);
  });

  // @req REQ-161
  it("keeps patronyme and other entity gates at their previous tiers", () => {
    const body = functionBody(ddl(), "enforce_name_record_sources");
    expect(body).toMatch(
      /NEW\.entity_type = 'patronyme'[\s\S]*?s\.tier IN \('official', 'referenced', 'unverified'\)/
    );
    expect(body).toMatch(
      /NEW\.entity_type NOT IN \('people', 'patronyme'\)[\s\S]*?s\.tier IN \('official', 'referenced'\)/
    );
  });

  // @req REQ-161
  it("uses fixed 0.6 and 0.3 qualities instead of tier multipliers, deduplicating oral carriers in the count", () => {
    const body = functionBody(ddl(), "recompute_confidence");
    expect(body).toMatch(/WHEN s\.source_kind = 'oral_tradition'\s+THEN 0\.6/);
    expect(body).toMatch(
      /WHEN s\.source_kind = 'ethniafrica_synthesis'\s+THEN 0\.3/
    );
    expect(body).toMatch(/s\.tier = 'official'[\s\S]*?THEN 1\.0/);
    expect(body).toMatch(/s\.tier = 'referenced'[\s\S]*?THEN 0\.7/);
    expect(body).toMatch(/s\.source_kind = 'ai_generated' THEN 0\.5 ELSE 1\.0/);
    expect(body).toMatch(/COUNT\(DISTINCT[\s\S]*?n\.carrier_ref/);
    expect(body).toMatch(/WHEN s\.id IS NULL\s+THEN NULL/);
    expect(ddl()).toMatch(
      /SET search_path = public, extensions, pg_temp[\s\S]*?AS \$\$/
    );
  });

  // @req REQ-161
  it("preserves the ordinary confidence score, flag pressure and recency calculation", () => {
    const previous = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/088_needs_review_source_tier.sql"
      ),
      "utf8"
    );
    expect(confidenceTail(ddl())).toBe(confidenceTail(previous));
  });

  // @req REQ-161
  it("is repeatable and changes no existing source or narrative rows", () => {
    const sql = ddl();
    expect(sql).not.toMatch(
      /\b(?:UPDATE|DELETE)\s+(?:sources|oral_narratives)\b/i
    );
    expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS/i);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION/i);
  });
});
