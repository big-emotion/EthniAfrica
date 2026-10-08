import {
  ANSWER_BLOCK,
  ANSWER_HEADING,
} from "@/components/search/answer/answerStyle";
import { SourcesLine } from "@/components/search/answer/SourcesLine";
import { ficheHrefFor } from "@/components/search/SearchResultCard";
import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
import { ActionLink } from "@/components/ui/ActionLink";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { AnswerKind } from "@/lib/search/answer";
import { reviewedAnswerSources } from "@/lib/search/answerPresentation";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import { cn } from "@/lib/utils";
import type { NameAnswerEntry } from "@/lib/search/resolveNameOpening";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * A subject no reviewed answer covers still owes the reader its fiche: the
 * opening never leaves a known name without a way in, and never says the
 * origin is unknown just because nobody has written the summary yet.
 */
// @req REQ-178
export function UnansweredFicheLinks({
  subjects,
  language,
}: {
  subjects: readonly SearchResult[];
  language: Language;
}) {
  const copy = nameAnswerCopy[language];
  const single = subjects.length === 1;
  return (
    <div className="mt-afh-md flex flex-wrap items-center gap-x-afh-2xl">
      {subjects.map((subject) => {
        const kind = getSearchEntityLabel(subject.type);
        return (
          <ActionLink
            key={`${subject.type}:${subject.id}`}
            href={ficheHrefFor(subject, language)}
          >
            {copy.answerFiche(
              single
                ? kind
                : `${getLocalizedSearchResultName(subject, language)} (${kind})`
            )}
          </ActionLink>
        );
      })}
    </div>
  );
}

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
      {entries.map(({ answer, subjects }) => {
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
                {getSearchEntityLabel(subjects[0].type)}
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
                const kindLabel = getSearchEntityLabel(subject.type);
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
            <SourcesBelow
              answer={answer}
              kind={answerKindOfSubject(subjects[0]?.type)}
              language={language}
            />
          </section>
        );
      })}
    </div>
  );
}

/** The kind a subject's search type answers as; a term with no fiche is a word. */
// @req REQ-178
export function answerKindOfSubject(
  type: SearchResult["type"] | undefined
): AnswerKind {
  switch (type) {
    case "people":
    case "country":
    case "language":
    case "languageFamily":
    case "patronyme":
      return type;
    default:
      return "word";
  }
}

function SourcesBelow({
  answer,
  kind,
  language,
}: {
  answer: NameAnswer;
  kind: AnswerKind;
  language: Language;
}) {
  const { count, accounts } = reviewedAnswerSources(answer);
  return (
    <div className="mt-afh-lg">
      <SourcesLine
        count={count}
        accounts={accounts}
        kind={kind}
        title={answer.term}
        language={language}
      />
    </div>
  );
}

/**
 * A reviewed answer standing in for the automatic block « where the name comes
 * from ». The text is the editor's, whole, because its last sentence is often
 * the one that carries the uncertainty; the sources line below it is the
 * page's own, so the answer shows no second set of badges.
 */
// @req REQ-178
export function ReviewedOrigin({
  answer,
  language,
}: {
  answer: NameAnswer;
  kind: AnswerKind;
  language: Language;
}) {
  return (
    <section
      className={cn(ANSWER_BLOCK, "flex flex-col gap-afh-lg")}
      data-answer-block="origin"
      data-feed-block="answer-origin"
      data-feed-zone="primary"
    >
      <h2 className={ANSWER_HEADING}>
        {searchAnswerCopy[language].origin.title.name}
      </h2>
      <div className="flex flex-col gap-afh-lg text-afh-body leading-[var(--afh-leading-body)] text-afh-text">
        {answer.paragraphs.map((paragraph) => (
          <p key={paragraph} className="m-0">
            {paragraph}
          </p>
        ))}
        {answer.uncertainty ? (
          <p className="m-0">{answer.uncertainty}</p>
        ) : null}
      </div>
    </section>
  );
}
