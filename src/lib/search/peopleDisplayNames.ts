import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * Operator ruling, 2026-09-22: « le nom que le peuple se donne, d'abord ».
 * Every surface that names a people opens on its self-given name
 * (`content.appellations.selfAppellation`) and follows with the filed name.
 * Ordering is not crowning: callers render both at the same weight.
 *
 * The self-name is used verbatim — its parenthesis carries a free-text
 * qualifier (« Fulbe (pluriel), Pullo (singulier) ») and splitting it would
 * derive a qualifier the corpus never declared as one.
 */
export interface PeopleDisplayNames {
  primary: string;
  /** Absent when there is no self-name, or when it is the filed name. */
  secondary?: string;
}

// @req REQ-178
export function peopleDisplayNames(
  selfName: string | null | undefined,
  filedName: string
): PeopleDisplayNames {
  const self = selfName?.trim();
  if (!self) return { primary: filedName };
  // Case and surrounding space only: a diacritic distinguishes two spellings.
  if (self.toLowerCase() === filedName.trim().toLowerCase()) {
    return { primary: self };
  }
  return { primary: self, secondary: filedName };
}

function joinDisplayNames({ primary, secondary }: PeopleDisplayNames): string {
  return secondary ? `${primary} — ${secondary}` : primary;
}

/** The same pair on one line, for surfaces that hold a single string. */
// @req REQ-178
export function peopleDisplayLabel(
  selfName: string | null | undefined,
  filedName: string
): string {
  return joinDisplayNames(peopleDisplayNames(selfName, filedName));
}

/**
 * A search result's display names. Only a people carries a self-name; every
 * other class keeps its localized name alone.
 */
// @req REQ-178
export function searchResultDisplayNames(
  result: SearchResult,
  language: Language
): PeopleDisplayNames {
  const filedName = getLocalizedSearchResultName(result, language);
  if (result.type !== "people") return { primary: filedName };
  return peopleDisplayNames(result.autonym, filedName);
}

/** `searchResultDisplayNames` on one line, for typeahead options and card titles. */
// @req REQ-178
export function searchResultDisplayLabel(
  result: SearchResult,
  language: Language
): string {
  return joinDisplayNames(searchResultDisplayNames(result, language));
}
