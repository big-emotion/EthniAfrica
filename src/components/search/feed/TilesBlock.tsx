import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { ActionLink } from "@/components/ui/ActionLink";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";

export interface FeedTileItem {
  title: string;
  meta: string;
  href?: string;
}

export interface TilesBlockProps {
  title: string;
  subtitle?: string;
  items: FeedTileItem[];
  actionHref?: string;
  actionLabel?: string;
  zone?: FeedMovementZone;
}

function TileContent({ item }: { item: FeedTileItem }) {
  return (
    <>
      <span className="text-afh-small font-bold text-afh-text">
        {item.title}
      </span>
      <span className="text-afh-caption text-afh-text-soft">{item.meta}</span>
    </>
  );
}

// @req REQ-180
export function TilesBlock({
  title,
  subtitle,
  items,
  actionHref,
  actionLabel,
  zone = "primary",
}: TilesBlockProps) {
  return (
    <SearchFeedBlock id="tiles" zone={zone}>
      <SearchFeedSectionHeading
        title={title}
        subtitle={subtitle}
        action={
          actionHref && actionLabel ? (
            <ActionLink href={actionHref}>{actionLabel}</ActionLink>
          ) : undefined
        }
      />
      <ul className="mt-afh-lg grid list-none grid-cols-2 gap-afh-md">
        {items.map((item) => (
          <li key={`${item.title}-${item.meta}`}>
            {item.href ? (
              <Link
                href={item.href}
                className={`flex min-h-11 h-full flex-col justify-center rounded-afh-lg bg-afh-bg-warm p-afh-lg no-underline ${CHARTER_FOCUS_RING}`}
              >
                <TileContent item={item} />
              </Link>
            ) : (
              <div className="flex h-full min-h-11 flex-col justify-center rounded-afh-lg bg-afh-bg-warm p-afh-lg">
                <TileContent item={item} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </SearchFeedBlock>
  );
}
