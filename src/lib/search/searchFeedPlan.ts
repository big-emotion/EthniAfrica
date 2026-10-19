import type {
  SearchCompanionSubject,
  SearchCompanionsData,
} from "@/api/v2/schemas/searchCompanions";
import type { SearchWithLeads } from "@/lib/afrikLoader";
import type { SearchRelation } from "@/lib/search/relationSearch";
import {
  ANSWER_BLOCKS,
  type FeedBlockId,
  type SearchResultState,
} from "@/lib/search/resultGrammar";
import type { SearchLead, SearchResult } from "@/types/afrik-frontend";

export type SearchFeedAnswerState = Extract<
  SearchResultState,
  "exact" | "widened" | "typo" | "unknown" | "recorded"
>;

export interface SearchFeedAvailability {
  /** At least one matched subject carries the six-block answer. */
  answers?: boolean;
  /** The misspelling choices, or the forms of a related-only page. */
  appellations?: boolean;
  fiches?: boolean;
  /**
   * A piece found by the reader's own word. Not the companions' shorts: they
   * carry recent pieces around any query, which say nothing about the name.
   */
  shorts?: boolean;
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
  if (state === "recorded") {
    return {
      first: ["verdict"],
      primary: availability.fiches ? ["fiches"] : [],
      closing: [],
    };
  }
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

  if (options.relatedOnly) {
    const first: FeedBlockId[] = ["lenses", "verdict"];
    if (availability.appellations) first.push("appellations");
    if (availability.shorts) first.push("shorts");

    return {
      first,
      primary: availability.fiches ? ["fiches"] : [],
      closing: [],
    };
  }

  // A misspelling opens on the filters, where every approved board draws
  // them: set after the choices, the pressed « Tout » read as the selected
  // option of a set holding the name (Main, brief 16, proposed: the filters
  // show once a misspelling finds a fiche other than its choices).
  const first: FeedBlockId[] = state === "typo" ? ["lenses"] : [];
  first.push("verdict");
  if (availability.appellations) first.push("appellations");
  if (state !== "typo") first.push("lenses");
  // A page that admits it does not know the name draws no empty shelf under
  // the confession (brief 12, part A, approved 2026-10-17). A page that asks
  // which name the reader meant draws none either: its pieces are about a
  // nearest name the reader has not chosen yet (brief 16, proposed).
  if ((state !== "unknown" && state !== "typo") || availability.shorts) {
    first.push("shorts");
  }

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
  /** The family or country the search is scoped to, when the reader kept one. */
  relation?: SearchRelation | null;
};

function companionRelations(data: SearchCompanionsData): string[] {
  return [
    ...data.shorts.items.map(({ match }) => match.relation),
    ...data.anecdotes.items.map(({ match }) => match.relation),
    ...data.proverbs.items.map(({ match }) => match.relation),
    ...(data.quiz.item ? [data.quiz.item.match.relation] : []),
  ];
}

// @req REQ-180
export function classifySearchFeed({
  search,
  companions,
  subjects,
  termSuggestions = [],
  relation,
}: SearchFeedClassificationInput): SearchFeedAnswerState {
  const foundByWord = companions.shorts.items.some(
    ({ match }) => match.relation === "word"
  );
  if (
    search.results.some((result) =>
      result.recordedIn?.some(({ fieldPath }) =>
        fieldPath.startsWith("content.")
      )
    )
  ) {
    return "recorded";
  }
  // Related fiches with a lead: the API offers a lead beside results only as
  // a spelling of the searched name (DEC-075), so the page asks which name
  // the reader meant before it lists them. A scoped search stays a relation
  // browse: the page titles it with the filter, which no spelling is about.
  if (subjects && subjects.length === 0 && search.results.length > 0) {
    return search.leads.length > 0 && !foundByWord && !relation
      ? "typo"
      : "widened";
  }
  if (search.results.length === 0) {
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

/**
 * A word fiche (REQ-196) is answered on the page like any subject, from the
 * nameHistory its row carries; the companion endpoint holds no word, so it is
 * a subject without being a companion subject.
 */
// @req REQ-180
export function isSearchFeedSubject(
  value: Pick<SearchResult, "type">
): boolean {
  return (
    value.type === "word" ||
    COMPANION_TYPES.has(value.type as SearchCompanionSubject["entityType"])
  );
}

function companionSubject(
  value: Pick<SearchResult | SearchLead, "type" | "id">
): SearchCompanionSubject | null {
  if (
    !COMPANION_TYPES.has(value.type as SearchCompanionSubject["entityType"])
  ) {
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
