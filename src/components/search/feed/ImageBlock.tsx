import Image from "next/image";
import Link from "next/link";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { CompanionRelationLabel } from "@/components/search/feed/CompanionRelationLabel";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { SourceStandingBadge } from "@/components/sources/SourceStandingBadge";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";

export type FeedGeneratedImageItem =
  SearchCompanionsData["images"]["items"][number];

export interface ImageBlockProps {
  item: FeedGeneratedImageItem;
  reviewed?: boolean;
  title?: string;
  subtitle?: string;
  licenceText?: string;
  language?: Language;
  zone?: FeedMovementZone;
}

const LICENCE_LABEL = {
  en: {
    "public-domain": "Public domain",
    cc0: "CC0",
    "cc-by": "CC BY",
    "cc-by-sa": "CC BY-SA",
  },
  fr: {
    "public-domain": "Domaine public",
    cc0: "CC0",
    "cc-by": "CC BY",
    "cc-by-sa": "CC BY-SA",
  },
} as const satisfies Record<
  Language,
  Record<FeedGeneratedImageItem["image"]["licence"], string>
>;

// @req REQ-180
export function ImageBlock({
  item,
  reviewed = false,
  title,
  subtitle,
  licenceText,
  language = "fr",
  zone = "primary",
}: ImageBlockProps) {
  const copy = searchFeedCopy[language];
  const resolvedTitle = title ?? copy.shelves.images;

  return (
    <SearchFeedBlock id="images" zone={zone}>
      <SearchFeedSectionHeading title={resolvedTitle} subtitle={subtitle} />
      <article className="mt-afh-lg w-[300px] max-w-full overflow-hidden rounded-afh-lg border border-afh-border bg-afh-surface">
        <p className="bg-[color:var(--accent-tint)] px-afh-lg py-afh-md text-afh-caption font-bold leading-[var(--afh-leading-caption)] text-[color:var(--accent-foreground)]">
          {copy.labels.generatedImage}
        </p>
        <Link
          href={item.href}
          className={`relative block h-[375px] ${reviewed ? "w-[300px]" : "w-full"} bg-afh-bg-warm ${CHARTER_FOCUS_RING}`}
        >
          <Image
            src={item.image.src}
            alt={item.image.alt}
            unoptimized={reviewed}
            width={300}
            height={375}
            sizes="300px"
            className={
              reviewed
                ? "h-[375px] w-[300px] max-w-none object-cover"
                : "size-full object-cover"
            }
          />
        </Link>
        <div
          className={
            reviewed
              ? "flex flex-col gap-afh-md px-afh-2xl pb-afh-2xl pt-afh-lg"
              : "space-y-afh-md p-afh-2xl"
          }
        >
          {reviewed ? null : (
            <CompanionRelationLabel match={item.match} language={language} />
          )}
          <h3 className="font-afh-display text-afh-body font-bold leading-[1.3] text-afh-text">
            {item.caption}
          </h3>
          {reviewed ? null : (
            <>
              <p className="text-afh-caption text-afh-text-soft">
                {item.description}
              </p>
              <p className="text-afh-caption text-afh-text-soft">
                {copy.labels.generatedWith} {item.generation.tool} ·{" "}
                {item.generation.model}
              </p>
            </>
          )}
          {reviewed ? null : (
            <p className="text-afh-caption text-afh-text-soft">
              {item.image.credit}
            </p>
          )}
          <div
            className={
              reviewed
                ? "flex items-center gap-afh-md text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft"
                : "flex flex-wrap items-center gap-afh-md text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft"
            }
          >
            <SourceStandingBadge
              standing={item.source.tier}
              language={language}
              className={
                reviewed ? "leading-[var(--afh-leading-eyebrow)]" : undefined
              }
            />
            {item.source.url ? (
              <a
                href={item.source.url}
                target="_blank"
                rel="noreferrer"
                className={
                  reviewed
                    ? "font-normal text-afh-text-soft"
                    : "inline-flex min-h-11 items-center font-semibold text-[color:var(--accent-ink)]"
                }
              >
                {item.source.title}
              </a>
            ) : (
              <cite className="not-italic">{item.source.title}</cite>
            )}
          </div>
          {item.image.licenceUrl ? (
            <a
              className={
                reviewed
                  ? "text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft"
                  : "inline-flex min-h-11 items-center font-semibold text-[color:var(--accent-ink)]"
              }
              href={item.image.licenceUrl}
              rel="license noreferrer"
              target="_blank"
            >
              {licenceText ?? LICENCE_LABEL[language][item.image.licence]}
            </a>
          ) : (
            <p className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
              {licenceText ?? LICENCE_LABEL[language][item.image.licence]}
            </p>
          )}
        </div>
      </article>
    </SearchFeedBlock>
  );
}
