import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SearchFeedLayoutProps {
  /** What opens the page: the filters, or the verdict of a page with no answer. */
  first: ReactNode;
  /** The blocks of the page, in the order of the feed grammar. */
  blocks?: readonly ReactNode[];
  /** What the reader is owed whatever was found, in rhetorical order. */
  closing?: readonly ReactNode[];
  /** Preserve the approved board's block boxes as well as its visible gaps. */
  reviewed?: boolean;
  className?: string;
}

function FeedStream({
  name,
  children,
  className,
  testId,
  reviewed = false,
  reviewedPadding = "none",
}: {
  name: "primary" | "closing";
  children: readonly ReactNode[];
  className?: string;
  testId?: string;
  reviewed?: boolean;
  reviewedPadding?: "all" | "none";
}) {
  return (
    <div
      data-feed-stream={name}
      data-testid={testId}
      className={cn(
        "flex min-w-0 flex-col",
        reviewed ? "gap-0" : "gap-[var(--afh-section-gap)]",
        reviewed &&
          reviewedPadding === "all" &&
          "[&>[data-feed-block]]:pt-[var(--afh-section-gap)]",
        className
      )}
    >
      {Children.toArray(children)}
    </div>
  );
}

/**
 * One reading column. The answer is prose, so it keeps a reading measure at
 * every width: the whole page sits in a single stream, centred and capped at
 * 880 px from 1200 px up, and never splits into columns. Two columns were the
 * shape of a page that stacked a dozen blocks; the answer has six.
 */
// @req REQ-178
export function SearchFeedLayout({
  first,
  blocks = [],
  closing = [],
  reviewed = false,
  className,
}: SearchFeedLayoutProps) {
  return (
    <div
      data-testid="feed-layout"
      data-feed-layout="column"
      className={cn(
        "min-w-0 text-left min-[1200px]:mx-auto min-[1200px]:w-[880px] min-[1200px]:max-w-full",
        reviewed && "search-feed-reviewed",
        className
      )}
    >
      <div data-feed-stream="first" className="min-w-0">
        {first}
      </div>

      {blocks.length > 0 ? (
        <FeedStream
          name="primary"
          className={reviewed ? "mt-0" : "mt-[var(--afh-section-gap)]"}
          testId="feed-movement"
          reviewed={reviewed}
          reviewedPadding="all"
        >
          {blocks}
        </FeedStream>
      ) : null}

      {closing.length > 0 ? (
        <FeedStream
          name="closing"
          className={reviewed ? "mt-0" : "mt-[var(--afh-section-gap)]"}
          reviewed={reviewed}
          reviewedPadding="all"
        >
          {closing}
        </FeedStream>
      ) : null}
    </div>
  );
}
