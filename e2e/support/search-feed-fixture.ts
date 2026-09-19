import type { Page, Route } from "@playwright/test";

import {
  FEED_CASES,
  type FeedCaseFixture,
} from "../../src/lib/search/__fixtures__/feedCases";
import type {
  SearchLead,
  SearchNearName,
  SearchResult,
} from "../../src/types/afrik-frontend";

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
  return `/fr/atlas/recherche?q=${encodeURIComponent(fixture.query)}`;
}
