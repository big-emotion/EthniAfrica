import {
  eligiblePublications,
  type DiscoveryPublication,
} from "@/lib/discoveries/catalog";

export type GalleryCollection = NonNullable<DiscoveryPublication["collection"]>;

export interface GalleryGroup {
  collection: GalleryCollection;
  publications: DiscoveryPublication[];
}

/**
 * The order the collections are shelved in. Fixed rather than derived from
 * the records, so entering a publication never reshuffles the page.
 */
const GALLERY_COLLECTION_ORDER: readonly GalleryCollection[] = [
  "autonymes",
  "traversees",
  "figures-et-moments",
];

/**
 * The generated images of Découvertes, shelved by collection.
 *
 * Filtered from `eligiblePublications` rather than from the records, so the
 * gallery cannot hold a publication the feed refuses — the two surfaces share
 * one gate and cannot drift. An image with no collection is left out rather
 * than filed under a guessed one.
 */
// @req REQ-167
export function galleryCollections(
  records: readonly DiscoveryPublication[]
): GalleryGroup[] {
  const images = eligiblePublications(records).filter(
    (entry) => entry.kind === "image"
  );
  return GALLERY_COLLECTION_ORDER.map((collection) => ({
    collection,
    publications: images.filter((entry) => entry.collection === collection),
  })).filter((group) => group.publications.length > 0);
}
