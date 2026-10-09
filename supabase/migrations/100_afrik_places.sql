-- Migration 100 — place fiches (LOC_*) and their nameHistory (REQ-196, ARCH-028)
--
-- Story: ETNI-2022. dataset/source/afrik/lieux/ has been validated
-- (checkPlaceFicheModel, checkNameHistoryBlocks) but never loaded: no table,
-- no endpoint, no search. This migration gives places the same footing as the
-- other named subjects of 098: a row per fiche, its shared nameHistory block
-- in a sibling jsonb column, and a ranked search function so a reader who
-- types « Yamoussoukro » — or its former name « N'Gokro » — reaches it.
--
-- Shape follows afrik_patronymes (053): the columns a join, a filter or the
-- search needs are real columns; the rest of the fiche (gaps, sources) lives
-- in `content`. The legacy names[] block of the place model is not projected:
-- the nameHistory block replaces it (ETNI-2023), and the loader writes only
-- what both shapes share.
--
-- RLS: public read, no anon or authenticated write. Writes flow only through
-- the service-role loader (scripts/migrateAfrikToDatabase.ts), as for every
-- afrik_* table (019, 053).
--
-- Idempotent throughout. Human-applied; this automation never applies it.
-- Rollout: recette first, production second. The application tolerates the
-- search function being absent (a missing RPC answers as « no place »), so
-- code and migration may land in either order.

