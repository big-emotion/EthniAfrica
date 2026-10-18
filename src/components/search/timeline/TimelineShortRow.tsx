import Image from "next/image";
import Link from "next/link";

import {
  durationParts,
  type FeedShortItem,
} from "@/components/search/feed/ShortsBlock";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { cn } from "@/lib/utils";
import type { SearchEntityType } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * The one video made on the subject, in « Histoire du nom » (brief 11 §2,
 * charter « What left Tout » as amended 2026-10-17). The whole row is one
 * link to the piece's page: nothing plays until the reader follows it
 * (REQ-181). The poster is decorative, as the title names the link.
 */
// @req REQ-180
// @req REQ-181
export function TimelineShortRow({
  item,
  subjectType,
  language,
  onNavigate,
}: {
  item: FeedShortItem;
  subjectType: SearchEntityType;
  language: Language;
  onNavigate?: () => void;
}) {
  const copy = searchFeedCopy[language].timelineShort;
  const [minutes, seconds] = durationParts(item.durationSeconds);
  const eyebrow = copy.eyebrow[subjectType as keyof typeof copy.eyebrow];
  if (!eyebrow) return null;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn("afh-name-timeline-video", CHARTER_FOCUS_RING)}
    >
      <span className="afh-name-timeline-video-poster">
        <Image
          src={item.poster.src}
          alt=""
          width={item.poster.width}
          height={item.poster.height}
          sizes="64px"
        />
        <svg
          className="afh-name-timeline-video-play"
          viewBox="0 0 36 36"
          aria-hidden="true"
        >
          <circle cx="18" cy="18" r="18" fill="var(--afh-media-badge-ink)" />
          <path d="M14 11 L26 18 L14 25 Z" fill="var(--afh-media-badge-bg)" />
        </svg>
      </span>
      <span className="afh-name-timeline-video-text">
        <span className="afh-name-timeline-video-eyebrow">{eyebrow}</span>
        <span className="afh-name-timeline-video-title">
          {formatProductionNameQuestion(item.name, language)}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </span>
        <span className="afh-name-timeline-video-meta">
          {copy.duration(minutes, seconds)}
        </span>
      </span>
    </Link>
  );
}
