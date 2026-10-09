import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { auditRlsCoverage } from "../ci/checkRlsCoverage";

const FILE = "104_afrik_words.sql";
const source = readFileSync(
  resolve(process.cwd(), "supabase/migrations", FILE),
  "utf8"
);
const migration = source.toLowerCase();

describe("104_afrik_words.sql migration contract", () => {
  // @req REQ-196
  it("creates the words table, whose nameHistory is required", () => {
    expect(migration).toMatch(
      /create table if not exists public\.afrik_words \(/
    );
    expect(migration).toMatch(/check \(id ~ '\^wrd_\[a-z0-9_\]\+\$'\)/);
    expect(migration).toMatch(/name_history jsonb not null/);
  });

  // @req REQ-196
  it("puts the table behind RLS with a public read and no anon write", () => {
    const audit = auditRlsCoverage([{ path: FILE, sql: source }]);
    expect(audit.tablesWithoutRls).toEqual([]);
    expect(audit.liveTables).toEqual(["afrik_words"]);
    expect(migration).toMatch(
      /create policy afrik_words_read_public on public\.afrik_words\s+for select using \(true\)/
    );
    expect(migration).not.toMatch(/for (insert|update|delete|all)/);
  });

  // @req REQ-196
  it("ranks words on every name their nameHistory records, on the cross-kind score", () => {
    expect(migration).toMatch(
      /create or replace function public\.afrik_search_words\(/
    );
    expect(migration).toContain("name_history -> 'names'");
    expect(migration).toContain("public.afrik_search_normalized_score(");
    expect(migration).toContain("security invoker");
    expect(migration).toMatch(
      /grant execute on function public\.afrik_search_words\(text, int, int\)\s+to anon, authenticated, service_role;/
    );
  });
});
