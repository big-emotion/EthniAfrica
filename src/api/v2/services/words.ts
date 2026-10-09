/**
 * Word service (REQ-196, migration 104) — the only layer that reads
 * afrik_words. A word links to no other table, so a detail is one query.
 */

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { logger } from "@/lib/api/logger";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/api/v2/schemas/pagination";

export interface WordListItem {
  id: string;
  nameMain: string;
  wordLanguage: string;
}

export interface WordRecord {
  id: string;
  nameMain: string;
  wordLanguage: string;
  definition: string;
  /** Subjects of any class the fiche ties to the word, in its own words. */
  relatedSubjects: { id: string; relation: string }[];
  gaps: string[];
  sources: unknown[];
  nameHistory: NameHistory;
}

function listOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// @req REQ-196
export async function listWords(
  page = 1,
  perPage = DEFAULT_PAGE_SIZE
): Promise<{ data: WordListItem[]; total: number }> {
  const from = (page - 1) * perPage;
  const { data, error, count } = await createServerClient()
    .from("afrik_words")
    .select("id, name_main, word_language", { count: "exact" })
    .order("name_main")
    .range(from, from + perPage - 1);

  if (error) {
    logger.error("Error listing words", error);
    throw error;
  }

  return {
    total: count ?? 0,
    data: (data ?? []).map((row) => ({
      id: row.id as string,
      nameMain: row.name_main as string,
      wordLanguage: row.word_language as string,
    })),
  };
}

// @req REQ-196
export async function getWordById(id: string): Promise<WordRecord | null> {
  const { data: word, error } = await createServerClient()
    .from("afrik_words")
    .select("id, name_main, word_language, definition, content, name_history")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logger.error("Error fetching word", error, { id });
    throw error;
  }
  if (!word) return null;

  const content = (word.content as Record<string, unknown>) ?? {};
  return {
    id: word.id as string,
    nameMain: word.name_main as string,
    wordLanguage: word.word_language as string,
    definition: word.definition as string,
    relatedSubjects: listOf(content.relatedSubjects),
    gaps: listOf(content.gaps),
    sources: listOf(content.sources),
    nameHistory: word.name_history as NameHistory,
  };
}
