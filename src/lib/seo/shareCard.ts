import fs from "node:fs";
import path from "node:path";

/**
 * What every Open Graph card the product emits is drawn on.
 *
 * Four routes draw a share card — the site card, its Twitter twin, the
 * comparison card and the quiz score — and each one used to declare its own
 * ground. Three landed on the same cold slate gradient
 * (`#0f172a → #1e293b → #111827`), a colour that appears nowhere else in the
 * product, while the fourth already sat on parchment. So the most-seen surface
 * of the brand — the one a reader meets before the site, in a feed or a
 * message — contradicted both the site and itself.
 *
 * Brand charter §5.1 settles which of the two is right: the warm paper is the
 * single most recognisable thing about the product and is never traded for a
 * neutral grey. The quiz card was already obeying it.
 *
 * Every value here is the hex of an `--afh-*` token. `ImageResponse` resolves
 * no custom property — Satori parses the style object, not a stylesheet — so
 * the card cannot read the spine at render time and a literal is unavoidable.
 * `shareCardCharter.test.ts` holds each one against `src/styles/tokens/`, in
 * both directions, which is the substitute for the cascade.
 */
// @req REQ-019
export const SHARE_CARD_THEME = {
  /** `--afh-bg` — the parchment ground, charter §5.1 */
  ground: "#fbf7f2",
  /** `--afh-text` */
  ink: "#2c2018",
  /** `--afh-text-soft` */
  inkSoft: "#746557",
  /** `--afh-text-muted` */
  inkMuted: "#9b8b7d",
  /** `--afh-cat-ocre-ink` — the atlas's own accent, and the only one a card takes */
  accent: "#835514",
  /** `--afh-line` */
  line: "#e8dfd3",
  /** `--afh-brand-flame`, first stop of `--afh-gradient-brand` */
  brandFlame: "#da622f",
  /** `--afh-brand-gold`, second stop */
  brandGold: "#f2ba36",
} as const;

/** 1200 × 630: what every network crops from, and what all four routes emit. */
// @req REQ-019
export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;

/**
 * The display and body faces, as files.
 *
 * Satori rasterises from a buffer and never sees the Next font loader, so a
 * card that omits these renders in whatever the runtime's default is — which
 * is how the site card ended up in a generic grotesque while every page of
 * the site is set in Fraunces.
 *
 * They live under the comparison route because that is the route that first
 * needed them. Left there on purpose: moving a subset means re-checking its
 * glyph coverage, and the coverage is the thing that is easy to break
 * silently — the subsets carry 222 and 230 glyphs, enough for French
 * including the typographic apostrophe and the guillemets, and not obviously
 * enough for anything else.
 */
const FONT_DIR = "src/app/[lang]/comparer/_fonts";

function readFontFile(fileName: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), FONT_DIR, fileName));
}

/** The `fonts` option every share card passes to `ImageResponse`. */
// @req REQ-019
export function shareCardFonts() {
  return [
    {
      name: "Fraunces",
      data: readFontFile("Fraunces-600-subset.ttf"),
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Nunito Sans",
      data: readFontFile("NunitoSans-400-subset.ttf"),
      weight: 400 as const,
      style: "normal" as const,
    },
  ];
}
