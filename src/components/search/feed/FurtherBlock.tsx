import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import type { Language } from "@/types/shared";

export interface FeedFurtherLink {
  href: string;
  label: string;
}

export interface FurtherBlockProps {
  links: FeedFurtherLink[];
  language?: Language;
}

// @req REQ-180
export function FurtherBlock({ links, language = "fr" }: FurtherBlockProps) {
  return (
    <SearchFeedBlock id="further" zone="closing">
      <p className="text-afh-eyebrow font-semibold uppercase tracking-[var(--afh-eyebrow-tracking)] text-afh-text-soft">
        {nameAnswerCopy[language].further}
      </p>
      <ul className="mt-afh-lg flex list-none flex-wrap gap-afh-md">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`inline-flex min-h-11 items-center rounded-afh-full border border-afh-border bg-afh-surface px-afh-2xl text-afh-caption font-semibold text-afh-text no-underline ${CHARTER_FOCUS_RING}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </SearchFeedBlock>
  );
}
