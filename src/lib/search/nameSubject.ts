import { normalizeString } from "@/lib/normalize";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * Every entity that answers to the name the reader typed.
 *
 * This replaces `selectPivot`, which picked "the one result a search is really
 * about" through two paths: an exact name match, or a head whose relevance was
 * at least double the runner-up's. **DEC-057 retires the second.** A page that
 * promotes a head because it won a race states a confidence the corpus does not
 * carry, and does so on the surface whose whole promise is that no name is the
 * right one.
 *
 * Two other behaviours change with it, and both are the point rather than a
 * side effect:
 *
 * - **Several entities may be returned.** `selectPivot` returned `null` when
 *   two results of the same kind shared a name, and the page fell back to a
 *   flat list. Three unrelated peoples answer to « Bassa »; the grammar of
 *   REQ-178 asks the page to show all three and let the reader choose, which
 *   is the « Lequel cherchez-vous ? » block.
 * - **Nothing is promoted on relevance.** A query that matches no name exactly
 *   has no subject, and the page answers with the result list alone.
 */
// @req REQ-178
export function selectNameSubject(
  results: SearchResult[],
  query: string,
  language: Language = "fr"
): SearchResult[] {
  const wanted = normalizeString(query.trim());
  if (!wanted) return [];

  return results.filter(
    (result) =>
      normalizeString(getLocalizedSearchResultName(result, language)) === wanted
  );
}
