"use client";

import Image from "next/image";
import Link from "next/link";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import type { FlagFormTarget } from "@/components/flags/FlagForm";
import { ActionLink } from "@/components/ui/ActionLink";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { CompanionRelationLabel } from "@/components/search/feed/CompanionRelationLabel";
import { SearchFeedContributionAction } from "@/components/search/feed/SearchFeedContributionAction";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import type { Language } from "@/types/shared";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";

export type FeedShortItem = SearchCompanionsData["shorts"]["items"][number] & {
  label?: string;
};

export interface FeedEmptyShortSlot {
  name: string;
  question: string;
  body: string;
  action: string;
}

interface ShortsBlockBaseProps {
  items: FeedShortItem[];
  title?: string;
  subtitle?: string;
  allHref?: string;
  wideningNote?: string;
  language?: Language;
}

export type ShortsBlockProps = ShortsBlockBaseProps &
  (
    | {
        emptySlot: FeedEmptyShortSlot;
        contributionTarget: FlagFormTarget;
      }
    | {
        emptySlot?: undefined;
        contributionTarget?: never;
      }
  );

function durationLabel(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// @req REQ-180
export function ShortsBlock({
  items,
  title,
  subtitle,
  allHref,
  emptySlot,
  wideningNote,
  contributionTarget,
  language = "fr",
}: ShortsBlockProps) {
  const copy = searchFeedCopy[language];
  const resolvedTitle = title ?? copy.shelves.shorts;

  return (
    <SearchFeedBlock id="shorts" zone="first">
      <SearchFeedSectionHeading
        title={resolvedTitle}
        subtitle={subtitle}
        action={
          allHref ? (
            <ActionLink href={allHref}>{copy.seeAll}</ActionLink>
          ) : undefined
        }
      />
      {wideningNote ? (
        <p className="mt-afh-md text-afh-caption font-bold text-[color:var(--accent-ink)]">
          {wideningNote}
        </p>
      ) : null}
      <ul
        className="mt-afh-lg flex list-none gap-afh-lg overflow-x-auto pb-afh-md min-[1200px]:gap-afh-2xl"
        aria-label={resolvedTitle}
      >
        {emptySlot ? (
          <li className="w-[130px] shrink-0 min-[1200px]:w-[160px]">
            <div className="flex aspect-[9/16] flex-col justify-between rounded-afh-lg border border-dashed border-afh-border p-afh-lg">
              <p className="font-afh-display text-afh-small font-bold uppercase text-afh-text-soft">
                {emptySlot.name}
              </p>
              <div className="space-y-afh-xs text-afh-caption text-afh-text-soft">
                <p className="font-semibold text-afh-text">
                  {emptySlot.question}
                </p>
                <p>{emptySlot.body}</p>
              </div>
              <SearchFeedContributionAction
                language={language}
                target={contributionTarget}
                label={emptySlot.action}
                variant="ghost"
                className="h-auto min-h-11 whitespace-normal px-0 text-left text-afh-caption text-[color:var(--accent-ink)]"
              />
            </div>
            <p className="mt-afh-md text-afh-caption font-bold text-afh-text-soft">
              {copy.labels.noShortYet}
            </p>
          </li>
        ) : null}
        {items.map((item) => {
          const duration = durationLabel(item.durationSeconds);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={`block w-[130px] text-afh-text no-underline ${CHARTER_FOCUS_RING} min-[1200px]:w-[160px]`}
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-afh-lg bg-afh-bg-warm">
                  <Image
                    src={item.poster.src}
                    alt={item.poster.alt}
                    width={item.poster.width}
                    height={item.poster.height}
                    sizes="(min-width: 1200px) 160px, 130px"
                    className="size-full object-cover"
                  />
                  <span className="absolute right-afh-md top-afh-md rounded-full bg-[color:var(--afh-media-badge-bg)] px-afh-md py-afh-xs text-afh-eyebrow font-bold text-[color:var(--afh-media-badge-ink)]">
                    {duration}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2"
                  >
                    <svg viewBox="0 0 36 36" role="presentation">
                      <circle
                        cx="18"
                        cy="18"
                        r="18"
                        fill="var(--afh-media-badge-ink)"
                      />
                      <path
                        d="M14 11 L26 18 L14 25 Z"
                        fill="var(--afh-media-badge-bg)"
                      />
                    </svg>
                  </span>
                </div>
                <p className="mt-afh-md text-afh-caption font-bold">
                  {formatProductionNameQuestion(item.name, language)}
                </p>
                <p className="text-afh-eyebrow uppercase text-afh-text-soft">
                  {duration} · {item.label ?? copy.labels.discoveries}
                </p>
                <CompanionRelationLabel
                  match={item.match}
                  language={language}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </SearchFeedBlock>
  );
}
