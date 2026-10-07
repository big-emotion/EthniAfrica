import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NamesBlock } from "@/components/search/answer/NamesBlock";
import { answerOf } from "@/components/search/answer/__tests__/fixtures";

// @req REQ-178
describe("NamesBlock", () => {
  it("lists a people's names with the one it gives itself first, and marks the searched form without promoting it", () => {
    render(<NamesBlock answer={answerOf("peul")} searchedForm="peul" />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Fulɓe · Pullo");
    expect(items[0]).toHaveTextContent("leur propre nom");
    expect(items[1]).toHaveTextContent("Peul");
    expect(items[1]).toHaveTextContent("votre recherche");
    expect(items[1]).toHaveTextContent("La forme française, venue du wolof.");
    // Marked, not reordered: the searched form stays second.
    expect(screen.getAllByText("votre recherche")).toHaveLength(1);
  });

  // @req REQ-178
  it("matches the searched form without regard to case or accents", () => {
    render(<NamesBlock answer={answerOf("peul")} searchedForm="PULLO" />);
    expect(screen.getByText("votre recherche").closest("li")).toHaveTextContent(
      "Fulɓe · Pullo"
    );
  });

  // @req REQ-178
  it("keeps four names visible and the rest behind one control", () => {
    render(<NamesBlock answer={answerOf("peul")} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    const more = screen.getByRole("button", { name: /\+ 4 autres noms/ });
    fireEvent.click(more);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Réduire" })).toBeInTheDocument();
  });

  // @req REQ-178
  it("draws plain forms as pills and appends the language of a form", () => {
    render(<NamesBlock answer={answerOf("bantou")} />);
    expect(screen.getByText("abantu").closest("li")).toHaveTextContent(
      "abantu · zoulou"
    );
  });

  // @req REQ-178
  it("draws a country's former names in time, a form without dates as « usage »", () => {
    render(<NamesBlock answer={answerOf("congo", 0)} groupLabel="Congo" />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Ses noms dans le temps" })
    ).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("1880-1960");
    expect(rows[0]).toHaveTextContent("Congo français");
    expect(rows[1]).toHaveTextContent("usage");
  });

  // @req REQ-178
  it("calls a patronyme's forms spellings", () => {
    render(<NamesBlock answer={answerOf("camara")} searchedForm="camara" />);
    expect(
      screen.getByRole("heading", { name: "Ses graphies" })
    ).toBeInTheDocument();
    expect(screen.getByText("Kamana").closest("li")).toHaveTextContent(
      "Kamana · vaï"
    );
  });

  // @req REQ-178
  it("draws a word's journey as steps, language first", () => {
    render(<NamesBlock answer={answerOf("pharaon")} />);
    const first = screen.getAllByRole("listitem")[0];
    expect(within(first).getByText("égyptien")).toBeInTheDocument();
    expect(within(first).getByText("per-aa")).toBeInTheDocument();
  });

  // @req REQ-178
  it("renders nothing when the fiche holds no form", () => {
    const { container } = render(
      <NamesBlock answer={{ ...answerOf("peul"), names: [] }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
