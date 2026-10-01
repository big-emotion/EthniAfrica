/**
 * The search as the model of `corpusNameModel` sees it, before and after the
 * tolerance work of REQ-178. "Before" asks the corpus for the text as typed and
 * offers neighbours of a people's filed name only (migration 084); "after"
 * cleans the query, tries its candidates, widens per name, and offers
 * neighbours over every recorded form (migration 094).
 *
 * Outcomes follow the page's states: an entry that answers to the name is a
 * `hit`; entries that only mention it, or answer to one of several names, are
 * `widened` — results without a subject.
 */
import {
  nameHits,
  neighbours,
  proseHits,
  type ModelEntity,
} from "@/lib/search/__fixtures__/corpusNameModel";
import type { ReaderOutcome } from "@/lib/search/__fixtures__/readerQueries";
import { findNameAnswers } from "@/lib/search/nameAnswers";
import { normaliseSearchQuery } from "@/lib/search/queryNormalisation";

export interface ModelledSearch {
  outcome: ReaderOutcome;
  /** Filed names of what was reached, for the report. */
  reached: string[];
  /** The cleaned query that found the hits, when it is not what was typed. */
  via?: string;
}

const names = (entities: ModelEntity[]) =>
  entities.slice(0, 5).map((entity) => entity.filedName);

// @req REQ-178
export function searchBefore(typed: string): ModelledSearch {
  const text = typed.trim();
  const named = nameHits(text);
  if (named.length > 0) return { outcome: "hit", reached: names(named) };
  const mentioned = proseHits(text);
  if (mentioned.length > 0) {
    return { outcome: "widened", reached: names(mentioned) };
  }
  const near = neighbours(text, { formsOfAPeople: false });
  return near.length > 0
    ? { outcome: "neighbour", reached: names(near) }
    : { outcome: "none", reached: [] };
}

// @req REQ-178
export function searchAfter(typed: string): ModelledSearch & {
  reviewedAnswer: boolean;
} {
  const reviewedAnswer = findNameAnswers(typed).length > 0;
  const { candidates, tokens } = normaliseSearchQuery(typed);
  const via = (candidate: string) =>
    candidate !== typed.trim() ? { via: candidate } : {};

  // The service tries a candidate whole — names and prose — before the next.
  for (const candidate of candidates) {
    const named = nameHits(candidate);
    if (named.length > 0) {
      return {
        outcome: "hit",
        reached: names(named),
        ...via(candidate),
        reviewedAnswer,
      };
    }
    const mentioned = proseHits(candidate);
    if (mentioned.length > 0) {
      return {
        outcome: "widened",
        reached: names(mentioned),
        ...via(candidate),
        reviewedAnswer,
      };
    }
  }

  const perName = tokens.flatMap((token) => [
    ...nameHits(token),
    ...proseHits(token),
  ]);
  if (perName.length > 0) {
    return { outcome: "widened", reached: names(perName), reviewedAnswer };
  }

  const near = candidates[0]
    ? neighbours(candidates[0], { formsOfAPeople: true })
    : [];
  return near.length > 0
    ? { outcome: "neighbour", reached: names(near), reviewedAnswer }
    : { outcome: "none", reached: [], reviewedAnswer };
}
