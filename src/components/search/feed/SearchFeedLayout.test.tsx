import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchFeedLayout } from "@/components/search/feed/SearchFeedLayout";

function block(name: string) {
  return <section data-block={name}>{name}</section>;
}

describe("SearchFeedLayout", () => {
  // @req REQ-180
  it("preserves one canonical stream in mobile composition", () => {
    const { container } = render(
      <SearchFeedLayout
        composition={{
          mode: "mobile",
          blocks: [
            block("origins"),
            block("tiles"),
            block("plates"),
            block("quiz"),
            block("images"),
            block("fiches"),
          ],
        }}
        first={block("first")}
        closing={[block("owed")]}
      />
    );

    const movement = screen.getByTestId("feed-movement");
    expect(movement).toHaveAttribute("data-feed-composition", "mobile");
    expect(movement).toHaveClass(
      "flex",
      "flex-col",
      "gap-[var(--afh-section-gap)]"
    );
    expect(
      Array.from(movement.querySelectorAll("[data-block]"), (node) =>
        node.getAttribute("data-block")
      )
    ).toEqual(["origins", "tiles", "plates", "quiz", "images", "fiches"]);
    expect(container.querySelectorAll('[data-block="quiz"]')).toHaveLength(1);
    expect(
      container.querySelector("[data-feed-stream='secondary']")
    ).toBeNull();
  });

  // @req REQ-180
  it("renders independent 8/4 desktop streams with the approved gutter", () => {
    const { container } = render(
      <SearchFeedLayout
        composition={{
          mode: "desktop-rich",
          primary: [block("origins"), block("plates"), block("fiches")],
          secondary: [block("tiles"), block("quiz"), block("images")],
        }}
        first={block("first")}
        closing={[block("owed")]}
      />
    );

    const movement = screen.getByTestId("feed-movement");
    expect(movement).toHaveAttribute("data-feed-composition", "desktop-rich");
    expect(movement).toHaveClass(
      "min-[1200px]:grid",
      "min-[1200px]:grid-cols-12",
      "min-[1200px]:gap-afh-6xl"
    );

    const primary = container.querySelector('[data-feed-stream="primary"]');
    const secondary = container.querySelector('[data-feed-stream="secondary"]');
    expect(primary).toHaveClass(
      "gap-[var(--afh-section-gap)]",
      "min-[1200px]:col-span-8"
    );
    expect(secondary).toHaveClass(
      "gap-[var(--afh-section-gap)]",
      "min-[1200px]:col-span-4"
    );
    expect(
      Array.from(primary!.children, (node) => node.getAttribute("data-block"))
    ).toEqual(["origins", "plates", "fiches"]);
    expect(
      Array.from(secondary!.children, (node) => node.getAttribute("data-block"))
    ).toEqual(["tiles", "quiz", "images"]);
    expect(container.querySelectorAll('[data-block="quiz"]')).toHaveLength(1);
  });

  // @req REQ-180
  it("keeps a desktop-thin feed in one centred 880 px stream", () => {
    const { container } = render(
      <SearchFeedLayout
        composition={{
          mode: "desktop-thin",
          primary: [block("atlas-holds"), block("plates"), block("quiz")],
        }}
        first={block("first")}
        closing={[block("owed"), block("further")]}
      />
    );

    const layout = screen.getByTestId("feed-layout");
    const movement = screen.getByTestId("feed-movement");
    expect(movement).toHaveAttribute("data-feed-composition", "desktop-thin");
    expect(layout).toHaveClass(
      "min-[1200px]:mx-auto",
      "min-[1200px]:w-[880px]"
    );
    expect(
      container.querySelector("[data-feed-stream='secondary']")
    ).toBeNull();

    const closing = container.querySelector('[data-feed-stream="closing"]');
    expect(closing).toHaveClass("gap-[var(--afh-section-gap)]");
    expect(
      Array.from(closing!.children, (node) => node.getAttribute("data-block"))
    ).toEqual(["owed", "further"]);
  });

  // @req REQ-180
  it("renders no hidden duplicate responsive tree", () => {
    const { container } = render(
      <SearchFeedLayout
        composition={{
          mode: "desktop-rich",
          primary: [block("quiz")],
          secondary: [],
        }}
        first={block("first")}
      />
    );

    expect(container.querySelectorAll('[data-block="quiz"]')).toHaveLength(1);
    expect(container.innerHTML).not.toMatch(/(?:hidden|min-\[1200px\]:hidden)/);
  });

  // @req REQ-180
  it("does not insert an empty movement between an unknown answer and its closing", () => {
    const { container } = render(
      <SearchFeedLayout
        composition={{ mode: "mobile", blocks: [] }}
        first={block("first")}
        closing={[block("owed"), block("further")]}
      />
    );

    expect(screen.queryByTestId("feed-movement")).toBeNull();
    expect(container.querySelector("[data-feed-stream='primary']")).toBeNull();
    expect(container.querySelector("[data-feed-stream='closing']")).toHaveClass(
      "mt-[var(--afh-section-gap)]"
    );
  });
});
