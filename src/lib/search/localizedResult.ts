import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

// The result's display names are French, the one locale published; `language`
// is accepted for the callers that still pass one.
// @req REQ-140
export function getLocalizedSearchResultName(
  result: SearchResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language: Language
): string {
  return result.name;
}

// @req REQ-140
export function getLocalizedSearchResultFamilyName(
  result: SearchResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language: Language
): string | undefined {
  return result.languageFamilyName;
}
