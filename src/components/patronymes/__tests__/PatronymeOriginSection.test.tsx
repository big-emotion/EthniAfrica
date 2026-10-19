import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeOriginSection } from "@/components/patronymes/PatronymeOriginSection";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";

const base: PublicPatronyme = {
  id: "PAT_KEITA",
  nameMain: "Keïta",
  nameSystem: "totemic_clan",
  casteOrSocialFunction: null,
  content: {},
  associatedPeoples: [],
  associatedCountries: [],
  bearers: [],
  namedBearers: [],
  alliances: [],
};

describe("PatronymeOriginSection (REQ-133)", () => {
  // @req REQ-196
  it("points readers to the sourced name history and keeps the chapter", () => {
    render(<PatronymeOriginSection language="fr" patronyme={base} />);

    expect(
      screen.getByRole("heading", { name: "Origine" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Les récits sur l’origine de ce nom sont présentés dans l’histoire du nom, avec leurs sources."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-196
  it("does not repeat origin accounts or their status in the chapter", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            origin: {
              oralTraditions: [
                {
                  claim:
                    "Un récit oral qui doit rester dans l’histoire du nom.",
                  claimStatus: "contested",
                },
              ],
            },
          },
        }}
      />
    );

    expect(
      screen.queryByText(/Un récit oral qui doit rester/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Contestée")).not.toBeInTheDocument();
  });
});
