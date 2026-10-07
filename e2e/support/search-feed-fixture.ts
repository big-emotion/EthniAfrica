import type { Page, Route } from "@playwright/test";

import type { SearchCompanionsData } from "../../src/api/v2/schemas/searchCompanions";
import {
  FEED_CASES,
  type FeedCaseFixture,
} from "../../src/lib/search/__fixtures__/feedCases";
import { LOCALE } from "./locale";
import { getLocalizedRoute } from "../../src/lib/routing";
import type {
  SearchLead,
  SearchNearName,
  SearchResult,
} from "../../src/types/afrik-frontend";

import {
  ANSWER_FIXTURES,
  type AnswerFixture,
} from "../../src/lib/search/__fixtures__/answerFixtures";
import type { SearchAnswer } from "../../src/lib/search/answer";
import { ANSWER_LABELS } from "../../src/lib/search/__fixtures__/answerLabels";
import { routeCommittedSearchFeedAssets } from "./search-feed-browser";

const API_SEARCH_PATH = "/api/v2/search";

function leadKind(type: SearchLead["type"]): "people" | "country" | "family" {
  return type === "languageFamily" ? "family" : type;
}

function rawLead(lead: SearchLead | SearchNearName) {
  return { ...lead, kind: leadKind(lead.type), type: undefined };
}

function commonRow(result: SearchResult) {
  return {
    id: result.id,
    naming: result.naming,
    relevance: result.relevance,
    exactMatch: result.exactMatch === true,
    snippet: result.snippet ?? null,
  };
}

function rawResult(result: SearchResult): Record<string, unknown> {
  const common = commonRow(result);
  switch (result.type) {
    case "people":
      return {
        ...common,
        nameMain: result.name,
        languageFamilyId: result.languageFamilyId,
        languageFamilyName: result.languageFamilyName,
        languageFamilyNameEn: result.languageFamilyNameEn,
        currentCountries: result.countryIds,
        classificationStatus: result.classificationStatus,
        confidence: result.confidence,
        content: {
          appellations: {
            selfAppellation: result.autonym,
            exonyms: result.exonyms,
            peopleGroupId: result.peopleGroupId,
            peopleGroupLabel: result.peopleGroupLabel,
          },
        },
      };
    case "country":
      return {
        ...common,
        nameFr: result.name,
        nameEn: result.nameEn,
        content: {
          majorPeoples: result.associatedPeoples?.map(({ id, name }) => ({
            peopleId: id,
            name,
          })),
        },
      };
    case "languageFamily":
      return {
        ...common,
        nameFr: result.name,
        nameEn: result.nameEn,
        content: {
          associatedPeoples: result.associatedPeoples?.map(({ id, name }) => ({
            peopleId: id,
            name,
          })),
        },
      };
    case "language":
      return {
        ...common,
        name: result.name,
        nameEn: result.nameEn,
        familyId: result.languageFamilyId,
        familyName: result.languageFamilyName,
        familyNameEn: result.languageFamilyNameEn,
        content: { peoples: [] },
      };
    case "patronyme":
      return {
        ...common,
        nameMain: result.name,
        nameSystem: result.nameSystem,
        casteOrSocialFunction: result.casteOrSocialFunction,
        associatedPeoples: result.associatedPeoples,
        content: {
          peoples: (result.associatedPeopleIds ?? []).map((peopleId) => ({
            peopleId,
          })),
          countries: (result.attestedCountryIds ?? []).map((countryId) => ({
            countryId,
            status: "attested",
          })),
        },
      };
    case "person":
      return {
        ...common,
        fullName: result.name,
        roleCategory: result.roleCategory,
        peopleLinks: result.peopleLinks,
      };
  }
}

