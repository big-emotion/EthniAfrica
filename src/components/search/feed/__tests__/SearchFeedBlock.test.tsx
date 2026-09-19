import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";

describe("SearchFeedBlock", () => {
  // @req REQ-180
  it("exposes the manifest identity and zone on a semantic section", () => {
    const { container } = render(
      <SearchFeedBlock id="origins" zone="primary" className="pt-afh-5xl">
        <p>Origin</p>
      </SearchFeedBlock>
    );

    const block = container.querySelector("section");
    expect(block).toHaveAttribute("data-feed-block", "origins");
    expect(block).toHaveAttribute("data-feed-zone", "primary");
    expect(block).toHaveClass("pt-afh-5xl");
  });

  // @req REQ-180
  it("lets a landmark own the block without adding a wrapper", () => {
    render(
      <SearchFeedBlock
        as="nav"
        id="lenses"
        zone="first"
        ariaLabel="Filter this feed"
      >
        <button type="button">All</button>
      </SearchFeedBlock>
    );

    const navigation = screen.getByRole("navigation", {
      name: "Filter this feed",
    });
    expect(navigation).toHaveAttribute("data-feed-block", "lenses");
  });
});

describe("SearchFeedSectionHeading", () => {
  // @req REQ-180
  it("renders one h2 with optional supporting copy and action", () => {
    render(
      <SearchFeedSectionHeading
        id="origins-title"
        title="D’où elles viennent"
        subtitle="Chaque origine reste attribuée."
        action={<a href="#all">Tout voir</a>}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "D’où elles viennent" })
    ).toHaveAttribute("id", "origins-title");
    expect(screen.getByText("Chaque origine reste attribuée.")).toBeVisible();
    const action = screen.getByRole("link", { name: "Tout voir" });
    expect(action).toBeVisible();
    expect(action.parentElement).toHaveClass("-my-[9px]");
  });
});
