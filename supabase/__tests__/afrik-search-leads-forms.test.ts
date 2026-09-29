/**
 * Static contract for migration 094. Unit tests reach no live Supabase, so
 * these pin what the migration a human will apply has to say; the behaviour
 * itself is checked on recette (see the verification block in the migration).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/094_afrik_search_leads_recorded_forms.sql"
  ),
  "utf8"
);

describe("near-miss leads over a people's recorded forms (migration 094)", () => {
  // @req REQ-125
  it("keeps the signature of 084, so PostgREST sees no overload", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.afrik_search_leads\(\s*p_q\s+TEXT DEFAULT NULL,\s*p_limit INT\s+DEFAULT 3,\s*p_lang\s+TEXT DEFAULT 'fr'\s*\)/
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.afrik_search_leads\(TEXT, INT, TEXT\)\s+TO anon, authenticated, service_role/
    );
  });

  // @req REQ-125
  it("scores the filed name, the self-appellation and the exonyms of a people", () => {
    expect(sql).toContain("p.name_main");
    expect(sql).toContain("'{appellations,selfAppellation}'");
    expect(sql).toContain("'{appellations,exonyms}'");
  });

  // @req REQ-125
  it("emits the filed name of the people, never the form that was scored", () => {
    expect(sql).toMatch(/p\.name_main AS name/);
    expect(sql).toMatch(/max\(\s*extensions\.similarity/);
  });

  // @req REQ-125
  it("adds no table, so no policy is owed", () => {
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });

  // @req REQ-125
  it("scores a form without its qualifier, and only scores it", () => {
    expect(sql).toContain("regexp_replace");
  });
});