export function searchEnvelopeForFixture(fixture: FeedCaseFixture) {
  const grouped = {
    peoples: [] as Record<string, unknown>[],
    countries: [] as Record<string, unknown>[],
    families: [] as Record<string, unknown>[],
    persons: [] as Record<string, unknown>[],
    patronymes: [] as Record<string, unknown>[],
    languages: [] as Record<string, unknown>[],
  };

  for (const result of fixture.production.search.results) {
    const row = rawResult(result);
    if (result.type === "people") grouped.peoples.push(row);
    else if (result.type === "country") grouped.countries.push(row);
    else if (result.type === "languageFamily") grouped.families.push(row);
    else if (result.type === "person") grouped.persons.push(row);
    else if (result.type === "patronyme") grouped.patronymes.push(row);
    else grouped.languages.push(row);
  }

  const counts = fixture.production.search.counts;
  const illustratedTotal = fixture.board.lenses.fiches ?? counts.all;
  const totals = {
    people: counts.people,
    country: counts.country,
    languageFamily: counts.languageFamily,
    language: counts.language,
    person: counts.person,
    patronyme: counts.patronyme,
  };
  const illustratedKind =
    fixture.production.search.results[0]?.type ??
    fixture.production.search.leads[0]?.type;
  if (illustratedKind && illustratedTotal > counts.all) {
    totals[illustratedKind] += illustratedTotal - counts.all;
  }
  return {
    data: {
      ...grouped,
      feedPresentation: fixture.board.presentation,
      quizzes: [],
      results: [],
      peoplesTotal: totals.people,
      countriesTotal: totals.country,
      familiesTotal: totals.languageFamily,
      personsTotal: totals.person,
      patronymesTotal: totals.patronyme,
      quizzesTotal: 0,
      languagesTotal: totals.language,
      total: illustratedTotal,
      leads: fixture.production.search.leads.map(rawLead),
      nearNames: fixture.production.search.nearNames.map(rawLead),
    },
  };
}

function fixtureForRequest(route: Route): FeedCaseFixture | undefined {
  const query = new URL(route.request().url()).searchParams.get("q") ?? "";
  return FEED_CASES.find(
    (fixture) => fixture.query.toLocaleLowerCase() === query.toLocaleLowerCase()
  );
}

// @req REQ-180
export async function routeSearchFeedFixtures(page: Page): Promise<void> {
  let activeFixture: FeedCaseFixture | undefined;
  await routeCommittedSearchFeedAssets(page);
  await page.route("**/api/v2/search**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === `${API_SEARCH_PATH}/companions`) {
      if (!activeFixture) {
        await route.fulfill({
          status: 409,
          json: { error: "No active fixture" },
        });
        return;
      }
      await route.fulfill({
        status: 200,
        json: { data: activeFixture.production.companions },
      });
      return;
    }
    if (pathname !== API_SEARCH_PATH) {
      await route.fallback();
      return;
    }

    activeFixture = fixtureForRequest(route);
    if (!activeFixture) {
      await route.fulfill({ status: 404, json: { error: "Unknown fixture" } });
      return;
    }
    await route.fulfill({
      status: 200,
      json: searchEnvelopeForFixture(activeFixture),
    });
  });
}

export function searchFeedUrl(fixture: FeedCaseFixture): string {
  return `${getLocalizedRoute(LOCALE, "search")}?q=${encodeURIComponent(fixture.query)}`;
}

/** Every lens empty: the answer fixtures exercise the answer, not the shelves. */
const EMPTY_COMPANIONS: SearchCompanionsData = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  images: { count: 0, items: [] },
  quiz: { count: 0, item: null },
};

/**
 * The naming the API sends with a row. The page decides which entities answer
 * to a typed name from the forms a row records, so a row that only carried
 * `answer` would never be a subject: « peul » reaches « Fulɓe » through its
 * forms. The typed query is among them because the case is defined by it.
 */
function namingFor(answer: SearchAnswer, query: string) {
  const forms = [query, ...answer.names.map(({ form }) => form)].map(
    (form) => ({ form })
  );
  return {
    forms,
    eras: [],
    presentation: { forms: [], eras: [], disagreements: [], evidence: [] },
  };
}

/**
 * The pieces behind a case. The published word has its own production, found
 * by the very word typed (relation `word`); every other case has none, so its
 * page offers only « Tout » and the fiches.
 */
function companionsForAnswer(
  fixture: AnswerFixture | undefined
): SearchCompanionsData {
  if (!fixture?.wordAnswers) return EMPTY_COMPANIONS;
  const [template] = FEED_CASES[0].production.companions.shorts.items;
  const piece = {
    ...template,
    name: fixture.wordAnswers[0].title,
    match: { relation: "word" as const, word: fixture.query },
  };
  return { ...EMPTY_COMPANIONS, shorts: { count: 1, items: [piece] } };
}

