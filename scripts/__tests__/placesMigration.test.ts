import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { auditRlsCoverage } from "../ci/checkRlsCoverage";

const FILE = "100_afrik_places.sql";
const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations", FILE),
  "utf8"
).toLowerCase();

describe("100_afrik_places.sql migration contract", () => {
  // @req REQ-196
  it("creates the places table with its country link and name_history", () => {
    expect(migration).toMatch(
      /create table if not exists public\.afrik_places \(/
    );
    expect(migration).toMatch(
      /country_id char\(3\) not null references public\.afrik_countries\(id\)/
    );
    expect(migration).toMatch(/name_history jsonb/);
    expect(migration).toMatch(/check \(id ~ '\^loc_\[a-z0-9_\]\+\$'\)/);
  });

  // @req REQ-196
  it("joins a place to its associated peoples", () => {
    expect(migration).toMatch(
      /create table if not exists public\.afrik_place_peoples \(/
    );
    expect(migration).toMatch(
      /people_id varchar\(50\) not null references public\.afrik_peoples\(id\)/
    );
    expect(migration).toMatch(/primary key \(place_id, people_id\)/);
  });

  // @req REQ-196
  it("puts both tables behind RLS with a public read and no anon write", () => {
    const audit = auditRlsCoverage([
      {
        path: FILE,
        sql: readFileSync(
          resolve(process.cwd(), "supabase/migrations", FILE),
          "utf8"
        ),
      },
    ]);
    expect(audit.tablesWithoutRls).toEqual([]);
    expect(audit.liveTables).toEqual(["afrik_place_peoples", "afrik_places"]);
    expect(migration).toMatch(
      /create policy afrik_places_read_public on public\.afrik_places\s+for select using \(true\)/
    );
    expect(migration).toMatch(
      /create policy afrik_place_peoples_read_public on public\.afrik_place_peoples\s+for select using \(true\)/
    );
    expect(migration).not.toMatch(/for (insert|update|delete|all)/);
  });

  // @req REQ-196
  it("ranks places on every name their nameHistory records, on the cross-kind score", () => {
    expect(migration).toMatch(
      /create or replace function public\.afrik_search_places\(/
    );
    expect(migration).toContain("name_history -> 'names'");
    expect(migration).toContain("public.afrik_search_normalized_score(");
    expect(migration).toContain("security invoker");
    expect(migration).toMatch(
      /grant execute on function public\.afrik_search_places\(text, int, int\)\s+to anon, authenticated, service_role;/
    );
  });
});
