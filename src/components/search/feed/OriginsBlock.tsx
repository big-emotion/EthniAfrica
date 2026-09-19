import { SourceStandingBadge } from "@/components/sources/SourceStandingBadge";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedEvidenceAction } from "@/components/search/feed/SearchFeedEvidenceAction";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import type {
  FeedEvidenceProps,
  FeedMovementZone,
} from "@/components/search/feed/feedBlockTypes";
import type { Language } from "@/types/shared";

export interface FeedOriginItem extends FeedEvidenceProps {
  name: string;
  qualifier?: string;
  description: string;
  currentUsage?: { label: string; text: string };
}

export interface OriginsBlockProps {
  title: string;
  subtitle?: string;
  lede?: string;
  items: FeedOriginItem[];
  language?: Language;
  zone?: FeedMovementZone;
}

// @req REQ-180
export function OriginsBlock({
  title,
  subtitle,
  lede,
  items,
  language = "fr",
  zone = "primary",
}: OriginsBlockProps) {
  return (
    <SearchFeedBlock id="origins" zone={zone}>
      <SearchFeedSectionHeading title={title} subtitle={subtitle} />
      {lede ? (
        <p className="mt-afh-lg text-afh-small text-afh-text">{lede}</p>
      ) : null}
      <ul className="mt-afh-lg flex list-none gap-afh-lg overflow-x-auto pb-afh-md min-[1200px]:grid min-[1200px]:grid-cols-2 min-[1200px]:gap-afh-2xl min-[1200px]:overflow-visible">
        {items.map((item) => (
          <li
            key={`${item.name}-${item.qualifier ?? ""}`}
            className="w-[290px] shrink-0 rounded-afh-lg border border-afh-border bg-afh-surface p-afh-2xl min-[1200px]:w-auto"
          >
            <div className="flex items-baseline justify-between gap-afh-lg">
              <h3 className="font-afh-display text-afh-body font-bold text-afh-text">
                {item.name}
              </h3>
              {item.qualifier ? (
                <span className="text-right text-afh-eyebrow font-bold uppercase text-[color:var(--accent-ink)]">
                  {item.qualifier}
                </span>
              ) : null}
            </div>
            <p className="mt-afh-md text-afh-small text-afh-text">
              {item.description}
            </p>
            {item.currentUsage ? (
              <p className="mt-afh-md text-afh-caption text-afh-text-soft">
                <strong className="text-afh-text">
                  {item.currentUsage.label}
                </strong>{" "}
                — {item.currentUsage.text}
              </p>
            ) : null}
            {item.evidence ? (
              <SearchFeedEvidenceAction
                evidence={item.evidence}
                anchorId={`search-feed-origin-${item.evidence.assertion.id}`}
                language={language}
              />
            ) : item.standing ? (
              <SourceStandingBadge
                standing={item.standing}
                language={language}
                className="mt-afh-md"
              />
            ) : null}
          </li>
        ))}
      </ul>
    </SearchFeedBlock>
  );
}
