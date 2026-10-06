/**
 * What readers searched — `search_query_log` (migrations 050, 084) read back
 * for the moderator's search report.
 *
 * Service-role on purpose: the table has RLS and no policy, and the page that
 * calls this has already checked the allowlist.
 *
 * The log is written by `/api/v2/search`, which the autocomplete also calls
 * after a 300 ms debounce. So one word typed slowly arrives as « pe », « peu »,
 * « peul », and the raw rows overcount every short prefix. The log carries no
 * reader identifier to group a typing session by — deliberately (050) — so the
 * session is approximated by time: a row is folded into a later row of the
 * same locale, logged within `TYPING_WINDOW_MS`, whose query starts with it.
 * That also folds the results page re-running the query the autocomplete just
 * ran. Two readers typing the same prefix within the window would be merged;
 * at this traffic that is the cheaper error.
 *
 * Aggregated in TypeScript rather than in a Postgres function: the folding
 * needs row order, the volume is small, and a migration for a moderator view
 * is a two-database rollout for no reader-facing gain.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { walkRanges } from "@/lib/supabase/queries/walkRanges";

// @req REQ-002
export const SEARCH_REPORT_PERIODS = [7, 30, 90] as const;
export type SearchReportPeriod = (typeof SEARCH_REPORT_PERIODS)[number];
export type SearchReportLang = "fr" | "en";

const TYPING_WINDOW_MS = 30_000;
const LIST_LENGTH = 100;

// 20 × 1 000 = at most 20 000 rows, newest first. Past that the report says
// it is truncated rather than reading an unbounded table into one render.
const PAGE_SIZE = 1_000;
const MAX_PAGES = 20;

interface SearchLogRow {
  query: string;
  result_count: number;
  lang: SearchReportLang;
  created_at: string;
}

export interface ZeroResultQuery {
  query: string;
  count: number;
  lastSeen: string;
}

export interface FrequentQuery {
  query: string;
  count: number;
  /** Between 0 and 1. */
  zeroResultShare: number;
  lastSeen: string;
}

export interface SearchQueryReport {
  /** Log rows read, before keystroke prefixes are folded. */
  rowsRead: number;
  /** Searches after folding. */
  totalSearches: number;
  distinctQueries: number;
  /** Between 0 and 1. */
  zeroResultShare: number;
  zeroResults: ZeroResultQuery[];
  mostFrequent: FrequentQuery[];
  /** The row cap was reached: older searches in the period were not read. */
  truncated: boolean;
}

interface Search {
  query: string;
  lang: SearchReportLang;
  time: number;
  createdAt: string;
  missed: boolean;
}

function normaliseQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

/** `searches` oldest first. */
function foldTypingPrefixes(searches: Search[]): Search[] {
  return searches.filter((search, index) => {
    for (let next = index + 1; next < searches.length; next++) {
      const later = searches[next];
      if (later.time - search.time > TYPING_WINDOW_MS) break;
      if (later.lang === search.lang && later.query.startsWith(search.query)) {
        return false;
      }
    }
    return true;
  });
}

interface QueryTally {
  query: string;
  count: number;
  missed: number;
  lastSeen: string;
}

function tally(searches: Search[]): QueryTally[] {
  const byQuery = new Map<string, QueryTally>();
  for (const search of searches) {
    const entry = byQuery.get(search.query) ?? {
      query: search.query,
      count: 0,
      missed: 0,
      lastSeen: search.createdAt,
    };
    entry.count += 1;
    if (search.missed) entry.missed += 1;
    if (search.createdAt > entry.lastSeen) entry.lastSeen = search.createdAt;
    byQuery.set(search.query, entry);
  }
  return [...byQuery.values()];
}

function byCountThenRecency(
  count: (entry: QueryTally) => number
): (a: QueryTally, b: QueryTally) => number {
  return (a, b) => count(b) - count(a) || b.lastSeen.localeCompare(a.lastSeen);
}

// @req REQ-002
export async function readSearchQueryReport({
  periodDays,
  lang,
  now = new Date(),
}: {
  periodDays: SearchReportPeriod;
  lang?: SearchReportLang;
  now?: Date;
}): Promise<SearchQueryReport> {
  const since = new Date(now.getTime() - periodDays * 86_400_000);
  const supabase = createAdminClient();

  const walk = await walkRanges<SearchLogRow>(
    async (from, to) => {
      let query = supabase
        .from("search_query_log")
        .select("query, result_count, lang, created_at")
        .gte("created_at", since.toISOString());
      if (lang) query = query.eq("lang", lang);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) {
        throw new Error(`Failed to read the search log: ${error.message}`);
      }
      return (data ?? []) as SearchLogRow[];
    },
    { pageSize: PAGE_SIZE, maxPages: MAX_PAGES }
  );

  const searches = foldTypingPrefixes(
    walk.rows
      .map((row) => ({
        query: normaliseQuery(row.query),
        lang: row.lang,
        time: Date.parse(row.created_at),
        createdAt: row.created_at,
        missed: row.result_count === 0,
      }))
      .filter((search) => search.query.length > 0)
      .sort((a, b) => a.time - b.time)
  );

  const tallies = tally(searches);
  const missedSearches = searches.filter((search) => search.missed).length;

  return {
    rowsRead: walk.rows.length,
    totalSearches: searches.length,
    distinctQueries: tallies.length,
    zeroResultShare:
      searches.length === 0 ? 0 : missedSearches / searches.length,
    zeroResults: tallies
      .filter((entry) => entry.missed > 0)
      .sort(byCountThenRecency((entry) => entry.missed))
      .slice(0, LIST_LENGTH)
      .map(({ query, missed, lastSeen }) => ({
        query,
        count: missed,
        lastSeen,
      })),
    mostFrequent: tallies
      .sort(byCountThenRecency((entry) => entry.count))
      .slice(0, LIST_LENGTH)
      .map(({ query, count, missed, lastSeen }) => ({
        query,
        count,
        zeroResultShare: missed / count,
        lastSeen,
      })),
    truncated: walk.truncated,
  };
}
