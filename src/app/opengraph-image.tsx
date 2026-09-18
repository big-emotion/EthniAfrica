import { renderSiteShareCard } from "@/lib/seo/siteShareCard";
import { SHARE_CARD_SIZE } from "@/lib/seo/shareCard";

// @req REQ-044
export const size = SHARE_CARD_SIZE;
// @req REQ-044
export const contentType = "image/png";
// @req REQ-044
export const runtime = "nodejs";

// @req REQ-044
export default async function OgImage() {
  return renderSiteShareCard();
}
