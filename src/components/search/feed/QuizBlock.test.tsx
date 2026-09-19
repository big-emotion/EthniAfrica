import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuizBlock } from "@/components/search/feed/QuizBlock";
const question = {
  id: "q-1",
  templateId: "T2" as const,
  contentLanguage: "fr" as const,
  prompt: "Quelle forme les locuteurs emploient-ils ?",
  stimulus: null,
  options: ["Mande", "Manden"],
  correctOption: 1,
  explanation: "La source retient Manden.",
  source: { title: "Source", tier: "referenced" as const, url: null },
  assertionId: "a-1",
  entity: {
    type: "people" as const,
    id: "PPL_MANDE",
  },
  match: {
    relation: "linked-people" as const,
    entityType: "people" as const,
    entityId: "PPL_MANDE",
  },
};

// @req REQ-180
describe("QuizBlock", () => {
  it("uses the embedded one-column selection flow", async () => {
    const onValidate = vi.fn();
    render(
      <QuizBlock
        question={question}
        selectedOption={null}
        onSelectOption={vi.fn()}
        onValidate={onValidate}
        language="fr"
        questionCountLabel="12 questions"
        allHref="/fr/jouer"
      />
    );

    expect(
      screen.queryByRole("button", { name: "Valider" })
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("radio")[1]);
    expect(onValidate).toHaveBeenCalledWith(1);
    expect(screen.getByText("Peuple lié")).toHaveAttribute(
      "data-companion-relation",
      "linked-people"
    );
  });

  // @req REQ-180
  it("renders the sourced reveal state without inventing session metadata", () => {
    const onNext = vi.fn();

    render(
      <QuizBlock
        question={question}
        selectedOption={1}
        onSelectOption={vi.fn()}
        onValidate={vi.fn()}
        language="fr"
        questionCountLabel="12 questions"
        allHref="/fr/jouer"
        result={{ isCorrect: true, isLastQuestion: false, onNext }}
      />
    );

    expect(screen.getByText("La source retient Manden.")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Question suivante" })
    ).toBeEnabled();
  });
});
