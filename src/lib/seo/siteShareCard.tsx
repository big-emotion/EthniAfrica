import { ImageResponse } from "next/og";

import { CANONICAL_DOMAIN, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import { getTranslation } from "@/lib/translations";
import {
  SHARE_CARD_SIZE,
  SHARE_CARD_THEME,
  shareCardFonts,
} from "@/lib/seo/shareCard";

/**
 * The card the site itself previews with, drawn once for both `opengraph-image`
 * and `twitter-image`.
 *
 * The two routes were byte-identical but for the function name and two style
 * values, which is why one of them could have been fixed alone and nobody
 * would have seen the other. Next requires a route file at each path; nothing
 * requires the drawing to be written twice.
 *
 * What it says, and why in this order. The card leads on **the question the
 * site answers**, not on the product name: a reader scrolling a feed gives it
 * one glance, and « EthniAfrica » alone tells them nothing they can want. The
 * name sits above it, small, where a masthead sits. The enumeration of what the
 * corpus holds comes third, because a table of contents is not a reason to
 * click.
 *
 * The previous card did the opposite — it set the product name at 72 px, twice
 * over (once as an eyebrow, once as the title), and gave the promise 28 px
 * underneath. It also gave its bottom-right corner to the publisher's lockup,
 * the one element on the card naming neither the product nor what it does.
 */
// @req REQ-019
// @req REQ-044
export function renderSiteShareCard(): ImageResponse {
  const { subtitle } = getTranslation("fr");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: SHARE_CARD_THEME.ground,
        color: SHARE_CARD_THEME.ink,
        padding: "64px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* The brand mark, the one place charter §5.3 lets the warm
              gradient onto a share card. */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${SHARE_CARD_THEME.brandFlame} 0%, ${SHARE_CARD_THEME.brandGold} 100%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 28,
            fontWeight: 600,
            color: SHARE_CARD_THEME.ink,
          }}
        >
          {PRODUCT_NAME}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: -1,
            maxWidth: 940,
          }}
        >
          {PRODUCT_TAGLINE}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Nunito Sans",
            fontSize: 27,
            lineHeight: 1.45,
            color: SHARE_CARD_THEME.inkSoft,
            maxWidth: 940,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            height: 1,
            background: SHARE_CARD_THEME.line,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Nunito Sans",
            fontSize: 22,
            color: SHARE_CARD_THEME.accent,
          }}
        >
          {CANONICAL_DOMAIN}
        </div>
      </div>
    </div>,
    {
      ...SHARE_CARD_SIZE,
      fonts: shareCardFonts(),
    }
  );
}
