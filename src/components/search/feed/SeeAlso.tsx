"use client";

import { useState } from "react";

import { LensesBlock } from "@/components/search/feed/LensesBlock";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type { FeedLens, FeedLensId } from "@/lib/search/searchLenses";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";

export interface SeeAlsoProps {
  language: Language;
  reviewed?: boolean;
  lenses: readonly FeedLens[];
  active: FeedLensId;
  onChange: (id: FeedLensId) => void;
}

/** A compact entry to the other result filters (brief 15). */
// @req REQ-198
export function SeeAlso({
  language,
  reviewed = false,
  lenses,
  active,
  onChange,
}: SeeAlsoProps) {
  const [expanded, setExpanded] = useState(false);
  const counted = lenses.filter(
    ({ id, count }) => id !== "all" && id !== "timeline" && count !== undefined
  );
  const summaryLenses =
    counted.length > 0 ? counted : lenses.filter(({ id }) => id === "all");
  if (lenses.length < 2 || summaryLenses.length === 0) return null;

  const copy = searchFeedCopy[language];
  const id = "search-feed-lenses";

  return (
    <div className="min-w-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        onClick={() => setExpanded((value) => !value)}
        className={`inline-flex min-h-11 max-w-full items-center gap-afh-xs overflow-x-auto whitespace-nowrap text-left text-[color:var(--accent-ink)] ${CHARTER_FOCUS_RING}`}
      >
        <span>{copy.filters.seeAlso} :</span>
        <span>
          {summaryLenses.map(({ id: lensId, label, count }, index) => (
            <span key={lensId}>
              {index > 0 ? " · " : ""}
              {label}
              {count !== undefined ? ` ${count}` : ""}
            </span>
          ))}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {expanded ? (
        <div id={id}>
          <LensesBlock
            language={language}
            reviewed={reviewed}
            lenses={lenses}
            active={active}
            onChange={onChange}
          />
        </div>
      ) : null}
    </div>
  );
}
