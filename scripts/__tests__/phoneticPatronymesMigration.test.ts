/**
 * Static contract of migration 108 (REQ-201, ETNI-2046): a family name the
 * search reaches only through its phonetic key is offered only when nothing
 * answers the query exactly.
 *
 * No migration is applied from this repository's automation, so the SQL text
 * is what CI can gate on; the migrations-replay workflow proves it compiles.
 * What a reviewer cannot check by eye is which rows the new predicate may
 * withhold, and that the count and the page are both taken after it.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { auditRlsCoverage } from "../ci/checkRlsCoverage";

const FILE = "108_phonetic_patronymes_without_exact_answer.sql";
const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations", FILE),
  "utf8"
);
const migration = sql.toLowerCase();

/** One CTE of the function body, from its name to the next top-level CTE. */
function cte(name: string): string {
  const start = migration.indexOf(`\n${name} as (`);
  expect(start, `${name} is not a CTE of the function`).toBeGreaterThan(-1);
  const next = migration.slice(start + 1).search(/\n[a-z_]+ as \(|\nselect /);
  return next === -1
    ? migration.slice(start)
    : migration.slice(start, start + 1 + next);
}

/** The expression that defines phonetic_only: the column after exact_match. */
function phoneticOnlyPredicate(): string {
  const matched = cte("matched");
  const start = matched.indexOf("as exact_match,");
  const end = matched.indexOf("as phonetic_only");
  expect(start, "matched does not project exact_match").toBeGreaterThan(-1);
  expect(end, "matched does not project phonetic_only").toBeGreaterThan(start);
  return matched.slice(start, end);
}

describe(`${FILE} — the phonetic bridge yields to an exact answer`, () => {
  // A second parameter list beside the old one is an overload, and PostgREST
  // answers an overloaded name with PGRST203: the old signature goes first.
  // @req REQ-201
  it("replaces the three-argument function with one taking p_exact_elsewhere", () => {
    const drop = migration.indexOf(
      "drop function if exists public.afrik_search_patronymes(text, int, int);"
    );
    const create = migration.indexOf(
      "create or replace function public.afrik_search_patronymes("
    );
    expect(drop).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(drop);
    expect(migration).toMatch(/p_exact_elsewhere\s+boolean\s+default\s+false/);
  });

  // An old caller that sends three named parameters still gets today's answer.
  // @req REQ-201
  it("keeps the calling role, the grants and a comment on the new signature", () => {
    expect(migration).toContain("security invoker");
    expect(migration).toMatch(
      /revoke all on function public\.afrik_search_patronymes\(text, int, int, boolean\) from public;/
    );
    expect(migration).toMatch(
      /grant execute on function public\.afrik_search_patronymes\(text, int, int, boolean\)\s+to anon, authenticated, service_role;/
    );
    expect(migration).toMatch(
      /comment on function public\.afrik_search_patronymes\(text, int, int, boolean\) is/
    );
    expect(auditRlsCoverage([{ path: FILE, sql }]).liveTables).toEqual([]);
  });

  // GWT 1: Bell reaches « peul » through its phonetic key and nothing else.
  // @req REQ-201
  it("calls a row phonetic-only when its phonetic key is the only thing that matches", () => {
    const predicate = phoneticOnlyPredicate();
    expect(predicate).toContain("p.name_phonetic = q.phonetic_key");
    expect(predicate).toMatch(
      /not coalesce\(p\.search_vector @@ q\.tsq, false\)/
    );
    expect(predicate).toMatch(
      /not coalesce\(p\.name_unaccent_vector @@ q\.tsq_unaccent, false\)/
    );
  });

  // GWT 3: a name that matches exactly or by prefix as well as by sound stays.
  // GWT 4: a typo the trigram fallback reaches is not this rule's business,
  // even when the sound matches too.
  // @req REQ-201
  it("never calls phonetic-only a row that also matches exactly, by prefix or by trigram", () => {
    const predicate = phoneticOnlyPredicate();
    expect(predicate).toContain(
      "public.afrik_unaccent(lower(p.name_main)) is distinct from q.exact_key"
    );
    expect(predicate).toMatch(
      /extensions\.similarity\(\s*public\.afrik_unaccent\(lower\(p\.name_main\)\),\s*q\.exact_key\s*\) < 0\.4/
    );
    // The fallback's own threshold is the one this rule defers to.
    expect(cte("matched")).toMatch(
      /extensions\.similarity\(\s*public\.afrik_unaccent\(lower\(p\.name_main\)\),\s*q\.exact_key\) >= 0\.4/
    );
  });

  // « Nothing in the corpus matches exactly »: another kind, said by the
  // caller, or a family name in this very table.
  // @req REQ-201
  it("withholds phonetic-only rows when the caller or this table has an exact answer", () => {
    const answer = cte("answer");
    expect(answer).toContain("coalesce(p_exact_elsewhere, false)");
    expect(answer).toMatch(
      /exists \(select 1 from matched\s+where exact_match\)/
    );

    const kept = cte("kept");
    expect(kept).toContain("from matched m");
    expect(kept).toMatch(
      /where not \(a\.answered_exactly and m\.phonetic_only\)/
    );
  });

  // A withheld row is never counted and never leaves a short page.
  // @req REQ-201
  it("takes both the page and the total after the withholding", () => {
    expect(cte("page")).toContain("from kept");
    expect(cte("page")).toMatch(
      /limit coalesce\(p_limit, 20\) offset coalesce\(p_offset, 0\)/
    );
    expect(migration).toContain("'total', (select count(*) from kept)");
    expect(migration).not.toContain("(select count(*) from matched)");
  });

  // REQ-135 GWT 1: « Keyta » still reaches « Keïta » when nothing is exact.
  // @req REQ-135
  it("keeps the phonetic match in the lexical tier when nothing answers exactly", () => {
    const matched = cte("matched");
    expect(matched).toMatch(
      /or \(q\.phonetic_key is not null and p\.name_phonetic = q\.phonetic_key\)/
    );
    expect(matched).toContain("then 0.5 else 0 end");
  });
});
