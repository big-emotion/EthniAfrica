"use client";

import {
  Fragment,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
import { inCountry } from "@/lib/atlas/countryPreposition";
import { getCountryCommonName } from "@/lib/countryNames";
import { ficheHrefFor } from "@/components/search/SearchResultCard";
import { AppellationsBlock } from "@/components/search/feed/AppellationsBlock";
import { FactsBlock } from "@/components/search/feed/FactsBlock";
import {
  FichesBlock,
  type FeedFicheItem,
} from "@/components/search/feed/FichesBlock";
import { FurtherBlock } from "@/components/search/feed/FurtherBlock";
import { ImageBlock } from "@/components/search/feed/ImageBlock";
import {
  LensesBlock,
  type FeedLensId,
} from "@/components/search/feed/LensesBlock";
import { OriginsBlock } from "@/components/search/feed/OriginsBlock";
import { OwedBlock } from "@/components/search/feed/OwedBlock";
import { PeopleBlock } from "@/components/search/feed/PeopleBlock";
import {
  PlatesBlock,
  type FeedPlateItem,
} from "@/components/search/feed/PlatesBlock";
import { ProseBlock } from "@/components/search/feed/ProseBlock";
import { QuizBlock } from "@/components/search/feed/QuizBlock";
import { SearchFeedLayout } from "@/components/search/feed/SearchFeedLayout";
import { ShortsBlock } from "@/components/search/feed/ShortsBlock";
import { TilesBlock } from "@/components/search/feed/TilesBlock";
import { VerdictBlock } from "@/components/search/feed/VerdictBlock";
import { WordAnswerPage } from "@/components/search/feed/WordAnswerPage";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { normalizeString } from "@/lib/normalize";
import type { WordAnswer } from "@/lib/search/answer";
import type { SearchEvidence } from "@/lib/search/evidence";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { NamingPresentationForm } from "@/lib/search/naming";
import { resolveNameOpening } from "@/lib/search/resolveNameOpening";
import { getLocalizedRoute } from "@/lib/routing";
import { groupPeopleResults } from "@/lib/search/groupPeopleResults";
import { parseHighlightedSnippet } from "@/lib/search/highlight";
import {
  buildSearchFeedPlan,
  type SearchFeedAnswerState,
  type SearchFeedAvailability,
} from "@/lib/search/searchFeedPlan";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import { cn } from "@/lib/utils";
import type { FeedBlockId } from "@/lib/search/resultGrammar";
import type { SearchFeedPresentation } from "@/lib/search/searchFeedPresentation";
import type {
  SearchLead,
  SearchNearName,
  SearchResult,
} from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

const DESKTOP_QUERY = "(min-width: 1200px)";

function subscribeDesktop(listener: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function desktopSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.(DESKTOP_QUERY).matches)
  );
}

