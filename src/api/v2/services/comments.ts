import { logger } from "@/lib/api/logger";
import { parseBlockKey } from "@/lib/comments/blockKey";
import { createAdminClient } from "@/lib/supabase/admin";

import type { FlagKind, FlagRemediationState, FlagStatus } from "./flags";

/**
 * Block comments (REQ-212, ARCH-032).
 *
 * A comment is a `flags` row with a `block_key`; replies and reader reports
 * live in `flag_replies` and `flag_abuse_reports` (migration 117). Both new
 * tables have no public policy at all, so every read and write is here,
 * through the service-role client — which also means the publication rule
 * (`published_at IS NOT NULL AND hidden_at IS NULL`) is this file's to apply,
 * not RLS's.
 */

/** Reader reports from distinct addresses that hide a comment or a reply. */
const REPORTS_TO_HIDE = 3;

export interface CommentReply {
  id: string;
  body: string;
  /** The pseudonym the author chose; null reads as « Un lecteur ». */
  display_name: string | null;
  /** Signed by the site (« Modération EthniAfrica »), not by a person. */
  is_moderation: boolean;
  created_at: string;
}

export interface CommentThread {
  id: string;
  public_slug: string;
  flag_kind: FlagKind;
  body: string | null;
  counter_source_url: string | null;
  counter_source_citation: string | null;
  proposed_rewrite: string | null;
  knowledge_basis: string | null;
  status: FlagStatus;
  remediation_state: FlagRemediationState | null;
  display_name: string | null;
  created_at: string;
  replies: CommentReply[];
}

export interface BlockComments {
  block_key: string;
  /** Visible threads; replies are not counted. */
  count: number;
  threads: CommentThread[];
  /** Latest `remediation_published_at` of an accepted flag on this block. */
  corrected_at: string | null;
}

export type CommentTarget = { flagId: string } | { replyId: string };

interface BlockFlagRow {
  id: string;
  public_slug: string;
  block_key: string;
  flag_kind: FlagKind;
  reason_text: string | null;
  counter_source_url: string | null;
  counter_source_citation: string | null;
  proposed_rewrite: string | null;
  knowledge_basis: string | null;
  status: FlagStatus;
  remediation_state: FlagRemediationState | null;
  remediation_published_at: string | null;
  contributor_display_name_snapshot: string | null;
  created_at: string;
  published_at: string | null;
  hidden_at: string | null;
}

interface ReplyRow {
  id: string;
  flag_id: string;
  body: string;
  display_name_snapshot: string | null;
  is_moderation: boolean;
  created_at: string;
  hidden_at: string | null;
}

// Private moderation columns (contribution_payload, contributor_id,
// hidden_reason, moderator_*) are deliberately absent.
const BLOCK_FLAG_COLUMNS =
  "id, public_slug, block_key, flag_kind, reason_text, counter_source_url, counter_source_citation, proposed_rewrite, knowledge_basis, status, remediation_state, remediation_published_at, contributor_display_name_snapshot, created_at, published_at, hidden_at";

const REPLY_COLUMNS =
  "id, flag_id, body, display_name_snapshot, is_moderation, created_at, hidden_at";

function isVisible(row: {
  published_at?: string | null;
  hidden_at: string | null;
}) {
  return row.published_at != null && row.hidden_at == null;
}

function toReply(row: ReplyRow): CommentReply {
  return {
    id: row.id,
    body: row.body,
    display_name: row.display_name_snapshot,
    is_moderation: row.is_moderation,
    created_at: row.created_at,
  };
}

function latest(dates: string[]): string | null {
  return dates.length === 0 ? null : dates.reduce((a, b) => (a > b ? a : b));
}

/**
 * Everything a page needs to draw its blocks' comment controls, in one call.
 *
 * Keys that do not parse are dropped rather than refused: they come from a
 * query string, and one stale key must not blank the other blocks. The
 * correction date reads every flag on the block, published or not — it
 * reveals a date, not a comment, and a correction prompted by a report filed
 * without an address still corrected what the reader sees.
 */
