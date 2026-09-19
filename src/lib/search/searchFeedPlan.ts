import type {
  SearchCompanionSubject,
  SearchCompanionsData,
} from "@/api/v2/schemas/searchCompanions";
import type { SearchWithLeads } from "@/lib/afrikLoader";
import {
  FEED_BLOCKS,
  type FeedBlockId,
  type SearchResultState,
} from "@/lib/search/resultGrammar";
import type { SearchLead, SearchResult } from "@/types/afrik-frontend";

export type SearchFeedAnswerState = Extract<
  SearchResultState,
  "exact" | "widened" | "typo" | "unknown"
>;

export interface SearchFeedAvailability {
  appellations?: boolean;
  origins?: boolean;
  peoples?: boolean;
  sharedName?: boolean;
  tiles?: boolean;
  atlasHolds?: boolean;
  plates?: boolean;
  quiz?: boolean;
  images?: boolean;
  problem?: boolean;
  nearName?: boolean;
  fiches?: boolean;
}

export interface SearchFeedPlan {
  thin: boolean;
  mobile: FeedBlockId[];
  desktop: {
    first: FeedBlockId[];
    primary: FeedBlockId[];
    secondary: FeedBlockId[];
    closing: FeedBlockId[];
  };
}

export interface SearchFeedPlanOptions {
  /** Related search hits exist, but no supported entity answers to the name. */
  relatedOnly?: boolean;
}

const AVAILABILITY_KEY: Partial<
  Record<FeedBlockId, keyof SearchFeedAvailability>
> = {
  appellations: "appellations",
  origins: "origins",
  peoples: "peoples",
  "shared-name": "sharedName",
  tiles: "tiles",
  "atlas-holds": "atlasHolds",
  plates: "plates",
  quiz: "quiz",
  images: "images",
  problem: "problem",
  "near-name": "nearName",
  fiches: "fiches",
};

const PRIMARY_BLOCKS = new Set<FeedBlockId>([
  "origins",
  "peoples",
  "plates",
  "fiches",
]);

function isAvailable(
  id: FeedBlockId,
  availability: SearchFeedAvailability
): boolean {
  const key = AVAILABILITY_KEY[id];
  return key ? availability[key] === true : false;
}

// @req REQ-180
export function buildSearchFeedPlan(
  state: SearchFeedAnswerState,
  availability: SearchFeedAvailability,
  options: SearchFeedPlanOptions = {}
): SearchFeedPlan {
  const first: FeedBlockId[] = ["lenses", "verdict"];
  if (availability.appellations) first.push("appellations");
  first.push("shorts");

  const movement = FEED_BLOCKS.filter(
    (id) =>
      ![
        "lenses",
        "verdict",
        "appellations",
        "shorts",
        "owed",
        "further",
      ].includes(id) && isAvailable(id, availability)
  );
  const closing: FeedBlockId[] = [];
  if (
    !options.relatedOnly &&
    (state === "exact" || state === "widened" || state === "unknown")
  ) {
    closing.push("owed");
  }
  if (state === "typo" || state === "unknown") closing.push("further");

  const thin = state !== "exact";
  const primary = thin
    ? movement
    : movement.filter((id) => PRIMARY_BLOCKS.has(id));
  const secondary = thin
    ? []
    : movement.filter((id) => !PRIMARY_BLOCKS.has(id));

  return {
    thin,
    mobile: [...first, ...movement, ...closing],
    desktop: { first, primary, secondary, closing },
  };
}

type SearchFeedClassificationInput = {
  search: Pick<SearchWithLeads, "results" | "leads">;
  companions: SearchCompanionsData;
  /** Exact name subjects, when the caller has already resolved them. */
  subjects?: readonly SearchResult[];
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
}: SearchFeedClassificationInput): SearchFeedAnswerState {
  if (subjects && subjects.length === 0 && search.results.length > 0) {
    return "widened";
  }
  if (search.results.length === 0) {
    return search.leads.length > 0 ? "typo" : "unknown";
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
