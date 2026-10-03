-- Migration 094 — near-miss leads also read a people's recorded forms (REQ-125)
--
-- Context: `afrik_search_leads` (070, re-issued by 084) scored a trigram
-- similarity against `afrik_peoples.name_main` alone. A reader who types a
-- spelling of a name the corpus records as an exonym — « pigmée » for the
-- Twa's « Pygmées », « fulbr » for « Fulbe » — was compared with the filed
-- name only, and the filed name shares too few trigrams with it.
--
-- The similarity of a people is now the best over the forms its fiche records:
-- the filed name, the self-appellation and each exonym, all read from
-- `content.appellations`. The emitted `name` stays the filed name — the
-- neighbour is offered as a neighbour of that entry, and no form is promoted
-- above another (DEC-057).
--
-- A form is scored without a trailing parenthesis, so « Mandingue (français
-- colonial) » is compared as « Mandingue ». This only affects scoring; the
-- qualifier is shown where the fiche shows it and never derived from here.
--
-- Cost: a few hundred people rows times a handful of forms, computed on the
-- zero-result path and for the « near names » shelf, so no index is added — a
-- trigram index over a JSONB array would be maintenance for a scan that fits
-- well inside the anon role's 3-second statement timeout. Measure it on
-- recette before production (verification 3 below).
--
-- Same signature as 084: CREATE OR REPLACE, no overload for PostgREST to
-- refuse. pg_trgm is installed in `extensions` since 063/069.
--
-- Rollout is two-step: recette first, production second.

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
),
matched AS (
  SELECT * FROM candidates WHERE similarity >= 0.2
),
page AS (
  SELECT * FROM matched
  ORDER BY similarity DESC, name ASC, id ASC
  LIMIT COALESCE(p_limit, 3)
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
  'Near-miss leads (REQ-125). A trigram similarity scan (>= 0.2). A people scores the best of its filed name, self-appellation and exonyms (content.appellations), each without a trailing parenthesis, and is emitted under its filed name; countries and families score their name for p_lang (en | fr, default fr). Returns {"rows": [{"kind", "id", "name", "similarity"}, ...]}, at most p_limit rows. A folded query shorter than 3 characters returns no rows. SECURITY INVOKER: reads only tables already published to anon. Migration 094.';

REVOKE ALL ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_leads(TEXT, INT, TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (recette first, then production)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. A spelling of a recorded exonym reaches its people, under the filed name:
--      SELECT public.afrik_search_leads('pigmee', 3) -> 'rows';
--      -- expect at least one people whose fiche records « Pygmées »
--
-- 2. A typo of a filed name still works, and the function answers as anon:
--      SET ROLE anon; SELECT public.afrik_search_leads('fulbr', 3); RESET ROLE;
--
-- 3. It stays far inside the anon statement timeout:
--      SET ROLE anon; EXPLAIN ANALYZE SELECT public.afrik_search_leads('kassabara', 3);
--      -- expect execution time well under 1 s
--
-- 4. A query shorter than 3 characters returns no rows:
--      SELECT public.afrik_search_leads('bt', 3);  -- {"rows": []}
