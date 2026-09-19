"use client";

import {
  Fragment,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
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
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { normalizeString } from "@/lib/normalize";
import { getLocalizedRoute } from "@/lib/routing";
import { groupPeopleResults } from "@/lib/search/groupPeopleResults";
import { parseHighlightedSnippet } from "@/lib/search/highlight";
import {
  buildSearchFeedPlan,
  type SearchFeedAnswerState,
  type SearchFeedAvailability,
} from "@/lib/search/searchFeedPlan";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { FeedBlockId } from "@/lib/search/resultGrammar";
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

export interface SearchFeedProps {
  query: string;
  language: Language;
  state: SearchFeedAnswerState;
  results: readonly SearchResult[];
  subjects: readonly SearchResult[];
  leads: readonly SearchLead[];
  nearNames?: readonly SearchNearName[];
  companions: SearchCompanionsData;
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
  language: Language
) {
  if (state === "typo") {
    return leads.map((lead, index) => ({
      form: lead.name,
      subjectId: `${lead.type}:${lead.id}`,
      qualifier: undefined,
      selfGiven: null,
      problematic: undefined,
      searched: index === 0,
    }));
  }

  const wanted = normalizeString(query.trim());
  const forms = subjects.flatMap((subject) => {
    const subjectId = `${subject.type}:${subject.id}`;
    const presentation = subject.naming?.presentation.forms ?? [];
    const filedName = getLocalizedSearchResultName(subject, language);
    return [
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
      })),
    ];
  });
  const unique = new Map(
    forms.map((form) => [
      `${form.subjectId}:${normalizeString(form.form)}`,
      form,
    ])
  );
  return [...unique.values()];
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
  hasPeopleDisambiguation: boolean,
  nearNameCount: number
): SearchFeedAvailability {
  return {
    appellations: formCount > 0,
    origins: originCount > 0,
    peoples: hasPeopleDisambiguation,
    sharedName: hasPeopleDisambiguation,
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
  companions: loadedCompanions,
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
  const companions: SearchCompanionsData = relatedOnly
    ? {
        subjects: [],
        shorts: { count: 0, items: [] },
        anecdotes: { count: 0, items: [] },
        proverbs: { count: 0, items: [] },
        images: { count: 0, items: [] },
        quiz: { count: 0, item: null },
      }
    : loadedCompanions;
  const forms = resultForms(state, query, subjects, leads, language);
  const presentations = subjects.flatMap((subject) =>
    subject.naming ? [subject.naming.presentation] : []
  );
  const originItems = subjects.flatMap((subject) =>
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
  const tileRows = subjects.flatMap((subject) =>
    (subject.associatedPeoples ?? []).map((people) => ({
      title: people.name,
      meta: getSearchEntityLabel("people", language),
      href: ficheHrefFor(
        { type: "people", id: people.id, name: people.name },
        language
      ),
    }))
  );
  const disagreementStatements = presentations.flatMap((presentation) =>
    presentation.disagreements.flatMap(({ positions }) =>
      positions.flatMap(({ statement }) => (statement ? [statement] : []))
    )
  );
  const hasRecordedProblem = presentations.some(
    (presentation) =>
      presentation.problematic || presentation.disagreements.length > 0
  );
  const problemParagraphs =
    disagreementStatements.length > 0
      ? disagreementStatements
      : hasRecordedProblem
        ? [copy.blocks.problematicBody]
        : [];
  const subjectIdentities = new Set(
    subjects.map((subject) => subject.peopleGroupId ?? subject.id)
  );
  const hasPeopleDisambiguation =
    subjects.length >= 2 &&
    subjects.every((subject) => subject.type === "people") &&
    subjectIdentities.size >= 2;
  const subjectSilences = subjects.flatMap((subject) => {
    const naming = subject.naming;
    const isDated = Boolean(
      naming &&
      (naming.presentation.forms.some((form) => form.attestationPeriod) ||
        naming.presentation.eras.length > 0)
    );
    if (isDated) return [];
    const subjectName = getLocalizedSearchResultName(subject, language);
    return [
      {
        id: `${subject.type}:${subject.id}`,
        title:
          subjects.length > 1
            ? `${subjectName} — ${answerCopy.noDatedAttestation}`
            : answerCopy.noDatedAttestation,
        detail: answerCopy.noDatedAttestationBody,
      },
    ];
  });
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
    hasPeopleDisambiguation,
    nearNames.length
  );
  const plan = buildSearchFeedPlan(state, availability, { relatedOnly });
  const plates: FeedPlateItem[] = [
    ...companions.anecdotes.items.map((item) => ({
      ...item,
      type: "anecdote" as const,
    })),
    ...companions.proverbs.items.map((item) => ({
      ...item,
      type: "proverb" as const,
    })),
  ];
  const ficheEntries =
    results.length > 0 ? groupPeopleResults([...results]) : leads;
  const ficheRows = ficheEntries.map((entry, index): FeedFicheItem =>
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
  const displayName =
    state === "typo" && leads[0]
      ? leads[0].name
      : subjects[0]
        ? getLocalizedSearchResultName(subjects[0], language)
        : query;
  const verdict =
    state === "unknown"
      ? answerCopy.unknownName
      : state === "typo"
        ? copy.answer.typo(displayName)
        : hasPeopleDisambiguation
          ? copy.answer.shared(subjects.length)
          : state === "widened"
            ? subjects.length > 0
              ? copy.answer.widened
              : copy.answer.relatedOnly
            : copy.answer.exact;
  const summary =
    state === "unknown"
      ? answerCopy.unknownNameBody
      : state === "widened"
        ? copy.answer.widenedSummary
        : copy.answer.exactSummary;
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
  const exactSubjectIds = new Set(
    companions.shorts.items
      .filter(({ match }) => match.relation === "exact")
      .map(({ match }) => `${match.entityType}:${match.entityId}`)
  );
  const needsEmptyShort =
    state === "unknown" ||
    state === "widened" ||
    companions.shorts.items.length === 0 ||
    companions.subjects.some(
      ({ entityType, entityId }) =>
        !exactSubjectIds.has(`${entityType}:${entityId}`)
    );
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
            count: ficheRows.length,
          },
        ]
      : []),
  ];

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
            language={language}
            tone={state === "typo" || state === "unknown" ? "plain" : "answer"}
          />
        );
      case "appellations":
        return <AppellationsBlock forms={forms} language={language} />;
      case "shorts":
        return needsEmptyShort ? (
          <ShortsBlock
            items={companions.shorts.items}
            language={language}
            allHref={getLocalizedRoute(language, "discoveries")}
            wideningNote={
              companions.shorts.items.some(
                ({ match }) => match.relation !== "exact"
              )
                ? copy.wideningNote
                : undefined
            }
            emptySlot={{
              name: displayName,
              question: formatProductionNameQuestion(displayName, language),
              body: copy.emptyShort.body,
              action: copy.emptyShort.action,
            }}
            contributionTarget={contributionTarget}
          />
        ) : (
          <ShortsBlock
            items={companions.shorts.items}
            language={language}
            allHref={getLocalizedRoute(language, "discoveries")}
            wideningNote={
              companions.shorts.items.some(
                ({ match }) => match.relation !== "exact"
              )
                ? copy.wideningNote
                : undefined
            }
          />
        );
      case "origins": {
        return (
          <OriginsBlock
            title={answerCopy.origins}
            items={originItems}
            language={language}
            zone={zone}
          />
        );
      }
      case "peoples":
        return (
          <PeopleBlock
            title={copy.shelves.peoples}
            zone={zone}
            items={subjects.map((subject) => ({
              name: getLocalizedSearchResultName(subject, language),
              meta: copy.blocks.peopleMeta,
              description:
                plainSnippet(subject.snippet) ?? copy.blocks.peopleDescription,
              href: ficheHrefFor(subject, language),
            }))}
          />
        );
      case "shared-name":
        return (
          <ProseBlock
            blockId="shared-name"
            title={copy.shelves.sharedName}
            paragraphs={[copy.blocks.sharedNameBody]}
            language={language}
            zone={zone}
          />
        );
      case "tiles":
        return (
          <TilesBlock
            title={copy.blocks.relatedPeoplesTitle}
            zone={zone}
            items={tileRows}
          />
        );
      case "atlas-holds":
        return (
          <FactsBlock
            title={answerCopy.atlasHolds}
            subtitle={copy.blocks.atlasHoldsSummary}
            zone={zone}
            items={[
              { label: answerCopy.appellations, value: String(forms.length) },
              { label: copy.shelves.fiches, value: String(ficheRows.length) },
            ]}
          />
        );
      case "plates":
        return (
          <PlatesBlock
            items={plates}
            language={language}
            zone={zone}
            allHref={getLocalizedRoute(language, "discoveries")}
          />
        );
      case "quiz":
        return companions.quiz.item ? (
          <QuizBlock
            question={companions.quiz.item}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            onValidate={(option) =>
              setValidatedOption(option ?? selectedOption)
            }
            language={language}
            questionCountLabel={copy.blocks.questionCount}
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
            language={language}
            zone={zone}
          />
        ) : null;
      case "problem":
        return (
          <ProseBlock
            blockId="problem"
            title={answerCopy.problem}
            paragraphs={problemParagraphs}
            language={language}
            zone={zone}
          />
        );
      case "near-name":
        return (
          <ProseBlock
            blockId="near-name"
            title={copy.shelves.nearName}
            paragraphs={nearNames.map((result) =>
              copy.blocks.nearNameBody(result.name)
            )}
            language={language}
            zone={zone}
          />
        );
      case "fiches":
        return (
          <FichesBlock items={ficheRows} language={language} zone={zone} />
        );
      case "owed":
        return (
          <OwedBlock
            language={language}
            thin={plan.thin}
            silences={subjectSilences}
            conviction={{
              title: answerCopy.conviction,
              body: answerCopy.convictionBody,
            }}
            invitation={{
              title: answerCopy.invitation,
              body: answerCopy.invitationBody,
              action: answerCopy.invitationAction,
            }}
            contributionTarget={contributionTarget}
          />
        );
      case "further":
        return (
          <FurtherBlock
            language={language}
            links={[
              {
                href: getLocalizedRoute(language, "peoples"),
                label: answerCopy.browsePeoples,
              },
              {
                href: getLocalizedRoute(language, "families"),
                label: answerCopy.browseFamilies,
              },
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
  const first = (
    <>
      {firstIds.map((id) => (
        <Fragment key={id}>{renderBlock(id)}</Fragment>
      ))}
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
