-- Migration 089: oral tradition and revisable synthesis for people's names
-- DEC-052 is a limited exception to REQ-095. One approved, rights-cleared
-- oral narrative, linked to the same people, can support a name record.
-- Source-kind weights replace the tier weight for these two kinds; they are
-- not coefficients. Collection-framework validation belongs to ETNI-1925.
-- This migration does not rewrite existing source or narrative rows.

-- The source kind describes provenance; both new kinds carry unverified tier.
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_source_kind_check;
ALTER TABLE sources
  ADD CONSTRAINT sources_source_kind_check
  CHECK (
    source_kind IS NULL OR source_kind IN (
      'intergovernmental', 'government', 'official_statistics',
      'linguistic_reference', 'academic', 'community', 'repository',
      'archive', 'discovery', 'ai_generated', 'unknown',
      'oral_tradition', 'ethniafrica_synthesis'
    )
  );

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS oral_narrative_id UUID REFERENCES oral_narratives(id);

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_oral_narrative_id_check;
ALTER TABLE sources
  ADD CONSTRAINT sources_oral_narrative_id_check
  CHECK (
    (source_kind IS NOT DISTINCT FROM 'oral_tradition' AND oral_narrative_id IS NOT NULL)
    OR (source_kind IS DISTINCT FROM 'oral_tradition' AND oral_narrative_id IS NULL)
  );

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_new_kind_tier_check;
ALTER TABLE sources
  ADD CONSTRAINT sources_new_kind_tier_check
  CHECK (
    (source_kind IS DISTINCT FROM 'oral_tradition'
      AND source_kind IS DISTINCT FROM 'ethniafrica_synthesis')
    OR tier IS NOT DISTINCT FROM 'unverified'
  );

CREATE INDEX IF NOT EXISTS idx_sources_oral_narrative_id
  ON sources(oral_narrative_id) WHERE oral_narrative_id IS NOT NULL;

COMMENT ON COLUMN sources.oral_narrative_id IS
  'Required exactly when source_kind is oral_tradition; points to the oral account.';
COMMENT ON CONSTRAINT sources_new_kind_tier_check ON sources IS
  'Oral tradition and EthniAfrica synthesis carry unverified authority. Their fixed confidence weights replace the tier weight.';

-- Existing narratives retain NULL in the new framework fields. The CI
-- contract for newly authored ORL_ records is implemented by ETNI-1925.
ALTER TABLE oral_narratives DROP CONSTRAINT IF EXISTS oral_narratives_narrative_kind_check;
ALTER TABLE oral_narratives
  ADD CONSTRAINT oral_narratives_narrative_kind_check
  CHECK (narrative_kind IN (
    'tradition', 'testimony', 'memory', 'story',
    'song', 'genealogy', 'motto', 'proverb'
  ));

ALTER TABLE oral_narratives
  ADD COLUMN IF NOT EXISTS carrier_role TEXT,
  ADD COLUMN IF NOT EXISTS carrier_ref TEXT,
  ADD COLUMN IF NOT EXISTS consent_evidence TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE oral_narratives DROP CONSTRAINT IF EXISTS oral_narratives_consent_evidence_check;
ALTER TABLE oral_narratives
  ADD CONSTRAINT oral_narratives_consent_evidence_check
  CHECK (consent_evidence IS NULL OR consent_evidence IN ('written_note', 'recording'));

COMMENT ON COLUMN oral_narratives.carrier_role IS
  'Role of the account carrier in the community, without publishing their identity.';
COMMENT ON COLUMN oral_narratives.carrier_ref IS
  'Opaque stable reference for the carrier; repeated accounts from one carrier count once.';
COMMENT ON COLUMN oral_narratives.consent_evidence IS
  'Type of consent evidence; the evidence itself stays outside the public corpus.';
COMMENT ON COLUMN oral_narratives.approved_by IS
  'Advisor user who approved this account through the reviewed corpus workflow.';

-- A SECURITY DEFINER trigger can read user_roles despite its RLS policies.
-- The function is not a public RPC; only the table trigger should invoke it.
CREATE OR REPLACE FUNCTION enforce_oral_narrative_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.review_status = 'approved' THEN
    IF NEW.approved_by IS NULL OR NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = NEW.approved_by
        AND role = 'advisor'
    ) THEN
      RAISE EXCEPTION
        'oral_narratives row rejected: approval requires an advisor in approved_by.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS oral_narratives_advisor_approval ON oral_narratives;
CREATE TRIGGER oral_narratives_advisor_approval
  BEFORE INSERT OR UPDATE ON oral_narratives
  FOR EACH ROW EXECUTE FUNCTION enforce_oral_narrative_approval();

REVOKE EXECUTE ON FUNCTION enforce_oral_narrative_approval()
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION enforce_oral_narrative_approval() IS
  'An approved oral account must name an existing advisor in approved_by. '
  'SECURITY DEFINER bypasses user_roles RLS; only the trigger calls it. REQ-161.';

-- Keep 067's patronyme and other-entity tiers. The new exception is scoped
-- to people, and an oral source qualifies only through a cleared account
-- linked to this exact people's identifier. A single source is sufficient.
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
      (NEW.entity_type = 'patronyme'
        AND s.tier IN ('official', 'referenced', 'unverified'))
      OR (NEW.entity_type NOT IN ('people', 'patronyme')
        AND s.tier IN ('official', 'referenced'))
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
              AND n.review_status = 'approved'
              AND n.rights_status = 'cleared'
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
  'referenced evidence, revisable EthniAfrica synthesis, or one approved and '
  'rights-cleared oral account linked to the same people. Patronyme and other '
  'entity gates retain migration 067 rules. DEC-052, REQ-161.';
COMMENT ON TRIGGER name_records_source_or_drop ON name_records IS
  'Source-or-drop: the people-name exception is limited to approved oral '
  'tradition and revisable synthesis; other gates retain migration 067 rules.';

-- Preserve 088's ordinary tier/provenance formula and score computation.
-- Only the two new provenance kinds bypass that formula. Source count uses an
-- opaque carrier reference for oral accounts, so repetitions do not inflate it.
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
  'Derived confidence score. Oral tradition has fixed quality 0.6 and revisable '
  'EthniAfrica synthesis fixed quality 0.3, each replacing tier weight. Other '
  'sources retain tier weight (official 1.0, referenced 0.7, unverified, '
  'needs_review or no tier 0.4) times 0.5 for AI provenance. Oral source count '
  'deduplicates by opaque carrier_ref. DEC-052, REQ-161.';
