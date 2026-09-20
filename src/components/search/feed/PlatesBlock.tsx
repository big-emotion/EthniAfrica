import Image from "next/image";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { CompanionRelationLabel } from "@/components/search/feed/CompanionRelationLabel";
import { FEED_TEXT_LINK_HIT_AREA } from "@/components/search/feed/feedHitArea";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { SourceStandingBadge } from "@/components/sources/SourceStandingBadge";
import { ActionLink } from "@/components/ui/ActionLink";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";

type CompanionAnecdote = SearchCompanionsData["anecdotes"]["items"][number];
type CompanionProverb = SearchCompanionsData["proverbs"]["items"][number];

export type FeedPlateItem =
  | ({ type: "anecdote" } & CompanionAnecdote)
  | ({ type: "proverb" } & CompanionProverb);

export interface PlatesBlockProps {
  items: FeedPlateItem[];
  reviewed?: boolean;
  title?: string;
  subtitle?: string;
  allHref?: string;
  language?: Language;
  zone?: FeedMovementZone;
}

function PlateSources({
  sources,
  language,
}: {
  sources: FeedPlateItem["sources"];
  language: Language;
}) {
  return (
    <ul className="list-none space-y-afh-xs border-t border-afh-border pt-afh-md">
      {sources.map((source) => (
        <li
          key={`${source.title}-${source.url ?? "unlinked"}`}
          className="flex flex-wrap items-center gap-afh-sm text-afh-caption text-afh-text-soft"
        >
          <SourceStandingBadge standing={source.tier} language={language} />
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-[color:var(--accent-ink)]"
            >
              {source.title}
            </a>
          ) : (
            <cite className="not-italic">{source.title}</cite>
          )}
        </li>
      ))}
    </ul>
  );
}

function ReviewedPlate({
  item,
  language,
}: {
  item: FeedPlateItem;
  language: Language;
}) {
  if (item.type === "anecdote") {
    return (
      <a
        href="#anecdote"
        className="flex w-full flex-col overflow-hidden rounded-afh-lg border border-afh-border bg-afh-surface text-afh-text no-underline"
      >
        <Image
          src={item.illustration.src}
          alt={item.illustration.alt}
          unoptimized
          width={250}
          height={155}
          sizes="250px"
          className="h-[155px] w-[250px] max-w-none object-cover min-[1200px]:h-[144px] min-[1200px]:w-[232px]"
        />
        <div className="flex flex-col gap-afh-md px-afh-2xl pb-afh-2xl pt-afh-lg">
          <p className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[0.14em] text-[color:var(--accent-ink)]">
            {searchFeedCopy[language].labels.anecdote}
            {item.about ? ` · ${item.about}` : ""}
          </p>
          <h3 className="font-afh-display text-afh-body font-bold leading-[1.3]">
            {item.headline}
          </h3>
          <div className="leading-[normal]">
            <SourceStandingBadge
              standing={item.tier}
              language={language}
              className="leading-[var(--afh-leading-eyebrow)]"
            />
          </div>
          <p className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
            Photo : {item.illustration.credit}
          </p>
        </div>
      </a>
    );
  }

  return (
    <a
      href="#proverbe"
      className="flex w-full flex-col gap-afh-md rounded-afh-lg bg-afh-bg-warm p-afh-2xl text-afh-text no-underline"
    >
      <p className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[0.14em] text-[color:var(--accent-ink)]">
        {searchFeedCopy[language].labels.proverb}
        {item.original ? ` ${item.original.language}` : ""}
      </p>
      <h3 className="font-afh-display text-afh-body font-bold leading-[1.3]">
        « {item.text} »
      </h3>
      {item.original ? (
        <p
          lang={item.original.lang}
          className="text-afh-small italic leading-[var(--afh-leading-small)] text-afh-text-soft"
        >
          {item.original.text}
        </p>
      ) : null}
      {item.meaning && item.meaning !== item.text ? (
        <p className="text-afh-small leading-[var(--afh-leading-small)]">
          {item.meaning}
        </p>
      ) : null}
      {item.origin.note ? (
        <p className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
          {item.origin.note}
        </p>
      ) : null}
    </a>
  );
}

