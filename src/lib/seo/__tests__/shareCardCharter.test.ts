import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SHARE_CARD_THEME } from "@/lib/seo/shareCard";

/**
 * Brand charter §5.1 and §9: a share card is drawn on the product's own
 * parchment, in the product's own faces, and its colours come from the token
 * spine like every other surface.
 *
 * The failure this prevents is measured, not hypothetical. Four routes emit a
 * card and each declared its own ground; three of them agreed on a cold slate
 * gradient that exists nowhere else in the product, so the surface a reader
 * meets *before* the site — in a feed, in a message — was the one surface that
 * did not look like it. Nothing caught it because no page renders these files
 * and no gate reads them.
 */

const TOKEN_FILE = "src/styles/tokens/color.css";

/**
 * Each card colour and the primitive it copies. Satori resolves no custom
 * property, so the card carries the hex; this table is what keeps the copy
 * honest, and it fails in both directions — a token edited without the card is
 * as red as a card edited without the token.
 */
const THEME_TO_TOKEN: Record<keyof typeof SHARE_CARD_THEME, string> = {
  ground: "--afh-color-bg",
  ink: "--afh-color-text",
  inkSoft: "--afh-color-text-soft",
  inkMuted: "--afh-color-text-muted",
  accent: "--afh-cat-ocre-ink",
  line: "--afh-color-border",
  brandFlame: "--afh-brand-flame",
  brandGold: "--afh-brand-gold",
};

/**
 * Every file in `src/` that actually draws a card, found rather than listed.
 *
 * Listing them is what let the drift happen: a fifth card added next month
 * would sit outside any list somebody remembered to extend. `new ImageResponse`
 * is the thing that cannot be avoided, so it is the thing the gate looks for —
 * a route that merely delegates (`opengraph-image.tsx` does) has nothing to
 * check and is correctly not found.
 */
function cardDrawings(): string[] {
  const found: string[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") walk(full);
      } else if (/\.tsx?$/.test(entry.name)) {
        if (fs.readFileSync(full, "utf8").includes("new ImageResponse(")) {
          found.push(path.relative(process.cwd(), full));
        }
      }
    }
  };

  walk(path.join(process.cwd(), "src"));
  return found;
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function tokenValue(css: string, token: string): string | undefined {
  return new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(css)?.[1];
}

describe("the card a reader meets before the site", () => {
  // @req REQ-019
  it("copies every colour from the token spine, value for value", () => {
    const css = read(TOKEN_FILE);

    for (const [key, token] of Object.entries(THEME_TO_TOKEN)) {
      const declared = tokenValue(css, token);
      expect(
        declared,
        `${token} is not declared in ${TOKEN_FILE}`
      ).toBeTruthy();
      expect(
        SHARE_CARD_THEME[key as keyof typeof SHARE_CARD_THEME].toLowerCase(),
        `SHARE_CARD_THEME.${key} has drifted from ${token}`
      ).toBe(declared?.toLowerCase());
    }
  });

  // The slate gradient was copy-pasted into three drawings and never
  // questioned, because each file read as self-consistent on its own.
  // @req REQ-019
  it("lets no card declare a ground of its own", () => {
    const drawings = cardDrawings();
    expect(drawings.length).toBeGreaterThanOrEqual(3);

    for (const source of drawings) {
      const code = read(source);
      expect(code, `${source} declares a raw gradient`).not.toMatch(
        /linear-gradient\([^)]*#[0-9a-fA-F]{3,8}/
      );
      expect(
        code.includes("SHARE_CARD_THEME"),
        `${source} draws a card without reading SHARE_CARD_THEME`
      ).toBe(true);
    }
  });

  // A card that ships no font file renders in the runtime's default face,
  // which is how the site card ended up in a grotesque while every page of the
  // site is set in Fraunces. Nothing about the output says so — it just looks
  // like a different product.
  // @req REQ-019
  it("sets every card in the product's own faces", () => {
    for (const source of cardDrawings()) {
      expect(
        read(source).includes("shareCardFonts"),
        `${source} emits an image without loading the brand faces`
      ).toBe(true);
    }
  });
});
