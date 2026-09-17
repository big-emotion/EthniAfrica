-- =============================================================================
-- Migration 092: flags.remediation_state — what changed in the corpus,
--                separately from what the atlas thought of the report
-- =============================================================================
-- `flags.status` says what the atlas thinks of a remark. It has never said
-- anything about the corpus, and the public page said otherwise anyway: the
-- label for `accepted` was hard-coded to « acceptée · page mise à jour », so
-- accepting a report asserted a correction nobody had published.
--
-- Measured on flag 00EZK83QDV (Western Sahara drawn inside Morocco), accepted
-- 2026-09-16 at 08:02 UTC. The map fix was merged into the integration branch
-- and deployed nowhere; the reader was told the page had been updated.
--
-- So there are two axes. Disposition is `status` and stays a moderator's
-- decision. Remediation is this column and is written by the publication of a
-- correction — never by a moderator click.
--
-- The invariant lives here rather than in the application
-- ------------------------------------------------------
-- `remediation_state = 'published'` requires `remediation_published_at`. The
-- whole point of the second axis is that no application path can declare a
-- correction done, and a rule enforced in TypeScript is a rule one handler,
-- one script or one console query walks around. Postgres refuses the row.
--
-- Backfill
-- --------
-- Every terminal row gets the state its history already implies: `accepted`
-- owes a correction nobody has published, so `not_started`; `rejected`,
-- `duplicate` and `withdrawn` owe none, so `not_applicable`. A report still
-- open or under review has no answer yet and stays NULL — a decision that has
-- not been taken is not a remediation that does not apply.
--
-- Idempotent: re-running this migration must not error.
--
-- Two-step rollout: recette on merge (migrate-recette.yml), production on the
-- next published Release (deploy-production.yml, `migrate` job).
-- =============================================================================

ALTER TABLE flags
  ADD COLUMN IF NOT EXISTS remediation_state        TEXT,
  ADD COLUMN IF NOT EXISTS remediation_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remediation_summary      TEXT,
  ADD COLUMN IF NOT EXISTS revision_draft_id        UUID;

-- Added separately from the column so a re-run finds it by name.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flags_revision_draft_id_fkey'
  ) THEN
    ALTER TABLE flags
      ADD CONSTRAINT flags_revision_draft_id_fkey
      FOREIGN KEY (revision_draft_id)
      REFERENCES revision_drafts(id)
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE flags DROP CONSTRAINT IF EXISTS flags_remediation_state_check;
ALTER TABLE flags
  ADD CONSTRAINT flags_remediation_state_check
  CHECK (
    remediation_state IS NULL
    OR remediation_state IN (
      'not_started', 'in_progress', 'published', 'not_applicable'
    )
  );

-- The invariant. A published correction without the date it was published is
-- the defect this migration exists to make impossible.
ALTER TABLE flags DROP CONSTRAINT IF EXISTS flags_remediation_published_check;
ALTER TABLE flags
  ADD CONSTRAINT flags_remediation_published_check
  CHECK (
    remediation_state IS DISTINCT FROM 'published'
    OR remediation_published_at IS NOT NULL
  );

COMMENT ON COLUMN flags.remediation_state IS
  'What changed in the corpus: not_started | in_progress | published | '
  'not_applicable. NULL while the report is still open or under review. '
  'Written by the publication of a correction, never by a moderator decision '
  '- see docs/design/moderation-charter.md section 5.';

COMMENT ON COLUMN flags.remediation_published_at IS
  'When the correction reached the published corpus. Mandatory for '
  'remediation_state = published (flags_remediation_published_check).';

COMMENT ON COLUMN flags.remediation_summary IS
  'One reader-facing sentence naming what changed, published verbatim on the '
  'public report page. Subject to the reader-facing register: no repository '
  'path, no JSON field path, no raw corpus identifier, none of the pipeline '
  'vocabulary - see docs/editorial/reader-facing-register.md.';

COMMENT ON COLUMN flags.revision_draft_id IS
  'The revision draft that carries the correction, when one exists. The '
  'revision loop is not closed yet (moderation-charter section 7), so this is '
  'NULL on every backfilled row.';

-- Backfill: terminal rows only, and only where nothing has been recorded yet.
UPDATE flags
   SET remediation_state = 'not_started'
 WHERE remediation_state IS NULL
   AND status = 'accepted';

UPDATE flags
   SET remediation_state = 'not_applicable'
 WHERE remediation_state IS NULL
   AND status IN ('rejected', 'duplicate', 'withdrawn');

-- The public queue filters and sorts on the pair; a report page reads one row.
CREATE INDEX IF NOT EXISTS idx_flags_remediation_state
  ON flags (remediation_state)
  WHERE remediation_state IS NOT NULL;
