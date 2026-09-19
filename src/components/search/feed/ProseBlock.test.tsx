import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProseBlock } from "@/components/search/feed/ProseBlock";
import type { SearchEvidence } from "@/lib/search/evidence";

const evidence: SearchEvidence = {
  assertion: {
    id: "prose-assertion",
    statement: "A documented position.",
    confidenceScore: 0.8,
    sourceCount: 1,
    lastHumanAuditAt: "2026-09-01",
  },
  sources: [{ id: "prose-source", title: "A source", tier: "referenced" }],
  standing: "referenced",
};

// @req REQ-180
describe.each(["shared-name", "problem", "near-name"] as const)(
  "ProseBlock %s",
  (blockId) => {
    // @req REQ-180
    it("keeps each prose identity explicit", () => {
      render(
        <ProseBlock
          blockId={blockId}
          title="Ce que disent les sources"
          paragraphs={["Une affirmation documentée."]}
        />
      );

      expect(screen.getByTestId(`feed-block-${blockId}`)).toHaveAttribute(
        "data-feed-block",
        blockId
      );
      expect(
        screen.getByText("Une affirmation documentée.")
      ).toBeInTheDocument();
    });
  }
);

describe("ProseBlock locale", () => {
  // @req REQ-180
  it("passes English to its evidence action", () => {
    render(
      <ProseBlock
        blockId="problem"
        language="en"
        title="What these names raise"
        paragraphs={["A documented position."]}
        evidence={evidence}
      />
    );

    expect(screen.getByText("Referenced")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open the source chain/i })
    ).toBeInTheDocument();
  });
});
