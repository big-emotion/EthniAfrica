-- Migration 109 — a fiche answers exactly to every name its history tells,
-- typed as written or without its letters (REQ-135; ETNI-2093)
--
-- Context: a reader who types « Fulɓe », « Bikpakpaam » or « Wɛɛmɛɛbo » meets
-- a page that says « Nous avons trouvé des fiches liées sans établir qu'elles
-- répondent à ce nom ». The search answers a fiche exactly under its filed
-- name only: exact_match compares name_main (peoples, patronymes), name_fr /
-- name_en (countries, families) or name / name_en (languages), and never reads
-- the name_history column migration 098 added. The names that fail are mostly
-- the names peoples give themselves, while the French or colonial filed names
-- (Peul, Konkomba, Toura) answer. Only afrik_search_words (104) and
-- afrik_search_places (100, 106) already answer every nameText.
--
-- A second gap is the fold. afrik_unaccent (066) folds ɓ ɗ ɛ ŋ ʋ ƴ ɖ ɨ through
-- the unaccent rules, but not ɔ / Ɔ, ʿ (U+02BF) or ʾ (U+02BE), so « Thuonjan »
-- cannot reach « Thuɔŋjäŋ » nor « Al-arabiyya » reach « Al-ʿarabiyya ».
--
-- What this migration does:
--
--   1. public.afrik_name_key — the exact-answer key: afrik_unaccent, then ɔ/Ɔ
--      to o and ʿ ʾ deleted. The application folds with the same table
--      (normalizeString, src/lib/normalize.ts), so the two layers agree on
--      every corpus form.
--   2. The five search functions whose rows carry no history reading are
--      re-issued with their exact signatures (084, 108), so PostgREST sees no
--      overload (PGRST203). In each:
--        - exact_key is afrik_name_key(p_q), and the exact test compares
--          afrik_name_key on both sides;
--        - a row is also an exact answer when one nameText of its history has
--          that key, read as 104 reads it;
--        - the match predicate admits such a row, so « Wɛɛmɛɛbo » returns
--          PPL_TOURA even though nothing else in the row matches;
--        - each row carries historyNames, the history's nameText values in
--          history order ([] without a block), so the page can tell which
--          name answered.
--      Ranking is otherwise unchanged: exact, then lexical, then trigram.
--   3. afrik_name_forms (101) groups on afrik_name_key, so the Appellations
--      nomenclature and its query (foldNameQuery) agree.
--
-- Why afrik_unaccent is not redefined: stored generated columns depend on it
-- (052, 065, 066, 068, 069) and so do expression indexes (063, 065, 066, 070).
-- Changing it would mean recomputing and reindexing them on both self-hosted
-- stacks. The prefix, substring, tsvector and trigram paths keep it, under the
-- name fold_key; only the exact answer, which is what REQ-135 rules on here,
-- reads the new key. So a typed « Thuonjan » reaches din as an exact answer,
-- never as a prefix — accepted for the four corpus names that carry ɔ.
--
-- Why exact answers grow on purpose: a history name of another fiche now
-- answers too (« Bambara » → PPL_BAMBARA, bam and PPL_SENUFO). The search
-- page shows every subject and crowns none (DEC-057). The phonetic
-- withholding of 108 (REQ-201) reads exact answers as before, so a query that
-- now has an exact answer withholds the family names it reaches by sound only.
--
-- Idempotent: CREATE OR REPLACE throughout, REVOKE then GRANT. No table.
--
-- Rollout: recette on merge (migrate-recette.yml), production on Release.
-- Never applied by hand. Old code reads the new rows unchanged (historyNames
-- is one more key); new code reads a row without it as [].

