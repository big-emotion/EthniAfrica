/**
 * The two corpus reads behind a quiz answer reveal: the sources a question
 * rests on, and the names of the subjects it asks about.
 *
 * They used to be queried from the quiz handler itself; services are the only
 * layer that talks to the database, so they live here and the handler keeps
 * the choice of which source to show.
 */

import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/api/logger";
import { toSourceKindOrNull, type SourceKind } from "@/types/sources";

export interface QuizRevealSource {
  id: string;
  title: string;
  url: string | null;
  year: number | null;
  tier: string | null;
  /** Null when the row records no kind, or one outside the vocabulary. */
  sourceKind: SourceKind | null;
}

interface SourceRow {
  id: string;
  title: string;
  url: string | null;
  year: number | null;
  tier: string | null;
  source_kind: string | null;
}

// @req REQ-194
export async function getQuizRevealSources(
  sourceIds: string[]
): Promise<Map<string, QuizRevealSource>> {
  if (sourceIds.length === 0) return new Map();

  const { data, error } = await createServerClient()
    .from("sources")
    .select("id, title, url, year, tier, source_kind")
    .in("id", sourceIds);

  if (error) {
    logger.error("quizReveal getQuizRevealSources failed", error);
    return new Map();
  }

  return new Map(
    ((data ?? []) as SourceRow[]).map((row) => [
      row.id,
      {
        id: row.id,
        title: row.title,
        url: row.url,
        year: row.year,
        tier: row.tier,
        sourceKind: toSourceKindOrNull(row.source_kind),
      },
    ])
  );
}

export interface QuizSubjectName {
  type: "people" | "country";
  id: string;
  autonym: string | null;
  exonym: string | null;
}

interface PeopleAppellationsRow {
  id: string;
  content: {
    appellations?: { selfAppellation?: string; exonyms?: string[] };
  } | null;
}

/**
 * Two reads rather than one: a people's name lives in
 * `content.appellations.selfAppellation` and a country's in its own `name_fr`
 * column, and a country has no autonym/exonym pair at all — that opposition is
 * what a people fiche is about.
 */
// @req REQ-194
export async function getQuizSubjectNames(
  peopleIds: string[],
  countryIds: string[]
): Promise<Map<string, QuizSubjectName>> {
  const names = new Map<string, QuizSubjectName>();
  const supabase = createServerClient();

  if (peopleIds.length > 0) {
    const { data, error } = await supabase
      .from("afrik_peoples")
      .select("id, content")
      .in("id", peopleIds);

    if (error) {
      logger.error("quizReveal getQuizSubjectNames failed", error);
    } else {
      for (const row of (data ?? []) as PeopleAppellationsRow[]) {
        const appellations = row.content?.appellations ?? {};
        names.set(row.id, {
          type: "people",
          id: row.id,
          autonym: appellations.selfAppellation ?? null,
          exonym: appellations.exonyms?.[0] ?? null,
        });
      }
    }
  }

  if (countryIds.length > 0) {
    const { data, error } = await supabase
      .from("afrik_countries")
      .select("id, name_fr")
      .in("id", countryIds);

    if (error) {
      logger.error("quizReveal getQuizSubjectNames failed", error);
    } else {
      for (const row of (data ?? []) as Array<{
        id: string;
        name_fr: string;
      }>) {
        names.set(row.id, {
          type: "country",
          id: row.id,
          autonym: row.name_fr,
          exonym: null,
        });
      }
    }
  }

  return names;
}