-- =============================================================================
-- 1. Tables
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.afrik_places (
  id TEXT PRIMARY KEY CHECK (id ~ '^LOC_[A-Z0-9_]+$'),
  place_type TEXT NOT NULL,
  name_main TEXT NOT NULL,
  country_id CHAR(3) NOT NULL REFERENCES public.afrik_countries(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  name_history JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.afrik_places IS
  'Place fiches (dataset/source/afrik/lieux, model public/modele-lieu.json). REQ-196, ETNI-2022.';
COMMENT ON COLUMN public.afrik_places.content IS
  'The rest of the fiche the reader is served: gaps and sources.';
COMMENT ON COLUMN public.afrik_places.name_history IS
  'Shared nameHistory block of the place fiche (REQ-196, ARCH-028); null when the fiche declares none.';

CREATE INDEX IF NOT EXISTS idx_afrik_places_country_id
  ON public.afrik_places(country_id);

CREATE TABLE IF NOT EXISTS public.afrik_place_peoples (
  place_id TEXT NOT NULL REFERENCES public.afrik_places(id) ON DELETE CASCADE,
  people_id VARCHAR(50) NOT NULL REFERENCES public.afrik_peoples(id) ON DELETE CASCADE,
  relation TEXT,
  PRIMARY KEY (place_id, people_id)
);

COMMENT ON TABLE public.afrik_place_peoples IS
  'Peoples a place fiche associates with the place, with the fiche''s own wording of the relation. ETNI-2022.';

CREATE INDEX IF NOT EXISTS idx_afrik_place_peoples_people_id
  ON public.afrik_place_peoples(people_id);

-- =============================================================================
-- 2. RLS — public read, service-role-only writes
-- =============================================================================
ALTER TABLE public.afrik_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afrik_place_peoples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS afrik_places_read_public ON public.afrik_places;
CREATE POLICY afrik_places_read_public ON public.afrik_places
  FOR SELECT USING (true);

DROP POLICY IF EXISTS afrik_place_peoples_read_public ON public.afrik_place_peoples;
CREATE POLICY afrik_place_peoples_read_public ON public.afrik_place_peoples
  FOR SELECT USING (true);

-- =============================================================================
-- 3. afrik_search_places — ranked, paginated place search
-- -----------------------------------------------------------------------------
-- A place answers to every name its fiche records: the filed name and each
-- nameText of its nameHistory, so a former name finds the place under its
-- filed name. A handful of rows: no stored vector, no index — a scan of the
-- folded forms fits far inside the anon statement timeout.
--
-- Match classes feed the cross-kind score of 069:
--   exact     a folded form equals the folded query
--   lexical   a folded form starts with the query, or holds it after a space
--             (afrik_unaccent strips apostrophes: « ngokro » is « N'Gokro »)
--   fallback  pg_trgm similarity >= 0.4, mirroring 063/066
-- Returns {"total", "rows"} like every afrik_search_* function.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.afrik_search_places(
  p_q      TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 20,
  p_offset INT  DEFAULT 0
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH q AS (
  SELECT public.afrik_unaccent(lower(btrim(p_q))) AS key
),
forms AS (
  SELECT p.id, public.afrik_unaccent(lower(form.value)) AS folded
  FROM public.afrik_places p
  CROSS JOIN LATERAL (
    SELECT p.name_main AS value
    UNION ALL
    SELECT name ->> 'nameText'
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(p.name_history -> 'names') = 'array'
             THEN p.name_history -> 'names'
             ELSE '[]'::jsonb END
      ) AS name
  ) form
  WHERE COALESCE(btrim(form.value), '') <> ''
),
scored AS (
  SELECT
    f.id,
    bool_or(f.folded = q.key) AS exact_match,
    bool_or(
      f.folded LIKE q.key || '%'
      OR f.folded LIKE '% ' || q.key || '%'
    ) AS lexical_match,
    max(extensions.similarity(f.folded, q.key))::real AS relevance
  FROM forms f
  CROSS JOIN q
  WHERE COALESCE(q.key, '') <> ''
  GROUP BY f.id
),
matched AS (
  SELECT p.*, s.exact_match, s.lexical_match, s.relevance
  FROM scored s
  JOIN public.afrik_places p ON p.id = s.id
  WHERE s.exact_match OR s.lexical_match OR s.relevance >= 0.4
),
page AS (
  SELECT m.* FROM matched m
  ORDER BY m.exact_match DESC, m.lexical_match DESC, m.relevance DESC,
           m.name_main ASC, m.id ASC
  LIMIT COALESCE(p_limit, 20) OFFSET COALESCE(p_offset, 0)
),
enriched AS (
  SELECT
    page.exact_match,
    page.lexical_match,
    page.relevance,
    page.id::text          AS id,
    page.name_main         AS "nameMain",
    page.place_type        AS "placeType",
    page.country_id::text  AS "countryId",
    page.summary,
    page.exact_match       AS "exactMatch",
    public.afrik_search_normalized_score(
      page.exact_match, page.lexical_match, page.relevance) AS "normalizedScore",
    page.name_history      AS "nameHistory"
  FROM page
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM matched),
  'rows', COALESCE(
    (SELECT jsonb_agg(to_jsonb(e) - 'exact_match' - 'lexical_match'
                      ORDER BY e.exact_match DESC, e.lexical_match DESC,
                               e.relevance DESC, e."nameMain" ASC, e.id ASC)
       FROM enriched e),
    '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION public.afrik_search_places(TEXT, INT, INT) IS
  'Ranked, paginated place search (REQ-196). Returns {"total", "rows": [...]}. A place matches on its filed name and every nameHistory nameText, accent- and apostrophe-insensitive: exact, then a prefix/word-prefix lexical match, then a pg_trgm fallback (>= 0.4). Each row carries normalizedScore, the cross-kind scale of 069. A blank p_q returns no rows. SECURITY INVOKER: reads only what this migration publishes to anon. Migration 100.';

REVOKE ALL ON FUNCTION public.afrik_search_places(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_places(TEXT, INT, INT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (recette first, then production)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. After the corpus load, the filed name and the former name both answer:
--      SELECT public.afrik_search_places('yamoussoukro', 5, 0) -> 'rows';
--      SELECT public.afrik_search_places('ngokro', 5, 0) -> 'total';  -- 1
-- 2. As anon, reads succeed and writes are refused:
--      SET ROLE anon; SELECT count(*) FROM public.afrik_places; RESET ROLE;
