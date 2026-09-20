import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";
import type { FeedCompanionMatch } from "@/components/search/feed/feedBlockTypes";

const RELATION_COPY_KEY = {
  exact: "exact",
  "linked-family": "linkedFamily",
  "linked-people": "linkedPeople",
  "linked-country": "linkedCountry",
  recent: "recent",
} as const satisfies Record<
  FeedCompanionMatch["relation"],
  keyof (typeof searchFeedCopy)["fr"]["relation"]
>;

interface CompanionRelationLabelProps {
  match: FeedCompanionMatch;
  language?: Language;
  showExact?: boolean;
}

// @req REQ-180
export function CompanionRelationLabel({
  match,
  language = "fr",
  showExact = false,
}: CompanionRelationLabelProps) {
  if (match.relation === "exact" && !showExact) return null;

  return (
    <span
      data-companion-relation={match.relation}
      className="text-afh-eyebrow font-semibold uppercase text-afh-text-soft"
    >
      {searchFeedCopy[language].relation[RELATION_COPY_KEY[match.relation]]}
    </span>
  );
}
