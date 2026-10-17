import { unstable_cache } from "next/cache";

import { CORPUS_AGGREGATE_REVALIDATE_SECONDS } from "@/api/v2/services/corpusCache";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { crawlableWordLabels } from "@/lib/productions/wordAnswer";
import {
  buildNameAddressDirectory,
  historyAddressSpelling,
} from "@/lib/search/nameAddress";
import {
  getAnsweredNameRows,
  type AnsweredNameRow,
} from "@/lib/supabase/queries/afrik/nameAddressEntries";

function spellingOf(row: AnsweredNameRow): string | undefined {
  const parsed = parseNameHistory(row.nameHistory);
  return parsed.success
    ? historyAddressSpelling(parsed.data, row.name)
    : undefined;
}

/**
 * Every spelling that has a permanent address (REQ-200, DEC-074), one per
 * accent-and-case fold: the corpus forms that meet the crawler threshold,
 * then the published words of the production ledger.
 *
 * One list for the sitemap, the address page and the search links, so the
 * three cannot disagree about which forms have an address or how each is
 * spelled. A plain sorted array, because `unstable_cache` keeps its value by
 * serialization and a Map would come back empty.
 *
 * Cached for an hour: the set moves only when the corpus is loaded, and the
 * walk reads every subject's history.
 */
// @req REQ-200
export const getNameAddressSpellings = unstable_cache(
  async (): Promise<string[]> => {
    const corpusSpellings = (await getAnsweredNameRows())
      .map(spellingOf)
      .filter((spelling): spelling is string => spelling !== undefined);
    const directory = buildNameAddressDirectory([
      ...corpusSpellings,
      ...crawlableWordLabels(),
    ]);
    return [...directory.values()].sort();
  },
  ["name-address-spellings"],
  { revalidate: CORPUS_AGGREGATE_REVALIDATE_SECONDS }
);
