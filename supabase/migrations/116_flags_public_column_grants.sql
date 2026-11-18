-- =============================================================================
-- Migration 116: what the anon key and a self-registered session can reach
-- =============================================================================
-- Readers are about to get accounts (magic link) so they can comment. Until
-- now the only people who could hold a session were moderators, so every
-- policy written `TO authenticated` quietly meant "TO a moderator". From the
-- day sign-up opens it means "TO anyone with an e-mail address". This
-- migration closes what that would open, and one leak that is open today.
--
-- 1. flags — public read limited to public columns
--    `flags_read_public` is SELECT USING (true), and RLS filters rows, never
--    columns. Our API selects an explicit column list, but PostgREST does not
--    go through our API: with the anon key, `select=contribution_payload`
--    returned the name and e-mail address a contributor left (migration 081
--    moved the retired `contributions` rows, addresses included, into that
--    column). Column privileges are the layer that filters columns, so the
--    table-level grant is withdrawn and SELECT is granted back on the public
--    columns only. The list is `src/lib/flags/publicFlagColumns.ts`; the
--    contract test `scripts/__tests__/flagsPublicColumnGrantsMigration.test.ts`
--    holds this file to it. A new public column must be added in both places.
--
-- 2. flags — no direct writes from a client
--    `flags_contributor_insert` (048) let any session INSERT a flag with
--    `human_verified = true` straight through PostgREST, skipping the proof
--    of work, the honeypot and the rate limit the handler applies.
--    `flags_contributor_withdraw` (022) let the author of an open flag UPDATE
--    it to withdrawn — and, since the check only constrained status and
--    author, rewrite its text in the same statement. Every site write goes
--    through the service-role client, which bypasses RLS, so both policies
--    and the write privileges go.
--
-- 3. contributor_profiles — no self-served role
--    Two migrations created this table (023 with `user_id`, 026 with `id` as
--    the auth uid; 023 ran first, so 026's CREATE was a no-op but its policy
--    landed). `contributor_profiles_own_rw` is FOR ALL WITH CHECK
--    (auth.uid() = id): any session could INSERT a row with its own uid as
--    `id` and `user_id` and `moderator_role = 'admin'`. `revision_drafts`,
--    `source_working_assets`, the storage bucket and `publish_revision()`
--    (SECURITY DEFINER, executable by authenticated) all trust that column.
--    `contributor_profiles_self_update` let an existing row raise its own
--    role the same way. No code writes this table with a user's client
--    (authorization moved to `admin_allowlist`, migration 074), so both
--    policies and every write privilege go. Public read stays: the register
--    shows a contributor's chosen display name.
--
-- 4. audit_log — read through the API only
--    `audit_log_read_public` (023) exposed every row, `ip_address` and the
--    user-agent in `metadata` included. The public trail is served by
--    `/api/v2/flags/{id}/audit` through the service-role client, which
--    selects role and decision, not identity. Direct reads go.
--
-- 5. source_working_assets — uploads are the service's
--    Owner policies (034) let any session create rows and upload objects to
--    the private `source-working-assets` bucket under its own uid folder:
--    free storage for anyone with an account. The reference library writes
--    through the service-role client after checking the moderator
--    allowlist, so the owner write policies go.
--
-- Re-runnable: DROP POLICY IF EXISTS, REVOKE and GRANT are all idempotent.
-- REVOKE ALL on a table also clears the column privileges granted on it, so
-- the column list below is the whole truth after every run.
-- =============================================================================


-- 1 + 2. flags --------------------------------------------------------------

DROP POLICY IF EXISTS flags_contributor_insert ON public.flags;
DROP POLICY IF EXISTS flags_contributor_withdraw ON public.flags;

REVOKE ALL ON public.flags FROM anon, authenticated;

GRANT SELECT (
  id,
  public_slug,
  entity_type,
  entity_id,
  assertion_field_path,
  assertion_id,
  flag_kind,
  reason_text,
  counter_source_url,
  counter_source_citation,
  proposed_rewrite,
  contributor_id,
  severity,
  auto_generated,
  status,
  created_at,
  updated_at,
  resolved_at,
  moderator_notes,
  remediation_state,
  remediation_published_at,
  remediation_summary
) ON public.flags TO anon, authenticated;

COMMENT ON POLICY flags_read_public ON public.flags IS
  'Every row is public; the columns are not. anon and authenticated hold '
  'SELECT on the public columns only (migration 116), so contribution_payload '
  'and the moderation internals stay with the service-role client.';


-- 3. contributor_profiles ---------------------------------------------------

DROP POLICY IF EXISTS contributor_profiles_self_update ON public.contributor_profiles;
DROP POLICY IF EXISTS contributor_profiles_own_rw ON public.contributor_profiles;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.contributor_profiles FROM anon, authenticated;


-- 4. audit_log --------------------------------------------------------------

DROP POLICY IF EXISTS audit_log_read_public ON public.audit_log;

REVOKE ALL ON public.audit_log FROM anon, authenticated;


-- 5. source_working_assets --------------------------------------------------

DROP POLICY IF EXISTS source_working_assets_owner_insert ON public.source_working_assets;
DROP POLICY IF EXISTS source_working_assets_owner_update ON public.source_working_assets;
DROP POLICY IF EXISTS source_working_assets_owner_delete ON public.source_working_assets;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.source_working_assets FROM anon, authenticated;

DROP POLICY IF EXISTS source_working_assets_objects_owner_insert ON storage.objects;
DROP POLICY IF EXISTS source_working_assets_objects_owner_update ON storage.objects;
DROP POLICY IF EXISTS source_working_assets_objects_owner_delete ON storage.objects;
