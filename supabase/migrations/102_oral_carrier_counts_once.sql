-- Migration 102: several oral narratives from one carrier count as one source
-- REQ-199. Supersedes in part REQ-172 and DEC-055 point 6 as migrations 091
-- and 099 implemented them, and restores the carrier rule REQ-161 states.
--
-- recompute_confidence() counts oral sources by the opaque carrier_ref of
-- their narrative (REQ-162), as migration 089 did: ten narratives told by one
-- carrier say how much one person knows, not how much ten people do. Narratives
-- from different carriers still count separately, and a narrative with no
-- carrier_ref counts as its own source.
--
-- Unchanged from 099: the quality weights (oral weighs as a referenced written
-- source, REQ-195), the score formula, and the consent gate of
-- enforce_name_record_sources(). The quality average keeps one row per cited
-- source, as in 089. carrier_ref is read here and never returned by the public
-- API. This migration rewrites no source, narrative or name row.

-- 1. Confidence: identical to 099 except the source count, keyed per carrier
-- for oral sources whose narrative records one.
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
    COUNT(DISTINCT CASE
      WHEN s.id IS NULL THEN NULL
      WHEN s.source_kind = 'oral_tradition' AND n.carrier_ref IS NOT NULL
        THEN 'carrier:' || n.carrier_ref
      ELSE 'source:' || s.id::TEXT
    END)::INTEGER,
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
  LEFT JOIN oral_narratives n ON n.id = s.oral_narrative_id
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
  'needs_review or no tier 0.4) times 0.5 for AI provenance. The source count '
  'keys oral sources by their narrative''s opaque carrier_ref, so several '
  'narratives from one carrier count once. DEC-070, REQ-161, REQ-195, REQ-199.';

COMMENT ON COLUMN oral_narratives.carrier_ref IS
  'Opaque stable reference for the carrier. Never returned by the public API; '
  'several narratives from one carrier count as one source in '
  'recompute_confidence(). REQ-162, REQ-199.';

-- 2. Recompute the stored scores the new count moves: only entities whose
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
