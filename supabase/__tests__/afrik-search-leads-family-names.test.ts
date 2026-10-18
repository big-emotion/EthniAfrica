/**
 * Static contract for `afrik_search_leads` as the latest migration that
 * defines it (REQ-125, DEC-075). Migrations 110 and 111 are applied on
 * recette and stay as they were: 111 cut a lower-case class prefix at four
 * letters and dropped the self-names abakwaManala and abakwaNdzundza, and 112
 * re-issues the function with eight. Unit tests reach no live Supabase, so
 * these pin what the migration a human will apply has to say; the measured
 * similarities are checked on recette with the verification block at the end
 * of the migration.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  NAME_PIECE_SEPARATOR,
  ONE_NAME,
} from "@/lib/search/__fixtures__/corpusNameModel";

const MIGRATIONS = path.resolve(process.cwd(), "supabase/migrations");
const ONE_NAME_MIGRATION = "111_afrik_search_leads_one_name.sql";
const PREFIX_CAP_MIGRATION = "112_afrik_search_leads_prefix_cap.sql";

const readMigration = (file: string) =>
  readFileSync(path.join(MIGRATIONS, file), "utf8");

/**
 * The migration the database answers with: the highest-numbered one that
 * issues the function. Following it holds the next migration that re-issues
 * the function to the same contract without editing this test.
 */
