import { nameRecordsFromHistory } from "@/lib/afrik/nameHistoryRecords";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  readNaming,
  toldName,
  type NamingProjection,
  type SearchNameRecord,
} from "@/lib/search/naming";

/**
 * A place's names in the projection `FicheNameStory` draws, the same reader
 * the country, family and language fiches use.
 *
 * A place stores its names only in its nameHistory block (ETNI-2031), so
 * `readNaming` has no legacy shape to read: every form comes in as a record,
 * and the block's own summary stands as the origin text, written by the
 * curator and never rewritten here. The dated accounts wait for the timeline
 * (ETNI-2012).
 */
// @req REQ-196
export function placeNaming(
  placeId: string,
  history: NameHistory | null
): NamingProjection {
  const records: SearchNameRecord[] = nameRecordsFromHistory(history).map(
    (entry, rank) => ({
      id: `${placeId}:nameHistory:${rank}`,
      entityType: "place",
      entityId: placeId,
      ...toldName(entry),
      evidence: [],
    })
  );
  const origin = history?.summary?.trim();

  return {
    ...readNaming("place", {}, {}, records),
    ...(origin ? { origin } : {}),
  };
}
