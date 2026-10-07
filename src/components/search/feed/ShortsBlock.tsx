"use client";

import Image from "next/image";
import Link from "next/link";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import type { FlagFormTarget } from "@/components/flags/FlagForm";
import { ActionLink } from "@/components/ui/ActionLink";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { FEED_TEXT_LINK_HIT_AREA } from "@/components/search/feed/feedHitArea";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { CompanionRelationLabel } from "@/components/search/feed/CompanionRelationLabel";
import { SearchFeedContributionAction } from "@/components/search/feed/SearchFeedContributionAction";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import type { Language } from "@/types/shared";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { cn } from "@/lib/utils";

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
  reviewed?: boolean;
  title?: string;
  subtitle?: string;
  allHref?: string;
  /**
   * The filter view: pieces made on the searched name or word, then the ones
   * around it, each under its own heading. Off, one shelf with every piece.
   */
  grouped?: boolean;
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
  reviewed = false,
  title,
  subtitle,
  allHref,
  emptySlot,
  grouped = false,
  contributionTarget,
  language = "fr",
}: ShortsBlockProps) {
  const copy = searchFeedCopy[language];
  const resolvedTitle = title ?? copy.shelves.shorts;
  // The reviewed boards keep their dashed slot: it is part of the approved
  // rendering. Production, with nothing to show, says so in one line.
  const noShortYet = !reviewed && items.length === 0;

  if (grouped) {
    return (
      <SearchFeedBlock id="shorts" zone="primary">
        <GroupedShorts items={items} language={language} reviewed={reviewed} />
      </SearchFeedBlock>
    );
  }

  return (
    <SearchFeedBlock
      id="shorts"
      zone="first"
      className={reviewed ? "pt-afh-lg min-[1200px]:pt-afh-5xl" : undefined}
    >
      <SearchFeedSectionHeading
        title={resolvedTitle}
        subtitle={subtitle}
        subtitleClassName={reviewed ? "hidden min-[1200px]:block" : undefined}
        action={
          allHref ? (
            reviewed ? (
              <Link
                href={allHref}
                className={`inline-block text-afh-small font-semibold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)] underline ${FEED_TEXT_LINK_HIT_AREA} ${CHARTER_FOCUS_RING}`}
              >
                {copy.seeAll} →
              </Link>
            ) : (
              <ActionLink href={allHref}>{copy.seeAll}</ActionLink>
            )
          ) : undefined
        }
      />
      {noShortYet ? (
        <p className="mt-afh-md text-afh-caption font-bold text-afh-text-soft">
          {copy.labels.noShortYet}
        </p>
      ) : null}
      {noShortYet ? null : (
        <ShortsRail
          items={items}
          label={resolvedTitle}
          emptySlot={emptySlot}
          contributionTarget={contributionTarget}
          language={language}
          reviewed={reviewed}
        />
      )}
    </SearchFeedBlock>
  );
}

interface ShortsRailProps {
  items: FeedShortItem[];
  label: string;
  emptySlot?: FeedEmptyShortSlot;
  contributionTarget?: FlagFormTarget;
  language: Language;
  reviewed: boolean;
}

