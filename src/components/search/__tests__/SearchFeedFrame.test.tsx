import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchFeedFrame } from "@/components/search/SearchFeedFrame";

function nestedShellGeometry(viewport: number, pagePadding: number) {
  const outerWidth = Math.min(viewport, 1240);
  const outerX = (viewport - outerWidth) / 2;
  const rootX = outerX + pagePadding;
  const rootWidth = outerWidth - pagePadding * 2;

  return {
    root: { x: rootX, width: rootWidth },
    content: {
      x: rootX + pagePadding,
      width: rootWidth - pagePadding * 2,
    },
  };
}

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    hideHeader,
    hideTrail,
    flushTop,
  }: {
    children: ReactNode;
    hideHeader?: boolean;
    hideTrail?: boolean;
    flushTop?: boolean;
  }) => (
    <main
      className="afh-shell"
      data-hide-header={String(Boolean(hideHeader))}
      data-hide-trail={String(Boolean(hideTrail))}
      data-flush-top={String(Boolean(flushTop))}
    >
      {children}
    </main>
  ),
}));

describe("SearchFeedFrame", () => {
  // The result feed owns its answer and therefore asks the global shell to
  // keep only the masthead and footer. `flushTop` prevents PageLayout's 16 px
  // default from being added to the feed's explicit 32 px opening.
  // @req REQ-180
  it("composes PageLayout without its page identity chrome", () => {
    const { container } = render(
      <SearchFeedFrame language="fr">
        <p>Feed</p>
      </SearchFeedFrame>
    );

    const layout = container.querySelector("main");
    expect(layout).toHaveAttribute("data-hide-header", "true");
    expect(layout).toHaveAttribute("data-hide-trail", "true");
    expect(layout).toHaveAttribute("data-flush-top", "true");
  });

  // The approved board was measured through two shell applications: the page
  // shell sets the root box, then the feed shell sets its content gutter.
  // @req REQ-180
  it("uses the feed root as the intentional inner shell", () => {
    const { container } = render(
      <SearchFeedFrame language="fr">
        <p>Feed</p>
      </SearchFeedFrame>
    );

    const root = container.querySelector("[data-feed-root]");
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("data-feed-root", "");
    expect(root).toHaveClass("afh-shell");
    expect(root.querySelector(".afh-shell")).toBeNull();
    expect(root.closest("main.afh-shell")).not.toBeNull();
    expect(container.querySelectorAll(".afh-shell")).toHaveLength(2);
  });

  // Two border-box shells yield the measured board coordinates. At 430 px
  // both gutters are 12 px. At 1280 px the outer shell is centred at its
  // 1240 px maximum and both gutters are 32 px.
  // @req REQ-180
  it("calculates the approved root and content geometry at both reference widths", () => {
    const spacing = readFileSync(
      resolve(process.cwd(), "src/styles/tokens/space.css"),
      "utf8"
    );
    const shell = readFileSync(
      resolve(process.cwd(), "src/styles/shell.css"),
      "utf8"
    );

    expect(spacing).toMatch(/--afh-page-padding:\s*12px;/);
    expect(spacing).toMatch(
      /@media \(min-width: 1200px\)[\s\S]*--afh-page-padding:\s*32px;/
    );
    expect(spacing).toMatch(/--afh-shell-max:\s*1240px;/);
    expect(shell).toMatch(/\.afh-shell\s*\{[\s\S]*width:\s*100%;/);
    expect(shell).toMatch(/max-width:\s*var\(--afh-shell-max\);/);
    expect(shell).toMatch(/padding-inline:\s*var\(--afh-page-padding\);/);

    expect(nestedShellGeometry(430, 12)).toEqual({
      root: { x: 12, width: 406 },
      content: { x: 24, width: 382 },
    });
    expect(nestedShellGeometry(1280, 32)).toEqual({
      root: { x: 52, width: 1176 },
      content: { x: 84, width: 1112 },
    });
  });

  // The approved 430 px frame opens 32 px below the masthead. The tablet does
  // not introduce another wrapper or spacing branch; desktop composition is a
  // concern of the blocks placed inside this stable root.
  // @req REQ-180
  it("owns the mobile-first 32 px opening outside the captured root", () => {
    const { container } = render(
      <SearchFeedFrame language="fr">
        <p>Feed</p>
      </SearchFeedFrame>
    );

    const root = container.querySelector("[data-feed-root]");
    expect(root).not.toBeNull();
    expect(root).toHaveClass("afh-accent-ocre");
    expect(root).toHaveClass("bg-afh-bg");
    expect(root).not.toHaveClass("pt-afh-6xl");
    expect(root?.parentElement).toHaveClass("pt-afh-6xl", "bg-afh-bg");
    expect(root?.parentElement?.className).not.toMatch(
      /(?:md:|min-\[768px\]:).*pt-/
    );

    const spacing = readFileSync(
      resolve(process.cwd(), "src/styles/tokens/space.css"),
      "utf8"
    );
    expect(spacing).toMatch(/--afh-space-6xl:\s*32px;/);
  });

  // A child shelf may scroll itself, but it cannot make the document wider
  // than the page shell. `clip` bounds paint without creating a second scroll
  // container that keyboard users could become trapped inside.
  // @req REQ-180
  it("bounds horizontal paint without creating page overflow", () => {
    const { container } = render(
      <SearchFeedFrame language="fr">
        <div style={{ width: "200vw" }}>Wide shelf</div>
      </SearchFeedFrame>
    );

    expect(container.querySelector("[data-feed-root]")).toHaveClass(
      "w-full",
      "min-w-0",
      "max-w-full",
      "overflow-x-clip"
    );
  });
});
