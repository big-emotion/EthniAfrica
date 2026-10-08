/**
 * Search Handler — API handlers for the /v2/search endpoint.
 *
 * ftsSearchHandler: ETNI-38 FTS handler returning the Module #0 envelope.
 */

import { findWordAnswer } from "@/lib/productions/wordAnswer";
import type { WordAnswer } from "@/lib/search/answer";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import { findNameAnswers, suggestNameTerms } from "@/lib/search/nameAnswers";
import { ftsSearch } from "../services/searchService";
import { createApiResponse } from "../utils/response";
import type {
  FtsSearchParams,
  FtsSearchResponse,
  RankedSearchHit,
  SearchNearName,
} from "@/types/afrik";
import type { ApiEnvelope } from "../utils/response";

export interface FtsSearchData {
  peoples: object[];
  countries: object[];
  families: object[];
  persons: object[];
  patronymes: object[];
  quizzes: object[];
  languages: object[];
  /**
   * Every hit in the selected stream, ordered on `normalizedScore` (migration
   * 069). The grouped arrays stay beside it because a facet asks about one
   * kind. Main search excludes quizzes; the quiz lens contains only quizzes.
   */
  results: RankedSearchHit[];
  /**
   * Corpus-wide match counts. `total` used to be the size of the returned
   * page, which made it useless for paging; the ranking functions of
   * migration 044 count the whole match set.
   */
  peoplesTotal: number;
  countriesTotal: number;
  familiesTotal: number;
  personsTotal: number;
  patronymesTotal: number;
  quizzesTotal: number;
  languagesTotal: number;
  total: number;
  /** Near-miss leads (REQ-125), populated only when `total` is 0. */
  leads: object[];
  /** Qualified similar names (REQ-180), populated only for a non-empty search. */
  nearNames: SearchNearName[];
  /**
   * Reviewed answers to « where does this name come from? » for the searched
   * term. Resolved from the term alone, so a search with no hit can still be
   * answered; empty for a name nobody has reviewed.
   */
  nameAnswers: NameAnswer[];
  /**
   * The answer to a published word (REQ-184), read from the production
   * registry. It rides on the envelope and not on a row because the word
   * matches no fiche: « pharaon » can come back with no result at all.
   */
  wordAnswers: WordAnswer[];
  /**
   * Reviewed terms a near spelling may have meant, offered only when the search
   * found nothing. Never applied to the query: the reader chooses.
   */
  nameSuggestions: string[];
  /** The cleaned query that found the results, when it differs from `q`. */
  matchedQuery?: string;
  /** The names a multi-name query was split into: the results are a widening. */
  widenedFrom?: string[];
}

// @req REQ-002
export async function ftsSearchHandler(
  params: FtsSearchParams
): Promise<ApiEnvelope<FtsSearchData>> {
  const result = await ftsSearch(params);
  return createApiResponse<FtsSearchData>(shapeSearchData(result, params));
}

/** Keep the public main and quiz streams isolated even if an upstream layer regresses. */
function shapeSearchData(
  result: FtsSearchResponse,
  { lens, q }: Pick<FtsSearchParams, "lens" | "q">
): FtsSearchData {
  const quizzesTotal = result.quizzesTotal ?? 0;

  if (lens === "quiz") {
    return {
      peoples: [],
      countries: [],
      families: [],
      persons: [],
      patronymes: [],
      quizzes: (result.quizzes ?? []) as object[],
      languages: [],
      results: (result.results ?? []).filter((hit) => hit.kind === "quiz"),
      peoplesTotal: 0,
      countriesTotal: 0,
      familiesTotal: 0,
      personsTotal: 0,
      patronymesTotal: 0,
      quizzesTotal,
      languagesTotal: 0,
      total: quizzesTotal,
      leads: [],
      nearNames: [],
      nameAnswers: [],
      wordAnswers: [],
      nameSuggestions: [],
    };
  }

  const peoplesTotal = result.peoplesTotal ?? 0;
  const countriesTotal = result.countriesTotal ?? 0;
  const familiesTotal = result.familiesTotal ?? 0;
  const personsTotal = result.personsTotal ?? 0;
  const patronymesTotal = result.patronymesTotal ?? 0;
  const languagesTotal = result.languagesTotal ?? 0;
  const total =
    peoplesTotal +
    countriesTotal +
    familiesTotal +
    personsTotal +
    patronymesTotal +
    languagesTotal;
  const language = "fr";

  return {
    peoples: (result.peoples ?? []) as object[],
    countries: (result.countries ?? []) as object[],
    families: (result.families ?? []) as object[],
    persons: (result.persons ?? []) as object[],
    patronymes: (result.patronymes ?? []) as object[],
    quizzes: [],
    languages: (result.languages ?? []) as object[],
    // Preserve the database order while excluding the other stream.
    results: (result.results ?? []).filter((hit) => hit.kind !== "quiz"),
    peoplesTotal,
    countriesTotal,
    familiesTotal,
    personsTotal,
    patronymesTotal,
    quizzesTotal: 0,
    languagesTotal,
    total,
    leads: (result.leads ?? []) as object[],
    nearNames: result.nearNames ?? [],
    nameAnswers: findNameAnswers(q, language),
    wordAnswers: findWordAnswer(q, language),
    nameSuggestions: total === 0 ? suggestNameTerms(q, language) : [],
    ...(result.matchedQuery && { matchedQuery: result.matchedQuery }),
    ...(result.widenedFrom && { widenedFrom: result.widenedFrom }),
  };
}
