/**
 * The columns of `flags` that anyone may read.
 *
 * One list for three readers that must not drift apart: the public API
 * (service-role client, `src/api/v2/services/flags.ts`), the pages that read
 * with the anon key, and migration 116, which grants `anon` and
 * `authenticated` SELECT on exactly these columns and nothing else. A
 * `scripts/__tests__` contract holds the migration to this list.
 *
 * Left out on purpose: `contribution_payload` (the name and address a
 * contributor left), `contributor_display_name_snapshot`, `moderator_id`,
 * `human_verified` and `revision_draft_id` — moderation internals the
 * console reads through the service-role client.
 *
 * A string literal rather than an array joined at runtime: PostgREST's
 * typings read the select string literally, and a computed string kills the
 * row inference.
 */
// @req REQ-014
export const PUBLIC_FLAG_SELECT =
  "id, public_slug, entity_type, entity_id, assertion_field_path, assertion_id, flag_kind, reason_text, counter_source_url, counter_source_citation, proposed_rewrite, contributor_id, severity, auto_generated, status, created_at, updated_at, resolved_at, moderator_notes, remediation_state, remediation_published_at, remediation_summary";
