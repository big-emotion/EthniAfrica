import { logger } from "@/lib/api/logger";
import { parseBlockKey, type BlockSection } from "@/lib/comments/blockKey";
import { createAdminClient } from "@/lib/supabase/admin";

import { mapFlagRow, type FlagRow, type ModerationFlag } from "./flags";

/**
 * The moderation console's default reading (REQ-214): every contribution
 * filed under the fiche it is about, then the block, then the thread.
 *
 * The operator works alone. A flat list sorted by date mixes ten fiches on
 * one screen and makes a discussion impossible to follow, so the inbox puts
 * the fiche with the most open items first and, between equals, the one
 * something last happened on. `listFlagsForModeration` stays as the flat
 * list (`?vue=liste`), with its filters and paging.
 *
 * Reads go through the service-role client: the inbox shows private
 * comments, hidden ones and the moderator's reasons, none of which RLS lets
 * anyone else see. The page that calls this checks the allowlist first.
 */

/**
 * How many contributions the inbox reads, most recent first. The flat list
 * pages through everything; the inbox is for the work at hand, and says so
 * when it was cut short.
 */
const INBOX_LIMIT = 300;

/** Ids per `in (…)` filter, so a request line stays far under proxy limits. */
const IDS_PER_REQUEST = 100;

export type PublicationState =
  /** No address left, or one never asked to confirm: only the console sees it. */
  | "private"
  /** An address was left and the confirmation link has not been followed. */
  | "awaiting_confirmation"
  | "published"
  /** By a moderator or by three reader reports; the text is kept. */
  | "hidden";

export interface InboxReply {
  id: string;
  body: string;
  display_name: string | null;
  is_moderation: boolean;
  created_at: string;
  hidden_at: string | null;
  abuse_reports: number;
}

export interface InboxThread extends ModerationFlag {
  block_key: string | null;
  publication_state: PublicationState;
  /** Kept beside the state: restoring a hidden comment returns it to this. */
  published_at: string | null;
  hidden_reason: string | null;
  knowledge_basis: string | null;
  display_name: string | null;
  abuse_reports: number;
  replies: InboxReply[];
  last_activity_at: string;
}

export interface InboxBlock {
  /** Null gathers what was filed on the fiche as a whole. */
  block_key: string | null;
  section: BlockSection | null;
  open_count: number;
  last_activity_at: string;
  threads: InboxThread[];
}

export interface InboxFiche {
  /** Both null for the general group: contributions that name no entity. */
  entity_type: string | null;
  entity_id: string | null;
  open_count: number;
  last_activity_at: string;
  blocks: InboxBlock[];
}

export interface ModerationInbox {
  fiches: InboxFiche[];
  /** True when more contributions exist than the inbox read. */
  truncated: boolean;
}

interface InboxFlagRow extends FlagRow {
  block_key: string | null;
  published_at: string | null;
  hidden_at: string | null;
  hidden_reason: string | null;
  knowledge_basis: string | null;
  contributor_display_name_snapshot: string | null;
}

interface InboxReplyRow {
  id: string;
  flag_id: string;
  body: string;
  display_name_snapshot: string | null;
  is_moderation: boolean;
  created_at: string;
  hidden_at: string | null;
}

const INBOX_FLAG_COLUMNS =
  "id, public_slug, entity_type, entity_id, assertion_field_path, assertion_id, flag_kind, reason_text, counter_source_url, counter_source_citation, proposed_rewrite, contributor_id, severity, auto_generated, status, created_at, updated_at, resolved_at, moderator_notes, remediation_state, remediation_published_at, remediation_summary, revision_draft_id, contribution_payload, block_key, published_at, hidden_at, hidden_reason, knowledge_basis, contributor_display_name_snapshot";

function fail(what: string, error: { message: string }): never {
  // Never degrade to an empty inbox: a moderator would read "nothing to do".
  logger.error(`Failed to read the moderation inbox (${what})`, error);
  throw new Error(`Failed to read the moderation inbox: ${error.message}`);
}

async function rowsWhereIn<Row>(
  table: string,
  columns: string,
  column: string,
  ids: string[]
): Promise<Row[]> {
  const supabase = createAdminClient();
  const rows: Row[] = [];
  for (let start = 0; start < ids.length; start += IDS_PER_REQUEST) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .in(column, ids.slice(start, start + IDS_PER_REQUEST));
    if (error) fail(table, error);
    rows.push(...((data ?? []) as Row[]));
  }
  return rows;
}

function countBy<Row>(rows: Row[], key: (row: Row) => string | null) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const id = key(row);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function latest(dates: Array<string | null>): string {
  return dates
    .filter((date): date is string => date != null)
    .reduce((a, b) => (a > b ? a : b), "");
}

function publicationState(
  row: InboxFlagRow,
  contactVerified: boolean | undefined
): PublicationState {
  if (row.hidden_at) return "hidden";
  if (row.published_at) return "published";
  // A verified contact on an unpublished flag is a report filed before
  // comments were published on confirmation: still private, not waiting.
  return contactVerified === false ? "awaiting_confirmation" : "private";
}

