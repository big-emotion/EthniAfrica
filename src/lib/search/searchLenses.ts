import type { SearchFeedCopy } from "@/lib/i18n/copy/searchFeed";

export type FeedLensId =
  "all" | "shorts" | "stories" | "images" | "quiz" | "fiches";

export interface FeedLens {
  id: FeedLensId;
  label: string;
  count?: number;
}

export type FeedLensCounts = Record<Exclude<FeedLensId, "all">, number>;

const LENS_ORDER = ["shorts", "stories", "images", "quiz", "fiches"] as const;

/**
 * The filters under the search field. « Tout » is the answer and is always
 * there; every other lens appears only when it has content, with its count —
 * a tab ending on a zero would promise a page the reader finds empty.
 */
// @req REQ-178
export function buildFeedLenses(
  counts: FeedLensCounts,
  labels: SearchFeedCopy["filters"]
): FeedLens[] {
  return [
    { id: "all", label: labels.all },
    ...LENS_ORDER.filter((id) => counts[id] > 0).map((id) => ({
      id,
      label: labels[id],
      count: counts[id],
    })),
  ];
}
