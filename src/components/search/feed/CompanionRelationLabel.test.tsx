import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanionRelationLabel } from "@/components/search/feed/CompanionRelationLabel";

// @req REQ-180
describe("CompanionRelationLabel", () => {
  const exact = {
    relation: "exact" as const,
    entityType: "people" as const,
    entityId: "PPL_MANDE",
  };

  // @req REQ-180
  it("keeps exact matches quiet unless explicitly requested", () => {
    const { rerender } = render(<CompanionRelationLabel match={exact} />);

    expect(screen.queryByText("Sur ce nom")).not.toBeInTheDocument();

    rerender(<CompanionRelationLabel match={exact} language="en" showExact />);
    expect(screen.getByText("About this name")).toHaveAttribute(
      "data-companion-relation",
      "exact"
    );
  });
});
