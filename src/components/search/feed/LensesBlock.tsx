"use client";

import { useLayoutEffect, useRef } from "react";

import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { cn } from "@/lib/utils";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { FeedLens, FeedLensId } from "@/lib/search/searchLenses";
import type { Language } from "@/types/shared";

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
  const pressedLens = useRef<HTMLButtonElement>(null);
  // Pressing a lens replaces the page, and the bar with it, which then starts
  // scrolled to its beginning: at 430 px « Fiches » would sit off screen just
  // after the reader pressed it (brief 12, Main board). The bar's own offset
  // moves, not the page: `scrollIntoView` would also scroll it vertically.
  // The offset lands on the lens's snap position, so the bar does not snap
  // back; nothing moves when the lens is already in view.
  useLayoutEffect(() => {
    const lens = pressedLens.current;
    const bar = lens?.parentElement;
    if (!lens || !bar) return;
    const barBox = bar.getBoundingClientRect();
    const lensBox = lens.getBoundingClientRect();
    if (lensBox.left >= barBox.left && lensBox.right <= barBox.right) return;
    const snapInset = parseFloat(getComputedStyle(bar).scrollPaddingLeft) || 0;
    bar.scrollLeft += lensBox.left - barBox.left - snapInset;
  }, [active]);

  return (
    <SearchFeedBlock
      as="nav"
      id="lenses"
      zone="first"
      ariaLabel={searchFeedCopy[language].filters.label}
      className="search-feed-pill-group mt-afh-lg flex snap-x snap-mandatory scroll-px-afh-lg flex-nowrap gap-afh-md overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {lenses.map((lens) => {
        const selected = lens.id === active;
        return (
          <button
            key={lens.id}
            ref={selected ? pressedLens : undefined}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(lens.id)}
            className={cn(
              "inline-flex min-h-11 shrink-0 snap-start items-center rounded-afh-full px-afh-2xl text-[length:var(--search-feed-text-pill)] font-bold leading-[var(--afh-leading-caption)]",
              !reviewed && "gap-afh-xs",
              CHARTER_FOCUS_RING,
              selected
                ? "border-0 bg-afh-text text-afh-bg"
                : "border border-afh-border bg-afh-surface text-afh-text"
            )}
          >
            <span>{lens.label}</span>
            {lens.count !== undefined ? (
              <span
                className={cn(
                  "font-semibold",
                  reviewed && "ml-[3.515625px]",
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
