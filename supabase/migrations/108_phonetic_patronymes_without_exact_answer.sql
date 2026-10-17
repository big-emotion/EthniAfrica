-- Migration 108 — a family name reached only by its sound is offered only
-- when nothing answers the query exactly (REQ-201, refines REQ-135; ETNI-2046)
--
-- Context: afrik_search_patronymes (066, re-issued by 069) folds a dmetaphone
-- match into its lexical tier. That bridges a real misspelling — « Keyta »
-- reaches « Keïta » — and it also returns Bailly, Baloyi, Bell and Bwalya for
-- « peul », which a people answers exactly and to which those names are tied
-- by nothing but a phonetic key. Listed beside the Peul fiche they would
-- claim a link that no source makes.
--
-- What changes: a row is phonetic-only when its phonetic key is the only
-- thing that matches — no exact name, no search_vector or name_unaccent_vector
-- match, no trigram similarity at the fallback's own 0.4 threshold. Such rows
-- are dropped when the query has an exact answer: in this table (a family
-- name whose folded name is the folded query), or in another kind, which only
-- the caller knows and says through p_exact_elsewhere. The query layer sets it
-- from the exactMatch flag of the other kinds and from the production
-- ledger's word answers (src/lib/supabase/queries/afrik/search.ts).
--
-- Why the withholding is in SQL and not in the query layer: a phonetic-only
-- row ranks inside the lexical tier at a fixed 0.5, interleaved with prefix
-- hits, so dropping it after LIMIT/OFFSET would leave a short page and a
-- total that counts what the reader never sees. Both are taken after it here.
--
-- Why a row that matches by sound AND by trigram is kept: it is a typo the
-- fallback reaches on its own (REQ-135 GWT 3), which this rule leaves alone.
--
-- Why DROP then CREATE: a new parameter list beside the old one is an
-- overload, and PostgREST answers an overloaded name with PGRST203. Nothing
-- depends on the old signature (no view, no trigger). Old code keeps working
-- against the new function, the parameter having a default; new code sends
-- p_exact_elsewhere only when it is true and keeps its previous answer if the
-- old function replies PGRST202, so the rollout survives either order.
--
-- Rollout: recette on merge, production on Release. Ranking is otherwise the
-- body of migration 069, unchanged: exact name match, then the lexical tier
-- (prefix / accent-insensitive / phonetic), then the pg_trgm fallback.

