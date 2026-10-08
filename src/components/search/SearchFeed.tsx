"use client";

import { Fragment, useState, type ReactNode } from "react";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
import { inCountry } from "@/lib/atlas/countryPreposition";
import { getCountryCommonName } from "@/lib/countryNames";
import { ficheHrefFor } from "@/components/search/SearchResultCard";
import { AppellationsBlock } from "@/components/search/feed/AppellationsBlock";
import {
  FichesBlock,
  type FeedFicheItem,
} from "@/components/search/feed/FichesBlock";
import { FicheLinkBlock } from "@/components/search/feed/FicheLinkBlock";
import { FurtherBlock } from "@/components/search/feed/FurtherBlock";
import { LensesBlock } from "@/components/search/feed/LensesBlock";
import { OwedBlock } from "@/components/search/feed/OwedBlock";
import {
  PlatesBlock,
  type FeedPlateItem,
} from "@/components/search/feed/PlatesBlock";
import { QuizBlock } from "@/components/search/feed/QuizBlock";
import { SearchFeedLayout } from "@/components/search/feed/SearchFeedLayout";
import { ShortsBlock } from "@/components/search/feed/ShortsBlock";
import { OriginBlock } from "@/components/search/answer/OriginBlock";
import { CountriesAnswer } from "@/components/search/feed/CountriesAnswer";
import { SubjectAnswer } from "@/components/search/feed/SubjectAnswer";
import { VerdictBlock } from "@/components/search/feed/VerdictBlock";
import { WordAnswerPage } from "@/components/search/feed/WordAnswerPage";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { normalizeString } from "@/lib/normalize";
import { ANSWER_BLOCKS, type FeedBlockId } from "@/lib/search/resultGrammar";
import type { AnswerKind, WordAnswer } from "@/lib/search/answer";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { NamingPresentationForm } from "@/lib/search/naming";
import { planAnswerSubjects } from "@/lib/search/answerSubjectPlan";
import { buildRelationSearchHref } from "@/lib/search/relationSearch";
import { resolveNameOpening } from "@/lib/search/resolveNameOpening";
import { getLocalizedRoute } from "@/lib/routing";
import { groupPeopleResults } from "@/lib/search/groupPeopleResults";
import {
  buildSearchFeedPlan,
  type SearchFeedAnswerState,
} from "@/lib/search/searchFeedPlan";
import { buildFeedLenses, type FeedLensId } from "@/lib/search/searchLenses";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { SearchFeedPresentation } from "@/lib/search/searchFeedPresentation";
import type {
  SearchLead,
  SearchNearName,
  SearchResult,
} from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * A family or country chip's browse — "the peoples of the Krou family" —
 * reached through a link built by `buildRelationSearchHref`, never a name
 * search. `classifySearchFeed` reports this the same way it reports a name
 * search that widened (`state: "widened"`, no subjects): both mean "results
 * exist, but none answers to a searched name." This is what tells the two
 * apart, so the verdict reads "the peoples of X" rather than misreporting a
 * name search that found nothing exact.
 */
export interface SearchFeedRelation {
  kind: "family" | "country";
  id: string;
}

export interface SearchFeedProps {
  query: string;
  language: Language;
  state: SearchFeedAnswerState;
  results: readonly SearchResult[];
  subjects: readonly SearchResult[];
  leads: readonly SearchLead[];
  /** Kept for the callers that pass it; the answer no longer draws it. */
  nearNames?: readonly SearchNearName[];
  /** Reviewed answers for the searched term, from the search response. */
  nameAnswers?: readonly NameAnswer[];
  /**
   * The answer to a published word, carried by the envelope because the word
   * may match no fiche. It takes the page when no fiche answers to the query.
   */
  wordAnswers?: readonly WordAnswer[];
  /** Reviewed terms a near spelling may have meant; offered as choices, never applied. */
  nameSuggestions?: readonly string[];
  companions: SearchCompanionsData;
  resultCount?: number;
  presentation?: SearchFeedPresentation;
  relation?: SearchFeedRelation;
  onResultNavigate?: (type: string, rank: number) => void;
}

function normalizedQueryId(query: string): string {
  return (
    query
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown"
  );
}

