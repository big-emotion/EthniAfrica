-- Migration 111 — exact whole-word check in recorded fiche fields (ETNI-2110)
--
-- The near-name decision must see recorded words in lists and prose across
-- the whole corpus, including rows beyond a search page. Source notes are
-- provenance and are deliberately excluded. This read-only function performs
-- that check without changing the ranking or page returned by the search RPCs.

CREATE OR REPLACE FUNCTION public.afrik_search_recorded_term(p_q TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH RECURSIVE q AS (
  SELECT public.afrik_name_key(p_q) AS exact_key
), documents(kind, id, value) AS (
  SELECT 'people'::text, p.id::text,
         jsonb_build_object('name_main', p.name_main,
                            'content', p.content,
                            'name_history', p.name_history)
    FROM public.afrik_peoples p
  UNION ALL
  SELECT 'country', c.id::text,
         jsonb_build_object('name_fr', c.name_fr, 'name_en', c.name_en,
                            'etymology', c.etymology,
                            'name_origin_actor', c.name_origin_actor,
                            'content', c.content, 'name_history', c.name_history)
    FROM public.afrik_countries c
  UNION ALL
  SELECT 'family', f.id::text,
         jsonb_build_object('name_fr', f.name_fr, 'name_en', f.name_en,
                            'content', f.content, 'name_history', f.name_history)
    FROM public.afrik_language_families f
  UNION ALL
  SELECT 'language', l.id::text,
         jsonb_build_object('name', l.name, 'content', l.content,
                            'name_history', l.name_history)
    FROM public.afrik_languages l
  UNION ALL
  SELECT 'patronyme', p.id::text,
         jsonb_build_object('name_main', p.name_main,
                            'caste_or_social_function', p.caste_or_social_function,
                            'content', p.content, 'name_history', p.name_history)
    FROM public.afrik_patronymes p
  UNION ALL
  SELECT 'person', p.id::text,
         jsonb_build_object('full_name', p.full_name,
                            'role_category', p.role_category, 'content', p.content)
    FROM public.persons p
  UNION ALL
  SELECT 'place', p.id::text,
         jsonb_build_object('name_main', p.name_main, 'summary', p.summary,
                            'content', p.content, 'name_history', p.name_history)
    FROM public.afrik_places p
  UNION ALL
  SELECT 'word', w.id::text,
         jsonb_build_object('name_main', w.name_main,
                            'word_language', w.word_language,
                            'definition', w.definition, 'content', w.content,
                            'name_history', w.name_history)
    FROM public.afrik_words w
), nodes(kind, id, value, path, field_path, count_value) AS (
  SELECT d.kind, d.id, d.value, ARRAY[]::text[], ''::text, TRUE
    FROM documents d
  UNION ALL
  SELECT n.kind, n.id, child.value,
         n.path || CASE WHEN child.is_array THEN '[]' ELSE child.key END,
         n.field_path || CASE WHEN child.is_array THEN '[]'
                              ELSE '.' || child.key END,
         n.count_value AND NOT (
           child.key = 'notes' AND 'sources' = ANY(n.path)
         )
    FROM nodes n
    CROSS JOIN LATERAL (
      SELECT e.key, e.value, FALSE AS is_array
        FROM jsonb_each(
          CASE WHEN jsonb_typeof(n.value) = 'object'
               THEN n.value ELSE '{}'::jsonb END
        ) e
      UNION ALL
      SELECT ''::text, a.value, TRUE AS is_array
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(n.value) = 'array'
               THEN n.value ELSE '[]'::jsonb END
        ) a(value)
    ) child
), field_matches AS (
  SELECT DISTINCT n.kind, n.id, substring(n.field_path FROM 2) AS recorded_in
    FROM nodes n
    CROSS JOIN q
    CROSS JOIN LATERAL regexp_split_to_table(
      public.afrik_name_key(n.value #>> '{}'), '[^[:alnum:]]+'
    ) AS word(value)
   WHERE n.count_value
     AND jsonb_typeof(n.value) = 'string'
     AND word.value = q.exact_key
)
, exact_matches AS (
  SELECT m.kind, m.id, jsonb_agg(m.recorded_in ORDER BY m.recorded_in) AS recorded_in
    FROM field_matches m
   GROUP BY m.kind, m.id
)
SELECT jsonb_build_object(
  'rows', COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
             'kind', m.kind, 'id', m.id, 'recorded_in', m.recorded_in
           ) ORDER BY m.kind, m.id)
       FROM exact_matches m),
    '[]'::jsonb
  )
);
$$;

COMMENT ON FUNCTION public.afrik_search_recorded_term(TEXT) IS
  'Returns every published AFRIK fiche that records p_q as a whole word in its names, lists, history or prose, independent of pagination. Each row has kind, id and recorded_in field paths. Excludes sources[].notes. Read-only, SECURITY INVOKER. Migration 111 (ETNI-2110).';

REVOKE ALL ON FUNCTION public.afrik_search_recorded_term(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_recorded_term(TEXT)
  TO anon, authenticated, service_role;

-- Verification (recette first, then production)
-- 1. A word in a counted list or prose returns that fiche and its field path:
--      SELECT public.afrik_search_recorded_term('sanoh');
--      -- rows includes every matching fiche and recorded_in path, excluding
--      -- matches found only in sources[].notes
-- 2. A query present only in source notes returns {"rows": []}.
-- 3. 'konana' does not match fiches that record only 'Konan'/'Konaté'.