DROP FUNCTION IF EXISTS public.afrik_search_patronymes(TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.afrik_search_patronymes(
  p_q               TEXT    DEFAULT NULL,
  p_limit           INT     DEFAULT 20,
  p_offset          INT     DEFAULT 0,
  p_exact_elsewhere BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH q AS (
  SELECT
    (COALESCE(btrim(p_q), '') = '') AS is_browse,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_prefix_tsquery(btrim(p_q)) END AS tsq,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_prefix_tsquery(
                public.afrik_unaccent(btrim(p_q))) END AS tsq_unaccent,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_unaccent(lower(btrim(p_q))) END AS exact_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE extensions.dmetaphone(public.afrik_unaccent(btrim(p_q))) END AS phonetic_key
),
matched AS (
  SELECT
    p.id, p.name_main, p.name_system, p.caste_or_social_function, p.content,
    p.created_at, p.updated_at,
    (
      q.tsq IS NOT NULL AND (
        p.search_vector @@ q.tsq
        OR p.name_unaccent_vector @@ q.tsq_unaccent
        OR (q.phonetic_key IS NOT NULL AND p.name_phonetic = q.phonetic_key)
      )
    ) AS lexical_match,
    CASE
      WHEN q.is_browse THEN 0::real
      WHEN q.tsq IS NOT NULL AND (
             p.search_vector @@ q.tsq
             OR p.name_unaccent_vector @@ q.tsq_unaccent
             OR (q.phonetic_key IS NOT NULL AND p.name_phonetic = q.phonetic_key)
           ) THEN
        GREATEST(
          CASE WHEN p.search_vector @@ q.tsq
               THEN ts_rank('{0.1,0.3,0.6,1.0}', p.search_vector, q.tsq)
               ELSE 0 END,
          CASE WHEN p.name_unaccent_vector @@ q.tsq_unaccent
               THEN ts_rank('{0.1,0.3,0.6,1.0}', p.name_unaccent_vector,
                            q.tsq_unaccent)
               ELSE 0 END,
          -- Phonetic-only match carries no ts_rank magnitude of its own; a
          -- fixed mid-scale value keeps it below a real lexical hit on this
          -- continuous score while lexical_match (above) already guarantees
          -- it never outranks one regardless of magnitude.
          CASE WHEN q.phonetic_key IS NOT NULL
                    AND p.name_phonetic = q.phonetic_key
               THEN 0.5 ELSE 0 END
        )::real
      WHEN q.tsq IS NOT NULL THEN
        -- Fallback tier only — never reached when tier 2 already matched.
        extensions.similarity(
          public.afrik_unaccent(lower(p.name_main)),
          q.exact_key)::real
      ELSE 0::real
    END AS relevance,
    (q.exact_key IS NOT NULL
     AND public.afrik_unaccent(lower(p.name_main)) = q.exact_key) AS exact_match,
    -- REQ-201: the sound is the only thing that ties this name to the query.
    -- A NULL anywhere (a browse has no keys) means "not phonetic-only".
    COALESCE(
      q.phonetic_key IS NOT NULL
      AND p.name_phonetic = q.phonetic_key
      AND NOT COALESCE(p.search_vector @@ q.tsq, false)
      AND NOT COALESCE(p.name_unaccent_vector @@ q.tsq_unaccent, false)
      AND public.afrik_unaccent(lower(p.name_main)) IS DISTINCT FROM q.exact_key
      AND extensions.similarity(
            public.afrik_unaccent(lower(p.name_main)),
            q.exact_key
          ) < 0.4,
      false
    ) AS phonetic_only
  FROM public.afrik_patronymes p
  CROSS JOIN q
  WHERE (
      q.is_browse
      OR (q.tsq IS NOT NULL AND p.search_vector @@ q.tsq)
      OR (q.tsq_unaccent IS NOT NULL
          AND p.name_unaccent_vector @@ q.tsq_unaccent)
      OR (q.phonetic_key IS NOT NULL AND p.name_phonetic = q.phonetic_key)
      OR (q.exact_key IS NOT NULL AND extensions.similarity(
            public.afrik_unaccent(lower(p.name_main)),
            q.exact_key) >= 0.4)
    )
),
answer AS (
  SELECT
    COALESCE(p_exact_elsewhere, false)
    OR EXISTS (SELECT 1 FROM matched
               WHERE exact_match) AS answered_exactly
),
kept AS (
  SELECT m.* FROM matched m
  CROSS JOIN answer a
  WHERE NOT (a.answered_exactly AND m.phonetic_only)
),
page AS (
  SELECT k.* FROM kept k
  ORDER BY k.exact_match DESC, k.lexical_match DESC, k.relevance DESC,
           k.name_main ASC, k.id ASC
  LIMIT COALESCE(p_limit, 20) OFFSET COALESCE(p_offset, 0)
),
enriched AS (
  SELECT
    page.exact_match,
    page.lexical_match,
    page.relevance,
    page.id::text                    AS id,
    page.name_main                   AS "nameMain",
    page.name_system::text           AS "nameSystem",
    page.caste_or_social_function    AS "casteOrSocialFunction",
    page.exact_match                 AS "exactMatch",
    public.afrik_search_normalized_score(
      page.exact_match, page.lexical_match, page.relevance) AS "normalizedScore",
    page.content,
    CASE WHEN (SELECT is_browse FROM q) THEN NULL ELSE ts_headline(
      'french',
      COALESCE(page.name_main, ''),
      COALESCE((SELECT tsq FROM q), (SELECT tsq_unaccent FROM q)),
      'StartSel=[[, StopSel=]], MaxFragments=1, MaxWords=22, MinWords=6, '
      'FragmentDelimiter= … , HighlightAll=FALSE'
    ) END AS snippet,
    page.created_at AS "createdAt",
    page.updated_at AS "updatedAt"
  FROM page
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM kept),
  'rows', COALESCE(
    (SELECT jsonb_agg(to_jsonb(e) - 'exact_match' - 'lexical_match'
                      ORDER BY e.exact_match DESC, e.lexical_match DESC,
                               e.relevance DESC, e."nameMain" ASC, e.id ASC)
       FROM enriched e),
    '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION public.afrik_search_patronymes(TEXT, INT, INT, BOOLEAN) IS
  'Ranked, paginated name (patronyme) search. Returns {"total": <corpus-wide match count>, "rows": [...]}. Ranked by exact accent/apostrophe-insensitive name match, then a lexical tier that is a prefix/accent-insensitive match on search_vector or name_unaccent_vector OR a dmetaphone phonetic match (REQ-135 AC1), then a pg_trgm similarity fallback (>= 0.4, mirroring 063). A row reached only through its phonetic key is left out of rows and total when the query has an exact answer: a name in this table, or another kind the caller reports with p_exact_elsewhere (REQ-201, migration 108). Each row also carries normalizedScore, the cross-kind [0,1] scale of migration 069. A null or blank p_q browses the whole corpus. Runs as the calling role, so it reads only what migration 053 already publishes to anon.';

REVOKE ALL ON FUNCTION public.afrik_search_patronymes(TEXT, INT, INT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_patronymes(TEXT, INT, INT, BOOLEAN)
  TO anon, authenticated, service_role;
