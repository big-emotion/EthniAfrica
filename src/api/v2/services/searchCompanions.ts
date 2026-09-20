import type { SearchCompanionsQuery } from "@/api/v2/schemas/searchCompanions";
import {
  anecdotesForTargets,
  imagesForTargets,
  proverbsForTargets,
  quizForTargets,
  shortsForTargets,
} from "@/lib/search/companionCatalogs";
import { resolveCompanionTargets } from "@/lib/search/companionRelations";
import { loadSearchCompanionQuizCandidates } from "@/lib/supabase/queries/afrik/searchCompanionQuiz";
import {
  loadSearchCompanionRelations,
  searchCompanionSubjectKey,
} from "@/lib/supabase/queries/afrik/searchCompanionRelations";

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
    shorts: shortsForTargets(targets, undefined, { includeRecent: true }),
    anecdotes: anecdotesForTargets(targets),
    proverbs: proverbsForTargets(targets),
    images: imagesForTargets(targets),
    quiz: quizForTargets(targets, quizCandidates),
  };
}
