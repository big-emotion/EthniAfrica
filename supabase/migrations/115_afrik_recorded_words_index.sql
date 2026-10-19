-- Migration 115 — an index behind afrik_search_recorded_term (ETNI-2110)
--
-- Migration 112 answered « is this word written in a fiche? » by walking every
-- JSON node of every fiche on each search, folding each string with
-- afrik_name_key. On the real corpus that is 29 s per call, against the ~4 s
-- statement timeout of the API role: on production every search answered 500
-- until v5.7.1 made the caller give up on a timeout.
--
-- The walk does not depend on the query, only on the fiche. This migration
-- does it once, when a fiche is written, and keeps the result in
-- afrik_recorded_words: for each fiche, each folded word it records and the
-- field paths where it records it. The search then reads one key.
--
-- Why not a tsvector: a tsvector says which fiches contain a word, not in
-- which field, and the page needs the field (recorded_in). The word-to-paths
-- map answers both, and a GIN index on it serves the `?` lookup.
--
-- The walk is migration 112's, unchanged, applied to one fiche: the same nodes,
-- the same exclusion of sources[].notes, the same split on non-alphanumerics,
-- so the answer is the one 112 gave. Differences, both deliberate:
--   - a blank or punctuation-only query answers no row. 112 matched the empty
--     word that a leading or trailing separator produces, which no caller wants;
--   - the index is read, not computed: a fiche written before this migration
--     is covered by the backfill below, one written after it by its trigger.
--
-- Idempotent: CREATE OR REPLACE and IF NOT EXISTS throughout, backfill by upsert.
-- Never applied by hand. Rollout: recette on merge, production on Release.

-- The backfill folds the whole corpus once (about half a minute locally).
SET LOCAL statement_timeout = 0;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. The searchable document of a fiche, written once for the trigger, the
--    backfill and the tests. Fields and keys are the ones 112 built inline;
--    the keys name the paths that recorded_in reports.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_search_document(p_kind TEXT, p_row JSONB)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT CASE p_kind
    WHEN 'people' THEN jsonb_build_object(
      'name_main', p_row -> 'name_main',
      'content', p_row -> 'content',
      'name_history', p_row -> 'name_history')
    WHEN 'country' THEN jsonb_build_object(
      'name_fr', p_row -> 'name_fr', 'name_en', p_row -> 'name_en',
      'etymology', p_row -> 'etymology',
      'name_origin_actor', p_row -> 'name_origin_actor',
      'content', p_row -> 'content', 'name_history', p_row -> 'name_history')
    WHEN 'family' THEN jsonb_build_object(
      'name_fr', p_row -> 'name_fr', 'name_en', p_row -> 'name_en',
      'content', p_row -> 'content', 'name_history', p_row -> 'name_history')
    WHEN 'language' THEN jsonb_build_object(
      'name', p_row -> 'name', 'content', p_row -> 'content',
      'name_history', p_row -> 'name_history')
    WHEN 'patronyme' THEN jsonb_build_object(
      'name_main', p_row -> 'name_main',
      'caste_or_social_function', p_row -> 'caste_or_social_function',
      'content', p_row -> 'content', 'name_history', p_row -> 'name_history')
    WHEN 'person' THEN jsonb_build_object(
      'full_name', p_row -> 'full_name',
      'role_category', p_row -> 'role_category',
      'content', p_row -> 'content')
    WHEN 'place' THEN jsonb_build_object(
      'name_main', p_row -> 'name_main', 'summary', p_row -> 'summary',
      'content', p_row -> 'content', 'name_history', p_row -> 'name_history')
    WHEN 'word' THEN jsonb_build_object(
      'name_main', p_row -> 'name_main',
      'word_language', p_row -> 'word_language',
      'definition', p_row -> 'definition', 'content', p_row -> 'content',
      'name_history', p_row -> 'name_history')
  END;
$$;

COMMENT ON FUNCTION public.afrik_search_document(TEXT, JSONB) IS
  'The part of a fiche row that recorded-term search reads, per kind (people, country, family, language, patronyme, person, place, word). Migration 115 (ETNI-2110); the fields are the ones migration 112 built inline.';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Every folded word a document records, with the field paths that record
