/**
 * AFRIK Data Loader - API v2
 *
 * Fonctions de fetch vers l'API v2 avec gestion d'erreur et cache client.
 * Client-side data loader for AFRIK data.
 */

import type {
  SearchLead,
  SearchNearName,
  SearchResult,
  SearchEntityType,
  ApiError,
} from "@/types/afrik-frontend";
import {
  searchCompanionsDataSchema,
  type SearchCompanionSubject,
  type SearchCompanionsData,
} from "@/api/v2/schemas/searchCompanions";
import type { WordAnswer } from "@/lib/search/answer";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import type { Language } from "@/types/shared";

import {
  mapNameAnswers,
  mapNameSuggestions,
  type NameAnswer,
} from "@/lib/search/nameAnswer";
import {
  buildSearchParams,
  EMPTY_SEARCH_LENS_COUNTS,
  mapSearchCounts,
  mapSearchEnvelope,
  mapSearchLeads,
  mapSearchNearNames,
  mapWordAnswers,
  type SearchLensCounts,
  type SearchQueryOptions,
} from "@/lib/search/searchEnvelope";
import {
  mapSearchFeedPresentation,
  type SearchFeedPresentation,
} from "@/lib/search/searchFeedPresentation";
import { logger } from "@/lib/api/logger";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";

// ==========================================
// CONSTANTS
// ==========================================

const API_BASE = "/api/v2";

// ==========================================
// ERROR HANDLING
// ==========================================

/**
 * Crée une erreur API standardisée
 */
function createApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return { code, message, details };
}

/**
 * Gère les erreurs de fetch et retourne une erreur API
 */
async function handleFetchError(
  response: Response,
  context: string
): Promise<ApiError> {
  let message = `Failed to ${context}`;
  let details: Record<string, unknown> | undefined;

  try {
    const errorData = await response.json();
    if (errorData.error) {
      message = errorData.error.message || message;
      details = errorData.error.details;
    }
  } catch {
    // Ignore JSON parse errors
  }

  return createApiError(`HTTP_${response.status}`, message, details);
}

// ==========================================
// SEARCH
// ==========================================

export interface SearchOptions extends SearchQueryOptions {
  /**
   * Narrows the mixed envelope to one kind. It stays client-side because the
   * route ranks every kind and takes no entity filter — unlike `familyId` and
   * `countryId`, which the route resolves as relation scopes and which are
   * therefore no longer re-applied here.
   */
  type?: SearchEntityType;
  /** Cancels a committed search when a newer query supersedes it. */
  signal?: AbortSignal;
}

function fetchWithSignal(url: string, signal?: AbortSignal): Promise<Response> {
  return signal ? fetch(url, { signal }) : fetch(url);
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

// @req REQ-108
/**
 * The one browser path to `/api/v2/search` (ETNI-1415, AC2).
 *
 * Every module that searches the corpus calls this: the quick-search modal,
 * the home hero, the /recherche page and the compare picker. They used to
 * fetch the endpoint themselves and each re-derived the query shape, which is
 * how the same input could rank differently on three surfaces.
 */
export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const response = await fetchWithSignal(
      `${API_BASE}/search?${buildSearchParams(query, options)}`,
      options.signal
    );

    if (!response.ok) {
      const error = await handleFetchError(response, "search");
      logger.error("[search] Error", error);
      return [];
    }

    const results = mapSearchEnvelope(await response.json());

    return options.type
      ? results.filter((result) => result.type === options.type)
      : results;
  } catch (error) {
    if (isAbortError(error)) throw error;
    logger.error("[search] Exception", error);
    return [];
  }
}

export interface SearchWithLeads {
  results: SearchResult[];
  /** Near-miss leads (REQ-125) — non-empty only when the API's own total is 0. */
  leads: SearchLead[];
  /** Similar names qualified by the API for a non-empty search (REQ-180). */
  nearNames: SearchNearName[];
  /** Reviewed answers for the searched term; empty when none was reviewed. */
  nameAnswers?: NameAnswer[];
  /** The answer to a published word (REQ-184); it needs no fiche, so it may arrive with no result. */
  wordAnswers?: WordAnswer[];
  /** Reviewed terms a near spelling may have meant, offered to the reader as choices. */
  nameSuggestions?: string[];
  /** Per-type match counts (REQ-124) for the named-lens chips. */
  counts: SearchLensCounts;
  /** Reviewed, serializable feed copy when the response provides one. */
  presentation?: SearchFeedPresentation;
  /**
   * Whether the API answered at all.
   *
   * Every failure below degrades to the same empty envelope, which is right
   * for rendering — a reader is shown "no result" either way rather than a
   * stack trace. It is wrong for anything counting those zeroes: an outage
   * and a query the corpus cannot answer are not the same fact, and folding
   * them together files every failed request under the corpus's own gaps.
   */
  answered: boolean;
}