function resultForms(
  state: SearchFeedAnswerState,
  query: string,
  subjects: readonly SearchResult[],
  leads: readonly SearchLead[],
  nameSuggestions: readonly string[],
  language: Language
) {
  if (state === "typo") {
    // Each suggestion is a new search the reader chooses; none is marked as
    // the searched form, because nothing the reader typed matched it. Reviewed
    // terms come first: they are spellings we hold an answer for.
    return [...nameSuggestions, ...leads.map((lead) => lead.name)].map(
      (name) => ({
        form: name,
        subjectId: undefined,
        qualifier: undefined,
        selfGiven: null,
        problematic: undefined,
        searched: false,
        href: `${getLocalizedRoute(language, "search")}?${new URLSearchParams({ q: name })}`,
      })
    );
  }

  const wanted = normalizeString(query.trim());
  const forms = subjects.flatMap((subject) => {
    const subjectId = `${subject.type}:${subject.id}`;
    const presentation = subject.naming?.presentation.forms ?? [];
    const filedName = getLocalizedSearchResultName(subject, language);
    // Operator ruling, 2026-09-22: the name a people gives itself comes first,
    // then the filed name and the others in the fiche's order. Ordering is not
    // crowning — every chip keeps the same weight; the self-given one is marked.
    return selfGivenFirst([
      {
        form: filedName,
        subjectId,
        selfGiven: subject.autonym === subject.name ? true : null,
        problematic: undefined,
        searched: normalizeString(filedName) === wanted,
      },
      ...presentation.map((form) => ({
        ...form,
        subjectId,
        searched: normalizeString(form.form) === wanted,
        detail: formDetail(form),
      })),
    ]);
  });
  const unique = new Map(
    forms.map((form) => [
      `${form.subjectId}:${normalizeString(form.form)}`,
      form,
    ])
  );
  return [...unique.values()];
}

/**
 * What the corpus records about one form, as a single line — only when it
 * records something. A form with no origin stays a plain label, never a button
 * that opens onto nothing.
 */
function formDetail(
  form: NamingPresentationForm
):
  | { text: string; evidence?: NamingPresentationForm["evidence"][number] }
  | undefined {
  if (!form.origin) return undefined;
  const text = [
    form.origin.meaning,
    form.origin.languageCode,
    form.origin.imposedBy,
    form.origin.period,
  ]
    .filter(Boolean)
    .join(" · ");
  return text ? { text, evidence: form.evidence[0] } : undefined;
}

/** A stable partition: self-given forms first, every other form in its order. */
function selfGivenFirst<T extends { selfGiven?: boolean | null }>(
  forms: readonly T[]
): T[] {
  return [
    ...forms.filter((form) => form.selfGiven === true),
    ...forms.filter((form) => form.selfGiven !== true),
  ];
}

