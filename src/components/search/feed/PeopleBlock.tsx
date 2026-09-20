import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";

export interface FeedPeopleItem {
  name: string;
  meta: string;
  description: string;
  href: string;
}

export interface PeopleBlockProps {
  title: string;
  subtitle?: string;
  items: FeedPeopleItem[];
  zone?: FeedMovementZone;
}

// @req REQ-180
export function PeopleBlock({
  title,
  subtitle,
  items,
  zone = "primary",
}: PeopleBlockProps) {
  return (
    <SearchFeedBlock id="peoples" zone={zone}>
      <SearchFeedSectionHeading title={title} subtitle={subtitle} />
      <ul className="mt-afh-lg grid list-none grid-cols-1 gap-afh-lg min-[1200px]:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex min-h-11 h-full flex-col gap-afh-md rounded-afh-lg border border-afh-border bg-afh-surface p-afh-2xl text-afh-text no-underline ${CHARTER_FOCUS_RING}`}
            >
              <h3 className="font-afh-display text-afh-body font-bold leading-[1.3]">
                <InlineMarkup text={item.name} />
              </h3>
              <p className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
                <InlineMarkup text={item.meta} />
              </p>
              <p className="text-afh-small leading-[var(--afh-leading-small)]">
                <InlineMarkup text={item.description} />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </SearchFeedBlock>
  );
}