function answerRow(answer: SearchAnswer, index: number, query: string) {
  const common = {
    id: `fixture-answer-${answer.kind}-${index}`,
    answer,
    naming: namingFor(answer, query),
    relevance: 1,
    exactMatch: true,
    snippet: null,
  };
  switch (answer.kind) {
    case "country":
      return {
        bucket: "countries",
        row: {
          ...common,
          nameFr: answer.title,
          nameEn: answer.title,
          // The fiche's own list of peoples, by name: the page names a
          // country's shares from it and never prints an identifier.
          content: {
            majorPeoples: (answer.where?.rows ?? []).flatMap((row) =>
              "peopleId" in row && ANSWER_LABELS[row.peopleId]
                ? [
                    {
                      peopleId: row.peopleId,
                      name: ANSWER_LABELS[row.peopleId],
                    },
                  ]
                : []
            ),
          },
        },
      };
    case "language":
      return {
        bucket: "languages",
        row: { ...common, name: answer.title, content: { peoples: [] } },
      };
    case "languageFamily":
      return {
        bucket: "families",
        row: { ...common, nameFr: answer.title, nameEn: answer.title },
      };
    case "patronyme":
      return {
        bucket: "patronymes",
        row: { ...common, nameMain: answer.title, content: {} },
      };
    default:
      return {
        bucket: "peoples",
        row: {
          ...common,
          nameMain: answer.title,
          content: { appellations: { selfAppellation: answer.title } },
        },
      };
  }
}

/**
 * The envelope the answer page is specified against: each answer rides on its
 * row as `answer`, a published word rides on the envelope as `wordAnswers`
 * (a word may match no row at all).
 */
export function searchEnvelopeForAnswerFixture(fixture: AnswerFixture) {
  const grouped: Record<string, Record<string, unknown>[]> = {
    peoples: [],
    countries: [],
    families: [],
    persons: [],
    patronymes: [],
    languages: [],
  };
  fixture.answers.forEach((answer, index) => {
    const { bucket, row } = answerRow(answer, index, fixture.query);
    grouped[bucket].push(row);
  });
  // The people the family's name is also filed under points at the family by
  // the row's own `languageFamilyId`, as the API's people rows do.
  const familyRowId = grouped.families[0]?.id;
  (fixture.peoplesOfFamily ?? []).forEach((answer, index) => {
    const { bucket, row } = answerRow(
      answer,
      fixture.answers.length + index,
      fixture.query
    );
    grouped[bucket].push({ ...row, languageFamilyId: familyRowId });
  });
  return {
    data: {
      ...grouped,
      ...(fixture.wordAnswers ? { wordAnswers: fixture.wordAnswers } : {}),
      quizzes: [],
      results: [],
      peoplesTotal: grouped.peoples.length,
      countriesTotal: grouped.countries.length,
      familiesTotal: grouped.families.length,
      personsTotal: 0,
      patronymesTotal: grouped.patronymes.length,
      quizzesTotal: 0,
      languagesTotal: grouped.languages.length,
      total: fixture.answers.length,
      leads: [],
      nearNames: [],
    },
  };
}

// @req REQ-178
export async function routeSearchAnswerFixtures(page: Page): Promise<void> {
  let activeFixture: AnswerFixture | undefined;
  await page.route("**/api/v2/search**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === `${API_SEARCH_PATH}/companions`) {
      await route.fulfill({
        status: 200,
        json: { data: companionsForAnswer(activeFixture) },
      });
      return;
    }
    if (url.pathname !== API_SEARCH_PATH) {
      await route.fallback();
      return;
    }
    const query = (url.searchParams.get("q") ?? "").toLocaleLowerCase();
    const fixture = Object.values(ANSWER_FIXTURES).find(
      (candidate) => candidate.query.toLocaleLowerCase() === query
    );
    if (!fixture) {
      await route.fulfill({ status: 404, json: { error: "Unknown fixture" } });
      return;
    }
    activeFixture = fixture;
    await route.fulfill({
      status: 200,
      json: searchEnvelopeForAnswerFixture(fixture),
    });
  });
}

export function searchAnswerUrl(fixture: AnswerFixture): string {
  return `${getLocalizedRoute(LOCALE, "search")}?q=${encodeURIComponent(fixture.query)}`;
}
