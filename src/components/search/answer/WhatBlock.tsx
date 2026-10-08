import type { ReactNode } from "react";

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
  /**
   * Size of the title, which follows its rank unless told otherwise. A page
   * whose subjects are all named alike has an h1 that is no bigger than the
   * titles under it: none of them is the page's title more than another.
   */
  titleScale?: "hero" | "section";
  /** Drawn right under the title, before the sentence. */
  children?: ReactNode;
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
  titleScale = headingLevel === "h1" ? "hero" : "section",
  children,
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
      className={cn(ANSWER_BLOCK, "flex flex-col gap-afh-base")}
      data-answer-block="what"
      data-feed-block="answer-what"
      data-feed-zone="primary"
    >
      <span
        className={cn(
          ANSWER_ACCENT_CLASS[answer.kind],
          "text-afh-eyebrow font-bold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[0.12em] text-[color:var(--accent-ink)]"
        )}
      >
        {eyebrow}
      </span>
      <Heading
        className={cn(
          "font-afh-display font-black text-afh-text [overflow-wrap:anywhere]",
          // A second subject on the page is a section of it, not its title.
          titleScale === "hero"
            ? "text-afh-hero leading-[var(--afh-leading-hero)]"
            : "text-afh-h1 leading-[var(--afh-leading-h1)]"
        )}
      >
        {answer.title}
      </Heading>
      {children}
      {sentence ? (
        <p className="text-afh-lead leading-[var(--afh-leading-lead)] text-afh-text">
          <InlineMarkup text={sentence} />
        </p>
      ) : null}
    </section>
  );
}
