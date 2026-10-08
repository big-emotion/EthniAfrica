import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ANSWER_LABELS,
  answerOf,
} from "@/components/search/answer/__tests__/fixtures";
import {
  CountriesAnswer,
  type CountriesAnswerEntry,
} from "@/components/search/feed/CountriesAnswer";

const republic = answerOf("congo", 0);
const democratic = answerOf("congo", 1);

// What the fiches list, by name: the page never prints a people's identifier.
const listedPeoples = Object.entries(ANSWER_LABELS).map(([id, name]) => ({
  id,
  name,
}));

function renderCongo(
  entries: CountriesAnswerEntry[] = [
    { answer: republic, listedPeoples },
    { answer: democratic, listedPeoples },
  ]
) {
  return render(<CountriesAnswer entries={entries} title="Congo" />);
}

const blocks = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-feed-block]")).map((node) =>
    node.getAttribute("data-feed-block")
  );

// @req REQ-178
describe("CountriesAnswer", () => {
  it("tells two countries that carry a name as one answer, in the six-block order", () => {
    const { container } = renderCongo();
    expect(blocks(container)).toEqual([
      "answer-what",
      "answer-origin",
      "answer-names",
      "answer-where",
      "answer-next",
      "answer-sources",
    ]);
  });

  // @req REQ-178
  it("titles the page with the searched name and says how many States bear it", () => {
    const { container } = renderCongo();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")).toHaveTextContent("Congo");
    expect(container).toHaveTextContent("Deux pays");
    expect(container).toHaveTextContent(
      "Deux États portent ce nom : Congo et RD Congo."
    );
  });

  // @req REQ-178
  it("says a shared origin once, and keeps each country's names and shares under its own name", () => {
    const { container } = renderCongo();
    expect(
      container.querySelectorAll('[data-feed-block="answer-origin"]')
    ).toHaveLength(1);
    const subheadings = Array.from(container.querySelectorAll("h3")).map(
      (node) => node.textContent
    );
    expect(subheadings).toEqual(["Congo", "RD Congo", "Congo", "RD Congo"]);
  });

  // @req REQ-178
  it("keeps both readings when the countries tell different origins", () => {
    const other = {
      ...democratic,
      origin: {
        debated: false,
        accounts: [
          { ...democratic.origin!.accounts[0], text: "Un autre récit." },
        ],
      },
    };
    const { container } = renderCongo([
      { answer: republic },
      { answer: other },
    ]);
    const origin = container.querySelector('[data-feed-block="answer-origin"]');
    expect(origin).toHaveTextContent("Le nom vient du royaume Kongo");
    expect(origin).toHaveTextContent("Un autre récit.");
    // Two countries' own readings are not two rival explanations of one name.
    expect(origin).not.toHaveTextContent("n'est pas établie");
    expect(origin).toHaveTextContent("RD Congo");
  });

  // @req REQ-178
  it("takes the follow-up a fiche wrote, and never lets a template speak for two countries", () => {
    const { container } = renderCongo();
    const next = container.querySelector('[data-feed-block="answer-next"]');
    expect(next).toHaveTextContent("Un royaume, trois pays");

    const templated = renderCongo([
      { answer: { ...republic, next: democratic.next }, listedPeoples },
      { answer: democratic, listedPeoples },
    ]);
    expect(blocks(templated.container)).not.toContain("answer-next");
  });
});