// @req REQ-180
export function PlatesBlock({
  items,
  reviewed = false,
  title,
  subtitle,
  allHref,
  language = "fr",
  zone = "primary",
}: PlatesBlockProps) {
  const copy = searchFeedCopy[language];
  const resolvedTitle = title ?? copy.shelves.plates;

  return (
    <SearchFeedBlock id="plates" zone={zone}>
      <SearchFeedSectionHeading
        title={resolvedTitle}
        subtitle={subtitle}
        action={
          allHref ? (
            reviewed ? (
              <a
                href={allHref}
                className={`inline-block text-afh-small font-semibold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)] underline ${FEED_TEXT_LINK_HIT_AREA} ${CHARTER_FOCUS_RING}`}
              >
                {copy.seeAll} →
              </a>
            ) : (
              <ActionLink href={allHref}>{copy.seeAll}</ActionLink>
            )
          ) : undefined
        }
      />
      <ul
        aria-label={resolvedTitle}
        className={
          reviewed
            ? "mt-afh-lg flex list-none items-stretch gap-afh-lg overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[1200px]:gap-afh-2xl"
            : "mt-afh-lg flex snap-x snap-mandatory scroll-px-afh-lg list-none items-stretch gap-afh-lg overflow-x-auto pb-afh-md min-[1200px]:gap-afh-2xl"
        }
      >
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            className={
              reviewed
                ? "flex w-[250px] shrink-0 min-[1200px]:w-[232px]"
                : "w-[250px] shrink-0 snap-start min-[1200px]:w-[232px]"
            }
          >
            {reviewed ? (
              <ReviewedPlate item={item} language={language} />
            ) : (
              <article className="flex h-full flex-col overflow-hidden rounded-afh-lg border border-afh-border bg-afh-surface text-afh-text">
                {item.type === "anecdote" ? (
                  <>
                    <div className="relative aspect-[8/5] bg-afh-bg-warm">
                      <Image
                        src={item.illustration.src}
                        alt={item.illustration.alt}
                        width={250}
                        height={156}
                        sizes="250px"
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-afh-md p-afh-2xl">
                      <p className="text-afh-eyebrow font-semibold uppercase tracking-[var(--afh-eyebrow-tracking)] text-[color:var(--accent-ink)]">
                        {copy.labels.anecdote}
                        {reviewed && item.about ? ` · ${item.about}` : ""}
                      </p>
                      {reviewed ? null : (
                        <CompanionRelationLabel
                          match={item.match}
                          language={language}
                        />
                      )}
                      <h3 className="font-afh-display text-afh-body font-bold">
                        {item.headline}
                      </h3>
                      {reviewed
                        ? null
                        : item.body.map((paragraph) => (
                            <p key={paragraph} className="text-afh-small">
                              {paragraph}
                            </p>
                          ))}
                      {reviewed ? (
                        <SourceStandingBadge
                          standing={item.tier}
                          language={language}
                        />
                      ) : null}
                      <p className="text-afh-caption text-afh-text-soft">
                        {reviewed ? "Photo" : copy.labels.photoCredit} :{" "}
                        {item.illustration.credit}
                      </p>
                      {reviewed ? null : (
                        <PlateSources
                          sources={item.sources}
                          language={language}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col gap-afh-md bg-afh-bg-warm p-afh-2xl">
                    <p className="text-afh-eyebrow font-semibold uppercase tracking-[var(--afh-eyebrow-tracking)] text-[color:var(--accent-ink)]">
                      {copy.labels.proverb}
                      {item.original
                        ? `${reviewed ? " " : " · "}${item.original.language}`
                        : ""}
                    </p>
                    {reviewed ? null : (
                      <CompanionRelationLabel
                        match={item.match}
                        language={language}
                      />
                    )}
                    <h3 className="font-afh-display text-afh-body font-bold">
                      « {item.text} »
                    </h3>
                    {item.original ? (
                      <p
                        lang={item.original.lang}
                        className="text-afh-small italic text-afh-text-soft"
                      >
                        {item.original.text}
                      </p>
                    ) : null}
                    <p className="text-afh-small">{item.meaning}</p>
                    {item.origin.note ? (
                      <p className="text-afh-caption text-afh-text-soft">
                        {item.origin.note}
                      </p>
                    ) : null}
                    {reviewed ? null : (
                      <PlateSources
                        sources={item.sources}
                        language={language}
                      />
                    )}
                  </div>
                )}
              </article>
            )}
          </li>
        ))}
      </ul>
    </SearchFeedBlock>
  );
}
