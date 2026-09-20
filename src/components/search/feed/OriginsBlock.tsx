import { SourceStandingBadge } from "@/components/sources/SourceStandingBadge";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedEvidenceAction } from "@/components/search/feed/SearchFeedEvidenceAction";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import type {
  FeedEvidenceProps,
  FeedMovementZone,
} from "@/components/search/feed/feedBlockTypes";
import type { Language } from "@/types/shared";
import { cn } from "@/lib/utils";

export interface FeedOriginItem extends FeedEvidenceProps {
  name: string;
  qualifier?: string;
  description: string;
  currentUsage?: { label: string; text: string };
  style?: "you" | "bad" | "own";
}

export interface OriginsBlockProps {
  title: string;
  subtitle?: string;
  lede?: string;
  items: FeedOriginItem[];
  reviewed?: boolean;
  language?: Language;
  zone?: FeedMovementZone;
}

// @req REQ-180
export function OriginsBlock({
  title,
  subtitle,
  lede,
  items,
  reviewed = false,
  language = "fr",
  zone = "primary",
}: OriginsBlockProps) {
  return (
    <SearchFeedBlock id="origins" zone={zone}>
      <SearchFeedSectionHeading title={title} subtitle={subtitle} />
      {lede ? (
        <p className="mt-afh-lg text-afh-small text-afh-text">
          <InlineMarkup text={lede} />
        </p>
      ) : null}
      <ul
        className={
          reviewed
            ? "mt-afh-lg flex list-none gap-afh-lg overflow-hidden min-[1200px]:grid min-[1200px]:grid-cols-2 min-[1200px]:gap-afh-2xl min-[1200px]:overflow-visible"
            : "mt-afh-lg flex snap-x snap-mandatory scroll-px-afh-lg list-none gap-afh-lg overflow-x-auto pb-afh-md min-[1200px]:grid min-[1200px]:grid-cols-2 min-[1200px]:gap-afh-2xl min-[1200px]:overflow-visible min-[1200px]:snap-none"
        }
      >
        {items.map((item) => (
          <li
            key={`${item.name}-${item.qualifier ?? ""}`}
            className={cn(
              "w-[min(290px,100%)] shrink-0 snap-start rounded-afh-lg border bg-afh-surface p-afh-2xl min-[1200px]:w-auto",
              item.style === "you"
                ? "border-[color:var(--accent)]"
                : item.style === "bad"
                  ? "border-[color:var(--afh-colonial-ink)]"
                  : "border-afh-border"
            )}
          >
            <div className="flex items-baseline justify-between gap-afh-lg">
              <h3 className="font-afh-display text-afh-body font-bold leading-[1.3] text-afh-text">
                <InlineMarkup text={item.name} />
              </h3>
              {item.qualifier ? (
                <span
                  className={cn(
                    "text-right text-afh-eyebrow font-bold leading-[var(--afh-leading-eyebrow)]",
                    item.style === "bad"
                      ? "text-[color:var(--afh-colonial-ink)]"
                      : item.style === "you" || item.style === "own"
                        ? "text-[color:var(--accent-ink)]"
                        : "text-afh-text-soft"
                  )}
                >
                  <InlineMarkup text={item.qualifier} />
                </span>
              ) : null}
            </div>
            <p className="mt-afh-md text-afh-small leading-[var(--afh-leading-small)] text-afh-text">
              <InlineMarkup text={item.description} />
            </p>
            {item.currentUsage ? (
              <p className="mt-afh-md text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
                <strong className="text-afh-text">
                  {item.currentUsage.label}
                </strong>{" "}
                — <InlineMarkup text={item.currentUsage.text} />
              </p>
            ) : null}
            {item.evidence ? (
              <SearchFeedEvidenceAction
                evidence={item.evidence}
                anchorId={`search-feed-origin-${item.evidence.assertion.id}`}
                language={language}
              />
            ) : item.standing ? (
              <div className="mt-afh-md flex flex-wrap items-center gap-afh-md">
                <SourceStandingBadge
                  standing={item.standing}
                  language={language}
                  className={
                    reviewed
                      ? "leading-[var(--afh-leading-eyebrow)]"
                      : undefined
                  }
                />
                {reviewed ? (
                  <a
                    href="#sources"
                    className={`text-afh-caption font-bold leading-[var(--afh-leading-caption)] text-[color:var(--accent-ink)] underline ${CHARTER_FOCUS_RING}`}
                  >
                    Voir la source
                  </a>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {reviewed ? (
        <div className="min-[1200px]:hidden">
          <p className="mt-afh-md text-afh-eyebrow leading-[var(--afh-leading-eyebrow)] text-afh-text-soft">
            Glissez · {items.length} formes
          </p>
          <div className="mt-afh-lg">
            <a
              href="#contribution"
              className={`text-afh-small font-bold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)] underline ${CHARTER_FOCUS_RING}`}
            >
              Il en manque une ? Proposer une source →
            </a>
          </div>
        </div>
      ) : null}
    </SearchFeedBlock>
  );
}
