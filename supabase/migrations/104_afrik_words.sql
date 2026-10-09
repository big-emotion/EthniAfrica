-- Migration 104 — word fiches (WRD_*) and their nameHistory (REQ-196, ARCH-028)
--
-- Story: ETNI-2041. dataset/source/afrik/mots/ is validated
-- (checkWordFicheModel, checkNameHistoryBlocks) but never loaded: no table,
-- no endpoint, no search. A reader who types « race » reached nothing. This
-- migration gives words the footing places got in 100: a row per fiche, its
-- nameHistory in a sibling jsonb column, and a ranked search function.
--
-- Unlike every other class, a word fiche exists only to tell the history of
-- the word, so name_history is NOT NULL here.
--
-- relatedSubjects stay in `content`: a related subject may be any class
-- (people, country, family, place, patronyme, word), so no single foreign key
-- can hold it, and validateAfrikData already refuses one that does not
-- resolve.
--
-- RLS: public read, no anon or authenticated write. Writes flow only through
-- the service-role loader (scripts/migrateAfrikToDatabase.ts), as for every
-- afrik_* table (019, 053, 100).
--
-- Idempotent throughout. Human-applied; this automation never applies it.
-- Rollout: recette first, production second. The application tolerates the
-- search function being absent (a missing RPC answers as « no word »), so
-- code and migration may land in either order.

-- =============================================================================
-- 1. Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.afrik_words (
  id TEXT PRIMARY KEY CHECK (id ~ '^WRD_[A-Z0-9_]+$'),
  name_main TEXT NOT NULL,
  word_language TEXT NOT NULL,
  definition TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  name_history JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.afrik_words IS
  'Word fiches (dataset/source/afrik/mots, model public/modele-mot.json). REQ-196, ETNI-2041.';
COMMENT ON COLUMN public.afrik_words.content IS
  'The rest of the fiche the reader is served: relatedSubjects, gaps and sources.';
COMMENT ON COLUMN public.afrik_words.name_history IS
  'Shared nameHistory block of the word fiche (REQ-196, ARCH-028); required for a word.';

-- =============================================================================
-- 2. RLS — public read, service-role-only writes
-- =============================================================================
ALTER TABLE public.afrik_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS afrik_words_read_public ON public.afrik_words;
CREATE POLICY afrik_words_read_public ON public.afrik_words
  FOR SELECT USING (true);

-- =============================================================================
-- 3. afrik_search_words — ranked, paginated word search
-- -----------------------------------------------------------------------------
-- Same reading as afrik_search_places (100): a word answers to its filed name
-- and to each nameText of its nameHistory, so a former form or a variant
-- spelling finds the word under its filed name. A handful of rows: no stored
-- vector, no index.
--
-- Match classes feed the cross-kind score of 069:
--   exact     a folded form equals the folded query
--   lexical   a folded form starts with the query, or holds it after a space
--   fallback  pg_trgm similarity >= 0.4, mirroring 063/066/100
-- Returns {"total", "rows"} like every afrik_search_* function.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.afrik_search_words(
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
  SELECT w.id, public.afrik_unaccent(lower(form.value)) AS folded
  FROM public.afrik_words w
  CROSS JOIN LATERAL (
    SELECT w.name_main AS value
    UNION ALL
    SELECT name ->> 'nameText'
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(w.name_history -> 'names') = 'array'
             THEN w.name_history -> 'names'
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
  SELECT w.*, s.exact_match, s.lexical_match, s.relevance
  FROM scored s
  JOIN public.afrik_words w ON w.id = s.id
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
    page.word_language     AS "wordLanguage",
    page.definition,
    page.content,
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

COMMENT ON FUNCTION public.afrik_search_words(TEXT, INT, INT) IS
  'Ranked, paginated word search (REQ-196). Returns {"total", "rows": [...]}. A word matches on its filed name and every nameHistory nameText, accent-insensitive: exact, then a prefix/word-prefix lexical match, then a pg_trgm fallback (>= 0.4). Each row carries normalizedScore, the cross-kind scale of 069. A blank p_q returns no rows. SECURITY INVOKER. Migration 104.';

REVOKE ALL ON FUNCTION public.afrik_search_words(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_words(TEXT, INT, INT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (recette first, then production)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. After the corpus load, the filed name answers, accents and case ignored:
--      SELECT public.afrik_search_words('Race', 5, 0) -> 'total';  -- 1
-- 2. As anon, reads succeed and writes are refused:
--      SET ROLE anon; SELECT count(*) FROM public.afrik_words; RESET ROLE;
