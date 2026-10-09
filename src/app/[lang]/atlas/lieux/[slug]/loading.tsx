import { PageLoadingScreen } from "@/components/system/PageLoadingScreen";

/**
 * A nearer boundary than `atlas/loading.tsx`, which this page never streams
 * through: the page answers 404 for an unknown place, and the 404 is decided
 * in `generateMetadata` before this shell is flushed (REQ-052).
 */
// @req REQ-196
export default function PlaceLoading() {
  return <PageLoadingScreen label="Chargement" />;
}
