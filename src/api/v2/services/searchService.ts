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
  wordNamingData,
  type SearchNamingSubjectRef,
  type SearchNamingSubjectType,
} from "@/lib/supabase/queries/afrik/searchNaming";
import {
  loadSearchAnswerExtras,
  searchAnswerKey,
  type SearchAnswerExtrasRow,
} from "@/lib/supabase/queries/afrik/searchAnswer";
import { readAnswer } from "@/lib/search/answer";
import { readNaming } from "@/lib/search/naming";
import type {
  FtsSearchParams,
  FtsSearchResponse,
  RankedWord,
} from "@/types/afrik";

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
  namingData: Awaited<ReturnType<typeof loadSearchNamingData>>,
  answerExtras: Map<string, SearchAnswerExtrasRow>
): T[] {
  return rows.map((row) => {
    const data = namingData.get(searchNamingKey(type, row.id));
    const root = namingRoot(type, row);
    return {
      ...row,
      naming: readNaming(
        type,
        row.content,
        root,
        data?.records ?? [],
        data?.evidence ?? []
      ),
      answer: readAnswer(type, row.content, root, {
        nameRecords: data?.records,
        evidence: data?.evidence,
        ...answerExtras.get(searchAnswerKey(type, row.id)),
      }),
    };
  });
}

/**
 * A word carries its whole nameHistory on the search row, so its names and
 * their evidence are read from it rather than loaded (REQ-196). The row is the
 * root: the answer reads `definition` and `nameHistory` there.
 */
function projectWord(word: RankedWord): RankedWord {
  const data = wordNamingData(word.id, word.nameHistory);
  return {
    ...word,
    naming: readNaming("word", word.content, word, data.records, data.evidence),
    answer: readAnswer("word", word.content, word, {
      nameRecords: data.records,
      evidence: data.evidence,
    }),
  };
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
  const [namingData, answerExtras] = await Promise.all([
    loadSearchNamingData(subjects),
    loadSearchAnswerExtras(subjects),
  ]);

  return {
    ...result,
    peoples: projectRows("people", result.peoples, namingData, answerExtras),
    countries: projectRows(
      "country",
      result.countries,
      namingData,
      answerExtras
    ),
    families: projectRows(
      "languageFamily",
      result.families,
      namingData,
      answerExtras
    ),
    patronymes: projectRows(
      "patronyme",
      result.patronymes,
      namingData,
      answerExtras
    ),
    languages: projectRows(
      "language",
      result.languages,
      namingData,
      answerExtras
    ),
    ...(result.words ? { words: result.words.map(projectWord) } : {}),
  };
}
