import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeHero } from "@/components/home/HomeHero";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const HERO_SOURCE = readFileSync(
  join(process.cwd(), "src/components/home/HomeHero.tsx"),
  "utf8"
);

/** The compact home keeps the search as its only opening action. */
// @req REQ-115
describe("search-first home charter (ETNI-1404 / ETNI-1509)", () => {
  // @req REQ-115
  it("opens on the question and search without a competing feature", () => {
    const { container } = render(<HomeHero language="fr" />);
    expect(container.querySelector(".home-hero-copy")).toContainElement(
      screen.getByRole("search")
    );
    expect(container.querySelector(".home-hero-featured")).toBeNull();
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

  // @req REQ-115
  it("keeps a single content-sized column at every width", () => {
    expect(HERO_SOURCE).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(HERO_SOURCE).not.toContain('"copy featured"');
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
