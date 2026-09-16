/**
 * Confidence service — Supabase queries for the `confidence_scores` table.
 *
 * Reads the column layout introduced by migration 014 (ETNI-22). The
 * pre-014 schema only carries `score` + `methodology`; missing columns
 * are normalised to safe defaults so the public envelope stays stable.
 *
 * The public URL uses hyphenated entity types ("language-family"); inside
 * the database we use underscored values ("language_family") matching the
 * existing assertions/flags tables.
 */

import { createServerClient } from "@/lib/supabase/server";
import type {
  ConfidenceEntityType,
  ConfidenceRecord,
  ProvenanceCensus,
  ProvenanceEntityType,
} from "@/api/v2/schemas/confidence";
import { isSourceTier, type SourceTierState } from "@/types/sources";

const internalEntityTypes: Record<ConfidenceEntityType, string> = {
  people: "people",
  "language-family": "language_family",
  relation: "relation",
  migration: "migration",
};

function toInternalEntityType(entityType: ConfidenceEntityType): string {
  return internalEntityTypes[entityType];
}

// @req REQ-084
export async function getConfidenceFor(
  entityType: ConfidenceEntityType,
  entityId: string
): Promise<ConfidenceRecord | null> {
  const supabase = createServerClient();
  const internalType = toInternalEntityType(entityType);

  const { data, error } = await supabase
    .from("confidence_scores")
    .select("*")
    .eq("entity_type", internalType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load confidence for ${entityType}/${entityId}: ${error.message}`
    );
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    entityType,
    entityId,
    score: (row.score as number | null) ?? null,
    sourceCount: (row.source_count as number | null) ?? 0,
    avgSourceQuality: (row.avg_source_quality as number | null) ?? null,
    lastHumanAuditAt: (row.last_human_audit_at as string | null) ?? null,
    openFlagCount: (row.open_flag_count as number | null) ?? 0,
    recomputedAt: (row.recomputed_at as string | null) ?? null,
  };
}

// ───── The provenance census ──────────────────────────────────────────────

/**
 * The fiche surfaces a census is drawn for, mapped onto the fabric's own
 * entity vocabulary. Countries and languages appear here and not in
 * `internalEntityTypes` above because they carry assertions without carrying
 * a `confidence_scores` row — which is exactly why the banner they feed
 * cannot be a score.
 */
const censusEntityTypes: Record<ProvenanceEntityType, string> = {
  people: "people",
  country: "country",
  language: "language",
  "language-family": "language_family",
};

/**
 * Which standing wins when one assertion cites several sources.
 *
 * An assertion is as well supported as its best source: one official record
 * backs a claim whatever else corroborates it. Counting it under its weakest
 * source instead would report a corpus weaker than it is, and would make
 * adding a community account to an already-official claim look like a
 * downgrade — which pushes a curator to drop the community account, the one
 * outcome the tier policy exists to refuse.
 *
 * `needs_review` ranks below `unverified` rather than beside it: "judged
 * weak" is a ruling somebody made, "not yet judged" is not.
 */
const STANDING_RANK: Record<SourceTierState, number> = {
  official: 3,
  referenced: 2,
  unverified: 1,
  needs_review: 0,
};

/**
 * A source row with no tier is one the provenance writer stored as
 * `needs_review` — migration 088 admits the literal, the loaders of three
 * corpus directories still write NULL. Reading NULL as `unverified` would
 * publish a ruling nobody made.
 */
function standingOf(tier: unknown): SourceTierState {
  return isSourceTier(tier) || tier === "needs_review"
    ? (tier as SourceTierState)
    : "needs_review";
}

/**
 * How many assertions a fiche's census reads. A people carries about fourteen
 * and a country a few dozen; the bound is there so a malformed entity id
 * cannot turn one banner into a table scan.
 */
const CENSUS_ASSERTION_LIMIT = 500;

// @req REQ-084
export async function getProvenanceCensusFor(
  entityType: ProvenanceEntityType,
  entityId: string
): Promise<ProvenanceCensus> {
  const supabase = createServerClient();

  const emptyStandings: Record<SourceTierState, number> = {
    official: 0,
    referenced: 0,
    unverified: 0,
    needs_review: 0,
  };

  const { data: assertionRows, error: assertionError } = await supabase
    .from("assertions")
    .select("id, source_ids")
    .eq("entity_type", censusEntityTypes[entityType])
    .eq("entity_id", entityId)
    .limit(CENSUS_ASSERTION_LIMIT);

  if (assertionError) {
    throw new Error(
      `Failed to load the provenance census for ${entityType}/${entityId}: ${assertionError.message}`
    );
  }

  const assertions = (assertionRows ?? []) as Array<{
    id: string;
    source_ids: string[] | null;
  }>;

  const citedSourceIds = Array.from(
    new Set(assertions.flatMap((row) => row.source_ids ?? []))
  );

  if (citedSourceIds.length === 0) {
    return {
      entityType,
      entityId,
      assertionCount: 0,
      standings: emptyStandings,
      lastHumanAuditAt: null,
    };
  }

  const [{ data: sourceRows, error: sourceError }, auditedAt] =
    await Promise.all([
      supabase.from("sources").select("id, tier").in("id", citedSourceIds),
      readLastHumanAudit(supabase, entityType, entityId),
    ]);

  if (sourceError) {
    throw new Error(
      `Failed to load the provenance census for ${entityType}/${entityId}: ${sourceError.message}`
    );
  }

  const standingById = new Map<string, SourceTierState>(
    ((sourceRows ?? []) as Array<{ id: string; tier: unknown }>).map((row) => [
      row.id,
      standingOf(row.tier),
    ])
  );

  const standings = { ...emptyStandings };
  let assertionCount = 0;

  for (const assertion of assertions) {
    const cited = (assertion.source_ids ?? [])
      .map((id) => standingById.get(id))
      .filter((standing): standing is SourceTierState => Boolean(standing));
    // An assertion citing nothing is refused upstream by validateAfrikData.ts.
    // It is left out rather than given a bucket, so the four counts always sum
    // to the total the banner states.
    if (cited.length === 0) continue;
    const strongest = cited.reduce((best, standing) =>
      STANDING_RANK[standing] > STANDING_RANK[best] ? standing : best
    );
    standings[strongest] += 1;
    assertionCount += 1;
  }

  return {
    entityType,
    entityId,
    assertionCount,
    standings,
    lastHumanAuditAt: auditedAt,
  };
}

/**
 * The audit stamp, read straight off the confidence fabric. A country or a
 * language has no row there yet, and a missing stamp is reported as missing
 * rather than guessed from the assertions' own timestamps — a row written by
 * a loader is not a person having read the fiche.
 */
async function readLastHumanAudit(
  supabase: ReturnType<typeof createServerClient>,
  entityType: ProvenanceEntityType,
  entityId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("confidence_scores")
    .select("last_human_audit_at")
    .eq("entity_type", censusEntityTypes[entityType])
    .eq("entity_id", entityId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { last_human_audit_at: string | null }).last_human_audit_at;
}
