/**
 * Confidence handler — wraps the confidence service in the Module #0 envelope.
 */

import {
  getConfidenceFor,
  getProvenanceCensusFor,
} from "../services/confidence";
import type {
  ConfidenceEntityType,
  ConfidenceRecord,
  ProvenanceCensus,
  ProvenanceEntityType,
} from "@/api/v2/schemas/confidence";
import { createApiResponse, type ApiEnvelope } from "../utils/response";

// @req REQ-084
export async function getConfidenceHandler(
  entityType: ConfidenceEntityType,
  entityId: string
): Promise<ApiEnvelope<ConfidenceRecord> | null> {
  const record = await getConfidenceFor(entityType, entityId);
  if (!record) return null;
  return createApiResponse(record, { confidence: record.score });
}

/**
 * The census is served without a `confidence` on `meta`, and that omission is
 * the point: the reason this endpoint exists is that one figure over chapters
 * of unequal provenance describes none of them. Handing an aggregate back
 * beside the counts would put it one field away from the banner that refuses
 * to draw it.
 */
// @req REQ-084
export async function getProvenanceCensusHandler(
  entityType: ProvenanceEntityType,
  entityId: string
): Promise<ApiEnvelope<ProvenanceCensus>> {
  return createApiResponse(await getProvenanceCensusFor(entityType, entityId));
}
