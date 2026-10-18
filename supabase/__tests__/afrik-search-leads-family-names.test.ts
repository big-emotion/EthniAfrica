/**
 * Static contract for migration 110 (DEC-075). Unit tests reach no live
 * Supabase, so these pin what the migration a human will apply has to say;
 * the measured similarities are checked on recette with the verification
 * block at the end of the migration.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { NOT_ONE_NAME } from "@/lib/search/__fixtures__/corpusNameModel";

const sql = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/110_afrik_search_leads_family_names.sql"
  ),
  "utf8"
);

/** The best-scoring form, the filed name first on a tie. */
const BEST_FORM =
  /\(array_agg\(form\.value ORDER BY extensions\.similarity\(public\.afrik_unaccent\(lower\(form\.value\)\), q\.exact_key\) DESC, \(form\.value = p\.name_main\) DESC, form\.value\)\)\[1\] AS matched_form,/;

/**
 * The people branch's one filter over 094: a form other than the filed name
 * is scored only when, without its trailing bracket, it is one name.
 */
const PEOPLE_FORM_FILTER = `    WHERE btrim(raw.value) <> '' AND (raw.value = p.name_main OR regexp_replace(raw.value, '\\s*\\([^)]*\\)\\s*$', '') !~ '${NOT_ONE_NAME}')`;

/** The SQL of the family-name branch, from its kind literal to the next CTE. */
function familyNameBranch(): string {
  const start = sql.indexOf("'patronyme'::text AS kind");
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf("matched AS (", start);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

describe("near-miss leads over family names (migration 110)", () => {
  // @req REQ-125
  it("keeps the signature and grants of 084 and 094, so PostgREST sees no overload", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.afrik_search_leads\(\s*p_q\s+TEXT DEFAULT NULL,\s*p_limit INT\s+DEFAULT 3,\s*p_lang\s+TEXT DEFAULT 'fr'\s*\)/
    );
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
  it("scores only the forms that begin with the query's first letter, both folded", () => {
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

  // @req REQ-125
  it("leaves the people, country and family branches of 094 as they were", () => {
    const original = readFileSync(
      path.resolve(
        process.cwd(),
        "supabase/migrations/094_afrik_search_leads_recorded_forms.sql"
      ),
      "utf8"
    );
    const branches = (text: string) =>
      text.slice(
        text.indexOf("candidates AS ("),
        text.indexOf("WHERE length(q.exact_key) >= 3\n),")
      );
    // Each branch gains one line naming the form that scored, and the people
    // branch one filter: a form that is not one name is not scored (eighth
    // review of brief 16). Nothing else of 094 changes.
    const as094 = (text: string) =>
      text
        .split("\n")
        .filter((line) => !line.includes("AS matched_form,"))
        .map((line) =>
          line === PEOPLE_FORM_FILTER
            ? "    WHERE btrim(raw.value) <> ''"
            : line
        )
        .join("\n");

    expect(sql).toContain(PEOPLE_FORM_FILTER);
    expect(as094(branches(sql)).startsWith(branches(original))).toBe(true);
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

  // A self-appellation is split on its commas alone, so « Baganda (sg.
  // Muganda, pl. Abaganda) » gives « pl. Abaganda) ». Such a piece is not
  // scored: a lead is offered only under a form that is one name and that
  // itself scored. Naming the filed name instead said that Kumam resembles
  // « akokolemou » at 0.00. The filed name stays scored, slash included: it
  // is how the fiche is filed. The pattern is the one the corpus model
  // applies (corpusNameModel.ts), so the model's corpus-wide test holds
  // what this SQL scores.
  // @req REQ-125
  it("scores no form of a people that is not one name, and names the form that scored", () => {
    const people = sql.slice(
      sql.indexOf("'people'::text AS kind"),
      sql.indexOf("'country'::text AS kind")
    );

    expect(people).toContain(PEOPLE_FORM_FILTER);
    expect(people).toMatch(BEST_FORM);
    expect(sql).not.toMatch(/CASE WHEN form\.value [~]/);
    const comment = sql.slice(sql.indexOf("COMMENT ON FUNCTION"));
    expect(comment).toMatch(/not one name/);
    expect(comment).not.toMatch(/names its filed name instead/);
  });

  // @req REQ-125
  it("adds no table, so no policy is owed", () => {
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });
});
