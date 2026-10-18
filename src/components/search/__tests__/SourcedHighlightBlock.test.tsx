import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SourcedHighlightBlock } from "../SourcedHighlightBlock";
import type { DidYouKnowFact } from "@/lib/home/didYouKnowFacts";
import type { SearchResult } from "@/types/afrik-frontend";

const zuluResult: SearchResult = {
  type: "people",
  id: "PPL_ZULU",
  name: "Zoulou",
};

const facts: DidYouKnowFact[] = [
  {
    id: "bantou",
    headline:
      "« Bantou » n'est pas un peuple : c'est une catégorie forgée par un philologue au milieu du XIXe siècle.",
    body: ["…"],
    entities: [
      { kind: "family", id: "FLG_BANTU", label: "Langues bantoues" },
      { kind: "people", id: "PPL_ZULU", label: "Zoulou" },
    ],
    tier: "referenced",
  },
];

describe("SourcedHighlightBlock", () => {
  // A fact is shown without a tier word (doctrine §1.1).
  // @req REQ-124 REQ-092
  it("shows the one fact matching the pivot, without its tier", () => {
    render(<SourcedHighlightBlock result={zuluResult} facts={facts} />);

    const block = screen.getByTestId("sourced-highlight-block");
    expect(block).toHaveTextContent(/philologue au milieu du XIXe siècle/);
    expect(block).not.toHaveTextContent(
      /Source (référencée|officielle|non vérifiée)/
    );
  });

  // No figure of style in a label (operator, 2026-10-17): the aside says
  // what it is rather than asking the reader a rhetorical question.
  // @req REQ-124
  it("labels the fact plainly, without a rhetorical question", () => {
    render(<SourcedHighlightBlock result={zuluResult} facts={facts} />);

    const block = screen.getByTestId("sourced-highlight-block");
    expect(block).toHaveTextContent(/^À savoir/);
    expect(block).not.toHaveTextContent(/saviez-vous/i);
  });

  // @req REQ-124
  it("renders nothing when the bank has no fact about this pivot", () => {
    const { container } = render(
      <SourcedHighlightBlock
        result={{ type: "people", id: "PPL_UNKNOWN", name: "Inconnu" }}
        facts={facts}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
