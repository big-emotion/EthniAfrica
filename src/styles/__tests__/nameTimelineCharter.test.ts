import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const colorCss = read("src/styles/tokens/color.css");
const timelineCss = read("src/styles/name-timeline.css");

function hexOf(token: string): string {
  let current = token;
  for (let hop = 0; hop < 6; hop += 1) {
    const match = colorCss.match(
      new RegExp(`${current}:\\s*(#[0-9a-f]{6}|var\\(--[a-z0-9-]+\\))`, "i")
    );
    if (!match) throw new Error(`Missing token ${current}`);
    if (match[1].startsWith("#")) return match[1];
    current = match[1].slice(4, -1);
  }
  throw new Error(`${token} never resolves to a hex`);
}

function luminance(hex: string): number {
  const [r, g, b] = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [
    luminance(hexOf(foreground)),
    luminance(hexOf(background)),
  ].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe("name-history timeline palette (ETNI-2012)", () => {
  // The terre cuite of mockup v5, held to the contrast the mockup measured.
  // @req REQ-198
  it("keeps the birth tile's text and ink AA-readable on its ground", () => {
    expect(
      contrast("--afh-text", "--afh-name-birth-bg")
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast("--afh-name-birth-ink", "--afh-name-birth-bg")
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast("--afh-name-birth-ink", "--afh-name-birth-chip")
    ).toBeGreaterThanOrEqual(4.5);
  });

  // REQ-198: the « before the name » dashes reach 3:1, the non-text minimum.
  // @req REQ-198
  it("keeps the before-the-name dashes at 3:1 on the page and the tile", () => {
    expect(
      contrast("--afh-name-before-dash", "--afh-bg-warm")
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast("--afh-name-before-dash", "--afh-surface")
    ).toBeGreaterThanOrEqual(3);
  });

  // @req REQ-198
  it("takes every colour of the timeline from a token, never a literal", () => {
    const rules = timelineCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  // @req REQ-198
  it("rebinds the birth palette for the night theme", () => {
    const night = colorCss.slice(colorCss.indexOf(".dark,"));
    expect(night).toMatch(/--afh-name-birth-bg:/);
    expect(night).toMatch(/--afh-name-birth-ink:/);
  });
});
