-- Migration 105: encyclopedias, NGOs and mission people-group databases are
-- source kinds of their own
-- REQ-161. ETNI-2007.
--
-- The rule pass of ETNI-2007 left about a thousand fiche sources untyped
-- because no kind described them honestly: Joshua Project and other mission
-- people-group databases, edited encyclopedias (Britannica, encyclopedia.com,
-- Larousse…) and advocacy NGOs (Minority Rights Group, IWGIA, Human Rights
-- Watch…). Calling them `community` or `academic` would mislabel them to the
-- reader, so `encyclopedia`, `ngo` and `missionary_database` join the CHECK
-- that mirrors SOURCE_KINDS in src/types/sources.ts.
--
-- recompute_confidence() is deliberately left as migration 102 wrote it: these
-- kinds are weighed by their tier, like any written source.
--
-- This migration only widens the constraint; it rewrites no row. Sources are
-- reclassified by the next corpus load from the fiches.

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_source_kind_check;
ALTER TABLE sources
  ADD CONSTRAINT sources_source_kind_check
  CHECK (
    source_kind IS NULL OR source_kind IN (
      'intergovernmental', 'government', 'official_statistics',
      'linguistic_reference', 'academic', 'press', 'encyclopedia', 'ngo',
      'missionary_database', 'community', 'repository', 'archive',
      'discovery', 'ai_generated', 'unknown', 'oral_tradition',
      'ethniafrica_synthesis'
    )
  );
