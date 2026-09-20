/**
 * The boards draw text links at their text height (19 to 24px). This grows the
 * tappable area to 44px around the link without moving or painting anything,
 * and needs the link to be `relative`.
 * @req REQ-180
 */
export const FEED_TEXT_LINK_HIT_AREA =
  "relative after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']";
