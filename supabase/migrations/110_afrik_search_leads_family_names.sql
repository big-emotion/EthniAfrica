-- Migration 110 — near-miss leads also offer a family name, as a spelling of
-- the searched name (REQ-125, DEC-075; ETNI-2092)
--
-- Context: `afrik_search_leads` (070, re-issued by 084 and 094) scans peoples,
-- countries and linguistic families, never family names. A reader who types
-- « tchikaya » or « muzombo » reaches Tchicaya or Mutombo through the
-- family-name search itself, so the search has results and the page only says
-- it found related fiches. It never says which name the reader probably meant.
--
-- What changes: a fourth branch scores `afrik_patronymes`. A family name is a
-- candidate only through a form that begins with the query's first letter,
-- both folded as the search folds them (lower case, accents and apostrophes
-- removed). Bukasa is an island and a Mukasa a person from it, per the
-- PAT_MUKASA source: in most African naming systems two names that begin
-- differently are two names, while a spelling variant keeps the beginning and
-- changes a letter inside (Tchikaya, Tchicaya). The forms are the filed name
-- and each recorded spelling (`content.spellings[].spelling`), each tested
-- with its own first letter, and the row is emitted under the filed name, as
-- 094 does for a people.
--
-- Why 0.4 for this branch and 0.2 for the others: 0.4 is the family-name
-- search's own trigram threshold (066, 069, 108). At 0.2, « tchikaya » would
-- also offer Tchalla (0.21) and Tchoumba (0.20), and « bukasa » Bukuru (0.27):
-- other names that share a first syllable. Peoples, countries and families
-- keep 094's scan and its 0.2, with no first-letter rule: a people's prefix
-- variants (Baganda, Ganda) name the same people.
--
-- Why the family names are limited apart: they are read by a different rule
-- of the query layer (a lead only when nothing answers exactly, never a
-- similar name). One shared LIMIT would let peoples that score higher push a
-- qualifying family name out of the rows, and family names push a people out
-- of the similar-names shelf (REQ-180). Each group keeps its own p_limit, so
-- the other three kinds return exactly the rows 094 returned. The function
-- therefore returns at most 2 × p_limit rows.
--
-- What it does not decide: whether a family name is offered. That needs
-- « nothing answers the query exactly » (REQ-201's test), which only the
-- query layer knows (src/lib/supabase/queries/afrik/search.ts).
--
-- Cost: 785 family-name fiches times a handful of forms, and only the forms
-- passing the first-letter test are scored. No index is added, as in 094.
-- Measure it on recette before production (verification 4 below).
--
-- Same signature as 084 and 094: CREATE OR REPLACE, no overload for
-- PostgREST to refuse. Rollout: recette on merge, production on Release.

CREATE OR REPLACE FUNCTION public.afrik_search_leads(
  p_q     TEXT DEFAULT NULL,
  p_limit INT  DEFAULT 3,
  p_lang  TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH q AS (
  SELECT public.afrik_unaccent(lower(btrim(p_q))) AS exact_key
),
candidates AS (
  SELECT 'people'::text AS kind, p.id::text AS id, p.name_main AS name,
         max(
           extensions.similarity(
             public.afrik_unaccent(lower(form.value)), q.exact_key)
         ) AS similarity
  FROM public.afrik_peoples p
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT regexp_replace(raw.value, '\s*\([^)]*\)\s*$', '') AS value
    FROM (
      SELECT p.name_main AS value
      UNION ALL
      SELECT btrim(part)
        FROM unnest(
          string_to_array(
            COALESCE(p.content #>> '{appellations,selfAppellation}', ''),
            ',')
        ) AS part
      UNION ALL
      SELECT exonym
        FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(p.content #> '{appellations,exonyms}') = 'array'
               THEN p.content #> '{appellations,exonyms}'
               ELSE '[]'::jsonb END
        ) AS exonym
    ) raw
    WHERE btrim(raw.value) <> ''
  ) form
  WHERE length(q.exact_key) >= 3
  GROUP BY p.id, p.name_main

  UNION ALL

  SELECT 'country'::text AS kind, c.id::text AS id, localized.name,
         extensions.similarity(
           public.afrik_unaccent(lower(localized.name)), q.exact_key) AS similarity
  FROM public.afrik_countries c
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT CASE WHEN p_lang = 'en'
                THEN COALESCE(NULLIF(c.name_en, ''), c.name_fr)
                ELSE c.name_fr END AS name
  ) localized
  WHERE length(q.exact_key) >= 3

  UNION ALL

  SELECT 'family'::text AS kind, lf.id::text AS id, localized.name,
         extensions.similarity(
           public.afrik_unaccent(lower(localized.name)), q.exact_key) AS similarity
  FROM public.afrik_language_families lf
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT CASE WHEN p_lang = 'en'
                THEN COALESCE(NULLIF(lf.name_en, ''), lf.name_fr)
                ELSE lf.name_fr END AS name
  ) localized
  WHERE length(q.exact_key) >= 3

  UNION ALL

  SELECT 'patronyme'::text AS kind, p.id::text AS id, p.name_main AS name,
         max(
           extensions.similarity(
             public.afrik_unaccent(lower(form.value)), q.exact_key)
         ) AS similarity
  FROM public.afrik_patronymes p
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT btrim(regexp_replace(raw.value, '\s*\([^)]*\)\s*$', '')) AS value
    FROM (
      SELECT p.name_main AS value
      UNION ALL
      SELECT spelling ->> 'spelling'
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(p.content #> '{spellings}') = 'array'
               THEN p.content #> '{spellings}'
               ELSE '[]'::jsonb END
        ) AS spelling
    ) raw
    WHERE btrim(raw.value) <> ''
  ) form
  WHERE length(q.exact_key) >= 3
    AND left(public.afrik_unaccent(lower(form.value)), 1) = left(q.exact_key, 1)
  GROUP BY p.id, p.name_main
),
matched AS (
  SELECT * FROM candidates
  WHERE (kind <> 'patronyme' AND similarity >= 0.2)
     OR (kind = 'patronyme' AND similarity >= 0.4)
),
page AS (
  (SELECT * FROM matched
    WHERE kind <> 'patronyme'
    ORDER BY similarity DESC, name ASC, id ASC
    LIMIT COALESCE(p_limit, 3))
  UNION ALL
  (SELECT * FROM matched
    WHERE kind = 'patronyme'
    ORDER BY similarity DESC, name ASC, id ASC
    LIMIT COALESCE(p_limit, 3))
)
SELECT jsonb_build_object(
  'rows', COALESCE(
    (SELECT jsonb_agg(to_jsonb(page) ORDER BY page.similarity DESC,
                       page.name ASC, page.id ASC)
       FROM page),
    '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT) IS
  'Near-miss leads (REQ-125). A trigram similarity scan. A people scores the best of its filed name, self-appellation and exonyms (content.appellations), each without a trailing parenthesis, and is emitted under its filed name; countries and families score their name for p_lang (en | fr, default fr); these three kinds keep similarity >= 0.2. A family name (afrik_patronymes) scores the best of its filed name and recorded spellings (content.spellings[].spelling) among the forms that begin with the folded query''s first letter, keeps similarity >= 0.4 and is emitted under its filed name (DEC-075). Returns {"rows": [{"kind", "id", "name", "similarity"}, ...]}: at most p_limit rows of peoples, countries and families, plus at most p_limit family names, ordered by similarity. A folded query shorter than 3 characters returns no rows. SECURITY INVOKER: reads only tables already published to anon. Migration 110.';

REVOKE ALL ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (recette first, then production)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. A spelling of a family name reaches it, under the filed name:
--      SELECT public.afrik_search_leads('tchikaya', 3) -> 'rows';
--      -- expect {"kind": "patronyme", "id": "PAT_TCHICAYA", "name": "Tchicaya"}
--      -- at a similarity of about 0.5, and neither Tchalla nor Tchoumba
--      SELECT public.afrik_search_leads('muzombo', 3) -> 'rows';
--      -- expect PAT_MUTOMBO at about 0.45
--
-- 2. A name that begins with another letter, or scores under 0.4, is no lead:
--      SELECT public.afrik_search_leads('bukasa', 3) -> 'rows';
--      -- expect no "patronyme" row: Mukasa (0.40) begins with m, Bukuru is 0.27
--
-- 3. Peoples, countries and families answer exactly as under 094:
--      SELECT public.afrik_search_leads('pigmee', 3) -> 'rows';
--      -- expect the same people rows as before this migration
--
-- 4. It stays far inside the anon statement timeout:
--      SET ROLE anon; EXPLAIN ANALYZE SELECT public.afrik_search_leads('kassabara', 3); RESET ROLE;
--      -- expect execution time well under 1 s
--
-- 5. A query shorter than 3 characters returns no rows:
--      SELECT public.afrik_search_leads('bt', 3);  -- {"rows": []}
