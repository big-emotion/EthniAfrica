import { PageLoadingScreen } from "@/components/system/PageLoadingScreen";

/**
 * The wait for the search page, a whole page, as the hub has its own.
 *
 * In a route group so that it wraps the `?q=` reading alone. A name's
 * address (`atlas/recherche/[name]`) answers 404 for a form with no address
 * and redirects a variant permanently; under a boundary those would be a
 * `noindex` page with status 200 and a refresh redirect (REQ-052, REQ-200).
 */
// @req REQ-104
// @req REQ-200
export default function SearchLoading() {
  return <PageLoadingScreen label="Chargement" />;
}