--    it: {"word": ["content.appellations.clans[]", ...]}. Migration 112's walk
--    over one document. A string under sources[].notes does not count, nor
--    anything below it: a note records provenance.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_recorded_word_paths(p_document JSONB)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $$
WITH RECURSIVE nodes(value, path, field_path, count_value) AS (
  SELECT p_document, ARRAY[]::text[], ''::text, TRUE
  UNION ALL
  SELECT child.value,
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
), hits AS (
  SELECT DISTINCT word.value AS word, substring(n.field_path FROM 2) AS recorded_in
    FROM nodes n
    CROSS JOIN LATERAL regexp_split_to_table(
      public.afrik_name_key(n.value #>> '{}'), '[^[:alnum:]]+'
    ) AS word(value)
   WHERE n.count_value
     AND jsonb_typeof(n.value) = 'string'
     AND word.value <> ''
), per_word AS (
  SELECT h.word, jsonb_agg(h.recorded_in ORDER BY h.recorded_in) AS recorded_in
    FROM hits h
   GROUP BY h.word
)
SELECT COALESCE(jsonb_object_agg(p.word, p.recorded_in), '{}'::jsonb)
  FROM per_word p;
$$;

COMMENT ON FUNCTION public.afrik_recorded_word_paths(JSONB) IS
  'Maps each folded word a document records to the sorted field paths that record it. Folding is afrik_name_key, words are runs of letters and digits, sources[].notes is excluded. Migration 112''s walk, applied once to one document (migration 115, ETNI-2110).';

REVOKE ALL ON FUNCTION public.afrik_search_document(TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.afrik_recorded_word_paths(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_document(TEXT, JSONB)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.afrik_recorded_word_paths(JSONB)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. The index table. Derived from the fiches, never edited: the triggers
--    below are its only writers. Readable by the roles that read the fiches.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.afrik_recorded_words (
  kind       TEXT  NOT NULL,
  id         TEXT  NOT NULL,
  word_paths JSONB NOT NULL,
  PRIMARY KEY (kind, id)
);

CREATE INDEX IF NOT EXISTS afrik_recorded_words_word_paths_idx
  ON public.afrik_recorded_words USING GIN (word_paths);

ALTER TABLE public.afrik_recorded_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS afrik_recorded_words_read ON public.afrik_recorded_words;
CREATE POLICY afrik_recorded_words_read ON public.afrik_recorded_words
  FOR SELECT TO anon, authenticated USING (true);

REVOKE ALL ON public.afrik_recorded_words FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.afrik_recorded_words TO anon, authenticated, service_role;

COMMENT ON TABLE public.afrik_recorded_words IS
  'For each fiche (kind, id), the folded words it records and where: {"word": ["field.path[]"]}. Derived from the fiche tables by triggers (migration 115); backs afrik_search_recorded_term. Never edited by hand.';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Keeping it current. One trigger per fiche table, SECURITY DEFINER so the
--    loader's role needs no write grant on the index. An UPDATE that changes
--    nothing (the loader upserts every fiche on each sync) costs one row
--    comparison, not a walk.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_recorded_words_maintain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_kind TEXT := TG_ARGV[0];
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.afrik_recorded_words
     WHERE kind = v_kind AND id = to_jsonb(OLD) ->> 'id';
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF to_jsonb(OLD) = to_jsonb(NEW) THEN
      RETURN NEW;
    END IF;
    IF to_jsonb(OLD) ->> 'id' IS DISTINCT FROM to_jsonb(NEW) ->> 'id' THEN
      DELETE FROM public.afrik_recorded_words
       WHERE kind = v_kind AND id = to_jsonb(OLD) ->> 'id';
    END IF;
  END IF;

  INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
  VALUES (
    v_kind,
    to_jsonb(NEW) ->> 'id',
    public.afrik_recorded_word_paths(
      public.afrik_search_document(v_kind, to_jsonb(NEW))
    )
  )
  ON CONFLICT (kind, id) DO UPDATE SET word_paths = EXCLUDED.word_paths;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.afrik_recorded_words_maintain() FROM PUBLIC;

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.afrik_peoples;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.afrik_peoples
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('people');

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.afrik_countries;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.afrik_countries
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('country');

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.afrik_language_families;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.afrik_language_families
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('family');

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.afrik_languages;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.afrik_languages
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('language');

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.afrik_patronymes;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.afrik_patronymes
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('patronyme');

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.persons;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('person');

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.afrik_places;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.afrik_places
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('place');

DROP TRIGGER IF EXISTS afrik_recorded_words_sync ON public.afrik_words;
CREATE TRIGGER afrik_recorded_words_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.afrik_words
  FOR EACH ROW EXECUTE FUNCTION public.afrik_recorded_words_maintain('word');

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Backfill: the fiches already in the tables. Replaces what is there, so
--    a replay of this migration leaves the index equal to the tables.
-- ────────────────────────────────────────────────────────────────────────────
TRUNCATE public.afrik_recorded_words;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'people', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('people', to_jsonb(t)))
  FROM public.afrik_peoples t;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'country', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('country', to_jsonb(t)))
  FROM public.afrik_countries t;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'family', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('family', to_jsonb(t)))
  FROM public.afrik_language_families t;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'language', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('language', to_jsonb(t)))
  FROM public.afrik_languages t;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'patronyme', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('patronyme', to_jsonb(t)))
  FROM public.afrik_patronymes t;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'person', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('person', to_jsonb(t)))
  FROM public.persons t;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'place', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('place', to_jsonb(t)))
  FROM public.afrik_places t;

