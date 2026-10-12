-- Migration 106 — a place may span several countries (REQ-193)
--
-- A place fiche named exactly one country (migration 100). A town does, but a
-- region such as the Sahara spans about ten, and forcing one would tell the
-- reader the Sahara belongs to a single state. A fiche now carries either
-- `countryId` (one country) or `countryIds` (several, in its own order):
--
-- * afrik_places.country_id stays for a town and is null for a region;
-- * afrik_place_countries lists every country of every place, so a reader of
--   one table never has to know which of the two the fiche used;
-- * afrik_search_places returns that list as countryIds.
--
-- Existing rows are copied into the join table; the next corpus load
-- rewrites it from the fiches. RLS: public read, writes only through the
-- service-role loader, as for every afrik_* table (019, 100).
--
-- Idempotent throughout. Human-applied; this automation never applies it.
-- Rollout: recette first, production second. Apply before loading a region
-- fiche: country_id must accept null first.

-- =============================================================================
-- 1. A place without a single country
-- =============================================================================
ALTER TABLE public.afrik_places
  ALTER COLUMN country_id DROP NOT NULL;

COMMENT ON COLUMN public.afrik_places.country_id IS
  'The place''s country when it lies in one; null for a region that spans several (see afrik_place_countries). Migration 106.';

-- =============================================================================
-- 2. Every country of a place
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.afrik_place_countries (
  place_id TEXT NOT NULL REFERENCES public.afrik_places(id) ON DELETE CASCADE,
  country_id CHAR(3) NOT NULL REFERENCES public.afrik_countries(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL CHECK (position >= 0),
  PRIMARY KEY (place_id, country_id)
);

COMMENT ON TABLE public.afrik_place_countries IS
  'Every country a place fiche lies in, in the fiche''s order: one for a town, several for a region. REQ-193, migration 106.';

CREATE INDEX IF NOT EXISTS idx_afrik_place_countries_country_id
  ON public.afrik_place_countries(country_id);

INSERT INTO public.afrik_place_countries (place_id, country_id, position)
SELECT id, country_id, 0
  FROM public.afrik_places
 WHERE country_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. RLS — public read, service-role-only writes
-- =============================================================================
ALTER TABLE public.afrik_place_countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS afrik_place_countries_read_public ON public.afrik_place_countries;
CREATE POLICY afrik_place_countries_read_public ON public.afrik_place_countries
  FOR SELECT USING (true);

-- =============================================================================
-- 4. afrik_search_places — as in 100, plus countryIds
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
    COALESCE(
      (SELECT jsonb_agg(pc.country_id::text ORDER BY pc.position)
         FROM public.afrik_place_countries pc
        WHERE pc.place_id = page.id),
      '[]'::jsonb)         AS "countryIds",
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
  'Ranked, paginated place search (REQ-196). Returns {"total", "rows": [...]}. A place matches on its filed name and every nameHistory nameText, accent- and apostrophe-insensitive: exact, then a prefix/word-prefix lexical match, then a pg_trgm fallback (>= 0.4). Each row carries normalizedScore, the cross-kind scale of 069. A blank p_q returns no rows. SECURITY INVOKER: reads only what this migration publishes to anon. Each row lists every country of the place in countryIds (106); countryId is null for a region that spans several. Migration 106.';

REVOKE ALL ON FUNCTION public.afrik_search_places(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_places(TEXT, INT, INT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (recette first, then production)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. Existing towns kept their country:
--      SELECT count(*) FROM public.afrik_place_countries;  -- one per place
-- 2. After loading a region fiche, it lists all its countries:
--      SELECT public.afrik_search_places('sahara', 1, 0) -> 'rows' -> 0 -> 'countryIds';
-- 3. As anon, reads succeed and writes are refused:
--      SET ROLE anon; SELECT count(*) FROM public.afrik_place_countries; RESET ROLE;
