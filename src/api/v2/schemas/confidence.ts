/**
 * Zod schemas for /v2/confidence/{entityType}/{entityId}.
 *
 * NOTE: Column layout reflects the target schema introduced by ETNI-22
 * (migration 014). The pre-014 `confidence_scores` table only carries
 * `score` + `methodology`; the service layer falls back to safe defaults
 * (`null`/0) for the additional columns until 014 has been applied.
 */

import { z } from "zod";

/**
 * Public entity-type values accepted by /v2/confidence/{entityType}/{entityId}.
 * Hyphenated for URL friendliness; mapped to internal underscore keys
 * (`language_family`) inside the service. `relation` added by ETNI-503
 * (Epic 11 fabric extension); `migration` added by ETNI-516 (Epic 12 fabric
 * extension) — the fabric's entity_type column is TEXT, so this is an
 * additive union change, not a DB schema change.
 */
// @req REQ-084
export const confidenceEntityTypeSchema = z.enum([
  "people",
  "language-family",
  "relation",
  "migration",
]);

export type ConfidenceEntityType = z.infer<typeof confidenceEntityTypeSchema>;

// @req REQ-084
export const confidenceEntityIdSchema = z
  .string()
  .min(1)
  .regex(/^(PPL_[A-Z0-9_]+|FLG_[A-Z0-9_]+|REL_[A-Z0-9_]+|MGR_[A-Z0-9_]+)$/, {
    message: "Invalid entity id format (expected PPL_*, FLG_*, REL_* or MGR_*)",
  });

const entityTypePrefixes: Record<ConfidenceEntityType, string> = {
  people: "PPL_",
  "language-family": "FLG_",
  relation: "REL_",
  migration: "MGR_",
};

// @req REQ-084
export const confidenceParamsSchema = z
  .object({
    entityType: confidenceEntityTypeSchema,
    entityId: confidenceEntityIdSchema,
  })
  .superRefine((value, ctx) => {
    const expectedPrefix = entityTypePrefixes[value.entityType];
    if (!value.entityId.startsWith(expectedPrefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entityId"],
        message: `entityId prefix does not match entityType (expected ${expectedPrefix}* for ${value.entityType})`,
      });
    }
  });

// @req REQ-084
export const confidenceRecordSchema = z.object({
  entityType: confidenceEntityTypeSchema,
  entityId: z.string(),
  score: z.number().min(0).max(100).nullable(),
  sourceCount: z.number().int().min(0),
  avgSourceQuality: z.number().min(0).max(1).nullable(),
  lastHumanAuditAt: z.string().nullable(),
  openFlagCount: z.number().int().min(0),
  recomputedAt: z.string().nullable(),
});

export type ConfidenceRecord = z.infer<typeof confidenceRecordSchema>;

/**
 * The provenance census — a second, deliberately different reading of the
 * same fabric.
 *
 * `ConfidenceRecord` above answers "how strong is this fiche", with one
 * number. The census answers "what is this fiche made of", with four counts
 * and no number at all. They are not two views of one value: an aggregate
 * over an identity chapter resting on `official` sources and an oral-tradition
 * chapter resting on `unverified` ones describes neither chapter, and it is
 * the only figure a reader remembers. The banner that consumes this shape is
 * forbidden from averaging it (docs/design/atlas-charter.md §8).
 *
 * Its entity types are the fiche surfaces, not the confidence fabric's:
 * countries and languages carry assertions but no `confidence_scores` row,
 * and their identifiers are ISO codes rather than the `PPL_`/`FLG_` prefixes
 * `confidenceEntityIdSchema` enforces.
 */
// @req REQ-084
export const provenanceEntityTypeSchema = z.enum([
  "people",
  "country",
  "language",
  "language-family",
]);

export type ProvenanceEntityType = z.infer<typeof provenanceEntityTypeSchema>;

/**
 * Four identifier shapes in one pattern: `PPL_*`, `FLG_*`, an ISO 3166-1
 * alpha-3 country code and an ISO 639-3 language code. Spelling each per
 * entity type would re-add the prefix cross-check the confidence endpoint
 * carries; here the service simply finds nothing for a mismatched pair,
 * which is the same 404 by a shorter road.
 */
// @req REQ-084
export const provenanceEntityIdSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9_]*$/, {
    message: "Invalid entity id format",
  });

// @req REQ-084
export const provenanceCensusParamsSchema = z.object({
  entityType: provenanceEntityTypeSchema,
  entityId: provenanceEntityIdSchema,
});

// @req REQ-084
export const provenanceCensusSchema = z.object({
  entityType: provenanceEntityTypeSchema,
  entityId: z.string(),
  /** Assertions counted — always the sum of the four standings. */
  assertionCount: z.number().int().min(0),
  standings: z.object({
    official: z.number().int().min(0),
    referenced: z.number().int().min(0),
    unverified: z.number().int().min(0),
    needs_review: z.number().int().min(0),
  }),
  lastHumanAuditAt: z.string().nullable(),
});

export type ProvenanceCensus = z.infer<typeof provenanceCensusSchema>;
