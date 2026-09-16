/**
 * `audit_log`, read for one report — the only layer that queries it.
 *
 * The entries have been written since migration 022 and displayed nowhere: the
 * moderation charter §4 asks for a register that records who decided what, and
 * the product had the first half of it. This service is the reading end.
 *
 * Service-role on purpose. `audit_log` has RLS whose SELECT policy still reads
 * the retired `user_roles` table, so no session reaches these rows; the
 * authorisation that matters is the allowlist check in the handler above, and
 * it is the only one.
 *
 * **Roles, never people.** The columns that identify a moderator — `actor_id`,
 * `ip_address` — are not in the select list, so there is no step downstream
 * where forgetting to strip them leaks them. The role is derived from the
 * action instead: only the allowlist-gated transition handler writes
 * `flag.transition`, so such an entry was written by a moderator by
 * construction, and saying so exposes nothing about which one.
 */

import { logger } from "@/lib/api/logger";
import { createAdminClient } from "@/lib/supabase/admin";

/** The trail's vocabulary, in the order a report normally walks it. */
export type FlagAuditEvent =
  | "received"
  | "under_review"
  | "accepted"
  | "rejected"
  | "duplicate"
  | "withdrawn"
  | "revision_linked";

/**
 * Who acted, at the coarsest grain that still answers "was this decision
 * authorised" — which is the only question a register has to answer.
 */
export type AuditActorRole = "reader" | "moderator";

export interface FlagAuditEntry {
  event: FlagAuditEvent;
  /** ISO 8601, as Postgres stamped it. The console renders it in UTC. */
  occurredAt: string;
  actorRole: AuditActorRole;
  /**
   * The one level the console grants, or null for a reader. The allowlist is
   * flat — `admin_allowlist` membership is the whole of it — so this states a
   * fact rather than opening a hierarchy the product does not have.
   */
  authorisationLevel: "admin" | null;
}

export interface FlagAuditTrail {
  publicSlug: string;
  entries: FlagAuditEntry[];
}

/**
 * Exported so the security rule can be asserted on the string itself rather
 * than on a mock's arguments: a test that only inspects a call can be satisfied
 * by a service that no longer runs.
 */
// @req REQ-041
export const AUDIT_TRAIL_COLUMNS = "action, created_at, metadata";

const AUDIT_ENTITY_TYPE = "flag";
const TRANSITION_ACTION = "flag.transition";
const REVISION_LINK_ACTION = "flag.revision_linked";

const TRANSITION_EVENTS: ReadonlySet<string> = new Set([
  "under_review",
  "accepted",
  "rejected",
  "duplicate",
  "withdrawn",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AuditRow {
  action: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

/** The status an entry moved the report to, when the row records one. */
function resolvedStatus(metadata: AuditRow["metadata"]): string | null {
  const after = metadata?.after;
  if (typeof after !== "object" || after === null) return null;
  const status = (after as Record<string, unknown>).status;
  return typeof status === "string" ? status : null;
}

function toEntry(row: AuditRow): FlagAuditEntry | null {
  const moderatorEntry = (event: FlagAuditEvent): FlagAuditEntry => ({
    event,
    occurredAt: row.created_at,
    actorRole: "moderator",
    authorisationLevel: "admin",
  });

  if (row.action === REVISION_LINK_ACTION) {
    return moderatorEntry("revision_linked");
  }

  if (row.action !== TRANSITION_ACTION) return null;

  const status = resolvedStatus(row.metadata);
  return status && TRANSITION_EVENTS.has(status)
    ? moderatorEntry(status as FlagAuditEvent)
    : null;
}

/**
 * The recorded trail of one report, oldest first, or null when no report
 * carries the identifier.
 *
 * The first entry is not an `audit_log` row: a report's arrival is the flag's
 * own `created_at`, written by a reader who was never a moderator and whose
 * identity the register has no business restating.
 *
 * A transition is stamped with whichever identifier the caller used — the
 * console sends the UUID, a script may send the public slug — so both are
 * matched. Matching one of them is how a populated trail reads as empty.
 */
// @req REQ-041
export async function getFlagAuditTrail(
  identifier: string
): Promise<FlagAuditTrail | null> {
  const supabase = createAdminClient();

  let flagQuery = supabase.from("flags").select("id, public_slug, created_at");
  flagQuery = UUID_PATTERN.test(identifier)
    ? flagQuery.eq("id", identifier)
    : flagQuery.eq("public_slug", identifier);

  const { data: flag, error: flagError } = await flagQuery.maybeSingle();

  if (flagError) {
    logger.error(
      "Failed to resolve the flag behind an audit trail",
      flagError,
      {
        identifier,
      }
    );
    throw new Error(`Failed to read the audit trail: ${flagError.message}`);
  }
  if (!flag) return null;

  const { data, error } = await supabase
    .from("audit_log")
    .select(AUDIT_TRAIL_COLUMNS)
    .eq("entity_type", AUDIT_ENTITY_TYPE)
    .in("entity_id", [flag.id, flag.public_slug])
    .order("created_at", { ascending: true });

  if (error) {
    // Never degrade to an empty trail: "no decision was recorded" and "the
    // record could not be read" are opposite claims about a register.
    logger.error("Failed to read the audit trail", error, { identifier });
    throw new Error(`Failed to read the audit trail: ${error.message}`);
  }

  const received: FlagAuditEntry = {
    event: "received",
    occurredAt: flag.created_at,
    actorRole: "reader",
    authorisationLevel: null,
  };

  const recorded = ((data ?? []) as AuditRow[])
    .map(toEntry)
    .filter((entry): entry is FlagAuditEntry => entry !== null);

  return { publicSlug: flag.public_slug, entries: [received, ...recorded] };
}
