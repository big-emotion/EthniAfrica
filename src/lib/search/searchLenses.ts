import type { SearchFeedCopy } from "@/lib/i18n/copy/searchFeed";

export type FeedLensId =
  "timeline" | "all" | "shorts" | "stories" | "quiz" | "fiches";

export interface FeedLens {
  id: FeedLensId;
  label: string;
  count?: number;
}

type CountedLensId = Exclude<FeedLensId, "all" | "timeline">;

/** `timeline` counts the subjects that carry a name history. */
export type FeedLensCounts = Record<CountedLensId, number> & {
  timeline?: number;
};

const LENS_ORDER = ["shorts", "stories", "quiz", "fiches"] as const;

/**
 * The filters under the search field. « Tout » is the answer and is always
 * there; every other lens appears only when it has content, with its count —
 * a tab ending on a zero would promise a page the reader finds empty. The
 * timeline (REQ-198) goes first and carries no count: it is one history, not
 * a shelf of items.
 */
// @req REQ-178
// @req REQ-198
export function buildFeedLenses(
  counts: FeedLensCounts,
  labels: SearchFeedCopy["filters"]
): FeedLens[] {
  return [
    ...((counts.timeline ?? 0) > 0
      ? [{ id: "timeline" as const, label: labels.timeline }]
      : []),
    { id: "all", label: labels.all },
    ...LENS_ORDER.filter((id) => counts[id] > 0).map((id) => ({
      id,
      label: labels[id],
      count: counts[id],
    })),
  ];
}

/**
 * The page opens on the timeline when a searched subject has a name history.
 * REQ-198 asks for it on every query, with a minimal timeline otherwise; the
 * operator's brief for ETNI-2012 keeps the answer as the default until then.
 */
// @req REQ-198
export function defaultFeedLens(timelineCount: number): FeedLensId {
  return timelineCount > 0 ? "timeline" : "all";
}
