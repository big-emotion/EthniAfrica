import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TilesBlock } from "@/components/search/feed/TilesBlock";

// @req REQ-180
describe("TilesBlock", () => {
  it("renders factual destinations as a two-column tile grid", () => {
    render(
      <TilesBlock
        title="Trois peuples"
        actionHref="/fr/atlas/peuples"
        actionLabel="Les 31 peuples mandé"
        items={[
          {
            title: "Bassa",
            meta: "Cameroun",
            href: "/fr/atlas/peuples/PPL_BASSA",
          },
        ]}
      />
    );

    expect(screen.getByRole("list")).toHaveClass("grid-cols-2");
    expect(screen.getByRole("link", { name: /Bassa/ })).toHaveClass("min-h-11");
    expect(
      screen.getByRole("link", { name: "Les 31 peuples mandé" })
    ).toHaveAttribute("href", "/fr/atlas/peuples");
    expect(screen.getByTestId("feed-block-tiles")).toHaveAttribute(
      "data-feed-zone",
      "primary"
    );
  });
});
