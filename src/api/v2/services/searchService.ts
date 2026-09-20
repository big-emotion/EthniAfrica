/**
 * Search Service — business logic for search endpoints.
 *
 * ftsSearch: ETNI-38 FTS search (prefix + accent-insensitive matching,
 * confidence boost — migration 052, REQ-129).
 *
 * The query layer chooses one exclusive stream. Without a lens it returns the
 * non-quiz corpus kinds; `lens=quiz` returns quiz questions alone. In either
 * mode the grouped arrays and `results` are two shapes over the same selected
 * hits, ordered on the cross-kind `normalizedScore` of migration 069.
 */

import { ftsSearchEntities } from "@/lib/supabase/queries/afrik/search";
import {
  loadSearchNamingData,
  searchNamingKey,
  type SearchNamingSubjectRef,
  type SearchNamingSubjectType,
} from "@/lib/supabase/queries/afrik/searchNaming";
import { readNaming } from "@/lib/search/naming";
import type { FtsSearchParams, FtsSearchResponse } from "@/types/afrik";

type NamingRow = {
  id: string;
  content?: unknown;
};

function namingRoot(type: SearchNamingSubjectType, row: NamingRow): unknown {
  return type === "patronyme"
    ? { ...(row.content as Record<string, unknown>), ...(row as object) }
    : row;
}

function projectRows<T extends NamingRow>(
  type: SearchNamingSubjectType,
  rows: T[],
  namingData: Awaited<ReturnType<typeof loadSearchNamingData>>
): T[] {
  return rows.map((row) => {
    const data = namingData.get(searchNamingKey(type, row.id));
    return {
      ...row,
      naming: readNaming(
        type,
        row.content,
        namingRoot(type, row),
        data?.records ?? [],
        data?.evidence ?? []
      ),
    };
  });
}

// @req REQ-002
export async function ftsSearch(
  params: FtsSearchParams
): Promise<FtsSearchResponse> {
  const result = await ftsSearchEntities(params);
  const subjects: SearchNamingSubjectRef[] = [
    ...result.peoples.map(({ id }) => ({ type: "people" as const, id })),
    ...result.countries.map(({ id }) => ({ type: "country" as const, id })),
    ...result.families.map(({ id }) => ({
      type: "languageFamily" as const,
      id,
    })),
    ...result.patronymes.map(({ id }) => ({ type: "patronyme" as const, id })),
    ...result.languages.map(({ id }) => ({ type: "language" as const, id })),
  ];
  const namingData = await loadSearchNamingData(subjects);

  return {
    ...result,
    peoples: projectRows("people", result.peoples, namingData),
    countries: projectRows("country", result.countries, namingData),
    families: projectRows("languageFamily", result.families, namingData),
    patronymes: projectRows("patronyme", result.patronymes, namingData),
    languages: projectRows("language", result.languages, namingData),
  };
}