function useDesktopFeed(): boolean {
  return useSyncExternalStore(subscribeDesktop, desktopSnapshot, () => false);
}

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
      .replace(/[\u0300-\u036f]/g, "")
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
): { text: string; evidence?: SearchEvidence } | undefined {
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

function feedAvailability(
  state: SearchFeedAnswerState,
  subjects: readonly SearchResult[],
  results: readonly SearchResult[],
  leads: readonly SearchLead[],
  companions: SearchCompanionsData,
  formCount: number,
  originCount: number,
  tileCount: number,
  problemCount: number,
  hasNameDisambiguation: boolean,
  nearNameCount: number
): SearchFeedAvailability {
  return {
    appellations: formCount > 0,
    origins: originCount > 0,
    peoples: hasNameDisambiguation,
    sharedName: hasNameDisambiguation,
    tiles: tileCount > 0,
    atlasHolds: state === "widened",
    plates:
      companions.anecdotes.items.length + companions.proverbs.items.length > 0,
    quiz: companions.quiz.item !== null,
    images: companions.images.items.length > 0,
    problem: problemCount > 0,
    nearName: nearNameCount > 0,
    fiches: results.length + leads.length > 0,
  };
}

function lensAllows(active: FeedLensId, id: FeedBlockId): boolean {
  if (active === "all") return true;
  if (["lenses", "verdict", "appellations"].includes(id)) return true;
  if (active === "shorts") return id === "shorts";
  if (active === "images") return id === "plates" || id === "images";
  if (active === "quiz") return id === "quiz";
  return id === "fiches";
}

function plainSnippet(snippet: string | undefined): string | undefined {
  return snippet
    ? parseHighlightedSnippet(snippet)
        .map(({ text }) => text)
        .join("")
    : undefined;
}

// @req REQ-180
export function SearchFeed({
  query,
  language,
  state,
  results,
  subjects,
  leads,
  nearNames = [],
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
  const desktop = useDesktopFeed();
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
        images: { count: 0, items: [] },
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
  const presentations = subjects.flatMap((subject) =>
    subject.naming ? [subject.naming.presentation] : []
  );
  const derivedOriginItems = subjects.flatMap((subject) =>
    (subject.naming?.presentation.forms ?? []).flatMap((form) =>
      form.origin
        ? [
            {
              name: form.form,
              qualifier: form.qualifier,
              description: [
                form.origin.meaning,
                form.origin.languageCode,
                form.origin.imposedBy,
                form.origin.period,
              ]
                .filter(Boolean)
                .join(" · "),
              evidence: form.evidence[0],
            },
          ]
        : []
    )
  );
  const originItems = presentation?.origins?.items ?? derivedOriginItems;
  const derivedTileRows = subjects.flatMap((subject) =>
    (subject.associatedPeoples ?? []).map((people) => ({
      title: people.name,
      meta: getSearchEntityLabel("people", language),
      href: ficheHrefFor(
        { type: "people", id: people.id, name: people.name },
        language
      ),
    }))
  );
  const tileRows = presentation?.tiles?.items ?? derivedTileRows;
  const disagreementStatements = presentations.flatMap((presentation) =>
    presentation.disagreements.flatMap(({ positions }) =>
      positions.flatMap(({ statement }) => (statement ? [statement] : []))
    )
  );
  const hasRecordedProblem = presentations.some(
    (presentation) =>
      presentation.problematic || presentation.disagreements.length > 0
  );
  const prosePresentation = (id: "shared-name" | "problem" | "near-name") =>
    presentation?.prose?.find((item) => item.id === id);
  const presentedProblem = prosePresentation("problem");
  const problemParagraphs =
    presentedProblem?.paragraphs ??
    (disagreementStatements.length > 0
      ? disagreementStatements
      : hasRecordedProblem
        ? [copy.blocks.problematicBody]
        : []);
  const subjectIdentities = new Set(
    subjects.map((subject) => subject.peopleGroupId ?? subject.id)
  );
  const subjectTypes = new Set(subjects.map((subject) => subject.type));
  // « Yoruba » files both a people and a language: selectNameSubject puts no
  // type restriction on an exact match, so subjects can already mix types.
  // The two disambiguation shapes read differently — same-type asks whether
  // the entries are related, cross-type only has to say they are different
  // things that happen to share a spelling — so they stay two flags rather
  // than one, even though both open the same two blocks.
  const hasPeopleDisambiguation =
    subjects.length >= 2 &&
    subjectTypes.size === 1 &&
    subjectTypes.has("people") &&
    subjectIdentities.size >= 2;
  const hasCrossTypeDisambiguation =
    subjects.length >= 2 &&
    subjectTypes.size >= 2 &&
    subjectIdentities.size >= 2;
  const hasNameDisambiguation =
    hasPeopleDisambiguation || hasCrossTypeDisambiguation;
  // Only silences a reviewer declared are shown. A missing structured field
  // describes what was projected onto this page, not what is known: the same
  // rule that keeps a missing video from reading as a missing source.
  const subjectSilences = presentation?.owed?.silences ?? [];
  const availability = feedAvailability(
    state,
    subjects,
    results,
    leads,
    companions,
    forms.length,
    originItems.length,
    tileRows.length,
    problemParagraphs.length,
    hasNameDisambiguation,
    nearNames.length
  );
  const plan = buildSearchFeedPlan(state, availability, { relatedOnly });
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
          kind: getSearchEntityLabel("people", language),
          name: entry.peopleGroupLabel,
          meta: copy.blocks.groupMeta(entry.members.length),
          links: entry.members.map((member) => ({
            name: getLocalizedSearchResultName(member, language),
            href: ficheHrefFor(member, language),
            onNavigate: () => onResultNavigate?.("peopleGroup", index + 1),
          })),
        }
      : {
          kind: getSearchEntityLabel(entry.type, language),
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
      ? ((language === "en"
          ? results[0]?.languageFamilyNameEn
          : results[0]?.languageFamilyName) ?? results[0]?.languageFamilyName)
      : isRelationBrowse && relation?.kind === "country"
        ? getCountryCommonName(language, relation.id, relation.id)
        : undefined;
  const opening = resolveNameOpening({ query, subjects, nameAnswers });
  const displayName =
    presentation?.answer?.name ??
    relationLabel ??
    opening.title ??
    (state === "typo"
      ? query.trim()
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
            : hasPeopleDisambiguation
              ? copy.answer.shared(subjects.length)
              : hasCrossTypeDisambiguation
                ? copy.answer.sharedGeneric(subjects.length)
                : state === "widened"
                  ? subjects.length > 0
                    ? copy.answer.widened
                    : relation?.kind === "family" && relationLabel
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
  // A published word is answered by its record. This precedes the confession
  // on purpose: « pharaon » reaches no fiche, and « Nous ne connaissons pas ce
  // nom » would deny the piece we made on it. A fiche that does answer keeps
  // the page: the word is then only one more thing the name can mean.
  if (wordAnswers.length > 0 && subjects.length === 0 && !relation) {
    return (
      <div className="text-afh-text">
        {wordAnswers.map((wordAnswer) => (
          <WordAnswerPage
            key={wordAnswer.title}
            answer={wordAnswer}
            language={language}
            contributionTarget={contributionTarget}
          />
        ))}
      </div>
    );
  }
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
  const lenses = [
    { id: "all" as const, label: copy.filters.all },
    {
      id: "shorts" as const,
      label: copy.filters.shorts,
      count: companions.shorts.count,
    },
    ...(plates.length + companions.images.count > 0
      ? [
          {
            id: "images" as const,
            label: copy.filters.images,
            count: plates.length + companions.images.count,
          },
        ]
      : []),
    ...(companions.quiz.item
      ? [{ id: "quiz" as const, label: copy.filters.quiz }]
      : []),
    ...(ficheRows.length > 0
      ? [
          {
            id: "fiches" as const,
            label: copy.filters.fiches,
            count: resultCount ?? ficheRows.length,
          },
        ]
      : []),
  ];
  const appellationsSubtitle = presentation?.appellations
    ? Object.prototype.hasOwnProperty.call(
        presentation.appellations,
        "subtitle"
      )
      ? (presentation.appellations.subtitle ?? undefined)
      : answerCopy.appellationsLead
    : undefined;
  const reviewedWideningNote = presentation
    ? presentation.shorts?.wideningNote
    : companions.shorts.items.some(
          ({ match }) => match.relation !== "exact" && match.relation !== "word"
        )
      ? copy.wideningNote
      : undefined;

  const renderBlock = (
    id: FeedBlockId,
    zone: FeedMovementZone = "primary"
  ): ReactNode => {
    if (!lensAllows(activeLens, id)) return null;
    switch (id) {
      case "lenses":
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
            className={
              state === "unknown" && presentation
                ? "min-[1200px]:col-span-7 min-[1200px]:pt-afh-5xl"
                : "min-[1200px]:col-span-7"
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
                `${getLocalizedSearchResultName(subject, language)} · ${getSearchEntityLabel(subject.type, language)}`,
              ])
            )}
            title={
              presentation?.appellations?.title ??
              (state === "typo" ? copy.answer.typoChoices : undefined)
            }
            subtitle={appellationsSubtitle}
            language={language}
            className="min-[1200px]:col-span-5"
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
            wideningNote={reviewedWideningNote}
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
            wideningNote={reviewedWideningNote}
          />
        );
      case "origins": {
        return (
          <OriginsBlock
            title={presentation?.origins?.title ?? answerCopy.origins}
            subtitle={presentation?.origins?.subtitle ?? undefined}
            lede={presentation?.origins?.lede}
            items={originItems}
            reviewed={Boolean(presentation)}
            language={language}
            zone={zone}
          />
        );
      }
      case "peoples":
        return (
          <PeopleBlock
            title={
              presentation?.peoples?.title ??
              (hasPeopleDisambiguation
                ? copy.shelves.peoples
                : copy.shelves.sharedEntries)
            }
            subtitle={presentation?.peoples?.subtitle ?? undefined}
            zone={zone}
            items={
              presentation?.peoples?.items ??
              subjects.map((subject) => ({
                name: getLocalizedSearchResultName(subject, language),
                meta:
                  subject.type === "people"
                    ? copy.blocks.peopleMeta
                    : getSearchEntityLabel(subject.type, language),
                description:
                  plainSnippet(subject.snippet) ??
                  copy.blocks.peopleDescription,
                href: ficheHrefFor(subject, language),
              }))
            }
          />
        );
      case "shared-name":
        const sharedName = prosePresentation("shared-name");
        return (
          <ProseBlock
            blockId="shared-name"
            title={sharedName?.title ?? copy.shelves.sharedName}
            paragraphs={
              sharedName?.paragraphs ?? [
                hasPeopleDisambiguation
                  ? copy.blocks.sharedNameBody
                  : copy.blocks.sharedNameBodyGeneric,
              ]
            }
            standing={sharedName?.standing}
            language={language}
            zone={zone}
          />
        );
      case "tiles":
        return (
          <TilesBlock
            title={
              presentation?.tiles?.title ?? copy.blocks.relatedPeoplesTitle
            }
            subtitle={presentation?.tiles?.subtitle ?? undefined}
            zone={zone}
            items={tileRows}
            actionHref={presentation?.tiles?.actionHref}
            actionLabel={presentation?.tiles?.actionLabel}
            reviewed={Boolean(presentation)}
          />
        );
      case "atlas-holds":
        return (
          <FactsBlock
            title={presentation?.facts?.title ?? answerCopy.atlasHolds}
            subtitle={presentation?.facts?.subtitle}
            zone={zone}
            items={
              presentation?.facts?.items ?? [
                { label: answerCopy.appellations, value: String(forms.length) },
                { label: copy.shelves.fiches, value: String(ficheRows.length) },
              ]
            }
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
            zone={zone}
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
            zone={zone}
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
      case "images":
        return companions.images.items[0] ? (
          <ImageBlock
            item={companions.images.items[0]}
            reviewed={Boolean(presentation)}
            title={presentation?.images?.title}
            subtitle={presentation?.images?.subtitle ?? undefined}
            licenceText={presentation?.images?.licenceText}
            language={language}
            zone={zone}
          />
        ) : null;
      case "problem":
        return (
          <ProseBlock
            blockId="problem"
            title={presentedProblem?.title ?? answerCopy.problem}
            paragraphs={problemParagraphs}
            standing={presentedProblem?.standing}
            language={language}
            zone={zone}
          />
        );
      case "near-name":
        const nearName = prosePresentation("near-name");
        return (
          <ProseBlock
            blockId="near-name"
            title={nearName?.title ?? copy.shelves.nearName}
            paragraphs={
              nearName?.paragraphs ??
              nearNames.map((result) => copy.blocks.nearNameBody(result.name))
            }
            standing={nearName?.standing}
            language={language}
            zone={zone}
          />
        );
      case "fiches":
        return (
          <FichesBlock
            items={ficheRows}
            reviewed={Boolean(presentation)}
            title={presentation?.fiches?.title}
            subtitle={presentation?.fiches?.subtitle ?? undefined}
            language={language}
            zone={zone}
          />
        );
      case "owed":
        return (
          <OwedBlock
            language={language}
            reviewed={Boolean(presentation)}
            thin={plan.thin}
            silences={subjectSilences}
            conviction={
              presentation?.owed?.conviction ?? {
                title: answerCopy.conviction,
                body: answerCopy.convictionBody,
              }
            }
            invitation={
              presentation?.owed?.invitation ?? {
                title: answerCopy.invitation,
                body: answerCopy.invitationBody,
                action: answerCopy.invitationAction,
              }
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

  const firstIds = plan.desktop.first.filter((id) =>
    lensAllows(activeLens, id)
  );
  const hasAppellations = firstIds.includes("appellations");
  // The unknown-name board pads the verdict block itself; every other board
  // pads the grid that holds it.
  const opensWithPaddedVerdict = state === "unknown" && Boolean(presentation);
  const first = (
    <>
      <div
        data-feed-opening="answer"
        className={cn(
          "min-w-0 min-[1200px]:grid min-[1200px]:grid-cols-12 min-[1200px]:items-start min-[1200px]:gap-afh-6xl",
          !opensWithPaddedVerdict && "min-[1200px]:pt-afh-5xl"
        )}
      >
        {firstIds.includes("verdict") ? (
          hasAppellations ? (
            renderBlock("verdict")
          ) : (
            <div className="min-[1200px]:col-span-12">
              {renderBlock("verdict")}
            </div>
          )
        ) : null}
        {hasAppellations ? renderBlock("appellations") : null}
      </div>
      {firstIds.includes("lenses") ? renderBlock("lenses") : null}
      {firstIds.includes("shorts") ? (
        <div
          data-feed-opening="shorts"
          className={
            presentation ? "mt-0" : "mt-afh-lg min-[1200px]:mt-afh-5xl"
          }
        >
          {renderBlock("shorts")}
        </div>
      ) : null}
    </>
  );
  const closingIds = plan.desktop.closing.filter((id) =>
    lensAllows(activeLens, id)
  );
  const closing = closingIds.map((id) => (
    <Fragment key={id}>{renderBlock(id)}</Fragment>
  ));

  if (!desktop) {
    const movement = plan.mobile.filter(
      (id) =>
        !plan.desktop.first.includes(id) && !plan.desktop.closing.includes(id)
    );
    return (
      <SearchFeedLayout
        className="text-afh-text"
        reviewed={Boolean(presentation)}
        first={first}
        composition={{
          mode: "mobile",
          blocks: movement.map((id) => (
            <Fragment key={id}>{renderBlock(id, "primary")}</Fragment>
          )),
        }}
        closing={closing}
      />
    );
  }

  return (
    <SearchFeedLayout
      className="text-afh-text"
      reviewed={Boolean(presentation)}
      first={first}
      composition={
        plan.thin
          ? {
              mode: "desktop-thin",
              primary: plan.desktop.primary.map((id) => (
                <Fragment key={id}>{renderBlock(id, "primary")}</Fragment>
              )),
            }
          : {
              mode: "desktop-rich",
              primary: plan.desktop.primary.map((id) => (
                <Fragment key={id}>{renderBlock(id, "primary")}</Fragment>
              )),
              secondary: plan.desktop.secondary.map((id) => (
                <Fragment key={id}>{renderBlock(id, "secondary")}</Fragment>
              )),
            }
      }
      closing={closing}
    />
  );
}
