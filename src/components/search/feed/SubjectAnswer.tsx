import {
  NameChoices,
  type NameChoice,
} from "@/components/search/answer/NameChoices";
import { ANSWER_BLOCK } from "@/components/search/answer/answerStyle";
import { PeopleLink } from "@/components/search/answer/PeopleLink";
import { NamesBlock } from "@/components/search/answer/NamesBlock";
import { NextQuestion } from "@/components/search/answer/NextQuestion";
import { OriginBlock } from "@/components/search/answer/OriginBlock";
import { SourcesLine } from "@/components/search/answer/SourcesLine";
import { WhatBlock } from "@/components/search/answer/WhatBlock";
import { WhereBars } from "@/components/search/answer/WhereBars";
import { ReviewedOrigin } from "@/components/search/feed/NameAnswerEntries";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { SearchAnswer } from "@/lib/search/answer";
import {
  presentAnswerWhere,
  reviewedAnswerSources,
} from "@/lib/search/answerPresentation";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { Language } from "@/types/shared";

export interface SubjectAnswerProps {
  answer: SearchAnswer;
  /** The peoples the fiche lists, by id and name, to name a country's shares. */
  listedPeoples?: ReadonlyArray<{ id: string; name: string }>;
  /** The form the reader typed: marked in the names, never promoted. */
  searchedForm?: string;
  /** An editor's answer for this subject; it takes the origin and its sources. */
  reviewed?: NameAnswer;
  /** The origin is already told by a reviewed answer shown for another subject. */
  originCoveredElsewhere?: boolean;
  /** One page, one h1: the second subject of a shared name asks for an h2. */
  headingLevel?: "h1" | "h2";
  /** Ways in when the name is two things (a family and its peoples). */
  choices?: readonly NameChoice[];
  /** The peoples behind the speaker figures, counted from the data. */
  peopleLink?: { count: number; href: string };
  language: Language;
}

/**
 * The six blocks of one subject, in the order the operator validated: what it
 * is, where the name comes from, its names, where, what follows, and the
 * sources in one line. A block is drawn only when the answer carries its key;
 * nothing here announces that a block is empty.
 */
// @req REQ-178
export function SubjectAnswer({
  answer,
  listedPeoples = [],
  searchedForm,
  reviewed,
  originCoveredElsewhere = false,
  headingLevel = "h1",
  choices = [],
  peopleLink,
  language,
}: SubjectAnswerProps) {
  const where = presentAnswerWhere(answer.where, listedPeoples, language);
  const origin = reviewed || originCoveredElsewhere ? undefined : answer.origin;
  // A reviewed answer replaces the automatic origin, and so the sources that
  // backed it: the line must count what the reader is actually shown.
  const sources = reviewed
    ? reviewedAnswerSources(reviewed)
    : { count: answer.sources.count, accounts: answer.origin?.accounts };

  return (
    <>
      <WhatBlock
        answer={answer}
        language={language}
        headingLevel={headingLevel}
      />
      <NameChoices
        title={searchAnswerCopy[language].choices.title}
        choices={choices}
      />
      {reviewed ? (
        <ReviewedOrigin
          answer={reviewed}
          kind={answer.kind}
          language={language}
        />
      ) : origin && origin.accounts.length > 0 ? (
        <OriginBlock
          origin={origin}
          kind={answer.kind}
          title={answer.title}
          language={language}
        />
      ) : null}
      {answer.names.length > 0 || answer.path ? (
        <NamesBlock
          answer={answer}
          searchedForm={searchedForm}
          language={language}
        />
      ) : null}
      {where ? (
        <WhereBars
          where={where.where}
          kind={answer.kind}
          labels={where.labels}
          facts={answer.what.facts}
          unsplitPeopleNames={where.unsplitPeopleNames}
          peopleLink={peopleLink}
          language={language}
        />
      ) : peopleLink ? (
        // No speaker figures to hang it on: the peoples are still one click
        // away, counted from the data.
        <div className={ANSWER_BLOCK}>
          <PeopleLink
            count={peopleLink.count}
            href={peopleLink.href}
            kind={answer.kind}
            language={language}
          />
        </div>
      ) : null}
      {answer.next ? (
        <NextQuestion
          next={answer.next}
          kind={answer.kind}
          language={language}
        />
      ) : null}
      <SourcesLine
        count={sources.count}
        accounts={sources.accounts}
        kind={answer.kind}
        title={answer.title}
        language={language}
      />
    </>
  );
}
