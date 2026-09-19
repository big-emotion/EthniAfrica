import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";

export interface FeedFicheItem {
  kind: string;
  name: string;
  meta: string;
  href: string;
}

export interface FichesBlockProps {
  items: FeedFicheItem[];
  title?: string;
  subtitle?: string;
  zone?: FeedMovementZone;
  language?: Language;
}

// @req REQ-180
export function FichesBlock({
  items,
  title,
  subtitle,
  zone = "primary",
  language = "fr",
}: FichesBlockProps) {
  const copy = searchFeedCopy[language];
  const columns =
    items.length <= 1
      ? "grid-cols-1 min-[1200px]:grid-cols-1"
      : items.length === 2
        ? "grid-cols-2 min-[1200px]:grid-cols-2"
        : items.length === 3
          ? "grid-cols-2 min-[1200px]:grid-cols-3"
          : "grid-cols-2 min-[1200px]:grid-cols-4";

  return (
    <SearchFeedBlock id="fiches" zone={zone}>
      <SearchFeedSectionHeading
        title={title ?? copy.shelves.fiches}
        subtitle={subtitle ?? copy.labels.fichesSubtitle}
      />
      <ul className={`mt-afh-lg grid list-none gap-afh-lg ${columns}`}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex min-h-11 h-full flex-col justify-center gap-afh-xs rounded-afh-lg border border-afh-border bg-afh-surface px-afh-2xl py-afh-lg text-afh-text no-underline ${CHARTER_FOCUS_RING}`}
            >
              <span className="text-afh-eyebrow font-semibold uppercase tracking-[var(--afh-eyebrow-tracking)] text-afh-text-soft">
                {item.kind}
              </span>
              <span className="font-afh-display text-afh-body font-bold">
                {item.name}
              </span>
              <span className="text-afh-caption text-afh-text-soft">
                {item.meta}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SearchFeedBlock>
  );
}