-- ────────────────────────────────────────────────────────────────────────────
-- 1. public.afrik_name_key — the exact-answer key
--
-- translate() deletes the characters of its source string that have no
-- counterpart in the target, so the two-letter target maps ɔ and Ɔ to o and
-- deletes ʿ and ʾ. The outer lower() guards against a C collation, under which
-- the inner one leaves a capital that unaccent produced unfolded.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_name_key(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT lower(translate(public.afrik_unaccent(lower(btrim(COALESCE(p_text, '')))),
                         'ɔƆʿʾ', 'oo'));
$$;

COMMENT ON FUNCTION public.afrik_name_key(TEXT) IS
  'The exact-answer key of a name (REQ-135, migration 109): trimmed, lower-cased, afrik_unaccent (accents, apostrophes, and the letters the unaccent rules fold: ɓ ɗ ɛ ŋ ʋ ƴ ɖ ɨ), then ɔ/Ɔ to o, and ʿ ʾ deleted. The application folds with the same table (normalizeString). Only exact answers read it; prefix, substring, tsvector and trigram paths keep afrik_unaccent, on which stored columns and indexes depend.';

REVOKE ALL ON FUNCTION public.afrik_name_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_name_key(TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2a. afrik_search_peoples — migration 084's body, plus the history answer
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_search_peoples(
  p_q                     TEXT        DEFAULT NULL,
  p_limit                 INT         DEFAULT 20,
  p_offset                INT         DEFAULT 0,
  p_classification_status TEXT        DEFAULT NULL,
  p_min_confidence        NUMERIC     DEFAULT NULL,
  p_since_verified_after  TIMESTAMPTZ DEFAULT NULL,
  p_family_id             TEXT        DEFAULT NULL,
  p_country_id            TEXT        DEFAULT NULL,
  p_lang                  TEXT        DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH q AS (
  SELECT
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE websearch_to_tsquery('french', p_q) END AS tsq,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_unaccent(lower(btrim(p_q))) END AS fold_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_name_key(p_q) END AS exact_key
),
matched AS (
  SELECT
    p.id, p.name_main, p.language_family_id, p.classification_status,
    p.content, p.name_history, p.created_at, p.updated_at,
    cs.score AS confidence,
    (q.tsq IS NOT NULL AND p.search_vector @@ q.tsq) AS lexical_match,
    CASE
      WHEN q.tsq IS NOT NULL AND p.search_vector @@ q.tsq THEN
        (ts_rank('{0.1,0.3,0.6,1.0}', p.search_vector, q.tsq)
          * (0.5 + 0.5 * COALESCE(cs.score, 0.5)))::real
      WHEN q.tsq IS NOT NULL THEN
        (extensions.similarity(
           public.afrik_unaccent(lower(p.name_main)),
           q.fold_key)
          * (0.5 + 0.5 * COALESCE(cs.score, 0.5)))::real
      ELSE 0::real
    END AS relevance,
    x.exact_match
  FROM public.afrik_peoples p
  LEFT JOIN public.confidence_scores cs
    ON cs.entity_type = 'people' AND cs.entity_id = p.id
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT q.exact_key IS NOT NULL AND (
             public.afrik_name_key(p.name_main) = q.exact_key
             OR EXISTS (
               SELECT 1
                 FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(p.name_history -> 'names') = 'array'
                             THEN p.name_history -> 'names'
                             ELSE '[]'::jsonb END
                      ) AS n(value)
                WHERE public.afrik_name_key(n.value ->> 'nameText') = q.exact_key)
           ) AS exact_match
  ) x
  WHERE (
      q.tsq IS NULL
      OR p.search_vector @@ q.tsq
      OR extensions.similarity(
           public.afrik_unaccent(lower(p.name_main)),
           q.fold_key) >= 0.4
      OR x.exact_match
    )
    AND (p_classification_status IS NULL
         OR p.classification_status::text = p_classification_status)
    AND (p_min_confidence IS NULL OR cs.score >= p_min_confidence)
    AND (p_since_verified_after IS NULL
         OR cs.last_human_audit_at >= p_since_verified_after)
    AND (p_family_id IS NULL OR p.language_family_id = p_family_id)
    AND (p_country_id IS NULL OR EXISTS (
           SELECT 1 FROM public.afrik_people_countries pc
            WHERE pc.people_id = p.id AND pc.country_id = p_country_id))
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
    page.id::text                    AS id,
    page.name_main                   AS "nameMain",
    page.language_family_id::text    AS "languageFamilyId",
    lf.name_fr                       AS "languageFamilyName",
    lf.name_en                       AS "languageFamilyNameEn",
    page.classification_status::text AS "classificationStatus",
    page.exact_match                 AS "exactMatch",
    public.afrik_search_normalized_score(
      page.exact_match, page.lexical_match, page.relevance) AS "normalizedScore",
    page.content,
    COALESCE((SELECT array_agg(pc.country_id::text ORDER BY pc.country_id)
                FROM public.afrik_people_countries pc
               WHERE pc.people_id = page.id), '{}'::text[]) AS "currentCountries",
    page.confidence,
    -- StartSel/StopSel are deliberately not HTML: ts_headline does not escape
    -- the surrounding document. The frontend splits on [[ ]] and renders <mark>.
    CASE WHEN (SELECT tsq FROM q) IS NULL THEN NULL ELSE ts_headline(
      'french',
      concat_ws(' · ',
        nullif(page.content -> 'appellations' ->> 'selfAppellation', ''),
        nullif((SELECT string_agg(e.value #>> '{}', ', ')
                  FROM jsonb_array_elements(
                         COALESCE(page.content -> 'appellations' -> 'exonyms',
                                  '[]'::jsonb)) e
                 WHERE jsonb_typeof(e.value) = 'string'), ''),
        nullif((SELECT string_agg(k.val #>> '{}', ' · ')
                  FROM jsonb_each(COALESCE(page.content -> 'appellations',
                                           '{}'::jsonb)) k(key, val)
                 WHERE jsonb_typeof(k.val) = 'string'
                   AND k.key NOT IN ('mainName', 'selfAppellation')), '')),
      (SELECT tsq FROM q),
      'StartSel=[[, StopSel=]], MaxFragments=1, MaxWords=22, MinWords=6, '
      'FragmentDelimiter= … , HighlightAll=FALSE'
    ) END AS snippet,
    COALESCE(
      (SELECT jsonb_agg(n.value ->> 'nameText' ORDER BY n.ord)
         FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(page.name_history -> 'names') = 'array'
                     THEN page.name_history -> 'names'
                     ELSE '[]'::jsonb END
              ) WITH ORDINALITY AS n(value, ord)
        WHERE COALESCE(btrim(n.value ->> 'nameText'), '') <> ''),
      '[]'::jsonb) AS "historyNames",
    page.created_at AS "createdAt",
    page.updated_at AS "updatedAt"
  FROM page
  LEFT JOIN public.afrik_language_families lf
    ON lf.id = page.language_family_id
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

COMMENT ON FUNCTION public.afrik_search_peoples(
  TEXT, INT, INT, TEXT, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT) IS
  'Ranked, paginated peoples search. Returns {"total": <corpus-wide match count>, "rows": [...]}. Ranked by an exact answer — name_main, or any nameText of name_history, compared on afrik_name_key (migration 109) — then a lexical match on the weighted search_vector (ts_rank times a confidence multiplier), then a pg_trgm similarity fallback (>= 0.4) on the afrik_unaccent fold (063). Each row carries normalizedScore (069), languageFamilyNameEn (084) and historyNames, the history''s nameText values in history order ([] without a block, 109). p_lang (en | fr, default fr) is accepted for the shared calling convention. A null or blank p_q switches the text predicate off, which is how "peoples of family X" and "peoples of country Y" are served here. Runs as the calling role.';

REVOKE ALL ON FUNCTION public.afrik_search_peoples(TEXT, INT, INT, TEXT, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_peoples(TEXT, INT, INT, TEXT, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2b. afrik_search_countries — migration 084's body, plus the history answer
--
-- The English rung keeps its ladder on the afrik_unaccent fold; only its
-- exact test moves to afrik_name_key, beside name_fr and the history.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_search_countries(
  p_q      TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 20,
  p_offset INT  DEFAULT 0,
  p_lang   TEXT DEFAULT 'fr'
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
         ELSE public.afrik_unaccent(lower(btrim(p_q))) END AS fold_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_name_key(p_q) END AS exact_key
),
matched AS (
  SELECT c.id, c.name_fr, c.name_en, c.etymology, c.name_origin_actor,
         c.content, c.name_history, c.created_at, c.updated_at,
         CASE WHEN p_lang = 'en' THEN COALESCE(c.name_en, c.name_fr)
              ELSE c.name_fr END AS sort_name,
         COALESCE(
           (q.tsq IS NOT NULL AND c.search_vector @@ q.tsq)
           OR (q.tsq_unaccent IS NOT NULL
               AND c.name_unaccent_vector @@ q.tsq_unaccent)
           OR (en.name_fold IS NOT NULL
               AND position(q.fold_key IN en.name_fold) > 0),
           false) AS lexical_match,
         CASE
           WHEN q.is_browse THEN 0::real
           ELSE GREATEST(
             CASE WHEN q.tsq IS NOT NULL
                  THEN ts_rank('{0.1,0.3,0.6,1.0}', c.search_vector, q.tsq)
                  ELSE 0 END,
             CASE WHEN q.tsq_unaccent IS NOT NULL
                  THEN ts_rank('{0.1,0.3,0.6,1.0}', c.name_unaccent_vector,
                               q.tsq_unaccent)
                  ELSE 0 END,
             CASE
               WHEN en.name_fold IS NULL THEN 0::real
               WHEN en.name_fold = q.fold_key THEN 1.0::real
               WHEN starts_with(en.name_fold, q.fold_key) THEN 0.6::real
               WHEN position(q.fold_key IN en.name_fold) > 0 THEN 0.3::real
               ELSE 0::real
             END
           )::real
         END AS relevance,
         x.exact_match
  FROM public.afrik_countries c
  CROSS JOIN q
  -- The folded English name, only under the English locale; NULL otherwise,
  -- which every predicate above reads as "no English rung".
  CROSS JOIN LATERAL (
    SELECT CASE WHEN p_lang = 'en' AND c.name_en IS NOT NULL
                     AND q.fold_key IS NOT NULL
                THEN public.afrik_unaccent(lower(c.name_en)) END AS name_fold
  ) en
  CROSS JOIN LATERAL (
    SELECT q.exact_key IS NOT NULL AND (
             public.afrik_name_key(c.name_fr) = q.exact_key
             OR (en.name_fold IS NOT NULL
                 AND public.afrik_name_key(c.name_en) = q.exact_key)
             OR EXISTS (
               SELECT 1
                 FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(c.name_history -> 'names') = 'array'
                             THEN c.name_history -> 'names'
                             ELSE '[]'::jsonb END
                      ) AS n(value)
                WHERE public.afrik_name_key(n.value ->> 'nameText') = q.exact_key)
           ) AS exact_match
  ) x
  WHERE q.is_browse
        OR (q.tsq IS NOT NULL AND c.search_vector @@ q.tsq)
        OR (q.tsq_unaccent IS NOT NULL
            AND c.name_unaccent_vector @@ q.tsq_unaccent)
        OR (en.name_fold IS NOT NULL
            AND position(q.fold_key IN en.name_fold) > 0)
        OR x.exact_match
),
page AS (
  SELECT m.* FROM matched m
  ORDER BY m.exact_match DESC, m.relevance DESC, m.sort_name ASC, m.id ASC
  LIMIT COALESCE(p_limit, 20) OFFSET COALESCE(p_offset, 0)
),
enriched AS (
  SELECT page.exact_match, page.lexical_match, page.relevance, page.sort_name,
         page.id::text        AS id,
         page.name_fr         AS "nameFr",
         page.name_en         AS "nameEn",
         page.etymology,
         page.name_origin_actor AS "nameOriginActor",
         page.exact_match     AS "exactMatch",
         public.afrik_search_normalized_score(
           page.exact_match, page.lexical_match, page.relevance) AS "normalizedScore",
         page.content,
         CASE WHEN (SELECT is_browse FROM q) THEN NULL ELSE ts_headline(
           'french',
           concat_ws(' · ',
                     CASE WHEN p_lang = 'en' THEN nullif(page.name_en, '') END,
                     nullif(page.name_fr, ''),
                     nullif(page.etymology, '')),
           COALESCE((SELECT tsq FROM q), (SELECT tsq_unaccent FROM q)),
           'StartSel=[[, StopSel=]], MaxFragments=1, MaxWords=22, MinWords=6, '
           'FragmentDelimiter= … , HighlightAll=FALSE'
         ) END AS snippet,
         COALESCE(
           (SELECT jsonb_agg(n.value ->> 'nameText' ORDER BY n.ord)
              FROM jsonb_array_elements(
                     CASE WHEN jsonb_typeof(page.name_history -> 'names') = 'array'
                          THEN page.name_history -> 'names'
                          ELSE '[]'::jsonb END
                   ) WITH ORDINALITY AS n(value, ord)
             WHERE COALESCE(btrim(n.value ->> 'nameText'), '') <> ''),
           '[]'::jsonb) AS "historyNames",
         page.created_at AS "createdAt",
         page.updated_at AS "updatedAt"
  FROM page
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM matched),
  'rows', COALESCE(
    (SELECT jsonb_agg(to_jsonb(e) - 'exact_match' - 'lexical_match' - 'sort_name'
                      ORDER BY e.exact_match DESC, e.relevance DESC,
                               e.sort_name ASC, e.id ASC)
       FROM enriched e),
    '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION public.afrik_search_countries(TEXT, INT, INT, TEXT) IS
  'Ranked, paginated countries search. Returns {"total": <corpus-wide match count>, "rows": [...]}. Matches on the weighted search_vector (043) OR the accent-insensitive name_unaccent_vector (052), both queried with a last-word prefix operator (public.afrik_prefix_tsquery) — REQ-129; with p_lang = ''en'' (084) the folded name_en also matches through the families'' ladder. exactMatch fires on name_fr, on name_en under the English locale, or on any nameText of name_history, compared on afrik_name_key, and such a row is admitted on that alone (migration 109). Each row carries nameEn, normalizedScore (069) and historyNames, the history''s nameText values in history order ([] without a block).';

REVOKE ALL ON FUNCTION public.afrik_search_countries(TEXT, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_countries(TEXT, INT, INT, TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2c. afrik_search_language_families — migration 084's ladder, plus the
--     history answer
--
-- The ladder (exact 1.0 > prefix 0.6 > substring 0.3, prose 0.1) still climbs
-- the afrik_unaccent fold of the locale's name; exactMatch moves to
-- afrik_name_key and also fires on the history.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_search_language_families(
  p_q      TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 20,
  p_offset INT  DEFAULT 0,
  p_lang   TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
WITH q AS (
  SELECT
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_unaccent(lower(btrim(p_q))) END AS fold_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_name_key(p_q) END AS exact_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_prefix_tsquery(btrim(p_q)) END AS tsq
),
matched AS (
  SELECT
    f.id, f.name_fr, f.name_en, f.classification_status, f.content,
    f.name_history, f.created_at, f.updated_at,
    ladder.ladder_name AS sort_name,
    x.exact_match,
    (position(q.fold_key IN ladder.name_fold) > 0) AS lexical_match,
    CASE
      WHEN ladder.name_fold = q.fold_key THEN 1.0::real
      WHEN starts_with(ladder.name_fold, q.fold_key) THEN 0.6::real
      WHEN position(q.fold_key IN ladder.name_fold) > 0 THEN 0.3::real
      ELSE 0.1::real
    END AS relevance
  FROM public.afrik_language_families f
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT ladder_name, public.afrik_unaccent(lower(ladder_name)) AS name_fold
    FROM (SELECT CASE WHEN p_lang = 'en' THEN COALESCE(f.name_en, f.name_fr)
                      ELSE f.name_fr END AS ladder_name) l
  ) ladder
  CROSS JOIN LATERAL (
    SELECT q.exact_key IS NOT NULL AND (
             public.afrik_name_key(ladder.ladder_name) = q.exact_key
             OR EXISTS (
               SELECT 1
                 FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(f.name_history -> 'names') = 'array'
                             THEN f.name_history -> 'names'
                             ELSE '[]'::jsonb END
                      ) AS n(value)
                WHERE public.afrik_name_key(n.value ->> 'nameText') = q.exact_key)
           ) AS exact_match
  ) x
  WHERE q.exact_key IS NOT NULL
    AND (position(q.fold_key IN ladder.name_fold) > 0
         OR (q.tsq IS NOT NULL AND f.search_vector @@ q.tsq)
         OR x.exact_match)
),
page AS (
  SELECT m.* FROM matched m
  ORDER BY m.exact_match DESC, m.relevance DESC, m.sort_name ASC, m.id ASC
  LIMIT COALESCE(p_limit, 20) OFFSET COALESCE(p_offset, 0)
),
enriched AS (
  SELECT
    page.exact_match,
    page.lexical_match,
    page.relevance,
    page.sort_name,
    page.id::text                    AS id,
    page.name_fr                     AS "nameFr",
    page.name_en                     AS "nameEn",
    page.classification_status::text AS "classificationStatus",
    page.exact_match                 AS "exactMatch",
    public.afrik_search_normalized_score(
      page.exact_match, page.lexical_match, page.relevance) AS "normalizedScore",
    page.content,
    ts_headline(
      'french',
      concat_ws(' · ', nullif(page.sort_name, ''),
        nullif((SELECT string_agg(d.value #>> '{}', ' · ')
                  FROM jsonb_each(COALESCE(page.content -> 'decolonialHeader',
                                           '{}'::jsonb)) d(key, value)
                 WHERE jsonb_typeof(d.value) = 'string'), '')),
      (SELECT tsq FROM q),
      'StartSel=[[, StopSel=]], MaxFragments=1, MaxWords=22, MinWords=6, '
      'FragmentDelimiter= … , HighlightAll=FALSE'
    ) AS snippet,
    COALESCE(
      (SELECT jsonb_agg(n.value ->> 'nameText' ORDER BY n.ord)
         FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(page.name_history -> 'names') = 'array'
                     THEN page.name_history -> 'names'
                     ELSE '[]'::jsonb END
              ) WITH ORDINALITY AS n(value, ord)
        WHERE COALESCE(btrim(n.value ->> 'nameText'), '') <> ''),
      '[]'::jsonb) AS "historyNames",
    page.created_at AS "createdAt",
    page.updated_at AS "updatedAt"
  FROM page
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM matched),
  'rows', COALESCE(
    (SELECT jsonb_agg(to_jsonb(e) - 'exact_match' - 'lexical_match' - 'sort_name'
                      ORDER BY e.exact_match DESC, e.relevance DESC,
                               e.sort_name ASC, e.id ASC)
       FROM enriched e),
    '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION public.afrik_search_language_families(TEXT, INT, INT, TEXT) IS
  'Ranked, paginated linguistic-family search. Returns {"total": <corpus-wide match count>, "rows": [...]}. Accent-insensitive exact (1.0) > prefix (0.6) > substring (0.3) on the locale''s name — name_fr, or name_en with p_lang = ''en'' (084) — then a prose tier (0.1) through the search_vector (DEC-028). exactMatch fires on the locale''s name or any nameText of name_history, compared on afrik_name_key, and such a row is admitted on that alone (migration 109). Each row carries normalizedScore (069) and historyNames, the history''s nameText values in history order ([] without a block). A blank p_q matches nothing. REQ-002, REQ-129, REQ-135, REQ-141.';

REVOKE ALL ON FUNCTION public.afrik_search_language_families(TEXT, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_language_families(TEXT, INT, INT, TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2d. afrik_search_languages — migration 084's body, plus the history answer
--
-- The ISO 639-3 exact test stays: a code is a code, and afrik_name_key of an
-- ASCII code is the code lower-cased.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.afrik_search_languages(
  p_q      TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 20,
  p_offset INT  DEFAULT 0,
  p_lang   TEXT DEFAULT 'fr'
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
         ELSE public.afrik_unaccent(lower(btrim(p_q))) END AS fold_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_name_key(p_q) END AS exact_key
),
matched AS (
  SELECT l.id, l.name, l.family_id, l.content, l.name_history,
         l.created_at, l.updated_at,
         CASE WHEN p_lang = 'en' THEN COALESCE(l.content ->> 'nameEn', l.name)
              ELSE l.name END AS sort_name,
         CASE
           WHEN q.is_browse THEN 0::real
           ELSE GREATEST(
             CASE WHEN q.tsq IS NOT NULL
                  THEN ts_rank('{0.1,0.3,0.6,1.0}', l.search_vector, q.tsq)
                  ELSE 0 END,
             CASE WHEN q.tsq_unaccent IS NOT NULL
                  THEN ts_rank('{0.1,0.3,0.6,1.0}', l.name_unaccent_vector,
                               q.tsq_unaccent)
                  ELSE 0 END,
             CASE
               WHEN en.name_fold IS NULL THEN 0::real
               WHEN en.name_fold = q.fold_key THEN 1.0::real
               WHEN starts_with(en.name_fold, q.fold_key) THEN 0.6::real
               WHEN position(q.fold_key IN en.name_fold) > 0 THEN 0.3::real
               ELSE 0::real
             END
           )::real
         END AS relevance,
         x.exact_match
  FROM public.afrik_languages l
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT CASE WHEN p_lang = 'en' AND q.fold_key IS NOT NULL
                     AND nullif(l.content ->> 'nameEn', '') IS NOT NULL
                THEN public.afrik_unaccent(lower(l.content ->> 'nameEn')) END
           AS name_fold
  ) en
  CROSS JOIN LATERAL (
    -- Exact on the ISO 639-3 id, on the name, on the English name under the
    -- English locale, or on any name the history tells — a reader who types
    -- "swa" has named the language as precisely as one who types "Swahili".
    SELECT q.exact_key IS NOT NULL AND (
             public.afrik_name_key(l.id) = q.exact_key
             OR public.afrik_name_key(l.name) = q.exact_key
             OR (en.name_fold IS NOT NULL
                 AND public.afrik_name_key(l.content ->> 'nameEn') = q.exact_key)
             OR EXISTS (
               SELECT 1
                 FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(l.name_history -> 'names') = 'array'
                             THEN l.name_history -> 'names'
                             ELSE '[]'::jsonb END
                      ) AS n(value)
                WHERE public.afrik_name_key(n.value ->> 'nameText') = q.exact_key)
           ) AS exact_match
  ) x
  WHERE q.is_browse
        OR (q.tsq IS NOT NULL AND l.search_vector @@ q.tsq)
        OR (q.tsq_unaccent IS NOT NULL
            AND l.name_unaccent_vector @@ q.tsq_unaccent)
        OR (en.name_fold IS NOT NULL
            AND position(q.fold_key IN en.name_fold) > 0)
        OR x.exact_match
),
page AS (
  SELECT m.* FROM matched m
  ORDER BY m.exact_match DESC, m.relevance DESC, m.sort_name ASC, m.id ASC
  LIMIT COALESCE(p_limit, 20) OFFSET COALESCE(p_offset, 0)
),
enriched AS (
  SELECT page.exact_match, page.relevance, page.sort_name,
         page.id::text          AS id,
         page.name              AS "name",
         page.content ->> 'nameEn' AS "nameEn",
         page.family_id::text   AS "familyId",
         lf.name_fr             AS "familyName",
         lf.name_en             AS "familyNameEn",
         page.exact_match       AS "exactMatch",
         page.content,
         CASE WHEN (SELECT is_browse FROM q) THEN NULL ELSE ts_headline(
           'french',
           COALESCE(page.sort_name, ''),
           COALESCE((SELECT tsq FROM q), (SELECT tsq_unaccent FROM q)),
           'StartSel=[[, StopSel=]], MaxFragments=1, MaxWords=22, MinWords=6, '
           'FragmentDelimiter= … , HighlightAll=FALSE'
         ) END AS snippet,
         COALESCE(
           (SELECT jsonb_agg(n.value ->> 'nameText' ORDER BY n.ord)
              FROM jsonb_array_elements(
                     CASE WHEN jsonb_typeof(page.name_history -> 'names') = 'array'
                          THEN page.name_history -> 'names'
                          ELSE '[]'::jsonb END
                   ) WITH ORDINALITY AS n(value, ord)
             WHERE COALESCE(btrim(n.value ->> 'nameText'), '') <> ''),
           '[]'::jsonb) AS "historyNames",
         page.created_at AS "createdAt",
         page.updated_at AS "updatedAt"
  FROM page
  LEFT JOIN public.afrik_language_families lf ON lf.id = page.family_id
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM matched),
  'rows', COALESCE(
    (SELECT jsonb_agg(to_jsonb(e) - 'exact_match' - 'sort_name'
                      ORDER BY e.exact_match DESC, e.relevance DESC,
                               e.sort_name ASC, e.id ASC)
       FROM enriched e),
    '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION public.afrik_search_languages(TEXT, INT, INT, TEXT) IS
  'Ranked, paginated language search. Returns {"total": <corpus-wide match count>, "rows": [...]}. Matches on the weighted search_vector (055) OR the accent-insensitive name_unaccent_vector (068), both queried with a last-word prefix operator — REQ-136; with p_lang = ''en'' (084) the folded content.nameEn also matches through the families'' ladder. exactMatch fires on the ISO 639-3 id, the name, the English name under the English locale, or any nameText of name_history, compared on afrik_name_key, and such a row is admitted on that alone (migration 109). Each row carries nameEn, familyNameEn and historyNames, the history''s nameText values in history order ([] without a block). SECURITY INVOKER.';

REVOKE ALL ON FUNCTION public.afrik_search_languages(TEXT, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_languages(TEXT, INT, INT, TEXT)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2e. afrik_search_patronymes — migration 108's body, plus the history answer
--
-- A row answered exactly by its history is not phonetic-only, and an exact
-- answer from the history withholds the phonetic-only rows like any other
-- (REQ-201): the withholding reads exact_match, which now includes it.
-- ────────────────────────────────────────────────────────────────────────────
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
         ELSE public.afrik_unaccent(lower(btrim(p_q))) END AS fold_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE public.afrik_name_key(p_q) END AS exact_key,
    CASE WHEN COALESCE(btrim(p_q), '') = '' THEN NULL
         ELSE extensions.dmetaphone(public.afrik_unaccent(btrim(p_q))) END AS phonetic_key
),
matched AS (
  SELECT
    p.id, p.name_main, p.name_system, p.caste_or_social_function, p.content,
    p.name_history, p.created_at, p.updated_at,
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
          -- A phonetic-only match carries no ts_rank magnitude of its own; a
          -- fixed mid-scale value keeps it below a real lexical hit.
          CASE WHEN q.phonetic_key IS NOT NULL
                    AND p.name_phonetic = q.phonetic_key
               THEN 0.5 ELSE 0 END
        )::real
      WHEN q.tsq IS NOT NULL THEN
        extensions.similarity(
          public.afrik_unaccent(lower(p.name_main)),
          q.fold_key)::real
      ELSE 0::real
    END AS relevance,
    x.exact_match,
    -- REQ-201: the sound is the only thing that ties this name to the query.
    -- A NULL anywhere (a browse has no keys) means "not phonetic-only".
    COALESCE(
      q.phonetic_key IS NOT NULL
      AND p.name_phonetic = q.phonetic_key
      AND NOT COALESCE(p.search_vector @@ q.tsq, false)
      AND NOT COALESCE(p.name_unaccent_vector @@ q.tsq_unaccent, false)
      AND NOT x.exact_match
      AND extensions.similarity(
            public.afrik_unaccent(lower(p.name_main)),
            q.fold_key
          ) < 0.4,
      false
    ) AS phonetic_only
  FROM public.afrik_patronymes p
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT q.exact_key IS NOT NULL AND (
             public.afrik_name_key(p.name_main) = q.exact_key
             OR EXISTS (
               SELECT 1
                 FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(p.name_history -> 'names') = 'array'
                             THEN p.name_history -> 'names'
                             ELSE '[]'::jsonb END
                      ) AS n(value)
                WHERE public.afrik_name_key(n.value ->> 'nameText') = q.exact_key)
           ) AS exact_match
  ) x
  WHERE (
      q.is_browse
      OR (q.tsq IS NOT NULL AND p.search_vector @@ q.tsq)
      OR (q.tsq_unaccent IS NOT NULL
          AND p.name_unaccent_vector @@ q.tsq_unaccent)
      OR (q.phonetic_key IS NOT NULL AND p.name_phonetic = q.phonetic_key)
      OR (q.fold_key IS NOT NULL AND extensions.similarity(
            public.afrik_unaccent(lower(p.name_main)),
            q.fold_key) >= 0.4)
      OR x.exact_match
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
    COALESCE(
      (SELECT jsonb_agg(n.value ->> 'nameText' ORDER BY n.ord)
         FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(page.name_history -> 'names') = 'array'
                     THEN page.name_history -> 'names'
                     ELSE '[]'::jsonb END
              ) WITH ORDINALITY AS n(value, ord)
        WHERE COALESCE(btrim(n.value ->> 'nameText'), '') <> ''),
      '[]'::jsonb) AS "historyNames",
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
  'Ranked, paginated name (patronyme) search. Returns {"total": <corpus-wide match count>, "rows": [...]}. Ranked by an exact answer — name_main or any nameText of name_history, compared on afrik_name_key (migration 109) — then a lexical tier that is a prefix/accent-insensitive match on search_vector or name_unaccent_vector OR a dmetaphone phonetic match (REQ-135 AC1), then a pg_trgm similarity fallback (>= 0.4). A row reached only through its phonetic key is left out of rows and total when the query has an exact answer: a name in this table, its history included, or another kind the caller reports with p_exact_elsewhere (REQ-201, 108). Each row carries normalizedScore (069) and historyNames, the history''s nameText values in history order ([] without a block). A null or blank p_q browses the whole corpus.';

REVOKE ALL ON FUNCTION public.afrik_search_patronymes(TEXT, INT, INT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.afrik_search_patronymes(TEXT, INT, INT, BOOLEAN)
  TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. afrik_name_forms — migration 101's view, grouped on the exact-answer key
--
-- Same columns, same types, same order, so CREATE OR REPLACE applies and the
-- grants stay; the GRANT is repeated so a replay states it.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.afrik_name_forms
WITH (security_invoker = true) AS
SELECT
  public.afrik_name_key(nr.name_text) AS form_key,
  mode() WITHIN GROUP (ORDER BY nr.name_text) AS display_name,
  array_agg(DISTINCT nr.name_text ORDER BY nr.name_text) AS spellings,
  array_agg(DISTINCT nr.name_type::text) AS name_types,
  count(DISTINCT nr.entity_id)::int AS bearer_count,
  jsonb_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name_main))
    FILTER (WHERE p.id IS NOT NULL) AS bearers,
  bool_or(nr.imposed_by IS NOT NULL) AS has_imposed,
  max(nr.why_problematic) AS why_problematic,
  min(nr.language_of_origin) AS language_of_origin
FROM public.afrik_people_names nr
LEFT JOIN public.afrik_peoples p ON p.id = nr.entity_id
GROUP BY public.afrik_name_key(nr.name_text);

COMMENT ON VIEW public.afrik_name_forms IS
  'One row per distinct name form across afrik_people_names, keyed on afrik_name_key (accents, case and the letters of REQ-135 folded), with the peoples bearing it. Backs the Appellations nomenclature; see migrations 071, 101 and 109.';

GRANT SELECT ON public.afrik_name_forms TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification (on recette after the merge, then on production after the
-- Release; never as a step of this migration)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. The key folds the letters both ways:
--      SELECT public.afrik_name_key('Fulɓe');                  -- fulbe
--      SELECT public.afrik_name_key('Fulɓe') = public.afrik_name_key('Fulbe');
--                                                              -- true
--      SELECT public.afrik_name_key('Thuɔŋjäŋ');               -- thuonjan
--      SELECT public.afrik_name_key('Al-ʿarabiyya al-fuṣḥā');  -- al-arabiyya al-fusha
--
-- 2. A history name is an exact answer, first among peoples:
--      SELECT public.afrik_search_peoples('Fulɓe') -> 'rows' -> 0
--             -> 'id', -> 'exactMatch';                        -- "PPL_FULA", true
--      SELECT public.afrik_search_peoples('Fulbe') #>> '{rows,0,id}';
--                                                              -- PPL_FULA
--      SELECT public.afrik_search_peoples('Bikpakpaam') #>> '{rows,0,id}';
--                                                              -- PPL_KONKOMBA
--      SELECT public.afrik_search_peoples('Wɛɛmɛɛbo') #>> '{rows,0,id}';
--                                                              -- PPL_TOURA
--      SELECT public.afrik_search_languages('Thuɔŋjäŋ') #>> '{rows,0,id}';
--                                                              -- din
--      SELECT public.afrik_search_languages('Al-arabiyya al-fusha') #>> '{rows,0,id}';
--                                                              -- arb
--
-- 3. The row carries its history names, and a fiche without a block carries []:
--      SELECT public.afrik_search_peoples('Fulɓe') #> '{rows,0,historyNames}';
--      -- an array whose first element is "Fulɓe"
--
-- 4. A Latin query answers as before:
--      SELECT public.afrik_search_peoples('Peul') #>> '{rows,0,id}';     -- PPL_FULA
--      SELECT public.afrik_search_peoples('Konkomba') #>> '{rows,0,id}'; -- PPL_KONKOMBA
--
-- 5. Exactly one signature per function — an overload answers PGRST203:
--      SELECT proname, count(*) FROM pg_proc
--       WHERE proname IN ('afrik_search_peoples', 'afrik_search_countries',
--                         'afrik_search_language_families',
--                         'afrik_search_languages', 'afrik_search_patronymes',
--                         'afrik_name_key')
--       GROUP BY 1;
--      -- expect count 1 on every row
--
-- 6. Callable with the anon key:
--      SET ROLE anon; SELECT public.afrik_search_peoples('Fulbe', 1); RESET ROLE;