// @req REQ-212
export async function listPublishedCommentsByBlockKeys(
  keys: string[]
): Promise<BlockComments[]> {
  const blockKeys = [...new Set(keys)].filter((key) => parseBlockKey(key));
  if (blockKeys.length === 0) return [];

  const supabase = createAdminClient();
  const { data: flagData, error: flagError } = await supabase
    .from("flags")
    .select(BLOCK_FLAG_COLUMNS)
    .in("block_key", blockKeys)
    .order("created_at", { ascending: true });

  if (flagError) {
    logger.error("Failed to list block comments", flagError);
    throw new Error(`Failed to list block comments: ${flagError.message}`);
  }

  const flags: BlockFlagRow[] = flagData ?? [];
  const visibleFlags = flags.filter(isVisible);
  const repliesByFlag = await visibleRepliesOf(
    visibleFlags.map((row) => row.id)
  );

  return blockKeys.map((blockKey) => {
    const onBlock = flags.filter((row) => row.block_key === blockKey);
    const threads = onBlock.filter(isVisible).map((row): CommentThread => ({
      id: row.id,
      public_slug: row.public_slug,
      flag_kind: row.flag_kind,
      body: row.reason_text,
      counter_source_url: row.counter_source_url,
      counter_source_citation: row.counter_source_citation,
      proposed_rewrite: row.proposed_rewrite,
      knowledge_basis: row.knowledge_basis,
      status: row.status,
      remediation_state: row.remediation_state,
      display_name: row.contributor_display_name_snapshot,
      created_at: row.created_at,
      replies: repliesByFlag.get(row.id) ?? [],
    }));

    return {
      block_key: blockKey,
      count: threads.length,
      threads,
      corrected_at: latest(
        onBlock
          .filter((row) => row.status === "accepted")
          .map((row) => row.remediation_published_at)
          .filter((date): date is string => date != null)
      ),
    };
  });
}

async function visibleRepliesOf(
  flagIds: string[]
): Promise<Map<string, CommentReply[]>> {
  const byFlag = new Map<string, CommentReply[]>();
  if (flagIds.length === 0) return byFlag;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("flag_replies")
    .select(REPLY_COLUMNS)
    .in("flag_id", flagIds)
    .is("hidden_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to list comment replies", error);
    throw new Error(`Failed to list comment replies: ${error.message}`);
  }

  for (const row of (data ?? []) as ReplyRow[]) {
    const list = byFlag.get(row.flag_id) ?? [];
    list.push(toReply(row));
    byFlag.set(row.flag_id, list);
  }
  return byFlag;
}

/**
 * Publish what a reader wrote before confirming their address.
 *
 * Runs once the confirmation link has signed them in. Only flags still
 * private are touched, so following the same link twice publishes nothing
 * new and never moves an existing publication date.
 */
// @req REQ-212
export async function publishPendingFlagsForEmail(
  email: string,
  userId: string
): Promise<{ published: number }> {
  const supabase = createAdminClient();
  const address = email.trim();

  const { data: contacts, error: contactError } = await supabase
    .from("flag_reporter_contacts")
    .select("flag_id")
    .eq("email", address);

  if (contactError) {
    logger.error("Failed to read reporter contacts", contactError);
    throw new Error(
      `Failed to read reporter contacts: ${contactError.message}`
    );
  }

  const flagIds = (contacts ?? []).map(
    (contact: { flag_id: string }) => contact.flag_id
  );
  if (flagIds.length === 0) return { published: 0 };

  const now = new Date().toISOString();
  const { data: published, error: publishError } = await supabase
    .from("flags")
    .update({ published_at: now, contributor_id: userId })
    .in("id", flagIds)
    .is("published_at", null)
    .select("id");

  if (publishError) {
    logger.error("Failed to publish pending comments", publishError);
    throw new Error(
      `Failed to publish pending comments: ${publishError.message}`
    );
  }

  const { error: verifyError } = await supabase
    .from("flag_reporter_contacts")
    .update({ verified_at: now })
    .eq("email", address)
    .is("verified_at", null);

  // The comments are public by now; a missing stamp only means the address
  // reads as unverified to the resolution e-mail, which is the safe side.
  if (verifyError) {
    logger.error("Failed to stamp reporter contacts verified", verifyError);
  }

  return { published: (published ?? []).length };
}

async function findFlag(flagId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("flags")
    .select("id, published_at, hidden_at")
    .eq("id", flagId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to read comment", error, { flagId });
    throw new Error(`Failed to read comment: ${error.message}`);
  }
  return data as {
    id: string;
    published_at: string | null;
    hidden_at: string | null;
  } | null;
}

async function findReply(replyId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("flag_replies")
    .select("id, flag_id, hidden_at")
    .eq("id", replyId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to read reply", error, { replyId });
    throw new Error(`Failed to read reply: ${error.message}`);
  }
  return data as {
    id: string;
    flag_id: string;
    hidden_at: string | null;
  } | null;
}

export type AddReplyResult =
  | { ok: true; reply: CommentReply }
  | { ok: false; reason: "not_found" | "empty_body" };

/**
 * One level of replies. A reader replies to what they can see; the
 * moderation may also answer a comment still waiting for its address, so the
 * author finds the answer once it is published.
 */
