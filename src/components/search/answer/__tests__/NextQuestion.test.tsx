import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NextQuestion } from "@/components/search/answer/NextQuestion";

// @req REQ-178
describe("NextQuestion", () => {
  it("shows the question the fiche wrote", () => {
    render(
      <NextQuestion
        kind="language"
        next={{
          question:
            "Comment une langue de marché est-elle devenue celle de deux capitales ?",
        }}
      />
    );
    expect(screen.getByText("Et maintenant")).toBeInTheDocument();
    expect(
      screen.getByText(/Comment une langue de marché/)
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("is a link only when it leads somewhere", () => {
    const { rerender } = render(
      <NextQuestion kind="people" next={{ question: "Pourquoi ?" }} />
    );
    expect(screen.queryByRole("link")).toBeNull();
    rerender(
      <NextQuestion
        kind="people"
        next={{ question: "Pourquoi ?" }}
        href="#next"
      />
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "#next");
  });

  // @req REQ-178
  it("writes the fallback question from the template parameters", () => {
    render(
      <NextQuestion
        kind="country"
        next={{ template: "formerName", params: { formerName: "Tand Kust" } }}
      />
    );
    expect(
      screen.getByText(
        "Qui a donné le nom « Tand Kust », et pourquoi a-t-il changé ?"
      )
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("draws nothing rather than a question with a hole in it", () => {
    const { container } = render(
      <NextQuestion
        kind="people"
        next={{ template: "migration", params: { from: "Sénégal" } }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  // @req REQ-178
  it("speaks English", () => {
    render(
      <NextQuestion
        kind="people"
        language="en"
        next={{ template: "distributionGap", params: { countryCount: 7 } }}
      />
    );
    expect(screen.getByText("And now")).toBeInTheDocument();
    expect(
      screen.getByText("Why is this name found in 7 countries?")
    ).toBeInTheDocument();
  });
});
