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

  // A production found by the word is the answer to it, exactly as an exact
  // entity match is, so it is just as quiet.
  // @req REQ-180
  it("keeps a word match quiet, and names the word when asked", () => {
    const word = { relation: "word" as const, word: "zombie" };
    const { rerender } = render(<CompanionRelationLabel match={word} />);

    expect(screen.queryByText("Sur ce mot")).not.toBeInTheDocument();

    rerender(<CompanionRelationLabel match={word} showExact />);
    expect(screen.getByText("Sur ce mot")).toHaveAttribute(
      "data-companion-relation",
      "word"
    );
  });
});
