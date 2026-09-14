-- =============================================================================
-- Migration 090: source_tier_ruling_drafts — a moderator's decision, not yet a ruling
-- =============================================================================
-- The corpus carries citations marked `needs_review`: nobody has ruled on their
-- authority. The admin review queue (/fr/admin/sources) lets a moderator decide
-- on one citation identity — an exact title and url — at a time.
--
-- A decision cannot be written to `sources.tier` directly. The corpus sync
-- re-upserts every tier from the fiche JSON, and the fiche pages read tiers from
-- the JSON, so a database-only edit is overwritten at the next load. A decision
-- is therefore recorded here as a draft, pulled into the git ruling ledger
-- (docs/editorial/source-review/source-tier-rulings.json) by
-- scripts/afrik/pullSourceTierRulings.ts, and written into the fiches by
-- scripts/afrik/applySourceTierRulings.ts. Nothing reads this table to publish.
--
-- Shape
-- -----
-- `decision` is tier | repair | remove, mirroring SOURCE_TIER_RULING_DECISIONS
-- in src/types/sources.ts. `tier` states one of the three tiers — never
-- needs_review, which is the absence of a ruling — and is required for tier and
-- repair, absent for remove. `repaired_url` exists for a repair only. The
-- rationale is mandatory: it is what the next reviewer reads in the ledger, and
-- it never reaches `sources[].notes`, which readers see verbatim.
--
-- `decided_by` is the moderator's auth account id, not an address: the ledger it
-- is copied into is published in a public repository.
--
-- Security
-- --------
-- RLS is enabled and *no policy is created*, as for admin_allowlist (074). With
-- RLS on and no policy every role but service_role is denied: moderators'
-- drafts and rationales are not public. Writes go through
-- src/api/v2/services/sourceTierRulings.ts on the service-role client, after the
-- handler has checked the allowlist.
--
-- Idempotent: re-running this migration must not error.
--
-- Two-step rollout: recette on merge (migrate-recette.yml), production on the
-- next published Release (deploy-production.yml, `migrate` job).
-- =============================================================================

CREATE TABLE IF NOT EXISTS source_tier_ruling_drafts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_path   TEXT        NOT NULL,
  source_title TEXT        NOT NULL,
  source_url   TEXT,
  decision     TEXT        NOT NULL,
  tier         TEXT,
  repaired_url TEXT,
  rationale    TEXT        NOT NULL,
  decided_by   UUID        NOT NULL,
  decided_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT source_tier_ruling_drafts_decision_check
    CHECK (decision IN ('tier', 'repair', 'remove')),
  CONSTRAINT source_tier_ruling_drafts_tier_check
    CHECK (tier IS NULL OR tier IN ('official', 'referenced', 'unverified')),
  CONSTRAINT source_tier_ruling_drafts_shape_check
    CHECK (
      (decision = 'tier' AND tier IS NOT NULL AND repaired_url IS NULL)
      OR (decision = 'repair' AND tier IS NOT NULL AND btrim(coalesce(repaired_url, '')) <> '')
      OR (decision = 'remove' AND tier IS NULL AND repaired_url IS NULL)
    ),
  CONSTRAINT source_tier_ruling_drafts_rationale_check
    CHECK (btrim(rationale) <> ''),
  CONSTRAINT source_tier_ruling_drafts_fiche_path_check
    CHECK (btrim(fiche_path) <> ''),
  CONSTRAINT source_tier_ruling_drafts_source_title_check
    CHECK (source_title <> '')
);

CREATE INDEX IF NOT EXISTS idx_source_tier_ruling_drafts_citation
  ON source_tier_ruling_drafts (source_title, source_url);

COMMENT ON TABLE source_tier_ruling_drafts IS
  'Moderator decisions on corpus citations awaiting review. A draft becomes a '
  'ruling only when pulled into docs/editorial/source-review/source-tier-rulings.json '
  'and applied to the fiches; service_role access only.';

COMMENT ON COLUMN source_tier_ruling_drafts.rationale IS
  'Why the moderator decided so. Copied into the ruling ledger; never published '
  'in sources notes.';

COMMENT ON COLUMN source_tier_ruling_drafts.decided_by IS
  'The moderator''s auth account id. Never an e-mail address: the ledger is public.';

ALTER TABLE source_tier_ruling_drafts ENABLE ROW LEVEL SECURITY;

-- Deliberately no policy: RLS enabled with none denies every role but
-- service_role. A public SELECT here would publish moderators' rationales
-- before anyone reviewed them.
