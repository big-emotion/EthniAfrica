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

  const exact = results.filter((result) =>
    namesOf(result, language).some((name) => normalizeString(name) === wanted)
  );
  if (exact.length === 0) return [];

  // Bassa is three peoples filed « Bassa », « Bassa du Cameroun » and « Bassa
  // Nge »; the exact match alone answered about one of them. So an entry whose
  // filed name begins with the searched word — as a word, followed by a space —
  // answers to the name too, and the page asks which one. The bounds are what
  // the corpus measured on 2026-09-19:
  //
  // - a space, not a parenthesis: « Fang (Gabon) » is the Fang split by
  //   country, grouped at display, not a second people;
  // - the kind of an exact match: « mandé » answers to the family, and « Mande
  //   du Sud », a people, is related to it rather than confused with it;
  // - never without an exact match, so no query acquires subjects merely
  //   because longer names start with it.
  const kinds = new Set(exact.map((result) => result.type));
  // Fiches the corpus declares one people split — the signal the result list
  // groups on — are that people, not a second one to choose between.
  const groups = new Set(
    exact.map((result) => result.peopleGroupId).filter(Boolean)
  );
  const widened = results.filter(
    (result) =>
      !exact.includes(result) &&
      kinds.has(result.type) &&
      !(result.peopleGroupId && groups.has(result.peopleGroupId)) &&
      carriesAsFirstWord(
        normalizeString(getLocalizedSearchResultName(result, language)),
        wanted
      )
  );

  return [...exact, ...widened];
}

/**
 * « bassa du cameroun » carries « bassa » as its first word; « bassari » does
 * not, and neither does « fang (gabon) », whose next word is a parenthesis —
 * the corpus's mark for a people split by country rather than a second one.
 */
function carriesAsFirstWord(name: string, word: string): boolean {
  if (!name.startsWith(`${word} `)) return false;
  return !name.slice(word.length).trimStart().startsWith("(");
}

/**
 * Every name the entry answers to: the one it is filed under, and every form
 * the corpus records for it.
 *
 * Matching the filed name alone was the narrower reading, and it failed the
 * premise. `Peul` is an exonym of an entry named `Fula (Fulbe / Peul)`; the
 * most-searched African ethnonym in French reached no subject at all, and the
 * page answered it with a bare result card.
 *
 * Forms are compared whole. A quarter of the corpus's exonyms carry their
 * qualifier inside the string — `Mandingue (français colonial)` — and
 * splitting on the parenthesis to widen the match would make `français
 * colonial` a name a people answers to.
 */
function namesOf(result: SearchResult, language: Language): string[] {
  const forms = result.naming?.forms.map((form) => form.form) ?? [];
  return [getLocalizedSearchResultName(result, language), ...forms];
}
