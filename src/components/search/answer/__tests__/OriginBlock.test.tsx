import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OriginBlock } from "@/components/search/answer/OriginBlock";
import { answerOf } from "@/components/search/answer/__tests__/fixtures";

const originOf = (name: Parameters<typeof answerOf>[0]) => {
  const answer = answerOf(name);
  return { origin: answer.origin!, kind: answer.kind, title: answer.title };
};

// @req REQ-178
describe("OriginBlock", () => {
  it("cuts a single undisputed account at three sentences behind « Lire la suite »", () => {
    const account = originOf("bantou").origin.accounts[0];
    render(
      <OriginBlock
        origin={{
          debated: false,
          accounts: [{ ...account, text: `${account.text} Quatrième phrase.` }],
        }}
        kind="languageFamily"
        title="Bantou"
      />
    );
    const text = screen.getByText(/Wilhelm Bleek/).textContent ?? "";
    expect(text).toContain("Autrement dit");
    expect(text).not.toContain("Quatrième");

    fireEvent.click(screen.getByRole("button", { name: "Lire la suite" }));
    expect(screen.getByText(/Quatrième phrase/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réduire" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  // @req REQ-178
  it("shows no control when the account is already short", () => {
    render(<OriginBlock {...originOf("bassa")} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  // @req REQ-178
  it("shows the first sentence of every reading, none above another, when the origin is debated", () => {
    render(<OriginBlock {...originOf("lingala")} />);
    expect(
      screen.getByText(
        "L'origine du nom Lingala n'est pas établie. Deux explications circulent :"
      )
    ).toBeInTheDocument();
    const cards = document.querySelectorAll("[data-account]");
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain("Bangala Station");
    expect(cards[1].textContent).toContain("un nom bobangi");
    expect(
      screen.getByText("Les sources ne les départagent pas.")
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("keeps each reading's own contestation behind the control, never cutting one reading alone", () => {
    const debated = {
      debated: true,
      accounts: [
        { text: "Première lecture. Sa contestation suit.", evidence: [] },
        { text: "Seconde lecture. Sa suite.", evidence: [] },
      ],
    };
    render(<OriginBlock origin={debated} kind="language" title="Test" />);
    const cards = document.querySelectorAll("[data-account]");
    expect(cards[0].textContent).toBe("Première lecture.");
    expect(cards[1].textContent).toBe("Seconde lecture.");

    fireEvent.click(screen.getByRole("button", { name: "Lire la suite" }));
    expect(cards[0].textContent).toBe(
      "Première lecture. Sa contestation suit."
    );
    expect(cards[1].textContent).toBe("Seconde lecture. Sa suite.");
  });

  // @req REQ-178
  it("labels each of several accounts by the kind of source it comes from", () => {
    render(<OriginBlock {...originOf("camara")} />);
    expect(
      screen.getByText(
        "Plusieurs récits proposent une origine pour ce nom. Les sources consultées ne permettent pas de choisir entre eux."
      )
    ).toBeInTheDocument();
    expect(document.querySelectorAll("[data-account]")).toHaveLength(3);
    expect(
      screen.getAllByText("Récit transmis de bouche à oreille")
    ).toHaveLength(2);
    expect(screen.getByText("Source écrite")).toBeInTheDocument();
  });

  // @req REQ-178
  it("calls a word's origin a word's", () => {
    render(<OriginBlock {...originOf("pharaon")} />);
    expect(
      screen.getByRole("heading", { name: "D'où vient le mot" })
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("renders nothing without an account", () => {
    const { container } = render(
      <OriginBlock
        origin={{ accounts: [], debated: false }}
        kind="people"
        title="x"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
