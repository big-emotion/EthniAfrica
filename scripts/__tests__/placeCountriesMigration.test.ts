import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { auditRlsCoverage } from "../ci/checkRlsCoverage";

const FILE = "106_afrik_place_countries.sql";
const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations", FILE),
  "utf8"
);
const migration = sql.toLowerCase();

describe("106_afrik_place_countries.sql migration contract", () => {
  // A region such as the Sahara has no single country.
  // @req REQ-193
  it("lets a place have no single country", () => {
    expect(migration).toMatch(
      /alter table public\.afrik_places\s+alter column country_id drop not null;/
    );
  });

  // @req REQ-193
  it("joins a place to every country it lies in, in the fiche's order", () => {
    expect(migration).toMatch(
      /create table if not exists public\.afrik_place_countries \(/
    );
    expect(migration).toMatch(
      /place_id text not null references public\.afrik_places\(id\) on delete cascade/
    );
    expect(migration).toMatch(
      /country_id char\(3\) not null references public\.afrik_countries\(id\) on delete cascade/
    );
    expect(migration).toMatch(/position smallint not null/);
    expect(migration).toMatch(/primary key \(place_id, country_id\)/);
  });

  // Places already loaded keep their country until the next corpus load.
  // @req REQ-193
  it("copies each existing place's country into the join table", () => {
    expect(migration).toMatch(
      /insert into public\.afrik_place_countries \(place_id, country_id, position\)\s+select id, country_id, 0\s+from public\.afrik_places\s+where country_id is not null\s+on conflict do nothing;/
    );
  });

  // @req REQ-193
  it("puts the join table behind RLS with a public read and no anon write", () => {
    const audit = auditRlsCoverage([{ path: FILE, sql }]);
    expect(audit.tablesWithoutRls).toEqual([]);
    expect(audit.liveTables).toEqual(["afrik_place_countries"]);
    expect(migration).toMatch(
      /create policy afrik_place_countries_read_public on public\.afrik_place_countries\s+for select using \(true\)/
    );
    expect(migration).not.toMatch(/for (insert|update|delete|all)/);
  });

  // @req REQ-193
  it("returns every country of a place hit in search", () => {
    expect(migration).toMatch(
      /create or replace function public\.afrik_search_places\(/
    );
    expect(migration).toContain('as "countryids"');
    expect(migration).toContain("order by pc.position");
    expect(migration).toContain("security invoker");
    expect(migration).toMatch(
      /grant execute on function public\.afrik_search_places\(text, int, int\)\s+to anon, authenticated, service_role;/
    );
  });
});
