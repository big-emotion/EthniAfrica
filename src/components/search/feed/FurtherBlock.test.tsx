import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FurtherBlock } from "@/components/search/feed/FurtherBlock";
import { getLocalizedRoute } from "@/lib/routing";

// @req REQ-180
describe("FurtherBlock", () => {
  // @req REQ-178
  it("renders every onward path as a labelled 44 px action", () => {
    render(
      <FurtherBlock
        language="fr"
        links={[
          {
            href: getLocalizedRoute("fr", "atlasHub"),
            label: "Parcourir",
          },
        ]}
      />
    );

    expect(screen.getByTestId("feed-block-further")).toHaveAttribute(
      "data-feed-zone",
      "closing"
    );
    expect(screen.getByRole("link", { name: "Parcourir" })).toHaveClass(
      "min-h-11"
    );
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Aller plus loin",
    });
    expect(heading).toBeInTheDocument();

    const list = screen.getByRole("list");
    expect(list).toHaveClass("search-feed-pill-group");
    const link = within(list).getByRole("link", { name: "Parcourir" });
    expect(link.closest("li")).not.toBeNull();
    expect(link).toHaveClass("text-[length:var(--search-feed-text-pill)]");
  });

  // A heading over no way out is an empty promise.
  // @req REQ-178
  it("draws nothing when it has nothing to propose", () => {
    const { container } = render(<FurtherBlock links={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
