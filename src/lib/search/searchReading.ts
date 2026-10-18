import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  loadSearchCompanions,
  loadSubjectNameHistories,
  searchWithLeads,
  type CorpusTransport,
  type SearchWithLeads,
} from "@/lib/afrikLoader";
import type { NextStepCard } from "@/lib/search/nameClosing";
import { selectNameSubject } from "@/lib/search/nameSubject";
import {
  relationSearchParams,
  type SearchRelation,
} from "@/lib/search/relationSearch";
import { compareByRelevance } from "@/lib/search/searchEnvelope";
import {
  classifySearchFeed,
  companionSubjectsForSearch,
  isSearchFeedSubject,
  type SearchFeedAnswerState,
} from "@/lib/search/searchFeedPlan";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/** Per-kind ceiling the route applies to each ranked query. */
const RESULTS_PER_SEARCH = 20;

/**
 * Everything the result page draws for one query, as plain data.
 *
 * The browser builds it from `?q=`; the address page of a name (REQ-200)
 * builds it on the server and hands it to the same component, which then
 * renders on its first render what the browser would have fetched. One
 * composition for both is what keeps the address « exactly as the `?q=`
 * reading »: a second one would drift.
 */
export interface SearchReading extends Omit<
  SearchWithLeads,
  "answered" | "presentation"
> {
  query: string;
  /** False when the API never answered; the page offers a retry. */
  answered: boolean;
  presentation?: SearchWithLeads["presentation"];
  /** Every entity answering to the name, none crowned (REQ-178). */
  subjects: SearchResult[];
  companions: SearchCompanionsData | null;
  nameHistories: Array<{ subject: SearchResult; nameHistory: NameHistory }>;
  feedState: SearchFeedAnswerState | null;
  /** Loaded after the feed in the browser; filled first on the server. */
  nextSteps: NextStepCard[];
}

export interface SearchReadingOptions {
  language: Language;
  relation?: SearchRelation | null;
  signal?: AbortSignal;
  transport?: CorpusTransport;
  /**
   * Called once the search has answered, before the feed's companions load:
   * the moment the page has always reported a committed search, so a feed
   * that then fails still counts the search it followed.
   */
  onAnswered?: (hits: SearchResult[], subjects: SearchResult[]) => void;
}

/**
 * The reading of one query: the search, the subjects it answers to, then the
 * feed's companions and name histories. The next names are left to the
 * caller, which the browser loads after the feed mounts.
 *
 * Rejects when the companions cannot be read, as the page always has: the
 * caller shows the outage rather than a feed with its blocks missing.
 */
// @req REQ-180
// @req REQ-200
export async function loadSearchReading(
  query: string,
  {
    language,
    relation = null,
    signal,
    transport,
    onAnswered,
  }: SearchReadingOptions
): Promise<SearchReading> {
  const searchEnvelope = await searchWithLeads(query, {
    limit: RESULTS_PER_SEARCH,
    lang: language,
    ...relationSearchParams(relation),
    signal,
    transport,
  });
  const reading: SearchReading = {
    query,
    ...searchEnvelope,
    nearNames: searchEnvelope.nearNames ?? [],
    nameAnswers: searchEnvelope.nameAnswers ?? [],
    wordAnswers: searchEnvelope.wordAnswers ?? [],
    nameSuggestions: searchEnvelope.nameSuggestions ?? [],
    subjects: [],
    companions: null,
    nameHistories: [],
    feedState: null,
    nextSteps: [],
  };
  if (!searchEnvelope.answered) return reading;
  // A newer query superseded this one while its search answered: nothing
  // more is read for it, not even its companions.
  signal?.throwIfAborted();

  // A relation-scoped search ("the peoples of the Krou family") carries no
  // name to match, so it resolves no subject and the feed reads it as a
  // browse (ETNI-1966).
  const ranked = [...searchEnvelope.results].sort(compareByRelevance);
  const subjects = selectNameSubject(ranked, query, language).filter(
    isSearchFeedSubject
  );
  onAnswered?.(searchEnvelope.results, subjects);

  // Loaded before the feed mounts: the feed picks its default lens once,
  // and opens on the timeline when a subject has a name history.
  const [companions, nameHistories] = await Promise.all([
    loadSearchCompanions(
      companionSubjectsForSearch(subjects, searchEnvelope.leads),
      language,
      signal,
      query,
      transport
    ),
    loadSubjectNameHistories(subjects, signal, transport),
  ]);

  return {
    ...reading,
    subjects,
    companions,
    nameHistories,
    feedState: classifySearchFeed({
      search: { results: searchEnvelope.results, leads: searchEnvelope.leads },
      companions,
      subjects,
      termSuggestions: reading.nameSuggestions,
      relation,
    }),
  };
}
