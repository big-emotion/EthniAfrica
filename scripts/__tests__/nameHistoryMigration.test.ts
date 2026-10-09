import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/098_name_history.sql"),
  "utf8"
).toLowerCase();

const NAMED_SUBJECT_TABLES = [
  "afrik_peoples",
  "afrik_languages",
  "afrik_language_families",
  "afrik_countries",
  "afrik_patronymes",
];

describe("098_name_history.sql migration contract", () => {
  // @req REQ-196
  it.each(NAMED_SUBJECT_TABLES)(
    "adds a nullable name_history jsonb column to %s, idempotently",
    (table) => {
      expect(migration).toMatch(
        new RegExp(
          `alter table public\\.${table}\\s+add column if not exists name_history jsonb;`
        )
      );
    }
  );

  // @req REQ-196
  it("creates no table, so the existing RLS policies cover the column", () => {
    expect(migration).not.toContain("create table");
    expect(migration).not.toContain("not null");
  });
});
