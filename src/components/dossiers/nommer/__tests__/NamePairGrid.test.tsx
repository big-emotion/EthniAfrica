import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NamePairGrid } from "@/components/dossiers/nommer/NamePairGrid";

describe("NamePairGrid", () => {
  // @req REQ-113
  it("explains the pejorative flag only for names marked by the sources", () => {
    render(
      <NamePairGrid
        pairs={[
          {
            endonym: "Name A",
            endonymGloss: null,
            sourceRefs: [],
            exonym: "Name B",
            imposedBy: "Source A",
            pejorative: true,
          },
          {
            endonym: "Name C",
            endonymGloss: null,
            sourceRefs: [],
            exonym: "Name D",
            imposedBy: "Source B",
            pejorative: false,
          },
        ]}
      />
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(
      "Name B · nom jugé méprisant dans les sources"
    );
    expect(items[1]).toHaveTextContent("Name D");
    expect(items[1]).not.toHaveTextContent("nom jugé méprisant");
  });
});
