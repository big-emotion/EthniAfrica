import type { ReactNode } from "react";

import {
  ANSWER_ACCENT_CLASS,
  ANSWER_BLOCK,
} from "@/components/search/answer/answerStyle";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { AnswerKind, AnswerNext } from "@/lib/search/answer";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface NextQuestionProps {
  next: AnswerNext;
  kind: AnswerKind;
  /** Where the question leads; absent, it is drawn as a plain card. */
  href?: string;
  language?: Language;
}

/**
 * The fallback sentence of a fiche that wrote no follow-up. A template whose
 * parameters are not all there is not drawn: a question with a hole in it is
 * worse than no question.
 */
function templateQuestion(
  next: Extract<AnswerNext, { template: string }>,
  language: Language
): string | undefined {
  const { template } = searchAnswerCopy[language].next;
  const { params } = next;
  const text = (key: string) =>
    typeof params[key] === "string" && params[key] !== ""
      ? (params[key] as string)
      : undefined;

  switch (next.template) {
    case "formerName": {
      const formerName = text("formerName");
      return formerName === undefined
        ? undefined
        : template.formerName(formerName);
    }
    case "migration": {
      const from = text("from");
      const to = text("to");
      return from === undefined || to === undefined
        ? undefined
        : template.migration(from, to);
    }
    case "distributionGap":
      return typeof params.countryCount === "number"
        ? template.distributionGap(params.countryCount)
        : undefined;
  }
}

/**
 * « And now »: one question that opens the next reading. Never an assertion.
 * @req REQ-178
 */
export function NextQuestion({
  next,
  kind,
  href,
  language = "fr",
}: NextQuestionProps) {
  const copy = searchAnswerCopy[language].next;
  const question =
    "question" in next ? next.question : templateQuestion(next, language);
  if (!question) return null;

  const body: ReactNode = (
    <>
      <span className="flex min-w-0 flex-col gap-afh-xs">
        <span className="text-afh-eyebrow font-bold uppercase tracking-[0.08em] text-[color:var(--accent-ink)]">
          {copy.eyebrow}
        </span>
        <span className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] text-afh-text">
          {question}
        </span>
      </span>
      {href ? (
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-[color:var(--accent-ink)]"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      ) : null}
    </>
  );
  const cardClass = cn(
    ANSWER_BLOCK,
    ANSWER_ACCENT_CLASS[kind],
    "flex min-h-11 items-center justify-between gap-afh-lg rounded-afh-xl bg-afh-bg-warm px-afh-2xl py-afh-3xl no-underline"
  );

  return href ? (
    <a
      href={href}
      className={cn(
        cardClass,
        "focus-visible:outline-none focus-visible:shadow-[var(--afh-ring-focus)]"
      )}
      data-answer-block="next"
      data-feed-block="answer-next"
      data-feed-zone="primary"
    >
      {body}
    </a>
  ) : (
    <div
      className={cardClass}
      data-answer-block="next"
      data-feed-block="answer-next"
      data-feed-zone="primary"
    >
      {body}
    </div>
  );
}
