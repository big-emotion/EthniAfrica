import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PeopleBlock } from "@/components/search/feed/PeopleBlock";

// @req REQ-180
describe("PeopleBlock", () => {
  it("renders one mobile column and three columns only at 1200 px", () => {
    render(
      <PeopleBlock
        title="Lequel cherchez-vous ?"
        items={[
          {
            name: "Bassa",
            meta: "Cameroun",
            description: "Famille bantoue",
            href: "/fr/atlas/peuples/PPL_BASSA",
          },
        ]}
      />
    );

    expect(screen.getByRole("list")).toHaveClass(
      "grid-cols-1",
      "min-[1200px]:grid-cols-3"
    );
    expect(screen.getByRole("link", { name: /Bassa/ })).toHaveAttribute(
      "href",
      "/fr/atlas/peuples/PPL_BASSA"
    );
  });
});
