import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeHero } from "@/components/home/HomeHero";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function follows(first: Element, second: Element): boolean {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  );
}

const HERO_SOURCE = readFileSync(
  join(process.cwd(), "src/components/home/HomeHero.tsx"),
  "utf8"
);

/**
 * The opening band's charter since 2026-09-22 (operator ruling): the search
 * and the featured answer share it, and the drawn globe left it for a section
 * after the stories — HomeDrawnVisual.test.tsx holds what the globe still
 * owes. This charter used to hold the globe *beside* the search at 1200px;
 * that premise is what the ruling changed, so the two-column contract below
 * names the tile rather than the globe. Brand charter §8.3 (« the atlas
 * leads ») is contradicted by that ruling and is flagged for amendment rather
 * than silently kept.
 */
// @req REQ-115
describe("search-first home charter (ETNI-1404 / ETNI-1509)", () => {
  // @req REQ-115
  it("opens on one band ordered copy and search, then the featured answer", () => {
    const { container } = render(
      <HomeHero
        language="fr"
        featured={<section data-testid="featured-answer" />}
      />
    );

    const band = container.querySelector(".home-hero-inner");
    const copy = container.querySelector(".home-hero-copy");
    const search = screen.getByRole("search");
    const featured = screen.getByTestId("featured-answer");

    if (!(band instanceof HTMLElement) || !(copy instanceof HTMLElement)) {
      throw new TypeError("The hero band and copy must be HTML elements");
    }

    expect(band).toContainElement(copy);
    expect(copy).toContainElement(search);
    expect(band).toContainElement(featured);
    expect(follows(copy, featured)).toBe(true);
  });

  // The globe is not in the opening band any more, and the band does not
  // import it: the section after the stories owns it.
  // @req REQ-115
  it("keeps the drawn visual out of the opening band", () => {
    const { container } = render(<HomeHero language="fr" />);

    expect(container.querySelector(".home-hero-visual")).toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(HERO_SOURCE).not.toContain("ContinentGlobeStage");
  });

  // A compact content-sized stack is the mobile contract. At 1200px the same
  // document becomes two columns when there is a tile to set beside the
  // search. The column ratio is layout arithmetic and is not asserted.
  // @req REQ-115
  it("is mobile-first and becomes the prescribed two-column grid at 1200px", () => {
    expect(HERO_SOURCE).toMatch(
      /\.home-hero-inner\s*\{[^}]*display:\s*grid[^}]*grid-template-areas:\s*"copy"\s*"featured"/
    );
    expect(HERO_SOURCE).toMatch(
      /@media\s*\(min-width:\s*1200px\)[\s\S]*?grid-template-columns:\s*minmax\(0,\s*[\d.]+fr\)\s*minmax\(0,\s*[\d.]+fr\)[\s\S]*?grid-template-areas:\s*"copy featured"/
    );
  });

  // Viewport-height floors made the band claim a screen its content could
  // not fill. This band grows from its contents and paints only tokens.
  // @req REQ-115
  it("uses neither viewport-sized bands nor colour literals", () => {
    expect(HERO_SOURCE).not.toMatch(/\b(?:dvh|svh|vh)\b|min-h-screen/);
    expect(HERO_SOURCE).not.toMatch(
      /#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i
    );
  });
});