// @req REQ-212
export async function addReply(input: {
  flagId: string;
  authorId: string | null;
  displayName?: string | null;
  body: string;
  isModeration?: boolean;
}): Promise<AddReplyResult> {
  const body = input.body.trim();
  if (!body) return { ok: false, reason: "empty_body" };

  const thread = await findFlag(input.flagId);
  if (!thread || (!input.isModeration && !isVisible(thread))) {
    return { ok: false, reason: "not_found" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("flag_replies")
    .insert({
      flag_id: thread.id,
      author_id: input.authorId,
      display_name_snapshot: input.displayName?.trim() || null,
      body,
      is_moderation: input.isModeration ?? false,
    })
    .select(REPLY_COLUMNS)
    .single();

  if (error) {
    logger.error("Failed to add reply", error, { flagId: thread.id });
    throw new Error(`Failed to add reply: ${error.message}`);
  }

  return { ok: true, reply: toReply(data as ReplyRow) };
}

export type AbuseReportResult =
  | { ok: true; reports: number; hidden: boolean }
  | { ok: false; reason: "not_found" };

/**
 * A reader says a comment or reply should not be there.
 *
 * The operator runs the site alone, so the system acts without them: at
 * three reports from distinct hashed addresses the target is hidden, text
 * kept, until a moderator looks. A repeat from the same address is absorbed
 * by the unique index rather than counted.
 */
// @req REQ-212
export async function recordAbuseReport(
  target: CommentTarget,
  ipHash: string
): Promise<AbuseReportResult> {
  const supabase = createAdminClient();
  const isFlag = "flagId" in target;

  // A reader can only report what the public sees; a hidden target is
  // already waiting for a moderator.
  if (isFlag) {
    const flagRow = await findFlag(target.flagId);
    if (!flagRow || !isVisible(flagRow)) {
      return { ok: false, reason: "not_found" };
    }
  } else {
    const reply = await findReply(target.replyId);
    const thread = reply ? await findFlag(reply.flag_id) : null;
    if (!reply || reply.hidden_at || !thread || !isVisible(thread)) {
      return { ok: false, reason: "not_found" };
    }
  }

  const column = isFlag ? "flag_id" : "reply_id";
  const id = isFlag ? target.flagId : target.replyId;

  const { error: insertError } = await supabase
    .from("flag_abuse_reports")
    .insert({ [column]: id, ip_hash: ipHash });

  // 23505: this address already reported this target.
  if (insertError && insertError.code !== "23505") {
    logger.error("Failed to record abuse report", insertError, {
      [column]: id,
    });
    throw new Error(`Failed to record abuse report: ${insertError.message}`);
  }

  const { count, error: countError } = await supabase
    .from("flag_abuse_reports")
    .select("id", { count: "exact", head: true })
    .eq(column, id);

  if (countError) {
    logger.error("Failed to count abuse reports", countError, { [column]: id });
    throw new Error(`Failed to count abuse reports: ${countError.message}`);
  }

  const reports = count ?? 0;
  if (reports < REPORTS_TO_HIDE) return { ok: true, reports, hidden: false };

  await setHidden(target, new Date().toISOString(), "reader_reports");
  return { ok: true, reports, hidden: true };
}

async function setHidden(
  target: CommentTarget,
  hiddenAt: string | null,
  reason: string | null
): Promise<boolean> {
  const supabase = createAdminClient();
  const query =
    "flagId" in target
      ? supabase
          .from("flags")
          .update({ hidden_at: hiddenAt, hidden_reason: reason })
          .eq("id", target.flagId)
      : supabase
          .from("flag_replies")
          .update({ hidden_at: hiddenAt })
          .eq("id", target.replyId);

  const { data, error } = await query.select("id");
  if (error) {
    logger.error("Failed to change comment visibility", error);
    throw new Error(`Failed to change comment visibility: ${error.message}`);
  }
  return (data ?? []).length > 0;
}

/**
 * Moderator hide. The moderator check is the caller's (handler) job, as for
 * `transitionFlag`. Replies carry no reason column: a reply is hidden or not.
 */
// @req REQ-212
export async function hideComment(
  target: CommentTarget,
  reason: string
): Promise<boolean> {
  return setHidden(target, new Date().toISOString(), reason);
}

/**
 * Moderator restore. It also clears the reader reports against the target:
 * the moderator has reviewed them, and keeping them would let the very next
 * report hide the comment again.
 */
// @req REQ-212
export async function unhideComment(target: CommentTarget): Promise<boolean> {
  const restored = await setHidden(target, null, null);
  if (!restored) return false;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("flag_abuse_reports")
    .delete()
    .eq(
      "flagId" in target ? "flag_id" : "reply_id",
      "flagId" in target ? target.flagId : target.replyId
    );

  if (error) {
    logger.error("Failed to clear abuse reports", error);
    throw new Error(`Failed to clear abuse reports: ${error.message}`);
  }
  return true;
}
