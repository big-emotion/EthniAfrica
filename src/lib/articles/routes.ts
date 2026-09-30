import { getLocalizedRoute } from "@/lib/routing";

/**
 * The canonical address of an article: under the existing /dossiers segment,
 * so the first release moves no URL. French only for now — an article has no
 * English text until one is written, and an address is not offered for a page
 * that does not exist.
 */
// @req REQ-114
export function getArticleRoute(slug: string): string {
  return `${getLocalizedRoute("fr", "dossiersHub")}/${slug}`;
}
