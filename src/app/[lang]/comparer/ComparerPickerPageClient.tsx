/**
 * /[lang]/comparer — entity picker for a 2–3 fiche comparison (FR59).
 *
 * This is the smallest interactive island on the picker route: it owns the
 * navigation callback while the surrounding layout and copy stay on the
 * server. The picker fetches its own suggestions from /api/v2/search.
 *
 * The result route owns the comparison; this page only builds its URL, from
 * the same slug table the middleware and the switcher walk — the result route
 * still validates the segments it receives, it does not trust this caller.
 */
"use client";

import { useRouter } from "next/navigation";
import { EntityComparePicker } from "@/components/compare/EntityComparePicker";
import type { CompareEntityType } from "@/hooks/use-compare-selection";
import {
  COMPARE_ENTITY_SEGMENTS,
  getLocalizedRoute,
  type CompareEntityKey,
} from "@/lib/routing";
import type { Language } from "@/types/shared";

const ENTITY_KEY: Record<CompareEntityType, CompareEntityKey> = {
  peoples: "peoples",
  countries: "countries",
  "language-families": "families",
};

// @req REQ-091
export default function ComparerPickerPageClient({
  language,
}: {
  language: Language;
}) {
  const router = useRouter();

  const goToComparison = (type: CompareEntityType, ids: string[]) => {
    const segment = COMPARE_ENTITY_SEGMENTS[language][ENTITY_KEY[type]];
    router.push(
      `${getLocalizedRoute(language, "compare")}/${segment}/${ids.join("/")}`
    );
  };

  return (
    <EntityComparePicker
      language={language}
      className="mt-6"
      onCompare={goToComparison}
    />
  );
}
