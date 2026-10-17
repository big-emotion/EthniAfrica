import { PageLoadingScreen } from "@/components/system/PageLoadingScreen";

/**
 * The wait for the Explorer hub, a whole page. Without a `loading.tsx` App
 * Router has nothing to swap in and blocks the navigation on the server
 * response — the reader clicks and the previous page simply stays, with no
 * sign that anything is happening. The search page has the same wait, in its
 * own group.
 *
 * Held to the hub's route group rather than the whole `atlas` segment: a
 * boundary there wrapped every route below it, and a `notFound()` or a
 * redirect reached after that shell was flushed could no longer change the
 * status already sent. Measured on a production build on 2026-10-17, with a
 * browser and with a crawler alike: an unknown place answered 200 and a
 * name's address variant a refresh instead of a 308 until the boundary moved
 * here (REQ-052, REQ-200).
 */
// @req REQ-104
export default function ExplorerHubLoading() {
  return <PageLoadingScreen label="Chargement" />;
}
