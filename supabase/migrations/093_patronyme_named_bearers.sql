-- Migration 093 — the bearers the corpus can only name: afrik_patronyme_bearers
--
-- 064 gave a name its bearers as a join to persons (ARCH-018). That join has
-- never carried a row from the corpus, and cannot: ARCH-018 defines no
-- person model (there is no public/modele-personne.json) and no dataset
-- directory to author one, persons.id is constrained to ^PER_[A-Z0-9_]+$,
-- role_category is NOT NULL, and 057's "source or nothing" trigger refuses a
-- person with no assertion behind them. Minting a PER_ row from a fiche
-- would therefore be inventing corpus the editors never wrote.
--
-- So every bearer the editorial work actually records names its subject
-- inline: measured on 2026-09-16, 75 of the 796 PAT_* dossiers carry
-- bearers, 89 bearers in all, every one of them a displayName and not one a
-- personId. The loader guarded all three of its bearer paths on personId,
-- so that work reached no table, no API and no reader — and did so silently,
-- with no error and no warning.
--
-- This table is that missing destination, added beside afrik_patronyme_persons
-- rather than in place of it. The two are not alternatives: a bearer with a
-- personId still goes to 064's join, a bearer with a displayName comes here,
-- and a bearer carrying both is written to both. display_name is part of the
-- primary key because it is the only identity such a bearer has — the same
-- person cited by three sources is one row, and a rerun of the loader
-- overwrites rather than duplicates.
--
-- status is deliberately plain TEXT, not an enum. The bearer status lives in
-- the strict fiche model (deceased / aggregated / living_self_identified,
-- DEC-040 governing the living), which is where it is validated; a second
-- SQL-side vocabulary would only drift from it.
--
-- Idempotent throughout (IF NOT EXISTS / DROP-then-CREATE), same discipline
-- as 053 and 064. Human-applied via `supabase db push`; this migration is
-- code-complete without database application, and nothing here applies it.
-- Two-step rollout: recette first, production second.
-- =============================================================================

CREATE TABLE IF NOT EXISTS afrik_patronyme_bearers (
  patronyme_id TEXT NOT NULL REFERENCES afrik_patronymes(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL,
  PRIMARY KEY (patronyme_id, display_name)
);

COMMENT ON TABLE afrik_patronyme_bearers IS
  'Bearers of a name (afrik_patronymes) that the corpus can only name in '
  'prose, because no person entity can be authored for them (ARCH-018). '
  'Complements afrik_patronyme_persons (064), which holds the bearers that '
  'do resolve to a PER_ row; neither replaces the other.';
COMMENT ON COLUMN afrik_patronyme_bearers.display_name IS
  'The bearer''s name as the fiche states it. Part of the primary key: it is '
  'the only identity this bearer has, so it is also what deduplicates them.';
COMMENT ON COLUMN afrik_patronyme_bearers.status IS
  'The fiche''s bearer status (deceased / aggregated / living_self_identified). '
  'Kept as TEXT — the strict fiche model owns that vocabulary, DEC-040 governs '
  'the living, and a second SQL enum would only drift from both.';

CREATE INDEX IF NOT EXISTS idx_afrik_patronyme_bearers_patronyme_id ON afrik_patronyme_bearers(patronyme_id);

-- =============================================================================
-- RLS — public read, service-role-only writes (pattern from 053/064)
-- =============================================================================
ALTER TABLE afrik_patronyme_bearers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS afrik_patronyme_bearers_read_public ON afrik_patronyme_bearers;
CREATE POLICY afrik_patronyme_bearers_read_public ON afrik_patronyme_bearers
  FOR SELECT USING (true);

-- Deliberately no INSERT/UPDATE/DELETE policy for anon or authenticated —
-- writes flow only through the service-role loader, which bypasses RLS via
-- SUPABASE_SERVICE_ROLE_KEY (same posture as afrik_patronyme_persons).
