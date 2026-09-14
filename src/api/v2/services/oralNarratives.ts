import { createServerClient } from "@/lib/supabase/server";

export type OralNarrativeEntityType = "language_family" | "people" | "country";

export interface ListPublicOralNarrativesQuery {
  entityType: OralNarrativeEntityType;
  entityId: string;
  page: number;
  perPage: number;
}

export interface PublicOralNarrative {
  id: string;
  narrativeCode: string;
  narratorDisplayName: string | null;
  community: string;
  languageCode: string;
  narrativeKind: string;
  summary: string | null;
  variantOf: string | null;
  reviewed: boolean;
}

export interface ListPublicOralNarrativesResult {
  data: PublicOralNarrative[];
  total: number;
}

// carrier_ref, approved_by, consent_evidence, transcript, collector and
// media_locator are deliberately absent: what identifies a carrier or a
// reviewer never leaves the server (REQ-172).
const PUBLIC_NARRATIVE_SELECT =
  "id,narrative_code,narrator_display_mode,narrator_display_name,community,language_code,narrative_kind,summary,variant_of,review_status,oral_narrative_links!inner(entity_type,entity_id)";

function getString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function getNullableString(
  row: Record<string, unknown>,
  key: string
): string | null {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

function mapPublicNarrative(row: Record<string, unknown>): PublicOralNarrative {
  return {
    id: getString(row, "id"),
    narrativeCode: getString(row, "narrative_code"),
    // 032 allows a stored name alongside the withheld mode, so the mode decides.
    narratorDisplayName:
      row.narrator_display_mode === "withheld"
        ? null
        : getNullableString(row, "narrator_display_name"),
    community: getString(row, "community"),
    languageCode: getString(row, "language_code"),
    narrativeKind: getString(row, "narrative_kind"),
    summary: getNullableString(row, "summary"),
    variantOf: getNullableString(row, "variant_of"),
    reviewed: row.review_status === "approved",
  };
}

// @req REQ-095
// @req REQ-172
export async function listPublicOralNarratives(
  query: ListPublicOralNarrativesQuery
): Promise<ListPublicOralNarrativesResult> {
  const supabase = createServerClient();
  const from = (query.page - 1) * query.perPage;
  const to = from + query.perPage - 1;

  const { data, error, count } = await supabase
    .from("oral_narratives")
    .select(PUBLIC_NARRATIVE_SELECT, { count: "exact" })
    .eq("visibility", "public")
    .eq("rights_status", "cleared")
    .neq("review_status", "rejected")
    .eq("oral_narrative_links.entity_type", query.entityType)
    .eq("oral_narrative_links.entity_id", query.entityId)
    // With rejected rows excluded, only 'approved' and 'pending' remain, and
    // ascending order puts the reviewed ones first on every page.
    .order("review_status")
    .order("narrative_code")
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list public oral narratives: ${error.message}`);
  }

  const rows: Array<Record<string, unknown>> = data ?? [];
  return {
    data: rows.map(mapPublicNarrative),
    total: count ?? rows.length,
  };
}
