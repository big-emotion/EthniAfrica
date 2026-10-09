import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NamesBlock } from "@/components/search/answer/NamesBlock";
import { answerOf } from "@/components/search/answer/__tests__/fixtures";

// @req REQ-178
describe("NamesBlock", () => {
  // Operator decision 2026-10-08: where the reader searched, the form they
  // typed comes first and the name the people gives itself right after it.
  // @req REQ-178
  it("lists the searched form first, then the name a people gives itself, then the others", () => {
    render(<NamesBlock answer={answerOf("peul")} searchedForm="peul" />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Peul");
    expect(items[0]).toHaveTextContent("votre recherche");
    expect(items[0]).toHaveTextContent("La forme française, venue du wolof.");
    expect(items[1]).toHaveTextContent("Fulɓe · Pullo");
    expect(items[1]).toHaveTextContent("leur propre nom");
    expect(items[2]).toHaveTextContent("Fulani");
    expect(screen.getAllByText("votre recherche")).toHaveLength(1);
  });

  // @req REQ-178
  it("keeps the fiche's order, self-given name first, when nothing was searched", () => {
    render(<NamesBlock answer={answerOf("peul")} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Fulɓe · Pullo");
    expect(items[1]).toHaveTextContent("Peul");
  });

  // A button centres its own text by default: wrapped on two lines at 430 px
  // the control read centred while the same one at 1280 px read left.
  // @req REQ-178
  it("keeps the « more names » control on the block's left edge", () => {
    render(<NamesBlock answer={answerOf("peul")} searchedForm="peul" />);

    expect(
      screen.getByRole("button", { name: /\+ 4 autres noms/ })
    ).toHaveClass("text-left");
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
      screen.getByRole("heading", { name: "Ses différentes orthographes" })
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
  // @req REQ-178
  it("groups the dated names of several countries under one heading", () => {
    const republic = answerOf("congo", 0);
    const democratic = answerOf("congo", 1);
    const { container } = render(
      <NamesBlock
        answer={republic}
        groups={[
          { label: "Congo", names: republic.names },
          { label: "RD Congo", names: democratic.names },
        ]}
      />
    );
    expect(container.querySelectorAll("h2")).toHaveLength(1);
    expect(
      Array.from(container.querySelectorAll("h3")).map((h) => h.textContent)
    ).toEqual(["Congo", "RD Congo"]);
    expect(screen.getByText("Zaïre")).toBeInTheDocument();
    expect(screen.getByText("Congo français")).toBeInTheDocument();
  });

  // @req REQ-178
  it("draws a sentence filed as a name as plain text, not as a box", () => {
    const long =
      "Aucun nom propre : « bantou » est un mot forgé par un linguiste à partir de aba-ntu";
    render(
      <NamesBlock
        answer={{
          ...answerOf("peul"),
          kind: "languageFamily",
          names: [{ form: long, selfGiven: null }],
        }}
      />
    );
    const item = screen.getByText(long).closest("li");
    expect(item?.className).not.toMatch(/border|rounded|bg-/);
  });
});
