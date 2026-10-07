import {
  ANSWER_ACCENT_CLASS,
  ANSWER_BLOCK,
} from "@/components/search/answer/answerStyle";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { SearchAnswer } from "@/lib/search/answer";
import { formatMillionsInWords } from "@/lib/search/answerFormat";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface WhatBlockProps {
  answer: SearchAnswer;
  language?: Language;
  /** Subjects answering to the same name; above one the eyebrow says so. */
  subjectCount?: number;
  /** Overrides the lead, for the sentence above several answers (two Congos). */
  lead?: string;
  /** One page, one h1: a second answer on the page asks for an h2. */
  headingLevel?: "h1" | "h2";
}

function fallbackLead(
  answer: SearchAnswer,
  language: Language
): string | undefined {
  const copy = searchAnswerCopy[language].whatFallback;
  const { population, countryCount, peopleCount } = answer.what.facts;
  const figure =
    population === undefined
      ? undefined
      : formatMillionsInWords(population, language);

  switch (answer.kind) {
    case "people":
      if (figure === undefined) return undefined;
      return countryCount === undefined
        ? copy.peopleNoCount(figure)
        : copy.people(figure, countryCount);
    case "country":
      return peopleCount === undefined ? undefined : copy.country(peopleCount);
    case "language":
      return figure !== undefined && countryCount !== undefined
        ? copy.language(figure, countryCount)
        : undefined;
    case "languageFamily":
      return figure !== undefined && countryCount !== undefined
        ? copy.languageFamily(figure, countryCount)
        : undefined;
    case "patronyme":
      return countryCount === undefined
        ? undefined
        : copy.patronyme(countryCount);
    default:
      return undefined;
  }
}

/**
 * « What it is »: the kind, the name, one sentence. The sentence is the
 * fiche's own when it wrote one; otherwise a template that says only what the
 * facts support, and nothing at all when they say nothing.
 * @req REQ-178
 */
export function WhatBlock({
  answer,
  language = "fr",
  subjectCount = 1,
  lead,
  headingLevel = "h1",
}: WhatBlockProps) {
  const copy = searchAnswerCopy[language];
  const eyebrow =
    subjectCount > 1
      ? copy.eyebrowMany(answer.kind, subjectCount)
      : copy.eyebrow[answer.kind];
  const sentence = lead ?? answer.what.lead ?? fallbackLead(answer, language);
  const Heading = headingLevel;

  return (
    <section
      className={cn(
        ANSWER_BLOCK,
        ANSWER_ACCENT_CLASS[answer.kind],
        "flex flex-col gap-afh-base"
      )}
      data-answer-block="what"
    >
      <span className="text-afh-eyebrow font-bold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[0.12em] text-[color:var(--accent-ink)]">
        {eyebrow}
      </span>
      <Heading className="font-afh-display text-afh-hero font-black leading-[var(--afh-leading-hero)] text-afh-text [overflow-wrap:anywhere]">
        {answer.title}
      </Heading>
      {sentence ? (
        <p className="text-afh-lead leading-[var(--afh-leading-lead)] text-afh-text">
          <InlineMarkup text={sentence} />
        </p>
      ) : null}
    </section>
  );
}
