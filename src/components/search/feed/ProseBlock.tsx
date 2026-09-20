import { FEED_TEXT_LINK_HIT_AREA } from "@/components/search/feed/feedHitArea";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { SearchFeedEvidenceAction } from "@/components/search/feed/SearchFeedEvidenceAction";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { SourceStandingBadge } from "@/components/sources/SourceStandingBadge";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type {
  FeedEvidenceProps,
  FeedMovementZone,
} from "@/components/search/feed/feedBlockTypes";
import type { Language } from "@/types/shared";

export type FeedProseBlockId = "shared-name" | "problem" | "near-name";

export interface ProseBlockProps extends FeedEvidenceProps {
  blockId: FeedProseBlockId;
  title: string;
  paragraphs: string[];
  language?: Language;
  zone?: FeedMovementZone;
}

// @req REQ-180
export function ProseBlock({
  blockId,
  title,
  paragraphs,
  standing,
  evidence,
  language = "fr",
  zone = "primary",
}: ProseBlockProps) {
  return (
    <SearchFeedBlock id={blockId} zone={zone}>
      <SearchFeedSectionHeading title={title} />
      <div className="mt-afh-lg rounded-afh-lg border border-afh-border bg-afh-surface p-afh-2xl">
        <div className="space-y-afh-lg">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-afh-small text-afh-text">
              <InlineMarkup text={paragraph} />
            </p>
          ))}
        </div>
        {evidence ? (
          <SearchFeedEvidenceAction
            evidence={evidence}
            anchorId={`search-feed-${blockId}-evidence`}
            language={language}
          />
        ) : standing ? (
          <div className="mt-afh-lg flex flex-wrap items-center gap-afh-md">
            <SourceStandingBadge
              standing={standing}
              language={language}
              className="leading-[var(--afh-leading-eyebrow)]"
            />
            <a
              href="#sources"
              className={`text-afh-caption font-bold leading-[var(--afh-leading-caption)] text-[color:var(--accent-ink)] underline ${FEED_TEXT_LINK_HIT_AREA} ${CHARTER_FOCUS_RING}`}
            >
              Voir la source
            </a>
          </div>
        ) : null}
      </div>
    </SearchFeedBlock>
  );
}
