import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  NameAnswerEntries,
  ReviewedOrigin,
} from "@/components/search/feed/NameAnswerEntries";
import type { SearchEvidence } from "@/lib/search/evidence";
import type { NameAnswer } from "@/lib/search/nameAnswer";

const evidence = (statement: string, ...ids: string[]): SearchEvidence => ({
  assertion: { statement, sourceCount: ids.length, lastHumanAuditAt: null },
  sources: ids.map((id) => ({ id, title: `Source ${id}`, tier: "referenced" })),
  standing: "referenced",
});

const answer: NameAnswer = {
  term: "Pygmée",
  subjects: [{ type: "people", id: "PPL_TWA" }],
  paragraphs: ["« Pygmée » n'est pas un nom que ces peuples se donnent."],
  uncertainty: "L'origine du mot n'est pas établie.",
  sources: [evidence("première phrase", "a", "b"), evidence("seconde", "b")],
};

describe("a reviewed answer", () => {
  // The badge « Référencée · voir les sources » after every sentence is what the
  // page used to repeat; one line says what the answer rests on.
  // @req REQ-178
  it("closes on one sources line, not a badge per sentence", () => {
    render(
      <NameAnswerEntries
        language="fr"
        entries={[
          {
            answer,
            subjects: [
              { type: "people", id: "PPL_TWA", name: "Twa", exactMatch: true },
            ],
          },
        ]}
      />
    );

    expect(
      screen.getAllByRole("button", { name: "Voir les sources" })
    ).toHaveLength(1);
    expect(screen.getByText(/s'appuient sur/)).toHaveTextContent("2 sources");
    expect(screen.queryByText("première phrase")).toBeNull();
  });

  // @req REQ-178
  it("draws no sources line for an answer that cites nothing", () => {
    render(
      <NameAnswerEntries
        language="fr"
        entries={[{ answer: { ...answer, sources: [] }, subjects: [] }]}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Voir les sources" })
    ).toBeNull();
  });
});

describe("ReviewedOrigin", () => {
  // Reviewed text prevails over the automatic display and is never cut: its
  // last sentence is often the one that carries the uncertainty.
  // @req REQ-178
  it("shows the whole reviewed text as the origin block, uncertainty included", () => {
    const { container } = render(
      <ReviewedOrigin answer={answer} kind="people" language="fr" />
    );

    const block = container.querySelector('[data-feed-block="answer-origin"]');
    expect(block).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "D'où vient le nom"
    );
    expect(screen.getByText(/n'est pas un nom que ces peuples/)).toBeVisible();
    expect(
      screen.getByText("L'origine du mot n'est pas établie.")
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: /Lire la suite/ })).toBeNull();
  });
});
