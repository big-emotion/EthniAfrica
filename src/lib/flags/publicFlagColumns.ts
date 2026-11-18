/**
 * The columns of `flags` that anyone may read.
 *
 * One list for three readers that must not drift apart: the public API
 * (service-role client, `src/api/v2/services/flags.ts`), the pages that read
 * with the anon key, and migrations 116 and 117, which grant `anon` and
 * `authenticated` SELECT on exactly these columns and nothing else. A
 * `scripts/__tests__` contract holds the migrations to this list.
 *
 * Left out on purpose: `contribution_payload` (the name and address a
 * contributor left), `contributor_display_name_snapshot`, `moderator_id`,
 * `human_verified`, `revision_draft_id` and `hidden_reason` — moderation
 * internals the console reads through the service-role client.
 *
 * A string literal rather than an array joined at runtime: PostgREST's
 * typings read the select string literally, and a computed string kills the
 * row inference.
 */
// @req REQ-014
export const PUBLIC_FLAG_SELECT =
  "id, public_slug, entity_type, entity_id, assertion_field_path, assertion_id, flag_kind, reason_text, counter_source_url, counter_source_citation, proposed_rewrite, contributor_id, severity, auto_generated, status, created_at, updated_at, resolved_at, moderator_notes, remediation_state, remediation_published_at, remediation_summary, block_key, published_at, hidden_at, knowledge_basis";

interface PublicationFilterable<Q> {
  not(column: string, operator: string, value: null): Q;
  is(column: string, value: null): Q;
}

/**
 * The publication rule (migration 117): a flag is public once published and
 * while not hidden. RLS applies it to the anon key; every public read applies
 * it as well, because the API reads with the service-role client, which RLS
 * does not filter. The moderation console deliberately does not call this.
 */
// @req REQ-212
export function publishedFlagsOnly<Q extends PublicationFilterable<Q>>(
  query: Q
): Q {
  return query.not("published_at", "is", null).is("hidden_at", null);
}