// @req REQ-178
// @req REQ-180
export function SearchFeed({
  query,
  language,
  state,
  results,
  subjects,
  leads,
  nameAnswers = [],
  wordAnswers = [],
  nameSuggestions = [],
  companions: loadedCompanions,
  resultCount,
  presentation,
  relation,
  onResultNavigate,
}: SearchFeedProps) {
  const [activeLens, setActiveLens] = useState<FeedLensId>("all");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [validatedOption, setValidatedOption] = useState<number | null>(null);
  const copy = searchFeedCopy[language];
  const answerCopy = nameAnswerCopy[language];
  const relatedOnly =
    state === "widened" && subjects.length === 0 && results.length > 0;
  // A related-only answer shows no shelf, so that nothing unrelated sits under
  // it. A piece found by the reader's own word is the exception: it answers the
  // very word that was typed.
  const wordShorts = loadedCompanions.shorts.items.filter(
    ({ match }) => match.relation === "word"
  );
  const companions: SearchCompanionsData = relatedOnly
    ? {
        subjects: [],
        shorts: { count: wordShorts.length, items: wordShorts },
        anecdotes: { count: 0, items: [] },
        proverbs: { count: 0, items: [] },
        quiz: { count: 0, item: null },
      }
    : loadedCompanions;
  const derivedForms = resultForms(
    state,
    query,
    subjects,
    leads,
    nameSuggestions,
    language
  );
  const forms = presentation?.appellations?.forms ?? derivedForms;

  const combinedPlates: FeedPlateItem[] = [
    ...companions.anecdotes.items.map((item) => ({
      ...item,
      type: "anecdote" as const,
    })),
    ...companions.proverbs.items.map((item) => ({
      ...item,
      type: "proverb" as const,
    })),
  ];
  const plateOrder = new Map(
    (presentation?.plates?.order ?? []).map((id, index) => [id, index])
  );
  const plates =
    plateOrder.size > 0
      ? [...combinedPlates].sort(
          (left, right) =>
            (plateOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
            (plateOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
        )
      : combinedPlates;
  const ficheEntries =
    results.length > 0 ? groupPeopleResults([...results]) : leads;
  const derivedFicheRows = ficheEntries.map((entry, index): FeedFicheItem =>
    entry.type === "peopleGroup"
      ? {
          kind: getSearchEntityLabel("people"),
          name: entry.peopleGroupLabel,
          meta: copy.blocks.groupMeta(entry.members.length),
          links: entry.members.map((member) => ({
            name: getLocalizedSearchResultName(member, language),
            href: ficheHrefFor(member, language),
            onNavigate: () => onResultNavigate?.("peopleGroup", index + 1),
          })),
        }
      : {
          kind: getSearchEntityLabel(entry.type),
          name: getLocalizedSearchResultName(entry, language),
          meta: copy.blocks.ficheMeta,
          href: ficheHrefFor(entry as SearchResult, language),
          onNavigate: () => onResultNavigate?.(entry.type, index + 1),
        }
  );
  const ficheRows = presentation?.fiches?.items ?? derivedFicheRows;

  // A relation browse ("the peoples of the Krou family") only replaces the
  // name-search movement when there is no subject to answer — a query that
  // also matches a subject (a country filter alongside a name search that
  // succeeds) answers that name as usual, the relation staying a filter
  // rather than becoming the page's subject.
  const isRelationBrowse = Boolean(relation) && subjects.length === 0;
  const relationLabel =
    isRelationBrowse && relation?.kind === "family"
      ? (results[0]?.languageFamilyName ?? results[0]?.languageFamilyName)
      : isRelationBrowse && relation?.kind === "country"
        ? getCountryCommonName(language, relation.id, relation.id)
        : undefined;
  const opening = resolveNameOpening({ query, subjects, nameAnswers });
  const answered = subjects.filter((subject) => subject.answer);
  // A published word is answered by its record. This precedes the confession
  // on purpose: « pharaon » reaches no fiche, and « Nous ne connaissons pas ce
  // nom » would deny the piece we made on it. A fiche that does answer keeps
  // the page: the word is then only one more thing the name can mean.
  const wordPage = wordAnswers.length > 0 && subjects.length === 0 && !relation;
  const displayName =
    presentation?.answer?.name ??
    relationLabel ??
    opening.title ??
    (state === "typo"
      ? query.trim()
      : answered.length === 1
        ? answered[0].answer!.title
        : subjects[0]
          ? getLocalizedSearchResultName(subjects[0], language)
          : query);

  // A piece found by the reader's word answers it: the confession would deny
  // what the shelf below is showing.
  const hasWordPiece = companions.shorts.items.some(
    ({ match }) => match.relation === "word"
  );
  // No entity answers to the word, whether the search found nothing or only
  // related fiches: what we hold is the piece.
  const answeredByWord =
    hasWordPiece &&
    subjects.length === 0 &&
    (state === "unknown" || state === "widened");
  // A reviewed answer matched on the term alone (no fiche answered to the
  // spelling): the confession would deny the answer shown right below it.
  const answeredByReview =
    subjects.length === 0 &&
    opening.entries.length > 0 &&
    (state === "unknown" || state === "typo");
  const verdict =
    presentation?.answer?.verdict ??
    (answeredByWord
      ? answerCopy.wordName
      : answeredByReview
        ? copy.answer.exact
        : state === "unknown"
          ? answerCopy.unknownName
          : state === "typo"
            ? copy.answer.typo
            : state === "widened"
              ? relation?.kind === "family" && relationLabel
                ? copy.answer.relationFamilyVerdict(relationLabel)
                : relation?.kind === "country"
                  ? copy.answer.relationCountryVerdict(
                      inCountry(relation.id, displayName, language)
                    )
                  : copy.answer.relatedOnly
              : copy.answer.exact);
  const summary =
    presentation?.answer?.summary ??
    (answeredByReview
      ? copy.answer.exactSummary
      : state === "unknown"
        ? hasWordPiece
          ? answerCopy.wordNameBody
          : answerCopy.unknownNameBody
        : state === "typo"
          ? copy.answer.typoSummary(displayName)
          : state === "widened"
            ? isRelationBrowse
              ? copy.answer.relationSummary
              : copy.answer.widenedSummary
            : copy.answer.exactSummary);
  const relationEyebrow = isRelationBrowse
    ? copy.answer.relationEyebrow
    : undefined;
  const contributionTarget = subjects[0]
    ? {
        type: subjects[0].type,
        id: subjects[0].id,
        name: displayName,
        fieldPath: "naming",
        fieldLabel: answerCopy.appellations,
      }
    : {
        type: "search-query",
        id: normalizedQueryId(query),
        name: query,
        fieldPath: "search-feed",
        fieldLabel: answerCopy.invitation,
      };

  const lenses = buildFeedLenses(
    {
      shorts: companions.shorts.items.length,
      stories: plates.length,
      quiz: companions.quiz.item ? 1 : 0,
      fiches: ficheRows.length > 0 ? (resultCount ?? ficheRows.length) : 0,
    },
    copy.filters
  );
  // The closing asks for what only a reader of this kind can bring. Several
  // subjects of different kinds share one neutral invitation.
  const hasAnswer = wordPage || answered.length > 0;
  const answeredKinds = new Set(answered.map(({ answer }) => answer!.kind));
  const closingKind: AnswerKind = wordPage
    ? "word"
    : answeredKinds.size === 1
      ? [...answeredKinds][0]
      : "people";
  const plan = buildSearchFeedPlan(
    state,
    {
      answers: answered.length > 0,
      appellations: forms.length > 0,
      fiches: ficheRows.length > 0,
    },
    { relatedOnly, wordPage }
  );

  const exactSubjectIds = new Set(
    companions.shorts.items.flatMap(({ match }) =>
      match.relation === "exact"
        ? [`${match.entityType}:${match.entityId}`]
        : []
    )
  );
  const needsEmptyShort =
    !hasWordPiece &&
    (state === "unknown" ||
      state === "widened" ||
      companions.shorts.items.length === 0 ||
      companions.subjects.some(
        ({ entityType, entityId }) =>
          !exactSubjectIds.has(`${entityType}:${entityId}`)
      ));

  // The reviewed answer of a subject takes the place of its automatic origin;
  // when one answer covers several subjects it is shown once, under the first.
  const reviewedFor = (subject: SearchResult) =>
    opening.entries.find(({ subjects: covered }) => covered[0] === subject)
      ?.answer;
  const coveredByAnother = (subject: SearchResult) =>
    opening.entries.some(
      ({ subjects: covered }) =>
        covered.includes(subject) && covered[0] !== subject
    );

  // Two countries bearing the name are one block, and the peoples filed under
  // a family's name are a way in rather than a second answer.
  const answerPlan = planAnswerSubjects(answered, language);
  const singleBlocks = answerPlan.flatMap((block) =>
    block.kind === "subject" ? [block] : []
  );
  const foldedPeoples = new Set(
    singleBlocks.flatMap((block) => block.peoplesOfFamily ?? [])
  );
  const ficheSubjects = subjects.filter(
    (subject) => !foldedPeoples.has(subject)
  );

  // Two subjects that tell the same origin say it once, before their own
  // blocks, rather than twice in a row.
  const originTexts = (subject: SearchResult) =>
    JSON.stringify(
      subject.answer?.origin?.accounts.map(({ text }) => text) ?? null
    );
  const singles = singleBlocks.map((block) => block.subject);
  const sharedOrigin =
    singles.length > 1 &&
    opening.entries.length === 0 &&
    singles[0].answer?.origin &&
    singles.every((subject) => originTexts(subject) === originTexts(singles[0]))
      ? singles[0].answer.origin
      : undefined;

  const choicesFor = (
    family: SearchResult,
    peoples: readonly SearchResult[]
  ) =>
    peoples.length === 0
      ? []
      : [
          {
            kind: "languageFamily" as const,
            eyebrow: searchAnswerCopy[language].choices.family,
            label: family.answer!.title,
            href: ficheHrefFor(family, language),
          },
          {
            kind: "people" as const,
            eyebrow: searchAnswerCopy[language].choices.peoples.eyebrow,
            label: searchAnswerCopy[language].choices.peoples.label,
            href: buildRelationSearchHref(language, {
              kind: "family",
              id: family.id,
            }),
          },
        ];
  const peopleLinkFor = (subject: SearchResult) => {
    const count = subject.answer?.what.facts.peopleCount;
    return subject.type === "languageFamily" && count
      ? {
          count,
          href: buildRelationSearchHref(language, {
            kind: "family",
            id: subject.id,
          }),
        }
      : undefined;
  };

  const pageName =
    displayName.charAt(0).toLocaleUpperCase(language) + displayName.slice(1);
  const blockTitle = (block: (typeof answerPlan)[number]) =>
    block.kind === "countries" ? pageName : block.subject.answer!.title;
  // Subjects all named like the search (the two Congos and the family name
  // « Congo ») each carry that name as their title, the eyebrow above it. A
  // page title above them would be the same word a third time, and bigger
  // than the others it names: so there is none, and the first block holds the
  // h1 at the size of its siblings.
  const sharedTitle =
    answerPlan.length > 1 &&
    answerPlan.every(
      (block) =>
        normalizeString(blockTitle(block)) === normalizeString(pageName)
    );

  const renderAnswers = (): ReactNode => (
    <>
      {answerPlan.length > 1 && !sharedTitle ? (
        <h1 className="font-afh-display text-afh-hero font-black leading-[var(--afh-leading-hero)] text-afh-text [overflow-wrap:anywhere]">
          {pageName}
        </h1>
      ) : null}
      {sharedOrigin ? (
        <OriginBlock
          origin={sharedOrigin}
          kind={singles[0].answer!.kind}
          title={displayName}
          language={language}
        />
      ) : null}
      {answerPlan.map((block, index) => {
        const headingLevel =
          answerPlan.length > 1 && !(sharedTitle && index === 0) ? "h2" : "h1";
        const titleScale = sharedTitle ? "section" : undefined;
        const { subject, peoplesOfFamily = [] } =
          block.kind === "subject"
            ? block
            : { subject: undefined, peoplesOfFamily: [] };
        const body =
          block.kind === "countries" ? (
            <CountriesAnswer
              key={`countries:${block.subjects.map(({ id }) => id).join("+")}`}
              entries={block.subjects.map((entry) => ({
                answer: entry.answer!,
                listedPeoples: entry.associatedPeoples,
              }))}
              title={pageName}
              reviewed={block.subjects
                .map(reviewedFor)
                .find((entry) => entry !== undefined)}
              originCoveredElsewhere={
                !block.subjects.map(reviewedFor).some(Boolean) &&
                (block.subjects.some(coveredByAnother) || Boolean(sharedOrigin))
              }
              headingLevel={headingLevel}
              titleScale={titleScale}
              language={language}
            />
          ) : (
            <SubjectAnswer
              key={`${subject!.type}:${subject!.id}`}
              answer={subject!.answer!}
              listedPeoples={subject!.associatedPeoples}
              searchedForm={query}
              reviewed={reviewedFor(subject!)}
              originCoveredElsewhere={
                coveredByAnother(subject!) || Boolean(sharedOrigin)
              }
              headingLevel={headingLevel}
              titleScale={titleScale}
              choices={choicesFor(subject!, peoplesOfFamily)}
              peopleLink={peopleLinkFor(subject!)}
              language={language}
            />
          );
        // A second subject is parted from the first by a rule, so the page
        // does not read as two pages stacked.
        return index === 0 ? (
          body
        ) : (
          <div
            key={`divider:${index}`}
            data-subject-divider=""
            className="mt-[var(--afh-section-gap)] flex flex-col gap-[var(--afh-section-gap)] border-t border-afh-border pt-[var(--afh-section-gap)]"
          >
            {body}
          </div>
        );
      })}
    </>
  );

  const renderBlock = (id: FeedBlockId): ReactNode => {
    switch (id) {
      case "lenses":
        // A lone « Tout » is a filter with nothing to choose.
        if (lenses.length < 2) return null;
        return (
          <LensesBlock
            language={language}
            reviewed={Boolean(presentation)}
            lenses={lenses}
            active={activeLens}
            onChange={setActiveLens}
          />
        );
      case "verdict":
        return (
          <VerdictBlock
            name={displayName}
            verdict={verdict}
            summary={summary}
            entries={presentation?.answer ? [] : opening.entries}
            unanswered={presentation?.answer ? [] : opening.unanswered}
            kind={presentation?.answer?.kind}
            eyebrow={presentation?.answer?.eyebrow ?? relationEyebrow}
            language={language}
            tone={
              presentation?.answer?.tone ??
              (state === "typo" || state === "unknown" ? "plain" : "answer")
            }
          />
        );
      case "appellations":
        return (
          <AppellationsBlock
            key={query}
            forms={forms}
            groupLabels={Object.fromEntries(
              subjects.map((subject) => [
                `${subject.type}:${subject.id}`,
                `${getLocalizedSearchResultName(subject, language)} · ${getSearchEntityLabel(subject.type)}`,
              ])
            )}
            title={
              presentation?.appellations?.title ??
              (state === "typo" ? copy.answer.typoChoices : undefined)
            }
            subtitle={
              presentation?.appellations
                ? Object.prototype.hasOwnProperty.call(
                    presentation.appellations,
                    "subtitle"
                  )
                  ? (presentation.appellations.subtitle ?? undefined)
                  : answerCopy.appellationsLead
                : undefined
            }
            language={language}
          />
        );
      case "fiche-link":
        return (
          <FicheLinkBlock
            subjects={ficheSubjects}
            language={language}
            onNavigate={(subject) =>
              onResultNavigate?.(subject.type, subjects.indexOf(subject) + 1)
            }
          />
        );
      case "shorts":
        return needsEmptyShort ? (
          <ShortsBlock
            items={companions.shorts.items}
            reviewed={Boolean(presentation)}
            title={presentation?.shorts?.title}
            subtitle={presentation?.shorts?.subtitle ?? undefined}
            language={language}
            allHref={getLocalizedRoute(language, "discoveries")}
            emptySlot={
              presentation?.shorts?.emptySlot ?? {
                name: displayName,
                question: formatProductionNameQuestion(displayName, language),
                body: copy.emptyShort.body,
                action: copy.emptyShort.action,
              }
            }
            contributionTarget={contributionTarget}
          />
        ) : (
          <ShortsBlock
            items={companions.shorts.items}
            reviewed={Boolean(presentation)}
            title={presentation?.shorts?.title}
            subtitle={presentation?.shorts?.subtitle ?? undefined}
            language={language}
            allHref={getLocalizedRoute(language, "discoveries")}
          />
        );
      case "plates":
        return (
          <PlatesBlock
            items={plates}
            reviewed={Boolean(presentation)}
            title={presentation?.plates?.title}
            subtitle={presentation?.plates?.subtitle ?? undefined}
            language={language}
            allHref={getLocalizedRoute(language, "discoveries")}
          />
        );
      case "quiz":
        return companions.quiz.item ? (
          <QuizBlock
            reviewed={Boolean(presentation)}
            question={companions.quiz.item}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            onValidate={(option) =>
              setValidatedOption(option ?? selectedOption)
            }
            language={language}
            questionCountLabel={
              presentation?.quiz?.questionCountLabel ??
              copy.blocks.questionCount
            }
            allHref={getLocalizedRoute(language, "quiz")}
            result={
              validatedOption === null
                ? undefined
                : {
                    isCorrect:
                      validatedOption === companions.quiz.item.correctOption,
                    isLastQuestion: true,
                    onNext: () => {
                      setSelectedOption(null);
                      setValidatedOption(null);
                    },
                  }
            }
          />
        ) : null;
      case "fiches":
        return (
          <FichesBlock
            items={ficheRows}
            reviewed={Boolean(presentation)}
            title={presentation?.fiches?.title}
            subtitle={presentation?.fiches?.subtitle ?? undefined}
            language={language}
          />
        );
      case "owed":
        return (
          <OwedBlock
            language={language}
            reviewed={Boolean(presentation)}
            thin
            silences={presentation?.owed?.silences ?? []}
            conviction={
              hasAnswer
                ? undefined
                : (presentation?.owed?.conviction ?? {
                    title: answerCopy.conviction,
                    body: answerCopy.convictionBody,
                  })
            }
            invitation={
              presentation?.owed?.invitation ??
              (hasAnswer
                ? searchAnswerCopy[language].invitation[closingKind]
                : {
                    title: answerCopy.invitation,
                    body: answerCopy.invitationBody,
                    action: answerCopy.invitationAction,
                  })
            }
            contributionTarget={contributionTarget}
          />
        );
      case "further":
        return (
          <FurtherBlock
            language={language}
            links={[
              ...(presentation?.further?.links ?? [
                {
                  href: getLocalizedRoute(language, "peoples"),
                  label: answerCopy.browsePeoples,
                },
                {
                  href: getLocalizedRoute(language, "families"),
                  label: answerCopy.browseFamilies,
                },
              ]),
            ]}
          />
        );
      default:
        return null;
    }
  };

  const wordBlocks = wordAnswers.map((wordAnswer) => (
    <WordAnswerPage
      key={wordAnswer.title}
      answer={wordAnswer}
      language={language}
    />
  ));
  const renderPrimary = (id: FeedBlockId): ReactNode => {
    // The six answer blocks are drawn together, once per subject: the plan
    // names them in order, the answer component keeps them together.
    if (id === "answer-what") return wordPage ? wordBlocks : renderAnswers();
    if ((ANSWER_BLOCKS as readonly string[]).includes(id)) return null;
    return renderBlock(id);
  };

  // A filter replaces the answer: the page is then about what the reader
  // asked to see, under a heading that says so, with a way back.
  if (activeLens !== "all") {
    const lensBlock: Record<Exclude<FeedLensId, "all">, ReactNode> = {
      shorts: (
        <ShortsBlock
          grouped
          items={companions.shorts.items}
          reviewed={Boolean(presentation)}
          language={language}
        />
      ),
      stories: renderBlock("plates"),
      quiz: renderBlock("quiz"),
      fiches: renderBlock("fiches"),
    };
    return (
      <SearchFeedLayout
        className="text-afh-text"
        reviewed={Boolean(presentation)}
        first={renderBlock("lenses")}
        blocks={[
          <h1
            key="lens-title"
            className="font-afh-display text-afh-h1 font-black leading-[var(--afh-leading-h1)] text-afh-text [overflow-wrap:anywhere]"
          >
            {copy.lens.title[activeLens](displayName)}
          </h1>,
          <Fragment key="lens-content">{lensBlock[activeLens]}</Fragment>,
          <div key="lens-back">
            <button
              type="button"
              onClick={() => setActiveLens("all")}
              className="inline-flex min-h-11 items-center font-bold text-[color:var(--accent-ink)] underline underline-offset-4 focus-visible:outline-none focus-visible:shadow-[var(--afh-ring-focus)]"
            >
              {copy.lens.back}
            </button>
          </div>,
        ]}
      />
    );
  }

  return (
    <SearchFeedLayout
      className="text-afh-text"
      reviewed={Boolean(presentation)}
      first={
        <>
          {plan.first.map((id) => (
            <Fragment key={id}>{renderBlock(id)}</Fragment>
          ))}
        </>
      }
      blocks={plan.primary.map((id) => (
        <Fragment key={id}>{renderPrimary(id)}</Fragment>
      ))}
      closing={plan.closing.map((id) => (
        <Fragment key={id}>{renderBlock(id)}</Fragment>
      ))}
    />
  );
}
