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
import { ActionLink } from "@/components/ui/ActionLink";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { SearchAnswer } from "@/lib/search/answer";
import {
  presentAnswerWhere,
  reviewedAnswerSources,
} from "@/lib/search/answerPresentation";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import { selfNameLead } from "@/lib/search/searchedName";
import type { Language } from "@/types/shared";

export interface SubjectAnswerProps {
  answer: SearchAnswer;
  /** The peoples the fiche lists, by id and name, to name a country's shares. */
  listedPeoples?: ReadonlyArray<{ id: string; name: string }>;
  /** The form the reader typed: marked and listed first in the names. */
  searchedForm?: string;
  /** Where the self-given name leads: the subject's fiche, headed by it. */
  selfNameHref?: string;
  /** An editor's answer for this subject; it takes the origin and its sources. */
  reviewed?: NameAnswer;
  /** The origin is already told by a reviewed answer shown for another subject. */
  originCoveredElsewhere?: boolean;
  /** One page, one h1: the second subject of a shared name asks for an h2. */
  headingLevel?: "h1" | "h2";
  titleScale?: "hero" | "section";
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
  selfNameHref,
  reviewed,
  originCoveredElsewhere = false,
  headingLevel = "h1",
  titleScale,
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
        titleScale={titleScale}
      >
        <SearchedNameLead
          answer={answer}
          searchedForm={searchedForm}
          href={selfNameHref}
          language={language}
        />
      </WhatBlock>
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

/**
 * « Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. » A reader who
 * typed an exonym otherwise meets the self-name in the heading and thinks they
 * landed on the wrong page (doctrine §1.1, 2026-10-08). The link goes to the
 * fiche, whose heading leads with the self-name; a search for the self-name
 * would not do, since a self-appellation is often prose (« Fulbe (pluriel),
 * Pullo (singulier) ») that no search answers to.
 */
function SearchedNameLead({
  answer,
  searchedForm,
  href,
  language,
}: {
  answer: SearchAnswer;
  searchedForm?: string;
  href?: string;
  language: Language;
}) {
  const copy = searchFeedCopy[language].searchedLead;
  const selfLine = copy.self[answer.kind as keyof typeof copy.self];
  const lead = selfNameLead(answer.names, searchedForm);
  if (!lead || !selfLine || !href) return null;
  return (
    <p
      data-searched-lead=""
      className="m-0 flex flex-col items-start text-afh-body leading-[var(--afh-leading-body)] text-afh-text [overflow-wrap:anywhere]"
    >
      <span>{copy.searched(lead.searched)}</span>
      <ActionLink href={href}>{selfLine(lead.self)}</ActionLink>
    </p>
  );
}
