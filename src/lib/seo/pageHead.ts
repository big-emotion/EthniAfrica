import type { Metadata } from "next";

import { CANONICAL_DOMAIN, OG_DESCRIPTION, OG_TITLE } from "@/lib/brand";

/**
 * The canonical and the social card of a public page, composed once so the
 * two cannot disagree about which address the page is.
 *
 * **Absolute, on `CANONICAL_DOMAIN`.** The root layout's `metadataBase`
 * falls back to `localhost:3000`, so a relative canonical resolved against it
 * would point a production page at localhost whenever `NEXT_PUBLIC_SITE_URL`
 * was unset.
 *
 * **No hreflang cluster.** The site publishes French alone, and a cluster
 * with one member says nothing a canonical does not.
 */

type PageOpenGraph = NonNullable<Metadata["openGraph"]>;

/** The page copy a social card carries when the page has its own. */
export interface PageHeadCopy {
  title?: string;
  description?: string;
}

/**
 * The image the root layout's site card uses, named once so a page's own
 * card and the layout's cannot point at two files.
 */
// @req REQ-141
export const SITE_OPEN_GRAPH_IMAGE = "/opengraph-image";

// @req REQ-141
export const OG_LOCALE = "fr_FR";

const absoluteUrl = (path: string) => `https://${CANONICAL_DOMAIN}${path}`;

/**
 * The whole Open Graph object, not just `locale`: Next merges metadata
 * shallowly, so a page declaring `openGraph: { locale }` alone would replace
 * the root layout's card and ship with no title, description or image.
 */
// @req REQ-141
export function pageHead(
  path: string,
  copy: PageHeadCopy = {}
): { alternates: { canonical: string }; openGraph: PageOpenGraph } {
  const canonical = absoluteUrl(path);
  return {
    alternates: { canonical },
    openGraph: {
      title: copy.title ?? OG_TITLE,
      description: copy.description ?? OG_DESCRIPTION,
      type: "website",
      images: [SITE_OPEN_GRAPH_IMAGE],
      url: canonical,
      locale: OG_LOCALE,
    },
  };
}