/** Open items first, then whatever moved last. */
function byWorkThenRecency(
  a: { open_count: number; last_activity_at: string },
  b: { open_count: number; last_activity_at: string }
) {
  return (
    b.open_count - a.open_count ||
    b.last_activity_at.localeCompare(a.last_activity_at)
  );
}

function ficheOf(thread: InboxThread) {
  const address = thread.block_key ? parseBlockKey(thread.block_key) : null;
  if (address) return { entity_type: address.subject, entity_id: address.id };
  if (thread.target_type && thread.target_id) {
    return { entity_type: thread.target_type, entity_id: thread.target_id };
  }
  return { entity_type: null, entity_id: null };
}

function groupBy<Item>(items: Item[], key: (item: Item) => string) {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const group = groups.get(key(item)) ?? [];
    group.push(item);
    groups.set(key(item), group);
  }
  return [...groups.values()];
}

function toBlock(threads: InboxThread[]): InboxBlock {
  const blockKey = threads[0].block_key;
  return {
    block_key: blockKey,
    section: blockKey ? (parseBlockKey(blockKey)?.section ?? null) : null,
    open_count: threads.filter((thread) => thread.status === "open").length,
    last_activity_at: latest(threads.map((thread) => thread.last_activity_at)),
    threads: [...threads].sort(
      (a, b) =>
        Number(b.status === "open") - Number(a.status === "open") ||
        b.last_activity_at.localeCompare(a.last_activity_at)
    ),
  };
}

// @req REQ-214
export async function listModerationInbox(): Promise<ModerationInbox> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("flags")
    .select(INBOX_FLAG_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(INBOX_LIMIT + 1);
  if (error) fail("flags", error);

  const fetched = (data ?? []) as InboxFlagRow[];
  const flags = fetched.slice(0, INBOX_LIMIT);
  const flagIds = flags.map((row) => row.id);

  const [replies, contacts, flagReports] = await Promise.all([
    rowsWhereIn<InboxReplyRow>(
      "flag_replies",
      "id, flag_id, body, display_name_snapshot, is_moderation, created_at, hidden_at",
      "flag_id",
      flagIds
    ),
    rowsWhereIn<{ flag_id: string; verified_at: string | null }>(
      "flag_reporter_contacts",
      "flag_id, verified_at",
      "flag_id",
      flagIds
    ),
    rowsWhereIn<{ flag_id: string | null }>(
      "flag_abuse_reports",
      "flag_id",
      "flag_id",
      flagIds
    ),
  ]);
  const replyReports = await rowsWhereIn<{ reply_id: string | null }>(
    "flag_abuse_reports",
    "reply_id",
    "reply_id",
    replies.map((reply) => reply.id)
  );

  const reportsPerFlag = countBy(flagReports, (row) => row.flag_id);
  const reportsPerReply = countBy(replyReports, (row) => row.reply_id);
  const contactVerified = new Map(
    contacts.map((contact) => [contact.flag_id, contact.verified_at != null])
  );

  const threads = flags.map((row): InboxThread => {
    const threadReplies = replies
      .filter((reply) => reply.flag_id === row.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((reply) => ({
        id: reply.id,
        body: reply.body,
        display_name: reply.display_name_snapshot,
        is_moderation: reply.is_moderation,
        created_at: reply.created_at,
        hidden_at: reply.hidden_at,
        abuse_reports: reportsPerReply.get(reply.id) ?? 0,
      }));
    return {
      ...mapFlagRow(row),
      contribution_payload: row.contribution_payload ?? null,
      block_key: row.block_key,
      publication_state: publicationState(row, contactVerified.get(row.id)),
      published_at: row.published_at,
      hidden_reason: row.hidden_reason,
      knowledge_basis: row.knowledge_basis,
      display_name: row.contributor_display_name_snapshot,
      abuse_reports: reportsPerFlag.get(row.id) ?? 0,
      replies: threadReplies,
      last_activity_at: latest([
        row.created_at,
        row.updated_at,
        ...threadReplies.map((reply) => reply.created_at),
      ]),
    };
  });

  const ficheKey = (thread: InboxThread) => {
    const { entity_type, entity_id } = ficheOf(thread);
    return entity_type ? `${entity_type}:${entity_id}` : "";
  };

  const fiches = groupBy(threads, ficheKey).map((ficheThreads): InboxFiche => {
    const blocks = groupBy(ficheThreads, (thread) => thread.block_key ?? "")
      .map(toBlock)
      .sort(byWorkThenRecency);
    return {
      ...ficheOf(ficheThreads[0]),
      open_count: blocks.reduce((sum, block) => sum + block.open_count, 0),
      last_activity_at: latest(blocks.map((block) => block.last_activity_at)),
      blocks,
    };
  });

  // The general group goes last whatever it holds: it is the one group that
  // is not a fiche, and putting it among them would read as one.
  fiches.sort(
    (a, b) =>
      Number(a.entity_type == null) - Number(b.entity_type == null) ||
      byWorkThenRecency(a, b)
  );

  return { fiches, truncated: fetched.length > INBOX_LIMIT };
}
