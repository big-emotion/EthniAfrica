import Link from "next/link";

import { ANSWER_BLOCK } from "@/components/search/answer/answerStyle";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
import { ficheHrefFor } from "@/components/search/SearchResultCard";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

export interface FicheLinkBlockProps {
  subjects: readonly SearchResult[];
  language: Language;
  onNavigate?: (subject: SearchResult) => void;
}

/**
 * The way from the answer to the full fiche, one button per subject. It is the
 * page's one solid primary action, in the brand ocre whatever the subject is:
 * the entity accent colours the eyebrow and the bars, never the buttons.
 * `--accent-foreground` is the ink the charter pairs with the ocre fill.
 */
// @req REQ-178
export function FicheLinkBlock({
  subjects,
  language,
  onNavigate,
}: FicheLinkBlockProps) {
  const copy = searchFeedCopy[language].blocks;
  if (subjects.length === 0) return null;

  const nameOf = (subject: SearchResult) =>
    getLocalizedSearchResultName(subject, language);
  const names = subjects.map(nameOf);
  // Two buttons of one name (the country and the family name « Congo ») say
  // what each leads to; a lone one needs no qualifier.
  const labelOf = (subject: SearchResult) =>
    names.filter((name) => name === nameOf(subject)).length > 1
      ? `${nameOf(subject)} (${getSearchEntityLabel(subject.type, language)})`
      : nameOf(subject);

  return (
    <SearchFeedBlock id="fiche-link" zone="primary" className="grid gap-afh-md">
      {subjects.map((subject) => (
        <div key={`${subject.type}:${subject.id}`} className={ANSWER_BLOCK}>
          <Link
            href={ficheHrefFor(subject, language)}
            onClick={() => onNavigate?.(subject)}
            className="afh-accent-ocre inline-flex min-h-[52px] w-full items-center justify-center rounded-afh-xl bg-[color:var(--accent)] px-afh-2xl py-afh-md text-center text-afh-body font-bold text-[color:var(--accent-foreground)] no-underline focus-visible:outline-none focus-visible:shadow-[var(--afh-ring-focus)]"
          >
            {copy.ficheLink(labelOf(subject))}
          </Link>
        </div>
      ))}
    </SearchFeedBlock>
  );
}
