import Link from "next/link";
import type { ReactNode } from "react";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { cn } from "@/lib/utils";

export interface SpellingChoice {
  name: string;
  /** A new search for that name, which the reader chooses. */
  href: string;
}

export interface SpellingChoicesBlockProps {
  choices: readonly SpellingChoice[];
  title: string;
  /** For a reader whose own spelling is the one searched. */
  invitation?: string;
  action?: ReactNode;
}

/**
 * The names a misspelling may have meant (board search-state-typo-fiches,
 * brief 16, proposed). The choice is the page's one action, so each chip
 * takes Main's name chip in the accent and does not read as one more filter
 * pill. The heading is the small group heading of the « Fiches » lens: the
 * verdict above it stays the strongest line under the name.
 */
// @req REQ-125
export function SpellingChoicesBlock({
  choices,
  title,
  invitation,
  action,
}: SpellingChoicesBlockProps) {
  return (
    <SearchFeedBlock id="appellations" zone="first" className="pt-afh-2xl">
      <h2 className="m-0 font-afh text-afh-small font-bold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)]">
        {title}
      </h2>
      <ul
        data-testid="appellations-list"
        className="mt-afh-lg flex list-none flex-wrap gap-afh-sm"
      >
        {choices.map((choice) => (
          <li key={choice.href} className="flex">
            <Link
              href={choice.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-afh-full border border-[color:var(--accent)] bg-[color:var(--accent-tint)] px-afh-lg py-afh-xs text-afh-small font-bold text-afh-text no-underline",
                CHARTER_FOCUS_RING
              )}
            >
              {choice.name}
            </Link>
          </li>
        ))}
      </ul>
      {invitation ? (
        <p className="mt-afh-2xl text-afh-small leading-[var(--afh-leading-small)] text-afh-text">
          {invitation}
        </p>
      ) : null}
      {action ? <div className="mt-afh-lg">{action}</div> : null}
    </SearchFeedBlock>
  );
}
