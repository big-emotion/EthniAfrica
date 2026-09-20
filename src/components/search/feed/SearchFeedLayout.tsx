import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MobileComposition {
  /**
   * The complete movement-II sequence in canonical mobile order.
   *
   * It is deliberately one stream. Splitting it into desktop zones here would
   * put the primary stream before the secondary stream in the accessibility
   * tree and lose the interleaving recorded by the mobile manifest.
   */
  mode: "mobile";
  blocks: readonly ReactNode[];
}

interface DesktopRichComposition {
  /**
   * Two independent desktop streams, already ordered within their manifest
   * zones. The page orchestrator chooses this composition only at 1200 px and
   * above; this component never hides a duplicate mobile tree.
   */
  mode: "desktop-rich";
  primary: readonly ReactNode[];
  secondary: readonly ReactNode[];
}

interface DesktopThinComposition {
  /** One centred stream for sparse desktop results. */
  mode: "desktop-thin";
  primary: readonly ReactNode[];
}

export type SearchFeedComposition =
  MobileComposition | DesktopRichComposition | DesktopThinComposition;

export interface SearchFeedLayoutProps {
  /** Movement I: search answer, lenses, forms and shorts. */
  first: ReactNode;
  /** Movement II, selected exclusively by the page orchestrator. */
  composition: SearchFeedComposition;
  /** Full-width movement III blocks in rhetorical order. */
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
  composition,
  reviewed = false,
  reviewedPadding = "none",
}: {
  name: "primary" | "secondary" | "closing";
  children: readonly ReactNode[];
  className?: string;
  testId?: string;
  composition?: SearchFeedComposition["mode"];
  reviewed?: boolean;
  reviewedPadding?: "all" | "after-first" | "none";
}) {
  return (
    <div
      data-feed-stream={name}
      data-feed-composition={composition}
      data-testid={testId}
      className={cn(
        "flex min-w-0 flex-col",
        reviewed ? "gap-0" : "gap-[var(--afh-section-gap)]",
        reviewed &&
          reviewedPadding === "all" &&
          "[&>[data-feed-block]]:pt-[var(--afh-section-gap)]",
        reviewed &&
          reviewedPadding === "after-first" &&
          "[&>[data-feed-block]+[data-feed-block]]:pt-[var(--afh-section-gap)]",
        className
      )}
    >
      {Children.toArray(children)}
    </div>
  );
}

/**
 * Geometry shared by an exclusively selected mobile, rich-desktop or
 * thin-desktop feed composition.
 *
 * A CSS-only tree cannot preserve the interleaved mobile DOM order and also
 * regroup the same stateful blocks into two independent desktop DOM streams.
 * The discriminated composition makes that constraint explicit: Phase 9 owns
 * viewport selection and passes exactly one tree, so quiz, flag and source
 * controls are never duplicated merely to move a block between columns.
 */
// @req REQ-180
export function SearchFeedLayout({
  first,
  composition,
  closing = [],
  reviewed = false,
  className,
}: SearchFeedLayoutProps) {
  const thin = composition.mode === "desktop-thin";

  return (
    <div
      data-testid="feed-layout"
      data-feed-layout={composition.mode}
      className={cn(
        "min-w-0 text-left",
        reviewed && "search-feed-reviewed",
        thin &&
          "min-[1200px]:mx-auto min-[1200px]:w-[880px] min-[1200px]:max-w-full",
        className
      )}
    >
      <div data-feed-stream="first" className="min-w-0">
        {first}
      </div>

      {composition.mode === "mobile" ? (
        composition.blocks.length > 0 ? (
          <FeedStream
            name="primary"
            className={reviewed ? "mt-0" : "mt-[var(--afh-section-gap)]"}
            testId="feed-movement"
            composition={composition.mode}
            reviewed={reviewed}
            reviewedPadding="all"
          >
            {composition.blocks}
          </FeedStream>
        ) : null
      ) : composition.mode === "desktop-rich" ? (
        <div
          data-testid="feed-movement"
          data-feed-composition={composition.mode}
          className={cn(
            "flex min-w-0 flex-col min-[1200px]:grid min-[1200px]:grid-cols-12 min-[1200px]:gap-afh-6xl",
            reviewed
              ? "mt-0 gap-0 pt-[var(--afh-section-gap)]"
              : "mt-[var(--afh-section-gap)] gap-[var(--afh-section-gap)]"
          )}
        >
          <FeedStream
            name="primary"
            className="min-[1200px]:col-span-8"
            reviewed={reviewed}
            reviewedPadding="after-first"
          >
            {composition.primary}
          </FeedStream>
          <FeedStream
            name="secondary"
            className="min-[1200px]:col-span-4"
            reviewed={reviewed}
            reviewedPadding="after-first"
          >
            {composition.secondary}
          </FeedStream>
        </div>
      ) : composition.primary.length > 0 ? (
        <FeedStream
          name="primary"
          className={reviewed ? "mt-0" : "mt-[var(--afh-section-gap)]"}
          testId="feed-movement"
          composition={composition.mode}
          reviewed={reviewed}
          reviewedPadding="all"
        >
          {composition.primary}
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
