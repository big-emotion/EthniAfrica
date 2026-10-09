/**
 * CompareEntityHeader — Epic 9 Story 9.7 (ETNI-484).
 *
 * Renders one compared entity's classification "above the fold", with
 * identical visual weight for every column — no highlighting, sorting,
 * arrows, deltas, or color emphasis distinguishing higher from lower (FR60,
 * FR6, UX-DR8, UX-DR9, dignity rule UX-DR49 #5). Each instance only ever sees
 * its own `column`, so there is no code path that could compare entities
 * against each other.
 *
 * It used to carry each entity's source review chip, a « page non auditée »
 * disclaimer when there was no score, and a link explaining the score. All
 * three told the reader how far to trust a page, which REQ-194 keeps internal.
 */

import { ClassificationBadge } from "@/components/ui/classification-badge";
import type { ComparisonColumn } from "@/types/compare";
import type { Language } from "@/types/shared";

export interface CompareEntityHeaderProps {
  column: ComparisonColumn;
  language: Language;
}

// @req REQ-097
export function CompareEntityHeader({
  column,
  language,
}: CompareEntityHeaderProps) {
  return (
    <div
      role="group"
      aria-label={column.label}
      className="flex flex-col items-start gap-afh-xs"
    >
      <ClassificationBadge
        status={column.classificationStatus}
        language={language}
      />
    </div>
  );
}
