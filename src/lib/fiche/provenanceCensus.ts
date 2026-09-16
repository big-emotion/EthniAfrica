import { getProvenanceCensusFor } from "@/api/v2/services/confidence";
import { logger } from "@/lib/api/logger";
import type {
  ProvenanceCensus,
  ProvenanceEntityType,
} from "@/api/v2/schemas/confidence";

/**
 * The census a fiche route hands to its provenance banner.
 *
 * The service throws on a failed read, which is right for an API answering a
 * caller who can retry. A fiche cannot: the banner is one block on a page that
 * has already resolved eight other queries, and taking the whole country fiche
 * down over its provenance apparatus would be the surface punishing the
 * reader for a fabric problem. A failed read is logged and rendered as no
 * banner — silence a reader can tell apart from a census of zero, because the
 * zero case renders nothing either.
 */
// @req REQ-084
export async function readProvenanceCensus(
  entityType: ProvenanceEntityType,
  entityId: string
): Promise<ProvenanceCensus | null> {
  try {
    return await getProvenanceCensusFor(entityType, entityId);
  } catch (error) {
    logger.error("Failed to read the provenance census for a fiche", error, {
      entityType,
      entityId,
    });
    return null;
  }
}
