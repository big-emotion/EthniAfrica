/**
 * `source_tier_ruling_drafts` (migration 090) — the only layer that reads or
 * writes a moderator's ruling drafts.
 *
 * Service-role on purpose: the table has RLS and no policy, and the handler
 * above has already checked the allowlist. A draft publishes nothing; it waits
 * to be pulled into the git ruling ledger.
 */

import type { SourceTierRulingDraftInput } from "@/api/v2/schemas/sourceTierRulings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SourceTier, SourceTierRulingDecision } from "@/types/sources";

const TABLE = "source_tier_ruling_drafts";

export interface SourceTierRulingDraft {
  id: string;
  fiche_path: string;
  source_title: string;
  source_url: string | null;
  decision: SourceTierRulingDecision;
  tier: SourceTier | null;
  repaired_url: string | null;
  rationale: string;
  decided_by: string;
  decided_at: string;
}

// @req REQ-042
export async function insertSourceTierRulingDraft(
  input: SourceTierRulingDraftInput,
  moderatorId: string
): Promise<SourceTierRulingDraft> {
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .insert({
      fiche_path: input.fiche_path,
      source_title: input.source_title,
      source_url: input.source_url ?? null,
      decision: input.decision,
      tier: input.tier ?? null,
      repaired_url: input.repaired_url ?? null,
      rationale: input.rationale,
      decided_by: moderatorId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to record the ruling draft: ${error?.message ?? "no row returned"}`
    );
  }
  return data as SourceTierRulingDraft;
}

/** Newest first, so the first draft met for a citation is its latest decision. */
// @req REQ-042
export async function listSourceTierRulingDrafts(): Promise<
  SourceTierRulingDraft[]
> {
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .select("*")
    .order("decided_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read the ruling drafts: ${error.message}`);
  }
  return (data ?? []) as SourceTierRulingDraft[];
}
