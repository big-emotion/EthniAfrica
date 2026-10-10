-- Migration 099: oral tradition weighs as writing in recompute_confidence()
-- REQ-195, DEC-070 point 3, ARCH-029. Supersedes the 0.6 oral weight of
-- REQ-161 / DEC-052 point 4 (migrations 089 and 091).
--
-- An oral_tradition source now takes the quality weight of a referenced
-- written source. Internal scores drive quiz eligibility and indexing, so a
-- lower oral weight ranked the griot below the book even with no score shown.
-- EthniAfrica synthesis (0.3) and AI provenance (x0.5) keep their reduced
-- weights: they summarise, they do not speak.
--
-- Unchanged: the source count (one per source, every narrative included, as
-- 091 set it for DEC-055 point 7), the score formula, and the consent gate of
-- enforce_name_record_sources(). This migration rewrites no source, narrative
-- or name row.

-- 1. Confidence: identical to 091 except the oral_tradition weight, which is
-- the referenced weight written out in the tier CASE below.
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
        WHEN s.source_kind = 'oral_tradition' THEN 0.7
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
  'Derived confidence score. Oral tradition weighs as a referenced written '
  'source (0.7); revisable EthniAfrica synthesis has fixed quality 0.3. Other '
  'sources retain tier weight (official 1.0, referenced 0.7, unverified, '
  'needs_review or no tier 0.4) times 0.5 for AI provenance. Every source counts '
  'once in the source count, each oral narrative included, whoever carried it. '
  'DEC-055, DEC-070, REQ-172, REQ-195.';

-- 2. Recompute the stored scores the new weight moves: only entities whose
-- assertions cite an oral tradition. A blanket recompute would also erase the
-- URL-health penalties scripts/recomputeConfidence.ts applies to other fiches.
DO $$
DECLARE
  v_entity RECORD;
BEGIN
  FOR v_entity IN
    SELECT DISTINCT a.entity_type, a.entity_id
    FROM assertions a
    CROSS JOIN LATERAL UNNEST(COALESCE(a.source_ids, '{}'::UUID[])) AS src_id
    JOIN sources s ON s.id = src_id
    WHERE s.source_kind = 'oral_tradition'
  LOOP
    PERFORM recompute_confidence(v_entity.entity_type, v_entity.entity_id);
  END LOOP;
END $$;