INSERT INTO public.afrik_recorded_words (kind, id, word_paths)
SELECT 'word', t.id::text,
       public.afrik_recorded_word_paths(public.afrik_search_document('word', to_jsonb(t)))
  FROM public.afrik_words t;

ANALYZE public.afrik_recorded_words;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. The search itself: one key read. Same signature, same result shape as
--    migration 112: {"rows": [{"kind", "id", "recorded_in"}, ...]}, ordered by
--    kind then id, each recorded_in sorted.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_search_recorded_term(p_q TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH q AS (
  SELECT public.afrik_name_key(p_q) AS word
)
SELECT jsonb_build_object(
  'rows', COALESCE(
    (SELECT jsonb_agg(
              jsonb_build_object(
                'kind', w.kind, 'id', w.id, 'recorded_in', w.word_paths -> q.word
              ) ORDER BY w.kind, w.id)
       FROM public.afrik_recorded_words w
       CROSS JOIN q
      WHERE q.word <> '' AND w.word_paths ? q.word),
    '[]'::jsonb
  )
);
$$;

COMMENT ON FUNCTION public.afrik_search_recorded_term(TEXT) IS
  'Returns every published AFRIK fiche that records p_q as a whole word in its names, lists, history or prose, independent of pagination. Each row has kind, id and recorded_in field paths. Excludes sources[].notes. Read-only, SECURITY INVOKER. Reads afrik_recorded_words, the index migration 115 builds (migration 112 walked every fiche per call and outran the API statement timeout; ETNI-2110).';

REVOKE ALL ON FUNCTION public.afrik_search_recorded_term(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_recorded_term(TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (on recette after the merge, then on production after the
-- Release; never as a step of this migration)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. The index covers every fiche (each pair of counts must match):
--      SELECT kind, count(*) FROM public.afrik_recorded_words GROUP BY kind ORDER BY kind;
--      SELECT 'people', count(*) FROM public.afrik_peoples
--      UNION ALL SELECT 'patronyme', count(*) FROM public.afrik_patronymes;
-- 2. A search answers well inside the 4 s timeout, on a frequent word:
--      EXPLAIN ANALYZE SELECT public.afrik_search_recorded_term('peul');
--    expected: a few milliseconds.
-- 3. It answers the way migration 112 did, with the field paths:
--      SELECT jsonb_array_length(public.afrik_search_recorded_term('peul') -> 'rows');
--      SELECT public.afrik_search_recorded_term('sanoh');
-- 4. A blank or punctuation-only query answers nothing:
--      SELECT public.afrik_search_recorded_term('  ');   -- {"rows": []}
-- 5. A written fiche is indexed by its trigger: update one fiche's content, then
--      SELECT word_paths ? 'newword' FROM public.afrik_recorded_words
--       WHERE kind = 'people' AND id = '<its id>';        -- t
