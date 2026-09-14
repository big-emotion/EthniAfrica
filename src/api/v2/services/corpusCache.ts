/**
 * How long a corpus-wide aggregate is served from `unstable_cache` before it
 * is recomputed.
 *
 * An hour, because these aggregates move only when the corpus is loaded,
 * which happens on a deploy or a manual sync — never per request. Stated once
 * so the continent counts, the country index, the family atlas and the
 * language footprint cannot drift to four different freshness promises.
 *
 * Not for `export const revalidate` in a page or route: Next reads that
 * segment config at build time and requires a literal it can analyse
 * statically, so an imported constant there is silently ignored.
 */
// @req REQ-110
export const CORPUS_AGGREGATE_REVALIDATE_SECONDS = 3600;

/*
 * The shared-cache lifetimes that are not the corpus class. The corpus class
 * itself, `CORPUS_CACHE_CONTROL`, sits beside the route helper that applies it
 * in `utils/corpusRoute.ts`. `src/app/__tests__/cacheFreshnessContract.test.ts`
 * refuses a lifetime written as a literal in a route.
 */

/** The public reports register refreshes within a minute of a moderator's decision. */
// @req REQ-110
export const PUBLIC_FLAGS_REVALIDATE_SECONDS = 60;

/** The source catalogue: a day, served stale for a further day while it refreshes. */
// @req REQ-084
export const SOURCES_CACHE_CONTROL =
  "public, s-maxage=86400, stale-while-revalidate=86400";

/**
 * A family's tree skeleton: a day-cached derived view, deliberately longer
 * than the records it counts.
 */
// @req REQ-084
export const FAMILY_TREE_CACHE_CONTROL = "s-maxage=86400";

/** The revisions feed is polled by integrations, so it goes stale in a minute. */
// @req REQ-084
export const REVISIONS_FEED_CACHE_CONTROL =
  "s-maxage=60, stale-while-revalidate=30";

/** A pinned version of a fiche never changes, so a shared cache keeps it for a year. */
// @req REQ-084
export const PINNED_VERSION_CACHE_CONTROL = "s-maxage=31536000, immutable";

/** Open Graph cards: a browser or unfurler may keep one for a day. */
// @req REQ-084
export const OG_IMAGE_CACHE_CONTROL = "public, max-age=86400";
