import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The home's type, element by element, as typography-charter §8 tables it.
 * Every case is a row the operator ruled on (2026-09-14) after the rendered
 * cover measured three display voices, a monospace kicker and seven sizes on
 * one screen. The styles live in styled-jsx strings and CSS files, so each
 * case reads the declared block, the same way homeTokensCharter does.
 */

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

/** The declarations of the first block whose selector is exactly `selector`. */
function declarations(text: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = text.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
  expect(block, `${selector} is declared`).toBeDefined();
  return block ?? "";
}

const HERO = source("src/components/home/HomeHero.tsx");
const ANECDOTE = source("src/components/home/HomeHeroAnecdote.tsx");
const SEARCH = source("src/components/home/HomeHeroSearch.tsx");
const FOOTER = source("src/components/layout/SiteFooter.tsx");
const HEADER = source("src/components/layout/SiteHeader.tsx");
const STORIES = source("src/components/home/HomeStories.tsx");
const FEATURED = source("src/components/home/HomeFeaturedCampaign.tsx");

describe("home typography (typography charter §8)", () => {
  // The title is the page's one hero, so it takes the scale's hero step and
  // its paired leading. The bespoke clamp it replaces was written in px,
  // which ignores the reader's font-size setting (charter §2, WCAG 1.4.4),
  // and topped out at 56px, above the scale's own ceiling.
  // @req REQ-091
  it("sets the page title on the scale's hero step", () => {
    const title = declarations(HERO, ".home-hero-copy h1");

    expect(title).toMatch(/font-size:\s*var\(--afh-text-hero\)/);
    expect(title).toMatch(/line-height:\s*var\(--afh-leading-hero\)/);
    expect(title).toMatch(/font-weight:\s*900/);
  });

  // At lead the anecdote's first paragraph ran 22px beside the hero's 19px
  // answer, so the visual column outweighed the copy column it serves. Its
  // ink, not its size, separates it from the paragraph that follows.
  // @req REQ-091
  it("keeps the anecdote's first paragraph at the body step", () => {
    const lede = declarations(
      ANECDOTE,
      ".home-hero-anecdote-prose .home-hero-anecdote-lede"
    );

    expect(lede).not.toMatch(/--afh-text-lead/);
    expect(lede).toMatch(/color:\s*var\(--afh-text\)/);
    expect(declarations(ANECDOTE, ".home-hero-anecdote-prose p")).toMatch(
      /font-size:\s*var\(--afh-text-body\)/
    );
  });

  // Two kickers on the home carried their own tracking (0.07em, 0.06em) and
  // one a 500 weight, so the same role wore three dresses. An eyebrow is a
  // dress, not a size (charter §1): it reads the dress tokens or it is not one.
  // @req REQ-091
  it.each([
    ["the anecdote chip's kind", ANECDOTE, ".home-hero-anecdote-chip-kind"],
    ["the search panel's group label", SEARCH, ".home-hero-search-group"],
  ])("dresses %s with the eyebrow tokens", (_label, text, selector) => {
    const kicker = declarations(text, selector);

    expect(kicker).toMatch(/font-size:\s*var\(--afh-text-eyebrow\)/);
    expect(kicker).toMatch(/font-weight:\s*var\(--afh-eyebrow-weight\)/);
    expect(kicker).toMatch(/letter-spacing:\s*var\(--afh-eyebrow-tracking\)/);
    expect(kicker).toMatch(/text-transform:\s*var\(--afh-eyebrow-transform\)/);
  });

  // A card title is the display face at the body step (charter §4): three
  // story cards may not shout over the section title that governs them.
  // @req REQ-115
  it("sets a story card title as a card title, never at a heading step", () => {
    const title = declarations(
      STORIES,
      ".home-stories .home-story .home-story-title"
    );

    expect(title).toMatch(/font-family:\s*var\(--afh-font-display\)/);
    expect(title).toMatch(/font-size:\s*var\(--afh-text-body\)/);
    expect(title).toMatch(/font-weight:\s*700/);
  });

  // It introduces the chips and is not one of them: their step, soft ink.
  // @req REQ-115
  it("sets the seed intro at the chips' step in the soft ink", () => {
    const intro = declarations(SEARCH, ".home-hero-seeds-intro");

    expect(intro).toMatch(/font-size:\s*var\(--afh-text-small\)/);
    expect(intro).toMatch(/color:\s*var\(--afh-text-soft\)/);
  });

  // The display face speaks at two weights: 900 for the page's own title and
  // key figures, 700 for a heading role (charter §8.1). The featured heading
  // shares the band with the h1 from 1200px.
  // @req REQ-115
  it("gives the featured answer's heading a heading role's weight", () => {
    const heading = declarations(FEATURED, ".home-featured-heading");

    expect(heading).toMatch(/font-weight:\s*700/);
    expect(heading).not.toMatch(/font-weight:\s*900/);
  });

  // One lockup, one treatment (brand charter §5.3). The footer's name set no
  // weight, fell to 400, and rendered at Fraunces 500 — the nearest loaded
  // face — against the masthead's 900.
  // @req REQ-091
  it("gives the footer lockup the masthead's weight", () => {
    const footerName = FOOTER.match(
      /className="([^"]*)"\s*>\s*\{PRODUCT_NAME\}/
    )?.[1];

    expect(footerName).toMatch(/\bfont-afh-display\b/);
    expect(footerName).toMatch(/\bfont-black\b/);
    expect(declarations(HEADER, ".sh-brand-name")).toMatch(
      /font-weight:\s*900/
    );
  });
});
