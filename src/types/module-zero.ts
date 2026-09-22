/**
 * TypeScript row type for the `flags` table (post-018 layout, ETNI-207).
 *
 * Naming: *Row = direct DB column names.
 */

// ---------------------------------------------------------------------------
// flags (post-018 additions)
// ---------------------------------------------------------------------------

/**
 * The second axis of a report, orthogonal to `status` (migration 092).
 *
 * `status` is the disposition — what the atlas thinks of the remark.
 * This is the remediation — what changed in the corpus. It is written by the
 * publication of a correction, never by a moderator's decision, which is the
 * whole reason the two are not one label.
 */
export type FlagRemediationState =
  "not_started" | "in_progress" | "published" | "not_applicable";

export interface FlagRow {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  flag_kind:
    | "inaccurate"
    | "missing-source"
    | "broken-url"
    | "offensive"
    | "correction-proposal"
    | "other"
    | "contribution";
  reason_text: string | null;
  status:
    | "open"
    | "under_review"
    | "accepted"
    | "rejected"
    | "withdrawn"
    | "duplicate";
  contributor_id: string | null;
  contributor_display_name_snapshot: string | null;
  severity: "low" | "medium" | "high" | "critical" | null;
  auto_generated: boolean;
  counter_source_url: string | null;
  counter_source_citation: string | null;
  proposed_rewrite: string | null;
  moderator_id: string | null;
  moderator_notes: string | null;
  resolved_at: string | null;
  public_slug: string;
  human_verified: boolean;
  updated_at: string | null;
  /** FK to assertions(id). NULL = entity-level flag. */
  assertion_id: string | null;
  /** Optional field path within the assertion being flagged. */
  assertion_field_path: string | null;
  /**
   * The structured proposal behind a `contribution`, NULL for every other kind.
   * Read by the moderator's console only — it carries the name and address the
   * contributor left, which the public API never returns (migration 081).
   */
  contribution_payload: Record<string, unknown> | null;
  /** NULL while the report is still open or under review — see migration 092. */
  remediation_state: FlagRemediationState | null;
  /** Mandatory in Postgres whenever `remediation_state` is `published`. */
  remediation_published_at: string | null;
  /** Published to the reader verbatim; obeys the reader-facing register. */
  remediation_summary: string | null;
  /** The draft carrying the correction, once the revision loop is wired. */
  revision_draft_id: string | null;
}