function latestDefinition(): string {
  const issuing = readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .filter((file) =>
      /CREATE OR REPLACE FUNCTION public\.afrik_search_leads\(/.test(
        readMigration(file)
      )
    );
  return issuing[issuing.length - 1];
}

const latest = latestDefinition();
const sql = readMigration(latest);

/**
 * What a migration executes: no comment line and no COMMENT ON statement,
 * which tell each migration's own history.
 */
const executable = (text: string) =>
  text
    .replace(/^--.*\n/gm, "")
    .replace(/COMMENT ON FUNCTION[^\n]*\n[^\n]*;\n/, "");

/** The best-scoring form, the filed name first on a tie. */
const BEST_FORM =
  /\(array_agg\(form\.value ORDER BY extensions\.similarity\(public\.afrik_unaccent\(lower\(form\.value\)\), q\.exact_key\) DESC, \(form\.value = p\.name_main\) DESC, form\.value\)\)\[1\] AS matched_form,/;

/** A SQL string literal of a model pattern: its single quotes doubled. */
const literal = (pattern: string) => `'${pattern.replaceAll("'", "''")}'`;

/** The SQL of the people branch, from its kind literal to the next branch. */
function peopleBranch(): string {
  const start = sql.indexOf("'people'::text AS kind");
  const end = sql.indexOf("'country'::text AS kind", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

/** The SQL of the family-name branch, from its kind literal to the next CTE. */
function familyNameBranch(): string {
  const start = sql.indexOf("'patronyme'::text AS kind");
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf("matched AS (", start);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

describe("near-miss leads, as the latest migration re-issues them", () => {
  // @req REQ-125
  it("is migration 112 or a later one, so the prefix cap correction is never dropped", () => {
    expect(Number.parseInt(latest.slice(0, 3), 10)).toBeGreaterThanOrEqual(112);
  });

  // @req REQ-125
  it("keeps the signature and grants of 084, 094 and 110, so PostgREST sees no overload", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.afrik_search_leads\(\s*p_q\s+TEXT DEFAULT NULL,\s*p_limit INT\s+DEFAULT 3,\s*p_lang\s+TEXT DEFAULT 'fr'\s*\)/
    );
    expect(sql.match(/CREATE (OR REPLACE )?FUNCTION/g) ?? []).toHaveLength(1);
    expect(sql).toContain("SECURITY INVOKER");
    expect(sql).toContain("SET search_path = public, extensions, pg_temp");
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.afrik_search_leads\(TEXT, INT, TEXT\) FROM PUBLIC/
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.afrik_search_leads\(TEXT, INT, TEXT\)\s+TO anon, authenticated, service_role/
    );
  });

  // @req REQ-125
  it("scans the family names under their filed name and their recorded spellings", () => {
    const branch = familyNameBranch();

    expect(branch).toContain("FROM public.afrik_patronymes p");
    expect(branch).toContain("p.name_main AS name");
    expect(branch).toContain("'{spellings}'");
    expect(branch).toMatch(
      /jsonb_typeof\(p\.content #> '\{spellings\}'\) = 'array'/
    );
  });

  // Bukasa is an island and a Mukasa a person from it: two names that begin
  // differently are two names, so only a form sharing the query's first
  // letter, both folded as the search folds them, is a candidate.
  // @req REQ-125
  it("scores only the family-name forms that begin with the query's first letter, both folded", () => {
    expect(familyNameBranch()).toMatch(
      /left\(public\.afrik_unaccent\(lower\(form\.value\)\), 1\)\s*=\s*left\(q\.exact_key, 1\)/
    );
  });

  // At 0.2, « tchikaya » would also offer Tchalla (0.21) and « bukasa »
  // Bukuru (0.27): the family-name search's own 0.4 keeps them out.
  // @req REQ-125
  it("keeps a family name at 0.4 while the other kinds keep 0.2", () => {
    expect(sql).toMatch(/kind = 'patronyme' AND similarity >= 0\.4/);
    expect(sql).toMatch(/kind <> 'patronyme' AND similarity >= 0\.2/);
  });

  // Peoples and countries outscoring a family name must not push it out of
  // the rows, nor family names push a people out of the similar-names shelf.
  // @req REQ-125
  it("limits the family names apart from the other kinds", () => {
    const limits = sql.match(/LIMIT COALESCE\(p_limit, 3\)/g) ?? [];
    expect(limits).toHaveLength(2);
    expect(sql).toMatch(
      /WHERE kind <> 'patronyme'[\s\S]*?LIMIT COALESCE\(p_limit, 3\)/
    );
    expect(sql).toMatch(
      /WHERE kind = 'patronyme'[\s\S]*?LIMIT COALESCE\(p_limit, 3\)/
    );
  });

  // Countries and language families keep 094's scan; each gains one line
  // naming the form that scored (110). Only the people branch changes after
  // 094.
  // @req REQ-125
  it("leaves the country and language-family branches of 094 as they were", () => {
    const original = readMigration("094_afrik_search_leads_recorded_forms.sql");
    const countryAndFamily = (text: string) =>
      text
        .slice(
          text.indexOf("  SELECT 'country'::text AS kind"),
          text.indexOf(
            "WHERE length(q.exact_key) >= 3\n",
            text.indexOf("'family'::text AS kind")
          )
        )
        .split("\n")
        .filter((line) => !line.includes("AS matched_form,"))
        .join("\n");

    expect(countryAndFamily(sql)).toBe(countryAndFamily(original));
  });

  // The one-name rule (brief 16, ninth and tenth reviews): the filed name,
  // the self-appellation and each exonym are cut at « , », « ; », « ou » and
  // a slash between spaces, never inside a bracket nor at a slash inside a
  // word (« Hai//om »); each piece loses its trailing bracket and is scored
  // only when it is one name. The patterns are the model's
  // (corpusNameModel.ts), so the model's corpus-wide tests hold what this SQL
  // scores.
  // @req REQ-125
  it("cuts a people's name fields into pieces and scores only the pieces that are one name", () => {
    const people = peopleBranch();

    expect(sql).toContain(`${literal(ONE_NAME)}::text AS one_name`);
    // « abakwaManala » opens on a class prefix of six letters: a cap of four
    // dropped it while the exonyms of its people still scored.
    expect(sql).toContain("[[:lower:]]{1,8}[[:upper:]]");
    expect(sql).not.toContain("[[:lower:]]{1,4}");
    expect(people).toContain("p.name_main AS value");
    expect(people).toContain("'{appellations,selfAppellation}'");
    expect(people).toContain("'{appellations,exonyms}'");
    expect(people).toContain(
      `regexp_split_to_table(field.value, ${literal(NAME_PIECE_SEPARATOR)})`
    );
    expect(people).toContain(
      "btrim(regexp_replace(cut.value, '\\s*\\([^)]*\\)\\s*$', ''))"
    );
    expect(people).toContain("WHERE piece.value ~ q.one_name");
    expect(people).not.toContain("string_to_array(");
    expect(people).not.toContain("p.name_main OR");
  });

  // A family name keeps its filed name, as filed; each recorded spelling is
  // scored only when it is one name (« da Costa » is not).
  // @req REQ-125
  it("scores a family name's recorded spelling only when it is one name", () => {
    const branch = familyNameBranch();

    expect(branch).toContain("OR recorded.value ~ q.one_name");
    expect(branch).toContain("p.name_main AS value, true AS filed");
  });

  // The page names the form that scored, not the filed name: « jarra »
  // reaches Diarra through its spelling Jara, and Diarra itself begins with
  // another letter. On a tie the filed name is the one named.
  // @req REQ-125
  it("returns the form that scored beside the filed name, in every branch", () => {
    expect(sql.match(/AS matched_form,/g) ?? []).toHaveLength(4);
    expect(familyNameBranch()).toMatch(BEST_FORM);
    expect(sql.match(/localized\.name AS matched_form,/g) ?? []).toHaveLength(
      2
    );
    const comment = sql.slice(sql.indexOf("COMMENT ON FUNCTION"));
    expect(comment).toMatch(/matched_form/);
  });

  // A lead is named by the piece that scored best, and by nothing else: no
  // fallback to a filed name that did not itself score.
  // @req REQ-125
  it("names a people lead by the piece that scored, and says so in its comment", () => {
    expect(peopleBranch()).toMatch(BEST_FORM);
    expect(sql).not.toMatch(/CASE WHEN form\.value [~]/);
    const comment = sql.slice(sql.indexOf("COMMENT ON FUNCTION"));
    expect(comment).toMatch(/one name/);
    expect(comment).toMatch(/click/);
    expect(comment).toMatch(/« a-liyan »/);
    expect(comment).toMatch(
      /class prefix of up to eight lower-case letters before a capital/
    );
    expect(comment).toMatch(/Migration 112, which supersedes migration 111/);
    expect(comment).not.toMatch(/Besides its filed name/);
  });

  // @req REQ-125
  it("adds no table, so no policy is owed", () => {
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });
});

// 111 is applied on recette, so the cap fix is a new migration and 111 is not
// edited. These two checks hold 111 where it was applied and hold 112 to the
// one change it exists for.
describe("migration 112 corrects the class prefix cap of the applied migration 111", () => {
  // @req REQ-125
  it("leaves 111 as applied: the same rule with a class prefix capped at four letters", () => {
    const applied = readMigration(ONE_NAME_MIGRATION);
    expect(applied).toContain("[[:lower:]]{1,4}[[:upper:]]");
    expect(applied).not.toContain("{1,8}");
    expect(applied).toMatch(
      /Migration 111, which supersedes the people branch of 110/
    );
  });

  // @req REQ-125
  it("executes 111's function and grants with the class prefix cap raised from four to eight, and nothing else", () => {
    const applied = readMigration(ONE_NAME_MIGRATION);
    const correction = readMigration(PREFIX_CAP_MIGRATION);
    expect(executable(correction)).toBe(
      executable(applied).replace(
        "[[:lower:]]{1,4}[[:upper:]]",
        "[[:lower:]]{1,8}[[:upper:]]"
      )
    );
  });
});
