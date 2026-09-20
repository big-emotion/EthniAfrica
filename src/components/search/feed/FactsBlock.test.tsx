import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FactsBlock } from "@/components/search/feed/FactsBlock";

// @req REQ-180
describe("FactsBlock", () => {
  it("identifies the atlas-holds block and keeps facts atomic", () => {
    render(
      <FactsBlock
        title="Ce que l’atlas tient"
        items={[{ label: "Pays", value: "Nigeria" }]}
      />
    );

    expect(screen.getByTestId("feed-block-atlas-holds")).toHaveAttribute(
      "data-feed-block",
      "atlas-holds"
    );
    expect(screen.getByTestId("feed-block-atlas-holds")).toHaveAttribute(
      "data-feed-zone",
      "primary"
    );
    expect(screen.getByRole("list")).toHaveClass("grid-cols-2");
  });
});
