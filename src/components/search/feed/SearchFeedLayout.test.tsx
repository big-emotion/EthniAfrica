import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchFeedLayout } from "@/components/search/feed/SearchFeedLayout";

function block(name: string) {
  return <section data-block={name}>{name}</section>;
}

describe("SearchFeedLayout", () => {
  // @req REQ-178
  it("keeps every block in one stream, in the order it was given", () => {
    const { container } = render(
      <SearchFeedLayout
        first={block("lenses")}
        blocks={[block("answer-what"), block("answer-origin"), block("fiche")]}
        closing={[block("owed")]}
      />
    );

    const movement = screen.getByTestId("feed-movement");
    expect(movement).toHaveClass(
      "flex",
      "flex-col",
      "gap-[var(--afh-section-gap)]"
    );
    expect(
      Array.from(movement.querySelectorAll("[data-block]"), (node) =>
        node.getAttribute("data-block")
      )
    ).toEqual(["answer-what", "answer-origin", "fiche"]);
    expect(
      container.querySelector("[data-feed-stream='secondary']")
    ).toBeNull();
  });

  // The answer is prose: it never stretches past a reading measure, and it
  // never splits into columns however wide the screen.
  // @req REQ-178
  it("centres a single 880 px column from 1200 px up", () => {
    render(<SearchFeedLayout first={block("lenses")} blocks={[block("a")]} />);

    const layout = screen.getByTestId("feed-layout");
    expect(layout).toHaveAttribute("data-feed-layout", "column");
    expect(layout).toHaveClass(
      "min-[1200px]:mx-auto",
      "min-[1200px]:w-[880px]",
      "min-[1200px]:max-w-full"
    );
    expect(layout.innerHTML).not.toMatch(/grid-cols/);
  });

  // @req REQ-178
  it("inserts no empty movement between the opening and its closing", () => {
    const { container } = render(
      <SearchFeedLayout
        first={block("verdict")}
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
