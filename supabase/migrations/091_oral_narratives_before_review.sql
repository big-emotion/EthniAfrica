-- Migration 091: oral narratives are visible before review; name records at any tier
-- DEC-055 points 6 and 7, REQ-172 and REQ-173. Supersedes in part DEC-052 as
-- migration 089 implemented it: review now orders narratives (reviewed first)
-- and no longer gates their display, the qualification of a people name, or
-- an advisor-only approval; and every oral source counts in the confidence
-- score, several from one carrier included.
--
-- Two conditions deliberately stay:
-- * rights_status = 'cleared' — the narrator's recorded consent is an ethical
--   condition of display, not a certainty threshold (DEC-055 open question,
--   kept on the product owner's instruction).
-- * a rejected narrative stays hidden — once someone has reviewed and refused
--   it, showing it as "not yet reviewed" would be false.
--
-- This migration rewrites no source, narrative or name row.

-- 1. oral_narratives: public no longer implies approved.
-- 032 declared the visibility rule as an unnamed table CHECK, so its generated
-- name is not guaranteed across databases; it is found by its definition. The
-- loop also removes this migration's own constraint on a re-run, which the
-- ADD below restores.
DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  FOR v_constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.oral_narratives'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%visibility%'
      AND pg_get_constraintdef(oid) LIKE '%review_status%'
  LOOP
    EXECUTE format('ALTER TABLE oral_narratives DROP CONSTRAINT %I', v_constraint_name);
  END LOOP;
END $$;

ALTER TABLE oral_narratives DROP CONSTRAINT IF EXISTS oral_narratives_public_visibility_check;
ALTER TABLE oral_narratives
  ADD CONSTRAINT oral_narratives_public_visibility_check
  CHECK (
    visibility = 'restricted'
    OR (visibility = 'public' AND rights_status = 'cleared' AND review_status <> 'rejected')
  );

COMMENT ON CONSTRAINT oral_narratives_public_visibility_check ON oral_narratives IS
  'A public narrative needs the narrator''s cleared consent and must not have been '
  'rejected; review itself is not required. DEC-055, REQ-172.';

-- 2. Public read: unreviewed narratives and their links become readable.
DROP POLICY IF EXISTS oral_narratives_public_read ON oral_narratives;
CREATE POLICY oral_narratives_public_read ON oral_narratives
  FOR SELECT USING (
    visibility = 'public'
    AND rights_status = 'cleared'
    AND review_status <> 'rejected'
  );

DROP POLICY IF EXISTS oral_narrative_links_public_read ON oral_narrative_links;
CREATE POLICY oral_narrative_links_public_read ON oral_narrative_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM oral_narratives narrative
      WHERE narrative.id = oral_narrative_links.narrative_id
        AND narrative.visibility = 'public'
        AND narrative.rights_status = 'cleared'
        AND narrative.review_status <> 'rejected'
    )
  );

-- 3. An approval may still be recorded, by anyone allowed to write the row;
-- it is an ordering signal now, so the advisor-only trigger has nothing left
-- to protect. approved_by stays as the record of who reviewed.
DROP TRIGGER IF EXISTS oral_narratives_advisor_approval ON oral_narratives;
DROP FUNCTION IF EXISTS enforce_oral_narrative_approval();

COMMENT ON COLUMN oral_narratives.approved_by IS
  'User who recorded the review, when one is recorded. Review orders narratives '
  '(reviewed first); it gates neither display nor a people name. DEC-055, REQ-172.';
COMMENT ON COLUMN oral_narratives.carrier_ref IS
  'Opaque stable reference for the carrier. Never returned by the public API; '
  'each narrative counts as its own source. DEC-055, REQ-172.';

-- 4. Name-record gate. People keep their scoped branch (089), minus review;
-- every other entity type accepts any recorded tier, as patronymes already
-- did. A NULL tier still qualifies nothing: the validator fails it before any
-- load (REQ-169), and this stays the backstop.
CREATE OR REPLACE FUNCTION enforce_name_record_sources()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_qualifying_source_count INTEGER;
BEGIN
  IF NEW.assertion_id IS NULL THEN
    RAISE EXCEPTION
      'name_records row rejected: assertion_id is required (source or drop).'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT COUNT(DISTINCT s.id)
  INTO v_qualifying_source_count
  FROM assertions a
  LEFT JOIN LATERAL UNNEST(COALESCE(a.source_ids, '{}'::UUID[])) AS src_id ON true
  LEFT JOIN sources s ON s.id = src_id
  WHERE a.id = NEW.assertion_id
    AND (
      (NEW.entity_type <> 'people' AND s.tier IS NOT NULL)
      OR (NEW.entity_type = 'people' AND (
        s.tier IN ('official', 'referenced')
        OR (s.source_kind = 'ethniafrica_synthesis'
          AND s.tier = 'unverified')
        OR (s.source_kind = 'oral_tradition'
          AND s.tier = 'unverified'
          AND a.entity_type = 'people'
          AND a.entity_id = NEW.entity_id
          AND EXISTS (
            SELECT 1
            FROM oral_narratives n
            JOIN oral_narrative_links l ON l.narrative_id = n.id
            WHERE n.id = s.oral_narrative_id
              AND n.rights_status = 'cleared'
              AND n.review_status <> 'rejected'
              AND l.entity_type = 'people'
              AND l.entity_id = NEW.entity_id
          ))
      ))
    );

  IF COALESCE(v_qualifying_source_count, 0) = 0 THEN
    RAISE EXCEPTION
      'name_records row rejected: assertion % cites no qualifying source for entity_type %.',
      NEW.assertion_id,
      NEW.entity_type
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION enforce_name_record_sources() IS
  'BEFORE INSERT OR UPDATE name-record gate. People names accept official or '
  'referenced evidence, revisable EthniAfrica synthesis, or one rights-cleared '
  'oral account linked to the same people, reviewed or not (rejected excluded). '
  'Every other entity type accepts a source at any recorded tier. '
  'DEC-052, DEC-055, REQ-161, REQ-172, REQ-173.';
