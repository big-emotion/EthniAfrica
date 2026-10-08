import { NamesBlock } from "@/components/search/answer/NamesBlock";
import { NextQuestion } from "@/components/search/answer/NextQuestion";
import { OriginBlock } from "@/components/search/answer/OriginBlock";
import { SourcesLine } from "@/components/search/answer/SourcesLine";
import { WhatBlock } from "@/components/search/answer/WhatBlock";
import {
  WhereGroups,
  type WhereGroup,
} from "@/components/search/answer/WhereBars";
import { ReviewedOrigin } from "@/components/search/feed/NameAnswerEntries";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { AnswerAccount, SearchAnswer } from "@/lib/search/answer";
import {
  presentAnswerWhere,
  reviewedAnswerSources,
} from "@/lib/search/answerPresentation";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { Language } from "@/types/shared";

export interface CountriesAnswerEntry {
  answer: SearchAnswer;
  /** The peoples this country's fiche lists, by id and name. */
  listedPeoples?: ReadonlyArray<{ id: string; name: string }>;
}

export interface CountriesAnswerProps {
  entries: readonly CountriesAnswerEntry[];
  /** The searched name, which titles the page: no single country owns it. */
  title: string;
  /** An editor's answer for these subjects; it takes the origin and sources. */
  reviewed?: NameAnswer;
  originCoveredElsewhere?: boolean;
  /** One page, one h1: beside another subject the block asks for an h2. */
  headingLevel?: "h1" | "h2";
  titleScale?: "hero" | "section";
  language?: Language;
}

/** Two countries often tell the very same account: it is said once. */
function mergedAccounts(
  entries: readonly CountriesAnswerEntry[]
): AnswerAccount[] {
  return accountsWithOwners(entries).map(({ account }) => account);
}

function accountsWithOwners(entries: readonly CountriesAnswerEntry[]) {
  const seen = new Set<string>();
  return entries.flatMap(({ answer }) =>
    (answer.origin?.accounts ?? []).flatMap((account) => {
      if (seen.has(account.text)) return [];
      seen.add(account.text);
      return [{ account, owner: answer.title }];
    })
  );
}

/**
 * A follow-up the fiche wrote is a question about the name; a template is
 * about one country (its former name, its migration) and cannot speak for
 * two.
 */
function writtenFollowUp(
  entries: readonly CountriesAnswerEntry[]
): SearchAnswer["next"] {
  return entries
    .map(({ answer }) => answer.next)
    .find((next) => next !== undefined && "question" in next);
}

/**
 * Several States bearing one name, told as one answer: the six blocks once,
 * with each country's names through time and its share of the population under
 * its own name. Stacking a full answer per country made the reader compare two
 * pages that tell one story.
 * @req REQ-178
 */
export function CountriesAnswer({
  entries,
  title,
  reviewed,
  originCoveredElsewhere = false,
  headingLevel = "h1",
  titleScale,
  language = "fr",
}: CountriesAnswerProps) {
  const copy = searchAnswerCopy[language];
  const [first] = entries;
  if (!first) return null;

  const accounts = mergedAccounts(entries);
  // Each country telling its own single, undisputed reading are not rival
  // explanations of one name: the block says whose each one is.
  const ownReadings =
    accounts.length > 1 &&
    entries.every(
      ({ answer }) =>
        (answer.origin?.accounts.length ?? 0) <= 1 && !answer.origin?.debated
    );
  const accountLabels = ownReadings
    ? accountsWithOwners(entries).map(({ owner }) => owner)
    : undefined;
  const origin =
    reviewed || originCoveredElsewhere || accounts.length === 0
      ? undefined
      : {
          accounts,
          debated: entries.some(({ answer }) => answer.origin?.debated),
        };

  const whereGroups: WhereGroup[] = entries.flatMap(
    ({ answer, listedPeoples = [] }) => {
      const presented = presentAnswerWhere(
        answer.where,
        listedPeoples,
        language
      );
      return presented
        ? [
            {
              heading: answer.title,
              where: presented.where,
              labels: presented.labels,
              facts: answer.what.facts,
              unsplitPeopleNames: presented.unsplitPeopleNames,
            },
          ]
        : [];
    }
  );

  const sources = reviewed
    ? reviewedAnswerSources(reviewed)
    : {
        count: new Set(
          accounts.flatMap(({ evidence }) =>
            evidence.flatMap(({ sources: cited }) => cited.map(({ id }) => id))
          )
        ).size,
        accounts,
      };
  const next = writtenFollowUp(entries);

  return (
    <>
      <WhatBlock
        answer={{ ...first.answer, title }}
        subjectCount={entries.length}
        headingLevel={headingLevel}
        titleScale={titleScale}
        lead={copy.whatFallback.sharedCountryName(
          entries.length,
          new Intl.ListFormat(language, {
            style: "long",
            type: "conjunction",
          }).format(entries.map(({ answer }) => answer.title))
        )}
        language={language}
      />
      {reviewed ? (
        <ReviewedOrigin answer={reviewed} kind="country" language={language} />
      ) : origin ? (
        <OriginBlock
          origin={origin}
          kind="country"
          title={title}
          accountLabels={accountLabels}
          language={language}
        />
      ) : null}
      <NamesBlock
        answer={first.answer}
        groups={entries.map(({ answer }) => ({
          label: answer.title,
          names: answer.names,
        }))}
        language={language}
      />
      <WhereGroups groups={whereGroups} kind="country" language={language} />
      {next ? (
        <NextQuestion next={next} kind="country" language={language} />
      ) : null}
      <SourcesLine
        count={sources.count}
        accounts={sources.accounts}
        kind="country"
        title={title}
        language={language}
      />
    </>
  );
}
