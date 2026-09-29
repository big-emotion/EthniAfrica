import { SearchFeedEvidenceAction } from "@/components/search/feed/SearchFeedEvidenceAction";
import { ficheHrefFor } from "@/components/search/SearchResultCard";
import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
import { ActionLink } from "@/components/ui/ActionLink";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import type { NameAnswerEntry } from "@/lib/search/resolveNameOpening";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { Language } from "@/types/shared";

export interface NameAnswerEntriesProps {
  entries: readonly NameAnswerEntry[];
  language: Language;
}

/**
 * The reviewed answer as ordinary prose on the page ground, one entry per
 * answer with equal weight. Nothing here is clamped: the last sentence of an
 * answer is often the one that carries its uncertainty.
 */
// @req REQ-178
export function NameAnswerEntries({
  entries,
  language,
}: NameAnswerEntriesProps) {
  const copy = nameAnswerCopy[language];

  return (
    <div className="mt-afh-lg flex flex-col gap-afh-5xl">
      {entries.map(({ answer, subjects }, entryIndex) => {
        const single = subjects.length === 1;
        const entryKey = subjects
          .map(({ type, id }) => `${type}:${id}`)
          .join(" ");
        return (
          <section
            key={entryKey}
            data-answer-subject={entryKey}
            className="min-w-0 text-afh-text"
          >
            {single ? (
              <p className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[var(--afh-eyebrow-tracking)] text-afh-text-soft">
                {getSearchEntityLabel(subjects[0].type, language)}
              </p>
            ) : null}
            <div className="mt-afh-xs max-w-[65ch] space-y-afh-md text-afh-body leading-[var(--afh-leading-body)]">
              {answer.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {answer.uncertainty ? <p>{answer.uncertainty}</p> : null}
            </div>
            <div className="mt-afh-md flex flex-wrap items-center gap-x-afh-2xl">
              {subjects.map((subject) => {
                const kindLabel = getSearchEntityLabel(subject.type, language);
                return (
                  <ActionLink
                    key={`${subject.type}:${subject.id}`}
                    href={ficheHrefFor(subject, language)}
                  >
                    {copy.answerFiche(
                      single
                        ? kindLabel
                        : `${getLocalizedSearchResultName(subject, language)} (${kindLabel})`
                    )}
                  </ActionLink>
                );
              })}
            </div>
            {answer.sources.map((evidence, evidenceIndex) => (
              <SearchFeedEvidenceAction
                key={evidence.assertion.statement}
                evidence={evidence}
                anchorId={`answer-source-${entryIndex}-${evidenceIndex}`}
                language={language}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
