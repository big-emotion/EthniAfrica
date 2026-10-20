/**
 * Static contract for the recorded-term index (migration 115, ETNI-2110).
 *
 * Unit tests reach no live Supabase, so these pin what the migration a human
 * will apply has to say. The behaviour itself, the same answers as migration
 * 112's walk and a few milliseconds instead of 29 s, is measured against the
 * real corpus with the verification block at the end of the migration.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS = path.resolve(process.cwd(), "supabase/migrations");
const INDEX_MIGRATION = "115_afrik_recorded_words_index.sql";

const readMigration = (file: string) =>
  readFileSync(path.join(MIGRATIONS, file), "utf8");

/** What a migration executes: no comment line and no COMMENT ON statement. */
const executable = (text: string) =>
  text
    .replace(/^--.*\n/gm, "")
    .replace(/COMMENT ON (FUNCTION|TABLE)[^;]*;\n/g, "");

const sql = executable(readMigration(INDEX_MIGRATION));

/** The fiche tables recorded-term search reads, and the kind each answers as. */
const FICHE_TABLES: [table: string, kind: string][] = [
  ["afrik_peoples", "people"],
  ["afrik_countries", "country"],
  ["afrik_language_families", "family"],
  ["afrik_languages", "language"],
  ["afrik_patronymes", "patronyme"],
  ["persons", "person"],
  ["afrik_places", "place"],
  ["afrik_words", "word"],
];

describe("afrik_recorded_words index (migration 115)", () => {
  // The search reads an index; a walk of every fiche is what timed out.
  // @req REQ-125
  it("is the latest definition of afrik_search_recorded_term, and reads the index", () => {
    const issuing = readdirSync(MIGRATIONS)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .filter((file) =>
        /CREATE OR REPLACE FUNCTION public\.afrik_search_recorded_term\(/.test(
          readMigration(file)
        )
      );
    expect(issuing[issuing.length - 1]).toBe(INDEX_MIGRATION);

    const start = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.afrik_search_recorded_term("
    );
    const definition = sql.slice(start, sql.indexOf("$$;", start));
    expect(definition).toContain("FROM public.afrik_recorded_words");
    expect(definition).not.toMatch(/WITH RECURSIVE/);
    expect(definition).toMatch(/SECURITY INVOKER/);
  });

  // @req REQ-125
  it("keeps one row per fiche of every table the search read before", () => {
    for (const [table, kind] of FICHE_TABLES) {
      expect(sql).toContain(
        `AFTER INSERT OR UPDATE OR DELETE ON public.${table}\n  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('${kind}')`
      );
      expect(sql).toMatch(
        new RegExp(
          String.raw`SELECT '${kind}', t\.id::text,\n\s+public\.afrik_recorded_word_paths\(public\.afrik_search_document\('${kind}', to_jsonb\(t\)\)\)\n\s+FROM public\.${table} t;`
        )
      );
    }
  });

  // @req REQ-125
  it("builds every kind's document from the fields migration 112 read", () => {
    const previous = executable(
      readMigration("112_afrik_search_recorded_term.sql")
    );
    // `'key', alias.column` pairs; the `alias.id` ones are the kind literals.
    const inline = [
      ...previous.matchAll(/'([a-z_]+)', [a-z]\.(?!id\b)[a-z_]+/g),
    ]
      .map((match) => match[1])
      .filter((key) => !["kind", "id", "recorded_in"].includes(key));
    expect(inline.length).toBeGreaterThan(20);
    for (const field of new Set(inline)) {
      expect(sql).toContain(`'${field}', p_row -> '${field}'`);
    }
  });

  // The walk is migration 112's, so a note records provenance and never counts.
  // @req REQ-125
  it("leaves out sources[].notes, as migration 112 did", () => {
    expect(sql).toContain("child.key = 'notes' AND 'sources' = ANY(n.path)");
  });

  // A table with no RLS is writable by anyone holding the anon key.
  // @req REQ-125
  it("is read-only to the public roles", () => {
    expect(sql).toContain(
      "ALTER TABLE public.afrik_recorded_words ENABLE ROW LEVEL SECURITY;"
    );
    expect(sql).toMatch(
      /CREATE POLICY afrik_recorded_words_read ON public\.afrik_recorded_words\n\s+FOR SELECT TO anon, authenticated USING \(true\);/
    );
    expect(sql).toContain(
      "REVOKE ALL ON public.afrik_recorded_words FROM PUBLIC, anon, authenticated;"
    );
    expect(sql).toContain(
      "GRANT SELECT ON public.afrik_recorded_words TO anon, authenticated, service_role;"
    );
    expect(sql).not.toMatch(
      /GRANT (INSERT|UPDATE|DELETE|ALL)[^;]*afrik_recorded_words/
    );
  });

  // The loader's role holds no write grant on the index, so the triggers write
  // as their owner.
  // @req REQ-125
  it("writes through a SECURITY DEFINER trigger with a pinned search_path", () => {
    const start = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.afrik_recorded_words_maintain()"
    );
    const definition = sql.slice(start, sql.indexOf("$$;", start));
    expect(definition).toMatch(/SECURITY DEFINER/);
    expect(definition).toMatch(/SET search_path = public, extensions, pg_temp/);
  });

  // The backfill folds the whole corpus; the migration role's default timeout
  // must not cut it.
  // @req REQ-125
  it("lifts the statement timeout for its own transaction only", () => {
    expect(sql).toContain("SET LOCAL statement_timeout = 0;");
    expect(sql).not.toMatch(/^SET statement_timeout/m);
  });
});
