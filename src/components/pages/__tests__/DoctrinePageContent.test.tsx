import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DoctrinePageContent from "../DoctrinePageContent";

const followsInDocument = (earlier: Element, later: Element): boolean =>
  Boolean(
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING
  );

/**
 * The four refused sentences moved from the About page to the method page on
 * 22 September 2026: they are method — what we do not write and why — not a
 * presentation of the project. They sit right after « Expliquer sans classer
 * les populations », whose rule they illustrate. A refused sentence printed
 * without its reason reads as a taboo, so each keeps its reason.
 */
describe("DoctrinePageContent — the refused sentences", () => {
  // @req REQ-141
  it("lists the four refused sentences, each with its reason, right after the no-ranking section", () => {
    render(<DoctrinePageContent language="fr" />);

    const noRanking = screen.getByRole("heading", {
      level: 2,
      name: "Expliquer sans classer les populations",
    });
    const refusalsHeading = screen.getByRole("heading", {
      level: 2,
      name: "Quatre phrases que nous n’écrivons pas",
    });
    const nextSection = screen.getByRole("heading", {
      level: 2,
      name: "Une présentation à la mesure des sources",
    });
    expect(followsInDocument(noRanking, refusalsHeading)).toBe(true);
    expect(followsInDocument(refusalsHeading, nextSection)).toBe(true);

    const refusals = screen.getByTestId("doctrine-refusals");
    const items = within(refusals).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(refusals).toHaveTextContent(
      /Avant, on vivait en accord avec le continent/
    );
    expect(refusals).toHaveTextContent(/Les frontières sont arbitraires/);
    expect(refusals).toHaveTextContent(/Renouer avec le passé/);
    expect(refusals).toHaveTextContent(
      /Avant les frontières, les peuples étaient unis/
    );
    for (const item of items) {
      expect(
        item.querySelector('[data-role="reason"]')?.textContent?.trim()
      ).toBeTruthy();
    }
  });

  // @req REQ-145
  it("carries the refused sentences in English too", () => {
    render(<DoctrinePageContent language="en" />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Four sentences we do not write",
      })
    ).toBeInTheDocument();
    const refusals = screen.getByTestId("doctrine-refusals");
    expect(within(refusals).getAllByRole("listitem")).toHaveLength(4);
    expect(refusals).toHaveTextContent(/The borders are arbitrary/);
  });
});
