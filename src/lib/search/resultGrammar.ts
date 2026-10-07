/**
 * Executable vocabulary shared by the feed, the generated manifest and tests.
 *
 * Reader-facing copy stays in locale dictionaries. The search-result charter
 * owns conditions and meaning; these tuples make identifiers and order
 * machine-checkable without creating a second prose contract.
 */

/** The page's answer, in the order the operator validated (mockup v11). */
// @req REQ-178
export const ANSWER_BLOCKS = [
  "answer-what",
  "answer-origin",
  "answer-names",
  "answer-where",
  "answer-next",
  "answer-sources",
] as const;

export type AnswerBlockId = (typeof ANSWER_BLOCKS)[number];

/**
 * Canonical top-level order. « Tout » draws the filters, the six answer blocks
 * per subject, the fiche button and the invitation; `verdict` and
 * `appellations` open the pages that have no answer to give (unknown name,
 * misspelling, a relation browse). `shorts`, `plates`, `quiz`, `images` and
 * `fiches` are what the filters show — they left « Tout » when the answer
 * became the page.
 */
// @req REQ-180
export const FEED_BLOCKS = [
  "lenses",
  "verdict",
  "appellations",
  ...ANSWER_BLOCKS,
  "fiche-link",
  "shorts",
  "plates",
  "quiz",
  "images",
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
export const FEED_ZONES = ["first", "primary", "closing"] as const;

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
