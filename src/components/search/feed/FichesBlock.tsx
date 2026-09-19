import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";

interface FeedFicheItemBase {
  kind: string;
  name: string;
  meta: string;
}

export type FeedFicheItem = FeedFicheItemBase &
  (
    | { href: string; onNavigate?: () => void; links?: never }
    | {
        href?: never;
        onNavigate?: never;
        links: Array<{
          name: string;
          href: string;
          onNavigate?: () => void;
        }>;
      }
  );

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
        ? "grid-cols-1 min-[430px]:grid-cols-2 min-[1200px]:grid-cols-2"
        : items.length === 3
          ? "grid-cols-1 min-[430px]:grid-cols-2 min-[1200px]:grid-cols-3"
          : "grid-cols-1 min-[430px]:grid-cols-2 min-[1200px]:grid-cols-4";

  return (
    <SearchFeedBlock id="fiches" zone={zone}>
      <SearchFeedSectionHeading
        title={title ?? copy.shelves.fiches}
        subtitle={subtitle ?? copy.labels.fichesSubtitle}
      />
      <ul className={`mt-afh-lg grid list-none gap-afh-lg ${columns}`}>
        {items.map((item) => {
          const content = (
            <>
              <span className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[var(--afh-eyebrow-tracking)] text-afh-text-soft">
                {item.kind}
              </span>
              <span className="font-afh-display text-afh-body font-bold leading-[1.3]">
                {item.name}
              </span>
              <span className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
                {item.meta}
              </span>
            </>
          );
          const className = `flex min-h-11 h-full flex-col justify-center gap-afh-xs rounded-afh-lg border border-afh-border bg-afh-surface px-afh-2xl py-afh-lg text-afh-text no-underline ${CHARTER_FOCUS_RING}`;
          const key =
            item.href ??
            item.links?.map(({ href }) => href).join("|") ??
            item.name;

          return (
            <li key={key}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={item.onNavigate}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <article data-testid="feed-people-group" className={className}>
                  {content}
                  <ul
                    className="mt-afh-sm flex list-none flex-wrap gap-afh-sm"
                    aria-label={
                      language === "en"
                        ? `Records for ${item.name}`
                        : `Fiches de ${item.name}`
                    }
                  >
                    {item.links?.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={link.onNavigate}
                          className={`inline-flex min-h-11 items-center rounded-afh-full border border-afh-border px-afh-lg text-afh-caption font-semibold ${CHARTER_FOCUS_RING}`}
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              )}
            </li>
          );
        })}
      </ul>
    </SearchFeedBlock>
  );
}
