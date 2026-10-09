import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { SOURCE_KIND_FAMILIES } from "@/lib/sources/sourceKindFamily";

const colorCss = readFileSync(
  resolve(process.cwd(), "src/styles/tokens/color.css"),
  "utf8"
);
const diamondCss = readFileSync(
  resolve(process.cwd(), "src/styles/source-diamond.css"),
  "utf8"
);

function tokenHex(name: string): string {
  const match = colorCss.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`Missing hexadecimal token ${name}`);
  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 1.4.11: a graphical object that carries meaning needs 3:1. */
const NON_TEXT = 3;

/**
 * Every ground a timeline tile can put under the diamond: the white card, the
 * page, the warm band, and the birth tile's terre cuite wash.
 */
const DAY_GROUNDS = [
  "--afh-color-card",
  "--afh-color-bg",
  "--afh-color-bg-warm",
  "--afh-color-name-birth-bg",
];
const NIGHT_GROUNDS = [
  "--afh-night-ground",
  "--afh-night-surface",
  "--afh-night-surface-2",
];

describe("source diamond colours (ETNI-2015)", () => {
  // @req REQ-198
  it("clears 3:1 for every family on every day ground", () => {
    for (const family of SOURCE_KIND_FAMILIES) {
      const fill = tokenHex(`--afh-color-source-${family}`);
      for (const ground of DAY_GROUNDS) {
        expect(
          contrastRatio(fill, tokenHex(ground)),
          `${family} on ${ground}`
        ).toBeGreaterThanOrEqual(NON_TEXT);
      }
    }
  });

  // @req REQ-198
  it("clears 3:1 for every family on every night ground", () => {
    for (const family of SOURCE_KIND_FAMILIES) {
      const fill = tokenHex(`--afh-color-source-${family}-night`);
      for (const ground of NIGHT_GROUNDS) {
        expect(
          contrastRatio(fill, tokenHex(ground)),
          `${family} (night) on ${ground}`
        ).toBeGreaterThanOrEqual(NON_TEXT);
      }
    }
  });

  // @req REQ-198
  it("binds each family through a semantic token that the night scope swaps", () => {
    const nightScope =
      colorCss.match(/\.dark,\s*\.afh-on-night\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    for (const family of SOURCE_KIND_FAMILIES) {
      expect(colorCss).toMatch(
        new RegExp(
          `--afh-source-${family}:\\s*var\\(--afh-color-source-${family}\\);`
        )
      );
      expect(nightScope).toMatch(
        new RegExp(
          `--afh-source-${family}:\\s*var\\(--afh-color-source-${family}-night\\);`
        )
      );
    }
  });

  // @req REQ-198
  it("paints the diamond from those tokens only, never a colour literal", () => {
    expect(diamondCss).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    for (const family of SOURCE_KIND_FAMILIES) {
      expect(diamondCss).toContain(`var(--afh-source-${family})`);
    }
  });
});
