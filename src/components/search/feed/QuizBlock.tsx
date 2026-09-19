"use client";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { QuizAnswerReveal } from "@/components/quiz/QuizAnswerReveal";
import { QuizQuestionCard } from "@/components/quiz/QuizQuestionCard";
import { CompanionRelationLabel } from "@/components/search/feed/CompanionRelationLabel";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { ActionLink } from "@/components/ui/ActionLink";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { Language } from "@/types/shared";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";

type CompanionQuizQuestion = NonNullable<SearchCompanionsData["quiz"]["item"]>;

interface QuizBlockResult {
  isCorrect: boolean;
  isLastQuestion: boolean;
  onNext: () => void;
}

export interface QuizBlockProps {
  question: CompanionQuizQuestion;
  reviewed?: boolean;
  selectedOption: number | null;
  onSelectOption: (optionIndex: number) => void;
  onValidate: (optionIndex?: number) => void;
  language: Language;
  questionCountLabel: string;
  allHref: string;
  result?: QuizBlockResult;
  zone?: FeedMovementZone;
}

// @req REQ-180
export function QuizBlock({
  question,
  reviewed = false,
  selectedOption,
  onSelectOption,
  onValidate,
  language,
  questionCountLabel,
  allHref,
  result,
  zone = "primary",
}: QuizBlockProps) {
  const copy = searchFeedCopy[language];
  const presentationQuestion = {
    templateId: question.templateId,
    promptFr: question.prompt,
    stimulusFr: question.stimulus,
    optionsFr: question.options,
    correctOption: question.correctOption,
    explanationFr: question.explanation,
    source: {
      title: question.source.title,
      year: null,
      tier: question.source.tier,
      url: question.source.url,
    },
    assertionId: question.assertionId,
  };

  if (reviewed && !result) {
    return (
      <SearchFeedBlock id="quiz" zone={zone}>
        <div className="flex flex-col gap-afh-lg rounded-afh-lg border border-[color:var(--accent)] bg-afh-surface p-afh-2xl">
          <p className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[var(--afh-eyebrow-tracking)] text-[color:var(--accent-ink)]">
            {copy.labels.playWithName}
          </p>
          <p className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] text-afh-text">
            {question.prompt}
          </p>
          <div className="grid grid-cols-1 gap-afh-md">
            {question.options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSelectOption(index);
                  onValidate(index);
                }}
                className="min-h-11 rounded-afh-lg border border-afh-border bg-afh-surface px-afh-2xl py-afh-md text-left text-afh-small font-bold leading-[var(--afh-leading-small)] text-afh-text"
              >
                {typeof option === "string" ? option : option.autonym}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-afh-lg text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
            <span>{questionCountLabel}</span>
            <a
              href={allHref}
              className="font-bold text-[color:var(--accent-ink)]"
            >
              {copy.labels.allQuestions} →
            </a>
          </div>
        </div>
      </SearchFeedBlock>
    );
  }

  return (
    <SearchFeedBlock
      id="quiz"
      zone={zone}
      className="rounded-afh-lg border border-[color:var(--accent)] bg-afh-surface p-afh-2xl"
    >
      <div className="mb-afh-lg flex flex-wrap items-center justify-between gap-afh-sm">
        <p className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[var(--afh-eyebrow-tracking)] text-[color:var(--accent-ink)]">
          {copy.labels.playWithName}
        </p>
        {reviewed ? null : (
          <CompanionRelationLabel match={question.match} language={language} />
        )}
      </div>
      {result ? (
        <QuizAnswerReveal
          question={presentationQuestion}
          isCorrect={result.isCorrect}
          isLastQuestion={result.isLastQuestion}
          onNext={result.onNext}
          language={language}
          className="min-h-0 border-0 p-0"
        />
      ) : (
        <QuizQuestionCard
          question={presentationQuestion}
          selectedOption={selectedOption}
          onSelectOption={onSelectOption}
          onValidate={onValidate}
          language={language}
          presentation="embedded"
        />
      )}
      <div className="mt-afh-lg flex items-center justify-between gap-afh-lg text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
        <span>{questionCountLabel}</span>
        {reviewed ? (
          <a
            href={allHref}
            className="font-bold text-[color:var(--accent-ink)]"
          >
            {copy.labels.allQuestions} →
          </a>
        ) : (
          <ActionLink href={allHref}>{copy.labels.allQuestions}</ActionLink>
        )}
      </div>
    </SearchFeedBlock>
  );
}
