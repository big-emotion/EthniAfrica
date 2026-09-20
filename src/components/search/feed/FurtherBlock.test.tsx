import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FurtherBlock } from "@/components/search/feed/FurtherBlock";
import { getLocalizedRoute } from "@/lib/routing";

// @req REQ-180
describe("FurtherBlock", () => {
  it("renders every onward path as a labelled 44 px action", () => {
    render(
      <FurtherBlock
        language="en"
        links={[
          {
            href: getLocalizedRoute("fr", "atlasHub"),
            label: "Parcourir l’atlas",
          },
        ]}
      />
    );

    expect(screen.getByTestId("feed-block-further")).toHaveAttribute(
      "data-feed-zone",
      "closing"
    );
    expect(screen.getByRole("link", { name: "Parcourir l’atlas" })).toHaveClass(
      "min-h-11"
    );
    expect(screen.getByText("Going further")).toBeInTheDocument();
  });
});
