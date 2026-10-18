import { PageLoadingScreen } from "@/components/system/PageLoadingScreen";

/**
 * The place fiche's own wait. The page answers 404 for an unknown place, and
 * the 404 is decided in the segment's layout, which wraps this boundary, so
 * it goes out before this shell is flushed (REQ-052). No boundary sits above
 * the segment since the atlas wait moved into the hub's route group.
 */
// @req REQ-196
export default function PlaceLoading() {
  return <PageLoadingScreen label="Chargement" />;
}
