import { unstable_cache } from "next/cache";

import { CORPUS_AGGREGATE_REVALIDATE_SECONDS } from "@/api/v2/services/corpusCache";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { crawlableWordLabels } from "@/lib/productions/wordAnswer";
import { nameAnswerSegment } from "@/lib/routing";
import {
  addressSpellingOf,
  addressedHistoryNames,
  buildNameAddressDirectory,
} from "@/lib/search/nameAddress";
import {
  getAnsweredNameRows,
  type AnsweredNameRow,
} from "@/lib/supabase/queries/afrik/nameAddressEntries";

function spellingsOf(row: AnsweredNameRow): string[] {
  const parsed = parseNameHistory(row.nameHistory);
  return parsed.success ? addressedHistoryNames(parsed.data) : [];
}

/**
 * Every spelling that has a permanent address (REQ-200, DEC-074), one per
 * accent-and-case fold: the names the corpus histories tell that meet the
 * crawler threshold, then the published words of the production ledger.
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
    const corpusSpellings = (await getAnsweredNameRows()).flatMap(spellingsOf);
    const directory = buildNameAddressDirectory([
      ...corpusSpellings,
      ...crawlableWordLabels(),
    ]);
    return [...directory.values()].sort();
  },
  ["name-address-spellings"],
  { revalidate: CORPUS_AGGREGATE_REVALIDATE_SECONDS }
);

/** What a requested address segment resolves to. */
export interface NameAddress {
  /** The corpus spelling: the page's heading and the query it reads. */
  spelling: string;
  /**
   * Whether the segment is the address itself. An accent or case variant is
   * not: it reaches the address by one permanent redirect, never by a second
   * page (DEC-074).
   */
  isAddress: boolean;
}

/**
 * The address a requested segment belongs to, or nothing when its form has
 * none. The segment arrives percent-encoded or already decoded depending on
 * the caller; decoding a decoded form is a no-op for every form the corpus
 * holds.
 */
// @req REQ-200
export async function resolveNameAddress(
  segment: string
): Promise<NameAddress | null> {
  let form: string;
  try {
    form = decodeURIComponent(segment);
  } catch {
    return null;
  }
  const spelling = addressSpellingOf(
    buildNameAddressDirectory(await getNameAddressSpellings()),
    form
  );
  if (!spelling) return null;
  return { spelling, isAddress: form === nameAnswerSegment(spelling) };
}
