import { logger } from "@/lib/api/logger";
import { createAdminClient } from "@/lib/supabase/admin";

import type { FlagRemediationState, FlagStatus } from "./flags";

/**
 * The reader account (REQ-213): what a signed-in reader sees of their own
 * contributions, and the erasure of the account.
 *
 * Read with the service-role client, like the rest of the comments: the
 * reader's own session could not read `flag_reporter_contacts` (no policy) or
 * their unpublished comments (RLS admits published ones only), and must not
 * be given a policy that would. The caller is the account page, which has
 * already established who the reader is from their session.
 */

/** Where a contribution stands for the public, independently of its status. */
export type AccountPublication = "pending" | "published" | "hidden";

export interface AccountContribution {
  id: string;
  public_slug: string;
  block_key: string | null;
  entity_type: string | null;
  body: string | null;
  publication: AccountPublication;
  status: FlagStatus;
  /** The moderation's public note on its decision. */
  moderator_notes: string | null;
  resolved_at: string | null;
  /** When the fiche was corrected, once that correction is published. */
  corrected_at: string | null;
  replies: { total: number; fromModeration: number };
  created_at: string;
}

interface AccountFlagRow {
  id: string;
  public_slug: string;
  block_key: string | null;
  entity_type: string | null;
  reason_text: string | null;
  status: FlagStatus;
  moderator_notes: string | null;
  resolved_at: string | null;
  remediation_state: FlagRemediationState | null;
  remediation_published_at: string | null;
  created_at: string;
  published_at: string | null;
  hidden_at: string | null;
}

const ACCOUNT_FLAG_COLUMNS =
  "id, public_slug, block_key, entity_type, reason_text, status, moderator_notes, resolved_at, remediation_state, remediation_published_at, created_at, published_at, hidden_at";

function fail(message: string, error: { message: string }): never {
  logger.error(message, error);
  throw new Error(`${message}: ${error.message}`);
}

function publicationOf(row: AccountFlagRow): AccountPublication {
  if (row.published_at == null) return "pending";
  return row.hidden_at == null ? "published" : "hidden";
}

/**
 * Every contribution that is the reader's: signed by their account, or
 * waiting on the address they confirmed — a comment written signed-out, in
 * another browser, has no `contributor_id` until its link is pressed.
 */
// @req REQ-213
export async function listAccountContributions(reader: {
  id: string;
  email: string;
}): Promise<AccountContribution[]> {
  const supabase = createAdminClient();

  const { data: contacts, error: contactError } = await supabase
    .from("flag_reporter_contacts")
    .select("flag_id")
    .eq("email", reader.email.trim());
  if (contactError) fail("Failed to read the reader's contacts", contactError);

  const { data: signed, error: signedError } = await supabase
    .from("flags")
    .select("id")
    .eq("contributor_id", reader.id);
  if (signedError) fail("Failed to read the reader's comments", signedError);

  const flagIds = [
    ...new Set([
      ...(contacts ?? []).map((row: { flag_id: string }) => row.flag_id),
      ...(signed ?? []).map((row: { id: string }) => row.id),
    ]),
  ];
  if (flagIds.length === 0) return [];

  const { data: flagData, error: flagError } = await supabase
    .from("flags")
    .select(ACCOUNT_FLAG_COLUMNS)
    .in("id", flagIds)
    .order("created_at", { ascending: false });
  if (flagError) fail("Failed to read the reader's comments", flagError);

  const { data: replyData, error: replyError } = await supabase
    .from("flag_replies")
    .select("flag_id, is_moderation")
    .in("flag_id", flagIds)
    .is("hidden_at", null);
  if (replyError) fail("Failed to read the replies", replyError);

  const replies = (replyData ?? []) as Array<{
    flag_id: string;
    is_moderation: boolean;
  }>;

  return ((flagData ?? []) as AccountFlagRow[]).map((row) => {
    const own = replies.filter((reply) => reply.flag_id === row.id);
    return {
      id: row.id,
      public_slug: row.public_slug,
      block_key: row.block_key,
      entity_type: row.entity_type,
      body: row.reason_text,
      publication: publicationOf(row),
      status: row.status,
      moderator_notes: row.moderator_notes,
      resolved_at: row.resolved_at,
      corrected_at:
        row.remediation_state === "published"
          ? row.remediation_published_at
          : null,
      replies: {
        total: own.length,
        fromModeration: own.filter((reply) => reply.is_moderation).length,
      },
      created_at: row.created_at,
    };
  });
}

/**
 * Delete a reader's account and keep what they published.
 *
 * `erase_contributor_account` (migrations 027, 118) does it in one
 * transaction: it unlinks the account's comments and replies and drops their
 * pseudonym, so they read « Un lecteur »; it forgets the address the comments
 * were confirmed with; then it deletes the auth user. One function rather
 * than several calls here, so a failure halfway cannot leave a deleted
 * account whose comments still carry its pseudonym.
 */
// @req REQ-213
export async function eraseReaderAccount(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("erase_contributor_account", {
    target_user_id: userId,
  });
  if (error) fail("Failed to erase the reader account", error);
}
