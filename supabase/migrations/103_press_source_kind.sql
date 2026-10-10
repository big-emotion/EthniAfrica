-- Migration 103: a press article is a source kind of its own
-- REQ-194, REQ-161. ETNI-2033.
--
-- The vocabulary had no press type, so a Jeune Afrique or Le Monde article
-- read « Type non précisé » (unknown) or « Organisation communautaire »
-- (community) to the reader. `press` joins the CHECK that mirrors
-- SOURCE_KINDS in src/types/sources.ts.
--
-- recompute_confidence() is deliberately left as migration 102 wrote it: every
-- kind other than oral_tradition and ethniafrica_synthesis is weighed by its
-- tier (official 1.0, referenced 0.7, unverified 0.4), times 0.5 for
-- ai_generated only. A press article therefore weighs exactly like any other
-- written source of the same tier, which is the intended rule.
--
-- This migration only widens the constraint; it rewrites no row. Sources are
-- reclassified by the next corpus load from the fiches.

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_source_kind_check;
ALTER TABLE sources
  ADD CONSTRAINT sources_source_kind_check
  CHECK (
    source_kind IS NULL OR source_kind IN (
      'intergovernmental', 'government', 'official_statistics',
      'linguistic_reference', 'academic', 'press', 'community', 'repository',
      'archive', 'discovery', 'ai_generated', 'unknown',
      'oral_tradition', 'ethniafrica_synthesis'
    )
  );
