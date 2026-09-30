import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/095_source_derived_from.sql"),
  "utf8"
).toLowerCase();

describe("095_source_derived_from.sql migration contract", () => {
  // @req REQ-019
  it("adds a nullable link from a source to the source it repeats", () => {
    expect(migration).toContain("alter table sources");
    expect(migration).toContain(
      "add column if not exists derived_from_source_id"
    );
    expect(migration).toMatch(
      /derived_from_source_id\s+uuid\s+references\s+sources\s*\(\s*id\s*\)/
    );
    const columnDeclaration =
      /add column if not exists derived_from_source_id[^;]*;/.exec(migration);
    expect(columnDeclaration).not.toBeNull();
    expect(columnDeclaration[0]).not.toContain("not null");
  });

  // @req REQ-019
  it("lets a deleted origin leave the copy standing instead of deleting it", () => {
    expect(migration).toContain("on delete set null");
  });

  // @req REQ-019
  it("refuses a source that claims to derive from itself", () => {
    expect(migration).toMatch(
      /derived_from_source_id\s+is\s+distinct\s+from\s+id/
    );
  });

  // @req REQ-019
  it("stays idempotent so a replay on an applied database changes nothing", () => {
    expect(migration).toContain("if not exists");
    expect(migration).toMatch(/pg_constraint/);
  });
});
