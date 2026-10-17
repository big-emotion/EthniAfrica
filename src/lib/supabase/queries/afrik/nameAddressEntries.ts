import { logger } from "@/lib/api/logger";
import { walkRanges } from "@/lib/supabase/queries/walkRanges";

import { createServerClient } from "../../server";

/**
 * The rows the name addresses are decided from (REQ-200): each answered
 * subject's filed name and its name history, and nothing else.
 *
 * The filed name is the form the search answers exactly for every kind
 * (`exactMatch` folds it against the query), so it is the form an address
 * can be offered for. The history is read because the threshold reads its
 * accounts' tiers and the address spells the form as the history tells it.
 * The rest of each fiche is never fetched: this walk runs once an hour for the
 * sitemap, the address page and the search links.
 */

/** Rows per request, under PostgREST's ceiling as in `sitemapEntries.ts`. */
const PAGE_SIZE = 500;

/** Far more pages than the corpus fills; reaching it means `.range()` is ignored. */
const MAX_PAGES = 40;

/**
 * Each answered kind and the column its filed name lives in. Places are left
 * out: the search page answers a place inside another subject's history, not
 * as a name of its own.
 */
const NAMED_TABLES = [
  ["afrik_peoples", "name_main"],
  ["afrik_countries", "name_fr"],
  ["afrik_language_families", "name_fr"],
  ["afrik_languages", "name"],
  ["afrik_patronymes", "name_main"],
  ["afrik_words", "name_main"],
] as const;

export interface AnsweredNameRow {
  /** The name the subject is filed under, as the corpus spells it. */
  name: string;
  /** The subject's `name_history` column, unparsed; null when it has none. */
  nameHistory: unknown;
}

type SupabaseClient = ReturnType<typeof createServerClient>;

async function rowsOf(
  supabase: SupabaseClient,
  table: string,
  nameColumn: string
): Promise<AnsweredNameRow[]> {
  try {
    const walk = await walkRanges<{ name: string; name_history: unknown }>(
      async (from, to) => {
        // `select()` infers its row type from a literal column list only, so
        // the shape is restated, as in `sitemapEntries.ts`.
        const { data, error } = (await supabase
          .from(table)
          .select(`name:${nameColumn}, name_history`)
          .range(from, to)) as unknown as {
          data: Array<{ name: string; name_history: unknown }> | null;
          error: unknown;
        };
        if (error) throw error;
        return data ?? [];
      },
      { pageSize: PAGE_SIZE, maxPages: MAX_PAGES }
    );
    if (walk.truncated) {
      logger.error(`Name addresses: ${table} exceeded ${MAX_PAGES} pages`);
    }
    return walk.rows
      .filter((row) => typeof row.name === "string" && row.name.trim())
      .map((row) => ({ name: row.name, nameHistory: row.name_history }));
  } catch (error) {
    logger.error(`Name addresses: could not read ${table}`, error);
    return [];
  }
}

/**
 * Every answered subject's filed name and history, across the six kinds.
 *
 * Never throws: a table that fails costs its own addresses, and a database
 * that is unreachable costs them all, never the sitemap or the search page.
 */
// @req REQ-200
export async function getAnsweredNameRows(): Promise<AnsweredNameRow[]> {
  let supabase: SupabaseClient;
  try {
    supabase = createServerClient();
  } catch (error) {
    logger.error("Name addresses: no Supabase client available", error);
    return [];
  }

  const tables = await Promise.all(
    NAMED_TABLES.map(([table, column]) => rowsOf(supabase, table, column))
  );
  return tables.flat();
}
