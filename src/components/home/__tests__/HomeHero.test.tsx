import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeHero } from "@/components/home/HomeHero";
import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";
import { PRODUCT_NAME } from "@/lib/brand";

// The band carries an interactive island since the search field landed in it,
// and useRouter throws outside an app-router tree rather than degrading.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function shippedStyles(container: HTMLElement): string {
  return Array.from(container.querySelectorAll("style"))
    .map((style) => style.textContent)
    .join("\n");
}

const SOURCE = readFileSync(
  join(process.cwd(), "src/components/home/HomeHero.tsx"),
  "utf8"
);

describe("HomeHero — the band the home opens on (REQ-115)", () => {
  // @req REQ-044
  it("renders no eyebrow and no standalone brand line", () => {
    render(<HomeHero language="fr" />);
    expect(screen.queryByText(PRODUCT_NAME)).not.toBeInTheDocument();
    expect(
      screen.queryByText("EXPLORER · COMPRENDRE · JOUER")
    ).not.toBeInTheDocument();
  });

  // The heading's accessible name is its text. There is no reel to hide from
  // assistive technology and so no separate aria-label to keep in step.
  // @req REQ-044
  it("renders a single H1 whose accessible name is the question it displays", () => {
    render(<HomeHero language="fr" />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);

    expect(headings[0]).not.toHaveAttribute("aria-label");
    // Read from the dictionary, never retyped: the copy files use the
    // typographic apostrophe, and a hand-written regex asserts the straight
    // one and fails on copy that is correct.
    expect(headings[0].textContent).toBe(homeHeroCopy.fr.question);
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  // The headline is the question the reader arrives with, so it stays a
  // question: a full stop here would turn the one line a first-time visitor
  // recognises as their own into an assertion about them.
  // @req REQ-044
  it("keeps the headline interrogative and carries no italic clause", () => {
    render(<HomeHero language="fr" />);
    const h1 = screen.getByRole("heading", { level: 1 });

    expect(h1.textContent?.trim().endsWith("?")).toBe(true);
    expect(h1.querySelector("em")).toBeNull();
  });

  // One sentence under the question, naming what can be typed and what is
  // found — stories and sources — and never calling the project an atlas.
  // @req REQ-044
  it("describes in one sentence what the field accepts and what it finds", () => {
    render(<HomeHero language="fr" />);

    const description = screen.getByTestId("home-hero-description");
    expect(description.tagName).toBe("P");
    expect(description.textContent).toBe(homeHeroCopy.fr.description);
    const sentences = description
      .textContent!.split(/(?<=\.)\s+/)
      .filter((part) => part.trim().length > 0);
    expect(sentences).toHaveLength(1);
    expect(description).toHaveTextContent(/histoires/i);
    expect(description).toHaveTextContent(/sources/i);
    expect(description.textContent).not.toMatch(/\batlas\b/i);
  });

  // The sentence is what tells a screen-reader user what the field takes,
  // so it is wired to the field rather than left as nearby prose.
  // @req REQ-002
  it("describes the search field with the sentence under the title", () => {
    render(<HomeHero language="fr" />);

    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      homeHeroCopy.fr.description
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      homeHeroCopy.fr.searchLabel
    );
  });

  // @req REQ-145
  it("speaks English on the English home", () => {
    render(<HomeHero language="en" />);

    expect(
      screen.getByRole("heading", { level: 1, name: homeHeroCopy.en.question })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      homeHeroCopy.en.description
    );
  });

  // The band holds exactly one paragraph of prose. A second is how the lede,
  // the standfirst and the purpose statement grew back — so this asserts the
  // exact list rather than a count. The purpose statement, the visual and the
  // figures each live in their own section below now.
  // @req REQ-044
  it("holds one paragraph, the search, and nothing that moved below it", () => {
    const { container } = render(<HomeHero language="fr" />);

    const paragraphs = Array.from(
      container.querySelectorAll(".home-hero-copy p")
    );
    expect(
      paragraphs.map((paragraph) => paragraph.getAttribute("data-testid"))
    ).toEqual(["home-hero-description"]);
    expect(screen.getByRole("search")).toBeInTheDocument();
    for (const moved of [
      "home-hero-purpose",
      "home-corpus-counts",
      "home-hero-globe",
      "home-hero-image",
      "home-hero-anecdote",
    ]) {
      expect(screen.queryByTestId(moved)).not.toBeInTheDocument();
    }
    expect(container.querySelector("details")).toBeNull();
  });

  // @req REQ-044
  it("no longer carries the trust note it used to duplicate", () => {
    render(<HomeHero language="fr" />);
    expect(
      screen.queryByTestId("home-hero-trust-note")
    ).not.toBeInTheDocument();
  });

  // The band stays on the reader's chosen surface: on parchment a dark
  // panel was a hole punched through the page.
  // @req REQ-115
  it("stays on the page surface rather than pinning itself to night", () => {
    const { container } = render(<HomeHero language="fr" />);
    const styles = shippedStyles(container);

    expect(container.querySelector("section")).not.toHaveClass("afh-on-night");
    expect(styles).toMatch(
      /\.home-hero\s*\{[^}]*background:\s*var\(--afh-bg\)/
    );
    expect(styles).not.toMatch(/var\(--afh-night-ground\)/);
  });

  // Asserted on the source, because no render here can see the defect: the
  // runner's JSX transform keeps the space that Next's drops, so the page
  // said « EthniAfricapublie » while every assertion above stayed green.
  // @req REQ-044
  it("writes the description as a string expression, never as bare JSX text", () => {
    const description = SOURCE.match(
      /data-testid="home-hero-description"\s*>([\s\S]*?)<\/p>/
    )?.[1];

    expect(description).toBeDefined();
    expect(description!.trim().startsWith("{")).toBe(true);
    expect(description!.trimEnd().endsWith("}")).toBe(true);
  });

  // @req REQ-044
  it("sets the description in the reading size and full ink", () => {
    const { container } = render(<HomeHero language="fr" />);
    const styles = shippedStyles(container);

    const rule = styles.match(/\.home-hero-description\s*\{[^}]*\}/)?.[0];
    expect(rule).toMatch(/font-size:\s*var\(--afh-text-body\)/);
    expect(rule).toMatch(/color:\s*var\(--afh-text\)/);
    expect(styles).not.toMatch(/\.home-hero-copy p\s*\{/);
  });

  // The band ends on a stated edge, not a fade.
  // @req REQ-115
  it("closes the band on an accent seam rather than a gradient", () => {
    const { container } = render(<HomeHero language="fr" />);

    expect(container.querySelector(".home-hero-seam")).toBeInTheDocument();
    expect(shippedStyles(container)).toMatch(
      /\.home-hero-seam\s*\{[^}]*border-bottom:[^;]*var\(--afh-cat-ocre\)/
    );
  });

  // @req REQ-044 @req ETNI-822
  it("labels the hero section as an accessible landmark, matched by e2e/home-visual.spec.ts", () => {
    const { container } = render(<HomeHero language="fr" />);

    expect(container.querySelector("section")).toHaveAttribute(
      "aria-label",
      PRODUCT_NAME
    );
  });

  // @req REQ-115 @req ETNI-1404
  it("lets content size the band rather than claiming a viewport height", () => {
    expect(SOURCE).not.toMatch(/\b(?:dvh|svh|vh)\b|min-h-screen/);
  });
});
