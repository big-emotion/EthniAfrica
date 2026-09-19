import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FichesBlock } from "@/components/search/feed/FichesBlock";

// @req REQ-180
describe("FichesBlock", () => {
  it("derives its columns from the number of available entries", () => {
    render(
      <FichesBlock
        items={[
          {
            kind: "Peuple",
            name: "Mande",
            meta: "Afrique de l’Ouest",
            href: "/fr/atlas/peuples/PPL_MANDE",
          },
        ]}
      />
    );

    expect(screen.getByRole("list")).toHaveClass(
      "grid-cols-1",
      "min-[1200px]:grid-cols-1"
    );
    expect(screen.getByRole("link", { name: /Mande/ })).toHaveClass("min-h-11");
  });

  // @req REQ-180
  it("uses the English shelf copy when requested", () => {
    render(<FichesBlock language="en" items={[]} />);

    expect(
      screen.getByRole("heading", { name: "In the atlas" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Go deeper with each entry and all of its sources.")
    ).toBeInTheDocument();
  });
});
