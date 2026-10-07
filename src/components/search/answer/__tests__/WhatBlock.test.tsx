import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhatBlock } from "@/components/search/answer/WhatBlock";
import { answerOf } from "@/components/search/answer/__tests__/fixtures";

// @req REQ-178
describe("WhatBlock", () => {
  it("shows the kind, the name and the sentence the fiche wrote", () => {
    render(<WhatBlock answer={answerOf("lingala")} />);
    expect(screen.getByText("Une langue")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Lingala" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/née du commerce sur le fleuve Congo/)
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("falls back to a template built only from the facts it has", () => {
    const people = { ...answerOf("nzebi"), what: { facts: {} } };
    const { container, rerender } = render(<WhatBlock answer={people} />);
    // No lead and no fact: nothing is invented.
    expect(container.querySelectorAll("p")).toHaveLength(0);

    rerender(
      <WhatBlock
        answer={{
          ...people,
          what: { facts: { population: 40_000_000, countryCount: 12 } },
        }}
      />
    );
    expect(container.querySelector("p")?.textContent).toBe(
      "Un peuple d'environ 40 millions de personnes, présent dans 12 pays."
    );
  });

  // @req REQ-178
  it("says how many subjects answer to the name and demotes the heading", () => {
    render(
      <WhatBlock
        answer={answerOf("congo", 0)}
        subjectCount={2}
        headingLevel="h2"
      />
    );
    expect(screen.getByText("Deux pays")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  // @req REQ-178
  it("speaks English when asked", () => {
    render(<WhatBlock answer={answerOf("lingala")} language="en" />);
    expect(screen.getByText("A language")).toBeInTheDocument();
  });
});
