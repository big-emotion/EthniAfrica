"use client";

import { useState } from "react";

import { ConfidenceChip } from "@/components/source-transparency/ConfidenceChip";
import { LazySourceChainSheet } from "@/components/source-transparency/SourceChainSheet.lazy";
import { SourceStandingBadge } from "@/components/sources/SourceStandingBadge";
import {
  toSourceChainEvidence,
  type SearchEvidence,
} from "@/lib/search/evidence";
import type { Language } from "@/types/shared";

export interface SearchFeedEvidenceActionProps {
  evidence: SearchEvidence;
  anchorId: string;
  language?: Language;
}

/** One evidence summary and the shared, fully hydrated source-chain dialog. */
// @req REQ-180
export function SearchFeedEvidenceAction({
  evidence,
  anchorId,
  language = "fr",
}: SearchFeedEvidenceActionProps) {
  const [open, setOpen] = useState(false);
  const adapted = toSourceChainEvidence(evidence);
  const score = evidence.assertion.confidenceScore;
  const scorePercent =
    score === undefined ? null : Math.round(score <= 1 ? score * 100 : score);

  return (
    <div
      id={anchorId}
      className="mt-afh-lg flex flex-wrap items-center gap-afh-md"
    >
      <SourceStandingBadge standing={evidence.standing} language={language} />
      <ConfidenceChip
        id={anchorId}
        language={language}
        confidenceScore={scorePercent}
        sourceCount={evidence.assertion.sourceCount}
        lastHumanAuditAt={evidence.assertion.lastHumanAuditAt}
        onOpen={() => setOpen(true)}
      />
      <LazySourceChainSheet
        language={language}
        open={open}
        onOpenChange={setOpen}
        assertion={adapted.assertion}
        sources={adapted.sources}
        anchorId={anchorId}
      />
    </div>
  );
}
