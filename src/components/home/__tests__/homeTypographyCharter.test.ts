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
const SEARCH = source("src/components/home/HomeHeroSearch.tsx");
const SEARCH_FIELD = source("src/components/search/UniversalSearchField.tsx");
const FOOTER = source("src/components/layout/SiteFooter.tsx");
const HEADER = source("src/components/layout/SiteHeader.tsx");

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

  // @req REQ-091
  it("sets the shared field label at the small-text step in strong ink", () => {
    const label = declarations(SEARCH_FIELD, ".universal-search-label");

    expect(label).toMatch(/font-size:\s*var\(--afh-text-small\)/);
    expect(label).toMatch(/font-weight:\s*600/);
    expect(label).toMatch(/color:\s*var\(--afh-text\)/);
  });

  // It introduces the chips and is not one of them: their step, soft ink.
  // @req REQ-115
  it("sets the seed intro at the chips' step in the soft ink", () => {
    const intro = declarations(SEARCH, ".home-hero-seeds-intro");

    expect(intro).toMatch(/font-size:\s*var\(--afh-text-small\)/);
    expect(intro).toMatch(/color:\s*var\(--afh-text-soft\)/);
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
  // @req REQ-091
  it("keeps the contribution a bare button with no heading of its own", () => {
    const contribution = source("src/components/home/HomeContribute.tsx");
    expect(contribution).not.toMatch(/<h2\b/);
    expect(contribution).not.toMatch(/<p\b/);
  });
});
