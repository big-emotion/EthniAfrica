import Link from "next/link";

import {
  ANSWER_ACCENT_CLASS,
  ANSWER_BLOCK,
} from "@/components/search/answer/answerStyle";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { answerKindOfSubject } from "@/components/search/feed/NameAnswerEntries";
import { ficheHrefFor } from "@/components/search/SearchResultCard";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

export interface FicheLinkBlockProps {
  subjects: readonly SearchResult[];
  language: Language;
  onNavigate?: (subject: SearchResult) => void;
}

/**
 * The way from the answer to the full fiche, one button per subject. The
 * answer is the page; the fiche is where a reader who wants every source and
 * every field goes next, so it follows the answer and never competes with it.
 */
// @req REQ-178
export function FicheLinkBlock({
  subjects,
  language,
  onNavigate,
}: FicheLinkBlockProps) {
  const copy = searchFeedCopy[language].blocks;
  if (subjects.length === 0) return null;

  return (
    <SearchFeedBlock id="fiche-link" zone="primary" className="grid gap-afh-md">
      {subjects.map((subject) => (
        <div
          key={`${subject.type}:${subject.id}`}
          className={cn(
            ANSWER_BLOCK,
            ANSWER_ACCENT_CLASS[answerKindOfSubject(subject.type)]
          )}
        >
          <Link
            href={ficheHrefFor(subject, language)}
            onClick={() => onNavigate?.(subject)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-afh-full border border-[color:var(--accent)] bg-[color:var(--accent-tint)] px-afh-2xl py-afh-md text-center text-afh-small font-bold text-[color:var(--accent-ink)] no-underline focus-visible:outline-none focus-visible:shadow-[var(--afh-ring-focus)]"
          >
            {copy.ficheLink(getLocalizedSearchResultName(subject, language))}
          </Link>
        </div>
      ))}
    </SearchFeedBlock>
  );
}
