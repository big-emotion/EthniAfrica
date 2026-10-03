import type { SearchCompanionsQuery } from "@/api/v2/schemas/searchCompanions";
import {
  anecdotesForTargets,
  imagesForTargets,
  proverbsForTargets,
  quizForTargets,
  shortsForTargets,
  shortsForWord,
  type CompanionShort,
} from "@/lib/search/companionCatalogs";
import {
  resolveCompanionTargets,
  type ResolvedCompanionItem,
  type WordMatch,
} from "@/lib/search/companionRelations";
import { loadSearchCompanionQuizCandidates } from "@/lib/supabase/queries/afrik/searchCompanionQuiz";
import {
  loadSearchCompanionRelations,
  searchCompanionSubjectKey,
} from "@/lib/supabase/queries/afrik/searchCompanionRelations";

type ShortMatch = ResolvedCompanionItem<CompanionShort>["match"] | WordMatch;
type ShortSelection = {
  count: number;
  items: Array<{ item: CompanionShort; match: ShortMatch }>;
};

const emptyShorts: ShortSelection = { count: 0, items: [] };

/**
 * The pieces found by the reader's word lead, since they answer the very word
 * that was typed; a piece the entities also found stays where the word put it.
 */
function mergeShorts(
  byWord: ShortSelection,
  byEntity: ShortSelection
): ShortSelection {
  if (byWord.items.length === 0) return byEntity;
  const wordIds = new Set(byWord.items.map(({ item }) => item.id));
  const rest = byEntity.items.filter(({ item }) => !wordIds.has(item.id));
  return {
    count:
      byWord.count + byEntity.count - (byEntity.items.length - rest.length),
    items: [...byWord.items, ...rest],
  };
}

/** Resolve exact/ring-1 targets, then select every companion catalog once. */
// @req REQ-180
export async function getSearchCompanionSelections(
  query: SearchCompanionsQuery
) {
  const relations = await loadSearchCompanionRelations(query.subjects);
  const knownSubjects = query.subjects.filter(({ type, id }) =>
    relations.has(searchCompanionSubjectKey(type, id))
  );
  const subjects = knownSubjects.map(({ type, id }) => ({
    entityType: type,
    entityId: id,
  }));
  const targets = resolveCompanionTargets(subjects, relations);
  const quizCandidates = await loadSearchCompanionQuizCandidates(
    targets,
    query.lang
  );

  return {
    subjects: knownSubjects,
    targets,
    shorts: mergeShorts(
      query.word ? shortsForWord(query.word) : emptyShorts,
      shortsForTargets(targets)
    ),
    anecdotes: anecdotesForTargets(targets),
    proverbs: proverbsForTargets(targets),
    images: imagesForTargets(targets),
    quiz: quizForTargets(targets, quizCandidates),
  };
}