// @req REQ-125
/**
 * Same single browser path as `search` (ETNI-1415, AC2), additionally carrying
 * zero-result leads and the qualified similar names of a non-empty search. A
 * distinct function rather than an added parameter keeps every existing
 * `search()` caller's `SearchResult[]` return type untouched; it takes the same
 * `SearchOptions`, so a surface that needs the projections and server-side
 * scopes reaches the corpus here instead of fetching the endpoint itself.
 */
export async function searchWithLeads(
  query: string,
  options: SearchOptions = {}
): Promise<SearchWithLeads> {
  try {
    const response = await fetchWithSignal(
      `${API_BASE}/search?${buildSearchParams(query, options)}`,
      options.signal
    );

    if (!response.ok) {
      const error = await handleFetchError(response, "search");
      logger.error("[searchWithLeads] Error", error);
      return {
        results: [],
        leads: [],
        nearNames: [],
        nameAnswers: [],
        counts: { ...EMPTY_SEARCH_LENS_COUNTS },
        answered: false,
      };
    }

    const envelope = await response.json();
    const results = mapSearchEnvelope(envelope);
    const leads = mapSearchLeads(envelope);
    const nearNames = mapSearchNearNames(envelope);
    const counts = mapSearchCounts(envelope);
    const presentation = mapSearchFeedPresentation(envelope);

    return {
      results: options.type
        ? results.filter((result) => result.type === options.type)
        : results,
      leads,
      nearNames,
      nameAnswers: mapNameAnswers(envelope),
      wordAnswers: mapWordAnswers(envelope),
      nameSuggestions: mapNameSuggestions(envelope),
      counts,
      presentation,
      answered: true,
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    logger.error("[searchWithLeads] Exception", error);
    return {
      results: [],
      leads: [],
      nearNames: [],
      nameAnswers: [],
      counts: { ...EMPTY_SEARCH_LENS_COUNTS },
      answered: false,
    };
  }
}

// @req REQ-180
export async function loadSearchCompanions(
  subjects: readonly SearchCompanionSubject[],
  language: Language,
  signal?: AbortSignal,
  word?: string
): Promise<SearchCompanionsData> {
  const params = new URLSearchParams();
  if (word?.trim()) params.set("word", word.trim());
  if (subjects.length > 0) {
    params.set(
      "subjects",
      subjects
        .map(({ entityType, entityId }) => `${entityType}:${entityId}`)
        .join(",")
    );
  }
  params.set("lang", language);

  const response = await fetchWithSignal(
    `${API_BASE}/search/companions?${params}`,
    signal
  );
  if (!response.ok) {
    throw await handleFetchError(response, "load search companions");
  }

  const envelope = (await response.json()) as { data?: unknown };
  return searchCompanionsDataSchema.parse(envelope.data);
}

// ==========================================
// NAME HISTORY (the search timeline, REQ-198)
// ==========================================

/** Where each kind of subject serves its fiche, `nameHistory` included. */
const FICHE_ENDPOINTS: Partial<Record<SearchEntityType, string>> = {
  people: "peoples",
  country: "countries",
  language: "languages",
  languageFamily: "language-families",
  patronyme: "patronymes",
};

async function loadNameHistory(
  subject: SearchResult,
  signal?: AbortSignal
): Promise<{ subject: SearchResult; nameHistory: NameHistory } | null> {
  const endpoint = FICHE_ENDPOINTS[subject.type];
  if (!endpoint) return null;
  try {
    const response = await fetchWithSignal(
      `${API_BASE}/${endpoint}/${encodeURIComponent(subject.id)}`,
      signal
    );
    if (!response.ok) return null;
    const envelope = (await response.json()) as {
      data?: { nameHistory?: unknown };
    };
    if (envelope.data?.nameHistory === undefined) return null;
    const parsed = parseNameHistory(envelope.data.nameHistory);
    return parsed.success ? { subject, nameHistory: parsed.data! } : null;
  } catch (error) {
    if (isAbortError(error)) throw error;
    logger.warn("afrikLoader.loadNameHistory failed", {
      type: subject.type,
      id: subject.id,
    });
    return null;
  }
}

/**
 * The name history of every searched subject that has one, in the subjects'
 * order. A subject without one, or whose fiche fails to load, is left out
 * rather than failing the search: the page then opens on the answer.
 */
// @req REQ-198
export async function loadSubjectNameHistories(
  subjects: readonly SearchResult[],
  signal?: AbortSignal
): Promise<Array<{ subject: SearchResult; nameHistory: NameHistory }>> {
  const histories = await Promise.all(
    subjects.map((subject) => loadNameHistory(subject, signal))
  );
  return histories.filter((entry) => entry !== null);
}
