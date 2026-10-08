import type { Metadata } from "next";

/**
 * Head of a page that must never reach a search index: the moderation console
 * and the one-shot token pages. `follow` is `false` as well, unlike the
 * `noindex, follow` of the combinatorial public pages, because none of these
 * pages links anywhere a crawler should discover.
 */
// @req REQ-042
export function noIndexMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
