"use client";

import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { cn } from "@/lib/utils";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";

export type FeedLensId = "all" | "shorts" | "images" | "quiz" | "fiches";

export interface FeedLens {
  id: FeedLensId;
  label: string;
  count?: number;
}

export interface LensesBlockProps {
  language?: Language;
  reviewed?: boolean;
  lenses: readonly FeedLens[];
  active: FeedLensId;
  onChange: (id: FeedLensId) => void;
}

/** Controlled content filters that remain reachable on narrow screens. */
// @req REQ-180
export function LensesBlock({
  language = "fr",
  reviewed = false,
  lenses,
  active,
  onChange,
}: LensesBlockProps) {
  return (
    <SearchFeedBlock
      as="nav"
      id="lenses"
      zone="first"
      ariaLabel={searchFeedCopy[language].filters.label}
      className="mt-afh-lg flex snap-x snap-mandatory scroll-px-afh-lg flex-nowrap gap-afh-md overflow-x-auto overflow-y-hidden [scrollbar-width:none] min-[1200px]:mx-auto min-[1200px]:w-full min-[1200px]:max-w-[640px] [&::-webkit-scrollbar]:hidden"
    >
      {lenses.map((lens) => {
        const selected = lens.id === active;
        return (
          <button
            key={lens.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(lens.id)}
            className={cn(
              "inline-flex min-h-11 shrink-0 snap-start items-center rounded-afh-full px-afh-2xl text-afh-caption font-bold leading-[var(--afh-leading-caption)]",
              !reviewed && "gap-afh-xs",
              CHARTER_FOCUS_RING,
              selected
                ? "border-0 bg-afh-text text-afh-bg"
                : "border border-afh-border bg-afh-surface text-afh-text"
            )}
          >
            <span>
              {lens.label}
              {reviewed && lens.count !== undefined ? "\u00a0" : null}
            </span>
            {lens.count !== undefined ? (
              <span
                className={cn(
                  "font-semibold",
                  selected ? "text-afh-bg" : "text-afh-text-soft"
                )}
              >
                {lens.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </SearchFeedBlock>
  );
}
