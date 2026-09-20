/**
 * Executable vocabulary shared by the feed, generated manifest and tests.
 *
 * Reader-facing copy stays in locale dictionaries. The search-result charter
 * owns conditions and meaning; these tuples make identifiers and order
 * machine-checkable without creating a second prose contract.
 */

/** Canonical top-level order for the search-result feed. */
// @req REQ-180
export const FEED_BLOCKS = [
  "lenses",
  "verdict",
  "appellations",
  "shorts",
  "origins",
  "peoples",
  "shared-name",
  "tiles",
  "atlas-holds",
  "plates",
  "quiz",
  "images",
  "problem",
  "near-name",
  "fiches",
  "owed",
  "further",
] as const;

export type FeedBlockId = (typeof FEED_BLOCKS)[number];

/** Ordered children of the single top-level `owed` block. */
// @req REQ-180
export const OWED_PARTS = ["silences", "conviction", "invitation"] as const;

export type OwedPartId = (typeof OWED_PARTS)[number];

/** Stable placement vocabulary shared with the generated board manifest. */
// @req REQ-180
export const FEED_ZONES = ["first", "primary", "secondary", "closing"] as const;

export type FeedZone = (typeof FEED_ZONES)[number];

/** Data and request states the feed composes explicitly. */
// @req REQ-180
export const SEARCH_RESULT_STATES = [
  "exact",
  "widened",
  "typo",
  "unknown",
  "loading",
  "failed",
] as const;

export type SearchResultState = (typeof SEARCH_RESULT_STATES)[number];
