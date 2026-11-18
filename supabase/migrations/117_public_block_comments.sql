-- =============================================================================
-- Migration 117: block comments, replies and reader reports, on flags
-- =============================================================================
-- Readers are to comment on, correct and complete the blocks of a page
-- (REQ-212, ARCH-032). A comment is a `flags` row rather than a row in a new
-- table: migration 081 records that two moderation surfaces meant one that
-- nobody staffed, and `flags` already carries the state machine (022), the
-- remediation axis (092), proof of work and the rate limit.
--
-- 1. flags — where a comment sits, and whether the public may see it
--    `block_key`        `{subject}:{id}:{section}`, anchored to the data, not
--                       the page, so a comment left on the search result page
--                       shows on the fiche too. The vocabulary is
--                       `src/lib/comments/blockKey.ts`; the contract test
--                       `scripts/__tests__/blockCommentsMigration.test.ts`
--                       holds the CHECK below to it.
--    `published_at`     NULL = private, visible to the moderation console
--                       only. A comment is published once its author confirms
--                       their address. Every flag filed before this migration
--                       was already public, so the run that adds the column
--                       backfills it from `created_at` — and only that run:
--                       on a re-run, a flag still NULL is a comment waiting
--                       for its address and must stay private.
--    `hidden_at`        Set by a moderator or by three reader reports.
--    `hidden_reason`    Separate from `status`: hiding is about the thread
--                       on the page, the state machine about the corpus.
--                       Hiding keeps the text, so a moderator can restore it.
--    `knowledge_basis`  Optional "how do you know this", four neutral answers.
--                       Deliberately no wording about ethnic membership
--                       (GDPR art. 9).
--
-- 2. flags — the publication rule, in the database
--    `flags_read_public` was USING (true). It now lets anon and authenticated
--    see published, visible rows only. The API reads with the service-role
--    client and applies the same rule itself; this policy is what holds for
--    anyone calling PostgREST with the anon key. The new public columns are
--    granted column by column, after migration 116's list. `hidden_reason`
--    is not granted: a moderator's reason is not public. `hidden_at` is,
--    because the pages that read with the anon key filter on it, and under
--    this policy it is NULL on every row they can see.
--
-- 3. flag_replies, flag_abuse_reports — service-role only
--    RLS on, no policy, no privilege for anon or authenticated: every read
--    and write goes through the API's service-role client, which applies the
--    publication rule, the rate limit and the moderator check.
--    A reader report names one target (a comment or a reply) and counts once
--    per hashed address; the service hides the target at three.
--
-- Re-runnable: IF NOT EXISTS / IF EXISTS everywhere, constraints dropped
-- before they are added, the backfill guarded by the column's existence.
-- =============================================================================


-- 1. flags columns ----------------------------------------------------------

ALTER TABLE public.flags ADD COLUMN IF NOT EXISTS block_key text;
ALTER TABLE public.flags ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
ALTER TABLE public.flags ADD COLUMN IF NOT EXISTS hidden_reason text;
ALTER TABLE public.flags ADD COLUMN IF NOT EXISTS knowledge_basis text;

-- The backfill must not bump `updated_at` on every existing report: the
-- register shows it, and nothing about those reports changed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flags'
      AND column_name = 'published_at'
  ) THEN
    ALTER TABLE public.flags ADD COLUMN published_at timestamptz;
    ALTER TABLE public.flags DISABLE TRIGGER flags_updated_at;
    UPDATE public.flags SET published_at = created_at;
    ALTER TABLE public.flags ENABLE TRIGGER flags_updated_at;
  END IF;
END
$$;

ALTER TABLE public.flags DROP CONSTRAINT IF EXISTS flags_block_key_shape;
ALTER TABLE public.flags ADD CONSTRAINT flags_block_key_shape CHECK (
  block_key IS NULL
  OR block_key ~ '^(people|country|language|language_family|patronyme|place|search-query):[^:]+:(naming|origin|what|where|sources|culture|history|verdict)$'
);