function ShortsRail({
  items,
  label,
  emptySlot,
  contributionTarget,
  language,
  reviewed,
}: ShortsRailProps) {
  const copy = searchFeedCopy[language];
  return (
    <ul
      className={cn(
        "flex snap-x snap-mandatory scroll-px-afh-lg list-none gap-afh-lg overflow-x-auto min-[1200px]:mt-afh-lg min-[1200px]:gap-afh-2xl",
        "mt-afh-md",
        !reviewed && "pb-afh-md"
      )}
      aria-label={label}
    >
      {emptySlot ? (
        <li className="w-[180px] shrink-0 snap-start min-[1200px]:w-[256px]">
          <div className="flex aspect-[9/16] flex-col justify-between rounded-afh-lg border border-dashed border-afh-border p-afh-lg">
            <p className="font-afh-display text-afh-small font-bold uppercase leading-[var(--afh-leading-small)] text-afh-text-soft">
              {emptySlot.question}
            </p>
            <p className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
              {emptySlot.body}
            </p>
            <SearchFeedContributionAction
              language={language}
              target={contributionTarget}
              label={emptySlot.action}
              variant="ghost"
              className={
                reviewed
                  ? `h-auto min-h-0 justify-start whitespace-normal p-0 text-left text-afh-caption font-bold leading-[var(--afh-leading-caption)] text-[color:var(--accent-ink)] underline ${FEED_TEXT_LINK_HIT_AREA}`
                  : "h-auto min-h-11 whitespace-normal px-0 text-left text-afh-caption text-[color:var(--accent-ink)]"
              }
            />
          </div>
          <p className="mt-afh-md text-afh-caption font-bold text-afh-text-soft">
            {copy.labels.noShortYet}
          </p>
        </li>
      ) : null}
      {items.map((item, index) => {
        const duration = durationLabel(item.durationSeconds);
        return (
          <li
            key={item.href}
            className={cn(
              "shrink-0 snap-start",
              reviewed && index >= 5 && "hidden min-[1200px]:block"
            )}
          >
            <Link
              href={item.href}
              className={`block w-[180px] text-afh-text no-underline ${CHARTER_FOCUS_RING} min-[1200px]:w-[256px]`}
            >
              <div className="relative aspect-[9/16] overflow-hidden rounded-afh-lg bg-afh-bg-warm">
                <Image
                  src={item.poster.src}
                  alt={item.poster.alt}
                  unoptimized={reviewed}
                  width={item.poster.width}
                  height={item.poster.height}
                  sizes="(min-width: 1200px) 256px, 180px"
                  className="size-full object-cover"
                />
                <span
                  className={cn(
                    "absolute right-afh-md top-afh-md rounded-full bg-[color:var(--afh-media-badge-bg)] px-afh-md text-afh-eyebrow font-bold text-[color:var(--afh-media-badge-ink)]",
                    reviewed
                      ? "py-0.5 leading-[var(--afh-leading-eyebrow)]"
                      : "py-afh-xs"
                  )}
                >
                  {duration}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 size-[44px] -translate-x-1/2 -translate-y-1/2 min-[1200px]:size-[58px]"
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
              <p className="mt-afh-md text-afh-caption font-bold leading-[var(--afh-leading-caption)]">
                {formatProductionNameQuestion(item.name, language)}
              </p>
              <p className="text-afh-eyebrow leading-[var(--afh-leading-eyebrow)] text-afh-text-soft">
                {duration} · {item.label ?? copy.labels.discoveries}
              </p>
              {reviewed ? null : (
                <CompanionRelationLabel
                  match={item.match}
                  language={language}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** A piece made on the searched name or word, as opposed to its context. */
function isOnName(item: FeedShortItem): boolean {
  return item.match.relation === "exact" || item.match.relation === "word";
}

function GroupedShorts({
  items,
  language,
  reviewed,
}: Pick<ShortsRailProps, "items" | "language" | "reviewed">) {
  const copy = searchFeedCopy[language];
  const onName = items.filter(isOnName);
  const around = items.filter((item) => !isOnName(item));

  return (
    <div className="mt-afh-md flex flex-col gap-afh-5xl">
      {onName.length > 0 ? (
        <section className="min-w-0">
          <h2 className="m-0 text-afh-small font-bold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)]">
            {copy.lens.onName(onName.length)}
          </h2>
          <ShortsRail
            items={onName}
            label={copy.lens.onName(onName.length)}
            language={language}
            reviewed={reviewed}
          />
        </section>
      ) : null}
      {around.length > 0 ? (
        <section className="min-w-0">
          <h2 className="m-0 text-afh-small font-bold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)]">
            {copy.lens.around(around.length)}
          </h2>
          <p className="mt-afh-xs text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
            {copy.lens.aroundNote}
          </p>
          <ShortsRail
            items={around}
            label={copy.lens.around(around.length)}
            language={language}
            reviewed={reviewed}
          />
        </section>
      ) : null}
    </div>
  );
}
