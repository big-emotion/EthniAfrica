-- =============================================================================
-- Migration 118: erasing a reader account keeps its comments, forgets the reader
-- =============================================================================
-- Readers now hold accounts (REQ-213, DEC-085): the link that publishes their
-- first comment signs them in to /fr/compte. Deleting that account must keep
-- what they published, signed « Un lecteur », and must not keep their address:
-- an address is kept only for its account.
--
-- `erase_contributor_account` (migration 027) already unlinked a deleted
-- account's flags and deleted the auth user. It predates block comments, so it
-- is replaced here with the same signature and grants, and now also:
--
--   · unlinks the account's replies (migration 117) and drops their pseudonym
--     — `flag_replies.author_id` is ON DELETE SET NULL, but the pseudonym
--     snapshot would otherwise survive the account;
--   · deletes the `flag_reporter_contacts` rows of the account's address, the
--     address its comments were confirmed with. Matched case-insensitively by
--     hand: the column is citext, and with `search_path = pg_catalog` the
--     citext operator is not the one Postgres would pick;
--   · removes the name and address a contribution form left in
--     `contribution_payload` on the account's own flags.
--
-- The comments themselves stay, with their status, moderation notes and
-- replies: the account is the reader's, the discussion is everyone's.
--
-- Re-runnable: CREATE OR REPLACE, and the grants are restated.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.erase_contributor_account(
  target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  erasure_timestamp TIMESTAMPTZ := clock_timestamp();
  user_id_hash TEXT;
  account_email TEXT;
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'A contributor user ID is required';
  END IF;

  user_id_hash := encode(
    extensions.digest(target_user_id::TEXT, 'sha256'),
    'hex'
  );

  SELECT lower(email::TEXT) INTO account_email
  FROM auth.users
  WHERE id = target_user_id;

  UPDATE public.flags
  SET
    contributor_id = NULL,
    contributor_display_name_snapshot = NULL,
    contribution_payload = CASE
      WHEN contribution_payload IS NULL THEN NULL
      ELSE contribution_payload - 'contributor_email' - 'contributor_name'
    END
  WHERE contributor_id = target_user_id;

  UPDATE public.flag_replies
  SET author_id = NULL, display_name_snapshot = NULL
  WHERE author_id = target_user_id;

  IF account_email IS NOT NULL THEN
    DELETE FROM public.flag_reporter_contacts
    WHERE lower(email::TEXT) = account_email;
  END IF;

  -- Both keys, as 027 did: the retired sign-in wrote the user id into `id`.
  DELETE FROM public.contributor_profiles
  WHERE id = target_user_id OR user_id = target_user_id;

  DELETE FROM auth.users
  WHERE id = target_user_id;

  INSERT INTO public.audit_log (
    action,
    entity_type,
    metadata,
    created_at
  )
  VALUES (
    'contributor_erased',
    'contributor',
    jsonb_build_object(
      'erased_at', erasure_timestamp,
      'user_id_hash', user_id_hash
    ),
    erasure_timestamp
  );
END;
$$;

REVOKE ALL ON FUNCTION public.erase_contributor_account(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.erase_contributor_account(UUID)
  FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erase_contributor_account(UUID)
  TO service_role;

COMMENT ON FUNCTION public.erase_contributor_account(UUID) IS
  'Deletes a reader account and keeps its comments and replies, unsigned '
  '(« Un lecteur »), with the address they were confirmed with forgotten '
  '(migrations 027, 118). Service role only.';
