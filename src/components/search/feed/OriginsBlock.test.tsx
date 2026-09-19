import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OriginsBlock } from "@/components/search/feed/OriginsBlock";
import type { SearchEvidence } from "@/lib/search/evidence";

const evidence: SearchEvidence = {
  assertion: {
    id: "origin-assertion",
    statement: "A documented origin.",
    confidenceScore: 0.9,
    sourceCount: 1,
    lastHumanAuditAt: "2026-09-01",
  },
  sources: [{ id: "origin-source", title: "A source", tier: "referenced" }],
  standing: "referenced",
};

// @req REQ-180
describe("OriginsBlock", () => {
  it("keeps origin cards horizontally reachable before the 1200 px grid", () => {
    render(
      <OriginsBlock
        title="D’où elles viennent"
        items={[
          {
            name: "Mandé",
            qualifier: "Forme cherchée",
            description: "Une forme transmise par les sources.",
          },
          { name: "Manden", description: "Une autre forme documentée." },
        ]}
      />
    );

    const list = screen.getByRole("list");
    expect(list).toHaveClass(
      "overflow-x-auto",
      "snap-x",
      "snap-mandatory",
      "scroll-px-afh-lg",
      "min-[1200px]:grid"
    );
    expect(screen.getAllByRole("listitem")[0]).toHaveClass(
      "w-[min(290px,100%)]",
      "snap-start"
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "D’où elles viennent"
    );
  });

  // @req REQ-180
  it("passes English to its evidence actions and standing badges", () => {
    render(
      <OriginsBlock
        language="en"
        title="Where they come from"
        items={[
          {
            name: "Mandé",
            description: "A documented form.",
            evidence,
          },
          {
            name: "Manden",
            description: "Another documented form.",
            standing: "referenced",
          },
        ]}
      />
    );

    expect(screen.getAllByText("Referenced")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /open the source chain/i })
    ).toBeInTheDocument();
  });

  // @req REQ-180
  it("derives evidence anchors from assertion identities rather than list order", () => {
    const secondEvidence: SearchEvidence = {
      ...evidence,
      assertion: {
        ...evidence.assertion,
        id: "second-origin-assertion",
      },
    };
    const items = [
      {
        name: "Mandé",
        description: "A documented form.",
        evidence,
      },
      {
        name: "Manden",
        description: "Another documented form.",
        evidence: secondEvidence,
      },
    ];
    const { rerender } = render(<OriginsBlock title="Origins" items={items} />);

    expect(
      document.getElementById("search-feed-origin-origin-assertion")
    ).toBeInTheDocument();
    expect(
      document.getElementById("search-feed-origin-second-origin-assertion")
    ).toBeInTheDocument();

    rerender(<OriginsBlock title="Origins" items={[...items].reverse()} />);

    expect(
      document.getElementById("search-feed-origin-origin-assertion")
    ).toBeInTheDocument();
    expect(
      document.getElementById("search-feed-origin-second-origin-assertion")
    ).toBeInTheDocument();
  });
});
