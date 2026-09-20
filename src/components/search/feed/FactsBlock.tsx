import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";

export interface FeedFactItem {
  label: string;
  value: string;
}

export interface FactsBlockProps {
  title: string;
  subtitle?: string;
  items: FeedFactItem[];
  zone?: FeedMovementZone;
}

// @req REQ-180
export function FactsBlock({
  title,
  subtitle,
  items,
  zone = "primary",
}: FactsBlockProps) {
  return (
    <SearchFeedBlock id="atlas-holds" zone={zone}>
      <SearchFeedSectionHeading title={title} subtitle={subtitle} />
      <ul className="mt-afh-lg grid list-none grid-cols-2 gap-afh-md">
        {items.map((item) => (
          <li
            key={item.label}
            className="rounded-afh-lg bg-afh-bg-warm p-afh-lg"
          >
            <p className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
              {item.label}
            </p>
            <p className="text-afh-small font-bold text-afh-text">
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </SearchFeedBlock>
  );
}
