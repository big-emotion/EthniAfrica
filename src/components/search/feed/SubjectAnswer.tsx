import { NamesBlock } from "@/components/search/answer/NamesBlock";
import { NextQuestion } from "@/components/search/answer/NextQuestion";
import { OriginBlock } from "@/components/search/answer/OriginBlock";
import { SourcesLine } from "@/components/search/answer/SourcesLine";
import { WhatBlock } from "@/components/search/answer/WhatBlock";
import { WhereBars } from "@/components/search/answer/WhereBars";
import { ReviewedOrigin } from "@/components/search/feed/NameAnswerEntries";
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
          language={language}
        />
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