ALTER TABLE public.flags DROP CONSTRAINT IF EXISTS flags_knowledge_basis_check;
ALTER TABLE public.flags ADD CONSTRAINT flags_knowledge_basis_check
  CHECK (knowledge_basis IS NULL OR knowledge_basis IN ('family', 'language', 'reading', 'other'));

ALTER TABLE public.flags DROP CONSTRAINT IF EXISTS flags_hidden_reason_needs_hidden;
ALTER TABLE public.flags ADD CONSTRAINT flags_hidden_reason_needs_hidden
  CHECK (hidden_reason IS NULL OR hidden_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_flags_visible_block_key
  ON public.flags (block_key) WHERE published_at IS NOT NULL AND hidden_at IS NULL;

COMMENT ON COLUMN public.flags.block_key IS
  '{subject}:{id}:{section} of the commented block; NULL for a report that '
  'is not a block comment. Vocabulary: src/lib/comments/blockKey.ts.';
COMMENT ON COLUMN public.flags.published_at IS
  'NULL = private (moderation console only). Set when the author confirms '
  'their address. Backfilled from created_at for flags older than 117.';
COMMENT ON COLUMN public.flags.hidden_at IS
  'Hidden from the public by a moderator or three reader reports. The text '
  'is kept.';
COMMENT ON COLUMN public.flags.hidden_reason IS
  'Why it was hidden. Moderation-only: not granted to anon.';


-- 2. flags publication rule -------------------------------------------------

DROP POLICY IF EXISTS flags_read_public ON public.flags;
CREATE POLICY flags_read_public ON public.flags
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND hidden_at IS NULL);

COMMENT ON POLICY flags_read_public ON public.flags IS
  'Published, visible flags only (migration 117). The columns are limited '
  'too: anon and authenticated hold SELECT on the public columns only '
  '(migrations 116 and 117).';

GRANT SELECT (
  block_key,
  published_at,
  hidden_at,
  knowledge_basis
) ON public.flags TO anon, authenticated;


-- 3. flag_replies -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.flag_replies (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id               uuid        NOT NULL REFERENCES public.flags(id) ON DELETE CASCADE,
  author_id             uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_moderation         boolean     NOT NULL DEFAULT false,
  display_name_snapshot text,
  body                  text        NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  hidden_at             timestamptz
);

ALTER TABLE public.flag_replies DROP CONSTRAINT IF EXISTS flag_replies_body_length;
ALTER TABLE public.flag_replies ADD CONSTRAINT flag_replies_body_length
  CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000);

CREATE INDEX IF NOT EXISTS idx_flag_replies_flag_id
  ON public.flag_replies (flag_id, created_at);

COMMENT ON TABLE public.flag_replies IS
  'One level of replies under a comment (a flag). Moderator replies carry '
  'is_moderation and are signed by the site, not by a person.';

ALTER TABLE public.flag_replies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.flag_replies FROM anon, authenticated;


-- 3. flag_abuse_reports -----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.flag_abuse_reports (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id    uuid        REFERENCES public.flags(id) ON DELETE CASCADE,
  reply_id   uuid        REFERENCES public.flag_replies(id) ON DELETE CASCADE,
  ip_hash    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flag_abuse_reports DROP CONSTRAINT IF EXISTS flag_abuse_reports_one_target;
ALTER TABLE public.flag_abuse_reports ADD CONSTRAINT flag_abuse_reports_one_target
  CHECK (num_nonnulls(flag_id, reply_id) = 1);

CREATE UNIQUE INDEX IF NOT EXISTS uq_flag_abuse_reports_flag_ip
  ON public.flag_abuse_reports (flag_id, ip_hash) WHERE flag_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_flag_abuse_reports_reply_ip
  ON public.flag_abuse_reports (reply_id, ip_hash) WHERE reply_id IS NOT NULL;

COMMENT ON TABLE public.flag_abuse_reports IS
  'A reader saying a comment or reply should not be there. One per hashed '
  'address and target; three hide the target pending a moderator.';

ALTER TABLE public.flag_abuse_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.flag_abuse_reports FROM anon, authenticated;
