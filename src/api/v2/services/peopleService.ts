/**
 * People Service - Business logic for peoples
 */

import { DEFAULT_PAGE_SIZE } from "@/api/v2/schemas/pagination";
import {
  getAfrikPeopleById,
  getAfrikPeoplesByIds,
  getAfrikPeoplesByLanguageFamily,
  getPaginatedAfrikPeoples,
} from "@/lib/supabase/queries/afrik/peoples";
import type { PeopleQueryFilters } from "@/lib/supabase/queries/afrik/peoples";
import { logger } from "@/lib/api/logger";
import { createServerClient } from "@/lib/supabase/server";
import { walkRanges } from "@/lib/supabase/queries/walkRanges";
import type { PeopleNameIndexEntry } from "@/lib/people/associatedPeopleLinks";
import type { People } from "@/types/afrik";
import type { PaginatedResult } from "./countryService";

/**
 * Get paginated list of peoples
 */
// @req REQ-033
export async function getPeoples(
  page: number = 1,
  perPage: number = DEFAULT_PAGE_SIZE,
  filters: PeopleQueryFilters = {}
): Promise<PaginatedResult<People>> {
  return getPaginatedAfrikPeoples(page, perPage, filters);
}

/**
 * Get a single people by PPL_ ID
 * Note: Individual items use direct query for now (less critical than lists)
 */
// @req REQ-019
export async function getPeopleById(id: string): Promise<People | null> {
  return getAfrikPeopleById(id);
}

/**
 * Get peoples by language family
 * Note: Filtered queries use direct query for now (less critical than lists)
 */
// @req REQ-019
export async function getPeoplesByLanguageFamily(
  familyId: string
): Promise<People[]> {
  return await getAfrikPeoplesByLanguageFamily(familyId);
}

/**
 * Get the named peoples regardless of the family they carry.
 *
 * The family fiche resolves a macro-family's declared `associatedPeoples`
 * through this: those peoples carry a sub-family's id, so the by-family query
 * never reaches them (REQ-116).
 */
// @req REQ-116
export async function getPeoplesByIds(
  peopleIds: readonly string[]
): Promise<People[]> {
  return await getAfrikPeoplesByIds(peopleIds);
}

/**
 * PostgREST stops a select at 1000 rows without an error, and `.range()` does
 * not lift that cap (see sourcesFacet), so the index is read a page at a time.
 */
const NAME_INDEX_PAGE_SIZE = 1000;

/** Bounds the walk against a server that ignores `.range()` and never runs dry. */
const NAME_INDEX_MAX_PAGES = 50;

/**
 * Every people's id and main name, so a fiche can resolve a group it names in
 * prose to the fiche the corpus holds for it (REQ-150).
 *
 * `name_main` only. The appellation variants weigh 974 KB across the corpus,
 * and their exonyms are prose-tailed and self-referential — the Shona fiche
 * lists "Karanga (pour le sous-groupe dominant du plateau)" among its own
 * exonyms — so indexing them would make fiches resolve to themselves and to
 * each other wrongly. Id plus `name_main` is 14.1 KB for 776 rows.
 *
 * Server-only: the browser never reads the corpus from Supabase.
 */
// @req REQ-150
export async function getPeopleNameIndex(): Promise<PeopleNameIndexEntry[]> {
  const supabase = createServerClient();
  let rows: Array<{ id: string; name_main: string | null }>;
  try {
    // Ordered by id: a range over an unordered select may repeat or skip rows.
    ({ rows } = await walkRanges(
      async (from, to) => {
        const { data, error } = await supabase
          .from("afrik_peoples")
          .select("id, name_main")
          .order("id")
          .range(from, to);
        if (error) throw new Error(error.message);
        return (data ?? []) as Array<{ id: string; name_main: string | null }>;
      },
      { pageSize: NAME_INDEX_PAGE_SIZE, maxPages: NAME_INDEX_MAX_PAGES }
    ));
  } catch (error) {
    // The caller renders its chips as plain text without an index, so a failed
    // read costs links rather than the chapter around them.
    logger.error("Error fetching the people name index", error);
    return [];
  }

  const index: PeopleNameIndexEntry[] = [];
  for (const row of rows) {
    const nameMain = row.name_main?.trim();
    // An entry with no name can never match anything a fiche mentions.
    if (!nameMain) continue;
    index.push({ id: row.id, nameMain });
  }
  return index;
}
