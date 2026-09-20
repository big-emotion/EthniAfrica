import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TilesBlock } from "@/components/search/feed/TilesBlock";
import { getLocalizedRoute, getPeopleRoute } from "@/lib/routing";

// @req REQ-180
describe("TilesBlock", () => {
  it("renders factual destinations as a two-column tile grid", () => {
    render(
      <TilesBlock
        title="Trois peuples"
        actionHref={getLocalizedRoute("fr", "peoples")}
        actionLabel="Les 31 peuples mandé"
        items={[
          {
            title: "Bassa",
            meta: "Cameroun",
            href: getPeopleRoute("fr", "PPL_BASSA"),
          },
        ]}
      />
    );

    expect(screen.getByRole("list")).toHaveClass("grid-cols-2");
    expect(screen.getByRole("link", { name: /Bassa/ })).toHaveClass("min-h-11");
    expect(
      screen.getByRole("link", { name: "Les 31 peuples mandé" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "peoples"));
    expect(screen.getByTestId("feed-block-tiles")).toHaveAttribute(
      "data-feed-zone",
      "primary"
    );
  });
});
