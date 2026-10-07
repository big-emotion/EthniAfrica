import type {
  SearchCompanionSubject,
  SearchCompanionsData,
} from "@/api/v2/schemas/searchCompanions";
import type { SearchWithLeads } from "@/lib/afrikLoader";
import {
  ANSWER_BLOCKS,
  type FeedBlockId,
  type SearchResultState,
} from "@/lib/search/resultGrammar";
import type { SearchLead, SearchResult } from "@/types/afrik-frontend";

export type SearchFeedAnswerState = Extract<
  SearchResultState,
  "exact" | "widened" | "typo" | "unknown"
>;

export interface SearchFeedAvailability {
  /** At least one matched subject carries the six-block answer. */
  answers?: boolean;
  /** The misspelling choices, or the forms of a related-only page. */
  appellations?: boolean;
  fiches?: boolean;
}

/** The blocks « Tout » draws, by the zone of the page they belong to. */
export interface SearchFeedPlan {
  first: FeedBlockId[];
  primary: FeedBlockId[];
  closing: FeedBlockId[];
}

export interface SearchFeedPlanOptions {
  /** Related search hits exist, but no supported entity answers to the name. */
  relatedOnly?: boolean;
  /** A published word answers the query; it has an answer and no fiche. */
  wordPage?: boolean;
}

/**
 * What « Tout » holds. When something can answer the name, the answer is the
 * page and nothing stacks under it: the shelves (shorts, stories, images,
 * games, fiches) are reached through their filters. When nothing can — an
 * unknown name, a misspelling, a relation browse — the page opens with a
 * verdict, because those are the pages whose job is to say so.
 */
// @req REQ-178
export function buildSearchFeedPlan(
  state: SearchFeedAnswerState,
  availability: SearchFeedAvailability,
  options: SearchFeedPlanOptions = {}
): SearchFeedPlan {
  if (options.wordPage) {
    return {
      first: ["lenses"],
      primary: [...ANSWER_BLOCKS],
      closing: ["owed"],
    };
  }
  if (availability.answers) {
    return {
      first: ["lenses"],
      primary: [...ANSWER_BLOCKS, "fiche-link"],
      closing: ["owed"],
    };
  }

  const first: FeedBlockId[] = ["verdict"];
  if (availability.appellations) first.push("appellations");
  first.push("lenses", "shorts");

  const closing: FeedBlockId[] = [];
  if (
    !options.relatedOnly &&
    (state === "exact" || state === "widened" || state === "unknown")
  ) {
    closing.push("owed");
  }
  if (state === "typo" || state === "unknown") closing.push("further");

  return {
    first,
    primary: availability.fiches ? ["fiches"] : [],
    closing,
  };
}

type SearchFeedClassificationInput = {
  search: Pick<SearchWithLeads, "results" | "leads">;
  companions: SearchCompanionsData;
  /** Exact name subjects, when the caller has already resolved them. */
  subjects?: readonly SearchResult[];
  /** Reviewed terms a near spelling may have meant; they count as suggestions. */
  termSuggestions?: readonly string[];
};

function companionRelations(data: SearchCompanionsData): string[] {
  return [
    ...data.shorts.items.map(({ match }) => match.relation),
    ...data.anecdotes.items.map(({ match }) => match.relation),
    ...data.proverbs.items.map(({ match }) => match.relation),
    ...data.images.items.map(({ match }) => match.relation),
    ...(data.quiz.item ? [data.quiz.item.match.relation] : []),
  ];
}

// @req REQ-180
export function classifySearchFeed({
  search,
  companions,
  subjects,
  termSuggestions = [],
}: SearchFeedClassificationInput): SearchFeedAnswerState {
  if (subjects && subjects.length === 0 && search.results.length > 0) {
    return "widened";
  }
  if (search.results.length === 0) {
    const foundByWord = companions.shorts.items.some(
      ({ match }) => match.relation === "word"
    );
    const hasSuggestion = search.leads.length + termSuggestions.length > 0;
    return hasSuggestion && !foundByWord ? "typo" : "unknown";
  }

  const relations = companionRelations(companions);
  return relations.length > 0 &&
    relations.every((relation) => relation !== "exact")
    ? "widened"
    : "exact";
}

const COMPANION_TYPES = new Set<SearchCompanionSubject["entityType"]>([
  "people",
  "country",
  "languageFamily",
  "language",
  "patronyme",
]);

// @req REQ-180
export function isSearchFeedSubject(
  value: Pick<SearchResult, "type">
): boolean {
  return COMPANION_TYPES.has(
    value.type as SearchCompanionSubject["entityType"]
  );
}

function companionSubject(
  value: Pick<SearchResult | SearchLead, "type" | "id">
): SearchCompanionSubject | null {
  if (!isSearchFeedSubject(value)) {
    return null;
  }
  return {
    entityType: value.type as SearchCompanionSubject["entityType"],
    entityId: value.id,
  };
}

// @req REQ-180
export function companionSubjectsForSearch(
  results: readonly SearchResult[],
  leads: readonly SearchLead[]
): SearchCompanionSubject[] {
  const candidates = results.length > 0 ? results : leads.slice(0, 1);
  const unique = new Map<string, SearchCompanionSubject>();
  for (const candidate of candidates) {
    const subject = companionSubject(candidate);
    if (!subject) continue;
    unique.set(`${subject.entityType}:${subject.entityId}`, subject);
  }
  return [...unique.values()];
}
