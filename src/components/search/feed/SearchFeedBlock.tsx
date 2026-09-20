import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { FeedBlockId, FeedZone } from "@/lib/search/resultGrammar";

export { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
export type { SearchFeedSectionHeadingProps } from "@/components/search/feed/SearchFeedSectionHeading";

type SearchFeedBlockElement = "section" | "div" | "nav";

export interface SearchFeedBlockProps {
  id: FeedBlockId;
  zone: FeedZone;
  children: ReactNode;
  className?: string;
  as?: SearchFeedBlockElement;
  ariaLabel?: string;
}

/** Stable structural wrapper shared by every block in the generated grammar. */
// @req REQ-180
export function SearchFeedBlock({
  id,
  zone,
  children,
  className,
  as: Element = "section",
  ariaLabel,
}: SearchFeedBlockProps) {
  return (
    <Element
      data-feed-block={id}
      data-feed-zone={zone}
      data-testid={`feed-block-${id}`}
      aria-label={ariaLabel}
      className={cn("min-w-0 text-afh-text", className)}
    >
      {children}
    </Element>
  );
}
