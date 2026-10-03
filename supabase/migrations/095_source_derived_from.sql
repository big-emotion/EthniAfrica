-- Migration 095 — sources.derived_from_source_id: a source that repeats another
--
-- recompute_confidence() counts source IDs (migration 091 removed the last
-- carrier-based merge), so two sources count as two even when one is a copy of
-- the other: a press article quoting a survey, a mirror of a published book, a
-- tertiary encyclopedia summarising its own references. The schema had no way
-- to say so. Quantity was being read as corroboration, which remediation item
-- T02 names as the one thing the confidence number must not do.
--
-- This migration adds only the place to say it. A source may point at the
-- source it repeats; nothing reads the column yet, and recompute_confidence()
-- is deliberately unchanged, because how a chain of copies should weigh on the
-- score is an editorial decision (T01) and not one a column can make.
--
-- Nullable, because the overwhelming majority of sources are original and an
-- unset link means exactly that. ON DELETE SET NULL, because removing the
-- origin from the table must leave the copy standing as a source in its own
-- right rather than delete a citation a reader may still be looking at. A
-- source cannot derive from itself.
--
-- sources is readable by anyone (009: sources_read_public), and so is this
-- column. It holds another source's identifier, which is already public.
--
-- Idempotent throughout (IF NOT EXISTS / pg_constraint guard), same discipline
-- as 031 and 093. Human-applied via `supabase db push`; this migration is
-- code-complete without database application, and nothing here applies it.
-- Two-step rollout: recette first, production second.
-- =============================================================================

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS derived_from_source_id UUID
    REFERENCES sources(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sources_not_derived_from_itself'
  ) THEN
    ALTER TABLE sources
      ADD CONSTRAINT sources_not_derived_from_itself
      CHECK (derived_from_source_id IS DISTINCT FROM id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sources_derived_from
  ON sources(derived_from_source_id)
  WHERE derived_from_source_id IS NOT NULL;

COMMENT ON COLUMN sources.derived_from_source_id IS
  'The source this one repeats, when it is a copy, a quotation or a summary '
  'of another row of this table. NULL means original. Not read by '
  'recompute_confidence(): how copies weigh on the score is an editorial '
  'decision (remediation T02 / T01), not a schema one.';
