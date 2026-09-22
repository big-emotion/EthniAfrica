import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeDrawnVisual } from "@/components/home/HomeDrawnVisual";
import type { DidYouKnowFact } from "@/lib/home/didYouKnowFacts";
import { HOME_HERO_IMAGES } from "@/lib/home/homeHeroVisuals";

const ANECDOTE: DidYouKnowFact = {
  id: "test-hero-anecdote",
  headline: "Le Cameroun porte le nom d'un crustacé.",
  body: [
    "Rio dos Camarões, la rivière des crevettes.",
    "Le nom de l'estuaire est devenu celui du pays.",
  ],
  entities: [{ kind: "country", id: "CMR", label: "Cameroun" }],
  tier: "referenced",
  sources: [
    {
      title: "Ministère des Relations extérieures du Cameroun — Histoire",
      url: "https://www.diplocam.cm/histoire/",
      tier: "official",
    },
  ],
};

vi.mock("@/components/atlas/ContinentGlobeStage", () => ({
  ContinentGlobeStage: ({
    activation,
    autoRotate,
    peopleCountsByCountry,
    presentation,
  }: {
    activation?: "automatic" | "explicit";
    autoRotate?: boolean;
    peopleCountsByCountry?: Record<string, number>;
    presentation?: string;
  }) => (
    <div
      className="home-globe-stage"
      data-testid="home-globe-stage"
      data-activation={activation}
      data-autoplay={String(Boolean(autoRotate))}
      data-people-count={peopleCountsByCountry?.NGA}
      data-presentation={presentation}
    />
  ),
}));

const SOURCE = readFileSync(
  join(process.cwd(), "src/components/home/HomeDrawnVisual.tsx"),
  "utf8"
);

/**
 * The drawn visual left the opening band on 2026-09-22 (operator ruling): the
 * search and the featured answer share the first screen, and the globe, image
 * or anecdote now follows the stories. What it draws, and how, is unchanged.
 */
describe("HomeDrawnVisual — the visual drawn per request", () => {
  // The globe component owns the capability probe, committed SVG fallback,
  // keyboard surface and reduced-motion path. This section only places it.
  // @req REQ-115
  it("mounts the shared globe by default, with the country signal", () => {
    render(
      <HomeDrawnVisual language="fr" peopleCountsByCountry={{ NGA: 40 }} />
    );

    const stage = screen.getByTestId("home-globe-stage");
    expect(screen.getByTestId("home-hero-globe")).toContainElement(stage);
    expect(stage).toHaveAttribute("data-people-count", "40");
    expect(stage).toHaveAttribute("data-presentation", "hero");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(SOURCE).toContain(
      'import { ContinentGlobeStage } from "@/components/atlas/ContinentGlobeStage"'
    );
  });

  // @req REQ-115
  it("opts the globe into gentle autoplay and keeps WebGL behind an explicit action", () => {
    render(<HomeDrawnVisual language="fr" visual={{ kind: "globe" }} />);

    const stage = screen.getByTestId("home-globe-stage");
    expect(stage).toHaveAttribute("data-autoplay", "true");
    expect(stage).toHaveAttribute("data-activation", "explicit");
  });

  // @req REQ-115
  it("renders a drawn project image with its alt text and visible credit", () => {
    const image = HOME_HERO_IMAGES[0];

    render(<HomeDrawnVisual language="fr" visual={{ kind: "image", image }} />);

    expect(screen.getByRole("img", { name: image.alt })).toBeInTheDocument();
    expect(screen.getByText(image.credit)).toBeInTheDocument();
    expect(screen.queryByTestId("home-hero-globe")).not.toBeInTheDocument();
  });

  // The anecdote takes its turn whole — headline, prose, the entries it
  // names and its source — rather than as a teaser.
  // @req REQ-115
  it("renders a drawn anecdote whole", () => {
    render(
      <HomeDrawnVisual
        language="fr"
        visual={{ kind: "anecdote", fact: ANECDOTE }}
      />
    );

    const slot = screen.getByTestId("home-hero-anecdote");
    expect(
      within(slot).getByRole("heading", { level: 2, name: ANECDOTE.headline })
    ).toBeInTheDocument();
    for (const paragraph of ANECDOTE.body) {
      expect(within(slot).getByText(paragraph)).toBeInTheDocument();
    }
    expect(
      within(slot).getByRole("link", { name: ANECDOTE.sources![0].title })
    ).toHaveAttribute("href", ANECDOTE.sources![0].url);
    expect(screen.queryByTestId("home-hero-globe")).not.toBeInTheDocument();
  });

  // Viewport-height floors are what once pushed the globe off the phone's
  // first screen; the section grows from its contents and paints only tokens.
  // @req REQ-115
  it("draws the globe at every width, sized by content and tokens only", () => {
    expect(SOURCE).not.toMatch(/\b(?:dvh|svh|vh)\b|min-h-screen/);
    expect(SOURCE).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i);
    expect(SOURCE).not.toMatch(/\.home-hero-globe\s*\{[^}]*display:\s*none/);
    expect(SOURCE).toMatch(
      /\.home-hero-globe\s+\.home-globe-stage\s*\{[^}]*min-height:\s*300px[^}]*--afh-globe-stage-height:\s*300px/
    );
  });
});
