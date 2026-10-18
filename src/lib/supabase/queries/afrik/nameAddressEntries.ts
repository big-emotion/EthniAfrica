import { logger } from "@/lib/api/logger";
import { walkRanges, type RangeWalk } from "@/lib/supabase/queries/walkRanges";

import { createServerClient } from "../../server";

/**
 * The rows the name addresses are decided from (REQ-200): each answered
 * subject's filed name and its name history, and nothing else.
 *
 * The directory reads the history: every name it tells is an exact answer
 * for its subject (migration 109), the threshold reads its accounts' tiers,
 * and the address spells each form as the history tells it. The filed name
 * is kept beside it as the row's label; a filed name the history does not
 * tell has no account to read, so it has no address.
 *
 * The history is still most of what this walk costs: about 8.7 MB across the
 * six kinds' fiches, of which the threshold reads some 0.4 MB (name texts and
 * tiers), measured from dataset/source/afrik in October 2026.
 * `name_history->names` would save 5% only, since the accounts are inside it,
 * and PostgREST cannot project inside a JSON array. Reading less needs a view
 * or a function returning each name text with its best tier: a migration.
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

interface NameColumns {
  name: string;
  name_history: unknown;
}

/**
 * The codes Postgres and PostgREST give a table that is not deployed. The
 * words table lands with its own migration, applied by hand, so a stack may
 * lack it until someone applies it: a lasting state, safe to hold for an
 * hour, unlike a failed read (the distinction `gamesService.ts` draws).
 */
function isTableNotDeployed(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01" || code === "PGRST205";
}

async function rowsOf(
  supabase: SupabaseClient,
  table: string,
  nameColumn: string
): Promise<AnsweredNameRow[]> {
  let walk: RangeWalk<NameColumns>;
  try {
    walk = await walkRanges<NameColumns>(
      async (from, to) => {
        // `select()` infers its row type from a literal column list only, so
        // the shape is restated, as in `sitemapEntries.ts`.
        const { data, error } = (await supabase
          .from(table)
          .select(`name:${nameColumn}, name_history`)
          .range(from, to)) as unknown as {
          data: NameColumns[] | null;
          error: unknown;
        };
        if (error) throw error;
        return data ?? [];
      },
      { pageSize: PAGE_SIZE, maxPages: MAX_PAGES }
    );
  } catch (error) {
    if (isTableNotDeployed(error)) {
      logger.warn(`Name addresses: ${table} is not deployed on this stack`);
      return [];
    }
    const reason =
      (error as { message?: string } | null)?.message ?? String(error);
    throw new Error(`Name addresses: could not read ${table}: ${reason}`);
  }
  if (walk.truncated) {
    logger.error(`Name addresses: ${table} exceeded ${MAX_PAGES} pages`);
  }
  return walk.rows
    .filter((row) => typeof row.name === "string" && row.name.trim())
    .map((row) => ({ name: row.name, nameHistory: row.name_history }));
}

/**
 * Every answered subject's filed name and history, across the six kinds.
 *
 * Rejects when a deployed table cannot be read, or when there is no client.
 * The caller caches what this resolves for an hour, and `unstable_cache`
 * keeps no rejection: fewer rows resolved on a failed read would turn the
 * missing addresses into 404s for that hour, where a rejection is read again
 * on the next request (the lesson recorded in `moduleAvailability.ts`).
 */
// @req REQ-200
export async function getAnsweredNameRows(): Promise<AnsweredNameRow[]> {
  const supabase = createServerClient();
  const tables = await Promise.all(
    NAMED_TABLES.map(([table, column]) => rowsOf(supabase, table, column))
  );
  return tables.flat();
}
