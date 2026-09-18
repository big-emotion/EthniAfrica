import { renderSiteShareCard } from "@/lib/seo/siteShareCard";
import { SHARE_CARD_SIZE } from "@/lib/seo/shareCard";

// @req REQ-044
export const size = SHARE_CARD_SIZE;
// @req REQ-044
export const contentType = "image/png";
// @req REQ-044
export const runtime = "nodejs";

/**
 * The same card as `opengraph-image`. X crops a `summary_large_image` to the
 * same 1200 × 630, so a second drawing would be a second thing to keep in
 * step — and the two did drift: this one centred its stack while the other
 * spaced it, for no reason either file recorded.
 */
// @req REQ-044
export default async function TwitterImage() {
  return renderSiteShareCard();
}
