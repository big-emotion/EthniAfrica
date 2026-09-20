import { isSourceTier, type SourceTier } from "@/types/sources";

export type SearchSourceStanding = SourceTier | "needs_review";

/** A source hydrated far enough for the existing source-chain sheet. */
export interface SearchEvidenceSource {
  id: string;
  title: string;
  author?: string;
  year?: number;
  page?: string;
  url?: string;
  tier: SearchSourceStanding;
  reviewedNarrative?: boolean;
  bibliographyNumber?: number;
  brokenAt?: string | null;
  citation?: string;
}

/** An assertion hydrated far enough for the existing source-chain sheet. */
export interface SearchEvidenceAssertion {
  id?: string;
  statement: string;
  position?: string;
  fieldPath?: string;
  confidenceScore?: number;
  sourceCount: number;
  lastHumanAuditAt: string | null;
}

/** Complete evidence for one naming assertion; source ids alone are not enough. */
export interface SearchEvidence {
  assertion: SearchEvidenceAssertion;
  sources: SearchEvidenceSource[];
  standing: SearchSourceStanding;
}

const STANDING_RANK: Record<SearchSourceStanding, number> = {
  needs_review: 0,
  unverified: 1,
  referenced: 2,
  official: 3,
};

// @req REQ-180
export function searchSourceStanding(value: unknown): SearchSourceStanding {
  return isSourceTier(value) ? value : "needs_review";
}

/** The strongest cited source is the assertion's summary standing. */
// @req REQ-180
export function strongestSearchSourceStanding(
  sources: readonly Pick<SearchEvidenceSource, "tier">[]
): SearchSourceStanding {
  return sources.reduce<SearchSourceStanding>(
    (strongest, source) =>
      STANDING_RANK[source.tier] > STANDING_RANK[strongest]
        ? source.tier
        : strongest,
    "needs_review"
  );
}

/**
 * The adapter is intentionally boring: the search contract already carries
 * the exact assertion and source shapes the shared sheet consumes.
 */
// @req REQ-180
export function toSourceChainEvidence(evidence: SearchEvidence): {
  assertion: SearchEvidenceAssertion;
  sources: SearchEvidenceSource[];
} {
  return { assertion: evidence.assertion, sources: evidence.sources };
}
