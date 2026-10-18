/**
 * Static contract for the migration that makes every name a fiche's history
 * tells an exact search answer (ETNI-2093). Unit tests reach no live Supabase,
 * so these pin what the migration a human never applies by hand has to say;
 * the behaviour itself is checked on recette after the merge (see the
 * verification block in the migration).
 *
 * The file is found by its name, not its number: a parallel migration may
 * take the number first, and the one that merges second renames its file.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrations = path.resolve(process.cwd(), "supabase/migrations");
const file = readdirSync(migrations).find((name) =>
  /^\d{3}_exact_answers_from_name_history\.sql$/.test(name)
);
const sql = file ? readFileSync(path.join(migrations, file), "utf8") : "";

/** The text of one re-issued function, from its header to its closing `$$;`. */
function body(name: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
  if (start < 0) return "";
  const end = sql.indexOf("$$;", start);
  return sql.slice(start, end < 0 ? undefined : end);
}

const SEARCH_FUNCTIONS = [
  {
    name: "afrik_search_peoples",
    signature:
      /CREATE OR REPLACE FUNCTION public\.afrik_search_peoples\(\s*p_q\s+TEXT\s+DEFAULT NULL,\s*p_limit\s+INT\s+DEFAULT 20,\s*p_offset\s+INT\s+DEFAULT 0,\s*p_classification_status\s+TEXT\s+DEFAULT NULL,\s*p_min_confidence\s+NUMERIC\s+DEFAULT NULL,\s*p_since_verified_after\s+TIMESTAMPTZ\s+DEFAULT NULL,\s*p_family_id\s+TEXT\s+DEFAULT NULL,\s*p_country_id\s+TEXT\s+DEFAULT NULL,\s*p_lang\s+TEXT\s+DEFAULT 'fr'\s*\)/,
    types: "TEXT, INT, INT, TEXT, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT",
    table: "p",
  },
  {
    name: "afrik_search_countries",
    signature:
      /CREATE OR REPLACE FUNCTION public\.afrik_search_countries\(\s*p_q\s+TEXT DEFAULT NULL,\s*p_limit\s+INT\s+DEFAULT 20,\s*p_offset\s+INT\s+DEFAULT 0,\s*p_lang\s+TEXT DEFAULT 'fr'\s*\)/,
    types: "TEXT, INT, INT, TEXT",
    table: "c",
  },
  {
    name: "afrik_search_language_families",
    signature:
      /CREATE OR REPLACE FUNCTION public\.afrik_search_language_families\(\s*p_q\s+TEXT DEFAULT NULL,\s*p_limit\s+INT\s+DEFAULT 20,\s*p_offset\s+INT\s+DEFAULT 0,\s*p_lang\s+TEXT DEFAULT 'fr'\s*\)/,
    types: "TEXT, INT, INT, TEXT",
    table: "f",
  },
  {
    name: "afrik_search_languages",
    signature:
      /CREATE OR REPLACE FUNCTION public\.afrik_search_languages\(\s*p_q\s+TEXT DEFAULT NULL,\s*p_limit\s+INT\s+DEFAULT 20,\s*p_offset\s+INT\s+DEFAULT 0,\s*p_lang\s+TEXT DEFAULT 'fr'\s*\)/,
    types: "TEXT, INT, INT, TEXT",
    table: "l",
  },
  {
    name: "afrik_search_patronymes",
    signature:
      /CREATE OR REPLACE FUNCTION public\.afrik_search_patronymes\(\s*p_q\s+TEXT\s+DEFAULT NULL,\s*p_limit\s+INT\s+DEFAULT 20,\s*p_offset\s+INT\s+DEFAULT 0,\s*p_exact_elsewhere\s+BOOLEAN\s+DEFAULT FALSE\s*\)/,
    types: "TEXT, INT, INT, BOOLEAN",
    table: "p",
  },
] as const;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("history names are exact answers (ETNI-2093)", () => {
  // @req REQ-135
  it("is one numbered migration", () => {
    expect(file).toBeDefined();
  });

  // @req REQ-135
  it("defines the exact-answer key as an immutable fold over afrik_unaccent", () => {
    const key = body("afrik_name_key");

    expect(key).toMatch(/afrik_name_key\(p_text TEXT\)\s+RETURNS TEXT/);
    expect(key).toMatch(/IMMUTABLE\s+PARALLEL SAFE/);
    expect(key).toContain("SET search_path = public, extensions, pg_temp");
    expect(key).toContain("public.afrik_unaccent(lower(btrim(COALESCE(p_text");
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.afrik_name_key\(TEXT\) FROM PUBLIC/
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.afrik_name_key\(TEXT\)\s+TO anon, authenticated, service_role/
    );
  });

  // @req REQ-135
  it("translates exactly ɔ and Ɔ to o and deletes ʿ and ʾ", () => {
    const translations = [
      ...body("afrik_name_key").matchAll(
        /translate\([\s\S]*?'([^']*)',\s*'([^']*)'\)/g
      ),
    ].map(([, from, to]) => [from, to]);

    expect(translations).toEqual([["ɔƆʿʾ", "oo"]]);
  });

  describe.each(SEARCH_FUNCTIONS)(
    "$name",
    ({ name, signature, types, table }) => {
      const fn = body(name);

      // @req REQ-135
      it("keeps its signature, so PostgREST sees no overload", () => {
        expect(sql).toMatch(signature);
        expect(sql).not.toMatch(
          new RegExp(`DROP FUNCTION[^;]*public\\.${name}\\(`)
        );
        expect(sql).toMatch(
          new RegExp(
            `REVOKE ALL ON FUNCTION public\\.${name}\\(${escape(types)}\\) FROM PUBLIC`
          )
        );
        expect(sql).toMatch(
          new RegExp(
            `GRANT EXECUTE ON FUNCTION public\\.${name}\\(${escape(types)}\\)\\s+TO anon, authenticated, service_role`
          )
        );
      });

      // @req REQ-135
      it("folds the query with afrik_name_key for its exact answer", () => {
        expect(fn).toContain(
          "ELSE public.afrik_name_key(p_q) END AS exact_key"
        );
        // No exact comparison is left on the older fold alone.
        expect(fn).not.toMatch(
          /afrik_unaccent\(lower\([\w.]+\)\)\s*=\s*q\.exact_key/
        );
        expect(fn).not.toMatch(/\bname_key\s*=\s*q\.exact_key/);
      });

      // @req REQ-135
      it("answers exactly on every nameText of its history, read as an array", () => {
        expect(fn).toContain(
          `CASE WHEN jsonb_typeof(${table}.name_history -> 'names') = 'array'`
        );
        expect(fn).toMatch(
          /public\.afrik_name_key\(n\.value ->> 'nameText'\) = q\.exact_key/
        );
      });

      // @req REQ-135
      it("admits a row answered only by its history", () => {
        expect(fn).toMatch(/OR x\.exact_match/);
      });

      // @req REQ-135
      it("carries the history's names on each row, in history order", () => {
        expect(fn).toMatch(
          /jsonb_agg\(n\.value ->> 'nameText' ORDER BY n\.ord\)/
        );
        expect(fn).toContain(`AS "historyNames"`);
        expect(fn).toContain("'[]'::jsonb) AS \"historyNames\"");
      });
    }
  );

  // @req REQ-201
  it("keeps the phonetic withholding on exact answers, history names included", () => {
    const patronymes = body("afrik_search_patronymes");

    expect(patronymes).toMatch(/AND NOT x\.exact_match/);
    expect(patronymes).toMatch(
      /EXISTS \(SELECT 1 FROM matched\s+WHERE exact_match\)/
    );
  });

  // @req REQ-135
  it("groups the Appellations nomenclature on the same key", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE VIEW public\.afrik_name_forms\s+WITH \(security_invoker = true\) AS/
    );
    expect(sql).toContain("public.afrik_name_key(nr.name_text) AS form_key");
    expect(sql).toMatch(/GROUP BY public\.afrik_name_key\(nr\.name_text\)/);
    expect(sql).toMatch(
      /GRANT SELECT ON public\.afrik_name_forms TO anon, authenticated/
    );
  });

  // @req REQ-135
  it("adds no table, so no policy is owed", () => {
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });

  // @req REQ-135
  it("leaves afrik_unaccent alone: generated columns and indexes depend on it", () => {
    expect(sql).not.toMatch(/FUNCTION public\.afrik_unaccent/);
  });
});