COMMENT ON TRIGGER name_records_source_or_drop ON name_records IS
  'Source-or-drop: a name record needs at least one source with a tier; people '
  'names keep the oral-tradition and synthesis scope of DEC-052 without review. '
  'DEC-055.';

-- 5. Confidence: identical to 089 except the source count, which is now one
-- per source. The join to oral_narratives existed only for carrier_ref.
CREATE OR REPLACE FUNCTION recompute_confidence(
  p_entity_type TEXT,
  p_entity_id   TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_source_count        INTEGER := 0;
  v_avg_source_quality  DECIMAL(3,2);
  v_open_flag_count     INTEGER := 0;
  v_last_audit          TIMESTAMPTZ;
  v_recency_factor      NUMERIC := 0;
  v_score               DECIMAL(3,2);
  v_now                 TIMESTAMPTZ := NOW();
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(DISTINCT s.id)::INTEGER,
    AVG(
      CASE
        WHEN s.id IS NULL THEN NULL
        WHEN s.source_kind = 'oral_tradition' THEN 0.6
        WHEN s.source_kind = 'ethniafrica_synthesis' THEN 0.3
        ELSE (
          CASE
            WHEN s.tier = 'official' THEN 1.0
            WHEN s.tier = 'referenced' THEN 0.7
            WHEN s.tier IS NULL OR s.tier IN ('unverified', 'needs_review') THEN 0.4
          END
          * CASE WHEN s.source_kind = 'ai_generated' THEN 0.5 ELSE 1.0 END
        )
      END
    )::DECIMAL(3,2)
  INTO
    v_source_count,
    v_avg_source_quality
  FROM assertions a
  LEFT JOIN LATERAL UNNEST(COALESCE(a.source_ids, '{}'::UUID[])) AS src_id ON true
  LEFT JOIN sources s ON s.id = src_id
  WHERE a.entity_type = p_entity_type
    AND a.entity_id = p_entity_id;

  SELECT COUNT(*)::INTEGER
  INTO v_open_flag_count
  FROM flags
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND status = 'open';

  SELECT cs.last_human_audit_at
  INTO v_last_audit
  FROM confidence_scores cs
  WHERE cs.entity_type = p_entity_type
    AND cs.entity_id = p_entity_id
  LIMIT 1;

  IF v_last_audit IS NOT NULL THEN
    v_recency_factor := GREATEST(
      0,
      LEAST(
        1,
        1 - GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_last_audit)) / 86400 - 365) / 365
      )
    );
  END IF;

  v_score := GREATEST(
    0,
    LEAST(
      1,
      0.50 * LEAST(v_source_count::NUMERIC / 5, 1)
      + 0.30 * COALESCE(v_avg_source_quality, 0)
      + 0.20 * v_recency_factor
      - 0.10 * LEAST(v_open_flag_count::NUMERIC / 5, 1)
    )
  )::DECIMAL(3,2);

  INSERT INTO confidence_scores (
    entity_type, entity_id, score, source_count, avg_source_quality,
    open_flag_count, last_human_audit_at, recomputed_at
  )
  VALUES (
    p_entity_type, p_entity_id, v_score, v_source_count, v_avg_source_quality,
    v_open_flag_count, v_last_audit, v_now
  )
  ON CONFLICT (entity_type, entity_id)
  DO UPDATE SET
    score               = EXCLUDED.score,
    source_count        = EXCLUDED.source_count,
    avg_source_quality  = EXCLUDED.avg_source_quality,
    open_flag_count     = EXCLUDED.open_flag_count,
    last_human_audit_at = COALESCE(EXCLUDED.last_human_audit_at, confidence_scores.last_human_audit_at),
    recomputed_at       = EXCLUDED.recomputed_at;
END;
$$;

COMMENT ON FUNCTION recompute_confidence(TEXT, TEXT) IS
  'Derived confidence score. Oral tradition has fixed quality 0.6 and revisable '
  'EthniAfrica synthesis fixed quality 0.3, each replacing tier weight. Other '
  'sources retain tier weight (official 1.0, referenced 0.7, unverified, '
  'needs_review or no tier 0.4) times 0.5 for AI provenance. Every source counts '
  'once in the source count, each oral narrative included, whoever carried it. '
  'DEC-052, DEC-055, REQ-161, REQ-172.';
