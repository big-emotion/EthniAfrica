import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeHomonymsSection } from "@/components/patronymes/PatronymeHomonymsSection";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";

const base: PublicPatronyme = {
  id: "PAT_TRAORE",
  nameMain: "Traore",
  nameSystem: "clan_name",
  casteOrSocialFunction: null,
  content: {},
  associatedPeoples: [],
  associatedCountries: [],
  bearers: [],
  namedBearers: [],
  alliances: [],
};

describe("PatronymeHomonymsSection (REQ-133)", () => {
  // @req REQ-133
  it("keeps homonyms with the same label as separate, distinct entries", () => {
    render(
      <PatronymeHomonymsSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            homonyms: [
              {
                label: "Bambara",
                entityType: "peuple",
                distinction: "un peuple",
              },
              {
                label: "Bambara",
                entityType: "langue",
                distinction: "une langue",
              },
            ],
          },
        }}
      />
    );

    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Bambara (peuple) — un peuple");
    expect(items[1]).toHaveTextContent("Bambara (langue) — une langue");
  });

  // @req REQ-133
  it("omits a homonyms chapter declared as a gap", () => {
    render(
      <PatronymeHomonymsSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            homonyms: [],
            gaps: [
              {
                fieldPath: "homonyms",
                reason: "Aucun homonyme n'est documenté pour ce nom.",
              },
            ],
          },
        }}
      />
    );

    expect(screen.queryByText("Homonymes")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Aucun homonyme n'est documenté pour ce nom.")
    ).not.toBeInTheDocument();
  });
});
